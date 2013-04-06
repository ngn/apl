{APLArray} = require '../array'
{match} = require './vhelpers'

@['∩'] = (omega, alpha) ->
  if alpha

    # Intersection (`∩`)
    #
    #     'ABRA'∩'CAR'      ⍝ returns 'ARA'
    #     1 'PLUS' 2 ∩ ⍳5   ⍝ returns 1 2
    data = []
    a = alpha.toArray()
    b = omega.toArray()
    for x in a
      found = false
      for y in b when match x, y
        found = true
        break
      if found
        data.push x
    new APLArray data

  else
    throw Error 'Not implemented'
