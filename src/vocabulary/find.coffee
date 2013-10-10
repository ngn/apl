macro -> macro.fileToNode 'src/macros.coffee'
{APLArray, strideForShape} = require '../array'
{prod, repeat} = require '../helpers'
{match} = require './vhelpers'

@vocabulary =

  '⍷': (omega, alpha) ->
    if alpha

      # Find (`⍷`)
      #
      # "AN"⍷"BANANA"                        <=> 0 1 0 1 0 0
      # "BIRDS" "NEST"⍷"BIRDS" "NEST" "SOUP" <=> 1 0 0
      # "ME"⍷"HOME AGAIN"                    <=> 0 0 1 0 0 0 0 0 0 0
      #
      # "DAY"⍷7 9⍴("SUNDAY   ",
      # ...        "MONDAY   ",
      # ...        "TUESDAY  ",
      # ...        "WEDNESDAY",
      # ...        "THURSDAY ",
      # ...        "FRIDAY   ",
      # ...        "SATURDAY ")
      # ... <=> (7 9 ⍴
      # ...      0 0 0 1 0 0 0 0 0
      # ...      0 0 0 1 0 0 0 0 0
      # ...      0 0 0 0 1 0 0 0 0
      # ...      0 0 0 0 0 0 1 0 0
      # ...      0 0 0 0 0 1 0 0 0
      # ...      0 0 0 1 0 0 0 0 0
      # ...      0 0 0 0 0 1 0 0 0)
      #
      # (2 2⍴"ABCD")⍷"ABCD" <=> 4 ⍴ 0
      # (1 2) (3 4) ⍷ "START" (1 2 3)(1 2)(3 4) <=> 0 0 1 0
      #
      # (2 2⍴7 8 12 13)⍷ 1+ 4 5⍴⍳20
      # ... <=> 4 5⍴(0 0 0 0 0
      # ...          0 1 0 0 0
      # ...          0 0 0 0 0
      # ...          0 0 0 0 0)
      #
      # 1⍷⍳5                <=> 0 1 0 0 0
      # 1 2⍷⍳5              <=> 0 1 0 0 0
      # ⍬⍷⍳5                <=> 1 1 1 1 1
      # ⍬⍷⍬                 <=> ⍬
      # 1⍷⍬                 <=> ⍬
      # 1 2 3⍷⍬             <=> ⍬
      # (2 3 0⍴0)⍷(3 4 5⍴0) <=> 3 4 5⍴1
      # (2 3 4⍴0)⍷(3 4 0⍴0) <=> 3 4 0⍴0
      # (2 3 0⍴0)⍷(3 4 0⍴0) <=> 3 4 0⍴0
      if alpha.shape.length > omega.shape.length
        return new APLArray [0], omega.shape, repeat [0], omega.shape.length
      if alpha.shape.length < omega.shape.length
        alpha = new APLArray( # prepend ones to the shape of alpha
          alpha.data
          repeat([1], omega.shape.length - alpha.shape.length).concat(alpha.shape)
          repeat([0], omega.shape.length - alpha.shape.length).concat(alpha.stride)
          alpha.offset
        )
      if prod(alpha.shape) is 0
        return new APLArray [1], omega.shape, repeat [0], omega.shape.length
      findShape = []
      for i in [0...omega.shape.length]
        d = omega.shape[i] - alpha.shape[i] + 1
        if d <= 0 then return new APLArray [0], omega.shape, repeat [0], omega.shape.length
        findShape.push d
      stride = strideForShape omega.shape
      data = repeat [0], prod omega.shape
      p = omega.offset
      q = 0
      indices = repeat [0], findShape.length
      loop
        data[q] = +match alpha, new APLArray omega.data, alpha.shape, omega.stride, p
        a = findShape.length - 1
        while a >= 0 and indices[a] + 1 is findShape[a]
          p -= indices[a] * omega.stride[a]
          q -= indices[a] * stride[a]
          indices[a--] = 0
        if a < 0 then break
        p += omega.stride[a]
        q += stride[a]
        indices[a]++
      new APLArray data, omega.shape

    else
      throw Error 'Not implemented'
