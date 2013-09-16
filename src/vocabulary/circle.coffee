{numeric, pervasive} = require './vhelpers'
{DomainError} = require '../errors'
{Complex, simplify} = require '../complex'

@vocabulary =
  '○': pervasive

    # Pi times (`○`)
    #
    # ○2     <=> 6.283185307179586
    # ○2J2   <=> 6.283185307179586J6.283185307179586
    # ○'ABC' !!! DOMAIN ERROR
    monad: numeric ((x) -> Math.PI * x),
      (x) ->
        new Complex Math.PI * x.re, Math.PI * x.im

    # Circular and hyperbolic functions (`○`)
    #
    # ¯12○2          <=> ¯0.4161468365471J0.9092974268257
    # ¯12○2j3        <=> ¯0.02071873100224J0.04527125315609
    # ¯11○2          <=> 0j2
    # ¯11○2j3        <=> ¯3j2
    # ¯10○2          <=> 2
    # ¯10○2j3        <=> 2j¯3
    # ¯9○2           <=> 2
    # ¯9○2j3         <=> 2j3
    # ¯8○2           <=> 0J¯2.2360679774998
    # ¯8○2j3         <=> ¯2.8852305489054J2.0795565201111
    # ¯7○2           <=> 0.5493061443340548456976226185j¯1.570796326794896619231321692
    # ¯7○2j3         <=> 0.1469466662255297520474327852j1.338972522294493561124193576
    # ¯6○2           <=> 1.316957896924816708625046347
    # ¯6○2j3         <=> 1.983387029916535432347076903j1.000143542473797218521037812
    # ¯5○2           <=> 1.443635475178810342493276740
    # ¯5○2j3         <=> 1.968637925793096291788665095j0.9646585044076027920454110595
    # ¯4○2           <=> 1.7320508075689
    # ¯4○0           <=> 0j1
    # ¯4○¯2          <=> ¯1.7320508075689
    # ¯4○2j3         <=> 1.9256697360917J3.1157990841034
    # ¯3○2           <=> 1.107148717794090503017065460
    # ¯3○2j3         <=> 1.409921049596575522530619385j0.2290726829685387662958818029
    # ¯2○2           <=> 0J1.316957896924816708625046347
    # ¯2○2j3         <=> 1.000143542473797218521037812J¯1.983387029916535432347076903
    # ¯1○2           <=> 1.570796326794896619231321692J¯1.316957896924816708625046347
    # ¯1○2j3         <=> 0.5706527843210994007102838797J1.983387029916535432347076903
    # 0○0.5          <=> 0.86602540378444
    # 0○2            <=> 0J1.7320508075689
    # 0○2j3          <=> 3.1157990841034J¯1.9256697360917
    # 1e¯10>∣.5-1○○÷6 <=> 1 # sin(pi/6) = .5
    # 4○2            <=> 2.2360679774998
    # 4○2j3          <=> 2.0795565201111J2.8852305489054
    # 8○2            <=> 0J2.2360679774998
    # 8○2j3          <=> 2.8852305489054J¯2.0795565201111
    # 9○2            <=> 2
    # 9○2j3          <=> 2
    # 10○¯2          <=> 2
    # 10○¯2j3        <=> 3.605551275464
    # 11○2           <=> 0
    # 11○2j3         <=> 3
    # 12○2           <=> 0
    # 12○2j3         <=> 0.98279372324733
    # 1○'hello'      !!! DOMAIN ERROR
    # 99○1           !!! DOMAIN ERROR
    # 99○1j2         !!! DOMAIN ERROR
    dyad: (x, i) ->
      if typeof x is 'number'
        switch i
          when -12 then Complex.exp simplify 0, x
          when -11 then simplify 0, x
          when -10 then x
          when -9 then x
          when -8 then simplify 0, -Math.sqrt(1 + x * x)
          when -7 then Complex.atanh x
          when -6 then Complex.acosh x
          when -5 then Complex.asinh x
          when -4
            t = Complex.sqrt(x * x - 1)
            if x < -1 then -t else t
          when -3 then Complex.atan x
          when -2 then Complex.acos x
          when -1 then Complex.asin x
          when  0 then Complex.sqrt(1 - x * x)
          when  1 then Math.sin x
          when  2 then Math.cos x
          when  3 then Math.tan x
          when  4 then Math.sqrt(1 + x * x)
          when  5 then (Math.exp(2 * x) - 1) / 2 # sinh
          when  6 then (Math.exp(2 * x) + 1) / 2 # cosh
          when  7 then ex = Math.exp(2 * x); (ex - 1) / (ex + 1) # tanh
          when  8 then Complex.sqrt(-1 - x * x)
          when  9 then x
          when 10 then Math.abs x
          when 11 then 0
          when 12 then 0
          else throw DomainError 'Unknown circular or hyperbolic function ' + i
      else if x instanceof Complex
        switch i
          when -12 then Complex.exp simplify -x.im, x.re
          when -11 then simplify -x.im, x.re
          when -10 then Complex.conjugate x
          when -9 then x
          when -8
            t =  Complex.subtract -1, (Complex.multiply x, x)
            Complex.negate Complex.sqrt t
          when -7 then Complex.atanh x
          when -6 then Complex.acosh x
          when -5 then Complex.asinh x
          when -4
            if x.re is -1 and x.im is 0 then 0
            else Complex.multiply (Complex.add x, 1), Complex.sqrt(
              Complex.divide (Complex.subtract x, 1), Complex.add x, 1
            )
          when -3 then Complex.atan x
          when -2 then Complex.acos x
          when -1 then Complex.asin x
          when  0 then Complex.sqrt Complex.subtract 1, Complex.multiply x, x
          when  4 then Complex.sqrt Complex.add 1, Complex.multiply x, x
          when  8 then Complex.sqrt Complex.subtract -1, Complex.multiply x, x
          when  9 then x.re
          when 10 then Complex.magnitude x
          when 11 then x.im
          when 12 then Complex.direction x
          else throw DomainError 'Unknown circular or hyperbolic function ' + i
      else
        throw DomainError()
