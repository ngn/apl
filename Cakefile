fs = require 'fs'
glob = require 'glob'
{spawn} = require 'child_process'
{coffee, docco, cat, jade, sass} = ake = require 'ake'

# Sanity check
if not fs.existsSync 'node_modules'
  console.error '''
    Directory "node_modules/" does not exist.
    You should run "npm install" first.
  '''
  process.exit(1)

exec = (cmd, args, opts, cont) ->
  child = spawn cmd, args, opts
  child.stdout.on 'data', (data) -> process.stdout.write data
  child.stderr.on 'data', (data) -> process.stderr.write data
  child.on 'exit', (code) ->
    if code then throw Error "Child process '#{cmd}' returned exit code #{code}."
    cont()

buildActions = [
  coffee 'src/*.coffee', 'lib/'
]

task 'build', 'Compile src/*.coffee to lib/*.js', ->
  ake buildActions

task 'test', 'Run doctests', ->
  ake buildActions.concat [
    coffee 'test/doctest.coffee'
    ->
      console.info 'Running doctests...'
      exec 'node', ['doctest.js'], {cwd: 'test'}, ->
        console.info 'OK'
  ]

task 'docs', 'Generate literate documentation with docco', ->
  ake buildActions.concat [
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
