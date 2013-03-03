(function() {
  var browserVocabulary, ctx, inherit, vocabulary;

  vocabulary = require('./vocabulary');

  inherit = require('./helpers').inherit;

  browserVocabulary = ctx = inherit(vocabulary);

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

  exports.browserVocabulary = browserVocabulary;

}).call(this);
