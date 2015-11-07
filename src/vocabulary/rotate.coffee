addVocabulary
  '⌽': rotate = (om, al, axis) ->
    assert typeof axis is 'undefined' or axis instanceof A
    if al
      # 1⌽1 2 3 4 5 6             ←→ 2 3 4 5 6 1
      # 3⌽'ABCDEFGH'              ←→ 'DEFGHABC'
      # 3⌽2 5⍴1 2 3 4 5 6 7 8 9 0 ←→ 2 5⍴4 5 1 2 3 9 0 6 7 8
      # ¯2⌽"ABCDEFGH"             ←→ 'GHABCDEF'
      # 1⌽3 3⍴⍳9                  ←→ 3 3⍴1 2 0 4 5 3 7 8 6
      # 0⌽1 2 3 4                 ←→ 1 2 3 4
      # 0⌽1234                    ←→ 1234
      # 5⌽⍬                       ←→ ⍬
      axis = if !axis then om.shape.length - 1 else axis.unwrap()
      if !isInt axis then domainError()
      if om.shape.length and !(0 <= axis < om.shape.length) then indexError()
      step = al.unwrap()
      if !isInt step then domainError()
      if !step then return om
      n = om.shape[axis]
      step = (n + (step % n)) % n # force % to handle negatives properly
      if om.empty() or step is 0 then return om
      data = []
      {shape, stride} = om
      p = om.offset
      indices = repeat [0], shape.length
      loop
        data.push om.data[p + ((indices[axis] + step) % shape[axis] - indices[axis]) * stride[axis]]
        a = shape.length - 1
        while a >= 0 and indices[a] + 1 is shape[a]
          p -= indices[a] * stride[a]
          indices[a--] = 0
        if a < 0 then break
        indices[a]++
        p += stride[a]
      new A data, shape
    else
      # ⌽1 2 3 4 5 6                 ←→ 6 5 4 3 2 1
      # ⌽(1 2)(3 4)(5 6)             ←→ (5 6)(3 4)(1 2)
      # ⌽"BOB WON POTS"              ←→ 'STOP NOW BOB'
      # ⌽    2 5⍴1 2 3 4 5 6 7 8 9 0 ←→ 2 5⍴5 4 3 2 1 0 9 8 7 6
      # ⌽[0] 2 5⍴1 2 3 4 5 6 7 8 9 0 ←→ 2 5⍴6 7 8 9 0 1 2 3 4 5
      if axis
        if !axis.isSingleton() then lengthError()
        axis = axis.unwrap()
        if !isInt axis then domainError()
        if !(0 <= axis < om.shape.length) then indexError()
      else
        axis = [om.shape.length - 1]
      if om.shape.length is 0 then return om
      stride = om.stride[..]
      stride[axis] = -stride[axis]
      offset = om.offset + (om.shape[axis] - 1) * om.stride[axis]
      new A om.data, om.shape, stride, offset

  # ⊖1 2 3 4 5 6                 ←→ 6 5 4 3 2 1
  # ⊖(1 2) (3 4) (5 6)           ←→ (5 6)(3 4)(1 2)
  # ⊖'BOB WON POTS'              ←→ 'STOP NOW BOB'
  # ⊖    2 5⍴1 2 3 4 5 6 7 8 9 0 ←→ 2 5⍴6 7 8 9 0 1 2 3 4 5
  # ⊖[1] 2 5⍴1 2 3 4 5 6 7 8 9 0 ←→ 2 5⍴5 4 3 2 1 0 9 8 7 6
  # 1⊖3 3⍴⍳9 ←→ 3 3⍴3 4 5 6 7 8 0 1 2
  '⊖': (om, al, axis = A.zero) ->
    rotate om, al, axis
