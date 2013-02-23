if typeof define isnt 'function' then define = require('amdefine')(module)
define ['./lexer'], (lexer) ->

  # The parser builds an AST from a stream of tokens.
  #
  # A node in the AST is a JavaScript array whose first item is a string
  # indicating the type of node.  The rest of the items are either the children
  # or they represent the content of a node.  For instance `(1 + 2) × 3 4` will
  # produce the tree:
  #
  #     ['body',
  #       ['expr',
  #         ['expr',
  #           ['number', '1'],
  #           ['symbol', '+'],
  #           ['number', '2']],
  #         ['symbol', '×'],
  #         ['number', '3'],
  #         ['number', '4']]]
  #
  # Note, that at right after parsing stage we don't yet know which symbols
  # represent verbs and which represent nouns.  This will be resolved later in
  # the `compiler`.

  parse: (aplCode) ->
    tokenStream = lexer.tokenize aplCode

    # A single-token lookahead is used.  Variable `token` stores the upcoming
    # token.
    token = tokenStream.next()

    # `consume()` consumes the upcoming token.
    #
    # `consume(tt)` would only do that and return true if its type is `tt`.
    consume = (tt) ->
      if token.type is tt then (token = tokenStream.next(); true) else false

    # `demand(tt)` is like `consume(tt)` but intolerant to a mismatch.
    demand = (tt) ->
      if token.type isnt tt then fail "Expected #{tt} but got #{token.type}"
      token = tokenStream.next()
      return

    # `fail(message)` politely points at the location where things went awry.
    fail = (message) ->
      throw Error """
        Syntax error: #{message} at #{token.startLine}:#{token.startCol}
        #{aplCode.split('\n')[token.startLine - 1]}
        #{new Array(token.startCol).join('-') + '^'}
      """

    # The parser is a recursive descent parser.  Various `parseXXX()` functions
    # roughly correspond to the set of non-terminals in an imaginary grammar.
    parseBody = ->
      body = ['body']
      loop
        if token.type in ['eof', '}'] then return body
        while consume('separator') or consume('newline') then ;
        if token.type in ['eof', '}'] then return body
        expr = parseExpr()
        if consume ':' then expr = ['guard', expr, parseExpr()]
        body.push expr

    parseExpr = ->
      expr = ['expr']
      loop
        item = parseItem()
        if consume '←' then return expr.concat [['assign', item, parseExpr()]]
        expr.push item
        if token.type in ') ] } : ; separator newline eof'.split ' '
          return expr

    parseItem = ->
      item = parseIndexable()
      if consume '['
        item = ['index', item].concat parseIndices()
        demand ']'
      item

    parseIndices = ->
      indices = []
      loop
        if consume ';' then indices.push null
        else if token.type is ']' then (indices.push null; return indices)
        else
          indices.push parseExpr()
          if token.type is ']' then return indices
          demand ';'

    parseIndexable = ->
      v = token.value
      if consume 'number' then ['number', v]
      else if consume 'string' then ['str', v]
      else if consume 'symbol' then ['symbol', v]
      else if consume 'embedded' then ['embedded', v]
      else if consume '(' then (expr = parseExpr(); demand ')'; expr)
      else if consume '{' then (b = parseBody(); demand '}'; ['lambda', b])
      else fail "Expected indexable but got #{token.type}"

    parseBody()
