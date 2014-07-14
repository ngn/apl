addVocabulary

  '↑': (⍵, ⍺) ->
    if ⍺
      take ⍵, ⍺
    else
      first ⍵

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
take = (⍵, ⍺) ->
  if ⍴⍴(⍺) > 1 then rankError()
  if !⍴⍴ ⍵ then ⍵ = new A [⍵.unwrap()], (if !⍴⍴ ⍺ then [1] else repeat [1], ⍴(⍺)[0])
  a = ⍺.toArray()
  if a.length > ⍴⍴ ⍵ then rankError()
  for x in a when typeof x isnt 'number' or x isnt Math.floor x then domainError()

  mustCopy = false
  shape = ⍴(⍵)[..]
  for x, i in a
    shape[i] = Math.abs x
    if shape[i] > ⍴(⍵)[i]
      mustCopy = true

  if mustCopy
    stride = Array shape.length
    stride[stride.length - 1] = 1
    for i in [stride.length - 2 .. 0] by -1
      stride[i] = stride[i + 1] * shape[i + 1]
    data = repeat [⍵.getPrototype()], prod shape
    copyShape = shape[..]
    p = ⍵.offset
    q = 0
    for x, i in a
      copyShape[i] = Math.min ⍴(⍵)[i], Math.abs x
      if x < 0
        if x < -⍴(⍵)[i]
          q -= (x + ⍴(⍵)[i]) * stride[i]
        else
          p += (x + ⍴(⍵)[i]) * ⍵.stride[i]
    if prod copyShape
      copyIndices = repeat [0], copyShape.length
      loop
        data[q] = ⍵.data[p]
        axis = copyShape.length - 1
        while axis >= 0 and copyIndices[axis] + 1 is copyShape[axis]
          p -= copyIndices[axis] * ⍵.stride[axis]
          q -= copyIndices[axis] * stride[axis]
          copyIndices[axis--] = 0
        if axis < 0 then break
        p += ⍵.stride[axis]
        q += stride[axis]
        copyIndices[axis]++
    new A data, shape, stride
  else
    offset = ⍵.offset
    for x, i in a
      if x < 0
        offset += (⍴(⍵)[i] + x) * ⍵.stride[i]
    new A ⍵.data, shape, ⍵.stride, offset

# ↑(1 2 3)(4 5 6) ←→ 1 2 3
# ↑(1 2)(3 4 5)   ←→ 1 2
# ↑'AB'           ←→ 'A'
# ↑123            ←→ 123
# ↑⍬              ←→ 0
#! ↑''             ←→ ' '
first = (⍵) ->
  x = if ⍵.empty() then ⍵.getPrototype() else ⍵.data[⍵.offset]
  if x instanceof A then x else new A [x], []
