⍝ Token types:
⍝   'W' whitespace
⍝   'L' newline
⍝   'D' diamond (⋄)
⍝   'N' number
⍝   'S' string
⍝   '()[]{}:;←' self (toke type is token value)
⍝   'J' JavaScript literal («»)
⍝   'X' symbol
tds←⊃( ⍝ token definitions
  ('W' '^([ \t]+|[⍝\#].*)+')
  ('L' '^[\n\r]+')
  ('D' '^[◇⋄]')
  ('N' '^(¯?(0x[0-9A-Fa-f]+|[0-9]*\.?[0-9]+([Ee][+¯]?[0-9]+)?|¯|∞)([Jj]¯?(0x[0-9A-Fa-f]+|[0-9]*\.?[0-9]+([Ee][+¯]?[0-9]+)?|¯|∞))?)')
  ('S' '^((''[^'']*'')+|("[^"]*"))+')
  ('.' '^[\(\)\[\]\{\}:;←]')
  ('J' '^«[^»]*»')
  ('X' '^(⎕?[A-Za-z_][0-9A-Za-z_]*|⍺⍺|⍵⍵|∇∇|[^¯''":«»])')
)

tpairs←{             ⍝ returns a vector of (type,value) pairs
  0=⍴⍵:⊂'E' ''       ⍝ empty input: only an "end of file" token
  m←tds[;1]⎕RE¨⊂⍵    ⍝ try to match the regexes against ⍵
  i←(×≢¨m)⍳1         ⍝ index of the first regex that matched
  t←tds[i;0]         ⍝ token type
  v←↑(↑m[i])[1]      ⍝ token value
  t←(t='.')⌷t(↑v)    ⍝ '.' means type should be the same as value
  (⊂t v),∇(≢v)↓⍵     ⍝ chop off current token and recur
}

tokenize←{
  t←⊃tpairs⍵         ⍝ col 0: token type, col 1: token value
  e←+\≢¨t[;1]        ⍝ compute end offsets
  t←(t,(¯1↓0,e)),e   ⍝ cols 2 and 3: start and end offset
  t←(t[;0]≠'W')⌿t    ⍝ remove whitespace and comments

  ⍝ remove newlines that are inside () or [] but not inside {}
  s←'{' ⍝ stack
  t←({
    ⍵∊'([{':1⊣s←s,⍵
    ⍵∊')]}':1⊣s←¯1↓s
    ⍵='L':'{'=↑¯1↑s
    1
  }¨t[;0])⌿t
}
