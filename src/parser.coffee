lexer = require './lexer'
{SyntaxError} = require './errors'

# The parser builds an AST from a stream of tokens.
#
# A node in the AST is a JavaScript array whose first item is a string
# indicating the type of node.  The rest of the items represent the content of
# a node.  For instance, "(1 + 2) × 3 4" will produce the tree:
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
# Note, that right after parsing stage we don't yet know which symbols
# represent verbs and which represent nouns.  This will be resolved later in
# the compiler.
#
# This parser is a hand-crafted recursive descent parser.  Various parseX()
# functions roughly correspond to the set of non-terminals in an imaginary
# grammar.
@parse = (aplCode, opts = {}) ->
  tokenStream = lexer.tokenize aplCode

  # A single-token lookahead is used.  Variable `token` stores the upcoming
  # token.
  token = tokenStream.next()

  # `consume(tt)` consumes the upcoming token and returns a truthy value only
  # if its type matches `tt`.  A space-separated value of `tt` matches any of
  # a set of token types.
  consume = (tt) ->
    if token.type in tt.split ' ' then token = tokenStream.next()

  # `demand(tt)` is like `consume(tt)` but intolerant to a mismatch.
  demand = (tt) ->
    if token.type isnt tt
      parserError "Expected token of type '#{tt}' but got '#{token.type}'"
    token = tokenStream.next()
    return

  parserError = (message) ->
    throw SyntaxError message,
      file: opts.file
      line: token.startLine
      col: token.startCol
      aplCode: aplCode

  parseBody = ->
    body = ['body']
    loop
      if token.type in ['eof', '}'] then return body
      while consume 'separator newline' then ;
      if token.type in ['eof', '}'] then return body
      node = parseAssignments()
      if consume ':' then node = ['guard', node, parseAssignments()]
      body.push node

  parseAssignments = ->
    node = parseExpr()
    if consume '←' then ['assign', node, parseAssignments()] else node

  parseExpr = ->
    items =
      while token.type not in ['←', ')', ']', '}', ':', ';', 'separator', 'newline', 'eof']
        parseItem()
    if items.length is 1 then items[0] else ['expr'].concat items

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
        indices.push parseAssignments()
        if token.type is ']' then return indices
        demand ';'

  parseIndexable = ->
    t = token
    if consume 'number string symbol embedded' then [t.type, t.value]
    else if consume '(' then (expr = parseAssignments(); demand ')'; expr)
    else if consume '{' then (b = parseBody(); demand '}'; ['lambda', b])
    else parserError "Encountered unexpected token of type '#{token.type}'"

  result = parseBody()
  # 'hello'} !!! SYNTAX ERROR
  demand 'eof'
  result
