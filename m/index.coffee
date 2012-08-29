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
    ['qwertyuiopasdfghjklzxcvbnm', 'QWERTYUIOPASDFGHJKLZXCVBNM']
    [' ⍵∈⍴∼↑↓⍳○⋆⍺⌈⌊ ∇∆∘◇⎕⊂⊃∩∪⊥⊤∣', ' ⌽⍷ ⍉  ⌷⍬⍟⊖   ⍒⍋ ÷⍞  ⍝ ⍎⍕ ']
  ]
  layoutIndex = 0
  isCapsOn = false

  updateLayout = ->
    layout = layouts[layoutIndex][+isCapsOn]
    $('.keyboard .key:not(.special)').each (i, e) -> $(e).text layout[i]
    return

  updateLayout()

  $('.enter').on 'aplkeypress', -> $('<br>').insertBefore '#cursor'
  $('.space').on 'aplkeypress', -> $('<span> </span>').insertBefore '#cursor'
  $('.backspace').on 'aplkeypress', -> $('#cursor').prev().remove()

  $('.layoutSwitch').on 'aplkeypress', ->
    layoutIndex = (layoutIndex + 1) % layouts.length
    updateLayout()

  $('.capsLock').on 'aplkeypress', ->
    isCapsOn = not isCapsOn
    $(@).toggleClass 'isOn', isCapsOn
    updateLayout()

  $('.key:not(.special)').live 'aplkeypress', ->
    $('<span>').text($(@).text().replace /[\ \t\r\n]+/g, '').insertBefore '#cursor'
