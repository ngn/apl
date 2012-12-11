if typeof define isnt 'function' then define = require('amdefine')(module)

define ->

  # Prototypal inheritance of JavaScript objects
  # (see [Douglas Crockford's explanation](http://javascript.crockford.com/prototypal.html))
  inherit = (x) ->
    f = (->); f.prototype = x; new f



  # Helpers for the APL data model
  isSimple = (x) -> not (x instanceof Array)
  shapeOf = (a) -> a.shape or if a.length? then [a.length] else []

  withShape = (shape, a) ->
    if shape? and a.length isnt prod shape
      console.info "a.length = #{a.length}, shape = #{JSON.stringify shape}"
      assert false
    if shape? and shape.length isnt 1 then a.shape = shape
    a

  prototypeOf = (x) ->
    if typeof x is 'number' then 0
    else if typeof x is 'string' then ' '
    else if x.aplPrototype? then x.aplPrototype
    else if isSimple(x) or not x.length then 0
    else if isSimple x[0] then prototypeOf x[0]
    else p = prototypeOf x[0]; withShape shapeOf(x[0]), (for [0...x[0].length] then p)

  withPrototype = withPrototype = (p, x) ->
    if (x instanceof Array) and (not x.length) and (p isnt 0) then x.aplPrototype = p
    x

  withPrototypeCopiedFrom = (y, x) ->
    if (x instanceof Array) and (not x.length) then withPrototype prototypeOf(y), x
    x



  # Sum and product;  I wish JavaScript had a _reduce_ operator :)
  sum = (xs) -> r = 0; (for x in xs then r += x); r
  prod = (xs) -> r = 1; (for x in xs then r *= x); r

  # `repeat(s, n)` catenates `n` instances of a string `s`.
  repeat = (s, n) -> r = ''; (for [0...n] then r += s); r

  die = (s) -> throw Error s
  assert = (flag, s = 'Assertion failed') -> if not flag then throw Error s

  {inherit, isSimple, shapeOf, withShape, prototypeOf, withPrototype, withPrototypeCopiedFrom, sum, prod, repeat, die, assert}
