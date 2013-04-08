{APLArray} = require '../array'

# Disclose (`⊃`)
#
#     ⊃(1 2 3)(4 5 6)   ⍝ returns 1 2 3
#     ⊃(1 2)(3 4 5)     ⍝ returns 1 2
#     ⊃'AB'             ⍝ returns 'A'
#     ⊃123              ⍝ returns 123
#     ⊃⍬                ⍝ returns 0
#!    ⊃''               ⍝ returns ' '
@['⊃'] = (omega, alpha) ->
  if alpha
    throw Error 'Not implemented'
  else

    if omega.empty()
      APLArray.zero
    else
      x = omega.data[omega.offset]
      if x instanceof APLArray then x else APLArray.scalar x
