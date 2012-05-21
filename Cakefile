{existsSync} = require 'path'
{statSync, readdirSync} = require 'fs'
{execFile} = require 'child_process'

newer = (x, y) ->
  (not existsSync y) or statSync(x).mtime.getTime() > statSync(y).mtime.getTime()

task 'build', ->
  filenames = for f in readdirSync 'src' when f.match(/^\w.*\.coffee$/) and newer('src/' + f, 'lib/' + f.replace(/\.coffee$/, '.js')) then 'src/' + f
  if filenames.length
    console.info "Compiling #{filenames.join ' '}..."
    execFile 'coffee', ['-o', 'lib', '-c'].concat(filenames), {}, (error, stdout, stderr) ->
      if stdout then console.info stdout
      if stderr then console.info stderr
      throw error if error
      if newer 'lib/grammar.js', 'lib/parser.js'
        console.info 'Generating parser...'
        execFile 'node', ['grammar.js'], {cwd: 'lib'}, (error, stdout, stderr) ->
          if stdout then console.info stdout
          if stderr then console.info stderr
          throw error if error
          console.info 'Done'
