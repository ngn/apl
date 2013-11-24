addVocabulary

  '∊': aka '∈', (⍵, ⍺) ->
    if ⍺
      # Membership (`∊`)
      #
      # 2 3 4 5 6 ∊ 1 2 3 5 8 13 21 <=> 1 1 0 1 0
      # 5 ∊ 1 2 3 5 8 13 21         <=> 1
      a = ⍵.toArray()
      ⍺.map (x) ->
        for y in a when match x, y then return 1
        0
    else
      # Enlist (`∊`)
      #
      # ∊ 17                      <=> ,17
      # ⍴ ∊ (1 2 3) "ABC" (4 5 6) <=> ,9
      # ∊ 2 2⍴(1 + 2 2⍴⍳4) "DEF" (1 + 2 3⍴⍳6) (7 8 9)
      # ... <=> 1 2 3 4,'DEF',1 2 3 4 5 6 7 8 9
      data = []
      enlist ⍵, data
      new APLArray data

enlist = (x, r) ->
  if x instanceof APLArray
    each x, (y) -> enlist y, r
  else
    r.push x
