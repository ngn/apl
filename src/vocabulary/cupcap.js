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
