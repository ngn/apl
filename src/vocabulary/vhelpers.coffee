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
            if ⍴⍴(x) isnt ⍴⍴(y) then rankError()
            for axis in [0...⍴⍴ x] by 1 when ⍴(x)[axis] isnt ⍴(y)[axis] then lengthError()
            x.map2 y, pervadeDyadic
          else assert 0
    else
      nonceError
  (⍵, ⍺) ->
    assert ⍵ instanceof APLArray
    assert ⍺ instanceof APLArray or !⍺?
    (if ⍺? then pervadeDyadic else pervadeMonadic) ⍵, ⍺

macro real (f) ->
  (macro.codeToNode ->
    (x, y, axis) ->
      if typeof x is 'number' and (!y? or typeof y is 'number')
        fBody
      else
        domainError()
  ).subst
    x:     macro.csToNode(f.params[0]?.name?.value ? "t#{macro.tmpCounter++}").expressions[0]
    y:     macro.csToNode(f.params[1]?.name?.value ? "t#{macro.tmpCounter++}").expressions[0]
    axis:  macro.csToNode(f.params[2]?.name?.value ? "t#{macro.tmpCounter++}").expressions[0]
    fBody: f.body

numeric = (f, g) -> (x, y, axis) ->
  if typeof x is 'number' and (!y? or typeof y is 'number')
    f x, y, axis
  else
    x = complexify x
    if y?
      y = complexify y
    g x, y, axis

match = (x, y) ->
  if x instanceof APLArray
    if y !instanceof APLArray then false
    else
      if ⍴⍴(x) isnt ⍴⍴(y) then return false
      for axis in [0...⍴⍴ x] by 1
        if ⍴(x)[axis] isnt ⍴(y)[axis] then return false
      r = true
      each2 x, y, (xi, yi) -> if !match xi, yi then r = false
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
    if y !instanceof APLArray then false
    else
      if ⍴⍴(x) isnt ⍴⍴(y) then return false
      for axis in [0...⍴⍴ x] by 1
        if ⍴(x)[axis] isnt ⍴(y)[axis] then return false
      r = true
      each2 x, y, (xi, yi) -> if !approx xi, yi then r = false
      r
  else
    if y instanceof APLArray then false
    else if !(x? and y?) then false
    else
      if typeof x is 'number' then x = new Complex x
      if typeof y is 'number' then y = new Complex y
      if x instanceof Complex
        y instanceof Complex and numApprox(x.re, y.re) and numApprox(x.im, y.im)
      else
        x is y

bool = (x) ->
  if x !in [0, 1] then domainError() else x

getAxisList = (axes, rank) ->
  assert isInt rank, 0
  if !axes? then return []
  assert axes instanceof APLArray
  if ⍴⍴(axes) isnt 1 or ⍴(axes)[0] isnt 1 then syntaxError() # [sic]
  a = axes.unwrap()
  if a instanceof APLArray
    a = a.toArray()
    for x, i in a
      if !isInt x, 0, rank then domainError()
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
