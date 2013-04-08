# Execute (`⍎`)
#
#!    ⍎ '+/ 2 2 ⍴ 1 2 3 4'  ⍝ returns 3 7
#     ⍴ ⍎ '123 456'         ⍝ returns ,2
#     ⍎ '{⍵⋆2} ⍳5'          ⍝ returns 0 1 4 9 16
#     ⍎ 'undefinedVariable' ⍝ throws
#     ⍎ '1 2 (3'            ⍝ throws
#     ⍎ 123                 ⍝ throws
@['⍎'] = (omega, alpha) ->
  if alpha
    throw Error 'Not implemented'
  else
    s = ''
    omega.each (c) ->
      if typeof c isnt 'string'
        throw Error 'DOMAIN ERROR'
      s += c
    require('../compiler').exec s
