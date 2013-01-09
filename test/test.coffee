#!/usr/bin/env coffee

# Test framework {{{1
{parser} = require '../lib/parser'
{exec} = require '../lib/compiler'
repr = JSON.stringify

t0 = Date.now()

nTests = 0
nFailed = 0

identityFunction = -> @

all = (a, f) ->
  f ?= identityFunction
  for x in a when not f.call x then return false
  true

eq = (x, y) ->
  if typeof x isnt typeof y then false
  else if typeof x in ['number', 'string'] then x is y
  else if x.length isnt y.length then false
  else all [0...x.length], -> eq x[@], y[@]

fail = (reason, err) -> nFailed++; console.error reason; if err then console.error err.stack

gives = (code, expected) ->
  nTests++
  try
    actual = exec code
    if not eq actual, expected
      fail "Test #{repr code} failed: expected #{repr expected} but got #{repr actual}"
  catch e
    fail "Test #{repr code} failed with #{e}", e

fails = (code, expectedErrorMessage) ->
  nTests++
  try
    exec code
    fail "Code #{repr code} should have failed, but didn't"
  catch e
    if expectedErrorMessage and e.message[...expectedErrorMessage.length] isnt expectedErrorMessage
      fail "Code #{repr code} should have failed with #{repr expectedErrorMessage}, but it failed with #{repr e.message}", e

S = (s) -> s.split ''



# Basic data types {{{1
gives '1 2 3', [1, 2, 3]
gives '(1 2 3)', [1, 2, 3]
gives '123', 123
gives '¯123', -123
gives '(123)', 123
gives '"123"', ['1', '2', '3']
gives "'123'", ['1', '2', '3']
gives '1 "2" (3 4)', [1, '2', [3, 4]]
gives '""', []
gives '"\\f\\t\\n\\r\\u1234\\xff"', S '\f\t\n\r\u1234\xff'
fails '"a\nb"'
fails '"a'

# Pairs of quotes inside strings {{{1
gives '''  'Let''s parse it!'  ''', S 'Let\'s parse it!'
gives '''  "0x22's the code for ""."  ''', S '0x22\'s the code for ".'

# Empty vectors {{{1
gives '⍳ 0', []
gives '⍴ 0', []
gives '⍬', []
gives '⍬⍬', [[], []]
gives '1⍬2⍬3', [1, [], 2, [], 3]

# ◇ Statement separator {{{1
gives '', []
gives '1\n2', 2
gives '1\r2', 2
gives '1 ◇ 2 ◇ 3', 3

# ← Assignment {{{1
gives 'A←5', 5
gives 'A×A←2 5', [4, 25]

# get_/set_ convention for niladics {{{1
gives '''
  radius ← 3
  get_circumference ← {2 × ○ radius}
  get_surface ← {○ radius ⋆ 2}

  before ← 0.01× ⌊ 100× radius circumference surface
  radius ← radius + 1
  after  ← 0.01× ⌊ 100× radius circumference surface

  before after
''', [[3, 18.84, 28.27],
      [4, 25.13, 50.26]]

# overloadable functions {{{1
gives "x ← «{'⍟': function (y) { return y + 1234; }}» ◇ x ⍟ 1", 1235
gives "x ← «{'⍟': function (y) { return y + 1234; }}» ◇ 1 ⍟ x", 1235
gives "x ← «{'⍟': function (y) { return y + 1234; }}» ◇ x ⍟ 1 1", [1235, 1235]
gives "x ← «{'⍟': function (y) { return y + 1234; }}» ◇ x x ⍟ 1", [1235, 1235]
gives "x ← «{'⍟': function () { return 1234; }}» ◇ ⍟ x", 1234
gives "x ← «{'⍟': function () { return 1234; }}» ◇ ⍟ x", 1234
gives "x ← «{'⍟': function () { return 1234; }}» ◇ ⍟ x x", [1234, 1234]

# [] Subscripting {{{1
gives '(23 54 38)[0]', 23
gives '(23 54 38)[1]', 54
gives '(23 54 38)[2]', 38
fails '(23 54 38)[3]'
fails '(23 54 38)[¯1]'
gives '(23 54 38)[0 2]', [23, 38]
gives '(2 3 ⍴ 100 101 102 110 111 112)[1;2]', 112
fails '(2 3 ⍴ 100 101 102 110 111 112)[1;¯1]'
fails '(2 3 ⍴ 100 101 102 110 111 112)[10;1]'
gives '"hello"[1]', 'e'
gives '"ipodlover"[1 2 5 8 3 7 6 0 4]', S 'poordevil'
gives '("axlrose"[4 3 0 2 5 6 1])[0 1 2 3]', S 'oral'
gives '" X"[(3 3⍴⍳9) ∈ 1 3 6 7 8]', S ' X ' +
                                      'X  ' +
                                      'XXX'

# {} Lambda expressions {{{1
gives '{1 + 1} 1', 2
gives '{⍵=0:1 ◇ 2×∇⍵−1} 5', 32 # two to the power of
gives '{ ⍵<2 : 1   ◇   (∇⍵−1)+(∇⍵−2) } 8', 34 # Fibonacci sequence

# «» Embedded JavaScript {{{1
gives '«1234+5678»', 6912
gives '«"asdf"»', S 'asdf'






# \ 1st axis scan {{{1
#gives '×⍀  2 3⍴5 2 3 4 7 6', [5, 2, 3, 20, 14, 18]




# ⍣ Power operator
gives '({⍵+1}⍣5) 3', 8
gives '({⍵+1}⍣0) 3', 3
gives '(⍴⍣3) 2 2⍴⍳4', [1]

# Game of life {{{1
# from http://www.youtube.com/watch?v=a9xAKttWgP4
gives 'r ← (3 3 ⍴ ⍳ 9) ∈ 1 2 3 4 7',
  [0, 1, 1
   1, 1, 0
   0, 1, 0]

gives(
  '''
    r ← (3 3 ⍴ ⍳ 9) ∈ 1 2 3 4 7
    ¯1 ⊖ ¯2 ⌽ 5 7 ↑ r
  '''
  [ 0, 0, 0, 0, 0, 0, 0
    0, 0, 0, 1, 1, 0, 0
    0, 0, 1, 1, 0, 0, 0
    0, 0, 0, 1, 0, 0, 0
    0, 0, 0, 0, 0, 0, 0 ]
)

gives(
  '''
    r ← (3 3 ⍴ ⍳ 9) ∈ 1 2 3 4 7
    R ← ¯1 ⊖ ¯2 ⌽ 5 7 ↑ r
    1 0 ¯1 ⌽¨ R R R
  '''
  [ [ 0, 0, 0, 0, 0, 0, 0
      0, 0, 1, 1, 0, 0, 0
      0, 1, 1, 0, 0, 0, 0
      0, 0, 1, 0, 0, 0, 0
      0, 0, 0, 0, 0, 0, 0 ]

    [ 0, 0, 0, 0, 0, 0, 0
      0, 0, 0, 1, 1, 0, 0
      0, 0, 1, 1, 0, 0, 0
      0, 0, 0, 1, 0, 0, 0
      0, 0, 0, 0, 0, 0, 0 ]

    [ 0, 0, 0, 0, 0, 0, 0
      0, 0, 0, 0, 1, 1, 0
      0, 0, 0, 1, 1, 0, 0
      0, 0, 0, 0, 1, 0, 0
      0, 0, 0, 0, 0, 0, 0 ] ]
)

# }}}1


# Execute functions from "queue" sequentially
if nFailed then console.info "#{nFailed} of #{nTests} tests failed."
else console.info "All #{nTests} tests passed in #{Date.now() - t0} ms."
