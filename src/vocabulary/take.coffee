addVocabulary

  '↑': (om, al) ->
    if al
      take om, al
    else
      first om

# 5↑'ABCDEFGH'     ←→ 'ABCDE'
# ¯3↑'ABCDEFGH'    ←→ 'FGH'
# 3↑22 2 19 12     ←→ 22 2 19
# ¯1↑22 2 19 12    ←→ ,12
# ⍴1↑(2 2⍴⍳4)(⍳10) ←→ ,1
# 2↑1              ←→ 1 0
# 5↑40 92 11       ←→ 40 92 11 0 0
# ¯5↑40 92 11      ←→ 0 0 40 92 11
# 3 3↑1 1⍴0        ←→ 3 3⍴0 0 0 0 0 0 0 0 0
# 5↑"abc"          ←→ 'abc  '
# ¯5↑"abc"         ←→ '  abc'
# 3 3↑1 1⍴"a"      ←→ 3 3⍴'a        '
# 2 3↑1+4 3⍴⍳12    ←→ 2 3⍴1 2 3 4 5 6
# ¯1 3↑1+4 3⍴⍳12   ←→ 1 3⍴10 11 12
# 1 2↑1+4 3⍴⍳12    ←→ 1 2⍴1 2
# 3↑⍬              ←→ 0 0 0
# ¯2↑⍬             ←→ 0 0
# 0↑⍬              ←→ ⍬
# 3 3↑1            ←→ 3 3⍴1 0 0 0 0 0 0 0 0
# 2↑3 3⍴⍳9         ←→ 2 3⍴⍳6
# ¯2↑3 3⍴⍳9        ←→ 2 3⍴3+⍳6
# 4↑3 3⍴⍳9         ←→ 4 3⍴(⍳9),0 0 0
# ⍬↑3 3⍴⍳9         ←→ 3 3⍴⍳9
take = (om, al) ->
  if al.shape.length > 1 then rankError()
  if !om.shape.length then om = new A [om.unwrap()], (if !al.shape.length then [1] else repeat [1], al.shape[0])
  a = al.toArray()
  if a.length > om.shape.length then rankError()
  for x in a when typeof x isnt 'number' or x isnt Math.floor x then domainError()

  mustCopy = false
  shape = om.shape[..]
  for x, i in a
    shape[i] = Math.abs x
    if shape[i] > om.shape[i]
      mustCopy = true

  if mustCopy
    stride = Array shape.length
    stride[stride.length - 1] = 1
    for i in [stride.length - 2 .. 0] by -1
      stride[i] = stride[i + 1] * shape[i + 1]
    data = repeat [om.getPrototype()], prod shape
    copyShape = shape[..]
    p = om.offset
    q = 0
    for x, i in a
      copyShape[i] = Math.min om.shape[i], Math.abs x
      if x < 0
        if x < -om.shape[i]
          q -= (x + om.shape[i]) * stride[i]
        else
          p += (x + om.shape[i]) * om.stride[i]
    if prod copyShape
      copyIndices = repeat [0], copyShape.length
      loop
        data[q] = om.data[p]
        axis = copyShape.length - 1
        while axis >= 0 and copyIndices[axis] + 1 is copyShape[axis]
          p -= copyIndices[axis] * om.stride[axis]
          q -= copyIndices[axis] * stride[axis]
          copyIndices[axis--] = 0
        if axis < 0 then break
        p += om.stride[axis]
        q += stride[axis]
        copyIndices[axis]++
    new A data, shape, stride
  else
    offset = om.offset
    for x, i in a
      if x < 0
        offset += (om.shape[i] + x) * om.stride[i]
    new A om.data, shape, om.stride, offset

# ↑(1 2 3)(4 5 6) ←→ 1 2 3
# ↑(1 2)(3 4 5)   ←→ 1 2
# ↑'AB'           ←→ 'A'
# ↑123            ←→ 123
# ↑⍬              ←→ 0
#! ↑''             ←→ ' '
first = (om) ->
  x = if om.empty() then om.getPrototype() else om.data[om.offset]
  if x instanceof A then x else new A [x], []
