if typeof define isnt 'function' then define = require('amdefine')(module)

# This file contains an implementation of APL's built-in functions and
# operators.

# # JavaScript representation of APL arrays

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
# APL arrays are not necessarily homogenous, they may contain data of mixed
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
#       - A rank-zero APL array is a JavaScript array of size one with a
#       `shape` property of `[]`, e.g. created by:
#
#               var a = [123]; a.shape = [];
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
#       A vector's representation, as opposed to that of higher-dimensional
#       arrays, is not required to have a `shape` property.  The shape of a
#       vector `v` is assumed to be `[v.length]`, by convention.  Similarly, we
#       could say that a scalar's shape is `[]` by convention.
#
# ## APL prototypes
#
# Every object in APL, including empty arrays, has a _prototype_ used whenever
# "padding material" is needed, such as in the _take_ function:
#
#     5 ↑ 1 2 3     ⍝ returns      1 2 3 0 0
#     5 ↑ 'abc'     ⍝ returns      'abc  '
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

define (require) ->
  {assert, die, inherit, isSimple, shapeOf, withShape, prod, prototypeOf, withPrototype, withPrototypeCopiedFrom} = require './helpers'
  {min, max, floor, ceil, round, abs, random, exp, pow, log, PI, sqrt, sin, cos, tan, asin, acos, atan} = Math



  # # Type coersion helpers

  array = (x) ->
    if isSimple x then (x = [x]).shape = []
    x

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

  builtins = {}

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
  prefixOperator  = (a...) -> ((def tmp.monadic, a...).aplMetaInfo ?= {}).isPrefixOperator = true
  postfixOperator = (a...) -> ((def tmp.monadic, a...).aplMetaInfo ?= {}).isPostfixOperator = true
  infixOperator   = (a...) -> ((def tmp.dyadic,  a...).aplMetaInfo ?= {}).isInfixOperator = true

  withMetaInfoFrom = (f, g) ->
    assert typeof f is 'function'
    assert typeof g is 'function'
    g.aplMetaInfo = if f.aplMetaInfo then inherit f.aplMetaInfo else {}
    g

  # Overloadable functions
  #
  #     x ← «{'⍟': function (y) { return y + 1234; }}» ◇ x ⍟ 1     ⍝ returns 1235
  #     x ← «{'⍟': function (y) { return y + 1234; }}» ◇ 1 ⍟ x     ⍝ returns 1235
  #     x ← «{'⍟': function (y) { return y + 1234; }}» ◇ x ⍟ 1 1   ⍝ returns 1235 1235
  #     x ← «{'⍟': function (y) { return y + 1234; }}» ◇ x x ⍟ 1   ⍝ returns 1235 1235
  #     x ← «{'⍟': function () { return 1234; }}» ◇ ⍟ x            ⍝ returns 1234
  #     x ← «{'⍟': function () { return 1234; }}» ◇ ⍟ x            ⍝ returns 1234
  #     x ← «{'⍟': function () { return 1234; }}» ◇ ⍟ x x          ⍝ returns 1234 1234
  overloadable = (symbol, f) ->
    assert typeof symbol is 'string'
    assert typeof f is 'function'
    withMetaInfoFrom f,
      (b, a, args...) ->
        if typeof b?[symbol] is 'function' then b[symbol] a, args...
        else if typeof a?[symbol] is 'function' then a[symbol] b, args...
        else f b, a, args...

  ambivalent = (symbol, f1, f2) ->
    assert typeof symbol is 'string'
    if not (f1 and f2) then return f1 or f2
    assert typeof f1 is 'function'
    assert typeof f2 is 'function'
    F = (b, a, args...) -> if a? then f2 b, a, args... else f1 b, a, args...

  endOfBuiltins = ->
    ks = (for k of tmp.monadic then k).concat(for k of tmp.dyadic when not tmp.monadic[k]? then k)
    for k in ks
      f1 = tmp.monadic[k]
      if f1?
        f1 = overloadable k, f1
        f1 = maybeMakePervasive f1
      f2 = tmp.dyadic[k]
      if f2?
        f2 = overloadable k, f2
        f2 = maybeMakePervasive f2
      builtins[k] = ambivalent(k, f1, f2)
    tmp = null

  # `pervasive(f)` only marks `f` as pervasive.  It will actually be made
  # pervasive later in `endOfBuiltins()`.
  pervasive = (f) ->
    assert typeof f is 'function'
    (f.aplMetaInfo ?= {}).isPervasive = true
    f

  # `maybeMakePervasive(f)` is a decorator which takes a scalar function `f` and makes it
  # propagate through arrays, if it has `f.aplMetaInfo.isPervasive`.
  maybeMakePervasive = (f) ->
    assert typeof f is 'function'
    if not f.aplMetaInfo?.isPervasive
      f
    else
      withMetaInfoFrom f, (F = (b, a) ->
        if a? # dyadic pervasiveness
          if (not isSimple a) and a.length is 1 and isSimple a[0] then a = a[0]
          if (not isSimple b) and b.length is 1 and isSimple b[0] then b = b[0]
          if isSimple(b) and isSimple(a) then f b, a
          else if isSimple a then withShape b.shape, (for x in b then F x, a)
          else if isSimple b then withShape a.shape, (for x in a then F b, x)
          else
            sa = shapeOf a; sb = shapeOf b
            for i in [0 ... min sa.length, sb.length]
              assert sa[i] is sb[i], 'Length error'
            if sa.length > sb.length
              k = prod sa[sb.length...]
              withShape sa, (for i in [0...a.length] then F b[floor i / k], a[i])
            else if sa.length < sb.length
              k = prod sb[sa.length...]
              withShape sb, (for i in [0...b.length] then F b[i], a[floor i / k])
            else
              withShape sa, (for i in [0...a.length] then F b[i], a[i])
        else # monadic pervasiveness
          if isSimple b then f b
          else withShape b.shape, (for x in b then F x)
      )



  # # Built-in functions

  # Conjugate (`+`)
  #
  #     +4              ⍝ returns 4
  #     ++4             ⍝ returns 4
  #     + 4 5           ⍝ returns 4 5
  #     +((5 6) (7 1))  ⍝ returns (5 6) (7 1)
  #     + (5 6) (7 1)   ⍝ returns (5 6) (7 1)
  monadic '+', 'Conjugate',      pervasive (x) -> x

  # Add (`+`)
  #
  #     1 + 2                           ⍝ returns 3
  #     2 3 + 5 8                       ⍝ returns 7 11
  #     (2 3 ⍴ 1 2 3 4 5 6) +       ¯2  ⍝ returns 2 3 ⍴ ¯1 0 1 2 3 4
  #     (2 3 ⍴ 1 2 3 4 5 6) +   2 ⍴ ¯2  ⍝ returns 2 3 ⍴ ¯1 0 1 2 3 4
  #     (2 3 ⍴ 1 2 3 4 5 6) + 2 3 ⍴ ¯2  ⍝ returns 2 3 ⍴ ¯1 0 1 2 3 4
  #     1 2 3 + 4 5                     ⍝ fails 'Length error'
  #     (2 3⍴⍳6) + 3 2⍴⍳6               ⍝ fails 'Length error'
  dyadic  '+', 'Add',            pervasive (y, x) -> x + y

  # Negate (`−`)
  #
  #     −4         ⍝ returns ¯4
  #     − 1 2 3    ⍝ returns ¯1 ¯2 ¯3
  monadic '−', 'Negate',         pervasive (x) -> -x

  # Subtract (`−`)
  #
  #     1 − 3      ⍝ returns ¯2
  #     5 − ¯3     ⍝ returns 8
  dyadic  '−', 'Subtract',       pervasive (y, x) -> x - y

  # Sign of (`×`)
  #
  #     × ¯2 ¯1 0 1 2 ⍝ returns ¯1 ¯1 0 1 1
  #     × 0÷0         ⍝ returns 0
  monadic '×', 'Sign of',        pervasive (x) -> (x > 0) - (x < 0)

  # Multiply (`×`)
  #
  #     7 × 8       ⍝ returns 56
  dyadic  '×', 'Multiply',       pervasive (y, x) -> x * y

  # Reciprocal (`÷`)
  #
  #     ÷2          ⍝ returns .5
  monadic '÷', 'Reciprocal',     pervasive (x) -> 1 / x

  # Divide (`÷`)
  #
  #     27 ÷ 9      ⍝ returns 3
  dyadic  '÷', 'Divide',         pervasive (y, x) -> x / y

  # Ceiling (`⌈`)
  #
  #     ⌈ 0 5 ¯5 (○1) ¯1.5   ⍝ returns 0 5 ¯5 4 ¯1
  monadic '⌈', 'Ceiling',        pervasive (x) -> ceil x

  # Greater of (`⌈`)
  #
  #     3 ⌈ 5       ⍝ returns 5
  dyadic  '⌈', 'Greater of',     pervasive (y, x) -> max x, y

  # Floor (`⌊`)
  #
  #     ⌊ 0 5 ¯5 (○1) ¯1.5   ⍝ returns 0 5 ¯5 3 ¯2
  monadic '⌊', 'Floor',          pervasive (x) -> floor x

  # Lesser of (`⌊`)
  #
  #     3 ⌊ 5       ⍝ returns 3
  dyadic  '⌊', 'Lesser of',      pervasive (y, x) -> min x, y

  # Absolute value (`∣`)
  #
  #     ∣ ¯8 0 8 ¯3.5   ⍝ returns 8 0 8 3.5
  monadic '∣', 'Absolute value', pervasive (x) -> abs x

  # Residue (`∣`)
  #
  #     3 ∣ 5       ⍝ returns 2
  dyadic  '∣', 'Residue',        pervasive (y, x) -> y % x

  # Index generate (`⍳`)
  #
  #     ⍳ 5         ⍝ returns 0 1 2 3 4
  #     ⍴ ⍳ 5       ⍝ returns 1 ⍴ 5
  #     ⍳ 0         ⍝ returns ⍬
  #     ⍴ ⍳ 0       ⍝ returns ,0
  #     ⍳ 2 3 4     ⍝ returns 2 3 4 3 ⍴
  #...
  #...                        0 0 0
  #...                        0 0 1
  #...                        0 0 2
  #...                        0 0 3
  #...
  #...                        0 1 0
  #...                        0 1 1
  #...                        0 1 2
  #...                        0 1 3
  #...
  #...                        0 2 0
  #...                        0 2 1
  #...                        0 2 2
  #...                        0 2 3
  #...
  #...                        1 0 0
  #...                        1 0 1
  #...                        1 0 2
  #...                        1 0 3
  #...
  #...                        1 1 0
  #...                        1 1 1
  #...                        1 1 2
  #...                        1 1 3
  #...
  #...                        1 2 0
  #...                        1 2 1
  #...                        1 2 2
  #...                        1 2 3
  #
  #     ⍴⍳ 2 3 4    ⍝ returns 2 3 4 3
  monadic '⍳', 'Index generate', (a) ->
    if typeof a is 'number' then return (for i in [0...a] by 1 then i)
    for x in a then assert typeof x is 'number'
    r = []
    indices = for i in [0...a.length] by 1 then 0
    i = 0
    while i >= 0
      for v in indices then r.push v
      i = a.length - 1
      while i >= 0 and ++indices[i] is a[i]
        indices[i--] = 0
    withShape a.concat(shapeOf a), r

  # Index of (`⍳`)
  #
  #     2 5 9 14 20 ⍳ 9                           ⍝ returns 1 ⍴ 2
  #     2 5 9 14 20 ⍳ 6                           ⍝ returns 1 ⍴ 5
  #     "GORSUCH" ⍳ "S"                           ⍝ returns 1 ⍴ 3
  #     "ABCDEFGHIJKLMNOPQRSTUVWXYZ" ⍳ "CARP"     ⍝ returns 2 0 17 15
  #     "ABCDEFGHIJKLMNOPQRSTUVWXYZ" ⍳ "PORK PIE" ⍝ returns 15 14 17 10 26 15 8 4
  #     "MON" "TUES" "WED" ⍳ "MON" "THURS"        ⍝ returns 0 3
  #     1 3 2 0 3 ⍳ ⍳ 5                           ⍝ returns 3 0 2 1 5
  #     "CAT" "DOG" "MOUSE" ⍳ "DOG" "BIRD"        ⍝ returns 1 3
  dyadic  '⍳', 'Index of', (b, a) ->
    if isSimple a then a = [a]
    else assert shapeOf(a).length <= 1, 'Left argument to ⍳ must be of rank no more than 1.'
    if isSimple b then b = [b]
    for y in b
      pos = a.length
      for x, i in a when match x, y then pos = i; break
      pos

  # Roll (`?`)
  #
  #     n←6 ◇ r←?n ◇ (0≤r)∧(r<n)   ⍝ returns 1
  #     ?0                         ⍝ returns 0
  #     ?1                         ⍝ returns 0
  monadic '?', 'Roll', pervasive (x) -> floor random() * max 0, floor num x

  # Deal (`?`)
  #
  #     n←100 ◇ (+/n?n)=(+/⍳n)   ⍝ returns 1 # a permutation (an "n?n" dealing) contains all numbers 0...n
  #     n←100 ◇ A←(n÷2)?n ◇ ∧/(0≤A),A<n   ⍝ returns 1 # any number x in a dealing is 0 <= x < n
  #     0 ? 100  ⍝ returns ⍬
  #     0 ? 0    ⍝ returns ⍬
  #     1 ? 1    ⍝ returns ,0
  #     5 ? 3    ⍝ fails
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

  Gamma = (x) ->
    p = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
         771.32342877765313, -176.61502916214059, 12.507343278686905,
         -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7]
    if x < 0.5 then return PI / (sin(PI * x) * Gamma(1 - x))
    x--
    a = p[0]
    t = x + 7.5
    for i in [1...p.length]
      a += p[i] / (x + i)
    return sqrt(2 * PI) * pow(t, x + 0.5) * exp(-t) * a

  # Factorial (`!`)
  #
  #     !5    ⍝ returns 120
  #     !21   ⍝ returns 51090942171709440000
  #     !0    ⍝ returns 1
  monadic '!', 'Factorial', pervasive factorial = (x) ->
    if 0 <= x < 25 and x is floor x
      r = 1; i = 2; (while i <= x then r *= i++); r
    else if x < -150
      0
    else if x > 150
      1 / 0
    else
      Gamma(x + 1)

  # Binomial (`!`)
  #
  #     2 ! 4         ⍝ returns 6
  #     3 ! 20        ⍝ returns 1140
  #     2 ! 6 12 20   ⍝ returns 15 66 190
  #     (2 3 ⍴ 1 + ⍳ 6) ! 2 3 ⍴ 3 6 9 12 15 18   ⍝ returns 2 3⍴ 3 15 84 495 3003 18564
  dyadic '!', 'Binomial', pervasive (n, k) ->
    if 0 <= k < 100 and 0 <= n < 100 and n is floor(n) and k is floor(k)
      if n < k then return 0
      if 2 * k > n then k = n - k # do less work
      u = v = 1
      for i in [0...k] by 1 then (u *= n - i; v *= i + 1)
      u / v
    else
      factorial(n) / (factorial(k) * factorial(n - k))

  monadic '⌹', 'Matrix inverse' # todo
  dyadic '⌹', 'Matrix divide' # todo

  dyadic '<', 'Less than', pervasive (y, x) -> +(x < y)
  dyadic '≤', 'Less than or equal', pervasive (y, x) -> +(x <= y)

  # Equals (`=`)
  #
  #     12 = 12               ⍝ returns 1
  #     2 = 12                ⍝ returns 0
  #     "Q" = "Q"             ⍝ returns 1
  #     1 = "1"               ⍝ returns 0
  #     "1" = 1               ⍝ returns 0
  #     11 7 2 9 = 11 3 2 6   ⍝ returns 1 0 1 0
  #     "STOAT" = "TOAST"     ⍝ returns 0 0 0 0 1
  #     8 = 2 + 2 + 2 + 2     ⍝ returns 1
  #     (2 3⍴1 2 3 4 5 6) = 2 3⍴3 3 3 5 5 5   ⍝ returns 2 3 ⍴ 0 0 1 0 1 0
  #     3 = 2 3⍴1 2 3 4 5 6   ⍝ returns 2 3 ⍴ 0 0 1 0 0 0
  #     3 = (2 3⍴1 2 3 4 5 6) (2 3⍴3 3 3 5 5 5)   ⍝ returns (2 3 ⍴ 0 0 1 0 0 0) (2 3 ⍴ 1 1 1 0 0 0)
  dyadic '=', 'Equal', pervasive (y, x) -> +(x is y)

  dyadic '>', 'Greater than', pervasive (y, x) -> +(x > y)
  dyadic '≥', 'Greater than or equal', pervasive (y, x) -> +(x >= y)
  dyadic '≠', 'Not equal', pervasive (y, x) -> +(x isnt y)

  # Depth (`≡`)
  #
  #     ≡4                             ⍝ returns 0
  #     ≡⍳4                            ⍝ returns 1
  #     ≡2 2⍴⍳4                        ⍝ returns 1
  #     ≡"abc" 1 2 3 (23 55)           ⍝ returns 2
  #     ≡"abc" (2 4⍴("abc" 2 3 "k"))   ⍝ returns 3
  monadic '≡', 'Depth', depthOf = (a) ->
    if isSimple a then return 0
    r = 0; (for x in a then r = max r, depthOf x); r + 1

  # Match (`≡`)
  #
  #     3≡3                       ⍝ returns 1
  #     3≡,3                      ⍝ returns 0
  #     4 7.1 8 ≡ 4 7.2 8         ⍝ returns 0
  #     (3 4⍴⍳12) ≡ 3 4⍴⍳12       ⍝ returns 1
  #     (3 4⍴⍳12) ≡ ⊂3 4⍴⍳12      ⍝ returns 0
  #     ("ABC" "DEF") ≡ "ABCDEF"  ⍝ returns 0
  #     (⍳0)≡""                   ⍝ returns 0
  #     (2 0⍴0)≡(0 2⍴0)           ⍝ returns 0
  #     (0⍴1 2 3)≡0⍴⊂2 2⍴⍳4       ⍝ returns 0
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

  # Not match (`≢`)
  #
  #     3≢3   ⍝ returns 0
  dyadic '≢', 'Not match', (b, a) -> +not match b, a

  # Enlist (`∈`)
  #
  #     ∈ 17                        ⍝ returns ,17
  #     ⍴ ∈ (1 2 3) "ABC" (4 5 6)   ⍝ returns ,9
  #     ∈ 2 2⍴(1 + 2 2⍴⍳4) "DEF" (1 + 2 3⍴⍳6) (7 8 9)   ⍝ returns 1 2 3 4,'DEF',1 2 3 4 5 6 7 8 9
  monadic '∈', 'Enlist', (a) ->
    r = []
    rec = (x) -> (if isSimple x then r.push x else for y in x then rec y); r
    rec a

  # Membership (`∈`)
  #
  #     2 3 4 5 6 ∈ 1 2 3 5 8 13 21   ⍝ returns 1 1 0 1 0
  #     5 ∈ 1 2 3 5 8 13 21           ⍝ returns 1
  dyadic '∈', 'Membership', (b, a) ->
    b = array b
    if isSimple a then +(a in b) else withShape a.shape, (for x in a then +(x in b))

  # Find (`⍷`)
  #
  #     "AN"⍷"BANANA"                          ⍝ returns 0 1 0 1 0 0
  #     "BIRDS" "NEST"⍷"BIRDS" "NEST" "SOUP"   ⍝ returns 1 0 0
  #     "ME"⍷"HOME AGAIN"                      ⍝ returns 0 0 1 0 0 0 0 0 0 0
  #
  #     "DAY"⍷7 9⍴"SUNDAY   MONDAY   TUESDAY  WEDNESDAYTHURSDAY FRIDAY   SATURDAY "
  #...        ⍝ returns 7 9 ⍴
  #...                        0 0 0 1 0 0 0 0 0
  #...                        0 0 0 1 0 0 0 0 0
  #...                        0 0 0 0 1 0 0 0 0
  #...                        0 0 0 0 0 0 1 0 0
  #...                        0 0 0 0 0 1 0 0 0
  #...                        0 0 0 1 0 0 0 0 0
  #...                        0 0 0 0 0 1 0 0 0
  #
  #     (2 2⍴"ABCD")⍷"ABCD"   ⍝ returns 4 ⍴ 0
  #     (1 2) (3 4) ⍷ "START" (1 2 3) (1 2) (3 4)   ⍝ returns 0 0 1 0
  #
  #     (2 2⍴7 8 12 13)⍷ 1+ 4 5⍴⍳20   ⍝ returns 4 5 ⍴ 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0
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

  # Unique (`∪`)
  #
  #     ∪ 3 17 17 17 ¯3 17 0   ⍝ returns 3 17 ¯3 0
  #     ∪ 3 17                 ⍝ returns 3 17
  #     ∪ 17                   ⍝ returns ,17
  #     ∪ ⍬                    ⍝ returns ⍬
  monadic '∪', 'Unique', (a) ->
    r = []
    for x in array a when not contains r, x then r.push x
    r

  contains = (a, x) -> # a helper
    for y in a when match x, y then return true
    false

  # Union (`∪`)
  #
  #     1 2 ∪ 2 3   ⍝ returns 1 2 3
  #     'SHOCK' ∪ 'CHOCOLATE'   ⍝ returns 'SHOCKLATE'
  #
  #     'lentils' 'bulghur' (3 4 5) ∪ 'lentils' 'rice'
  #...         ⍝ returns 'lentils' 'bulghur' (3 4 5) 'rice'
  dyadic '∪', 'Union', (b, a) ->
    a = array a
    b = array b
    a.concat(for x in b when not contains a, x then x)

  # Intersection (`∩`)
  #
  #     'ABRA'∩'CAR'      ⍝ returns 'ARA'
  #     1 'PLUS' 2 ∩ ⍳5   ⍝ returns 1 2
  dyadic '∩', 'Intersection', (b, a) ->
    a = array a
    b = array b
    for x in a when contains b, x then x

  monadic '∼', 'Not', pervasive (x) ->
    +!bool(x)

  # Without (`∼`)
  #
  #     "ABCDEFGHIJKLMNOPQRSTUVWXYZ" ∼ "AEIOU"   ⍝ returns 'BCDFGHJKLMNPQRSTVWXYZ'
  #     1 2 3 4 5 6 ∼ 2 4 6                ⍝ returns 1 3 5
  #     "THIS IS TEXT" ∼ " "               ⍝ returns 'THISISTEXT'
  #     "THIS" "AND" "THAT" ∼ "T"          ⍝ returns 'THIS' 'AND' 'THAT'
  #     "THIS" "AND" "THAT" ∼ "AND"        ⍝ returns 'THIS' 'AND' 'THAT'
  #     "THIS" "AND" "THAT" ∼ ⊂"AND"       ⍝ returns 'THIS' 'THAT'
  #     "THIS" "AND" "THAT" ∼ "TH" "AND"   ⍝ returns 'THIS' 'THAT'
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

  # Or (LCM) (`∨`)
  #
  #     1∨1                ⍝ returns 1
  #     1∨0                ⍝ returns 1
  #     0∨1                ⍝ returns 1
  #     0∨0                ⍝ returns 0
  #     0 0 1 1 ∨ 0 1 0 1  ⍝ returns 0 1 1 1
  #     12∨18              ⍝ returns 6   # 12=2×2×3, 18=2×3×3
  #     299∨323            ⍝ returns 1   # 299=13×23, 323=17×19
  #     12345∨12345        ⍝ returns 12345
  #     0∨123              ⍝ returns 123
  dyadic '∨', 'Or', pervasive (y, x) ->
    x = abs num x
    y = abs num y
    assert x is floor(x) and y is floor(y), '∨ is defined only for integers'
    if x is 0 and y is 0 then return 0
    if x < y then [x, y] = [y, x]
    while y then [x, y] = [y, x % y] # Euclid's algorithm
    x

  # And (GCD) (`∧`)
  #
  #     1∧1                                     ⍝ returns 1
  #     1∧0                                     ⍝ returns 0
  #     0∧1                                     ⍝ returns 0
  #     0∧0                                     ⍝ returns 0
  #     0 0 1 1 ∧ 0 1 0 1                       ⍝ returns 0 0 0 1
  #     0 0 0 1 1 ∧ 1 1 1 1 0                   ⍝ returns 0 0 0 1 0
  #     t ← 3 3 ⍴ 1 1 1 0 0 0 1 0 1  ◇  1 ∧ t   ⍝ returns 3 3 ⍴ 1 1 1 0 0 0 1 0 1
  #     t ← 3 3 ⍴ 1 1 1 0 0 0 1 0 1  ◇  ∧/ t    ⍝ returns 1 0 0
  #     12∧18                                   ⍝ returns 36    # 12=2×2×3, 18=2×3×3
  #     299∧323                                 ⍝ returns 96577 # 299=13×23, 323=17×19
  #     12345∧12345                             ⍝ returns 12345
  #     0∧123                                   ⍝ returns 0
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

  # Reshape (`⍴`)
  #
  #     ⍴ 1 2 3 ⍴ 0    ⍝ returns 1 2 3
  #     ⍴ ⍴ 1 2 3 ⍴ 0  ⍝ returns ,3
  #     3 3 ⍴ ⍳ 4      ⍝ returns 3 3 ⍴ 0 1 2 3 0 1 2 3 0
  #     ⍴ 3 3 ⍴ ⍳ 4    ⍝ returns 3 3
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
      die 'Length error: Catenated arrays must match at all axes except the one to catenate on'
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

  # Ravel (`,`)
  monadic ',', 'Ravel', (a) -> array(a)[0...]

  # Catenate (`,`)
  #
  #     10,66                ⍝ returns 10, 66
  #     '10 ','MAY ','1985'  ⍝ returns '10 MAY 1985'
  dyadic ',', 'Catenate', catenate

  # 1st axis catenate (`⍪`)
  dyadic '⍪', '1st axis catenate', (b, a) -> catenate b, a, 0

  # Reverse (`⌽`)
  #
  #     ⌽ 1 2 3 4 5 6                    ⍝ returns 6 5 4 3 2 1
  #     ⌽ (1 2) (3 4) (5 6)              ⍝ returns (5 6) (3 4) (1 2)
  #     ⌽ "BOB WON POTS"                 ⍝ returns 'STOP NOW BOB'
  #     ⌽    2 5 ⍴ 1 2 3 4 5 6 7 8 9 0   ⍝ returns 2 5 ⍴ 5 4 3 2 1 0 9 8 7 6
  #     ⌽[0] 2 5 ⍴ 1 2 3 4 5 6 7 8 9 0   ⍝ returns 2 5 ⍴ 6 7 8 9 0 1 2 3 4 5
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

  # Rotate (`⌽`)
  #
  #     1 ⌽ 1 2 3 4 5 6                   ⍝ returns 2 3 4 5 6 1
  #     3 ⌽ 'ABCDEFGH'                    ⍝ returns 'DEFGHABC'
  #     3 ⌽ 2 5 ⍴  1 2 3 4 5  6 7 8 9 0   ⍝ returns 2 5 ⍴ 4 5 1 2 3 9 0 6 7 8
  #     ¯2 ⌽ "ABCDEFGH"                   ⍝ returns 'GHABCDEF'
  #     1 ⌽ 3 3 ⍴ ⍳ 9                     ⍝ returns 3 3 ⍴ 1 2 0 4 5 3 7 8 6
  dyadic '⌽', 'Rotate', (b, a) ->
    a = num a
    if a is 0 or isSimple(b) or (b.length <= 1) then return b
    sb = shapeOf b
    n = sb[sb.length - 1]
    a %= n; if a < 0 then a += n
    withShape sb, (for i in [0...b.length] then b[i - (i % n) + ((i % n) + a) % n])

  # 1st axis reverse (`⊖`)
  #
  #     ⊖ 1 2 3 4 5 6                   ⍝ returns 6 5 4 3 2 1
  #     ⊖ (1 2) (3 4) (5 6)             ⍝ returns (5 6) (3 4) (1 2)
  #     ⊖ 'BOB WON POTS'                ⍝ returns 'STOP NOW BOB'
  #     ⊖    2 5 ⍴ 1 2 3 4 5 6 7 8 9 0  ⍝ returns 2 5 ⍴ 6 7 8 9 0 1 2 3 4 5
  #     ⊖[1] 2 5 ⍴ 1 2 3 4 5 6 7 8 9 0  ⍝ returns 2 5 ⍴ 5 4 3 2 1 0 9 8 7 6
  monadic '⊖', '1st axis reverse', (b, _1, axis = 0) -> reverse b, undefined, axis

  # 1st axis rotate (`⊖`)
  #
  #     1 ⊖ 3 3 ⍴ ⍳ 9   ⍝ returns 3 3 ⍴ 3 4 5 6 7 8 0 1 2
  dyadic '⊖', '1st axis rotate', (b, a) ->
    a = num a
    if a is 0 or isSimple(b) or (b.length <= 1) then return b
    sb = shapeOf b
    n = sb[0]
    k = b.length / n
    a %= n; if a < 0 then a += n
    withShape sb, (for i in [0...b.length] then b[((floor(i / k) + a) % n) * k + (i % k)])

  # Transpose (`⍉`)
  #
  #     ⍉ 2 3 ⍴ 1 2 3 6 7 8     ⍝ returns 3 2 ⍴ 1 6 2 7 3 8
  #     ⍴ ⍉ 2 3 ⍴ 1 2 3 6 7 8   ⍝ returns 3 2
  #     ⍉ 1 2 3                 ⍝ returns 1 2 3
  #     ⍉ 2 3 4 ⍴ ⍳ 24          ⍝ returns 4 3 2 ⍴
  #...                               0 12   4 16    8 20
  #...                               1 13   5 17    9 21
  #...                               2 14   6 18   10 22
  #...                               3 15   7 19   11 23
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

  # Take (`↑`)
  #
  #     5 ↑ 'ABCDEFGH'           ⍝ returns 'ABCDE'
  #     ¯3 ↑ 'ABCDEFGH'          ⍝ returns 'FGH'
  #     3 ↑ 22 2 19 12           ⍝ returns 22 2 19
  #     ¯1 ↑ 22 2 19 12          ⍝ returns ,12
  #     ⍴ 1 ↑ (2 2 ⍴ ⍳ 4) (⍳ 10) ⍝ returns ,1
  #     5 ↑ 40 92 11             ⍝ returns 40 92 11 0 0
  #     ¯5 ↑ 40 92 11            ⍝ returns 0 0 40 92 11
  #     3 3 ↑ 1 1 ⍴ 0            ⍝ returns 3 3 ⍴ 0 0 0 0 0 0 0 0 0
  #     5 ↑ "abc"                ⍝ returns 'abc  '
  #     ¯5 ↑ "abc"               ⍝ returns '  abc'
  #     3 3 ↑ 1 1 ⍴ "a"          ⍝ returns 3 3 ⍴ 'a        '
  #     2 3 ↑ 1 + 4 3 ⍴ ⍳ 12     ⍝ returns 2 3 ⍴ 1 2 3 4 5 6
  #     ¯1 3 ↑ 1 + 4 3 ⍴ ⍳ 12    ⍝ returns 1 3 ⍴ 10 11 12
  #     1 2 ↑ 1 + 4 3 ⍴ ⍳ 12     ⍝ returns 1 2 ⍴ 1 2
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
    withShape (for x in a then abs x), withPrototype filler, r

  # Drop (`↓`)
  #
  #     4↓'OVERBOARD'              ⍝ returns 'BOARD'
  #     ¯5↓'OVERBOARD'             ⍝ returns 'OVER'
  #     ⍴10↓'OVERBOARD'            ⍝ returns ,0
  #     0 ¯2↓ 3 3 ⍴ 'ONEFATFLY'    ⍝ returns 3 1 ⍴ 'OFF'
  #     ¯2 ¯1↓ 3 3 ⍴ 'ONEFATFLY'   ⍝ returns 1 2 ⍴ 'ON'
  #     1↓ 3 3 ⍴ 'ONEFATFLY'       ⍝ returns 2 3 ⍴ 'FATFLY'
  #     1 1↓ 2 3 4⍴"ABCDEFGHIJKLMNOPQRSTUVWXYZ"    ⍝ returns 1 2 4 ⍴ 'QRSTUVWX'
  #     ¯1 ¯1↓ 2 3 4⍴"ABCDEFGHIJKLMNOPQRSTUVWXYZ"  ⍝ returns 1 2 4 ⍴ 'ABCDEFGH'
  #
  # todo: more tests
  #
  #     //#gives '1 ↓[1] 2 3 4⍴1+⍳24', [5..12].concat [17..24] # todo: drop with axis specification
  #     //#gives '1 ↓[2] 2 3 4⍴1+⍳24', [3, 4, 7, 8, 11, 12, 15, 16, 19, 20, 23, 24] # todo
  #     //#gives '1 ↓[2 1] 2 3 4⍴1+⍳24', [7, 8, 11, 12, 19, 20, 23, 24] # todo
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

  # Enclose (`⊂`)
  #
  #     ⍴ ⊂ 2 3⍴⍳6    ⍝ returns ⍬
  #     ⍴⍴ ⊂ 2 3⍴⍳6   ⍝ returns ,0
  monadic '⊂', 'Enclose', (a) -> if isSimple a then a else withShape [], [a]

  # Partition (with axis) (`⊂`)
  dyadic '⊂', 'Partition (with axis)' # todo

  # Disclose (`⊃`)
  #
  #     ⊃ (1 2 3) (4 5 6)   ⍝ returns 2 3 ⍴ 1 2 3 4 5 6
  #     ⍴⊃ (1 2 3) (4 5 6)  ⍝ returns 2 3
  #     ⊃ (1 2) (3 4 5)     ⍝ returns 2 3 ⍴ 1 2 0 3 4 5
  #     ⍴⊃ (1 2) (3 4 5)    ⍝ returns 2 3
  #     ⊃ (1 2 3) "AB"      ⍝ returns 2 3 ⍴ 1 2 3,'AB '
  #     ⍴⊃ (1 2 3) "AB"     ⍝ returns 2 3
  #     ⊃123                ⍝ returns 123
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

  dyadic '⊃', 'Pick' # todo

  # Index (`⌷`)
  #
  # `a0 a1...⌷b` is equivalent to `b[a0;a1;...]`
  #
  #    1 ⌷ 3 5 8                ⍝ returns 5
  #    (3 5 8)[1]               ⍝ returns 5
  #    ⌷←{⍺+¨⍵}  ◇  (3 5 8)[1]  ⍝ returns 4 6 9
  #    (2 2 0) (1 2) ⌷ 3 3⍴⍳9   ⍝ returns 3 2 ⍴ 7 8 7 8 1 2
  #    ¯1 ⌷ 3 5 8               ⍝ fails
  #    2 ⌷ 111 222 333 444      ⍝ returns 333
  #    (⊂3 2) ⌷ 111 222 333 444 ⍝ returns 444 333
  #    (⊂2 3⍴2 0 3 0 1 2) ⌷ 111 222 333 444   ⍝ returns 2 3⍴333 111 444 111 222 333
  #    1 0    ⌷3 4⍴11 12 13 14 21 22 23 24 31 32 33 34   ⍝ returns 21
  #    1      ⌷3 4⍴11 12 13 14 21 22 23 24 31 32 33 34   ⍝ returns 21 22 23 24
  #    2 (1 0)⌷3 4⍴11 12 13 14 21 22 23 24 31 32 33 34   ⍝ returns 32 31
  #    (1 2) 0⌷3 4⍴11 12 13 14 21 22 23 24 31 32 33 34   ⍝ returns 21 31
  dyadic '⌷', 'Index', (b, a, axes = null) ->
    if typeof b is 'function' then return (y, x) -> b y, x, a
    a = array a
    sr = [].concat a...
    assert shapeOf(a).length <= 1, 'Indices must be a scalar or a vector, not a higher-dimensional array.'
    sb = shapeOf b
    assert a.length <= sb.length, 'The number of indices must not exceed the rank of the indexable.'
    axes = if axes is null then [0...a.length] else array axes
    assert shapeOf(axes).length <= 1, 'Axes must be a scalar or a vector, not a higher-dimensional array.'
    assert a.length is axes.length, 'The number of indices must be equal to the number of axes specified.'
    a1 = for x in sb then null
    for axis, i in axes
      assert (typeof axis is 'number' and axis is floor axis), 'Axes must be integers'
      assert (0 <= axis < sb.length), 'Invalid axis'
      assert not contains(axes[...i], axis), 'Duplicate axis'
      a1[axis] = array a[i]
    a = a1
    for x, i in a when x is null
      a[i] = [0...sb[i]]
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
    if not a? then a = []
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

  # Grade up/down (`⍋`)
  #
  #     ⍋13 8 122 4                          ⍝ returns 3 1 0 2
  #     a←13 8 122 4  ◇  a[⍋a]               ⍝ returns 4 8 13 122
  #     ⍋"ZAMBIA"                            ⍝ returns 1 5 3 4 2 0
  #     s←"ZAMBIA"  ◇  s[⍋s]                 ⍝ returns 'AABIMZ'
  #     t←3 3⍴"BOBALFZAK"  ◇  ⍋t             ⍝ returns 1 0 2
  #     t←3 3⍴4 5 6 1 1 3 1 1 2  ◇  ⍋t       ⍝ returns 2 1 0
  #
  #     t←3 3⍴4 5 6 1 1 3 1 1 2  ◇  t[⍋t;]
  #...         ⍝ returns 3 3 ⍴    1 1 2
  #...                            1 1 3
  #...                            4 5 6
  #
  #     a←3 2 3⍴2 3 4 0 1 0 1 1 3 4 5 6 1 1 2 10 11 12  ◇  a[⍋a;;]
  #...      ⍝ returns 3 2 3 ⍴
  #...           1  1  2
  #...          10 11 12
  #...
  #...           1  1  3
  #...           4  5  6
  #...
  #...           2  3  4
  #...           0  1  0
  #
  #     a←3 2 5⍴"joe  doe  bob  jonesbob  zwart"  ◇  a[⍋a;;]
  #...      ⍝ returns 3 2 5 ⍴ 'bob  jonesbob  zwartjoe  doe  '
  #
  #     "ZYXWVUTSRQPONMLKJIHGFEDCBA"⍋"ZAMBIA"   ⍝ returns 0 2 4 3 1 5
  #     ⎕A←"ABCDEFGHIJKLMNOPQRSTUVWXYZ" ◇ (⌽⎕A)⍋3 3⍴"BOBALFZAK"   ⍝ returns 2 0 1
  #
  #     data←6 4⍴"ABLEaBLEACREABELaBELACES"
  #...    ◇ coll←2 26⍴"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
  #...    ◇ data[coll⍋data;]
  #...      ⍝ returns 6 4 ⍴ 'ABELaBELABLEaBLEACESACRE'
  #
  #     data←6 4⍴"ABLEaBLEACREABELaBELACES"
  #...    ◇ coll1←"AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz"
  #...    ◇ data[coll1⍋data;]
  #...      ⍝ returns 6 4 ⍴ 'ABELABLEACESACREaBELaBLE'
  monadic '⍋', 'Grade up', (b, a) -> grade b, a, 1

  # Grade down (`⍒`)
  #
  #     ⍒3 1 8   ⍝ returns 2 0 1
  monadic '⍒', 'Grade down', (b, a) -> grade b, a, -1

  # Encode (`⊤`)
  #
  #     1760 3 12⊤75          ⍝ returns 2 0 3
  #     3 12⊤75               ⍝ returns 0 3
  #     100000 12⊤75          ⍝ returns 6 3
  #     16 16 16 16⊤100       ⍝ returns 0 0 6 4
  #     1760 3 12⊤75.3        ⍝ returns 2 0 (75.3−72)
  #     0 1⊤75.3              ⍝ returns 75 (75.3−75)
  #     2 2 2 2 2⊤1 2 3 4 5   ⍝ returns 5 5 ⍴
  #...                              0 0 0 0 0
  #...                              0 0 0 0 0
  #...                              0 0 0 1 1
  #...                              0 1 1 0 0
  #...                              1 0 1 0 1
  #
  #    10⊤5 15 125 ⍝ returns 5 5 5
  #    0 10⊤5 15 125 ⍝ returns 2 3⍴ 0 1 12 5 5 5
  #
  #    (8 3⍴ 2 0 0
  #...       2 0 0
  #...       2 0 0
  #...       2 0 0
  #...       2 8 0
  #...       2 8 0
  #...       2 8 16
  #...       2 8 16) ⊤ 75
  #...   ⍝ returns 8 3⍴
  #...         0 0 0
  #...         1 0 0
  #...         0 0 0
  #...         0 0 0
  #...         1 0 0
  #...         0 1 0
  #...         1 1 4
  #...         1 3 11
  monadic '⊤', 'Encode', (b, a) ->
    sa = shapeOf a
    sb = shapeOf b
    if isSimple a then a = [a]
    if isSimple b then b = [b]
    r = Array a.length * b.length
    n = if sa.length then sa[0] else 1
    m = a.length / n
    for i in [0...m]
      for y, j in b
        if isNeg = (y < 0) then y = -y
        for k in [n - 1 .. 0] by -1
          x = a[k * m + i]
          if x is 0
            r[(k * m + i) * b.length + j] = y
            y = 0
          else
            r[(k * m + i) * b.length + j] = y % x
            y = round((y - (y % x)) / x)
    withShape sa.concat(sb), r

  # Decode (`⊥`)
  #
  #     10 ⊥ 3 2 6 9                        ⍝ returns 3269
  #     8 ⊥ 3 1                             ⍝ returns 25
  #     1760 3 12 ⊥ 1 2 8                   ⍝ returns 68
  #     2 2 2 ⊥ 1                           ⍝ returns 7
  #     0 20 12 4 ⊥ 2 15 6 3                ⍝ returns 2667
  #     1760 3 12 ⊥ 3 3⍴1 1 1 2 0 3 0 1 8   ⍝ returns 60 37 80
  #     60 60 ⊥ 3 13                        ⍝ returns 193
  #     0 60 ⊥ 3 13                         ⍝ returns 193
  #     60 ⊥ 3 13                           ⍝ returns 193
  #     2 ⊥ 1 0 1 0                         ⍝ returns 10
  #     2 ⊥ 1 2 3 4                         ⍝ returns 26
  #     3 ⊥ 1 2 3 4                         ⍝ returns 58
  #
  #     #gives '(1j1 ⊥ 1 2 3 4) = 5j9', 1 # todo: ⊥ for complex numbers
  #
  #    M ← 3 8 ⍴
  #...                   0 0 0 0 1 1 1 1
  #...                   0 0 1 1 0 0 1 1
  #...                   0 1 0 1 0 1 0 1
  #... ◇ A ← 4 3 ⍴
  #...                   1 1 1
  #...                   2 2 2
  #...                   3 3 3
  #...                   4 4 4
  #... ◇ A ⊥ M
  #...      ⍝ returns 4 8⍴
  #...          0 1 1 2  1  2  2  3
  #...          0 1 2 3  4  5  6  7
  #...          0 1 3 4  9 10 12 13
  #...          0 1 4 5 16 17 20 21
  #
  #    M ← 3 8 ⍴
  #...          0 0 0 0 1 1 1 1
  #...          0 0 1 1 0 0 1 1
  #...          0 1 0 1 0 1 0 1
  #... ◇ 2 ⊥ M
  #...      ⍝ returns 0 1 2 3 4 5 6 7
  #
  #    M ← 3 8 ⍴
  #...          0 0 0 0 1 1 1 1
  #...          0 0 1 1 0 0 1 1
  #...          0 1 0 1 0 1 0 1
  #... ◇ A ← 2 1 ⍴ 2 10
  #... ◇ A ⊥ M
  #...      ⍝ returns 2 8⍴
  #...          0 1  2  3   4   5   6   7
  #...          0 1 10 11 100 101 110 111
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

  monadic '⍕', 'Format' # todo
  dyadic '⍕', 'Format by example or specification' # todo

  # Execute (`⍎`)
  #
  #     ⍎ '+/ 2 2 ⍴ 1 2 3 4'  ⍝ returns 3 7
  #     ⍴ ⍎ '123 456'         ⍝ returns ,2
  #     ⍎ '{⍵⋆2} ⍳5'          ⍝ returns 0 1 4 9 16
  #     ⍎ 'undefinedVariable' ⍝ fails
  #     ⍎ '1 2 (3'            ⍝ fails
  monadic '⍎', 'Execute', (b) ->
    s = ''
    for c in array b
      assert typeof c is 'string', 'The argument to ⍎ must be a character or a string.'
      s += c
    require('./compiler').exec s

  monadic '⊣', 'Stop', (b) -> []
  dyadic '⊣', 'Left', (b, a) -> a
  monadic '⊢', 'Pass', (b) -> b
  dyadic '⊢', 'Right', (b, a) -> b

  # Zilde (`⍬`)
  #
  #     ⍬     ⍝ returns 0⍴0
  #     ⍴⍬    ⍝ returns ,0
  #     ⍬←5   ⍝ fails
  #     ⍳ 0   ⍝ returns ⍬
  #     ⍴ 0   ⍝ returns ⍬
  #     ⍬     ⍝ returns ⍬
  #     ⍬⍬    ⍝ returns ⍬ ⍬
  #     1⍬2⍬3 ⍝ returns 1 ⍬ 2 ⍬ 3
  builtins['get_⍬'] = -> []
  builtins['set_⍬'] = -> die 'Symbol zilde (⍬) is read-only.'

  # Index origin (`⎕IO`)
  #
  # The index origin is fixed at 0.  Reading it returns 0.  Attempts to set it
  # to anything other than that fail.
  #
  #     ⎕IO     ⍝ returns 0
  #     ⎕IO←0   ⍝ returns 0
  #     ⎕IO←1   ⍝ fails
  builtins['get_⎕IO'] = -> 0
  builtins['set_⎕IO'] = (x) -> if x isnt 0 then throw Error 'The index origin (⎕IO) is fixed at 0' else x



  # # Built-in operators

  # Helper for `/` and `⌿` in their operator sense
  reduce = (f, _, axis = -1) -> (b, a) ->
    invokedAsMonadic = not a?
    if invokedAsMonadic then a = 0
    a = floor num a
    isBackwards = a < 0; if isBackwards then a = -a
    b = if isSimple b then [b] else b
    sb = shapeOf b
    if axis < 0 then axis += sb.length
    assert 0 <= axis < sb.length, 'Invalid axis'
    n = sb[axis]
    if a is 0 then a = n
    if sb.length is 1
      items = b
    else
      sItem = sb[...axis].concat sb[axis + 1 ...] # shape of an item
      k = prod sb[axis + 1 ...]
      items = for [0...n] then []
      for i in [0...b.length] then items[floor(i / k) % n].push b[i]
      for i in [0...n] then items[i] = withShape sItem, items[i]
    r =
      if isBackwards
        for i in [0 ... n - a + 1]
          x = items[i + a - 1]; (for j in [i + a - 2 ... i - 1] by -1 then x = f items[j], x); x
      else
        for i in [0 ... n - a + 1]
          x = items[i]; (for j in [i + 1 ... i + a] by 1 then x = f items[j], x); x
    if invokedAsMonadic then r[0] else r

  # Helper for `/` and `⌿` in their function sense
  compressOrReplicate = (b, a, axis = -1) ->
    if isSimple b then b = [b]
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

  # Reduce, compress, or replicate (`/`)
  #
  # Reduce
  #
  #     +/ 3                       ⍝ returns 3
  #     +/ 3 5 8                   ⍝ returns 16
  #     +/ 2 4 6                   ⍝ returns 12
  #     ⌈/ 82 66 93 13             ⍝ returns 93
  #     ×/ 2 3 ⍴ 1 2 3 4 5 6       ⍝ returns 6 120
  #     2 ,/ 'AB' 'CD' 'EF' 'HI'   ⍝ returns 'ABCD' 'CDEF' 'EFHI'
  #     3 ,/ 'AB' 'CD' 'EF' 'HI'   ⍝ returns 'ABCDEF' 'CDEFHI'
  #
  # N-Wise reduce
  #
  #     2 +/ 1 + ⍳10    ⍝ returns 3 5 7 9 11 13 15 17 19
  #     5 +/ 1 + ⍳10    ⍝ returns 15 20 25 30 35 40
  #     10 +/ 1 + ⍳10   ⍝ returns ,55
  #     11 +/ 1 + ⍳10   ⍝ returns ⍬
  #     2 −/ 3 4 9 7    ⍝ returns ¯1 ¯5 2
  #     ¯2 −/ 3 4 9 7   ⍝ returns 1 5 ¯2
  #
  # Compress
  #
  #     0 1 0 1 / 'ABCD'                                ⍝ returns 'BD'
  #     1 1 1 1 0 / 12 14 16 18 20                      ⍝ returns 12 14 16 18
  #     MARKS←45 60 33 50 66 19 ◇ (MARKS≥50)/MARKS      ⍝ returns 60 50 66
  #     MARKS←45 60 33 50 66 19 ◇ (MARKS=50)/⍳↑⍴MARKS   ⍝ returns ,3
  #     1/"FREDERIC"                                    ⍝ returns 'FREDERIC'
  #     0/"FREDERIC"                                    ⍝ returns ⍬
  #     0 1 0  / 1+2 3⍴⍳6                               ⍝ returns 2 1 ⍴ 2 5
  #     1 0 /[0] 1+2 3⍴⍳6                               ⍝ returns 1 3 ⍴ 1 2 3
  #     1 0 ⌿    1+2 3⍴⍳6                               ⍝ returns 1 3 ⍴ 1 2 3
  #     3 / 5                                           ⍝ returns 5 5 5
  #
  # Replicate
  #
  #     2 ¯2 2 / 1+2 3⍴⍳6                 ⍝ returns 2 6 ⍴  1 1 0 0 3 3  4 4 0 0 6 6
  #     2 ¯2 2 ¯2 2 / 1+2 3⍴⍳6            ⍝ returns 2 10 ⍴  1 1 0 0 2 2 0 0 3 3  4 4 0 0 5 5 0 0 6 6
  #     1 1 ¯2 1 1 / 1 2 (2 2⍴⍳4) 3 4     ⍝ returns 1 2 (2 2⍴0) (2 2⍴0) 3 4
  #     1 1 ¯2 1 1 1 / 1 2 (2 2⍴⍳4) 3 4   ⍝ returns 1 2 0 0 (2 2⍴0 1 2 3) 3 4
  #     2 3 2 / "ABC"                     ⍝ returns 'AABBBCC'
  #     2 / "DEF"                         ⍝ returns 'DDEEFF'
  #     5 0 5 / 1 2 3                     ⍝ returns 1 1 1 1 1 3 3 3 3 3
  #     2 / 1+2 3⍴⍳6                      ⍝ returns 2 6 ⍴  1 1 2 2 3 3  4 4 5 5 6 6
  #     2 ⌿ 1+2 3⍴⍳6                      ⍝ returns 4 3 ⍴  1 2 3  1 2 3  4 5 6  4 5 6
  #     2 3 / 3 1⍴"ABC"                   ⍝ returns 3 5 ⍴ 'AAAAABBBBBCCCCC'
  #     2 ¯1 2 /[1] 3 1⍴(7 8 9)           ⍝ returns 3 5 ⍴ 7 7 0 7 7 8 8 0 8 8 9 9 0 9 9
  #     2 ¯1 2 /[1] 3 1⍴"ABC"             ⍝ returns 3 5 ⍴ 'AA AABB BBCC CC'
  #     2 ¯2 2 / 7                        ⍝ returns 7 7 0 0 7 7
  postfixOperator '/', 'Reduce, compress, or replicate', (b, a, axis = -1) ->
    if typeof b is 'function'
      reduce b, undefined, axis
    else
      compressOrReplicate b, a, axis

  # 1st axis reduce, compress, or replicate (`⌿`)
  #
  #     +⌿ 2 3 ⍴ 1 2 3 10 20 30   ⍝ returns 11 22 33
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
          x = r[ijk] = f a[ijk], x
    withShape shapeOf(a), r

  # Helper for `\` and `⍀` in their function sense
  expand = ->
    # todo

  # Scan or expand (`\`)
  #
  #     +\ 20 10 ¯5 7              ⍝ returns 20 30 25 32
  #     ,\ "AB" "CD" "EF"          ⍝ returns 'AB' 'ABCD' 'ABCDEF'
  #     ×\ 2 3⍴5 2 3 4 7 6         ⍝ returns 2 3 ⍴ 5 10 30 4 28 168
  #     ∧\ 1 1 1 0 1 1             ⍝ returns 1 1 1 0 0 0
  # //#gives '−\1 2 3 4', [1, -1, 2, -2] # todo
  #     ∨\ 0 0 1 0 0 1 0           ⍝ returns 0 0 1 1 1 1 1
  #     +\ 1 2 3 4 5               ⍝ returns 1 3 6 10 15
  #     +\ (1 2 3)(4 5 6)(7 8 9)   ⍝ returns (1 2 3) (5 7 9) (12 15 18)
  #     M←2 3⍴1 2 3 4 5 6 ◇ +\M    ⍝ returns 2 3 ⍴ 1 3 6 4 9 15
  #     M←2 3⍴1 2 3 4 5 6 ◇ +⍀M    ⍝ returns 2 3 ⍴ 1 2 3 5 7 9
  # #gives 'M←2 3⍴1 2 3 4 5 6 ◇ +\[0]M', [1, 2, 3, 5, 7, 9] # todo
  #     ,\ 'ABC'                   ⍝ returns (↑'A') 'AB' 'ABC'
  #     T←"ONE(TWO) BOOK(S)" ◇ ≠\T∈"()"   ⍝ returns 0 0 0 1 1 1 1 0 0 0 0 0 0 1 1 0
  #     T←"ONE(TWO) BOOK(S)" ◇ ((T∈"()")⍱≠\T∈"()")/T   ⍝ returns 'ONE BOOK'
  postfixOperator '\\', 'Scan or expand', (b, a, axis = -1) ->
    if typeof b is 'function'
      scan b, undefined, axis
    else
      expand b, a, axis

  # 1st axis scan or expand (`⍀`)
  postfixOperator '⍀', '1st axis scan or expand', (b, a, axis = 0) ->
    if typeof b is 'function'
      scan b, undefined, axis
    else
      expand b, a, axis

  # Each (`¨`)
  #
  #     ⍴¨ (0 0 0 0) (0 0 0)                 ⍝ returns (,4) (,3)
  #     ⍴¨ "MONDAY" "TUESDAY"                ⍝ returns (,6) (,7)
  #     ⍴    (2 2⍴⍳4) (⍳10) 97.3 (3 4⍴"K")   ⍝ returns ,4
  #     ⍴¨   (2 2⍴⍳4) (⍳10) 97.3 (3 4⍴"K")   ⍝ returns (2 2) (,10) ⍬ (3 4)
  #     ⍴⍴¨  (2 2⍴⍳4) (⍳10) 97.3 (3 4⍴"K")   ⍝ returns ,4
  #     ⍴¨⍴¨ (2 2⍴⍳4) (⍳10) 97.3 (3 4⍴"K")   ⍝ returns (,2) (,1) (,0) (,2)
  #     (1 2 3) ,¨ 4 5 6                     ⍝ returns (1 4) (2 5) (3 6)
  #     2 3 ↑¨ 'MONDAY' 'TUESDAY'            ⍝ returns 'MO' 'TUE'
  #     2 ↑¨ 'MONDAY' 'TUESDAY'              ⍝ returns 'MO' 'TU'
  #     2 3 ⍴¨ 1 2                           ⍝ returns (1 1) (2 2 2)
  #     4 5 ⍴¨ "THE" "CAT"                   ⍝ returns 'THET' 'CATCA'
  #     {1+⍵⋆2}¨ 2 3 ⍴ ⍳ 6                   ⍝ returns 2 3 ⍴ 1 2 5 10 17 26
  postfixOperator '¨', 'Each', (f) -> (b, a) ->
    if not a? then return withShape shapeOf(b), (for x in array b then f x)
    if isSimple a then return withShape shapeOf(b), (for x in array b then f x, a)
    if match(shapeOf(a), shapeOf(b)) then return withShape shapeOf(b), (for i in [0...a.length] then f b[i], a[i])
    if a.length is 1 then return withShape shapeOf(b), (for x in b then f x, a[0])
    if b.length is 1 then return withShape shapeOf(a), (for x in a then f b[0], x)
    die 'Length error'

  # Outer product
  #
  #    2 3 4 ∘.× 1 2 3 4
  #...     ⍝ returns 3 4⍴
  #...         2 4  6  8
  #...         3 6  9 12
  #...         4 8 12 16
  #
  #    0 1 2 3 4 ∘.! 0 1 2 3 4
  #...     ⍝ returns 5 5⍴
  #...         1 1 1 1 1
  #...         0 1 2 3 4
  #...         0 0 1 3 6
  #...         0 0 0 1 4
  #...         0 0 0 0 1
  #
  #    1 2 ∘., 1+⍳3
  #...     ⍝ returns 2 3⍴
  #...         (1 1) (1 2) (1 3)
  #...         (2 1) (2 2) (2 3)
  #
  #    ⍴ 1 2 ∘., 1+⍳3   ⍝ returns 2 3
  #
  #    2 3 ∘.↑ 1 2
  #...     ⍝ returns 2 2⍴
  #...           (1 0)   (2 0)
  #...         (1 0 0) (2 0 0)
  #
  #    ⍴ 2 3 ∘.↑ 1 2     ⍝ returns 2 2
  #    ⍴ ((4 3 ⍴ 0) ∘.+ (5 2 ⍴ 0))   ⍝ returns 4 3 5 2
  #    2 3 ∘.× 4 5       ⍝ returns 2 2⍴ 8 10 12 15
  #    2 3 ∘.{⍺×⍵} 4 5   ⍝ returns 2 2⍴ 8 10 12 15
  prefixOperator '∘.', 'Outer product', outerProduct = (f) ->
    assert typeof f is 'function'
    (b, a) ->
      assert a?, 'Operator ∘. (Outer product) works only with dyadic functions'
      a = array a
      b = array b
      r = []
      for x in a then for y in b then r.push f y, x
      withShape (shapeOf a).concat(shapeOf b), r

  # Inner product (`.`)
  #
  # todo: the general formula for higher dimensions is
  # `A f.g B   <=>   f/¨ (⊂[⍴⍴A]A)∘.g ⊂[1]B`
  #
  #     (1 3 5 7) +.= 2 3 6 7   ⍝ returns 2
  #     (1 3 5 7) ∧.= 2 3 6 7   ⍝ returns 0
  #     (1 3 5 7) ∧.= 1 3 5 7   ⍝ returns 1
  infixOperator '.', 'Inner product', (g, f) ->
    F = reduce f
    (b, a) ->
      assert shapeOf(a).length <= 1 and shapeOf(b).length <= 1, 'Inner product operator (.) is implemented only for arrays of rank no more than 1.'
      F g b, a

  # Power operator (`⍣`)
  #
  #     ({⍵+1}⍣5) 3     ⍝ returns 8
  #     ({⍵+1}⍣0) 3     ⍝ returns 3
  #     (⍴⍣3) 2 2⍴⍳4    ⍝ returns ,1
  infixOperator '⍣', 'Power operator', (f, n) ->
    if typeof f is 'number' and typeof n is 'function'
      [f, n] = [n, f]
    else
      assert typeof f is 'function' and typeof n is 'number'
    (y, x) ->
      for [0...n] then y = f y, x
      y

  # `⎕` and `⍞` will be implemented separately for node.js and the web.
  # These here are just placeholders for compilation to work right.
  builtins['set_⎕'] = (x) -> x
  builtins['get_⎕'] = -> 0
  builtins['set_⍞'] = (x) -> x
  builtins['get_⍞'] = -> 0

  builtins.aplify = (x) ->
    assert x isnt null
    assert typeof x isnt 'undefined'
    if typeof x is 'string' and x.length isnt 1
      x = withPrototype ' ', x.split ''
    x

  builtins.bool = bool

  endOfBuiltins()

  {builtins}
