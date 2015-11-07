addVocabulary
  '⍴': (om, al) ->
    if al
      # ⍴1 2 3⍴0  ←→ 1 2 3
      # ⍴⍴1 2 3⍴0 ←→ ,3
      # 3 3⍴⍳4    ←→ 3 3⍴0 1 2 3 0 1 2 3 0
      # ⍴3 3⍴⍳4   ←→ 3 3
      # ⍬⍴123     ←→ 123
      # ⍬⍴⍬       ←→ 0
      # 2 3⍴⍬     ←→ 2 3⍴0
      # 2 3⍴⍳7    ←→ 2 3⍴0 1 2 3 4 5
      # ⍴1e9⍴0    ←→ ,1e9
      if al.shape.length > 1 then rankError()
      a = al.toArray()
      for x in a when !isInt x, 0 then domainError()
      n = prod a
      if !n
        new A [], a
      else if (a.length >= om.shape.length) and arrayEquals om.shape, a[a.length - om.shape.length...]
        # If ⍺ is only prepending axes to ⍴⍵, we can reuse the .data array
        new A om.data, a, repeat([0], a.length - om.shape.length).concat(om.stride), om.offset
      else
        data = []
        try
          each om, (x) ->
            if data.length >= n then throw 'break'
            data.push x
        catch e
          if e isnt 'break' then throw e
        if data.length
          while 2 * data.length < n then data = data.concat data
          if data.length isnt n then data = data.concat data[... n - data.length]
        else
          data = repeat [om.getPrototype()], n
        new A data, a
    else
      # ⍴0       ←→ 0⍴0
      # ⍴0 0     ←→ 1⍴2
      # ⍴⍴0      ←→ 1⍴0
      # ⍴⍴⍴0     ←→ 1⍴1
      # ⍴⍴⍴0 0   ←→ 1⍴1
      # ⍴'a'     ←→ 0⍴0
      # ⍴'ab'    ←→ 1⍴2
      # ⍴2 3 4⍴0 ←→ 2 3 4
      new A om.shape
