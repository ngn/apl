addVocabulary({
  // 10⊥3 2 6 9                        ←→ 3269
  // 8⊥3 1                             ←→ 25
  // 1760 3 12⊥1 2 8                   ←→ 68
  // 2 2 2⊥1                           ←→ 7
  // 0 20 12 4⊥2 15 6 3                ←→ 2667
  // 1760 3 12⊥3 3⍴1 1 1 2 0 3 0 1 8   ←→ 60 37 80
  // 60 60⊥3 13                        ←→ 193
  // 0 60⊥3 13                         ←→ 193
  // 60⊥3 13                           ←→ 193
  // 2⊥1 0 1 0                         ←→ 10
  // 2⊥1 2 3 4                         ←→ 26
  // 3⊥1 2 3 4                         ←→ 58
  //
  // //gives '(1j1⊥1 2 3 4) = 5j9', 1 # todo:⊥for complex numbers
  //
  // M←(3 8⍴0 0 0 0 1 1 1 1
  // ...    0 0 1 1 0 0 1 1
  // ...    0 1 0 1 0 1 0 1)
  // ... A←(4 3⍴1 1 1
  // ...        2 2 2
  // ...        3 3 3
  // ...        4 4 4)
  // ... A⊥M ←→ (4 8⍴0 1 1 2  1  2  2  3
  // ...             0 1 2 3  4  5  6  7
  // ...             0 1 3 4  9 10 12 13
  // ...             0 1 4 5 16 17 20 21)
  //
  // M←(3 8⍴0 0 0 0 1 1 1 1
  // ...    0 0 1 1 0 0 1 1
  // ...    0 1 0 1 0 1 0 1)
  // ... 2⊥M ←→ 0 1 2 3 4 5 6 7
  //
  // M←(3 8 ⍴0 0 0 0 1 1 1 1
  // ...     0 0 1 1 0 0 1 1
  // ...     0 1 0 1 0 1 0 1)
  // ... A←2 1⍴2 10
  // ... A⊥M ←→ (2 8⍴0 1  2  3   4   5   6   7
  // ...             0 1 10 11 100 101 110 111)
  '⊥':function(om,al){
    assert(al)
    if(!al.shape.length)al=new A([al.unwrap()])
    if(!om.shape.length)om=new A([om.unwrap()])
    var lastDimA=al.shape[al.shape.length-1],firstDimB=om.shape[0]
    if(lastDimA!==1&&firstDimB!==1&&lastDimA!==firstDimB)lengthError()
    var a=al.toArray(),b=om.toArray(),data=[],ni=a.length/lastDimA,nj=b.length/firstDimB
    for(var i=0;i<ni;i++)for(var j=0;j<nj;j++){
      var x=a.slice(i*lastDimA,(i+1)*lastDimA)
      var y=[];for(var l=0;l<firstDimB;l++)y.push(b[j+l*(b.length/firstDimB)])
      if(x.length===1)x=repeat([x[0]],y.length)
      if(y.length===1)y=repeat([y[0]],x.length)
      var z=y[0];for(var k=1;k<y.length;k++)z=z*x[k]+y[k]
      data.push(z)
    }
    return new A(data,al.shape.slice(0,-1).concat(om.shape.slice(1)))
  }
})
