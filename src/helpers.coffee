macro -> macro.fileToNode 'src/macros.coffee'
@prod = (xs) -> r = 1; (for x in xs then r *= x); r
@all = (xs) -> (for x in xs when not x then return false); true

# `repeat(a, n)` catenates `n` instances of a string or array `a`.
@repeat = repeat = (a, n) ->
  assert typeof a is 'string' or a instanceof Array
  assert isInt n, 0
  if not n then return a[...0]
  m = n * a.length
  while a.length * 2 < m then a = a.concat a
  a.concat a[... m - a.length]

@isInt = isInt = (x, start = -Infinity, end = Infinity) -> x is ~~x and start <= x < end
