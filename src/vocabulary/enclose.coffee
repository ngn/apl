{APLArray} = require '../array'
{repeat} = require '../helpers'
{getAxisList} = require './vhelpers'

@vocabulary =

  '⊂': (omega, alpha, axes) ->
    if alpha
      throw Error 'Not implemented'
    else

      # Enclose (`⊂`)
      #
      # ⍴ ⊂ 2 3⍴⍳6    <=> ⍬
      # ⍴⍴ ⊂ 2 3⍴⍳6   <=> ,0
      # ⊂[0]2 3⍴⍳6    <=> (0 3)(1 4)(2 5)
      # ⍴⊂[0]2 3⍴⍳6   <=> ,3
      # ⊂[1]2 3⍴⍳6    <=> (0 1 2)(3 4 5)
      # ⍴⊂[1]2 3⍴⍳6   <=> ,2
      # ⊃⊂[1 0]2 3⍴⍳6 <=> 3 2⍴0 3 1 4 2 5
      # ⍴⊂[1 0]2 3⍴⍳6 <=> ⍬
      # ⍴⊃⊂⊂1 2 3     <=> ⍬
      axes = if axes? then getAxisList axes, omega.shape.length else [0...omega.shape.length]
      if omega.isSimple() then return omega
      unitShape = for axis in axes then omega.shape[axis]
      unitStride = for axis in axes then omega.stride[axis]
      resultAxes = for axis in [0...omega.shape.length] when axis not in axes then axis
      shape = for axis in resultAxes then omega.shape[axis]
      stride = for axis in resultAxes then omega.stride[axis]
      data = []
      p = omega.offset
      indices = repeat [0], shape.length
      loop
        data.push new APLArray omega.data, unitShape, unitStride, p
        a = indices.length - 1
        while a >= 0 and indices[a] + 1 is shape[a]
          p -= indices[a] * stride[a]
          indices[a--] = 0
        if a < 0 then break
        p += stride[a]
        indices[a]++
      new APLArray data, shape
