{assert, isInt} = require '../helpers'
{conjunction} = require './vhelpers'

@vocabulary =

  # Power operator (`⍣`)
  #
  # ({⍵+1}⍣5) 3 <=> 8
  # ({⍵+1}⍣0) 3 <=> 3
  # (⍴⍣3)2 2⍴⍳4 <=> ,1
  # 'a'(,⍣3)'b' <=> 'aaab'
  # 1(+÷)⍣=1    <=> 1.618033988749895
  '⍣': conjunction (g, f) ->
    if typeof f is 'number' and typeof g is 'function'
      h = f; f = g; g = h
    else
      assert typeof f is 'function'

    if typeof g is 'function'
      (omega, alpha) -> # "power limit" operator
        loop
          omega1 = f omega, alpha
          if g(omega, omega1).toBool() then return omega
          omega = omega1
    else
      n = g.toInt 0
      (omega, alpha) ->
        for [0...n] then omega = f omega, alpha
        omega
