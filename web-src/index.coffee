{exec} = require './compiler'
{format} = require './vocabulary/format'

jQuery ($) ->

  # Bookmarkable source code
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



  # "Execute" button
  execute = ->
    try
      s = $('#code').val()
      if s.toLowerCase() in [')test', ')t']
        $('#result').removeClass('error').text 'Running tests...'
        setTimeout runDocTests, 1
      else
        result = exec s
        $('#result').removeClass('error').text format(result).join '\n'
    catch err
      console?.error?(err.stack)
      $('#result').addClass('error').text err
    return

  $('#go').tipsy(gravity: 'e', opacity: 1, delayIn: 1000)
    .closest('form').submit -> execute(); false

  if hashParams.run then $('#go').click()



  # Symbols table
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



  # Keyboard
  layout =
    default: [
      '` 1 2 3 4 5 6 7 8 9 0 - ='
      'q w e r t y u i o p [ ] \\'
      'a s d f g h j k l ; \' {enter}'
      '{shift} z x c v b n m , . / {bksp}'
      '{alt} {space} {exec!!}'
    ]
    shift: [
      '~ ! @ # $ % ^ & * ( ) _ +'
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

  # Key mappings
  combos = '`': {}
  asciiKeys = layout.default.concat(layout.shift).join(' ').split ' '
  aplKeys = layout.alt.concat(layout['alt-shift']).join(' ').split ' '
  for k, i in asciiKeys
    v = aplKeys[i]
    if not (/^\{\w+\}$/.test(k) or /^\{\w+\}$/.test(v))
      combos['`'][k] = v

  $.keyboard.keyaction.exec = execute
  $.keyboard.defaultOptions.combos = {}
  $.keyboard.comboRegex = /(`)(.)/mig
  $('textarea').keyboard
    layout: 'custom'
    useCombos: false
    display: {bksp: 'Bksp', shift: '⇧', alt: 'APL', enter: 'Enter', exec: '⍎'}
    autoAccept: true
    usePreview: false
    customLayout: layout
    useCombos: true
    combos: combos

  $('textarea').addTyping().focus()

  $('#code').keydown (event) -> if event.keyCode is 13 and event.ctrlKey then $('#go').click(); false

  tipsyOpts =
    title: ->
      hSymbolDefs[$(@).text()] ? ''
    gravity: 's'
    delayIn: 1000
    opacity: 1

  $('.ui-keyboard').on 'mouseover', '.ui-keyboard-button', (event) ->
    $b = $(event.target).closest '.ui-keyboard-button'
    if not $b.data 'tipsyInitialised'
      $b.data('tipsyInitialised', true).tipsy(tipsyOpts).tipsy 'show'
    false



  # Examples
  for [name, code], i in window.examples
    $('#examples').append(" <a href='#example#{i}'>#{name}</a>")

  $('#examples').on 'click', 'a', ->
    [name, code] = window.examples[parseInt $(@).attr('href').replace /#example(\d+)$/, '$1']
    $('#code').val(code).focus()
    false



  # Tests
  runDocTests = ->
    $('#result').removeClass('error').html ''
    {exec} = require './compiler'
    {approx} = require './vocabulary/vhelpers'
    nExecuted = nFailed = 0
    t0 = Date.now()
    for [code, mode, expectation] in aplTests
      nExecuted++
      outcome = runDocTest [code, mode, expectation], exec, approx
      if not outcome.success
        nFailed++
        s = """
          Test failed: #{JSON.stringify code}
                       #{JSON.stringify expectation}\n
        """
        if outcome.reason then s += outcome.reason + '\n'
        if outcome.error then s += outcome.error.stack + '\n'
        $('#result').text $('#result').text() + s
    $('#result').text $('#result').text() + (
      (if nFailed then "#{nFailed} out of #{nExecuted} tests failed"
      else "All #{nExecuted} tests passed") +
      " in #{Date.now() - t0} ms.\n"
    )
    return

  return
