macro -> macro.fileToNode 'src/macros.coffee'
{APLArray} = require '../array'
{isInt, repeat, prod} = require '../helpers'
{DomainError, RankError} = require '../errors'

@vocabulary =

  '↓': (omega, alpha, axis) ->
    if alpha

      # Drop (`↓`)
      #
      # 4↓'OVERBOARD'            <=> 'BOARD'
      # ¯5↓'OVERBOARD'           <=> 'OVER'
      # ⍴10↓'OVERBOARD'          <=> ,0
      # 0 ¯2↓ 3 3 ⍴ 'ONEFATFLY'  <=> 3 1 ⍴ 'OFF'
      # ¯2 ¯1↓ 3 3 ⍴ 'ONEFATFLY' <=> 1 2 ⍴ 'ON'
      # 1↓ 3 3 ⍴ 'ONEFATFLY'     <=> 2 3 ⍴ 'FATFLY'
      # ⍬↓3 3⍴⍳9                 <=> 3 3⍴⍳9
      # 1 1↓ 2 3 4⍴"ABCDEFGHIJKLMNOPQRSTUVWXYZ"   <=> 1 2 4 ⍴ 'QRSTUVWX'
      # ¯1 ¯1↓ 2 3 4⍴"ABCDEFGHIJKLMNOPQRSTUVWXYZ" <=> 1 2 4 ⍴ 'ABCDEFGH'
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

      # Split (`↓`)
      #
      # ↓1 2 3 <=> ⊂1 2 3
      # ↓(1 2)(3 4) <=> ⊂(1 2)(3 4)
      # ↓2 2⍴⍳4 <=> (0 1)(2 3)
      # ↓2 3 4⍴⍳24 <=> 2 3⍴(0 1 2 3)(4 5 6 7)(8 9 10 11)(12 13 14 15)(16 17 18 19)(20 21 22 23)
      if omega.shape.length is 0
        throw NonceError 'Split of scalar not implemented'
      oshape = omega.shape[...omega.shape.length - 1]
      obound = oshape.reduce ((a, b) -> a * b), 1
      ishape = omega.shape[omega.shape.length - 1]
      array = omega.toArray()
      data = []
      for i in [0...obound]
        offset = i * ishape
        data.push new APLArray array[offset...offset + ishape]
      new APLArray data, oshape
