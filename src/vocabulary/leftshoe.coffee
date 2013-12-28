addVocabulary

  # ⍴⊂2 3⍴⍳6      <=> ⍬
  # ⍴⍴⊂2 3⍴⍳6     <=> ,0
  # ⊂[0]2 3⍴⍳6    <=> (0 3)(1 4)(2 5)
  # ⍴⊂[0]2 3⍴⍳6   <=> ,3
  # ⊂[1]2 3⍴⍳6    <=> (0 1 2)(3 4 5)
  # ⍴⊂[1]2 3⍴⍳6   <=> ,2
  # ⊃⊂[1 0]2 3⍴⍳6 <=> 3 2⍴0 3 1 4 2 5
  # ⍴⊂[1 0]2 3⍴⍳6 <=> ⍬
  # ⍴⊃⊂⊂1 2 3     <=> ⍬
  '⊂': (⍵, ⍺, axes) ->
    assert !⍺
    axes = if axes? then getAxisList axes, ⍴⍴ ⍵ else [0...⍴⍴ ⍵]
    if ⍵.isSimple() then return ⍵
    unitShape  = for i in axes then ⍴(⍵)[i]
    unitStride = for i in axes then ⍵.stride[i]
    resultAxes = for i in [0...⍴⍴ ⍵] when i !in axes then i
    shape      = for i in resultAxes then ⍴(⍵)[i]
    stride     = for i in resultAxes then ⍵.stride[i]
    data = []
    each new APLArray(⍵.data, shape, stride, ⍵.offset),
      (x, indices, p) ->
        data.push new APLArray ⍵.data, unitShape, unitStride, p
    new APLArray data, shape
