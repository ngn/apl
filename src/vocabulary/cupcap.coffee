addVocabulary

  '∪': (⍵, ⍺) ->
    if ⍺

      # Union (`∪`)
      #
      # 1 2∪2 3     <=> 1 2 3
      # 'SHOCK'∪'CHOCOLATE' <=> 'SHOCKLATE'
      # 1∪1         <=> ,1
      # 1∪2         <=> 1 2
      # 1∪2 1       <=> 1 2
      # 1 2∪2 2 2 2 <=> 1 2
      # 1 2∪2 2⍴3   !!! RANK ERROR
      # (2 2⍴3)∪4 5 !!! RANK ERROR
      # ⍬∪1         <=> ,1
      # 1 2∪⍬       <=> 1 2
      # ⍬∪⍬         <=> ⍬
      #
      # 'lentils' 'bulghur' (3 4 5) ∪ 'lentils' 'rice'
      # ... <=> 'lentils' 'bulghur' (3 4 5) 'rice'
      data = []
      for a in [⍺, ⍵]
        if a.shape.length > 1
          rankError()
        each a, (x) -> if not contains data, x then data.push x
      new APLArray data

    else

      # Unique (`∪`)
      #
      # ∪3 17 17 17 ¯3 17 0 <=> 3 17 ¯3 0
      # ∪3 17               <=> 3 17
      # ∪17                 <=> ,17
      # ∪⍬                  <=> ⍬
      data = []
      each ⍵, (x) -> if not contains data, x then data.push x
      new APLArray data

  '∩': (⍵, ⍺) ->
    if ⍺

      # Intersection (`∩`)
      #
      # 'ABRA'∩'CAR'    <=> 'ARA'
      # 1 'PLUS' 2 ∩ ⍳5 <=> 1 2
      data = []
      b = ⍵.toArray()
      for x in ⍺.toArray() when contains b, x then data.push x
      new APLArray data

    else
      nonceError()

contains = (a, x) ->
  assert a instanceof Array
  for y in a when match x, y then return true
  false
