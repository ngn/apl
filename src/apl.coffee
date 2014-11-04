macro ->
  @tmpCounter = 0
  @tmp = -> "t#{@tmpCounter++}"
  return

# Make it possible to use ⍺ and ⍵ as identifiers in CoffeeScript code
macro withAlphaAndOmega (f) ->
  f.body.subst
    '⍺': macro.codeToNode -> alpha
    '⍵': macro.codeToNode -> omega

macro include (f) -> macro.fileToNode "src/#{macro.nodeToVal f}.coffee"
include 'helpers'
include 'errors'
include 'array'
include 'complex'
include 'vm'
include 'lexer'
include 'parser'

vocabulary = {}
addVocabulary = (h) ->
  for k, v of h then vocabulary[k] = v
  return

withAlphaAndOmega ->
  include 'vocabulary/vhelpers'
  include 'vocabulary/arithmetic'
  include 'vocabulary/backslash'
  include 'vocabulary/circle'
  include 'vocabulary/comma'
  include 'vocabulary/comparisons'
  include 'vocabulary/compose'
  include 'vocabulary/cupcap'
  include 'vocabulary/decode'
  include 'vocabulary/dot'
  include 'vocabulary/each'
  include 'vocabulary/encode'
  include 'vocabulary/epsilon'
  include 'vocabulary/exclamation'
  include 'vocabulary/execute'
  include 'vocabulary/find'
  include 'vocabulary/floorceil'
  include 'vocabulary/fork'
  include 'vocabulary/format'
  include 'vocabulary/grade'
  include 'vocabulary/identity'
  include 'vocabulary/iota'
  include 'vocabulary/leftshoe'
  include 'vocabulary/logic'
  include 'vocabulary/poweroperator'
  include 'vocabulary/quad'
  include 'vocabulary/question'
  include 'vocabulary/raise'
  include 'vocabulary/rho'
  include 'vocabulary/rotate'
  include 'vocabulary/slash'
  include 'vocabulary/squish'
  include 'vocabulary/take'
  include 'vocabulary/transpose'
  include 'vocabulary/variant'
  include 'compiler'

@apl = apl = (aplCode, opts) -> (apl.ws opts) aplCode
extend apl, {format, approx, parse, compileAST, repr}
apl.ws = (opts = {}) ->
  ctx = Object.create vocabulary
  if opts.in then ctx['get_⎕'] = ctx['get_⍞'] = -> s = opts.in(); assert typeof s is 'string'; new A s
  if opts.out then ctx['set_⎕'] = ctx['set_⍞'] = (x) -> opts.out format(x).join('\n') + '\n'
  (aplCode) -> exec aplCode, {ctx}

readline = (prompt, f) ->
  (readline.requesters ?= []).push f
  if !(rl = readline.rl)
    rl = readline.rl = require('readline').createInterface process.stdin, process.stdout
    rl.on 'line', (line) -> readline.requesters.pop()? line
    rl.on 'close', -> process.stdout.write '\n'; process.exit 0
  rl.setPrompt prompt
  rl.prompt()

if module?
  module.exports = apl
  if module is require?.main then do ->
    usage = '''
      Usage: apl.js [options] [filename.apl]
      Options:\n  -l --linewise   Process stdin line by line and disable prompt\n
    '''
    file = null
    linewise = 0
    for arg in process.argv[2..]
      if arg in ['-h', '--help'] then (process.stderr.write usage; process.exit 0)
      else if arg == '-l' or arg == '--linewise' then linewise = 1
      else if /^-/.test arg then (process.stderr.write "unrecognized option: #{arg}\n#{usage}"; process.exit 1)
      else if file? then (process.stderr.write usage; process.exit 1)
      else file = arg
    if file?
      exec require('fs').readFileSync file, 'utf8'
    else if linewise
      do ->
        fs = require 'fs'; ws = apl.ws(); a = Buffer 256; i = n = 0; b = Buffer a.length # a: accumulated line, b: buffer
        while k = fs.readSync 0, b, 0, b.length, null
          if n + k > a.length then a = Buffer.concat [a, a]
          b.copy a, n, 0, k; n += k
          while i < n
            if a[i] == 10 # '\n'
              process.stdout.write try format(ws '' + a[...i]).join('\n') + '\n' catch e then e + '\n'
              a.copy a, 0, i + 1; n -= i + 1; i = 0
            else
              i++
        return
    else if !require('tty').isatty()
      exec Buffer.concat(loop # read all of stdin
        b = new Buffer 1024
        break unless (k = require('fs').readSync 0, b, 0, b.length, null)
        b.slice 0, k
      ).toString 'utf8'
    else
      ws = apl.ws()
      readline '      ', f = (line) ->
        try
          if !line.match /^[\ \t\f\r\n]*$/
            process.stdout.write format(ws line).join('\n') + '\n'
        catch e
          process.stdout.write e + '\n'
        readline '      ', f
        return
    return
