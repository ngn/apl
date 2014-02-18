addVocabulary

  # Identity operator (`⍁`)
  #
  # f←{⍺+2×⍵} ⋄ f/⍬           !!! DOMAIN ERROR
  # f←{⍺+2×⍵} ⋄ (f⍁123)/⍬     ←→ 123
  # f←{⍺+2×⍵} ⋄ (456⍁f)/⍬     ←→ 456
  # f←{⍺+2×⍵} ⋄ g←f⍁789 ⋄ f/⍬ !!! DOMAIN ERROR
  # {}⍁1 2                    !!! RANK ERROR
  # ({}⍁(1 1 1⍴123))/⍬        ←→ 123
  '⍁': conjunction (f, x) ->
    if f instanceof APLArray then [f, x] = [x, f]
    assert typeof f is 'function'
    assert x instanceof APLArray
    if !x.isSingleton() then rankError()
    if ⍴⍴ x then x = APLArray.scalar x.unwrap()
    withIdentity x, (⍵, ⍺, axis) -> f ⍵, ⍺, axis
