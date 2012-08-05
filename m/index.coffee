$(document).bind 'pageinit', ->

  setInterval(
    -> $('#cursor').css 'visibility', if $('#cursor').css('visibility') is 'hidden' then 'visible' else 'hidden'
    500
  )

  syms = '''
      +−×÷←◇⍳⍴
      ⍺⍵∈⍷⌈⌊∣?
      !⋆⍟⊖⌽⍉○⌹
      ∨∧∇∆⍒⍋∪∩
      ⊤⊥⊢⊣.,⊂⊃
      ⍕⍎<>∘⍪/\
      =≠≤≥≡≢⌿⍀
      ¨⍣
  '''.replace /[ \t\n\r]+/g, ''

  for sym, i in syms
    $("""<a class='sym' href='#'
            data-role='button'
            data-icon='apl#{i}'
            data-iconpos="notext"
            data-sym="#{sym}"
            ></a>""")
      .button()
      .appendTo '#syms'

  $('.sym').live 'tap', ->
    $("<img data-sym='#{$(@).data 'sym'}' src='images/#{$(@).data 'icon'}.png' />").insertBefore '#cursor'
    false

  $('#backspace').bind 'tap', ->
    $('#cursor').prev().remove()
    return

  $('#exec').bind 'tap', ->
    console.info ($('#editor img').map -> $(@).data 'sym').get().join('')
    return

  $('#editor img').live 'tap', (e) ->
    $('#cursor').insertAfter @
    false
