# each() is a hygienic macro that efficiently iterates the elements of an
# APL array in ravel order.  No function calls are made during iteration as
# those are relatively expensive in JavaScript.
macro each (a0, f) ->
  (macro.codeToNode ->
    a = a0
    if !a.empty()
      data = a.data
      shape = a.shape
      stride = a.stride
      lastAxis = shape.length - 1
      p = a.offset
      indices = []
      axis = shape.length
      while --axis >= 0 then indices.push 0
      loop
        x = data[p]
        body
        axis = lastAxis
        while axis >= 0 and indices[axis] + 1 is shape[axis]
          p -= indices[axis] * stride[axis]
          indices[axis--] = 0
        if axis < 0 then break
        indices[axis]++
        p += stride[axis]
  ).subst
    a0:       a0
    body:     f.body
    a:        macro.csToNode @tmp()
    axis:     macro.csToNode @tmp()
    data:     macro.csToNode @tmp()
    shape:    macro.csToNode @tmp()
    stride:   macro.csToNode @tmp()
    lastAxis: macro.csToNode @tmp()
    x:        macro.csToNode f.params[0].name.value
    indices:  macro.csToNode f.params[1]?.name?.value ? @tmp()
    p:        macro.csToNode f.params[2]?.name?.value ? @tmp()

# each2() is like each() but it iterates over two APL array in parallel
macro each2 (a0, b0, f) ->
  (macro.codeToNode ->
    a = a0; data  = a.data; shape  = a.shape; stride  = a.stride
    b = b0; data1 = b.data; shape1 = b.shape; stride1 = b.stride
    if shape.length isnt shape1.length then rankError()
    axis = shape.length
    while --axis >= 0 when shape[axis] isnt shape1[axis] then lengthError()
    if !a.empty()
      lastAxis = shape.length - 1
      p = a.offset
      q = b.offset
      indices = Array (axis = shape.length)
      while --axis >= 0 then indices[axis] = 0
      loop
        x = data[p]
        y = data1[q]
        body
        axis = lastAxis
        while axis >= 0 and indices[axis] + 1 is shape[axis]
          p -= indices[axis] * stride[axis]
          q -= indices[axis] * stride1[axis]
          indices[axis--] = 0
        if axis < 0 then break
        indices[axis]++
        p += stride[axis]
        q += stride1[axis]
  ).subst
    a0:       a0
    b0:       b0
    body:     f.body
    a:        macro.csToNode @tmp()
    b:        macro.csToNode @tmp()
    p:        macro.csToNode @tmp()
    q:        macro.csToNode @tmp()
    axis:     macro.csToNode @tmp()
    data:     macro.csToNode @tmp()
    data1:    macro.csToNode @tmp()
    shape:    macro.csToNode @tmp()
    shape1:   macro.csToNode @tmp()
    stride:   macro.csToNode @tmp()
    stride1:  macro.csToNode @tmp()
    lastAxis: macro.csToNode @tmp()
    x:        macro.csToNode f.params[0].name.value
    y:        macro.csToNode f.params[1].name.value
    indices:  macro.csToNode f.params[2]?.name?.value ? @tmp()


class A # an APL array

  constructor: (@data, @shape, @stride, @offset = 0) ->
    @shape ?= [@data.length]
    @stride ?= strideForShape @shape
    assert @data.length?
    assert @shape.length?
    assert @stride.length?
    assert @data.length is 0 or isInt @offset, 0, @data.length
    assert @stride.length is @shape.length
    for x in @shape then assert isInt x, 0
    if @data.length
      for x, i in @stride then assert isInt x, -@data.length, @data.length + 1

  empty: ->
    for d in @shape when !d then return true
    false

  map: (f) ->
    assert typeof f is 'function'
    data = []
    each @, (x, indices) -> data.push f x, indices
    new A data, @shape

  map2: (a, f) ->
    assert a instanceof A
    assert typeof f is 'function'
    data = []
    each2 @, a, (x, y, indices) -> data.push f x, y, indices
    new A data, @shape

  toArray: ->
    r = []
    each @, (x) -> r.push x
    r

  toInt: (start = -Infinity, end = Infinity) ->
    r = @unwrap()
    if typeof r isnt 'number' or r isnt ~~r or !(start <= r < end) then domainError() else r

  toBool: -> @toInt 0, 2

  toSimpleString: ->
    if @shape.length > 1 then rankError()
    if typeof @data is 'string'
      if !@shape.length then return @data[@offset]
      if @shape[0] is 0 then return ''
      if @stride[0] is 1 then return @data[@offset ... @offset + @shape[0]]
      @toArray().join ''
    else
      a = @toArray()
      for x in a when typeof x isnt 'string' then domainError()
      a.join ''

  isSingleton: ->
    for n in @shape when n isnt 1 then return false
    true

  isSimple: -> @shape.length is 0 and @data[@offset] !instanceof A
  unwrap: -> if prod(@shape) is 1 then @data[@offset] else lengthError()
  getPrototype: -> if @empty() or typeof @data[@offset] isnt 'string' then 0 else ' ' # todo
  toString: -> format(@).join '\n'
  repr: -> "new A(#{repr @data},#{repr @shape},#{repr @stride},#{repr @offset})"

strideForShape = (shape) ->
  assert shape.length?
  if shape.length is 0 then return []
  r = Array shape.length
  r[r.length - 1] = 1
  for i in [r.length - 2 .. 0] by -1
    assert isInt shape[i], 0
    r[i] = r[i + 1] * shape[i + 1]
  r

A.zero   = new A [0], []
A.one    = new A [1], []
A.zilde  = new A [], [0]
A.scalar = (x) -> new A [x], []
A.bool   = [A.zero, A.one]
