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
