// complexify(x)
// * if x is real, it's converted to a complex instance with imaginary part 0
// * if x is already complex, it's preserved
function complexify(x){return typeof x==='number'?new Z(x,0):x instanceof Z?x:domainError()}

// simplify(re, im)
// * if the imaginary part is 0, the real part is returned
// * otherwise, a complex instance is created
function simplify(re,im){return im===0?re:new Z(re,im)}

function Z(re,im){ // complex number constructor
  assert(typeof re==='number')
  assert(typeof im==='number'||im==null)
  if(re!==re||im!==im)domainError('NaN')
  this.re=re;this.im=im||0
}
Z.prototype.toString=function(){return formatNumber(this.re)+'J'+formatNumber(this.im)}
Z.prototype.repr=function(){return'new Z('+repr(this.re)+','+repr(this.im)+')'}

Z.exp=function(x){x=complexify(x);var r=Math.exp(x.re);return simplify(r*Math.cos(x.im),r*Math.sin(x.im))}
Z.log=function(x){
  if(typeof x==='number'&&x>0){return Math.log(x)}
  else{x=complexify(x);return simplify(Math.log(Math.sqrt(x.re*x.re+x.im*x.im)),Z.direction(x))}
}
Z.conjugate=function(x){return new Z(x.re,-x.im)}
Z.negate   =function(x){return new Z(-x.re,-x.im)}
Z.itimes   =function(x){x=complexify(x);return simplify(-x.im,x.re)}
Z.negitimes=function(x){x=complexify(x);return simplify(x.im,-x.re)}
Z.add      =function(x,y){x=complexify(x);y=complexify(y);return simplify(x.re+y.re,x.im+y.im)}
Z.subtract =function(x,y){x=complexify(x);y=complexify(y);return simplify(x.re-y.re,x.im-y.im)}
Z.multiply =function(x,y){x=complexify(x);y=complexify(y);return simplify(x.re*y.re-x.im*y.im,x.re*y.im+x.im*y.re)}
Z.divide   =function(x,y){x=complexify(x);y=complexify(y);var d=y.re*y.re+y.im*y.im
                          return simplify((x.re*y.re+x.im*y.im)/d,(y.re*x.im-y.im*x.re)/d) }

// ¯1 ¯2 ¯3 ¯4*2 ←→ 1 4 9 16
// 0j1*2 ←→ ¯1
// 1j2*3 ←→ ¯11j¯2
// .5j1.5*5 ←→ 9.875j¯0.375
Z.pow=function(x,y){
  if(typeof x==='number'&&typeof y==='number'&&(x>=0||isInt(y)))return Math.pow(x,y)
  if(typeof y==='number'&&isInt(y,0)){var r=1;while(y){(y&1)&&(r=Z.multiply(r,x));x=Z.multiply(x,x);y>>=1};return r}
  return Z.exp(Z.multiply(y,Z.log(x)))
}
Z.sqrt=function(x){return typeof x==='number'&&x>=0?Math.sqrt(x):Z.pow(x,.5)}
Z.magnitude=function(x){return Math.sqrt(x.re*x.re+x.im*x.im)}
Z.direction=function(x){return Math.atan2(x.im,x.re)}
Z.sin=function(x){return Z.negitimes(Z.sinh(Z.itimes(x)))}
Z.cos=function(x){return Z.cosh(Z.itimes(x))}
Z.tan=function(x){return Z.negitimes(Z.tanh(Z.itimes(x)))}

// arcsin x = -i ln(ix + sqrt(1 - x^2))
// arccos x = -i ln(x + i sqrt(x^2 - 1))
// arctan x = (i/2) (ln(1-ix) - ln(1+ix))
Z.asin=function(x){x=complexify(x);return Z.negitimes(Z.log(Z.add(Z.itimes(x),Z.sqrt(Z.subtract(1,Z.pow(x,2))))))}
Z.acos=function(x){
  x=complexify(x);r=Z.negitimes(Z.log(Z.add(x,Z.sqrt(Z.subtract(Z.pow(x,2),1)))))
  // TODO look up the algorithm for determining the sign of arccos; the following line is dubious
  return r instanceof Z&&(r.re<0||(r.re===0&&r.im<0))?Z.negate(r):r
}
Z.atan=function(x){
  x=complexify(x);ix=Z.itimes(x)
  return Z.multiply(new Z(0,.5),Z.subtract(Z.log(Z.subtract(1,ix)),Z.log(Z.add(1,ix))))
}

Z.sinh=function(x){var a=Z.exp(x);return Z.multiply(.5,Z.subtract(a,Z.divide(1,a)))}
Z.cosh=function(x){var a=Z.exp(x);return Z.multiply(.5,Z.add(a,Z.divide(1,a)))}
Z.tanh=function(x){var a=Z.exp(x),b=Z.divide(1,a);return Z.divide(Z.subtract(a,b),Z.add(a,b))}

// arcsinh x =     i arcsin(-ix)
// arccosh x = +/- i arccos(x)
// arctanh x =     i arctan(-ix)
Z.asinh=function(x){return Z.itimes(Z.asin(Z.negitimes(x)))}
Z.acosh=function(x){x=complexify(x);var sign=x.im>0||(!x.im&&x.re<=1)?1:-1;return Z.multiply(new Z(0,sign),Z.acos(x))}
Z.atanh=function(x){return Z.itimes(Z.atan(Z.negitimes(x)))}

Z.floor = function(x){
  if(typeof x==='number')return Math.floor(x)
  x=complexify(x)
  var re=Math.floor(x.re),im=Math.floor(x.im),r=x.re-re,i=x.im-im
  if(r+i>=1)r>=i?re++:im++
  return simplify(re,im)
}
Z.ceil=function(x){
  if(typeof x==='number')return Math.ceil(x)
  x=complexify(x)
  var re=Math.ceil(x.re),im=Math.ceil(x.im),r=re-x.re,i=im-x.im
  if(r+i>=1)r>=i?re--:im--
  return simplify(re,im)
}

function iszero(x){return!x||(x instanceof Z&&!x.re&&!x.im)}

Z.residue=function(x,y){return(typeof x==='number'&&typeof y==='number'?(x?y-x*Math.floor(y/x):y)
                                       :iszero(x)?y:Z.subtract(y,Z.multiply(x,Z.floor(Z.divide(y,x)))))}

Z.isint=function(x){return typeof x==='number'?x===Math.floor(x):x.re===Math.floor(x.re)&&x.im===Math.floor(x.im)}

function firstquadrant(x){ // rotate into first quadrant
  if(typeof x==='number'){return Math.abs(x)}
  else{x.re<0&&(x=Z.negate(x));x.im<0&&(x=Z.itimes(x));return x.re?x:x.im}
}
Z.gcd=function(x,y){
  if(typeof x==='number'&&typeof y==='number'){
    while(y){var z=y;y=x%y;x=z}
    return Math.abs(x)
  }else{
    while(!iszero(y)){var z=y;y=Z.residue(y,x);x=z}
    return firstquadrant(x)
  }
}
Z.lcm=function(x,y){var p=Z.multiply(x,y);return iszero(p)?p:Z.divide(p,Z.gcd(x,y))}
