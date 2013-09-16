{APLArray} = require '../array'
reduce = require('./slash')['/']
enclose = require('./enclose')['⊂']
outerProduct = require('./outerproduct')['∘.']
each = require('./each')['¨']
{conjunction} = require './vhelpers'

# Inner product (`.`)
#
# For matrices, the inner product behaves like matrix multiplication where +
# and × can be substituted with any verbs.
#
# For higher dimensions, the general formula is:
# `A f.g B   <->   f/¨ (⊂[¯1+⍴⍴A]A) ∘.g ⊂[0]B`
#
# (1 3 5 7) +.= 2 3 6 7 <=> 2
# (1 3 5 7) ∧.= 2 3 6 7 <=> 0
# (1 3 5 7) ∧.= 1 3 5 7 <=> 1
# 7 +.= 8 8 7 7 8 7 5   <=> 3
# 8 8 7 7 8 7 5 +.= 7   <=> 3
# 7 +.= 7               <=> 1
# (3 2⍴5 ¯3 ¯2 4 ¯1 0) +.× 2 2⍴6 ¯3 5 7  <=> 3 2⍴15 ¯36 8 34 ¯6 3
@['.'] = conjunction (g, f) ->
  F = each reduce f
  G = outerProduct g
  (omega, alpha) ->
    if alpha.shape.length is 0 then alpha = new APLArray [alpha.unwrap()]
    if omega.shape.length is 0 then omega = new APLArray [omega.unwrap()]
    F G(
      enclose(omega, undefined, new APLArray [0])
      enclose(alpha, undefined, new APLArray [alpha.shape.length - 1])
    )
