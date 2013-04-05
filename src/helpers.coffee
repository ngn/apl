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

@extend = extend = (x, extraProperties) ->
  for k, v of extraProperties then x[k] = v
  x

# Helpers for the APL data model
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

@enc = (x, a) ->
  r = []
  for i in [a.length - 1 .. 0] by -1
    r.push x % a[i]
    x = Math.floor x / a[i]
  r.reverse()

@dec = (xs, a) ->
  assert xs.length is a.length
  r = 0
  for x, i in xs then r = r * a[i] + x
  r

# `repeat(a, n)` catenates `n` instances of a string or array `a`.
@repeat = repeat = (a, n) ->
  assert typeof a is 'string' or a instanceof Array
  assert isInt n, 0
  if not n then return a[...0]
  m = n * a.length
  while a.length * 2 < m then a = a.concat a
  a.concat a[... m - a.length]

@assert = assert = (flag, s = '') ->
  if not flag then throw extend Error(s), name: 'AssertionError'

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

@isInt = isInt = (x, start = -Infinity, end = Infinity) -> x is ~~x and start <= x < end
