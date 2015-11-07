addVocabulary

  ',': (om, al, axis) ->
    if al

      # 10,66               ←→ 10 66
      # '10 ','MAY ','1985' ←→ '10 MAY 1985'
      # (2 3⍴⍳6),2 2⍴⍳4     ←→ 2 5⍴(0 1 2 0 1  3 4 5 2 3)
      # (3 2⍴⍳6),2 2⍴⍳4     !!! LENGTH ERROR
      # (2 3⍴⍳6),9          ←→ 2 4⍴(0 1 2 9  3 4 5 9)
      # (2 3 4⍴⍳24),99      ←→ 2 3 5⍴(0  1  2  3 99
      # ...                           4  5  6  7 99
      # ...                           8  9 10 11 99
      # ...
      # ...                          12 13 14 15 99
      # ...                          16 17 18 19 99
      # ...                          20 21 22 23 99)
      # ⍬,⍬                 ←→ ⍬
      # ⍬,1                 ←→ ,1
      # 1,⍬                 ←→ ,1
      nAxes = Math.max al.shape.length, om.shape.length
      if axis
        axis = axis.unwrap()
        if typeof axis isnt 'number' then domainError()
        if nAxes and !(-1 < axis < nAxes) then rankError()
      else
        axis = nAxes - 1

      if al.shape.length is om.shape.length is 0
        return new A [al.unwrap(), om.unwrap()]
      else if !al.shape.length
        s = om.shape[..]
        if isInt axis then s[axis] = 1
        al = new A [al.unwrap()], s, repeat([0], om.shape.length)
      else if !om.shape.length
        s = al.shape[..]
        if isInt axis then s[axis] = 1
        om = new A [om.unwrap()], s, repeat([0], al.shape.length)
      else if al.shape.length + 1 is om.shape.length
        if !isInt axis then rankError()
        shape = al.shape[..]
        shape.splice axis, 0, 1
        stride = al.stride[..]
        stride.splice axis, 0, 0
        al = new A al.data, shape, stride, al.offset
      else if al.shape.length is om.shape.length + 1
        if !isInt axis then rankError()
        shape = om.shape[..]
        shape.splice axis, 0, 1
        stride = om.stride[..]
        stride.splice axis, 0, 0
        om = new A om.data, shape, stride, om.offset
      else if al.shape.length isnt om.shape.length
        rankError()

      assert al.shape.length is om.shape.length
      for i in [0...al.shape.length] by 1
        if i isnt axis and al.shape[i] isnt om.shape[i]
          lengthError()

      shape = al.shape[..]
      if isInt axis
        shape[axis] += om.shape[axis]
      else
        shape.splice Math.ceil(axis), 0, 2
      data = Array prod shape
      stride = Array shape.length
      stride[shape.length - 1] = 1
      for i in [shape.length - 2 .. 0] by -1
        stride[i] = stride[i + 1] * shape[i + 1]

      if isInt axis
        rStride = stride
      else
        rStride = stride[..]
        rStride.splice Math.ceil(axis), 1

      if !al.empty()
        r = 0 # pointer in data (the result)
        p = al.offset # pointer in ⍺.data
        pIndices = repeat [0], al.shape.length
        loop
          data[r] = al.data[p]
          a = pIndices.length - 1
          while a >= 0 and pIndices[a] + 1 is al.shape[a]
            p -= pIndices[a] * al.stride[a]
            r -= pIndices[a] * rStride[a]
            pIndices[a--] = 0
          if a < 0 then break
          p += al.stride[a]
          r += rStride[a]
          pIndices[a]++

      if !om.empty()
        r = # pointer in data (the result)
          if isInt axis
            stride[axis] * al.shape[axis]
          else
            stride[Math.ceil axis]
        q = om.offset # pointer in ⍵.data
        pIndices = repeat [0], om.shape.length
        loop
          data[r] = om.data[q]
          a = pIndices.length - 1
          while a >= 0 and pIndices[a] + 1 is om.shape[a]
            q -= pIndices[a] * om.stride[a]
            r -= pIndices[a] * rStride[a]
            pIndices[a--] = 0
          if a < 0 then break
          q += om.stride[a]
          r += rStride[a]
          pIndices[a]++

      new A data, shape, stride

    else
      assert 0
