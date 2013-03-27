{APLArray} = require '../array'
{assert, prod} = require '../helpers'

#
@['⌽'] = rotate = (omega, alpha, axis) ->
  assert typeof axis is 'undefined' or axis instanceof APLArray
  if alpha
    # Rotate (`⌽`)
    #
    #!    1 ⌽ 1 2 3 4 5 6                   ⍝ returns 2 3 4 5 6 1
    #!    3 ⌽ 'ABCDEFGH'                    ⍝ returns 'DEFGHABC'
    #!    3 ⌽ 2 5 ⍴  1 2 3 4 5  6 7 8 9 0   ⍝ returns 2 5 ⍴ 4 5 1 2 3 9 0 6 7 8
    #!    ¯2 ⌽ "ABCDEFGH"                   ⍝ returns 'GHABCDEF'
    #!    1 ⌽ 3 3 ⍴ ⍳ 9                     ⍝ returns 3 3 ⍴ 1 2 0 4 5 3 7 8 6
    throw Error 'Not implemented'
  else
    # Reverse (`⌽`)
    #
    #     ⌽ 1 2 3 4 5 6                    ⍝ returns 6 5 4 3 2 1
    #     ⌽ (1 2) (3 4) (5 6)              ⍝ returns (5 6) (3 4) (1 2)
    #     ⌽ "BOB WON POTS"                 ⍝ returns 'STOP NOW BOB'
    #     ⌽    2 5 ⍴ 1 2 3 4 5 6 7 8 9 0   ⍝ returns 2 5 ⍴ 5 4 3 2 1 0 9 8 7 6
    #!    ⌽[0] 2 5 ⍴ 1 2 3 4 5 6 7 8 9 0   ⍝ returns 2 5 ⍴ 6 7 8 9 0 1 2 3 4 5
    if axis
      if not axis.isSingleton() then throw Error 'LENGTH ERROR'
      axis = axis.unbox()
      if typeof axis isnt 'number' or axis isnt Math.floor axis
        throw Error 'DOMAIN ERROR'
      if not (0 <= axis < omega.shape.length)
        throw Error 'INDEX ERROR'
    else
      axis = [omega.shape.length - 1]
    if omega.shape.length is 0 then return omega
    stride = omega.stride[...]
    stride[axis] = -stride[axis]
    offset = omega.offset + (omega.shape[axis] - 1) * omega.stride[axis]
    new APLArray omega.data, omega.shape, stride, offset

# 1st axis reverse (`⊖`)
#
#     ⊖ 1 2 3 4 5 6                   ⍝ returns 6 5 4 3 2 1
#     ⊖ (1 2) (3 4) (5 6)             ⍝ returns (5 6) (3 4) (1 2)
#     ⊖ 'BOB WON POTS'                ⍝ returns 'STOP NOW BOB'
#     ⊖    2 5 ⍴ 1 2 3 4 5 6 7 8 9 0  ⍝ returns 2 5 ⍴ 6 7 8 9 0 1 2 3 4 5
#!    ⊖[1] 2 5 ⍴ 1 2 3 4 5 6 7 8 9 0  ⍝ returns 2 5 ⍴ 5 4 3 2 1 0 9 8 7 6
#
# 1st axis rotate (`⊖`)
#
#!    1 ⊖ 3 3 ⍴ ⍳ 9   ⍝ returns 3 3 ⍴ 3 4 5 6 7 8 0 1 2
@['⊖'] = (omega, alpha, axis = APLArray.zero) ->
  rotate omega, alpha, axis
