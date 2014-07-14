addVocabulary
  # 12=12               ←→ 1
  # 2=12                ←→ 0
  # "Q"="Q"             ←→ 1
  # 1="1"               ←→ 0
  # "1"=1               ←→ 0
  # 11 7 2 9=11 3 2 6   ←→ 1 0 1 0
  # "STOAT"="TOAST"     ←→ 0 0 0 0 1
  # 8=2+2+2+2           ←→ 1
  # (2 3⍴1 2 3 4 5 6)=2 3⍴3 3 3 5 5 5 ←→ 2 3⍴0 0 1 0 1 0
  # 3=2 3⍴1 2 3 4 5 6   ←→ 2 3⍴0 0 1 0 0 0
  # 3=(2 3⍴1 2 3 4 5 6)(2 3⍴3 3 3 5 5 5)
  # ... ←→ (2 3⍴0 0 1 0 0 0)(2 3⍴1 1 1 0 0 0)
  # 2j3=2j3             ←→ 1
  # 2j3=3j2             ←→ 0
  # 0j0                 ←→ 0
  # 123j0               ←→ 123
  # 2j¯3+¯2j3           ←→ 0
  # =/⍬                 ←→ 1
  '=': withIdentity 1, pervasive dyad: eq = (y, x) ->
    if x instanceof Complex and y instanceof Complex
      +(x.re is y.re and x.im is y.im)
    else
      +(x is y)

  # 3≢5 ←→ 1
  # 8≠8 ←→ 0
  # ≠/⍬ ←→ 0
  '≠': withIdentity 0, pervasive dyad: (y, x) -> 1 - eq y, x

  # </⍬ ←→ 0
  '<': withIdentity 0, pervasive dyad: real (y, x) -> +(x < y)

  # >/⍬ ←→ 0
  '>': withIdentity 0, pervasive dyad: real (y, x) -> +(x > y)

  # ≤/⍬ ←→ 1
  '≤': withIdentity 1,  pervasive dyad: real (y, x) -> +(x <= y)

  # ≥/⍬ ←→ 1
  '≥': withIdentity 1,  pervasive dyad: real (y, x) -> +(x >= y)

  '≡': (⍵, ⍺) ->
    if ⍺
      # 3≡3                    ←→ 1
      # 3≡,3                   ←→ 0
      # 4 7.1 8≡4 7.2 8        ←→ 0
      # (3 4⍴⍳12)≡3 4⍴⍳12      ←→ 1
      # (3 4⍴⍳12)≡⊂3 4⍴⍳12     ←→ 0
      # ("ABC" "DEF")≡"ABCDEF" ←→ 0
      #! (⍳0)≡""               ←→ 0
      # (2 0⍴0)≡(0 2⍴0)        ←→ 0
      #! (0⍴1 2 3)≡0⍴⊂2 2⍴⍳4   ←→ 0
      APLArray.bool[+match ⍵, ⍺]
    else
      # ≡4                      ←→ 0
      # ≡⍳4                     ←→ 1
      # ≡2 2⍴⍳4                 ←→ 1
      # ≡"abc"1 2 3(23 55)      ←→ 2
      # ≡"abc"(2 4⍴"abc"2 3"k") ←→ 3
      new APLArray [depthOf ⍵], []

depthOf = (x) ->
  if x instanceof APLArray
    if (!⍴⍴ x) and (x.data[0] !instanceof APLArray) then return 0
    r = 0
    each x, (y) -> r = Math.max r, depthOf y
    r + 1
  else
    0
