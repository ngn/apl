(function() {
  var format, isSimple, prod, repeat, shapeOf, _ref;

  _ref = require('./helpers'), isSimple = _ref.isSimple, shapeOf = _ref.shapeOf, prod = _ref.prod, repeat = _ref.repeat;

  exports.format = format = function(a) {
    var bottom, box, c, cols, d, grid, i, j, k, left, nCols, nRows, r, result, right, rows, sa, step, t, x, _i, _j, _k, _l, _len, _len1, _len2, _m, _n, _o, _p, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8;
    if (typeof a === 'undefined') {
      return ['undefined'];
    } else if (a === null) {
      return ['null'];
    } else if (typeof a === 'string') {
      return [a];
    } else if (typeof a === 'number') {
      return [('' + a).replace(/-|Infinity/g, '¯')];
    } else if (typeof a === 'function') {
      return ['function'];
    } else if (isSimple(a)) {
      return ['' + a];
    } else if (a.length === 0) {
      return [''];
    } else {
      sa = shapeOf(a);
      if (!sa.length) {
        return format(a[0]);
      }
      nRows = prod(sa.slice(0, sa.length - 1));
      nCols = sa[sa.length - 1];
      rows = (function() {
        var _i, _results;
        _results = [];
        for (_i = 0; 0 <= nRows ? _i < nRows : _i > nRows; 0 <= nRows ? _i++ : _i--) {
          _results.push({
            height: 0,
            bottomMargin: 0
          });
        }
        return _results;
      })();
      cols = (function() {
        var _i, _results;
        _results = [];
        for (_i = 0; 0 <= nCols ? _i < nCols : _i > nCols; 0 <= nCols ? _i++ : _i--) {
          _results.push({
            type: 0,
            width: 0,
            leftMargin: 0,
            rightMargin: 0
          });
        }
        return _results;
      })();
      grid = (function() {
        var _i, _len, _results;
        _results = [];
        for (i = _i = 0, _len = rows.length; _i < _len; i = ++_i) {
          r = rows[i];
          _results.push((function() {
            var _j, _len1, _results1;
            _results1 = [];
            for (j = _j = 0, _len1 = cols.length; _j < _len1; j = ++_j) {
              c = cols[j];
              x = a[nCols * i + j];
              box = format(x);
              r.height = Math.max(r.height, box.length);
              c.width = Math.max(c.width, box[0].length);
              c.type = Math.max(c.type, typeof x === 'string' && x.length === 1 ? 0 : x.length == null ? 1 : 2);
              _results1.push(box);
            }
            return _results1;
          })());
        }
        return _results;
      })();
      step = 1;
      for (d = _i = _ref1 = sa.length - 2; _i >= 1; d = _i += -1) {
        step *= sa[d];
        for (i = _j = _ref2 = step - 1, _ref3 = nRows - 1; step > 0 ? _j < _ref3 : _j > _ref3; i = _j += step) {
          rows[i].bottomMargin++;
        }
      }
      for (j = _k = 0, _len = cols.length; _k < _len; j = ++_k) {
        c = cols[j];
        if (j !== nCols - 1 && !((c.type === (_ref4 = cols[j + 1].type) && _ref4 === 0))) {
          c.rightMargin++;
        }
        if (c.type === 2) {
          c.leftMargin++;
          c.rightMargin++;
        }
      }
      result = [];
      for (i = _l = 0, _len1 = rows.length; _l < _len1; i = ++_l) {
        r = rows[i];
        for (j = _m = 0, _len2 = cols.length; _m < _len2; j = ++_m) {
          c = cols[j];
          t = grid[i][j];
          if (c.type === 1) {
            left = repeat(' ', c.leftMargin + c.width - t[0].length);
            right = repeat(' ', c.rightMargin);
          } else {
            left = repeat(' ', c.leftMargin);
            right = repeat(' ', c.rightMargin + c.width - t[0].length);
          }
          for (k = _n = 0, _ref5 = t.length; 0 <= _ref5 ? _n < _ref5 : _n > _ref5; k = 0 <= _ref5 ? ++_n : --_n) {
            t[k] = left + t[k] + right;
          }
          bottom = repeat(' ', t[0].length);
          for (_o = _ref6 = t.length, _ref7 = r.height + r.bottomMargin; _ref6 <= _ref7 ? _o < _ref7 : _o > _ref7; _ref6 <= _ref7 ? _o++ : _o--) {
            t.push(bottom);
          }
        }
        for (k = _p = 0, _ref8 = r.height + r.bottomMargin; 0 <= _ref8 ? _p < _ref8 : _p > _ref8; k = 0 <= _ref8 ? ++_p : --_p) {
          result.push(((function() {
            var _q, _results;
            _results = [];
            for (j = _q = 0; 0 <= nCols ? _q < nCols : _q > nCols; j = 0 <= nCols ? ++_q : --_q) {
              _results.push(grid[i][j][k]);
            }
            return _results;
          })()).join(''));
        }
      }
      return result;
    }
  };

}).call(this);
