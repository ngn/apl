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
    #
    #                       Sign bit        Expected
    #                      ⍺   ⍵  ⍵-⍺        Result
    #                     -----------      ----------
    # 3!5   <=> 10  #      0   0   0       (!⍵)÷(!⍺)×!⍵-⍺
    # 5!3   <=> 0   #      0   0   1       0
    #               #      0   1   0       Domain Error
    # 3!¯5  <=> ¯35 #      0   1   1       (¯1*⍺)×⍺!⍺-⍵+1
    # ¯3!5  <=> 0   #      1   0   0       0
    #               #      1   0   1       Cannot arise
    # ¯5!¯3 <=> 6   #      1   1   0       (¯1*⍵-⍺)×(|⍵+1)!(|⍺+1)
    # ¯3!¯5 <=> 0   #      1   1   1       0
    dyad: Beta = real (n, k) ->
      r =
        if 0 <= n < k or k < 0 <= n or n < k < 0
          0
        else if n < 0 <= k
          if not isInt k then throw DomainError()
          Math.pow(-1, k) * Beta k - n - 1, k
        else if k <= n < 0
          if not isInt n - k then throw DomainError()
          Math.pow(-1, n - k) * Beta Math.abs(k + 1), Math.abs(n + 1)
        else
          Math.exp lnΓ(n + 1) - lnΓ(k + 1) - lnΓ(n - k + 1)
      if isInt(n) and isInt(k) then Math.round r else r
