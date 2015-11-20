addVocabulary({
  '.':conjunction(function(g,f){return f===vocabulary['∘']?outerProduct(g):innerProduct(g,f)})
})
// 2 3 4∘.×1 2 3 4 ←→ (3 4⍴2 4  6  8
// ...                     3 6  9 12
// ...                     4 8 12 16)
//
// 0 1 2 3 4∘.!0 1 2 3 4 ←→ (5 5⍴1 1 1 1 1
// ...                           0 1 2 3 4
// ...                           0 0 1 3 6
// ...                           0 0 0 1 4
// ...                           0 0 0 0 1)
//
// 1 2∘.,1+⍳3 ←→ (2 3⍴(1 1)(1 2)(1 3)
// ...                (2 1)(2 2)(2 3))
//
// ⍴1 2∘.,1+⍳3 ←→ 2 3
//
// 2 3∘.↑1 2 ←→ (2 2⍴  (1 0)   (2 0)
// ...               (1 0 0) (2 0 0))
//
// ⍴2 3∘.↑1 2 ←→ 2 2
// ⍴((4 3⍴0)∘.+5 2⍴0) ←→ 4 3 5 2
// 2 3∘.×4 5      ←→ 2 2⍴8 10 12 15
// 2 3∘ . ×4 5    ←→ 2 2⍴8 10 12 15
// 2 3∘.{⍺×⍵}4 5  ←→ 2 2⍴8 10 12 15
function outerProduct(f){
  assert(typeof f==='function')
  return function(om,al){
    al||syntaxError('Adverb ∘. (Outer product) can be applied to dyadic verbs only')
    var a=al.toArray(),b=om.toArray(),data=[]
    for(var i=0;i<a.length;i++)for(var j=0;j<b.length;j++){
      var x=a[i],y=b[j]
      x instanceof A||(x=A.scalar(x))
      y instanceof A||(y=A.scalar(y))
      var z=f(y,x)
      z.shape.length||(z=z.unwrap())
      data.push(z)
    }
    return new A(data,al.shape.concat(om.shape))
  }
}
// For matrices, the inner product behaves like matrix multiplication where +
// and × can be substituted with any verbs.
//
// For higher dimensions, the general formula is:
// A f.g B   <->   f/¨ (⊂[¯1+⍴⍴A]A) ∘.g ⊂[0]B
//
// (1 3 5 7)+.=2 3 6 7 ←→ 2
// (1 3 5 7)∧.=2 3 6 7 ←→ 0
// (1 3 5 7)∧.=1 3 5 7 ←→ 1
// 7+.=8 8 7 7 8 7 5   ←→ 3
// 8 8 7 7 8 7 5+.=7   ←→ 3
// 7+.=7               ←→ 1
// (3 2⍴5 ¯3 ¯2 4 ¯1 0)+.×2 2⍴6 ¯3 5 7 ←→ 3 2⍴15 ¯36 8 34 ¯6 3
function innerProduct(g,f){
  var F=vocabulary['¨'](reduce(f)),G=outerProduct(g)
  return function(om,al){
    if(!al.shape.length)al=new A([al.unwrap()])
    if(!om.shape.length)om=new A([om.unwrap()])
    return F(G(
      vocabulary['⊂'](om,undefined,new A([0])),
      vocabulary['⊂'](al,undefined,new A([al.shape.length-1]))
    ))
  }
}
