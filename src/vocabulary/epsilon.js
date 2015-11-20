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
