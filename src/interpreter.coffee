{builtins} = require './builtins'
{inherit} = require './helpers'

exec = exports.exec = (ast, ctx) ->
  # Evaluate a branch of the abstract syntax tree
  # `ctx' holds variable bindings
  if not ctx?
    ctx = inherit builtins

  try
    switch ast[0]
      when 'body' then r = 0; (for x in ast[1...] then r = exec x, ctx); r
      when 'num' then parseFloat ast[1].replace(/¯/, '-')
      when 'str' then eval(ast[1]).split ''

      when 'index'
        x = exec ast[1], ctx
        y = for subscriptAST in ast[2...] then exec subscriptAST, ctx
        if typeof x is 'function'
          (a, b) -> x(a, b, y)
        else
          builtins['⌷'](y, x)

      when 'assign'
        name = ast[1]; value = exec ast[2], ctx
        if typeof ctx[name] is 'function' then ctx[name] value else ctx[name] = value
        ctx[name]

      when 'sym'
        name = ast[1]; value = ctx[name]
        if not value? then throw Error "Symbol #{name} is not defined."
        if typeof value is 'function' and value.isNiladic then value = value()
        value

      when 'lambda'
        (a, b) ->
          ctx1 = inherit ctx
          # Bind formal parameter names 'alpha' and 'omega' to the left and right argument
          if b?
            ctx1['⍺'] = a
            ctx1['⍵'] = b
          else
            ctx1['⍺'] = 0
            ctx1['⍵'] = a
          exec ast[1], ctx1

      when 'seq'
        if ast.length is 1 then return 0
        a = []
        for i in [ast.length - 1 .. 1] then a.unshift exec ast[i], ctx

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
        return a[0]

      else
        throw Error 'Unrecognized AST node type: ' + ast[0]

  catch e
    throw e
