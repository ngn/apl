{assert} = require '../helpers'

# Commute (`⍨`)
#
# Definition:
#     x f⍨ y  <->  y f x
#       f⍨ x  <->  x f x
#
# 17-⍨23 <=> 6
# 7⍴⍨2 3 <=> 2 3⍴7
# +⍨2    <=> 4
# -⍨123  <=> 0
@['⍨'] = (f, g) ->
  assert typeof f is 'function'
  assert not g?
  (omega, alpha, axis) ->
    if alpha then f alpha, omega, axis else f omega, omega, axis
