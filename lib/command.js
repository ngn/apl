(function() {
  var exec, fs;
  fs = require('fs');
  exec = require('./interpreter').exec;
  exports.main = function() {
    var code, input;
    if (process.argv.length > 3) {
      process.stderr.write('Usage: apl [filename]\n', function() {
        return process.exit(0);
      });
      return;
    } else if (process.argv.length === 3) {
      input = fs.createReadStream(process.argv[2]);
    } else {
      input = process.stdin;
      input.resume();
      input.setEncoding('utf8');
    }
    code = '';
    input.on('data', function(chunk) {
      return code += chunk;
    });
    return input.on('end', function() {
      return exec(code);
    });
  };
}).call(this);
