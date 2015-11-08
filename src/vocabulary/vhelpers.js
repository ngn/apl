var vocabulary={}
function addVocabulary(h){for(var k in h)vocabulary[k]=h[k]}

// pervasive() is a higher-order function
//
// Consider a function that accepts and returns only scalars.  To make it
// pervasive means to make it work with any-dimensional arrays, too.
//
// What pervasive() actually does is to take two versions of a scalar function
// (a monadic and a dyadic one), make them pervasive, and combine them into a
// single function that dispatches based on the number of arguments.
function pervasive(h){
  var monad=h.monad,dyad=h.dyad
  var pervadeMonadic=!monad?nonceError:function(x){
    if(x instanceof A)return x.map(pervadeMonadic)
    var r=monad(x);typeof r==='number'&&r!==r&&domainError('NaN');return r
  }
  var pervadeDyadic=!dyad?nonceError:function(x,y){
    // tx,ty: 0=unwrapped scalar; 1=singleton array; 2=non-singleton array
    var tx=x instanceof A?(x.isSingleton()?20:30):10
    var ty=y instanceof A?(y.isSingleton()? 2: 3): 1
    switch(tx+ty){ // todo: use the larger shape when tx=10 and ty=1
      case 11:        var r=dyad(x,y);typeof r==='number'&&r!==r&&domainError('NaN');return r
      case 12:case 13:return y.map(function(yi){return pervadeDyadic(x,yi)})
      case 21:case 31:return x.map(function(xi){return pervadeDyadic(xi,y)})
      case 23:        xi=x.data[x.offset];return y.map(function(yi){return pervadeDyadic(xi,yi)})
      case 32:case 22:yi=y.data[y.offset];return x.map(function(xi){return pervadeDyadic(xi,yi)})
      case 33:
        x.shape.length!==y.shape.length&&rankError()
        x.shape!=''+y.shape&&lengthError()
        return x.map2(y,pervadeDyadic)
      default:assert(0)
    }
  }
  return function(om,al){
    assert(om instanceof A);assert(al instanceof A||al==null)
    return(al!=null?pervadeDyadic:pervadeMonadic)(om,al)
  }
}
function real(f){return function(x,y,axis){
  return typeof x!=='number'||y!=null&&typeof y!=='number'?domainError():f(x,y,axis)
}}
function numeric(f,g){return function(x,y,axis){
  return(typeof x!=='number'||y!=null&&typeof y!=='number'?g(complexify(x),y==null?y:complexify(y),axis):f(x,y,axis))
}}
function match(x,y){
  if(x instanceof A){
    if(!(y instanceof A)||x.shape!=''+y.shape)return 0
    var r=1;each2(x,y,function(xi,yi){r&=match(xi,yi)});return r
  }else{
    if(y instanceof A)return 0
    if(x instanceof Z&&y instanceof Z)return x.re===y.re&&x.im===y.im
    return x===y
  }
}
function numApprox(x,y){return x===y||Math.abs(x-y)<1e-11}
function approx(x,y){
  // approx() is like match(), but it is tolerant to precision errors;
  // used for comparing expected and actual results in doctests
  if(x instanceof A){
    if(!(y instanceof A))return 0
    if(x.shape.length!==y.shape.length)return 0
    if(x.shape!=''+y.shape)return 0
    var r=1;each2(x,y,function(xi,yi){r&=approx(xi,yi)});return r
  }else{
    if(y instanceof A)return 0
    if(x==null||y==null)return 0
    if(typeof x==='number')x=new Z(x)
    if(typeof y==='number')y=new Z(y)
    if(x instanceof Z)return y instanceof Z&&numApprox(x.re,y.re)&&numApprox(x.im,y.im)
    return x===y
  }
}
function bool(x){return(x&1)!==x?domainError():x}
function getAxisList(axes,rank){
  assert(isInt(rank,0))
  if(axes==null)return[]
  assert(axes instanceof A)
  if(axes.shape.length!==1||axes.shape[0]!==1)syntaxError() // [sic]
  var a=axes.unwrap()
  if(a instanceof A){
    a=a.toArray()
    for(var i=0;i<a.length;i++){
      isInt(a[i],0,rank)||domainError()
      a.indexOf(a[i])<i&&domainError('Non-unique axes')
    }
    return a
  }else if(isInt(a,0,rank)){
    return[a]
  }else{
    domainError()
  }
}
function withIdentity(x,f){f.identity=x instanceof A?x:A.scalar(x);return f}
function adverb     (f){f.isAdverb     =1;return f}
function conjunction(f){f.isConjunction=1;return f}
function cps        (f){f.cps          =1;return f}
