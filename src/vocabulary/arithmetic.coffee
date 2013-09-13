{numeric, pervasive, real, withIdentity} = require './vhelpers'
{Complex, complexify, simplify} = require '../complex'
{DomainError} = require '../errors'
{APLArray} = require '../array'

@['+'] = withIdentity APLArray.zero, pervasive

  # Conjugate (`+`)
  #
  # +4             <=> 4
  # ++4            <=> 4
  # + 4 5          <=> 4 5
  # +((5 6) (7 1)) <=> (5 6) (7 1)
  # + (5 6) (7 1)  <=> (5 6) (7 1)
  # +1j¯2          <=> 1j2
  monad: numeric ((x) -> x),
    (x) ->
      new Complex x.re, -x.im

  # Add (`+`)
  #
  # 1 + 2                          <=> 3
  # 2 3 + 5 8                      <=> 7 11
  # (2 3 ⍴ 1 2 3 4 5 6) +       ¯2 <=> 2 3 ⍴ ¯1 0 1 2 3 4
  # (2 3 ⍴ 1 2 3 4 5 6) +   2 ⍴ ¯2 !!! RANK ERROR
  # (2 3 ⍴ 1 2 3 4 5 6) + 2 3 ⍴ ¯2 <=> 2 3 ⍴ ¯1 0 1 2 3 4
  # 1 2 3 + 4 5                    !!! LENGTH ERROR
  # (2 3⍴⍳6) + 3 2⍴⍳6              !!! LENGTH ERROR
  # 1j¯2+¯2j3                      <=> ¯1j1
  # +/⍬            <=> 0
  dyad: numeric ((y, x) -> x + y),
    (y, x) ->
      simplify x.re + y.re, x.im + y.im

@['-'] = withIdentity APLArray.zero, pervasive

  # Negate (`-`)
  #
  # -4     <=> ¯4
  # -1 2 3 <=> ¯1 ¯2 ¯3
  # -1j2   <=> ¯1j¯2
  monad: numeric ((x) -> -x),
    (x) ->
      new Complex -x.re, -x.im

  # Subtract (`-`)
  #
  # 1-3     <=> ¯2
  # 5-¯3    <=> 8
  # 5j2-3j8 <=> 2j¯6
  # 5-3j8   <=> 2j¯8
  # -/⍬     <=> 0
  dyad: numeric ((y, x) -> x - y),
    (y, x) ->
      simplify x.re - y.re, x.im - y.im

@['×'] = withIdentity APLArray.one, pervasive

  # Sign of (`×`)
  #
  # × ¯2 ¯1 0 1 2 <=> ¯1 ¯1 0 1 1
  # × 0÷0         <=> 0
  # × ¯           <=> 1
  # × ¯¯          <=> ¯1
  # ×3j¯4         <=> .6j¯.8
  monad: numeric ((x) -> (x > 0) - (x < 0)),
    (x) ->
      d = Math.sqrt x.re * x.re + x.im * x.im
      simplify x.re / d, x.im / d

  # Multiply (`×`)
  #
  # 7×8       <=> 56
  # 1j¯2×¯2j3 <=> 4j7
  # 2×1j¯2    <=> 2j¯4
  # ×/⍬       <=> 1
  dyad: mult = numeric ((y, x) -> x * y),
    (y, x) ->
      simplify x.re * y.re - x.im * y.im, x.re * y.im + x.im * y.re

@['÷'] = withIdentity APLArray.one, pervasive

  # Reciprocal (`÷`)
  #
  # ÷2   <=> .5
  # ÷2j3 <=> 0.15384615384615385J¯0.23076923076923078
  monad: numeric ((x) -> 1 / x),
    (x) ->
      d = x.re * x.re + x.im * x.im
      simplify x.re / d, -x.im / d

  # Divide (`÷`)
  #
  # 27÷9     <=> 3
  # 4j7÷1j¯2 <=> ¯2j3
  # 0j2÷0j1  <=> 2
  # 5÷2j1    <=> 2j¯1
  # ÷/⍬      <=> 1
  dyad: div = numeric ((y, x) -> x / y),
    (y, x) ->
      d = y.re * y.re + y.im * y.im
      simplify (x.re * y.re + x.im * y.im) / d, (y.re * x.im - y.im * x.re) / d

@['*'] = withIdentity APLArray.one, pervasive

  # *2   <=> 7.38905609893065
  # *2j3 <=> ¯7.315110094901103J1.0427436562359045
  monad: exp = numeric ((x) -> Math.exp x),
    (x) ->
      r = Math.exp x.re
      simplify(
        r * Math.cos x.im
        r * Math.sin x.im
      )

  # 2*3 <=> 8
  # 3*2 <=> 9
  # ¯2*3 <=> ¯8
  # ¯3*2 <=> 9
  # ¯1*.5 <=> 0j1
  # 1j2*3j4 <=> .129009594074467j.03392409290517014
  # */⍬ <=> 1
  dyad: (y, x) ->
    if typeof x is typeof y is 'number' and x >= 0
      Math.pow x, y
    else
      x = complexify x
      y = complexify y
      exp mult ln(x), y

@['⍟'] = pervasive

  # Natural logarithm (`⍟`)
  #
  # ⍟123 <=> 4.812184355372417
  # ⍟0 <=> ¯¯
  # ⍟¯1 <=> 0j1 × ○1
  # ⍟123j456 <=> 6.157609243895447J1.3073297857599793
  monad: ln = (x) ->
    if typeof x is 'number' and x > 0
      Math.log x
    else
      x = complexify x
      simplify(
        Math.log Math.sqrt x.re * x.re + x.im * x.im
        Math.atan2 x.im, x.re
      )

  # Logarithm to the base (`⍟`)
  #
  # 12⍟34 <=> 1.419111870829036
  # 12⍟¯34 <=> 1.419111870829036j1.26426988871305
  # ¯12⍟¯34 <=> 1.1612974763994781j¯.2039235425372641
  # 1j2⍟3j4 <=> 1.2393828252698689J¯0.5528462880299602
  dyad: (y, x) ->
    if typeof x is typeof y is 'number' and x > 0 and y > 0
      Math.log(y) / Math.log(x)
    else
      x = complexify x
      y = complexify y
      div ln(x), ln(y)

@['∣'] = @['|'] = pervasive

  # Absolute value (`∣`)
  #
  # ∣ ¯8 0 8 ¯3.5 <=> 8 0 8 3.5
  # |5j12 <=> 13
  monad: numeric ((x) -> Math.abs x),
    (x) ->
      Math.sqrt x.re * x.re + x.im * x.im

  # Residue (`∣`)
  #
  # 3∣5 <=> 2
  # 1j2|3j4 !!!
  dyad: real (y, x) -> y % x
