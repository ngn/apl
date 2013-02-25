(function() {
  var exports;

  exports = module.exports = function(aplSource) {
    return require('./compiler').exec(aplSource);
  };

  exports.createGlobalContext = function() {
    return require('./helpers').inherit(require('./vocabulary'));
  };

  exports.compile = require('./compiler').compile;

}).call(this);
