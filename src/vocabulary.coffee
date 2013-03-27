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

pervasive = ({monad, dyad}) ->
  pervadeMonadic =
    if monad
      (x) ->
        if x instanceof APLArray
          x.map pervadeMonadic
        else
          (x[F.aplName]?()) ? monad x
    else
      -> throw Error 'Not implemented'
  pervadeDyadic =
    if dyad
      (x, y) ->
        tx = multiplicitySymbol x
        ty = multiplicitySymbol y
        switch tx + ty
          when '..' then (x?[F.aplName]?(y)) ? (y?['right_' + F.aplName]?(x)) ? (dyad x, y)
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
  monad: numeric (x) -> x
  dyad:  numeric (y, x) -> x + y

@['−'] = pervasive
  monad: numeric (x) -> -x
  dyad:  numeric (y, x) -> x - y

@['×'] = pervasive
  monad: numeric (x) -> (x > 0) - (x < 0)
  dyad:  numeric (y, x) -> x * y

@['÷'] = pervasive
  monad: numeric (x) -> 1 / x
  dyad:  numeric (y, x) -> x / y

@['⋆'] = pervasive
  monad: numeric Math.exp
  dyad:  numeric (y, x) -> Math.pow x, y

@['='] = pervasive dyad: (y, x) -> +(x is y)
@['≠'] = pervasive dyad: (y, x) -> +(x isnt y)
@['<'] = pervasive dyad: numeric (y, x) -> +(x < y)
@['>'] = pervasive dyad: numeric (y, x) -> +(x > y)
@['≤'] = pervasive dyad: numeric (y, x) -> +(x <= y)
@['≥'] = pervasive dyad: numeric (y, x) -> +(x >= y)

@['⌊'] = pervasive
  monad: numeric Math.ceil
  dyad: numeric Math.max

@['⌈'] = pervasive
  monad: numeric Math.floor
  dyad: numeric Math.min

@['?'] = pervasive
  monad: numeric (x) ->
    if x isnt Math.floor(x) or x <= 0 then throw Error 'DOMAIN ERROR'
    Math.floor Math.random() * x

@['○'] = pervasive
  monad: numeric (x) -> Math.PI * x

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

@['⍴'] = require('./vocabulary/rho')['⍴']
@['⍳'] = require('./vocabulary/iota')['⍳']
@['⌽'] = require('./vocabulary/rotate')['⌽']
@['⊖'] = require('./vocabulary/rotate')['⊖']

# [Commute](http://www.jsoftware.com/papers/opfns1.htm#3) (`⍨`)
#
# Definition: `x f⍨ y  <->  y f x`
#
#     17 −⍨ 23    ⍝ returns 6
#     7 ⍴⍨ 2 3    ⍝ returns 2 3⍴7
#     −⍨ 123      ⍝ returns ¯123
@['⍨'] = (f) ->
  assert typeof f is 'function'
  (omega, alpha, axis) ->
    if alpha then f alpha, omega, axis else f omega, undefined, axis
(@['⍨'].aplMetaInfo ?= {}).isPostfixAdverb = true

@['get_⍬'] = -> APLArray.zilde
@['set_⎕'] = console.info

do =>
  for k, v of @ when typeof v is 'function'
    v.aplName = k
