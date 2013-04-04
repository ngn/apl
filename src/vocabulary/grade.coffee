{APLArray} = require '../array'
{repeat} = require '../helpers'

# Grade up/down (`⍋`)
#
#     ⍋13 8 122 4                          ⍝ returns 3 1 0 2
#!    a←13 8 122 4  ◇  a[⍋a]               ⍝ returns 4 8 13 122
#     ⍋"ZAMBIA"                            ⍝ returns 1 5 3 4 2 0
#!    s←"ZAMBIA"  ◇  s[⍋s]                 ⍝ returns 'AABIMZ'
#     t←3 3⍴"BOBALFZAK"  ◇  ⍋t             ⍝ returns 1 0 2
#     t←3 3⍴4 5 6 1 1 3 1 1 2  ◇  ⍋t       ⍝ returns 2 1 0
#
#!    t←3 3⍴4 5 6 1 1 3 1 1 2  ◇  t[⍋t;]
#!    ...    ⍝ returns (3 3 ⍴   1 1 2
#!    ...                       1 1 3
#!    ...                       4 5 6)
#
#!    a←3 2 3⍴2 3 4 0 1 0 1 1 3 4 5 6 1 1 2 10 11 12  ◇  a[⍋a;;]
#!    ... ⍝ returns (3 2 3 ⍴
#!    ...      1  1  2
#!    ...     10 11 12
#!    ...
#!    ...      1  1  3
#!    ...      4  5  6
#!    ...
#!    ...      2  3  4
#!    ...      0  1  0)
#
#!    a←3 2 5⍴"joe  doe  bob  jonesbob  zwart"  ◇  a[⍋a;;]
#!    ... ⍝ returns 3 2 5 ⍴ 'bob  jonesbob  zwartjoe  doe  '
#
#     "ZYXWVUTSRQPONMLKJIHGFEDCBA"⍋"ZAMBIA"   ⍝ returns 0 2 4 3 1 5
#
#     ⎕A←"ABCDEFGHIJKLMNOPQRSTUVWXYZ" ◇ (⌽⎕A)⍋3 3⍴"BOBALFZAK"
#     ... ⍝ returns 2 0 1
#
#!    data←6 4⍴"ABLEaBLEACREABELaBELACES"
#!    ... coll←2 26⍴"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
#!    ... data[coll⍋data;]
#!    ...   ⍝ returns 6 4 ⍴ 'ABELaBELABLEaBLEACESACRE'
#
#!    data←6 4⍴"ABLEaBLEACREABELaBELACES"
#!    ... coll1←"AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz"
#!    ... data[coll1⍋data;]
#!    ...   ⍝ returns 6 4 ⍴ 'ABELABLEACESACREaBELaBLE'
@['⍋'] = (omega, alpha) -> grade omega, alpha, 1

# Grade down (`⍒`)
#
#     ⍒3 1 8   ⍝ returns 2 0 1
@['⍒'] = (omega, alpha) -> grade omega, alpha, -1

# Helper for `⍋` and `⍒`
#     'xyz' ⍋ 'bxl'
grade = (omega, alpha, direction) ->
  h = {} # maps a character to its index in the collation
  if alpha
    if not alpha.shape.length
      throw Error 'RANK ERROR'
    h = {}
    alpha.each (x, indices) ->
      if typeof x isnt 'string'
        throw Error 'DOMAIN ERROR'
      h[x] = indices[indices.length - 1]

  if not omega.shape.length
    throw Error 'RANK ERROR'

  new APLArray [0...omega.shape[0]]
    .sort (i, j) ->
      p = omega.offset
      indices = repeat [0], omega.shape.length
      loop
        x = omega.data[p + i * omega.stride[0]]
        y = omega.data[p + j * omega.stride[0]]
        tx = typeof x
        ty = typeof y
        if tx < ty then return -direction
        if tx > ty then return direction
        if h[x]? then x = h[x]
        if h[y]? then y = h[y]
        if x < y then return -direction
        if x > y then return direction
        a = indices.length - 1
        while a > 0 and indices[a] + 1 is omega.shape[a]
          p -= omega.stride[a] * indices[a]
          indices[a--] = 0
        if a <= 0 then break
        p += omega.stride[a]
        indices[a]++
      0
