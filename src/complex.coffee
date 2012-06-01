exports.Complex = class Complex

  constructor: (@re = 0, @im = 0) ->
    if not @im then return @re

  toString: ->
    "#{@re}J#{@im}".replace /-/g, '¯'

  '=': (x) ->
    +((x instanceof Complex) and x.re is @re and x.im is @im)

  '+': (x) ->
    if x? # dyadic: Add
      if typeof x is 'number' then new Complex @re + x, @im
      else if x instanceof Complex then new Complex @re + x.re, @im + x.im
      else throw Error 'Unsupported operation'
    else # monadic: Conjugate
      new Complex @re, -@im

  '−': (x) ->
    if x? # dyadic: Subtract
      if typeof x is 'number' then new Complex @re - x, @im
      else if x instanceof Complex then new Complex @re - x.re, @im - x.im
      else throw Error 'Unsupported operation'
    else # monadic: Negate
      new Complex -@re, -@im

  '×': (x) ->
    if x? # dyadic: Multiply
      if typeof x is 'number' then new Complex x * @re, x * @im
      else if x instanceof Complex then new Complex @re * x.re - @im * x.im, @re * x.im + @im * x.re
      else throw Error 'Unsupported operation'
    else # monadic: Sign of
      throw Error 'Unsupported operation'

  '÷': (x) ->
    if x? # dyadic: Divide
      if typeof x is 'number' then new Complex @re / x, @im / x
      else if x instanceof Complex
        d = x.re * x.re + x.im * x.im
        new Complex((@re * x.re + @im * x.im) / d, (@im * x.re - @re * x.im) / d)
      else throw Error 'Unsupported operation'
    else # monadic: Reciprocal
      d = @re * @re + @im * @im
      new Complex @re / d, -@im / d
