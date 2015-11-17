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
