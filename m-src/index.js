$.fn.toggleVisibility=function(){this.css('visibility',this.css('visibility')==='hidden'?'':'hidden')}

function extractTextFromDOM(e){
  if(e.nodeType===3||e.nodeType===4)return e.nodeValue 
  if(e.nodeType!==1)return''
  if(e.nodeName.toLowerCase()==='br')return'\n'
  var r='';for(var c=e.firstChild;c;c=c.nextSibling)r+=extractTextFromDOM(c)
  return r
}

$(function($){
  setInterval(function(){$('#cursor').toggleVisibility()},500)

  $('#editor').on('mousedown touchstart mousemove touchmove',function(e){
    e.preventDefault()
    var oe=e.originalEvent,te=oe&&oe.touches&&oe.touches[0]||e,x=te.pageX,y=te.pageY

    // Find the nearest character to (x, y)
    // Compare by Δy first, then by Δx
    var bestDY=1/0,bestDX=1/0 // infinity
    var bestXSide=0 // 0: must use insertBefore, 1: must use insertAfter
    var $bestE
    $('#editor span').each(function(){
      var $e=$(this),p=$e.position()
      var x1=p.left+$e.width()/2,dx=Math.abs(x1-x)
      var y1=p.top+$e.height()/2,dy=Math.abs(y1-y)
      if(dy<bestDY||dy===bestDY&&dx<bestDX){$bestE=$e;bestDX=dx;bestDY=dy;bestXSide=x>x1}
    })

    if($bestE){
      bestXSide?$('#cursor').insertAfter ($bestE)
               :$('#cursor').insertBefore($bestE)
    }
    return false
  })
  $('.key').bind('mousedown touchstart',function(e){
    e.preventDefault()
    var $k=$(this).addClass('down')
    $k.hasClass('repeatable')&&$k.data('timeoutId',setTimeout(
      function(){
        $k.data('timeoutId',null)
        $k.trigger('aplkeypress')
        $k.data('intervalId',setInterval(function(){$k.trigger('aplkeypress')},200))
      },
      500
    ))
    return false
  })
  $('.key').bind('mouseup touchend',function(e){
    e.preventDefault()
    var $k=$(this)
    $k.removeClass('down')
    clearTimeout($k.data('timeoutId'))
    $k.data('timeoutId',null)
    var iid=$k.data('intervalId')
    if(iid!=null){clearInterval(iid);$k.data('intervalId',null)}else{$k.trigger('aplkeypress')}
    return false
  })

  var layouts=[
    '1234567890qwertyuiopasdfghjklzxcvbnm',
    '!@#$%^&*()QWERTYUIOPASDFGHJKLZXCVBNM',
    '¨¯<≤=≥>≠∨∧←⍵∊⍴~↑↓⍳○*⍺⌈⌊⍪∇∆∘⋄⎕⊂⊃∩∪⊥⊤∣',
    '⍣[]{}«»;⍱⍲,⌽⍷\\⍉\'"⌷⍬⍟⊖+-×⍒⍋/÷⍞⌿⍀⍝.⍎⍕:'
  ]
  var alt=0,shift=0

  function updateLayout(){
    layout=layouts[2*alt+shift]
    $('.keyboard .key:not(.special)').each(function(i){$(this).text(layout[i])})
  }
  updateLayout()

  var actions={
    insert:function(c){$('<span>').text(c.replace(/\ /g,'\xa0')).insertBefore('#cursor')},
    enter:function(){$('<br>').insertBefore('#cursor')},
    backspace:function(){$('#cursor').prev().remove()},
    exec:function(){
      try{
        var result=apl(extractTextFromDOM(document.getElementById('editor')).replace(/\xa0/g,' '))
        $('#result').removeClass('error').text(apl.format(result).join('\n')+'\n')
      }catch(e){
        console&&console.error&&console.error(e)
        $('#result').addClass('error').text(e)
      }
      $('#pageInput').hide();$('#pageOutput').show()
    }
  }

  $('.key:not(.special)').on('aplkeypress',function(){actions.insert($(this).text())})
  $('.enter').on('aplkeypress',actions.enter)
  $('.space').on('aplkeypress',function(){$('<span>&nbsp;</span>').insertBefore('#cursor')})
  $('.bksp' ).on('aplkeypress',actions.backspace)
  $('.shift').on('aplkeypress',function(){$(this).toggleClass('isOn',(shift=1-shift));updateLayout()})
  $('.alt'  ).on('aplkeypress',function(){$(this).toggleClass('isOn',(alt=1-alt));updateLayout()})
  $('.exec' ).on('aplkeypress',actions.exec)

  $('body').keypress(function(e){
    e.keyCode===10?actions.exec():e.keyCode===13?actions.enter():actions.insert(String.fromCharCode(e.charCode))
    return false
  })

  $('body').keydown(function(e){e.keyCode===8&&actions.backspace()})

  $('#closeOutputButton').bind('mouseup touchend',function(e){
    e.preventDefault();$('#pageInput').show();$('#pageOutput').hide();return false
  })

  // Bookmarkable source code
  var hashParams={}
  if(location.hash){
    var kvs=location.hash.slice(1).split(',')
    for(var i=0;i<kvs.length;i++){
      var kv=kvs[i].split('='),k=kv[0],v=kv[1]
      hashParams[k]=unescape(v)
    }
  }
  var code=hashParams.code
  if(code)for(var i=0;i<code.length;i++)code[i]==='\n'?actions.enter():actions.insert(code[i]) 
})
