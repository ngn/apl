{APLArray} = require '../array'
{DomainError, RankError} = require '../errors'
{prod, repeat} = require '../helpers'

@['↑'] = (omega, alpha) ->
  if alpha

    # Take (`↑`)
    #
    #     5 ↑ 'ABCDEFGH'           ⍝ returns 'ABCDE'
    #     ¯3 ↑ 'ABCDEFGH'          ⍝ returns 'FGH'
    #     3 ↑ 22 2 19 12           ⍝ returns 22 2 19
    #     ¯1 ↑ 22 2 19 12          ⍝ returns ,12
    #     ⍴ 1 ↑ (2 2 ⍴ ⍳ 4) (⍳ 10) ⍝ returns ,1
    #     2 ↑ 1                    ⍝ returns 1 0
    #     5 ↑ 40 92 11             ⍝ returns 40 92 11 0 0
    #     ¯5 ↑ 40 92 11            ⍝ returns 0 0 40 92 11
    #     3 3 ↑ 1 1 ⍴ 0            ⍝ returns 3 3 ⍴ 0 0 0 0 0 0 0 0 0
    #     5 ↑ "abc"                ⍝ returns 'abc  '
    #     ¯5 ↑ "abc"               ⍝ returns '  abc'
    #     3 3 ↑ 1 1 ⍴ "a"          ⍝ returns 3 3 ⍴ 'a        '
    #     2 3 ↑ 1 + 4 3 ⍴ ⍳ 12     ⍝ returns 2 3 ⍴ 1 2 3 4 5 6
    #     ¯1 3 ↑ 1 + 4 3 ⍴ ⍳ 12    ⍝ returns 1 3 ⍴ 10 11 12
    #     1 2 ↑ 1 + 4 3 ⍴ ⍳ 12     ⍝ returns 1 2 ⍴ 1 2
    #     3 ↑ ⍬                    ⍝ returns 0 0 0
    #     ¯2 ↑ ⍬                   ⍝ returns 0 0
    #     0 ↑ ⍬                    ⍝ returns ⍬
    if alpha.shape.length > 1
      throw RankError()
    if omega.shape.length is 0
      omega = new APLArray [omega.unwrap()]
    a = alpha.toArray()
    if a.length > omega.shape.length
      throw RankError()
    for x in a when typeof x isnt 'number' or x isnt Math.floor x
      throw DomainError()

    mustCopy = false
    shape = []
    for x, i in a
      shape.push Math.abs x
      if shape[i] > omega.shape[i]
        mustCopy = true

    if mustCopy
      stride = Array shape.length
      stride[stride.length - 1] = 1
      for i in [stride.length - 2 .. 0] by -1
        stride[i] = stride[i + 1] * shape[i + 1]
      data = repeat [omega.getPrototype()], prod shape
      copyShape = []
      p = omega.offset
      q = 0
      for x, i in a
        copyShape.push Math.min omega.shape[i], Math.abs x
        if x < 0
          if x < -omega.shape[i]
            q -= (x + omega.shape[i]) * stride[i]
          else
            p += (x + omega.shape[i]) * omega.stride[i]
      if prod copyShape
        copyIndices = repeat [0], copyShape.length
        loop
          data[q] = omega.data[p]
          axis = copyShape.length - 1
          while axis >= 0 and copyIndices[axis] + 1 is copyShape[axis]
            p -= copyIndices[axis] * omega.stride[axis]
            q -= copyIndices[axis] * stride[axis]
            copyIndices[axis--] = 0
          if axis < 0 then break
          p += omega.stride[axis]
          q += stride[axis]
          copyIndices[axis]++
      new APLArray data, shape, stride
    else
      stride = []
      offset = omega.offset
      for x, i in a
        if x >= 0
          stride.push omega.stride[i]
        else
          stride.push omega.stride[i]
          offset += (omega.shape[i] + x) * omega.stride[i]
      new APLArray omega.data, shape, stride, offset
