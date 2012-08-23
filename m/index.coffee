$.fn.flip = ->
  @css 'visibility', if @css('visibility') is 'hidden' then '' else 'hidden'

$ ->
  setInterval (-> $('#cursor').flip()), 500

  $('#editor span').live 'mousedown', ->
    $('#cursor').insertAfter @
    false

  $('.key').live 'mousedown', ->
    $(@).addClass('down').trigger 'aplkeypress'
    setTimeout (=> $(@).removeClass 'down'), 500

  $('.key').live 'aplkeypress', ->
    if $(@).hasClass 'enter'
      $('<br>').insertBefore '#cursor'
    else if $(@).hasClass 'backspace'
      $('#cursor').prev().remove()
    else
      $('<span>').text($(@).text().replace /[\ \t\r\n]+/g, '').insertBefore '#cursor'
    false
