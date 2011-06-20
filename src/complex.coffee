#!/usr/bin/env coffee

class Complex

  constructor: (@re = 0, @im = 0) ->
    if not @im then return @re

  toString: ->
    "#{@re}J#{@im}".replace /-/g, '¯'

  '+': (x) ->
    if typeof x is 'number' then new Complex @re + x, @im
    else if x instanceof Complex then new Complex @re + x.re, @im + x.im
    else throw Error 'Unsupported operation'

  '×': (x) ->
    if typeof x is 'number' then new Complex x * @re, x * @im
    else if x instanceof Complex then new Complex @re * x.re - @im * x.im, @re * x.im + @im * x.re
    else throw Error 'Unsupported operation'

  '=': (x) ->
    +((x instanceof Complex) and x.re is @re and x.im is @im)



exports.Complex = Complex
