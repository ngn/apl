{APLArray} = require '../array'

# Disclose (`⊃`)
#
# ⊃(1 2 3)(4 5 6)   <=> 1 2 3
# ⊃(1 2)(3 4 5)     <=> 1 2
# ⊃'AB'             <=> 'A'
# ⊃123              <=> 123
# ⊃⍬                <=> 0
#!    ⊃''               <=> ' '
@['⊃'] = (omega, alpha) ->
  if alpha
    throw Error 'Not implemented'
  else

    if omega.empty()
      APLArray.zero
    else
      x = omega.data[omega.offset]
      if x instanceof APLArray then x else APLArray.scalar x
