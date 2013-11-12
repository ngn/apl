addVocabulary

  # [Phrasal forms](http://www.jsoftware.com/papers/fork1.htm)

  # Fork: `(fgh)⍵ ←→ (f⍵)g(h⍵)` ; `⍺(fgh)⍵ ←→ (⍺f⍵)g(⍺h⍵)`
  #
  # Arithmetic mean
  # (+/÷⍴) 4 5 10 7 <=> ,6.5
  #
  # Quadratic equation
  # a←1 ⋄ b←¯22 ⋄ c←85
  # ... √ ← {⍵*.5}
  # ... ((-b)(+,-)√(b*2)-4×a×c) ÷ 2×a
  # ... <=> 17 5
  #
  # Trains (longer forks)
  # (+,-,×,÷) 2   <=> 2 ¯2 1 .5
  # 1 (+,-,×,÷) 2 <=> 3 ¯1 2 .5
  _fork1: (h, g) ->
    assert typeof h is 'function'
    assert typeof g is 'function'
    [h, g]

  _fork2: ([h, g], f) ->
    assert typeof h is 'function'
    (b, a) -> g h(b, a), f b, a
