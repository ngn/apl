(function() {
  var builtins, exec, fs, inherit;
  fs = require('fs');
  exec = require('./interpreter').exec;
  builtins = require('./builtins').builtins;
  inherit = require('./helpers').inherit;
  exports.main = function() {
    var code, filename, input;
    filename = process.argv[2] || '-';
    if (filename === '-h' || filename === '-help' || filename === '--help') {
      process.stderr.write('Usage: apl [ FILENAME [ ARGS... ] ]\nIf "FILENAME" is "-" or not present, APL source code will be read from stdin.\n', function() {
        return process.exit(0);
      });
      return;
    }
    if (filename === '-') {
      input = process.stdin;
      input.resume();
      input.setEncoding('utf8');
    } else {
      input = fs.createReadStream(filename);
    }
    code = '';
    input.on('data', function(chunk) {
      return code += chunk;
    });
    return input.on('end', function() {
      var a, ctx;
      ctx = inherit(builtins);
      ctx['⍵'] = (function() {
        var _i, _len, _ref, _results;
        _ref = process.argv;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          a = _ref[_i];
          _results.push(a.split(''));
        }
        return _results;
      })();
      return exec(code, ctx);
    });
  };
}).call(this);
