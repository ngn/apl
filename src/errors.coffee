APLError = (name, message = '', opts) ->
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
  e

SyntaxError = (message, opts) -> APLError 'SYNTAX ERROR', message, opts
DomainError = (message, opts) -> APLError 'DOMAIN ERROR', message, opts
LengthError = (message, opts) -> APLError 'LENGTH ERROR', message, opts
RankError   = (message, opts) -> APLError 'RANK ERROR',   message, opts
IndexError  = (message, opts) -> APLError 'INDEX ERROR',  message, opts
NonceError  = (message, opts) -> APLError 'NONCE ERROR',  message, opts
