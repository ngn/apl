if typeof define isnt 'function' then define = require('amdefine')(module)

define (require) ->
  parser = require('./parser') ? window.parser
  {builtins} = require './builtins'
  {Complex} = require './complex'
  {inherit, die, assert, all} = require './helpers'

  # # Stage 1: Lexing

  # Lexing means transforming the input stream of characters into a sequence of
  # tokens.  We let [Jison](http://zaach.github.com/jison/) do this job with
  # the token definitions from [`grammar.coffee`](./grammar.html).
  #
  # But there is one shortcoming for which we must intervene.  We want to treat
  # newlines inside `()` and `[]` as whitespace but newlines inside `{}` as
  # statement separators.  Here we are monkeypatching the lexer, somewhat
  # recklessly, in order to achieve that.
  {setInput, next} = lexer = parser.lexer ? parser.parser.lexer

  lexer.setInput = (args...) ->
    @bracketStack = []
    setInput.call @, args...

  lexer.next = (args...) ->
    loop
      token = next.call @, args...
      if token in ['(', '[', '{']
        @bracketStack.push token
      else if token in [')', ']', '}']
        @bracketStack.pop()
      if (token isnt 'NEWLINE' or
          @bracketStack.length is 0 or
          @bracketStack[@bracketStack.length - 1] is '{')
        return token

  # # Stage 2: Parsing

  # The [Jison](http://zaach.github.com/jison/)-generated parser will build us
  # an AST according to the grammar rules defined in
  # [`grammar.coffee`](./grammar.html).  Nothing for us to do here.
  #
  # A node in the AST will be a JavaScript array whose first item is a string
  # indicating the type of node.  The rest of the items are the children or
  # represent the content of a node.  For instance `(1 + 2) × 3 4` will produce
  # the tree:
  #
  #     ['body',
  #       ['seq',
  #         ['seq',
  #           ['num', '1'],
  #           ['sym', '+'],
  #           ['num', '2']],
  #         ['sym', '×'],
  #         ['num', '3'],
  #         ['num', '4']]]
  #
  # Note, that at this stage we don't yet know which symbols represent verbs
  # and which represent nouns.
  ;

  # # Stage 3: Assign parents

  # This is a simple recursive procedure to assign a `.parent` property to each
  # node, so we can walk the tree up as well as down.
  assignParents = (node) ->
    for child in node[1...] when child
      assignParents child
      child.parent = node
    return

  # # Stage 4: Resolve seq nodes

  # For each scope (`body` node), determine the type of each pronoun (`sym`
  # node) used in it.
  #
  # A pronoun can be either of two types:
  #
  #   * Type `X`: data or a niladic function
  #
  #   * Type `F`: a monadic function, a dyadic function, or an operator
  #
  # This information is then used to convert each sequence (`seq` node) into
  # a hierarchy of function applications.
  #
  # For instance, after this stage, the APL program `(1 + 2) × 3 4` will be
  # represented as:
  #
  #     ['body',
  #       ['dyadic',
  #         ['dyadic',
  #           ['num', '1'],
  #           ['sym', '+'],
  #           ['num', '2']],
  #         ['sym', '+'],
  #         ['vector',
  #           ['num', '3'],
  #           ['num', '4']]]]
  #
  # You can see a textual representation of this tree in your shell, if you
  # type `apl -n filename.apl`
  resolveSeqs = (ast, opts = {}) ->
    ast.vars =
      '⍺': {type: 'X', jsCode: '_a'}
      '⍵': {type: 'X', jsCode: '_w'}
      '∇': {type: 'F', jsCode: 'arguments.callee'}
    for k, v of builtins
      ast.vars[k] = h = {type: 'X', jsCode: "_[#{JSON.stringify k}]"}
      if typeof v is 'function'
        h.type = 'F'
        if (m = v.aplMetaInfo)?
          if m.isPrefixOperator  then h.isPrefixOperator  = true
          if m.isPostfixOperator then h.isPostfixOperator = true
          if m.isInfixOperator   then h.isInfixOperator   = true
        if /^[gs]et_.*/.test k
          ast.vars[k[4...]] = {type: 'X'}
    if opts.extraVars
      ast.vars = inherit ast.vars, opts.extraVars
    scopeCounter = 0
    ast.scopeId = scopeCounter++
    queue = [ast] # accumulates "body" nodes which we encounter on our way
    while queue.length
      {vars} = scopeNode = queue.shift()

      visit = (node) ->
        switch node[0]
          when 'body'
            node.vars = inherit vars
            node.scopeId = scopeCounter++
            queue.push node
            null
          when 'guard'
            visit node[1]
            visit node[2]
          when 'assign'
            name = node[1]
            h = visit node[2]
            if vars[name]
              assert vars[name].type is h.type,
                "Inconsistent usage of symbol '#{name}', it is " +
                "assigned both data and functions"
            else
              vars[name] =
                type: h.type
                jsCode: "_#{scopeNode.scopeId}[#{JSON.stringify name}]"
            h
          when 'sym'
            name = node[1]
            if (v = vars["get_#{name}"])?.type is 'F'
              v.used = true
              {type: 'X'}
            else
              v = vars[name]
              assert v, "Symbol '#{name}' referenced before assignment"
              v.used = true
              v
          when 'lambda'
            visit node[1]
            {type: 'F'}
          when 'str', 'num', 'embedded'
            {type: 'X'}
          when 'index'
            t1 = visit node[1]
            for c in node[2...] when c isnt null
              t = visit c
              assert t.type is 'X', 'Only data can be used as an index'
            t1
          when 'seq'
            a = node[1...]
            a.reverse()
            h = for child in a then visit child
            h.reverse()
            a.reverse()

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
              if (h[i + 1].isInfixOperator and
                  (h[i].type is 'F' or h[i + 2].type is 'F'))
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

            # Hooks
            if h.length is 2 and h[0].type is h[1].type is 'F'
              a = [['hook'].concat a]
              h = [{type: 'F'}]

            # Forks
            if (h.length >= 3 and h.length % 2 is 1 and
                    all(for x in h then x.type is 'F'))
              a = [['fork'].concat a]
              h = [{type: 'F'}]

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
            a[0].parent = null
            for c in node[1...] when c then c.parent = node

            h[0]

          else
            die "Unrecognised node type, '#{node[0]}'"

      for node in scopeNode[1...]
        visit node

    return



  # # Stage 5: Render JavaScript code
  toJavaScript = (ast) ->

    visit = (node) ->
      switch node[0]

        when 'body'
          if node.length is 1
            'return [];\n'
          else
            a = ["var _#{node.scopeId} = {};\n"]
            for child in node[1...] then a.push visit child
            a[a.length - 1] = "return #{a[a.length - 1]};\n"
            a.join(';\n')

        when 'guard'
          """
            if (_.bool(#{visit node[1]})) {
              return #{visit node[2]};
            }
          """

        # Assignment
        #
        #     A←5       ⍝ returns 5
        #     A×A←2 5   ⍝ returns 4 25
        when 'assign'
          name = node[1]
          assert name isnt '∇', 'Assignment to ∇ is not allowed.'
          vars = closestScope(node).vars
          if (v = vars["set_#{name}"])?.type is 'F'
            v.used = true
            "#{v.jsCode}(#{visit node[2]})" # todo: pass-through value
          else
            "#{vars[name].jsCode} = #{visit node[2]}"

        # Symbols
        #
        # Test get_/set_ convention for niladics:
        #
        #     radius ← 3
        #     ... get_circumference ← {2 × ○ radius}
        #     ... get_surface ← {○ radius ⋆ 2}
        #     ...
        #     ... before ← 0.01× ⌊ 100× radius circumference surface
        #     ... radius ← radius + 1
        #     ... after  ← 0.01× ⌊ 100× radius circumference surface
        #     ...
        #     ... before after
        #     ... ⍝ returns (3 18.84 28.27) (4 25.13 50.26)
        when 'sym'
          name = node[1]
          vars = closestScope(node).vars
          if (v = vars["get_#{name}"])?.type is 'F'
            v.used = true
            "#{v.jsCode}()"
          else
            v = vars[name]
            v.used = true
            v.jsCode

        # Lambda expressions
        #
        #     {1 + 1} 1                      ⍝ returns 2
        #     {⍵=0:1 ◇ 2×∇⍵−1} 5             ⍝ returns 32 # two to the power of
        #     {⍵<2 : 1 ◇ (∇⍵−1)+(∇⍵−2) } 8   ⍝ returns 34 # Fibonacci sequence
        when 'lambda'
          """
            function (_w, _a) {
              #{visit node[1]}
            }
          """

        # Strings of length one are scalars, all other strings are vectors.
        #
        #     ⍴⍴''     ⍝ returns ,1
        #     ⍴⍴'x'    ⍝ returns ,0
        #     ⍴⍴'xx'   ⍝ returns ,1
        #
        # Pairs of quotes inside strings:
        #
        #     'Let''s parse it!'         ⍝ returns 'Let\'s parse it!'
        #     "0x22's the code for ""."  ⍝ returns '0x22\'s the code for ".'
        #     ⍴"\f\t\n\r\u1234\xff"      ⍝ returns ,6
        #
        #     "unclosed string           ⍝ fails
        when 'str'
          s = node[1]
          d = s[0] # the delimiter: '"' or "'"
          "_.aplify(#{d + s[1...-1].replace(///#{d + d}///g, '\\' + d) + d})"


        # Numbers
        #
        #     1234567890  ⍝ returns «1234567890»
        #     12.34e56    ⍝ returns «12.34e56»
        #     12.34e+56   ⍝ returns «12.34e+56»
        #     12.34E56    ⍝ returns «12.34e56»
        #     ¯12.34e¯56  ⍝ returns «-12.34e-56»
        #     0Xffff      ⍝ returns «0xffff»
        #     ¯0xffff     ⍝ returns «-0xffff»
        #     ¯0xaBcD1234 ⍝ returns «-0xabcd1234»
        #     ¯           ⍝ returns «Infinity»
        #     ¯¯          ⍝ returns «-Infinity»
        #     −¯          ⍝ returns «-Infinity»
        when 'num'
          s = node[1].replace /¯/g, '-'
          a =
            for x in s.split /j/i
              if x is '-'
                'Infinity'
              else if x is '--'
                '-Infinity'
              else if x.match /^-?0x/i
                parseInt x, 16
              else
                parseFloat x
          if a.length is 1 or a[1] is 0 then '' + a[0]
          else "new _.Complex(#{a[0]}, #{a[1]})"

        when 'index'
          "_['⌷'](#{visit node[1]}, [#{
            (for c in node[2...] when c isnt null then visit c).join ', '
          }], [#{
            (for c, i in node[2...] when c isnt null then i)
          }])"

        when 'seq'
          die 'No "seq" nodes are expected at this stage.'

        when 'vector'
          n = node.length - 1
          "[#{(for child in node[1...] then visit child).join ', '}]"

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

        when 'hook'
          "_.hook(#{visit node[2]}, #{visit node[1]})"

        when 'fork'
          "_.fork([#{for c in node[1...] then visit c}])"

        # Embedded JavaScript
        #
        #     «1234+5678» ⍝ returns 6912
        #     «"asdf"» ⍝ returns 'asdf'
        when 'embedded'
          "_.aplify(#{node[1].replace /(^«|»$)/g, ''})"

        else
          die "Unrecognised node type, '#{node[0]}'"

    visit ast

  # A helper to find the nearest `body` ancestor
  closestScope = (node) ->
    while node[0] isnt 'body' then node = node.parent
    node



  # # Public interface to this module

  nodes = (aplCode, opts = {}) ->
    ast = parser.parse aplCode
    assignParents ast
    resolveSeqs ast, opts
    ast

  compile = (aplCode, opts = {}) ->
    toJavaScript nodes aplCode, opts

  exec = (aplCode, opts = {}) ->
    (new Function """
      var _ = arguments[0];
      #{compile aplCode, opts}
    """) inherit builtins, opts.extraContext

  {nodes, compile, exec}
