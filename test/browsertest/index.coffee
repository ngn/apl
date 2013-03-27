jQuery ($) ->
  $('#run').focus().click ->

    nTests = testcases.length
    nFailed = 0

    println = (s) ->
      $('body').text $('body').text() + s + '\n'

    t0 = Date.now()
    for [code, expectation] in testcases
      outcome = runTestCase {code, expectation}
      if not outcome.success
        nFailed++
        println "Test failed: #{JSON.stringify code}"
        if outcome.reason then println outcome.reason
        if outcome.error then println outcome.error.stack

    println(
      (if nFailed then "#{nFailed} out of #{nTests} tests failed"
      else "All #{nTests} tests passed") +
      " in #{Date.now() - t0} ms."
    )
