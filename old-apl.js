//usr/bin/env node "$0" $@;exit $?
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
function aplError(name,m,o){ // m:message, o:options
  m=m||''
  if(o&&o.aplCode&&o.offset!=null){
    var a=o.aplCode.slice(0,o.offset).split('\n')
    var l=a.length,c=1+(a[a.length-1]||'').length // line and column
    m+='\n'+(o.file||'-')+':'+l+':'+c+o.aplCode.split('\n')[l-1]+'_'.repeat(c-1)+'^'
  }
  var e=Error(m);e.name=name;for(var k in o)e[k]=o[k]
  throw e
}
function syntaxError(m,o){aplError('SYNTAX ERROR',m,o)}
function domainError(m,o){aplError('DOMAIN ERROR',m,o)}
function lengthError(m,o){aplError('LENGTH ERROR',m,o)}
function   rankError(m,o){aplError(  'RANK ERROR',m,o)}
function  indexError(m,o){aplError( 'INDEX ERROR',m,o)}
function  nonceError(m,o){aplError( 'NONCE ERROR',m,o)}
function  valueError(m,o){aplError( 'VALUE ERROR',m,o)}
function each(a,f){ // iterates through the elements of an APL array in ravel order.
  if(a.empty())return
  var data=a.data,shape=a.shape,stride=a.stride,lastAxis=shape.length-1,p=a.offset,i=[],axis=shape.length
  while(--axis>=0)i.push(0)
  while(1){
    f(data[p],i,p)
    axis=lastAxis
    while(axis>=0&&i[axis]+1===shape[axis]){
      p-=i[axis]*stride[axis];i[axis--]=0
    }
    if(axis<0)break
    i[axis]++
    p+=stride[axis]
  }
}
function each2(a,b,f){ // like each() but iterates over two APL array in parallel
  var data =a.data,shape =a.shape,stride =a.stride
  var data1=b.data,shape1=b.shape,stride1=b.stride
  shape.length!==shape1.length&&rankError()
  shape!=''+shape1&&lengthError() // abuse JS type coercion -- compare the shapes as strings
  if(a.empty())return
  var lastAxis=shape.length-1,p=a.offset,q=b.offset
  var i=Array(shape.length);for(var j=0;j<i.length;j++)i[j]=0
  while(1){
    f(data[p],data1[q],i)
    var axis = lastAxis
    while(axis>=0&&i[axis]+1===shape[axis]){p-=i[axis]*stride[axis];q-=i[axis]*stride1[axis];i[axis--]=0}
    if(axis<0)break
    i[axis]++;p+=stride[axis];q+=stride1[axis]
  }
}

function A(data,shape,stride,offset){ // APL array constructor
  this.data=data
  this.shape=shape||[this.data.length]
  this.stride=stride||strideForShape(this.shape)
  this.offset=offset||0
  assert(this.data.length!=null)
  assert(this.shape.length!=null)
  assert(this.stride.length!=null)
  assert(!this.data.length||isInt(this.offset,0,this.data.length))
  assert(this.stride.length===this.shape.length)
  for(var i=0;i<this.shape.length;i++)assert(isInt(this.shape[i],0))
  if(this.data.length)for(var i=0;i<this.stride.length;i++)assert(isInt(this.stride[i],-this.data.length,this.data.length+1))
}
extend(A.prototype,{
  empty: function(){var shape=this.shape;for(var i=0;i<shape.length;i++)if(!shape[i])return 1;return 0},
  map:function(f){var r=[];each(this,function(x,i,p){r.push(f(x,i,p))});return new A(r,this.shape)},
  map2:function(a,f){var r=[];each2(this,a,function(x,y,i){r.push(f(x,y,i))});return new A(r,this.shape)},
  toArray:function(){var r=[];each(this,function(x){r.push(x)});return r},
  toInt:function(m,M){var r=this.unwrap();if(r!==r|0||m!=null&&r<m||M!=null&&M<=r)domainError();return r},
  toBool:function(){return this.toInt(0,2)},
  toSimpleString:function(){
    if(this.shape.length>1)rankError()
    if(typeof this.data==='string'){
      if(!this.shape.length)return this.data[this.offset]
      if(!this.shape[0])return''
      if(this.stride[0]===1)return this.data.slice(this.offset,this.offset+this.shape[0])
      return this.toArray().join('')
    }else{
      var a=this.toArray()
      for(var i=0;i<a.length;i++)typeof a[i]!=='string'&&domainError()
      return a.join('')
    }
  },
  isSingleton:function(){var s=this.shape;for(var i=0;i<s.length;i++)if(s[i]!==1)return 0;return 1},
  isSimple:function(){return!this.shape.length&&!(this.data[this.offset]instanceof A)},
  unwrap:function(){this.isSingleton()||lengthError();return this.data[this.offset]},
  getPrototype:function(){return this.empty()||typeof this.data[this.offset]!=='string'?0:' '}, // todo
  toString:function(){return format(this).join('\n')},
  repr:function(){return'new A('+repr(this.data)+','+repr(this.shape)+','+repr(this.stride)+','+repr(this.offset)+')'}
})
function strideForShape(shape){
  assert(shape.length!=null)
  if(!shape.length)return[]
  var r=Array(shape.length)
  r[r.length-1]=1
  for(var i=r.length-2;i>=0;i--){
    assert(isInt(shape[i],0))
    r[i]=r[i+1]*shape[i+1]
  }
  return r
}
A.zero =new A([0],[])
A.one  =new A([1],[])
A.zilde=new A([],[0])
A.scalar=function(x){return new A([x],[])}
A.bool=[A.zero,A.one]
var prelude={"code":[1,new A([],[0],[1],0),4,0,73,9,1,new A("ABCDEFGHIJKLMNOPQRSTUVWXYZ",[26],[1],0),4,0,84,9,1,new A("ÁÂÃÇÈÊËÌÍÎÏÐÒÓÔÕÙÚÛÝþãìðòõ",[26],[1],0),4,0,85,9,7,22,3,1,2,3,0,65,3,1,0,3,0,29,3,1,2,6,3,0,44,5,6,8,3,0,72,3,0,44,6,4,0,44,9,7,39,7,15,3,2,0,3,1,0,5,3,1,2,3,2,2,6,8,3,0,72,7,15,3,2,0,3,1,0,5,3,1,2,3,2,0,6,8,6,8,4,0,74,9,7,173,3,1,2,3,0,62,5,3,0,62,5,3,0,16,1,new A([1],[],[],0),6,11,8,9,1,new A("RANK ERROR",[10],[1],0),3,0,61,5,8,9,3,1,0,4,1,4,9,3,1,2,7,123,3,2,0,3,0,62,5,3,0,62,5,3,0,16,1,new A([1],[],[],0),6,11,8,9,1,new A("RANK ERROR",[10],[1],0),3,0,61,5,8,9,3,2,0,3,0,13,5,4,2,0,9,3,1,4,3,0,62,5,3,0,62,5,3,0,15,3,2,0,3,0,62,5,6,11,8,9,1,new A("RANK ERROR",[10],[1],0),3,0,61,5,8,9,3,1,4,3,0,62,5,3,0,19,3,2,0,6,3,0,45,3,0,65,5,5,11,8,9,1,new A("INDEX ERROR",[11],[1],0),3,0,61,5,8,9,3,1,4,3,0,67,3,2,0,6,3,0,75,5,4,1,4,8,3,0,27,5,5,9,3,1,4,8,3,0,72,7,229,3,1,0,3,0,62,5,3,0,62,5,3,0,14,1,new A([0],[],[],0),6,11,9,9,3,1,0,3,0,70,5,8,9,3,1,0,3,0,62,5,3,0,3,3,0,65,5,5,3,0,14,1,new A([0],[],[],0),6,11,5,9,3,1,0,8,9,3,1,0,3,0,62,5,4,1,4,9,3,1,0,3,0,13,5,4,1,0,9,3,1,0,3,0,62,3,0,27,5,5,4,1,5,3,0,79,3,0,27,5,5,3,0,35,3,0,65,5,5,4,1,6,9,3,1,5,3,0,13,3,0,21,1,new A([1],[],[],0),3,0,62,3,1,6,6,6,3,0,36,3,0,26,6,3,0,37,3,0,62,6,3,0,27,5,5,4,1,5,3,0,35,3,0,65,5,5,3,0,70,5,4,1,7,9,3,1,0,7,18,3,2,0,3,0,62,3,2,2,6,3,0,70,3,1,7,6,8,3,0,27,5,3,1,5,6,3,0,76,3,0,65,5,5,3,0,70,5,3,0,62,3,1,7,3,0,13,3,1,4,6,6,8,6,4,0,75,9,7,335,3,1,2,3,0,62,5,3,0,62,5,3,0,16,1,new A([1],[],[],0),6,11,8,9,1,new A("RANK ERROR",[10],[1],0),3,0,61,5,8,9,3,1,0,3,0,62,5,3,0,62,5,3,0,15,1,new A([1],[],[],0),6,11,8,9,1,new A("NONCE ERROR",[11],[1],0),3,0,61,5,8,9,1,new A([0],[],[],0),3,0,14,3,1,2,6,3,0,13,5,4,1,2,9,3,1,2,3,0,33,1,new A([1,1],[2],[1],0),6,3,0,44,5,4,1,4,9,3,1,2,3,0,65,3,1,4,6,4,1,5,9,3,1,0,3,0,65,3,1,4,6,4,1,6,9,3,0,73,7,52,3,1,5,3,0,70,1,new A([1],[],[],0),6,3,0,14,1,new A([1],[],[],0),6,11,34,9,3,0,73,7,26,3,1,5,3,0,26,1,new A([1],[],[],0),6,4,1,5,9,3,1,6,3,0,26,1,new A([1],[],[],0),6,4,1,6,8,5,8,8,5,9,3,0,73,7,52,3,1,5,3,0,70,1,new A([-1],[],[],0),6,3,0,14,1,new A([1],[],[],0),6,11,34,9,3,0,73,7,26,3,1,5,3,0,26,1,new A([-1],[],[],0),6,4,1,5,9,3,1,6,3,0,26,1,new A([-1],[],[],0),6,4,1,6,8,5,8,8,5,9,3,1,5,3,0,62,5,3,0,42,5,3,0,65,3,1,5,6,3,0,13,3,0,81,5,3,1,5,3,0,62,5,6,4,1,5,9,1,new A([0],[],[],0),4,1,7,9,3,1,6,3,0,43,5,7,38,3,2,0,3,0,70,3,2,2,6,3,0,26,3,1,7,6,4,2,4,9,1,new A([1],[],[],0),3,0,0,3,2,2,6,4,1,7,9,3,2,4,8,3,0,27,5,3,1,5,6,8,3,0,72,3,0,43,6,4,0,43,9,7,235,3,1,2,3,0,62,5,3,0,62,5,3,0,16,1,new A([1],[],[],0),6,11,8,9,1,new A("RANK ERROR",[10],[1],0),3,0,61,5,8,9,3,1,2,3,0,13,5,4,1,4,9,3,1,0,7,46,3,2,0,3,0,62,5,3,0,62,5,3,0,14,1,new A([0],[],[],0),6,11,22,9,3,2,0,3,0,62,1,new A([1],[],[],0),3,0,62,3,1,4,3,0,62,5,6,6,8,9,3,2,0,8,5,4,1,0,9,3,1,0,3,0,62,5,3,0,62,5,3,0,17,3,1,4,3,0,62,5,6,11,8,9,1,new A("RANK ERROR",[10],[1],0),3,0,61,5,8,9,3,1,4,3,0,70,3,1,0,3,0,62,5,3,0,62,5,6,4,1,4,9,3,1,0,3,0,62,5,3,0,0,3,1,4,6,3,0,35,1,new A([0],[],[],0),6,3,0,3,1,new A([0],[],[],0),3,0,18,3,1,4,6,6,3,0,0,3,1,0,3,0,62,5,3,0,1,3,1,4,6,3,0,34,1,new A([0],[],[],0),6,3,0,3,1,new A([0],[],[],0),3,0,17,3,1,4,6,6,6,4,1,4,9,3,1,0,3,0,70,3,1,4,6,8,3,0,72,7,60,3,1,0,3,0,62,5,3,0,62,5,3,0,14,1,new A([0],[],[],0),6,11,5,9,3,1,0,8,9,3,1,0,3,1,0,3,0,62,5,3,0,62,5,3,0,0,1,new A([-1],[],[],0),6,2,1,1,new A([0],[1],[1],0),2,2,3,0,68,3,0,43,6,5,8,6,4,0,26,9,7,23,3,1,0,1,new A([0],[],[],0),2,1,1,new A([0],[1],[1],0),2,2,3,0,68,3,0,13,6,3,1,2,6,8,3,0,72,7,38,3,1,0,3,0,62,3,1,0,3,0,79,5,3,1,0,3,0,62,5,3,0,26,1,new A([1],[],[],0),6,3,0,3,3,0,65,5,5,2,2,6,8,6,4,0,76,9,7,4,3,1,0,8,4,0,77,9,7,4,3,1,2,8,3,0,72,7,4,3,1,0,8,6,4,0,78,9,7,15,3,1,0,3,0,20,3,1,2,6,3,0,44,5,8,3,0,72,7,21,1,new A([1],[],[],0),3,0,13,3,1,0,3,0,62,5,6,3,0,62,3,0,73,6,8,6,4,0,79,9,3,0,13,3,0,72,7,23,3,1,0,3,0,62,3,1,0,3,0,62,5,3,0,3,3,0,65,5,5,6,8,6,4,0,13,9,7,22,3,1,2,3,0,3,3,0,25,3,0,0,6,3,1,0,3,0,80,5,6,8,3,0,72,7,724,7,28,1,new A([0.5],[],[],0),3,0,5,3,2,0,3,0,0,5,3,0,3,3,0,25,3,0,0,6,3,2,0,6,6,8,4,1,4,9,7,290,1,new A([1],[],[],0),2,1,1,new A([0],[1],[1],0),2,2,3,0,68,3,2,0,3,0,62,5,6,4,2,4,9,3,2,4,3,0,19,1,new A([1],[],[],0),6,11,43,9,3,2,0,7,35,3,3,0,3,0,13,5,3,1,4,5,4,3,4,9,3,3,4,3,0,4,3,3,0,6,3,3,4,3,0,76,5,2,2,8,5,8,9,1,new A([2],[],[],0),3,0,4,3,2,4,6,3,0,35,5,4,2,5,9,3,2,0,3,0,70,3,2,5,3,0,13,3,2,0,3,0,62,5,3,0,70,1,new A([1],[],[],0),6,6,6,4,2,6,9,3,2,0,3,0,26,3,2,5,3,0,13,1,new A([0],[],[],0),6,6,4,2,7,9,3,2,6,3,2,1,5,10,2,4,2,8,9,4,2,9,9,9,3,2,7,3,0,3,3,0,25,3,0,0,6,3,2,8,3,0,71,5,3,0,0,5,6,4,2,10,9,3,2,10,3,0,3,3,0,25,3,0,0,6,3,2,8,6,3,0,1,3,2,7,6,3,2,1,5,10,2,4,2,11,9,4,2,12,9,9,3,2,11,3,0,13,3,2,8,6,3,2,12,3,0,70,3,2,4,3,0,1,5,3,0,13,1,new A([2],[],[],0),3,0,4,3,2,4,6,3,0,34,5,6,6,3,0,76,3,2,10,3,0,13,3,2,9,6,6,2,2,8,4,1,5,9,7,214,3,2,0,3,0,62,5,3,0,70,1,new A([1],[],[],0),6,4,2,4,3,0,14,1,new A([1],[],[],0),6,11,9,9,3,2,0,3,0,4,5,8,9,1,new A([2],[],[],0),3,0,4,3,2,4,6,3,0,35,5,4,2,5,9,3,2,0,3,0,70,3,2,5,3,0,13,3,2,5,6,6,3,2,1,5,4,2,6,9,3,2,0,3,0,26,3,2,5,3,0,13,3,2,5,6,6,3,2,1,5,4,2,7,9,3,2,0,3,0,70,3,2,4,3,0,1,3,2,5,6,3,0,13,3,2,5,6,6,4,2,8,9,3,2,7,3,0,3,3,0,25,3,0,0,6,3,2,8,6,3,0,3,3,0,25,3,0,0,6,3,2,6,6,3,0,1,5,4,2,9,9,3,2,7,3,0,70,3,2,4,3,0,1,5,3,0,13,1,new A([2],[],[],0),3,0,4,3,2,4,6,3,0,34,5,6,6,3,0,76,3,2,9,3,0,13,3,2,6,6,6,8,4,1,6,9,3,1,0,3,0,62,5,3,0,62,5,3,0,14,1,new A([0],[],[],0),6,11,9,9,3,1,0,3,0,4,5,8,9,3,1,0,3,0,62,5,3,0,62,5,3,0,14,1,new A([1],[],[],0),6,11,17,9,3,1,0,3,0,76,5,3,1,1,5,3,0,13,5,8,9,3,1,0,3,0,62,5,3,0,62,5,3,0,15,1,new A([2],[],[],0),6,11,8,9,1,new A("RANK ERROR",[10],[1],0),3,0,61,5,8,9,3,1,0,3,0,62,5,3,0,19,3,0,65,5,5,3,0,29,1,new A([0],[],[],0),6,11,8,9,1,new A("LENGTH ERROR",[12],[1],0),3,0,61,5,8,9,3,1,0,3,1,5,5,10,2,4,1,7,9,4,1,8,9,9,3,1,7,3,0,71,5,3,0,0,5,3,0,3,3,0,25,3,0,0,6,3,1,8,3,1,6,5,6,8,6,4,0,80,9,7,31,7,11,3,2,2,3,1,0,3,2,0,6,8,3,0,72,7,11,3,2,0,3,1,0,3,2,0,6,8,6,8,4,0,81,9,3,0,1,4,0,2,9,3,0,5,4,0,6,9,3,0,8,4,0,9,9,3,0,46,4,0,47,9,3,0,29,4,0,30,8],"nSlots":86,"vars":{"get_⎕OFF":{"category":2,"slot":83,"scopeDepth":0},"⎕OFF":{"category":1},"⎕A":{"scopeDepth":0,"slot":84,"category":1},"⎕Á":{"scopeDepth":0,"slot":85,"category":1},"⎕a":{"scopeDepth":0,"slot":82,"category":1},"+":{"category":2,"slot":0,"scopeDepth":0},"-":{"category":2,"slot":1,"scopeDepth":0},"−":{"category":2,"slot":2,"scopeDepth":0},"×":{"category":2,"slot":3,"scopeDepth":0},"÷":{"category":2,"slot":4,"scopeDepth":0},"*":{"category":2,"slot":5,"scopeDepth":0},"⋆":{"category":2,"slot":6,"scopeDepth":0},"⍟":{"category":2,"slot":7,"scopeDepth":0},"|":{"category":2,"slot":8,"scopeDepth":0},"∣":{"category":2,"slot":9,"scopeDepth":0},"\\":{"category":3,"slot":10,"scopeDepth":0},"⍀":{"category":3,"slot":11,"scopeDepth":0},"○":{"category":2,"slot":12,"scopeDepth":0},",":{"category":2,"slot":13,"scopeDepth":0},"=":{"category":2,"slot":14,"scopeDepth":0},"≠":{"category":2,"slot":15,"scopeDepth":0},"<":{"category":2,"slot":16,"scopeDepth":0},">":{"category":2,"slot":17,"scopeDepth":0},"≤":{"category":2,"slot":18,"scopeDepth":0},"≥":{"category":2,"slot":19,"scopeDepth":0},"≡":{"category":2,"slot":20,"scopeDepth":0},"∘":{"category":4,"slot":21,"scopeDepth":0},"∪":{"category":2,"slot":22,"scopeDepth":0},"∩":{"category":2,"slot":23,"scopeDepth":0},"⊥":{"category":2,"slot":24,"scopeDepth":0},".":{"category":4,"slot":25,"scopeDepth":0},"↓":{"category":2,"slot":26,"scopeDepth":0},"¨":{"category":3,"slot":27,"scopeDepth":0},"⊤":{"category":2,"slot":28,"scopeDepth":0},"∊":{"category":2,"slot":29,"scopeDepth":0},"∈":{"category":2,"slot":30,"scopeDepth":0},"!":{"category":2,"slot":31,"scopeDepth":0},"⍎":{"category":2,"slot":32,"scopeDepth":0},"⍷":{"category":2,"slot":33,"scopeDepth":0},"⌊":{"category":2,"slot":34,"scopeDepth":0},"⌈":{"category":2,"slot":35,"scopeDepth":0},"_fork1":{"category":2,"slot":36,"scopeDepth":0},"_fork2":{"category":2,"slot":37,"scopeDepth":0},"⍕":{"category":2,"slot":38,"scopeDepth":0},"⍋":{"category":2,"slot":39,"scopeDepth":0},"⍒":{"category":2,"slot":40,"scopeDepth":0},"⍁":{"category":4,"slot":41,"scopeDepth":0},"⍳":{"category":2,"slot":42,"scopeDepth":0},"⊂":{"category":2,"slot":43,"scopeDepth":0},"~":{"category":2,"slot":44,"scopeDepth":0},"∨":{"category":2,"slot":45,"scopeDepth":0},"∧":{"category":2,"slot":46,"scopeDepth":0},"^":{"category":2,"slot":47,"scopeDepth":0},"⍱":{"category":2,"slot":48,"scopeDepth":0},"⍲":{"category":2,"slot":49,"scopeDepth":0},"⍣":{"category":4,"slot":50,"scopeDepth":0},"get_⎕":{"category":2,"slot":51,"scopeDepth":0},"⎕":{"category":1},"set_⎕":{"category":2,"slot":52,"scopeDepth":0},"get_⍞":{"category":2,"slot":53,"scopeDepth":0},"⍞":{"category":1},"set_⍞":{"category":2,"slot":54,"scopeDepth":0},"get_⎕IO":{"category":2,"slot":55,"scopeDepth":0},"⎕IO":{"category":1},"set_⎕IO":{"category":2,"slot":56,"scopeDepth":0},"⎕DL":{"category":2,"slot":57,"scopeDepth":0},"⎕RE":{"category":2,"slot":58,"scopeDepth":0},"⎕UCS":{"category":2,"slot":59,"scopeDepth":0},"?":{"category":2,"slot":60,"scopeDepth":0},"↗":{"category":2,"slot":61,"scopeDepth":0},"⍴":{"category":2,"slot":62,"scopeDepth":0},"⌽":{"category":2,"slot":63,"scopeDepth":0},"⊖":{"category":2,"slot":64,"scopeDepth":0},"/":{"category":3,"slot":65,"scopeDepth":0},"⌿":{"category":3,"slot":66,"scopeDepth":0},"⌷":{"category":2,"slot":67,"scopeDepth":0},"_index":{"category":2,"slot":68,"scopeDepth":0},"_substitute":{"category":2,"slot":69,"scopeDepth":0},"↑":{"category":2,"slot":70,"scopeDepth":0},"⍉":{"category":2,"slot":71,"scopeDepth":0},"⍠":{"category":4,"slot":72,"scopeDepth":0},"⍬":{"scopeDepth":0,"slot":73,"category":1},"_atop":{"scopeDepth":0,"slot":74,"category":4},"⊃":{"scopeDepth":0,"slot":75,"category":2},"⍪":{"scopeDepth":0,"slot":76,"category":2},"⊢":{"scopeDepth":0,"slot":77,"category":2},"⊣":{"scopeDepth":0,"slot":78,"category":2},"≢":{"scopeDepth":0,"slot":79,"category":2},"⌹":{"scopeDepth":0,"slot":80,"category":2},"⍨":{"scopeDepth":0,"slot":81,"category":3}}};
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
function aplError(name,m,o){ // m:message, o:options
  m=m||''
  if(o&&o.aplCode&&o.offset!=null){
    var a=o.aplCode.slice(0,o.offset).split('\n')
    var l=a.length,c=1+(a[a.length-1]||'').length // line and column
    m+='\n'+(o.file||'-')+':'+l+':'+c+o.aplCode.split('\n')[l-1]+'_'.repeat(c-1)+'^'
  }
  var e=Error(m);e.name=name;for(var k in o)e[k]=o[k]
  throw e
}
function syntaxError(m,o){aplError('SYNTAX ERROR',m,o)}
function domainError(m,o){aplError('DOMAIN ERROR',m,o)}
function lengthError(m,o){aplError('LENGTH ERROR',m,o)}
function   rankError(m,o){aplError(  'RANK ERROR',m,o)}
function  indexError(m,o){aplError( 'INDEX ERROR',m,o)}
function  nonceError(m,o){aplError( 'NONCE ERROR',m,o)}
function  valueError(m,o){aplError( 'VALUE ERROR',m,o)}
function each(a,f){ // iterates through the elements of an APL array in ravel order.
  if(a.empty())return
  var data=a.data,shape=a.shape,stride=a.stride,lastAxis=shape.length-1,p=a.offset,i=[],axis=shape.length
  while(--axis>=0)i.push(0)
  while(1){
    f(data[p],i,p)
    axis=lastAxis
    while(axis>=0&&i[axis]+1===shape[axis]){
      p-=i[axis]*stride[axis];i[axis--]=0
    }
    if(axis<0)break
    i[axis]++
    p+=stride[axis]
  }
}
function each2(a,b,f){ // like each() but iterates over two APL array in parallel
  var data =a.data,shape =a.shape,stride =a.stride
  var data1=b.data,shape1=b.shape,stride1=b.stride
  shape.length!==shape1.length&&rankError()
  shape!=''+shape1&&lengthError() // abuse JS type coercion -- compare the shapes as strings
  if(a.empty())return
  var lastAxis=shape.length-1,p=a.offset,q=b.offset
  var i=Array(shape.length);for(var j=0;j<i.length;j++)i[j]=0
  while(1){
    f(data[p],data1[q],i)
    var axis = lastAxis
    while(axis>=0&&i[axis]+1===shape[axis]){p-=i[axis]*stride[axis];q-=i[axis]*stride1[axis];i[axis--]=0}
    if(axis<0)break
    i[axis]++;p+=stride[axis];q+=stride1[axis]
  }
}

function A(data,shape,stride,offset){ // APL array constructor
  this.data=data
  this.shape=shape||[this.data.length]
  this.stride=stride||strideForShape(this.shape)
  this.offset=offset||0
  assert(this.data.length!=null)
  assert(this.shape.length!=null)
  assert(this.stride.length!=null)
  assert(!this.data.length||isInt(this.offset,0,this.data.length))
  assert(this.stride.length===this.shape.length)
  for(var i=0;i<this.shape.length;i++)assert(isInt(this.shape[i],0))
  if(this.data.length)for(var i=0;i<this.stride.length;i++)assert(isInt(this.stride[i],-this.data.length,this.data.length+1))
}
extend(A.prototype,{
  empty: function(){var shape=this.shape;for(var i=0;i<shape.length;i++)if(!shape[i])return 1;return 0},
  map:function(f){var r=[];each(this,function(x,i,p){r.push(f(x,i,p))});return new A(r,this.shape)},
  map2:function(a,f){var r=[];each2(this,a,function(x,y,i){r.push(f(x,y,i))});return new A(r,this.shape)},
  toArray:function(){var r=[];each(this,function(x){r.push(x)});return r},
  toInt:function(m,M){var r=this.unwrap();if(r!==r|0||m!=null&&r<m||M!=null&&M<=r)domainError();return r},
  toBool:function(){return this.toInt(0,2)},
  toSimpleString:function(){
    if(this.shape.length>1)rankError()
    if(typeof this.data==='string'){
      if(!this.shape.length)return this.data[this.offset]
      if(!this.shape[0])return''
      if(this.stride[0]===1)return this.data.slice(this.offset,this.offset+this.shape[0])
      return this.toArray().join('')
    }else{
      var a=this.toArray()
      for(var i=0;i<a.length;i++)typeof a[i]!=='string'&&domainError()
      return a.join('')
    }
  },
  isSingleton:function(){var s=this.shape;for(var i=0;i<s.length;i++)if(s[i]!==1)return 0;return 1},
  isSimple:function(){return!this.shape.length&&!(this.data[this.offset]instanceof A)},
  unwrap:function(){this.isSingleton()||lengthError();return this.data[this.offset]},
  getPrototype:function(){return this.empty()||typeof this.data[this.offset]!=='string'?0:' '}, // todo
  toString:function(){return format(this).join('\n')},
  repr:function(){return'new A('+repr(this.data)+','+repr(this.shape)+','+repr(this.stride)+','+repr(this.offset)+')'}
})
function strideForShape(shape){
  assert(shape.length!=null)
  if(!shape.length)return[]
  var r=Array(shape.length)
  r[r.length-1]=1
  for(var i=r.length-2;i>=0;i--){
    assert(isInt(shape[i],0))
    r[i]=r[i+1]*shape[i+1]
  }
  return r
}
A.zero =new A([0],[])
A.one  =new A([1],[])
A.zilde=new A([],[0])
A.scalar=function(x){return new A([x],[])}
A.bool=[A.zero,A.one]
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
var LDC=1,VEC=2,GET=3,SET=4,MON=5,DYA=6,LAM=7,RET=8,POP=9,SPL=10,JEQ=11,EMB=12,CON=13

function Proc(code,addr,size,env){this.code=code;this.addr=addr;this.size=size;this.env=env}
Proc.prototype.toString=function(){return'#procedure'}
Proc.prototype.toFunction=function(){
  var p=this;return function(x,y){return vm({code:p.code,env:p.env.concat([[x,p,y,null]]),pc:p.addr})}
}

function vm(o){
  var code=o.code,env=o.env,stack=o.stack,pc=o.pc
  assert(code instanceof Array);assert(env instanceof Array);for(var i=0;i<env.length;i++)assert(env[i]instanceof Array)
  stack=stack||[];pc=pc||0
  while(1){
    switch(code[pc++]){
      case LDC:stack.push(code[pc++]);break
      case VEC:
        var a=stack.splice(stack.length-code[pc++])
        for(var i=0;i<a.length;i++)if(a[i].isSimple())a[i]=a[i].unwrap()
        stack.push(new A(a))
        break
      case GET:var r=env[code[pc++]][code[pc++]];r!=null||valueError();stack.push(r);break
      case SET:env[code[pc++]][code[pc++]]=stack[stack.length-1];break
      case MON:
        var wf=stack.splice(-2),w=wf[0],f=wf[1]
        if(typeof f==='function'){
          if(w instanceof Proc)w=w.toFunction()
          if(f.cps){
            f(w,undefined,undefined,function(r){stack.push(r);vm({code:code,env:env,stack:stack,pc:pc})})
            return
          }else{
            stack.push(f(w))
          }
        }else{
          var bp=stack.length;stack.push(code,pc,env);code=f.code;pc=f.addr;env=f.env.concat([[w,f,null,bp]])
        }
        break
      case DYA:
        var wfa=stack.splice(-3),w=wfa[0],f=wfa[1],a=wfa[2]
        if(typeof f==='function'){
          if(w instanceof Proc)w=w.toFunction()
          if(a instanceof Proc)a=a.toFunction()
          if(f.cps){
            f(w,a,undefined,function(r){stack.push(r);vm({code,env,stack,pc})})
            return
          }else{
            stack.push(f(w,a))
          }
        }else{
          var bp=stack.length;stack.push(code,pc,env);code=f.code;pc=f.addr;env=f.env.concat([[w,f,a,bp]])
        }
        break
      case LAM:size=code[pc++];stack.push(new Proc(code,pc,size,env));pc+=size;break
      case RET:
        if(stack.length===1)return stack[0]
        var u=stack.splice(-4,3);code=u[0];pc=u[1];env=u[2]
        break
      case POP:stack.pop();break
      case SPL:
        var n=code[pc++]
        var a=stack[stack.length-1].toArray().reverse()
        for(var i=0;i<a.length;i++)if(!(a[i]instanceof A))a[i]=new A([a[i]],[])
        if(a.length===1){a=repeat(a,n)}else if(a.length!==n){lengthError()}
        stack.push.apply(stack,a)
        break
      case JEQ:var n=code[pc++];stack[stack.length-1].toBool()||(pc+=n);break
      case EMB:var frame=env[env.length-1];stack.push(code[pc++](frame[0],frame[2]));break
      case CON:
        var frame = env[env.length - 1]
        ;(function(){
          var cont={
            code:code,
            env:env.map(function(x){x.slice(0)}),
            stack:stack.slice(0,frame[3]),
            pc:frame[1].addr+frame[1].size-1
          }
          assert(code[cont.pc] === RET)
          stack.push(function(r){code=cont.code;env=cont.env;stack=cont.stack;pc=cont.pc;stack.push(r)})
        }())
        break
      default:aplError('Unrecognized instruction:'+code[pc-1]+',pc:'+pc)
    }
  }
}
var rLetters='_A-Za-zªµºÀ-ÖØ-öø-ˁˆ-ˑˠ-ˤˬˮͰ-ʹͶ-ͷͺ-ͽΆΈ-ΊΌΎ-ΡΣ-ϵϷ-ҁҊ-ԧԱ-Ֆՙա-ևא-תװ-ײؠ-يٮ-ٯٱ-ۓەۥ-ۦۮ-ۯۺ-ۼۿܐܒ-ܯݍ-ޥޱߊ-ߪߴ-ߵߺࠀ-ࠕࠚࠤࠨࡀ-ࡘࢠࢢ-ࢬऄ-हऽॐक़-ॡॱ-ॷॹ-ॿঅ-ঌএ-ঐও-নপ-রলশ-হঽৎড়-ঢ়য়-ৡৰ-ৱਅ-ਊਏ-ਐਓ-ਨਪ-ਰਲ-ਲ਼ਵ-ਸ਼ਸ-ਹਖ਼-ੜਫ਼ੲ-ੴઅ-ઍએ-ઑઓ-નપ-રલ-ળવ-હઽૐૠ-ૡଅ-ଌଏ-ଐଓ-ନପ-ରଲ-ଳଵ-ହଽଡ଼-ଢ଼ୟ-ୡୱஃஅ-ஊஎ-ஐஒ-கங-சஜஞ-டண-தந-பம-ஹௐఅ-ఌఎ-ఐఒ-నప-ళవ-హఽౘ-ౙౠ-ౡಅ-ಌಎ-ಐಒ-ನಪ-ಳವ-ಹಽೞೠ-ೡೱ-ೲഅ-ഌഎ-ഐഒ-ഺഽൎൠ-ൡൺ-ൿඅ-ඖක-නඳ-රලව-ෆก-ะา-ำเ-ๆກ-ຂຄງ-ຈຊຍດ-ທນ-ຟມ-ຣລວສ-ຫອ-ະາ-ຳຽເ-ໄໆໜ-ໟༀཀ-ཇཉ-ཬྈ-ྌက-ဪဿၐ-ၕၚ-ၝၡၥ-ၦၮ-ၰၵ-ႁႎႠ-ჅჇჍა-ჺჼ-ቈቊ-ቍቐ-ቖቘቚ-ቝበ-ኈኊ-ኍነ-ኰኲ-ኵኸ-ኾዀዂ-ዅወ-ዖዘ-ጐጒ-ጕጘ-ፚᎀ-ᎏᎠ-Ᏼᐁ-ᙬᙯ-ᙿᚁ-ᚚᚠ-ᛪᜀ-ᜌᜎ-ᜑᜠ-ᜱᝀ-ᝑᝠ-ᝬᝮ-ᝰក-ឳៗៜᠠ-ᡷᢀ-ᢨᢪᢰ-ᣵᤀ-ᤜᥐ-ᥭᥰ-ᥴᦀ-ᦫᧁ-ᧇᨀ-ᨖᨠ-ᩔᪧᬅ-ᬳᭅ-ᭋᮃ-ᮠᮮ-ᮯᮺ-ᯥᰀ-ᰣᱍ-ᱏᱚ-ᱽᳩ-ᳬᳮ-ᳱᳵ-ᳶᴀ-ᶿḀ-ἕἘ-Ἕἠ-ὅὈ-Ὅὐ-ὗὙὛὝὟ-ώᾀ-ᾴᾶ-ᾼιῂ-ῄῆ-ῌῐ-ΐῖ-Ίῠ-Ῥῲ-ῴῶ-ῼⁱⁿₐ-ₜℂℇℊ-ℓℕℙ-ℝℤΩℨK-ℭℯ-ℹℼ-ℿⅅ-ⅉⅎↃ-ↄⰀ-Ⱞⰰ-ⱞⱠ-ⳤⳫ-ⳮⳲ-ⳳⴀ-ⴥⴧⴭⴰ-ⵧⵯⶀ-ⶖⶠ-ⶦⶨ-ⶮⶰ-ⶶⶸ-ⶾⷀ-ⷆⷈ-ⷎⷐ-ⷖⷘ-ⷞⸯ々-〆〱-〵〻-〼ぁ-ゖゝ-ゟァ-ヺー-ヿㄅ-ㄭㄱ-ㆎㆠ-ㆺㇰ-ㇿ㐀-䶵一-鿌ꀀ-ꒌꓐ-ꓽꔀ-ꘌꘐ-ꘟꘪ-ꘫꙀ-ꙮꙿ-ꚗꚠ-ꛥꜗ-ꜟꜢ-ꞈꞋ-ꞎꞐ-ꞓꞠ-Ɦꟸ-ꠁꠃ-ꠅꠇ-ꠊꠌ-ꠢꡀ-ꡳꢂ-ꢳꣲ-ꣷꣻꤊ-ꤥꤰ-ꥆꥠ-ꥼꦄ-ꦲꧏꨀ-ꨨꩀ-ꩂꩄ-ꩋꩠ-ꩶꩺꪀ-ꪯꪱꪵ-ꪶꪹ-ꪽꫀꫂꫛ-ꫝꫠ-ꫪꫲ-ꫴꬁ-ꬆꬉ-ꬎꬑ-ꬖꬠ-ꬦꬨ-ꬮꯀ-ꯢ가-힣ힰ-ퟆퟋ-ퟻ豈-舘並-龎ﬀ-ﬆﬓ-ﬗיִײַ-ﬨשׁ-זּטּ-לּמּנּ-סּףּ-פּצּ-ﮱﯓ-ﴽﵐ-ﶏﶒ-ﷇﷰ-ﷻﹰ-ﹴﹶ-ﻼＡ-Ｚａ-ｚｦ-ﾾￂ-ￇￊ-ￏￒ-ￗￚ-ￜ'
var TD=[ // token definitions
  ['-',/^(?:[ \t]+|[⍝\#].*)+/],        // whitespace and comments
  ['L',/^[\n\r]+/],                    // newline
  ['⋄',/^[◇⋄]/],                       // statement separator
  ['N',RegExp('^¯?(?:0x[\\da-f]+|\\d*\\.?\\d+(?:e[+¯]?\\d+)?|¯|∞)(?:j¯?(?:0x[\\da-f]+|\\d*\\.?\\d+(?:e[+¯]?\\d+)?|¯|∞))?','i')],
  ['S',/^(?:'[^']*')+|^(?:"[^"]*")+/], // string
  ['.',/^[\(\)\[\]\{\}:;←]/],          // punctuation
  ['J',/^«[^»]*»/],                    // JS literal
  ['X',RegExp('^(?:⎕?['+rLetters+']['+rLetters+'0-9]*|⍺⍺|⍵⍵|∇∇|[^¯\'":«»])','i')] // identifier
]
function parse(s,o){ // s:APL source code, o:options
  // Tokenize:
  // A token is {t:type,v:value,o:offset,s:aplCode}
  // "stk" keeps track of bracket nesting and causes 'L' tokens to be dropped when the latest unclosed bracket is '('
  // or '['.  This allows for newlines inside expressions without having them treated as statement separators.
  var i=0,tokens=[],stk=['{'],ns=s.length // i:offset in s
  while(i<ns){
    var m,t,v,s1=s.slice(i) // m:match object, t:type, v:value, s1:remainder of source code
    for(var j=0;j<TD.length;j++)if(m=s1.match(TD[j][1])){v=m[0];t=TD[j][0];t==='.'&&(t=v);break}
    t||syntaxError('Unrecognized token',{file:o?o.file:null,o:i,s:s})
    if(t!=='-'){
      if('([{'.includes(t)){stk.push(t)}else if(')]}'.includes(t)){stk.pop()}
      if(t!=='L'||stk[stk.length-1]==='{')tokens.push({t:t,v:v[0]==='⎕'?v.toUpperCase():v,o:i,s:s})
    }
    i+=v.length
  }
  tokens.push({t:'$',v:'',o:i,s:s})

  // AST node types:
  //   'B'  body        a⋄b
  //   ':'  guard       a:b
  //   'N'  number      1
  //   'S'  string      'a'
  //   'X'  symbol      a
  //   'J'  embedded    «a»
  //   '⍬'  empty       ()
  //   '{'  lambda      {}
  //   '['  index       a[b]
  //   '←'  assign      a←b
  //   '.'  expr        a b
  // The compiler replaces '.' nodes with:
  //   'V'  vector      1 2
  //   'M'  monadic     +1
  //   'D'  dyadic      1+2
  //   'A'  adverb      +/
  //   'C'  conjunction +.×
  //   'T'  atop        +÷
  //   'F'  fork        +÷⍴
  var i=1,token=tokens[0] // single-token lookahead

  // consume(x) consumes the upcoming token and returns a truthy value only if its type matches any character in x.
  function consume(x){if(x.includes(token.t))return token=tokens[i++]}

  // demand() is like consume() but intolerant to a mismatch.
  function demand(x){token.t===x?(token=tokens[i++]):parserError('Expected token of type '+x+' but got '+token.t)}

  function parserError(x){syntaxError(x,{file:o.file,offset:token.o,aplCode:s})}

  function body(){ // parse a body
    var r=['B']
    while(1){
      if('$};'.includes(token.t))return r
      while(consume('⋄L')){}
      if('$};'.includes(token.t))return r
      var e=expr()
      if(consume(':'))e=[':',e,expr()]
      r.push(e)
    }
  }

  function expr(){ // parse an expression
    var r=['.'],item
    while(1){
      var token0=token
      if(consume('NSXJ')){item=[token0.t,token0.v]}
      else if(consume('(')){if(consume(')')){item=['⍬']}else{item=expr();demand(')')}}
      else if(consume('{')){item=['{',body()];while(consume(';')){item.push(body())};demand('}')}
      else{parserError('Encountered unexpected token of type '+token.t)}
      if(consume('[')){
        item=['[',item]
        while(1){
          if(consume(';')){item.push(null)}
          else if(token.t===']'){item.push(null);break}
          else{item.push(expr());if(token.t===']'){break}else{demand(';')}}
        }
        demand(']')
      }
      if(consume('←'))return r.concat([['←',item,expr()]])
      r.push(item)
      if(')]}:;⋄L$'.includes(token.t))return r
    }
  }

  // 'hello'} !!! SYNTAX ERROR
  var r=body();demand('$');return r
}
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
function adverb     (f){f.adv =1;return f}
function conjunction(f){f.conj=1;return f}
function cps        (f){f.cps =1;return f}
addVocabulary({
  '+':withIdentity(0,pervasive({
    // +4            ←→ 4
    // ++4           ←→ 4
    // +4 5          ←→ 4 5
    // +((5 6)(7 1)) ←→ (5 6)(7 1)
    // + (5 6)(7 1)  ←→ (5 6)(7 1)
    // +1j¯2         ←→ 1j2
    monad:numeric(
      function(x){return x},
      Z.conjugate
    ),
    // 1+2                      ←→ 3
    // 2 3+5 8                  ←→ 7 11
    // (2 3⍴1 2 3 4 5 6)+    ¯2 ←→ 2 3 ⍴ ¯1 0 1 2 3 4
    // (2 3⍴1 2 3 4 5 6)+  2⍴¯2 !!! RANK ERROR
    // (2 3⍴1 2 3 4 5 6)+2 3⍴¯2 ←→ 2 3 ⍴ ¯1 0 1 2 3 4
    // 1 2 3+4 5                !!! LENGTH ERROR
    // (2 3⍴⍳6)+3 2⍴⍳6          !!! LENGTH ERROR
    // 1j¯2+¯2j3                ←→ ¯1j1
    // +/⍬                      ←→ 0
    // ¯+¯¯                     !!! DOMAIN ERROR
    // 1j¯+2j¯¯                 !!! DOMAIN ERROR
    dyad:numeric(
      function(y,x){return x+y},
      function(y,x){return Z.add(x,y)}
    )
  })),
  '-':withIdentity(0,pervasive({
    // -4     ←→ ¯4
    // -1 2 3 ←→ ¯1 ¯2 ¯3
    // -1j2   ←→ ¯1j¯2
    monad:numeric(
      function(x){return-x},
      Z.negate
    ),
    // 1-3     ←→ ¯2
    // 5-¯3    ←→ 8
    // 5j2-3j8 ←→ 2j¯6
    // 5-3j8   ←→ 2j¯8
    // -/⍬     ←→ 0
    dyad:numeric(
      function(y,x){return x-y},
      function(y,x){return Z.subtract(x,y)}
    )
  })),
  '×':withIdentity(1,pervasive({
    // ×¯2 ¯1 0 1 2 ←→ ¯1 ¯1 0 1 1
    // ×¯           ←→ 1
    // ×¯¯          ←→ ¯1
    // ×3j¯4        ←→ .6j¯.8
    monad:numeric(
      function(x){return(x>0)-(x<0)},
      function(x){var d=Math.sqrt(x.re*x.re+x.im*x.im);return simplify(x.re/d,x.im/d)}
    ),
    // 7×8       ←→ 56
    // 1j¯2×¯2j3 ←→ 4j7
    // 2×1j¯2    ←→ 2j¯4
    // ×/⍬       ←→ 1
    dyad:numeric(
      function(y,x){return x*y},
      function(y,x){return Z.multiply(x,y)}
    )
  })),
  '÷': withIdentity(1, pervasive({
    // ÷2   ←→ .5
    // ÷2j3 ←→ 0.15384615384615385J¯0.23076923076923078
    // 0÷0  !!! DOMAIN ERROR
    monad:numeric(
      function(x){return 1/x},
      function(x){var d=x.re*x.re+x.im*x.im;return simplify(x.re/d,-x.im/d)}
    ),
    // 27÷9     ←→ 3
    // 4j7÷1j¯2 ←→ ¯2j3
    // 0j2÷0j1  ←→ 2
    // 5÷2j1    ←→ 2j¯1
    // ÷/⍬      ←→ 1
    dyad:numeric(
      function(y,x){return x/y},
      function(y,x){return Z.divide(x,y)}
    )
  })),
  '*':withIdentity(1,pervasive({
    // *2   ←→ 7.38905609893065
    // *2j3 ←→ ¯7.315110094901103J1.0427436562359045
    monad:exp=numeric(Math.exp,Z.exp),
    // 2*3 ←→ 8
    // 3*2 ←→ 9
    // ¯2*3 ←→ ¯8
    // ¯3*2 ←→ 9
    // ¯1*.5 ←→ 0j1
    // 1j2*3j4 ←→ .129009594074467j.03392409290517014
    // */⍬ ←→ 1
    dyad:function(y,x){return Z.pow(x,y)}
  })),
  '⍟':pervasive({
    // ⍟123 ←→ 4.812184355372417
    // ⍟0 ←→ ¯¯
    // ⍟¯1 ←→ 0j1×○1
    // ⍟123j456 ←→ 6.157609243895447J1.3073297857599793
    monad:Z.log,
    // 12⍟34 ←→ 1.419111870829036
    // 12⍟¯34 ←→ 1.419111870829036j1.26426988871305
    // ¯12⍟¯34 ←→ 1.1612974763994781j¯.2039235425372641
    // 1j2⍟3j4 ←→ 1.2393828252698689J¯0.5528462880299602
    dyad:function(y,x){
      return typeof x==='number'&&typeof y==='number'&&x>0&&y>0?Math.log(y)/Math.log(x):Z.divide(Z.log(y),Z.log(x))
    }
  }),
  '|': withIdentity(0, pervasive({
    // ∣¯8 0 8 ¯3.5 ←→ 8 0 8 3.5
    // |5j12 ←→ 13
    monad:numeric(function(x){return Math.abs(x)},Z.magnitude),
    // 3∣5 ←→ 2
    // 1j2|3j4 ←→ ¯1j1
    // 7 ¯7∘.|31 28 ¯30        ←→ 2 3⍴3 0 5 ¯4 0 ¯2
    // ¯0.2 0 0.2∘.|¯0.3 0 0.3 ←→ 3 3⍴¯0.1 0 ¯0.1 ¯0.3 0 0.3 0.1 0 0.1
    // |/⍬ ←→ 0
    // 0|¯4 ←→ ¯4
    // 0|¯4j5 ←→ ¯4j5
    // 10|4j3 ←→ 4j3
    // 4j6|7j10 ←→ 3j4
    // ¯10 7j10 0.3|17 5 10 ←→ ¯3 ¯5j7 0.1
    dyad:function(y,x){return Z.residue(x,y)}
  }))
})
var scanOrExpand
addVocabulary({
  '⍀':adverb(function(om,al,axis){return scanOrExpand(om,al,axis||A.zero)}),

  // +\20 10 ¯5 7               ←→ 20 30 25 32
  // ,\"AB" "CD" "EF"           ←→ 'AB' 'ABCD' 'ABCDEF'
  // ×\2 3⍴5 2 3 4 7 6          ←→ 2 3⍴5 10 30 4 28 168
  // ∧\1 1 1 0 1 1              ←→ 1 1 1 0 0 0
  // -\1 2 3 4                  ←→ 1 ¯1 2 ¯2
  // ∨\0 0 1 0 0 1 0            ←→ 0 0 1 1 1 1 1
  // +\1 2 3 4 5                ←→ 1 3 6 10 15
  // +\(1 2 3)(4 5 6)(7 8 9)    ←→ (1 2 3)(5 7 9)(12 15 18)
  // M←2 3⍴1 2 3 4 5 6 ⋄ +\M    ←→ 2 3 ⍴ 1 3 6 4 9 15
  // M←2 3⍴1 2 3 4 5 6 ⋄ +⍀M    ←→ 2 3 ⍴ 1 2 3 5 7 9
  // M←2 3⍴1 2 3 4 5 6 ⋄ +\[0]M ←→ 2 3 ⍴ 1 2 3 5 7 9
  // ,\'ABC'                    ←→ 'A' 'AB' 'ABC'
  // T←"ONE(TWO) BOOK(S)" ⋄ ≠\T∊"()" ←→ 0 0 0 1 1 1 1 0 0 0 0 0 0 1 1 0
  // T←"ONE(TWO) BOOK(S)" ⋄ ((T∊"()")⍱≠\T∊"()")/T ←→ 'ONE BOOK'
  // 1 0 1\'ab'          ←→ 'a b'
  // 0 1 0 1 0\2 3       ←→ 0 2 0 3 0
  // (2 2⍴0)\'food'      !!! RANK ERROR
  // 'abc'\'def'         !!! DOMAIN ERROR
  // 1 0 1 1\'ab'        !!! LENGTH ERROR
  // 1 0 1 1\'abcd'      !!! LENGTH ERROR
  // 1 0 1\2 2⍴'ABCD'    ←→ 2 3⍴'A BC D'
  // 1 0 1⍀2 2⍴'ABCD'    ←→ 3 2⍴'AB  CD'
  // 1 0 1\[0]2 2⍴'ABCD' ←→ 3 2⍴'AB  CD'
  // 1 0 1\[1]2 2⍴'ABCD' ←→ 2 3⍴'A BC D'
  '\\':scanOrExpand=adverb(function(om,al,axis){
    if(typeof om==='function'){
      assert(typeof al==='undefined')
      var f=om
      return function(om,al){
        assert(al==null)
        if(!om.shape.length)return om
        axis=axis?axis.toInt(0,om.shape.length):om.shape.length-1
        return om.map(function(x,indices,p){
          x instanceof A||(x=A.scalar(x))
          for(var j=0,nj=indices[axis];j<nj;j++){
            p-=om.stride[axis]
            y=om.data[p]
            y instanceof A||(y=A.scalar(y))
            x=f(x,y)
          }
          x.shape.length||(x=x.unwrap())
          return x
        })
      }
    }else{
      om.shape.length||nonceError('Expand of scalar not implemented')
      axis=axis?axis.toInt(0,om.shape.length):om.shape.length-1
      al.shape.length>1&&rankError()
      var a=al.toArray(),b=[],i=0,shape=om.shape.slice(0);shape[axis]=a.length
      for(var j=0;j<a.length;j++){isInt(a[j],0,2)||domainError();b.push(a[j]>0?i++:null)}
      i===om.shape[axis]||lengthError()
      var data=[]
      if(shape[axis]&&!om.empty()){
        var filler=om.getPrototype(),p=om.offset,indices=repeat([0],shape.length)
        while(1){
          data.push(b[indices[axis]]==null?filler:om.data[p+b[indices[axis]]*om.stride[axis]])
          var i=shape.length-1
          while(i>=0&&indices[i]+1===shape[i]){
            if(i!==axis)p-=om.stride[i]*indices[i]
            indices[i--]=0
          }
          if(i<0)break
          if(i!==axis)p+=om.stride[i]
          indices[i]++
        }
      }
      return new A(data,shape)
    }
  })
})
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
addVocabulary({
  ',':function(om,al,axis){
    if(al){
      // 10,66               ←→ 10 66
      // '10 ','MAY ','1985' ←→ '10 MAY 1985'
      // (2 3⍴⍳6),2 2⍴⍳4     ←→ 2 5⍴(0 1 2 0 1  3 4 5 2 3)
      // (3 2⍴⍳6),2 2⍴⍳4     !!! LENGTH ERROR
      // (2 3⍴⍳6),9          ←→ 2 4⍴(0 1 2 9  3 4 5 9)
      // (2 3 4⍴⍳24),99      ←→ 2 3 5⍴(0  1  2  3 99
      // ...                           4  5  6  7 99
      // ...                           8  9 10 11 99
      // ...
      // ...                          12 13 14 15 99
      // ...                          16 17 18 19 99
      // ...                          20 21 22 23 99)
      // ⍬,⍬                 ←→ ⍬
      // ⍬,1                 ←→ ,1
      // 1,⍬                 ←→ ,1
      var nAxes=Math.max(al.shape.length,om.shape.length)
      if(axis){
        axis=axis.unwrap()
        typeof axis!=='number'&&domainError()
        nAxes&&!(-1<axis&&axis<nAxes)&&rankError()
      }else{
        axis=nAxes-1
      }

      if(!al.shape.length&&!om.shape.length){
        return new A([al.unwrap(),om.unwrap()])
      }else if(!al.shape.length){
        var s=om.shape.slice(0)
        if(isInt(axis))s[axis]=1
        al=new A([al.unwrap()],s,repeat([0],om.shape.length))
      }else if(!om.shape.length){
        var s=al.shape.slice(0)
        if(isInt(axis))s[axis]=1
        om=new A([om.unwrap()],s,repeat([0],al.shape.length))
      }else if(al.shape.length+1===om.shape.length){
        isInt(axis)||rankError()
        var shape =al.shape .slice(0);shape .splice(axis,0,1)
        var stride=al.stride.slice(0);stride.splice(axis,0,0)
        al=new A(al.data,shape,stride,al.offset)
      }else if(al.shape.length===om.shape.length+1){
        isInt(axis)||rankError()
        var shape =om.shape .slice(0);shape .splice(axis,0,1)
        var stride=om.stride.slice(0);stride.splice(axis,0,0)
        om=new A(om.data,shape,stride,om.offset)
      }else if(al.shape.length!==om.shape.length){
        rankError()
      }

      assert(al.shape.length===om.shape.length)
      for(var i=0;i<al.shape.length;i++)if(i!==axis&&al.shape[i]!==om.shape[i])lengthError()

      var shape=al.shape.slice(0);if(isInt(axis)){shape[axis]+=om.shape[axis]}else{shape.splice(Math.ceil(axis),0,2)}
      var data=Array(prod(shape))
      var stride=Array(shape.length);stride[shape.length-1]=1
      for(var i=shape.length-2;i>=0;i--)stride[i]=stride[i+1]*shape[i+1]

      var rStride=stride;if(!isInt(axis)){rStride=stride.slice(0);rStride.splice(Math.ceil(axis),1)}
      if(!al.empty()){
        var r=0,p=al.offset // r:pointer in data (the result), p:pointer in al.data
        var pIndices=repeat([0],al.shape.length)
        while(1){
          data[r]=al.data[p]
          var a=pIndices.length-1
          while(a>=0&&pIndices[a]+1===al.shape[a]){
            p-=pIndices[a]*al.stride[a];r-=pIndices[a]*rStride[a];pIndices[a--]=0
          }
          if(a<0)break
          p+=al.stride[a];r+=rStride[a];pIndices[a]++
        }
      }
      if(!om.empty()){
        var r=isInt(axis)?stride[axis]*al.shape[axis]:stride[Math.ceil(axis)] // pointer in data (the result)
        var q=om.offset // pointer in ⍵.data
        var pIndices=repeat([0],om.shape.length)
        while(1){
          data[r]=om.data[q]
          var a=pIndices.length-1
          while(a>=0&&pIndices[a]+1===om.shape[a]){
            q-=pIndices[a]*om.stride[a];r-=pIndices[a]*rStride[a];pIndices[a--]=0
          }
          if(a<0)break
          q+=om.stride[a];r+=rStride[a];pIndices[a]++
        }
      }
      return new A(data,shape,stride)
    }else{
      assert(0)
    }
  }
})
var eq
addVocabulary({
  // 12=12               ←→ 1
  // 2=12                ←→ 0
  // "Q"="Q"             ←→ 1
  // 1="1"               ←→ 0
  // "1"=1               ←→ 0
  // 11 7 2 9=11 3 2 6   ←→ 1 0 1 0
  // "STOAT"="TOAST"     ←→ 0 0 0 0 1
  // 8=2+2+2+2           ←→ 1
  // (2 3⍴1 2 3 4 5 6)=2 3⍴3 3 3 5 5 5 ←→ 2 3⍴0 0 1 0 1 0
  // 3=2 3⍴1 2 3 4 5 6   ←→ 2 3⍴0 0 1 0 0 0
  // 3=(2 3⍴1 2 3 4 5 6)(2 3⍴3 3 3 5 5 5)
  // ... ←→ (2 3⍴0 0 1 0 0 0)(2 3⍴1 1 1 0 0 0)
  // 2j3=2j3             ←→ 1
  // 2j3=3j2             ←→ 0
  // 0j0                 ←→ 0
  // 123j0               ←→ 123
  // 2j¯3+¯2j3           ←→ 0
  // =/⍬                 ←→ 1
  '=':withIdentity(1,pervasive({dyad:eq=function(y,x){
    return+(x instanceof Z&&y instanceof Z?x.re===y.re&&x.im===y.im:x===y)
  }})),

  // 3≢5 ←→ 1
  // 8≠8 ←→ 0
  // ≠/⍬ ←→ 0
  '≠':withIdentity(0,pervasive({dyad:function(y,x){return 1-eq(y,x)}})),

  // </⍬ ←→ 0
  // >/⍬ ←→ 0
  // ≤/⍬ ←→ 1
  // ≥/⍬ ←→ 1
  '<':withIdentity(0,pervasive({dyad:real(function(y,x){return+(x< y)})})),
  '>':withIdentity(0,pervasive({dyad:real(function(y,x){return+(x> y)})})),
  '≤':withIdentity(1,pervasive({dyad:real(function(y,x){return+(x<=y)})})),
  '≥':withIdentity(1,pervasive({dyad:real(function(y,x){return+(x>=y)})})),

  // 3≡3                    ←→ 1
  // 3≡,3                   ←→ 0
  // 4 7.1 8≡4 7.2 8        ←→ 0
  // (3 4⍴⍳12)≡3 4⍴⍳12      ←→ 1
  // (3 4⍴⍳12)≡⊂3 4⍴⍳12     ←→ 0
  // ("ABC" "DEF")≡"ABCDEF" ←→ 0
  //! (⍳0)≡""               ←→ 0
  // (2 0⍴0)≡(0 2⍴0)        ←→ 0
  //! (0⍴1 2 3)≡0⍴⊂2 2⍴⍳4   ←→ 0
  // ≡4                      ←→ 0
  // ≡⍳4                     ←→ 1
  // ≡2 2⍴⍳4                 ←→ 1
  // ≡"abc"1 2 3(23 55)      ←→ 2
  // ≡"abc"(2 4⍴"abc"2 3"k") ←→ 3
  '≡':function(om,al){return al?A.bool[+match(om,al)]:new A([depthOf(om)],[])}
})
function depthOf(x){
  if(!(x instanceof A)||!x.shape.length&&!(x.data[0]instanceof A))return 0
  var r=0;each(x,function(y){r=Math.max(r,depthOf(y))});return r+1
}
addVocabulary({
  // (÷∘-)2     ←→ ¯0.5
  // 8(÷∘-)2    ←→ ¯4
  // ÷∘-2       ←→ ¯0.5
  // 8÷∘-2      ←→ ¯4
  // ⍴∘⍴2 3⍴⍳6  ←→ ,2
  // 3⍴∘⍴2 3⍴⍳6 ←→ 2 3 2
  // 3∘-1       ←→ 2
  // (-∘2)9     ←→ 7
  '∘':conjunction(function(g,f){
    if(typeof f==='function'){
      if(typeof g==='function'){
        return function(om,al){return f(g(om),al)} // f∘g
      }else{
        return function(om,al){al==null||syntaxError('The function does not take a left argument');return f(g,om)} // f∘B
      }
    }else{
      assert(typeof g==='function')
      return function(om,al){al==null||syntaxError('The function does not take a left argument');return g(om,f)} // A∘g
    }
  })
})
addVocabulary({
  '∪':function(om,al){
    if(al){
      // 1 2∪2 3     ←→ 1 2 3
      // 'SHOCK'∪'CHOCOLATE' ←→ 'SHOCKLATE'
      // 1∪1         ←→ ,1
      // 1∪2         ←→ 1 2
      // 1∪2 1       ←→ 1 2
      // 1 2∪2 2 2 2 ←→ 1 2
      // 1 2∪2 2⍴3   !!! RANK ERROR
      // (2 2⍴3)∪4 5 !!! RANK ERROR
      // ⍬∪1         ←→ ,1
      // 1 2∪⍬       ←→ 1 2
      // ⍬∪⍬         ←→ ⍬
      // 2 3 3∪4 5 3 4 ←→ 2 3 3 4 5 4
      // 'lentils' 'bulghur'(3 4 5)∪'lentils' 'rice' ←→ 'lentils' 'bulghur'(3 4 5)'rice'
      if(al.shape.length>1||om.shape.length>1)rankError()
      var a=al.toArray(),r=[];each(om,function(x){contains(a,x)||r.push(x)});return new A(a.concat(r))
    }else{
      // ∪3 17 17 17 ¯3 17 0 ←→ 3 17 ¯3 0
      // ∪3 17               ←→ 3 17
      // ∪17                 ←→ ,17
      // ∪⍬                  ←→ ⍬
      if(om.shape.length>1)rankError()
      var r=[];each(om,function(x){contains(r,x)||r.push(x)});return new A(r)
    }
  },
  '∩':function(om,al){
    if(al){
      // 'ABRA'∩'CAR' ←→ 'ARA'
      // 1'PLUS'2∩⍳5  ←→ 1 2
      // 1∩2          ←→ ⍬
      // 1∩2 3⍴4      !!! RANK ERROR
      if(al.shape.length>1||om.shape.length>1)rankError()
      var r=[],b=om.toArray();each(al,function(x){contains(b,x)&&r.push(x)})
      return new A(r)
    }else{
      // ∩1 !!! NONCE ERROR
      nonceError()
    }
  }
})
function contains(a,x){for(var i=0;i<a.length;i++)if(match(x,a[i]))return 1}
addVocabulary({
  // 10⊥3 2 6 9                        ←→ 3269
  // 8⊥3 1                             ←→ 25
  // 1760 3 12⊥1 2 8                   ←→ 68
  // 2 2 2⊥1                           ←→ 7
  // 0 20 12 4⊥2 15 6 3                ←→ 2667
  // 1760 3 12⊥3 3⍴1 1 1 2 0 3 0 1 8   ←→ 60 37 80
  // 60 60⊥3 13                        ←→ 193
  // 0 60⊥3 13                         ←→ 193
  // 60⊥3 13                           ←→ 193
  // 2⊥1 0 1 0                         ←→ 10
  // 2⊥1 2 3 4                         ←→ 26
  // 3⊥1 2 3 4                         ←→ 58
  //
  // //gives '(1j1⊥1 2 3 4) = 5j9', 1 # todo:⊥for complex numbers
  //
  // M←(3 8⍴0 0 0 0 1 1 1 1
  // ...    0 0 1 1 0 0 1 1
  // ...    0 1 0 1 0 1 0 1)
  // ... A←(4 3⍴1 1 1
  // ...        2 2 2
  // ...        3 3 3
  // ...        4 4 4)
  // ... A⊥M ←→ (4 8⍴0 1 1 2  1  2  2  3
  // ...             0 1 2 3  4  5  6  7
  // ...             0 1 3 4  9 10 12 13
  // ...             0 1 4 5 16 17 20 21)
  //
  // M←(3 8⍴0 0 0 0 1 1 1 1
  // ...    0 0 1 1 0 0 1 1
  // ...    0 1 0 1 0 1 0 1)
  // ... 2⊥M ←→ 0 1 2 3 4 5 6 7
  //
  // M←(3 8 ⍴0 0 0 0 1 1 1 1
  // ...     0 0 1 1 0 0 1 1
  // ...     0 1 0 1 0 1 0 1)
  // ... A←2 1⍴2 10
  // ... A⊥M ←→ (2 8⍴0 1  2  3   4   5   6   7
  // ...             0 1 10 11 100 101 110 111)
  '⊥':function(om,al){
    assert(al)
    if(!al.shape.length)al=new A([al.unwrap()])
    if(!om.shape.length)om=new A([om.unwrap()])
    var lastDimA=al.shape[al.shape.length-1],firstDimB=om.shape[0]
    if(lastDimA!==1&&firstDimB!==1&&lastDimA!==firstDimB)lengthError()
    var a=al.toArray(),b=om.toArray(),data=[],ni=a.length/lastDimA,nj=b.length/firstDimB
    for(var i=0;i<ni;i++)for(var j=0;j<nj;j++){
      var x=a.slice(i*lastDimA,(i+1)*lastDimA)
      var y=[];for(var l=0;l<firstDimB;l++)y.push(b[j+l*(b.length/firstDimB)])
      if(x.length===1)x=repeat([x[0]],y.length)
      if(y.length===1)y=repeat([y[0]],x.length)
      var z=y[0];for(var k=1;k<y.length;k++)z=z*x[k]+y[k]
      data.push(z)
    }
    return new A(data,al.shape.slice(0,-1).concat(om.shape.slice(1)))
  }
})
addVocabulary({
  '.':conjunction(function(g,f){return f===vocabulary['∘']?outerProduct(g):innerProduct(g,f)})
})
// 2 3 4∘.×1 2 3 4 ←→ (3 4⍴2 4  6  8
// ...                     3 6  9 12
// ...                     4 8 12 16)
//
// 0 1 2 3 4∘.!0 1 2 3 4 ←→ (5 5⍴1 1 1 1 1
// ...                           0 1 2 3 4
// ...                           0 0 1 3 6
// ...                           0 0 0 1 4
// ...                           0 0 0 0 1)
//
// 1 2∘.,1+⍳3 ←→ (2 3⍴(1 1)(1 2)(1 3)
// ...                (2 1)(2 2)(2 3))
//
// ⍴1 2∘.,1+⍳3 ←→ 2 3
//
// 2 3∘.↑1 2 ←→ (2 2⍴  (1 0)   (2 0)
// ...               (1 0 0) (2 0 0))
//
// ⍴2 3∘.↑1 2 ←→ 2 2
// ⍴((4 3⍴0)∘.+5 2⍴0) ←→ 4 3 5 2
// 2 3∘.×4 5      ←→ 2 2⍴8 10 12 15
// 2 3∘ . ×4 5    ←→ 2 2⍴8 10 12 15
// 2 3∘.{⍺×⍵}4 5  ←→ 2 2⍴8 10 12 15
function outerProduct(f){
  assert(typeof f==='function')
  return function(om,al){
    al||syntaxError('Adverb ∘. (Outer product) can be applied to dyadic verbs only')
    var a=al.toArray(),b=om.toArray(),data=[]
    for(var i=0;i<a.length;i++)for(var j=0;j<b.length;j++){
      var x=a[i],y=b[j]
      x instanceof A||(x=A.scalar(x))
      y instanceof A||(y=A.scalar(y))
      var z=f(y,x)
      z.shape.length||(z=z.unwrap())
      data.push(z)
    }
    return new A(data,al.shape.concat(om.shape))
  }
}
// For matrices, the inner product behaves like matrix multiplication where +
// and × can be substituted with any verbs.
//
// For higher dimensions, the general formula is:
// A f.g B   <->   f/¨ (⊂[¯1+⍴⍴A]A) ∘.g ⊂[0]B
//
// (1 3 5 7)+.=2 3 6 7 ←→ 2
// (1 3 5 7)∧.=2 3 6 7 ←→ 0
// (1 3 5 7)∧.=1 3 5 7 ←→ 1
// 7+.=8 8 7 7 8 7 5   ←→ 3
// 8 8 7 7 8 7 5+.=7   ←→ 3
// 7+.=7               ←→ 1
// (3 2⍴5 ¯3 ¯2 4 ¯1 0)+.×2 2⍴6 ¯3 5 7 ←→ 3 2⍴15 ¯36 8 34 ¯6 3
function innerProduct(g,f){
  var F=vocabulary['¨'](reduce(f)),G=outerProduct(g)
  return function(om,al){
    if(!al.shape.length)al=new A([al.unwrap()])
    if(!om.shape.length)om=new A([om.unwrap()])
    return F(G(
      vocabulary['⊂'](om,undefined,new A([0])),
      vocabulary['⊂'](al,undefined,new A([al.shape.length-1]))
    ))
  }
}
addVocabulary({
  // ⍴¨(0 0 0 0)(0 0 0)             ←→ (,4)(,3)
  // ⍴¨"MONDAY" "TUESDAY"           ←→ (,6)(,7)
  // ⍴   (2 2⍴⍳4)(⍳10)97.3(3 4⍴"K") ←→ ,4
  // ⍴¨  (2 2⍴⍳4)(⍳10)97.3(3 4⍴"K") ←→ (2 2)(,10)⍬(3 4)
  // ⍴⍴¨ (2 2⍴⍳4)(⍳10)97.3(3 4⍴"K") ←→ ,4
  // ⍴¨⍴¨(2 2⍴⍳4)(⍳10)97.3(3 4⍴"K") ←→ (,2)(,1)(,0)(,2)
  // (1 2 3) ,¨ 4 5 6               ←→ (1 4)(2 5)(3 6)
  // 2 3↑¨'MONDAY' 'TUESDAY'        ←→ 'MO' 'TUE'
  // 2↑¨'MONDAY' 'TUESDAY'          ←→ 'MO' 'TU'
  // 2 3⍴¨1 2                       ←→ (1 1)(2 2 2)
  // 4 5⍴¨"THE" "CAT"               ←→ 'THET' 'CATCA'
  // {1+⍵*2}¨2 3⍴⍳6                 ←→ 2 3⍴1 2 5 10 17 26
  '¨':adverb(function(f,g){
    assert(typeof f==='function');assert(g==null)
    return function(om,al){
      if(!al){
        return om.map(function(x){
          x instanceof A||(x=new A([x],[]))
          var r=f(x);assert(r instanceof A)
          return r.shape.length?r:r.unwrap()
        })
      }else if(arrayEquals(al.shape,om.shape)){
        return om.map2(al, function(x, y) {
          x instanceof A||(x=new A([x],[]))
          y instanceof A||(y=new A([y],[]))
          var r=f(x,y);assert(r instanceof A)
          return r.shape.length?r:r.unwrap()
        })
      }else if(al.isSingleton()){
        var y=al.data[0]instanceof A?al.unwrap():al
        return om.map(function(x){
          x instanceof A||(x=new A([x],[]))
          var r=f(x,y);assert(r instanceof A)
          return r.shape.length?r:r.unwrap()
        })
      }else if(om.isSingleton()){
        var x=om.data[0]instanceof A?om.unwrap():om
        return al.map(function(y){
          y instanceof A||(y=new A([y],[]))
          var r=f(x,y);assert(r instanceof A)
          return r.shape.length?r:r.unwrap()
        })
      }else{
        lengthError()
      }
    }
  })
})
addVocabulary({
  // 1760 3 12⊤75    ←→ 2 0 3
  // 3 12⊤75         ←→ 0 3
  // 100000 12⊤75    ←→ 6 3
  // 16 16 16 16⊤100 ←→ 0 0 6 4
  // 1760 3 12⊤75.3  ←→ 2 0(75.3-72)
  // 0 1⊤75.3        ←→ 75(75.3-75)
  //
  // 2 2 2 2 2⊤1 2 3 4 5 ←→ (5 5⍴0 0 0 0 0
  // ...                         0 0 0 0 0
  // ...                         0 0 0 1 1
  // ...                         0 1 1 0 0
  // ...                         1 0 1 0 1)
  //
  // 10⊤5 15 125 ←→ 5 5 5
  // 0 10⊤5 15 125 ←→ 2 3⍴0 1 12 5 5 5
  //
  // (8 3⍴2 0 0
  // ...  2 0 0
  // ...  2 0 0
  // ...  2 0 0
  // ...  2 8 0
  // ...  2 8 0
  // ...  2 8 16
  // ...  2 8 16)⊤75
  // ... ←→ (8 3⍴0 0 0
  // ...         1 0 0
  // ...         0 0 0
  // ...         0 0 0
  // ...         1 0 0
  // ...         0 1 0
  // ...         1 1 4
  // ...         1 3 11)
  '⊤':function(om,al){
    assert(al)
    var a=al.toArray(),b=om.toArray(),shape=al.shape.concat(om.shape),data=Array(prod(shape))
    var n=al.shape.length?al.shape[0]:1,m=a.length/n
    for(var i=0;i<m;i++)for(var j=0;j<b.length;j++){
      var y=Math.abs(b[j])
      for(var k=n-1;k>=0;k--){
        var x=a[k*m+i]
        data[(k*m+i)*b.length+j]=x?y%x:y
        y=x?Math.round((y-y%x)/x):0
      }
    }
    return new A(data,shape)
  }
})
addVocabulary({
  '∊':function(om,al){
    if(al){
      // 2 3 4 5 6∊1 2 3 5 8 13 21 ←→ 1 1 0 1 0
      // 5∊1 2 3 5 8 13 21         ←→ 1
      var b=om.toArray()
      return al.map(function(x){
        for(var i=0;i<b.length;i++)if(match(x,b[i]))return 1
        return 0
      })
    }else{
      // ∊17                   ←→ ,17
      // ⍴∊(1 2 3)"ABC"(4 5 6) ←→ ,9
      // ∊2 2⍴(1+2 2⍴⍳4)"DEF"(1+2 3⍴⍳6)(7 8 9) ←→ 1 2 3 4,'DEF',1 2 3 4 5 6 7 8 9
      var r=[];enlist(om,r);return new A(r)
    }
  }
})
function enlist(x,r){x instanceof A?each(x,function(y){enlist(y,r)}):r.push(x)}
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
addVocabulary({
  // ⍎'+/ 2 2 ⍴ 1 2 3 4'  ←→ 3 7
  // ⍴⍎'123 456'          ←→ ,2
  // ⍎'{⍵*2} ⍳5'          ←→ 0 1 4 9 16
  // ⍎'undefinedVariable' !!!
  // ⍎'1 2 (3'            !!!
  // ⍎123                 !!!
  '⍎':function(om,al){return al?nonceError():exec(om.toSimpleString())}
})
addVocabulary({
  '⍷':function(om,al){
    al||nonceError()
    // "AN"⍷"BANANA"                        ←→ 0 1 0 1 0 0
    // "BIRDS" "NEST"⍷"BIRDS" "NEST" "SOUP" ←→ 1 0 0
    // "ME"⍷"HOME AGAIN"                    ←→ 0 0 1 0 0 0 0 0 0 0
    //
    // "DAY"⍷7 9⍴("SUNDAY   ",
    // ...        "MONDAY   ",
    // ...        "TUESDAY  ",
    // ...        "WEDNESDAY",
    // ...        "THURSDAY ",
    // ...        "FRIDAY   ",
    // ...        "SATURDAY ")
    // ... ←→ (7 9⍴0 0 0 1 0 0 0 0 0
    // ...         0 0 0 1 0 0 0 0 0
    // ...         0 0 0 0 1 0 0 0 0
    // ...         0 0 0 0 0 0 1 0 0
    // ...         0 0 0 0 0 1 0 0 0
    // ...         0 0 0 1 0 0 0 0 0
    // ...         0 0 0 0 0 1 0 0 0)
    //
    // (2 2⍴"ABCD")⍷"ABCD" ←→ 4 ⍴ 0
    // (1 2)(3 4)⍷"START"(1 2 3)(1 2)(3 4) ←→ 0 0 1 0
    //
    // (2 2⍴7 8 12 13)⍷1+4 5⍴⍳20
    // ... ←→ 4 5⍴(0 0 0 0 0
    // ...         0 1 0 0 0
    // ...         0 0 0 0 0
    // ...         0 0 0 0 0)
    //
    // 1⍷⍳5                ←→ 0 1 0 0 0
    // 1 2⍷⍳5              ←→ 0 1 0 0 0
    // ⍬⍷⍳5                ←→ 1 1 1 1 1
    // ⍬⍷⍬                 ←→ ⍬
    // 1⍷⍬                 ←→ ⍬
    // 1 2 3⍷⍬             ←→ ⍬
    // (2 3 0⍴0)⍷(3 4 5⍴0) ←→ 3 4 5⍴1
    // (2 3 4⍴0)⍷(3 4 0⍴0) ←→ 3 4 0⍴0
    // (2 3 0⍴0)⍷(3 4 0⍴0) ←→ 3 4 0⍴0
    if(al.shape.length>om.shape.length)return new A([0],om.shape,repeat([0],om.shape.length))
    if(al.shape.length < om.shape.length){
      al=new A( // prepend ones to the shape of ⍺
        al.data,
        repeat([1],om.shape.length-al.shape.length).concat(al.shape),
        repeat([0],om.shape.length-al.shape.length).concat(al.stride),
        al.offset
      )
    }
    if(al.empty())return new A([1],om.shape,repeat([0],om.shape.length))
    var findShape=[]
    for(var i=0;i<om.shape.length;i++){
      var d=om.shape[i]-al.shape[i]+1
      if(d<=0)return new A([0],om.shape,repeat([0],om.shape.length))
      findShape.push(d)
    }
    var stride=strideForShape(om.shape),data=repeat([0],prod(om.shape))
    var p=om.offset,q=0,indices=repeat([0],findShape.length)
    while(1){
      data[q]=+match(al,new A(om.data,al.shape,om.stride,p))
      var a=findShape.length-1
      while(a>=0&&indices[a]+1===findShape[a]){p-=indices[a]*om.stride[a];q-=indices[a]*stride[a];indices[a--]=0}
      if(a<0)break
      p+=om.stride[a];q+=stride[a];indices[a]++
    }
    return new A(data,om.shape)
  }
})
addVocabulary({
  '⌊':withIdentity(Infinity,pervasive({
    // ⌊123   ←→ 123
    // ⌊12.3  ←→ 12
    // ⌊¯12.3 ←→ ¯13
    // ⌊¯123  ←→ ¯123
    // ⌊'a'   !!! DOMAIN ERROR
    // ⌊12j3      ←→ 12j3
    // ⌊1.2j2.3   ←→ 1j2
    // ⌊1.2j¯2.3  ←→ 1j¯3
    // ⌊¯1.2j2.3  ←→ ¯1j2
    // ⌊¯1.2j¯2.3 ←→ ¯1j¯3
    // ⌊0 5 ¯5 (○1) ¯1.5 ←→ 0 5 ¯5 3 ¯2
    monad:Z.floor,
    // 3⌊5 ←→ 3
    // ⌊/⍬ ←→ ¯
    dyad:real(function(y,x){return Math.min(y,x)})
  })),
  '⌈':withIdentity(-Infinity,pervasive({
    // ⌈123   ←→ 123
    // ⌈12.3  ←→ 13
    // ⌈¯12.3 ←→ ¯12
    // ⌈¯123  ←→ ¯123
    // ⌈'a'   !!! DOMAIN ERROR
    // ⌈12j3      ←→ 12j3
    // ⌈1.2j2.3   ←→ 1j3
    // ⌈1.2j¯2.3  ←→ 1j¯2
    // ⌈¯1.2j2.3  ←→ ¯1j3
    // ⌈¯1.2j¯2.3 ←→ ¯1j¯2
    // ⌈0 5 ¯5(○1)¯1.5 ←→ 0 5 ¯5 4 ¯1
    monad:Z.ceil,
    // 3⌈5 ←→ 5
    // ⌈/⍬ ←→ ¯¯
    dyad:real(function(y,x){return Math.max(y,x)})
  }))
})
addVocabulary({
  // Fork: `(fgh)⍵ ← → (f⍵)g(h⍵)` ; `⍺(fgh)⍵ ← → (⍺f⍵)g(⍺h⍵)`
  //
  // (+/÷⍴)4 5 10 7 ←→ ,6.5
  //
  // a←1 ⋄ b←¯22 ⋄ c←85
  // ... √←{⍵*.5}
  // ... ((-b)(+,-)√(b*2)-4×a×c)÷2×a
  // ... ←→ 17 5
  //
  // (+,-,×,÷)2  ←→ 2 ¯2 1 .5
  // 1(+,-,×,÷)2 ←→ 3 ¯1 2 .5
  _fork1:function(h,g){
    assert(typeof h==='function')
    assert(typeof g==='function')
    return[h,g]
  },
  _fork2:function(hg,f){
    var h=hg[0],g=hg[1]
    assert(typeof h==='function')
    return function(b,a){return g(h(b,a),f(b,a))}
  }
})
addVocabulary({
  // ⍕123            ←→ 1 3⍴'123'
  // ⍕123 456        ←→ 1 7⍴'123 456'
  // ⍕123 'a'        ←→ 1 5⍴'123 a'
  // ⍕12 'ab'        ←→ 1 7⍴'12  ab '
  // ⍕1 2⍴'a'        ←→ 1 2⍴'a'
  // ⍕2 2⍴'a'        ←→ 2 2⍴'a'
  // ⍕2 2⍴5          ←→ 2 3⍴('5 5',
  // ...                     '5 5')
  // ⍕2 2⍴0 0 0 'a'  ←→ 2 3⍴('0 0',
  // ...                     '0 a')
  // ⍕2 2⍴0 0 0 'ab' ←→ 2 6⍴('0   0 ',
  // ...                     '0  ab ')
  // ⍕2 2⍴0 0 0 123  ←→ 2 5⍴('0   0',
  // ...                     '0 123')
  // ⍕4 3 ⍴ '---' '---' '---' 1 2 3 4 5 6 100 200 300
  // ...             ←→ 4 17⍴(' ---   ---   --- ',
  // ...                      '   1     2     3 ',
  // ...                      '   4     5     6 ',
  // ...                      ' 100   200   300 ')
  // ⍕1 ⍬ 2 '' 3     ←→ 1 11⍴'1    2    3'
  // ⍕∞              ←→ 1 1⍴'∞'
  // ⍕¯∞             ←→ 1 2⍴'¯∞'
  // ⍕¯1             ←→ 1 2⍴'¯1'
  // ⍕¯1e¯100J¯2e¯99 ←→ 1 14⍴'¯1e¯100J¯2e¯99'
  '⍕':function(om,al){al&&nonceError();var t=format(om);return new A(t.join(''),[t.length,t[0].length])}
})

// Format an APL object as an array of strings
function format(a){
  var t=typeof a
  if(a===null)return['null']
  if(t==='undefined')return['undefined']
  if(t==='string')return[a]
  if(t==='number'){var r=[formatNumber(a)];r.align='right';return r}
  if(t==='function')return['#procedure']
  if(!(a instanceof A))return[''+a]
  if(a.empty())return['']

  var sa=a.shape
  a=a.toArray()
  if(!sa.length)return format(a[0])
  var nRows=prod(sa.slice(0,-1))
  var nCols=sa[sa.length-1]
  var rows=[];for(var i=0;i<nRows;i++)rows.push({height:0,bottomMargin:0})
  var cols=[];for(var i=0;i<nCols;i++)cols.push({type:0,width:0,leftMargin:0,rightMargin:0}) // type:0=characters,1=numbers,2=subarrays

  var grid=[]
  for(var i=0;i<nRows;i++){
    var r=rows[i],gridRow=[];grid.push(gridRow)
    for(var j=0;j<nCols;j++){
      var c=cols[j],x=a[nCols*i+j],box=format(x)
      r.height=Math.max(r.height,box.length)
      c.width=Math.max(c.width,box[0].length)
      c.type=Math.max(c.type,typeof x==='string'&&x.length===1?0:x instanceof A?2:1)
      gridRow.push(box)
    }
  }

  var step=1;for(var d=sa.length-2;d>0;d--){step*=sa[d];for(var i=step-1;i<nRows-1;i+=step)rows[i].bottomMargin++}

  for(var j=0;j<nCols;j++){
    var c=cols[j]
    if(j<nCols-1&&(c.type!==cols[j+1].type||c.type))c.rightMargin++
    if(c.type===2){c.leftMargin++;c.rightMargin++}
  }

  var result=[]
  for(var i=0;i<nRows;i++){
    var r=rows[i]
    for(var j=0;j<nCols;j++){
      var c=cols[j]
      var t=grid[i][j]
      var left =repeat(' ',c.leftMargin +(t.align==='right')*(c.width-t[0].length))
      var right=repeat(' ',c.rightMargin+(t.align!=='right')*(c.width-t[0].length))
      for(var k=0;k<t.length;k++)t[k]=left+t[k]+right
      var bottom=repeat(' ',t[0].length)
      for(var h=r.height+r.bottomMargin-t.length;h>0;h--)t.push(bottom)
    }
    var nk=r.height+r.bottomMargin
    for(var k=0;k<nk;k++){
      var s='';for(var j=0;j<nCols;j++)s+=grid[i][j][k]
      result.push(s)
    }
  }
  return result
}
addVocabulary({
  // ⍋13 8 122 4                  ←→ 3 1 0 2
  // a←13 8 122 4 ⋄ a[⍋a]         ←→ 4 8 13 122
  // ⍋"ZAMBIA"                    ←→ 1 5 3 4 2 0
  // s←"ZAMBIA" ⋄ s[⍋s]           ←→ 'AABIMZ'
  // t←3 3⍴"BOBALFZAK" ⋄ ⍋t       ←→ 1 0 2
  // t←3 3⍴4 5 6 1 1 3 1 1 2 ⋄ ⍋t ←→ 2 1 0
  //
  // t←3 3⍴4 5 6 1 1 3 1 1 2 ⋄ t[⍋t;]
  // ...    ←→ (3 3⍴ 1 1 2
  // ...              1 1 3
  // ...              4 5 6)
  //
  // a←3 2 3⍴2 3 4 0 1 0 1 1 3 4 5 6 1 1 2 10 11 12 ⋄ a[⍋a;;]
  // ... ←→ (3 2 3⍴ 1  1  2
  // ...           10 11 12
  // ...
  // ...            1  1  3
  // ...            4  5  6
  // ...
  // ...            2  3  4
  // ...            0  1  0)
  //
  // a←3 2 5⍴"joe  doe  bob  jonesbob  zwart"  ⋄  a[⍋a;;]
  // ... ←→ 3 2 5 ⍴ 'bob  jonesbob  zwartjoe  doe  '
  //
  // "ZYXWVUTSRQPONMLKJIHGFEDCBA"⍋"ZAMBIA" ←→ 0 2 4 3 1 5
  // ⎕A←"ABCDEFGHIJKLMNOPQRSTUVWXYZ" ⋄ (⌽⎕A)⍋3 3⍴"BOBALFZAK" ←→ 2 0 1
  //
  // data←6 4⍴"ABLEaBLEACREABELaBELACES"
  // ... coll←2 26⍴"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
  // ... data[coll⍋data;]
  // ...   ←→ 6 4⍴'ABELaBELABLEaBLEACESACRE'
  //
  // data←6 4⍴"ABLEaBLEACREABELaBELACES"
  // ... coll1←"AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz"
  // ... data[coll1⍋data;]
  // ...   ←→ 6 4⍴'ABELABLEACESACREaBELaBLE'
  //
  // ⍋0 1 2 3 4 3 6 6 4 9 1 11 12 13 14 15 ←→ 0 1 10 2 3 5 4 8 6 7 9 11 12 13 14 15
  '⍋':function(om,al){return grade(om,al,1)},

  // ⍒3 1 8 ←→ 2 0 1
  '⍒':function(om,al){return grade(om,al,-1)}
})

// Helper for ⍋ and ⍒
function grade(om,al,direction){
  var h={} // maps a character to its index in the collation
  if(al){
    al.shape.length||rankError()
    each(al,function(x,indices){typeof x==='string'||domainError();h[x]=indices[indices.length-1]})
  }
  om.shape.length||rankError()
  var r=[];for(var i=0;i<om.shape[0];i++)r.push(i)
  return new A(r.sort(function(i,j){
    var p=om.offset,indices=repeat([0],om.shape.length)
    while(1){
      var x=om.data[p+i*om.stride[0]],tx=typeof x
      var y=om.data[p+j*om.stride[0]],ty=typeof y
      if(tx<ty)return-direction
      if(tx>ty)return direction
      if(h[x]!=null)x=h[x]
      if(h[y]!=null)y=h[y]
      if(x<y)return-direction
      if(x>y)return direction
      var a=indices.length-1
      while(a>0&&indices[a]+1===om.shape[a]){p-=om.stride[a]*indices[a];indices[a--]=0}
      if(a<=0)break
      p+=om.stride[a];indices[a]++
    }
    return(i>j)-(i<j)
  }))
}
addVocabulary({
  // f←{⍺+2×⍵} ⋄ f/⍬           !!! DOMAIN ERROR
  // f←{⍺+2×⍵} ⋄ (f⍁123)/⍬     ←→ 123
  // f←{⍺+2×⍵} ⋄ (456⍁f)/⍬     ←→ 456
  // f←{⍺+2×⍵} ⋄ g←f⍁789 ⋄ f/⍬ !!! DOMAIN ERROR
  // {}⍁1 2                    !!! RANK ERROR
  // ({}⍁(1 1 1⍴123))/⍬        ←→ 123
  '⍁':conjunction(function(f,x){
    if(f instanceof A){var h=f;f=x;x=h}
    assert(typeof f==='function')
    assert(x instanceof A)
    x.isSingleton()||rankError()
    if(x.shape.length)x=A.scalar(x.unwrap())
    return withIdentity(x,function(om,al,axis){return f(om,al,axis)})
  })
})
addVocabulary({
  '⍳':function(om,al){
    if(al){
      // 2 5 9 14 20⍳9                           ←→ 2
      // 2 5 9 14 20⍳6                           ←→ 5
      // "GORSUCH"⍳"S"                           ←→ 3
      // "ABCDEFGHIJKLMNOPQRSTUVWXYZ"⍳"CARP"     ←→ 2 0 17 15
      // "ABCDEFGHIJKLMNOPQRSTUVWXYZ"⍳"PORK PIE" ←→ 15 14 17 10 26 15 8 4
      // "MON" "TUES" "WED"⍳"MON" "THURS"        ←→ 0 3
      // 1 3 2 0 3⍳⍳5                            ←→ 3 0 2 1 5
      // "CAT" "DOG" "MOUSE"⍳"DOG" "BIRD"        ←→ 1 3
      // 123⍳123                                 !!! RANK ERROR
      // (2 2⍴123)⍳123                           !!! RANK ERROR
      // 123 123⍳123                             ←→ 0
      // ⍬⍳123 234                               ←→ 0 0
      // 123 234⍳⍬                               ←→ ⍬
      al.shape.length===1||rankError()
      return om.map(function(x){
        var rank=al.shape
        try{each(al,function(y,indices){if(match(x,y)){rank=indices;throw'break'}})}
        catch(e){if(e!=='break')throw e}
        return rank.length===1?rank[0]:new A(rank)
      })
    }else{
      // ⍳5     ←→ 0 1 2 3 4
      // ⍴⍳5    ←→ 1 ⍴ 5
      // ⍳0     ←→ ⍬
      // ⍴⍳0    ←→ ,0
      // ⍳2 3 4 ←→ (2 3 4⍴(0 0 0)(0 0 1)(0 0 2)(0 0 3)
      // ...              (0 1 0)(0 1 1)(0 1 2)(0 1 3)
      // ...              (0 2 0)(0 2 1)(0 2 2)(0 2 3)
      // ...              (1 0 0)(1 0 1)(1 0 2)(1 0 3)
      // ...              (1 1 0)(1 1 1)(1 1 2)(1 1 3)
      // ...              (1 2 0)(1 2 1)(1 2 2)(1 2 3))
      // ⍴⍳2 3 4 ←→ 2 3 4
      // ⍳¯1 !!! DOMAIN ERROR
      om.shape.length<=1||rankError()
      var a=om.toArray();for(var i=0;i<a.length;i++)isInt(a[i],0)||domainError()
      var n=prod(a),data
      if(!n){
        data=[]
      }else if(a.length===1){
        data=n<=0x100      ?new Uint8Array (n):
             n<=0x10000    ?new Uint16Array(n):
             n<=0x100000000?new Uint32Array(n):
             domainError()
        for(var i=0;i<n;i++)data[i]=i
      }else{
        var m=Math.max.apply(Math,a)
        var ctor=m<=0x100      ?Uint8Array :
                 m<=0x10000    ?Uint16Array:
                 m<=0x100000000?Uint32Array:
                 domainError()
        var itemData=new ctor(n*a.length)
        var u=n
        for(var i=0;i<a.length;i++){
          u/=a[i];p=n*i
          for(var j=0;j<a[i];j++){itemData[p]=j;spread(itemData,p,1,u);p+=u}
          spread(itemData,n*i,a[i]*u,n)
        }
        data=[]
        var itemShape=[a.length],itemStride=[n]
        for(var i=0;i<n;i++)data.push(new A(itemData,itemShape,itemStride,i))
      }
      return new A(data,a)
    }
  }
})
addVocabulary({
  // ⍴⊂2 3⍴⍳6      ←→ ⍬
  // ⍴⍴⊂2 3⍴⍳6     ←→ ,0
  // ⊂[0]2 3⍴⍳6    ←→ (0 3)(1 4)(2 5)
  // ⍴⊂[0]2 3⍴⍳6   ←→ ,3
  // ⊂[1]2 3⍴⍳6    ←→ (0 1 2)(3 4 5)
  // ⍴⊂[1]2 3⍴⍳6   ←→ ,2
  // ⊃⊂[1 0]2 3⍴⍳6 ←→ 3 2⍴0 3 1 4 2 5
  // ⍴⊂[1 0]2 3⍴⍳6 ←→ ⍬
  // ⍴⊃⊂⊂1 2 3     ←→ ⍬
  '⊂':function(om,al,axes){
    assert(!al)
    if(axes==null){
      axes=[];for(var i=0;i<om.shape.length;i++)axes.push(i)
    }else{
      axes=getAxisList(axes,om.shape.length)
    }
    if(om.isSimple())return om
    var unitShape =axes.map(function(k){return om.shape [k]})
    var unitStride=axes.map(function(k){return om.stride[k]})
    var resultAxes=[];for(var k=0;k<om.shape.length;k++)axes.indexOf(k)<0&&resultAxes.push(k)
    var shape =resultAxes.map(function(k){return om.shape [k]})
    var stride=resultAxes.map(function(k){return om.stride[k]})
    var data=[]
    each(new A(om.data,shape,stride,om.offset),function(x,indices,p){data.push(new A(om.data,unitShape,unitStride,p))})
    return new A(data,shape)
  }
})
addVocabulary({
  '~': pervasive({
    // ~0 1 ←→ 1 0
    // ~2   !!! DOMAIN ERROR
    monad:function(x){return+!bool(x)}
  }),
  '∨':withIdentity(0,pervasive({
    // 1∨1               ←→ 1
    // 1∨0               ←→ 1
    // 0∨1               ←→ 1
    // 0∨0               ←→ 0
    // 0 0 1 1 ∨ 0 1 0 1 ←→ 0 1 1 1
    // 12∨18             ←→ 6 ⍝ 12=2×2×3, 18=2×3×3
    // 299∨323           ←→ 1 ⍝ 299=13×23, 323=17×19
    // 12345∨12345       ←→ 12345
    // 0∨123             ←→ 123
    // 123∨0             ←→ 123
    // ∨/⍬               ←→ 0
    // ¯12∨18            ←→ 6
    // 12∨¯18            ←→ 6
    // ¯12∨¯18           ←→ 6
    // 1.5∨2.5           !!! DOMAIN ERROR
    // 'a'∨1             !!! DOMAIN ERROR
    // 1∨'a'             !!! DOMAIN ERROR
    // 'a'∨'b'           !!! DOMAIN ERROR
    // 135j¯14∨155j34    ←→ 5j12
    // 2 3 4∨0j1 1j2 2j3 ←→ 1 1 1
    // 2j2 2j4∨5j5 4j4   ←→ 1j1 2
    dyad:function(y,x){
      if(!Z.isint(x)||!Z.isint(y))domainError('∨ is implemented only for Gaussian integers')
      return Z.gcd(x,y)
    }
  })),
  '∧':withIdentity(1,pervasive({
    // 1∧1                            ←→ 1
    // 1∧0                            ←→ 0
    // 0∧1                            ←→ 0
    // 0∧0                            ←→ 0
    // 0 0 1 1∧0 1 0 1                ←→ 0 0 0 1
    // 0 0 0 1 1∧1 1 1 1 0            ←→ 0 0 0 1 0
    // t←3 3⍴1 1 1 0 0 0 1 0 1 ⋄ 1∧t  ←→ 3 3 ⍴ 1 1 1 0 0 0 1 0 1
    // t←3 3⍴1 1 1 0 0 0 1 0 1 ⋄ ∧/t  ←→ 1 0 0
    // 12∧18   # 12=2×2×3, 18=2×3×3   ←→ 36
    // 299∧323 # 299=13×23, 323=17×19 ←→ 96577
    // 12345∧12345                    ←→ 12345
    // 0∧123                          ←→ 0
    // 123∧0                          ←→ 0
    // ∧/⍬                            ←→ 1
    // ¯12∧18                         ←→ ¯36
    // 12∧¯18                         ←→ ¯36
    // ¯12∧¯18                        ←→ 36
    // 1.5∧2.5                        !!! DOMAIN ERROR
    // 'a'∧1                          !!! DOMAIN ERROR
    // 1∧'a'                          !!! DOMAIN ERROR
    // 'a'∧'b'                        !!! DOMAIN ERROR
    // 135j¯14∧155j34                 ←→ 805j¯1448
    // 2 3 4∧0j1 1j2 2j3              ←→ 0j2 3j6 8j12
    // 2j2 2j4∧5j5 4j4                ←→ 10j10 ¯4j12
    dyad:function(y,x){
      if(!Z.isint(x)||!Z.isint(y))domainError('∧ is implemented only for Gaussian integers')
      return Z.lcm(x,y)
    }
  })),
  // 0⍱0 ←→ 1
  // 0⍱1 ←→ 0
  // 1⍱0 ←→ 0
  // 1⍱1 ←→ 0
  // 0⍱2 !!! DOMAIN ERROR
  '⍱':pervasive({dyad:real(function(y,x){return+!(bool(x)|bool(y))})}),
  // 0⍲0 ←→ 1
  // 0⍲1 ←→ 1
  // 1⍲0 ←→ 1
  // 1⍲1 ←→ 0
  // 0⍲2 !!! DOMAIN ERROR
  '⍲':pervasive({dyad:real(function(y,x){return+!(bool(x)&bool(y))})})
})
addVocabulary({
  // ({⍵+1}⍣5) 3 ←→ 8
  // ({⍵+1}⍣0) 3 ←→ 3
  // (⍴⍣3)2 2⍴⍳4 ←→ ,1
  // 'a'(,⍣3)'b' ←→ 'aaab'
  // 1(+÷)⍣=1    ←→ 1.618033988749895
  // c←0 ⋄ 5⍣{c←c+1}0 ⋄ c ←→ 5
  '⍣':conjunction(function(g,f){
    if(f instanceof A&&typeof g==='function'){var h=f;f=g;g=h}else{assert(typeof f==='function')}
    if(typeof g==='function'){
      return function(om,al){
        while(1){
          var om1=f(om,al)
          if(g(om,om1).toBool())return om
          om=om1
        }
      }
    }else{
      var n=g.toInt(0)
      return function(om,al){
        for(var i=0;i<n;i++)om=f(om,al)
        return om
      }
    }
  })
})
addVocabulary({
  'get_⎕':cps(function(_,_1,_2,callback){
    if(typeof window!=='undefined'&&typeof window.prompt==='function'){
      setTimeout(function(){callback(exec(prompt('⎕:')||''))},0)
    }else{
      process.stdout.write('⎕:\n')
      readline('      ',function(line){callback(exec(new A(line).toSimpleString()))})
    }
  }),
  'set_⎕': function(x) {
    var s=format(x).join('\n')+'\n'
    if(typeof window!=='undefined'&&typeof window.alert==='function'){window.alert(s)}else{process.stdout.write(s)}
    return x
  },
  'get_⍞':cps(function(_,_1,_2,callback){
    if(typeof window!=='undefined'&&typeof window.prompt==='function'){
      setTimeout(function(){callback(new A(prompt('')||''))},0)
    }else{
      readline('',function(line){callback(new A(line))})
    }
  }),
  'set_⍞':function(x){
    var s=format(x).join('\n')
    if(typeof window!=='undefined'&&typeof window.alert==='function'){window.alert(s)}else{process.stdout.write(s)}
    return x
  },
  // The index origin is fixed at 0.  Reading it returns 0.  Attempts to set it
  // to anything other than that fail.
  //
  // ⎕IO   ←→ 0
  // ⎕IO←0 ←→ 0
  // ⎕IO←1 !!!
  'get_⎕IO':function(){return A.zero},
  'set_⎕IO':function(x){if(match(x,A.zero)){return x}else{domainError('The index origin (⎕IO) is fixed at 0')}},
  '⎕DL':cps(function(om,al,_,callback){
    var t0=+new Date;setTimeout(function(){callback(new A([new Date-t0]))},om.unwrap())
  }),
  // 'b(c+)d'⎕RE'abcd' ←→ 1 'bcd' (,'c')
  // 'B(c+)d'⎕RE'abcd' ←→ ⍬
  // 'a(b'   ⎕RE'c'           !!! DOMAIN ERROR
  '⎕RE':function(om,al){
    var x=al.toSimpleString(),y=om.toSimpleString()
    try{var re=RegExp(x)}catch(e){domainError(e.toString())}
    var m=re.exec(y)
    if(!m)return A.zilde
    var r=[m.index];for(var i=0;i<m.length;i++)r.push(new A(m[i]||''))
    return new A(r)
  },
  // ⎕UCS'a' ←→ 97
  // ⎕UCS'ab' ←→ 97 98
  // ⎕UCS 2 2⍴97+⍳4 ←→ 2 2⍴'abcd'
  '⎕UCS':function(om,al){
    al&&nonceError()
    return om.map(function(x){
      return isInt(x,0,0x10000)?String.fromCharCode(x):typeof x==='string'?x.charCodeAt(0):domainError()
    })
  },
  'get_⎕OFF':function(){typeof process==='undefined'&&nonceError();process.exit(0)}
})
addVocabulary({
  '?':function(om,al){return al?deal(om,al):roll(om)}
})

// n←6 ⋄ r←?n ⋄ (0≤r)∧(r<n) ←→ 1
// ?0   !!! DOMAIN ERROR
// ?1   ←→ 0
// ?1.5 !!! DOMAIN ERROR
// ?'a' !!! DOMAIN ERROR
// ?1j2 !!! DOMAIN ERROR
// ?∞   !!! DOMAIN ERROR
var roll=pervasive({monad:function(om){isInt(om,1)||domainError();return Math.floor(Math.random()*om)}})

// n←100 ⋄ (+/n?n)=(+/⍳n) ←→ 1 # a permutation (an "n?n" dealing) contains all 0...n
// n←100 ⋄ A←(n÷2)?n ⋄ ∧/(0≤A),A<n ←→ 1 # any number x in a dealing is 0 <= x < n
// 0?100 ←→ ⍬
// 0?0   ←→ ⍬
// 1?1   ←→ ,0
// 1?1 1 !!! LENGTH ERROR
// 5?3   !!! DOMAIN ERROR
// ¯1?3  !!! DOMAIN ERROR
function deal(om,al){
  al=al.unwrap();om=om.unwrap()
  isInt(om,0)&&isInt(al,0,om+1)||domainError()
  var r=Array(om);for(var i=0;i<om;i++)r[i]=i
  for(var i=0;i<al;i++){var j=i+Math.floor(Math.random()*(om-i));h=r[i];r[i]=r[j];r[j]=h}
  return new A(r.slice(0,al))
}
addVocabulary({
  // ↗'CUSTOM ERROR' !!! CUSTOM ERROR
  '↗':function(om){aplError(om.toString())}
})
addVocabulary({
  '⍴':function(om,al){
    if(al){
      // ⍴1 2 3⍴0  ←→ 1 2 3
      // ⍴⍴1 2 3⍴0 ←→ ,3
      // 3 3⍴⍳4    ←→ 3 3⍴0 1 2 3 0 1 2 3 0
      // ⍴3 3⍴⍳4   ←→ 3 3
      // ⍬⍴123     ←→ 123
      // ⍬⍴⍬       ←→ 0
      // 2 3⍴⍬     ←→ 2 3⍴0
      // 2 3⍴⍳7    ←→ 2 3⍴0 1 2 3 4 5
      // ⍴1e9⍴0    ←→ ,1e9
      al.shape.length<=1||rankError()
      var a=al.toArray(),n=prod(a)
      for(var i=0;i<a.length;i++)isInt(a[i],0)||domainError
      if(!n){
        return new A([],a)
      }else if(a.length>=om.shape.length&&arrayEquals(om.shape,a.slice(a.length-om.shape.length))){
        // If ⍺ is only prepending axes to ⍴⍵, we can reuse the .data array
        return new A(om.data,a,repeat([0],a.length-om.shape.length).concat(om.stride),om.offset)
      }else{
        var data=[]
        try{
          each(om,function(x){
            if(data.length>=n)throw'break'
            data.push(x)
          })
        }catch(e){
          if(e!=='break')throw e
        }
        if(data.length){
          while(2*data.length<n)data=data.concat(data)
          if(data.length!==n)data=data.concat(data.slice(0,n-data.length))
        }else{
          data=repeat([om.getPrototype()],n)
        }
        return new A(data,a)
      }
    }else{
      // ⍴0       ←→ 0⍴0
      // ⍴0 0     ←→ 1⍴2
      // ⍴⍴0      ←→ 1⍴0
      // ⍴⍴⍴0     ←→ 1⍴1
      // ⍴⍴⍴0 0   ←→ 1⍴1
      // ⍴'a'     ←→ 0⍴0
      // ⍴'ab'    ←→ 1⍴2
      // ⍴2 3 4⍴0 ←→ 2 3 4
      return new A(om.shape)
    }
  }
})
var rotate
addVocabulary({
  '⌽': rotate = function(om, al, axis) {
    assert(typeof axis==='undefined'||axis instanceof A)
    if(al){
      // 1⌽1 2 3 4 5 6             ←→ 2 3 4 5 6 1
      // 3⌽'ABCDEFGH'              ←→ 'DEFGHABC'
      // 3⌽2 5⍴1 2 3 4 5 6 7 8 9 0 ←→ 2 5⍴4 5 1 2 3 9 0 6 7 8
      // ¯2⌽"ABCDEFGH"             ←→ 'GHABCDEF'
      // 1⌽3 3⍴⍳9                  ←→ 3 3⍴1 2 0 4 5 3 7 8 6
      // 0⌽1 2 3 4                 ←→ 1 2 3 4
      // 0⌽1234                    ←→ 1234
      // 5⌽⍬                       ←→ ⍬
      axis=axis?axis.unwrap():om.shape.length-1 
      isInt(axis)||domainError()
      if(om.shape.length&&!(0<=axis&&axis<om.shape.length))indexError()
      var step=al.unwrap()
      isInt(step)||domainError()
      if(!step)return om
      var n=om.shape[axis]
      step=(n+step%n)%n // force % to handle negatives properly
      if(om.empty()||!step)return om
      var data=[],shape=om.shape,stride=om.stride,p=om.offset,indices=repeat([0],shape.length)
      while(1){
        data.push(om.data[p+((indices[axis]+step)%shape[axis]-indices[axis])*stride[axis]])
        var a=shape.length-1
        while(a>=0&&indices[a]+1===shape[a]){p-=indices[a]*stride[a];indices[a--]=0}
        if(a<0)break
        indices[a]++;p+=stride[a]
      }
      return new A(data,shape)
    }else{
      // ⌽1 2 3 4 5 6                 ←→ 6 5 4 3 2 1
      // ⌽(1 2)(3 4)(5 6)             ←→ (5 6)(3 4)(1 2)
      // ⌽"BOB WON POTS"              ←→ 'STOP NOW BOB'
      // ⌽    2 5⍴1 2 3 4 5 6 7 8 9 0 ←→ 2 5⍴5 4 3 2 1 0 9 8 7 6
      // ⌽[0] 2 5⍴1 2 3 4 5 6 7 8 9 0 ←→ 2 5⍴6 7 8 9 0 1 2 3 4 5
      if(axis){
        axis.isSingleton()||lengthError()
        axis=axis.unwrap()
        isInt(axis)||domainError()
        0<=axis&&axis<om.shape.length||indexError()
      }else{
        axis=[om.shape.length-1]
      }
      if(!om.shape.length)return om
      var stride=om.stride.slice(0);stride[axis]=-stride[axis]
      var offset=om.offset+(om.shape[axis]-1)*om.stride[axis]
      return new A(om.data,om.shape,stride,offset)
    }
  },
  // ⊖1 2 3 4 5 6                 ←→ 6 5 4 3 2 1
  // ⊖(1 2) (3 4) (5 6)           ←→ (5 6)(3 4)(1 2)
  // ⊖'BOB WON POTS'              ←→ 'STOP NOW BOB'
  // ⊖    2 5⍴1 2 3 4 5 6 7 8 9 0 ←→ 2 5⍴6 7 8 9 0 1 2 3 4 5
  // ⊖[1] 2 5⍴1 2 3 4 5 6 7 8 9 0 ←→ 2 5⍴5 4 3 2 1 0 9 8 7 6
  // 1⊖3 3⍴⍳9 ←→ 3 3⍴3 4 5 6 7 8 0 1 2
  '⊖':function(om,al,axis){return rotate(om,al,axis||A.zero)}
})
var reduce
addVocabulary({
  '⌿':adverb(function(om,al,axis){return reduce(om,al,axis||A.zero)}),
  '/':reduce=adverb(function(om,al,axis){
    if(typeof om==='function'){
      // +/3                    ←→ 3
      // +/3 5 8                ←→ 16
      // ⌈/82 66 93 13          ←→ 93
      // ×/2 3⍴1 2 3 4 5 6      ←→ 6 120
      // 2,/'ab' 'cd' 'ef' 'hi' ←→ 'abcd' 'cdef' 'efhi'
      // 3,/'ab' 'cd' 'ef' 'hi' ←→ 'abcdef' 'cdefhi'
      // -/3 0⍴42               ←→ 3⍴0
      // 2+/1+⍳10    ←→ 3 5 7 9 11 13 15 17 19
      // 5+/1+⍳10    ←→ 15 20 25 30 35 40
      // 10+/1+⍳10   ←→ ,55
      // 11+/1+⍳10   ←→ ⍬
      // 12+/1+⍳10   !!! LENGTH ERROR
      // 2-/3 4 9 7  ←→ ¯1 ¯5 2
      // ¯2-/3 4 9 7 ←→ 1 5 ¯2
      var f=om,g=al,axis0=axis
      assert(typeof f==='function')
      assert(typeof g==='undefined')
      assert(typeof axis0==='undefined'||axis0 instanceof A)
      return function(om, al){
        if(!om.shape.length)om=new A([om.unwrap()])
        axis=axis0?axis0.toInt():om.shape.length-1
        0<=axis&&axis<om.shape.length||rankError()
        var n,isNWise,isBackwards
        if(al){isNWise=1;n=al.toInt();if(n<0){isBackwards=1;n=-n}}else{n=om.shape[axis]}

        var shape=om.shape.slice(0);shape[axis]=om.shape[axis]-n+1
        var rShape=shape
        if(isNWise){
          if(!shape[axis])return new A([],rShape)
          shape[axis]>=0||lengthError()
        }else{
          rShape=rShape.slice(0);rShape.splice(axis,1)
        }

        if(om.empty()){
          var z=f.identity;z!=null||domainError();assert(!z.shape.length)
          return new A(z.data,rShape,repeat([0],rShape.length),z.offset)
        }

        var data=[],indices=repeat([0],shape.length),p=om.offset
        while(1){
          if(isBackwards){
            var x=om.data[p];x instanceof A||(x=A.scalar(x))
            for(var i=1;i<n;i++){
              var y=om.data[p+i*om.stride[axis]];y instanceof A||(y=A.scalar(y))
              x=f(x,y)
            }
          }else{
            var x=om.data[p+(n-1)*om.stride[axis]];x instanceof A||(x=A.scalar(x))
            for(var i=n-2;i>=0;i--){
              var y=om.data[p+i*om.stride[axis]];y instanceof A||(y=A.scalar(y))
              x=f(x,y)
            }
          }
          x.shape.length||(x=x.unwrap())
          data.push(x)
          var a=indices.length-1
          while(a>=0&&indices[a]+1===shape[a]){p-=indices[a]*om.stride[a];indices[a--]=0}
          if(a<0)break
          p+=om.stride[a];indices[a]++
        }
        return new A(data,rShape)
      }
    }else{
      // 0 1 0 1/'abcd'                   ←→ 'bd'
      // 1 1 1 1 0/12 14 16 18 20         ←→ 12 14 16 18
      // m←45 60 33 50 66 19 ⋄ (m≥50)/m   ←→ 60 50 66
      // m←45 60 33 50 66 19 ⋄ (m=50)/⍳≢m ←→ ,3
      // 1/'ab'                           ←→ 'ab'
      // 0/'ab'                           ←→ ⍬
      // 0 1 0/ 1+2 3⍴⍳6                  ←→ 2 1⍴2 5
      // 1 0/[0]1+2 3⍴⍳6                  ←→ 1 3⍴1 2 3
      // 1 0⌿   1+2 3⍴⍳6                  ←→ 1 3⍴1 2 3
      // 3/5                              ←→ 5 5 5
      // 2 ¯2 2/1+2 3⍴⍳6           ←→ 2 6⍴  1 1 0 0 3 3  4 4 0 0 6 6
      // 1 1 ¯2 1 1/1 2(2 2⍴⍳4)3 4 ←→ 1 2 0 0 3 4
      // 2 3 2/'abc'               ←→ 'aabbbcc'
      // 2/'def'                   ←→ 'ddeeff'
      // 5 0 5/1 2 3               ←→ 1 1 1 1 1 3 3 3 3 3
      // 2/1+2 3⍴⍳6                ←→ 2 6⍴ 1 1 2 2 3 3  4 4 5 5 6 6
      // 2⌿1+2 3⍴⍳6                ←→ 4 3⍴ 1 2 3  1 2 3  4 5 6  4 5 6
      // 2 3/3 1⍴'abc'             ←→ 3 5⍴'aaaaabbbbbccccc'
      // 2 ¯1 2/[1]3 1⍴7 8 9       ←→ 3 5⍴7 7 0 7 7 8 8 0 8 8 9 9 0 9 9
      // 2 ¯1 2/[1]3 1⍴'abc'       ←→ 3 5⍴'aa aabb bbcc cc'
      // 2 ¯2 2/7                  ←→ 7 7 0 0 7 7
      om.shape.length||(om=new A([om.unwrap()]))
      axis=axis?axis.toInt(0,om.shape.length):om.shape.length-1
      al.shape.length<=1||rankError()
      var a=al.toArray(),n=om.shape[axis]
      if(a.length===1)a=repeat(a,n)
      if(n!==1&&n!==a.length)lengthError()

      var shape=om.shape.slice(0);shape[axis]=0
      var b=[]
      for(var i=0;i<a.length;i++){
        var x=a[i]
        isInt(x)||domainError()
        shape[axis]+=Math.abs(x)
        var nj=Math.abs(x);for(var j=0;j<nj;j++)b.push(x>0?i:null)
      }
      if(n===1)for(var i=0;i<b.length;i++)b[i]=b[i]==null?b[i]:0

      var data=[]
      if(shape[axis]&&!om.empty()){
        var filler=om.getPrototype(),p=om.offset,indices=repeat([0],shape.length)
        while(1){
          data.push(b[indices[axis]]==null?filler:om.data[p+b[indices[axis]]*om.stride[axis]])
          var i=shape.length-1
          while(i>=0&&indices[i]+1===shape[i]){
            if(i!==axis)p-=om.stride[i]*indices[i]
            indices[i--]=0
          }
          if(i<0)break
          if(i!==axis)p+=om.stride[i]
          indices[i]++
        }
      }
      return new A(data,shape)
    }
  })
})
var squish
addVocabulary({
  // "a0 a1...⌷b" is equivalent to "b[a0;a1;...]"
  //
  // 1⌷3 5 8                ←→ 5
  // (3 5 8)[1]             ←→ 5
  // (3 5 8)[⍬]             ←→ ⍬
  // (2 2 0)(1 2)⌷3 3⍴⍳9    ←→ 3 2⍴7 8 7 8 1 2
  // ¯1⌷3 5 8               !!! INDEX ERROR
  // 2⌷111 222 333 444      ←→ 333
  // (⊂3 2)⌷111 222 333 444 ←→ 444 333
  // (⊂2 3⍴2 0 3 0 1 2)⌷111 222 333 444 ←→ 2 3⍴333 111 444 111 222 333
  // 1 0   ⌷3 4⍴11 12 13 14 21 22 23 24 31 32 33 34 ←→ 21
  // 1     ⌷3 4⍴11 12 13 14 21 22 23 24 31 32 33 34 ←→ 21 22 23 24
  // 2(1 0)⌷3 4⍴11 12 13 14 21 22 23 24 31 32 33 34 ←→ 32 31
  // (1 2)0⌷3 4⍴11 12 13 14 21 22 23 24 31 32 33 34 ←→ 21 31
  // a←2 2⍴0 ⋄ a[;0]←1 ⋄ a ←→ 2 2⍴1 0 1 0
  // a←2 3⍴0 ⋄ a[1;0 2]←1 ⋄ a ←→ 2 3⍴0 0 0 1 0 1
  '⌷':squish=function(om,al,axes){
    if(typeof om==='function')return function(x,y){return om(x,y,al)}
    al||nonceError()
    al.shape.length>1&&rankError()
    var a=al.toArray();a.length>om.shape.length&&lengthError()

    if(axes){
      axes=axes.toArray()
      a.length===axes.length||lengthError()
      var h=Array(om.shape.length)
      for(var i=0;i<axes.length;i++){
        var axis=axes[i]
        isInt(axis)||domainError()
        0<=axis&&axis<om.shape.length||rankError()
        h[axis]&&rankError('Duplicate axis')
        h[axis]=1
      }
    }else{
      axes=[];for(var i=0;i<a.length;i++)axes.push(i)
    }

    var r=om
    for(var i=a.length-1;i>=0;i--){
      var u=a[i]instanceof A?a[i]:new A([a[i]],[])
      r=indexAtSingleAxis(r,u,axes[i])
    }
    return r
  },

  // (23 54 38)[0]                       ←→ 23
  // (23 54 38)[1]                       ←→ 54
  // (23 54 38)[2]                       ←→ 38
  // (23 54 38)[3]                       !!! INDEX ERROR
  // (23 54 38)[¯1]                      !!! INDEX ERROR
  // (23 54 38)[0 2]                     ←→ 23 38
  // (2 3⍴100 101 102 110 111 112)[1;2]  ←→ 112
  // (2 3⍴100 101 102 110 111 112)[1;¯1] !!! INDEX ERROR
  // (2 3⍴100 101 102 110 111 112)[10;1] !!! INDEX ERROR
  // (2 3⍴100 101 102 110 111 112)[1;]   ←→ 110 111 112
  // (2 3⍴100 101 102 110 111 112)[;1]   ←→ 101 111
  // 'hello'[1]                          ←→ 'e'
  // 'ipodlover'[1 2 5 8 3 7 6 0 4]      ←→ 'poordevil'
  // ('axlrose'[4 3 0 2 5 6 1])[0 1 2 3] ←→ 'oral'
  // (1 2 3)[⍬]                          ←→ ⍬
  // ⍴(1 2 3)[1 2 3 0 5⍴0]               ←→ 1 2 3 0 5
  // (⍳3)[]                              ←→ ⍳3
  // ⍴(3 3⍴⍳9)[⍬;⍬]                      ←→ 0 0
  //
  // " X"[(3 3⍴⍳9)∊1 3 6 7 8] ←→ 3 3⍴(' X ',
  // ...                              'X  ',
  // ...                              'XXX')
  _index:function(alphaAndAxes,om){
    var h=alphaAndAxes.toArray(),al=h[0],axes=h[1]
    return squish(om,al,axes)
  },

  // a←⍳5 ⋄ a[1 3]←7 8 ⋄ a ←→ 0 7 2 8 4
  // a←⍳5 ⋄ a[1 3]←7   ⋄ a ←→ 0 7 2 7 4
  // a←⍳5 ⋄ a[1]  ←7 8 ⋄ a !!! RANK ERROR
  // a←1 2 3 ⋄ a[1]←4 ⋄ a ←→ 1 4 3
  // a←2 2⍴⍳4 ⋄ a[0;0]←4 ⋄ a ←→ 2 2⍴4 1 2 3
  // a←5 5⍴0 ⋄ a[1 3;2 4]←2 2⍴1+⍳4 ⋄ a ←→ 5 5⍴(0 0 0 0 0
  // ...                                       0 0 1 0 2
  // ...                                       0 0 0 0 0
  // ...                                       0 0 3 0 4
  // ...                                       0 0 0 0 0)
  // a←'this is a test' ⋄ a[0 5]←'TI' ←→ 'This Is a test'
  // Data←0 4 8 ⋄ 10+ (Data[0 2]← 7 9) ←→ 17 14 19
  // a←3 4⍴⍳12 ⋄ a[;1 2]←99 ←→ 3 4⍴0 99 99 3 4 99 99 7 8 99 99 11
  // a←1 2 3 ⋄ a[⍬]←4 ⋄ a ←→ 1 2 3
  // a←3 3⍴⍳9 ⋄ a[⍬;1 2]←789 ⋄ a ←→ 3 3⍴⍳9
  // a←1 2 3 ⋄ a[]←4 5 6 ⋄ a ←→ 4 5 6
  _substitute:function(args){
    var h=args.toArray().map(function(x){return x instanceof A?x:new A([x],[])})
    var value=h[0],al=h[1],om=h[2],axes=h[3]

    al.shape.length>1&&rankError()
    var a=al.toArray();a.length>om.shape.length&&lengthError()

    if(axes){
      axes.shape.length>1&&rankError()
      axes=axes.toArray()
      a.length===axes.length||lengthError()
    }else{
      axes=[];for(var i=0;i<a.length;i++)a.push(i)
    }

    var subs=squish(vocabulary['⍳'](new A(om.shape)),al,new A(axes))
    if(value.isSingleton())value=new A([value],subs.shape,repeat([0],subs.shape.length))
    var data=om.toArray(),stride=strideForShape(om.shape)
    each2(subs,value,function(u,v){
      if(v instanceof A&&!v.shape.length)v=v.unwrap()
      if(u instanceof A){
        var p=0,ua=u.toArray()
        for(var i=0;i<ua.length;i++)p+=ua[i]*stride[i]
        data[p]=v
      }else{
        data[u]=v
      }
    })
    return new A(data,om.shape)
  }
})

function indexAtSingleAxis(om,sub,ax){
  assert(om instanceof A&&sub instanceof A&&isInt(ax)&&0<=ax&&ax<om.shape.length)
  var u=sub.toArray(),n=om.shape[ax]
  for(var i=0;i<u.length;i++){isInt(u[i])||domainError();0<=u[i]&&u[i]<n||indexError()}
  var isUniform=0
  if(u.length>=2){var d=u[1]-u[0];isUniform=1;for(var i=2;i<u.length;i++)if(u[i]-u[i-1]!==d){isUniform=0;break}}
  if(isUniform){
    var shape=om.shape.slice(0);shape.splice.apply(shape,[ax,1].concat(sub.shape))
    var stride=om.stride.slice(0)
    var subStride=strideForShape(sub.shape)
    for(var i=0;i<subStride.length;i++)subStride[i]*=d*om.stride[ax]
    stride.splice.apply(stride,[ax,1].concat(subStride))
    var offset=om.offset+u[0]*om.stride[ax]
    return new A(om.data,shape,stride,offset)
  }else{
    var shape1=om.shape.slice(0);shape1.splice(ax,1)
    var stride1=om.stride.slice(0);stride1.splice(ax,1)
    var data=[]
    each(sub,function(x){
      var chunk=new A(om.data,shape1,stride1,om.offset+x*om.stride[ax])
      data.push.apply(data,chunk.toArray())
    })
    var shape = shape1.slice(0)
    var stride = strideForShape(shape)
    shape.splice.apply(shape,[ax, 0].concat(sub.shape))
    var subStride = strideForShape (sub.shape)
    var k=prod(shape1)
    for(var i=0;i<subStride.length;i++)subStride[i]*=k
    stride.splice.apply(stride,[ax,0].concat(subStride))
    return new A(data,shape,stride)
  }
}
addVocabulary({
  '↑':function(om,al){return al?take(om,al):first(om)}
})

// 5↑'ABCDEFGH'     ←→ 'ABCDE'
// ¯3↑'ABCDEFGH'    ←→ 'FGH'
// 3↑22 2 19 12     ←→ 22 2 19
// ¯1↑22 2 19 12    ←→ ,12
// ⍴1↑(2 2⍴⍳4)(⍳10) ←→ ,1
// 2↑1              ←→ 1 0
// 5↑40 92 11       ←→ 40 92 11 0 0
// ¯5↑40 92 11      ←→ 0 0 40 92 11
// 3 3↑1 1⍴0        ←→ 3 3⍴0 0 0 0 0 0 0 0 0
// 5↑"abc"          ←→ 'abc  '
// ¯5↑"abc"         ←→ '  abc'
// 3 3↑1 1⍴"a"      ←→ 3 3⍴'a        '
// 2 3↑1+4 3⍴⍳12    ←→ 2 3⍴1 2 3 4 5 6
// ¯1 3↑1+4 3⍴⍳12   ←→ 1 3⍴10 11 12
// 1 2↑1+4 3⍴⍳12    ←→ 1 2⍴1 2
// 3↑⍬              ←→ 0 0 0
// ¯2↑⍬             ←→ 0 0
// 0↑⍬              ←→ ⍬
// 3 3↑1            ←→ 3 3⍴1 0 0 0 0 0 0 0 0
// 2↑3 3⍴⍳9         ←→ 2 3⍴⍳6
// ¯2↑3 3⍴⍳9        ←→ 2 3⍴3+⍳6
// 4↑3 3⍴⍳9         ←→ 4 3⍴(⍳9),0 0 0
// ⍬↑3 3⍴⍳9         ←→ 3 3⍴⍳9
function take(om,al){
  al.shape.length<=1||rankError()
  if(!om.shape.length)om=new A([om.unwrap()],al.shape.length?repeat([1],al.shape[0]):[1])
  var a=al.toArray()
  a.length<=om.shape.length||rankError()
  for(var i=0;i<a.length;i++)typeof a[i]==='number'&&a[i]===Math.floor(a[i])||domainError()
  var mustCopy=0,shape=om.shape.slice(0)
  for(var i=0;i<a.length;i++){shape[i]=Math.abs(a[i]);if(shape[i]>om.shape[i])mustCopy=1}
  if(mustCopy){
    var stride=Array(shape.length);stride[stride.length-1]=1
    for(var i=stride.length-2;i>=0;i--)stride[i]=stride[i+1]*shape[i+1]
    var data=repeat([om.getPrototype()],prod(shape))
    var copyShape=shape.slice(0),p=om.offset,q=0
    for(var i=0;i<a.length;i++){
      var x=a[i];copyShape[i]=Math.min(om.shape[i],Math.abs(x))
      if(x<0){if(x<-om.shape[i]){q-=(x+om.shape[i])*stride[i]}else{p+=(x+om.shape[i])*om.stride[i]}}
    }
    if(prod(copyShape)){
      var copyIndices=repeat([0],copyShape.length)
      while(1){
        data[q]=om.data[p];axis=copyShape.length-1
        while(axis>=0&&copyIndices[axis]+1===copyShape[axis]){
          p-=copyIndices[axis]*om.stride[axis];q-=copyIndices[axis]*stride[axis];copyIndices[axis--]=0
        }
        if(axis<0)break
        p+=om.stride[axis];q+=stride[axis];copyIndices[axis]++
      }
    }
    return new A(data,shape,stride)
  }else{
    var offset=om.offset;for(var i=0;i<a.length;i++)if(a[i]<0)offset+=(om.shape[i]+a[i])*om.stride[i]
    return new A(om.data,shape,om.stride,offset)
  }
}

// ↑(1 2 3)(4 5 6) ←→ 1 2 3
// ↑(1 2)(3 4 5)   ←→ 1 2
// ↑'AB'           ←→ 'A'
// ↑123            ←→ 123
// ↑⍬              ←→ 0
//! ↑''             ←→ ' '
function first(om){var x=om.empty()?om.getPrototype():om.data[om.offset];return x instanceof A?x:new A([x],[])}
addVocabulary({
  '⍉':function(om,al){
    if(al){
      // (2 2⍴⍳4)⍉2 2 2 2⍴⍳16 !!! RANK ERROR
      // 0⍉3 5 8 ←→ 3 5 8
      // 1 0⍉2 2 2⍴⍳8 !!! LENGTH ERROR
      // ¯1⍉1 2 !!! DOMAIN ERROR
      // 'a'⍉1 2 !!! DOMAIN ERROR
      // 2⍉1 2 !!! RANK ERROR
      // 2 0 1⍉2 3 4⍴⍳24 ←→ 3 4 2⍴0 12 1 13 2 14 3 15 4 16 5 17 6 18 7 19 8 20 9 21 10 22 11 23
      // 2 0 0⍉2 3 4⍴⍳24 !!! RANK ERROR
      // 0 0⍉3 3⍴⍳9 ←→ 0 4 8
      // 0 0⍉2 3⍴⍳9 ←→ 0 4
      // 0 0 0⍉3 3 3⍴⍳27 ←→ 0 13 26
      // 0 1 0⍉3 3 3⍴⍳27 ←→ 3 3⍴0 3 6 10 13 16 20 23 26
      al.shape.length<=1||rankError()
      al.shape.length||(al=new A([al.unwrap()]))
      var n=om.shape.length
      al.shape[0]===n||lengthError()
      var shape=[],stride=[],a=al.toArray()
      for(var i=0;i<a.length;i++){
        var x=a[i]
        isInt(x,0)||domainError()
        x<n||rankError()
        if(shape[x]==null){
          shape[x]=om.shape[i]
          stride[x]=om.stride[i]
        }else{
          shape[x]=Math.min(shape[x],om.shape[i])
          stride[x]+=om.stride[i]
        }
      }
      for(var i=0;i<shape.length;i++)shape[i]!=null||rankError()
      return new A(om.data,shape,stride,om.offset)
    }else{
      // ⍉2 3⍴1 2 3 6 7 8  ←→ 3 2⍴1 6 2 7 3 8
      // ⍴⍉2 3⍴1 2 3 6 7 8 ←→ 3 2
      // ⍉1 2 3            ←→ 1 2 3
      // ⍉2 3 4⍴⍳24        ←→ (4 3 2⍴0 12  4 16   8 20
      // ...                         1 13  5 17   9 21
      // ...                         2 14  6 18  10 22
      // ...                         3 15  7 19  11 23)
      // ⍉⍬                ←→ ⍬
      // ⍉''               ←→ ''
      return new A(om.data,reversed(om.shape),reversed(om.stride),om.offset)
    }
  }
})
addVocabulary({
  //  ({'monadic'}⍠{'dyadic'})0 ←→ 'monadic'
  // 0({'monadic'}⍠{'dyadic'})0 ←→ 'dyadic'
  '⍠':conjunction(function(f,g){
    assert(typeof f==='function')
    assert(typeof g==='function')
    return function(om,al,axis){return(al?f:g)(om,al,axis)}
  })
})
var NOUN=1,VERB=2,ADV=3,CONJ=4
function exec(s,o){ // s:APL code, o:options
  o=o||{}
  var ast=parse(s,o),code=compileAST(ast,o),env=[prelude.env[0].slice(0)]
  for(var k in ast.vars)env[0][ast.vars[k].slot]=o.ctx[k]
  var r=vm({code:code,env:env})
  for(var k in ast.vars){
    var v=ast.vars[k],x=o.ctx[k]=env[0][v.slot]
    if(v.category===ADV)x.adv=1
    if(v.category===CONJ)x.conj=1
  }
  return r
}
function repr(x){
  return x===null||['string','number','boolean'].indexOf(typeof x)>=0?JSON.stringify(x):
         x instanceof Array?'['+x.map(repr).join(',')+']':
         x.repr?x.repr():
         '{'+Object.keys(x).map(function(k){return repr(k)+':'+repr(x[k])}).join(',')+'}'
}
function compileAST(ast,o){
  o=o||{}
  ast.scopeDepth=0
  ast.nSlots=prelude.nSlots
  ast.vars=Object.create(prelude.vars)
  o.ctx=o.ctx||Object.create(vocabulary)
  for(var key in o.ctx)if(!ast.vars[key]){
    var value=o.ctx[key]
    var varInfo=ast.vars[key]={category:NOUN,slot:ast.nSlots++,scopeDepth:ast.scopeDepth}
    if(typeof value==='function'||value instanceof Proc){
      varInfo.category=value.adv?ADV:value.conj?CONJ:VERB
      if(/^[gs]et_.*/.test(key))ast.vars[key.slice(4)]={category:NOUN}
    }
  }
  function err(node,message){syntaxError({message:message,file:o.file,offset:node.offset,aplCode:o.aplCode})}
  assert(VERB<ADV&&ADV<CONJ)//we are relying on this ordering below
  function categorizeLambdas(node){
    switch(node[0]){
      case'B':case':':case'←':case'[':case'{':case'.':case'⍬':
        var r=VERB;for(var i=1;i<node.length;i++)if(node[i])r=Math.max(r,categorizeLambdas(node[i]))
        if(node[0]==='{'){node.category=r;return VERB}else{return r}
      case'S':case'N':case'J':return 0
      case'X':var s=node[1];return s==='⍺⍺'||s==='⍶'||s==='∇∇'?ADV:s==='⍵⍵'||s==='⍹'?CONJ:VERB
      default:assert(0)
    }
  }
  categorizeLambdas(ast)
  var queue=[ast] // accumulates"body"nodes we encounter on the way
  while(queue.length){
    var scopeNode=queue.shift(),vars=scopeNode.vars
    function visit(node){
      node.scopeNode=scopeNode
      switch(node[0]){
        case':':var r=visit(node[1]);visit(node[2]);return r
        case'←':return visitLHS(node[1],visit(node[2]))
        case'X':
          var name=node[1],v=vars['get_'+name],r
          if(v&&v.category===VERB){
            return NOUN
          }else{
            // x ⋄ x←0 !!! VALUE ERROR
            return vars[name]&&vars[name].category||
              valueError('Symbol '+name+' is referenced before assignment.',
                {file:o.file,offset:node.offset,aplCode:o.aplCode})
          }
        case'{':
          for(var i=1;i<node.length;i++){
            var d,v
            queue.push(extend(node[i],{
              scopeNode:scopeNode,
              scopeDepth:d=scopeNode.scopeDepth+1+(node.category!==VERB),
              nSlots:4,
              vars:v=extend(Object.create(vars),{
                '⍵':{slot:0,scopeDepth:d,category:NOUN},
                '∇':{slot:1,scopeDepth:d,category:VERB},
                '⍺':{slot:2,scopeDepth:d,category:NOUN},
                // slot 3 is reserved for a "base pointer"
                '⍫':{       scopeDepth:d,category:VERB}
              })
            }))
            if(node.category===CONJ){
              v['⍵⍵']=v['⍹']={slot:0,scopeDepth:d-1,category:VERB}
              v['∇∇']=       {slot:1,scopeDepth:d-1,category:CONJ}
              v['⍺⍺']=v['⍶']={slot:2,scopeDepth:d-1,category:VERB}
            }else if(node.category===ADV){
              v['⍺⍺']=v['⍶']={slot:0,scopeDepth:d-1,category:VERB}
              v['∇∇']=       {slot:1,scopeDepth:d-1,category:ADV}
            }
          }
          return node.category||VERB
        case'S':case'N':case'J':case'⍬':return NOUN
        case'[':
          for(var i=2;i<node.length;i++)if(node[i]&&visit(node[i])!==NOUN)err(node,'Indices must be nouns.')
          return visit(node[1])
        case'.':
          var a=node.slice(1),h=Array(a.length)
          for(var i=a.length-1;i>=0;i--)h[i]=visit(a[i])
          // Form vectors from sequences of data
          var i=0
          while(i<a.length-1){
            if(h[i]===NOUN&&h[i+1]===NOUN){
              var j=i+2;while(j<a.length&&h[j]===NOUN)j++
              a.splice(i,j-i,['V'].concat(a.slice(i,j)))
              h.splice(i,j-i,NOUN)
            }else{
              i++
            }
          }
          // Apply adverbs and conjunctions
          // ⌽¨⍣3⊢(1 2)3(4 5 6) ←→ (2 1)3(6 5 4)
          var i=0
          while(i < a.length){
            if(h[i]===VERB&&i+1<a.length&&h[i+1]===ADV){
              a.splice(i,2,['A'].concat(a.slice(i,i+2)))
              h.splice(i,2,VERB)
            }else if((h[i]===NOUN||h[i]===VERB||h[i]===CONJ)&&i+2<a.length&&h[i+1]===CONJ&&(h[i+2]===NOUN||h[i+2]===VERB)){
              // allow conjunction-conjunction-something to accommodate ∘.f syntax
              a.splice(i,3,['C'].concat(a.slice(i,i+3)))
              h.splice(i,3,VERB)
            }else{
              i++
            }
          }
          // Atops
          if(h.length===2&&h[0]!==NOUN&&h[1]!==NOUN){a=[['T'].concat(a)];h=[VERB]}
          // Forks
          if(h.length>=3&&h.length%2&&h.indexOf(NOUN)<0){a=[['F'].concat(a)];h=[VERB]}
          if(h[h.length-1]!==NOUN){
            if(h.length>1)err(a[h.length-1],'Trailing function in expression')
          }else{
            // Apply monadic and dyadic functions
            while(h.length>1){
              if(h.length===2||h[h.length-3]!==NOUN){
                a.splice(-2,9e9,['M'].concat(a.slice(-2)))
                h.splice(-2,9e9,NOUN)
              }else{
                a.splice(-3,9e9,['D'].concat(a.slice(-3)))
                h.splice(-3,9e9,NOUN)
              }
            }
          }
          node.splice(0,9e9,a[0])
          extend(node,a[0])
          return h[0]
      }
      assert(0)
    }
    function visitLHS(node,rhsCategory){
      node.scopeNode=scopeNode
      switch(node[0]){
        case'X':
          var name=node[1];if(name==='∇'||name==='⍫')err(node,'Assignment to '+name+' is not allowed.')
          if(vars[name]){
            if(vars[name].category!==rhsCategory){
              err(node,'Inconsistent usage of symbol '+name+', it is assigned both nouns and verbs.')
            }
          }else{
            vars[name]={scopeDepth:scopeNode.scopeDepth,slot:scopeNode.nSlots++,category:rhsCategory}
          }
          break
        case'.':
          rhsCategory===NOUN||err(node,'Strand assignment can be used only for nouns.')
          for(var i=1;i<node.length;i++)visitLHS(node[i],rhsCategory)
          break
        case'[':
          rhsCategory===NOUN||err(node,'Indexed assignment can be used only for nouns.')
          visitLHS(node[1],rhsCategory);for(var i=2;i<node.length;i++)node[i]&&visit(node[i])
          break
        default:
          err(node,'Invalid LHS node type: '+JSON.stringify(node[0]))
      }
      return rhsCategory
    }
    for(var i=1;i<scopeNode.length;i++)visit(scopeNode[i])
  }
  function render(node){
    switch(node[0]){
      case'B':
        if(node.length===1){
          // {}0 ←→ ⍬
          return[LDC,A.zilde,RET]
        }else{
          var a=[];for(var i=1;i<node.length;i++){a.push.apply(a,render(node[i]));a.push(POP)}
          a[a.length-1]=RET
          return a
        }
      case':':var x=render(node[1]),y=render(node[2]);return x.concat(JEQ,y.length+2,POP,y,RET)
      case'←':
        // A←5     ←→ 5
        // A×A←2 5 ←→ 4 25
        return render(node[2]).concat(renderLHS(node[1]))
      case'X':
        // r←3 ⋄ get_c←{2×○r} ⋄ get_S←{○r*2}
        // ... before←.01×⌊100×r c S
        // ... r←r+1
        // ... after←.01×⌊100×r c S
        // ... before after ←→ (3 18.84 28.27)(4 25.13 50.26)
        // {⍺}0 !!! VALUE ERROR
        // {x}0 ⋄ x←0 !!! VALUE ERROR
        // {⍫1⋄2}⍬ ←→ 1
        // c←{} ⋄ x←{c←⍫⋄1}⍬ ⋄ {x=1:c 2⋄x}⍬ ←→ 2
        var s=node[1],vars=node.scopeNode.vars,v
        return s==='⍫'?[CON]:
               (v=vars['get_'+s])&&v.category===VERB?[LDC,A.zero,GET,v.scopeDepth,v.slot,MON]:
                 [GET, vars[s].scopeDepth, vars[s].slot]
      case'{':
        // {1 + 1} 1                    ←→ 2
        // {⍵=0:1 ⋄ 2×∇⍵-1} 5           ←→ 32 # two to the power of
        // {⍵<2 : 1 ⋄ (∇⍵-1)+(∇⍵-2) } 8 ←→ 34 # Fibonacci sequence
        // ⊂{⍺⍺ ⍺⍺ ⍵}'hello'            ←→ ⊂⊂'hello'
        // ⊂{⍺⍺ ⍵⍵ ⍵}⌽'hello'           ←→ ⊂'olleh'
        // ⊂{⍶⍶⍵}'hello'                ←→ ⊂⊂'hello'
        // ⊂{⍶⍹⍵}⌽'hello'               ←→ ⊂'olleh'
        // +{⍵⍶⍵}10 20 30               ←→ 20 40 60
        // f←{⍵⍶⍵} ⋄ +f 10 20 30        ←→ 20 40 60
        // twice←{⍶⍶⍵} ⋄ *twice 2       ←→ 1618.1779919126539
        // f←{-⍵;⍺×⍵} ⋄ (f 5)(3 f 5)    ←→ ¯5 15
        // f←{;} ⋄ (f 5)(3 f 5)         ←→ ⍬⍬
        // ²←{⍶⍶⍵;⍺⍶⍺⍶⍵} ⋄ *²2          ←→ 1618.1779919126539
        // ²←{⍶⍶⍵;⍺⍶⍺⍶⍵} ⋄ 3*²2         ←→ 19683
        // H←{⍵⍶⍹⍵;⍺⍶⍹⍵} ⋄ +H÷ 2        ←→ 2.5
        // H←{⍵⍶⍹⍵;⍺⍶⍹⍵} ⋄ 7 +H÷ 2      ←→ 7.5
        // {;;}                         !!!
        var x=render(node[1])
        var lx=[LAM,x.length].concat(x)
        if(node.length===2){
          f=lx
        }else if(node.length===3){
          var y=render(node[2]),ly=[LAM,y.length].concat(y),v=node.scopeNode.vars['⍠']
          f=ly.concat(GET,v.scopeDepth,v.slot,lx,DYA)
        }else{
          err(node)
        }
        return node.category===VERB?f:[LAM,f.length+1].concat(f,RET)
      case'S':
        // ⍴''     ←→ ,0
        // ⍴'x'    ←→ ⍬
        // ⍴'xx'   ←→ ,2
        // ⍴'a''b' ←→ ,3
        // ⍴"a""b" ←→ ,3
        // ⍴'a""b' ←→ ,4
        // ⍴'''a'  ←→ ,2
        // ⍴'a'''  ←→ ,2
        // ''''    ←→ "'"
        // ⍴"\f\t\n\r\u1234\xff" ←→ ,18
        // "a      !!!
        var d=node[1][0] // the delimiter: " or '
        var s=node[1].slice(1,-1).replace(RegExp(d+d,'g'),d)
        return[LDC,new A(s,s.length===1?[]:[s.length])]
      case'N':
        // ∞ ←→ ¯
        // ¯∞ ←→ ¯¯
        // ¯∞j¯∞ ←→ ¯¯j¯¯
        // ∞∞ ←→ ¯ ¯
        // ∞¯ ←→ ¯ ¯
        var a=node[1].replace(/[¯∞]/g,'-').split(/j/i).map(function(x){
          return x==='-'?Infinity:x==='--'?-Infinity:x.match(/^-?0x/i)?parseInt(x,16):parseFloat(x)
        })
        var v=a[1]?new Z(a[0],a[1]):a[0]
        return[LDC,new A([v],[])]
      case'J':
        // 123 + «456 + 789» ←→ 1368
        var f=Function('return function(_w,_a){return('+node[1].replace(/^«|»$/g,'')+')}')()
        return[EMB,function(_w,_a){return aplify(f(_w,_a))}]
      case'[':
        // ⍴ x[⍋x←6?40] ←→ ,6
        var v=node.scopeNode.vars._index,axes=[],a=[],c
        for(var i=2;i<node.length;i++)if(c=node[i]){axes.push(i-2);a.push.apply(a,render(c))}
        a.push(VEC,axes.length,LDC,new A(axes),VEC,2,GET,v.scopeDepth,v.slot)
        a.push.apply(a,render(node[1]))
        a.push(DYA)
        return a
      case'V':
        var fragments=[],areAllConst=1
        for(var i=1;i<node.length;i++){
          var f=render(node[i]);fragments.push(f);if(f.length!==2||f[0]!==LDC)areAllConst=0
        }
        return areAllConst?[LDC,new A(fragments.map(function(f){return f[1].isSimple()?f[1].unwrap():f[1]}))]
                         :[].concat.apply([],fragments).concat([VEC,node.length-1])
      case'⍬':return[LDC,A.zilde]
      case'M':return render(node[2]).concat(render(node[1]),MON)
      case'A':return render(node[1]).concat(render(node[2]),MON)
      case'D':case'C':return render(node[3]).concat(render(node[2]),render(node[1]),DYA)
      case'T':
        var v=node.scopeNode.vars._atop
        return render(node[2]).concat(GET,v.scopeDepth,v.slot,render(node[1]),DYA)
      case'F':
        var u=node.scopeNode.vars._atop
        var v=node.scopeNode.vars._fork1
        var w=node.scopeNode.vars._fork2
        var i=node.length-1
        var r=render(node[i--])
        while(i>=2)r=r.concat(GET,v.scopeDepth,v.slot,render(node[i--]),DYA,
                              GET,w.scopeDepth,w.slot,render(node[i--]),DYA)
        return i?r.concat(render(node[1]),GET,u.scopeDepth,u.slot,DYA):r
      default:assert(0)
    }
  }
  function renderLHS(node){
    switch(node[0]){
      case'X':
        var name=node[1],vars=node.scopeNode.vars,v=vars['set_'+name]
        return v&&v.category===VERB?[GET,v.scopeDepth,v.slot,MON]:[SET,vars[name].scopeDepth,vars[name].slot]
      case'.': // strand assignment
        // (a b) ← 1 2 ⋄ a           ←→ 1
        // (a b) ← 1 2 ⋄ b           ←→ 2
        // (a b) ← +                 !!!
        // (a b c) ← 3 4 5 ⋄ a b c   ←→ 3 4 5
        // (a b c) ← 6     ⋄ a b c   ←→ 6 6 6
        // (a b c) ← 7 8   ⋄ a b c   !!!
        // ((a b)c)←3(4 5) ⋄ a b c   ←→ 3 3 (4 5)
        var n=node.length-1,a=[SPL,n]
        for(var i=1;i<node.length;i++){a.push.apply(a,renderLHS(node[i]));a.push(POP)}
        return a
      case'[': // indexed assignment
        var axes=[],a=[],v=node.scopeNode.vars._substitute
        for(var i=2;i<node.length;i++)if(node[i]){axes.push(i-2);a.push.apply(a,render(node[i]))}
        a.push(VEC,axes.length)
        a.push.apply(a,render(node[1]))
        a.push(LDC,new A(axes),VEC,4,GET,v.scopeDepth,v.slot,MON)
        a.push.apply(a,renderLHS(node[1]))
        return a
    }
    assert(0)
  }
  return render(ast)
}
;(function(){
  var env=prelude.env=[[]]
  for(var k in prelude.vars)env[0][prelude.vars[k].slot]=vocabulary[k]
  vm({code:prelude.code,env:env})
  for(var k in prelude.vars)vocabulary[k]=env[0][prelude.vars[k].slot]
}())
function aplify(x){
  if(typeof x==='string')return x.length===1?A.scalar(x):new A(x)
  if(typeof x==='number')return A.scalar(x)
  if(x instanceof Array)return new A(x.map(function(y){y=aplify(y);return y.shape.length?y:y.unwrap()}))
  if(x instanceof A)return x
  aplError('Cannot aplify object:'+x)
}
var apl=this.apl=function(aplCode,opts){return(apl.ws(opts))(aplCode)}
extend(apl,{format:format,approx:approx,parse:parse,compileAST:compileAST,repr:repr})
apl.ws=function(opts){
  opts=opts||{}
  ctx=Object.create(vocabulary)
  if(opts.in )ctx['get_⎕']=ctx['get_⍞']=function(){var s=opts.in();assert(typeof s==='string');return new A(s)}
  if(opts.out)ctx['set_⎕']=ctx['set_⍞']=function(x){opts.out(format(x).join('\n')+'\n')}
  return function(aplCode){return exec(aplCode,{ctx:ctx})}
}
function readline(prompt,f){
  ;(readline.requesters=readline.requesters||[]).push(f)
  var rl=readline.rl
  if(!rl){
    rl=readline.rl=require('readline').createInterface(process.stdin,process.stdout)
    rl.on('line',function(x){var h=readline.requesters.pop();h&&h(x)})
    rl.on('close',function(){process.stdout.write('\n');process.exit(0)})
  }
  rl.setPrompt(prompt);rl.prompt()
}
if(typeof module!=='undefined'){
  module.exports=apl
  if(module===require.main)(function(){
    var usage='Usage: apl.js [options] [filename.apl]\n'+
              'Options:\n'+
              '  -l --linewise   Process stdin line by line and disable prompt\n'
    var file,linewise
    process.argv.slice(2).forEach(function(arg){
      if(arg==='-h'||arg==='--help'){process.stderr.write(usage);process.exit(0)}
      else if(arg==='-l'||arg=='--linewise')linewise=1
      else if(arg[0]==='-'){process.stderr.write('unrecognized option:'+arg+'\n'+usage);process.exit(1)}
      else if(file){process.stderr.write(usage);process.exit(1)}
      else file=arg
    })
    if(file){
      exec(require('fs').readFileSync(file,'utf8'))
    }else if(linewise){
      var fs=require('fs'),ws=apl.ws(),a=Buffer(256),i=0,n=0,b=Buffer(a.length),k
      while(k=fs.readSync(0,b,0,b.length)){
        if(n+k>a.length)a=Buffer.concat([a,a])
        b.copy(a,n,0,k);n+=k
        while(i<n){
          if(a[i]===10){ // '\n'
            var r;try{r=format(ws(''+a.slice(0,i))).join('\n')+'\n'}catch(e){r=e+'\n'}
            process.stdout.write(r);a.copy(a,0,i+1);n-=i+1;i=0
          }else{
            i++
          }
        }
      }
    }else if(!require('tty').isatty()){
      var fs=require('fs'),b=Buffer(1024),n=0,k
      while(k=fs.readSync(0,b,n,b.length-n)){n+=k;n===b.length&&b.copy(b=Buffer(2*n))} // read all of stdin
      exec(b.toString('utf8',0,n))
    }else{
      var ws=apl.ws(),out=process.stdout
      function f(s){
        try{s.match(/^[\ \t\f\r\n]*$/)||out.write(format(ws(s)).join('\n')+'\n')}catch(e){out.write(e+'\n')}
        readline('      ',f)
      }
      f('')
    }
  }())
}
