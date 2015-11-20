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
