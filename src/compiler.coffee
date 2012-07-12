#!/usr/bin/env coffee

{parse} = require '../lib/parser'
{inherit} = require './helpers'
repr = JSON.stringify

globalVarInfo =
  '+': {type: 'F'}
  '×': {type: 'F'}
  '/': {type: 'F', isPostfixOperator: true}
  '⍣': {type: 'F', isInfixOperator: true}
  '⍺': {type: 'X'}
  '⍵': {type: 'X'}
  '⍬': {type: 'X', isNiladicFunction: true}
  '⎕': {type: 'X', isNiladicFunction: true}
  '⎕sleep': {type: 'F', isCPS: true}

compile = (source) ->
  ast = parse source
  firstPass ast
  printAST ast
  secondPass ast


# # First pass
# For each scope, determine the type of each symbol.
# A symbol can be either of two types:
#
#   * Type X: data or a niladic function
#
#   * Type F: a monadic function, a dyadic function, or an operator
firstPass = (ast) ->
  ast.vars = inherit globalVarInfo
  queue = [ast]
  while queue.length
    {vars} = scopeNode = queue.shift()

    visit = (node) ->
      switch node[0]
        when 'body'
          node.vars = inherit vars
          queue.push node
          null
        when 'assign'
          name = node[1]
          h = visit node[2]
          if vars[name]
            if vars[name].type isnt h.type
              throw Error "Inconsistent usage of symbol '#{name}'"
          else
            vars[name] = h
          h
        when 'sym'
          name = node[1]
          if not vars[name]?
            throw Error "Symbol '#{name}' referenced before assignment"
          vars[name]
        when 'lambda'
          visit node[1]
          {type: 'F'}
        when 'str', 'num', 'embedded'
          {type: 'X'}
        when 'index'
          t1 = visit node[1]
          t2 = visit node[2]
          if t2.type isnt 'X'
            throw Error 'Only data can be used as an index'
          t1
        when 'seq'
          if node.length is 1
            {type: 'X'}
          else
            a = node[1...]
            h = for child in a then visit child

            # Apply niladic functions
            for i in [0...a.length]
              if h[i].isNiladicFunction
                a[i] = ['niladic', a[i]]

            # Form vectors from sequences of data
            i = 0
            while i < a.length - 1
              if h[i].type is h[i + 1].type is 'X'
                j = i + 2
                while j < a.length and h[j].type is 'X' then j++
                a[i...j] = [['vector'].concat a[i...j]]
                h[i...j] = [{type: 'X'}]
              else
                i++

            # Apply infix operators
            i = a.length - 2
            while --i >= 0
              if h[i].type is h[i + 2].type is 'F' and h[i + 1].isInfixOperator and h[i + 2].type is 'F'
                a[i...i+3] = [['infixOperator'].concat a[i...i+3]]
                h[i...i+3] = [{type: 'F'}]
                i--

            # Apply postfix operators
            i = 0
            while i < a.length - 1
              if h[i].type is 'F' and h[i + 1].isPostfixOperator
                a[i...i+2] = [['postfixOperator'].concat a[i...i+2]]
                h[i...i+2] = [{type: 'F'}]
              else
                i++

            # Apply prefix operators
            i = a.length - 1
            while --i >= 0
              if h[i].isPrefixOperator and h[i + 1].type is 'F'
                a[i...i+2] = [['prefixOperator'].concat a[i...i+2]]
                h[i...i+2] = [{type: 'F'}]

            if h[h.length - 1].type is 'F'
              if h.length > 1
                throw Error 'Trailing function in expression'
            else
              # Apply monadic and dyadic functions
              while h.length > 1
                if h.length is 2 or h[h.length - 3].type is 'F'
                  a[h.length - 2...] = [['monadic'].concat a[h.length - 2...]]
                  h[h.length - 2...] = [{type: 'X'}]
                else
                  a[h.length - 3...] = [['dyadic'].concat a[h.length - 3...]]
                  h[h.length - 3...] = [{type: 'X'}]

            node.seqTree = a[0]
            h[0]

        else
          throw Error "Unrecognised node type, '#{node[0]}'"

    for node in scopeNode[1...]
      visit node

  return



# # Second pass
# Convert AST to JavaScript code
secondPass = (ast) ->

  depth = 0 # scope nesting depth

  visit = (node) ->
    switch node[0]
      when 'body'
        a = for child in node[1...] then visit child
        a[a.length - 1] = 'return ' + a[a.length - 1]
        a.join ';\n'
      when 'assign'
        "ctx#{jsProp node[1]} = #{visit node[2]}"
      when 'sym'
        "ctx#{jsProp node[1]}"
      when 'lambda'
        depth++
        r = """
          function (alpha, omega) {
            var ctx, ctx#{depth};
            ctx = ctx[#{depth}] = inherit(ctx#{depth - 1});
            ctx['⍺'] = alpha;
            ctx['⍵'] = omega;
            #{visit node[1]}
          }
        """
        depth--
        r
      when 'str'
        s = node[1]
        d = s[0] # the delimiter: '"' or "'"
        d + s[1...-1].replace(///#{d + d}///g, '\\' + d) + d
      when 'num'
        s = node[1].replace /¯/g, '-'
        a = for x in s.split /j/i
              if x.match /^-?0x/i then parseInt x, 16 else parseFloat x
        if a.length is 1 then '' + a[0] else "new Complex(#{a[0]}, #{a[1]})"
      when 'index'
        "ctx['⌷'](#{visit node[2]}, #{visit node[1]})"
      when 'seq'
        visit node.seqTree
      when 'vector'
        n = node.length - 1
        "[#{(for child in node[1...] then visit child).join ', '}]"
      when 'niladic'
        "#{visit node[1]}()"
      when 'monadic'
        "#{visit node[1]}(#{visit node[2]})"
      when 'dyadic'
        "#{visit node[2]}(#{visit node[1]}, #{visit node[3]})"
      when 'prefixOperator'
        0 # todo
      when 'infixOperator'
        0 # todo
      when 'postfixOperator'
        0 # todo
      else
        throw Error "Unrecognised node type, '#{node[0]}'"

  """
    (function () {
      var ctx0 = inherit(builtInContext);
      #{visit ast}
    })();
  """



# `jsProp(name)` creates code to look up property `name` from a JavaScript
# object.  This could be either `".some_name"` if `name` contains only safe
# characters, or `"['some⎕weird⍎name']"` otherwise.
jsProp = (name) -> if name.match /^[a-z_][0-9a-z_]*$/i then ".#{name}" else "[#{repr name}]"

isArray = (x) -> x.length? and typeof x isnt 'string'

printAST = (x, indent = '') ->
  if isArray x
    x = x.seqTree or x
    if x.length is 2 and not isArray x[1]
      console.info indent + x[0] + ' ' + JSON.stringify x[1]
    else
      console.info indent + x[0]
      for y in x[1...]
        printAST y, indent + '  '
  else
    console.info indent + JSON.stringify x
  return



do ->
  s = '''
    f ← g
    g ← f
  '''
  console.info '-----APL SOURCE-----'
  console.info s
  console.info '-----AST-----'
  printAST parse s
  console.info '-----COMPILED-----'
  console.info(js = compile s)
  console.info '-----OUTPUT-----'
  (new Function js)()

