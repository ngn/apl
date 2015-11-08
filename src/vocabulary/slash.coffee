addVocabulary({
  '⌿': adverb (om, al, axis ) -> return reduce(om, al, axis||A.zero)
  '/': reduce = adverb (om, al, axis) ->
    if typeof om is 'function'
      `
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
      `
      (om, al) ->
        `
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
        `
        new A data, rShape

    else
      `
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
      `
      axis = if axis then axis.toInt(0, om.shape.length) else om.shape.length - 1
      `
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
      `
      if shape[axis] isnt 0 and !om.empty()
        `
        var filler=om.getPrototype()
        `
        p = om.offset
        indices = repeat [0], shape.length
        loop
          x =
            if b[indices[axis]]?
              om.data[p + b[indices[axis]] * om.stride[axis]]
            else
              filler
          data.push x

          i = shape.length - 1
          while i >= 0 and indices[i] + 1 is shape[i]
            if i isnt axis then p -= om.stride[i] * indices[i]
            indices[i--] = 0
          if i < 0 then break
          if i isnt axis then p += om.stride[i]
          indices[i]++

      return new A(data,shape)
})
