if typeof define isnt 'function' then define = require('amdefine')(module)

define ['../lib/compiler', '../lib/browser', '../lib/helpers'], (compiler, browser, helpers) ->
  {exec} = compiler
  {browserBuiltins} = browser
  {inherit} = helpers

  jQuery ($) ->

    # Result formatting {{{1

    escT = {'<': 'lt', '>': 'gt', '&': 'amp', "'": 'apos', '"': 'quot'}
    esc = (s) -> if s then s.replace /[<>&'"]/g, (x) -> "&#{escT[x]};" else ''
    escHard = (s) -> esc(s).replace(/\ /g, '&nbsp;').replace(/\n/g, '<br/>')

    formatAsHTML = (x) ->
      # Supports arrays of up 4 dimensions
      # Higher-rank arrays are displayed as if 4-dimensional
      try
        if typeof x is 'string'
          "<span class='character'>#{esc(x).replace(' ', '&nbsp;', 'g')}</span>"
        else if typeof x is 'number'
          "<span class='number'>#{('' + x).replace /-|Infinity/g, '¯'}</span>"
        else if typeof x is 'function'
          "<span class='function'>#{
            if x.isPrefixOperator or x.isInfixOperator or x.isPostfixOperator then 'operator' else 'function'
          }#{
            if x.aplName then ' ' + x.aplName else ''
          }</span>"
        else if not x.length?
          "<span class='unknown'>#{esc('' + x)}</span>"
        else if x.shape and x.shape.length > 2
          # Slice into planes
          sx = x.shape # shape of x
          rx = sx.length # rank of x
          planeSize = sx[rx - 2] * sx[rx - 1]
          nPlanes = x.length / planeSize
          planes = for i in [0...nPlanes]
            formatHTMLTable x[i * planeSize ... (i + 1) * planeSize], sx[rx - 1], sx[rx - 2], 'subarray'
          nc = sx[rx - 3]
          nr = nPlanes / nc
          formatHTMLTable planes, nr, nc, 'array'
        else
          if x.length is 0 then return "<table class='array empty'><tr><td>empty</table>"
          [nr, nc] = x.shape or [1, x.length]
          x = for y in x then formatAsHTML y
          formatHTMLTable x, nr, nc, 'array'
      catch e
        console?.error?(e)
        '<span class="error">Presentation error</span>'

    formatHTMLTable = (a, nr, nc, cssClass) ->
      s = "<table class='#{cssClass}'>"
      for r in [0...nr]
        s += '<tr>'
        for c in [0...nc]
          s += "<td>#{a[nc * r + c]}</td>"
        s += '</tr>'
      s += '</table>'



    # Bookmarkable source code {{{1
    hashParams = {}
    if location.hash
      for nameValue in location.hash.substring(1).split ','
        [name, value] = nameValue.split '='
        hashParams[name] = unescape value
    $('#code').text(hashParams.code or '').focus()

    $('#permalink').bind 'mouseover focus', ->
      $(@).attr 'href', '#code=' + escape $('#code').val()
      false



    # "Execute" button {{{1
    execute = ->
      ctx = inherit browserBuiltins
      try
        result = exec $('#code').val()
        $('#result').html formatAsHTML result
      catch err
        console?.error?(err)
        $('#result').html "<div class='error'>#{escHard err.message}</div>"
      return

    $('#go').closest('form').submit -> execute(); false



    # Symbols table {{{1
    symbolDefs = [
      ['+', 'Conjugate, Add']
      ['−', 'Negate, Subtract']
      ['×', 'Sign of, Multiply']
      ['÷', 'Reciprocal, Divide']
      ['⌈', 'Ceiling, Greater of']
      ['⌊', 'Floor, Lesser of']
      ['∣', 'Absolute value, Residue']
      ['⍳', 'Index generator, Index of']
      ['?', 'Roll, Deal']
      ['⋆', 'Exponential, To the power of']
      ['⍟', 'Natural logarithm, Logarithm to the base']
      ['○', 'Pi times, Circular and hyperbolic functions']
      ['!', 'Factorial, Binomial']
      ['⌹', 'Matrix inverse, Matrix divide']
      ['<', 'Less than']
      ['≤', 'Less than or equal']
      ['=', 'Equal']
      ['≥', 'Greater than or equal']
      ['>', 'Greater than']
      ['≠', 'Not equal']
      ['≡', 'Depth, Match']
      ['≢', 'Not match']
      ['∈', 'Enlist, Membership']
      ['⍷', 'Find']
      ['∪', 'Unique, Union']
      ['∩', 'Intersection']
      ['∼', 'Not, Without']
      ['∨', 'Or (Greatest Common Divisor)']
      ['∧', 'And (Least Common Multiple)']
      ['⍱', 'Nor']
      ['⍲', 'Nand']
      ['⍴', 'Shape of, Reshape']
      [',', 'Ravel, Catenate']
      ['⍪', 'First axis catenate']
      ['⌽', 'Reverse, Rotate']
      ['⊖', 'First axis rotate']
      ['⍉', 'Transpose']
      ['↑', 'First, Take']
      ['↓', 'Drop']
      ['⊂', 'Enclose, Partition']
      ['⊃', 'Disclose, Pick']
      ['⌷', 'Index']
      ['⍋', 'Grade up']
      ['⍒', 'Grade down']
      ['⊤', 'Encode']
      ['⊥', 'Decode']
      ['⍕', 'Format, Format by specification']
      ['⍎', 'Execute']
      ['⊣', 'Stop, Left']
      ['⊢', 'Pass, Right']
      ['⎕', 'Evaluated input, Output with a newline']
      ['⍞', 'Character input, Bare output']
      ['¨', 'Each']
      ['∘.','Outer product', {keys: '`j.'}]
      ['/', 'Reduce']
      ['⌿', '1st axis reduce']
      ['\\','Scan']
      ['⍀', '1st axis scan']
      ['⍣', 'Power operator']
      ['¯', 'Negative number sign']
      ['⍝', 'Comment']
      ['←', 'Assignment']
      ['⍬', 'Zilde']
      ['◇', 'Statement separator']
      ['⍺', 'Left formal parameter']
      ['⍵', 'Right formal parameter']
    ]

    # Symbols setup {{{1
    mapping = {}
    rMapping = {} # reverse mapping
    a = '''
      `< «   `= ×   `> »   `_ ≡   `- −   `, ⍪   `; ◇   `: ÷   `! ⍣   `/ ⌿   `( ⍱
      `) ⍲   `[ ←   `\\ ⍀  `0 ∧   `1 ¨   `2 ¯   `4 ≤   `6 ≥   `8 ≠   `9 ∨   `a ⍺
      `A ⊖   `b ⊥   `B ⍎   `c ∩   `C ⍝   `d ⌊   `e ∈   `E ⍷   `g ∇   `G ⍒   `h ∆
      `H ⍋   `i ⍳   `I ⌷   `j ∘   `l ⎕   `L ⍞   `m ∣   `n ⊤   `N ⍕   `o ○   `O ⍬
      `p ⋆   `P ⍟   `r ⍴   `s ⌈   `t ∼   `T ⍉   `u ↓   `v ∪   `w ⍵   `W ⌽   `x ⊃
      `y ↑   `z ⊂
    '''.replace(/(^\s+|\s+$)/g, '').split /\s+/
    for i in [0 ... a.length / 2]
      k = a[2 * i]; v = a[2 * i + 1]; mapping[k] = v; rMapping[v] = k

    hSymbolDefs = {} # indexed by symbol
    for symbolDef in symbolDefs
      hSymbolDefs[symbolDef[0]] = symbolDef

    $('#code').keydown (event) -> if event.keyCode is 13 and event.ctrlKey then $('#go').click(); false
    $('#code').retype 'on', {mapping}



    # Keyboard {{{1
    $('textarea').keyboard
      layout: 'custom'
      useCombos: false
      display:
        bksp: 'Bksp'
        shift: '⇧'
        alt: 'Alt'
        enter: 'Enter'
        exec: 'GO'
      autoAccept: true
      usePreview: false
      customLayout:
        default: [
          '1 2 3 4 5 6 7 8 9 0 - ='
          'q w e r t y u i o p [ ]'
          'a s d f g h j k l {enter}'
          '{shift} z x c v b n m , . {bksp}'
          '{alt} {space} {exec!!}'
        ]
        shift: [
          '! @ # $ % ^ & * ( ) _ +'
          'Q W E R T Y U I O P { }'
          'A S D F G H J K L {enter}'
          '{shift} Z X C V B N M < > {bksp}'
          '{alt} {space} {exec!!}'
        ]
        alt: [
          '¨ ¯ < ≤ = ≥ > ≠ ∨ ∧ − ×'
          '░ ⍵ ∈ ⍴ ∼ ↑ ↓ ⍳ ○ ⋆ ← ░'
          '⍺ ⌈ ⌊ ░ ∇ ∆ ∘ ░ ⎕ {enter}'
          '{shift} ⊂ ⊃ ∩ ∪ ⊥ ⊤ ∣ ⍪ ░ {bksp}'
          '{alt} {space} {exec!!}'
        ]
        'alt-shift': [
          '⍣ ░ ░ ░ ░ ░ ░ ░ ⍱ ⍲ ≡ ░'
          '░ ⌽ ⍷ ░ ⍉ ░ ░ ⌷ ⍬ ⍟ ░ ░'
          '⊖ ░ ░ ░ ⍒ ⍋ ░ ░ ⍞ {enter}'
          '{shift} ░ ░ ⍝ ░ ⍎ ⍕ ░ « » {bksp}'
          '{alt} {space} {exec!!}'
        ]

    $.keyboard.keyaction.exec = execute

    $('textarea').focus()

    tipsyOpts =
      title: -> (hSymbolDefs[$(@).text()] or {})[1] or ''
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

    $('#examples a').live 'click', ->
      [name, code] = window.examples[parseInt $(@).attr('href').replace /#example(\d+)$/, '$1']
      $('#code').val(code).focus()
      false

    {}
