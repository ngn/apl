var NOUN=1,VERB=2,ADVERB=3,CONJUNCTION=4
function exec(aplCode,o){
  o=o||{}
  var ast=parse(aplCode,o),code=compileAST(ast,o),env=[prelude.env[0].slice(0)]
  for(var k in ast.vars)env[0][ast.vars[k].slot]=o.ctx[k]
  var r=vm({code:code,env:env})
  for(var k in ast.vars){
    var v=ast.vars[k],x=o.ctx[k]=env[0][v.slot]
    if(v.category===ADVERB)x.isAdverb=1
    if(v.category===CONJUNCTION)x.isConjunction=1
  }
  return r
}
function repr(x){
  return x===null||['string','number','boolean'].indexOf(typeof x)>=0?JSON.stringify(x):
         x instanceof Array?'['+x.map(repr).join(',')+']':
         x.repr?x.repr():
         '{'+Object.keys(x).map(function(k){return repr(k)+':'+repr(x[k])}).join(',')+'}'
}
function compileAST(ast,o){
  o=o||{}
  ast.scopeDepth=0
  ast.nSlots=prelude.nSlots
  ast.vars=Object.create(prelude.vars)
  o.ctx=o.ctx||Object.create(vocabulary)
  for(var key in o.ctx)if(!ast.vars[key]){
    var value=o.ctx[key]
    var varInfo=ast.vars[key]={category:NOUN,slot:ast.nSlots++,scopeDepth:ast.scopeDepth}
    if(typeof value==='function'||value instanceof Proc){
      varInfo.category=value.isAdverb?ADVERB:value.isConjunction?CONJUNCTION:VERB
      if(/^[gs]et_.*/.test(key))ast.vars[key.slice(4)]={category:NOUN}
    }
  }
  function err(node,message){syntaxError({message:message,file:o.file,offset:node.offset,aplCode:o.aplCode})}
  assert(VERB<ADVERB&&ADVERB<CONJUNCTION)//we are relying on this ordering below
  function categorizeLambdas(node){
    switch(node[0]){
      case'B':case':':case'←':case'[':case'{':case'.':case'⍬':
        var r=VERB;for(var i=1;i<node.length;i++)if(node[i])r=Math.max(r,categorizeLambdas(node[i]))
        if(node[0]==='{'){node.category=r;return VERB}else{return r}
      case'S':case'N':case'J':return 0
      case'X':var s=node[1];return s==='⍺⍺'||s==='⍶'||s==='∇∇'?ADVERB:s==='⍵⍵'||s==='⍹'?CONJUNCTION:VERB
      default:assert(0)
    }
  }
  categorizeLambdas(ast)
  var queue=[ast] // accumulates"body"nodes we encounter on the way
  while(queue.length){
    var scopeNode=queue.shift(),vars=scopeNode.vars
    function visit(node){
      node.scopeNode=scopeNode
      switch(node[0]){
        case':':var r=visit(node[1]);visit(node[2]);return r
        case'←':return visitLHS(node[1],visit(node[2]))
        case'X':
          var name=node[1],v=vars['get_'+name],r
          if(v&&v.category===VERB){
            return NOUN
          }else{
            // x ⋄ x←0 !!! VALUE ERROR
            return vars[name]&&vars[name].category||
              valueError('Symbol '+name+' is referenced before assignment.',
                {file:o.file,offset:node.offset,aplCode:o.aplCode})
          }
        case'{':
          for(var i=1;i<node.length;i++){
            var d,v
            queue.push(extend(node[i],{
              scopeNode:scopeNode,
              scopeDepth:d=scopeNode.scopeDepth+1+(node.category!==VERB),
              nSlots:4,
              vars:v=extend(Object.create(vars),{
                '⍵':{slot:0,scopeDepth:d,category:NOUN},
                '∇':{slot:1,scopeDepth:d,category:VERB},
                '⍺':{slot:2,scopeDepth:d,category:NOUN},
                // slot 3 is reserved for a "base pointer"
                '⍫':{       scopeDepth:d,category:VERB}
              })
            }))
            if(node.category===CONJUNCTION){
              v['⍵⍵']=v['⍹']={slot:0,scopeDepth:d-1,category:VERB}
              v['∇∇']=       {slot:1,scopeDepth:d-1,category:CONJUNCTION}
              v['⍺⍺']=v['⍶']={slot:2,scopeDepth:d-1,category:VERB}
            }else if(node.category===ADVERB){
              v['⍺⍺']=v['⍶']={slot:0,scopeDepth:d-1,category:VERB}
              v['∇∇']=       {slot:1,scopeDepth:d-1,category:ADVERB}
            }
          }
          return node.category||VERB
        case'S':case'N':case'J':case'⍬':return NOUN
        case'[':
          for(var i=2;i<node.length;i++)if(node[i]&&visit(node[i])!==NOUN)err(node,'Indices must be nouns.')
          return visit(node[1])
        case'.':
          var a=node.slice(1),h=Array(a.length)
          for(var i=a.length-1;i>=0;i--)h[i]=visit(a[i])
          // Form vectors from sequences of data
          var i=0
          while(i<a.length-1){
            if(h[i]===NOUN&&h[i+1]===NOUN){
              var j=i+2;while(j<a.length&&h[j]===NOUN)j++
              a.splice(i,j-i,['V'].concat(a.slice(i,j)))
              h.splice(i,j-i,NOUN)
            }else{
              i++
            }
          }
          // Apply adverbs and conjunctions
          // ⌽¨⍣3⊢(1 2)3(4 5 6) ←→ (2 1)3(6 5 4)
          var i=0
          while(i < a.length){
            if(h[i]===VERB&&i+1<a.length&&h[i+1]===ADVERB){
              a.splice(i,2,['A'].concat(a.slice(i,i+2)))
              h.splice(i,2,VERB)
            }else if((h[i]===NOUN||h[i]===VERB||h[i]===CONJUNCTION)&&i+2<a.length&&h[i+1]===CONJUNCTION&&(h[i+2]===NOUN||h[i+2]===VERB)){
              // allow conjunction-conjunction-something to accommodate ∘.f syntax
              a.splice(i,3,['C'].concat(a.slice(i,i+3)))
              h.splice(i,3,VERB)
            }else{
              i++
            }
          }
          // Hooks
          if(h.length===2&&h[0]!==NOUN&&h[1]!==NOUN){a=[['H'].concat(a)];h=[VERB]}
          // Forks
          if(h.length>=3&&h.length%2&&h.indexOf(NOUN)<0){a=[['F'].concat(a)];h=[VERB]}
          if(h[h.length-1]!==NOUN){
            if(h.length>1)err(a[h.length-1],'Trailing function in expression')
          }else{
            // Apply monadic and dyadic functions
            while(h.length>1){
              if(h.length===2||h[h.length-3]!==NOUN){
                a.splice(-2,9e9,['M'].concat(a.slice(-2)))
                h.splice(-2,9e9,NOUN)
              }else{
                a.splice(-3,9e9,['D'].concat(a.slice(-3)))
                h.splice(-3,9e9,NOUN)
              }
            }
          }
          node.splice(0,9e9,a[0])
          extend(node,a[0])
          return h[0]
      }
      assert(0)
    }
    function visitLHS(node,rhsCategory){
      node.scopeNode=scopeNode
      switch(node[0]){
        case'X':
          var name=node[1];if(name==='∇'||name==='⍫')err(node,'Assignment to '+name+' is not allowed.')
          if(vars[name]){
            if(vars[name].category!==rhsCategory){
              err(node,'Inconsistent usage of symbol '+name+', it is assigned both nouns and verbs.')
            }
          }else{
            vars[name]={scopeDepth:scopeNode.scopeDepth,slot:scopeNode.nSlots++,category:rhsCategory}
          }
          break
        case'.':
          rhsCategory===NOUN||err(node,'Strand assignment can be used only for nouns.')
          for(var i=1;i<node.length;i++)visitLHS(node[i],rhsCategory)
          break
        case'[':
          rhsCategory===NOUN||err(node,'Indexed assignment can be used only for nouns.')
          visitLHS(node[1],rhsCategory);for(var i=2;i<node.length;i++)node[i]&&visit(node[i])
          break
        default:
          err(node,'Invalid LHS node type: '+JSON.stringify(node[0]))
      }
      return rhsCategory
    }
    for(var i=1;i<scopeNode.length;i++)visit(scopeNode[i])
  }
  function render(node){
    switch(node[0]){
      case'B':
        if(node.length===1){
          // {}0 ←→ ⍬
          return[LDC,A.zilde,RET]
        }else{
          var a=[];for(var i=1;i<node.length;i++){a.push.apply(a,render(node[i]));a.push(POP)}
          a[a.length-1]=RET
          return a
        }
      case':':var x=render(node[1]),y=render(node[2]);return x.concat(JEQ,y.length+2,POP,y,RET)
      case'←':
        // A←5     ←→ 5
        // A×A←2 5 ←→ 4 25
        return render(node[2]).concat(renderLHS(node[1]))
      case'X':
        // r←3 ⋄ get_c←{2×○r} ⋄ get_S←{○r*2}
        // ... before←.01×⌊100×r c S
        // ... r←r+1
        // ... after←.01×⌊100×r c S
        // ... before after ←→ (3 18.84 28.27)(4 25.13 50.26)
        // {⍺}0 !!! VALUE ERROR
        // {x}0 ⋄ x←0 !!! VALUE ERROR
        // {⍫1⋄2}⍬ ←→ 1
        // c←{} ⋄ x←{c←⍫⋄1}⍬ ⋄ {x=1:c 2⋄x}⍬ ←→ 2
        var s=node[1],vars=node.scopeNode.vars,v
        return s==='⍫'?[CON]:
               (v=vars['get_'+s])&&v.category===VERB?[LDC,A.zero,GET,v.scopeDepth,v.slot,MON]:
                 [GET, vars[s].scopeDepth, vars[s].slot]
      case'{':
        // {1 + 1} 1                    ←→ 2
        // {⍵=0:1 ⋄ 2×∇⍵-1} 5           ←→ 32 # two to the power of
        // {⍵<2 : 1 ⋄ (∇⍵-1)+(∇⍵-2) } 8 ←→ 34 # Fibonacci sequence
        // ⊂{⍺⍺ ⍺⍺ ⍵}'hello'            ←→ ⊂⊂'hello'
        // ⊂{⍺⍺ ⍵⍵ ⍵}⌽'hello'           ←→ ⊂'olleh'
        // ⊂{⍶⍶⍵}'hello'                ←→ ⊂⊂'hello'
        // ⊂{⍶⍹⍵}⌽'hello'               ←→ ⊂'olleh'
        // +{⍵⍶⍵}10 20 30               ←→ 20 40 60
        // f←{⍵⍶⍵} ⋄ +f 10 20 30        ←→ 20 40 60
        // twice←{⍶⍶⍵} ⋄ *twice 2       ←→ 1618.1779919126539
        // f←{-⍵;⍺×⍵} ⋄ (f 5)(3 f 5)    ←→ ¯5 15
        // f←{;} ⋄ (f 5)(3 f 5)         ←→ ⍬⍬
        // ²←{⍶⍶⍵;⍺⍶⍺⍶⍵} ⋄ *²2          ←→ 1618.1779919126539
        // ²←{⍶⍶⍵;⍺⍶⍺⍶⍵} ⋄ 3*²2         ←→ 19683
        // H←{⍵⍶⍹⍵;⍺⍶⍹⍵} ⋄ +H÷ 2        ←→ 2.5
        // H←{⍵⍶⍹⍵;⍺⍶⍹⍵} ⋄ 7 +H÷ 2      ←→ 7.5
        // {;;}                         !!!
        var x=render(node[1])
        var lx=[LAM,x.length].concat(x)
        if(node.length===2){
          f=lx
        }else if(node.length===3){
          var y=render(node[2]),ly=[LAM,y.length].concat(y),v=node.scopeNode.vars['⍠']
          f=ly.concat(GET,v.scopeDepth,v.slot,lx,DYA)
        }else{
          err(node)
        }
        return node.category===VERB?f:[LAM,f.length+1].concat(f,RET)
      case'S':
        // ⍴''     ←→ ,0
        // ⍴'x'    ←→ ⍬
        // ⍴'xx'   ←→ ,2
        // ⍴'a''b' ←→ ,3
        // ⍴"a""b" ←→ ,3
        // ⍴'a""b' ←→ ,4
        // ⍴'''a'  ←→ ,2
        // ⍴'a'''  ←→ ,2
        // ''''    ←→ "'"
        // ⍴"\f\t\n\r\u1234\xff" ←→ ,18
        // "a      !!!
        var d=node[1][0] // the delimiter: " or '
        var s=node[1].slice(1,-1).replace(RegExp(d+d,'g'),d)
        return[LDC,new A(s,s.length===1?[]:[s.length])]
      case'N':
        // ∞ ←→ ¯
        // ¯∞ ←→ ¯¯
        // ¯∞j¯∞ ←→ ¯¯j¯¯
        // ∞∞ ←→ ¯ ¯
        // ∞¯ ←→ ¯ ¯
        var a=node[1].replace(/[¯∞]/g,'-').split(/j/i).map(function(x){
          return x==='-'?Infinity:x==='--'?-Infinity:x.match(/^-?0x/i)?parseInt(x,16):parseFloat(x)
        })
        var v=a[1]?new Z(a[0],a[1]):a[0]
        return[LDC,new A([v],[])]
      case'J':
        // 123 + «456 + 789» ←→ 1368
        var f=Function('return function(_w,_a){return('+node[1].replace(/^«|»$/g,'')+')}')()
        return[EMB,function(_w,_a){return aplify(f(_w,_a))}]
      case'[':
        // ⍴ x[⍋x←6?40] ←→ ,6
        var v=node.scopeNode.vars._index,axes=[],a=[],c
        for(var i=2;i<node.length;i++)if(c=node[i]){axes.push(i-2);a.push.apply(a,render(c))}
        a.push(VEC,axes.length,LDC,new A(axes),VEC,2,GET,v.scopeDepth,v.slot)
        a.push.apply(a,render(node[1]))
        a.push(DYA)
        return a
      case'V':
        var fragments=[],areAllConst=1
        for(var i=1;i<node.length;i++){
          var f=render(node[i]);fragments.push(f);if(f.length!==2||f[0]!==LDC)areAllConst=0
        }
        return areAllConst?[LDC,new A(fragments.map(function(f){return f[1].isSimple()?f[1].unwrap():f[1]}))]
                         :[].concat.apply([],fragments).concat([VEC,node.length-1])
      case'⍬':return[LDC,A.zilde]
      case'M':return render(node[2]).concat(render(node[1]),MON)
      case'A':return render(node[1]).concat(render(node[2]),MON)
      case'D':case'C':return render(node[3]).concat(render(node[2]),render(node[1]),DYA)
      case'H':
        var v=node.scopeNode.vars._hook
        return render(node[2]).concat(GET,v.scopeDepth,v.slot,render(node[1]),DYA)
      case'F':
        var u=node.scopeNode.vars._hook
        var v=node.scopeNode.vars._fork1
        var w=node.scopeNode.vars._fork2
        var i=node.length-1
        var r=render(node[i--])
        while(i>=2)r=r.concat(GET,v.scopeDepth,v.slot,render(node[i--]),DYA,
                              GET,w.scopeDepth,w.slot,render(node[i--]),DYA)
        return i?r.concat(render(node[1]),GET,u.scopeDepth,u.slot,DYA):r
      default:assert(0)
    }
  }
  function renderLHS(node){
    switch(node[0]){
      case'X':
        var name=node[1],vars=node.scopeNode.vars,v=vars['set_'+name]
        return v&&v.category===VERB?[GET,v.scopeDepth,v.slot,MON]:[SET,vars[name].scopeDepth,vars[name].slot]
      case'.': // strand assignment
        // (a b) ← 1 2 ⋄ a           ←→ 1
        // (a b) ← 1 2 ⋄ b           ←→ 2
        // (a b) ← +                 !!!
        // (a b c) ← 3 4 5 ⋄ a b c   ←→ 3 4 5
        // (a b c) ← 6     ⋄ a b c   ←→ 6 6 6
        // (a b c) ← 7 8   ⋄ a b c   !!!
        // ((a b)c)←3(4 5) ⋄ a b c   ←→ 3 3 (4 5)
        var n=node.length-1,a=[SPL,n]
        for(var i=1;i<node.length;i++){a.push.apply(a,renderLHS(node[i]));a.push(POP)}
        return a
      case'[': // indexed assignment
        var axes=[],a=[],v=node.scopeNode.vars._substitute
        for(var i=2;i<node.length;i++)if(node[i]){axes.push(i-2);a.push.apply(a,render(node[i]))}
        a.push(VEC,axes.length)
        a.push.apply(a,render(node[1]))
        a.push(LDC,new A(axes),VEC,4,GET,v.scopeDepth,v.slot,MON)
        a.push.apply(a,renderLHS(node[1]))
        return a
    }
    assert(0)
  }
  return render(ast)
}
;(function(){
  var env=prelude.env=[[]]
  for(var k in prelude.vars)env[0][prelude.vars[k].slot]=vocabulary[k]
  vm({code:prelude.code,env:env})
  for(var k in prelude.vars)vocabulary[k]=env[0][prelude.vars[k].slot]
}())
function aplify(x){
  if(typeof x==='string')return x.length===1?A.scalar(x):new A(x)
  if(typeof x==='number')return A.scalar(x)
  if(x instanceof Array)return new A(x.map(function(y){y=aplify(y);return y.shape.length?y:y.unwrap()}))
  if(x instanceof A)return x
  aplError('Cannot aplify object:'+x)
}
