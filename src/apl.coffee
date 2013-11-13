macro -> macro.fileToNode 'src/macros.coffee'
macro -> macro.fileToNode 'src/helpers.coffee'
macro -> macro.fileToNode 'src/errors.coffee'
macro -> macro.fileToNode 'src/array.coffee'
macro -> macro.fileToNode 'src/complex.coffee'
macro -> macro.fileToNode 'src/vm.coffee'
macro -> macro.fileToNode 'src/lexer.coffee'
macro -> macro.fileToNode 'src/parser.coffee'
macro -> macro.fileToNode 'src/vocabulary.coffee'
macro -> macro.fileToNode 'src/vocabulary/vhelpers.coffee'
macro -> macro.fileToNode 'src/vocabulary/arithmetic.coffee'
macro -> macro.fileToNode 'src/vocabulary/backslash.coffee'
macro -> macro.fileToNode 'src/vocabulary/circle.coffee'
macro -> macro.fileToNode 'src/vocabulary/comma.coffee'
macro -> macro.fileToNode 'src/vocabulary/comparisons.coffee'
macro -> macro.fileToNode 'src/vocabulary/compose.coffee'
macro -> macro.fileToNode 'src/vocabulary/cupcap.coffee'
macro -> macro.fileToNode 'src/vocabulary/decode.coffee'
macro -> macro.fileToNode 'src/vocabulary/dot.coffee'
macro -> macro.fileToNode 'src/vocabulary/drop.coffee'
macro -> macro.fileToNode 'src/vocabulary/each.coffee'
macro -> macro.fileToNode 'src/vocabulary/encode.coffee'
macro -> macro.fileToNode 'src/vocabulary/epsilon.coffee'
macro -> macro.fileToNode 'src/vocabulary/exclamation.coffee'
macro -> macro.fileToNode 'src/vocabulary/execute.coffee'
macro -> macro.fileToNode 'src/vocabulary/find.coffee'
macro -> macro.fileToNode 'src/vocabulary/floorceil.coffee'
macro -> macro.fileToNode 'src/vocabulary/fork.coffee'
macro -> macro.fileToNode 'src/vocabulary/format.coffee'
macro -> macro.fileToNode 'src/vocabulary/grade.coffee'
macro -> macro.fileToNode 'src/vocabulary/identity.coffee'
macro -> macro.fileToNode 'src/vocabulary/iota.coffee'
macro -> macro.fileToNode 'src/vocabulary/leftshoe.coffee'
macro -> macro.fileToNode 'src/vocabulary/logic.coffee'
macro -> macro.fileToNode 'src/vocabulary/poweroperator.coffee'
macro -> macro.fileToNode 'src/vocabulary/quad.coffee'
macro -> macro.fileToNode 'src/vocabulary/question.coffee'
macro -> macro.fileToNode 'src/vocabulary/raise.coffee'
macro -> macro.fileToNode 'src/vocabulary/rho.coffee'
macro -> macro.fileToNode 'src/vocabulary/rightshoe.coffee'
macro -> macro.fileToNode 'src/vocabulary/rotate.coffee'
macro -> macro.fileToNode 'src/vocabulary/slash.coffee'
macro -> macro.fileToNode 'src/vocabulary/squish.coffee'
macro -> macro.fileToNode 'src/vocabulary/take.coffee'
macro -> macro.fileToNode 'src/vocabulary/transpose.coffee'
macro -> macro.fileToNode 'src/vocabulary/variant.coffee'
macro -> macro.fileToNode 'src/compiler.coffee'

@apl = apl = (aplCode) -> exec aplCode
apl.approx = approx
if module?
  module.exports = apl
  if module is require?.main then do ->
    usage = 'Usage: apl.js filename.apl\n'
    file = null
    for arg in process.argv[2...]
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
      macro greeting -> macro.valToNode "ngn apl #{(new Date).toISOString().replace /T.*/, ''}\n"
      process.stdout.write greeting()
      rl = require('readline').createInterface process.stdin, process.stdout
      rl.setPrompt '      '
      ctx = Object.create vocabulary
      rl.on 'line', (line) ->
        try
          if not line.match /^[\ \t\f\r\n]*$/
            result = exec line, ctx: ctx
            process.stdout.write format(result).join('\n') + '\n'
        catch e
          process.stdout.write e.toString() + '\n'
        rl.prompt()
        return
      rl.on 'close', -> process.stdout.write '\n'; process.exit 0
      rl.prompt()
    return
