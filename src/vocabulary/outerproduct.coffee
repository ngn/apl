{APLArray} = require '../array'
{assert} = require '../helpers'

# Outer product
#
#     2 3 4 ∘.× 1 2 3 4
#     ...     ⍝ returns (3 4⍴
#     ...         2 4  6  8
#     ...         3 6  9 12
#     ...         4 8 12 16)
#
#     0 1 2 3 4 ∘.! 0 1 2 3 4
#     ...     ⍝ returns (5 5⍴
#     ...         1 1 1 1 1
#     ...         0 1 2 3 4
#     ...         0 0 1 3 6
#     ...         0 0 0 1 4
#     ...         0 0 0 0 1)
#
#     1 2 ∘., 1+⍳3
#     ...     ⍝ returns (2 3⍴
#     ...         (1 1) (1 2) (1 3)
#     ...         (2 1) (2 2) (2 3))
#
#     ⍴ 1 2 ∘., 1+⍳3   ⍝ returns 2 3
#
#     2 3 ∘.↑ 1 2
#     ...     ⍝ returns (2 2⍴
#     ...           (1 0)   (2 0)
#     ...         (1 0 0) (2 0 0))
#
#     ⍴ 2 3 ∘.↑ 1 2     ⍝ returns 2 2
#     ⍴ ((4 3 ⍴ 0) ∘.+ (5 2 ⍴ 0))   ⍝ returns 4 3 5 2
#     2 3 ∘.× 4 5       ⍝ returns 2 2⍴ 8 10 12 15
#     2 3 ∘.{⍺×⍵} 4 5   ⍝ returns 2 2⍴ 8 10 12 15
@['∘.'] = (f) ->
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
      if z.shape.length is 0 then z = z.unbox()
      data.push z
    new APLArray data, alpha.shape.concat(omega.shape)
