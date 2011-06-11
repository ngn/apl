(function() {
  var fs, interpreter, parser;
  fs = require('fs');
  parser = require('./parser');
  interpreter = require('./apl');
  exports.main = function() {
    var data, input;
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
    data = '';
    input.on('data', function(chunk) {
      return data += chunk;
    });
    return input.on('end', function() {
      return interpreter.exec(parser.parse(data));
    });
  };
}).call(this);
