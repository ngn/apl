{pervasive, real, withIdentity} = require './vhelpers'
{isInt} = require '../helpers'
{APLArray} = require '../array'
{DomainError} = require '../errors'
Γ = require 'gamma'
lnΓ = Γ.log

@vocabulary =

  '!': withIdentity 1, pervasive

    # Factorial (`!`)
    #
    # !5    <=> 120
    # !21   <=> 51090942171709440000
    # !0    <=> 1
    # !1.5  <=> 1.3293403881791
    # !¯1.5 <=> ¯3.544907701811
    # !¯2.5 <=> 2.3632718012074
    # !¯200.5 <=> 0
    # !¯1   !!! DOMAIN ERROR
    # !¯200 !!! DOMAIN ERROR
    monad: real (x) ->
      if isInt x, 0, 25
        r = 1; i = 2; (while i <= x then r *= i++); r
      else if x > 150
        1 / 0
      else if x < 0 and x is Math.floor x
        throw DomainError()
      else if x < -150
        0
      else
        Γ(x + 1)

    # Binomial (`!`)
    #
    # 2 ! 4       <=> 6
    # 3 ! 20      <=> 1140
    # 2 ! 6 12 20 <=> 15 66 190
    # (2 3⍴1+⍳6)!2 3⍴3 6 9 12 15 18 <=> 2 3⍴ 3 15 84 495 3003 18564
    # 0.5!1       <=> 1.2732395447351612
    # 1.2!3.4     <=> 3.795253463731253
    # !/⍬         <=> 1
    # ≈←{1e¯5>|⍺-⍵} ⋄ (2!1000)≈499500 <=> 1
    # ≈←{1e¯5>|⍺-⍵} ⋄ (998!1000)≈499500 <=> 1
    dyad: real (n, k) ->
      if isInt(k, 0, 100) and isInt(n, 0, 100)
        if n < k then return 0
        if 2 * k > n then k = n - k # do less work
        u = v = 1
        for i in [0...k] by 1 then (u *= n - i; v *= i + 1)
        u / v
      else
        Math.exp lnΓ(n + 1) - lnΓ(k + 1) - lnΓ(n - k + 1)
