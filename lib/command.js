(function() {
  var BTM, BTMLFT, BTMRGT, LFT, RGT, TOP, TOPLFT, TOPRGT, borders, builtins, cps, createGetline, exec, format, format0, fs, hpad, inherit, isSimple, prod, repeat, shapeOf, sum, trampoline, vpad, _ref, _ref2;
  fs = require('fs');
  exec = require('./interpreter').exec;
  builtins = require('./builtins').builtins;
  _ref = require('./helpers'), inherit = _ref.inherit, cps = _ref.cps, trampoline = _ref.trampoline, isSimple = _ref.isSimple, shapeOf = _ref.shapeOf, sum = _ref.sum, prod = _ref.prod, repeat = _ref.repeat;
  format = function(a) {
    return format0(a).join('\n');
  };
  format0 = function(a) {
    var bigWidth, box, boxes, c, h, i, nc, nr, r, result, s, sa, w, _ref2;
    if (typeof a === 'undefined') {
      return ['<<UNDEFINED>>'];
    } else if (a === null) {
      return ['<<NULL>>'];
    } else if (typeof a === 'string') {
      return [a];
    } else if (typeof a === 'number') {
      return [a < 0 ? '¯' + (-a) : '' + a];
    } else if (isSimple(a)) {
      return ['' + a];
    } else {
      if (a.length === 0) {
        return [',-.', '| |', "`-'"];
      }
      sa = shapeOf(a);
      nc = sa.length === 0 ? 1 : sa[sa.length - 1];
      nr = a.length / nc;
      h = (function() {
        var _i, _results;
        _results = [];
        for (_i = 0; 0 <= nr ? _i < nr : _i > nr; 0 <= nr ? _i++ : _i--) {
          _results.push(0);
        }
        return _results;
      })();
      w = (function() {
        var _i, _results;
        _results = [];
        for (_i = 0; 0 <= nc ? _i < nc : _i > nc; 0 <= nc ? _i++ : _i--) {
          _results.push(0);
        }
        return _results;
      })();
      boxes = (function() {
        var _results;
        _results = [];
        for (r = 0; 0 <= nr ? r < nr : r > nr; 0 <= nr ? r++ : r--) {
          _results.push((function() {
            var _results2;
            _results2 = [];
            for (c = 0; 0 <= nc ? c < nc : c > nc; 0 <= nc ? c++ : c--) {
              box = format0(a[r * nc + c]);
              h[r] = Math.max(h[r], box.length);
              w[c] = Math.max(w[c], box[0].length);
              _results2.push(box);
            }
            return _results2;
          })());
        }
        return _results;
      })();
      bigWidth = nc - 1 + sum(w);
      result = [TOPLFT + repeat(TOP, bigWidth) + TOPRGT];
      for (r = 0; 0 <= nr ? r < nr : r > nr; 0 <= nr ? r++ : r--) {
        for (c = 0; 0 <= nc ? c < nc : c > nc; 0 <= nc ? c++ : c--) {
          vpad(boxes[r][c], h[r]);
          hpad(boxes[r][c], w[c]);
        }
        for (i = 0, _ref2 = h[r]; 0 <= _ref2 ? i < _ref2 : i > _ref2; 0 <= _ref2 ? i++ : i--) {
          s = '';
          for (c = 0; 0 <= nc ? c < nc : c > nc; 0 <= nc ? c++ : c--) {
            s += ' ' + boxes[r][c][i];
          }
          result.push(LFT + s.slice(1) + RGT);
        }
      }
      result.push(BTMLFT + repeat(BTM, bigWidth) + BTMRGT);
      return result;
    }
  };
  hpad = function(box, width) {
    var i, padding, _ref2;
    if (box[0].length < width) {
      padding = repeat(' ', width - box[0].length);
      for (i = 0, _ref2 = box.length; 0 <= _ref2 ? i < _ref2 : i > _ref2; 0 <= _ref2 ? i++ : i--) {
        box[i] += padding;
      }
      return 0;
    }
  };
  vpad = function(box, height) {
    var i, padding, _ref2;
    if (box.length < height) {
      padding = repeat(' ', box[0].length);
      for (i = _ref2 = box.length; _ref2 <= height ? i < height : i > height; _ref2 <= height ? i++ : i--) {
        box.push(padding);
      }
      return 0;
    }
  };
  _ref2 = "──││┌┐└┘", TOP = _ref2[0], BTM = _ref2[1], LFT = _ref2[2], RGT = _ref2[3], TOPLFT = _ref2[4], TOPRGT = _ref2[5], BTMLFT = _ref2[6], BTMRGT = _ref2[7];
  borders = ["--||,.`'", "──││┌┐└┘", "──││╭╮╰╯", "━━┃┃┏┓┗┛", "▄▀▐▌▗▖▝▘", "▀▄▌▐▛▜▙▟", "▓▓▓▓▓▓▓▓", "████████"];
  createGetline = function(input) {
    var buf, callbacks, feedCallbacks;
    buf = '';
    callbacks = [];
    feedCallbacks = function() {
      var i, s, _results;
      _results = [];
      while (true) {
        i = buf.indexOf('\n');
        if (i === -1 || !callbacks.length) {
          break;
        }
        s = buf.slice(0, i);
        buf = buf.slice(i + 1);
        _results.push(trampoline(function() {
          return callbacks.shift()(null, s.split(''));
        }));
      }
      return _results;
    };
    input.on('data', function(chunk) {
      buf += chunk;
      feedCallbacks();
      return 0;
    });
    return function(callback) {
      callbacks.push(callback);
      feedCallbacks();
      return 0;
    };
  };
  exports.main = function() {
    var code, filename, getline, input;
    filename = process.argv[2] || '-';
    if (filename === '-h' || filename === '-help' || filename === '--help') {
      process.stderr.write('Usage: apl [ FILENAME [ ARGS... ] ]\nIf "FILENAME" is "-" or not present, APL source code will be read from stdin.\n');
      return;
    }
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    if (filename === '-') {
      input = process.stdin;
      getline = function(callback) {
        return trampoline(function() {
          return callback(Error('Symbols ⎕ and ⍞ cannot be read when APL source code is read from stdin.'));
        });
      };
    } else {
      input = fs.createReadStream(filename);
      getline = createGetline(process.stdin);
    }
    code = '';
    input.on('data', function(chunk) {
      return code += chunk;
    });
    return input.on('end', function() {
      var a, ctx;
      ctx = inherit(builtins);
      ctx['⍵'] = (function() {
        var _i, _len, _ref3, _results;
        _ref3 = process.argv;
        _results = [];
        for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
          a = _ref3[_i];
          _results.push(a.split(''));
        }
        return _results;
      })();
      ctx['get_⎕'] = cps(function(_, _, _, callback) {
        return function() {
          return getline(callback);
        };
      });
      ctx['set_⎕'] = cps(function(x, _, _, callback) {
        return function() {
          return process.stdout.write(format(x) + '\n', function(err) {
            return trampoline(function() {
              if (err) {
                return function() {
                  return callback(err);
                };
              }
              return function() {
                return callback(null, 0);
              };
            });
          });
        };
      });
      return exec(code, ctx, function(err) {
        if (err) {
          throw err;
        } else {
          return process.exit(0);
        }
      });
    });
  };
}).call(this);
