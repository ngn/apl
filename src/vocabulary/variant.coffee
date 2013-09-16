{assert} = require '../helpers'
{conjunction} = require './vhelpers'

@vocabulary =

  # Variant operator (`⍠`)
  #
  #   ({'monadic'}⍠{'dyadic'}) 0   <=>   'monadic'
  # 0 ({'monadic'}⍠{'dyadic'}) 0   <=>   'dyadic'
  '⍠': conjunction (f, g) ->
    assert typeof f is 'function'
    assert typeof g is 'function'
    (omega, alpha, axis) ->
      (if alpha? then f else g) omega, alpha, axis
