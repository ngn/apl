#!/usr/bin/env coffee
  
# Test framework {{{1
{puts} = require 'sys'
{parser} = require '../lib/parser'
{exec} = require '../lib/apl'
repr = JSON.stringify

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

fail = (reason) -> nFailed++; puts reason

gives = (code, expectedResult) ->
  nTests++
  try
    actualResult = exec parser.parse code
    if not eq expectedResult, actualResult
      fail "Test #{repr code} failed: expected #{repr expectedResult} but got #{repr actualResult}"
  catch e
    fail "Test #{repr code} failed with #{e}"

fails = (code, expectedErrorMessage) ->
  nTests++
  try
    exec parser.parse code
    fail "Code #{repr code} should have failed, but didn't"
  catch e
    if expectedErrorMessage
      m = expectedErrorMessage.toLowerCase()
      if e.message[...m.length] isnt expectedErrorMessage
        fail "Code #{repr code} should have failed with #{repr expectedErrorMessage}, but it failed with #{repr e.message}"

S = (s) -> s.split ''



# Basic data types {{{1
gives '1 2 3', [1, 2, 3]
gives '(1 2 3)', [1, 2, 3]
gives '123', 123
gives '¯123', -123
gives '(123)', 123
gives '"123"', ['1', '2', '3']
gives "'123'", ['1', '2', '3']
gives '1 "2" (3 4)', [1, ['2'], [3, 4]]

# Empty vectors {{{1
gives '⍳ 0', []
gives '⍴ 0', []
gives '⍬', []
gives '⍬⍬', [[], []]
gives '1⍬2⍬3', [1, [], 2, [], 3]

# ◇ Statement separator {{{1
gives '', 0
gives '1\n2', 2
gives '1\r2', 2
gives '1 ◇ 2 ◇ 3', 3

# ← Assignment {{{1
gives 'A←5', 5
gives 'A×A←2 5', [4, 25]

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

# + Add {{{1
gives '1 + 2', 3
gives '2 3 + 5 8', [7, 11]
gives '(2 3 ⍴ 1 2 3 4 5 6) +       ¯2', [-1, 0, 1,   2, 3, 4]
gives '(2 3 ⍴ 1 2 3 4 5 6) +   2 ⍴ ¯2', [-1, 0, 1,   2, 3, 4]
gives '(2 3 ⍴ 1 2 3 4 5 6) + 2 3 ⍴ ¯2', [-1, 0, 1,   2, 3, 4]
fails '1 2 3 + 4 5', 'Length error'
gives '+4', 4
gives '++4', 4
gives '+ 4 5', [4, 5]
gives '+((5 6) (7 1))', [[5, 6], [7, 1]]
gives '+ (5 6) (7 1)', [[5, 6], [7, 1]]

# - Subtract {{{1
gives '−4', -4
gives '− 1 2 3', [-1, -2, -3]

gives '⍳ 5', [0...5]
gives '⍴ 1 2 3 ⍴ 0', [1, 2, 3]
gives '⍴ ⍴ 1 2 3 ⍴ 0', [3]
gives '3 3 ⍴ ⍳ 4', [0, 1, 2
                    3, 0, 1
                    2, 3, 0]

# ! Factorial {{{1
gives '!5', 120
gives '!21', 51090942171709440000
gives '!0', 1

# ! Binomial {{{1
gives '2 ! 4', 6
gives '3 ! 20', 1140
gives '2 ! 6 12 20', [15, 66, 190]
gives(
  '''
    TABLE1 ← 2 3 ⍴ 1 + ⍳ 6
    TABLE2 ← 2 3 ⍴ 3 6 9 12 15 18
    TABLE1 ! TABLE2
  '''
  [  3,   15,    84
   495, 3003, 18564]
)

# = Equals {{{1
gives '12 = 12', 1
gives '2 = 12', 0
gives '"Q" = "Q"', [1]
gives '1 = "1"', [0]
gives '"1" = 1', [0]
gives '11 7 2 9 = 11 3 2 6', [1, 0, 1, 0]
gives '"STOAT" = "TOAST"', [0, 0, 0, 0, 1]
gives '8 = 2 + 2 + 2 + 2', 1

gives ''' TABLE ← 2 3⍴1 2 3 4 5 6
          MABLE ← 2 3⍴3 3 3 5 5 5
          TABLE = MABLE ''',
      [0, 0, 1
       0, 1, 0]

gives ''' TABLE ← 2 3⍴1 2 3 4 5 6
          MABLE ← 2 3⍴3 3 3 5 5 5
          3 = TABLE ''',
      [0, 0, 1
       0, 0, 0]

gives ''' TABLE ← 2 3⍴1 2 3 4 5 6
          MABLE ← 2 3⍴3 3 3 5 5 5
          3 = TABLE MABLE ''',
      [ [ 0, 0, 1
          0, 0, 0 ]
        [ 1, 1, 1
          0, 0, 0 ] ]

# ∈ Enlist {{{1
gives '∈ 17', [17]
gives '⍴ ∈ (1 2 3) "ABC" (4 5 6)', [9]
gives '∈ 2 2⍴(1 + 2 2⍴⍳4) "DEF" (1 + 2 3⍴⍳6) (7 8 9)',
  [1, 2, 3, 4, 'D', 'E', 'F', 1, 2, 3, 4, 5, 6, 7, 8, 9]

# ∧ And {{{1
gives '1∧1', 1
gives '1∧0', 0
gives '0∧0', 0
gives '0 0 0 1 1 ∧ 1 1 1 1 0', [0, 0, 0, 1, 0]
gives 't ← 3 3 ⍴ 1 1 1 0 0 0 1 0 1   ◇   1 ∧ t', [1, 1, 1, 0, 0, 0, 1, 0, 1]
gives 't ← 3 3 ⍴ 1 1 1 0 0 0 1 0 1   ◇   ∧/ t', [1, 0, 0]

# , Catenate {{{1
gives '10,66', [10, 66]
gives "'10 ','MAY ','1985'", S '10 MAY 1985'

# ⌽ Rotate {{{1
gives '1 ⌽ 1 2 3 4 5 6', [2, 3, 4, 5, 6, 1]
gives "3 ⌽ 'ABCDEFGH'", S 'DEFGHABC'
gives '3  ⌽ 2 5 ⍴  1 2 3 4 5  6 7 8 9 0', [4, 5, 1, 2, 3
                                           9, 0, 6, 7, 8]
gives '¯2 ⌽ "ABCDEFGH"', S 'GHABCDEF'
gives '1 ⌽ 3 3 ⍴ ⍳ 9', [1, 2, 0
                        4, 5, 3
                        7, 8, 6]

# ⊖ 1st axis rotate {{{1
gives '1 ⊖ 3 3 ⍴ ⍳ 9', [3, 4, 5
                        6, 7, 8
                        0, 1, 2]

# ↑ Take {{{1
gives '5 ↑ "ABCDEFGH"', S 'ABCDE'
gives '¯3 ↑ "ABCDEFGH"', S 'FGH'
gives '3 ↑ 22 2 19 12', [22, 2, 19]
gives '¯1 ↑ 22 2 19 12', [12]
gives '⍴ 1 ↑ (2 2 ⍴ ⍳ 4) (⍳ 10)', [1]
gives '5 ↑ 40 92 11', [40, 92, 11, 0, 0]
gives '¯5 ↑ 40 92 11', [0, 0, 40, 92, 11]
gives '3 3 ↑ 1 1 ⍴ 0', [0, 0, 0, 0, 0, 0, 0, 0, 0]

gives '1 + 4 3 ⍴ ⍳ 12',
  [ 1, 2, 3
    4, 5, 6
    7, 8, 9
   10,11,12]

gives '2 3 ↑ 1 + 4 3 ⍴ ⍳ 12',
  [ 1, 2, 3
    4, 5, 6]

gives '¯1 3 ↑ 1 + 4 3 ⍴ ⍳ 12',
  [10,11,12]

gives '1 2 ↑ 1 + 4 3 ⍴ ⍳ 12',
  [1, 2]

# ⊂ Enclose {{{1
gives '⍴ ⊂ 2 3⍴⍳6', []
gives '⍴⍴ ⊂ 2 3⍴⍳6', [0]


# / Reduction {{{1
gives '+/ 3', 3
gives '+/ 3 5 8', 16
gives '+/ 2 4 6', 12
gives '⌈/ 82 66 93 13', 93
gives '×/ 2 3 ⍴ 1 2 3 4 5 6', [6, 120]
gives "2 ,/ 'AB' 'CD' 'EF' 'HI'", [S('ABCD'), S('CDEF'), S('EFHI')]
gives "3 ,/ 'AB' 'CD' 'EF' 'HI'", [S('ABCDEF'), S('CDEFHI')]

# / N-Wise reduction {{{1
gives '2 +/ 1 + ⍳10', [3, 5, 7, 9, 11, 13, 15, 17, 19]
gives '5 +/ 1 + ⍳10', [15, 20, 25, 30, 35, 40]
gives '10 +/ 1 + ⍳10', [55]
gives '11 +/ 1 + ⍳10', []
gives '2 −/ 3 4 9 7', [-1, -5, 2]
gives '¯2 −/ 3 4 9 7', [1, 5, -2]

# ⌿ 1st axis reduction {{{1
gives '+⌿ 2 3 ⍴ 1 2 3 10 20 30', [11, 22, 33]

# ∘. Outer product {{{1
gives '2 3 4 ∘.× 1 2 3 4',
  [2, 4, 6, 8
   3, 6, 9, 12
   4, 8, 12, 16]

gives '0 1 2 3 4 ∘.! 0 1 2 3 4',
  [1, 1, 1, 1, 1
   0, 1, 2, 3, 4
   0, 0, 1, 3, 6
   0, 0, 0, 1, 4
   0, 0, 0, 0, 1]

gives '1 2 ∘., 1+⍳3',
  [[1, 1], [1, 2], [1, 3]
   [2, 1], [2, 2], [2, 3]]

gives '⍴ 1 2 ∘., 1+⍳3', [2, 3]

gives '2 3 ∘.↑ 1 2',
  [   [1, 0],    [2, 0]
   [1, 0, 0], [2, 0, 0]]

gives '⍴ 2 3 ∘.↑ 1 2', [2, 2]

gives '⍴ ((4 3 ⍴ 0) ∘.+ (5 2 ⍴ 0))', [4, 3, 5, 2]

# ¨ Each {{{1
gives '⍴¨ (0 0 0 0) (0 0 0)', [[4], [3]]
gives '⍴¨ "MONDAY" "TUESDAY"', [[6], [7]]
gives '⍴    (2 2⍴⍳4) (⍳10) 97.3 (3 4⍴"K")', [4]
gives '⍴¨   (2 2⍴⍳4) (⍳10) 97.3 (3 4⍴"K")', [[2, 2], [10], [], [3, 4]]
gives '⍴⍴¨  (2 2⍴⍳4) (⍳10) 97.3 (3 4⍴"K")', [4]
gives '⍴¨⍴¨ (2 2⍴⍳4) (⍳10) 97.3 (3 4⍴"K")', [[2], [1], [0], [2]]

gives '(1 2 3) ,¨ 4 5 6', [[1, 4], [2, 5], [3, 6]]
gives "2 3 ↑¨ 'MONDAY' 'TUESDAY'", [S('MO'), S('TUE')]
gives "2 ↑¨ 'MONDAY' 'TUESDAY'", [S('MO'), S('TU')]
gives '2 3 ⍴¨ 1 2', [[1, 1], [2, 2, 2]]
gives '4 5 ⍴¨ "THE" "CAT"', [S('THET'), S('CATCA')]


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

if nFailed then puts "Done.  #{nFailed} of #{nTests} tests failed."
else puts "Done.  All #{nTests} tests passed."
