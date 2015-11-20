addVocabulary({
  '↑':function(om,al){return al?take(om,al):first(om)}
})

// 5↑'ABCDEFGH'     ←→ 'ABCDE'
// ¯3↑'ABCDEFGH'    ←→ 'FGH'
// 3↑22 2 19 12     ←→ 22 2 19
// ¯1↑22 2 19 12    ←→ ,12
// ⍴1↑(2 2⍴⍳4)(⍳10) ←→ ,1
// 2↑1              ←→ 1 0
// 5↑40 92 11       ←→ 40 92 11 0 0
// ¯5↑40 92 11      ←→ 0 0 40 92 11
// 3 3↑1 1⍴0        ←→ 3 3⍴0 0 0 0 0 0 0 0 0
// 5↑"abc"          ←→ 'abc  '
// ¯5↑"abc"         ←→ '  abc'
// 3 3↑1 1⍴"a"      ←→ 3 3⍴'a        '
// 2 3↑1+4 3⍴⍳12    ←→ 2 3⍴1 2 3 4 5 6
// ¯1 3↑1+4 3⍴⍳12   ←→ 1 3⍴10 11 12
// 1 2↑1+4 3⍴⍳12    ←→ 1 2⍴1 2
// 3↑⍬              ←→ 0 0 0
// ¯2↑⍬             ←→ 0 0
// 0↑⍬              ←→ ⍬
// 3 3↑1            ←→ 3 3⍴1 0 0 0 0 0 0 0 0
// 2↑3 3⍴⍳9         ←→ 2 3⍴⍳6
// ¯2↑3 3⍴⍳9        ←→ 2 3⍴3+⍳6
// 4↑3 3⍴⍳9         ←→ 4 3⍴(⍳9),0 0 0
// ⍬↑3 3⍴⍳9         ←→ 3 3⍴⍳9
function take(om,al){
  al.shape.length<=1||rankError()
  if(!om.shape.length)om=new A([om.unwrap()],al.shape.length?repeat([1],al.shape[0]):[1])
  var a=al.toArray()
  a.length<=om.shape.length||rankError()
  for(var i=0;i<a.length;i++)typeof a[i]==='number'&&a[i]===Math.floor(a[i])||domainError()
  var mustCopy=0,shape=om.shape.slice(0)
  for(var i=0;i<a.length;i++){shape[i]=Math.abs(a[i]);if(shape[i]>om.shape[i])mustCopy=1}
  if(mustCopy){
    var stride=Array(shape.length);stride[stride.length-1]=1
    for(var i=stride.length-2;i>=0;i--)stride[i]=stride[i+1]*shape[i+1]
    var data=repeat([om.getPrototype()],prod(shape))
    var copyShape=shape.slice(0),p=om.offset,q=0
    for(var i=0;i<a.length;i++){
      var x=a[i];copyShape[i]=Math.min(om.shape[i],Math.abs(x))
      if(x<0){if(x<-om.shape[i]){q-=(x+om.shape[i])*stride[i]}else{p+=(x+om.shape[i])*om.stride[i]}}
    }
    if(prod(copyShape)){
      var copyIndices=repeat([0],copyShape.length)
      while(1){
        data[q]=om.data[p];axis=copyShape.length-1
        while(axis>=0&&copyIndices[axis]+1===copyShape[axis]){
          p-=copyIndices[axis]*om.stride[axis];q-=copyIndices[axis]*stride[axis];copyIndices[axis--]=0
        }
        if(axis<0)break
        p+=om.stride[axis];q+=stride[axis];copyIndices[axis]++
      }
    }
    return new A(data,shape,stride)
  }else{
    var offset=om.offset;for(var i=0;i<a.length;i++)if(a[i]<0)offset+=(om.shape[i]+a[i])*om.stride[i]
    return new A(om.data,shape,om.stride,offset)
  }
}

// ↑(1 2 3)(4 5 6) ←→ 1 2 3
// ↑(1 2)(3 4 5)   ←→ 1 2
// ↑'AB'           ←→ 'A'
// ↑123            ←→ 123
// ↑⍬              ←→ 0
//! ↑''             ←→ ' '
function first(om){var x=om.empty()?om.getPrototype():om.data[om.offset];return x instanceof A?x:new A([x],[])}
