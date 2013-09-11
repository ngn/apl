{APLArray} = require '../array'
{RankError, IndexError} = require '../errors'

@['⊃'] = (omega, alpha) ->
  if alpha

    # Pick (`⊃`)
    #
    # ⍬⊃3            <=> 3
    # 2⊃'PICK'       <=> 'C'
    # 1 0⊃2 2⍴'ABCD' <=> 'C'
    # 1⊃'foo' 'bar'  <=> 'bar'
    # (2 2⍴0)⊃1 2    !!! RANK ERROR
    # (2 2)⊃1 2      !!! RANK ERROR
    # 0 2⊃2 2⍴'ABCD' !!! INDEX ERROR
    if alpha.shape.length > 1
      throw RankError()
    pick = alpha.toArray()
    if pick.length isnt omega.shape.length
      throw RankError()
    for i in [0...pick.length]
      if pick[i] >= omega.shape[i]
        throw IndexError()
    omega.get pick

  else

    # Disclose (`⊃`)
    #
    # ⊃(1 2 3)(4 5 6)   <=> 1 2 3
    # ⊃(1 2)(3 4 5)     <=> 1 2
    # ⊃'AB'             <=> 'A'
    # ⊃123              <=> 123
    # ⊃⍬                <=> 0
    #!    ⊃''               <=> ' '
    if omega.empty()
      return APLArray.zero
    pick = []

  x = omega.get pick
  if x instanceof APLArray then x else APLArray.scalar x
