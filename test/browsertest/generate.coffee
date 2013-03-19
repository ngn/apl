#!/usr/bin/env coffee

@main = (callback) ->
  fs = require 'fs'
  dt = require '../doctest'
  output = ["// Generated code\nvar testcases = [\n"]
  dt.forEachDoctest(
    ({code, expectation}) ->
      if output.length isnt 1 then output.push ',\n'
      output.push JSON.stringify [code, expectation]
    ->
      output.push '\n];\n'
      fs.writeFile __dirname + '/testcases.js', output.join(''), (err) ->
        if err then throw err
        callback?()
  )

if module is require.main then @main()
