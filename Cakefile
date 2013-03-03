fs = require 'fs'
{statSync, readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync} = require 'fs'
{spawn} = require 'child_process'

# Sanity check
if not existsSync 'node_modules'
  console.error '''
    Directory "node_modules/" does not exist.
    You should run "npm install" first.
  '''
  process.exit(1)

# Executables
coffee = 'node_modules/coffee-script/bin/coffee'
docco = 'node_modules/docco/bin/docco'

exec = (cmd, args, opts, cont) ->
  child = spawn cmd, args, opts
  child.stdout.on 'data', (data) -> process.stdout.write data
  child.stderr.on 'data', (data) -> process.stderr.write data
  child.on 'exit', (code) ->
    if code then throw Error "Child process '#{cmd}' returned exit code #{code}."
    cont()

newer = (x, y) ->
  (not existsSync y) or statSync(x).mtime.getTime() > statSync(y).mtime.getTime()

task 'build', ->
  cs = require 'coffee-script'
  if not existsSync 'lib' then mkdirSync 'lib'
  jobs = readdirSync('src')
            .filter((f) -> f.match /^\w+\.coffee$/)
            .map((f) ->
              coffeeFile: 'src/' + f
              jsFile: 'lib/' + f.replace /\.coffee$/, '.js'
            )
            .filter (job) -> newer job.coffeeFile, job.jsFile
  if jobs.length
    console.info "Compiling #{jobs.map((x) -> x.coffeeFile).join ' '}..."
    jobs.forEach (job) ->
      fs.readFile job.coffeeFile, 'utf8', (err, coffeeCode) ->
        if err then throw err
        jsCode = cs.compile coffeeCode, filename: job.coffeeFile
        fs.writeFile job.jsFile, jsCode, (err) ->
          if err then throw err

task 'test', ->
  console.info 'Running doctests...'
  exec 'node', ['doctest.js'], {cwd: 'test'}, ->
    console.info 'Done'

task 'docs', ->
  filenames = for f in readdirSync 'src' when f.match /^\w+\.coffee$/ then f
  mustGenerateDocs = false
  for f in filenames
    if newer "src/#{f}", "docs/#{f.replace /\.coffee$/, '.html'}"
      mustGenerateDocs = true
      console.info "* #{f} has changed"
  if mustGenerateDocs
    console.info 'Generating docs...'
    exec docco, (for f in filenames then "src/#{f}"), {}, ->
      console.info 'Done'

task 'stats', ->
  console.info 'Lines of code, not counting empty lines and comments:'
  total = 0
  stats =
    for file in readdirSync 'src' when file.match /^\w+\.coffee$/
      loc = 0
      for line in readFileSync("src/#{file}").toString().split '\n'
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

task 'web', ->
  cs = require 'coffee-script'
  if newer 'web/index.coffee', 'web/index.js'
    console.info 'Compiling web/index.js...'
    coffeeCode = readFileSync 'web/index.coffee', 'utf8'
    jsCode = cs.compile coffeeCode, filename: 'web/index.coffee'
    writeFileSync 'web/index.js', jsCode, 'utf8'
  s = readFileSync 'web/fake-require.js', 'utf8'
  for f in readdirSync 'lib' when f isnt 'command.js' and f.match /^\w+\.js$/
    s += """
      defModule('./#{f.replace /\.js$/, ''}', function (exports, require) {
        #{readFileSync 'lib/' + f, 'utf8'}
        return exports;
      });
    """
  s += readFileSync 'web/examples.js',                  'utf8'
  s += readFileSync 'web/jquery-1.9.1.min.js',          'utf8'
  s += readFileSync 'web/jquery.fieldselection.min.js', 'utf8'
  s += readFileSync 'web/jquery.retype.min.js',         'utf8'
  s += readFileSync 'web/jquery.keyboard.min.js',       'utf8'
  s += readFileSync 'web/jquery.tipsy.js',              'utf8'
  s += readFileSync 'web/index.js',                     'utf8'
  writeFileSync 'web/all.js', s, 'utf8'

task 'm', ->
  cs = require 'coffee-script'
  if newer 'm/index.coffee', 'm/index.js'
    console.info 'Compiling m/index.js...'
    coffeeCode = readFileSync 'm/index.coffee', 'utf8'
    jsCode = cs.compile coffeeCode, filename: 'm/index.coffee'
    writeFileSync 'm/index.js', jsCode, 'utf8'
  s = readFileSync 'web/fake-require.js', 'utf8'
  for f in readdirSync 'lib' when f isnt 'command.js' and f.match /^\w+\.js$/
    s += """
      defModule('./#{f.replace /\.js$/, ''}', function (exports, require) {
        #{readFileSync 'lib/' + f, 'utf8'}
        return exports;
      });
    """
  s += readFileSync 'web/examples.js',         'utf8'
  s += readFileSync 'web/jquery-1.9.1.min.js', 'utf8'
  s += readFileSync 'm/index.js',              'utf8'
  writeFileSync 'm/all.js', s, 'utf8'
