{pervasive, numeric} = require './vhelpers'

@['+'] = pervasive

  # Conjugate (`+`)
  #
  #     +4              ⍝ returns 4
  #     ++4             ⍝ returns 4
  #     + 4 5           ⍝ returns 4 5
  #     +((5 6) (7 1))  ⍝ returns (5 6) (7 1)
  #     + (5 6) (7 1)   ⍝ returns (5 6) (7 1)
  monad: numeric (x) -> x

  # Add (`+`)
  #
  #     1 + 2                           ⍝ returns 3
  #     2 3 + 5 8                       ⍝ returns 7 11
  #     (2 3 ⍴ 1 2 3 4 5 6) +       ¯2  ⍝ returns 2 3 ⍴ ¯1 0 1 2 3 4
  #     (2 3 ⍴ 1 2 3 4 5 6) +   2 ⍴ ¯2  ⍝ throws 'RANK ERROR'
  #     (2 3 ⍴ 1 2 3 4 5 6) + 2 3 ⍴ ¯2  ⍝ returns 2 3 ⍴ ¯1 0 1 2 3 4
  #     1 2 3 + 4 5                     ⍝ throws 'LENGTH ERROR'
  #     (2 3⍴⍳6) + 3 2⍴⍳6               ⍝ throws 'LENGTH ERROR'
  dyad:  numeric (y, x) -> x + y

@['-'] = pervasive

  # Negate (`-`)
  #
  #     -4         ⍝ returns ¯4
  #     - 1 2 3    ⍝ returns ¯1 ¯2 ¯3
  monad: numeric (x) -> -x

  # Subtract (`-`)
  #
  #     1 - 3      ⍝ returns ¯2
  #     5 - ¯3     ⍝ returns 8
  dyad:  numeric (y, x) -> x - y

@['×'] = pervasive

  # Sign of (`×`)
  #
  #     × ¯2 ¯1 0 1 2 ⍝ returns ¯1 ¯1 0 1 1
  #     × 0÷0         ⍝ returns 0
  monad: numeric (x) -> (x > 0) - (x < 0)

  # Multiply (`×`)
  #
  #     7 × 8       ⍝ returns 56
  dyad:  numeric (y, x) -> x * y

@['÷'] = pervasive

  # Reciprocal (`÷`)
  #
  #     ÷2          ⍝ returns .5
  monad: numeric (x) -> 1 / x

  # Divide (`÷`)
  #
  #     27 ÷ 9      ⍝ returns 3
  dyad:  numeric (y, x) -> x / y

@['*'] = pervasive
  monad: numeric Math.exp
  dyad:  numeric (y, x) -> Math.pow x, y

@['⍟'] = pervasive
  monad: numeric Math.log
  dyad:  numeric (y, x) -> Math.log(y) / Math.log(x)

@['∣'] = @['|'] = pervasive

  # Absolute value (`∣`)
  #
  #     ∣ ¯8 0 8 ¯3.5   ⍝ returns 8 0 8 3.5
  monad: numeric Math.abs

  # Residue (`∣`)
  #
  #     3 ∣ 5       ⍝ returns 2
  dyad:  numeric (y, x) -> y % x
