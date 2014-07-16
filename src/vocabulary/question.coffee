addVocabulary
  '?': (⍵, ⍺) ->
    if ⍺ then deal ⍵, ⍺ else roll ⍵

# n←6 ⋄ r←?n ⋄ (0≤r)∧(r<n) ←→ 1
# ?0   !!! DOMAIN ERROR
# ?1   ←→ 0
# ?1.5 !!! DOMAIN ERROR
# ?'a' !!! DOMAIN ERROR
# ?1j2 !!! DOMAIN ERROR
# ?∞   !!! DOMAIN ERROR
roll = pervasive monad: (⍵) ->
  if !isInt ⍵, 1 then domainError()
  Math.floor Math.random() * ⍵

# n←100 ⋄ (+/n?n)=(+/⍳n) ←→ 1 # a permutation (an "n?n" dealing) contains all 0...n
# n←100 ⋄ A←(n÷2)?n ⋄ ∧/(0≤A),A<n ←→ 1 # any number x in a dealing is 0 <= x < n
# 0?100 ←→ ⍬
# 0?0   ←→ ⍬
# 1?1   ←→ ,0
# 1?1 1 !!! LENGTH ERROR
# 5?3   !!! DOMAIN ERROR
# ¯1?3  !!! DOMAIN ERROR
deal = (⍵, ⍺) ->
  ⍺ = ⍺.unwrap()
  ⍵ = ⍵.unwrap()
  if !(isInt(⍵, 0) and isInt ⍺, 0, ⍵ + 1) then domainError()
  r = [0...⍵]
  for i in [0...⍺] by 1
    j = i + Math.floor Math.random() * (⍵ - i)
    h = r[i]; r[i] = r[j]; r[j] = h
  new A r[...⍺]
