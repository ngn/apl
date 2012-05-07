{builtins} = require './builtins'
{inherit, trampoline, cps, cpsify, withPrototype} = require './helpers'
{parse} = require './parser'
{Complex} = require './complex'



# `exec()` parses and executes an APL program.  It is a CPS function---the
# result of the last statement's evaluation is passed to the callback.
#
# The second parameter, `ctx`, is optional and may contain initial variable
# bindings.
@exec = (code, ctx, callback) ->
  if typeof ctx is 'function' and not callback? then callback = ctx; ctx = undefined
  ctx ?= inherit builtins
  callback ?= (err) -> if err then throw err

  try
    trampoline -> exec0 parse(code), ctx, callback
  catch err
    callback err

  return



# Evaluate a branch of the abstract syntax tree.
exec0 = (ast, ctx, callback) ->
  switch ast[0]

    # # Body
    # Evaluate subnodes in sequence and return the result from the last node's
    # evaluation.
    #
    # If a _guard_ node `A:B` is met on the way, evaluate its condition `A` and:
    #
    # * if the result is 0, continue to the next node without evaluating `B`
    # * otherwise, terminate _body_'s evaluation and return the result from evaluating `B`
    when 'body'
      i = 1
      r = []
      F = ->
        if i < ast.length
          if ast[i][0] is 'guard'
            -> exec0 ast[i][1], ctx, (err, rCondition) ->
              if err then return -> callback err
              if rCondition is 0 then i++; return F
              return -> exec0 ast[i][2], ctx, (err, rConsequence) ->
                if err then return -> callback err
                r = rConsequence
                -> callback null, rConsequence
          else
            -> exec0 ast[i], ctx, (err, r0) ->
              if err then return -> callback err
              r = r0; i++; F
        else
          -> callback null, r

    # # Numeric literal
    # Parse like in JavaScript, except that negatives use a _high minus_ instead of _hyphen_.
    when 'num'
      s = ast[1].replace /¯/g, '-'
      a = for x in s.split /j/i
            if x.match /^-?0x/i then parseInt x, 16 else parseFloat x
      value = if a.length is 1 then a[0] else new Complex a...
      -> callback null, value

    # # String literal
    # APL has a tradition of using a pair of quotes to mean a single escaped
    # quote inside a quote-delimited string:
    #
    #     'Let''s parse it!'   ⍝ equivalent to 'Let\'s parse it!'
    #     "0x22's the code for ""."   ⍝ equivalent to "0x22's the code for \"."
    #
    # Other than that, we'll parse like in JavaScript.  The result is split
    # into individual characters to form an APL vector.
    when 'str'
      s = ast[1]
      d = s[0] # the delimiter: '"' or "'"
      s = d + s[1...-1].replace(///#{d + d}///g, '\\' + d) + d
      value = eval(s).split ''
      -> callback null, withPrototype ' ', value

    # # Indexing
    # `A[B0;B1;...]`
    #
    # Evaluate `A`, then the `B`-s in order, form a vector of
    # the `B`-s and call the _index_ function `B⌷A`, which will do the
    # rest of the work.
    when 'index'
      -> exec0 ast[1], ctx, (err, indexable) ->
        if err then return -> callback err
        i = 2
        indices = []
        F = ->
          if i < ast.length
            if ast[i]?
              -> exec0 ast[i], ctx, (err, index) ->
                if err then return -> callback err
                indices.push index; i++; F
            else
              indices.push []; i++; F
          else
            if typeof indexable is 'function'
              -> callback null, cps (a, b, _, callback1) ->
                -> cpsify(indexable) a, b, indices, callback1
            else
              -> cpsify(ctx['⌷']) indices, indexable, null, callback

    # # Assignment
    # `A←B`
    #
    # Evaluate `B` and
    #
    # * if `set_A` exists in the context, call it
    # * otherwise, create an entry for `A` in the context
    #
    # Return `B` as a result.
    # (We don't support compound assignments yet.)
    when 'assign'
      name = ast[1]
      -> exec0 ast[2], ctx, (err, value) ->
        if err then return -> callback err
        setter = ctx['set_' + name]
        if typeof setter is 'function'
          -> cpsify(setter) value, null, null, (err) ->
            if err then return -> callback err
            -> callback null, value
        else
          ctx[name] = value
          -> callback null, value

    # # Symbol
    # * If an entry for it exists in the context, return it.
    # * If `get_#{symbol}` exists in the context, call it.
    # * Otherwise report an error.
    when 'sym'
      name = ast[1]; value = ctx[name]
      if value? then return -> callback null, value
      getter = ctx['get_' + name]
      if typeof getter is 'function' then return -> cpsify(getter) null, null, null, callback
      -> callback Error "Symbol #{name} is not defined."

    # # Embedded JavaScript
    # Put a safety wrapper around, and do `eval()`.
    when 'embedded'
      try
        code = ast[1].replace /(^«|»$)/g, ''
        code = "(function(){return (#{code});})()"
        r = eval code
        if not r? then r = 0
        if typeof r is 'string' then r = r.split ''
        -> callback null, r
      catch err
        -> callback err

    # # Lambda
    # `{A}`
    #
    # Return a function which binds formal parameter names _alpha_ and _omega_
    # to the left and right argument and evaluates the body.
    when 'lambda'
      -> callback null, cps (a, b, _, callback1) ->
        ctx1 = inherit ctx
        ctx1['∇'] = arguments.callee
        if b?
          ctx1['⍺'] = a
          ctx1['⍵'] = b
        else
          ctx1['⍺'] = 0
          ctx1['⍵'] = a
        -> exec0 ast[1], ctx1, (err, res) ->
          -> callback1 err, res

    # # Sequence
    # This is the trickiest node type, because it is impossible to predict at
    # parsing time how evaluation should proceed.  For instance `1 2 3` should
    # form a vector because it consists entirely of data, `1 + 2` should apply
    # `+` to `1` and `2` because we know `+` is a function, but we don't know
    # how to evaluate `a b c` because we don't know whether the items are
    # functions or data.  The presence of operators complicates things even
    # more.
    #
    # The solution used here is to make decisions at runtime (now) according
    # to the following algorithm:
    when 'seq'

      # * Decide whether each item in the sequence is a datum (denoted `x`)
      # or a function (denoted `f`).  Treat operators as functions---being an
      # operator is a property of a function.  A function can have
      # `isPrefixOperator=true`, `isInfixOperator=true`,
      # `isPostfixOperator=true`, or any combination of those.
      if ast.length is 1 then return -> callback null, 0
      a = []
      i = ast.length - 1
      F = ->
        if i >= 1
          -> exec0 ast[i], ctx, (err, result) ->
            if err then return -> callback err
            a.unshift result; i--; F
        else

          # * Form vectors from sequences of data (`xx...`).
          i = 0
          while i < a.length
            if typeof a[i] isnt 'function'
              j = i + 1
              while j < a.length and typeof a[j] isnt 'function' then j++
              if j - i > 1
                a[i...j] = [a[i...j]]
            i++

          # * For any sequence of three functions (`fff`) where the middle one
          # can be an infix operator, apply the operator on its neighbours.
          # Replace the triplet by a single `f`.
          i = 0
          F = ->
            if i < a.length - 2
              if (typeof a[i] is 'function') and (typeof a[i+1] is 'function') and (a[i+1].isInfixOperator) and (typeof a[i+2] is 'function')
                -> cpsify(a[i+1]) a[i], a[i+2], null, (err, result) ->
                  if err then return -> callback err
                  a[i..i+2] = [result]
                  F
              else
                i++; F
            else

              # * For any sequence of two functions (`ff`) where the second one
              # can be a postfix operator, apply the operator on its neighbour.
              # Replace the pair by a single `f`.
              i = 0
              F = ->
                if i < a.length - 1
                  if (typeof a[i] is 'function') and (typeof a[i+1] is 'function') and a[i+1].isPostfixOperator
                    -> cpsify(a[i+1]) a[i], null, null, (err, result) ->
                      if err then return -> callback err
                      a[i..i+1] = [result]
                      F
                  else
                    i++; F
                else

                  # * For any sequence of two functions (`ff`) where the first one
                  # can be a prefix operator, apply the operator on its neighbour.
                  # Do the scanning backwards.
                  # Replace the pair by a single `f`.
                  i = a.length - 2
                  F = ->
                    if i >= 0
                      if (typeof a[i] is 'function') and a[i].isPrefixOperator and (typeof a[i+1] is 'function')
                        -> cpsify(a[i]) a[i+1], null, null, (err, result) ->
                          if err then return -> callback err
                          a[i..i+1] = [result]
                          F
                      else
                        i--; F
                    else

                      # * Sequences of datum-function-anything (`xfA`) are dyadic function
                      # applications and any remaining sequences of function-datum (`fx`) are
                      # monadic function applications.  Replace a function application with
                      # the type of its result.
                      F = ->
                        if a.length > 1
                          if typeof a[a.length - 1] is 'function'
                            -> callback Error 'Trailing function in expression'
                          else
                            y = a.pop(); f = a.pop()
                            if a.length is 0 or typeof a[a.length - 1] is 'function'
                              -> cpsify(f) y, null, null, (err, result) -> # apply monadic function
                                if err then return -> callback err
                                a.push result
                                F
                            else
                              x = a.pop()
                              -> cpsify(f) x, y, null, (err, result) -> # apply dyadic function
                                if err then return -> callback err
                                a.push result
                                F
                        else
                          -> callback null, a[0]

    else
      -> callback Error 'Unrecognized AST node type: ' + ast[0]
