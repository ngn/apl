{exec} = require './compiler'
{format} = require './vocabulary/format'

jQuery ($) ->

  # Bookmarkable source code {{{1
  hashParams = {}
  if location.hash
    for nameValue in location.hash.substring(1).split ','
      [name, value] = nameValue.split '='
      hashParams[name] = unescape value
  $('#code').text(hashParams.code or '').focus()

  $('#permalink').tipsy(gravity: 'e', opacity: 1, delayIn: 1000)
    .bind 'mouseover focus', ->
      $(@).attr 'href', '#code=' + escape $('#code').val()
      false



  # "Execute" button {{{1
  execute = ->
    try
      result = exec $('#code').val()
      $('#result').removeClass('error').text format(result).join '\n'
    catch err
      console?.error?(err.stack)
      $('#result').addClass('error').text err
    return

  $('#go').tipsy(gravity: 'e', opacity: 1, delayIn: 1000)
    .closest('form').submit -> execute(); false

  if hashParams.run then $('#go').click()



  # Symbols table {{{1
  hSymbolDefs =
    '+': 'Conjugate, Add'
    '-': 'Negate, Subtract'
    '×': 'Sign of, Multiply'
    '÷': 'Reciprocal, Divide'
    '⌈': 'Ceiling, Greater of'
    '⌊': 'Floor, Lesser of'
    '∣': 'Absolute value, Residue'
    '⍳': 'Index generator, Index of'
    '?': 'Roll, Deal'
    '*': 'Exponential, To the power of'
    '⍟': 'Natural logarithm, Logarithm to the base'
    '○': 'Pi times, Circular and hyperbolic functions'
    '!': 'Factorial, Binomial'
    '⌹': 'Matrix inverse, Matrix divide'
    '⍠': 'Variant operator'
    '<': 'Less than'
    '≤': 'Less than or equal'
    '=': 'Equal'
    '≥': 'Greater than or equal'
    '>': 'Greater than'
    '≠': 'Not equal'
    '≡': 'Depth, Match'
    '≢': 'Tally, Not match'
    '∊': 'Enlist, Membership'
    '⍷': 'Find'
    '∪': 'Unique, Union'
    '∩': 'Intersection'
    '~': 'Not, Without'
    '∨': 'Or (Greatest Common Divisor)'
    '∧': 'And (Least Common Multiple)'
    '⍱': 'Nor'
    '⍲': 'Nand'
    '⍴': 'Shape of, Reshape'
    ',': 'Ravel, Catenate'
    '⍪': 'First axis catenate'
    '⌽': 'Reverse, Rotate'
    '⊖': 'First axis rotate'
    '⍉': 'Transpose'
    '↑': 'First, Take'
    '↓': 'Drop'
    '⊂': 'Enclose, Partition'
    '⊃': 'Disclose, Pick'
    '⌷': 'Index'
    '⍋': 'Grade up'
    '⍒': 'Grade down'
    '⊤': 'Encode'
    '⊥': 'Decode'
    '⍕': 'Format, Format by specification'
    '⍎': 'Execute'
    '⊣': 'Stop, Left'
    '⊢': 'Pass, Right'
    '⎕': 'Evaluated input, Output with a newline'
    '⍞': 'Character input, Bare output'
    '¨': 'Each'
    '∘': 'Compose'
    '/': 'Reduce'
    '⌿': '1st axis reduce'
    '\\': 'Scan'
    '⍀': '1st axis scan'
    '⍣': 'Power operator'
    '⍨': 'Commute'
    '¯': 'Negative number sign'
    '⍝': 'Comment'
    '←': 'Assignment'
    '⍬': 'Zilde'
    '⋄': 'Statement separator'
    '⍺': 'Left formal parameter'
    '⍵': 'Right formal parameter'
    APL: 'Press backquote (`) followed by another key to insert an APL symbol, e.g. `r inserts rho (⍴)'



  # Keyboard {{{1
  $('textarea').keyboard
    layout: 'custom'
    useCombos: false
    display:
      bksp: 'Bksp'
      shift: '⇧'
      alt: 'APL'
      enter: 'Enter'
      exec: '⍎'
    autoAccept: true
    usePreview: false
    customLayout: layout =
      default: [
        '~ 1 2 3 4 5 6 7 8 9 0 - ='
        'q w e r t y u i o p [ ] \''
        'a s d f g h j k l ; \' {enter}'
        '{shift} z x c v b n m , . / {bksp}'
        '{alt} {space} {exec!!}'
      ]
      shift: [
        '` ! @ # $ % ^ & * ( ) _ +'
        'Q W E R T Y U I O P { } |'
        'A S D F G H J K L : " {enter}'
        '{shift} Z X C V B N M < > ? {bksp}'
        '{alt} {space} {exec!!}'
      ]
      alt: [
        '{empty} ¨ ¯ < ≤ = ≥ > ≠ ∨ ∧ ÷ ×'
        '{empty} ⍵ ∊ ⍴ ~ ↑ ↓ ⍳ ○ ⍟ ← → ⍀'
        '⍺ ⌈ ⌊ {empty} ∇ ∆ ∘ {empty} ⎕ ⋄ {empty} {enter}'
        '{shift} ⊂ ⊃ ∩ ∪ ⊥ ⊤ ∣ ⍪ {empty} ⌿ {bksp}'
        '{alt} {space} {exec!!}'
      ]
      'alt-shift': [
        '⍨ {empty} ⍁ ⍂ ⍠ ≈ ⌸ ⍯ ⍣ ⍱ ⍲ ≢ ≡'
        '⌹ ⍹ ⍷ ⍤ {empty} {empty} ⊖ ⍸ ⍬ ⌽ ⊣ ⊢ ⍉'
        '⍶ {empty} {empty} {empty} ⍒ ⍋ ⍝ {empty} ⍞ {empty} {empty} {enter}'
        '{shift} ⊆ ⊇ ⋔ ⍦ ⍎ ⍕ ⌷ « » ↗ {bksp}'
        '{alt} {space} {exec!!}'
      ]

  $.keyboard.keyaction.exec = execute

  $('textarea').focus()



  # Key mappings {{{1
  mapping = {}
  asciiKeys = layout.default.concat(layout.shift).join(' ').split ' '
  aplKeys = layout.alt.concat(layout['alt-shift']).join(' ').split ' '
  for k, i in asciiKeys
    v = aplKeys[i]
    if '{' not in [k[0], v[0]]
      mapping['`' + k] = v

  $('#code').keydown (event) -> if event.keyCode is 13 and event.ctrlKey then $('#go').click(); false
  $('#code').retype 'on', {mapping}

  tipsyOpts =
    title: ->
      console.info 'k', $(@).text()
      hSymbolDefs[$(@).text()] ? ''
    gravity: 's'
    delayIn: 1000
    opacity: 1

  $('.ui-keyboard').on 'mouseover', '.ui-keyboard-button', (event) ->
    $b = $(event.target).closest '.ui-keyboard-button'
    if not $b.data 'tipsyInitialised'
      $b.data('tipsyInitialised', true).tipsy(tipsyOpts).tipsy 'show'
    false



  # Examples {{{1
  for [name, code], i in window.examples
    $('#examples').append(" <a href='#example#{i}'>#{name}</a>")

  $('#examples').on 'click', 'a', ->
    [name, code] = window.examples[parseInt $(@).attr('href').replace /#example(\d+)$/, '$1']
    $('#code').val(code).focus()
    false

  return
