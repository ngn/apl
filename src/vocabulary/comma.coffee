{APLArray} = require '../array'
{assert, prod, repeat} = require '../helpers'

@[','] = (omega, alpha, axis) ->
  if alpha

    # Catenate (`,`)
    #
    #     10,66                ⍝ returns 10 66
    #     '10 ','MAY ','1985'  ⍝ returns '10 MAY 1985'
    #     (2 3⍴⍳6),2 2⍴⍳4      ⍝ returns 2 5⍴(0 1 2 0 1  3 4 5 2 3)
    #     (3 2⍴⍳6),2 2⍴⍳4      ⍝ throws
    #     (2 3⍴⍳6),9           ⍝ returns 2 4⍴(0 1 2 9  3 4 5 9)
    #     (2 3 4⍴⍳24),99       ⍝ returns 2 3 5⍴(
    #     ...                           0  1  2  3 99
    #     ...                           4  5  6  7 99
    #     ...                           8  9 10 11 99
    #     ...
    #     ...                          12 13 14 15 99
    #     ...                          16 17 18 19 99
    #     ...                          20 21 22 23 99)
    catenate omega, alpha, axis

  else

    # Ravel (`,`)
    #
    #     ,2 3 4⍴'abcdefghijklmnopqrstuvwx' ⍝ returns 'abcdefghijklmnopqrstuvwx'
    #     ,123 ⍝ returns 1⍴123
    data = []
    omega.each (x) -> data.push x
    new APLArray data

@['⍪'] = (omega, alpha, axis = APLArray.zero) ->
  if alpha

    # 1st axis catenate (`⍪`)
    #
    #     (2 3⍴⍳6)⍪9        ⍝ returns 3 3⍴(0 1 2
    #     ...                              3 4 5
    #     ...                              9 9 9)
    catenate omega, alpha, axis

  else

    throw Error 'Not implemented'


catenate = (omega, alpha, axis) ->
  assert alpha
  assert typeof axis is 'undefined' or axis instanceof APLArray

  nAxes = Math.max alpha.shape.length, omega.shape.length
  if axis
    axis = axis.unbox()
    if typeof axis isnt 'number' then throw Error 'DOMAIN ERROR'
    if not (-1 < axis < nAxes) then throw Error 'RANK ERROR'
  else
    axis = nAxes - 1

  if alpha.shape.length is 0 and omega.shape.length is 0
    return new APLArray [alpha.unbox(), omega.unbox()]
  else if alpha.shape.length is 0
    s = omega.shape[...]
    if axis is Math.floor axis then s[axis] = 1
    alpha = new APLArray [alpha.unbox()], s, repeat([0], omega.shape.length)
  else if omega.shape.length is 0
    s = alpha.shape[...]
    if axis is Math.floor axis then s[axis] = 1
    omega = new APLArray [omega.unbox()], s, repeat([0], alpha.shape.length)
  else if alpha.shape.length + 1 is omega.shape.length
    if axis isnt Math.floor axis then throw Error 'RANK ERROR'
    shape = alpha.shape[...]
    shape.splice axis, 0, 1
    stride = alpha.stride[...]
    stride.splice axis, 0, 0
    alpha = new APLArray alpha.data, shape, stride, alpha.offset
  else if alpha.shape.length is omega.shape.length + 1
    if axis isnt Math.floor axis then throw Error 'RANK ERROR'
    shape = omega.shape[...]
    shape.splice axis, 0, 1
    stride = omega.stride[...]
    stride.splice axis, 0, 0
    omega = new APLArray omega.data, shape, stride, omega.offset
  else if alpha.shape.length isnt omega.shape.length
    throw Error 'RANK ERROR'

  assert alpha.shape.length is omega.shape.length
  for i in [0...alpha.shape.length]
    if i isnt axis and alpha.shape[i] isnt omega.shape[i]
      throw Error 'LENGTH ERROR'

  shape = alpha.shape[...]
  if axis is Math.floor axis
    shape[axis] += omega.shape[axis]
  else
    shape.splice Math.ceil(axis), 0, 2
  data = Array prod shape
  stride = Array shape.length
  stride[shape.length - 1] = 1
  for i in [shape.length - 2 .. 0] by -1
    stride[i] = stride[i + 1] * shape[i + 1]

  if axis is Math.floor axis
    rStride = stride
  else
    rStride = stride[...]
    rStride.splice Math.ceil(axis), 1

  r = 0 # pointer in data (the result)
  p = alpha.offset # pointer in alpha.data
  pIndices = repeat [0], alpha.shape.length
  loop
    data[r] = alpha.data[p]
    a = pIndices.length - 1
    while a >= 0 and pIndices[a] + 1 is alpha.shape[a]
      p -= pIndices[a] * alpha.stride[a]
      r -= pIndices[a] * rStride[a]
      pIndices[a--] = 0
    if a < 0 then break
    p += alpha.stride[a]
    r += rStride[a]
    pIndices[a]++

  r = # pointer in data (the result)
    if axis is Math.floor axis
      stride[axis] * alpha.shape[axis]
    else
      stride[Math.ceil axis]
  q = omega.offset # pointer in omega.data
  pIndices = repeat [0], omega.shape.length
  loop
    data[r] = omega.data[q]
    a = pIndices.length - 1
    while a >= 0 and pIndices[a] + 1 is omega.shape[a]
      q -= pIndices[a] * omega.stride[a]
      r -= pIndices[a] * rStride[a]
      pIndices[a--] = 0
    if a < 0 then break
    q += omega.stride[a]
    r += rStride[a]
    pIndices[a]++

  new APLArray data, shape, stride
