(function() {
  jQuery(function($) {
    var exec, match;

    exec = require('./compiler').exec;
    match = require('./vocabulary')['≡'];
    return $('#run').focus().click(function() {
      var code, expectation, nFailed, nTests, outcome, println, t0, _i, _len, _ref;

      nTests = testcases.length;
      nFailed = 0;
      println = function(s) {
        return $('body').text($('body').text() + s + '\n');
      };
      t0 = Date.now();
      for (_i = 0, _len = testcases.length; _i < _len; _i++) {
        _ref = testcases[_i], code = _ref[0], expectation = _ref[1];
        outcome = runTestCase({
          code: code,
          expectation: expectation,
          exec: exec,
          match: match
        });
        if (!outcome.success) {
          nFailed++;
          println("Test failed: " + (JSON.stringify(code)));
          if (outcome.reason) {
            println(outcome.reason);
          }
          if (outcome.error) {
            println(outcome.error.stack);
          }
        }
      }
      return println((nFailed ? "" + nFailed + " out of " + nTests + " tests failed" : "All " + nTests + " tests passed") + (" in " + (Date.now() - t0) + " ms."));
    });
  });

}).call(this);
