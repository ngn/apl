(function() {
  var BTM, BTMLFT, BTMRGT, ColouredRect, LFT, RGT, Rect, TOP, TOPLFT, TOPRGT, blue, borderColour, builtins, c, cps, createGetline, cyan, decode, encode, exec, format, format0, fs, green, grey, hpad, inherit, isSimple, makeColour, numberColour, prod, purple, red, repeat, shapeOf, specialColour, stringColour, sum, trampoline, vpad, yellow, _ref, _ref2, _ref3;

  fs = require('fs');

  exec = require('./interpreter').exec;

  builtins = require('./builtins').builtins;

  _ref = require('./helpers'), inherit = _ref.inherit, cps = _ref.cps, trampoline = _ref.trampoline, isSimple = _ref.isSimple, shapeOf = _ref.shapeOf, sum = _ref.sum, prod = _ref.prod, repeat = _ref.repeat;

  makeColour = process.stdout.isTTY ? function(code) {
    return function(s) {
      return "\x1b[1;" + code + "m" + s + "\x1b[m";
    };
  } : function() {
    return function(s) {
      return s;
    };
  };

  _ref2 = (function() {
    var _results;
    _results = [];
    for (c = 30; c <= 36; c++) {
      _results.push(makeColour(c));
    }
    return _results;
  })(), grey = _ref2[0], red = _ref2[1], green = _ref2[2], yellow = _ref2[3], blue = _ref2[4], purple = _ref2[5], cyan = _ref2[6];

  borderColour = grey;

  numberColour = cyan;

  stringColour = purple;

  specialColour = red;

  _ref3 = "──││╭╮╰╯", TOP = _ref3[0], BTM = _ref3[1], LFT = _ref3[2], RGT = _ref3[3], TOPLFT = _ref3[4], TOPRGT = _ref3[5], BTMLFT = _ref3[6], BTMRGT = _ref3[7];

  Rect = function(width, height, strings) {
    return {
      width: width,
      height: height,
      strings: strings
    };
  };

  ColouredRect = function(s, colour) {
    return Rect(s.length, 1, [colour ? colour(s) : s]);
  };

  encode = function(a, x) {
    var m, r, _i, _len, _results;
    if (a.length === 0) return [];
    _results = [];
    for (_i = 0, _len = a.length; _i < _len; _i++) {
      m = a[_i];
      r = x % m;
      x = Math.floor(x / m);
      _results.push(r);
    }
    return _results;
  };

  decode = function(a, b) {
    var ai, i, r, _len;
    r = 0;
    for (i = 0, _len = a.length; i < _len; i++) {
      ai = a[i];
      r = r * ai + b[i];
    }
    return r;
  };

  format = function(a) {
    return format0(a).strings.join('\n');
  };

  format0 = function(a) {
    var b, box, c, cb, colDimIndices, colDims, d, grid, h, i, j, m, mm, nCols, nRows, nsa, r, rb, rowDimIndices, rowDims, s, sa, strings, totalHeight, totalWidth, w, _i, _j, _len, _len2, _ref4;
    if (typeof a === 'undefined') {
      return ColouredRect('undefined', specialColour);
    } else if (a === null) {
      return ColouredRect('null', specialColour);
    } else if (typeof a === 'string') {
      return ColouredRect(a, stringColour);
    } else if (typeof a === 'number') {
      return ColouredRect((a < 0 ? '¯' + (-a) : '' + a), numberColour);
    } else if (isSimple(a)) {
      return ColouredRect('' + a);
    } else if (a.length === 0) {
      return Rect(3, 3, [borderColour(TOPLFT + TOP + TOPRGT), borderColour(LFT + ' ' + RGT), borderColour(BTMLFT + BTM + BTMRGT)]);
    } else {
      sa = shapeOf(a);
      nsa = sa.length;
      rowDimIndices = (function() {
        var _ref4, _results;
        _results = [];
        for (i = _ref4 = nsa - 2; i >= 0; i += -2) {
          _results.push(i);
        }
        return _results;
      })();
      colDimIndices = (function() {
        var _ref4, _results;
        _results = [];
        for (i = _ref4 = nsa - 1; i >= 0; i += -2) {
          _results.push(i);
        }
        return _results;
      })();
      rowDims = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = rowDimIndices.length; _i < _len; _i++) {
          d = rowDimIndices[_i];
          _results.push(sa[d]);
        }
        return _results;
      })();
      colDims = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = colDimIndices.length; _i < _len; _i++) {
          d = colDimIndices[_i];
          _results.push(sa[d]);
        }
        return _results;
      })();
      nRows = prod(rowDims);
      nCols = prod(colDims);
      h = (function() {
        var _i, _results;
        _results = [];
        for (_i = 0; 0 <= nRows ? _i < nRows : _i > nRows; 0 <= nRows ? _i++ : _i--) {
          _results.push(0);
        }
        return _results;
      })();
      w = (function() {
        var _i, _results;
        _results = [];
        for (_i = 0; 0 <= nCols ? _i < nCols : _i > nCols; 0 <= nCols ? _i++ : _i--) {
          _results.push(0);
        }
        return _results;
      })();
      grid = (function() {
        var _results;
        _results = [];
        for (r = 0; 0 <= nRows ? r < nRows : r > nRows; 0 <= nRows ? r++ : r--) {
          _results.push((function() {
            var _len, _len2, _results2;
            _results2 = [];
            for (c = 0; 0 <= nCols ? c < nCols : c > nCols; 0 <= nCols ? c++ : c--) {
              rb = encode(rowDims, r);
              cb = encode(colDims, c);
              b = (function() {
                var _i, _results3;
                _results3 = [];
                for (_i = 0; 0 <= nsa ? _i < nsa : _i > nsa; 0 <= nsa ? _i++ : _i--) {
                  _results3.push(0);
                }
                return _results3;
              })();
              for (j = 0, _len = rowDimIndices.length; j < _len; j++) {
                i = rowDimIndices[j];
                b[i] = rb[j];
              }
              for (j = 0, _len2 = colDimIndices.length; j < _len2; j++) {
                i = colDimIndices[j];
                b[i] = cb[j];
              }
              box = format0(a[decode(sa, b)]);
              h[r] = Math.max(h[r], box.height);
              w[c] = Math.max(w[c], box.width);
              _results2.push(box);
            }
            return _results2;
          })());
        }
        return _results;
      })();
      mm = 1;
      totalWidth = 2 + sum(w) - colDims.length + sum((function() {
        var _ref4, _results;
        _results = [];
        for (i = _ref4 = colDims.length - 1; _ref4 <= 0 ? i <= 0 : i >= 0; _ref4 <= 0 ? i++ : i--) {
          _results.push(mm *= colDims[i]);
        }
        return _results;
      })());
      totalHeight = 2 + sum(h);
      if (rowDims.length) {
        mm = 1;
        totalHeight += 1 - rowDims.length + sum((function() {
          var _ref4, _results;
          _results = [];
          for (i = _ref4 = rowDims.length - 1; i >= 1; i += -1) {
            _results.push(mm *= rowDims[i]);
          }
          return _results;
        })());
      }
      strings = [borderColour(TOPLFT + repeat(TOP, totalWidth - 2) + TOPRGT)];
      for (r = 0; 0 <= nRows ? r < nRows : r > nRows; 0 <= nRows ? r++ : r--) {
        for (c = 0; 0 <= nCols ? c < nCols : c > nCols; 0 <= nCols ? c++ : c--) {
          grid[r][c] = vpad(grid[r][c], h[r]);
          grid[r][c] = hpad(grid[r][c], w[c]);
        }
        if (r) {
          mm = 1;
          for (_i = 0, _len = rowDims.length; _i < _len; _i++) {
            m = rowDims[_i];
            if (r % (mm *= m)) break;
            strings.push(borderColour(LFT) + repeat(' ', totalWidth - 2) + borderColour(RGT));
          }
        }
        for (i = 0, _ref4 = h[r]; 0 <= _ref4 ? i < _ref4 : i > _ref4; 0 <= _ref4 ? i++ : i--) {
          s = '';
          for (c = 0; 0 <= nCols ? c < nCols : c > nCols; 0 <= nCols ? c++ : c--) {
            if (c) {
              s += ' ';
              mm = 1;
              for (_j = 0, _len2 = colDims.length; _j < _len2; _j++) {
                m = colDims[_j];
                if (c % (mm *= m)) break;
                s += ' ';
              }
            }
            s += grid[r][c].strings[i];
          }
          strings.push(borderColour(LFT) + s + borderColour(RGT));
        }
      }
      strings.push(borderColour(BTMLFT + repeat(BTM, totalWidth - 2) + BTMRGT));
      return Rect(totalWidth, totalHeight, strings);
    }
  };

  hpad = function(rect, width) {
    var line, padding;
    if (rect.width >= width) {
      return rect;
    } else {
      padding = repeat(' ', width - rect.width);
      return Rect(width, rect.height, (function() {
        var _i, _len, _ref4, _results;
        _ref4 = rect.strings;
        _results = [];
        for (_i = 0, _len = _ref4.length; _i < _len; _i++) {
          line = _ref4[_i];
          _results.push(line + padding);
        }
        return _results;
      })());
    }
  };

  vpad = function(rect, height) {
    var padding;
    if (rect.height >= height) {
      return rect;
    } else {
      padding = repeat(' ', rect.width);
      return Rect(rect.width, height, rect.strings.concat((function() {
        var _i, _ref4, _results;
        _results = [];
        for (_i = _ref4 = rect.height; _ref4 <= height ? _i < height : _i > height; _ref4 <= height ? _i++ : _i--) {
          _results.push(padding);
        }
        return _results;
      })()));
    }
  };

  createGetline = function(input) {
    var buf, callbacks, feedCallbacks;
    buf = '';
    callbacks = [];
    feedCallbacks = function() {
      var i, s, _results;
      _results = [];
      while (true) {
        i = buf.indexOf('\n');
        if (i === -1 || !callbacks.length) break;
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
        var _i, _len, _ref4, _results;
        _ref4 = process.argv;
        _results = [];
        for (_i = 0, _len = _ref4.length; _i < _len; _i++) {
          a = _ref4[_i];
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
