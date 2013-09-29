{assert, isInt} = require '../helpers'
{conjunction} = require './vhelpers'
{APLArray} = require '../array'

@vocabulary =

  # Power operator (`⍣`)
  #
  # ({⍵+1}⍣5) 3 <=> 8
  # ({⍵+1}⍣0) 3 <=> 3
  # (⍴⍣3)2 2⍴⍳4 <=> ,1
  # 'a'(,⍣3)'b' <=> 'aaab'
  # 1(+÷)⍣=1    <=> 1.618033988749895
  # c←0 ⋄ 5⍣{c←c+1}0 ⋄ c <=> 5
  '⍣': conjunction (g, f) ->
    if f instanceof APLArray and typeof g is 'function'
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
