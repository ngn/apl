{assert} = require './helpers'
{DomainError} = require './errors'

# complexify(x)
#   * if x is real, it's converted to a Complex instance with imaginary part 0
#   * if x is already complex, it's preserved
@complexify = (x) ->
  if typeof x is 'number'
    new Complex x, 0
  else if x instanceof Complex
    x
  else
    throw DomainError()

# simplify(re, im)
#   * if the imaginary part is 0, the real part is returned
#   * otherwise, a Complex instance is created
@simplify = (re, im) -> if im then new Complex re, im else re

@Complex = class Complex

  constructor: (@re, @im = 0) ->
    assert typeof @re is 'number'
    assert typeof @im is 'number'

  toString: ->
    "#{@re}J#{@im}".replace /-/g, '¯'
