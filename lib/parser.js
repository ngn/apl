(function() {
  var Parser, fs, grammar, nt, o, t;
  var __slice = Array.prototype.slice;
  grammar = {
    lex: {
      rules: []
    },
    bnf: {}
  };
  t = function(regex, action) {
    if (action == null) {
      action = '';
    }
    action && (action = "return " + (JSON.stringify(action)));
    return grammar.lex.rules.push([regex.source, action]);
  };
  nt = function(name, alternatives) {
    return grammar.bnf[name] = alternatives;
  };
  o = function() {
    var args;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return args;
  };
  t(/[ \t]+/);
  t(/[⍝#].*/);
  t(/[\n\r◇]/, 'SEPARATOR');
  t(/¯?\d+(\.\d+)?/, 'NUMBER');
  t(/\'([^\'\\\r\n]|\'\'|\\[a-z])*\'/, 'STRING');
  t(/\"([^\"\\\r\n]|\"\"|\\[a-z])*\"/, 'STRING');
  t(/\[/, '[');
  t(/\]/, ']');
  t(/;/, ';');
  t(/\(/, '(');
  t(/\)/, ')');
  t(/\{/, '{');
  t(/\}/, '}');
  t(/←/, 'ARROW');
  t(/«[^»]*»/, 'EMBEDDED');
  t(/∘./, 'SYMBOL');
  t(/[A-Za-z_][A-Za-z_0-9]*/, 'SYMBOL');
  t(/./, 'SYMBOL');
  t(/$/, 'EOF');
  nt('root', [o('body EOF', "return $1")]);
  nt('body', [o('', "$$ = ['body']"), o('expr', "$$ = ['body', $1]"), o('body SEPARATOR', "$$ = $1"), o('body SEPARATOR expr', "($$ = $1).push($3)")]);
  nt('expr', [o('sequence', "$$ = $1"), o('assignment', "$$ = $1"), o('sequence assignment', "($$ = $1).push($2)")]);
  nt('assignment', [o('SYMBOL ARROW expr', "$$ = ['assign', $1, $3]")]);
  nt('sequence', [o('item', "$$ = ['seq', $1]"), o('sequence item', "($$ = $1).push($2)")]);
  nt('item', [o('indexable', "$$ = $1"), o("indexable [ indices ]", "$$ = ['index', $1].concat($3)")]);
  nt('indices', [o('expr', "$$ = [$1]"), o("indices ; expr", "($$ = $1).push($3)")]);
  nt('indexable', [o('NUMBER', "$$ = ['num', $1]"), o('STRING', "$$ = ['str', $1]"), o('SYMBOL', "$$ = ['sym', $1]"), o('EMBEDDED', "$$ = ['embedded', $1]"), o("( expr )", "$$ = $2"), o("{ body }", "$$ = ['lambda', $2]")]);
  Parser = require('jison').Parser;
  fs = require('fs');
  fs.writeFileSync('../lib/parser.js', new Parser(grammar).generate());
}).call(this);
