{assert, extend, prod} = require './helpers'

# This is an experimental data structure intended to replace the current
# representation of APL arrays.
# Inspired by [ndarray](https://github.com/mikolalysenko/ndarray#readme)

@APLArray = class APLArray

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

  empty: ->
    for d in @shape when not d then return true
    false

  each: (f) ->
    assert typeof f is 'function'
    if @empty() then return
    p = @offset
    indices = for axis in @shape then 0
    loop
      f @data[p], indices
      axis = @shape.length - 1
      while axis >= 0 and indices[axis] + 1 is @shape[axis]
        p -= indices[axis] * @stride[axis]
        indices[axis--] = 0
      if axis < 0 then break
      indices[axis]++
      p += @stride[axis]
    return

  each2: (a, f) ->
    assert a instanceof APLArray
    assert typeof f is 'function'
    assert @shape.length is a.shape.length
    for axis in [0...@shape.length]
      assert @shape[axis] is a.shape[axis]
    if @empty() then return
    p = @offset
    q = a.offset
    indices = for axis in @shape then 0
    loop
      f @data[p], a.data[q], indices
      axis = @shape.length - 1
      while axis >= 0 and indices[axis] + 1 is @shape[axis]
        p -= indices[axis] * @stride[axis]
        q -= indices[axis] * a.stride[axis]
        indices[axis--] = 0
      if axis < 0 then break
      indices[axis]++
      p += @stride[axis]
      q += a.stride[axis]
    return

  map: (f) ->
    assert typeof f is 'function'
    data = []
    @each (x, indices) -> data.push f x, indices
    new APLArray data, @shape

  map2: (a, f) ->
    assert a instanceof APLArray
    assert typeof f is 'function'
    data = []
    @each2 a, (x, y, indices) -> data.push f x, y, indices
    new APLArray data, @shape

  toArray: (limit = Infinity) ->
    r = []
    try
      @each (x) ->
        if r.length >= limit then throw 'break'
        r.push x
        return
    catch e
      if e isnt 'break' then throw e
    r

  isSingleton: ->
    for n in @shape when n isnt 1 then return false
    true

  unbox: ->
    assert prod(@shape) is 1
    @data[@offset]


extend APLArray,
  zero:   new APLArray [0], []
  one:    new APLArray [1], []
  zilde:  new APLArray [], [0]
  scalar: (x) -> new APLArray [x], []

APLArray.bool = [APLArray.zero, APLArray.one]
