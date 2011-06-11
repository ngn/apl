jQuery ($) ->

  # Result formatting {{{1

  escT = {'<': 'lt', '>': 'gt', '&': 'amp', "'": 'apos', '"': 'quot'}
  esc = (s) -> if s then s.replace /[<>&'"]/g, (x) -> "&#{escT[x]};" else ''
  escHard = (s) -> esc(s).replace(' ', '&nbsp;', 'g').replace('\n', '<br/>', 'g')

  formatAsHTML = (x) ->
    # Supports arrays of up 4 dimensions
    # Higher-rank arrays are displayed as if 4-dimensional
    try
      if typeof x is 'string'
        "<span class='character'>#{esc(x).replace(' ', '&nbsp;', 'g')}</span>"
      else if typeof x is 'number'
        "<span class='number'>#{if x < 0 then '¯' + (-x) else '' + x}</span>"
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



  # "Execute" button {{{1
  $('#code').focus()

  $('#go').closest('form').submit ->
    $('#result').html(
      try
        interpreter = require './interpreter'
        parser = require './parser'
        formatAsHTML interpreter.exec parser.parse $('#code').val()
      catch e
        console?.error?(e)
        "<div class='error'>#{escHard e.message}</div>"
    )
    false



  # Symbols table {{{1
  symbolDefs = [
    ['+', '',   'Conjugate, Add']
    ['−', '`-', 'Negate, Subtract']
    ['×', '`=', 'Sign of, Multiply']
    ['÷', '`:', 'Reciprocal, Divide']
    ['⌈', '`s', 'Ceiling, Greater of']
    ['⌊', '`d', 'Floor, Lesser of']
    ['∣', '`m', 'Absolute value, Residue']
    ['⍳', '`i', 'Index generator, Index of']
    ['?', '',   'Roll, Deal']
    ['⋆', '`p', 'Exponential, To the power of']
    ['⍟', '`P', 'Natural logarithm, Logarithm to the base']
    ['○', '`o', 'Pi times, Circular and hyperbolic functions']
    ['!', '',   'Factorial, Binomial']
    ['⌹', '',   'Matrix inverse, Matrix divide']
    ['<', '',   'Less than']
    ['≤', '`4', 'Less than or equal']
    ['=', '',   'Equal']
    ['≥', '`6', 'Greater than or equal']
    ['>', '',   'Greater than']
    ['≠', '`8', 'Not equal']
    ['≡', '`_', 'Depth, Match']
    ['≢', '',   'Not match']
    ['∈', '`e', 'Enlist, Membership']
    ['⍷', '`E', 'Find']
    ['∪', '`v', 'Unique, Union']
    ['∩', '`c', 'Intersection']
    ['∼', '`t', 'Not, Without']
    ['∨', '`9', 'Or']
    ['∧', '`0', 'And']
    ['⍱', '`(', 'Nor']
    ['⍲', '`)', 'Nand']
    ['⍴', '`r', 'Shape of, Reshape']
    [',', '',   'Ravel, Catenate']
    ['⍪', '`,', 'First axis catenate']
    ['⌽', '`W', 'Reverse, Rotate']
    ['⊖', '`A', 'First axis rotate']
    ['⍉', '`T', 'Transpose']
    ['↑', '`y', 'First, Take']
    ['↓', '`u', 'Drop']
    ['⊂', '`z', 'Enclose, Partition']
    ['⊃', '`x', 'Disclose, Pick']
    ['⌷', '`I', 'Index']
    ['⍋', '`g', 'Grade up']
    ['⍒', '`h', 'Grade down']
    ['⊤', '`n', 'Encode']
    ['⊥', '`b', 'Decode']
    ['⍕', '`N', 'Format, Format by specification']
    ['⍎', '`B', 'Execute']
    ['⊣', '',   'Stop, Left']
    ['⊢', '',   'Pass, Right']
    ['⎕', '`l', 'Evaluated input, Output with a newline']
    ['⍞', '`L', 'Character input, Bare output']
    ['¨', '`1', 'Each']
    ['∘.','`j', 'Outer product']
    ['/', '',   'Reduce']
    ['⌿', '`/', '1st axis reduce']
    ['\\','',   'Scan']
    ['⍀', '`\\','1st axis scan']
    ['⍣', '`!', 'Power operator']
    ['¯', '`2', 'Negative number sign']
    ['⍝', '`C', 'Comment']
    ['←', '`[', 'Assignment']
    ['⍬', '`O', 'Zilde']
    ['◇', '`;', 'Statement separator']
    ['⍺', '`a', 'Left formal parameter']
    ['⍵', '`w', 'Right formal parameter']
  ]

  # Symbols setup {{{1
  mapping = {}
  hSymbolDefs = {} # indexed by symbol
  symbolsHTML = ''
  for symbolDef in symbolDefs
    [ch, key, description] = symbolDef
    hSymbolDefs[ch] = symbolDef
    href = '#' + (
      for c in ch
        s = '0000' + c.charCodeAt(0).toString(16).toUpperCase()
        'U+' + s[s.length - 4 ...]
    ).join ','
    if key then mapping[key] = ch
    symbolsHTML += "<a href='#{href}'>#{esc ch}</a>"
  $('#symbols').html "<p>#{symbolsHTML}</p>"
  $('#symbols a').live 'click', -> $('#code').focus().replaceSelection $(@).text(); false

  $('#symbols a').tooltip
    showURL: false
    bodyHandler: ->
      [ch, key, description] = hSymbolDefs[$(@).text()]
      """
        <span class='keys' style="float: right">#{(
            for k in key
              s = "<span class='key'>#{k}</span>"
              if k isnt k.toLowerCase() then s = "<span class='key'>Shift&nbsp;⇧</span>" + s
              s
        ).join(' ')}</span>
        <span class='symbol'>#{ch}</span>
        <p class='description'>#{description}</p>
      """

  $('#code').keydown (event) -> if event.keyCode is 13 and event.ctrlKey then $('#go').click(); false
  $('#code').retype 'on', {mapping}

  # Keyboard visualisation {{{1
  renderKey = (lowerRegister, upperRegister) ->
    """
      <table class='key'>
        <tr>
          <td class='upperRegister'>#{esc upperRegister}</td>
          <td class='upperAPLRegister'>#{esc mapping['`' + upperRegister]}</td>
        </tr>
        <tr>
          <td class='lowerRegister'>#{esc lowerRegister}</td>
          <td class='lowerAPLRegister'>#{esc mapping['`' + lowerRegister]}</td>
        </tr>
      </table>
    """

  td = (content) -> "<td>#{content}</td>"

  renderKeyboard = (mapping) ->
    """
      <div class="keyboard">
        <table class="row"><tr>#{[
          td renderKey '`', '~'
          td renderKey '1', '!'
          td renderKey '2', '@'
          td renderKey '3', '#'
          td renderKey '4', '$'
          td renderKey '5', '%'
          td renderKey '6', '^'
          td renderKey '7', '&'
          td renderKey '8', '*'
          td renderKey '9', '('
          td renderKey '0', ')'
          td renderKey '-', '_'
          td renderKey '=', '+'
          ].join ''}
          <td><table class="key backspaceKey"><tr><td>Backspace<br/>⟵</td></tr></table></td>
        </tr></table>
        <table class="row"><tr>
          <td><table class="key tabKey"><tr><td>Tab<br/>↹</td></tr></table></td>
          #{[
          td renderKey 'q', 'Q'
          td renderKey 'w', 'W'
          td renderKey 'e', 'E'
          td renderKey 'r', 'R'
          td renderKey 't', 'T'
          td renderKey 'y', 'Y'
          td renderKey 'u', 'U'
          td renderKey 'i', 'I'
          td renderKey 'o', 'O'
          td renderKey 'p', 'P'
          td renderKey '[', '{'
          td renderKey ']', '}'
          td renderKey '\\', '|'
          ].join ''}
        </tr></table>
        <table class="row"><tr>
          <td><table class="key capsLockKey"><tr><td>Caps Lock</td></tr></table></td>
          #{[
          td renderKey 'a', 'A'
          td renderKey 's', 'S'
          td renderKey 'd', 'D'
          td renderKey 'f', 'F'
          td renderKey 'g', 'G'
          td renderKey 'h', 'H'
          td renderKey 'j', 'J'
          td renderKey 'k', 'K'
          td renderKey 'l', 'L'
          td renderKey ';', ':'
          td renderKey "'", '"'
          ].join ''}
          <td><table class="key enterKey"><tr><td>Enter<br/>⏎</td></tr></table></td>
        </tr></table>
        <table class="row"><tr>
          <td><table class="key leftShiftKey"><tr><td>Shift&nbsp;⇧</td></tr></table></td>
          #{[
          td renderKey 'z', 'Z'
          td renderKey 'x', 'X'
          td renderKey 'c', 'C'
          td renderKey 'v', 'V'
          td renderKey 'b', 'B'
          td renderKey 'n', 'N'
          td renderKey 'm', 'M'
          td renderKey ',', '<'
          td renderKey '.', '>'
          td renderKey '/', '?'
          ].join ''}
          <td><table class="key rightShiftKey"><tr><td>Shift&nbsp;⇧</td></tr></table></td>
        </tr></table>
      </div>
    """

  isKeyboardShown = false
  $keyboard = null
  $('#keyboardSwitch a').live 'click', (event) ->
    isKeyboardShown = not isKeyboardShown
    $keyboard ?= $(renderKeyboard()).appendTo '#keyboardSwitch'
    $keyboard.toggle isKeyboardShown
    $(@).text(if isKeyboardShown then 'Hide keyboard' else 'Show keyboard')
    false

  # Examples {{{1
  examples = [

    ['Rho-Iota',
     '''
        ⍝  ⍳ n  generates a list of numbers from 0 to n−1
        ⍝  n n ⍴ A  arranges the elements of A in an n×n matrix

        5 5 ⍴ ⍳ 25
     ''']

    ['Multiplication table',
     '''
        ⍝  ∘.       is the "outer product" operator
        ⍝  a × b    scalar multiplication, "a times b"
        ⍝  A ∘.× B  every item in A times every item in B

        (⍳ 10) ∘.× ⍳ 10
     ''']

    ['Life',
     '''
        ⍝ Conway's game of life
        r←(3 3 ⍴ ⍳ 9)∈1 3 6 7 8
        R←¯1⊖¯2⌽5 7↑r
        life←{∨/1⍵∧3 4=⊂+/+⌿1 0 ¯1∘.⊖1 0 ¯1⌽¨⊂⍵}
        R (life R) (life life R)
     ''']

  ]

  for [name, code], i in examples
    $('#examples').append(" <a href='#example#{i}'>#{name}</a>")

  $('#examples a').live 'click', ->
    [name, code] = examples[parseInt $(@).attr('href').replace /#example(\d+)$/, '$1']
    $('#code').val(code).focus()
    false

  # }}}1
