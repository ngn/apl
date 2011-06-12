exports.inherit = (x) ->
  # JavaScript's prototypical inheritance of objects
  # (See http://javascript.crockford.com/prototypal.html
  # for an explanation.)
  f = (->); f.prototype = x; new f



exports.trampoline = (x) ->
  # A continuation-passing style helper
  # Works around the lack of tail-call optimisation.
  # (See https://secure.wikimedia.org/wikipedia/en/wiki/Continuation-passing_style#Use_and_implementation )
  while typeof x is 'function' then x = x()
  x



exports.cps = cps = (f) ->
  # Marks a function `f' as following the CPS calling convention
  #
  # This means that `f' accepts a callback as its fourth argument (the first
  # three being allotted for APL left argument, right argument, and axis
  # specification).  The callback should be invoked later either with its first
  # argument set to an Error object, or with its second argument set to the
  # result.
  #
  # The CPS function may (directly) return either undefined, or another
  # function which should be executed immediately after it.  (This process will
  # be controlled by a trampoline() at a higher level in the code.)
  #
  # An example of a traditional function
  #          (a, b, c) -> a * b + c
  # turned into CPS (and marked as CPS) is:
  #          cps (a, b, c, callback) -> -> callback null, a * b + c
  #
  # A function is marked as CPS by setting its ".cps" property to true.
  # That informs callers that they should follow the CPS convention, too.
  f.cps = true; f



exports.cpsify = (f) ->
  # Takes a traditional function `f' and decorates it to follow the CPS calling
  # convention
  if f.cps then return f
  cps (a, b, c, callback) ->
    try
      result = f a, b, c
      -> callback null, result
    catch err
      -> callback err
