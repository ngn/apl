(function() {
  var fs, name, names;
  fs = require('fs');
  names = (function() {
    var _i, _len, _ref, _results;
    _ref = fs.readdirSync('../examples');
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      name = _ref[_i];
      if (name.match(/.*\.apl/)) {
        _results.push(name);
      }
    }
    return _results;
  })();
  names.sort();
  fs.writeFileSync('examples.js', "// Generated code, do not edit\nwindow.examples = [\n" + (((function() {
    var _i, _len, _results;
    _results = [];
    for (_i = 0, _len = names.length; _i < _len; _i++) {
      name = names[_i];
      _results.push('  ' + JSON.stringify([name.replace(/(^\d+-|\.apl$)/g, ''), fs.readFileSync('../examples/' + name).toString().replace(/(^#!.*\n+|\n+$)/g, '').replace(/\n *⎕ *← *(.*)$/, '\n$1')]));
    }
    return _results;
  })()).join(',\n')) + "\n];");
}).call(this);
