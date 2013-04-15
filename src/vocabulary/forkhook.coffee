{assert} = require '../helpers'

# [Phrasal forms](http://www.jsoftware.com/papers/fork1.htm)

# Hook: `(fg)⍵ ←→ ⍵fg⍵` ; `⍺(fg)⍵ ←→ ⍺fg⍵`
#
#     # Approximations of pi through continued fractions
#!    (+÷)\3 7 16 ¯294
#!    ... ⍝ returns (3
#!    ...            3.142857142857143
#!    ...            3.1415929203539825
#!    ...            3.141592653921421)
#
#     # Test if a number is an integer
#     (=⌊) 123     ⍝ returns 1
#     (=⌊) 123.4   ⍝ returns 0
#
#     # Approximation of the number of primes below a certain limit
#     (÷⍟) 1000    ⍝ returns 144.76482730108395
@['⎕hook'] = (g, f) ->
  assert typeof f is 'function'
  assert typeof g is 'function'
  (b, a) -> f g(b), (a ? b)

# Fork: `(fgh)⍵ ←→ (f⍵)g(h⍵)` ; `⍺(fgh)⍵ ←→ (⍺f⍵)g(⍺h⍵)`
#
#     # Arithmetic mean
#     avg ← +/ ÷ ⍴   ◇ avg 4 5 10 7   ⍝ returns ,6.5
#
#     # Quadratic equation
#     a←1 ◇ b←¯22 ◇ c←85
#     ... √ ← {⍵*.5}
#     ... ((-b)(+,-)√(b*2)-4×a×c) ÷ 2×a
#     ... ⍝ returns 17 5
#
#     # Trains (longer forks)
#     (+,-,×,÷) 2     ⍝ returns 2 ¯2 1 .5
#     1 (+,-,×,÷) 2   ⍝ returns 3 ¯1 2 .5
@['⎕fork'] = (verbs) ->
  assert verbs.length % 2 is 1
  assert verbs.length >= 3
  for f in verbs then assert typeof f is 'function'
  (b, a) ->
    r = verbs[verbs.length - 1] b, a
    for i in [verbs.length - 2 ... 0] by -2
      r = verbs[i] r, verbs[i - 1] b, a
    r
