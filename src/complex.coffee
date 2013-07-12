# `complex.coffee` is a rather meagre implementation of complex numbers.  Only
# basic arithmetic operations are supported.
#
# More importantly, `complex.coffee` demonstrates how one can implement
# custom APL objects.
{assert} = require './helpers'
{DomainError} = require './errors'

@complexify = (x) ->
  if typeof x is 'number'
    new Complex x, 0
  else if x instanceof Complex
    x
  else
    throw DomainError()

@simplify = (re, im) -> if im then new Complex re, im else re

@Complex = class Complex

  constructor: (@re, @im = 0) ->
    assert typeof @re is 'number'
    assert typeof @im is 'number'

  toString: ->
    "#{@re}J#{@im}".replace /-/g, '¯'
