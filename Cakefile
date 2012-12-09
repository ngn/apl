{existsSync} = require 'path'
{statSync, readdirSync} = require 'fs'
{spawn} = require 'child_process'

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
  filenames = for f in readdirSync 'src' when f.match(/^\w.*\.coffee$/) and newer('src/' + f, 'lib/' + f.replace(/\.coffee$/, '.js')) then 'src/' + f
  if filenames.length
    console.info "Compiling #{filenames.join ' '}..."
    exec coffee, ['-b', '-o', 'lib', '-c'].concat(filenames), {}, ->
      if newer 'lib/grammar.js', 'lib/parser.js'
        console.info 'Generating parser...'
        exec 'node', ['grammar.js'], {cwd: 'lib'}, ->
          console.info 'Done'

task 'test', ->

  f = (cont) ->
    if newer 'test/test.coffee', 'test/test.js'
      console.info 'Compiling tests...'
      exec coffee, ['-c', 'test.coffee'], {cwd: 'test'}, cont
    else
      cont()

  f ->
    console.info 'Running traditional tests...'
    exec 'node', ['test.js'], {cwd: 'test'}, ->
      console.info 'Running doctests...'
      exec 'node', ['doctest.js'], {cwd: 'test'}, ->
        console.info 'Done'

task 'docs', ->
  filenames = for f in readdirSync 'src' when f.match(/^\w.*\.coffee$/) and newer('src/' + f, 'docs/' + f.replace(/\.coffee$/, '.html')) then 'src/' + f
  if filenames.length
    console.info 'Generating docs...'
    exec docco, filenames, {}, ->
      console.info 'Done'
