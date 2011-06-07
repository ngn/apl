jQuery ($) ->

  # Result formatting {{{1

  escT = {'<': 'lt', '>': 'gt', '&': 'amp', "'": 'apos', '"': 'quot'}
  esc = (s) -> s.replace /[<>&'"]/g, (x) -> "&#{escT[x]};"

  formatAsHTML = (x) ->
    # Supports arrays of up 4 dimensions
    # Higher-rank arrays are displayed as if 4-dimensional
    try
      if typeof x is 'string'
        "<span class='character'>#{esc(x).replace /\ /g, '&nbsp;'}</span>"
      else if typeof x is 'number'
        "<span class='number'>#{if x < 0 then '¯' + (-x) else '' + x}</span>"
      else if typeof x is 'function'
        "<span class='function'>function</span>"
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
        formatAsHTML exec parser.parse $('#code').val()
      catch e
        console?.error?(e)
        "<div class='error'>#{esc e.message}</div>"
    )
    false



  # Symbols and key mapping {{{1
  mapping = {}
  symbolsHTML = ''
  symbol = (ch, key, description) ->
    if key then mapping[key] = ch; description += " (key: #{key})"
    symbolsHTML += "<a href='#symbol-#{esc ch}' title='#{esc description}'>#{esc ch}</a>"

  symbol '+', '',   'Conjugate, Add'
  symbol '−', '`-', 'Negate, Subtract'
  symbol '×', '`=', 'Sign of, Multiply'
  symbol '÷', '`:', 'Reciprocal, Divide'
  symbol '⌈', '`s', 'Ceiling, Greater of'
  symbol '⌊', '`d', 'Floor, Lesser of'
  symbol '∣', '`m', 'Absolute value, Residue'
  symbol '⍳', '`i', 'Index generator, Index of'
  symbol '?', '',   'Roll, Deal'
  symbol '⋆', '`p', 'Exponential, To the power of'
  symbol '⍟', '',   'Natural logarithm, Logarithm to the base'
  symbol '○', '`o', 'Pi times, Circular and hyperbolic functions'
  symbol '!', '',   'Factorial, Binomial'
  symbol '⌹', '',   'Matrix inverse, Matrix divide'
  symbol '<', '`3', 'Less than'
  symbol '≤', '`4', 'Less than or equal'
  symbol '=', '`5', 'Equal'
  symbol '≥', '`6', 'Greater than or equal'
  symbol '>', '`7', 'Greater than'
  symbol '≠', '`/', 'Not equal'
  symbol '≡', '',   'Depth, Match'
  symbol '≢', '',   'Not match'
  symbol '∈', '`e', 'Enlist, Membership'
  symbol '⍷', '`f`',   'Find'
  symbol '∪', '`v', 'Unique, Union'
  symbol '∩', '`c', 'Intersection'
  symbol '∼', '`t', 'Not, Without'
  symbol '∨', '`9', 'Or'
  symbol '∧', '`0', 'And'
  symbol '⍱', '',   'Nor'
  symbol '⍲', '',   'Nand'
  symbol '⍴', '`r', 'Shape of, Reshape'
  symbol ',', '',   'Ravel, Catenate'
  symbol '⍪', '`,', 'First axis catenate'
  symbol '⌽', '',   'Reverse, Rotate'
  symbol '⊖', '',   'First axis rotate'
  symbol '⍉', '',   'Transpose'
  symbol '↑', '`y', 'First, Take'
  symbol '↓', '`u', 'Drop'
  symbol '⊂', '`z', 'Enclose, Partition'
  symbol '⊃', '`x', 'Disclose, Pick'
  symbol '⌷', '`l', 'Index'
  symbol '⍋', '`g', 'Grade up'
  symbol '⍒', '`h', 'Grade down'
  symbol '⊤', '`b', 'Encode'
  symbol '⊥', '`n', 'Decode'
  symbol '⍕', '',   'Format, Format by specification'
  symbol '⍎', '',   'Execute'
  symbol '⊣', '',   'Stop, Left'
  symbol '⊢', '',   'Pass, Right'
  symbol '⎕', '',   'Evaluated input, Output with a newline'
  symbol '⍞', '',   'Character input, Bare output'
  symbol '¨', '`1', 'Each'
  symbol '∘.','`j', 'Outer product'
  symbol '/', '',   'Reduce'
  symbol '⌿', '`/', '1st axis reduce'
  symbol '\\','',   'Scan'
  symbol '⍀.','',   '1st axis scan'
  symbol '¯', '`2', 'Negative number sign'
  symbol '⍝', '`]', 'Comment'
  symbol '←', '`[', 'Assignment'
  symbol '⍬', '',   'Zilde'
  symbol '◇', '`;', 'Statement separator'
  symbol '⍺', '`a', 'Left formal parameter'
  symbol '⍵', '`w', 'Right formal parameter'

  $('#symbols').html symbolsHTML
  $('#symbols a').live 'click', ->
    $('#code').replaceSelection $(@).text()

  $('#code').keydown (event) ->
    if event.keyCode is 13 and event.ctrlKey
      $('#go').click()
      false

  $('#code').retype 'on', {mapping}



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

  # }}}1
