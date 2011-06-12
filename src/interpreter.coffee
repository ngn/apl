{builtins} = require './builtins'
{inherit, trampoline} = require './helpers'
{parse} = require './parser'

exports.exec = (code, ctx, callback) ->
  if typeof ctx is 'function' and not callback? then callback = ctx; ctx = undefined
  ctx ?= inherit builtins
  callback ?= (err) -> if err then throw err
  ast = parse code

  try
    trampoline -> exec0 ast, ctx, callback
  catch err
    callback err

  return

exec0 = (ast, ctx, callback) ->
  # Evaluate a branch of the abstract syntax tree
  # `ctx' holds variable bindings
  switch ast[0]

    when 'body'
      i = 1
      r = 0
      F = ->
        if i >= ast.length
          -> callback null, r
        else
          -> exec0 ast[i], ctx, (err, r0) ->
            if err then return -> callback err
            r = r0; i++; F

    when 'num'
      -> callback null, parseFloat ast[1].replace /¯/, '-'

    when 'str'
      -> callback null, eval(ast[1]).split ''

    when 'index'
      exec0 ast[1], ctx, (err, indexable) ->
        if err then return -> callback err
        i = 2
        indices = []
        F = ->
          if i < ast.length
            -> exec0 ast[i], ctx, (err, index) ->
              if err then return -> callback err
              indices.push index; i++; F
          else
            if typeof indexable is 'function'
              -> callback null, (a, b) -> indexable a, b, indices
            else
              -> callback null, ctx['⌷'](indices, indexable)

    when 'assign'
      name = ast[1]
      -> exec0 ast[2], ctx, (err, value) ->
        if err then return -> callback err
        if typeof ctx[name] is 'function' and ctx[name].isNiladic then ctx[name] value else ctx[name] = value
        -> callback null, value

    when 'sym'
      name = ast[1]; value = ctx[name]
      if not value? then return -> callback Error "Symbol #{name} is not defined."
      if typeof value is 'function' and value.isNiladic then value = value()
      -> callback null, value

    when 'lambda'
      -> callback Error 'Lambda form not supported.'
#      -> callback, null, (a, b) ->
#        ctx1 = inherit ctx
#        # Bind formal parameter names 'alpha' and 'omega' to the left and right argument
#        if b?  ctx1['⍺'] = a; ctx1['⍵'] = b
#        else   ctx1['⍺'] = 0; ctx1['⍵'] = a
#        exec0 ast[1], ctx1 # todo

    when 'seq'
      if ast.length is 1 then return -> callback null, 0
      a = []
      i = ast.length - 1
      F = ->
        if i >= 1
          -> exec0 ast[i], ctx, (err, result) ->
            if err then return -> callback err
            a.unshift result; i--; F
        else

          # Form vectors from sequences of data
          i = 0
          while i < a.length
            if typeof a[i] isnt 'function'
              j = i + 1
              while j < a.length and typeof a[j] isnt 'function' then j++
              if j - i > 1
                a[i...j] = [a[i...j]]
            i++

          # Apply infix operators
          i = 0
          while i < a.length - 2
            if typeof a[i] is 'function'
              if typeof a[i+1] is 'function' and a[i+1].isInfixOperator
                if typeof a[i+2] is 'function'
                  a[i..i+2] = a[i+1] a[i], a[i+2]
                  continue
            i++

          # Apply postfix operators
          i = 0
          while i < a.length - 1
            if typeof a[i] is 'function'
              if typeof a[i+1] is 'function' and a[i+1].isPostfixOperator
                a[i..i+1] = a[i+1] a[i]
                continue
            i++

          # Apply prefix operators
          i = a.length - 2
          while i >= 0
            if typeof a[i] is 'function' and a[i].isPrefixOperator
              if typeof a[i+1] is 'function'
                a[i..i+1] = a[i] a[i+1]
            i--

          # Apply functions
          while a.length > 1
            if typeof a[a.length - 1] is 'function' then throw Error 'Trailing function in expression'
            y = a.pop()
            f = a.pop()
            if a.length is 0 or typeof a[a.length - 1] is 'function'
              a.push f y # apply monadic function
            else
              x = a.pop(); a.push f x, y # apply dyadic function

          -> callback null, a[0]

    else
      -> callback Error 'Unrecognized AST node type: ' + ast[0]
