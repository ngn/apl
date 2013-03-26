{assert, prod, repeat} = require './helpers'
{APLArray} = require './array'
{Complex} = require './complex'

@['⎕aplify'] = (x) ->
  assert x?
  if typeof x is 'string'
    if x.length is 1
      APLArray.scalar x
    else
      new APLArray x
  else if typeof x is 'number'
    APLArray.scalar x
  else if x instanceof Array
    new APLArray(
      for y in x
        if y instanceof APLArray and y.shape.length is 0 then y.unbox() else y
    )
  else if x instanceof APLArray
    x
  else
    throw Error 'Cannot aplify object ' + x

@['⎕complex'] = (re, im) ->
  APLArray.scalar new Complex re, im

@['⎕bool'] = (x) ->
  assert x instanceof APLArray
  if not x.isSingleton() then throw Error 'LENGTH ERROR'
  r = x.unbox()
  if r not in [0, 1] then throw Error 'DOMAIN ERROR: cannot convert to boolean: ' + r
  r

multiplicitySymbol = (z) ->
  if z instanceof APLArray then (if z.isSingleton() then '1' else '*') else '.'

pervasive = ({monadic, dyadic}) ->
  pervadeMonadic =
    if monadic
      (x) ->
        if x instanceof APLArray
          x.map pervadeMonadic
        else
          (x[F.aplName]?()) ? monadic x
    else
      -> throw Error 'Not implemented'
  pervadeDyadic =
    if dyadic
      (x, y) ->
        tx = multiplicitySymbol x
        ty = multiplicitySymbol y
        switch tx + ty
          when '..' then (x?[F.aplName]?(y)) ? (y?['right_' + F.aplName]?(x)) ? (dyadic x, y)
          when '.1' then y.map (yi) -> pervadeDyadic x, yi
          when '.*' then y.map (yi) -> pervadeDyadic x, yi
          when '1.' then x.map (xi) -> pervadeDyadic xi, y
          when '*.' then x.map (xi) -> pervadeDyadic xi, y
          when '1*' then xi = x.unbox(); y.map (yi) -> pervadeDyadic xi, yi
          when '*1' then yi = y.unbox(); x.map (xi) -> pervadeDyadic xi, yi
          when '11' then yi = y.unbox(); x.map (xi) -> pervadeDyadic xi, yi # todo: use the larger shape
          when '**'
            if x.shape.length isnt y.shape.length then throw Error 'RANK ERROR'
            for axis in [0...x.shape.length] when x.shape[axis] isnt y.shape[axis] then throw Error 'LENGTH ERROR'
            x.map2 y, pervadeDyadic
    else
      -> throw Error 'Not implemented'
  F = (omega, alpha) ->
    assert omega instanceof APLArray
    assert alpha instanceof APLArray or typeof alpha is 'undefined'
    (if alpha then pervadeDyadic else pervadeMonadic) omega, alpha

numeric = (f) -> (x, y, axis) ->
  if typeof x isnt 'number' or (y? and typeof y isnt 'number')
    throw Error 'DOMAIN ERROR'
  f x, y, axis

@['+'] = pervasive
  monadic: numeric (x) -> x
  dyadic:  numeric (y, x) -> x + y

@['−'] = pervasive
  monadic: numeric (x) -> -x
  dyadic:  numeric (y, x) -> x - y

@['×'] = pervasive
  monadic: numeric (x) -> (x > 0) - (x < 0)
  dyadic:  numeric (y, x) -> x * y

@['÷'] = pervasive
  monadic: numeric (x) -> 1 / x
  dyadic:  numeric (y, x) -> x / y

@['⋆'] = pervasive
  monadic: numeric Math.exp
  dyadic:  numeric (y, x) -> Math.pow x, y

@['⌽'] = (omega, alpha, axis) ->
  if not alpha?
    if omega.shape.length is 0
      omega
    else
      stride = omega.stride[...]
      offset = omega.offset + omega.shape[0] * stride[0]
      stride[0] = -stride[0]
      new APLArray omega.data, omega.shape, stride, offset

@['='] = pervasive dyadic: (y, x) -> +(x is y)
@['≠'] = pervasive dyadic: (y, x) -> +(x isnt y)
@['<'] = pervasive dyadic: numeric (y, x) -> +(x < y)
@['>'] = pervasive dyadic: numeric (y, x) -> +(x > y)
@['≤'] = pervasive dyadic: numeric (y, x) -> +(x <= y)
@['≥'] = pervasive dyadic: numeric (y, x) -> +(x >= y)

@['⌊'] = pervasive
  monadic: numeric Math.ceil
  dyadic: numeric Math.max

@['⌈'] = pervasive
  monadic: numeric Math.floor
  dyadic: numeric Math.min

@['?'] = pervasive
  monadic: numeric (x) ->
    if x isnt Math.floor(x) or x <= 0 then throw Error 'DOMAIN ERROR'
    Math.floor Math.random() * x

@['○'] = pervasive
  monadic: numeric (x) -> Math.PI * x

match = (x, y) ->
  if x instanceof APLArray
    if not (y instanceof APLArray) then false
    else
      if x.shape.length isnt y.shape.length then return false
      for axis in [0 ... x.shape.length]
        if x.shape[axis] isnt y.shape[axis] then return false
      r = true
      x.each2 y, (xi, yi) -> if not match xi, yi then r = false
      r
  else
    if y instanceof APLArray then false
    else (x['≡']?(y)) ? (y['≡']?(x)) ? (x is y)

@['≡'] = (omega, alpha) ->
  if alpha
    APLArray.bool[+match omega, alpha]
  else
    throw Error 'Not implemented'

@[','] = (omega, alpha) ->
  if alpha
    shape = alpha.realize()
    throw Error 'Not implemented'
  else
    new APLArray omega.realize()

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

@['set_⎕'] = console.info

do =>
  for k, v of @ when typeof v is 'function'
    v.aplName = k
