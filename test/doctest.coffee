#!/usr/bin/env coffee

fs = require 'fs'
path = require 'path'
{exec} = require '../lib/compiler'
{builtins} = require '../lib/builtins'
match = builtins['≡']
repr = JSON.stringify

trim = (s) -> s.replace /(^ +| +$)/g, ''

nTests = nFailed = 0

fail = (reason, err) -> nFailed++; console.error reason; if err then console.error err.stack

t0 = Date.now()
d = __dirname + '/../src'
for f in fs.readdirSync d when f.match /^\w+.coffee$/
  for line in fs.readFileSync(d + '/' + f, 'utf8').split '\n'
    if m = line.match /^ *# {4,}(.*)⍝(.+)$/
      nTests++
      code = trim m[1]
      outcome = trim m[2]
      if m = outcome.match /^returns (.*)$/
        expected = exec m[1]
        try
          actual = exec code
          if not match exec(code), expected
            fail "Test #{repr code} failed: expected #{repr expected} but got #{repr actual}"
        catch e
          fail "Test #{repr code} failed with #{e}", e
      else if m = outcome.match /^fails( .*)?$/
        expectedErrorMessage = if m[1] then eval m[1] else ''
        try
          exec code
          fail "Code #{repr code} should have failed, but didn't"
        catch e
          if expectedErrorMessage and e.message[...expectedErrorMessage.length] isnt expectedErrorMessage
            fail "Code #{repr code} should have failed with #{repr expectedErrorMessage}, but it failed with #{repr e.message}", e
      else
        fail "Unrecognised expectation in doctest string #{repr line}"

message = if nFailed then "#{nFailed} of #{nTests} tests failed" else "All #{nTests} tests passed"
message += " in #{Date.now() - t0} ms."
console.info message
