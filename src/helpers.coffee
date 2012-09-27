# Prototypal inheritance of JavaScript objects
# (see [Douglas Crockford's explanation](http://javascript.crockford.com/prototypal.html))
exports.inherit = (x) ->
  f = (->); f.prototype = x; new f



# Helpers for the APL data model
exports.isSimple = isSimple = (x) -> not (x instanceof Array)
exports.shapeOf = shapeOf = (a) -> a.shape or if a.length? then [a.length] else []
exports.withShape = withShape = (shape, a) -> (if shape? and shape.length isnt 1 then a.shape = shape); a

exports.prototypeOf = prototypeOf = (x) ->
  if typeof x is 'number' then 0
  else if typeof x is 'string' then ' '
  else if x.aplPrototype? then x.aplPrototype
  else if isSimple(x) or not x.length then 0
  else if isSimple x[0] then prototypeOf x[0]
  else p = prototypeOf x[0]; withShape shapeOf(x[0]), (for [0...x[0].length] then p)

exports.withPrototype = withPrototype = (p, x) ->
  if (x instanceof Array) and (not x.length) and (p isnt 0) then x.aplPrototype = p
  x

exports.withPrototypeCopiedFrom = (y, x) ->
  if (x instanceof Array) and (not x.length) then withPrototype prototypeOf(y), x
  x



# Sum and product;  I wish JavaScript had a _reduce_ operator :)
exports.sum = (xs) -> r = 0; (for x in xs then r += x); r
exports.prod = (xs) -> r = 1; (for x in xs then r *= x); r

# `repeat(s, n)` catenates `n` instances of a string `s`.
exports.repeat = (s, n) -> r = ''; (for [0...n] then r += s); r

exports.die = (s) -> throw Error s
exports.assert = (flag, s = 'Assertion failed') -> if not flag then throw Error s
