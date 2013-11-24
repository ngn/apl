macro isInt (x, start, end) ->
  macro.tmpCounter ?= 0
  new macro.Parens(
    (
      if end then        macro.codeToNode -> (tmp = x) is ~~tmp and start <= tmp < end
      else if start then macro.codeToNode -> (tmp = x) is ~~tmp and start <= tmp
      else               macro.codeToNode -> (tmp = x) is ~~tmp
    ).subst
      tmp:   macro.csToNode "tmp#{macro.tmpCounter++}"
      x:     new macro.Parens x
      start: new macro.Parens start
      end:   new macro.Parens end
  )

prod = (xs) -> r = 1; (for x in xs then r *= x); r
all = (xs) -> (for x in xs when not x then return false); true

# `repeat(a, n)` catenates `n` instances of a string or array `a`.
repeat = (a, n) ->
  assert typeof a is 'string' or a instanceof Array
  assert isInt n, 0
  if not n then return a[...0]
  m = n * a.length
  while a.length * 2 < m then a = a.concat a
  a.concat a[... m - a.length]

extend = (x, y) ->
  for k of y then x[k] = y[k]
  x
