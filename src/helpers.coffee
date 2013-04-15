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

@isInt = isInt = (x, start = -Infinity, end = Infinity) -> x is ~~x and start <= x < end
