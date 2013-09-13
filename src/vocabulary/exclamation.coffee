{pervasive, real, withIdentity} = require './vhelpers'
{isInt} = require '../helpers'
{APLArray} = require '../array'

@['!'] = withIdentity APLArray.one, pervasive

  # Factorial (`!`)
  #
  # !5    <=> 120
  # !21   <=> 51090942171709440000
  # !0    <=> 1
  monad: real (x) ->
    if isInt x, 0, 25
      r = 1; i = 2; (while i <= x then r *= i++); r
    else if x < -150
      0
    else if x > 150
      1 / 0
    else
      Gamma(x + 1)

  # Binomial (`!`)
  #
  # 2 ! 4       <=> 6
  # 3 ! 20      <=> 1140
  # 2 ! 6 12 20 <=> 15 66 190
  # (2 3⍴1+⍳6)!2 3⍴3 6 9 12 15 18 <=> 2 3⍴ 3 15 84 495 3003 18564
  # 0.5!1       <=> 1.2732395447351612
  # 1.2!3.4     <=> 3.795253463731253
  # !/⍬         <=> 1
  dyad: real (n, k) ->
    if isInt(k, 0, 100) and isInt(n, 0, 100)
      if n < k then return 0
      if 2 * k > n then k = n - k # do less work
      u = v = 1
      for i in [0...k] by 1 then (u *= n - i; v *= i + 1)
      u / v
    else
      Gamma(n + 1) / (Gamma(k + 1) * Gamma(n - k + 1))

Gamma = (x) ->
  p = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
       771.32342877765313, -176.61502916214059, 12.507343278686905,
       -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7]
  if x < 0.5 then return Math.PI / (Math.sin(Math.PI * x) * Gamma(1 - x))
  x--
  a = p[0]
  t = x + 7.5
  for i in [1...p.length]
    a += p[i] / (x + i)
  return Math.sqrt(2 * Math.PI) * Math.pow(t, x + 0.5) * Math.exp(-t) * a
