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
