addVocabulary

  # Composition operator (`∘`)
  #
  # (÷∘-)2     <=> ¯0.5
  # 8(÷∘-)2    <=> ¯4
  # ÷∘-2       <=> ¯0.5
  # 8÷∘-2      <=> ¯4
  # ⍴∘⍴2 3⍴⍳6  <=> ,2
  # 3⍴∘⍴2 3⍴⍳6 <=> 2 3 2
  # 3∘-1       <=> 2
  # (-∘2)9     <=> 7
  '∘': conjunction (g, f) ->
    if typeof f is 'function'
      if typeof g is 'function'
        (⍵, ⍺) -> # f∘g
          f (g ⍵), ⍺
      else
        (⍵, ⍺) -> # f∘B
          assert not ⍺?
          f g, ⍵
    else
      assert typeof g is 'function'
      (⍵, ⍺) -> # A∘g
        assert not ⍺?
        g ⍵, f
