macro -> macro.fileToNode 'src/macros.coffee'
{APLArray} = require '../array'
{DomainError, RankError, LengthError} = require '../errors'

@vocabulary =

  '⍉': (omega, alpha) ->
    if alpha
      # Transpose (`⍉`)
      #
      # (2 2⍴⍳4)⍉2 2 2 2⍴⍳16 !!! RANK ERROR
      # 0⍉3 5 8 <=> 3 5 8
      # 1 0⍉2 2 2⍴⍳8 !!! LENGTH ERROR
      # ¯1⍉1 2 !!! DOMAIN ERROR
      # 'a'⍉1 2 !!! DOMAIN ERROR
      # 2⍉1 2 !!! RANK ERROR
      # 2 0 1⍉2 3 4⍴⍳24 <=> 3 4 2⍴0 12 1 13 2 14 3 15 4 16 5 17 6 18 7 19 8 20 9 21 10 22 11 23
      if alpha.shape.length > 1 then throw RankError()
      if alpha.shape.length is 0 then alpha = new APLArray [alpha.unwrap()]
      n = omega.shape.length
      if alpha.shape[0] isnt n then throw LengthError()
      shape = Array n
      stride = Array n
      for x, i in alpha.toArray()
        if not isInt x, 0 then throw DomainError()
        if x >= n then throw RankError()
        if shape[x]? then throw DomainError 'Duplicate axis'
        shape[x] = omega.shape[i]
        stride[x] = omega.stride[i]
      new APLArray omega.data, shape, stride, omega.offset
    else
      # Transpose (`⍉`)
      #
      # ⍉2 3⍴1 2 3 6 7 8  <=> 3 2⍴1 6 2 7 3 8
      # ⍴⍉2 3⍴1 2 3 6 7 8 <=> 3 2
      # ⍉1 2 3            <=> 1 2 3
      # ⍉2 3 4⍴⍳24        <=> (4 3 2⍴
      # ...                    0 12   4 16    8 20
      # ...                    1 13   5 17    9 21
      # ...                    2 14   6 18   10 22
      # ...                    3 15   7 19   11 23)
      # ⍉⍬                <=> ⍬
      # ⍉''               <=> ''
      new APLArray(
        omega.data
        omega.shape[...].reverse()
        omega.stride[...].reverse()
        omega.offset
      )
