macro -> macro.fileToNode 'src/macros.coffee'
{APLArray} = require '../array'
{DomainError, IndexError, RankError, LengthError} = require '../errors'
{prod, repeat} = require '../helpers'

@vocabulary =

  # Index (`⌷`)
  #
  # `a0 a1...⌷b` is equivalent to `b[a0;a1;...]`
  #
  # 1⌷3 5 8                <=> 5
  # (3 5 8)[1]             <=> 5
  # (2 2 0)(1 2)⌷3 3⍴⍳9    <=> 3 2⍴7 8 7 8 1 2
  # ¯1⌷3 5 8               !!! INDEX ERROR
  # 2⌷111 222 333 444      <=> 333
  # (⊂3 2)⌷111 222 333 444 <=> 444 333
  # (⊂2 3⍴2 0 3 0 1 2)⌷111 222 333 444
  # ... <=> 2 3⍴333 111 444 111 222 333
  # 1 0   ⌷3 4⍴11 12 13 14 21 22 23 24 31 32 33 34 <=> 21
  # 1     ⌷3 4⍴11 12 13 14 21 22 23 24 31 32 33 34 <=> 21 22 23 24
  # 2(1 0)⌷3 4⍴11 12 13 14 21 22 23 24 31 32 33 34 <=> 32 31
  # (1 2)0⌷3 4⍴11 12 13 14 21 22 23 24 31 32 33 34 <=> 21 31
  '⌷': squish = (omega, alpha, axes) ->
    if typeof omega is 'function' then return (x, y) -> omega x, y, alpha
    if not alpha then throw Error 'Not implemented'

    [subscripts, subscriptShapes] = prepareForIndexing omega, alpha, axes

    data = []
    u = repeat [0], subscripts.length
    p = omega.offset
    for a in [0...subscripts.length]
      p += subscripts[a][0] * omega.stride[a]
    loop
      data.push omega.data[p]
      a = subscripts.length - 1
      while a >= 0 and u[a] + 1 is subscripts[a].length
        p += (subscripts[a][0] - subscripts[a][u[a]]) * omega.stride[a]
        u[a--] = 0
      if a < 0 then break
      p += (subscripts[a][u[a] + 1] - subscripts[a][u[a]]) * omega.stride[a]
      u[a]++

    new APLArray data, [].concat subscriptShapes...

  # (23 54 38)[0]                       <=> 23
  # (23 54 38)[1]                       <=> 54
  # (23 54 38)[2]                       <=> 38
  # (23 54 38)[3]                       !!! INDEX ERROR
  # (23 54 38)[¯1]                      !!! INDEX ERROR
  # (23 54 38)[0 2]                     <=> 23 38
  # (2 3⍴100 101 102 110 111 112)[1;2]  <=> 112
  # (2 3⍴100 101 102 110 111 112)[1;¯1] !!! INDEX ERROR
  # (2 3⍴100 101 102 110 111 112)[10;1] !!! INDEX ERROR
  # (2 3⍴100 101 102 110 111 112)[1;]   <=> 110 111 112
  # (2 3⍴100 101 102 110 111 112)[;1]   <=> 101 111
  # 'hello'[1]                          <=> 'e'
  # 'ipodlover'[1 2 5 8 3 7 6 0 4]      <=> 'poordevil'
  # ('axlrose'[4 3 0 2 5 6 1])[0 1 2 3] <=> 'oral'
  #
  #! " X"[(3 3⍴⍳9)∊1 3 6 7 8] <=> 3 3⍴,/(' X '
  #! ...                                 'X  '
  #! ...                                 'XXX')
  _index: (alpha, omega, axes) ->
    squish omega, alpha, axes

  # a←⍳5 ⋄ a[1 3]←7 8 ⋄ a <=> 0 7 2 8 4
  # a←⍳5 ⋄ a[1 3]←7   ⋄ a <=> 0 7 2 7 4
  # a←⍳5 ⋄ a[1]  ←7 8 ⋄ a !!! RANK ERROR
  # a←1 2 3 ⋄ a[1]←4 ⋄ a <=> 1 4 3
  # a←2 2⍴⍳4 ⋄ a[0;0]←4 ⋄ a <=> 2 2⍴4 1 2 3
  # a←5 5⍴0 ⋄ a[1 3;2 4]←2 2⍴1+⍳4 ⋄ a <=> 5 5⍴(0 0 0 0 0
  # ...                                        0 0 1 0 2
  # ...                                        0 0 0 0 0
  # ...                                        0 0 3 0 4
  # ...                                        0 0 0 0 0)
  # a←'this is a test' ⋄ a[0 5]←'TI' <=> 'This Is a test'
  # Data←0 4 8 ⋄ 10+ (Data[0 2]← 7 9) <=> 17 14 19
  # a←3 4⍴⍳12 ⋄ a[;1 2]←99 <=> 3 4⍴0 99 99 3 4 99 99 7 8 99 99 11
  _substitute: (value, alpha, omega, axes) ->
    [subscripts, subscriptShapes] = prepareForIndexing omega, alpha, axes
    indexShape = [].concat subscriptShapes...
    if value.isSingleton()
      value = new APLArray [value.unwrap()], indexShape, repeat([0], indexShape.length)
    else
      if value.shape.length isnt indexShape.length
        throw RankError()
      else
        for n, i in indexShape
          if value.shape[i] isnt n
            throw LengthError()

    r = new APLArray omega.toArray(), omega.shape
    p = 0 # pointer in r
    for a in [0...subscripts.length]
      p += subscripts[a][0] * r.stride[a]
    q = value.offset # pointer in value
    u = repeat [0], subscripts.length
    loop
      r.data[p] = value.data[q]
      a = subscripts.length - 1
      while a >= 0 and u[a] + 1 is subscripts[a].length
        p += (subscripts[a][0] - subscripts[a][u[a]]) * r.stride[a]
        q -= u[a] * value.stride[a]
        u[a--] = 0
      if a < 0 then break
      p += (subscripts[a][u[a] + 1] - subscripts[a][u[a]]) * r.stride[a]
      q += value.stride[a]
      u[a]++
    r

prepareForIndexing = (omega, alpha, axes) ->
  assert alpha instanceof APLArray
  assert omega instanceof APLArray
  assert (not axes?) or axes instanceof APLArray

  if alpha.shape.length > 1 then throw RankError()
  alphaItems = alpha.toArray()
  if alphaItems.length > omega.shape.length then throw LengthError()

  axes = if axes then axes.toArray() else [0...alphaItems.length]
  if alphaItems.length isnt axes.length then throw LengthError()

  subscripts = Array omega.shape.length
  subscriptShapes = Array omega.shape.length
  for axis, i in axes
    if not isInt axis then throw DomainError()
    if not (0 <= axis < omega.shape.length) then throw RankError()
    if typeof subscripts[axis] isnt 'undefined' then throw RankError 'Duplicate axis'
    d = alphaItems[i]
    subscripts[axis] = if d instanceof APLArray then d.toArray() else [d]
    assert subscripts[axis].length
    subscriptShapes[axis] = if d instanceof APLArray then d.shape else []
    for x in subscripts[axis]
      if not isInt x then throw DomainError()
      if not (0 <= x < omega.shape[axis]) then throw IndexError()

  for i in [0...subscripts.length] when typeof subscripts[i] is 'undefined'
    subscripts[i] = [0...omega.shape[i]]
    subscriptShapes[i] = [omega.shape[i]]

  [subscripts, subscriptShapes]
