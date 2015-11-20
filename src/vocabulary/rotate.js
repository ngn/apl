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
