#!/usr/bin/env coffee


trim = (s) -> s.replace /(^ +| +$)/g, ''

@forEachDoctest = forEachDoctest = (handler, continuation) ->
  fs = require 'fs'
  glob = require 'glob'
  glob __dirname + '/../src/**/*.coffee', (err, files) ->
    if err then throw err
    for f in files
      lines = fs.readFileSync(f, 'utf8').split '\n'
      i = 0
      while i < lines.length
        line = lines[i++]
        while i < lines.length and (m = lines[i].match(/^ *# *\.\.\.(.*)$/))
          line += '\n' + m[1]
          i++
        if m = line.match /^ *# {4,}([^]*)⍝([^]+)$/
          handler code: trim(m[1]), expectation: trim(m[2])
    continuation?()

# This function should work both in nodejs and in a browser.
# It is invoked from browsertest/index.coffee
@runTestCase = runTestCase = ({code, expectation, exec, match}) ->
  if m = expectation.match /^returns\b\s*([^]*)$/
    try
      expected = exec m[1]
    catch e
      return {
        success: false
        error: e
        reason: "Cannot compute expected value #{JSON.stringify m[1]}"
      }
    try
      actual = exec code
      if not match actual, expected
        return {
          success: false
          reason: "Expected #{JSON.stringify expected} but got #{JSON.stringify actual}"
        }
    catch e
      return {
        success: false
        error: e
      }
  else if m = expectation.match /^throws\b\s*([^]*)?$/
    expectedErrorMessage = if m[1] then eval m[1] else ''
    try
      exec code
      return {
        success: false
        reason: "It should have thrown an error, but it didn't."
      }
    catch e
      if expectedErrorMessage and
          e.message[...expectedErrorMessage.length] isnt expectedErrorMessage
        return {
          success: false
          error: e
          reason: "It should have failed with #{
                    JSON.stringify expectedErrorMessage}, but it failed with #{
                    JSON.stringify e.message}"
        }
  else
    return {
      success: false
      reason: "Unrecognised expectation: #{JSON.stringify expectation}"
    }
  {success: true}

runDoctests = (continuation) ->
  {exec} = require '../lib/compiler'
  {match} = require '../lib/vocabulary/vhelpers'
  nTests = nFailed = 0
  t0 = Date.now()
  lastTestTimestamp = 0
  forEachDoctest(
    ({code, expectation}) ->
      nTests++
      outcome = runTestCase {code, expectation, exec, match}
      if not outcome.success
        nFailed++
        console.info "Test failed: #{JSON.stringify code}"
        if outcome.reason then console.error outcome.reason
        if outcome.error then console.error outcome.error.stack
      if Date.now() - lastTestTimestamp > 100
        process.stdout.write(
          nTests + (if nFailed then " (#{nFailed} failed)" else '') + '\r'
        )
        lastTestTimestamp = Date.now()

    -> # continuation after forEachDoctest
      console.info(
        (if nFailed then "#{nFailed} out of #{nTests} tests failed"
        else "All #{nTests} tests passed") +
        " in #{Date.now() - t0} ms."
      )
      continuation?()
  )

if module? and module is require.main
  runDoctests()
