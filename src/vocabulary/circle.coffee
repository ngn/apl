{APLArray} = require '../array'
{numeric, pervasive, real} = require './vhelpers'
{DomainError} = require '../errors'
{Complex, simplify} = require '../complex'

@['○'] = pervasive

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
  # 1e¯10>∣.5-1○○÷6 <=> 1 # sin(pi/6) = .5
  #  9○3j4         <=> 3
  # 11○3j4         <=> 4
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
        when -7 then Math.log((1 + x) / (1 - x)) / 2 # arctanh
        when -6 then Math.log(x + Math.sqrt(x * x - 1)) # arccosh
        when -5 then Math.log(x + Math.sqrt(x * x + 1)) # arcsinh
        when -4 then Math.sqrt(x * x - 1)
        when -3 then Math.atan x
        when -2 then Math.acos x
        when -1 then Math.asin x
        when  0 then Math.sqrt(1 - x * x)
        when  1 then Math.sin x
        when  2 then Math.cos x
        when  3 then Math.tan x
        when  4 then Math.sqrt(1 + x * x)
        when  5 then (Math.exp(2 * x) - 1) / 2 # sinh
        when  6 then (Math.exp(2 * x) + 1) / 2 # cosh
        when  7 then ex = Math.exp(2 * x); (ex - 1) / (ex + 1) # tanh
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
        when  9 then x.re
        when 11 then x.im
        else throw DomainError 'Unknown circular or hyperbolic function ' + i
    else
      throw DomainError()
