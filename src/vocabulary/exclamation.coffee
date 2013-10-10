macro -> macro.fileToNode 'src/macros.coffee'
{pervasive, real, withIdentity} = require './vhelpers'
{isInt, prod} = require '../helpers'
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
      if not isInt x then Γ(x + 1)
      else if x < 0 then throw DomainError()
      else if x < smallFactorials.length then smallFactorials[x]
      else Math.round Γ(x + 1)

    # Binomial (`!`)
    #
    # 2 ! 4       <=> 6
    # 3 ! 20      <=> 1140
    # 2 ! 6 12 20 <=> 15 66 190
    # (2 3⍴1+⍳6)!2 3⍴3 6 9 12 15 18 <=> 2 3⍴ 3 15 84 495 3003 18564
    # 0.5!1       <=> 1.2732395447351612
    # 1.2!3.4     <=> 3.795253463731253
    # !/⍬         <=> 1
    # (2!1000)=499500 <=> 1
    # (998!1000)=499500 <=> 1
    #
    #                   Negative integer?   Expected
    #                      ⍺   ⍵  ⍵-⍺        Result
    #                     -----------      ----------
    # 3!5   <=> 10  #      0   0   0       (!⍵)÷(!⍺)×!⍵-⍺
    # 5!3   <=> 0   #      0   0   1       0
    # see below     #      0   1   0       Domain Error
    # 3!¯5  <=> ¯35 #      0   1   1       (¯1*⍺)×⍺!⍺-⍵+1
    # ¯3!5  <=> 0   #      1   0   0       0
    #               #      1   0   1       Cannot arise
    # ¯5!¯3 <=> 6   #      1   1   0       (¯1*⍵-⍺)×(|⍵+1)!(|⍺+1)
    # ¯3!¯5 <=> 0   #      1   1   1       0
    #
    # 0.5!¯1 !!! DOMAIN ERROR
    dyad: Beta = real (n, k) ->
      r = switch 4*negInt(k) + 2*negInt(n) + negInt(n - k)
        when 0b000 then Math.exp lnΓ(n + 1) - lnΓ(k + 1) - lnΓ(n - k + 1)
        when 0b001 then 0
        when 0b010 then throw DomainError()
        when 0b011 then Math.pow(-1, k) * Beta k - n - 1, k
        when 0b100 then 0
        when 0b101 then ;
        when 0b110 then Math.pow(-1, n - k) * Beta Math.abs(k + 1), Math.abs(n + 1)
        when 0b111 then 0
      if isInt(n) and isInt(k) then Math.round r else r

negInt = (x) -> isInt(x) and x < 0
smallFactorials = do -> [x = 1].concat(for i in [1..25] then x *= i)
