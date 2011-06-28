(function() {
  var ambivalent, arrayValueOf, assert, booleanValueOf, builtins, catenate, compressOrReplicate, cps, cpsify, depthOf, dyadic, grade, infixOperator, isSimple, match, monadic, named, numericValueOf, outerProduct, overloadable, pervasive, postfixOperator, prefixOperator, prod, prototypeOf, reduce, repeat, reverse, shapeOf, sum, withPrototype, withPrototypeCopiedFrom, withShape, _ref;
  var __slice = Array.prototype.slice, __indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++) {
      if (this[i] === item) return i;
    }
    return -1;
  };
  _ref = require('./helpers'), cps = _ref.cps, cpsify = _ref.cpsify, isSimple = _ref.isSimple, shapeOf = _ref.shapeOf, withShape = _ref.withShape, sum = _ref.sum, prod = _ref.prod, repeat = _ref.repeat, prototypeOf = _ref.prototypeOf, withPrototype = _ref.withPrototype, withPrototypeCopiedFrom = _ref.withPrototypeCopiedFrom;
  assert = function(flag) {
    if (!flag) {
      throw Error('Assertion failed.');
    }
  };
  arrayValueOf = function(x) {
    if (isSimple(x)) {
      return [x];
    } else {
      return x;
    }
  };
  numericValueOf = function(x) {
    if (x.length != null) {
      if (x.length !== 1) {
        throw Error('Numeric scalar or singleton expected');
      }
      x = x[0];
    }
    if (typeof x !== 'number') {
      throw Error('Numeric scalar or singleton expected');
    }
    return x;
  };
  booleanValueOf = function(x) {
    x = numericValueOf(x);
    if (x !== 0 && x !== 1) {
      throw Error('Boolean values must be either 0 or 1');
    }
    return x;
  };
  named = function(name, f) {
        if (f != null) {
      f;
    } else {
      f = function() {
        return "Function " + name + " is not implemented.";
      };
    };
    assert(typeof name === 'string');
    assert(typeof f === 'function');
    assert(!(f.aplName != null));
    f.aplName = name;
    return f;
  };
  pervasive = function(f) {
    return named(f.aplName, function(a, b) {
      var F, i, k, sa, sb, x, _ref2;
      F = arguments.callee;
      if (b != null) {
        if (isSimple(a) && isSimple(b)) {
          return f(a, b);
        } else if (isSimple(a)) {
          return withShape(b.shape, (function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = b.length; _i < _len; _i++) {
              x = b[_i];
              _results.push(F(a, x));
            }
            return _results;
          })());
        } else if (isSimple(b)) {
          return withShape(a.shape, (function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = a.length; _i < _len; _i++) {
              x = a[_i];
              _results.push(F(x, b));
            }
            return _results;
          })());
        } else {
          sa = shapeOf(a);
          sb = shapeOf(b);
          for (i = 0, _ref2 = Math.min(sa.length, sb.length); 0 <= _ref2 ? i < _ref2 : i > _ref2; 0 <= _ref2 ? i++ : i--) {
            if (sa[i] !== sb[i]) {
              throw Error('Length error');
            }
          }
          if (sa.length > sb.length) {
            k = prod(sa.slice(sb.length));
            return withShape(sa, (function() {
              var _ref3, _results;
              _results = [];
              for (i = 0, _ref3 = a.length; 0 <= _ref3 ? i < _ref3 : i > _ref3; 0 <= _ref3 ? i++ : i--) {
                _results.push(F(a[i], b[Math.floor(i / k)]));
              }
              return _results;
            })());
          } else if (sa.length < sb.length) {
            k = prod(sb.slice(sa.length));
            return withShape(sb, (function() {
              var _ref3, _results;
              _results = [];
              for (i = 0, _ref3 = b.length; 0 <= _ref3 ? i < _ref3 : i > _ref3; 0 <= _ref3 ? i++ : i--) {
                _results.push(F(a[Math.floor(i / k)], b[i]));
              }
              return _results;
            })());
          } else {
            return withShape(sa, (function() {
              var _ref3, _results;
              _results = [];
              for (i = 0, _ref3 = a.length; 0 <= _ref3 ? i < _ref3 : i > _ref3; 0 <= _ref3 ? i++ : i--) {
                _results.push(F(a[i], b[i]));
              }
              return _results;
            })());
          }
        }
      } else {
        if (isSimple(a)) {
          return f(a);
        } else {
          return withShape(a.shape, (function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = a.length; _i < _len; _i++) {
              x = a[_i];
              _results.push(F(x));
            }
            return _results;
          })());
        }
      }
    });
  };
  overloadable = function(f) {
    return named(f.aplName, function() {
      var args, x, y;
      x = arguments[0], y = arguments[1], args = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
      assert(f.aplName);
      if (typeof x[f.aplName] === 'function') {
        return x[f.aplName].apply(x, [y].concat(__slice.call(args)));
      } else if ((y != null) && typeof y[f.aplName] === 'function') {
        return y[f.aplName].apply(y, [x].concat(__slice.call(args)));
      } else {
        return f.apply(null, [x, y].concat(__slice.call(args)));
      }
    });
  };
  exports.builtins = builtins = {};
  ambivalent = function(f1, f2) {
    var f;
    assert(f1.aplName && (f1.aplName === f2.aplName));
    f = function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return (args[1] != null ? f2 : f1).apply(null, args);
    };
    f.aplName = f1.aplName;
    return f;
  };
  monadic = function(f) {
    var g;
    assert(typeof f === 'function');
    assert(typeof f.aplName === 'string');
    if ((g = builtins[f.aplName])) {
      f = ambivalent(f, g);
    } else {
      f = f;
    }
    return builtins[f.aplName] = f;
  };
  dyadic = function(f) {
    var g;
    assert(typeof f === 'function');
    assert(typeof f.aplName === 'string');
    if ((g = builtins[f.aplName])) {
      f = ambivalent(g, f);
    } else {
      f = f;
    }
    return builtins[f.aplName] = f;
  };
  prefixOperator = function(f) {
    f.isPrefixOperator = true;
    return builtins[f.aplName] = f;
  };
  postfixOperator = function(f) {
    f.isPostfixOperator = true;
    return builtins[f.aplName] = f;
  };
  infixOperator = function(f) {
    f.isInfixOperator = true;
    return builtins[f.aplName] = f;
  };
  monadic(overloadable(named('+', function(a) {
    return a;
  })));
  dyadic(pervasive(overloadable(named('+', function(x, y) {
    return x + y;
  }))));
  monadic(pervasive(overloadable(named('−', function(x) {
    return -x;
  }))));
  dyadic(pervasive(overloadable(named('−', function(x, y) {
    return x - y;
  }))));
  monadic(pervasive(overloadable(named('×', function(x) {
    if (x < 0) {
      return -1;
    } else if (x > 0) {
      return 1;
    } else {
      return 0;
    }
  }))));
  dyadic(pervasive(overloadable(named('×', function(x, y) {
    return x * y;
  }))));
  monadic(pervasive(overloadable(named('÷', function(x) {
    return 1 / x;
  }))));
  dyadic(pervasive(overloadable(named('÷', function(x, y) {
    return x / y;
  }))));
  monadic(pervasive(overloadable(named('⌈', function(x) {
    return Math.ceil(x);
  }))));
  dyadic(pervasive(overloadable(named('⌈', function(x, y) {
    return Math.max(x, y);
  }))));
  monadic(pervasive(overloadable(named('⌊', function(x) {
    return Math.floor(x);
  }))));
  dyadic(pervasive(overloadable(named('⌊', function(x, y) {
    return Math.min(x, y);
  }))));
  monadic(pervasive(overloadable(named('∣', function(x) {
    return Math.abs(x);
  }))));
  dyadic(pervasive(overloadable(named('∣', function(x, y) {
    return y % x;
  }))));
  monadic(overloadable(named('⍳', function(a) {
    var _i, _ref2, _results;
    return (function() {
      _results = [];
      for (var _i = 0, _ref2 = Math.floor(numericValueOf(a)); 0 <= _ref2 ? _i < _ref2 : _i > _ref2; 0 <= _ref2 ? _i++ : _i--){ _results.push(_i); }
      return _results;
    }).apply(this, arguments);
  })));
  dyadic(overloadable(named('⍳')));
  monadic(pervasive(overloadable(named('?', function(x) {
    return Math.floor(Math.random() * Math.max(0, Math.floor(numericValueOf(x))));
  }))));
  dyadic(overloadable(named('?', function(x, y) {
    var available, _i, _j, _results, _results2;
    x = Math.max(0, Math.floor(numericValueOf(x)));
    y = Math.max(0, Math.floor(numericValueOf(y)));
    if (x > y) {
      throw Error('Domain error: left argument of ? must not be greater than its right argument.');
    }
    available = (function() {
      _results = [];
      for (var _i = 0; 0 <= y ? _i < y : _i > y; 0 <= y ? _i++ : _i--){ _results.push(_i); }
      return _results;
    }).apply(this, arguments);
    _results2 = [];
    for (_j = 0; 0 <= x ? _j < x : _j > x; 0 <= x ? _j++ : _j--) {
      _results2.push(available.splice(Math.floor(available.length * Math.random()), 1)[0]);
    }
    return _results2;
  })));
  monadic(pervasive(overloadable(named('⋆', function(x) {
    return Math.exp(numericValueOf(x));
  }))));
  dyadic(pervasive(overloadable(named('⋆', function(x, y) {
    return Math.pow(numericValueOf(x), numericValueOf(y));
  }))));
  monadic(pervasive(overloadable(named('⍟', function(x) {
    return Math.log(x);
  }))));
  dyadic(pervasive(overloadable(named('⍟', function(x, y) {
    return Math.log(y) / Math.log(x);
  }))));
  monadic(pervasive(overloadable(named('○', function(x) {
    return Math.PI * x;
  }))));
  dyadic(pervasive(overloadable(named('○', function(i, x) {
    var ex;
    switch (i) {
      case 0:
        return Math.sqrt(1 - x * x);
      case 1:
        return Math.sin(x);
      case 2:
        return Math.cos(x);
      case 3:
        return Math.tan(x);
      case 4:
        return Math.sqrt(1 + x * x);
      case 5:
        return (Math.exp(2 * x) - 1) / 2;
      case 6:
        return (Math.exp(2 * x) + 1) / 2;
      case 7:
        ex = Math.exp(2 * x);
        return (ex - 1) / (ex + 1);
      case -1:
        return Math.asin(x);
      case -2:
        return Math.acos(x);
      case -3:
        return Math.atan(x);
      case -4:
        return Math.sqrt(x * x - 1);
      case -5:
        return Math.log(x + Math.sqrt(x * x + 1));
      case -6:
        return Math.log(x + Math.sqrt(x * x - 1));
      case -7:
        return Math.log((1 + x) / (1 - x)) / 2;
      default:
        throw Error('Unknown circular or hyperbolic function ' + i);
    }
  }))));
  monadic(pervasive(overloadable(named('!', function(a) {
    var i, n, r;
    n = a = Math.floor(numericValueOf(a));
    r = 1;
    if (n > 1) {
      for (i = 2; 2 <= n ? i <= n : i >= n; 2 <= n ? i++ : i--) {
        r *= i;
      }
    }
    return r;
  }))));
  dyadic(pervasive(overloadable(named('!', function(a, b) {
    var i, k, n, r;
    k = a = Math.floor(numericValueOf(a));
    n = b = Math.floor(numericValueOf(b));
    if (!((0 <= k && k <= n))) {
      return 0;
    }
    if (2 * k > n) {
      k = n - k;
    }
    r = 1;
    if (k > 0) {
      for (i = 1; 1 <= k ? i <= k : i >= k; 1 <= k ? i++ : i--) {
        r = r * (n - k + i) / i;
      }
    }
    return r;
  }))));
  monadic(overloadable(named('⌹')));
  dyadic(overloadable(named('⌹')));
  dyadic(pervasive(overloadable(named('<', function(x, y) {
    return +(x < y);
  }))));
  dyadic(pervasive(overloadable(named('≤', function(x, y) {
    return +(x <= y);
  }))));
  dyadic(pervasive(overloadable(named('=', function(x, y) {
    return +(x === y);
  }))));
  dyadic(pervasive(overloadable(named('≥', function(x, y) {
    return +(x >= y);
  }))));
  dyadic(pervasive(overloadable(named('>', function(x, y) {
    return +(x > y);
  }))));
  dyadic(pervasive(overloadable(named('≠', function(x, y) {
    return +(x !== y);
  }))));
  monadic(overloadable(named('≡', depthOf = function(a) {
    var r, x, _i, _len;
    if (isSimple(a)) {
      return 0;
    }
    r = 0;
    for (_i = 0, _len = a.length; _i < _len; _i++) {
      x = a[_i];
      r = Math.max(r, depthOf(x));
    }
    return r + 1;
  })));
  dyadic(overloadable(named('≡', match = function(a, b) {
    var i, sa, sb, _ref2, _ref3;
    if (isSimple(a) && isSimple(b)) {
      return +(a === b);
    }
    if (isSimple(a) !== isSimple(b)) {
      return 0;
    }
    sa = shapeOf(a);
    sb = shapeOf(b);
    if (sa.length !== sb.length) {
      return 0;
    }
    for (i = 0, _ref2 = sa.length; 0 <= _ref2 ? i < _ref2 : i > _ref2; 0 <= _ref2 ? i++ : i--) {
      if (sa[i] !== sb[i]) {
        return 0;
      }
    }
    if (a.length !== b.length) {
      return 0;
    }
    for (i = 0, _ref3 = a.length; 0 <= _ref3 ? i < _ref3 : i > _ref3; 0 <= _ref3 ? i++ : i--) {
      if (!match(a[i], b[i])) {
        return 0;
      }
    }
    if (a.length) {
      return 1;
    }
    if (!((a.aplPrototype != null) || (b.aplPrototype != null))) {
      return 1;
    }
    return match(prototypeOf(a), prototypeOf(b));
  })));
  dyadic(overloadable(named('≢', function(a, b) {
    return +!match(a, b);
  })));
  monadic(overloadable(named('∈', function(a) {
    var r, rec;
    r = [];
    rec = function(x) {
      var y, _i, _len;
      if (isSimple(x)) {
        r.push(x);
      } else {
        for (_i = 0, _len = x.length; _i < _len; _i++) {
          y = x[_i];
          rec(y);
        }
      }
      return r;
    };
    return rec(a);
  })));
  dyadic(overloadable(named('∈', function(a, b) {
    var x;
    a = arrayValueOf(a);
    b = arrayValueOf(b);
    return withShape(a.shape, (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = a.length; _i < _len; _i++) {
        x = a[_i];
        _results.push(+(__indexOf.call(b, x) >= 0));
      }
      return _results;
    })());
  })));
  dyadic(overloadable(named('⍷')));
  monadic(overloadable(named('∪')));
  dyadic(overloadable(named('∪')));
  dyadic(overloadable(named('∩')));
  monadic(pervasive(overloadable(named('∼', function(x) {
    return +!booleanValueOf(x);
  }))));
  dyadic(overloadable(named('∼')));
  dyadic(pervasive(overloadable(named('∨', function(x, y) {
    var _ref2, _ref3;
    x = Math.abs(numericValueOf(x));
    y = Math.abs(numericValueOf(y));
    if (x !== Math.floor(x) || y !== Math.floor(y)) {
      throw Error('∨ is defined only for integers');
    }
    if (x === 0 && y === 0) {
      return 0;
    }
    if (x < y) {
      _ref2 = [y, x], x = _ref2[0], y = _ref2[1];
    }
    while (y) {
      _ref3 = [y, x % y], x = _ref3[0], y = _ref3[1];
    }
    return x;
  }))));
  dyadic(pervasive(overloadable(named('∧', function(x, y) {
    var p, _ref2, _ref3;
    x = Math.abs(numericValueOf(x));
    y = Math.abs(numericValueOf(y));
    if (x !== Math.floor(x) || y !== Math.floor(y)) {
      throw Error('∨ is defined only for integers');
    }
    if (x === 0 || y === 0) {
      return 0;
    }
    p = x * y;
    if (x < y) {
      _ref2 = [y, x], x = _ref2[0], y = _ref2[1];
    }
    while (y) {
      _ref3 = [y, x % y], x = _ref3[0], y = _ref3[1];
    }
    return p / x;
  }))));
  dyadic(pervasive(overloadable(named('⍱', function(x, y) {
    return +!(booleanValueOf(x) || booleanValueOf(y));
  }))));
  dyadic(pervasive(overloadable(named('⍲', function(x, y) {
    return +!(booleanValueOf(x) && booleanValueOf(y));
  }))));
  monadic(overloadable(named('⍴', shapeOf)));
  dyadic(overloadable(named('⍴', function(a, b) {
    var i, x;
    if (isSimple(a)) {
      a = [a];
    }
    if (isSimple(b)) {
      b = [b];
    }
    a = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = a.length; _i < _len; _i++) {
        x = a[_i];
        if (!typeof x === 'number') {
          throw Error('Domain error: Left argument to ⍴ must be a numeric scalar or vector.');
        }
        _results.push(Math.max(0, Math.floor(x)));
      }
      return _results;
    })();
    return withShape(a, withPrototypeCopiedFrom(b, (function() {
      var _ref2, _results;
      _results = [];
      for (i = 0, _ref2 = prod(a); 0 <= _ref2 ? i < _ref2 : i > _ref2; 0 <= _ref2 ? i++ : i--) {
        _results.push(b[i % b.length]);
      }
      return _results;
    })()));
  })));
  monadic(overloadable(named(',', function(a) {
    return arrayValueOf(a).slice(0);
  })));
  catenate = function(a, b, axis) {
    var i, j, k, ni, nja, njb, nk, r, sa, sb, sr, x, _ref2;
    if (axis == null) {
      axis = -1;
    }
    sa = shapeOf(a);
    if (sa.length === 0) {
      sa = [1];
      a = [a];
    }
    sb = shapeOf(b);
    if (sb.length === 0) {
      sb = [1];
      b = [b];
    }
    if (sa.length !== sb.length) {
      throw Error('Length error: Cannot catenate arrays of different ranks');
    }
    if (axis < 0) {
      axis += sa.length;
    }
    for (i = 0, _ref2 = sa.length; 0 <= _ref2 ? i < _ref2 : i > _ref2; 0 <= _ref2 ? i++ : i--) {
      if (sa[i] !== sb[i] && i !== axis) {
        throw Error('Length error: Catenated arrays must match at all axes exept the one to catenate on');
      }
    }
    ni = prod(sa.slice(0, axis));
    nja = sa[axis];
    njb = sb[axis];
    nk = prod(sa.slice(axis + 1));
    r = [];
    for (i = 0; 0 <= ni ? i < ni : i > ni; 0 <= ni ? i++ : i--) {
      for (j = 0; 0 <= nja ? j < nja : j > nja; 0 <= nja ? j++ : j--) {
        for (k = 0; 0 <= nk ? k < nk : k > nk; 0 <= nk ? k++ : k--) {
          r.push(a[k + nk * (j + nja * i)]);
        }
      }
      for (j = 0; 0 <= njb ? j < njb : j > njb; 0 <= njb ? j++ : j--) {
        for (k = 0; 0 <= nk ? k < nk : k > nk; 0 <= nk ? k++ : k--) {
          r.push(b[k + nk * (j + njb * i)]);
        }
      }
    }
    sr = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = sa.length; _i < _len; _i++) {
        x = sa[_i];
        _results.push(x);
      }
      return _results;
    })();
    sr[axis] += sb[axis];
    return withShape(sr, r);
  };
  dyadic(overloadable(named(',', catenate)));
  dyadic(overloadable(named('⍪', function(a, b) {
    return catenate(a, b, 0);
  })));
  monadic(overloadable(named('⌽', reverse = function(a, _, axis) {
    var i, j, k, ni, nj, nk, r, sa, _ref2, _step;
    if (axis == null) {
      axis = -1;
    }
    sa = shapeOf(a);
    if (sa.length === 0) {
      return a;
    }
    if (axis < 0) {
      axis += sa.length;
    }
    if (!((0 <= axis && axis < sa.length))) {
      throw Error('Axis out of bounds');
    }
    ni = prod(sa.slice(0, axis));
    nj = sa[axis];
    nk = prod(sa.slice(axis + 1));
    r = [];
    for (i = 0; 0 <= ni ? i < ni : i > ni; 0 <= ni ? i++ : i--) {
      for (j = _ref2 = nj - 1, _step = -1; _ref2 <= 0 ? j <= 0 : j >= 0; j += _step) {
        for (k = 0; 0 <= nk ? k < nk : k > nk; 0 <= nk ? k++ : k--) {
          r.push(a[k + nk * (j + nj * i)]);
        }
      }
    }
    return withShape(sa, r);
  })));
  dyadic(overloadable(named('⌽', function(a, b) {
    var i, n, sb;
    a = numericValueOf(a);
    if (a === 0 || isSimple(b) || (b.length <= 1)) {
      return b;
    }
    sb = shapeOf(b);
    n = sb[sb.length - 1];
    a %= n;
    if (a < 0) {
      a += n;
    }
    return withShape(sb, (function() {
      var _ref2, _results;
      _results = [];
      for (i = 0, _ref2 = b.length; 0 <= _ref2 ? i < _ref2 : i > _ref2; 0 <= _ref2 ? i++ : i--) {
        _results.push(b[i - (i % n) + ((i % n) + a) % n]);
      }
      return _results;
    })());
  })));
  monadic(overloadable(named('⊖', function(a, _, axis) {
    if (axis == null) {
      axis = 0;
    }
    return reverse(a, void 0, axis);
  })));
  dyadic(overloadable(named('⊖', function(a, b) {
    var i, k, n, sb;
    a = numericValueOf(a);
    if (a === 0 || isSimple(b) || (b.length <= 1)) {
      return b;
    }
    sb = shapeOf(b);
    n = sb[0];
    k = b.length / n;
    a %= n;
    if (a < 0) {
      a += n;
    }
    return withShape(sb, (function() {
      var _ref2, _results;
      _results = [];
      for (i = 0, _ref2 = b.length; 0 <= _ref2 ? i < _ref2 : i > _ref2; 0 <= _ref2 ? i++ : i--) {
        _results.push(b[((Math.floor(i / k) + a) % n) * k + (i % k)]);
      }
      return _results;
    })());
  })));
  monadic(overloadable(named('⍉', function(a) {
    var i, psr, r, rec, sa, sr, _ref2;
    sa = shapeOf(a);
    if (sa.length <= 1) {
      return a;
    }
    sr = sa.slice(0).reverse();
    psr = [1];
    for (i = 0, _ref2 = sa.length - 1; 0 <= _ref2 ? i < _ref2 : i > _ref2; 0 <= _ref2 ? i++ : i--) {
      psr.push(psr[i] * sr[i]);
    }
    r = [];
    rec = function(d, i) {
      var j, _ref3;
      if (d >= sa.length) {
        r.push(a[i]);
      } else {
        for (j = 0, _ref3 = sr[d]; 0 <= _ref3 ? j < _ref3 : j > _ref3; 0 <= _ref3 ? j++ : j--) {
          rec(d + 1, i + j * psr[d]);
        }
      }
      return 0;
    };
    rec(0, 0);
    return withShape(sr, r);
  })));
  monadic(overloadable(named('↑', function(a) {
    a = arrayValueOf(a);
    if (a.length) {
      return a[0];
    } else {
      return prototypeOf(a);
    }
  })));
  dyadic(overloadable(named('↑', function(a, b) {
    var filler, i, pa, r, rec, sb, x, _i, _len;
    if (isSimple(a)) {
      a = [a];
    }
    for (_i = 0, _len = a.length; _i < _len; _i++) {
      x = a[_i];
      if (!typeof x === 'number') {
        throw Error('Domain error: Left argument to ↑ must be a numeric scalar or vector.');
      }
    }
    if (isSimple(b) && a.length === 1) {
      b = [b];
    }
    sb = shapeOf(b);
    if (a.length !== sb.length) {
      throw Error('Length error: Left argument to ↑ must have as many elements as is the rank of its right argument.');
    }
    r = [];
    pa = (function() {
      var _j, _ref2, _results;
      _results = [];
      for (_j = 0, _ref2 = a.length; 0 <= _ref2 ? _j < _ref2 : _j > _ref2; 0 <= _ref2 ? _j++ : _j--) {
        _results.push(0);
      }
      return _results;
    })();
    pa[a.length - 1] = 1;
    i = a.length - 2;
    while (i >= 0) {
      pa[i] = pa[i + 1] * a[i + 1];
      i--;
    }
    filler = prototypeOf(b);
    rec = function(d, i, k) {
      var j, _j, _k, _ref2, _ref3, _ref4, _ref5, _ref6;
      if (d >= sb.length) {
        r.push(b[i]);
      } else {
        k /= sb[d];
        if (a[d] >= 0) {
          for (j = 0, _ref2 = Math.min(a[d], sb[d]); 0 <= _ref2 ? j < _ref2 : j > _ref2; 0 <= _ref2 ? j++ : j--) {
            rec(d + 1, i + j * k, k);
          }
          if (sb[d] < a[d]) {
            for (_j = 0, _ref3 = (a[d] - sb[d]) * pa[d]; 0 <= _ref3 ? _j < _ref3 : _j > _ref3; 0 <= _ref3 ? _j++ : _j--) {
              r.push(filler);
            }
          }
        } else {
          if (sb[d] + a[d] < 0) {
            for (_k = 0, _ref4 = -(sb[d] + a[d]) * pa[d]; 0 <= _ref4 ? _k < _ref4 : _k > _ref4; 0 <= _ref4 ? _k++ : _k--) {
              r.push(filler);
            }
          }
          for (j = _ref5 = Math.max(0, sb[d] + a[d]), _ref6 = sb[d]; _ref5 <= _ref6 ? j < _ref6 : j > _ref6; _ref5 <= _ref6 ? j++ : j--) {
            rec(d + 1, i + j * k, k);
          }
        }
      }
      return 0;
    };
    rec(0, 0, b.length);
    return withShape(a, withPrototype(filler, r));
  })));
  dyadic(overloadable(named('↓', function(a, b) {
    var hi, i, lims, lo, r, rec, sb, sr, x, _i, _j, _len, _ref2, _ref3;
    if (isSimple(a)) {
      a = [a];
    }
    for (_i = 0, _len = a.length; _i < _len; _i++) {
      x = a[_i];
      if (typeof x !== 'number' || x !== Math.floor(x)) {
        throw Error('Left argument to ↓ must be an integer or a vector of integers.');
      }
    }
    if (isSimple(b)) {
      b = withShape((function() {
        var _j, _ref2, _results;
        _results = [];
        for (_j = 0, _ref2 = a.length; 0 <= _ref2 ? _j < _ref2 : _j > _ref2; 0 <= _ref2 ? _j++ : _j--) {
          _results.push(1);
        }
        return _results;
      })(), b);
    }
    sb = shapeOf(b);
    if (a.length > sb.length) {
      throw Error('The left argument to ↓ must have length less than or equal to the rank of its right argument.');
    }
    for (_j = _ref2 = a.length, _ref3 = sb.length; _ref2 <= _ref3 ? _j < _ref3 : _j > _ref3; _ref2 <= _ref3 ? _j++ : _j--) {
      a.push(0);
    }
    lims = (function() {
      var _ref4, _results;
      _results = [];
      for (i = 0, _ref4 = a.length; 0 <= _ref4 ? i < _ref4 : i > _ref4; 0 <= _ref4 ? i++ : i--) {
        _results.push(a[i] >= 0 ? [Math.min(a[i], sb[i]), sb[i]] : [0, Math.max(0, sb[i] + a[i])]);
      }
      return _results;
    })();
    r = [];
    rec = function(d, i, n) {
      var j, _ref4, _ref5;
      if (d >= sb.length) {
        r.push(b[i]);
      } else {
        n /= sb[d];
        for (j = _ref4 = lims[d][0], _ref5 = lims[d][1]; _ref4 <= _ref5 ? j < _ref5 : j > _ref5; _ref4 <= _ref5 ? j++ : j--) {
          rec(d + 1, i + j * n, n);
        }
      }
      return 0;
    };
    rec(0, 0, b.length);
    sr = (function() {
      var _k, _len2, _ref4, _results;
      _results = [];
      for (_k = 0, _len2 = lims.length; _k < _len2; _k++) {
        _ref4 = lims[_k], lo = _ref4[0], hi = _ref4[1];
        _results.push(hi - lo);
      }
      return _results;
    })();
    return withShape(sr, r);
  })));
  monadic(overloadable(named('⊂', function(a) {
    if (isSimple(a)) {
      return a;
    } else {
      return withShape([], [a]);
    }
  })));
  dyadic(overloadable(named('⊂')));
  monadic(overloadable(named('⊃', function(a) {
    var i, r, rec, sa, sr, sr1, sx, x, _i, _j, _len, _len2, _ref2, _ref3;
    if (isSimple(a)) {
      return a;
    }
    sa = shapeOf(a);
    if (sa.length === 0) {
      return a[0];
    }
    sr1 = shapeOf(a[0]).slice(0);
    _ref2 = a.slice(1);
    for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
      x = _ref2[_i];
      sx = shapeOf(x);
      if (sx.length !== sr1.length) {
        throw Error('The argument of ⊃ must contain elements of the same rank.');
      }
      for (i = 0, _ref3 = sr1.length; 0 <= _ref3 ? i < _ref3 : i > _ref3; 0 <= _ref3 ? i++ : i--) {
        sr1[i] = Math.max(sr1[i], sx[i]);
      }
    }
    sr = shapeOf(a).concat(sr1);
    r = [];
    for (_j = 0, _len2 = a.length; _j < _len2; _j++) {
      x = a[_j];
      sx = shapeOf(x);
      rec = function(d, i, n, N) {
        var filler, j, _k, _ref4, _ref5, _results;
        if (d >= sr1.length) {
          return r.push(x[i]);
        } else {
          n /= sx[d];
          N /= sr1[d];
          for (j = 0, _ref4 = sx[d]; 0 <= _ref4 ? j < _ref4 : j > _ref4; 0 <= _ref4 ? j++ : j--) {
            rec(d + 1, i + j * n, n, N);
          }
          if (sr1[d] > sx[d]) {
            filler = prototypeOf(x);
            _results = [];
            for (_k = 0, _ref5 = N * (sr1[d] - sx[d]); 0 <= _ref5 ? _k < _ref5 : _k > _ref5; 0 <= _ref5 ? _k++ : _k--) {
              _results.push(r.push(filler));
            }
            return _results;
          }
        }
      };
      rec(0, 0, x.length, prod(sr1));
    }
    return withShape(sr, r);
  })));
  dyadic(overloadable(named('⊃')));
  dyadic(overloadable(named('⌷', function(a, b) {
    var d, i, r, rec, sb, sr, x, y, _i, _j, _k, _len, _len2, _len3, _len4, _len5;
    if (isSimple(a)) {
      a = [a];
    }
    if (a.shape && a.shape.length > 1) {
      throw Error('Indices must be a scalar or a vector, not a higher-dimensional array.');
    }
    sb = shapeOf(b);
    if (a.length !== sb.length) {
      throw Error('The number of indices must be equal to the rank of the indexable.');
    }
    a = (function() {
      var _i, _len, _ref2, _results, _results2;
      _results = [];
      for (i = 0, _len = a.length; i < _len; i++) {
        x = a[i];
        _results.push(isSimple(x) ? withShape([], [x]) : !x.length ? (function() {
          _results2 = [];
          for (var _i = 0, _ref2 = sb[i]; 0 <= _ref2 ? _i < _ref2 : _i > _ref2; 0 <= _ref2 ? _i++ : _i--){ _results2.push(_i); }
          return _results2;
        }).apply(this, arguments) : x);
      }
      return _results;
    })();
    for (d = 0, _len = a.length; d < _len; d++) {
      x = a[d];
      for (_i = 0, _len2 = x.length; _i < _len2; _i++) {
        y = x[_i];
        if (!(typeof y === 'number' && y === Math.floor(y))) {
          throw Error('Indices must be integers');
        }
      }
    }
    for (d = 0, _len3 = a.length; d < _len3; d++) {
      x = a[d];
      for (_j = 0, _len4 = x.length; _j < _len4; _j++) {
        y = x[_j];
        if (!((0 <= y && y < sb[d]))) {
          throw Error('Index out of bounds');
        }
      }
    }
    sr = [];
    for (_k = 0, _len5 = a.length; _k < _len5; _k++) {
      x = a[_k];
      sr = sr.concat(shapeOf(x));
    }
    r = [];
    rec = function(d, i, n) {
      var x, _l, _len6, _ref2;
      if (d >= a.length) {
        r.push(b[i]);
      } else {
        _ref2 = a[d];
        for (_l = 0, _len6 = _ref2.length; _l < _len6; _l++) {
          x = _ref2[_l];
          rec(d + 1, i + (x * n / sb[d]), n / sb[d]);
        }
      }
      return 0;
    };
    rec(0, 0, b.length);
    if (sr.length === 0) {
      return r[0];
    } else {
      return withShape(sr, r);
    }
  })));
  grade = function(a, b, direction) {
    var h, i, m, n, r, sa, sb, _i, _ref2, _ref3, _results;
    if (!(b != null)) {
      b = a;
      a = [];
    }
    sa = shapeOf(a);
    sb = shapeOf(b);
    if (sa.length === 0) {
      throw Error('Left argument to ⍋ or ⍒ must be non-scalar.');
    }
    if (sb.length === 0) {
      return b;
    }
    n = sa[sa.length - 1];
    h = {};
    for (i = 0, _ref2 = a.length; 0 <= _ref2 ? i < _ref2 : i > _ref2; 0 <= _ref2 ? i++ : i--) {
      h[a[i]] = i % n;
    }
    m = b.length / sb[0];
    r = (function() {
      _results = [];
      for (var _i = 0, _ref3 = sb[0]; 0 <= _ref3 ? _i < _ref3 : _i > _ref3; 0 <= _ref3 ? _i++ : _i--){ _results.push(_i); }
      return _results;
    }).apply(this, arguments);
    r.sort(function(i, j) {
      var k, tx, ty, x, y;
      for (k = 0; 0 <= m ? k < m : k > m; 0 <= m ? k++ : k--) {
        x = b[m * i + k];
        y = b[m * j + k];
        tx = typeof x;
        ty = typeof y;
        if (tx < ty) {
          return -direction;
        }
        if (tx > ty) {
          return direction;
        }
        if (h[x] != null) {
          x = h[x];
        }
        if (h[y] != null) {
          y = h[y];
        }
        if (x < y) {
          return -direction;
        }
        if (x > y) {
          return direction;
        }
      }
      return 0;
    });
    return r;
  };
  monadic(overloadable(named('⍋', function(a, b) {
    return grade(a, b, 1);
  })));
  monadic(overloadable(named('⍒', function(a, b) {
    return grade(a, b, -1);
  })));
  monadic(overloadable(named('⊤')));
  monadic(overloadable(named('⊥')));
  monadic(overloadable(named('⍕')));
  dyadic(overloadable(named('⍕')));
  monadic(overloadable(named('⍎')));
  monadic(overloadable(named('⊣')));
  dyadic(overloadable(named('⊣')));
  monadic(overloadable(named('⊢')));
  dyadic(overloadable(named('⊢')));
  builtins['get_⍬'] = function() {
    return [];
  };
  reduce = function(f, _, axis) {
    if (axis == null) {
      axis = -1;
    }
    return function(a, b) {
      var i, invokedAsMonadic, isBackwards, items, j, k, n, r, sItem, sb, x, _ref2;
      invokedAsMonadic = !(b != null);
      if (invokedAsMonadic) {
        b = a;
        a = 0;
      }
      a = Math.floor(numericValueOf(a));
      isBackwards = a < 0;
      if (isBackwards) {
        a = -a;
      }
      b = arrayValueOf(b);
      sb = shapeOf(b);
      if (axis < 0) {
        axis += sb.length;
      }
      n = sb[axis];
      if (a === 0) {
        a = n;
      }
      if (sb.length === 1) {
        items = b;
      } else {
        sItem = sb.slice(0, axis).concat(sb.slice(axis + 1));
        k = prod(sb.slice(axis + 1));
        items = (function() {
          var _i, _results;
          _results = [];
          for (_i = 0; 0 <= n ? _i < n : _i > n; 0 <= n ? _i++ : _i--) {
            _results.push(withShape(sItem, []));
          }
          return _results;
        })();
        for (i = 0, _ref2 = b.length; 0 <= _ref2 ? i < _ref2 : i > _ref2; 0 <= _ref2 ? i++ : i--) {
          items[Math.floor(i / k) % n].push(b[i]);
        }
      }
      r = (function() {
        var _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _results, _results2, _step, _step2;
        if (isBackwards) {
          _results = [];
          for (i = 0, _ref3 = n - a + 1; 0 <= _ref3 ? i < _ref3 : i > _ref3; 0 <= _ref3 ? i++ : i--) {
            x = items[i + a - 1];
            for (j = _ref4 = i + a - 2, _ref5 = i - 1, _step = -1; _ref4 <= _ref5 ? j < _ref5 : j > _ref5; j += _step) {
              x = f(x, items[j]);
            }
            _results.push(x);
          }
          return _results;
        } else {
          _results2 = [];
          for (i = 0, _ref6 = n - a + 1; 0 <= _ref6 ? i < _ref6 : i > _ref6; 0 <= _ref6 ? i++ : i--) {
            x = items[i];
            for (j = _ref7 = i + 1, _ref8 = i + a, _step2 = 1; _ref7 <= _ref8 ? j < _ref8 : j > _ref8; j += _step2) {
              x = f(x, items[j]);
            }
            _results2.push(x);
          }
          return _results2;
        }
      })();
      if (invokedAsMonadic) {
        return r[0];
      } else {
        return r;
      }
    };
  };
  compressOrReplicate = function(a, b, axis) {
    var filler, i, isExpansive, isExtensive, isHyperexpansive, j, k, nNonNegative, ni, nj, nk, r, sb, sr, x, _i, _j, _k, _l, _len, _len2, _ref2;
    if (axis == null) {
      axis = -1;
    }
    sb = shapeOf(b);
    if (axis < 0) {
      axis += sb.length;
    }
    if (!((0 <= axis && axis < sb.length))) {
      throw Error('Axis out of bounds');
    }
    sr = sb.slice(0);
    sr[axis] = 0;
    if (shapeOf(a).length > 1) {
      throw Error('Left argument to / must be an integer or a vector of integers');
    }
    if (!a.length) {
      a = (function() {
        var _i, _ref2, _results;
        _results = [];
        for (_i = 0, _ref2 = sb[axis]; 0 <= _ref2 ? _i < _ref2 : _i > _ref2; 0 <= _ref2 ? _i++ : _i--) {
          _results.push(a);
        }
        return _results;
      })();
    }
    nNonNegative = 0;
    for (_i = 0, _len = a.length; _i < _len; _i++) {
      x = a[_i];
      if (typeof x !== 'number' || x !== Math.floor(x)) {
        throw Error('Left argument to / must be an integer or a vector of integers');
      }
      sr[axis] += Math.abs(x);
      nNonNegative += x >= 0;
    }
    isExtensive = true;
    isExpansive = isHyperexpansive = false;
    if (sb[axis] !== 1) {
      isExtensive = false;
      isExpansive = a.length === sb[axis];
      isHyperexpansive = !isExpansive;
      if (isHyperexpansive && (nNonNegative !== sb[axis])) {
        throw Error('For A/B, the length of B along the selected axis ' + 'must be equal either to one, ' + 'or the length of A, ' + 'or to the number of non-negative elements in A.');
      }
    }
    r = [];
    ni = prod(sb.slice(0, axis));
    nj = sb[axis];
    nk = prod(sb.slice(axis + 1));
    for (i = 0; 0 <= ni ? i < ni : i > ni; 0 <= ni ? i++ : i--) {
      j = 0;
      for (_j = 0, _len2 = a.length; _j < _len2; _j++) {
        x = a[_j];
        if (x > 0) {
          for (_k = 0; 0 <= x ? _k < x : _k > x; 0 <= x ? _k++ : _k--) {
            for (k = 0; 0 <= nk ? k < nk : k > nk; 0 <= nk ? k++ : k--) {
              r.push(b[k + nk * (j + nj * i)]);
            }
          }
          j += isExpansive || isHyperexpansive;
        } else {
          filler = prototypeOf(isExpansive ? [b[nk * (j + nj * i)]] : [b[nk * nj * i]]);
          for (_l = 0, _ref2 = -x * nk; 0 <= _ref2 ? _l < _ref2 : _l > _ref2; 0 <= _ref2 ? _l++ : _l--) {
            r.push(filler);
          }
          j += isExpansive;
        }
      }
    }
    return withShape(sr, r);
  };
  postfixOperator(named('/', function(a, b, axis) {
    if (axis == null) {
      axis = -1;
    }
    if (typeof a === 'function') {
      return reduce(a, void 0, axis);
    } else {
      return compressOrReplicate(a, b, axis);
    }
  }));
  postfixOperator(named('⌿', function(a, b, axis) {
    if (axis == null) {
      axis = 0;
    }
    if (typeof a === 'function') {
      return reduce(a, void 0, axis);
    } else {
      return compressOrReplicate(a, b, axis);
    }
  }));
  postfixOperator(named('¨', function(f) {
    return function(a, b) {
      var i, x, _i, _j, _k, _l, _len, _len2, _len3, _len4, _ref2, _ref3, _ref4, _results, _results2, _results3, _results4, _results5;
      if (!(b != null)) {
        _ref2 = arrayValueOf(a);
        _results = [];
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          x = _ref2[_i];
          _results.push(f(x));
        }
        return _results;
      }
      if (isSimple(a)) {
        _ref3 = arrayValueOf(b);
        _results2 = [];
        for (_j = 0, _len2 = _ref3.length; _j < _len2; _j++) {
          x = _ref3[_j];
          _results2.push(f(a, x));
        }
        return _results2;
      }
      if (a.length === b.length) {
        _results3 = [];
        for (i = 0, _ref4 = a.length; 0 <= _ref4 ? i < _ref4 : i > _ref4; 0 <= _ref4 ? i++ : i--) {
          _results3.push(f(a[i], b[i]));
        }
        return _results3;
      }
      if (a.length === 1) {
        _results4 = [];
        for (_k = 0, _len3 = b.length; _k < _len3; _k++) {
          x = b[_k];
          _results4.push(f(a[0], x));
        }
        return _results4;
      }
      if (b.length === 1) {
        _results5 = [];
        for (_l = 0, _len4 = a.length; _l < _len4; _l++) {
          x = a[_l];
          _results5.push(f(x, b[0]));
        }
        return _results5;
      }
      throw Error('Length error');
    };
  }));
  prefixOperator(named('∘.', outerProduct = function(f) {
    f = cpsify(f);
    return cps(function(a, b, _, callback) {
      var ia, loopA, r;
      if (!(b != null)) {
        return function() {
          return callback(Error('Operator ∘. (Outer product) works only with dyadic functions'));
        };
      }
      a = arrayValueOf(a);
      b = arrayValueOf(b);
      r = [];
      ia = 0;
      return loopA = function() {
        var ib, loopB;
        if (ia < a.length) {
          ib = 0;
          return loopB = function() {
            if (ib < b.length) {
              return function() {
                return f(a[ia], b[ib], null, function(err, x) {
                  if (err) {
                    return function() {
                      return callback(err);
                    };
                  }
                  r.push(x);
                  ib++;
                  return loopB;
                });
              };
            } else {
              ia++;
              return loopA;
            }
          };
        } else {
          return function() {
            return callback(null, withShape((shapeOf(a)).concat(shapeOf(b)), r));
          };
        }
      };
    });
  }));
  infixOperator(named('.', function(f, g) {
    var F, G;
    F = reduce(f);
    G = outerProduct(g);
    return function(a, b) {
      if (shapeOf(a).length > 1 || shapeOf(b).length > 1) {
        throw Error('Inner product operator (.) is implemented only for arrays of rank no more than 1.');
      }
      return F(g(a, b));
    };
  }));
  postfixOperator(named('⍣', cps(function(f, _, _, callback) {
    if (typeof f !== 'function') {
      return function() {
        return callback0(Error('Left argument to ⍣ must be a function.'));
      };
    }
    f = cpsify(f);
    return function() {
      return callback(null, cps(function(n, _, _, callback1) {
        if (typeof n !== 'number' || n < 0 || n !== Math.floor(n)) {
          return function() {
            return callback(Error('Right argument to ⍣ must be a non-negative integer.'));
          };
        }
        return function() {
          return callback1(null, cps(function(a, _, _, callback2) {
            var F, i;
            i = 0;
            return F = function() {
              if (i < n) {
                return f(a, null, null, function(err, r) {
                  if (err) {
                    return function() {
                      return callback2(err);
                    };
                  }
                  a = r;
                  i++;
                  return F;
                });
              } else {
                return function() {
                  return callback2(null, a);
                };
              }
            };
          }));
        };
      }));
    };
  })));
}).call(this);
