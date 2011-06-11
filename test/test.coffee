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

# ? Roll {{{1
gives 'n←6 ◇ r←?n ◇ (0≤r)∧(r<n)', 1
gives '?0', 0
gives '?1', 0

# ? Deal {{{1
gives 'n←100 ◇ (+/n?n)=(+/⍳n)', 1 # a permutation (an "n?n" dealing) contains all numbers 0...n
gives 'n←100 ◇ A←(n÷2)?n ◇ ∧/(0≤A),A<n', 1 # any number x in a dealing is 0 <= x < n
gives '0?100', []
gives '0?0', []
gives '1?1', [0]
fails '5?3'

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

# ≡ Depth {{{1
gives '≡4', 0
gives '≡⍳4', 1
gives '≡2 2⍴⍳4', 1
gives '≡"abc" 1 2 3 (23 55)', 2
gives '≡"abc" (2 4⍴("abc" 2 3 "k"))', 3

# ≡ Match {{{1
gives '3≡3', 1
gives '3≡,3', 0
gives '4 7.1 8 ≡ 4 7.2 8', 0
gives '(3 4⍴⍳12) ≡ 3 4⍴⍳12', 1
gives '(3 4⍴⍳12) ≡ ⊂3 4⍴⍳12', 0
gives '("ABC" "DEF") ≡ "ABCDEF"', 0
#gives '(⍳0)≡""', 0   # todo: prototypes
gives '(2 0⍴0)≡(0 2⍴0)', 0
#gives '(0⍴1 2 3)≡0⍴⊂2 2⍴⍳4', 0 # todo: prototypes

# ≢ Not match {{{1
gives '3≢3', 0

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

# ⌽ Reverse {{{1
gives '⌽ 1 2 3 4 5 6', [6, 5, 4, 3, 2, 1]
gives '⌽ (1 2) (3 4) (5 6)', [[5, 6], [3, 4], [1, 2]]
gives '⌽ "BOB WON POTS"', S 'STOP NOW BOB'
gives '⌽    2 5 ⍴ 1 2 3 4 5 6 7 8 9 0', [5, 4, 3, 2, 1, 0, 9, 8, 7, 6]
gives '⌽[0] 2 5 ⍴ 1 2 3 4 5 6 7 8 9 0', [6, 7, 8, 9, 0, 1, 2, 3, 4, 5]

# ⌽ Rotate {{{1
gives '1 ⌽ 1 2 3 4 5 6', [2, 3, 4, 5, 6, 1]
gives "3 ⌽ 'ABCDEFGH'", S 'DEFGHABC'
gives '3  ⌽ 2 5 ⍴  1 2 3 4 5  6 7 8 9 0', [4, 5, 1, 2, 3
                                           9, 0, 6, 7, 8]
gives '¯2 ⌽ "ABCDEFGH"', S 'GHABCDEF'
gives '1 ⌽ 3 3 ⍴ ⍳ 9', [1, 2, 0
                        4, 5, 3
                        7, 8, 6]

# ⊖ 1st axis reverse {{{1
gives '⊖ 1 2 3 4 5 6', [6, 5, 4, 3, 2, 1]
gives '⊖ (1 2) (3 4) (5 6)', [[5, 6], [3, 4], [1, 2]]
gives '⊖ "BOB WON POTS"', S 'STOP NOW BOB'
gives '⊖    2 5 ⍴ 1 2 3 4 5 6 7 8 9 0', [6, 7, 8, 9, 0, 1, 2, 3, 4, 5]
gives '⊖[1] 2 5 ⍴ 1 2 3 4 5 6 7 8 9 0', [5, 4, 3, 2, 1, 0, 9, 8, 7, 6]

# ⊖ 1st axis rotate {{{1
gives '1 ⊖ 3 3 ⍴ ⍳ 9', [3, 4, 5
                        6, 7, 8
                        0, 1, 2]

# ⍉ Transpose {{{1
gives '⍉ 2 3 ⍴ 1 2 3 6 7 8', [1, 6,  2, 7,  3, 8]
gives '⍴ ⍉ 2 3 ⍴ 1 2 3 6 7 8', [3, 2]
gives '⍉ 1 2 3', [1, 2, 3]
gives '⍉ 2 3 4 ⍴ ⍳ 24', [0, 12, 4, 16, 8, 20, 1, 13, 5, 17, 9, 21, 2, 14, 6, 18, 10, 22, 3, 15, 7, 19, 11, 23]

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

# ↓ Drop {{{1
gives "4↓'OVERBOARD'", S 'BOARD'
gives "¯5↓'OVERBOARD'", S 'OVER'
gives "⍴10↓'OVERBOARD'", [0]
gives "0 ¯2↓ 3 3 ⍴ 'ONEFATFLY'", S 'OFF'
gives "¯2 ¯1↓ 3 3 ⍴ 'ONEFATFLY'", S 'ON'
gives "1↓ 3 3 ⍴ 'ONEFATFLY'", S 'FATFLY'
gives '1 1↓ 2 3 4⍴"ABCDEFGHIJKLMNOPQRSTUVWXYZ"', S 'QRSTUVWX'
gives '¯1 ¯1↓ 2 3 4⍴"ABCDEFGHIJKLMNOPQRSTUVWXYZ"', S 'ABCDEFGH'

#gives '1 ↓[1] 2 3 4⍴1+⍳24', [5..12].concat [17..24] # todo: drop with axis specification
#gives '1 ↓[2] 2 3 4⍴1+⍳24', [3, 4, 7, 8, 11, 12, 15, 16, 19, 20, 23, 24] # todo
#gives '1 ↓[2 1] 2 3 4⍴1+⍳24', [7, 8, 11, 12, 19, 20, 23, 24] # todo

# ⊂ Enclose {{{1
gives '⍴ ⊂ 2 3⍴⍳6', []
gives '⍴⍴ ⊂ 2 3⍴⍳6', [0]

# ⊃ Disclose {{{1
gives '⊃ (1 2 3) (4 5 6)', [1, 2, 3, 4, 5, 6], [2, 3]
gives '⍴⊃ (1 2 3) (4 5 6)', [2, 3]
gives '⊃ (1 2) (3 4 5)', [1, 2, 0, 3, 4, 5]
gives '⍴⊃ (1 2) (3 4 5)', [2, 3]
gives '⊃ (1 2 3) "AB"', [1, 2, 3, 'A', 'B', 0] # todo: when we implement prototypes, the last element of the result should be ' '
gives '⍴⊃ (1 2 3) "AB"', [2, 3]
gives '⊃123', 123


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

# / Compress {{{1
gives '0 1 0 1 / "ABCD"', S 'BD'
gives '1 1 1 1 0 / 12 14 16 18 20', [12, 14, 16, 18]
gives ''' MARKS←45 60 33 50 66 19
          PASS←MARKS≥50
          PASS/MARKS ''', [60, 50, 66]

gives ''' MARKS←45 60 33 50 66 19
          (MARKS=50)/⍳⍴MARKS ''', [3]

gives '1/"FREDERIC"', S 'FREDERIC'
gives '0/"FREDERIC"', []
gives 't←1+2 3⍴⍳6  ◇  0 1 0/t', [2, 5]
gives 't←1+2 3⍴⍳6  ◇  1 0/[0]t', [1, 2, 3]
gives 't←1+2 3⍴⍳6  ◇  1 0⌿t', [1, 2, 3]

# / Replicate {{{1
gives 't←1+2 3⍴⍳6  ◇  2 ¯2 2/t',
        [1, 1, 0, 0, 3, 3
         4, 4, 0, 0, 6, 6]

gives 't←1+2 3⍴⍳6  ◇  2 ¯2 2 ¯2 2/t',
        [1, 1, 0, 0, 2, 2, 0, 0, 3, 3
         4, 4, 0, 0, 5, 5, 0, 0, 6, 6]

#gives '1 1 ¯2 1 1 / 1 2 (2 2⍴⍳4) 3 4',
#      [1, 2, [0, 0, 0, 0], [0, 0, 0, 0], 3, 4] # todo: prototypes

gives '1 1 ¯2 1 1 1 / 1 2 (2 2⍴⍳4) 3 4',
      [1, 2, 0, 0, [0, 1, 2, 3], 3, 4]

gives '2 3 2 / "ABC"', S 'AABBBCC'
gives '2 / "DEF"', S 'DDEEFF'
gives '5 0 5 / 1 2 3', [1, 1, 1, 1, 1, 3, 3, 3, 3, 3]

gives 't←1+2 3⍴⍳6  ◇  2/t',
      [1, 1, 2, 2, 3, 3
       4, 4, 5, 5, 6, 6]

gives 't←1+2 3⍴⍳6  ◇  2⌿t',
      [1, 2, 3
       1, 2, 3
       4, 5, 6
       4, 5, 6]

gives '2 3/3 1⍴"ABC"',
      ['A', 'A', 'A', 'A', 'A'
       'B', 'B', 'B', 'B', 'B'
       'C', 'C', 'C', 'C', 'C']

#gives '2 ¯1 2/[1]3 1⍴"ABC"',
#      ['A', 'A', ' ', 'A', 'A'
#       'B', 'B', ' ', 'B', 'B'
#       'C', 'C', ' ', 'C', 'C'] # todo: prototypes

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

# . Inner product {{{1
gives '(1 3 5 7) +.= 2 3 6 7', 2
gives '(1 3 5 7) ∧.= 2 3 6 7', 0
gives '(1 3 5 7) ∧.= 1 3 5 7', 1

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

if nFailed then puts "Done.  #{nFailed} of #{nTests} tests failed."
else puts "Done.  All #{nTests} tests passed."
