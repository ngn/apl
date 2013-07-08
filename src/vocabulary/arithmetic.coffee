{pervasive, numeric} = require './vhelpers'
{Complex} = require '../complex'

@['+'] = pervasive

  # Conjugate (`+`)
  #
  # +4             <=> 4
  # ++4            <=> 4
  # + 4 5          <=> 4 5
  # +((5 6) (7 1)) <=> (5 6) (7 1)
  # + (5 6) (7 1)  <=> (5 6) (7 1)
  monad: numeric (x) -> x

  # Add (`+`)
  #
  # 1 + 2                          <=> 3
  # 2 3 + 5 8                      <=> 7 11
  # (2 3 ⍴ 1 2 3 4 5 6) +       ¯2 <=> 2 3 ⍴ ¯1 0 1 2 3 4
  # (2 3 ⍴ 1 2 3 4 5 6) +   2 ⍴ ¯2 !!! RANK ERROR
  # (2 3 ⍴ 1 2 3 4 5 6) + 2 3 ⍴ ¯2 <=> 2 3 ⍴ ¯1 0 1 2 3 4
  # 1 2 3 + 4 5                    !!! LENGTH ERROR
  # (2 3⍴⍳6) + 3 2⍴⍳6              !!! LENGTH ERROR
  dyad:  numeric (y, x) -> x + y

@['-'] = pervasive

  # Negate (`-`)
  #
  # -4      <=> ¯4
  # -1 2 3 <=> ¯1 ¯2 ¯3
  monad: numeric (x) -> -x

  # Subtract (`-`)
  #
  # 1-3  <=> ¯2
  # 5-¯3 <=> 8
  dyad:  numeric (y, x) -> x - y

@['×'] = pervasive

  # Sign of (`×`)
  #
  # × ¯2 ¯1 0 1 2 <=> ¯1 ¯1 0 1 1
  # × 0÷0         <=> 0
  monad: numeric (x) -> (x > 0) - (x < 0)

  # Multiply (`×`)
  #
  # 7×8 <=> 56
  dyad:  numeric (y, x) -> x * y

@['÷'] = pervasive

  # Reciprocal (`÷`)
  #
  # ÷2 <=> .5
  monad: numeric (x) -> 1 / x

  # Divide (`÷`)
  #
  # 27÷9 <=> 3
  dyad:  numeric (y, x) -> x / y

@['*'] = pervasive
  monad: numeric Math.exp

  # 2*3 <=> 8
  # 3*2 <=> 9
  # ¯2*3 <=> ¯8
  # ¯3*2 <=> 9
  # ¯1*.5 <=> 0j1
  dyad:  numeric (y, x) ->
    if x < 0
      (new Complex x)['*'] y
    else
      Math.pow x, y

@['⍟'] = pervasive

  # ⍟123 <=> 4.812184355372417
  # ⍟0 <=> ¯¯
  # ⍟¯1 <=> 0j1 × ○1
  monad: numeric (x) ->
    if x < 0
      (new Complex x)['⍟']()
    else
      Math.log x

  # 12⍟34 <=> 1.419111870829036
  # 12⍟¯34 <=> 1.419111870829036j1.26426988871305
  # ¯12⍟¯34 <=> 1.1612974763994781j¯.2039235425372641
  dyad: numeric (y, x) ->
    if x < 0 or y < 0
      (new Complex x)['⍟'] y
    else
      Math.log(y) / Math.log(x)

@['∣'] = @['|'] = pervasive

  # Absolute value (`∣`)
  #
  # ∣ ¯8 0 8 ¯3.5 <=> 8 0 8 3.5
  monad: numeric Math.abs

  # Residue (`∣`)
  #
  # 3∣5 <=> 2
  dyad:  numeric (y, x) -> y % x
