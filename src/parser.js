// The parser builds an AST from a list of tokens.
//
// A node in the AST is a JavaScript array whose first item is a character
// indicating the type of node.  The rest of the items represent the content of
// a node.  For instance, "(1 + 2) × 3 4" will produce the tree
//
//   ['B',
//     ['.',
//       ['.',
//         ['N', '1'],
//         ['X', '+'],
//         ['N', '2']],
//       ['X', '×'],
//       ['N', '3'],
//       ['N', '4']]]
//
// Note that right after the parsing stage we don't yet know which symbols
// represent verbs and which represent nouns.  This will be resolved later in
// the compiler.
//
// This parser is a hand-crafted recursive descent parser.  Various parseX()
// functions roughly correspond to the set of non-terminals in an imaginary
// grammar.
//
// Node types:
//
//   Type Description Example
//   ---- ----------- -------
//   'B'  body
//   ':'  guard       a:b
//   'N'  number      1
//   'S'  string      'a'
//   'X'  symbol      a
//   'J'  embedded    «a»
//   '⍬'  empty       ()
//   '{'  lambda      {}
//   '['  index       a[b]
//   '←'  assign      a←b
//   '.'  expr        a b
//
// The compiler replaces '.' nodes with:
//   'V'  vector      1 2
//   'M'  monadic     +1
//   'D'  dyadic      1+2
//   'A'  adverb      +/
//   'C'  conjunction +.×
//   'H'  hook        +÷
//   'F'  fork        +÷⍴
function parse(aplCode,opts){
  opts=opts||{}
  var i=0,tokens=tokenize(aplCode),token=tokens[i++] // single-token lookahead

  // consume(tt) consumes the upcoming token and returns a truthy value only
  // if its type matches any character in tt.
  function consume(tt){if(tt.includes(token.type))return token=tokens[i++]}

  // demand() is like consume() but intolerant to a mismatch.
  function demand(tt){
    token.type===tt?(token=tokens[i++]):parserError('Expected token of type '+tt+' but got '+token.type)
  }

  function parserError(x){syntaxError(x,{file:opts.file,offset:token.offset,aplCode:aplCode})}

  function parseBody(){
    var body=['B']
    while(1){
      if('$};'.includes(token.type))return body
      while(consume('⋄L')){}
      if('$};'.includes(token.type))return body
      var expr=parseExpr()
      if(consume(':'))expr=[':',expr,parseExpr()]
      body.push(expr)
    }
  }

  function parseExpr(){
    var expr=['.'],item
    while(1){
      var token0=token
      if(consume('NSXJ')){
        item=[token0.type,token0.value]
      }else if(consume('(')){
        if(consume(')')){item=['⍬']}else{item=parseExpr();demand(')')}
      }else if(consume('{')){
        item=['{',parseBody()]
        while(consume(';'))item.push(parseBody())
        demand('}')
      }else{
        parserError('Encountered unexpected token of type '+token.type)
      }
      if(consume('[')){
        item=['[',item]
        while(1){
          if(consume(';')){item.push(null)}
          else if(token.type===']'){item.push(null);break}
          else{item.push(parseExpr());if(token.type===']'){break}else{demand(';')}}
        }
        demand(']')
      }
      if(consume('←'))return expr.concat([['←',item,parseExpr()]])
      expr.push(item)
      if(')]}:;⋄L$'.includes(token.type))return expr
    }
  }

  // 'hello'} !!! SYNTAX ERROR
  var r=parseBody();demand('$');return r
}
