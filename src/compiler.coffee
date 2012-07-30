#!/usr/bin/env coffee

{parse} = require '../lib/parser'
{inherit, die, assert} = helpers = require './helpers'
repr = JSON.stringify

createHash = (s) ->
  h = {}
  for kv in s.split '\n'
    [k, v] = kv.split /\ +/
    h[k] = v
  h

predefinedNames = createHash '''
  ⍺  _a
  ⍵  _w
  +  _add
  -  _sub
  ×  _mul
  ÷  _div
  !  _bang
  ?  _ques
  ⌷  _index
  ⍴  _r
  ⍳  _i
  ,  _cat
  ⍪  _cat1
  ⎕  _q
  ⍞  _qq
  ∈  _e
  ⍷  _eu
  ∼  _tilde
  ↑  _take
  ↓  _drop
  ⍉  _trans
  ⌽  _rot
  ⊖  _rot1
  ⌽  _circ
  ○  _circ
  ⍬  _zilde
  ⋆  _pow
  ⌈  _max
  ⌊  _min
  ∘. _outer
  .  _inner
  ∣  _mod
  ⊤  _tee
  ⊥  _bot
  ∪  _cup
  ∩  _cap
  ⊂  _enclose
  ⊃  _disclose
  ⍒  _gradeUp
  ⍋  _gradeDown
  ⍣  _powOp
  ¨  _each
  /  _slash
  ⌿  _slash1
  \\ _bslash
  ⍀  _bslash1
  =  _eq
  ≠  _ne
  <  _lt
  >  _gt
  ≤  _le
  ≥  _ge
'''

ord = (s) -> s.charCodeAt 0
hex4 = (n) -> s = '0000' + n.toString 16; s[s.length - 4 ...]
jsName = (name) -> predefinedNames[name] or name.replace /[^a-z0-9]/gi, (x) -> '_' + hex4 ord x

builtins = inherit require('./builtins').builtins

builtinVarInfo =
  '⍺': {type: 'X'}
  '⍵': {type: 'X'}

do ->
  for k, v of builtins
    v = builtins[k]
    console.info 'k, v = ' + repr(k) + ', ' + repr(v)
    builtinVarInfo[k] =
      if typeof v isnt 'function'
        {type: 'X'}
      else if v.isNiladicFunction
        {type: 'F', isNiladicFunction: true}
      else if v.isPrefixOperator
        {type: 'F', isPrefixOperator: true}
      else if v.isPostfixOperator
        {type: 'F', isPostfixOperator: true}
      else if v.isInfixOperator
        {type: 'F', isInfixOperator: true}
      else
        {type: 'F'}

    if k.match /^[gs]et_.*/
      builtinVarInfo[k[4...]] = {type: 'X'}


exports.exec = exec = (source, opts = {}) ->
  h = inherit builtins
  if opts.extraContext then for k, v of opts.extraContext then h[k] = v
  (new Function compile source, opts) h

compile = (source, opts = {}) ->
#  opts.debug = true
  if opts.debug then console.info '-----APL SOURCE-----\n' + source
  ast = parse source
  if opts.debug then (console.info '-----RAW AST-----\n'; printAST ast)
  assignParents ast
  resolveSeqs ast
  if opts.debug then (console.info '-----AST-----\n'; printAST ast)
  output = toJavaScript ast
  if opts.debug then console.info '-----JS OUTPUT-----\n' + output
  output

assignParents = (node) ->
  for child in node[1...]
    assignParents child
    child.parent = node
  return

# For each scope, determine the type of each symbol.
# A symbol can be either of two types:
#
#   * Type X: data or a niladic function
#
#   * Type F: a monadic function, a dyadic function, or an operator
#
# This information is used to convert each "seq" node into a hierarchy of
# function applications.
resolveSeqs = (ast) ->
  ast.vars = inherit builtinVarInfo
  queue = [ast] # accumulates "body" nodes which we encounter on our way
  while queue.length
    {vars} = scopeNode = queue.shift()
    scopeNode.varsToDeclare = []

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
            assert vars[name].type is h.type, "Inconsistent usage of symbol '#{name}', it is assigned both data and functions"
          else
            vars[name] = h
            scopeNode.varsToDeclare.push jsName name
          h
        when 'sym'
          name = node[1]
          assert vars[name]?, "Symbol '#{name}' referenced before assignment"
          vars[name]
        when 'lambda'
          visit node[1]
          {type: 'F'}
        when 'str', 'num', 'embedded'
          {type: 'X'}
        when 'index'
          t1 = visit node[1]
          t2 = visit node[2]
          assert t2.type is 'X', 'Only data can be used as an index'
          t1
        when 'seq'
          a = node[1...]
          a.reverse()
          h = for child in a then visit child
          h.reverse()
          a.reverse()

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
            if h[i + 1].isInfixOperator and (h[i].type is 'F' or h[i + 2].type is 'F')
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
            assert h.length <= 1, 'Trailing function in expression'
          else
            # Apply monadic and dyadic functions
            while h.length > 1
              if h.length is 2 or h[h.length - 3].type is 'F'
                a[h.length - 2...] = [['monadic'].concat a[h.length - 2...]]
                h[h.length - 2...] = [{type: 'X'}]
              else
                a[h.length - 3...] = [['dyadic'].concat a[h.length - 3...]]
                h[h.length - 3...] = [{type: 'X'}]

          # Replace `"seq"` node with `a[0]` in the AST
          node[0...] = a[0]
          a[0][0] = 'IDIOT'
          a[0].parent = null

          h[0]

        else
          die "Unrecognised node type, '#{node[0]}'"

    for node in scopeNode[1...]
      visit node

  return



# Convert AST to JavaScript code
toJavaScript = (ast) ->


  visit = (node) ->
    switch node[0]
      when 'body'
        r = ''
        if node.varsToDeclare.length
          r += 'var ' + node.varsToDeclare.join(', ') + ';\n'
        a = for child in node[1...] then visit child
        a[a.length - 1] = 'return ' + a[a.length - 1] + ';'
        r += a.join(';\n')
      when 'assign'
        name = node[1]
        setter = "set_#{name}"
        if closestScope(node).vars[setter]?.type is 'F'
          "#{jsName setter}(#{visit node[2]})" # todo: pass-through value
        else
          "#{jsName name} = #{visit node[2]}"
      when 'sym'
        "#{jsName node[1]}"
      when 'lambda'
        """
          function (_a, _w) {
            #{visit node[1]}
          }
        """
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
        "_index(#{visit node[2]}, #{visit node[1]})"
      when 'seq'
        die 'No "seq" nodes are expected at this stage.'
      when 'vector'
        n = node.length - 1
        "[#{(for child in node[1...] then visit child).join ', '}]"
      when 'niladic'
        "#{visit node[1]}()"
      when 'monadic'
        "#{visit node[1]}(#{visit node[2]})"
      when 'dyadic'
        "#{visit node[2]}(#{visit node[3]}, #{visit node[1]})"
      when 'prefixOperator'
        "#{visit node[1]}(#{visit node[2]})"
      when 'infixOperator'
        "#{visit node[2]}(#{visit node[3]}, #{visit node[1]})"
      when 'postfixOperator'
        "#{visit node[2]}(#{visit node[1]})"
      else
        die "Unrecognised node type, '#{node[0]}'"

  """
    var _apl = arguments[0],
    #{(for k of builtins then "#{jsName k} = _apl[#{repr k}]").join ',\n    '};
    #{visit ast}
  """



closestScope = (node) ->
  while node[0] isnt 'body' then node = node.parent
  node

isArray = (x) -> x.length? and typeof x isnt 'string'

printAST = (x, indent = '') ->
  if isArray x
    if x.length is 2 and not isArray x[1]
      console.info indent + x[0] + ' ' + JSON.stringify x[1]
    else
      console.info indent + x[0]
      for y in x[1...]
        printAST y, indent + '  '
  else
    console.info indent + JSON.stringify x
  return



if module is require.main then do ->
  console.info exec '⎕←2(⋆⍣3)2', debug: true
