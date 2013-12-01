# The parser builds an AST from a list of tokens.
#
# A node in the AST is a JavaScript array whose first item is a string
# indicating the type of node.  The rest of the items represent the content of
# a node.  For instance, "(1 + 2) × 3 4" will produce the tree:
#
#     ['b',
#       ['.',
#         ['.',
#           ['n', '1'],
#           ['x', '+'],
#           ['n', '2']],
#         ['x', '×'],
#         ['n', '3'],
#         ['n', '4']]]
#
# Note, that right after parsing stage we don't yet know which symbols
# represent verbs and which represent nouns.  This will be resolved later in
# the compiler.
#
# This parser is a hand-crafted recursive descent parser.  Various parseX()
# functions roughly correspond to the set of non-terminals in an imaginary
# grammar.
#
# Node types:
#
#   Type Description Example
#   ---- ----------- -------
#   'B'  body
#   ':'  guard       a:b
#   'N'  number      1
#   'S'  string      'a'
#   'X'  symbol      a
#   'J'  embedded    «a»
#   '⍬'  empty       ()
#   '{'  lambda      {}
#   '['  index       a[b]
#   '←'  assign      a←b
#   '.'  expr        a b
#
# The compiler replaces '.' nodes with:
#   'V'  vector      1 2
#   'M'  monadic     +1
#   'D'  dyadic      1+2
#   'A'  adverb      +/
#   'C'  conjunction +.×
#   'H'  hook        +÷
#   'F'  fork        +÷⍴
parse = (aplCode, opts = {}) ->
  tokens = tokenize aplCode
  i = 0
  token = tokens[i++] # single-token lookahead

  # consume(tt) consumes the upcoming token and returns a truthy value only
  # if its type matches any character in tt.
  macro consume (tt) ->
    new macro.Parens macro.csToNode """
      if token.type in #{JSON.stringify macro.nodeToVal(tt).split ''}
        token = tokens[i++]
    """

  # demand(tt) is like consume(tt) but intolerant to a mismatch.
  macro demand (tt) ->
    new macro.Parens macro.codeToNode(->
      if token.type is tt then token = tokens[i++]
      else parserError "Expected token of type '#{tt}' but got '#{token.type}'"
    ).subst {tt}

  parserError = (message) ->
    syntaxError message,
      file: opts.file, line: token.startLine, col: token.startCol, aplCode: aplCode

  parseBody = ->
    body = ['B']
    loop
      if token.type in '$};' then return body
      while consume '⋄L' then ;
      if token.type in '$};' then return body
      expr = parseExpr()
      if consume ':' then expr = [':', expr, parseExpr()]
      body.push expr

  parseExpr = ->
    expr = ['.']
    loop
      t = token
      if consume 'NSXJ'
        item = [t.type, t.value]
      else if consume '('
        if consume ')' then item = ['⍬']
        else item = parseExpr(); demand ')'
      else if consume '{'
        item = ['{', parseBody()]
        while consume ';' then item.push parseBody()
        demand '}'
      else parserError "Encountered unexpected token of type '#{token.type}'"
      if consume '['
        item = ['[', item]
        loop
          if consume ';' then item.push null
          else if token.type is ']' then item.push null; break
          else (item.push parseExpr(); if token.type is ']' then break else demand ';')
        demand ']'
      if consume '←' then return expr.concat [['←', item, parseExpr()]]
      expr.push item
      if token.type in ')]}:;⋄L$' then return expr

  result = parseBody()
  # 'hello'} !!! SYNTAX ERROR
  demand '$'
  result

  macro ->
    delete macro._macros.consume
    delete macro._macros.demand
    return
