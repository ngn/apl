(function() {
  var exec, forEachDoctest, fs, match, path, repr, runDoctests, trim;

  fs = require('fs');

  path = require('path');

  exec = require('../lib/compiler').exec;

  match = require('../lib/vocabulary')['≡'];

  repr = JSON.stringify;

  trim = function(s) {
    return s.replace(/(^ +| +$)/g, '');
  };

  forEachDoctest = function(handler, ret) {
    var d;
    d = __dirname + '/../src';
    return fs.readdir(d, function(err, files) {
      var f, i, line, lines, m, _i, _len;
      if (err) {
        throw err;
      }
      for (_i = 0, _len = files.length; _i < _len; _i++) {
        f = files[_i];
        if (!(f.match(/^\w+.coffee$/))) {
          continue;
        }
        lines = fs.readFileSync(d + '/' + f, 'utf8').split('\n');
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
      var actual, code, expectation, expected, expectedErrorMessage, m;
      code = _arg.code, expectation = _arg.expectation;
      nTests++;
      if (m = expectation.match(/^returns ([^]*)$/)) {
        expected = exec(m[1]);
        try {
          actual = exec(code);
          if (!match(actual, expected)) {
            fail(("Test " + (repr(code)) + " failed: ") + ("expected " + (repr(expected)) + " but got " + (repr(actual))));
          }
        } catch (e) {
          fail("Test " + (repr(code)) + " failed with " + e, e);
        }
      } else if (m = expectation.match(/^fails( [^]*)?$/)) {
        expectedErrorMessage = m[1] ? eval(m[1]) : '';
        try {
          exec(code);
          fail("Code " + (repr(code)) + " should have failed, but didn't");
        } catch (e) {
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
