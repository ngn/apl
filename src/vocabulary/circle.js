addVocabulary({
  '○':pervasive({
    // ○2     ←→ 6.283185307179586
    // ○2J2   ←→ 6.283185307179586J6.283185307179586
    // ○'ABC' !!! DOMAIN ERROR
    monad:numeric(
      function(x){return Math.PI*x},
      function(x){return new Z(Math.PI*x.re,Math.PI*x.im)}
    ),
    // ¯12○2          ←→ ¯0.4161468365471J0.9092974268257
    // ¯12○2j3        ←→ ¯0.02071873100224J0.04527125315609
    // ¯11○2          ←→ 0j2
    // ¯11○2j3        ←→ ¯3j2
    // ¯10○2          ←→ 2
    // ¯10○2j3        ←→ 2j¯3
    // ¯9○2           ←→ 2
    // ¯9○2j3         ←→ 2j3
    // ¯8○2           ←→ 0J¯2.2360679774998
    // ¯8○2j3         ←→ ¯2.8852305489054J2.0795565201111
    // ¯7○0.5         ←→ 0.54930614433405
    // ¯7○2           ←→ 0.5493061443340548456976226185j¯1.570796326794896619231321692
    // ¯7○2j3         ←→ 0.1469466662255297520474327852j1.338972522294493561124193576
    // ¯6○0.5         ←→ ¯1.1102230246252E¯16J1.0471975511966
    // ¯6○2           ←→ 1.316957896924816708625046347
    // ¯6○2j3         ←→ 1.983387029916535432347076903j1.000143542473797218521037812
    // ¯5○2           ←→ 1.443635475178810342493276740
    // ¯5○2j3         ←→ 1.968637925793096291788665095j0.9646585044076027920454110595
    // ¯4○2           ←→ 1.7320508075689
    // ¯4○0           ←→ 0j1
    // ¯4○¯2          ←→ ¯1.7320508075689
    // ¯4○2j3         ←→ 1.9256697360917J3.1157990841034
    // ¯3○0.5         ←→ 0.46364760900081
    // ¯3○2           ←→ 1.107148717794090503017065460
    // ¯3○2j3         ←→ 1.409921049596575522530619385j0.2290726829685387662958818029
    // ¯2○0.5         ←→ 1.0471975511966
    // ¯2○2           ←→ 0J1.316957896924816708625046347
    // ¯2○2j3         ←→ 1.000143542473797218521037812J¯1.983387029916535432347076903
    // ¯1○0.5         ←→ 0.5235987755983
    // ¯1○2           ←→ 1.570796326794896619231321692J¯1.316957896924816708625046347
    // ¯1○2j3         ←→ 0.5706527843210994007102838797J1.983387029916535432347076903
    // 0○0.5          ←→ 0.86602540378444
    // 0○2            ←→ 0J1.7320508075689
    // 0○2j3          ←→ 3.1157990841034J¯1.9256697360917
    // 1e¯10>∣.5-1○○÷6 ←→ 1 # sin(pi/6) = .5
    // 1○1            ←→ 0.8414709848079
    // 1○2j3          ←→ 9.1544991469114J¯4.1689069599666
    // 2○1            ←→ 0.54030230586814
    // 2○2j3          ←→ ¯4.1896256909688J¯9.1092278937553
    // 3○1            ←→ 1.5574077246549
    // 3○2j3          ←→ ¯0.0037640256415041J1.0032386273536
    // 4○2            ←→ 2.2360679774998
    // 4○2j3          ←→ 2.0795565201111J2.8852305489054
    // 5○2            ←→ 3.626860407847
    // 5○2j3          ←→ ¯3.5905645899858J0.53092108624852
    // 6○2            ←→ 3.7621956910836
    // 6○2j3          ←→ ¯3.7245455049153J0.51182256998738
    // 7○2            ←→ 0.96402758007582
    // 7○2j3          ←→ 0.96538587902213J¯0.0098843750383225
    // 8○2            ←→ 0J2.2360679774998
    // 8○2j3          ←→ 2.8852305489054J¯2.0795565201111
    // 9○2            ←→ 2
    // 9○2j3          ←→ 2
    // 10○¯2          ←→ 2
    // 10○¯2j3        ←→ 3.605551275464
    // 11○2           ←→ 0
    // 11○2j3         ←→ 3
    // 12○2           ←→ 0
    // 12○2j3         ←→ 0.98279372324733
    // 1○'hello'      !!! DOMAIN ERROR
    // 99○1           !!! DOMAIN ERROR
    // 99○1j2         !!! DOMAIN ERROR
    dyad:function(x,i){
      if(typeof x==='number'){
        switch(i){
          case-12:return Z.exp(simplify(0,x))
          case-11:return simplify(0,x)
          case-10:return x
          case -9:return x
          case -8:return simplify(0,-Math.sqrt(1+x*x))
          case -7:return Z.atanh(x)
          case -6:return Z.acosh(x)
          case -5:return Z.asinh(x)
          case -4:var t=Z.sqrt(x*x-1);return x<-1?-t:t
          case -3:return Z.atan(x)
          case -2:return Z.acos(x)
          case -1:return Z.asin(x)
          case  0:return Z.sqrt(1-x*x)
          case  1:return Math.sin(x)
          case  2:return Math.cos(x)
          case  3:return Math.tan(x)
          case  4:return Math.sqrt(1+x*x)
          case  5:var a=Math.exp(x),b=1/a;return(a-b)/2     // sinh
          case  6:var a=Math.exp(x),b=1/a;return(a+b)/2     // cosh
          case  7:var a=Math.exp(x),b=1/a;return(a-b)/(a+b) // tanh
          case  8:return Z.sqrt(-1-x*x)
          case  9:return x
          case 10:return Math.abs(x)
          case 11:return 0
          case 12:return 0
          default:domainError('Unknown circular or hyperbolic function:'+i)
        }
      }else if(x instanceof Z){
        switch(i){
          case -12:return Z.exp(simplify(-x.im,x.re))
          case -11:return Z.itimes(x)
          case -10:return Z.conjugate(x)
          case  -9:return x
          case  -8:return Z.negate(Z.sqrt(Z.subtract(-1,Z.multiply(x,x))))
          case  -7:return Z.atanh(x)
          case  -6:return Z.acosh(x)
          case  -5:return Z.asinh(x)
          case  -4:
            if(x.re===-1&&!x.im)return 0
            var a=Z.add(x,1),b=Z.subtract(x,1);return Z.multiply(a,Z.sqrt(Z.divide(b,a)))
          case  -3:return Z.atan(x)
          case  -2:return Z.acos(x)
          case  -1:return Z.asin(x)
          case   0:return Z.sqrt(Z.subtract(1,Z.multiply(x,x)))
          case   1:return Z.sin(x)
          case   2:return Z.cos(x)
          case   3:return Z.tan(x)
          case   4:return Z.sqrt(Z.add(1,Z.multiply(x,x)))
          case   5:return Z.sinh(x)
          case   6:return Z.cosh(x)
          case   7:return Z.tanh(x)
          case   8:return Z.sqrt(Z.subtract(-1,Z.multiply(x,x)))
          case   9:return x.re
          case  10:return Z.magnitude(x)
          case  11:return x.im
          case  12:return Z.direction(x)
          default:domainError('Unknown circular or hyperbolic function:'+i)
        }
      }else{
        domainError()
      }
    }
  })
})
