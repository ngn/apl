{APLArray} = require '../array'
{RankError, IndexError} = require '../errors'

@vocabulary =

  '⊃': (omega, alpha) ->
    if alpha

      # Pick (`⊃`)
      #
      # ⍬⊃3               <=> 3
      # 2⊃'PICK'          <=> 'C'
      # (⊂1 0)⊃2 2⍴'ABCD' <=> 'C'
      # 1⊃'foo' 'bar'     <=> 'bar'
      # 1 2⊃'foo' 'bar'   <=> 'r'
      # (2 2⍴0)⊃1 2       !!! RANK ERROR
      # (⊂2 1⍴0)⊃2 2⍴0    !!! RANK ERROR
      # (⊂2 2⍴0)⊃1 2      !!! RANK ERROR
      # (⊂2 2)⊃1 2        !!! RANK ERROR
      # (⊂0 2)⊃2 2⍴'ABCD' !!! INDEX ERROR
      if alpha.shape.length > 1
        throw RankError()
      x = omega
      path = alpha.toArray()
      for pick in path
        if pick instanceof APLArray
          if pick.shape.length > 1
            throw RankError()
          pick = pick.toArray()
        else
          pick = [pick]
        if pick.length isnt x.shape.length
          throw RankError()
        for i in [0...pick.length]
          if pick[i] >= x.shape[i]
            throw IndexError()
        x = x.get pick
        if x not instanceof APLArray
          x = APLArray.scalar x
      x

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
      x = omega.get []
      if x instanceof APLArray then x else APLArray.scalar x
