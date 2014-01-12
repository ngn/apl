addVocabulary

  # Index (`⌷`)
  #
  # `a0 a1...⌷b` is equivalent to `b[a0;a1;...]`
  #
  # 1⌷3 5 8                ←→ 5
  # (3 5 8)[1]             ←→ 5
  # (3 5 8)[⍬]             ←→ ⍬
  # (2 2 0)(1 2)⌷3 3⍴⍳9    ←→ 3 2⍴7 8 7 8 1 2
  # ¯1⌷3 5 8               !!! INDEX ERROR
  # 2⌷111 222 333 444      ←→ 333
  # (⊂3 2)⌷111 222 333 444 ←→ 444 333
  # (⊂2 3⍴2 0 3 0 1 2)⌷111 222 333 444
  # ... ←→ 2 3⍴333 111 444 111 222 333
  # 1 0   ⌷3 4⍴11 12 13 14 21 22 23 24 31 32 33 34 ←→ 21
  # 1     ⌷3 4⍴11 12 13 14 21 22 23 24 31 32 33 34 ←→ 21 22 23 24
  # 2(1 0)⌷3 4⍴11 12 13 14 21 22 23 24 31 32 33 34 ←→ 32 31
  # (1 2)0⌷3 4⍴11 12 13 14 21 22 23 24 31 32 33 34 ←→ 21 31
  # a←2 2⍴0 ⋄ a[;0]←1 ⋄ a ←→ 2 2⍴1 0 1 0
  # a←2 3⍴0 ⋄ a[1;0 2]←1 ⋄ a ←→ 2 3⍴0 0 0 1 0 1
  '⌷': squish = (⍵, ⍺, axes) ->
    if typeof ⍵ is 'function' then return (x, y) -> ⍵ x, y, ⍺
    if !⍺ then nonceError()
    if 1 < ⍴⍴ ⍺ then rankError()
    a = ⍺.toArray()
    if a.length > ⍴⍴ ⍵ then lengthError()

    if axes
      axes = axes.toArray()
      if a.length isnt axes.length then lengthError()
      h = Array ⍴⍴ ⍵
      for axis in axes
        if !isInt axis then domainError()
        if !(0 <= axis < ⍴⍴ ⍵) then rankError()
        if h[axis] then rankError 'Duplicate axis'
        h[axis] = 1
    else
      axes = [0...a.length]

    r = ⍵
    for i in [a.length - 1..0] by -1
      u = if a[i] instanceof APLArray then a[i] else new APLArray [a[i]], []
      r = indexAtSingleAxis r, u, axes[i]
    r

  # (23 54 38)[0]                       ←→ 23
  # (23 54 38)[1]                       ←→ 54
  # (23 54 38)[2]                       ←→ 38
  # (23 54 38)[3]                       !!! INDEX ERROR
  # (23 54 38)[¯1]                      !!! INDEX ERROR
  # (23 54 38)[0 2]                     ←→ 23 38
  # (2 3⍴100 101 102 110 111 112)[1;2]  ←→ 112
  # (2 3⍴100 101 102 110 111 112)[1;¯1] !!! INDEX ERROR
  # (2 3⍴100 101 102 110 111 112)[10;1] !!! INDEX ERROR
  # (2 3⍴100 101 102 110 111 112)[1;]   ←→ 110 111 112
  # (2 3⍴100 101 102 110 111 112)[;1]   ←→ 101 111
  # 'hello'[1]                          ←→ 'e'
  # 'ipodlover'[1 2 5 8 3 7 6 0 4]      ←→ 'poordevil'
  # ('axlrose'[4 3 0 2 5 6 1])[0 1 2 3] ←→ 'oral'
  # (1 2 3)[⍬]                          ←→ ⍬
  # ⍴(1 2 3)[1 2 3 0 5⍴0]               ←→ 1 2 3 0 5
  # (⍳3)[]                              ←→ ⍳3
  # ⍴(3 3⍴⍳9)[⍬;⍬]                      ←→ 0 0
  #
  # " X"[(3 3⍴⍳9)∊1 3 6 7 8] ←→ 3 3⍴(' X ',
  # ...                               'X  ',
  # ...                               'XXX')
  _index: (alphaAndAxes, ⍵) ->
    [⍺, axes] = alphaAndAxes.toArray()
    squish ⍵, ⍺, axes

  # a←⍳5 ⋄ a[1 3]←7 8 ⋄ a ←→ 0 7 2 8 4
  # a←⍳5 ⋄ a[1 3]←7   ⋄ a ←→ 0 7 2 7 4
  # a←⍳5 ⋄ a[1]  ←7 8 ⋄ a !!! RANK ERROR
  # a←1 2 3 ⋄ a[1]←4 ⋄ a ←→ 1 4 3
  # a←2 2⍴⍳4 ⋄ a[0;0]←4 ⋄ a ←→ 2 2⍴4 1 2 3
  # a←5 5⍴0 ⋄ a[1 3;2 4]←2 2⍴1+⍳4 ⋄ a ←→ 5 5⍴(0 0 0 0 0
  # ...                                        0 0 1 0 2
  # ...                                        0 0 0 0 0
  # ...                                        0 0 3 0 4
  # ...                                        0 0 0 0 0)
  # a←'this is a test' ⋄ a[0 5]←'TI' ←→ 'This Is a test'
  # Data←0 4 8 ⋄ 10+ (Data[0 2]← 7 9) ←→ 17 14 19
  # a←3 4⍴⍳12 ⋄ a[;1 2]←99 ←→ 3 4⍴0 99 99 3 4 99 99 7 8 99 99 11
  # a←1 2 3 ⋄ a[⍬]←4 ⋄ a ←→ 1 2 3
  # a←3 3⍴⍳9 ⋄ a[⍬;1 2]←789 ⋄ a ←→ 3 3⍴⍳9
  # a←1 2 3 ⋄ a[]←4 5 6 ⋄ a ←→ 4 5 6
  _substitute: (args) ->
    [value, ⍺, ⍵, axes] =
      for x in args.toArray()
        if x instanceof APLArray then x else new APLArray [x], []

    if 1 < ⍴⍴ ⍺ then rankError()
    a = ⍺.toArray()
    if a.length > ⍴⍴ ⍵ then lengthError()

    if axes
      if 1 < ⍴⍴ axes then rankError()
      axes = axes.toArray()
      if a.length isnt axes.length then lengthError()
    else
      axes = [0...a.length]

    subs = squish (vocabulary['⍳'] new APLArray ⍴ ⍵), ⍺, new APLArray axes
    if value.isSingleton()
      value = new APLArray [value], ⍴(subs), repeat [0], ⍴⍴(subs)
    data = ⍵.toArray()
    stride = strideForShape ⍴ ⍵
    each2 subs, value, (u, v) ->
      if v instanceof APLArray and !⍴⍴ v then v = v.unwrap()
      if u instanceof APLArray
        p = 0 # pointer in data
        for x, i in u.toArray() then p += x * stride[i]
        data[p] = v
      else
        data[u] = v

    new APLArray data, ⍴ ⍵

indexAtSingleAxis = (⍵, sub, ax) ->
  assert ⍵ instanceof APLArray
  assert sub instanceof APLArray
  assert isInt ax
  assert 0 <= ax < ⍴⍴ ⍵
  u = sub.toArray()
  n = ⍴(⍵)[ax]
  for x in u
    if !isInt x then domainError()
    if !(0 <= x < n) then indexError()
  isUniform = false
  if u.length >= 2
    isUniform = true
    d = u[1] - u[0]
    for i in [2...u.length] by 1 when u[i] - u[i - 1] isnt d then (isUniform = false; break)
  if isUniform
    shape = ⍴(⍵)[..]
    shape.splice ax, 1, ⍴(sub)...
    stride = ⍵.stride[..]
    subStride = strideForShape ⍴ sub
    for x, i in subStride then subStride[i] = x * d * ⍵.stride[ax]
    stride.splice ax, 1, subStride...
    offset = ⍵.offset + u[0] * ⍵.stride[ax]
    new APLArray ⍵.data, shape, stride, offset
  else
    shape1 = ⍴(⍵)[..]; shape1.splice ax, 1
    stride1 = ⍵.stride[..]; stride1.splice ax, 1
    data = []
    each sub, (x) ->
      chunk = new APLArray ⍵.data, shape1, stride1, ⍵.offset + x * ⍵.stride[ax]
      data.push chunk.toArray()...
    shape = shape1[..]
    stride = strideForShape shape
    shape.splice ax, 0, ⍴(sub)...
    subStride = strideForShape ⍴ sub
    k = prod shape1
    for i in [0...subStride.length] by 1 then subStride[i] *= k
    stride.splice ax, 0, subStride...
    new APLArray data, shape, stride
