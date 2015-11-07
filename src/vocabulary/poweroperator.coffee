addVocabulary
  # ({⍵+1}⍣5) 3 ←→ 8
  # ({⍵+1}⍣0) 3 ←→ 3
  # (⍴⍣3)2 2⍴⍳4 ←→ ,1
  # 'a'(,⍣3)'b' ←→ 'aaab'
  # 1(+÷)⍣=1    ←→ 1.618033988749895
  # c←0 ⋄ 5⍣{c←c+1}0 ⋄ c ←→ 5
  '⍣': conjunction (g, f) ->
    if f instanceof A and typeof g is 'function'
      h = f; f = g; g = h
    else
      assert typeof f is 'function'

    if typeof g is 'function'
      (om, al) -> # "power limit" operator
        loop
          omega1 = f om, al
          if g(om, omega1).toBool() then return om
          om = omega1
    else
      n = g.toInt 0
      (om, al) ->
        for [0...n] then om = f om, al
        om
