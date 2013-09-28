{assert, isInt} = require '../helpers'
{DomainError, LengthError, RankError, SyntaxError} = require '../errors'
{APLArray} = require '../array'
{Complex, complexify} = require '../complex'

multiplicitySymbol = (z) ->
  if z instanceof APLArray then (if z.isSingleton() then '1' else '*') else '.'

# pervasive() is a higher-order function
#
# Consider a function that accepts and returns only scalars.  To make it
# pervasive means to make it work with any-dimensional arrays, too.
#
# What pervasive() actually does is to take two versions of a scalar function
# (a monadic and a dyadic one), make them pervasive, and combine them into a
# single function that dispatches based on the number of arguments.
@pervasive = ({monad, dyad}) ->
  pervadeMonadic =
    if monad
      (x) ->
        if x instanceof APLArray
          x.map pervadeMonadic
        else
          r = monad x
          if typeof r is 'number' and isNaN r then throw DomainError 'NaN'
          r
    else
      -> throw Error 'Not implemented'
  pervadeDyadic =
    if dyad
      (x, y) ->
        tx = multiplicitySymbol x
        ty = multiplicitySymbol y
        switch tx + ty
          when '..'
            r = dyad x, y
            if typeof r is 'number' and isNaN r then throw DomainError 'NaN'
            r
          when '.1' then y.map (yi) -> pervadeDyadic x, yi
          when '.*' then y.map (yi) -> pervadeDyadic x, yi
          when '1.' then x.map (xi) -> pervadeDyadic xi, y
          when '*.' then x.map (xi) -> pervadeDyadic xi, y
          when '1*' then xi = x.unwrap(); y.map (yi) -> pervadeDyadic xi, yi
          when '*1' then yi = y.unwrap(); x.map (xi) -> pervadeDyadic xi, yi
          when '11' then yi = y.unwrap(); x.map (xi) -> pervadeDyadic xi, yi # todo: use the larger shape
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

@real = (f) -> (x, y, axis) ->
  if typeof x is 'number' and (not y? or typeof y is 'number')
    f x, y, axis
  else
    throw DomainError()

@numeric = (f, g) -> (x, y, axis) ->
  if typeof x is 'number' and (not y? or typeof y is 'number')
    f x, y, axis
  else
    x = complexify x
    if y?
      y = complexify y
    g x, y, axis

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
    else
      if x instanceof Complex and y instanceof Complex
        x.re is y.re and x.im is y.im
      else
        x is y

eps = 1e-13 # comparison tolerance for approx()

numApprox = (x, y) ->
  x is y or Math.abs(x - y) < eps

# approx() is like match(), but it is tolerant to precision errors;
# used for comparing expected and actual results in doctests
@approx = approx = (x, y) ->
  if x instanceof APLArray
    if not (y instanceof APLArray) then false
    else
      if x.shape.length isnt y.shape.length then return false
      for axis in [0 ... x.shape.length]
        if x.shape[axis] isnt y.shape[axis] then return false
      r = true
      x.each2 y, (xi, yi) -> if not approx xi, yi then r = false
      r
  else
    if y instanceof APLArray then false
    else if not (x? and y?) then false
    else
      if typeof x is 'number' then x = new Complex x
      if typeof y is 'number' then y = new Complex y
      if x instanceof Complex
        y instanceof Complex and numApprox(x.re, y.re) and numApprox(x.im, y.im)
      else
        (x['≡']?(y)) ? (y['≡']?(x)) ? (x is y)

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
  a = axes.unwrap()
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

meta = (f, name, value) ->
  assert typeof f is 'function'
  assert typeof name is 'string'
  (f.aplMetaInfo ?= {})[name] = value
  f

@withIdentity = (x, f) ->
  if x not instanceof APLArray then x = APLArray.scalar x
  meta f, 'identity', x

@adverb       = (f)    -> meta f, 'isPostfixAdverb', true
@prefixAdverb = (f)    -> meta f, 'isPrefixAdverb', true
@conjunction  = (f)    -> meta f, 'isConjunction', true

@aka = (aliases, f) -> # "also known as" decorator
  if typeof aliases is 'string'
    aliases = [aliases]
  else
    assert aliases instanceof Array
  meta f, 'aliases', aliases
