$ ->

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
    $("<img class='sym button' data-sym='#{sym}' src='images/apl#{i}.png' />").appendTo '#syms'

  $('#footer .sym').live 'click', ->
    $("<img data-sym='#{$(@).data 'sym'}' src='#{$(@).attr 'src'}' />").insertBefore '#cursor'

  $('#backspace').click ->
    $('#cursor').prev().remove()

  $('#exec').click ->
    console.info ($('#editor img').map -> $(@).data 'sym').get().join('')

  $('#editor img').live 'click', ->
    $('#cursor').insertAfter @
