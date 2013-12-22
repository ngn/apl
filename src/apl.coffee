macro -> macro.fileToNode 'node_modules/macronym/assert.coffee'

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
withAlphaAndOmega ->
  include 'vocabulary'
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
  if opts.in then ctx['get_⎕'] = ctx['get_⍞'] = -> s = opts.in(); assert typeof s is 'string'; new APLArray s
  if opts.out then ctx['set_⎕'] = ctx['set_⍞'] = (x) -> opts.out format(x).join('\n') + '\n'
  (aplCode) -> exec aplCode, {ctx}

if module?
  module.exports = apl
  if module is require?.main then do ->
    usage = 'Usage: apl.js filename.apl\n'
    file = null
    for arg in process.argv[2..]
      if arg in ['-h', '--help'] then (process.stderr.write usage; process.exit 0)
      else if /^-/.test arg then (process.stderr.write "unrecognized option: #{arg}\n#{usage}"; process.exit 1)
      else if file? then (process.stderr.write usage; process.exit 1)
      else file = arg
    if file?
      exec require('fs').readFileSync file, 'utf8'
    else if not require('tty').isatty()
      exec Buffer.concat(loop # read all of stdin
        b = new Buffer 1024
        break unless (k = require('fs').readSync 0, b, 0, b.length, null)
        b.slice 0, k
      ).toString 'utf8'
    else
      process.stdout.write macro -> macro.valToNode "ngn apl #{(new Date).toISOString().replace /T.*/, ''}\n"
      rl = require('readline').createInterface process.stdin, process.stdout
      rl.setPrompt '      '
      ws = apl.ws()
      rl.on 'line', (line) ->
        try
          if not line.match /^[\ \t\f\r\n]*$/
            process.stdout.write format(ws line).join('\n') + '\n'
        catch e
          process.stdout.write e + '\n'
        rl.prompt()
        return
      rl.on 'close', -> process.stdout.write '\n'; process.exit 0
      rl.prompt()
    return
