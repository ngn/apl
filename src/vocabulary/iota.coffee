addVocabulary

  '⍳': (⍵, ⍺) ->
    if ⍺
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
      if ⍴⍴(⍺) isnt 1 then rankError()
      ⍵.map (x) ->
        try
          rank = ⍴ ⍺
          each ⍺, (y, indices) ->
            if match x, y
              rank = indices
              throw 'break'
        catch e
          if e isnt 'break' then throw e
        if rank.length is 1 then rank[0] else new APLArray rank
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
      # ⍳¯1 !!! DOMAIN ERROR
      if ⍴⍴(⍵) > 1 then rankError()
      a = ⍵.toArray()
      for d in a when not isInt d, 0 then domainError()
      n = prod a
      if !n
        data = []
      else if a.length is 1
        data = if n <=       0x100 then new Uint8Array  n else
               if n <=     0x10000 then new Uint16Array n else
               if n <= 0x100000000 then new Uint32Array n else
                 domainError()
        for i in [0...n] by 1 then data[i] = i
      else
        m = Math.max a...
        A = if m <=       0x100 then Uint8Array  else
            if m <=     0x10000 then Uint16Array else
            if m <= 0x100000000 then Uint32Array else
              domainError()
        itemData = new A n * a.length
        u = n
        for i in [0...a.length] by 1
          u /= a[i]
          p = n * i
          for j in [0...a[i]] by 1
            itemData[p] = j
            spread itemData, p, 1, u
            p += u
          spread itemData, n * i, a[i] * u, n
        data = []
        itemShape = [a.length]
        itemStride = [n]
        for i in [0...n] by 1
          data.push new APLArray itemData, itemShape, itemStride, i
      new APLArray data, a
