addVocabulary

  '↓': (⍵, ⍺, axis) ->
    if ⍺

      # Drop (`↓`)
      #
      # 4↓'OVERBOARD'            <=> 'BOARD'
      # ¯5↓'OVERBOARD'           <=> 'OVER'
      # ⍴10↓'OVERBOARD'          <=> ,0
      # 0 ¯2↓ 3 3 ⍴ 'ONEFATFLY'  <=> 3 1 ⍴ 'OFF'
      # ¯2 ¯1↓ 3 3 ⍴ 'ONEFATFLY' <=> 1 2 ⍴ 'ON'
      # 1↓ 3 3 ⍴ 'ONEFATFLY'     <=> 2 3 ⍴ 'FATFLY'
      # ⍬↓3 3⍴⍳9                 <=> 3 3⍴⍳9
      # 1 1↓ 2 3 4⍴"ABCDEFGHIJKLMNOPQRSTUVWXYZ"   <=> 1 2 4 ⍴ 'QRSTUVWX'
      # ¯1 ¯1↓ 2 3 4⍴"ABCDEFGHIJKLMNOPQRSTUVWXYZ" <=> 1 2 4 ⍴ 'ABCDEFGH'
      # 1↓0                      <=> ⍬
      # 0 1↓2                    <=> 1 0⍴0
      # 1 2↓3                    <=> 0 0⍴0
      # ⍬↓0                      <=> 0
      if ⍴⍴(⍺) > 1 then rankError()
      a = ⍺.toArray()
      for x in a when not isInt x then domainError()
      if !⍴⍴ ⍵
        ⍵ = new APLArray ⍵.data, repeat([1], a.length), repeat([0], a.length), ⍵.offset
      else
        if a.length > ⍴⍴ ⍵
          rankError()

      shape = ⍴(⍵)[..]
      offset = ⍵.offset
      for x, i in a
        shape[i] = Math.max 0, ⍴(⍵)[i] - Math.abs x
        if x > 0
          offset += x * ⍵.stride[i]

      if prod(shape) is 0
        new APLArray [], shape
      else
        new APLArray ⍵.data, shape, ⍵.stride, offset

    else

      # Split (`↓`)
      #
      # ↓1 2 3 <=> ⊂1 2 3
      # ↓(1 2)(3 4) <=> ⊂(1 2)(3 4)
      # ↓2 2⍴⍳4 <=> (0 1)(2 3)
      # ↓2 3 4⍴⍳24 <=> 2 3⍴(0 1 2 3)(4 5 6 7)(8 9 10 11)(12 13 14 15)(16 17 18 19)(20 21 22 23)
      if !⍴⍴ ⍵ then nonceError 'Split of scalar not implemented'
      oshape = ⍴(⍵)[...⍴⍴(⍵) - 1]
      obound = oshape.reduce ((a, b) -> a * b), 1
      ishape = ⍴(⍵)[⍴⍴(⍵) - 1]
      array = ⍵.toArray()
      data = []
      for i in [0...obound]
        offset = i * ishape
        data.push new APLArray array[offset...offset + ishape]
      new APLArray data, oshape
