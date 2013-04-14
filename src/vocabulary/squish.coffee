{APLArray} = require '../array'
{assert, prod, repeat, isInt} = require '../helpers'

# Index (`⌷`)
#
# `a0 a1...⌷b` is equivalent to `b[a0;a1;...]`
#
#     1 ⌷ 3 5 8                ⍝ returns 5
#     (3 5 8)[1]               ⍝ returns 5
#     ⌷←{⍺+¨⍵}  ◇  (3 5 8)[1]  ⍝ returns 4 6 9
#     (2 2 0) (1 2) ⌷ 3 3⍴⍳9   ⍝ returns 3 2 ⍴ 7 8 7 8 1 2
#     ¯1 ⌷ 3 5 8               ⍝ throws
#     2 ⌷ 111 222 333 444      ⍝ returns 333
#!    (⊂3 2) ⌷ 111 222 333 444 ⍝ returns 444 333
#!    (⊂2 3⍴2 0 3 0 1 2) ⌷ 111 222 333 444
#     ... ⍝ returns 2 3⍴333 111 444 111 222 333
#     1 0    ⌷3 4⍴11 12 13 14 21 22 23 24 31 32 33 34   ⍝ returns 21
#     1      ⌷3 4⍴11 12 13 14 21 22 23 24 31 32 33 34   ⍝ returns 21 22 23 24
#     2 (1 0)⌷3 4⍴11 12 13 14 21 22 23 24 31 32 33 34   ⍝ returns 32 31
#     (1 2) 0⌷3 4⍴11 12 13 14 21 22 23 24 31 32 33 34   ⍝ returns 21 31
#
#     (23 54 38)[0]                         ⍝ returns 23
#     (23 54 38)[1]                         ⍝ returns 54
#     (23 54 38)[2]                         ⍝ returns 38
#     (23 54 38)[3]                         ⍝ throws
#     (23 54 38)[¯1]                        ⍝ throws
#     (23 54 38)[0 2]                       ⍝ returns 23 38
#     (2 3 ⍴ 100 101 102 110 111 112)[1;2]  ⍝ returns 112
#     (2 3 ⍴ 100 101 102 110 111 112)[1;¯1] ⍝ throws
#     (2 3 ⍴ 100 101 102 110 111 112)[10;1] ⍝ throws
#     (2 3 ⍴ 100 101 102 110 111 112)[1;]   ⍝ returns 110 111 112
#     (2 3 ⍴ 100 101 102 110 111 112)[;1]   ⍝ returns 101 111
#     'hello'[1]                            ⍝ returns 'e'
#     'ipodlover'[1 2 5 8 3 7 6 0 4]        ⍝ returns 'poordevil'
#     ('axlrose'[4 3 0 2 5 6 1])[0 1 2 3]   ⍝ returns 'oral'
#
#!    " X"[(3 3⍴⍳9) ∊ 1 3 6 7 8]  ⍝ returns 3 3⍴,/ (' X '
#!    ...                                           'X  '
#!    ...                                           'XXX')

@['⌷'] = squish = (omega, alpha, axes) ->
  if typeof omega is 'function' then return (x, y) -> omega x, y, alpha
  if not alpha then throw Error 'Not implemented'

  assert alpha instanceof APLArray
  assert omega instanceof APLArray
  assert (not axes?) or axes instanceof APLArray

  if alpha.shape.length > 1 then throw Error 'RANK ERROR'
  alphaItems = alpha.toArray()
  if alphaItems.length > omega.shape.length then throw Error 'LENGTH ERROR'

  axes = if axes then axes.toArray() else [0...alphaItems.length]
  if alphaItems.length isnt axes.length then throw Error 'LENGTH ERROR'

  subscripts = Array omega.shape.length
  subscriptShapes = Array omega.shape.length
  for axis, i in axes
    if not isInt axis then throw Error 'DOMAIN ERROR'
    if not (0 <= axis < omega.shape.length) then throw Error 'RANK ERROR'
    if typeof subscripts[axis] isnt 'undefined' then throw Error 'RANK ERROR: Duplicate axis'
    d = alphaItems[i]
    subscripts[axis] = if d instanceof APLArray then d.toArray() else [d]
    assert subscripts[axis].length
    subscriptShapes[axis] = if d instanceof APLArray then d.shape else []
    for x in subscripts[axis]
      if not isInt x then throw Error 'DOMAIN ERROR'
      if not (0 <= x < omega.shape[axis]) then throw Error 'INDEX ERROR'

  for i in [0...subscripts.length] when typeof subscripts[i] is 'undefined'
    subscripts[i] = [0...omega.shape[i]]
    subscriptShapes[i] = [omega.shape[i]]

  data = []
  u = repeat [0], subscripts.length
  p = omega.offset
  for a in [0...subscripts.length]
    p += subscripts[a][0] * omega.stride[a]
  loop
    data.push omega.data[p]
    a = subscripts.length - 1
    while a >= 0 and u[a] + 1 is subscripts[a].length
      p += (subscripts[a][0] - subscripts[a][u[a]]) * omega.stride[a]
      u[a--] = 0
    if a < 0 then break
    p += (subscripts[a][u[a] + 1] - subscripts[a][u[a]]) * omega.stride[a]
    u[a]++

  new APLArray data, [].concat subscriptShapes...
