(function() {
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
}).call(this);
