{pervasive} = require './vhelpers'
{Complex, complexify, simplify} = require '../complex'
{DomainError} = require '../errors'

@['+'] = pervasive

  # Conjugate (`+`)
  #
  # +4             <=> 4
  # ++4            <=> 4
  # + 4 5          <=> 4 5
  # +((5 6) (7 1)) <=> (5 6) (7 1)
  # + (5 6) (7 1)  <=> (5 6) (7 1)
  # +1j¯2          <=> 1j2
  monad: (x) ->
    if typeof x is 'number'
      x
    else if x instanceof Complex
      new Complex x.re, -x.im
    else
      throw DomainError()

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
  dyad: (y, x) ->
    if typeof x is 'number' and typeof y is 'number'
      x + y
    else
      x = complexify x
      y = complexify y
      simplify x.re + y.re, x.im + y.im

@['-'] = pervasive

  # Negate (`-`)
  #
  # -4     <=> ¯4
  # -1 2 3 <=> ¯1 ¯2 ¯3
  # -1j2   <=> ¯1j¯2
  monad: (x) ->
    if typeof x is 'number'
      -x
    else if x instanceof Complex
      new Complex -x.re, -x.im
    else
      throw DomainError()

  # Subtract (`-`)
  #
  # 1-3     <=> ¯2
  # 5-¯3    <=> 8
  # 5j2-3j8 <=> 2j¯6
  # 5-3j8   <=> 2j¯8
  dyad: (y, x) ->
    if typeof x is 'number' and typeof y is 'number'
      x - y
    else
      x = complexify x
      y = complexify y
      simplify x.re - y.re, x.im - y.im

@['×'] = pervasive

  # Sign of (`×`)
  #
  # × ¯2 ¯1 0 1 2 <=> ¯1 ¯1 0 1 1
  # × 0÷0         <=> 0
  # × ¯           <=> 1
  # × ¯¯          <=> ¯1
  # ×3j¯4         <=> .6j¯.8
  monad: (x) ->
    if typeof x is 'number'
      (x > 0) - (x < 0)
    else if x instanceof Complex
      d = Math.sqrt x.re * x.re + x.im * x.im
      simplify x.re / d, x.im / d
    else
      throw DomainError()

  # Multiply (`×`)
  #
  # 7×8       <=> 56
  # 1j¯2×¯2j3 <=> 4j7
  # 2×1j¯2    <=> 2j¯4
  dyad: mult = (y, x) ->
    if typeof x is typeof y is 'number'
      x * y
    else
      x = complexify x
      y = complexify y
      simplify x.re * y.re - x.im * y.im, x.re * y.im + x.im * y.re

@['÷'] = pervasive

  # Reciprocal (`÷`)
  #
  # ÷2 <=> .5
  # TODO complex
  monad: (x) ->
    if typeof x is 'number'
      1 / x
    else if x instanceof Complex
      d = x.re * x.re + x.im * x.im
      simplify x.re / d, -x.im / d
    else
      throw DomainError()

  # Divide (`÷`)
  #
  # 27÷9     <=> 3
  # 4j7÷1j¯2 <=> ¯2j3
  # 0j2÷0j1  <=> 2
  # 5÷2j1    <=> 2j¯1
  dyad: div = (y, x) ->
    if typeof x is typeof y is 'number'
      x / y
    else
      x = complexify x
      y = complexify y
      d = y.re * y.re + y.im * y.im
      simplify (x.re * y.re + x.im * y.im) / d, (y.re * x.im - y.im * x.re) / d

@['*'] = pervasive

  # TODO: real numbers
  # *123j456 <=> ¯2.336586510148344e+53j¯1.1841598134622967e+53
  monad: exp = (x) ->
    if typeof x is 'number'
      Math.exp x
    else if x instanceof Complex
      r = Math.exp x.re
      simplify(
        r * Math.cos x.im
        r * Math.sin x.im
      )
    else
      throw DomainError()

  # 2*3 <=> 8
  # 3*2 <=> 9
  # ¯2*3 <=> ¯8
  # ¯3*2 <=> 9
  # ¯1*.5 <=> 0j1
  # 1j2*3j4 <=> .129009594074467j.03392409290517014
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
  monad: (x) ->
    if typeof x is 'number'
      Math.abs x
    else if x instanceof Complex
      Math.sqrt x.re * x.re + x.im * x.im
    else
      throw DomainError()

  # Residue (`∣`)
  #
  # 3∣5 <=> 2
  # 1j2|3j4 !!!
  dyad: (y, x) ->
    if typeof x is typeof y is 'number'
      y % x
    else
      throw DomainError()
