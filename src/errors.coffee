aplError = (name, message = '', opts) ->
  assert typeof name is 'string'
  assert typeof message is 'string'
  if opts?
    {aplCode, offset, file} = opts
    if aplCode? and offset?
      assert typeof aplCode is 'string'
      assert typeof offset is 'number'
      assert typeof file in ['string', 'undefined']
      a = aplCode[...offset].split '\n'
      line = a.length
      col = 1 + (a[a.length - 1] or '').length
      message += """
        \n#{file or '-'}:#{line}:#{col}
        #{aplCode.split('\n')[line - 1]}
        #{repeat '_', col - 1}^
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
valueError  = (a...) -> aplError 'VALUE ERROR',  a...
