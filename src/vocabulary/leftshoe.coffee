addVocabulary
  # ⍴⊂2 3⍴⍳6      ←→ ⍬
  # ⍴⍴⊂2 3⍴⍳6     ←→ ,0
  # ⊂[0]2 3⍴⍳6    ←→ (0 3)(1 4)(2 5)
  # ⍴⊂[0]2 3⍴⍳6   ←→ ,3
  # ⊂[1]2 3⍴⍳6    ←→ (0 1 2)(3 4 5)
  # ⍴⊂[1]2 3⍴⍳6   ←→ ,2
  # ⊃⊂[1 0]2 3⍴⍳6 ←→ 3 2⍴0 3 1 4 2 5
  # ⍴⊂[1 0]2 3⍴⍳6 ←→ ⍬
  # ⍴⊃⊂⊂1 2 3     ←→ ⍬
  '⊂': (om, al, axes) ->
    assert !al
    axes = if axes? then getAxisList axes, om.shape.length else [0...om.shape.length]
    if om.isSimple() then return om
    unitShape  = for i in axes then om.shape[i]
    unitStride = for i in axes then om.stride[i]
    resultAxes = for i in [0...om.shape.length] by 1 when i !in axes then i
    shape      = for i in resultAxes then om.shape[i]
    stride     = for i in resultAxes then om.stride[i]
    data = []
    each new A(om.data, shape, stride, om.offset),
      (x, indices, p) ->
        data.push new A om.data, unitShape, unitStride, p
    new A data, shape
