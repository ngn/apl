macro -> macro.fileToNode 'src/macros.coffee'
{APLArray} = require '../array'
{DomainError, RankError} = require '../errors'
{repeat, prod} = require '../helpers'
{match} = require './vhelpers'

@vocabulary =

  '⍳': (omega, alpha) ->
    if alpha
      # Index of (`⍳`)
      #
      #     2 5 9 14 20 ⍳ 9                           <=> 2
      #     2 5 9 14 20 ⍳ 6                           <=> 5
      #     "GORSUCH" ⍳ "S"                           <=> 3
      #     "ABCDEFGHIJKLMNOPQRSTUVWXYZ" ⍳ "CARP"     <=> 2 0 17 15
      #     "ABCDEFGHIJKLMNOPQRSTUVWXYZ" ⍳ "PORK PIE"
      #     ... <=> 15 14 17 10 26 15 8 4
      #     "MON" "TUES" "WED" ⍳ "MON" "THURS"        <=> 0 3
      #     1 3 2 0 3 ⍳ ⍳ 5                           <=> 3 0 2 1 5
      #     "CAT" "DOG" "MOUSE" ⍳ "DOG" "BIRD"        <=> 1 3
      #     123 ⍳ 123                                 !!! RANK ERROR
      #     (2 2⍴123) ⍳ 123                           !!! RANK ERROR
      #     123 123 ⍳ 123                             <=> 0
      #     ⍬ ⍳ 123 234                               <=> 0 0
      #     123 234 ⍳ ⍬                               <=> ⍬
      if alpha.shape.length isnt 1
        throw RankError()
      omega.map (x) ->
        try
          r = alpha.shape
          alpha.each (y, indices) ->
            if match x, y
              r = indices
              throw 'break'
        catch e
          if e isnt 'break' then throw e
        if r.length is 1 then r[0] else new APLArray r
    else
      # Index generate (`⍳`)
      #
      # ⍳5     <=> 0 1 2 3 4
      # ⍴⍳5    <=> 1 ⍴ 5
      # ⍳0     <=> ⍬
      # ⍴⍳0    <=> ,0
      # ⍳2 3 4 <=> (2 3 4 ⍴
      # ...         (0 0 0)(0 0 1)(0 0 2)(0 0 3)
      # ...         (0 1 0)(0 1 1)(0 1 2)(0 1 3)
      # ...         (0 2 0)(0 2 1)(0 2 2)(0 2 3)
      # ...         (1 0 0)(1 0 1)(1 0 2)(1 0 3)
      # ...         (1 1 0)(1 1 1)(1 1 2)(1 1 3)
      # ...         (1 2 0)(1 2 1)(1 2 2)(1 2 3))
      # ⍴⍳2 3 4 <=> 2 3 4
      if omega.shape.length > 1 then throw RankError()
      a = omega.toArray()
      for d in a when not isInt d, 0 then throw DomainError()
      data = []
      if prod a
        if a.length is 1
          data = [0...a[0]]
        else
          indices = repeat [0], a.length
          loop
            data.push new APLArray indices[...]
            axis = a.length - 1
            while axis >= 0 and indices[axis] + 1 is a[axis]
              indices[axis--] = 0
            if axis < 0 then break
            indices[axis]++
      new APLArray data, a
