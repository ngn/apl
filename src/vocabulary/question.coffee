addVocabulary

  '?': (⍵, ⍺) ->
    if ⍺ then deal ⍵, ⍺ else roll ⍵

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
deal = (⍵, ⍺) ->
  y = ⍵.unwrap()
  x = ⍺.unwrap()
  if x > y then domainError()
  available = [0...y]
  new APLArray(for [0...x] then available.splice(Math.floor(available.length * Math.random()), 1)[0])
