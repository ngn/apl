# `complex.coffee` is a rather meagre implementation of complex numbers.  Only
# basic arithmetic operations are supported.
#
# More importantly, `complex.coffee` demonstrates how one can implement
# custom APL objects.
{assert} = require './helpers'

C = (re, im) -> if im then new Complex re, im else re

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

  # Add / Conjugate (`+`)
  #
  # 1j¯2+¯2j3 <=> ¯1j1
  # +1j¯2     <=> 1j2
  '+': (z) ->
    if z?
      if typeof z is 'number' then C @re + z, @im
      else if z instanceof Complex then C @re + z.re, @im + z.im
      else throw Error 'Unsupported operation'
    else
      C @re, -@im

  'right_+': (args...) -> @['+'] args...

  # Subtract / Negate (`-`)
  #
  # 5j2-3j8 <=> 2j¯6
  '-': (z) ->
    if z?
      if typeof z is 'number' then C @re - z, @im
      else if z instanceof Complex then C @re - z.re, @im - z.im
      else throw Error 'Unsupported operation'
    else
      C -@re, -@im

  # 5-3j8 <=> 2j¯8
  'right_-': (z) ->
    (if z instanceof Complex then z else new Complex z, 0)['-'] @

  # Multiply / Sign of (`×`)
  #
  # 1j¯2×¯2j3 <=> 4j7
  # ×1j¯2     !!!
  '×': (z) ->
    if z?
      if typeof z is 'number' then C z * @re, z * @im
      else if z instanceof Complex
        C @re * z.re - @im * z.im, @re * z.im + @im * z.re
      else throw Error 'Unsupported operation'
    else
      throw Error 'Unsupported operation'

  # 2×1j¯2 <=> 2j¯4
  'right_×': (args...) -> @['×'] args...

  # Divide / Reciprocal (`÷`)
  #
  # 4j7÷1j¯2 <=> ¯2j3
  # 0j2÷0j1  <=> 2
  # 5÷2j1    <=> 2j¯1
  '÷': (z) ->
    if z?
      if typeof z is 'number' then C @re / z, @im / z
      else if z instanceof Complex
        d = z.re * z.re + z.im * z.im
        C (@re * z.re + @im * z.im) / d, (z.re * @im - z.im * @re) / d
      else throw Error 'Unsupported operation'
    else
      d = @re * @re + @im * @im
      C @re / d, -@im / d

  'right_÷': (z) ->
    (if z instanceof Complex then z else new Complex z, 0)['÷'] @
