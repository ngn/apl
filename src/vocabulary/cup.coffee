{APLArray} = require '../array'
{match} = require './vhelpers'

@['∪'] = (omega, alpha) ->
  if alpha

    # Union (`∪`)
    #
    #     1 2 ∪ 2 3   ⍝ returns 1 2 3
    #     'SHOCK' ∪ 'CHOCOLATE'   ⍝ returns 'SHOCKLATE'
    #
    #     'lentils' 'bulghur' (3 4 5) ∪ 'lentils' 'rice'
    #     ...     ⍝ returns 'lentils' 'bulghur' (3 4 5) 'rice'
    a = alpha.toArray()
    data = a[...]
    omega.each (x) ->
      for y in a when match x, y then return
      data.push x
    new APLArray data

  else

    # Unique (`∪`)
    #
    #     ∪ 3 17 17 17 ¯3 17 0   ⍝ returns 3 17 ¯3 0
    #     ∪ 3 17                 ⍝ returns 3 17
    #     ∪ 17                   ⍝ returns ,17
    #     ∪ ⍬                    ⍝ returns ⍬
    data = []
    omega.each (x) ->
      for y in data when match x, y then return
      data.push x
    new APLArray data
