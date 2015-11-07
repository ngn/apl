addVocabulary
  #  ({'monadic'}⍠{'dyadic'})0 ←→ 'monadic'
  # 0({'monadic'}⍠{'dyadic'})0 ←→ 'dyadic'
  '⍠': conjunction (f, g) ->
    assert typeof f is 'function'
    assert typeof g is 'function'
    (om, al, axis) ->
      (if al? then f else g) om, al, axis
