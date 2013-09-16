{APLArray} = require '../array'
{RankError, LengthError, DomainError} = require '../errors'
{assert, repeat, isInt} = require '../helpers'
{adverb} = require './vhelpers'

@vocabulary =

  '/': adverb (omega, alpha, axis) ->
    if typeof omega is 'function'
      reduce omega, alpha, axis
    else
      compressOrReplicate omega, alpha, axis

  '⌿': adverb (omega, alpha, axis = APLArray.zero) ->
    if typeof omega is 'function'
      reduce omega, alpha, axis
    else
      compressOrReplicate omega, alpha, axis

# Reduce (`/`)
#
# +/3                    <=> 3
# +/3 5 8                <=> 16
# +/2 4 6                <=> 12
# ⌈/82 66 93 13          <=> 93
# ×/2 3⍴1 2 3 4 5 6      <=> 6 120
# 2,/'AB' 'CD' 'EF' 'HI' <=> 'ABCD' 'CDEF' 'EFHI'
# 3,/'AB' 'CD' 'EF' 'HI' <=> 'ABCDEF' 'CDEFHI'
# -/3 0⍴42               <=> 3⍴0
#
# N-Wise reduce
#
# 2+/1+⍳10    <=> 3 5 7 9 11 13 15 17 19
# 5+/1+⍳10    <=> 15 20 25 30 35 40
# 10+/1+⍳10   <=> ,55
# 11+/1+⍳10   <=> ⍬
# 12+/1+⍳10   !!! LENGTH ERROR
# 2-/3 4 9 7  <=> ¯1 ¯5 2
# ¯2-/3 4 9 7 <=> 1 5 ¯2
reduce = @reduce = (f, g, axis0) ->
  assert typeof f is 'function'
  assert typeof g is 'undefined'
  assert((typeof axis0 is 'undefined') or (axis0 instanceof APLArray))
  (omega, alpha) ->
    if omega.shape.length is 0 then omega = new APLArray [omega.unwrap()]
    axis = if axis0? then axis0.toInt() else omega.shape.length - 1
    if not (0 <= axis < omega.shape.length) then throw RankError()

    if alpha
      isNWise = true
      n = alpha.toInt()
      if n < 0
        isBackwards = true
        n = -n
    else
      n = omega.shape[axis]
      isMonadic = true

    shape = omega.shape[...]
    shape[axis] = omega.shape[axis] - n + 1
    rShape = shape
    if isNWise
      if shape[axis] is 0 then return new APLArray [], rShape
      if shape[axis] < 0 then throw LengthError()
    else
      rShape = rShape[...]
      rShape.splice axis, 1

    if omega.empty()
      if (z = f.aplMetaInfo?.identity)?
        assert z.shape.length is 0
        return new APLArray z.data, rShape, repeat([0], rShape.length), z.offset
      else
        throw DomainError()

    data = []
    indices = repeat [0], shape.length
    p = omega.offset
    loop
      if isBackwards
        x = omega.data[p]
        x = if x instanceof APLArray then x else APLArray.scalar x
        for i in [1...n] by 1
          y = omega.data[p + i * omega.stride[axis]]
          y = if y instanceof APLArray then y else APLArray.scalar y
          x = f x, y
      else
        x = omega.data[p + (n - 1) * omega.stride[axis]]
        x = if x instanceof APLArray then x else APLArray.scalar x
        for i in [n - 2 .. 0] by -1
          y = omega.data[p + i * omega.stride[axis]]
          y = if y instanceof APLArray then y else APLArray.scalar y
          x = f x, y
      if x.shape.length is 0 then x = x.unwrap()
      data.push x
      a = indices.length - 1
      while a >= 0 and indices[a] + 1 is shape[a]
        p -= indices[a] * omega.stride[a]
        indices[a--] = 0
      if a < 0 then break
      p += omega.stride[a]
      indices[a]++

    new APLArray data, rShape

# Replicate (`/`)
#
# 0 1 0 1/'ABCD'                                <=> 'BD'
# 1 1 1 1 0/12 14 16 18 20                      <=> 12 14 16 18
# MARKS←45 60 33 50 66 19 ⋄ (MARKS≥50)/MARKS    <=> 60 50 66
#!MARKS←45 60 33 50 66 19 ⋄ (MARKS=50)/⍳↑⍴MARKS <=> ,3
# 1/"FREDERIC"                                  <=> 'FREDERIC'
# 0/"FREDERIC"                                  <=> ⍬
# 0 1 0  / 1+2 3⍴⍳6                             <=> 2 1⍴2 5
# 1 0 /[0] 1+2 3⍴⍳6                             <=> 1 3⍴1 2 3
# 1 0 ⌿    1+2 3⍴⍳6                             <=> 1 3⍴1 2 3
# 3 / 5                                         <=> 5 5 5
# 2 ¯2 2 / 1+2 3⍴⍳6
# ... <=> 2 6 ⍴  1 1 0 0 3 3  4 4 0 0 6 6
# 1 1 ¯2 1 1 / 1 2 (2 2⍴⍳4) 3 4     <=> 1 2 0 0 3 4
# 2 3 2 / 'ABC'           <=> 'AABBBCC'
# 2 / 'DEF'               <=> 'DDEEFF'
# 5 0 5 / 1 2 3           <=> 1 1 1 1 1 3 3 3 3 3
# 2 / 1+2 3⍴⍳6            <=> 2 6⍴ 1 1 2 2 3 3  4 4 5 5 6 6
# 2 ⌿ 1+2 3⍴⍳6            <=> 4 3⍴ 1 2 3  1 2 3  4 5 6  4 5 6
# 2 3 / 3 1⍴"ABC"         <=> 3 5⍴'AAAAABBBBBCCCCC'
# 2 ¯1 2 /[1] 3 1⍴(7 8 9) <=> 3 5⍴7 7 0 7 7 8 8 0 8 8 9 9 0 9 9
# 2 ¯1 2 /[1] 3 1⍴"ABC"   <=> 3 5⍴'AA AABB BBCC CC'
# 2 ¯2 2 / 7              <=> 7 7 0 0 7 7
compressOrReplicate = (omega, alpha, axis) ->
  if omega.shape.length is 0 then omega = new APLArray [omega.unwrap()]
  axis = if axis then axis.toInt 0, omega.shape.length else omega.shape.length - 1
  if alpha.shape.length > 1 then throw RankError()
  a = alpha.toArray()
  n = omega.shape[axis]
  if a.length is 1 then a = repeat a, n
  if n not in [1, a.length] then throw LengthError()

  shape = omega.shape[...]
  shape[axis] = 0
  b = []
  for x, i in a
    if not isInt x then throw DomainError()
    shape[axis] += Math.abs x
    for [0...Math.abs(x)] then b.push(if x > 0 then i else null)
  if n is 1
    b = (for x in b then (if x? then 0 else x))

  data = []
  if shape[axis] isnt 0 and not omega.empty()
    filler = omega.getPrototype()
    p = omega.offset
    indices = repeat [0], shape.length
    loop
      x =
        if b[indices[axis]]?
          omega.data[p + b[indices[axis]] * omega.stride[axis]]
        else
          filler
      data.push x

      i = shape.length - 1
      while i >= 0 and indices[i] + 1 is shape[i]
        if i isnt axis then p -= omega.stride[i] * indices[i]
        indices[i--] = 0
      if i < 0 then break
      if i isnt axis then p += omega.stride[i]
      indices[i]++

  new APLArray data, shape
