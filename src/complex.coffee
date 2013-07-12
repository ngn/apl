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

  constructor: (@re = 0, @im = 0) ->
    assert typeof @re is 'number'
    assert typeof @im is 'number'

  toString: ->
    "#{@re}J#{@im}".replace /-/g, '¯'

  # Compare (`=`)
  #
  # 2j3=2j3   <=> 1
  # 2j3=3j2   <=> 0
  # 0j0       <=> 0
  # 123j0     <=> «123»
  # 2j¯3+¯2j3 <=> «0»
  '=': (z) ->
    if z instanceof Complex then +(@re is z.re and @im is z.im)
    else if typeof z is 'number' then +(@re is z and @im is 0)
    else 0

  'right_=': (args...) -> @['='] args...

  # Match (`≡`)
  '≡':       (args...) -> @['='] args...
  'right_≡': (args...) -> @['='] args...
