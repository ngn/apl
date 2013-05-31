{APLArray} = require '../array'
{assert} = require '../helpers'

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
@['\\'] = (omega, alpha, axis) ->
  if typeof omega is 'function'
    scan omega, undefined, axis
  else
    expand omega, alpha, axis

@['⍀'] = (omega, alpha, axis = APLArray.zero) ->
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
expand = ->
  # todo
