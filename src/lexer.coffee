# Token types:
#   '-' whitespace and comments
#   'L' newline
#   'D' diamond (⋄)
#   'N' number
#   'S' string
#   '()[]{}:;←' self
#   'J' JS literal
#   'X' symbol
#   'E' end of file

tokenDefs = [
  ['-', /^(?:[ \t]+|[⍝\#].*)+/]
  ['L', /^[\n\r]+/]
  ['D', /^[◇⋄]/]
  ['N', ///^
          ¯? (?: 0x[\da-f]+ | \d*\.?\d+(?:e[+¯]?\d+)? | ¯ )
    (?: j ¯? (?: 0x[\da-f]+ | \d*\.?\d+(?:e[+¯]?\d+)? | ¯ ) ) ?
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
# A sentry 'E' token is generated at the end.
tokenize = (s, opts = {}) ->
  line = col = 1
  stack = ['{'] # a stack of brackets
  tokens = []
  while s
    startLine = line
    startCol = col
    type = null
    for [t, re] in tokenDefs when m = s.match re
      type = if t is '.' then m[0] else t
      break
    type or syntaxError 'Unrecognized token', {file: opts.file, line, col, s: opts.s}
    a = m[0].split '\n'
    line += a.length - 1
    col = (if a.length is 1 then col else 1) + a[a.length - 1].length
    s = s[m[0].length..]
    if type isnt '-'
      if type in '([{' then stack.push type
      else if type in ')]}' then stack.pop()
      if type isnt 'L' or stack[stack.length - 1] is '{'
        tokens.push {type, startLine, startCol, value: m[0], endLine: line, endCol: col}
  tokens.push type: 'E', value: '', startLine: line, startCol: col, endLine: line, endCol: col
  tokens
