{APLArray} = require '../array'
{assert, prod} = require '../helpers'

# Shape of (`⍴`)
#
# Reshape (`⍴`)
#
#     ⍴ 1 2 3 ⍴ 0    ⍝ returns 1 2 3
#     ⍴ ⍴ 1 2 3 ⍴ 0  ⍝ returns ,3
#     3 3 ⍴ ⍳ 4      ⍝ returns 3 3 ⍴ 0 1 2 3 0 1 2 3 0
#     ⍴ 3 3 ⍴ ⍳ 4    ⍝ returns 3 3
@['⍴'] = (omega, alpha) ->
  if alpha
    if alpha.shape.length > 1 then throw Error 'RANK ERROR'
    shape = alpha.toArray()
    for d in shape when typeof d isnt 'number' or d isnt Math.floor(d) or d < 0
      throw Error 'DOMAIN ERROR'
    n = prod shape
    a = omega.toArray n
    assert a.length <= n
    while 2 * a.length < n then a = a.concat a
    if a.length isnt n then a = a.concat a[... n - a.length]
    new APLArray a, shape
  else
    new APLArray omega.shape
