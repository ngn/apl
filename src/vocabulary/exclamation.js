var Beta
addVocabulary({

  '!':withIdentity(1,pervasive({

    // !5    ←→ 120
    // !21   ←→ 51090942171709440000
    // !0    ←→ 1
    // !1.5  ←→ 1.3293403881791
    // !¯1.5 ←→ ¯3.544907701811
    // !¯2.5 ←→ 2.3632718012074
    // !¯200.5 ←→ 0
    // !¯1   !!! DOMAIN ERROR
    // !¯200 !!! DOMAIN ERROR
    monad:real(function(x){
      return!isInt(x)?Γ(x+1):x<0?domainError():x<smallFactorials.length?smallFactorials[x]:Math.round(Γ(x+1))
    }),

    // 2!4       ←→ 6
    // 3!20      ←→ 1140
    // 2!6 12 20 ←→ 15 66 190
    // (2 3⍴1+⍳6)!2 3⍴3 6 9 12 15 18 ←→ 2 3⍴3 15 84 495 3003 18564
    // 0.5!1     ←→ 1.2732395447351612
    // 1.2!3.4   ←→ 3.795253463731253
    // !/⍬       ←→ 1
    // (2!1000)=499500 ←→ 1
    // (998!1000)=499500 ←→ 1
    //
    //                Negative integer?  Expected
    //                   ⍺   ⍵  ⍵-⍺       Result
    //                  -----------     ----------
    // 3!5   ←→ 10  #    0   0   0      (!⍵)÷(!⍺)×!⍵-⍺
    // 5!3   ←→ 0   #    0   0   1      0
    // see below    #    0   1   0      Domain Error
    // 3!¯5  ←→ ¯35 #    0   1   1      (¯1*⍺)×⍺!⍺-⍵+1
    // ¯3!5  ←→ 0   #    1   0   0      0
    //              #    1   0   1      Cannot arise
    // ¯5!¯3 ←→ 6   #    1   1   0      (¯1*⍵-⍺)×(|⍵+1)!(|⍺+1)
    // ¯3!¯5 ←→ 0   #    1   1   1      0
    //
    // 0.5!¯1 !!! DOMAIN ERROR
    dyad:Beta=real(function(n,k){
      var r;
      switch(256*negInt(k)+16*negInt(n)+negInt(n-k)){
        case 0x000:r=Math.exp(lnΓ(n+1)-lnΓ(k+1)-lnΓ(n-k+1))            ;break
        case 0x001:r=0                                                 ;break
        case 0x010:r=domainError()                                     ;break
        case 0x011:r=Math.pow(-1,k)*Beta(k-n-1,k)                      ;break
        case 0x100:r=0                                                 ;break
        case 0x101:assert(0)                                           ;break
        case 0x110:r=Math.pow(-1,n-k)*Beta(Math.abs(k+1),Math.abs(n+1));break
        case 0x111:r=0                                                 ;break
      }
      return isInt(n)&&isInt(k)?Math.round(r):r
    })
  }))
})


function negInt(x){return isInt(x)&&x<0}
var smallFactorials=[1];(function(){var x=1;for(var i=1;i<=25;i++)smallFactorials.push(x*=i)}())

var Γ,lnΓ
;(function(){
  var g=7
  var p=[0.99999999999980993,676.5203681218851,-1259.1392167224028,771.32342877765313,-176.61502916214059,
         12.507343278686905,-0.13857109526572012,9.9843695780195716e-6,1.5056327351493116e-7]
  var g_ln=607/128
  var p_ln=[0.99999999999999709182,57.156235665862923517,-59.597960355475491248,14.136097974741747174,
            -0.49191381609762019978,0.33994649984811888699e-4,0.46523628927048575665e-4,-0.98374475304879564677e-4,
            0.15808870322491248884e-3,-0.21026444172410488319e-3,0.21743961811521264320e-3,-0.16431810653676389022e-3,
            0.84418223983852743293e-4,-0.26190838401581408670e-4,0.36899182659531622704e-5]
  // Spouge approximation (suitable for large arguments)
  lnΓ=function(z){
    if(z<0)return NaN
    var x=p_ln[0];for(var i=p_ln.length-1;i>0;i--)x+=p_ln[i]/(z+i)
    var t=z+g_ln+.5
    return.5*Math.log(2*Math.PI)+(z+.5)*Math.log(t)-t+Math.log(x)-Math.log(z)
  }
  Γ=function(z){
    if(z<.5)return Math.PI/(Math.sin(Math.PI*z)*Γ(1-z))
    if(z>100)return Math.exp(lnΓ(z))
    z--;x=p[0];for(var i=1;i<g+2;i++)x+=p[i]/(z+i)
    t=z+g+.5
    return Math.sqrt(2*Math.PI)*Math.pow(t,z+.5)*Math.exp(-t)*x
  }
}())
