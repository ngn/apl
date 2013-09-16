{assert} = require './helpers'
{DomainError} = require './errors'

# complexify(x)
#   * if x is real, it's converted to a Complex instance with imaginary part 0
#   * if x is already complex, it's preserved
@complexify = complexify = (x) ->
  if typeof x is 'number'
    new Complex x, 0
  else if x instanceof Complex
    x
  else
    throw DomainError()

# simplify(re, im)
#   * if the imaginary part is 0, the real part is returned
#   * otherwise, a Complex instance is created
@simplify = simplify = (re, im) -> if im then new Complex re, im else re

@Complex = class Complex

  constructor: (@re, @im = 0) ->
    assert typeof @re is 'number'
    assert typeof @im is 'number'

  toString: ->
    "#{@re}J#{@im}".replace /-/g, '¯'

  @exp = exp = (x) ->
    r = Math.exp x.re
    simplify(
      r * Math.cos x.im
      r * Math.sin x.im
    )

  @log = log = (x) ->
    x = complexify x
    simplify(
      Math.log Math.sqrt x.re * x.re + x.im * x.im
      Math.atan2 x.im, x.re
    )

  @conjugate = (x) -> new Complex x.re, -x.im

  @negate = (x) -> new Complex -x.re, -x.im

  @add = (x, y) ->
    x = complexify x
    y = complexify y
    simplify x.re + y.re, x.im + y.im

  @subtract = (x, y) ->
    x = complexify x
    y = complexify y
    simplify x.re - y.re, x.im - y.im

  @multiply = multiply = (x, y) ->
    x = complexify x
    y = complexify y
    simplify x.re * y.re - x.im * y.im, x.re * y.im + x.im * y.re

  @divide = (x, y) ->
    x = complexify x
    y = complexify y
    d = y.re * y.re + y.im * y.im
    simplify (x.re * y.re + x.im * y.im) / d, (y.re * x.im - y.im * x.re) / d

  @pow = pow = (x, y) -> exp multiply(y, log x)

  @sqrt = (x) ->
    if typeof x is 'number' and x >= 0
      Math.sqrt x
    else
      pow x, 0.5
