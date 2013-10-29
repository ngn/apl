addVocabulary

  # Zilde (`⍬`)
  #
  # ⍬     <=> 0⍴0
  # ⍴⍬    <=> ,0
  # ⍬←5   !!!
  # ⍳0    <=> ⍬
  # ⍴0    <=> ⍬
  # ⍬     <=> ⍬
  # ⍬⍬    <=> ⍬ ⍬
  # 1⍬2⍬3 <=> 1 ⍬ 2 ⍬ 3
  'get_⍬': -> APLArray.zilde
  'set_⍬': -> throw Error 'Symbol zilde (⍬) is read-only.'
