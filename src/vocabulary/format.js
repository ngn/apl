addVocabulary({
  // ⍕123            ←→ 1 3⍴'123'
  // ⍕123 456        ←→ 1 7⍴'123 456'
  // ⍕123 'a'        ←→ 1 5⍴'123 a'
  // ⍕12 'ab'        ←→ 1 7⍴'12  ab '
  // ⍕1 2⍴'a'        ←→ 1 2⍴'a'
  // ⍕2 2⍴'a'        ←→ 2 2⍴'a'
  // ⍕2 2⍴5          ←→ 2 3⍴('5 5',
  // ...                     '5 5')
  // ⍕2 2⍴0 0 0 'a'  ←→ 2 3⍴('0 0',
  // ...                     '0 a')
  // ⍕2 2⍴0 0 0 'ab' ←→ 2 6⍴('0   0 ',
  // ...                     '0  ab ')
  // ⍕2 2⍴0 0 0 123  ←→ 2 5⍴('0   0',
  // ...                     '0 123')
  // ⍕4 3 ⍴ '---' '---' '---' 1 2 3 4 5 6 100 200 300
  // ...             ←→ 4 17⍴(' ---   ---   --- ',
  // ...                      '   1     2     3 ',
  // ...                      '   4     5     6 ',
  // ...                      ' 100   200   300 ')
  // ⍕1 ⍬ 2 '' 3     ←→ 1 11⍴'1    2    3'
  // ⍕∞              ←→ 1 1⍴'∞'
  // ⍕¯∞             ←→ 1 2⍴'¯∞'
  // ⍕¯1             ←→ 1 2⍴'¯1'
  // ⍕¯1e¯100J¯2e¯99 ←→ 1 14⍴'¯1e¯100J¯2e¯99'
  '⍕':function(om,al){al&&nonceError();var t=format(om);return new A(t.join(''),[t.length,t[0].length])}
})

// Format an APL object as an array of strings
function format(a){
  var t=typeof a
  if(a===null)return['null']
  if(t==='undefined')return['undefined']
  if(t==='string')return[a]
  if(t==='number'){var r=[formatNumber(a)];r.align='right';return r}
  if(t==='function')return['#procedure']
  if(!(a instanceof A))return[''+a]
  if(a.empty())return['']

  var sa=a.shape
  a=a.toArray()
  if(!sa.length)return format(a[0])
  var nRows=prod(sa.slice(0,-1))
  var nCols=sa[sa.length-1]
  var rows=[];for(var i=0;i<nRows;i++)rows.push({height:0,bottomMargin:0})
  var cols=[];for(var i=0;i<nCols;i++)cols.push({type:0,width:0,leftMargin:0,rightMargin:0}) // type:0=characters,1=numbers,2=subarrays

  var grid=[]
  for(var i=0;i<nRows;i++){
    var r=rows[i],gridRow=[];grid.push(gridRow)
    for(var j=0;j<nCols;j++){
      var c=cols[j],x=a[nCols*i+j],box=format(x)
      r.height=Math.max(r.height,box.length)
      c.width=Math.max(c.width,box[0].length)
      c.type=Math.max(c.type,typeof x==='string'&&x.length===1?0:x instanceof A?2:1)
      gridRow.push(box)
    }
  }

  var step=1;for(var d=sa.length-2;d>0;d--){step*=sa[d];for(var i=step-1;i<nRows-1;i+=step)rows[i].bottomMargin++}

  for(var j=0;j<nCols;j++){
    var c=cols[j]
    if(j<nCols-1&&(c.type!==cols[j+1].type||c.type))c.rightMargin++
    if(c.type===2){c.leftMargin++;c.rightMargin++}
  }

  var result=[]
  for(var i=0;i<nRows;i++){
    var r=rows[i]
    for(var j=0;j<nCols;j++){
      var c=cols[j]
      var t=grid[i][j]
      var left =repeat(' ',c.leftMargin +(t.align==='right')*(c.width-t[0].length))
      var right=repeat(' ',c.rightMargin+(t.align!=='right')*(c.width-t[0].length))
      for(var k=0;k<t.length;k++)t[k]=left+t[k]+right
      var bottom=repeat(' ',t[0].length)
      for(var h=r.height+r.bottomMargin-t.length;h>0;h--)t.push(bottom)
    }
    var nk=r.height+r.bottomMargin
    for(var k=0;k<nk;k++){
      var s='';for(var j=0;j<nCols;j++)s+=grid[i][j][k]
      result.push(s)
    }
  }
  return result
}
