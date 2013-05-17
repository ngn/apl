{APLArray} = require '../array'
{isInt, repeat, prod} = require '../helpers'
{DomainError, RankError} = require '../errors'

# Drop (`↓`)
#
#     4↓'OVERBOARD'              ⍝ returns 'BOARD'
#     ¯5↓'OVERBOARD'             ⍝ returns 'OVER'
#     ⍴10↓'OVERBOARD'            ⍝ returns ,0
#     0 ¯2↓ 3 3 ⍴ 'ONEFATFLY'    ⍝ returns 3 1 ⍴ 'OFF'
#     ¯2 ¯1↓ 3 3 ⍴ 'ONEFATFLY'   ⍝ returns 1 2 ⍴ 'ON'
#     1↓ 3 3 ⍴ 'ONEFATFLY'       ⍝ returns 2 3 ⍴ 'FATFLY'
#     1 1↓ 2 3 4⍴"ABCDEFGHIJKLMNOPQRSTUVWXYZ"    ⍝ returns 1 2 4 ⍴ 'QRSTUVWX'
#     ¯1 ¯1↓ 2 3 4⍴"ABCDEFGHIJKLMNOPQRSTUVWXYZ"  ⍝ returns 1 2 4 ⍴ 'ABCDEFGH'
@['↓'] = (omega, alpha, axis) ->
  if alpha
    if alpha.shape.length > 1
      throw RankError()
    a = alpha.toArray()
    for x in a
      if not isInt x
        throw DomainError()
    if omega.shape.length is 0
      omega = new APLArray omega.data, repeat([1], a.length), omega.stride, omega.offset
    else
      if a.length > omega.shape.length
        throw RankError()

    shape = omega.shape[...]
    offset = omega.offset
    for x, i in a
      shape[i] = Math.max 0, omega.shape[i] - Math.abs x
      if x > 0
        offset += x * omega.stride[i]

    if prod(shape) is 0
      new APLArray [], shape
    else
      new APLArray omega.data, shape, omega.stride, offset

  else
    throw Error 'Not implemented'
