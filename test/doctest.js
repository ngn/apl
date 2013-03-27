(function() {
  var forEachDoctest, runDoctests, runTestCase, trim;

  trim = function(s) {
    return s.replace(/(^ +| +$)/g, '');
  };

  this.forEachDoctest = forEachDoctest = function(handler, continuation) {
    var fs, glob;

    fs = require('fs');
    glob = require('glob');
    return glob(__dirname + '/../src/**/*.coffee', function(err, files) {
      var f, i, line, lines, m, _i, _len;

      if (err) {
        throw err;
      }
      for (_i = 0, _len = files.length; _i < _len; _i++) {
        f = files[_i];
        lines = fs.readFileSync(f, 'utf8').split('\n');
        i = 0;
        while (i < lines.length) {
          line = lines[i++];
          while (i < lines.length && (m = lines[i].match(/^ *# *\.\.\.(.*)$/))) {
            line += '\n' + m[1];
            i++;
          }
          if (m = line.match(/^ *# {4,}([^]*)⍝([^]+)$/)) {
            handler({
              code: trim(m[1]),
              expectation: trim(m[2])
            });
          }
        }
      }
      return typeof continuation === "function" ? continuation() : void 0;
    });
  };

  this.runTestCase = runTestCase = function(_arg) {
    var actual, code, e, exec, expectation, expected, expectedErrorMessage, m, match;

    code = _arg.code, expectation = _arg.expectation, exec = _arg.exec, match = _arg.match;
    if (m = expectation.match(/^returns\b\s*([^]*)$/)) {
      try {
        expected = exec(m[1]);
      } catch (_error) {
        e = _error;
        return {
          success: false,
          error: e,
          reason: "Cannot compute expected value " + (JSON.stringify(m[1]))
        };
      }
      try {
        actual = exec(code);
        if (!match(actual, expected)) {
          return {
            success: false,
            reason: "Expected " + (JSON.stringify(expected)) + " but got " + (JSON.stringify(actual))
          };
        }
      } catch (_error) {
        e = _error;
        return {
          success: false,
          error: e
        };
      }
    } else if (m = expectation.match(/^throws\b\s*([^]*)?$/)) {
      expectedErrorMessage = m[1] ? eval(m[1]) : '';
      try {
        exec(code);
        return {
          success: false,
          reason: "It should have thrown an error, but it didn't."
        };
      } catch (_error) {
        e = _error;
        if (expectedErrorMessage && e.message.slice(0, expectedErrorMessage.length) !== expectedErrorMessage) {
          return {
            success: false,
            error: e,
            reason: "It should have failed with " + (JSON.stringify(expectedErrorMessage)) + ", but it failed with " + (JSON.stringify(e.message))
          };
        }
      }
    } else {
      return {
        success: false,
        reason: "Unrecognised expectation: " + (JSON.stringify(expectation))
      };
    }
    return {
      success: true
    };
  };

  runDoctests = function(continuation) {
    var exec, lastTestTimestamp, match, nFailed, nTests, t0;

    exec = require('../lib/compiler').exec;
    match = require('../lib/vocabulary')['≡'];
    nTests = nFailed = 0;
    t0 = Date.now();
    lastTestTimestamp = 0;
    return forEachDoctest(function(_arg) {
      var code, expectation, outcome;

      code = _arg.code, expectation = _arg.expectation;
      nTests++;
      outcome = runTestCase({
        code: code,
        expectation: expectation,
        exec: exec,
        match: match
      });
      if (!outcome.success) {
        nFailed++;
        console.info("Test failed: " + (JSON.stringify(code)));
        if (outcome.reason) {
          console.error(outcome.reason);
        }
        if (outcome.error) {
          console.error(outcome.error.stack);
        }
      }
      if (Date.now() - lastTestTimestamp > 100) {
        process.stdout.write(nTests + (nFailed ? " (" + nFailed + " failed)" : '') + '\r');
        return lastTestTimestamp = Date.now();
      }
    }, function() {
      console.info((nFailed ? "" + nFailed + " out of " + nTests + " tests failed" : "All " + nTests + " tests passed") + (" in " + (Date.now() - t0) + " ms."));
      return typeof continuation === "function" ? continuation() : void 0;
    });
  };

  if ((typeof module !== "undefined" && module !== null) && module === require.main) {
    runDoctests();
  }

}).call(this);
