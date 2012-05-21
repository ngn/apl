(function() {
  var cps, isSimple, prototypeOf, shapeOf, withPrototype, withShape;

  exports.inherit = function(x) {
    var f;
    f = (function() {});
    f.prototype = x;
    return new f;
  };

  exports.trampoline = function(x) {
    while (typeof x === 'function') {
      x = x();
    }
    return x;
  };

  exports.cps = cps = function(f) {
    f.cps = true;
    return f;
  };

  exports.cpsify = function(f) {
    if (f.cps) return f;
    return cps(function(a, b, c, callback) {
      var result;
      try {
        result = f(a, b, c);
        return function() {
          return callback(null, result);
        };
      } catch (err) {
        return function() {
          return callback(err);
        };
      }
    });
  };

  exports.isSimple = isSimple = function(x) {
    return !(x instanceof Array);
  };

  exports.shapeOf = shapeOf = function(a) {
    return a.shape || (a.length != null ? [a.length] : []);
  };

  exports.withShape = withShape = function(shape, a) {
    if ((shape != null) && shape.length !== 1) a.shape = shape;
    return a;
  };

  exports.prototypeOf = prototypeOf = function(x) {
    var p;
    if (typeof x === 'number') {
      return 0;
    } else if (typeof x === 'string') {
      return ' ';
    } else if (x.aplPrototype != null) {
      return x.aplPrototype;
    } else if (isSimple(x) || !x.length) {
      return 0;
    } else if (isSimple(x[0])) {
      return prototypeOf(x[0]);
    } else {
      p = prototypeOf(x[0]);
      return withShape(shapeOf(x[0]), (function() {
        var _i, _ref, _results;
        _results = [];
        for (_i = 0, _ref = x[0].length; 0 <= _ref ? _i < _ref : _i > _ref; 0 <= _ref ? _i++ : _i--) {
          _results.push(p);
        }
        return _results;
      })());
    }
  };

  exports.withPrototype = withPrototype = function(p, x) {
    if ((x instanceof Array) && (!x.length) && (p !== 0)) x.aplPrototype = p;
    return x;
  };

  exports.withPrototypeCopiedFrom = function(y, x) {
    if ((x instanceof Array) && (!x.length)) withPrototype(prototypeOf(y), x);
    return x;
  };

  exports.sum = function(xs) {
    var r, x, _i, _len;
    r = 0;
    for (_i = 0, _len = xs.length; _i < _len; _i++) {
      x = xs[_i];
      r += x;
    }
    return r;
  };

  exports.prod = function(xs) {
    var r, x, _i, _len;
    r = 1;
    for (_i = 0, _len = xs.length; _i < _len; _i++) {
      x = xs[_i];
      r *= x;
    }
    return r;
  };

  exports.repeat = function(s, n) {
    var r, _i;
    r = '';
    for (_i = 0; 0 <= n ? _i < n : _i > n; 0 <= n ? _i++ : _i--) {
      r += s;
    }
    return r;
  };

}).call(this);
