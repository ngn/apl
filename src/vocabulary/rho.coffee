{APLArray} = require '../array'
{assert, prod} = require '../helpers'

@['⍴'] = (omega, alpha) ->
  if alpha
    if alpha.shape.length > 1 then throw Error 'RANK ERROR'
    shape = alpha.realize()
    for d in shape when typeof d isnt 'number' or d isnt Math.floor(d) or d < 0
      throw Error 'DOMAIN ERROR'
    n = prod shape
    a = omega.realize n
    assert a.length <= n
    while 2 * a.length < n then a = a.concat a
    if a.length isnt n then a = a.concat a[... n - a.length]
    new APLArray a, shape
  else
    new APLArray omega.shape
