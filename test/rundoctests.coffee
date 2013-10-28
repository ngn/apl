#!/usr/bin/env coffee

# Reads testcases in JSON format from stdin and runs them.

{approx} = exec = require '../lib/apl'
{runDocTest} = require './rundoctest'

s = ''
process.stdin.resume()
process.stdin.setEncoding 'utf8'
process.stdin.on 'data', (chunk) -> s += chunk
process.stdin.on 'end', ->
  tests = eval s
  nExecuted = nFailed = 0
  t0 = Date.now()
  lastTestTimestamp = 0
  for [code, mode, expectation] in tests
    nExecuted++
    outcome = runDocTest [code, mode, expectation], exec, approx
    if not outcome.success
      nFailed++
      process.stdout.write """
        Test failed: #{JSON.stringify code}
                     #{JSON.stringify expectation}\n
      """
      if outcome.reason then process.stdout.write outcome.reason + '\n'
      if outcome.error then process.stdout.write outcome.error.stack + '\n'
    if Date.now() - lastTestTimestamp > 100
      process.stdout.write(
        "#{nExecuted}/#{tests.length}#{if nFailed then " (#{nFailed} failed)" else ''}\r"
      )
      lastTestTimestamp = Date.now()
  process.stdout.write(
    (if nFailed then "#{nFailed} out of #{nExecuted} tests failed"
    else "All #{nExecuted} tests passed") +
    " in #{Date.now() - t0} ms.\n"
  )
  process.exit(+!!nFailed)
