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
