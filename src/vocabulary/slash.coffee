addVocabulary
  '⌿': adverb (om, al, axis = A.zero) -> reduce om, al, axis
  '/': reduce = adverb (om, al, axis) ->
    if typeof om is 'function'
      # +/3                    ←→ 3
      # +/3 5 8                ←→ 16
      # ⌈/82 66 93 13          ←→ 93
      # ×/2 3⍴1 2 3 4 5 6      ←→ 6 120
      # 2,/'ab' 'cd' 'ef' 'hi' ←→ 'abcd' 'cdef' 'efhi'
      # 3,/'ab' 'cd' 'ef' 'hi' ←→ 'abcdef' 'cdefhi'
      # -/3 0⍴42               ←→ 3⍴0
      # 2+/1+⍳10    ←→ 3 5 7 9 11 13 15 17 19
      # 5+/1+⍳10    ←→ 15 20 25 30 35 40
      # 10+/1+⍳10   ←→ ,55
      # 11+/1+⍳10   ←→ ⍬
      # 12+/1+⍳10   !!! LENGTH ERROR
      # 2-/3 4 9 7  ←→ ¯1 ¯5 2
      # ¯2-/3 4 9 7 ←→ 1 5 ¯2
      f = om; g = al; axis0 = axis
      assert typeof f is 'function'
      assert typeof g is 'undefined'
      assert(typeof axis0 is 'undefined' or axis0 instanceof A)
      (om, al) ->
        if !om.shape.length then om = new A [om.unwrap()]
        axis = if axis0? then axis0.toInt() else om.shape.length - 1
        if !(0 <= axis < om.shape.length) then rankError()

        if al
          isNWise = true
          n = al.toInt()
          if n < 0
            isBackwards = true
            n = -n
        else
          n = om.shape[axis]

        shape = om.shape[..]
        shape[axis] = om.shape[axis] - n + 1
        rShape = shape
        if isNWise
          if shape[axis] is 0 then return new A [], rShape
          if shape[axis] < 0 then lengthError()
        else
          rShape = rShape[..]
          rShape.splice axis, 1

        if om.empty()
          if (z = f.identity)?
            assert !z.shape.length
            return new A z.data, rShape, repeat([0], rShape.length), z.offset
          else
            domainError()

        data = []
        indices = repeat [0], shape.length
        p = om.offset
        loop
          if isBackwards
            x = om.data[p]
            x = if x instanceof A then x else A.scalar x
            for i in [1...n] by 1
              y = om.data[p + i * om.stride[axis]]
              y = if y instanceof A then y else A.scalar y
              x = f x, y
          else
            x = om.data[p + (n - 1) * om.stride[axis]]
            x = if x instanceof A then x else A.scalar x
            for i in [n - 2 .. 0] by -1
              y = om.data[p + i * om.stride[axis]]
              y = if y instanceof A then y else A.scalar y
              x = f x, y
          if !x.shape.length then x = x.unwrap()
          data.push x
          a = indices.length - 1
          while a >= 0 and indices[a] + 1 is shape[a]
            p -= indices[a] * om.stride[a]
            indices[a--] = 0
          if a < 0 then break
          p += om.stride[a]
          indices[a]++

        new A data, rShape

    else
      # 0 1 0 1/'abcd'                   ←→ 'bd'
      # 1 1 1 1 0/12 14 16 18 20         ←→ 12 14 16 18
      # m←45 60 33 50 66 19 ⋄ (m≥50)/m   ←→ 60 50 66
      # m←45 60 33 50 66 19 ⋄ (m=50)/⍳≢m ←→ ,3
      # 1/'ab'                           ←→ 'ab'
      # 0/'ab'                           ←→ ⍬
      # 0 1 0/ 1+2 3⍴⍳6                  ←→ 2 1⍴2 5
      # 1 0/[0]1+2 3⍴⍳6                  ←→ 1 3⍴1 2 3
      # 1 0⌿   1+2 3⍴⍳6                  ←→ 1 3⍴1 2 3
      # 3/5                              ←→ 5 5 5
      # 2 ¯2 2/1+2 3⍴⍳6           ←→ 2 6⍴  1 1 0 0 3 3  4 4 0 0 6 6
      # 1 1 ¯2 1 1/1 2(2 2⍴⍳4)3 4 ←→ 1 2 0 0 3 4
      # 2 3 2/'abc'               ←→ 'aabbbcc'
      # 2/'def'                   ←→ 'ddeeff'
      # 5 0 5/1 2 3               ←→ 1 1 1 1 1 3 3 3 3 3
      # 2/1+2 3⍴⍳6                ←→ 2 6⍴ 1 1 2 2 3 3  4 4 5 5 6 6
      # 2⌿1+2 3⍴⍳6                ←→ 4 3⍴ 1 2 3  1 2 3  4 5 6  4 5 6
      # 2 3/3 1⍴'abc'             ←→ 3 5⍴'aaaaabbbbbccccc'
      # 2 ¯1 2/[1]3 1⍴7 8 9       ←→ 3 5⍴7 7 0 7 7 8 8 0 8 8 9 9 0 9 9
      # 2 ¯1 2/[1]3 1⍴'abc'       ←→ 3 5⍴'aa aabb bbcc cc'
      # 2 ¯2 2/7                  ←→ 7 7 0 0 7 7
      if !om.shape.length then om = new A [om.unwrap()]
      axis = if axis then axis.toInt 0, om.shape.length else om.shape.length - 1
      if al.shape.length > 1 then rankError()
      a = al.toArray()
      n = om.shape[axis]
      if a.length is 1 then a = repeat a, n
      if n !in [1, a.length] then lengthError()

      shape = om.shape[..]
      shape[axis] = 0
      b = []
      for x, i in a
        if !isInt x then domainError()
        shape[axis] += Math.abs x
        for [0...Math.abs x] then b.push(if x > 0 then i else null)
      if n is 1
        b = for x in b then (if x? then 0 else x)

      data = []
      if shape[axis] isnt 0 and !om.empty()
        filler = om.getPrototype()
        p = om.offset
        indices = repeat [0], shape.length
        loop
          x =
            if b[indices[axis]]?
              om.data[p + b[indices[axis]] * om.stride[axis]]
            else
              filler
          data.push x

          i = shape.length - 1
          while i >= 0 and indices[i] + 1 is shape[i]
            if i isnt axis then p -= om.stride[i] * indices[i]
            indices[i--] = 0
          if i < 0 then break
          if i isnt axis then p += om.stride[i]
          indices[i]++

      new A data, shape
