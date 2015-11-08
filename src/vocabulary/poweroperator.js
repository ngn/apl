addVocabulary({
  // ({⍵+1}⍣5) 3 ←→ 8
  // ({⍵+1}⍣0) 3 ←→ 3
  // (⍴⍣3)2 2⍴⍳4 ←→ ,1
  // 'a'(,⍣3)'b' ←→ 'aaab'
  // 1(+÷)⍣=1    ←→ 1.618033988749895
  // c←0 ⋄ 5⍣{c←c+1}0 ⋄ c ←→ 5
  '⍣':conjunction(function(g,f){
    if(f instanceof A&&typeof g==='function'){var h=f;f=g;g=h}else{assert(typeof f==='function')}
    if(typeof g==='function'){
      return function(om,al){
        while(1){
          var om1=f(om,al)
          if(g(om,om1).toBool())return om
          om=om1
        }
      }
    }else{
      var n=g.toInt(0)
      return function(om,al){
        for(var i=0;i<n;i++)om=f(om,al)
        return om
      }
    }
  })
})
