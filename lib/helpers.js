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
}).call(this);
