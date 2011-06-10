#!/usr/bin/env coffee

# APL interpreter and built-in library

# APL's data structures are multidimensional arrays:
#   0. Scalars---can be:
#        * simple scalars, like numbers and characters
#        * an APL array of rank zero, containing exactly one element
#   1. Vectors---sequences of APL objects with zero or more elements
#   2. Matrices---two-dimensional arrays of APL objects
#   3... Cubes, etc
# APL arrays are not necessarily heterogenous, they may contain data of mixed
# types.

# An array in APL is aware of its own dimensions, so there is an essential
# difference between a vector of vectors and a matrix.
# To reflect this in JavaScript objects, we use the following convention:
#   0. APL scalars:
#         * Simple scalars: APL numbers are JavaScript numbers
#             and APL characters are JavaScript one-character strings.
#         * A zero-rank APL array is a JavaScript array of size one
#             with a "shape" property of [], e.g. created by:
#                     var a = []; a.shape = [];
#   1. An APL vector is a JavaScript array
#   2. An APL matrix, cube, etc is a JavaScript array with an additional
#       "shape" property, describing the dimensions of the APL array.
#       E.g. a 2-by-2-by-3 cube of zeroes may be constructed via:
#          function createSomeCube() {
#              var cube = [
#                      0, // Element at indices [0;0;0]
#                      0, // Element at indices [0;0;1]
#                      0, // Element at indices [0;0;2]
#                      0, // Element at indices [0;1;0]
#                      0, // Element at indices [0;1;1]
#                      // ...
#                      0  // Element at indices [1;1;2]
#              ];
#              cube.shape = [2, 2, 3];
#              return cube;
#          }
#       A vector's representation, as opposed to that of higher dimension arrays,
#       is not required to have a "shape" property.  The shape of a vector's
#       representation `v' is assumed to be [v.length], by convention.
#       Similarly, we could say that a scalar's shape is [] by convention.

# TODO: Can we model APL's concept of "prototypes"?

{min, max, abs, floor, ceil, random, exp, pow, PI, log, sin, cos, tan, asin, acos, atan, sqrt} = Math
exports ?= @

# Helpers

inherit = (x) -> f = (->); f.prototype = x; new f # JavaScript's prototypical inheritance
sum = (xs) -> r = 0; (for x in xs then r += x); r
prod = (xs) -> r = 1; (for x in xs then r *= x); r
repeat = (s, n) -> r = ''; (for [0...n] then r += s); r # catenate `n' instances of a string `s'
shapeOf = (a) -> a.shape or if a.length? then [a.length] else []
withShape = (shape, a) -> (if shape? and shape.length isnt 1 then a.shape = shape); a
isSimple = (x) -> typeof x is 'number' or typeof x is 'string'
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

format = (a) -> format0(a).join '\n'

format0 = (a) -> # todo: handle 3+ dimensional arrays properly
  if typeof a is 'undefined' then ['<<UNDEFINED>>']
  else if a is null then ['<<NULL>>']
  else if typeof a is 'string' then [a]
  else if typeof a is 'number' then [if a < 0 then '¯' + (-a) else '' + a]
  else if isSimple a then ['' + a]
  else
    if a.length is 0 then return [',-.', '| |', "`-'"] # empty array
    sa = shapeOf a
    nc = if sa.length is 0 then 1 else sa[sa.length - 1]
    nr = a.length / nc
    h = for [0...nr] then 0 # row heights
    w = for [0...nc] then 0 # column widths
    boxes =
      for r in [0...nr]
        for c in [0...nc]
          box = format0 a[r * nc + c]
          h[r] = max h[r], box.length
          w[c] = max w[c], box[0].length
          box
    bigWidth = nc - 1 + sum w # from border to border, excluding the borders
    result = [TOPLFT + repeat(TOP, bigWidth) + TOPRGT]
    for r in [0...nr]
      for c in [0...nc]
        vpad boxes[r][c], h[r]
        hpad boxes[r][c], w[c]
      for i in [0...h[r]]
        s = ''; for c in [0...nc] then s += ' ' + boxes[r][c][i]
        result.push LFT + s[1...] + RGT
    result.push BTMLFT + repeat(BTM, bigWidth) + BTMRGT
    result

hpad = (box, width) -> # horizontally extend a box (a box is a list of same-length strings)
  if box[0].length < width
    padding = repeat ' ', width - box[0].length
    for i in [0...box.length] then box[i] += padding
    0

vpad = (box, height) -> # vertically extend a box
  if box.length < height
    padding = repeat ' ', box[0].length
    for i in [box.length...height] then box.push padding
    0

# Graphics symbols for the surrounding border:

# (An idea: these can be used to surrond arrays at different depths;
# arrays with a deeper structure would have thicker borders.)

#[TOP, BTM, LFT, RGT, TOPLFT, TOPRGT, BTMLFT, BTMRGT] = "--||,.`'"
[TOP, BTM, LFT, RGT, TOPLFT, TOPRGT, BTMLFT, BTMRGT] = "──││┌┐└┘"
#[TOP, BTM, LFT, RGT, TOPLFT, TOPRGT, BTMLFT, BTMRGT] = "──││╭╮╰╯"
#[TOP, BTM, LFT, RGT, TOPLFT, TOPRGT, BTMLFT, BTMRGT] = "━━┃┃┏┓┗┛"
#[TOP, BTM, LFT, RGT, TOPLFT, TOPRGT, BTMLFT, BTMRGT] = "▄▀▐▌▗▖▝▘"
#[TOP, BTM, LFT, RGT, TOPLFT, TOPRGT, BTMLFT, BTMRGT] = "▀▄▌▐▛▜▙▟"
#[TOP, BTM, LFT, RGT, TOPLFT, TOPRGT, BTMLFT, BTMRGT] = "▓▓▓▓▓▓▓▓"
#[TOP, BTM, LFT, RGT, TOPLFT, TOPRGT, BTMLFT, BTMRGT] = "████████"



pervasive = (f) -> (a, b) ->
  # Decorator, takes a scalar function `f' and makes it propagate through arrays
  F = arguments.callee
  if b? # dyadic pervasiveness
    if isSimple(a) and isSimple(b) then f a, b
    else if isSimple a then withShape b.shape, (for x in b then F a, x)
    else if isSimple b then withShape a.shape, (for x in a then F x, b)
    else
      sa = shapeOf a; sb = shapeOf b
      for i in [0 ... min sa.length, sb.length]
        if sa[i] isnt sb[i] then throw Error 'Length error'
      if sa.length > sb.length
        k = prod sa[sb.length...]
        withShape sa, (for i in [0...a.length] then F a[i], b[floor i / k])
      else if sa.length < sb.length
        k = prod sb[sa.length...]
        withShape sb, (for i in [0...b.length] then F a[floor i / k], b[i])
      else
        withShape sa, (for i in [0...a.length] then F a[i], b[i])
  else # monadic pervasiveness
    if isSimple a then f a
    else withShape a.shape, (for x in a then F x)



# DSL for defining operators, functions, and pseudo-variables

builtins = {} # `builtins' will be the prototype of all execution contexts, see exec()
prefixOperator  = (symbol, f) -> f.isPrefixOperator  = true; f.aplName = symbol; builtins[symbol] = f
postfixOperator = (symbol, f) -> f.isPostfixOperator = true; f.aplName = symbol; builtins[symbol] = f
infixOperator   = (symbol, f) -> f.isInfixOperator   = true; f.aplName = symbol; builtins[symbol] = f
niladic         = (symbol, f) -> f.isNiladic         = true; f.aplName = symbol; builtins[symbol] = f

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



# Built-in functions

monadic '+', (a) -> a                              # Conjugate
dyadic  '+', pervasive (x, y) -> x + y             # Add
monadic '−', pervasive (x)    -> -x                # Negate
dyadic  '−', pervasive (x, y) -> x - y             # Subtract
monadic '×', pervasive (x)    -> if x < 0 then -1 else if x > 0 then 1 else 0 # Sign of
dyadic  '×', pervasive (x, y) -> x * y             # Multiply
monadic '÷', pervasive (x)    -> 1 / x             # Reciprocal
dyadic  '÷', pervasive (x, y) -> x / y             # Divide
monadic '⌈', pervasive (x)    -> ceil x            # Ceiling
dyadic  '⌈', pervasive (x, y) -> max x, y          # Greater of
monadic '⌊', pervasive (x)    -> floor x           # Floor
dyadic  '⌊', pervasive (x, y) -> min x, y          # Lesser of
monadic '|', pervasive (x)    -> abs x             # Absolute value
dyadic  '|', pervasive (x, y) -> y % x             # Residue
monadic '⍳', (a) -> [0 ... floor numericValueOf a] # Index generate
dyadic  '⍳', -> throw Error 'Not implemented'      # Index of
monadic '?', pervasive (x) -> floor random() * max 0, floor numericValueOf x # Roll

dyadic '?', (x, y) -> # Deal
  x = max 0, floor numericValueOf x
  y = max 0, floor numericValueOf y
  if x > y then throw Error 'Domain error: left argument of ? must not be greater than its right argument.'
  available = [0...y]
  for [0...x] then available.splice(floor(available.length * random()), 1)[0]

monadic '⋆', pervasive (x) -> exp numericValueOf x # Exponentiate
dyadic  '⋆', pervasive (x, y) -> pow numericValueOf(x), numericValueOf(y) # To the power of
monadic '⍟', pervasive (x) -> log x # Natural logarithm
dyadic  '⍟', pervasive (x, y) -> log(y) / log(x) # Logarithm to the base
monadic '○', pervasive (x) -> PI * x # Pi times

dyadic '○', pervasive (i, x) -> # Circular and hyperbolic functions
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
    else throw Error 'Unknown circular or hyperbolic function ' + i

monadic '!', pervasive (a) -> # Factorial
  n = a = floor numericValueOf a # todo: "Gamma" function for non-integer argument
  r = 1; (if n > 1 then for i in [2 .. n] then r *= i); r

dyadic '!', pervasive (a, b) -> # Binomial
  k = a = floor numericValueOf a
  n = b = floor numericValueOf b
  if not (0 <= k <= n) then return 0 # todo: Special cases for negatives and non-integers
  if 2 * k > n then k = n - k # do less work
  r = 1; (if k > 0 then for i in [1 .. k] then r = r * (n - k + i) / i); r

monadic '⌹' # Matrix inverse
dyadic '⌹' # Matrix divide
dyadic '<', pervasive (x, y) -> +(x <    y) # Less than
dyadic '≤', pervasive (x, y) -> +(x <=   y) # Less than or equal
dyadic '=', pervasive (x, y) -> +(x is   y) # Equal
dyadic '≥', pervasive (x, y) -> +(x >=   y) # Greater than
dyadic '>', pervasive (x, y) -> +(x >    y) # Greater than or equal
dyadic '≠', pervasive (x, y) -> +(x isnt y) # Not equal

monadic '≡', depthOf = (a) -> # Depth
  if isSimple a then return 0
  r = 0; (for x in a then r = max r, depthOf x); r + 1

dyadic '≡', match = (a, b) -> # Match
  if isSimple(a) and isSimple(b) then return +(a is b)
  if isSimple(a) isnt isSimple(b) then return 0
  sa = shapeOf a
  sb = shapeOf b
  if sa.length isnt sb.length then return 0
  for i in [0...sa.length] when sa[i] isnt sb[i] then return 0
  if a.length isnt b.length then return 0
  for i in [0...a.length] then if not match a[i], b[i] then return 0
  1

dyadic '≢', (a, b) -> +not match a, b # Not match

monadic '∈', (a) -> # Enlist
  r = []
  rec = (x) -> (if isSimple x then r.push x else for y in x then rec y); r
  rec a

dyadic '∈', (a, b) -> # Membership
  a = arrayValueOf a
  b = arrayValueOf b
  withShape a.shape, (for x in a then +(x in b))

dyadic  '⍷' # Find
monadic '∪' # Unique
dyadic  '∪' # Union
dyadic  '∩' # Intersection
monadic '∼', pervasive (x) -> +!booleanValueOf(x) # Not
dyadic  '∼' # Without
dyadic  '∨', pervasive (x, y) -> + (booleanValueOf(x) || booleanValueOf(y)) # Or
dyadic  '∧', pervasive (x, y) -> + (booleanValueOf(x) && booleanValueOf(y)) # And
dyadic  '⍱', pervasive (x, y) -> +!(booleanValueOf(x) || booleanValueOf(y)) # Nor
dyadic  '⍲', pervasive (x, y) -> +!(booleanValueOf(x) && booleanValueOf(y)) # Nand
monadic '⍴', shapeOf # Shape of

dyadic '⍴', (a, b) -> # Reshape
  if isSimple a then a = [a]
  if isSimple b then b = [b]
  a =
    for x in a
      if not typeof x is 'number'
        throw Error 'Domain error: Left argument to ⍴ must be a numeric scalar or vector.'
      max 0, floor x
  withShape a, (for i in [0...prod a] then b[i % b.length])

monadic ',', (a) -> arrayValueOf(a)[0...] # Ravel

catenate = (a, b, axis=-1) -> # helper for functions , and ⍪
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

dyadic  ',', catenate # Catenate
dyadic  '⍪', (a, b) -> catenate a, b, 0 # 1st axis catenate

monadic '⌽' # Reverse
monadic '⊖' # 1st axis reverse

dyadic  '⌽', (a, b) -> # Rotate
  a = numericValueOf a
  if a is 0 or isSimple(b) or (b.length <= 1) then return b
  sb = shapeOf b
  n = sb[sb.length - 1]
  a %= n; if a < 0 then a += n
  withShape sb, (for i in [0...b.length] then b[i - (i % n) + ((i % n) + a) % n])

dyadic '⊖', (a, b) -> # 1st axis rotate
  a = numericValueOf a
  if a is 0 or isSimple(b) or (b.length <= 1) then return b
  sb = shapeOf b
  n = sb[0]
  k = b.length / n
  a %= n; if a < 0 then a += n
  withShape sb, (for i in [0...b.length] then b[((floor(i / k) + a) % n) * k + (i % k)])

monadic '⍉' # Transpose

monadic '↑', (a) -> # First
  a = arrayValueOf(a)
  if a.length then a[0] else 0 # todo: use the prototype of a

dyadic  '↑', (a, b) -> # Take
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
        for j in [0 ... min a[d], sb[d]] then rec d + 1, i + j * k, k
        if sb[d] < a[d]
          for [0 ... (a[d] - sb[d]) * pa[d]] then r.push 0 # todo: use APL array prototype instead of 0
      else
        if sb[d] + a[d] < 0
          for [0 ... -(sb[d] + a[d]) * pa[d]] then r.push 0 # todo: use APL array prototype instead of 0
        for j in [max(0, sb[d] + a[d]) ... sb[d]] then rec d + 1, i + j * k, k
    r
  withShape a, rec 0, 0, b.length

dyadic '↓' # Drop

monadic '⊂', (a) -> # Enclose
  if isSimple a then a else withShape [], [a]

dyadic '⊂' # Partition (with axis)

monadic '⊃', (a) -> # Disclose
  if isSimple a then return a
  sa = shapeOf a
  if sa.length is 0 then return a[0]
  sr1 = shapeOf a[0]
  for x in a[1...]
    sx = shapeOf x
    if sx.length isnt sr1.length
      throw Error 'The argument of ⊃ must contain elements of the same rank.'
    for i in [0...sr1.length]
      sr1[i] = max sr1[i], sx[i]
  sr = shapeOf(a).concat sr1
  r = []
  for x in a
    sx = shapeOf x
    rec = (d, i, n, N) ->
      # d: dimension, i: index in x, n: block size in x, N: block size in r
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

dyadic '⊃' # Pick

dyadic '⌷', (a, b) -> # Index
  # (a0 a1 ...)⌷b is equivalent to b[a0;a1;...]
  if isSimple a then a = [a]
  if a.shape and a.shape.length > 1
    throw Error 'Indices must be a scalar or a vector, not a higher-dimensional array.'
  sb = shapeOf b
  if a.length isnt sb.length
    throw Error 'The number of indices must be equal to the rank of the indexable.'
  a = for x in a then (if isSimple x then withShape [], [x] else x)
  for x, d in a then for y in x when not (typeof y is 'number' and y is floor(y))
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

monadic '⍋' # Grade up
monadic '⍒' # Grade down
monadic '⊤' # Encode
monadic '⊥' # Decode
#monadic '⍺' # Picture format
monadic '⍕' # Format
dyadic '⍕' # Format by example or specification
monadic '⍎' # Execute
monadic '⊣' # Stop
dyadic '⊣' # Left
monadic '⊢' # Pass
dyadic '⊢' # Right



# Operators ("functions that act upon functions")

postfixOperator '/', reduce = (f, _, axis=-1) -> (a, b) -> # Reduce
  invokedAsMonadic = not b?
  if invokedAsMonadic then b = a; a = 0
  a = floor numericValueOf a
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
    for i in [0...b.length] then items[floor(i / k) % n].push b[i]
  r =
    if isBackwards
      for i in [0 ... n - a + 1]
        x = items[i + a - 1]; (for j in [i + a - 2 ... i - 1] by -1 then x = f x, items[j]); x
    else
      for i in [0 ... n - a + 1]
        x = items[i]; (for j in [i + 1 ... i + a] by 1 then x = f x, items[j]); x
  if invokedAsMonadic then r[0] else r

postfixOperator '⌿', (f) -> reduce f, null, 0 # 1st axis reduce

postfixOperator '¨', (f) -> (a, b) -> # Each
  if not b? then return (for x in arrayValueOf a then f x)
  if isSimple a then return (for x in arrayValueOf b then f a, x)
  if a.length is b.length then return (for i in [0...a.length] then f a[i], b[i])
  if a.length is 1 then return (for x in b then f a[0], x)
  if b.length is 1 then return (for x in a then f x, b[0])
  throw Error 'Length error'

prefixOperator '∘.', outerProduct = (f) -> (a, b) -> # Outer product
  if not b? then throw Error 'Operator ∘. (Outer product) works only with dyadic functions'
  a = arrayValueOf a
  b = arrayValueOf b
  r = []
  for x in a then for y in b then r.push f x, y
  withShape (shapeOf a).concat(shapeOf b), r

infixOperator '.', (f, g) -> # Inner product
  # todo: the general formula for higher dimensions is
  #   A f.g B   <=>   f/¨ (⊂[⍴⍴A]A)∘.g ⊂[1]B
  F = reduce f
  G = outerProduct g
  (a, b) ->
    if shapeOf(a).length > 1 or shapeOf(b).length > 1
      throw Error 'Inner product operator (.) is implemented only for arrays of rank no more than 1.'
    F g a, b



# Niladic functions and pseudo-variables

# In reality, a pseudo-variable is a function.  When invoked with no arguments,
# it acts as a getter, and with one argument as a setter.
# Pseudo-variables are very much like niladic functions (except that they
# can be assigned to), so we'll declare them as niladics here.

niladic '⍬', -> []

niladic '⎕', (x) ->
  if x? # setter: Output with newline
    if typeof x isnt 'string' then x = format x
    process.stdout.write x + '\n'
  else # getter: Evaluated input
    throw Error 'Getter for ⎕ ("Evaluated input") not implemented'

niladic '⍞', (x) ->
  if x? # setter: Bare output
    if typeof x isnt 'string' then x = format x
    process.stdout.write x
  else # getter: Character input
    throw Error 'Getter for ⍞ ("Raw input") not implemented'



# Execution engine

exec = exports.exec = (ast, ctx) ->
  # Evaluate a branch of the abstract syntax tree
  # `ctx' holds variable bindings
  if not ctx?
    ctx = inherit builtins

  try
    switch ast[0]
      when 'body' then r = 0; (for x in ast[1...] then r = exec x, ctx); r
      when 'num' then parseFloat ast[1].replace(/¯/, '-')
      when 'str' then eval(ast[1]).split ''

      when 'index'
        x = exec ast[1], ctx
        y = for subscriptAST in ast[2...] then exec subscriptAST, ctx
        if typeof x is 'function'
          (a, b) -> x(a, b, y)
        else
          builtins['⌷'](y, x)

      when 'assign'
        name = ast[1]; value = exec ast[2], ctx
        if typeof ctx[name] is 'function' then ctx[name] value else ctx[name] = value
        ctx[name]

      when 'sym'
        name = ast[1]; value = ctx[name]
        if not value? then throw Error "Symbol #{name} is not defined."
        if typeof value is 'function' and value.isNiladic then value = value()
        value

      when 'lambda'
        (a, b) ->
          ctx1 = inherit ctx
          # Bind formal parameter names 'alpha' and 'omega' to the left and right argument
          if b?
            ctx1['⍺'] = a
            ctx1['⍵'] = b
          else
            ctx1['⍺'] = 0
            ctx1['⍵'] = a
          exec ast[1], ctx1

      when 'seq'
        if ast.length is 1 then return 0
        a = []
        for i in [ast.length - 1 .. 1] then a.unshift exec ast[i], ctx

        # Form vectors from sequences of data
        i = 0
        while i < a.length
          if typeof a[i] isnt 'function'
            j = i + 1
            while j < a.length and typeof a[j] isnt 'function' then j++
            if j - i > 1
              a[i...j] = [a[i...j]]
          i++

        # Apply infix operators
        i = 0
        while i < a.length - 2
          if typeof a[i] is 'function'
            if typeof a[i+1] is 'function' and a[i+1].isInfixOperator
              if typeof a[i+2] is 'function'
                a[i..i+2] = a[i+1] a[i], a[i+2]
                continue
          i++

        # Apply postfix operators
        i = 0
        while i < a.length - 1
          if typeof a[i] is 'function'
            if typeof a[i+1] is 'function' and a[i+1].isPostfixOperator
              a[i..i+1] = a[i+1] a[i]
              continue
          i++

        # Apply prefix operators
        i = a.length - 2
        while i >= 0
          if typeof a[i] is 'function' and a[i].isPrefixOperator
            if typeof a[i+1] is 'function'
              a[i..i+1] = a[i] a[i+1]
          i--

        # Apply functions
        while a.length > 1
          if typeof a[a.length - 1] is 'function' then throw Error 'Trailing function in expression'
          y = a.pop()
          f = a.pop()
          if a.length is 0 or typeof a[a.length - 1] is 'function'
            a.push f y # apply monadic function
          else
            x = a.pop(); a.push f x, y # apply dyadic function
        return a[0]

      else
        throw Error 'Unrecognized AST node type: ' + ast[0]

  catch e
    throw e



exports.main = main = ->
  parser ?= try require './parser' catch _ then require '../lib/parser'

  if process.argv.length > 3
    process.stderr.write 'Usage: apl [filename]\n', -> process.exit 0
    return
  else if process.argv.length is 3
    fs = require('fs')
    input = fs.createReadStream process.argv[2]
  else
    input = process.stdin
    input.resume()
    input.setEncoding 'utf8'

  data = ''
  input.on 'data', (chunk) -> data += chunk
  input.on 'end', -> exec parser.parse data

if module? and module is require?.main then main()
