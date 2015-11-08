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
