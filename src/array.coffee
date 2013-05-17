{assert, extend, prod, isInt} = require './helpers'
{LengthError, DomainError} = require './errors'

# This is an experimental data structure intended to replace the current
# representation of APL arrays.
# Inspired by [ndarray](https://github.com/mikolalysenko/ndarray#readme)

@APLArray = class APLArray

  constructor: (@data, @shape, @stride, @offset = 0) ->
    @shape ?= [@data.length]
    @stride ?= strideForShape @shape
    assert @data instanceof Array or typeof @data is 'string'
    assert @shape instanceof Array
    assert @stride instanceof Array
    assert @data.length is 0 or isInt @offset, 0, @data.length
    assert @shape.length is @stride.length
    for x in @shape then assert isInt x, 0
    if @data.length
      for x, i in @stride then assert isInt x, -@data.length, @data.length + 1
    else
      assert prod(@shape) is 0

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

  toInt: (start = -Infinity, end = Infinity) ->
    r = @unwrap()
    if typeof r isnt 'number' or r isnt ~~r or not (start <= r < end)
      throw DomainError()
    r

  toBool: ->
    @toInt 0, 2

  isSingleton: ->
    for n in @shape when n isnt 1 then return false
    true

  unwrap: ->
    if prod(@shape) isnt 1
      throw LengthError()
    @data[@offset]

  getPrototype: -> # todo
    if @empty() or typeof @data[@offset] isnt 'string' then 0 else ' '


@strideForShape = strideForShape = (shape) ->
  assert shape instanceof Array
  if shape.length is 0 then return []
  r = Array shape.length
  r[r.length - 1] = 1
  for i in [r.length - 2 .. 0] by -1
    assert isInt shape[i], 0
    r[i] = r[i + 1] * shape[i + 1]
  r


extend APLArray,
  zero:   new APLArray [0], []
  one:    new APLArray [1], []
  zilde:  new APLArray [], [0]
  scalar: (x) -> new APLArray [x], []

APLArray.bool = [APLArray.zero, APLArray.one]
