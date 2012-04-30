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



  # Code loading {{{1
  hashParams = {}
  if location.hash
    for nameValue in location.hash.substring(1).split ','
      [name, value] = nameValue.split '='
      hashParams[name] = unescape value
  $('#code').text(hashParams.code or '').focus()



  # "Execute" button {{{1
  $('#go').closest('form').submit ->
    {exec} = require './interpreter'
    {browserBuiltins} = require './browser'
    {inherit} = require './helpers'
    ctx = inherit browserBuiltins
    exec $('#code').val(), ctx, (err, result) ->
      if err
        console?.error?(err)
        $('#result').html "<div class='error'>#{escHard err.message}</div>"
      else
        $('#result').html formatAsHTML result
    false



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
  symbolsHTML = ''
  for symbolDef in symbolDefs
    ch = symbolDef[0]
    hSymbolDefs[ch] = symbolDef
    href = '#' + (
      for c in ch
        'U+' + ('000' + c.charCodeAt(0).toString(16).toUpperCase())[-4...]
    ).join ','
    symbolsHTML += "<a href='#{href}'>#{esc ch}</a>"
  $('#symbols').html "<p>#{symbolsHTML}</p>"
  $('#symbols a').live 'click', -> $('#code').focus().replaceSelection $(@).text(); false

  $('#symbols a').tooltip
    showURL: false
    bodyHandler: ->
      [ch, description, opts] = hSymbolDefs[$(@).text()]
      """
        <span class='keys' style="float: right">#{(
            for k in (opts?.keys or rMapping[ch] or '')
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
  renderKey = (lowerRegister, upperRegister) -> """
    <td>
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
    </td>
  """

  renderKeys = (keysDescription) ->
    (for x in keysDescription.split ' ' then renderKey x[0], x[1]).join ''

  renderKeyboard = (mapping) -> """
    <div class="keyboard">
      <div class="help">Prepend a backquote (`) to get the symbols in blue or red.</div>
      <table class="row"><tr>
        #{renderKeys '`~ 1! 2@ 3# 4$ 5% 6^ 7& 8* 9( 0) -_ =+'}
        <td><table class="key backspaceKey"><tr><td>Backspace<br/>⟵</td></tr></table></td>
      </tr></table>
      <table class="row"><tr>
        <td><table class="key tabKey"><tr><td>Tab<br/>↹</td></tr></table></td>
        #{renderKeys 'qQ wW eE rR tT yY uU iI oO pP [{ ]} \\|'}
      </tr></table>
      <table class="row"><tr>
        <td><table class="key capsLockKey"><tr><td>Caps Lock</td></tr></table></td>
        #{renderKeys 'aA sS dD fF gG hH jJ kK lL ;: \'"'}
        <td><table class="key enterKey"><tr><td>Enter<br/>⏎</td></tr></table></td>
      </tr></table>
      <table class="row"><tr>
        <td><table class="key leftShiftKey"><tr><td>Shift&nbsp;⇧</td></tr></table></td>
        #{renderKeys 'zZ xX cC vV bB nN mM ,< .> /?'}
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
    $(@).text(if isKeyboardShown then 'Hide keyboard mapping' else 'Show keyboard mapping')
    false

  # Examples {{{1
  for [name, code], i in window.examples
    $('#examples').append(" <a href='#example#{i}'>#{name}</a>")

  $('#examples a').live 'click', ->
    [name, code] = window.examples[parseInt $(@).attr('href').replace /#example(\d+)$/, '$1']
    $('#code').val(code).focus()
    false

  # }}}1
