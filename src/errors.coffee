aplError = (name, message = '', opts) ->
  assert typeof name is 'string'
  assert typeof message is 'string'
  if opts?
    assert typeof opts is 'object'
    if opts.aplCode? and opts.line? and opts.col?
      assert typeof opts.aplCode is 'string'
      assert typeof opts.line is 'number'
      assert typeof opts.col is 'number'
      assert typeof opts.file in ['string', 'undefined']
      message += """
        \n#{opts.file or '-'}:##{opts.line}:#{opts.col}
        #{opts.aplCode.split('\n')[opts.line - 1]}
        #{repeat('_', opts.col - 1)}^
      """
  e = Error message
  e.name = name
  for k, v of opts then e[k] = v
  throw e

syntaxError = (a...) -> aplError 'SYNTAX ERROR', a...
domainError = (a...) -> aplError 'DOMAIN ERROR', a...
lengthError = (a...) -> aplError 'LENGTH ERROR', a...
rankError   = (a...) -> aplError 'RANK ERROR',   a...
indexError  = (a...) -> aplError 'INDEX ERROR',  a...
nonceError  = (a...) -> aplError 'NONCE ERROR',  a...
