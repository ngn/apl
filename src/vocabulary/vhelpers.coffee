# pervasive() is a higher-order function
#
# Consider a function that accepts and returns only scalars.  To make it
# pervasive means to make it work with any-dimensional arrays, too.
#
# What pervasive() actually does is to take two versions of a scalar function
# (a monadic and a dyadic one), make them pervasive, and combine them into a
# single function that dispatches based on the number of arguments.
pervasive = ({monad, dyad}) ->
  pervadeMonadic =
    if monad
      (x) ->
        if x instanceof APLArray
          x.map pervadeMonadic
        else
          r = monad x
          if typeof r is 'number' and isNaN r then domainError 'NaN'
          r
    else
      nonceError
  pervadeDyadic =
    if dyad
      (x, y) ->
        # tx, ty: 0=unwrapped scalar; 1=singleton array; 2=non-singleton array
        tx = if x instanceof APLArray then (if x.isSingleton() then 1 else 2) else 0
        ty = if y instanceof APLArray then (if y.isSingleton() then 1 else 2) else 0
        switch 16 * tx + ty
          when 0x00
            r = dyad x, y
            if typeof r is 'number' and isNaN r then domainError 'NaN'
            r
          when 0x01, 0x02 then y.map (yi) -> pervadeDyadic x, yi
          when 0x10, 0x20 then x.map (xi) -> pervadeDyadic xi, y
          when 0x12       then xi = x.data[x.offset]; y.map (yi) -> pervadeDyadic xi, yi
          when 0x21, 0x11 then yi = y.data[y.offset]; x.map (xi) -> pervadeDyadic xi, yi # todo: use the larger shape for '11'
          when 0x22
            if x.shape.length isnt y.shape.length then rankError()
            for axis in [0...x.shape.length] by 1 when x.shape[axis] isnt y.shape[axis] then lengthError()
            x.map2 y, pervadeDyadic
          else assert 0
    else
      nonceError
  (omega, alpha) ->
    assert omega instanceof APLArray
    assert alpha instanceof APLArray or not alpha?
    (if alpha? then pervadeDyadic else pervadeMonadic) omega, alpha

real = (f) -> (x, y, axis) ->
  if typeof x is 'number' and (not y? or typeof y is 'number')
    f x, y, axis
  else
    domainError()

numeric = (f, g) -> (x, y, axis) ->
  if typeof x is 'number' and (not y? or typeof y is 'number')
    f x, y, axis
  else
    x = complexify x
    if y?
      y = complexify y
    g x, y, axis

match = (x, y) ->
  if x instanceof APLArray
    if y not instanceof APLArray then false
    else
      if x.shape.length isnt y.shape.length then return false
      for axis in [0...x.shape.length] by 1
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

numApprox = (x, y) ->
  x is y or Math.abs(x - y) < 1e-11

# approx() is like match(), but it is tolerant to precision errors;
# used for comparing expected and actual results in doctests
approx = (x, y) ->
  if x instanceof APLArray
    if not (y instanceof APLArray) then false
    else
      if x.shape.length isnt y.shape.length then return false
      for axis in [0...x.shape.length] by 1
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
        x is y

bool = (x) ->
  if x not in [0, 1] then domainError() else x

getAxisList = (axes, rank) ->
  assert isInt rank, 0
  if not axes? then return []
  assert axes instanceof APLArray
  if axes.shape.length isnt 1 or axes.shape[0] isnt 1 then syntaxError() # [sic]
  a = axes.unwrap()
  if a instanceof APLArray
    a = a.toArray()
    for x, i in a
      if not isInt x, 0, rank then domainError()
      if x in a[...i] then domainError 'Non-unique axes'
    a
  else if isInt a, 0, rank
    [a]
  else
    domainError()

withIdentity = (x, f) ->
  f.identity = if x instanceof APLArray then x else APLArray.scalar x
  f

adverb      = (f) -> f.isAdverb      = true; f
conjunction = (f) -> f.isConjunction = true; f
cps         = (f) -> f.cps           = true; f

aka = (aliases, f) -> # "also known as" decorator
  if typeof aliases is 'string'
    aliases = [aliases]
  else
    assert aliases instanceof Array
  f.aliases = aliases
  f
