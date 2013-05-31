{DomainError} = require '../errors'

# Execute (`⍎`)
#
# ⍎'+/ 2 2 ⍴ 1 2 3 4'  <=> 3 7
# ⍴⍎'123 456'          <=> ,2
# ⍎'{⍵*2} ⍳5'          <=> 0 1 4 9 16
# ⍎'undefinedVariable' !!!
# ⍎'1 2 (3'            !!!
# ⍎123                 !!!
@['⍎'] = (omega, alpha) ->
  if alpha
    throw Error 'Not implemented'
  else
    s = ''
    omega.each (c) ->
      if typeof c isnt 'string'
        throw DomainError()
      s += c
    require('../compiler').exec s
