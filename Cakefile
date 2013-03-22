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
{coffee, docco, cat, jade, sass, action} = ake = require 'ake'

exec = (cmd, args, opts, cont) ->
  child = spawn cmd, args, opts
  child.stdout.on 'data', (data) -> process.stdout.write data
  child.stderr.on 'data', (data) -> process.stderr.write data
  child.on 'exit', (code) ->
    if code then throw Error "Child process '#{cmd}' returned exit code #{code}."
    cont?()

buildActions = [
  coffee 'src/*.coffee', 'lib/'
]

task 'build', 'Compile src/*.coffee to lib/*.js', ->
  ake buildActions

task 'test', 'Run doctests', ->
  ake buildActions.concat [
    coffee 'test/doctest.coffee'
    coffee 'test/browsertest/generate.coffee'
    coffee 'test/browsertest/index.coffee'
    jade   'test/browsertest/index.jade'
    action(
      ['test/browsertest/generate.js'].concat(glob.sync 'src/*.coffee')
      ['test/browsertest/testcases.js']
      ({callback}) -> require('./test/browsertest/generate').main callback
    )
    cat(
      [
        'web/fake-require.js'
        getLibFiles()
        'web/jquery-1.9.1.min.js'
        'test/browsertest/index.js'
      ]
      'test/browsertest/all.js'
      transform: (content, {path}) ->
        if not path.match /^lib\// then return content
        if path in ['lib/command.js', 'lib/apl.js'] then return ''
        moduleName = path.replace /^.*\/([^\/]+).js/, '$1'
        """
          defModule('./#{moduleName}', function (exports, require) {
            #{content}
            return exports;
          });\n
        """
    )
    ->
      console.info 'Running doctests...'
      exec 'node', ['doctest.js'], cwd: 'test'
  ]

task 'docs', 'Generate literate documentation with docco', ->
  ake [
    docco  'src/*.coffee', 'docs'
  ]

getLibFiles = ->
  glob.sync('src/*.coffee').map (f) ->
    f.replace /^src\/(.+)\.coffee$/, 'lib/$1.js'

task 'web', 'Build everything for the web demo', ->
  ake buildActions.concat [
    coffee 'web/index.coffee'
    jade   'web/index.jade'
    sass   'web/index.sass'
    cat(
      [
        'web/fake-require.js'
        getLibFiles()
        'web/jquery*.js'
        'web/examples.js'
        'web/index.js'
      ]
      'web/all.js'
      transform: (content, {path}) ->
        if not path.match /^lib\// then return content
        if path is 'lib/command.js' then return ''
        moduleName = path.replace /^.*\/([^\/]+).js/, '$1'
        """
          defModule('./#{moduleName}', function (exports, require) {
            #{content}
            return exports;
          });\n
        """
    )
  ]

task 'm', 'Build everything for the mobile demo', ->
  ake buildActions.concat [
    coffee 'm/index.coffee'
    jade   'm/index.jade'
    sass   'm/index.sass'
    cat(
      [
        'web/fake-require.js'
        getLibFiles()
        'web/jquery-1.9.1.min.js'
        'web/examples.js'
        'm/index.js'
      ]
      'm/all.js'
      transform: (content, {path}) ->
        if not path.match /^lib\// then return content
        if path in ['lib/command.js', 'lib/apl.js'] then return ''
        moduleName = path.replace /^.*\/([^\/]+).js/, '$1'
        """
          defModule('./#{moduleName}', function (exports, require) {
            #{content}
            return exports;
          });\n
        """
    )
  ]

task 'stats', 'Show some lines-of-code nonsense', ->
  console.info 'Lines of code, not counting empty lines and comments:'
  total = 0
  stats =
    for file in fs.readdirSync 'src' when file.match /^\w+\.coffee$/
      loc = 0
      for line in fs.readFileSync("src/#{file}").toString().split '\n'
        if /^ *[^ #]/.test line
          loc++
      total += loc
      {file, loc}
  stats.sort (x, y) -> y.loc - x.loc
  for x in stats then console.info('  ' +
    (x.file + '                    ')[...20] +
    (s = '    ' + x.loc)[s.length - 4...]
  )
  console.info "TOTAL: #{total}"
