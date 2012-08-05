jQuery ($) ->

  setInterval(
    -> $('#cursor').css 'visibility', if $('#cursor').css('visibility') is 'hidden' then 'visible' else 'hidden'
    500
  )

  $('#aplButtons .sym').live 'tap', ->
    $("<img src='images/#{$(@).data 'icon'}.png' />").insertBefore '#cursor'
    false

  $('#editor img').live 'tap', (e) ->
    $('#cursor').insertAfter @
    false
