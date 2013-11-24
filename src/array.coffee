macro ⍴ (a) -> macro.codeToNode(-> (a).shape).subst {a}
macro ⍴⍴ (a) -> macro.codeToNode(-> (a).shape.length).subst {a}

# each() is a hygienic macro that efficiently iterates the elements of an
# APLArray in ravel order.  No function calls are made during iteration as
# those are relatively expensive in JavaScript.
macro each (a0, f) ->
  macro.tmpCounter ?= 0
  (macro.codeToNode ->
    a = a0
    if not a.empty()
      data = a.data
      shape = ⍴ a
      stride = a.stride
      lastAxis = shape.length - 1
      p = a.offset
      indices = []
      for axis in [0...shape.length] by 1 then indices.push 0
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
    a:        macro.csToNode "t#{macro.tmpCounter++}"
    p:        macro.csToNode "t#{macro.tmpCounter++}"
    axis:     macro.csToNode "t#{macro.tmpCounter++}"
    data:     macro.csToNode "t#{macro.tmpCounter++}"
    shape:    macro.csToNode "t#{macro.tmpCounter++}"
    stride:   macro.csToNode "t#{macro.tmpCounter++}"
    lastAxis: macro.csToNode "t#{macro.tmpCounter++}"
    x:        macro.csToNode f.params[0].name.value
    indices:  macro.csToNode f.params[1]?.name?.value ? "t#{macro.tmpCounter++}"

# each2() is like each() but it iterates over two APLArray-s in parallel
macro each2 (a0, b0, f) ->
  macro.tmpCounter ?= 0
  (macro.codeToNode ->
    a = a0; data  = a.data; shape  = a.shape; stride  = a.stride
    b = b0; data1 = b.data; shape1 = b.shape; stride1 = b.stride
    assert shape.length is shape1.length
    for axis in [0...shape.length] then assert shape[axis] is shape1[axis]
    if not a.empty()
      lastAxis = shape.length - 1
      p = a.offset
      q = b.offset
      indices = []
      for axis in [0..lastAxis] by 1 then indices.push 0
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
    a:        macro.csToNode "t#{macro.tmpCounter++}"
    b:        macro.csToNode "t#{macro.tmpCounter++}"
    p:        macro.csToNode "t#{macro.tmpCounter++}"
    q:        macro.csToNode "t#{macro.tmpCounter++}"
    axis:     macro.csToNode "t#{macro.tmpCounter++}"
    data:     macro.csToNode "t#{macro.tmpCounter++}"
    data1:    macro.csToNode "t#{macro.tmpCounter++}"
    shape:    macro.csToNode "t#{macro.tmpCounter++}"
    shape1:   macro.csToNode "t#{macro.tmpCounter++}"
    stride:   macro.csToNode "t#{macro.tmpCounter++}"
    stride1:  macro.csToNode "t#{macro.tmpCounter++}"
    lastAxis: macro.csToNode "t#{macro.tmpCounter++}"
    x:        macro.csToNode f.params[0].name.value
    y:        macro.csToNode f.params[1].name.value
    indices:  macro.csToNode f.params[2]?.name?.value ? "t#{macro.tmpCounter++}"


class APLArray

  constructor: (@data, @shape, @stride, @offset = 0) ->
    @shape ?= [@data.length]
    @stride ?= strideForShape @shape
    assert @data instanceof Array or typeof @data is 'string'
    assert @shape instanceof Array
    assert @stride instanceof Array
    assert @data.length is 0 or isInt @offset, 0, @data.length
    assert @stride.length is ⍴⍴ @
    for x in @shape then assert isInt x, 0
    if @data.length
      for x, i in @stride then assert isInt x, -@data.length, @data.length + 1
    else
      assert prod(@shape) is 0

  empty: ->
    for d in @shape when not d then return true
    false

  map: (f) ->
    assert typeof f is 'function'
    data = []
    each @, (x, indices) -> data.push f x, indices
    new APLArray data, @shape

  map2: (a, f) ->
    assert a instanceof APLArray
    assert typeof f is 'function'
    data = []
    each2 @, a, (x, y, indices) -> data.push f x, y, indices
    new APLArray data, @shape

  toArray: ->
    r = []
    each @, (x) -> r.push x
    r

  toInt: (start = -Infinity, end = Infinity) ->
    r = @unwrap()
    if typeof r isnt 'number' or r isnt ~~r or not (start <= r < end) then domainError() else r

  toBool: -> @toInt 0, 2

  toSimpleString: ->
    if ⍴⍴(@) > 1 then rankError()
    if typeof @data is 'string'
      if !⍴⍴ @ then return @data[@offset]
      if ⍴(@)[0] is 0 then return ''
      if @stride[0] is 1 then return @data[@offset ... @offset + @shape[0]]
      @toArray.join ''
    else
      a = @toArray()
      for x in a when typeof x isnt 'string' then domainError()
      a.join ''

  isSingleton: ->
    for n in @shape when n isnt 1 then return false
    true

  isSimple: -> ⍴⍴(@) is 0 and @data[@offset] not instanceof APLArray
  unwrap: -> if prod(⍴ @) is 1 then @data[@offset] else lengthError()
  getPrototype: -> if @empty() or typeof @data[@offset] isnt 'string' then 0 else ' ' # todo
  toString: -> format(@).join '\n'

strideForShape = (shape) ->
  assert shape instanceof Array
  if shape.length is 0 then return []
  r = Array shape.length
  r[r.length - 1] = 1
  for i in [r.length - 2 .. 0] by -1
    assert isInt shape[i], 0
    r[i] = r[i + 1] * shape[i + 1]
  r

APLArray.zero   = new APLArray [0], []
APLArray.one    = new APLArray [1], []
APLArray.zilde  = new APLArray [], [0]
APLArray.scalar = (x) -> new APLArray [x], []
APLArray.bool   = [APLArray.zero, APLArray.one]
