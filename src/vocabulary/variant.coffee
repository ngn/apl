{assert} = require '../helpers'

# Variant operator (`⍠`)
#
#   ({'monadic'}⍠{'dyadic'}) 0   <=>   'monadic'
# 0 ({'monadic'}⍠{'dyadic'}) 0   <=>   'dyadic'
@['⍠'] = (f, g) ->
  assert typeof f is 'function'
  assert typeof g is 'function'
  (omega, alpha, axis) ->
    (if alpha? then f else g) omega, alpha, axis
