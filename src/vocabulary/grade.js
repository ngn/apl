addVocabulary({
  // ⍋13 8 122 4                  ←→ 3 1 0 2
  // a←13 8 122 4 ⋄ a[⍋a]         ←→ 4 8 13 122
  // ⍋"ZAMBIA"                    ←→ 1 5 3 4 2 0
  // s←"ZAMBIA" ⋄ s[⍋s]           ←→ 'AABIMZ'
  // t←3 3⍴"BOBALFZAK" ⋄ ⍋t       ←→ 1 0 2
  // t←3 3⍴4 5 6 1 1 3 1 1 2 ⋄ ⍋t ←→ 2 1 0
  //
  // t←3 3⍴4 5 6 1 1 3 1 1 2 ⋄ t[⍋t;]
  // ...    ←→ (3 3⍴ 1 1 2
  // ...              1 1 3
  // ...              4 5 6)
  //
  // a←3 2 3⍴2 3 4 0 1 0 1 1 3 4 5 6 1 1 2 10 11 12 ⋄ a[⍋a;;]
  // ... ←→ (3 2 3⍴ 1  1  2
  // ...           10 11 12
  // ...
  // ...            1  1  3
  // ...            4  5  6
  // ...
  // ...            2  3  4
  // ...            0  1  0)
  //
  // a←3 2 5⍴"joe  doe  bob  jonesbob  zwart"  ⋄  a[⍋a;;]
  // ... ←→ 3 2 5 ⍴ 'bob  jonesbob  zwartjoe  doe  '
  //
  // "ZYXWVUTSRQPONMLKJIHGFEDCBA"⍋"ZAMBIA" ←→ 0 2 4 3 1 5
  // ⎕A←"ABCDEFGHIJKLMNOPQRSTUVWXYZ" ⋄ (⌽⎕A)⍋3 3⍴"BOBALFZAK" ←→ 2 0 1
  //
  // data←6 4⍴"ABLEaBLEACREABELaBELACES"
  // ... coll←2 26⍴"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
  // ... data[coll⍋data;]
  // ...   ←→ 6 4⍴'ABELaBELABLEaBLEACESACRE'
  //
  // data←6 4⍴"ABLEaBLEACREABELaBELACES"
  // ... coll1←"AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz"
  // ... data[coll1⍋data;]
  // ...   ←→ 6 4⍴'ABELABLEACESACREaBELaBLE'
  //
  // ⍋0 1 2 3 4 3 6 6 4 9 1 11 12 13 14 15 ←→ 0 1 10 2 3 5 4 8 6 7 9 11 12 13 14 15
  '⍋':function(om,al){return grade(om,al,1)},

  // ⍒3 1 8 ←→ 2 0 1
  '⍒':function(om,al){return grade(om,al,-1)}
})

// Helper for ⍋ and ⍒
function grade(om,al,direction){
  var h={} // maps a character to its index in the collation
  if(al){
    al.shape.length||rankError()
    each(al,function(x,indices){typeof x==='string'||domainError();h[x]=indices[indices.length-1]})
  }
  om.shape.length||rankError()
  var r=[];for(var i=0;i<om.shape[0];i++)r.push(i)
  return new A(r.sort(function(i,j){
    var p=om.offset,indices=repeat([0],om.shape.length)
    while(1){
      var x=om.data[p+i*om.stride[0]],tx=typeof x
      var y=om.data[p+j*om.stride[0]],ty=typeof y
      if(tx<ty)return-direction
      if(tx>ty)return direction
      if(h[x]!=null)x=h[x]
      if(h[y]!=null)y=h[y]
      if(x<y)return-direction
      if(x>y)return direction
      var a=indices.length-1
      while(a>0&&indices[a]+1===om.shape[a]){p-=om.stride[a]*indices[a];indices[a--]=0}
      if(a<=0)break
      p+=om.stride[a];indices[a]++
    }
    return(i>j)-(i<j)
  }))
}
