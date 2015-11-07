addVocabulary

  '∪': (om, al) ->
    if al
      # 1 2∪2 3     ←→ 1 2 3
      # 'SHOCK'∪'CHOCOLATE' ←→ 'SHOCKLATE'
      # 1∪1         ←→ ,1
      # 1∪2         ←→ 1 2
      # 1∪2 1       ←→ 1 2
      # 1 2∪2 2 2 2 ←→ 1 2
      # 1 2∪2 2⍴3   !!! RANK ERROR
      # (2 2⍴3)∪4 5 !!! RANK ERROR
      # ⍬∪1         ←→ ,1
      # 1 2∪⍬       ←→ 1 2
      # ⍬∪⍬         ←→ ⍬
      # 'lentils' 'bulghur'(3 4 5)∪'lentils' 'rice' ←→ 'lentils' 'bulghur'(3 4 5)'rice'
      data = []
      for a in [al, om]
        if a.shape.length > 1 then rankError()
        each a, (x) -> if !contains data, x then data.push x
      new A data
    else
      # ∪3 17 17 17 ¯3 17 0 ←→ 3 17 ¯3 0
      # ∪3 17               ←→ 3 17
      # ∪17                 ←→ ,17
      # ∪⍬                  ←→ ⍬
      data = []
      each om, (x) -> if !contains data, x then data.push x
      new A data

  '∩': (om, al) ->
    if al
      # 'ABRA'∩'CAR' ←→ 'ARA'
      # 1'PLUS'2∩⍳5  ←→ 1 2
      data = []
      b = om.toArray()
      for x in al.toArray() when contains b, x then data.push x
      new A data
    else
      nonceError()

contains = (a, x) ->
  assert a.length?
  for y in a when match x, y then return true
  false
