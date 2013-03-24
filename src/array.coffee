# This is an experimental data structure intended to replace the current
# representation of APL arrays.
# Inspired by [ndarray](https://github.com/mikolalysenko/ndarray#readme)

class @APLArray

  constructor: (@data, @shape, @stride, @offset = 0) ->
    @shape ?= [@data.length]
    if not @stride
      @stride = Array @shape.length
      if @shape.length
        @stride[@shape.length - 1] = 1
        for axis in [@shape.length - 2 .. 0] by -1
          @stride[axis] = @stride[axis + 1] * @shape[axis + 1]

  get: (indices) ->
    p = @offset
    for index, axis in indices
      p += index * @stride[axis]
    @data[p]

  each: (f) ->
    p = @offset
    indices = for axis in @shape then 0
    loop
      f @data[p]
      axis = @shape - 1
      while axis >= 0 and indices[axis] + 1 is @shape[axis]
        p -= indices[axis] * @stride[axis]
        indices[axis] = 0
      if axis < 0 then break
      indices[axis]++
      p += @stride[axis]
    return

  map: (f) ->
    data = []
    @each (x) -> data.push x
    new APLArray data, @shape
