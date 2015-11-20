addVocabulary({
  //  ({'monadic'}⍠{'dyadic'})0 ←→ 'monadic'
  // 0({'monadic'}⍠{'dyadic'})0 ←→ 'dyadic'
  '⍠':conjunction(function(f,g){
    assert(typeof f==='function')
    assert(typeof g==='function')
    return function(om,al,axis){return(al?f:g)(om,al,axis)}
  })
})
