# `complex.coffee` is a rather meagre implementation of complex numbers.  Only
# basic arithmetic operations are supported.
#
# More importantly, `complex.coffee` demonstrates how one can implement
# custom APL objects.
{die, assert} = require './helpers'

C = (re, im) -> if im then new Complex re, im else re

@Complex = class Complex

  constructor: (@re = 0, @im = 0) ->
    assert typeof @re is 'number'
    assert typeof @im is 'number'

  toString: ->
    "#{@re}J#{@im}".replace /-/g, '¯'

  # Compare (`=`)
  #
  #     2j3 = 2j3   ⍝ returns 1
  #     2j3 = 3j2   ⍝ returns 0
  #     0j0         ⍝ returns 0
  #     123j0       ⍝ returns «123»
  #     2j¯3 + ¯2j3 ⍝ returns «0»
  '=': (x) ->
    if x instanceof Complex then +(@re is x.re and @im is x.im)
    else if typeof x is 'number' then +(@re is x and @im is 0)
    else 0

  'right_=': (args...) -> @['='] args...

  # Match (`≡`)
  '≡':       (args...) -> @['='] args...
  'right_≡': (args...) -> @['='] args...

  # Add / Conjugate (`+`)
  #
  #     1j¯2 + ¯2j3   ⍝ returns ¯1j1
  #     +1j¯2         ⍝ returns 1j2
  '+': (x) ->
    if x?
      if typeof x is 'number' then C @re + x, @im
      else if x instanceof Complex then C @re + x.re, @im + x.im
      else throw Error 'Unsupported operation'
    else
      C @re, -@im

  'right_+': (args...) -> @['+'] args...

  # Subtract / Negate (`-`)
  #
  #     5j2 - 3j8   ⍝ returns 2j¯6
  '-': (x) ->
    if x?
      if typeof x is 'number' then C @re - x, @im
      else if x instanceof Complex then C @re - x.re, @im - x.im
      else throw Error 'Unsupported operation'
    else
      C -@re, -@im

  #     5 - 3j8   ⍝ returns 2j¯8
  'right_-': (x) ->
    (if x instanceof Complex then x else new Complex x, 0)['-'] @

  # Multiply / Sign of (`×`)
  #
  #     1j¯2 × ¯2j3   ⍝ returns 4j7
  #     × 1j¯2        ⍝ throws
  '×': (x) ->
    if x?
      if typeof x is 'number' then C x * @re, x * @im
      else if x instanceof Complex
        C @re * x.re - @im * x.im, @re * x.im + @im * x.re
      else throw Error 'Unsupported operation'
    else
      throw Error 'Unsupported operation'

  #     2 × 1j¯2      ⍝ returns 2j¯4
  'right_×': (args...) -> @['×'] args...

  # Divide / Reciprocal (`÷`)
  #
  #     1j¯2 ÷ 4j7    ⍝ returns ¯2j3
  '÷': (x) ->
    if x?
      if typeof x is 'number' then C @re / x, @im / x
      else if x instanceof Complex
        d = @re * @re + @im * @im
        C (@re * x.re + @im * x.im) / d, (@re * x.im - @im * x.re) / d
      else throw Error 'Unsupported operation'
    else
      d = @re * @re + @im * @im
      C @re / d, -@im / d

  'right_÷': (x) ->
    (if x instanceof Complex then x else new Complex x, 0)['÷'] @
