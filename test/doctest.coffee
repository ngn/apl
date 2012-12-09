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
    if m = line.match /^ *# {4,}(.*)⍝ *returns +(.+)$/
      code = trim m[1]
      expected = exec trim m[2]
      nTests++
      try
        actual = exec code
        if not match exec(code), expected
          fail "Test #{repr code} failed: expected #{repr expected} but got #{repr actual}"
      catch e
        fail "Test #{repr code} failed with #{e}", e

message = if nFailed then "#{nFailed} of #{nTests} tests failed" else "All #{nTests} tests passed"
message += " in #{Date.now() - t0} ms."
console.info message
