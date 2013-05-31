{APLArray} = require '../array'
{pervasive, numeric, match} = require './vhelpers'

# Equals (`=`)
#
#     12 = 12               <=> 1
#     2 = 12                <=> 0
#     "Q" = "Q"             <=> 1
#     1 = "1"               <=> 0
#     "1" = 1               <=> 0
#     11 7 2 9 = 11 3 2 6   <=> 1 0 1 0
#     "STOAT" = "TOAST"     <=> 0 0 0 0 1
#     8 = 2 + 2 + 2 + 2     <=> 1
#     (2 3⍴1 2 3 4 5 6) = 2 3⍴3 3 3 5 5 5   <=> 2 3 ⍴ 0 0 1 0 1 0
#     3 = 2 3⍴1 2 3 4 5 6   <=> 2 3 ⍴ 0 0 1 0 0 0
#     3 = (2 3⍴1 2 3 4 5 6) (2 3⍴3 3 3 5 5 5)
#     ... <=> (2 3 ⍴ 0 0 1 0 0 0) (2 3 ⍴ 1 1 1 0 0 0)
@['='] = pervasive dyad: (y, x) -> +(x is y)

@['≠'] = pervasive dyad: (y, x) -> +(x isnt y)
@['<'] = pervasive dyad: numeric (y, x) -> +(x < y)
@['>'] = pervasive dyad: numeric (y, x) -> +(x > y)
@['≤'] = pervasive dyad: numeric (y, x) -> +(x <= y)
@['≥'] = pervasive dyad: numeric (y, x) -> +(x >= y)

@['≡'] = (omega, alpha) ->
  if alpha

    # Match (`≡`)
    #
    # 3≡3                       <=> 1
    # 3≡,3                      <=> 0
    # 4 7.1 8 ≡ 4 7.2 8         <=> 0
    # (3 4⍴⍳12) ≡ 3 4⍴⍳12       <=> 1
    # (3 4⍴⍳12) ≡ ⊂3 4⍴⍳12      <=> 0
    # ("ABC" "DEF") ≡ "ABCDEF"  <=> 0
    #! (⍳0)≡""                   <=> 0
    # (2 0⍴0)≡(0 2⍴0)           <=> 0
    #! (0⍴1 2 3)≡0⍴⊂2 2⍴⍳4       <=> 0
    APLArray.bool[+match omega, alpha]

  else

    # Depth (`≡`)
    #
    # ≡4                           <=> 0
    # ≡⍳4                          <=> 1
    # ≡2 2⍴⍳4                      <=> 1
    # ≡"abc" 1 2 3 (23 55)         <=> 2
    # ≡"abc" (2 4⍴("abc" 2 3 "k")) <=> 3
    new APLArray [depthOf omega], []

depthOf = (x) ->
  if x instanceof APLArray
    if x.shape.length is 0 and not (x.data[0] instanceof APLArray)
      return 0
    r = 0
    x.each (y) -> r = Math.max r, depthOf y
    r + 1
  else
    0

@['≢'] = (omega, alpha) ->
  if alpha

    # Not match (`≢`)
    #
    # 3≢3 <=> 0
    APLArray.bool[+not match omega, alpha]

  else
    throw Error 'Not implemented'
