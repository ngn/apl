{APLArray} = require '../array'
{numeric, pervasive} = require './vhelpers'

# Roll (`?`)
#
#     n←6 ◇ r←?n ◇ (0≤r)∧(r<n)   ⍝ returns 1
#     ?0                         ⍝ returns 0
#     ?1                         ⍝ returns 0
#     ⍕?(,2) 3 4 5
roll = pervasive monad: numeric (x) -> Math.floor Math.random() * x

# Deal (`?`)
#
#     n←100 ◇ (+/n?n)=(+/⍳n)
#     ... ⍝ returns 1 # a permutation (an "n?n" dealing) contains all 0...n
#     n←100 ◇ A←(n÷2)?n ◇ ∧/(0≤A),A<n
#     ... ⍝ returns 1 # any number x in a dealing is 0 <= x < n
#     0 ? 100  ⍝ returns ⍬
#     0 ? 0    ⍝ returns ⍬
#     1 ? 1    ⍝ returns ,0
#     5 ? 3    ⍝ throws
deal = (omega, alpha) ->
  y = omega.unbox()
  x = alpha.unbox()
  if x > y then throw Error 'DOMAIN ERROR'
  available = [0...y]
  new APLArray(for [0...x] then available.splice(Math.floor(available.length * Math.random()), 1)[0])

@['?'] = (omega, alpha) ->
  if alpha then deal omega, alpha else roll omega
