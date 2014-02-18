addVocabulary

  '⍷': (⍵, ⍺) ->
    if ⍺

      # Find (`⍷`)
      #
      # "AN"⍷"BANANA"                        ←→ 0 1 0 1 0 0
      # "BIRDS" "NEST"⍷"BIRDS" "NEST" "SOUP" ←→ 1 0 0
      # "ME"⍷"HOME AGAIN"                    ←→ 0 0 1 0 0 0 0 0 0 0
      #
      # "DAY"⍷7 9⍴("SUNDAY   ",
      # ...        "MONDAY   ",
      # ...        "TUESDAY  ",
      # ...        "WEDNESDAY",
      # ...        "THURSDAY ",
      # ...        "FRIDAY   ",
      # ...        "SATURDAY ")
      # ... ←→ (7 9 ⍴
      # ...      0 0 0 1 0 0 0 0 0
      # ...      0 0 0 1 0 0 0 0 0
      # ...      0 0 0 0 1 0 0 0 0
      # ...      0 0 0 0 0 0 1 0 0
      # ...      0 0 0 0 0 1 0 0 0
      # ...      0 0 0 1 0 0 0 0 0
      # ...      0 0 0 0 0 1 0 0 0)
      #
      # (2 2⍴"ABCD")⍷"ABCD" ←→ 4 ⍴ 0
      # (1 2) (3 4) ⍷ "START" (1 2 3)(1 2)(3 4) ←→ 0 0 1 0
      #
      # (2 2⍴7 8 12 13)⍷ 1+ 4 5⍴⍳20
      # ... ←→ 4 5⍴(0 0 0 0 0
      # ...          0 1 0 0 0
      # ...          0 0 0 0 0
      # ...          0 0 0 0 0)
      #
      # 1⍷⍳5                ←→ 0 1 0 0 0
      # 1 2⍷⍳5              ←→ 0 1 0 0 0
      # ⍬⍷⍳5                ←→ 1 1 1 1 1
      # ⍬⍷⍬                 ←→ ⍬
      # 1⍷⍬                 ←→ ⍬
      # 1 2 3⍷⍬             ←→ ⍬
      # (2 3 0⍴0)⍷(3 4 5⍴0) ←→ 3 4 5⍴1
      # (2 3 4⍴0)⍷(3 4 0⍴0) ←→ 3 4 0⍴0
      # (2 3 0⍴0)⍷(3 4 0⍴0) ←→ 3 4 0⍴0
      if ⍴⍴(⍺) > ⍴⍴(⍵) then return new APLArray [0], ⍴(⍵), repeat [0], ⍴⍴ ⍵
      if ⍴⍴(⍺) < ⍴⍴(⍵)
        ⍺ = new APLArray( # prepend ones to the shape of ⍺
          ⍺.data
          repeat([1], ⍴⍴(⍵) - ⍴⍴(⍺)).concat ⍴ ⍺
          repeat([0], ⍴⍴(⍵) - ⍴⍴(⍺)).concat ⍺.stride
          ⍺.offset
        )
      if prod(⍴ ⍺) is 0
        return new APLArray [1], ⍴(⍵), repeat [0], ⍴⍴ ⍵
      findShape = []
      for i in [0...⍴⍴ ⍵]
        d = ⍴(⍵)[i] - ⍴(⍺)[i] + 1
        if d <= 0 then return new APLArray [0], ⍴(⍵), repeat [0], ⍴⍴ ⍵
        findShape.push d
      stride = strideForShape ⍴ ⍵
      data = repeat [0], prod ⍴ ⍵
      p = ⍵.offset
      q = 0
      indices = repeat [0], findShape.length
      loop
        data[q] = +match ⍺, new APLArray ⍵.data, ⍴(⍺), ⍵.stride, p
        a = findShape.length - 1
        while a >= 0 and indices[a] + 1 is findShape[a]
          p -= indices[a] * ⍵.stride[a]
          q -= indices[a] * stride[a]
          indices[a--] = 0
        if a < 0 then break
        p += ⍵.stride[a]
        q += stride[a]
        indices[a]++
      new APLArray data, ⍴ ⍵

    else
      nonceError()
