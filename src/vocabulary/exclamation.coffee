addVocabulary

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
      if !isInt x then Γ(x + 1)
      else if x < 0 then domainError()
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
        when 0b010 then domainError()
        when 0b011 then Math.pow(-1, k) * Beta k - n - 1, k
        when 0b100 then 0
        when 0b101 then ;
        when 0b110 then Math.pow(-1, n - k) * Beta Math.abs(k + 1), Math.abs(n + 1)
        when 0b111 then 0
      if isInt(n) and isInt(k) then Math.round r else r

negInt = (x) -> isInt(x) and x < 0
smallFactorials = do -> [x = 1].concat(for i in [1..25] then x *= i)

{Γ, lnΓ} = do ->
  g = 7
  p = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7]
  g_ln = 607/128
  p_ln = [0.99999999999999709182, 57.156235665862923517, -59.597960355475491248, 14.136097974741747174, -0.49191381609762019978, 0.33994649984811888699e-4, 0.46523628927048575665e-4, -0.98374475304879564677e-4, 0.15808870322491248884e-3, -0.21026444172410488319e-3, 0.21743961811521264320e-3, -0.16431810653676389022e-3, 0.84418223983852743293e-4, -0.26190838401581408670e-4, 0.36899182659531622704e-5]

  # Spouge approximation (suitable for large arguments)
  lnΓ: (z) ->
    if z < 0 then return NaN
    x = p_ln[0]
    for i in [p_ln.length - 1 ... 0] by -1 then x += p_ln[i] / (z + i)
    t = z + g_ln + .5
    .5*Math.log(2*Math.PI)+(z+.5)*Math.log(t)-t+Math.log(x)-Math.log(z)

  Γ: (z) ->
    if z < 0.5 then Math.PI / (Math.sin(Math.PI * z) * Γ(1 - z))
    else if z > 100 then Math.exp lnΓ z
    else
      z--
      x = p[0]
      for i in [1...g+2] by 1 then x += p[i] / (z + i)
      t = z + g + .5
      Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x
