addVocabulary

  # Scan or expand (`\`)
  #
  # +\ 20 10 ¯5 7              ←→ 20 30 25 32
  # ,\ "AB" "CD" "EF"          ←→ 'AB' 'ABCD' 'ABCDEF'
  # ×\ 2 3⍴5 2 3 4 7 6         ←→ 2 3 ⍴ 5 10 30 4 28 168
  # ∧\ 1 1 1 0 1 1             ←→ 1 1 1 0 0 0
  # -\ 1 2 3 4                 ←→ 1 ¯1 2 ¯2
  # ∨\ 0 0 1 0 0 1 0           ←→ 0 0 1 1 1 1 1
  # +\ 1 2 3 4 5               ←→ 1 3 6 10 15
  # +\ (1 2 3)(4 5 6)(7 8 9)   ←→ (1 2 3) (5 7 9) (12 15 18)
  # M←2 3⍴1 2 3 4 5 6 ⋄ +\M    ←→ 2 3 ⍴ 1 3 6 4 9 15
  # M←2 3⍴1 2 3 4 5 6 ⋄ +⍀M    ←→ 2 3 ⍴ 1 2 3 5 7 9
  # M←2 3⍴1 2 3 4 5 6 ⋄ +\[0]M ←→ 2 3 ⍴ 1 2 3 5 7 9
  # ,\ 'ABC'                   ←→ 'A' 'AB' 'ABC'
  # T←"ONE(TWO) BOOK(S)" ⋄ ≠\T∊"()" ←→ 0 0 0 1 1 1 1 0 0 0 0 0 0 1 1 0
  # T←"ONE(TWO) BOOK(S)" ⋄ ((T∊"()")⍱≠\T∊"()")/T   ←→ 'ONE BOOK'
  #
  # 1 0 1\'ab'          ←→ 'a b'
  # 0 1 0 1 0\2 3       ←→ 0 2 0 3 0
  # (2 2⍴0)\'food'      !!! RANK ERROR
  # 'abc'\'def'         !!! DOMAIN ERROR
  # 1 0 1 1\'ab'        !!! LENGTH ERROR
  # 1 0 1 1\'abcd'      !!! LENGTH ERROR
  # 1 0 1\2 2⍴'ABCD'    ←→ 2 3⍴'A BC D'
  # 1 0 1⍀2 2⍴'ABCD'    ←→ 3 2⍴'AB  CD'
  # 1 0 1\[0]2 2⍴'ABCD' ←→ 3 2⍴'AB  CD'
  # 1 0 1\[1]2 2⍴'ABCD' ←→ 2 3⍴'A BC D'
  '\\': adverb (⍵, ⍺, axis) ->
    if typeof ⍵ is 'function'
      scan ⍵, undefined, axis
    else
      expand ⍵, ⍺, axis

  '⍀': adverb (⍵, ⍺, axis = APLArray.zero) ->
    if typeof ⍵ is 'function'
      scan ⍵, undefined, axis
    else
      expand ⍵, ⍺, axis

# Helper for `\` and `⍀` in their adverbial sense
scan = (f, g, axis) ->
  assert typeof g is 'undefined'
  (⍵, ⍺) ->
    assert !⍺?
    if !⍴⍴ ⍵ then return ⍵
    axis = if axis then axis.toInt 0, ⍴⍴ ⍵ else ⍴⍴(⍵) - 1
    ⍵.map (x, indices) ->
      p = ⍵.offset
      for index, a in indices then p += index * ⍵.stride[a]
      if x !instanceof APLArray then x = APLArray.scalar x
      for j in [0...indices[axis]] by 1
        p -= ⍵.stride[axis]
        y = ⍵.data[p]
        if y !instanceof APLArray then y = APLArray.scalar y
        x = f x, y
      if !⍴⍴ x then x = x.unwrap()
      x

# Helper for `\` and `⍀` in their verbal sense
expand = (⍵, ⍺, axis) ->
  if !⍴⍴ ⍵ then nonceError 'Expand of scalar not implemented'
  axis = if axis then axis.toInt 0, ⍴⍴ ⍵ else ⍴⍴(⍵) - 1
  if ⍴⍴(⍺) > 1 then rankError()
  a = ⍺.toArray()

  shape = ⍴(⍵)[..]
  shape[axis] = a.length
  b = []
  i = 0
  for x in a
    if !isInt x, 0, 2 then domainError()
    b.push(if x > 0 then i++ else null)
  if i isnt ⍴(⍵)[axis] then lengthError()

  data = []
  if shape[axis] isnt 0 and !⍵.empty()
    filler = ⍵.getPrototype()
    p = ⍵.offset
    indices = repeat [0], shape.length
    loop
      x =
        if b[indices[axis]]?
          ⍵.data[p + b[indices[axis]] * ⍵.stride[axis]]
        else
          filler
      data.push x

      i = shape.length - 1
      while i >= 0 and indices[i] + 1 is shape[i]
        if i isnt axis then p -= ⍵.stride[i] * indices[i]
        indices[i--] = 0
      if i < 0 then break
      if i isnt axis then p += ⍵.stride[i]
      indices[i]++

  new APLArray data, shape
