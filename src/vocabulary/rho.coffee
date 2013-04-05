{APLArray} = require '../array'
{assert, prod, isInt} = require '../helpers'

@['⍴'] = (omega, alpha) ->
  if alpha
    # Reshape (`⍴`)
    #
    #     ⍴ 1 2 3 ⍴ 0    ⍝ returns 1 2 3
    #     ⍴ ⍴ 1 2 3 ⍴ 0  ⍝ returns ,3
    #     3 3 ⍴ ⍳ 4      ⍝ returns 3 3 ⍴ 0 1 2 3 0 1 2 3 0
    #     ⍴ 3 3 ⍴ ⍳ 4    ⍝ returns 3 3
    if alpha.shape.length > 1 then throw Error 'RANK ERROR'
    shape = alpha.toArray()
    for d in shape when not isInt d, 0 then throw Error 'DOMAIN ERROR'
    n = prod shape
    a = omega.toArray n
    assert a.length <= n
    while 2 * a.length < n then a = a.concat a
    if a.length isnt n then a = a.concat a[... n - a.length]
    new APLArray a, shape
  else
    # Shape of (`⍴`)
    #
    #     ⍴ 0           ⍝ returns 0 ⍴ 0
    #     ⍴ 0 0         ⍝ returns 1 ⍴ 2
    #     ⍴ ⍴ 0         ⍝ returns 1 ⍴ 0
    #     ⍴ ⍴ ⍴ 0       ⍝ returns 1 ⍴ 1
    #     ⍴ ⍴ ⍴ 0 0     ⍝ returns 1 ⍴ 1
    #     ⍴ 'a'         ⍝ returns 0 ⍴ 0
    #     ⍴ 'ab'        ⍝ returns 1 ⍴ 2
    #     ⍴ 2 3 4 ⍴ 0   ⍝ returns 2 3 4
    new APLArray omega.shape
