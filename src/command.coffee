# This file contains the entry point (`main()`) for APL execution on node.js.
if typeof define isnt 'function' then define = require('amdefine')(module)

define ['./compiler', 'optimist', 'fs'], (compiler, optimist, fs) ->
  {exec, execJS, compile} = compiler

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
        p: 'print out the compiled JavaScript'
        s: 'listen for and compile scripts over stdio'
      .alias
        c: 'compile'
        h: 'help'
        i: 'interactive'
        n: 'nodes'
        p: 'print'
        s: 'stdio'
      .boolean('chinps'.split '')

    for k of argv
      if k not in 'c compile h help i interactive n nodes p print s stdio _'.split ' '
        if not k.match /^\$\d+/
          console.info "Unknown option, \"#{k}\""
          return optimist.showHelp()

    if argv.help then return optimist.showHelp()

    ctx =
      '⍵': for a in argv._ then a.split ''

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
      jsOutput = """
        #!/usr/bin/env node

        require('apl')(function () {
        #{jsOutput}
        });

      """
      if argv.stdio or argv.print
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

    {format} = require('./formatter')
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
