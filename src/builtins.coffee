#!/usr/bin/env coffee

# This file contains an implementation of APL's built-in functions and
# operators.

# # A note about the data model

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

# TODO: Can we model APL's concept of "prototypes"?



# # Utility functions

{cps, cpsify, isSimple, shapeOf, sum, prod, repeat} = require './helpers'
withShape = (shape, a) -> (if shape? and shape.length isnt 1 then a.shape = shape); a
arrayValueOf = (x) -> if isSimple x then [x] else x

numericValueOf = (x) ->
  if x.length?
    if x.length isnt 1 then throw Error 'Numeric scalar or singleton expected'
    x = x[0]
  if typeof x isnt 'number' then throw Error 'Numeric scalar or singleton expected'
  x

booleanValueOf = (x) ->
  x = numericValueOf x
  if x isnt 0 and x isnt 1 then throw Error 'Boolean values must be either 0 or 1'
  x

# `pervasive(f)` is a decorator which takes a scalar function `f` and makes it
# propagate through arrays.
pervasive = (f) -> (a, b) ->
  F = arguments.callee
  if b? # dyadic pervasiveness
    if isSimple(a) and isSimple(b) then f a, b
    else if isSimple a then withShape b.shape, (for x in b then F a, x)
    else if isSimple b then withShape a.shape, (for x in a then F x, b)
    else
      sa = shapeOf a; sb = shapeOf b
      for i in [0 ... Math.min sa.length, sb.length]
        if sa[i] isnt sb[i] then throw Error 'Length error'
      if sa.length > sb.length
        k = prod sa[sb.length...]
        withShape sa, (for i in [0...a.length] then F a[i], b[Math.floor i / k])
      else if sa.length < sb.length
        k = prod sb[sa.length...]
        withShape sb, (for i in [0...b.length] then F a[Math.floor i / k], b[i])
      else
        withShape sa, (for i in [0...a.length] then F a[i], b[i])
  else # monadic pervasiveness
    if isSimple a then f a
    else withShape a.shape, (for x in a then F x)



# # DSL for defining functions and operators
#
# `builtins` will be the prototype of all execution contexts, used by
# [interpreter.coffee](interpreter.html).
exports.builtins = builtins = {}

ambivalent = (f1, f2) -> # combine a monadic and a dyadic function into one
  f = (args...) -> (if args[1]? then f2 else f1)(args...)
  f.aplName = f1.aplName or f2.aplName
  f

monadic = (symbol, f) ->
  f ?= -> throw Error "Monadic function #{symbol} is not available."
  if (g = builtins[symbol]) then f = ambivalent f, g
  f.aplName = symbol
  builtins[symbol] = f

dyadic = (symbol, f) ->
  f ?= -> throw Error "Dyadic function #{symbol} is not available."
  if (g = builtins[symbol]) then f = ambivalent g, f
  f.aplName = symbol
  builtins[symbol] = f

prefixOperator  = (symbol, f) -> f.isPrefixOperator  = true; f.aplName = symbol; builtins[symbol] = f
postfixOperator = (symbol, f) -> f.isPostfixOperator = true; f.aplName = symbol; builtins[symbol] = f
infixOperator   = (symbol, f) -> f.isInfixOperator   = true; f.aplName = symbol; builtins[symbol] = f



# # Built-in functions

# `+` Conjugate
monadic '+', (a) -> a

# `+` Add
dyadic  '+', pervasive (x, y) -> x + y

# `−` Negate
monadic '−', pervasive (x)    -> -x

# `−` Subtract
dyadic  '−', pervasive (x, y) -> x - y             

# `×` Sign of
monadic '×', pervasive (x)    -> if x < 0 then -1 else if x > 0 then 1 else 0 

# `×` Multiply
dyadic  '×', pervasive (x, y) -> x * y             

# `÷` Reciprocal
monadic '÷', pervasive (x)    -> 1 / x             

# `÷` Divide
dyadic  '÷', pervasive (x, y) -> x / y             

# `⌈` Ceiling
monadic '⌈', pervasive (x)    -> Math.ceil x       

# `⌈` Greater of
dyadic  '⌈', pervasive (x, y) -> Math.max x, y     

# `⌊` Floor
monadic '⌊', pervasive (x)    -> Math.floor x      

# `⌊` Lesser of
dyadic  '⌊', pervasive (x, y) -> Math.min x, y     

# `∣` Absolute value
monadic '∣', pervasive (x)    -> Math.abs x        

# `∣` Residue
dyadic  '∣', pervasive (x, y) -> y % x             

# `⍳` Index generate
monadic '⍳', (a) -> [0 ... Math.floor numericValueOf a] 

# `⍳` Index of
dyadic  '⍳'

# `?` Roll
monadic '?', pervasive (x) -> Math.floor Math.random() * Math.max 0, Math.floor numericValueOf x 


# `?` Deal
dyadic '?', (x, y) -> 
  x = Math.max 0, Math.floor numericValueOf x
  y = Math.max 0, Math.floor numericValueOf y
  if x > y then throw Error 'Domain error: left argument of ? must not be greater than its right argument.'
  available = [0...y]
  for [0...x] then available.splice(Math.floor(available.length * Math.random()), 1)[0]


# `⋆` Exponentiate
monadic '⋆', pervasive (x) -> Math.exp numericValueOf x 

# `⋆` To the power of
dyadic  '⋆', pervasive (x, y) -> Math.pow numericValueOf(x), numericValueOf(y) 

# `⍟` Natural logarithm
monadic '⍟', pervasive (x) -> Math.log x 

# `⍟` Logarithm to the base
dyadic  '⍟', pervasive (x, y) -> Math.log(y) / Math.log(x) 

# `○` Pi times
monadic '○', pervasive (x) -> Math.PI * x 

# `○` Circular and hyperbolic functions
dyadic '○', pervasive (i, x) -> 
  switch i
    when 0 then Math.sqrt(1 - x * x)
    when 1 then Math.sin x
    when 2 then Math.cos x
    when 3 then Math.tan x
    when 4 then Math.sqrt(1 + x * x)
    when 5 then (Math.exp(2 * x) - 1) / 2 # sinh
    when 6 then (Math.exp(2 * x) + 1) / 2 # cosh
    when 7 then ex = Math.exp(2 * x); (ex - 1) / (ex + 1) # tanh
    when -1 then Math.asin x
    when -2 then Math.acos x
    when -3 then Math.atan x
    when -4 then Math.sqrt(x * x - 1)
    when -5 then Math.log(x + Math.sqrt(x * x + 1)) # arcsinh
    when -6 then Math.log(x + Math.sqrt(x * x - 1)) # arccosh
    when -7 then Math.log((1 + x) / (1 - x)) / 2 # arctanh
    else throw Error 'Unknown circular or hyperbolic function ' + i

# `!` Factorial
monadic '!', pervasive (a) -> 
  n = a = Math.floor numericValueOf a # todo: "Gamma" function for non-integer argument
  r = 1; (if n > 1 then for i in [2 .. n] then r *= i); r

# `!` Binomial
dyadic '!', pervasive (a, b) -> 
  k = a = Math.floor numericValueOf a
  n = b = Math.floor numericValueOf b
  if not (0 <= k <= n) then return 0 # todo: Special cases for negatives and non-integers
  if 2 * k > n then k = n - k # do less work
  r = 1; (if k > 0 then for i in [1 .. k] then r = r * (n - k + i) / i); r


# `⌹` Matrix inverse
monadic '⌹' 

# `⌹` Matrix divide
dyadic '⌹' 

# `<` Less than
dyadic '<', pervasive (x, y) -> +(x <    y) 

# `≤` Less than or equal
dyadic '≤', pervasive (x, y) -> +(x <=   y) 

# `=` Equal
dyadic '=', pervasive (x, y) -> +(x is   y) 

# `>` Greater than
dyadic '≥', pervasive (x, y) -> +(x >=   y) 

# `≥` Greater than or equal
dyadic '>', pervasive (x, y) -> +(x >    y) 

# `≠` Not equal
dyadic '≠', pervasive (x, y) -> +(x isnt y) 

# `≡` Depth
monadic '≡', depthOf = (a) -> 
  if isSimple a then return 0
  r = 0; (for x in a then r = Math.max r, depthOf x); r + 1

# `≡` Match
dyadic '≡', match = (a, b) -> 
  if isSimple(a) and isSimple(b) then return +(a is b)
  if isSimple(a) isnt isSimple(b) then return 0
  sa = shapeOf a
  sb = shapeOf b
  if sa.length isnt sb.length then return 0
  for i in [0...sa.length] when sa[i] isnt sb[i] then return 0
  if a.length isnt b.length then return 0
  for i in [0...a.length] then if not match a[i], b[i] then return 0
  1

# `≢` Not match
dyadic '≢', (a, b) -> +not match a, b 

# `∈` Enlist
monadic '∈', (a) -> 
  r = []
  rec = (x) -> (if isSimple x then r.push x else for y in x then rec y); r
  rec a

# `∈` Membership
dyadic '∈', (a, b) -> 
  a = arrayValueOf a
  b = arrayValueOf b
  withShape a.shape, (for x in a then +(x in b))

# `⍷` Find
dyadic  '⍷' 

# `∪` Unique
monadic '∪' 

# `∪` Union
dyadic  '∪' 

# `∩` Intersection
dyadic  '∩' 

# `∼` Not
monadic '∼', pervasive (x) -> +!booleanValueOf(x) 

# `∼` Without
dyadic  '∼' 

# `∨` Or
dyadic  '∨', pervasive (x, y) -> + (booleanValueOf(x) || booleanValueOf(y)) 

# `∧` And
dyadic  '∧', pervasive (x, y) -> + (booleanValueOf(x) && booleanValueOf(y)) 

# `⍱` Nor
dyadic  '⍱', pervasive (x, y) -> +!(booleanValueOf(x) || booleanValueOf(y)) 

# `⍲` Nand
dyadic  '⍲', pervasive (x, y) -> +!(booleanValueOf(x) && booleanValueOf(y)) 

# `⍴` Shape of
monadic '⍴', shapeOf 

# `⍴` Reshape
dyadic '⍴', (a, b) -> 
  if isSimple a then a = [a]
  if isSimple b then b = [b]
  a =
    for x in a
      if not typeof x is 'number'
        throw Error 'Domain error: Left argument to ⍴ must be a numeric scalar or vector.'
      Math.max 0, Math.floor x
  withShape a, (for i in [0...prod a] then b[i % b.length])

# `,` Ravel
monadic ',', (a) -> arrayValueOf(a)[0...] 

# Helper for functions , and ⍪
catenate = (a, b, axis=-1) -> 
  sa = shapeOf a; if sa.length is 0 then sa = [1]; a = [a]
  sb = shapeOf b; if sb.length is 0 then sb = [1]; b = [b]
  if sa.length isnt sb.length then throw Error 'Length error: Cannot catenate arrays of different ranks'
  if axis < 0 then axis += sa.length
  for i in [0...sa.length] when sa[i] isnt sb[i] and i isnt axis
    throw Error 'Length error: Catenated arrays must match at all axes exept the one to catenate on'
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

# `,` Catenate
dyadic  ',', catenate 

# `⍪` 1st axis catenate
dyadic  '⍪', (a, b) -> catenate a, b, 0 

# `⌽` Reverse
monadic '⌽', reverse = (a, _, axis=-1) -> 
  sa = shapeOf a
  if sa.length is 0 then return a
  if axis < 0 then axis += sa.length
  if not (0 <= axis < sa.length) then throw Error 'Axis out of bounds'
  ni = prod sa[...axis]
  nj = sa[axis]
  nk = prod sa[axis + 1 ...]
  r = []
  for i in [0...ni]
    for j in [nj - 1 .. 0] by -1
      for k in [0...nk]
        r.push a[k + nk*(j + nj*i)]
  withShape sa, r

# `⌽` Rotate
dyadic  '⌽', (a, b) -> 
  a = numericValueOf a
  if a is 0 or isSimple(b) or (b.length <= 1) then return b
  sb = shapeOf b
  n = sb[sb.length - 1]
  a %= n; if a < 0 then a += n
  withShape sb, (for i in [0...b.length] then b[i - (i % n) + ((i % n) + a) % n])

# `⊖` 1st axis reverse
monadic '⊖', (a, _, axis=0) -> reverse a, undefined, axis 

# `⊖` 1st axis rotate
dyadic '⊖', (a, b) -> 
  a = numericValueOf a
  if a is 0 or isSimple(b) or (b.length <= 1) then return b
  sb = shapeOf b
  n = sb[0]
  k = b.length / n
  a %= n; if a < 0 then a += n
  withShape sb, (for i in [0...b.length] then b[((Math.floor(i / k) + a) % n) * k + (i % k)])

# `⍉` Transpose
monadic '⍉', (a) -> 
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

# `↑` First
monadic '↑', (a) -> 
  a = arrayValueOf(a)
  if a.length then a[0] else 0 # todo: use the prototype of a

# `↑` Take
dyadic  '↑', (a, b) -> 
  if isSimple a then a = [a]
  for x in a
    if not typeof x is 'number'
      throw Error 'Domain error: Left argument to ↑ must be a numeric scalar or vector.'
  if isSimple(b) and a.length is 1 then b = [b]
  sb = shapeOf b
  if a.length isnt sb.length
    throw Error 'Length error: Left argument to ↑ must have as many elements as is the rank of its right argument.'
  r = []
  pa = for [0...a.length] then 0
  pa[a.length - 1] = 1
  i = a.length - 2; while i >= 0 then pa[i] = pa[i + 1] * a[i + 1]; i--
  rec = (d, i, k) ->
    if d >= sb.length
      r.push b[i]
    else
      k /= sb[d]
      if a[d] >= 0
        for j in [0 ... Math.min a[d], sb[d]] then rec d + 1, i + j * k, k
        if sb[d] < a[d]
          for [0 ... (a[d] - sb[d]) * pa[d]] then r.push 0 # todo: use APL array prototype instead of 0
      else
        if sb[d] + a[d] < 0
          for [0 ... -(sb[d] + a[d]) * pa[d]] then r.push 0 # todo: use APL array prototype instead of 0
        for j in [Math.max(0, sb[d] + a[d]) ... sb[d]] then rec d + 1, i + j * k, k
    r
  withShape a, rec 0, 0, b.length

# `↓` Drop
dyadic '↓', (a, b) -> 
  if isSimple a then a = [a]
  for x in a when typeof x isnt 'number' or x isnt Math.floor x
    throw Error 'Left argument to ↓ must be an integer or a vector of integers.'
  if isSimple b then b = withShape (for [0...a.length] then 1), b
  sb = shapeOf b
  if a.length > sb.length
    throw Error 'The left argument to ↓ must have length less than or equal to the rank of its right argument.'
  for [a.length...sb.length] then a.push 0
  lims =
    for i in [0...a.length]
      if a[i] >= 0
        [Math.min(a[i], sb[i]), sb[i]]
      else
        [0, Math.max(0, sb[i] + a[i])]
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

# `⊂` Enclose
monadic '⊂', (a) -> 
  if isSimple a then a else withShape [], [a]

# `⊂` Partition (with axis)
dyadic '⊂' 

# `⊃` Disclose
monadic '⊃', (a) -> 
  if isSimple a then return a
  sa = shapeOf a
  if sa.length is 0 then return a[0]
  sr1 = shapeOf a[0]
  for x in a[1...]
    sx = shapeOf x
    if sx.length isnt sr1.length
      throw Error 'The argument of ⊃ must contain elements of the same rank.'
    for i in [0...sr1.length]
      sr1[i] = Math.max sr1[i], sx[i]
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
        for [0 ... N * (sr1[d] - sx[d])]
          r.push 0
    rec 0, 0, x.length, prod sr1
  withShape sr, r

# `⊃` Pick
dyadic '⊃' 

# `⌷` Index
#
# `(a0 a1 ...)⌷b` is equivalent to `b[a0;a1;...]`
dyadic '⌷', (a, b) -> 
  if isSimple a then a = [a]
  if a.shape and a.shape.length > 1
    throw Error 'Indices must be a scalar or a vector, not a higher-dimensional array.'
  sb = shapeOf b
  if a.length isnt sb.length
    throw Error 'The number of indices must be equal to the rank of the indexable.'
  a = for x in a then (if isSimple x then withShape [], [x] else x)
  for x, d in a then for y in x when not (typeof y is 'number' and y is Math.floor(y))
    throw Error 'Indices must be integers'
  for x, d in a then for y in x when not (0 <= y < sb[d])
    throw Error 'Index out of bounds'
  sr = []; for x in a then sr = sr.concat shapeOf x
  r = []
  rec = (d, i, n) ->
    if d >= a.length then r.push b[i]
    else for x in a[d] then rec d + 1, i + (x * n / sb[d]), n / sb[d]
    0
  rec 0, 0, b.length
  if sr.length is 0 then r[0] else withShape sr, r


# `⍋` Grade up
monadic '⍋' 

# `⍒` Grade down
monadic '⍒' 

# `⊤` Encode
monadic '⊤' 

# `⊥` Decode
monadic '⊥' 

# `⍕` Format
monadic '⍕' 

# `⍕` Format by example or specification
dyadic '⍕' 

# `⍎` Execute
monadic '⍎' 

# `⊣` Stop
monadic '⊣' 

# `⊣` Left
dyadic '⊣' 

# `⊢` Pass
monadic '⊢' 

# `⊢` Right
dyadic '⊢' 

# `⍬` Zilde (niladic function)
builtins['get_⍬'] = -> []

# Note: Symbols _quad_ (⎕) and _quote-quad_ (⍞) are defined in a
# platform-specific manner in [browser.coffee](browser.html) (for browsers)
# and [command.coffee](command.html) (for node.js).



# # Built-in operators

# Helper for / and ⌿ in their operator sense
reduce = (f, _, axis=-1) -> (a, b) ->
  invokedAsMonadic = not b?
  if invokedAsMonadic then b = a; a = 0
  a = Math.floor numericValueOf a
  isBackwards = a < 0; if isBackwards then a = -a
  b = arrayValueOf b
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
    for i in [0...b.length] then items[Math.floor(i / k) % n].push b[i]
  r =
    if isBackwards
      for i in [0 ... n - a + 1]
        x = items[i + a - 1]; (for j in [i + a - 2 ... i - 1] by -1 then x = f x, items[j]); x
    else
      for i in [0 ... n - a + 1]
        x = items[i]; (for j in [i + 1 ... i + a] by 1 then x = f x, items[j]); x
  if invokedAsMonadic then r[0] else r

# Helper for / and ⌿ in their function sense
compressOrReplicate = (a, b, axis=-1) ->
  sb = shapeOf b
  if axis < 0 then axis += sb.length
  if not (0 <= axis < sb.length) then throw Error 'Axis out of bounds'
  sr = sb[0...]
  sr[axis] = 0
  if shapeOf(a).length > 1 then throw Error 'Left argument to / must be an integer or a vector of integers'
  if not a.length then a = for [0...sb[axis]] then a

  nNonNegative = 0 # number of non-negative elements in a
  for x in a
    if typeof x isnt 'number' or x isnt Math.floor x then throw Error 'Left argument to / must be an integer or a vector of integers'
    sr[axis] += Math.abs x
    nNonNegative += (x >= 0)

  isExtensive = true; isExpansive = isHyperexpansive = false
  if sb[axis] isnt 1
    isExtensive = false
    isExpansive = a.length is sb[axis]
    isHyperexpansive = not isExpansive
    if isHyperexpansive and (nNonNegative isnt sb[axis])
      throw Error 'For A/B, the length of B along the selected axis ' +
                  'must be equal either to one, ' +                 # extension
                  'or the length of A, ' +                          # expansion
                  'or to the number of non-negative elements in A.' # hyperexpansion
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
        for [0...-a[j]*nk]
          r.push 0 # todo: prototype
        j += isExpansive

  withShape sr, r

# `/` Reduce, compress, or replicate
postfixOperator '/', (a, b, axis=-1) -> 
  if typeof a is 'function'
    reduce a, undefined, axis
  else
    compressOrReplicate a, b, axis

# `⌿` 1st axis reduce, compress, or replicate
postfixOperator '⌿', (a, b, axis=0) -> 
  if typeof a is 'function'
    reduce a, undefined, axis
  else
    compressOrReplicate a, b, axis

# `¨` Each
postfixOperator '¨', (f) -> (a, b) -> 
  if not b? then return (for x in arrayValueOf a then f x)
  if isSimple a then return (for x in arrayValueOf b then f a, x)
  if a.length is b.length then return (for i in [0...a.length] then f a[i], b[i])
  if a.length is 1 then return (for x in b then f a[0], x)
  if b.length is 1 then return (for x in a then f x, b[0])
  throw Error 'Length error'

# `∘.` Outer product
prefixOperator '∘.', outerProduct = (f) ->
  f = cpsify f
  cps (a, b, _, callback) ->
    if not b? then return -> callback Error 'Operator ∘. (Outer product) works only with dyadic functions'
    a = arrayValueOf a
    b = arrayValueOf b
    r = []
    ia = 0
    loopA = ->
      if ia < a.length
        ib = 0
        loopB = ->
          if ib < b.length
            -> f a[ia], b[ib], null, (err, x) ->
              if err then return -> callback err
              r.push x
              ib++; loopB
          else
            ia++; loopA
      else
        -> callback null, withShape (shapeOf a).concat(shapeOf b), r

# `.` Inner product
# todo: the general formula for higher dimensions is
# `A f.g B   <=>   f/¨ (⊂[⍴⍴A]A)∘.g ⊂[1]B`
infixOperator '.', (f, g) -> 
  F = reduce f
  G = outerProduct g
  (a, b) ->
    if shapeOf(a).length > 1 or shapeOf(b).length > 1
      throw Error 'Inner product operator (.) is implemented only for arrays of rank no more than 1.'
    F g a, b

# `⍣` Power operator
postfixOperator '⍣', cps (f, _, _, callback) -> 
  if typeof f isnt 'function' then return -> callback0 Error 'Left argument to ⍣ must be a function.'
  f = cpsify f
  -> callback null, cps (n, _, _, callback1) ->
    if typeof n isnt 'number' or n < 0 or n isnt Math.floor n then return -> callback Error 'Right argument to ⍣ must be a non-negative integer.'
    -> callback1 null, cps (a, _, _, callback2) ->
      i = 0
      F = ->
        if i < n
          f a, null, null, (err, r) ->
            if err then return -> callback2 err
            a = r; i++; F
        else
          -> callback2 null, a
