#!/usr/bin/env coffee

# This file contains an implementation of APL's built-in functions and
# operators.

# # APL objects

# APL's data structures are multidimensional arrays:
#
#   * (rank 0) Scalars---can be:
#
#       * simple scalars, like numbers and characters
#
#       * an APL array of rank zero, containing exactly one element
#
#   * (rank 1) Vectors---sequences of APL objects with zero or more elements
#
#   * (rank 2) Matrices---two-dimensional arrays of APL objects
#
#   * (rank 3+) Cubes, etc
#
# APL arrays are not necessarily heterogenous, they may contain data of mixed
# types.
#
# An array in APL is aware of its own dimensions, so there is an essential
# difference between a vector of vectors and a matrix.  To reflect this in
# JavaScript objects, we use the following convention:
#
#   * APL scalars:
#
#       - Simple scalars: APL numbers are JavaScript numbers and APL characters
#       are JavaScript one-character strings.
#
#       - A zero-rank APL array is a JavaScript array of size one with a
#       `shape` property of `[]`, e.g. created by:
#
#               var a = []; a.shape = [];
#
#   * An APL vector is a JavaScript array.
#
#   * An APL matrix, cube, etc is a JavaScript array with an additional `shape`
#   property, describing the dimensions of the APL array.  E.g. a 2-by-2-by-3
#   cube of zeroes may be constructed via:
#
#           function createSomeCube() {
#               var cube = [
#                   0, // Element at indices [0;0;0]
#                   0, // Element at indices [0;0;1]
#                   0, // Element at indices [0;0;2]
#                   0, // Element at indices [0;1;0]
#                   0, // Element at indices [0;1;1]
#                   // ...
#                   0  // Element at indices [1;1;2]
#               ];
#               cube.shape = [2, 2, 3];
#               return cube;
#           }
#
#       A vector's representation, as opposed to that of higher-dimension
#       arrays, is not required to have a `shape` property.  The shape of a
#       vector `v` is assumed to be `[v.length]`, by convention.  Similarly, we
#       could say that a scalar's shape is `[]` by convention.



# # APL prototypes
#
# Every object in APL, including empty arrays, has a _prototype_ used whenever
# "padding material" is needed, such as in the _take_ function:
#
#     5 ↑ 1 2 3     ⍝ gives      1 2 3 0 0
#     5 ↑ 'abc'     ⍝ gives      'abc  '
#
# Prototypes are defined recursively:
#
#   * For numbers, the prototype is `0`.
#
#   * For characters, the prototype is a space, `' '`.
#
#   * For non-empty arrays, the prototype is the prototype of the first
#   element, repeated and arranged to fit the first element's shape.  E.g. the
#   prototype of `((1 2) 'a' (1 2 3))` is `(0 0)`.
#
#   * For empty arrays, the prototype is determined by the operation used to
#   construct the array.  Usually it is copied from another array.
#
# To represent this in JavaScript, we simply use the first elements of arrays
# and calculate it dynamically.  For empty arrays, we put an additional
# `aplPrototype` property on the array, like so:
#
#     var a = [];
#     a.aplPrototype = ' ';
#
#     var b = [];
#     b.aplPrototype = [0, 0, 0, 0];
#     b.aplPrototype.shape = [2, 2];
#
# If an empty array has a prototype of `0`, we skip `aplPrototype` and leave
# `0` as an implicit default.



{assert, die, cps, cpsify, isSimple, shapeOf, withShape, sum, prod, repeat, prototypeOf, withPrototype, withPrototypeCopiedFrom} = require './helpers'
{min, max, floor, ceil, round, abs, random, exp, pow, log, PI, sqrt, sin, cos, tan, asin, acos, atan} = Math
repr = JSON.stringify



# # Type coersion helpers

array = (x) ->
  if isSimple x then [x] else x

num = (x) ->
  if x.length?
    assert x.length is 1, 'Numeric scalar or singleton expected'
    x = x[0]
  assert typeof x is 'number', 'Numeric scalar or singleton expected'
  x

bool = (x) ->
  x = num x
  assert x in [0, 1], 'Boolean values must be either 0 or 1'
  x


# # DSL for defining built-in symbols

exports.builtins = builtins = {}

tmp = monadic: {}, dyadic: {}

def = (h, name, description, f) ->
  assert typeof name is 'string'
  assert typeof description is 'string'
  f ?= -> die "Function #{name} #{description} is not implemented."
  assert typeof f is 'function'
  assert not h[name]?, "Redefinition of function #{name} #{description}"
  h[name] = f

monadic         = (a...) -> def tmp.monadic, a...
dyadic          = (a...) -> def tmp.dyadic,  a...
prefixOperator  = (a...) -> (def tmp.monadic, a...).isPrefixOperator = true
postfixOperator = (a...) -> (def tmp.monadic, a...).isPostfixOperator = true
infixOperator   = (a...) -> (def tmp.dyadic,  a...).isInfixOperator = true

ambivalent = (symbol, f1, f2) -> (b, a, args...) ->
  (
    if typeof b?[symbol] is 'function' then b[symbol]
    else if typeof a?[symbol] is 'function' then a[symbol]
    else if a? then f2
    else f1
  ) b, a, args...

endOfBuiltins = ->
  for k, f of tmp.monadic when not tmp.dyadic[k] then builtins[k] = f
  for k, f of tmp.dyadic when not tmp.monadic[k] then builtins[k] = f
  for k, f of tmp.monadic when tmp.dyadic[k] then builtins[k] = ambivalent k, f, tmp.dyadic[k]
  tmp = null

# `pervasive(f)` is a decorator which takes a scalar function `f` and makes it
# propagate through arrays.
pervasive = (f) -> F = (b, a) ->
  if a? # dyadic pervasiveness
    if isSimple(b) and isSimple(a) then f b, a
    else if isSimple a then withShape b.shape, (for x in b then F x, a)
    else if isSimple b then withShape a.shape, (for x in a then F b, x)
    else
      sa = shapeOf a; sb = shapeOf b
      for i in [0 ... min sa.length, sb.length]
        assert sa[i] is sb[i], 'Length error'
      if sa.length > sb.length
        k = prod sa[sb.length...]
        withShape sa, (for i in [0...a.length] then F a[i], b[floor i / k])
      else if sa.length < sb.length
        k = prod sb[sa.length...]
        withShape sb, (for i in [0...b.length] then F a[floor i / k], b[i])
      else
        withShape sa, (for i in [0...a.length] then F a[i], b[i])
  else # monadic pervasiveness
    if isSimple b then f b
    else withShape b.shape, (for x in b then F x)



# # Built-in functions

monadic '+', 'Add',            pervasive (x) -> x
dyadic  '+', 'Conjugate',      pervasive (y, x) -> x + y
monadic '−', 'Negate',         pervasive (x) -> -x
dyadic  '−', 'Subtract',       pervasive (y, x) -> x - y
monadic '×', 'Sign of',        pervasive (x) -> (x > 0) - (x < 0)
dyadic  '×', 'Multiply',       pervasive (y, x) -> x * y
monadic '÷', 'Reciprocal',     pervasive (x) -> 1 / x
dyadic  '÷', 'Divide',         pervasive (y, x) -> x / y
monadic '⌈', 'Ceiling',        pervasive (x) -> ceil x
dyadic  '⌈', 'Greater of',     pervasive (y, x) -> max x, y
monadic '⌊', 'Floor',          pervasive (x) -> floor x
dyadic  '⌊', 'Lesser of',      pervasive (y, x) -> min x, y
monadic '∣', 'Absolute value', pervasive (x) -> abs x
dyadic  '∣', 'Residue',        pervasive (y, x) -> y % x

monadic '⍳', 'Index generate', (x) -> [0 ... floor num x]

dyadic  '⍳', 'Index of', (b, a) ->
  if isSimple a then a = [a]
  else assert shapeOf(a).length <= 1, 'Left argument to ⍳ must be of rank no more than 1.'
  if isSimple b then b = [b]
  for y in b
    pos = a.length
    for x, i in a when match x, y then pos = i; break
    pos

monadic '?', 'Roll', pervasive (x) -> floor random() * max 0, floor num x
dyadic '?', 'Deal', (y, x) ->
  x = max 0, floor num x
  y = max 0, floor num y
  assert x <= y, 'Domain error: left argument of ? must not be greater than its right argument.'
  available = [0...y]
  for [0...x] then available.splice(floor(available.length * random()), 1)[0]

monadic '⋆', 'Exponentiate', pervasive (x) -> exp num x
dyadic '⋆', 'To the power of', pervasive (y, x) -> pow num(x), num(y)
monadic '⍟', 'Natural logarithm', pervasive (x) -> log x
dyadic '⍟', 'Logarithm to the base', pervasive (y, x) -> log(y) / log(x)

monadic '○', 'Pi times', pervasive (x) -> PI * x
dyadic '○', 'Circular and hyperbolic functions', pervasive (x, i) ->
  switch i
    when 0 then sqrt(1 - x * x)
    when 1 then sin x
    when 2 then cos x
    when 3 then tan x
    when 4 then sqrt(1 + x * x)
    when 5 then (exp(2 * x) - 1) / 2 # sinh
    when 6 then (exp(2 * x) + 1) / 2 # cosh
    when 7 then ex = exp(2 * x); (ex - 1) / (ex + 1) # tanh
    when -1 then asin x
    when -2 then acos x
    when -3 then atan x
    when -4 then sqrt(x * x - 1)
    when -5 then log(x + sqrt(x * x + 1)) # arcsinh
    when -6 then log(x + sqrt(x * x - 1)) # arccosh
    when -7 then log((1 + x) / (1 - x)) / 2 # arctanh
    else die 'Unknown circular or hyperbolic function ' + i

monadic '!', 'Factorial', pervasive (a) ->
  n = a = floor num a # todo: "Gamma" function for non-integer argument
  r = 1; (if n > 1 then for i in [2 .. n] then r *= i); r

dyadic '!', 'Binomial', pervasive (b, a) ->
  k = a = floor num a
  n = b = floor num b
  if not (0 <= k <= n) then return 0 # todo: Special cases for negatives and non-integers
  if 2 * k > n then k = n - k # do less work
  r = 1; (if k > 0 then for i in [1 .. k] then r = r * (n - k + i) / i); r

monadic '⌹', 'Matrix inverse' # todo
dyadic '⌹', 'Matrix divide' # todo

dyadic '<', 'Less than', pervasive (y, x) -> +(x < y)
dyadic '≤', 'Less than or equal', pervasive (y, x) -> +(x <= y)
dyadic '=', 'Equal', pervasive (y, x) -> +(x is y)
dyadic '>', 'Greater than', pervasive (y, x) -> +(x > y)
dyadic '≥', 'Greater than or equal', pervasive (y, x) -> +(x >= y)
dyadic '≠', 'Not equal', pervasive (y, x) -> +(x isnt y)

monadic '≡', 'Depth', depthOf = (a) ->
  if isSimple a then return 0
  r = 0; (for x in a then r = max r, depthOf x); r + 1

dyadic '≡', 'Match', match = (b, a) ->
  if isSimple(a) and isSimple(b) then return +(a is b)
  if isSimple(a) isnt isSimple(b) then return 0
  # Compare by shape
  sa = shapeOf a
  sb = shapeOf b
  if sa.length isnt sb.length then return 0
  for i in [0...sa.length] when sa[i] isnt sb[i] then return 0
  # Compare by elements
  if a.length isnt b.length then return 0
  for i in [0...a.length] then if not match a[i], b[i] then return 0
  # Compare by prototype
  if a.length then return 1
  if not (a.aplPrototype? or b.aplPrototype?) then return 1
  match prototypeOf(a), prototypeOf(b)

dyadic '≢', 'Not match', (b, a) -> +not match b, a

monadic '∈', 'Enlist', (a) ->
  r = []
  rec = (x) -> (if isSimple x then r.push x else for y in x then rec y); r
  rec a

dyadic '∈', 'Membership', (b, a) ->
  a = array a
  b = array b
  withShape a.shape, (for x in a then +(x in b))

dyadic '⍷', 'Find', (b, a) ->
  sa = shapeOf a
  sb = shapeOf b
  if isSimple b then return isSimple(a) and match b, a
  if isSimple a then a = [a]
  r = withShape sb, (for [0...b.length] then 0)
  if sa.length > sb.length then return r
  while sa.length < sb.length then sa.unshift 1
  for i in [0...sb.length] then if sa[i] > sb[i] then return r

  indices = Array sb.length

  rec = (d, ir) ->
    if d < sb.length
      for i in [0 ... sb[d] - sa[d] + 1]
        indices[d] = i
        rec d + 1, ir * sb[d] + i
    else
      r[ir] = rec2 0, 0, 0

  rec2 = (d, ia, ib) ->
    if d < sb.length
      for i in [0...sa[d]]
        if not rec2 d + 1, ia * sa[d] + i, ib * sb[d] + indices[d] + i
          return 0
      1
    else
      match a[ia], b[ib]

  rec 0, 0
  r

monadic '∪', 'Unique' # todo
dyadic '∪', 'Union' # todo
dyadic '∩', 'Intersection' # todo
monadic '∼', 'Not', pervasive (x) -> +!bool(x)
dyadic '∼', 'Without', (b, a) ->
  if isSimple a then a = [a]
  else assert shapeOf(a).length <= 1, 'Left argument to ∼ must be of rank no more than 1.'
  if isSimple b then b = [b]
  r = []
  for x in a
    excluded = false
    for y in b
      if match x, y
        excluded = true
        break
    if not excluded
      r.push x
  r

dyadic '∨', 'Or', pervasive (y, x) ->
  x = abs num x
  y = abs num y
  assert x is floor(x) and y is floor(y), '∨ is defined only for integers'
  if x is 0 and y is 0 then return 0
  if x < y then [x, y] = [y, x]
  while y then [x, y] = [y, x % y] # Euclid's algorithm
  x

dyadic '∧', 'And', pervasive (y, x) ->
  x = abs num x
  y = abs num y
  assert x is floor(x) and y is floor(y), '∧ is defined only for integers'
  if x is 0 or y is 0 then return 0
  p = x * y
  if x < y then [x, y] = [y, x]
  while y then [x, y] = [y, x % y] # Euclid's algorithm
  p / x # LCM(x, y) = x * y / GCD(x, y)

dyadic '⍱', 'Nor', pervasive (y, x) -> +!(bool(x) or bool(y))
dyadic '⍲', 'Nand', pervasive (y, x) -> +!(bool(x) and bool(y))

monadic '⍴', 'Shape of', shapeOf
dyadic '⍴', 'Reshape', (b, a) ->
  if isSimple a then a = [a]
  if isSimple b then b = [b]
  a =
    for x in a
      assert typeof x is 'number', 'Domain error: Left argument to ⍴ must be a numeric scalar or vector.'
      max 0, floor x
  withShape a, withPrototypeCopiedFrom b, (for i in [0...prod a] then b[i % b.length])

# Helper for functions `,` and `⍪`
catenate = (b, a, axis = -1) ->
  sa = shapeOf a; if sa.length is 0 then sa = [1]; a = [a]
  sb = shapeOf b; if sb.length is 0 then sb = [1]; b = [b]
  assert sa.length is sb.length, 'Length error: Cannot catenate arrays of different ranks'
  if axis < 0 then axis += sa.length
  for i in [0...sa.length] when sa[i] isnt sb[i] and i isnt axis
    die 'Length error: Catenated arrays must match at all axes exept the one to catenate on'
  ni = prod sa[...axis]       # number of items across all dimensions before `axis'
  nja = sa[axis]              # number of items across `axis' in `a'
  njb = sb[axis]              # number of items across `axis' in `b'
  nk = prod sa[axis + 1 ...]  # number of items across all dimensions after `axis'
  r = []
  for i in [0...ni]
    for j in [0...nja] then for k in [0...nk] then r.push a[k + nk * (j + nja * i)]
    for j in [0...njb] then for k in [0...nk] then r.push b[k + nk * (j + njb * i)]
  sr = for x in sa then x
  sr[axis] += sb[axis]
  withShape sr, r

monadic ',', 'Ravel', (a) -> array(a)[0...]
dyadic ',', 'Catenate', catenate
dyadic '⍪', '1st axis catenate', (b, a) -> catenate b, a, 0

monadic '⌽', 'Reverse', reverse = (b, _1, axis = -1) ->
  sb = shapeOf b
  if sb.length is 0 then return b
  if axis < 0 then axis += sb.length
  assert 0 <= axis < sb.length, 'Axis out of bounds'
  ni = prod sb[...axis]
  nj = sb[axis]
  nk = prod sb[axis + 1 ...]
  r = []
  for i in [0...ni]
    for j in [nj - 1 .. 0] by -1
      for k in [0...nk]
        r.push b[k + nk*(j + nj*i)]
  withShape sb, r

dyadic '⌽', 'Rotate', (b, a) ->
  a = num a
  if a is 0 or isSimple(b) or (b.length <= 1) then return b
  sb = shapeOf b
  n = sb[sb.length - 1]
  a %= n; if a < 0 then a += n
  withShape sb, (for i in [0...b.length] then b[i - (i % n) + ((i % n) + a) % n])

monadic '⊖', '1st axis reverse', (b, _1, axis = 0) -> reverse b, undefined, axis

dyadic '⊖', '1st axis rotate', (b, a) ->
  a = num a
  if a is 0 or isSimple(b) or (b.length <= 1) then return b
  sb = shapeOf b
  n = sb[0]
  k = b.length / n
  a %= n; if a < 0 then a += n
  withShape sb, (for i in [0...b.length] then b[((floor(i / k) + a) % n) * k + (i % k)])

monadic '⍉', 'Transpose', (a) ->
  sa = shapeOf a
  if sa.length <= 1 then return a # has no effect on scalars or vectors
  sr = sa[0...].reverse()
  psr = [1] # partial products over sr
  for i in [0 ... sa.length - 1] then psr.push psr[i] * sr[i]
  r = []
  rec = (d, i) ->
    if d >= sa.length then r.push a[i]
    else for j in [0...sr[d]] then rec d + 1, i + j*psr[d]
    0
  rec 0, 0
  withShape sr, r

monadic '↑', 'First', (a) ->
  a = array(a)
  if a.length then a[0] else prototypeOf a

dyadic '↑', 'Take', (b, a) ->
  if isSimple a then a = [a]
  for x in a
    assert typeof x is 'number', 'Domain error: Left argument to ↑ must be a numeric scalar or vector.'
  if isSimple(b) and a.length is 1 then b = [b]
  sb = shapeOf b
  assert a.length is sb.length, 'Length error: Left argument to ↑ must have as many elements as is the rank of its right argument.'
  r = []
  pa = for [0...a.length] then 0
  pa[a.length - 1] = 1
  i = a.length - 2; while i >= 0 then pa[i] = pa[i + 1] * a[i + 1]; i--
  filler = prototypeOf b
  rec = (d, i, k) ->
    if d >= sb.length
      r.push b[i]
    else
      k /= sb[d]
      if a[d] >= 0
        for j in [0 ... min a[d], sb[d]] then rec d + 1, i + j * k, k
        if sb[d] < a[d]
          for [0 ... (a[d] - sb[d]) * pa[d]] then r.push filler
      else
        if sb[d] + a[d] < 0
          for [0 ... -(sb[d] + a[d]) * pa[d]] then r.push filler
        for j in [max(0, sb[d] + a[d]) ... sb[d]] then rec d + 1, i + j * k, k
    0
  rec 0, 0, b.length
  withShape a, withPrototype filler, r

dyadic '↓', 'Drop', (b, a) ->
  if isSimple a then a = [a]
  for x in a when typeof x isnt 'number' or x isnt floor x
    die 'Left argument to ↓ must be an integer or a vector of integers.'
  if isSimple b then b = withShape (for [0...a.length] then 1), b
  sb = shapeOf b
  if a.length > sb.length
    die 'The left argument to ↓ must have length less than or equal to the rank of its right argument.'
  for [a.length...sb.length] then a.push 0
  lims =
    for i in [0...a.length]
      if a[i] >= 0
        [min(a[i], sb[i]), sb[i]]
      else
        [0, max(0, sb[i] + a[i])]
  r = []
  rec = (d, i, n) ->
    if d >= sb.length
      r.push b[i]
    else
      n /= sb[d]
      for j in [lims[d][0]...lims[d][1]]
        rec d + 1, i + j*n, n
    0
  rec 0, 0, b.length
  sr = for [lo, hi] in lims then hi - lo
  withShape sr, r

monadic '⊂', 'Enclose', (a) -> if isSimple a then a else withShape [], [a]
dyadic '⊂', 'Partition (with axis)' # todo

monadic '⊃', 'Disclose', (a) ->
  if isSimple a then return a
  sa = shapeOf a
  if sa.length is 0 then return a[0]
  sr1 = shapeOf(a[0])[0...]
  for x in a[1...]
    sx = shapeOf x
    if sx.length isnt sr1.length
      die 'The argument of ⊃ must contain elements of the same rank.' # todo: or scalars
    for i in [0...sr1.length]
      sr1[i] = max sr1[i], sx[i]
  sr = shapeOf(a).concat sr1
  r = []
  for x in a
    sx = shapeOf x
    rec = (d, i, n, N) -> # d: dimension, i: index in x, n: block size in x, N: block size in r
      if d >= sr1.length
        r.push x[i]
      else
        n /= sx[d]
        N /= sr1[d]
        for j in [0...sx[d]]
          rec d + 1, i + j * n, n, N
        if sr1[d] > sx[d]
          filler = prototypeOf x
          for [0 ... N * (sr1[d] - sx[d])]
            r.push filler
    rec 0, 0, x.length, prod sr1
  withShape sr, r

dyadic '⊃', 'Pick'

dyadic '⌷', 'Index', (b, a) ->
  # `(a0 a1 ...)⌷b` is equivalent to `b[a0;a1;...]`
  if isSimple a then a = [a]
  assert (not a.shape) or a.shape.length <= 1, 'Indices must be a scalar or a vector, not a higher-dimensional array.'
  sb = shapeOf b
  if typeof b is 'function' then return (y, x) -> b y, x, a
  assert a.length is sb.length, 'The number of indices must be equal to the rank of the indexable.'
  a = for x, i in a
        if isSimple x then withShape [], [x]
        else if not x.length then [0...sb[i]]
        else x
  for x, d in a then for y in x when not (typeof y is 'number' and y is floor(y))
    die 'Indices must be integers'
  for x, d in a then for y in x when not (0 <= y < sb[d])
    die 'Index out of bounds'
  sr = []; for x in a then sr = sr.concat shapeOf x
  r = []
  rec = (d, i, n) ->
    if d >= a.length then r.push b[i]
    else for x in a[d] then rec d + 1, i + (x * n / sb[d]), n / sb[d]
    0
  rec 0, 0, b.length
  if sr.length is 0 then r[0] else withShape sr, r

# Helper for `⍋` and `⍒`
grade = (b, a, direction) ->
  if not b? then b = a; a = []
  sa = shapeOf a
  sb = shapeOf b
  assert sa.length, 'Left argument to ⍋ or ⍒ must be non-scalar.'
  if sb.length is 0 then return b
  n = sa[sa.length - 1] # length along last axis
  h = {} # maps a character to its index in the collation
  for i in [0...a.length] then h[a[i]] = i % n
  m = b.length / sb[0]
  r = [0...sb[0]]
  r.sort (i, j) ->
    for k in [0...m]
      x = b[m*i + k]
      y = b[m*j + k]
      tx = typeof x
      ty = typeof y
      if tx < ty then return -direction
      if tx > ty then return direction
      if h[x]? then x = h[x]
      if h[y]? then y = h[y]
      if x < y then return -direction
      if x > y then return direction
    0
  r

monadic '⍋', 'Grade up', (b, a) -> grade b, a, 1
monadic '⍒', 'Grade down', (b, a) -> grade b, a, -1

monadic '⊤', 'Encode', (b, a) ->
  sa = shapeOf a
  sb = shapeOf b
  if isSimple a then a = [a]
  if isSimple b then b = [b]
  r = Array a.length * b.length
  n = if sa.length then sa[0] else 1
  m = a.length / n
  for i in [0...m]
    for j in [0...b.length]
      y = b[j]
      for k in [n - 1 .. 0]
        x = a[k * m + i]
        if x is 0
          r[(k * m + i) * b.length + j] = y
          y = 0
        else
          r[(k * m + i) * b.length + j] = y % x
          y = round((y - (y % x)) / x)
  withShape sa.concat(sb), r

monadic '⊥', 'Decode', (b, a) ->
  sa = shapeOf a
  sb = shapeOf b
  lastDimA = if sa.length then sa[sa.length - 1] else 1
  firstDimB = if sb.length then sb[0] else 1
  assert lastDimA is 1 or firstDimB is 1 or lastDimA is firstDimB, 'Incompatible shapes for ⊥ ("Decode")'
  if isSimple a then a = [a]
  if isSimple b then b = [b]
  r = []
  for i in [0 ... a.length / lastDimA]
    for j in [0 ... b.length / firstDimB]
      x = a[i * lastDimA ... (i + 1) * lastDimA]
      y = for k in [0...firstDimB] then b[j + k * (b.length / firstDimB)]
      if x.length is 1 then x = for [0...y.length] then x[0]
      if y.length is 1 then y = for [0...x.length] then y[0]
      z = y[0]
      for k in [1...y.length]
        z = z * x[k] + y[k]
      r.push z
  if sa.length <= 1 and sb.length <= 1
    r[0]
  else
    withShape sa[...-1].concat(sb[1...]), r

monadic '⍕', 'Format'
dyadic '⍕', 'Format by example or specification'
monadic '⍎', 'Execute'
monadic '⊣', 'Stop'
dyadic '⊣', 'Left'
monadic '⊢', 'Pass'
dyadic '⊢', 'Right'

# `⍬` Zilde (niladic function)
builtins['get_⍬'] = -> withShape [], []



# # Built-in operators

# Helper for / and ⌿ in their operator sense
reduce = (f, _, axis = -1) -> (b, a) ->
  invokedAsMonadic = not a?
  if invokedAsMonadic then a = 0
  a = floor num a
  isBackwards = a < 0; if isBackwards then a = -a
  b = array b
  sb = shapeOf b
  if axis < 0 then axis += sb.length
  n = sb[axis]
  if a is 0 then a = n
  if sb.length is 1
    items = b
  else
    sItem = sb[...axis].concat sb[axis + 1 ...] # shape of an item
    k = prod sb[axis + 1 ...]
    items = for [0...n] then withShape sItem, []
    for i in [0...b.length] then items[floor(i / k) % n].push b[i]
  r =
    if isBackwards
      for i in [0 ... n - a + 1]
        x = items[i + a - 1]; (for j in [i + a - 2 ... i - 1] by -1 then x = f x, items[j]); x
    else
      for i in [0 ... n - a + 1]
        x = items[i]; (for j in [i + 1 ... i + a] by 1 then x = f x, items[j]); x
  if invokedAsMonadic then r[0] else r

# Helper for / and ⌿ in their function sense
compressOrReplicate = (b, a, axis = -1) ->
  sb = shapeOf b
  if axis < 0 then axis += sb.length
  assert 0 <= axis < sb.length, 'Axis out of bounds'
  sr = sb[0...]
  sr[axis] = 0
  assert shapeOf(a).length <= 1, 'Left argument to / must be an integer or a vector of integers'
  if not a.length then a = for [0...sb[axis]] then a

  nNonNegative = 0 # number of non-negative elements in a
  for x in a
    assert typeof x is 'number' and x is floor x, 'Left argument to / must be an integer or a vector of integers'
    sr[axis] += abs x
    nNonNegative += (x >= 0)

  isExtensive = true; isExpansive = isHyperexpansive = false
  if sb[axis] isnt 1
    isExtensive = false
    isExpansive = a.length is sb[axis]
    isHyperexpansive = not isExpansive
    assert((not isHyperexpansive) or nNonNegative is sb[axis],
      'For A/B, the length of B along the selected axis ' +
      'must be equal either to one, ' +                 # extension
      'or the length of A, ' +                          # expansion
      'or to the number of non-negative elements in A.' # hyperexpansion
    )
  r = []
  ni = prod sb[... axis]
  nj = sb[axis]
  nk = prod sb[axis + 1 ...]
  for i in [0...ni]
    j = 0
    for x in a
      if x > 0
        for [0...x]
          for k in [0...nk]
            r.push b[k + nk*(j + nj*i)]
        j += isExpansive or isHyperexpansive
      else
        filler = prototypeOf(if isExpansive then [b[nk*(j + nj*i)]] else [b[nk*nj*i]])
        for [0...-x*nk]
          r.push filler
        j += isExpansive

  withShape sr, r

postfixOperator '/', 'Reduce, compress, or replicate', (b, a, axis = -1) ->
  if typeof b is 'function'
    reduce b, undefined, axis
  else
    compressOrReplicate b, a, axis

postfixOperator '⌿', '1st axis reduce, compress, or replicate', (b, a, axis = 0) ->
  if typeof b is 'function'
    reduce b, undefined, axis
  else
    compressOrReplicate b, a, axis

# Helper for `\` and `⍀` in their operator sense
scan = (f, _, axis = -1) -> (a, _1) ->
  assert not _1?, 'Scan can only be applied monadically.'
  sa = shapeOf a
  if sa.length is 0 then return a
  if axis < 0 then axis += sa.length
  r = Array a.length
  ni = prod sa[...axis]
  nj = sa[axis]
  nk = prod sa[axis + 1 ...]
  for i in [0...ni]
    for k in [0...nk]
      x = r[k + nk*nj*i] = a[k + nk*nj*i]
      for j in [1...nj]
        ijk = k + nk * (j + nj * i)
        x = r[ijk] = f x, a[ijk]
  withShape shapeOf(a), r

# Helper for `\` and `⍀` in their function sense
expand = ->
  # todo

postfixOperator '\\', 'Scan or expand', (b, a, axis = -1) ->
  if typeof b is 'function'
    scan b, undefined, axis
  else
    expand b, a, axis

postfixOperator '⍀', '1st axis scan or expand', (b, a, axis = 0) ->
  if typeof b is 'function'
    scan b, undefined, axis
  else
    expand b, a, axis

postfixOperator '¨', 'Each', (f) -> (b, a) ->
  if not a? then return (for x in array b then f x)
  if isSimple a then return (for x in array b then f x, a)
  if a.length is b.length then return (for i in [0...a.length] then f b[i], a[i])
  if a.length is 1 then return (for x in b then f x, a[0])
  if b.length is 1 then return (for x in a then f b[0], x)
  die 'Length error'

prefixOperator '∘.', 'Outer product', outerProduct = (f) ->
  assert typeof f is 'function'
  (b, a) ->
    assert b?, 'Operator ∘. (Outer product) works only with dyadic functions'
    a = array a
    b = array b
    r = []
    for x in a
      for y in b
        r.push f x, y
    withShape (shapeOf a).concat(shapeOf b), r

# todo: the general formula for higher dimensions is
# `A f.g B   <=>   f/¨ (⊂[⍴⍴A]A)∘.g ⊂[1]B`
infixOperator '.', 'Inner product', (f, g) ->
  F = reduce f
  G = outerProduct g
  (b, a) ->
    assert shapeOf(a).length <= 1 and shapeOf(b).length <= 1, 'Inner product operator (.) is implemented only for arrays of rank no more than 1.'
    F g b, a

infixOperator '⍣', 'Power operator', (f, n) ->
  if typeof f is 'number' and typeof n is 'function'
    [f, n] = [n, f]
  else
    assert typeof f is 'function' and typeof n is 'number'
  (y, x) ->
    for [0...n] then y = f y, x
    y

builtins['set_⎕'] = (x) -> console.info x; x

endOfBuiltins()
