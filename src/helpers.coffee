# Prototypal inheritance of JavaScript objects
# (see [Douglas Crockford's explanation](http://javascript.crockford.com/prototypal.html))
exports.inherit = (x) ->
  f = (->); f.prototype = x; new f



# A continuation-passing style helper that works around the lack of tail call optimisation
# (see [Wikipedia](https://secure.wikimedia.org/wikipedia/en/wiki/Continuation-passing_style#Use_and_implementation))
exports.trampoline = (x) ->
  while typeof x is 'function' then x = x()
  x


# `cps(f)` marks a function `f` as following the CPS calling convention
#
# This means that `f` accepts a callback as its fourth argument (the first
# three being allotted for APL left argument, right argument, and axis
# specification).  The callback should be invoked later either with its first
# argument set to an Error object, or with its second argument set to the
# result.
#
# The CPS function may (directly) return either undefined, or another
# function which should be executed immediately after it.  (This process will
# be controlled by a trampoline() at a higher level in the code.)
#
# An example of a traditional function
#
#          (a, b, c) -> a * b + c
#
# turned into CPS (and marked as CPS) is:
#
#          cps (a, b, c, callback) -> -> callback null, a * b + c
#
# A function is marked as CPS by setting its ".cps" property to true.
# That informs callers that they should follow the CPS convention, too.
exports.cps = cps = (f) ->
  f.cps = true; f



# `cpsify(f)` decorates a traditional function so that it follows the CPS
# calling convention.
exports.cpsify = (f) ->
  if f.cps then return f
  cps (a, b, c, callback) ->
    try
      result = f a, b, c
      -> callback null, result
    catch err
      -> callback err



# Helpers for the APL data model
exports.shapeOf = (a) -> a.shape or if a.length? then [a.length] else []
exports.isSimple = (x) -> typeof x is 'number' or typeof x is 'string'

# Sum and product;  I wish JavaScript had a _reduce_ operator :)
exports.sum = (xs) -> r = 0; (for x in xs then r += x); r
exports.prod = (xs) -> r = 1; (for x in xs then r *= x); r

# `repeat(s, n)` catenates `n` instances of a string `s`.
exports.repeat = (s, n) -> r = ''; (for [0...n] then r += s); r
