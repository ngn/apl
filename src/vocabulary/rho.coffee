addVocabulary

  '⍴': (⍵, ⍺) ->
    if ⍺
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
      if ⍺.shape.length > 1 then rankError()
      shape = ⍺.toArray()
      for d in shape when not isInt d, 0 then domainError()
      n = prod shape
      a = []
      try
        each ⍵, (x) ->
          if a.length >= n then throw 'break'
          a.push x
      catch e
        if e isnt 'break' then throw e
      if a.length
        while 2 * a.length < n then a = a.concat a
        if a.length isnt n then a = a.concat a[... n - a.length]
      else
        a = repeat [⍵.getPrototype()], n
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
      new APLArray ⍵.shape
