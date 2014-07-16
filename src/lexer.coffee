# Token types:
#   '-' whitespace and comments
#   'L' newline
#   '⋄' diamond (⋄)
#   'N' number
#   'S' string
#   '()[]{}:;←' self
#   'J' JS literal
#   'X' symbol
#   '$' end of file

tokenDefs = [
  ['-', /^(?:[ \t]+|[⍝\#].*)+/]
  ['L', /^[\n\r]+/]
  ['⋄', /^[◇⋄]/]
  ['N', ///^
          ¯? (?: 0x[\da-f]+ | \d*\.?\d+(?:e[+¯]?\d+)? | ¯ | ∞ )
    (?: j ¯? (?: 0x[\da-f]+ | \d*\.?\d+(?:e[+¯]?\d+)? | ¯ | ∞ ) ) ?
  ///i]
  ['S', /^(?:'[^']*')+|^(?:"[^"]*")+/]
  ['.', /^[\(\)\[\]\{\}:;←]/]
  ['J', /^«[^»]*»/]
  ['X', /^(?:⎕?[a-z_]\w*|⍺⍺|⍵⍵|∇∇|[^¯'":«»])/i]
]

# `stack` keeps track of bracket nesting and causes 'L' tokens to be dropped
# when the latest unclosed bracket is '(' or '['.  This allows for newlines
# inside expressions without having them treated as statement separators.
#
# A sentry '$' token is generated at the end.
tokenize = (s, opts = {}) ->
  offset = 0
  stack = ['{'] # a stack of brackets
  tokens = []
  ns = s.length
  while offset < ns
    type = null
    for [t, re] in tokenDefs when m = s[offset..].match re
      value = m[0]
      type = if t is '.' then value else t
      break
    if !type then syntaxError 'Unrecognized token', {file: opts.file, offset, s: opts.s}
    if type isnt '-'
      if type in '([{' then stack.push type
      else if type in ')]}' then stack.pop()
      if type isnt 'L' or stack[stack.length - 1] is '{'
        if value[0] is '⎕' then value = value.toUpperCase()
        tokens.push {type, value, offset, aplCode: s}
    offset += value.length
  tokens.push {type: '$', value: '', offset, aplCode: s}
  tokens
