jQuery ($) ->
  $('#aplButtons .sym').on 'click', ->
    $('#editor').append "<img src='images/#{$(@).data 'icon'}.png' />"
    false
