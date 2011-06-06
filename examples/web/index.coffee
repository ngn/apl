jQuery.fn.insertAtCaret = (s) ->
  # No idea whether this works in IE
  @each ->
    if @setSelectionRange
      p = @selectionStart
      @value = @value[0...p] + s + @value[@selectionEnd...@value.length]
      @focus()
      p += s.length
      @setSelectionRange p, p

    else if document.selection
      @focus()
      orig = @value.replace /\r\n/g, '\n'
      range = document.selection.createRange()
      if range.parentElement() isnt e then return false
      range.text = s
      actual = tmp = @value.replace /\r\n/g, '\n'

      for diff in [0...orig.length]
        if orig.charAt(diff) isnt actual.charAt(diff)
          break

      index = start = 0
      while tmp.match(s) and (tmp = tmp.replace(s, "")) and index <= diff
        start = actual.indexOf s, index
        index = start + s.length

      pos = start + s.length
      range = @createTextRange()
      range.move 'character', pos
      range.select()

    else
      @value += s



jQuery ($) ->

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
        if x.length is 0 then return "<table class='#{cssClass}'><tr><td>&nbsp;</table>"
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

  $('#program').focus()

  $('#go').closest('form').submit ->
    $('#result').html(
      try
        formatAsHTML exec parser.parse $('#program').val()
      catch e
        console?.error?(e)
        "<div class='error'>#{esc e.message}</div>"
    )
    false

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
    ['∨', 'Or']
    ['∧', 'And']
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
    ['¯', 'Negative number sign']
    ['⍝', 'Comment']
    ['←', 'Assignment']
    ['⍬', 'Zilde']
    ['◇', 'Statement separator']
    ['⍺', 'Left formal parameter']
    ['⍵', 'Right formal parameter']
  ]

  h = ''
  for x in symbolDefs
    h += "<a href='#' title='#{esc x[1]}'>#{x[0]}</a>"
  $('#symbols').html h

  $('#symbols a').live 'click', ->
    $('#program').insertAtCaret $(@).text()


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
        ⍝  A ∘.× B  multiplies every item in A to every item in B

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
    $('#program').val code
