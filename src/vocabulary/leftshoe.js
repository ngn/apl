addVocabulary({
  // ⍴⊂2 3⍴⍳6      ←→ ⍬
  // ⍴⍴⊂2 3⍴⍳6     ←→ ,0
  // ⊂[0]2 3⍴⍳6    ←→ (0 3)(1 4)(2 5)
  // ⍴⊂[0]2 3⍴⍳6   ←→ ,3
  // ⊂[1]2 3⍴⍳6    ←→ (0 1 2)(3 4 5)
  // ⍴⊂[1]2 3⍴⍳6   ←→ ,2
  // ⊃⊂[1 0]2 3⍴⍳6 ←→ 3 2⍴0 3 1 4 2 5
  // ⍴⊂[1 0]2 3⍴⍳6 ←→ ⍬
  // ⍴⊃⊂⊂1 2 3     ←→ ⍬
  '⊂':function(om,al,axes){
    assert(!al)
    if(axes==null){
      axes=[];for(var i=0;i<om.shape.length;i++)axes.push(i)
    }else{
      axes=getAxisList(axes,om.shape.length)
    }
    if(om.isSimple())return om
    var unitShape =axes.map(function(k){return om.shape [k]})
    var unitStride=axes.map(function(k){return om.stride[k]})
    var resultAxes=[];for(var k=0;k<om.shape.length;k++)axes.indexOf(k)<0&&resultAxes.push(k)
    var shape =resultAxes.map(function(k){return om.shape [k]})
    var stride=resultAxes.map(function(k){return om.stride[k]})
    var data=[]
    each(new A(om.data,shape,stride,om.offset),function(x,indices,p){data.push(new A(om.data,unitShape,unitStride,p))})
    return new A(data,shape)
  }
})
