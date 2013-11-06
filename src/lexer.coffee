# The lexer transforms APL source into a stream of tokens.
#
# It does so by trying to match regular expressions at the current source
# position and forming a token from the first one that succeeds.
#
# Some token types are special:
#
#   * `'-'` is used for ignored tokens—comments and whitespace
#
#   * `''` means that the token's type should be the same as the token's
#   value
tokenDefs = [
  ['-',         /^(?:[ \t]+|[⍝\#].*)+/]
  ['newline',   /^[\n\r]+/]
  ['separator', /^[◇⋄]/]
  ['number',    ///^
          ¯? (?: 0x[\da-f]+ | \d*\.?\d+(?:e[+¯]?\d+)? | ¯ )
    (?: j ¯? (?: 0x[\da-f]+ | \d*\.?\d+(?:e[+¯]?\d+)? | ¯ ) ) ?
  ///i]
  ['string',    ///^(?: '(?:[^\\']|\\.)*' | "(?:[^\\"]|\\.)*" )+///]
  ['',          /^[\(\)\[\]\{\}:;←]/]
  ['embedded',  /^«[^»]*»/]
  ['symbol',    ///^(?: ⎕?[a-z_][0-9a-z_]* | ⍺⍺ | ⍵⍵ | ∇∇ | [^¯'":«»] )///i]
]

# A couple of interesting things are going on in this tokenization loop:
#
# `line` and `col` point to where we are in the source code.
#
# `stack` keeps track of bracket nesting and causes `newline` tokens to be
# dropped when the latest unclosed bracket is `'('` or `'['`.  This allows
# for newlines inside expressions without having them treated as statement
# separators.
#
# A sentry `'eof'` token is generated at the end.
tokenize = (s, opts = {}) ->
  line = col = 1
  stack = ['{'] # a stack of brackets
  tokens = []
  while s
    startLine = line
    startCol = col
    type = null
    for [t, re] in tokenDefs when m = s.match re
      type = t or m[0]
      break
    if not type
      throw SyntaxError 'Unrecognized token', {file: opts.file, line, col, s: opts.s}
    a = m[0].split '\n'
    line += a.length - 1
    col = (if a.length is 1 then col else 1) + a[a.length - 1].length
    s = s[m[0].length ...]
    if type isnt '-'
      if type in ['(', '[', '{'] then stack.push type
      else if type in [')', ']', '}'] then stack.pop()
      if type isnt 'newline' or stack[stack.length - 1] is '{'
        tokens.push {type, startLine, startCol, value: m[0], endLine: line, endCol: col}
  tokens.push type: 'eof', value: '', startLine: line, startCol: col, endLine: line, endCol: col
  tokens
