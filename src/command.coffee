# This file contains the entry point (`main()`) for APL execution on node.js.
if typeof define isnt 'function' then define = require('amdefine')(module)

define ['./compiler', './helpers', 'optimist'], (compiler, helpers, optimist) ->
  {exec} = compiler
  {isSimple, shapeOf, sum, prod, repeat} = helpers

  # TTY colours
  makeColour =
    if process.stdout.isTTY
      (code) -> (s) -> "\x1b[1;#{code}m#{s}\x1b[m"
    else
      -> (s) -> s
  [grey, red, green, yellow, blue, purple, cyan] = for colourId in [30..36] then makeColour colourId

  # Colour scheme
  borderColour = grey
  numberColour = cyan
  stringColour = purple
  functionColour = green
  specialColour = red # for null and undefined

  # Graphics symbols for the surrounding border
  [TOP, BTM, LFT, RGT, TOPLFT, TOPRGT, BTMLFT, BTMRGT] = "──││╭╮╰╯"
  # alternatives: "──││┌┐└┘", "━━┃┃┏┓┗┛"

  Rect = (width, height, strings) -> {width, height, strings}
  ColouredRect = (s, colour) -> Rect s.length, 1, [if colour then colour s else s]

  encode = (a, x) ->
    if a.length is 0 then return []
    for m in a then r = x % m; x = Math.floor x / m; r

  decode = (a, b) ->
    r = 0; (for ai, i in a then r = r * ai + b[i]); r

  # Format an APL object as a multiline string
  format = (a) -> format0(a).strings.join '\n'

  format0 = (a) ->
    if typeof a is 'undefined' then ColouredRect 'undefined', specialColour
    else if a is null then ColouredRect 'null', specialColour
    else if typeof a is 'string' then ColouredRect a, stringColour
    else if typeof a is 'number'
      ColouredRect ('' + a).replace(/-|Infinity/g, '¯'), numberColour
    else if typeof a is 'function'
      s = if a.isPrefixOperator or a.isInfixOperator or a.isPostfixOperator then 'operator' else 'function'
      if a.aplName then s += ' ' + a.aplName
      ColouredRect s, functionColour
    else if isSimple a then ColouredRect('' + a)
    else if a.length is 0
      Rect 3, 3, [
        borderColour TOPLFT + TOP + TOPRGT
        borderColour LFT    + ' ' +    RGT
        borderColour BTMLFT + BTM + BTMRGT
      ]
    else
      sa = shapeOf a
      nsa = sa.length
      rowDimIndices = for i in [nsa - 2 .. 0] by -2 then i
      colDimIndices = for i in [nsa - 1 .. 0] by -2 then i
      rowDims = for d in rowDimIndices then sa[d]
      colDims = for d in colDimIndices then sa[d]
      nRows = prod rowDims
      nCols = prod colDims
      h = for [0...nRows] then 0 # row heights
      w = for [0...nCols] then 0 # column widths
      grid =
        for r in [0...nRows]
          for c in [0...nCols]
            rb = encode rowDims, r
            cb = encode colDims, c
            b = for [0...nsa] then 0
            for i, j in rowDimIndices then b[i] = rb[j]
            for i, j in colDimIndices then b[i] = cb[j]
            box = format0 a[decode sa, b]
            h[r] = Math.max h[r], box.height
            w[c] = Math.max w[c], box.width
            box

      mm = 1
      totalWidth = 2 + sum(w) - colDims.length + sum(for i in [colDims.length - 1 .. 0] then mm *= colDims[i])

      totalHeight = 2 + sum(h)
      if rowDims.length
        mm = 1
        totalHeight += 1 - rowDims.length + sum(for i in [rowDims.length - 1 .. 1] by -1 then mm *= rowDims[i])

      strings = [borderColour TOPLFT + repeat(TOP, totalWidth - 2) + TOPRGT]
      for r in [0...nRows]
        for c in [0...nCols]
          grid[r][c] = vpad grid[r][c], h[r]
          grid[r][c] = hpad grid[r][c], w[c]

        if r
          # Add vertical spacing
          mm = 1
          for m in rowDims
            if r % (mm *= m) then break
            strings.push borderColour(LFT) + repeat(' ', totalWidth - 2) + borderColour(RGT)

        for i in [0...h[r]]
          s = ''
          for c in [0...nCols]

            if c
              # Add horizontal spacing
              s += ' '
              mm = 1
              for m in colDims
                if c % (mm *= m) then break
                s += ' '

            s += grid[r][c].strings[i]
          strings.push borderColour(LFT) + s + borderColour(RGT)
      strings.push borderColour BTMLFT + repeat(BTM, totalWidth - 2) + BTMRGT
      Rect totalWidth, totalHeight, strings

  # Horizontally extend a rectangle
  hpad = (rect, width) ->
    if rect.width >= width
      rect
    else
      padding = repeat ' ', width - rect.width
      Rect width, rect.height, (for line in rect.strings then line + padding)

  # Vertically extend a rectangle
  vpad = (rect, height) ->
    if rect.height >= height
      rect
    else
      padding = repeat ' ', rect.width
      Rect rect.width, height, rect.strings.concat(for [rect.height...height] then padding)



  # The entry point
  main = ->

    {argv} = optimist
      .boolean(['h', 'help'])
      .usage '''
          Usage: apl [ FILENAME [ ARGS... ] ]
          If "FILENAME" is "-" or not present, APL source code will be read from stdin.
      '''

    # Use `'-'` to mean `stdin`
    filename = argv._[0] or '-'

    if argv.h or argv.help
      optimist.showHelp()
      return

    ctx =
      '⍵': for a in argv._ then a.split ''
      'set_⎕': (x) -> process.stdout.write format x
      'get_⎕': -> [1, 2, 3]

    if filename is '-'
      readline = require 'readline'
      rl = readline.createInterface process.stdin, process.stdout
      rl.setPrompt 'APL> '

      rl.on 'line', (line) ->
        try
          if not line.match /^[\ \t\f\r\n]*$/
            result = exec line, extraContext: ctx
            process.stdout.write format(result) + '\n'
        catch e
          console.error e
        rl.prompt()

      rl.on 'close', ->
        process.stdout.write '\n'
        process.exit 0

      rl.prompt()

    else
      fs = require 'fs'
      code = new String fs.readFileSync filename
      exec code, extraContext: ctx

  {main}
