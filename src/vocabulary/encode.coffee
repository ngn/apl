{APLArray} = require '../array'
{prod, assert} = require '../helpers'

# Encode (`⊤`)
#
#     1760 3 12⊤75          ⍝ returns 2 0 3
#     3 12⊤75               ⍝ returns 0 3
#     100000 12⊤75          ⍝ returns 6 3
#     16 16 16 16⊤100       ⍝ returns 0 0 6 4
#     1760 3 12⊤75.3        ⍝ returns 2 0 (75.3-72)
#     0 1⊤75.3              ⍝ returns 75 (75.3-75)
#
#     2 2 2 2 2⊤1 2 3 4 5   ⍝ returns (5 5 ⍴
#     ...                         0 0 0 0 0
#     ...                         0 0 0 0 0
#     ...                         0 0 0 1 1
#     ...                         0 1 1 0 0
#     ...                         1 0 1 0 1)
#
#     10⊤5 15 125 ⍝ returns 5 5 5
#     0 10⊤5 15 125 ⍝ returns 2 3⍴ 0 1 12 5 5 5
#
#     (8 3⍴ 2 0 0
#     ...   2 0 0
#     ...   2 0 0
#     ...   2 0 0
#     ...   2 8 0
#     ...   2 8 0
#     ...   2 8 16
#     ...   2 8 16) ⊤ 75
#     ...       ⍝ returns (8 3⍴
#     ...             0 0 0
#     ...             1 0 0
#     ...             0 0 0
#     ...             0 0 0
#     ...             1 0 0
#     ...             0 1 0
#     ...             1 1 4
#     ...             1 3 11)
@['⊤'] = (omega, alpha) ->
  assert alpha
  a = alpha.toArray()
  b = omega.toArray()
  shape = alpha.shape.concat omega.shape
  data = Array prod shape
  n = if alpha.shape.length then alpha.shape[0] else 1
  m = a.length / n
  for i in [0...m]
    for y, j in b
      if isNeg = (y < 0) then y = -y
      for k in [n - 1 .. 0] by -1
        x = a[k * m + i]
        if x is 0
          data[(k * m + i) * b.length + j] = y
          y = 0
        else
          data[(k * m + i) * b.length + j] = y % x
          y = Math.round((y - (y % x)) / x)
  new APLArray data, shape
