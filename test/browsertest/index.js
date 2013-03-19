(function() {
  jQuery(function($) {
    var exec, match;

    exec = require('./compiler').exec;
    match = require('./vocabulary')['≡'];
    return $('#run').focus().click(function() {
      var actual, code, e, expectation, expected, expectedErrorMessage, fail, m, nFailed, nTests, println, t0, _i, _len, _ref;

      nTests = testcases.length;
      nFailed = 0;
      println = function(s) {
        return $('body').text($('body').text() + s + '\n');
      };
      fail = function(reason, err) {
        nFailed++;
        println(reason);
        if (err) {
          return println(err.stack);
        }
      };
      t0 = Date.now();
      for (_i = 0, _len = testcases.length; _i < _len; _i++) {
        _ref = testcases[_i], code = _ref[0], expectation = _ref[1];
        if (m = expectation.match(/^returns ([^]*)$/)) {
          expected = exec(m[1]);
          try {
            actual = exec(code);
            if (!match(actual, expected)) {
              fail(("Test " + (repr(code)) + " failed: ") + ("expected " + (repr(expected)) + " but got " + (repr(actual))));
            }
          } catch (_error) {
            e = _error;
            fail("Test " + (repr(code)) + " failed with " + e, e);
          }
        } else if (m = expectation.match(/^fails( [^]*)?$/)) {
          expectedErrorMessage = m[1] ? eval(m[1]) : '';
          try {
            exec(code);
            fail("Code " + (repr(code)) + " should have failed, but didn't");
          } catch (_error) {
            e = _error;
            if (expectedErrorMessage && e.message.slice(0, expectedErrorMessage.length) !== expectedErrorMessage) {
              fail("Code " + (repr(code)) + " should have failed with " + (repr(expectedErrorMessage)) + ", but it failed with " + (repr(e.message)), e);
            }
          }
        } else {
          fail("Unrecognised expectation in doctest string " + (repr(line)));
        }
      }
      return println((nFailed ? "" + nFailed + " out of " + nTests + " tests failed" : "All " + nTests + " tests passed") + (" in " + (Date.now() - t0) + " ms."));
    });
  });

}).call(this);
