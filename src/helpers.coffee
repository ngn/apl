# Prototypal inheritance of JavaScript objects
# (see [Douglas Crockford's
# explanation](http://javascript.crockford.com/prototypal.html))
#
# This implementation allows extra properties to be assigned
# to the newly-created object.
@inherit = (x, extraProperties = {}) ->
  f = (->); f:: = x; r = new f
  for k, v of extraProperties then r[k] = v
  r



# Helpers for the APL data model
@isSimple = isSimple = (x) -> not (x instanceof Array)

@shapeOf = shapeOf = (a) ->
  a.shape or
    if a.length? and not (typeof a is 'string' and a.length is 1)
      [a.length]
    else
      []

@withShape = withShape = (shape, a) ->
  assert (not shape?) or a.length is prod shape
  if shape? and shape.length isnt 1 then a.shape = shape
  a

@prototypeOf = prototypeOf = (x) ->
  if typeof x is 'number' then 0
  else if typeof x is 'string' then ' '
  else if x.aplPrototype? then x.aplPrototype
  else if isSimple(x) or not x.length then 0
  else if isSimple x[0] then prototypeOf x[0]
  else
    p = prototypeOf x[0]
    withShape shapeOf(x[0]), (for [0...x[0].length] then p)

@withPrototype = withPrototype = (p, x) ->
  if (x instanceof Array) and (not x.length) and (p isnt 0)
    x.aplPrototype = p
  x

@withPrototypeCopiedFrom = (y, x) ->
  if x instanceof Array and not x.length
    withPrototype prototypeOf(y), x
  x



# Sum and product;  I wish JavaScript had a _reduce_ operator :)
@sum = (xs) -> r = 0; (for x in xs then r += x); r
@prod = prod = (xs) -> r = 1; (for x in xs then r *= x); r
@all = (xs) -> (for x in xs when not x then return false); true

# `repeat(s, n)` catenates `n` instances of a string `s`.
@repeat = repeat = (s, n) -> r = ''; (for [0...n] then r += s); r

@assert = assert = (flag, s = 'Assertion failed') ->
  if not flag then throw Error s

@die = (message, opts = {}, args...) ->
  assert typeof message is 'string'
  assert typeof opts is 'object'
  assert not args.length
  if opts.aplCode? and opts.line? and opts.col?
    assert typeof opts.aplCode is 'string'
    assert typeof opts.line is 'number'
    assert typeof opts.col is 'number'
    assert typeof opts.file in ['string', 'undefined']
    message += """
      \n#{opts.file or '-'}:##{opts.line}:#{opts.col}
      #{opts.aplCode.split('\n')[opts.line - 1]}
      #{repeat('_', opts.col - 1)}^
    """
  e = Error message
  for k, v of opts
    assert k in ['aplCode', 'line', 'col', 'file', 'name']
    e[k] = v
  throw e
