macro -> macro.fileToNode 'src/macros.coffee'
{APLArray} = require '../array'
{RankError, DomainError} = require '../errors'
{prod, isInt, repeat} = require '../helpers'

@vocabulary =

  '⍴': (omega, alpha) ->
    if alpha
      # Reshape (`⍴`)
      #
      # ⍴1 2 3⍴0  <=> 1 2 3
      # ⍴⍴1 2 3⍴0 <=> ,3
      # 3 3⍴⍳4    <=> 3 3⍴0 1 2 3 0 1 2 3 0
      # ⍴3 3⍴⍳4   <=> 3 3
      # ⍬⍴123     <=> 123
      # ⍬⍴⍬       <=> 0
      # 2 3⍴⍬     <=> 2 3⍴0
      # 2 3⍴⍳7    <=> 2 3⍴0 1 2 3 4 5
      if alpha.shape.length > 1 then throw RankError()
      shape = alpha.toArray()
      for d in shape when not isInt d, 0 then throw DomainError()
      n = prod shape
      a = omega.toArray n
      assert a.length <= n
      if a.length
        while 2 * a.length < n then a = a.concat a
        if a.length isnt n then a = a.concat a[... n - a.length]
      else
        a = repeat [omega.getPrototype()], n
      new APLArray a, shape
    else
      # Shape of (`⍴`)
      #
      # ⍴0       <=> 0⍴0
      # ⍴0 0     <=> 1⍴2
      # ⍴⍴0      <=> 1⍴0
      # ⍴⍴⍴0     <=> 1⍴1
      # ⍴⍴⍴0 0   <=> 1⍴1
      # ⍴'a'     <=> 0⍴0
      # ⍴'ab'    <=> 1⍴2
      # ⍴2 3 4⍴0 <=> 2 3 4
      new APLArray omega.shape
