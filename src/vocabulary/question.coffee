addVocabulary
  '?': (om, al) ->
    if al then deal om, al else roll om

# n←6 ⋄ r←?n ⋄ (0≤r)∧(r<n) ←→ 1
# ?0   !!! DOMAIN ERROR
# ?1   ←→ 0
# ?1.5 !!! DOMAIN ERROR
# ?'a' !!! DOMAIN ERROR
# ?1j2 !!! DOMAIN ERROR
# ?∞   !!! DOMAIN ERROR
roll = pervasive monad: (om) ->
  if !isInt om, 1 then domainError()
  Math.floor Math.random() * om

# n←100 ⋄ (+/n?n)=(+/⍳n) ←→ 1 # a permutation (an "n?n" dealing) contains all 0...n
# n←100 ⋄ A←(n÷2)?n ⋄ ∧/(0≤A),A<n ←→ 1 # any number x in a dealing is 0 <= x < n
# 0?100 ←→ ⍬
# 0?0   ←→ ⍬
# 1?1   ←→ ,0
# 1?1 1 !!! LENGTH ERROR
# 5?3   !!! DOMAIN ERROR
# ¯1?3  !!! DOMAIN ERROR
deal = (om, al) ->
  al = al.unwrap()
  om = om.unwrap()
  if !(isInt(om, 0) and isInt al, 0, om + 1) then domainError()
  r = [0...om]
  for i in [0...al] by 1
    j = i + Math.floor Math.random() * (om - i)
    h = r[i]; r[i] = r[j]; r[j] = h
  new A r[...al]
