{APLArray} = require '../array'
{assert, prod} = require '../helpers'

@['⍉'] = (omega, alpha) ->
  if alpha
    throw Error 'Not implemented'
  else
    # Transpose (`⍉`)
    #
    #     ⍉ 2 3 ⍴ 1 2 3 6 7 8     ⍝ returns 3 2 ⍴ 1 6 2 7 3 8
    #     ⍴ ⍉ 2 3 ⍴ 1 2 3 6 7 8   ⍝ returns 3 2
    #     ⍉ 1 2 3                 ⍝ returns 1 2 3
    #     ⍉ 2 3 4 ⍴ ⍳ 24          ⍝ returns (4 3 2 ⍴
    #     ...                          0 12   4 16    8 20
    #     ...                          1 13   5 17    9 21
    #     ...                          2 14   6 18   10 22
    #     ...                          3 15   7 19   11 23)
    new APLArray(
      omega.data
      omega.shape[...].reverse()
      omega.stride[...].reverse()
      omega.offset
    )
