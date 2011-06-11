(function() {
  exports.inherit = function(x) {
    var f;
    f = (function() {});
    f.prototype = x;
    return new f;
  };
}).call(this);
