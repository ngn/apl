`
function assert(x){if(!x)throw Error('assertion failed')}
function isInt(x,start,end){return x===~~x&&(start==null||start<=x&&(end==null||x<end))}
function prod(a){var r=1;for(var i=0;i<a.length;i++)r*=a[i];return r}
function all(a){for(var i=0;i<a.length;i++)if(!a[i])return;return 1}
function extend(x,y){for(var k in y)x[k]=y[k];return x}
function formatNumber(x){return(''+x).replace('Infinity','∞').replace(/-/g,'¯')}
function repeat(a,n){ // catenates "n" instances of a string or array "a"
  assert(a.length!=null)
  assert(isInt(n,0))
  if(!n)return a.slice(0,0)
  var m=n*a.length;while(a.length*2<m)a=a.concat(a)
  return a.concat(a.slice(0,m-a.length))
}
this.Uint8Array =this.Uint8Array ||Array
this.Uint16Array=this.Uint16Array||Array
this.Uint32Array=this.Uint32Array||Array
this.Int8Array  =this.Int8Array  ||Array
this.Int16Array =this.Int16Array ||Array
this.Int32Array =this.Int32Array ||Array
Array.prototype.set=Array.prototype.set||function(a,i0){for(var i=0;i<a.length;i++)this[i0+i]=a[i]}
function spread(a,i,m,n){ // repeat the pattern a[i...i+m] so it covers a[i...i+n]
  if(a instanceof Array){for(var j=m;j<n;j++)a[i+j]=a[i+j%m]}
  else{a=a.subarray(i,i+n);while(2*m<n){a.set(a.subarray(0,m),m);m*=2};a.set(a.subarray(0,n-m),m)}
}
function arrayEquals(x,y){
  assert(x.length!=null)
  assert(y.length!=null)
  if(x.length!==y.length)return 0
  for(var i=0;i<x.length;i++)if(x[i]!==y[i])return 0
  return 1
}
function reversed(a){
  if(a instanceof Array)return a.slice(0).reverse()
  var i=-1,j=a.length,b=new a.constructor(a.length);b.set(a)
  while(++i<--j){var h=b[i];b[i]=b[j];b[j]=h}
  return b
}
String.prototype.includes=String.prototype.includes||function(){
  'use strict';return String.prototype.indexOf.apply(this,arguments)!==-1
}
`
