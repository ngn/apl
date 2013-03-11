(function() {
  var inherit, vocabulary;

  vocabulary = require('./vocabulary');

  inherit = require('./helpers').inherit;

  this.browserVocabulary = inherit(vocabulary, {
    '⍵': ('' + location).split(''),
    'get_⎕': function() {
      return (prompt('⎕:') || '').split('');
    },
    'set_⎕': function(x) {
      return alert(x);
    },
    'get_⍞': function() {
      return (prompt() || '').split('');
    },
    'set_⍞': function(x) {
      return alert(x);
    }
  });

}).call(this);
