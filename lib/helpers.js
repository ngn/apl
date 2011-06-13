(function() {
  var cps;
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
    if (f.cps) {
      return f;
    }
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
  exports.shapeOf = function(a) {
    return a.shape || (a.length != null ? [a.length] : []);
  };
  exports.isSimple = function(x) {
    return typeof x === 'number' || typeof x === 'string';
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
