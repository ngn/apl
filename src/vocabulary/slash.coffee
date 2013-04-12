{APLArray} = require '../array'
{assert, repeat} = require '../helpers'

# Reduce, compress, or replicate (`/`)
#
# Reduce
#
#     +/ 3                       ⍝ returns 3
#     +/ 3 5 8                   ⍝ returns 16
#     +/ 2 4 6                   ⍝ returns 12
#     ⌈/ 82 66 93 13             ⍝ returns 93
#     ×/ 2 3 ⍴ 1 2 3 4 5 6       ⍝ returns 6 120
#     2 ,/ 'AB' 'CD' 'EF' 'HI'   ⍝ returns 'ABCD' 'CDEF' 'EFHI'
#     3 ,/ 'AB' 'CD' 'EF' 'HI'   ⍝ returns 'ABCDEF' 'CDEFHI'
#
# N-Wise reduce
#
#     2 +/ 1 + ⍳10    ⍝ returns 3 5 7 9 11 13 15 17 19
#     5 +/ 1 + ⍳10    ⍝ returns 15 20 25 30 35 40
#     10 +/ 1 + ⍳10   ⍝ returns ,55
#     11 +/ 1 + ⍳10   ⍝ returns ⍬
#     12 +/ 1 + ⍳10   ⍝ throws
#     2 −/ 3 4 9 7    ⍝ returns ¯1 ¯5 2
#     ¯2 −/ 3 4 9 7   ⍝ returns 1 5 ¯2
#
#!Compress
#
#!    0 1 0 1 / 'ABCD'                                ⍝ returns 'BD'
#!    1 1 1 1 0 / 12 14 16 18 20                      ⍝ returns 12 14 16 18
#!    MARKS←45 60 33 50 66 19 ◇ (MARKS≥50)/MARKS      ⍝ returns 60 50 66
#!    MARKS←45 60 33 50 66 19 ◇ (MARKS=50)/⍳↑⍴MARKS   ⍝ returns ,3
#!    1/"FREDERIC"                                    ⍝ returns 'FREDERIC'
#!    0/"FREDERIC"                                    ⍝ returns ⍬
#!    0 1 0  / 1+2 3⍴⍳6                               ⍝ returns 2 1 ⍴ 2 5
#!    1 0 /[0] 1+2 3⍴⍳6                               ⍝ returns 1 3 ⍴ 1 2 3
#!    1 0 ⌿    1+2 3⍴⍳6                               ⍝ returns 1 3 ⍴ 1 2 3
#!    3 / 5                                           ⍝ returns 5 5 5
#
#!Replicate
#
#!    2 ¯2 2 / 1+2 3⍴⍳6
#!    ... ⍝ returns 2 6 ⍴  1 1 0 0 3 3  4 4 0 0 6 6
#!    2 ¯2 2 ¯2 2 / 1+2 3⍴⍳6
#!    ... ⍝ returns 2 10 ⍴  1 1 0 0 2 2 0 0 3 3  4 4 0 0 5 5 0 0 6 6
#!    1 1 ¯2 1 1 / 1 2 (2 2⍴⍳4) 3 4     ⍝ returns 1 2 (2 2⍴0) (2 2⍴0) 3 4
#!    1 1 ¯2 1 1 1 / 1 2 (2 2⍴⍳4) 3 4   ⍝ returns 1 2 0 0 (2 2⍴0 1 2 3) 3 4
#!    2 3 2 / 'ABC'             ⍝ returns 'AABBBCC'
#!    2 / 'DEF'                 ⍝ returns 'DDEEFF'
#!    5 0 5 / 1 2 3             ⍝ returns 1 1 1 1 1 3 3 3 3 3
#!    2 / 1+2 3⍴⍳6              ⍝ returns 2 6 ⍴  1 1 2 2 3 3  4 4 5 5 6 6
#!    2 ⌿ 1+2 3⍴⍳6              ⍝ returns 4 3 ⍴  1 2 3  1 2 3  4 5 6  4 5 6
#!    2 3 / 3 1⍴"ABC"           ⍝ returns 3 5 ⍴ 'AAAAABBBBBCCCCC'
#!    2 ¯1 2 /[1] 3 1⍴(7 8 9)   ⍝ returns 3 5 ⍴ 7 7 0 7 7 8 8 0 8 8 9 9 0 9 9
#!    2 ¯1 2 /[1] 3 1⍴"ABC"     ⍝ returns 3 5 ⍴ 'AA AABB BBCC CC'
#!    2 ¯2 2 / 7                ⍝ returns 7 7 0 0 7 7

@['/'] = (omega, alpha, axis) ->
  if typeof omega is 'function'
    reduce omega, alpha, axis
  else
    compressOrReplicate omega, alpha, axis

@['⌿'] = (omega, alpha, axis = APLArray.zero) ->
  if typeof omega is 'function'
    reduce omega, alpha, axis
  else
    compressOrReplicate omega, alpha, axis

# Helper for `/` and `⌿` in their adverbial sense
reduce = (f, g, axis) ->
  assert typeof f is 'function'
  assert typeof g is 'undefined'
  (omega, alpha) ->
    if omega.shape.length is 0 then omega = new APLArray [omega.unbox()]
    axis = if axis? then axis.toInt() else omega.shape.length - 1
    if not (0 <= axis < omega.shape.length) then throw Error 'RANK ERROR'

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
      if shape[axis] < 0 then throw Error 'LENGTH ERROR'
    else
      rShape = rShape[...]
      rShape.splice axis, 1

    if omega.empty() then throw Error 'DOMAIN ERROR'

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
      if x.shape.length is 0 then x = x.unbox()
      data.push x
      a = indices.length - 1
      while a >= 0 and indices[a] + 1 is shape[a]
        p -= indices[a] * omega.stride[a]
        indices[a--] = 0
      if a < 0 then break
      p += omega.stride[a]
      indices[a]++

    new APLArray data, rShape

# Helper for `/` and `⌿` in their verbal sense
compressOrReplicate = (omega, alpha, axis) ->
  APLArray.zero

#  assert alpha
#  if alpha.shape.length > 1 then throw Error 'RANK ERROR'
#  if omega.shape.length is 0 then omega = new APLArray [omega.unbox()]
#  axis = if axis then axis.toInt 0, omega.shape.length else omega.shape.length - 1
#  shape = omega.shape[...]
#  shape[axis] = 0
#  a = alpha.toArray()
#  nNonNegative = 0 # number of non-negative elements in a
#  for x in a
#    if not isInt x then throw Error 'DOMAIN ERROR'
#    shape[axis] += Math.abs x
#    nNonNegative += (x >= 0)

#  isExtensive = true; isExpansive = isHyperexpansive = false
#  if omega.shape[axis] isnt 1
#    isExpansive = a.length is omega.shape[axis]
#    isHyperexpansive = not isExpansive
#    if isHyperexpansive and nNonNegative isnt omega.shape[axis],
#      throw Error (
#        'For A/B, the length of B along the selected axis ' +
#        'must be equal either to one, ' +                 # extension
#        'or the length of A, ' +                          # expansion
#        'or to the number of non-negative elements in A.' # hyperexpansion
#      )

#  r = []
#  ni = prod sb[... axis]
#  nj = sb[axis]
#  nk = prod sb[axis + 1 ...]
#  for i in [0...ni]
#    j = 0
#    for x in a
#      if x > 0
#        for [0...x]
#          for k in [0...nk]
#            r.push b[k + nk*(j + nj*i)]
#        j += isExpansive or isHyperexpansive
#      else
#        filler = prototypeOf(
#          if isExpansive then [b[nk*(j + nj*i)]] else [b[nk*nj*i]]
#        )
#        for [0...-x*nk]
#          r.push filler
#        j += isExpansive

#  withShape sr, r
