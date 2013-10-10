macro -> macro.fileToNode 'src/macros.coffee'
{APLArray} = require '../array'
reduce = require('./slash').vocabulary['/']
enclose = require('./enclose').vocabulary['⊂']
jot = require('./compose').vocabulary['∘']
each = require('./each').vocabulary['¨']
{conjunction} = require './vhelpers'

@vocabulary =
  '.': conjunction (g, f) ->
    if f is jot then outerProduct g else innerProduct g, f

# Outer product
#
# 2 3 4 ∘.× 1 2 3 4
# ...     <=> (3 4⍴
# ...         2 4  6  8
# ...         3 6  9 12
# ...         4 8 12 16)
#
# 0 1 2 3 4 ∘.! 0 1 2 3 4
# ...     <=> (5 5⍴
# ...         1 1 1 1 1
# ...         0 1 2 3 4
# ...         0 0 1 3 6
# ...         0 0 0 1 4
# ...         0 0 0 0 1)
#
# 1 2 ∘., 1+⍳3
# ...     <=> (2 3⍴
# ...         (1 1) (1 2) (1 3)
# ...         (2 1) (2 2) (2 3))
#
# ⍴ 1 2 ∘., 1+⍳3   <=> 2 3
#
# 2 3 ∘.↑ 1 2
# ...     <=> (2 2⍴
# ...           (1 0)   (2 0)
# ...         (1 0 0) (2 0 0))
#
# ⍴ 2 3 ∘.↑ 1 2     <=> 2 2
# ⍴ ((4 3 ⍴ 0) ∘.+ (5 2 ⍴ 0))   <=> 4 3 5 2
# 2 3 ∘.× 4 5       <=> 2 2⍴ 8 10 12 15
# 2 3 ∘ . × 4 5     <=> 2 2⍴ 8 10 12 15
# 2 3 ∘.{⍺×⍵} 4 5   <=> 2 2⍴ 8 10 12 15
outerProduct = (f) ->
  assert typeof f is 'function'
  (omega, alpha) ->
    if not alpha
      throw Error 'Adverb ∘. (Outer product) can be applied to dyadic verbs only'
    a = alpha.toArray()
    b = omega.toArray()
    data = []
    for x in a then for y in b
      if not (x instanceof APLArray) then x = APLArray.scalar x
      if not (y instanceof APLArray) then y = APLArray.scalar y
      z = f y, x
      if z.shape.length is 0 then z = z.unwrap()
      data.push z
    new APLArray data, alpha.shape.concat(omega.shape)


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
innerProduct = (g, f) ->
  F = each reduce f
  G = outerProduct g
  (omega, alpha) ->
    if alpha.shape.length is 0 then alpha = new APLArray [alpha.unwrap()]
    if omega.shape.length is 0 then omega = new APLArray [omega.unwrap()]
    F G(
      enclose(omega, undefined, new APLArray [0])
      enclose(alpha, undefined, new APLArray [alpha.shape.length - 1])
    )
