(function() {
  var builtins, ctx, inherit;

  builtins = require('./builtins').builtins;

  inherit = require('./helpers').inherit;

  exports.browserBuiltins = ctx = inherit(builtins);

  ctx['⍵'] = ('' + location).split('');

  ctx['get_⎕'] = function() {
    return (prompt('⎕:') || '').split('');
  };

  ctx['set_⎕'] = function(x) {
    return alert(x);
  };

  ctx['get_⍞'] = function() {
    return (prompt() || '').split('');
  };

  ctx['set_⍞'] = function(x) {
    return alert(x);
  };

}).call(this);
