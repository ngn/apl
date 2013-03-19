jQuery ($) ->
  {exec} = require './compiler'
  match = require('./vocabulary')['≡']

  $('#run').focus().click ->

    nTests = testcases.length
    nFailed = 0

    println = (s) ->
      $('body').text $('body').text() + s + '\n'

    fail = (reason, err) ->
      nFailed++
      println reason
      if err then println err.stack

    t0 = Date.now()
    for [code, expectation] in testcases
      if m = expectation.match /^returns ([^]*)$/
        expected = exec m[1]
        try
          actual = exec code
          if not match actual, expected
            fail("Test #{repr code} failed: " +
                 "expected #{repr expected} but got #{repr actual}")
        catch e
          fail "Test #{repr code} failed with #{e}", e
      else if m = expectation.match /^fails( [^]*)?$/
        expectedErrorMessage = if m[1] then eval m[1] else ''
        try
          exec code
          fail "Code #{repr code} should have failed, but didn't"
        catch e
          if expectedErrorMessage and
              e.message[...expectedErrorMessage.length] isnt expectedErrorMessage
            fail "Code #{repr code} should have failed with #{
              repr expectedErrorMessage}, but it failed with #{
              repr e.message}", e
      else
        fail "Unrecognised expectation in doctest string #{repr line}"

    println(
      (if nFailed then "#{nFailed} out of #{nTests} tests failed"
      else "All #{nTests} tests passed") +
      " in #{Date.now() - t0} ms."
    )

