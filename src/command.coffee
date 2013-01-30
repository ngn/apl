# This file contains the entry point (`main()`) for APL execution on node.js.
if typeof define isnt 'function' then define = require('amdefine')(module)

define ['./compiler', './helpers', 'optimist', 'fs'], (compiler, helpers, optimist, fs) ->
  {exec, execJS, compile} = compiler
  {isSimple, shapeOf, sum, prod, repeat, die} = helpers

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
      .usage('''
        Usage: apl [options] path/to/script.apl [args]
        \nIf called without options, `apl` will run your script.
      ''')
      .describe
        c: 'compile to JavaScript and save as .js files'
        h: 'display this help message'
        i: 'run an interactive APL REPL'
        n: 'print out the parse tree that the parser produces'
        s: 'listen for and compile scripts over stdio'
      .alias
        c: 'compile'
        h: 'help'
        i: 'interactive'
        n: 'nodes'
        s: 'stdio'
      .boolean('chins'.split '')

    if argv.help then return optimist.showHelp()

    ctx =
      '⍵': for a in argv._ then a.split ''
      'set_⎕': (x) -> process.stdout.write format(x) + '\n'; x
      'get_⎕': -> process.stdout.write '⎕: '; characterInput()
      'set_⍞': (x) -> process.stdout.write format x; x
      'get_⍞': characterInput = -> die 'Reading from ⎕ or ⍞ is not implemented.'

    if argv.interactive or not (argv._.length or argv.stdio) then return repl ctx

    code =
      if argv.stdio
        # Read all of stdin
        Buffer.concat(loop
          b = new Buffer 8
          k = fs.readSync 0, b, 0, b.length, null
          break unless k
          b.slice 0, k
        ).toString 'utf8'
      else
        fs.readFileSync argv._[0], 'utf8'

    {ast, jsOutput} = compile code, extraContext: ctx

    if argv.nodes
      console.info '-----BEGIN AST-----'
      printAST ast
      console.info '-----END AST-----'

    if argv.compile
      if argv.stdio
        process.stdout.write jsOutput
      else
        fs.writeFileSync argv._[0].replace(/\.apl$/, '') + '.js', jsOutput, 'utf8'
    else
      execJS jsOutput, extraContext: ctx



  # Read-eval-print loop
  repl = (ctx) ->
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
      return

    rl.on 'close', ->
      process.stdout.write '\n'
      process.exit 0
      return

    rl.prompt()
    return



  printAST = (x, indent = '') ->
    if isArray x
      if x.length is 2 and not isArray x[1]
        console.info indent + x[0] + ' ' + JSON.stringify x[1]
      else
        console.info indent + x[0]
        for y in x[1...]
          printAST y, indent + '  '
    else
      console.info indent + JSON.stringify x
    return

  isArray = (x) -> x?.length? and typeof x isnt 'string'



  {main}
