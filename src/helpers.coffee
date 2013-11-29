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

macro formatNumber (x) ->
  macro.codeToNode(-> ('' + x).replace('Infinity', '∞').replace(/-/g, '¯')).subst {x}

@Uint8Array  ?= Array
@Uint16Array ?= Array
@Uint32Array ?= Array
@Int8Array   ?= Array
@Int16Array  ?= Array
@Int32Array  ?= Array

Array::set ?= (a, offset) ->
  for i in [0...a.length] by 1 then @[offset + i] = a[i]
  return

macro spread (a, i, m, n) -> # repeat the pattern a[i...i+m] so that it covers a[i...i+n]
  macro.tmpCounter ?= 0
  (macro.codeToNode ->
    a = a0
    i = i0
    m = m0
    n = n0
    if a instanceof Array
      for j in [m...n] by 1
        a[i + j] = a[i + j % m]
    else
      a = a.subarray i, i + n
      while 2 * m < n
        a.set a.subarray(0, m), m
        m *= 2
      a.set a.subarray(0, n - m), m
  ).subst
    a: macro.csToNode "t#{macro.tmpCounter++}"
    i: macro.csToNode "t#{macro.tmpCounter++}"
    m: macro.csToNode "t#{macro.tmpCounter++}"
    n: macro.csToNode "t#{macro.tmpCounter++}"
    a0: a
    i0: i
    m0: m
    n0: n

arrayEquals = (a, b) ->
  assert a instanceof Array
  assert b instanceof Array
  if a.length isnt b.length then return false
  for x, i in a when x isnt b[i] then return false
  true
