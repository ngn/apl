addVocabulary

  '⌽': rotate = (⍵, ⍺, axis) ->
    assert typeof axis is 'undefined' or axis instanceof APLArray
    if ⍺
      # Rotate (`⌽`)
      #
      # 1⌽1 2 3 4 5 6             <=> 2 3 4 5 6 1
      # 3⌽'ABCDEFGH'              <=> 'DEFGHABC'
      # 3⌽2 5⍴1 2 3 4 5 6 7 8 9 0 <=> 2 5⍴4 5 1 2 3 9 0 6 7 8
      # ¯2⌽"ABCDEFGH"             <=> 'GHABCDEF'
      # 1⌽3 3⍴⍳9                  <=> 3 3⍴1 2 0 4 5 3 7 8 6
      # 0⌽1 2 3 4                 <=> 1 2 3 4
      # 0⌽1234                    <=> 1234
      # 5⌽⍬                       <=> ⍬
      axis = if !axis then ⍴⍴(⍵) - 1 else axis.unwrap()
      if !isInt axis then domainError()
      if ⍴⍴(⍵) and !(0 <= axis < ⍴⍴ ⍵) then indexError()
      step = ⍺.unwrap()
      if !isInt step then domainError()
      if !step then return ⍵
      n = ⍴(⍵)[axis]
      step = (n + (step % n)) % n # force % to handle negatives properly
      if ⍵.empty() or step is 0 then return ⍵
      data = []
      {shape, stride} = ⍵
      p = ⍵.offset
      indices = repeat [0], shape.length
      loop
        data.push ⍵.data[p + ((indices[axis] + step) % shape[axis] - indices[axis]) * stride[axis]]
        a = shape.length - 1
        while a >= 0 and indices[a] + 1 is shape[a]
          p -= indices[a] * stride[a]
          indices[a--] = 0
        if a < 0 then break
        indices[a]++
        p += stride[a]
      new APLArray data, shape
    else
      # Reverse (`⌽`)
      #
      # ⌽1 2 3 4 5 6                 <=> 6 5 4 3 2 1
      # ⌽(1 2)(3 4)(5 6)             <=> (5 6)(3 4)(1 2)
      # ⌽"BOB WON POTS"              <=> 'STOP NOW BOB'
      # ⌽    2 5⍴1 2 3 4 5 6 7 8 9 0 <=> 2 5⍴5 4 3 2 1 0 9 8 7 6
      # ⌽[0] 2 5⍴1 2 3 4 5 6 7 8 9 0 <=> 2 5⍴6 7 8 9 0 1 2 3 4 5
      if axis
        if !axis.isSingleton() then lengthError()
        axis = axis.unwrap()
        if !isInt axis then domainError()
        if !(0 <= axis < ⍴⍴ ⍵) then indexError()
      else
        axis = [⍴⍴(⍵) - 1]
      if ⍴⍴(⍵) is 0 then return ⍵
      stride = ⍵.stride[..]
      stride[axis] = -stride[axis]
      offset = ⍵.offset + (⍴(⍵)[axis] - 1) * ⍵.stride[axis]
      new APLArray ⍵.data, ⍴(⍵), stride, offset

  # 1st axis reverse (`⊖`)
  #
  # ⊖1 2 3 4 5 6                 <=> 6 5 4 3 2 1
  # ⊖(1 2) (3 4) (5 6)           <=> (5 6)(3 4)(1 2)
  # ⊖'BOB WON POTS'              <=> 'STOP NOW BOB'
  # ⊖    2 5⍴1 2 3 4 5 6 7 8 9 0 <=> 2 5⍴6 7 8 9 0 1 2 3 4 5
  # ⊖[1] 2 5⍴1 2 3 4 5 6 7 8 9 0 <=> 2 5⍴5 4 3 2 1 0 9 8 7 6
  #
  # 1st axis rotate (`⊖`)
  #
  # 1⊖3 3⍴⍳9 <=> 3 3⍴3 4 5 6 7 8 0 1 2
  '⊖': (⍵, ⍺, axis = APLArray.zero) ->
    rotate ⍵, ⍺, axis
