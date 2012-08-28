$.fn.toggleVisibility = ->
  @css 'visibility', if @css('visibility') is 'hidden' then '' else 'hidden'

$ ->
  setInterval (-> $('#cursor').toggleVisibility()), 500

  $('#editor span').live 'mousedown', (e) ->
    if e.pageX < $(e.target).position().left + $(e.target).width() / 2
      $('#cursor').insertBefore @
    else
      $('#cursor').insertAfter @
    false

  $('.key').live 'mousedown', ->
    $(@).addClass('down').trigger 'aplkeypress'
    setTimeout (=> $(@).removeClass 'down'), 500

  layouts = [
    'qwertyuiopasdfghjklzxcvbnm'
    'QWERTYUIOPASDFGHJKLZXCVBNM'
    ' ⍵∈⍴∼↑↓⍳○⋆⍺⌈⌊ ∇∆∘◇⎕⊂⊃∩∪⊥⊤∣'
    ' ⌽⍷ ⍉  ⌷⍬⍟⊖   ⍒⍋ ÷⍞  ⍝ ⍎⍕ '
  ]
  layoutIndex = 0

  setLayout = (layout) ->
    $('.keyboard .key:not(.layoutSwitch, .backspace, .enter)')
      .each (i, e) -> $(e).text layout[i]
    return

  setLayout layouts[0]

  $('.key').live 'aplkeypress', ->
    if $(@).hasClass 'enter'
      $('<br>').insertBefore '#cursor'
    else if $(@).hasClass 'backspace'
      $('#cursor').prev().remove()
    else if $(@).hasClass 'layoutSwitch'
      layoutIndex++
      layoutIndex %= layouts.length
      setLayout layouts[layoutIndex]
    else
      $('<span>').text($(@).text().replace /[\ \t\r\n]+/g, '').insertBefore '#cursor'
    false
