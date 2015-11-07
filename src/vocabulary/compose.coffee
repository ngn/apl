addVocabulary

  # (÷∘-)2     ←→ ¯0.5
  # 8(÷∘-)2    ←→ ¯4
  # ÷∘-2       ←→ ¯0.5
  # 8÷∘-2      ←→ ¯4
  # ⍴∘⍴2 3⍴⍳6  ←→ ,2
  # 3⍴∘⍴2 3⍴⍳6 ←→ 2 3 2
  # 3∘-1       ←→ 2
  # (-∘2)9     ←→ 7
  '∘': conjunction (g, f) ->
    if typeof f is 'function'
      if typeof g is 'function'
        (om, al) -> # f∘g
          f (g om), al
      else
        (om, al) -> # f∘B
          assert !al?
          f g, om
    else
      assert typeof g is 'function'
      (om, al) -> # A∘g
        assert !al?
        g om, f
