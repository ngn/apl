(function() {
  this.main = function(callback) {
    var dt, fs, output;

    fs = require('fs');
    dt = require('../doctest');
    output = ["// Generated code\nvar testcases = [\n"];
    return dt.forEachDoctest(function(_arg) {
      var code, expectation;

      code = _arg.code, expectation = _arg.expectation;
      if (output.length !== 1) {
        output.push(',\n');
      }
      return output.push(JSON.stringify([code, expectation]));
    }, function() {
      output.push('\n];\n');
      return fs.writeFile(__dirname + '/testcases.js', output.join(''), function(err) {
        if (err) {
          throw err;
        }
        return typeof callback === "function" ? callback() : void 0;
      });
    });
  };

  if (module === require.main) {
    this.main();
  }

}).call(this);
