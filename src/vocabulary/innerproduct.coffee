{reduce} = require './slash'

# Inner product (`.`)
#
# todo: the general formula for higher dimensions is
# `A f.g B   <=>   f/¨ (⊂[⍴⍴A]A)∘.g ⊂[1]B`
#
#     (1 3 5 7) +.= 2 3 6 7   ⍝ returns 2
#     (1 3 5 7) ∧.= 2 3 6 7   ⍝ returns 0
#     (1 3 5 7) ∧.= 1 3 5 7   ⍝ returns 1
@['.'] = (g, f) ->
  F = reduce f
  (omega, alpha) ->
    if alpha.shape.length > 1 or omega.shape.length > 1
      throw Error 'Inner product (.) is implemented only for arrays of rank no more than 1.'
    F g omega, alpha
