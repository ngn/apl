addVocabulary

  # Variant operator (`⍠`)
  #
  #   ({'monadic'}⍠{'dyadic'}) 0   ←→   'monadic'
  # 0 ({'monadic'}⍠{'dyadic'}) 0   ←→   'dyadic'
  '⍠': conjunction (f, g) ->
    assert typeof f is 'function'
    assert typeof g is 'function'
    (⍵, ⍺, axis) ->
      (if ⍺? then f else g) ⍵, ⍺, axis
