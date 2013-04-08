# Sanity check
fs = require 'fs'
if not fs.existsSync 'node_modules'
  console.error '''
    Directory "node_modules/" does not exist.
    You should run "npm install" first.
  '''
  process.exit 1

glob = require 'glob'
{spawn} = require 'child_process'
{coffee, cat, jade, sass, action} = ake = require 'ake'
stitch = require 'stitch'

exec = (cmd, args, opts, cont) ->
  child = spawn cmd, args, opts
  child.stdout.on 'data', (data) -> process.stdout.write data
  child.stderr.on 'data', (data) -> process.stderr.write data
  child.on 'exit', (code) ->
    if code then throw Error "Child process '#{cmd}' returned exit code #{code}."
    cont?()

basicBuildActions = [
  coffee 'src/**/*.coffee', (f) -> f.replace /^src\/(.+)\.coffee$/, 'lib/$1.js'
  action(
    glob.sync('src/**/*.coffee').map (f) ->
      f.replace /^src\/(.+)\.coffee$/, 'lib/$1.js'
    ['web/apl-stitched.js']
    ({callback, log}) ->
      stitch.createPackage(paths: ['lib']).compile (err, jsCode) ->
        if err then throw err
        log 'writing stitched file'
        fs.writeFile 'web/apl-stitched.js', jsCode, (err) ->
          if err then throw err
          callback()
  )
]


task 'build', 'Compile src/**/*.coffee to lib/**/*.js', ->
  ake basicBuildActions

task 'test', 'Run doctests', ->
  ake [
    basicBuildActions
    coffee 'test/doctest.coffee'
    ->
      console.info 'Running doctests...'
      exec 'node', ['doctest.js'], cwd: 'test'
  ]

task 'browsertest', 'Generate what\'s needed to run a browser test', ->
  ake [
    basicBuildActions
    coffee 'test/doctest.coffee'
    coffee 'test/browsertest/generate.coffee'
    coffee 'test/browsertest/index.coffee'
    jade   'test/browsertest/index.jade'
    action(
      ['test/browsertest/generate.js'].concat(glob.sync 'src/**/*.coffee')
      ['test/browsertest/testcases.js']
      ({callback}) -> require('./test/browsertest/generate').main callback
    )
    ->
      console.info 'OK---now you can open ./test/browsertest/index.html with your browser'
  ]

task 'web', 'Build everything for the web demo', ->
  ake [
    basicBuildActions
    coffee 'web/index.coffee'
    jade   'web/index.jade'
    sass   'web/index.sass'
  ]

task 'm', 'Build everything for the mobile demo', ->
  ake [
    basicBuildActions
    coffee 'm/index.coffee'
    jade   'm/index.jade'
    sass   'm/index.sass'
  ]

task 'stats', 'Show some lines-of-code nonsense', ->
  console.info 'Lines of code, not counting empty lines and comments:'
  total = 0
  stats =
    glob.sync('src/**/*.coffee').map (file) ->
      loc = 0
      for line in fs.readFileSync(file, 'utf8').split '\n'
        if /^ *[^ #]/.test line
          loc++
      total += loc
      {file, loc}
  stats.sort (x, y) -> y.loc - x.loc
  for x in stats then console.info(
    (s = '        ' + x.loc)[s.length - 8...] +
    ' ' + x.file
  )
  console.info "TOTAL: #{total}"
