{assert, isInt} = require '../helpers'
{DomainError, LengthError, RankError, SyntaxError} = require '../errors'
{APLArray} = require '../array'

multiplicitySymbol = (z) ->
  if z instanceof APLArray then (if z.isSingleton() then '1' else '*') else '.'

@pervasive = ({monad, dyad}) ->
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
          when '..' then (y?[F.aplName]?(x)) ? (x?['right_' + F.aplName]?(y)) ? (dyad x, y)
          when '.1' then y.map (yi) -> pervadeDyadic x, yi
          when '.*' then y.map (yi) -> pervadeDyadic x, yi
          when '1.' then x.map (xi) -> pervadeDyadic xi, y
          when '*.' then x.map (xi) -> pervadeDyadic xi, y
          when '1*' then xi = x.unbox(); y.map (yi) -> pervadeDyadic xi, yi
          when '*1' then yi = y.unbox(); x.map (xi) -> pervadeDyadic xi, yi
          when '11' then yi = y.unbox(); x.map (xi) -> pervadeDyadic xi, yi # todo: use the larger shape
          when '**'
            if x.shape.length isnt y.shape.length then throw RankError()
            for axis in [0...x.shape.length] when x.shape[axis] isnt y.shape[axis] then throw LengthError()
            x.map2 y, pervadeDyadic
    else
      -> throw Error 'Not implemented'
  F = (omega, alpha) ->
    assert omega instanceof APLArray
    assert alpha instanceof APLArray or typeof alpha is 'undefined'
    (if alpha then pervadeDyadic else pervadeMonadic) omega, alpha

@numeric = (f) -> (x, y, axis) ->
  if typeof x isnt 'number' or (y? and typeof y isnt 'number')
    throw DomainError()
  f x, y, axis

@match = match = (x, y) ->
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

@bool = (x) ->
  if x not in [0, 1]
    throw DomainError()
  x

@getAxisList = (axes, rank) ->
  assert isInt rank, 0
  if typeof axes is 'undefined' then return []
  assert axes instanceof APLArray
  if axes.shape.length isnt 1 or axes.shape[0] isnt 1
    throw SyntaxError() # [sic]
  a = axes.unbox()
  if a instanceof APLArray
    a = a.toArray()
    for x, i in a
      if not isInt x, 0, rank
        throw DomainError()
      if x in a[...i]
        throw Error 'Non-unique axes'
    a
  else if isInt a, 0, rank
    [a]
  else
    throw DomainError()
