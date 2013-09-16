{APLArray} = require '../array'
{assert, isInt, repeat} = require '../helpers'
{RankError, NonceError, DomainError, LengthError} = require '../errors'
{adverb} = require './vhelpers'

# Scan or expand (`\`)
#
# +\ 20 10 ¯5 7              <=> 20 30 25 32
# ,\ "AB" "CD" "EF"          <=> 'AB' 'ABCD' 'ABCDEF'
# ×\ 2 3⍴5 2 3 4 7 6         <=> 2 3 ⍴ 5 10 30 4 28 168
# ∧\ 1 1 1 0 1 1             <=> 1 1 1 0 0 0
# -\ 1 2 3 4                 <=> 1 ¯1 2 ¯2
# ∨\ 0 0 1 0 0 1 0           <=> 0 0 1 1 1 1 1
# +\ 1 2 3 4 5               <=> 1 3 6 10 15
# +\ (1 2 3)(4 5 6)(7 8 9)   <=> (1 2 3) (5 7 9) (12 15 18)
# M←2 3⍴1 2 3 4 5 6 ⋄ +\M    <=> 2 3 ⍴ 1 3 6 4 9 15
# M←2 3⍴1 2 3 4 5 6 ⋄ +⍀M    <=> 2 3 ⍴ 1 2 3 5 7 9
# //gives 'M←2 3⍴1 2 3 4 5 6 ⋄ +\[0]M', [1, 2, 3, 5, 7, 9] # todo
# ,\ 'ABC'                   <=> 'A' 'AB' 'ABC'
# T←"ONE(TWO) BOOK(S)" ⋄ ≠\T∊"()" <=> 0 0 0 1 1 1 1 0 0 0 0 0 0 1 1 0
# T←"ONE(TWO) BOOK(S)" ⋄ ((T∊"()")⍱≠\T∊"()")/T   <=> 'ONE BOOK'
#
# 1 0 1\'ab'          <=> 'a b'
# 0 1 0 1 0\2 3       <=> 0 2 0 3 0
# (2 2⍴0)\'food'      !!! RANK ERROR
# 'abc'\'def'         !!! DOMAIN ERROR
# 1 0 1 1\'ab'        !!! LENGTH ERROR
# 1 0 1 1\'abcd'      !!! LENGTH ERROR
# 1 0 1\2 2⍴'ABCD'    <=> 2 3⍴'A BC D'
# 1 0 1⍀2 2⍴'ABCD'    <=> 3 2⍴'AB  CD'
# 1 0 1\[0]2 2⍴'ABCD' <=> 3 2⍴'AB  CD'
# 1 0 1\[1]2 2⍴'ABCD' <=> 2 3⍴'A BC D'
@['\\'] = adverb (omega, alpha, axis) ->
  if typeof omega is 'function'
    scan omega, undefined, axis
  else
    expand omega, alpha, axis

@['⍀'] = adverb (omega, alpha, axis = APLArray.zero) ->
  if typeof omega is 'function'
    scan omega, undefined, axis
  else
    expand omega, alpha, axis

# Helper for `\` and `⍀` in their adverbial sense
scan = (f, g, axis) ->
  assert typeof g is 'undefined'
  (omega, alpha) ->
    assert not alpha?
    if omega.shape.length is 0 then return omega
    axis = if axis then axis.toInt 0, omega.shape.length else omega.shape.length - 1
    omega.map (x, indices) ->
      p = omega.offset
      for index, a in indices then p += index * omega.stride[a]
      if not (x instanceof APLArray) then x = APLArray.scalar x
      for j in [0...indices[axis]] by 1
        p -= omega.stride[axis]
        y = omega.data[p]
        if not (y instanceof APLArray) then y = APLArray.scalar y
        x = f x, y
      if x.shape.length is 0 then x = x.unwrap()
      x

# Helper for `\` and `⍀` in their verbal sense
expand = (omega, alpha, axis) ->
  if omega.shape.length is 0 then throw NonceError 'Expand of scalar not implemented'
  axis = if axis then axis.toInt 0, omega.shape.length else omega.shape.length - 1
  if alpha.shape.length > 1 then throw RankError()
  a = alpha.toArray()

  shape = omega.shape[...]
  shape[axis] = a.length
  b = []
  i = 0
  for x in a
    if not isInt x, 0, 2 then throw DomainError()
    b.push(if x > 0 then i++ else null)
  if i isnt omega.shape[axis] then throw LengthError()

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
