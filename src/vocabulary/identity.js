addVocabulary({
  // f←{⍺+2×⍵} ⋄ f/⍬           !!! DOMAIN ERROR
  // f←{⍺+2×⍵} ⋄ (f⍁123)/⍬     ←→ 123
  // f←{⍺+2×⍵} ⋄ (456⍁f)/⍬     ←→ 456
  // f←{⍺+2×⍵} ⋄ g←f⍁789 ⋄ f/⍬ !!! DOMAIN ERROR
  // {}⍁1 2                    !!! RANK ERROR
  // ({}⍁(1 1 1⍴123))/⍬        ←→ 123
  '⍁':conjunction(function(f,x){
    if(f instanceof A){var h=f;f=x;x=h}
    assert(typeof f==='function')
    assert(x instanceof A)
    x.isSingleton()||rankError()
    if(x.shape.length)x=A.scalar(x.unwrap())
    return withIdentity(x,function(om,al,axis){return f(om,al,axis)})
  })
})
