(function() {
  var exec, forEachDoctest, fs, glob, match, path, repr, runDoctests, trim;

  fs = require('fs');

  glob = require('glob');

  path = require('path');

  exec = require('../lib/compiler').exec;

  match = require('../lib/vocabulary')['≡'];

  repr = JSON.stringify;

  trim = function(s) {
    return s.replace(/(^ +| +$)/g, '');
  };

  this.forEachDoctest = forEachDoctest = function(handler, ret) {
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
      return typeof ret === "function" ? ret() : void 0;
    });
  };

  runDoctests = function(ret) {
    var fail, lastTestTimestamp, nFailed, nTests, t0;

    nTests = nFailed = 0;
    fail = function(reason, err) {
      nFailed++;
      console.error(reason);
      if (err) {
        return console.error(err.stack);
      }
    };
    t0 = Date.now();
    lastTestTimestamp = 0;
    return forEachDoctest(function(_arg) {
      var actual, code, e, expectation, expected, expectedErrorMessage, m;

      code = _arg.code, expectation = _arg.expectation;
      console.info('Running doctest ' + JSON.stringify(code));
      nTests++;
      if (m = expectation.match(/^returns ([^]*)$/)) {
        expected = null;
        try {
          expected = exec(m[1]);
        } catch (_error) {
          e = _error;
          fail("Cannot compute expected value " + (repr(m[1])) + " for test " + (repr(code)), e);
        }
        if (expected != null) {
          try {
            actual = exec(code);
            if (!match(actual, expected)) {
              fail(("Test " + (repr(code)) + " failed: ") + ("expected " + (repr(expected)) + " but got " + (repr(actual))));
            }
          } catch (_error) {
            e = _error;
            fail("Test " + (repr(code)) + " failed with " + e, e);
          }
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
      if (Date.now() - lastTestTimestamp > 100) {
        process.stdout.write(nTests + (nFailed ? " (" + nFailed + " failed)" : '') + '\r');
        return lastTestTimestamp = Date.now();
      }
    }, function() {
      console.info((nFailed ? "" + nFailed + " out of " + nTests + " tests failed" : "All " + nTests + " tests passed") + (" in " + (Date.now() - t0) + " ms."));
      return typeof ret === "function" ? ret() : void 0;
    });
  };

  if (module === require.main) {
    (function() {
      return runDoctests();
    })();
  }

}).call(this);
