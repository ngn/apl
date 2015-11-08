addVocabulary({
  // ⍴¨(0 0 0 0)(0 0 0)             ←→ (,4)(,3)
  // ⍴¨"MONDAY" "TUESDAY"           ←→ (,6)(,7)
  // ⍴   (2 2⍴⍳4)(⍳10)97.3(3 4⍴"K") ←→ ,4
  // ⍴¨  (2 2⍴⍳4)(⍳10)97.3(3 4⍴"K") ←→ (2 2)(,10)⍬(3 4)
  // ⍴⍴¨ (2 2⍴⍳4)(⍳10)97.3(3 4⍴"K") ←→ ,4
  // ⍴¨⍴¨(2 2⍴⍳4)(⍳10)97.3(3 4⍴"K") ←→ (,2)(,1)(,0)(,2)
  // (1 2 3) ,¨ 4 5 6               ←→ (1 4)(2 5)(3 6)
  // 2 3↑¨'MONDAY' 'TUESDAY'        ←→ 'MO' 'TUE'
  // 2↑¨'MONDAY' 'TUESDAY'          ←→ 'MO' 'TU'
  // 2 3⍴¨1 2                       ←→ (1 1)(2 2 2)
  // 4 5⍴¨"THE" "CAT"               ←→ 'THET' 'CATCA'
  // {1+⍵*2}¨2 3⍴⍳6                 ←→ 2 3⍴1 2 5 10 17 26
  '¨':adverb(function(f,g){
    assert(typeof f==='function');assert(g==null)
    return function(om,al){
      if(!al){
        return om.map(function(x){
          x instanceof A||(x=new A([x],[]))
          var r=f(x);assert(r instanceof A)
          return r.shape.length?r:r.unwrap()
        })
      }else if(arrayEquals(al.shape,om.shape)){
        return om.map2(al, function(x, y) {
          x instanceof A||(x=new A([x],[]))
          y instanceof A||(y=new A([y],[]))
          var r=f(x,y);assert(r instanceof A)
          return r.shape.length?r:r.unwrap()
        })
      }else if(al.isSingleton()){
        var y=al.data[0]instanceof A?al.unwrap():al
        return om.map(function(x){
          x instanceof A||(x=new A([x],[]))
          var r=f(x,y);assert(r instanceof A)
          return r.shape.length?r:r.unwrap()
        })
      }else if(om.isSingleton()){
        var x=om.data[0]instanceof A?om.unwrap():om
        return al.map(function(y){
          y instanceof A||(y=new A([y],[]))
          var r=f(x,y);assert(r instanceof A)
          return r.shape.length?r:r.unwrap()
        })
      }else{
        lengthError()
      }
    }
  })
})
