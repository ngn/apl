{APLArray} = require '../array'

@['⊃'] = (omega, alpha) ->
  if alpha

    # Pick (`⊃`)
    #
    # ⍬⊃3            <=> 3
    # 2⊃'PICK'       <=> 'C'
    # 1 0⊃2 2⍴'ABCD' <=> 'C'
    # 1⊃'foo' 'bar'  <=> 'bar'
    if alpha.shape.length > 1
      throw RankError
    pick = alpha.toArray()
    if pick.length isnt omega.shape.length
      throw RankError
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
    pick = []

  if omega.empty()
    APLArray.zero
  else
    x = omega.get pick
    if x instanceof APLArray then x else APLArray.scalar x
