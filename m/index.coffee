jQuery ($) ->

  $('#aplButtons .sym').live 'tap', ->
    $("<img src='images/#{$(@).data 'icon'}.png' />").appendTo '#editor'
    false

  $('#aplButtons .sym').bind 'taphold', (e) ->
    e.preventDefault()
    e.stopPropagation()
    $("<img src='images/#{$(@).data 'icon'}.png' />").css(border: 'solid red 1px').appendTo '#editor'
    false

  $('#aplButtons img').live 'taphold', (e) ->
    e.preventDefault()
    e.stopPropagation()
    $("<img src='#{$(@).attr 'src'}' />").css(border: 'solid red 1px').appendTo '#editor'
    false

  $('#editor img').live 'tap', (e) -> $(@).remove(); false
  $('#editor img').live 'taphold', (e) -> $(@).css 'border', 'dashed green 1px'; false



