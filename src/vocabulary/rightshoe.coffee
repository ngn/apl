addVocabulary

  # Mix (`⊃`)
  #
  # ⊃3            <=> 3
  # ⊃(1 2)(3 4)   <=> 2 2⍴1 2 3 4
  # ⊃(1 2)(3 4 5) <=> 2 3⍴1 2 0 3 4 5
  # ⊃1 2          <=> 1 2
  # ⊃(1 2)3       <=> 2 2⍴1 2 3 0
  # ⊃1(2 3)       <=> 2 2⍴1 0 2 3
  # ⊃⍬            <=> ⍬
  '⊃': (omega) ->
    if omega.shape.length is 0
      x = omega.data[omega.offset]
      if x instanceof APLArray then x else APLArray.scalar x
    else
      shapes = []
      omega.each (x) -> shapes.push(if x instanceof APLArray then x.shape else [])
      if shapes.length is 0 then return APLArray.zilde
      shape = shapes.reduce (a, b) ->
        if a.length is 0 then b
        else if b.length is 0 then a
        else if a.length isnt b.length then nonceError 'Mix of different ranks not implemented'
        else for i in [0...a.length] by 1 then Math.max a[i], b[i]
      s = new APLArray shape
      data = []
      omega.each (x) ->
        x = if x instanceof APLArray then x else APLArray.scalar x
        data.push (take x, s).toArray()...
      new APLArray data, omega.shape.concat shape
