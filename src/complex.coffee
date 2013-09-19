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
@simplify = simplify = (re, im) -> if im isnt 0 then new Complex re, im else re

@Complex = class Complex

  constructor: (@re, @im = 0) ->
    assert typeof @re is 'number'
    assert typeof @im is 'number'
    if isNaN(@re) or isNaN(@im) then throw DomainError 'NaN'

  toString: ->
    "#{@re}J#{@im}".replace /-|Infinity/g, '¯'

  @exp = exp = (x) ->
    x = complexify x
    r = Math.exp x.re
    simplify(
      r * Math.cos x.im
      r * Math.sin x.im
    )

  @log = log = (x) ->
    if typeof x is 'number' and x > 0
      Math.log x
    else
      x = complexify x
      simplify(
        Math.log Math.sqrt x.re * x.re + x.im * x.im
        direction x
      )

  @conjugate = (x) -> new Complex x.re, -x.im

  @negate = negate = (x) -> new Complex -x.re, -x.im

  @itimes = itimes = (x) ->
    x = complexify x
    simplify -x.im, x.re

  @negitimes = negitimes = (x) ->
    x = complexify x
    simplify x.im, -x.re

  @add = add = (x, y) ->
    x = complexify x
    y = complexify y
    simplify x.re + y.re, x.im + y.im

  @subtract = subtract = (x, y) ->
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

  @pow = pow = (x, y) ->
    if typeof x is typeof y is 'number' and x >= 0
      Math.pow x, y
    else
      exp multiply(y, log x)

  @sqrt = sqrt = (x) ->
    if typeof x is 'number' and x >= 0
      Math.sqrt x
    else
      pow x, 0.5

  @magnitude = (x) ->
    Math.sqrt x.re * x.re + x.im * x.im

  @direction = direction = (x) ->
    Math.atan2 x.im, x.re

  @sin = (x) -> negitimes sinh itimes x

  @cos = (x) -> cosh itimes x

  @tan = (x) -> negitimes tanh itimes x

  @asin = asin = (x) -> # arcsin x = -i ln(ix + sqrt(1 - x^2))
    x = complexify x
    negitimes log add(
      itimes x
      sqrt subtract 1, pow x, 2
    )

  @acos = acos = (x) -> # arccos x = -i ln(x + i sqrt(x^2 - 1))
    x = complexify x
    r = negitimes log add(
      x
      sqrt subtract pow(x, 2), 1
    )
    # TODO look up the algorithm for determining the sign of arccos; the following line is dubious
    if r instanceof Complex and (r.re < 0 or (r.re is 0 and r.im < 0)) then negate r else r

  @atan = atan = (x) -> # arctan x = (i/2) (ln(1-ix) - ln(1+ix))
    x = complexify x
    ix = itimes x
    multiply new Complex(0, .5), subtract(
      log subtract 1, ix
      log add 1, ix
    )

  @sinh = sinh = (x) ->
    a = Complex.exp x
    b = Complex.divide 1, a
    Complex.multiply 0.5, (Complex.subtract a, b)

  @cosh = cosh = (x) ->
    a = Complex.exp x
    b = Complex.divide 1, a
    Complex.multiply 0.5, (Complex.add a, b)

  @tanh = tanh = (x) ->
    a = Complex.exp x
    b = Complex.divide 1, a
    Complex.divide (Complex.subtract a, b), (Complex.add a, b)

  @asinh = (x) -> # arcsinh x = i arcsin(-ix)
    itimes asin negitimes x

  @acosh = (x) -> # arccosh x = +/- i arccos x
    x = complexify x
    sign = if x.im > 0 or (x.im is 0 and x.re <= 1) then 1 else -1
    multiply new Complex(0, sign), acos x

  @atanh = (x) -> # arctanh x = i arctan(-ix)
    itimes atan negitimes x

  @floor = (x) ->
    if typeof x is 'number'
      Math.floor x
    else
      x = complexify x
      [re, im] = [(Math.floor x.re), (Math.floor x.im)]
      [r, i] = [x.re - re, x.im - im]
      if r + i >= 1
        if r >= i then re++ else im++
      simplify re, im

  @ceil = (x) ->
    if typeof x is 'number'
      Math.ceil x
    else
      x = complexify x
      [re, im] = [(Math.ceil x.re), (Math.ceil x.im)]
      [r, i] = [re - x.re, im - x.im]
      if r + i >= 1
        if r >= i then re-- else im--
      simplify re, im
