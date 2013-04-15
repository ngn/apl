{APLArray} = require '../array'
{DomainError, LengthError, IndexError} = require '../errors'
{assert, prod, repeat, isInt} = require '../helpers'

@['⌽'] = rotate = (omega, alpha, axis) ->
  assert typeof axis is 'undefined' or axis instanceof APLArray
  if alpha
    # Rotate (`⌽`)
    #
    #     1 ⌽ 1 2 3 4 5 6                   ⍝ returns 2 3 4 5 6 1
    #     3 ⌽ 'ABCDEFGH'                    ⍝ returns 'DEFGHABC'
    #     3 ⌽ 2 5 ⍴  1 2 3 4 5  6 7 8 9 0   ⍝ returns 2 5 ⍴ 4 5 1 2 3 9 0 6 7 8
    #     ¯2 ⌽ "ABCDEFGH"                   ⍝ returns 'GHABCDEF'
    #     1 ⌽ 3 3 ⍴ ⍳ 9                     ⍝ returns 3 3 ⍴ 1 2 0 4 5 3 7 8 6
    #     0 ⌽ 1 2 3 4                       ⍝ returns 1 2 3 4
    #     0 ⌽ 1234                          ⍝ returns 1234
    #     5 ⌽ ⍬                             ⍝ returns ⍬
    axis = if not axis then omega.shape.length - 1 else axis.unbox()
    if not isInt axis
      throw DomainError()
    if omega.shape.length and not (0 <= axis < omega.shape.length)
      throw IndexError()
    step = alpha.unbox()
    if not isInt step
      throw DomainError()
    if not step
      return omega
    n = omega.shape[axis]
    step = (n + (step % n)) % n # force % to handle negatives properly
    if omega.empty() or step is 0 then return omega
    data = []
    {shape, stride} = omega
    p = omega.offset
    indices = repeat [0], shape.length
    loop
      data.push omega.data[p + ((indices[axis] + step) % shape[axis] - indices[axis]) * stride[axis]]
      a = shape.length - 1
      while a >= 0 and indices[a] + 1 is shape[a]
        p -= indices[a] * stride[a]
        indices[a--] = 0
      if a < 0 then break
      indices[a]++
      p += stride[a]
    new APLArray data, shape
  else
    # Reverse (`⌽`)
    #
    #     ⌽ 1 2 3 4 5 6                    ⍝ returns 6 5 4 3 2 1
    #     ⌽ (1 2) (3 4) (5 6)              ⍝ returns (5 6) (3 4) (1 2)
    #     ⌽ "BOB WON POTS"                 ⍝ returns 'STOP NOW BOB'
    #     ⌽    2 5 ⍴ 1 2 3 4 5 6 7 8 9 0   ⍝ returns 2 5 ⍴ 5 4 3 2 1 0 9 8 7 6
    #     ⌽[0] 2 5 ⍴ 1 2 3 4 5 6 7 8 9 0   ⍝ returns 2 5 ⍴ 6 7 8 9 0 1 2 3 4 5
    if axis
      if not axis.isSingleton() then throw LengthError()
      axis = axis.unbox()
      if not isInt axis then throw DomainError()
      if not (0 <= axis < omega.shape.length) then throw IndexError()
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
#     ⊖[1] 2 5 ⍴ 1 2 3 4 5 6 7 8 9 0  ⍝ returns 2 5 ⍴ 5 4 3 2 1 0 9 8 7 6
#
# 1st axis rotate (`⊖`)
#
#    1 ⊖ 3 3 ⍴ ⍳ 9   ⍝ returns 3 3 ⍴ 3 4 5 6 7 8 0 1 2
@['⊖'] = (omega, alpha, axis = APLArray.zero) ->
  rotate omega, alpha, axis
