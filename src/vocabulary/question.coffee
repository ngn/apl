{APLArray} = require '../array'
{DomainError} = require '../errors'
{real, pervasive} = require './vhelpers'

@vocabulary =

  '?': (omega, alpha) ->
    if alpha then deal omega, alpha else roll omega

# Roll (`?`)
#
# n←6 ⋄ r←?n ⋄ (0≤r)∧(r<n) <=> 1
# ?0                       <=> 0
# ?1                       <=> 0
roll = pervasive monad: real (x) -> Math.floor Math.random() * x

# Deal (`?`)
#
# n←100 ⋄ (+/n?n)=(+/⍳n)
# ... <=> 1 # a permutation (an "n?n" dealing) contains all 0...n
# n←100 ⋄ A←(n÷2)?n ⋄ ∧/(0≤A),A<n
# ... <=> 1 # any number x in a dealing is 0 <= x < n
# 0 ? 100 <=> ⍬
# 0 ? 0   <=> ⍬
# 1 ? 1   <=> ,0
# 5 ? 3   !!! DOMAIN ERROR
deal = (omega, alpha) ->
  y = omega.unwrap()
  x = alpha.unwrap()
  if x > y then throw DomainError()
  available = [0...y]
  new APLArray(for [0...x] then available.splice(Math.floor(available.length * Math.random()), 1)[0])
