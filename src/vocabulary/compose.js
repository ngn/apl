addVocabulary({
  // (÷∘-)2     ←→ ¯0.5
  // 8(÷∘-)2    ←→ ¯4
  // ÷∘-2       ←→ ¯0.5
  // 8÷∘-2      ←→ ¯4
  // ⍴∘⍴2 3⍴⍳6  ←→ ,2
  // 3⍴∘⍴2 3⍴⍳6 ←→ 2 3 2
  // 3∘-1       ←→ 2
  // (-∘2)9     ←→ 7
  '∘':conjunction(function(g,f){
    if(typeof f==='function'){
      if(typeof g==='function'){
        return function(om,al){return f(g(om),al)} // f∘g
      }else{
        return function(om,al){al==null||syntaxError('The function does not take a left argument');return f(g,om)} // f∘B
      }
    }else{
      assert(typeof g==='function')
      return function(om,al){al==null||syntaxError('The function does not take a left argument');return g(om,f)} // A∘g
    }
  })
})
