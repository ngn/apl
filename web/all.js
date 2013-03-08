(function () {

    var modules = {};

    window.require = function (name) {
        var m = modules[name];
        if (!m) {
            throw Error('Cannot find module ' + JSON.stringify(m));
        }
        if (m.state === 'unloaded') {
            m.state = 'beingloaded';
            m.instance = m.init(m.instance, window.require);
            m.state = 'loaded';
        }
        return m.instance;
    };

    window.defModule = function (name, init) {
        if (modules[name]) {
            throw Error('Redefinition of module ' + JSON.stringify(name));
        }
        modules[name] = {state: 'unloaded', init: init, instance: {}};
    };

})();
defModule('./parser', function (exports, require) {
  (function() {
  var lexer,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  lexer = require('./lexer');

  exports.parse = function(aplCode) {
    var consume, demand, fail, parseBody, parseExpr, parseIndexable, parseIndices, parseItem, token, tokenStream;
    tokenStream = lexer.tokenize(aplCode);
    token = tokenStream.next();
    consume = function(tt) {
      var _ref;
      if (_ref = token.type, __indexOf.call(tt.split(' '), _ref) >= 0) {
        return token = tokenStream.next();
      }
    };
    demand = function(tt) {
      if (token.type !== tt) {
        fail("Expected " + tt + " but got " + token.type);
      }
      token = tokenStream.next();
    };
    fail = function(message) {
      throw Error("Syntax error: " + message + " at " + token.startLine + ":" + token.startCol + "\n" + (aplCode.split('\n')[token.startLine - 1]) + "\n" + (new Array(token.startCol).join('-') + '^'));
    };
    parseBody = function() {
      var body, expr, _ref, _ref1;
      body = ['body'];
      while (true) {
        if ((_ref = token.type) === 'eof' || _ref === '}') {
          return body;
        }
        while (consume('separator newline')) {undefined}
        if ((_ref1 = token.type) === 'eof' || _ref1 === '}') {
          return body;
        }
        expr = parseExpr();
        if (consume(':')) {
          expr = ['guard', expr, parseExpr()];
        }
        body.push(expr);
      }
    };
    parseExpr = function() {
      var expr, item, _ref;
      expr = ['expr'];
      while (true) {
        item = parseItem();
        if (consume('←')) {
          return expr.concat([['assign', item, parseExpr()]]);
        }
        expr.push(item);
        if (_ref = token.type, __indexOf.call(') ] } : ; separator newline eof'.split(' '), _ref) >= 0) {
          return expr;
        }
      }
    };
    parseItem = function() {
      var item;
      item = parseIndexable();
      if (consume('[')) {
        item = ['index', item].concat(parseIndices());
        demand(']');
      }
      return item;
    };
    parseIndices = function() {
      var indices;
      indices = [];
      while (true) {
        if (consume(';')) {
          indices.push(null);
        } else if (token.type === ']') {
          indices.push(null);
          return indices;
        } else {
          indices.push(parseExpr());
          if (token.type === ']') {
            return indices;
          }
          demand(';');
        }
      }
    };
    parseIndexable = function() {
      var b, expr, t;
      t = token;
      if (consume('number string symbol embedded')) {
        return [t.type, t.value];
      } else if (consume('(')) {
        expr = parseExpr();
        demand(')');
        return expr;
      } else if (consume('{')) {
        b = parseBody();
        demand('}');
        return ['lambda', b];
      } else {
        return fail("Expected indexable but got " + token.type);
      }
    };
    return parseBody();
  };

}).call(this);

  return exports;
});defModule('./browser', function (exports, require) {
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

  return exports;
});defModule('./compiler', function (exports, require) {
  (function() {
  var Complex, all, assert, assignParents, closestScope, compile, die, exec, inherit, nodes, parser, resolveExprs, toJavaScript, vocabulary, _ref;

  parser = require('./parser');

  vocabulary = require('./vocabulary');

  Complex = require('./complex').Complex;

  _ref = require('./helpers'), inherit = _ref.inherit, die = _ref.die, assert = _ref.assert, all = _ref.all;

  assignParents = function(node) {
    var child, _i, _len, _ref1;
    _ref1 = node.slice(1);
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      child = _ref1[_i];
      if (!(child)) {
        continue;
      }
      assignParents(child);
      child.parent = node;
    }
  };

  resolveExprs = function(ast, opts) {
    var h, k, m, node, queue, scopeCounter, scopeNode, v, vars, visit, _i, _j, _len, _len1, _ref1, _ref2;
    if (opts == null) {
      opts = {};
    }
    ast.vars = {
      '⍺': {
        type: 'X',
        jsCode: '_a'
      },
      '⍵': {
        type: 'X',
        jsCode: '_w'
      },
      '∇': {
        type: 'F',
        jsCode: 'arguments.callee'
      }
    };
    for (k in vocabulary) {
      v = vocabulary[k];
      ast.vars[k] = h = {
        type: 'X',
        jsCode: "_[" + (JSON.stringify(k)) + "]"
      };
      if (typeof v === 'function') {
        h.type = 'F';
        if ((m = v.aplMetaInfo) != null) {
          if (m.isPrefixAdverb) {
            h.isPrefixAdverb = true;
          }
          if (m.isPostfixAdverb) {
            h.isPostfixAdverb = true;
          }
          if (m.isConjunction) {
            h.isConjunction = true;
          }
        }
        if (/^[gs]et_.*/.test(k)) {
          ast.vars[k.slice(4)] = {
            type: 'X'
          };
        }
      }
    }
    if (opts.vars) {
      _ref1 = opts.vars;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        v = _ref1[_i];
        ast.vars[v.name] = {
          type: 'X',
          jsCode: v.name
        };
      }
    }
    scopeCounter = 0;
    ast.scopeId = scopeCounter++;
    queue = [ast];
    while (queue.length) {
      vars = (scopeNode = queue.shift()).vars;
      visit = function(node) {
        var a, c, child, i, j, name, t, t1, x, _j, _k, _len1, _len2, _ref10, _ref11, _ref12, _ref13, _ref14, _ref15, _ref16, _ref17, _ref18, _ref19, _ref2, _ref20, _ref21, _ref22, _ref23, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9;
        switch (node[0]) {
          case 'body':
            node.vars = inherit(vars);
            node.scopeId = scopeCounter++;
            queue.push(node);
            return null;
          case 'guard':
            visit(node[1]);
            return visit(node[2]);
          case 'assign':
            assert(node[1].constructor === Array);
            assert(node[1][0] === 'symbol', 'Compound assignment is not supported.');
            name = node[1][1];
            assert(typeof name === 'string');
            h = visit(node[2]);
            if (vars[name]) {
              assert(vars[name].type === h.type, ("Inconsistent usage of symbol '" + name + "', it is ") + "assigned both data and functions");
            } else {
              vars[name] = {
                type: h.type,
                jsCode: "_" + scopeNode.scopeId + "[" + (JSON.stringify(name)) + "]"
              };
            }
            return h;
          case 'symbol':
            name = node[1];
            if (((_ref2 = (v = vars["get_" + name])) != null ? _ref2.type : void 0) === 'F') {
              v.used = true;
              return {
                type: 'X'
              };
            } else {
              v = vars[name];
              assert(v, "Symbol '" + name + "' referenced before assignment");
              v.used = true;
              return v;
            }
            break;
          case 'lambda':
            visit(node[1]);
            return {
              type: 'F'
            };
          case 'string':
          case 'number':
          case 'embedded':
            return {
              type: 'X'
            };
          case 'index':
            t1 = visit(node[1]);
            _ref3 = node.slice(2);
            for (_j = 0, _len1 = _ref3.length; _j < _len1; _j++) {
              c = _ref3[_j];
              if (!(c !== null)) {
                continue;
              }
              t = visit(c);
              assert(t.type === 'X', 'Only data can be used as an index');
            }
            return t1;
          case 'expr':
            a = node.slice(1);
            a.reverse();
            h = (function() {
              var _k, _len2, _results;
              _results = [];
              for (_k = 0, _len2 = a.length; _k < _len2; _k++) {
                child = a[_k];
                _results.push(visit(child));
              }
              return _results;
            })();
            h.reverse();
            a.reverse();
            i = 0;
            while (i < a.length - 1) {
              if ((h[i].type === (_ref4 = h[i + 1].type) && _ref4 === 'X')) {
                j = i + 2;
                while (j < a.length && h[j].type === 'X') {
                  j++;
                }
                [].splice.apply(a, [i, j - i].concat(_ref5 = [['vector'].concat(a.slice(i, j))])), _ref5;
                [].splice.apply(h, [i, j - i].concat(_ref6 = [
                  {
                    type: 'X'
                  }
                ])), _ref6;
              } else {
                i++;
              }
            }
            i = a.length - 2;
            while (--i >= 0) {
              if (h[i + 1].isConjunction && (h[i].type === 'F' || h[i + 2].type === 'F')) {
                [].splice.apply(a, [i, (i + 3) - i].concat(_ref7 = [['conjunction'].concat(a.slice(i, i + 3))])), _ref7;
                [].splice.apply(h, [i, (i + 3) - i].concat(_ref8 = [
                  {
                    type: 'F'
                  }
                ])), _ref8;
                i--;
              }
            }
            i = 0;
            while (i < a.length - 1) {
              if (h[i].type === 'F' && h[i + 1].isPostfixAdverb) {
                [].splice.apply(a, [i, (i + 2) - i].concat(_ref9 = [['postfixAdverb'].concat(a.slice(i, i + 2))])), _ref9;
                [].splice.apply(h, [i, (i + 2) - i].concat(_ref10 = [
                  {
                    type: 'F'
                  }
                ])), _ref10;
              } else {
                i++;
              }
            }
            i = a.length - 1;
            while (--i >= 0) {
              if (h[i].isPrefixAdverb && h[i + 1].type === 'F') {
                [].splice.apply(a, [i, (i + 2) - i].concat(_ref11 = [['prefixAdverb'].concat(a.slice(i, i + 2))])), _ref11;
                [].splice.apply(h, [i, (i + 2) - i].concat(_ref12 = [
                  {
                    type: 'F'
                  }
                ])), _ref12;
              }
            }
            if (h.length === 2 && (h[0].type === (_ref13 = h[1].type) && _ref13 === 'F')) {
              a = [['hook'].concat(a)];
              h = [
                {
                  type: 'F'
                }
              ];
            }
            if (h.length >= 3 && h.length % 2 === 1 && all((function() {
              var _k, _len2, _results;
              _results = [];
              for (_k = 0, _len2 = h.length; _k < _len2; _k++) {
                x = h[_k];
                _results.push(x.type === 'F');
              }
              return _results;
            })())) {
              a = [['fork'].concat(a)];
              h = [
                {
                  type: 'F'
                }
              ];
            }
            if (h[h.length - 1].type === 'F') {
              assert(h.length <= 1, 'Trailing function in expression');
            } else {
              while (h.length > 1) {
                if (h.length === 2 || h[h.length - 3].type === 'F') {
                  [].splice.apply(a, [(_ref14 = h.length - 2), 9e9].concat(_ref15 = [['monadic'].concat(a.slice(h.length - 2))])), _ref15;
                  [].splice.apply(h, [(_ref16 = h.length - 2), 9e9].concat(_ref17 = [
                    {
                      type: 'X'
                    }
                  ])), _ref17;
                } else {
                  [].splice.apply(a, [(_ref18 = h.length - 3), 9e9].concat(_ref19 = [['dyadic'].concat(a.slice(h.length - 3))])), _ref19;
                  [].splice.apply(h, [(_ref20 = h.length - 3), 9e9].concat(_ref21 = [
                    {
                      type: 'X'
                    }
                  ])), _ref21;
                }
              }
            }
            [].splice.apply(node, [0, 9e9].concat(_ref22 = a[0])), _ref22;
            a[0].parent = null;
            _ref23 = node.slice(1);
            for (_k = 0, _len2 = _ref23.length; _k < _len2; _k++) {
              c = _ref23[_k];
              if (c) {
                c.parent = node;
              }
            }
            return h[0];
          default:
            return die("Unrecognised node type, '" + node[0] + "'");
        }
      };
      _ref2 = scopeNode.slice(1);
      for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
        node = _ref2[_j];
        visit(node);
      }
    }
  };

  toJavaScript = function(ast) {
    var visit;
    visit = function(node) {
      var a, c, child, d, i, n, name, s, v, vars, x, _i, _len, _ref1, _ref2, _ref3;
      switch (node[0]) {
        case 'body':
          if (node.length === 1) {
            return 'return [];\n';
          } else {
            a = ["var _" + node.scopeId + " = {};\n"];
            _ref1 = node.slice(1);
            for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
              child = _ref1[_i];
              a.push(visit(child));
            }
            a[a.length - 1] = "return " + a[a.length - 1] + ";\n";
            return a.join(';\n');
          }
          break;
        case 'guard':
          return "if (_['⎕bool'](" + (visit(node[1])) + ")) {\n  return " + (visit(node[2])) + ";\n}";
        case 'assign':
          assert(node[1].constructor === Array);
          assert(node[1].length === 2);
          assert(node[1][0] === 'symbol');
          name = node[1][1];
          assert(typeof name === 'string');
          assert(name !== '∇', 'Assignment to ∇ is not allowed.');
          vars = closestScope(node).vars;
          if (((_ref2 = (v = vars["set_" + name])) != null ? _ref2.type : void 0) === 'F') {
            v.used = true;
            return "" + v.jsCode + "(" + (visit(node[2])) + ")";
          } else {
            return "" + vars[name].jsCode + " = " + (visit(node[2]));
          }
          break;
        case 'symbol':
          name = node[1];
          vars = closestScope(node).vars;
          if (((_ref3 = (v = vars["get_" + name])) != null ? _ref3.type : void 0) === 'F') {
            v.used = true;
            return "" + v.jsCode + "()";
          } else {
            v = vars[name];
            v.used = true;
            return v.jsCode;
          }
          break;
        case 'lambda':
          return "function (_w, _a) {\n  " + (visit(node[1])) + "\n}";
        case 'string':
          s = node[1];
          d = s[0];
          return "_['⎕aplify'](" + (d + s.slice(1, -1).replace(RegExp("" + (d + d), "g"), '\\' + d) + d) + ")";
        case 'number':
          s = node[1].replace(/¯/g, '-');
          a = (function() {
            var _j, _len1, _ref4, _results;
            _ref4 = s.split(/j/i);
            _results = [];
            for (_j = 0, _len1 = _ref4.length; _j < _len1; _j++) {
              x = _ref4[_j];
              if (x === '-') {
                _results.push('Infinity');
              } else if (x === '--') {
                _results.push('-Infinity');
              } else if (x.match(/^-?0x/i)) {
                _results.push(parseInt(x, 16));
              } else {
                _results.push(parseFloat(x));
              }
            }
            return _results;
          })();
          if (a.length === 1 || a[1] === 0) {
            return '' + a[0];
          } else {
            return "new _['⎕complex'](" + a[0] + ", " + a[1] + ")";
          }
          break;
        case 'index':
          return "_['⌷'](" + (visit(node[1])) + ", [" + (((function() {
            var _j, _len1, _ref4, _results;
            _ref4 = node.slice(2);
            _results = [];
            for (_j = 0, _len1 = _ref4.length; _j < _len1; _j++) {
              c = _ref4[_j];
              if (c !== null) {
                _results.push(visit(c));
              }
            }
            return _results;
          })()).join(', ')) + "], [" + ((function() {
            var _j, _len1, _ref4, _results;
            _ref4 = node.slice(2);
            _results = [];
            for (i = _j = 0, _len1 = _ref4.length; _j < _len1; i = ++_j) {
              c = _ref4[i];
              if (c !== null) {
                _results.push(i);
              }
            }
            return _results;
          })()) + "])";
        case 'expr':
          return die('No "expr" nodes are expected at this stage.');
        case 'vector':
          n = node.length - 1;
          return "[" + (((function() {
            var _j, _len1, _ref4, _results;
            _ref4 = node.slice(1);
            _results = [];
            for (_j = 0, _len1 = _ref4.length; _j < _len1; _j++) {
              child = _ref4[_j];
              _results.push(visit(child));
            }
            return _results;
          })()).join(', ')) + "]";
        case 'monadic':
          return "" + (visit(node[1])) + "(" + (visit(node[2])) + ")";
        case 'dyadic':
          return "" + (visit(node[2])) + "(" + (visit(node[3])) + ", " + (visit(node[1])) + ")";
        case 'prefixAdverb':
          return "" + (visit(node[1])) + "(" + (visit(node[2])) + ")";
        case 'conjunction':
          return "" + (visit(node[2])) + "(" + (visit(node[3])) + ", " + (visit(node[1])) + ")";
        case 'postfixAdverb':
          return "" + (visit(node[2])) + "(" + (visit(node[1])) + ")";
        case 'hook':
          return "_['⎕hook'](" + (visit(node[2])) + ", " + (visit(node[1])) + ")";
        case 'fork':
          return "_['⎕fork']([" + ((function() {
            var _j, _len1, _ref4, _results;
            _ref4 = node.slice(1);
            _results = [];
            for (_j = 0, _len1 = _ref4.length; _j < _len1; _j++) {
              c = _ref4[_j];
              _results.push(visit(c));
            }
            return _results;
          })()) + "])";
        case 'embedded':
          return "_['⎕aplify'](" + (node[1].replace(/(^«|»$)/g, '')) + ")";
        default:
          return die("Unrecognised node type, '" + node[0] + "'");
      }
    };
    return visit(ast);
  };

  closestScope = function(node) {
    while (node[0] !== 'body') {
      node = node.parent;
    }
    return node;
  };

  nodes = function(aplCode, opts) {
    var ast;
    if (opts == null) {
      opts = {};
    }
    ast = parser.parse(aplCode);
    assignParents(ast);
    resolveExprs(ast, opts);
    return ast;
  };

  compile = function(aplCode, opts) {
    var jsCode;
    if (opts == null) {
      opts = {};
    }
    jsCode = toJavaScript(nodes(aplCode, opts));
    if (opts.embedded) {
      jsCode = "var _ = require('apl').createGlobalContext(),\n    _a = arguments[0],\n    _w = arguments[1];\n" + jsCode;
    }
    return jsCode;
  };

  exec = function(aplCode, opts) {
    if (opts == null) {
      opts = {};
    }
    return (new Function("var _ = arguments[0];\n" + (compile(aplCode, opts))))(inherit(vocabulary, opts.extraContext));
  };

  exports.nodes = nodes;

  exports.compile = compile;

  exports.exec = exec;

}).call(this);

  return exports;
});defModule('./helpers', function (exports, require) {
  (function() {
  var all, assert, die, inherit, isSimple, prod, prototypeOf, repeat, shapeOf, sum, withPrototype, withPrototypeCopiedFrom, withShape;

  inherit = function(x, extraProperties) {
    var f, k, r, v;
    if (extraProperties == null) {
      extraProperties = {};
    }
    f = (function() {});
    f.prototype = x;
    r = new f;
    for (k in extraProperties) {
      v = extraProperties[k];
      r[k] = v;
    }
    return r;
  };

  isSimple = function(x) {
    return !(x instanceof Array);
  };

  shapeOf = function(a) {
    return a.shape || ((a.length != null) && !(typeof a === 'string' && a.length === 1) ? [a.length] : []);
  };

  withShape = function(shape, a) {
    assert((shape == null) || a.length === prod(shape));
    if ((shape != null) && shape.length !== 1) {
      a.shape = shape;
    }
    return a;
  };

  prototypeOf = function(x) {
    var p;
    if (typeof x === 'number') {
      return 0;
    } else if (typeof x === 'string') {
      return ' ';
    } else if (x.aplPrototype != null) {
      return x.aplPrototype;
    } else if (isSimple(x) || !x.length) {
      return 0;
    } else if (isSimple(x[0])) {
      return prototypeOf(x[0]);
    } else {
      p = prototypeOf(x[0]);
      return withShape(shapeOf(x[0]), (function() {
        var _i, _ref, _results;
        _results = [];
        for (_i = 0, _ref = x[0].length; 0 <= _ref ? _i < _ref : _i > _ref; 0 <= _ref ? _i++ : _i--) {
          _results.push(p);
        }
        return _results;
      })());
    }
  };

  withPrototype = withPrototype = function(p, x) {
    if ((x instanceof Array) && (!x.length) && (p !== 0)) {
      x.aplPrototype = p;
    }
    return x;
  };

  withPrototypeCopiedFrom = function(y, x) {
    if (x instanceof Array && !x.length) {
      withPrototype(prototypeOf(y), x);
    }
    return x;
  };

  sum = function(xs) {
    var r, x, _i, _len;
    r = 0;
    for (_i = 0, _len = xs.length; _i < _len; _i++) {
      x = xs[_i];
      r += x;
    }
    return r;
  };

  prod = function(xs) {
    var r, x, _i, _len;
    r = 1;
    for (_i = 0, _len = xs.length; _i < _len; _i++) {
      x = xs[_i];
      r *= x;
    }
    return r;
  };

  all = function(xs) {
    var x, _i, _len;
    for (_i = 0, _len = xs.length; _i < _len; _i++) {
      x = xs[_i];
      if (!x) {
        return false;
      }
    }
    return true;
  };

  repeat = function(s, n) {
    var r, _i;
    r = '';
    for (_i = 0; 0 <= n ? _i < n : _i > n; 0 <= n ? _i++ : _i--) {
      r += s;
    }
    return r;
  };

  die = function(s) {
    throw Error(s);
  };

  assert = function(flag, s) {
    if (s == null) {
      s = 'Assertion failed';
    }
    if (!flag) {
      throw Error(s);
    }
  };

  exports.inherit = inherit;

  exports.isSimple = isSimple;

  exports.shapeOf = shapeOf;

  exports.withShape = withShape;

  exports.prototypeOf = prototypeOf;

  exports.withPrototype = withPrototype;

  exports.withPrototypeCopiedFrom = withPrototypeCopiedFrom;

  exports.sum = sum;

  exports.prod = prod;

  exports.all = all;

  exports.repeat = repeat;

  exports.die = die;

  exports.assert = assert;

}).call(this);

  return exports;
});defModule('./complex', function (exports, require) {
  (function() {
  var C, Complex, assert, die, _ref,
    __slice = [].slice;

  _ref = require('./helpers'), die = _ref.die, assert = _ref.assert;

  C = function(re, im) {
    if (im) {
      return new Complex(re, im);
    } else {
      return re;
    }
  };

  Complex = (function() {

    function Complex(re, im) {
      this.re = re != null ? re : 0;
      this.im = im != null ? im : 0;
      assert(typeof this.re === 'number');
      assert(typeof this.im === 'number');
    }

    Complex.prototype.toString = function() {
      return ("" + this.re + "J" + this.im).replace(/-/g, '¯');
    };

    Complex.prototype['='] = function(x) {
      if (x instanceof Complex) {
        return +(this.re === x.re && this.im === x.im);
      } else if (typeof x === 'number') {
        return +(this.re === x && this.im === 0);
      } else {
        return 0;
      }
    };

    Complex.prototype['right_='] = function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return this['='].apply(this, args);
    };

    Complex.prototype['≡'] = function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return this['='].apply(this, args);
    };

    Complex.prototype['right_≡'] = function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return this['='].apply(this, args);
    };

    Complex.prototype['+'] = function(x) {
      if (x != null) {
        if (typeof x === 'number') {
          return C(this.re + x, this.im);
        } else if (x instanceof Complex) {
          return C(this.re + x.re, this.im + x.im);
        } else {
          throw Error('Unsupported operation');
        }
      } else {
        return C(this.re, -this.im);
      }
    };

    Complex.prototype['right_+'] = function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return this['+'].apply(this, args);
    };

    Complex.prototype['−'] = function(x) {
      if (x != null) {
        if (typeof x === 'number') {
          return C(this.re - x, this.im);
        } else if (x instanceof Complex) {
          return C(this.re - x.re, this.im - x.im);
        } else {
          throw Error('Unsupported operation');
        }
      } else {
        return C(-this.re, -this.im);
      }
    };

    Complex.prototype['right_−'] = function(x) {
      return (x instanceof Complex ? x : new Complex(x, 0))['−'](this);
    };

    Complex.prototype['×'] = function(x) {
      if (x != null) {
        if (typeof x === 'number') {
          return C(x * this.re, x * this.im);
        } else if (x instanceof Complex) {
          return C(this.re * x.re - this.im * x.im, this.re * x.im + this.im * x.re);
        } else {
          throw Error('Unsupported operation');
        }
      } else {
        throw Error('Unsupported operation');
      }
    };

    Complex.prototype['right_×'] = function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return this['×'].apply(this, args);
    };

    Complex.prototype['÷'] = function(x) {
      var d;
      if (x != null) {
        if (typeof x === 'number') {
          return C(this.re / x, this.im / x);
        } else if (x instanceof Complex) {
          d = this.re * this.re + this.im * this.im;
          return C((this.re * x.re + this.im * x.im) / d, (this.re * x.im - this.im * x.re) / d);
        } else {
          throw Error('Unsupported operation');
        }
      } else {
        d = this.re * this.re + this.im * this.im;
        return C(this.re / d, -this.im / d);
      }
    };

    Complex.prototype['right_÷'] = function(x) {
      return (x instanceof Complex ? x : new Complex(x, 0))['÷'](this);
    };

    return Complex;

  })();

  exports.Complex = Complex;

}).call(this);

  return exports;
});defModule('./apl', function (exports, require) {
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

  return exports;
});defModule('./lexer', function (exports, require) {
  (function() {
  var tokenDefs;

  tokenDefs = [['-', /^(?:[ \t]+|[⍝\#].*)+/], ['newline', /^[\n\r]+/], ['separator', /^[◇⋄]/], ['number', /^¯?(?:0x[\da-f]+|\d*\.?\d+(?:e[+¯]?\d+)?|¯)(?:j¯?(?:0x[\da-f]+|\d*\.?\d+(?:e[+¯]?\d+)?|¯))?/i], ['string', /^(?:'(?:[^\\']|\\.)*'|"(?:[^\\"]|\\.)*")+/], ['', /^[\(\)\[\]\{\}:;←]/], ['embedded', /^«[^»]*»/], ['symbol', /^(?:∘\.|⎕?[a-z_][0-9a-z_]*|[^¯'":«»])/i]];

  exports.tokenize = function(aplCode) {
    var col, line, stack;
    line = col = 1;
    stack = ['{'];
    return {
      next: function() {
        var a, m, re, startCol, startLine, t, type, _i, _len, _ref;
        while (true) {
          if (!aplCode) {
            return {
              type: 'eof',
              value: '',
              startLine: line,
              startCol: col,
              endLine: line,
              endCol: col
            };
          }
          startLine = line;
          startCol = col;
          type = null;
          for (_i = 0, _len = tokenDefs.length; _i < _len; _i++) {
            _ref = tokenDefs[_i], t = _ref[0], re = _ref[1];
            if (!(m = aplCode.match(re))) {
              continue;
            }
            type = t || m[0];
            break;
          }
          if (!type) {
            throw Error("Lexical error at " + line + ":" + col);
          }
          a = m[0].split('\n');
          line += a.length - 1;
          col = (a.length === 1 ? col : 1) + a[a.length - 1].length;
          aplCode = aplCode.substring(m[0].length);
          if (type !== '-') {
            if (type === '(' || type === '[' || type === '{') {
              stack.push(type);
            } else if (type === ')' || type === ']' || type === '}') {
              stack.pop();
            }
            if (type !== 'newline' || stack[stack.length - 1] === '{') {
              return {
                type: type,
                startLine: startLine,
                startCol: startCol,
                value: m[0],
                endLine: line,
                endCol: col
              };
            }
          }
        }
      }
    };
  };

}).call(this);

  return exports;
});defModule('./vocabulary', function (exports, require) {
  (function() {
  var Gamma, PI, abs, acos, ambivalent, array, asin, assert, atan, bool, catenate, ceil, compressOrReplicate, conjunction, contains, cos, def, depthOf, die, dyadic, endOfVocabulary, exp, expand, factorial, floor, formatter, grade, inherit, isSimple, log, match, max, maybeMakePervasive, min, monadic, num, outerProduct, overloadable, pervasive, postfixAdverb, pow, prefixAdverb, prod, prototypeOf, random, reduce, reverse, round, scan, shapeOf, sin, sqrt, tan, tmp, vocabulary, withMetaInfoFrom, withPrototype, withPrototypeCopiedFrom, withShape, _ref,
    __slice = [].slice,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  _ref = require('./helpers'), assert = _ref.assert, die = _ref.die, inherit = _ref.inherit, isSimple = _ref.isSimple, shapeOf = _ref.shapeOf, withShape = _ref.withShape, prod = _ref.prod, prototypeOf = _ref.prototypeOf, withPrototype = _ref.withPrototype, withPrototypeCopiedFrom = _ref.withPrototypeCopiedFrom;

  min = Math.min, max = Math.max, floor = Math.floor, ceil = Math.ceil, round = Math.round, abs = Math.abs, random = Math.random, exp = Math.exp, pow = Math.pow, log = Math.log, PI = Math.PI, sqrt = Math.sqrt, sin = Math.sin, cos = Math.cos, tan = Math.tan, asin = Math.asin, acos = Math.acos, atan = Math.atan;

  formatter = require('./formatter');

  array = function(x) {
    if (isSimple(x)) {
      (x = [x]).shape = [];
    }
    return x;
  };

  num = function(x) {
    if (x.length != null) {
      assert(x.length === 1, 'Numeric scalar or singleton expected');
      x = x[0];
    }
    assert(typeof x === 'number', 'Numeric scalar or singleton expected');
    return x;
  };

  bool = function(x) {
    x = num(x);
    assert(x === 0 || x === 1, 'Boolean values must be either 0 or 1');
    return x;
  };

  vocabulary = {};

  tmp = {
    monadic: {},
    dyadic: {}
  };

  def = function(h, name, description, f) {
    assert(typeof name === 'string');
    assert(typeof description === 'string');
    if (f == null) {
      f = function() {
        return die("Verb " + name + " " + description + " is not implemented.");
      };
    }
    assert(typeof f === 'function');
    assert(h[name] == null, "Redefinition of verb " + name + " " + description);
    return h[name] = f;
  };

  monadic = function() {
    var a;
    a = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return def.apply(null, [tmp.monadic].concat(__slice.call(a)));
  };

  dyadic = function() {
    var a;
    a = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return def.apply(null, [tmp.dyadic].concat(__slice.call(a)));
  };

  prefixAdverb = function() {
    var a, _base, _ref1;
    a = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return ((_ref1 = (_base = def.apply(null, [tmp.monadic].concat(__slice.call(a)))).aplMetaInfo) != null ? _ref1 : _base.aplMetaInfo = {}).isPrefixAdverb = true;
  };

  postfixAdverb = function() {
    var a, _base, _ref1;
    a = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return ((_ref1 = (_base = def.apply(null, [tmp.monadic].concat(__slice.call(a)))).aplMetaInfo) != null ? _ref1 : _base.aplMetaInfo = {}).isPostfixAdverb = true;
  };

  conjunction = function() {
    var a, _base, _ref1;
    a = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return ((_ref1 = (_base = def.apply(null, [tmp.dyadic].concat(__slice.call(a)))).aplMetaInfo) != null ? _ref1 : _base.aplMetaInfo = {}).isConjunction = true;
  };

  withMetaInfoFrom = function(f, g) {
    assert(typeof f === 'function');
    assert(typeof g === 'function');
    g.aplMetaInfo = f.aplMetaInfo ? inherit(f.aplMetaInfo) : {};
    return g;
  };

  overloadable = function(symbol, f) {
    assert(typeof symbol === 'string');
    assert(typeof f === 'function');
    return withMetaInfoFrom(f, function() {
      var a, args, b;
      b = arguments[0], a = arguments[1], args = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
      if (a == null) {
        if (typeof (b != null ? b[symbol] : void 0) === 'function') {
          return b[symbol].apply(b, args);
        } else {
          return f.apply(null, [b, a].concat(__slice.call(args)));
        }
      } else {
        if (typeof (a != null ? a[symbol] : void 0) === 'function') {
          return a[symbol].apply(a, [b].concat(__slice.call(args)));
        } else if (typeof (b != null ? b['right_' + symbol] : void 0) === 'function') {
          return b['right_' + symbol].apply(b, [a].concat(__slice.call(args)));
        } else {
          return f.apply(null, [b, a].concat(__slice.call(args)));
        }
      }
    });
  };

  ambivalent = function(symbol, f1, f2) {
    var F;
    assert(typeof symbol === 'string');
    if (!(f1 && f2)) {
      return f1 || f2;
    }
    assert(typeof f1 === 'function');
    assert(typeof f2 === 'function');
    return F = function() {
      var a, args, b;
      b = arguments[0], a = arguments[1], args = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
      if (a != null) {
        return f2.apply(null, [b, a].concat(__slice.call(args)));
      } else {
        return f1.apply(null, [b, a].concat(__slice.call(args)));
      }
    };
  };

  endOfVocabulary = function() {
    var f1, f2, k, ks, _i, _len;
    ks = ((function() {
      var _results;
      _results = [];
      for (k in tmp.monadic) {
        _results.push(k);
      }
      return _results;
    })()).concat((function() {
      var _results;
      _results = [];
      for (k in tmp.dyadic) {
        if (tmp.monadic[k] == null) {
          _results.push(k);
        }
      }
      return _results;
    })());
    for (_i = 0, _len = ks.length; _i < _len; _i++) {
      k = ks[_i];
      f1 = tmp.monadic[k];
      if (f1 != null) {
        f1 = overloadable(k, f1);
        f1 = maybeMakePervasive(f1);
      }
      f2 = tmp.dyadic[k];
      if (f2 != null) {
        f2 = overloadable(k, f2);
        f2 = maybeMakePervasive(f2);
      }
      vocabulary[k] = ambivalent(k, f1, f2);
    }
    return tmp = null;
  };

  pervasive = function(f) {
    var _ref1;
    assert(typeof f === 'function');
    ((_ref1 = f.aplMetaInfo) != null ? _ref1 : f.aplMetaInfo = {}).isPervasive = true;
    return f;
  };

  maybeMakePervasive = function(f) {
    var F, _ref1;
    assert(typeof f === 'function');
    if (!((_ref1 = f.aplMetaInfo) != null ? _ref1.isPervasive : void 0)) {
      return f;
    } else {
      return withMetaInfoFrom(f, (F = function(b, a) {
        var i, k, sa, sb, x, _i, _ref2;
        if (a != null) {
          if ((!isSimple(a)) && a.length === 1 && isSimple(a[0])) {
            a = a[0];
          }
          if ((!isSimple(b)) && b.length === 1 && isSimple(b[0])) {
            b = b[0];
          }
          if (isSimple(b) && isSimple(a)) {
            return f(b, a);
          } else if (isSimple(a)) {
            return withShape(b.shape, (function() {
              var _i, _len, _results;
              _results = [];
              for (_i = 0, _len = b.length; _i < _len; _i++) {
                x = b[_i];
                _results.push(F(x, a));
              }
              return _results;
            })());
          } else if (isSimple(b)) {
            return withShape(a.shape, (function() {
              var _i, _len, _results;
              _results = [];
              for (_i = 0, _len = a.length; _i < _len; _i++) {
                x = a[_i];
                _results.push(F(b, x));
              }
              return _results;
            })());
          } else {
            sa = shapeOf(a);
            sb = shapeOf(b);
            for (i = _i = 0, _ref2 = min(sa.length, sb.length); 0 <= _ref2 ? _i < _ref2 : _i > _ref2; i = 0 <= _ref2 ? ++_i : --_i) {
              assert(sa[i] === sb[i], 'Length error');
            }
            if (sa.length > sb.length) {
              k = prod(sa.slice(sb.length));
              return withShape(sa, (function() {
                var _j, _ref3, _results;
                _results = [];
                for (i = _j = 0, _ref3 = a.length; 0 <= _ref3 ? _j < _ref3 : _j > _ref3; i = 0 <= _ref3 ? ++_j : --_j) {
                  _results.push(F(b[floor(i / k)], a[i]));
                }
                return _results;
              })());
            } else if (sa.length < sb.length) {
              k = prod(sb.slice(sa.length));
              return withShape(sb, (function() {
                var _j, _ref3, _results;
                _results = [];
                for (i = _j = 0, _ref3 = b.length; 0 <= _ref3 ? _j < _ref3 : _j > _ref3; i = 0 <= _ref3 ? ++_j : --_j) {
                  _results.push(F(b[i], a[floor(i / k)]));
                }
                return _results;
              })());
            } else {
              return withShape(sa, (function() {
                var _j, _ref3, _results;
                _results = [];
                for (i = _j = 0, _ref3 = a.length; 0 <= _ref3 ? _j < _ref3 : _j > _ref3; i = 0 <= _ref3 ? ++_j : --_j) {
                  _results.push(F(b[i], a[i]));
                }
                return _results;
              })());
            }
          }
        } else {
          if (isSimple(b)) {
            return f(b);
          } else {
            return withShape(b.shape, (function() {
              var _j, _len, _results;
              _results = [];
              for (_j = 0, _len = b.length; _j < _len; _j++) {
                x = b[_j];
                _results.push(F(x));
              }
              return _results;
            })());
          }
        }
      }));
    }
  };

  monadic('+', 'Conjugate', pervasive(function(x) {
    return x;
  }));

  dyadic('+', 'Add', pervasive(function(y, x) {
    return x + y;
  }));

  monadic('−', 'Negate', pervasive(function(x) {
    return -x;
  }));

  dyadic('−', 'Subtract', pervasive(function(y, x) {
    return x - y;
  }));

  monadic('×', 'Sign of', pervasive(function(x) {
    return (x > 0) - (x < 0);
  }));

  dyadic('×', 'Multiply', pervasive(function(y, x) {
    return x * y;
  }));

  monadic('÷', 'Reciprocal', pervasive(function(x) {
    return 1 / x;
  }));

  dyadic('÷', 'Divide', pervasive(function(y, x) {
    return x / y;
  }));

  monadic('⌈', 'Ceiling', pervasive(function(x) {
    return ceil(x);
  }));

  dyadic('⌈', 'Greater of', pervasive(function(y, x) {
    return max(x, y);
  }));

  monadic('⌊', 'Floor', pervasive(function(x) {
    return floor(x);
  }));

  dyadic('⌊', 'Lesser of', pervasive(function(y, x) {
    return min(x, y);
  }));

  monadic('∣', 'Absolute value', pervasive(function(x) {
    return abs(x);
  }));

  dyadic('∣', 'Residue', pervasive(function(y, x) {
    return y % x;
  }));

  monadic('⍳', 'Index generate', function(a) {
    var i, indices, r, v, x, _i, _j, _len, _len1;
    if (typeof a === 'number') {
      return (function() {
        var _i, _results;
        _results = [];
        for (i = _i = 0; _i < a; i = _i += 1) {
          _results.push(i);
        }
        return _results;
      })();
    }
    for (_i = 0, _len = a.length; _i < _len; _i++) {
      x = a[_i];
      assert(typeof x === 'number');
    }
    r = [];
    indices = (function() {
      var _j, _ref1, _results;
      _results = [];
      for (i = _j = 0, _ref1 = a.length; _j < _ref1; i = _j += 1) {
        _results.push(0);
      }
      return _results;
    })();
    i = 0;
    while (i >= 0) {
      for (_j = 0, _len1 = indices.length; _j < _len1; _j++) {
        v = indices[_j];
        r.push(v);
      }
      i = a.length - 1;
      while (i >= 0 && ++indices[i] === a[i]) {
        indices[i--] = 0;
      }
    }
    return withShape(a.concat(shapeOf(a)), r);
  });

  dyadic('⍳', 'Index of', function(b, a) {
    var i, pos, x, y, _i, _j, _len, _len1, _results;
    if (isSimple(a)) {
      a = [a];
    } else {
      assert(shapeOf(a).length <= 1, 'Left argument to ⍳ must be of rank no more than 1.');
    }
    if (isSimple(b)) {
      b = [b];
    }
    _results = [];
    for (_i = 0, _len = b.length; _i < _len; _i++) {
      y = b[_i];
      pos = a.length;
      for (i = _j = 0, _len1 = a.length; _j < _len1; i = ++_j) {
        x = a[i];
        if (!(match(x, y))) {
          continue;
        }
        pos = i;
        break;
      }
      _results.push(pos);
    }
    return _results;
  });

  monadic('?', 'Roll', pervasive(function(x) {
    return floor(random() * max(0, floor(num(x))));
  }));

  dyadic('?', 'Deal', function(y, x) {
    var available, _i, _j, _results, _results1;
    x = max(0, floor(num(x)));
    y = max(0, floor(num(y)));
    assert(x <= y, 'Domain error: left argument of ? must not be greater ' + 'than its right argument.');
    available = (function() {
      _results = [];
      for (var _i = 0; 0 <= y ? _i < y : _i > y; 0 <= y ? _i++ : _i--){ _results.push(_i); }
      return _results;
    }).apply(this);
    _results1 = [];
    for (_j = 0; 0 <= x ? _j < x : _j > x; 0 <= x ? _j++ : _j--) {
      _results1.push(available.splice(floor(available.length * random()), 1)[0]);
    }
    return _results1;
  });

  monadic('⋆', 'Exponentiate', pervasive(function(x) {
    return exp(num(x));
  }));

  dyadic('⋆', 'To the power of', pervasive(function(y, x) {
    return pow(num(x), num(y));
  }));

  monadic('⍟', 'Natural logarithm', pervasive(function(x) {
    return log(x);
  }));

  dyadic('⍟', 'Logarithm to the base', pervasive(function(y, x) {
    return log(y) / log(x);
  }));

  monadic('○', 'Pi times', pervasive(function(x) {
    return PI * x;
  }));

  dyadic('○', 'Circular and hyperbolic functions', pervasive(function(x, i) {
    var ex;
    switch (i) {
      case 0:
        return sqrt(1 - x * x);
      case 1:
        return sin(x);
      case 2:
        return cos(x);
      case 3:
        return tan(x);
      case 4:
        return sqrt(1 + x * x);
      case 5:
        return (exp(2 * x) - 1) / 2;
      case 6:
        return (exp(2 * x) + 1) / 2;
      case 7:
        ex = exp(2 * x);
        return (ex - 1) / (ex + 1);
      case -1:
        return asin(x);
      case -2:
        return acos(x);
      case -3:
        return atan(x);
      case -4:
        return sqrt(x * x - 1);
      case -5:
        return log(x + sqrt(x * x + 1));
      case -6:
        return log(x + sqrt(x * x - 1));
      case -7:
        return log((1 + x) / (1 - x)) / 2;
      default:
        return die('Unknown circular or hyperbolic function ' + i);
    }
  }));

  Gamma = function(x) {
    var a, i, p, t, _i, _ref1;
    p = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (x < 0.5) {
      return PI / (sin(PI * x) * Gamma(1 - x));
    }
    x--;
    a = p[0];
    t = x + 7.5;
    for (i = _i = 1, _ref1 = p.length; 1 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 1 <= _ref1 ? ++_i : --_i) {
      a += p[i] / (x + i);
    }
    return sqrt(2 * PI) * pow(t, x + 0.5) * exp(-t) * a;
  };

  monadic('!', 'Factorial', pervasive(factorial = function(x) {
    var i, r;
    if ((0 <= x && x < 25) && x === floor(x)) {
      r = 1;
      i = 2;
      while (i <= x) {
        r *= i++;
      }
      return r;
    } else if (x < -150) {
      return 0;
    } else if (x > 150) {
      return 1 / 0;
    } else {
      return Gamma(x + 1);
    }
  }));

  dyadic('!', 'Binomial', pervasive(function(n, k) {
    var i, u, v, _i;
    if ((0 <= k && k < 100) && (0 <= n && n < 100) && n === floor(n) && k === floor(k)) {
      if (n < k) {
        return 0;
      }
      if (2 * k > n) {
        k = n - k;
      }
      u = v = 1;
      for (i = _i = 0; _i < k; i = _i += 1) {
        u *= n - i;
        v *= i + 1;
      }
      return u / v;
    } else {
      return factorial(n) / (factorial(k) * factorial(n - k));
    }
  }));

  monadic('⌹', 'Matrix inverse');

  dyadic('⌹', 'Matrix divide');

  dyadic('<', 'Less than', pervasive(function(y, x) {
    return +(x < y);
  }));

  dyadic('≤', 'Less than or equal', pervasive(function(y, x) {
    return +(x <= y);
  }));

  dyadic('=', 'Equal', pervasive(function(y, x) {
    return +(x === y);
  }));

  dyadic('>', 'Greater than', pervasive(function(y, x) {
    return +(x > y);
  }));

  dyadic('≥', 'Greater than or equal', pervasive(function(y, x) {
    return +(x >= y);
  }));

  dyadic('≠', 'Not equal', pervasive(function(y, x) {
    return +(x !== y);
  }));

  monadic('≡', 'Depth', depthOf = function(a) {
    var r, x, _i, _len;
    if (isSimple(a)) {
      return 0;
    }
    r = 0;
    for (_i = 0, _len = a.length; _i < _len; _i++) {
      x = a[_i];
      r = max(r, depthOf(x));
    }
    return r + 1;
  });

  dyadic('≡', 'Match', match = function(b, a) {
    var i, sa, sb, _i, _j, _ref1, _ref2;
    if (isSimple(a) && isSimple(b)) {
      return +(a === b);
    }
    if (isSimple(a) !== isSimple(b)) {
      return 0;
    }
    sa = shapeOf(a);
    sb = shapeOf(b);
    if (sa.length !== sb.length) {
      return 0;
    }
    for (i = _i = 0, _ref1 = sa.length; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
      if (sa[i] !== sb[i]) {
        return 0;
      }
    }
    if (a.length !== b.length) {
      return 0;
    }
    for (i = _j = 0, _ref2 = a.length; 0 <= _ref2 ? _j < _ref2 : _j > _ref2; i = 0 <= _ref2 ? ++_j : --_j) {
      if (!match(a[i], b[i])) {
        return 0;
      }
    }
    if (a.length) {
      return 1;
    }
    if (!((a.aplPrototype != null) || (b.aplPrototype != null))) {
      return 1;
    }
    return match(prototypeOf(a), prototypeOf(b));
  });

  dyadic('≢', 'Not match', function(b, a) {
    return +(!match(b, a));
  });

  monadic('∈', 'Enlist', function(a) {
    var r, rec;
    r = [];
    rec = function(x) {
      var y, _i, _len;
      if (isSimple(x)) {
        r.push(x);
      } else {
        for (_i = 0, _len = x.length; _i < _len; _i++) {
          y = x[_i];
          rec(y);
        }
      }
      return r;
    };
    return rec(a);
  });

  dyadic('∈', 'Membership', function(b, a) {
    var x;
    b = array(b);
    if (isSimple(a)) {
      return +(__indexOf.call(b, a) >= 0);
    } else {
      return withShape(a.shape, (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = a.length; _i < _len; _i++) {
          x = a[_i];
          _results.push(+(__indexOf.call(b, x) >= 0));
        }
        return _results;
      })());
    }
  });

  dyadic('⍷', 'Find', function(b, a) {
    var i, indices, r, rec, rec2, sa, sb, _i, _ref1;
    sa = shapeOf(a);
    sb = shapeOf(b);
    if (isSimple(b)) {
      return isSimple(a) && match(b, a);
    }
    if (isSimple(a)) {
      a = [a];
    }
    r = withShape(sb, (function() {
      var _i, _ref1, _results;
      _results = [];
      for (_i = 0, _ref1 = b.length; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; 0 <= _ref1 ? _i++ : _i--) {
        _results.push(0);
      }
      return _results;
    })());
    if (sa.length > sb.length) {
      return r;
    }
    while (sa.length < sb.length) {
      sa.unshift(1);
    }
    for (i = _i = 0, _ref1 = sb.length; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
      if (sa[i] > sb[i]) {
        return r;
      }
    }
    indices = Array(sb.length);
    rec = function(d, ir) {
      var _j, _ref2, _results;
      if (d < sb.length) {
        _results = [];
        for (i = _j = 0, _ref2 = sb[d] - sa[d] + 1; 0 <= _ref2 ? _j < _ref2 : _j > _ref2; i = 0 <= _ref2 ? ++_j : --_j) {
          indices[d] = i;
          _results.push(rec(d + 1, ir * sb[d] + i));
        }
        return _results;
      } else {
        return r[ir] = rec2(0, 0, 0);
      }
    };
    rec2 = function(d, ia, ib) {
      var _j, _ref2;
      if (d < sb.length) {
        for (i = _j = 0, _ref2 = sa[d]; 0 <= _ref2 ? _j < _ref2 : _j > _ref2; i = 0 <= _ref2 ? ++_j : --_j) {
          if (!rec2(d + 1, ia * sa[d] + i, ib * sb[d] + indices[d] + i)) {
            return 0;
          }
        }
        return 1;
      } else {
        return match(a[ia], b[ib]);
      }
    };
    rec(0, 0);
    return r;
  });

  monadic('∪', 'Unique', function(a) {
    var r, x, _i, _len, _ref1;
    r = [];
    _ref1 = array(a);
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      x = _ref1[_i];
      if (!contains(r, x)) {
        r.push(x);
      }
    }
    return r;
  });

  contains = function(a, x) {
    var y, _i, _len;
    for (_i = 0, _len = a.length; _i < _len; _i++) {
      y = a[_i];
      if (match(x, y)) {
        return true;
      }
    }
    return false;
  };

  dyadic('∪', 'Union', function(b, a) {
    var x;
    a = array(a);
    b = array(b);
    return a.concat((function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = b.length; _i < _len; _i++) {
        x = b[_i];
        if (!contains(a, x)) {
          _results.push(x);
        }
      }
      return _results;
    })());
  });

  dyadic('∩', 'Intersection', function(b, a) {
    var x, _i, _len, _results;
    a = array(a);
    b = array(b);
    _results = [];
    for (_i = 0, _len = a.length; _i < _len; _i++) {
      x = a[_i];
      if (contains(b, x)) {
        _results.push(x);
      }
    }
    return _results;
  });

  monadic('∼', 'Not', pervasive(function(x) {
    return +(!bool(x));
  }));

  dyadic('∼', 'Without', function(b, a) {
    var excluded, r, x, y, _i, _j, _len, _len1;
    if (isSimple(a)) {
      a = [a];
    } else {
      assert(shapeOf(a).length <= 1, 'Left argument to ∼ must be of rank no more than 1.');
    }
    if (isSimple(b)) {
      b = [b];
    }
    r = [];
    for (_i = 0, _len = a.length; _i < _len; _i++) {
      x = a[_i];
      excluded = false;
      for (_j = 0, _len1 = b.length; _j < _len1; _j++) {
        y = b[_j];
        if (match(x, y)) {
          excluded = true;
          break;
        }
      }
      if (!excluded) {
        r.push(x);
      }
    }
    return r;
  });

  dyadic('∨', 'Or', pervasive(function(y, x) {
    var _ref1, _ref2;
    x = abs(num(x));
    y = abs(num(y));
    assert(x === floor(x) && y === floor(y), '∨ is defined only for integers');
    if (x === 0 && y === 0) {
      return 0;
    }
    if (x < y) {
      _ref1 = [y, x], x = _ref1[0], y = _ref1[1];
    }
    while (y) {
      _ref2 = [y, x % y], x = _ref2[0], y = _ref2[1];
    }
    return x;
  }));

  dyadic('∧', 'And', pervasive(function(y, x) {
    var p, _ref1, _ref2;
    x = abs(num(x));
    y = abs(num(y));
    assert(x === floor(x) && y === floor(y), '∧ is defined only for integers');
    if (x === 0 || y === 0) {
      return 0;
    }
    p = x * y;
    if (x < y) {
      _ref1 = [y, x], x = _ref1[0], y = _ref1[1];
    }
    while (y) {
      _ref2 = [y, x % y], x = _ref2[0], y = _ref2[1];
    }
    return p / x;
  }));

  dyadic('⍱', 'Nor', pervasive(function(y, x) {
    return +(!(bool(x) || bool(y)));
  }));

  dyadic('⍲', 'Nand', pervasive(function(y, x) {
    return +(!(bool(x) && bool(y)));
  }));

  monadic('⍴', 'Shape of', shapeOf);

  dyadic('⍴', 'Reshape', function(b, a) {
    var i, x;
    if (isSimple(a)) {
      a = [a];
    }
    if (isSimple(b)) {
      b = [b];
    }
    a = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = a.length; _i < _len; _i++) {
        x = a[_i];
        assert(typeof x === 'number', 'Domain error: Left argument to ⍴ must be a ' + 'numeric scalar or vector.');
        _results.push(max(0, floor(x)));
      }
      return _results;
    })();
    return withShape(a, withPrototypeCopiedFrom(b, (function() {
      var _i, _ref1, _results;
      _results = [];
      for (i = _i = 0, _ref1 = prod(a); 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        _results.push(b[i % b.length]);
      }
      return _results;
    })()));
  });

  catenate = function(b, a, axis) {
    var i, j, k, ni, nja, njb, nk, r, sa, sb, sr, x, _i, _j, _k, _l, _m, _n, _ref1;
    if (axis == null) {
      axis = -1;
    }
    sa = shapeOf(a);
    if (sa.length === 0) {
      sa = [1];
      a = [a];
    }
    sb = shapeOf(b);
    if (sb.length === 0) {
      sb = [1];
      b = [b];
    }
    assert(sa.length === sb.length, 'Length error: Cannot catenate arrays of different ranks');
    if (axis < 0) {
      axis += sa.length;
    }
    for (i = _i = 0, _ref1 = sa.length; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
      if (sa[i] !== sb[i] && i !== axis) {
        die('Length error: Catenated arrays must match ' + 'at all axes except the one to catenate on');
      }
    }
    ni = prod(sa.slice(0, axis));
    nja = sa[axis];
    njb = sb[axis];
    nk = prod(sa.slice(axis + 1));
    r = [];
    for (i = _j = 0; 0 <= ni ? _j < ni : _j > ni; i = 0 <= ni ? ++_j : --_j) {
      for (j = _k = 0; 0 <= nja ? _k < nja : _k > nja; j = 0 <= nja ? ++_k : --_k) {
        for (k = _l = 0; 0 <= nk ? _l < nk : _l > nk; k = 0 <= nk ? ++_l : --_l) {
          r.push(a[k + nk * (j + nja * i)]);
        }
      }
      for (j = _m = 0; 0 <= njb ? _m < njb : _m > njb; j = 0 <= njb ? ++_m : --_m) {
        for (k = _n = 0; 0 <= nk ? _n < nk : _n > nk; k = 0 <= nk ? ++_n : --_n) {
          r.push(b[k + nk * (j + njb * i)]);
        }
      }
    }
    sr = (function() {
      var _len, _o, _results;
      _results = [];
      for (_o = 0, _len = sa.length; _o < _len; _o++) {
        x = sa[_o];
        _results.push(x);
      }
      return _results;
    })();
    sr[axis] += sb[axis];
    return withShape(sr, r);
  };

  monadic(',', 'Ravel', function(a) {
    return array(a).slice(0);
  });

  dyadic(',', 'Catenate', catenate);

  dyadic('⍪', '1st axis catenate', function(b, a) {
    return catenate(b, a, 0);
  });

  monadic('⌽', 'Reverse', reverse = function(b, _1, axis) {
    var i, j, k, ni, nj, nk, r, sb, _i, _j, _k, _ref1;
    if (axis == null) {
      axis = -1;
    }
    sb = shapeOf(b);
    if (sb.length === 0) {
      return b;
    }
    if (axis < 0) {
      axis += sb.length;
    }
    assert((0 <= axis && axis < sb.length), 'Axis out of bounds');
    ni = prod(sb.slice(0, axis));
    nj = sb[axis];
    nk = prod(sb.slice(axis + 1));
    r = [];
    for (i = _i = 0; 0 <= ni ? _i < ni : _i > ni; i = 0 <= ni ? ++_i : --_i) {
      for (j = _j = _ref1 = nj - 1; _j >= 0; j = _j += -1) {
        for (k = _k = 0; 0 <= nk ? _k < nk : _k > nk; k = 0 <= nk ? ++_k : --_k) {
          r.push(b[k + nk * (j + nj * i)]);
        }
      }
    }
    return withShape(sb, r);
  });

  dyadic('⌽', 'Rotate', function(b, a) {
    var i, n, sb;
    a = num(a);
    if (a === 0 || isSimple(b) || (b.length <= 1)) {
      return b;
    }
    sb = shapeOf(b);
    n = sb[sb.length - 1];
    a %= n;
    if (a < 0) {
      a += n;
    }
    return withShape(sb, (function() {
      var _i, _ref1, _results;
      _results = [];
      for (i = _i = 0, _ref1 = b.length; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        _results.push(b[i - (i % n) + ((i % n) + a) % n]);
      }
      return _results;
    })());
  });

  monadic('⊖', '1st axis reverse', function(b, _1, axis) {
    if (axis == null) {
      axis = 0;
    }
    return reverse(b, void 0, axis);
  });

  dyadic('⊖', '1st axis rotate', function(b, a) {
    var i, k, n, sb;
    a = num(a);
    if (a === 0 || isSimple(b) || (b.length <= 1)) {
      return b;
    }
    sb = shapeOf(b);
    n = sb[0];
    k = b.length / n;
    a %= n;
    if (a < 0) {
      a += n;
    }
    return withShape(sb, (function() {
      var _i, _ref1, _results;
      _results = [];
      for (i = _i = 0, _ref1 = b.length; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        _results.push(b[((floor(i / k) + a) % n) * k + (i % k)]);
      }
      return _results;
    })());
  });

  monadic('⍉', 'Transpose', function(a) {
    var i, psr, r, rec, sa, sr, _i, _ref1;
    sa = shapeOf(a);
    if (sa.length <= 1) {
      return a;
    }
    sr = sa.slice(0).reverse();
    psr = [1];
    for (i = _i = 0, _ref1 = sa.length - 1; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
      psr.push(psr[i] * sr[i]);
    }
    r = [];
    rec = function(d, i) {
      var j, _j, _ref2;
      if (d >= sa.length) {
        r.push(a[i]);
      } else {
        for (j = _j = 0, _ref2 = sr[d]; 0 <= _ref2 ? _j < _ref2 : _j > _ref2; j = 0 <= _ref2 ? ++_j : --_j) {
          rec(d + 1, i + j * psr[d]);
        }
      }
      return 0;
    };
    rec(0, 0);
    return withShape(sr, r);
  });

  monadic('↑', 'First', function(a) {
    a = array(a);
    if (a.length) {
      return a[0];
    } else {
      return prototypeOf(a);
    }
  });

  dyadic('↑', 'Take', function(b, a) {
    var filler, i, pa, r, rec, sb, x, _i, _len;
    if (isSimple(a)) {
      a = [a];
    }
    for (_i = 0, _len = a.length; _i < _len; _i++) {
      x = a[_i];
      assert(typeof x === 'number', 'Domain error: Left argument to ↑ must be a numeric scalar or vector.');
    }
    if (isSimple(b) && a.length === 1) {
      b = [b];
    }
    sb = shapeOf(b);
    assert(a.length === sb.length, 'Length error: Left argument to ↑ must have as many elements as is ' + 'the rank of its right argument.');
    r = [];
    pa = (function() {
      var _j, _ref1, _results;
      _results = [];
      for (_j = 0, _ref1 = a.length; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; 0 <= _ref1 ? _j++ : _j--) {
        _results.push(0);
      }
      return _results;
    })();
    pa[a.length - 1] = 1;
    i = a.length - 2;
    while (i >= 0) {
      pa[i] = pa[i + 1] * a[i + 1];
      i--;
    }
    filler = prototypeOf(b);
    rec = function(d, i, k) {
      var j, _j, _k, _l, _m, _ref1, _ref2, _ref3, _ref4, _ref5;
      if (d >= sb.length) {
        r.push(b[i]);
      } else {
        k /= sb[d];
        if (a[d] >= 0) {
          for (j = _j = 0, _ref1 = min(a[d], sb[d]); 0 <= _ref1 ? _j < _ref1 : _j > _ref1; j = 0 <= _ref1 ? ++_j : --_j) {
            rec(d + 1, i + j * k, k);
          }
          if (sb[d] < a[d]) {
            for (_k = 0, _ref2 = (a[d] - sb[d]) * pa[d]; 0 <= _ref2 ? _k < _ref2 : _k > _ref2; 0 <= _ref2 ? _k++ : _k--) {
              r.push(filler);
            }
          }
        } else {
          if (sb[d] + a[d] < 0) {
            for (_l = 0, _ref3 = -(sb[d] + a[d]) * pa[d]; 0 <= _ref3 ? _l < _ref3 : _l > _ref3; 0 <= _ref3 ? _l++ : _l--) {
              r.push(filler);
            }
          }
          for (j = _m = _ref4 = max(0, sb[d] + a[d]), _ref5 = sb[d]; _ref4 <= _ref5 ? _m < _ref5 : _m > _ref5; j = _ref4 <= _ref5 ? ++_m : --_m) {
            rec(d + 1, i + j * k, k);
          }
        }
      }
      return 0;
    };
    rec(0, 0, b.length);
    return withShape((function() {
      var _j, _len1, _results;
      _results = [];
      for (_j = 0, _len1 = a.length; _j < _len1; _j++) {
        x = a[_j];
        _results.push(abs(x));
      }
      return _results;
    })(), withPrototype(filler, r));
  });

  dyadic('↓', 'Drop', function(b, a) {
    var hi, i, lims, lo, r, rec, sb, sr, x, _i, _j, _len, _ref1, _ref2;
    if (isSimple(a)) {
      a = [a];
    }
    for (_i = 0, _len = a.length; _i < _len; _i++) {
      x = a[_i];
      if (typeof x !== 'number' || x !== floor(x)) {
        die('Left argument to ↓ must be an integer or a vector of integers.');
      }
    }
    if (isSimple(b)) {
      b = withShape((function() {
        var _j, _ref1, _results;
        _results = [];
        for (_j = 0, _ref1 = a.length; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; 0 <= _ref1 ? _j++ : _j--) {
          _results.push(1);
        }
        return _results;
      })(), b);
    }
    sb = shapeOf(b);
    if (a.length > sb.length) {
      die('The left argument to ↓ must have length less than or equal to ' + 'the rank of its right argument.');
    }
    for (_j = _ref1 = a.length, _ref2 = sb.length; _ref1 <= _ref2 ? _j < _ref2 : _j > _ref2; _ref1 <= _ref2 ? _j++ : _j--) {
      a.push(0);
    }
    lims = (function() {
      var _k, _ref3, _results;
      _results = [];
      for (i = _k = 0, _ref3 = a.length; 0 <= _ref3 ? _k < _ref3 : _k > _ref3; i = 0 <= _ref3 ? ++_k : --_k) {
        if (a[i] >= 0) {
          _results.push([min(a[i], sb[i]), sb[i]]);
        } else {
          _results.push([0, max(0, sb[i] + a[i])]);
        }
      }
      return _results;
    })();
    r = [];
    rec = function(d, i, n) {
      var j, _k, _ref3, _ref4;
      if (d >= sb.length) {
        r.push(b[i]);
      } else {
        n /= sb[d];
        for (j = _k = _ref3 = lims[d][0], _ref4 = lims[d][1]; _ref3 <= _ref4 ? _k < _ref4 : _k > _ref4; j = _ref3 <= _ref4 ? ++_k : --_k) {
          rec(d + 1, i + j * n, n);
        }
      }
      return 0;
    };
    rec(0, 0, b.length);
    sr = (function() {
      var _k, _len1, _ref3, _results;
      _results = [];
      for (_k = 0, _len1 = lims.length; _k < _len1; _k++) {
        _ref3 = lims[_k], lo = _ref3[0], hi = _ref3[1];
        _results.push(hi - lo);
      }
      return _results;
    })();
    return withShape(sr, r);
  });

  monadic('⊂', 'Enclose', function(a) {
    if (isSimple(a)) {
      return a;
    } else {
      return withShape([], [a]);
    }
  });

  dyadic('⊂', 'Partition (with axis)');

  monadic('⊃', 'Disclose', function(a) {
    var i, r, rec, sa, sr, sr1, sx, x, _i, _j, _k, _len, _len1, _ref1, _ref2;
    if (isSimple(a)) {
      return a;
    }
    sa = shapeOf(a);
    if (sa.length === 0) {
      return a[0];
    }
    sr1 = shapeOf(a[0]).slice(0);
    _ref1 = a.slice(1);
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      x = _ref1[_i];
      sx = shapeOf(x);
      if (sx.length !== sr1.length) {
        die('The argument of ⊃ must contain elements of the same rank.');
      }
      for (i = _j = 0, _ref2 = sr1.length; 0 <= _ref2 ? _j < _ref2 : _j > _ref2; i = 0 <= _ref2 ? ++_j : --_j) {
        sr1[i] = max(sr1[i], sx[i]);
      }
    }
    sr = shapeOf(a).concat(sr1);
    r = [];
    for (_k = 0, _len1 = a.length; _k < _len1; _k++) {
      x = a[_k];
      sx = shapeOf(x);
      rec = function(d, i, n, N) {
        var filler, j, _l, _m, _ref3, _ref4, _results;
        if (d >= sr1.length) {
          return r.push(x[i]);
        } else {
          n /= sx[d];
          N /= sr1[d];
          for (j = _l = 0, _ref3 = sx[d]; 0 <= _ref3 ? _l < _ref3 : _l > _ref3; j = 0 <= _ref3 ? ++_l : --_l) {
            rec(d + 1, i + j * n, n, N);
          }
          if (sr1[d] > sx[d]) {
            filler = prototypeOf(x);
            _results = [];
            for (_m = 0, _ref4 = N * (sr1[d] - sx[d]); 0 <= _ref4 ? _m < _ref4 : _m > _ref4; 0 <= _ref4 ? _m++ : _m--) {
              _results.push(r.push(filler));
            }
            return _results;
          }
        }
      };
      rec(0, 0, x.length, prod(sr1));
    }
    return withShape(sr, r);
  });

  dyadic('⊃', 'Pick');

  dyadic('⌷', 'Index', function(b, a, axes) {
    var a1, axis, d, i, r, rec, sb, sr, x, y, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _len5, _len6, _m, _n, _o, _p, _q, _ref1, _ref2, _ref3, _results, _results1;
    if (axes == null) {
      axes = null;
    }
    if (typeof b === 'function') {
      return function(y, x) {
        return b(y, x, a);
      };
    }
    a = array(a);
    sr = (_ref1 = []).concat.apply(_ref1, a);
    assert(shapeOf(a).length <= 1, 'Indices must be a scalar or a vector, not a higher-dimensional array.');
    sb = shapeOf(b);
    assert(a.length <= sb.length, 'The number of indices must not exceed the rank of the indexable.');
    axes = axes === null ? (function() {
      _results = [];
      for (var _i = 0, _ref2 = a.length; 0 <= _ref2 ? _i < _ref2 : _i > _ref2; 0 <= _ref2 ? _i++ : _i--){ _results.push(_i); }
      return _results;
    }).apply(this) : array(axes);
    assert(shapeOf(axes).length <= 1, 'Axes must be a scalar or a vector, not a higher-dimensional array.');
    assert(a.length === axes.length, 'The number of indices must be equal to the number of axes specified.');
    a1 = (function() {
      var _j, _len, _results1;
      _results1 = [];
      for (_j = 0, _len = sb.length; _j < _len; _j++) {
        x = sb[_j];
        _results1.push(null);
      }
      return _results1;
    })();
    for (i = _j = 0, _len = axes.length; _j < _len; i = ++_j) {
      axis = axes[i];
      assert(typeof axis === 'number' && axis === floor(axis), 'Axes must be integers');
      assert((0 <= axis && axis < sb.length), 'Invalid axis');
      assert(!contains(axes.slice(0, i), axis), 'Duplicate axis');
      a1[axis] = array(a[i]);
    }
    a = a1;
    for (i = _k = 0, _len1 = a.length; _k < _len1; i = ++_k) {
      x = a[i];
      if (x === null) {
        a[i] = (function() {
          _results1 = [];
          for (var _l = 0, _ref3 = sb[i]; 0 <= _ref3 ? _l < _ref3 : _l > _ref3; 0 <= _ref3 ? _l++ : _l--){ _results1.push(_l); }
          return _results1;
        }).apply(this);
      }
    }
    for (d = _m = 0, _len2 = a.length; _m < _len2; d = ++_m) {
      x = a[d];
      for (_n = 0, _len3 = x.length; _n < _len3; _n++) {
        y = x[_n];
        if (!(typeof y === 'number' && y === floor(y))) {
          die('Indices must be integers');
        }
      }
    }
    for (d = _o = 0, _len4 = a.length; _o < _len4; d = ++_o) {
      x = a[d];
      for (_p = 0, _len5 = x.length; _p < _len5; _p++) {
        y = x[_p];
        if (!((0 <= y && y < sb[d]))) {
          die('Index out of bounds');
        }
      }
    }
    sr = [];
    for (_q = 0, _len6 = a.length; _q < _len6; _q++) {
      x = a[_q];
      sr = sr.concat(shapeOf(x));
    }
    r = [];
    rec = function(d, i, n) {
      var _len7, _r, _ref4;
      if (d >= a.length) {
        r.push(b[i]);
      } else {
        _ref4 = a[d];
        for (_r = 0, _len7 = _ref4.length; _r < _len7; _r++) {
          x = _ref4[_r];
          rec(d + 1, i + (x * n / sb[d]), n / sb[d]);
        }
      }
      return 0;
    };
    rec(0, 0, b.length);
    if (sr.length === 0) {
      return r[0];
    } else {
      return withShape(sr, r);
    }
  });

  grade = function(b, a, direction) {
    var h, i, m, n, r, sa, sb, _i, _j, _ref1, _ref2, _results;
    if (a == null) {
      a = [];
    }
    sa = shapeOf(a);
    sb = shapeOf(b);
    assert(sa.length, 'Left argument to ⍋ or ⍒ must be non-scalar.');
    if (sb.length === 0) {
      return b;
    }
    n = sa[sa.length - 1];
    h = {};
    for (i = _i = 0, _ref1 = a.length; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
      h[a[i]] = i % n;
    }
    m = b.length / sb[0];
    r = (function() {
      _results = [];
      for (var _j = 0, _ref2 = sb[0]; 0 <= _ref2 ? _j < _ref2 : _j > _ref2; 0 <= _ref2 ? _j++ : _j--){ _results.push(_j); }
      return _results;
    }).apply(this);
    r.sort(function(i, j) {
      var k, tx, ty, x, y, _k;
      for (k = _k = 0; 0 <= m ? _k < m : _k > m; k = 0 <= m ? ++_k : --_k) {
        x = b[m * i + k];
        y = b[m * j + k];
        tx = typeof x;
        ty = typeof y;
        if (tx < ty) {
          return -direction;
        }
        if (tx > ty) {
          return direction;
        }
        if (h[x] != null) {
          x = h[x];
        }
        if (h[y] != null) {
          y = h[y];
        }
        if (x < y) {
          return -direction;
        }
        if (x > y) {
          return direction;
        }
      }
      return 0;
    });
    return r;
  };

  monadic('⍋', 'Grade up', function(b, a) {
    return grade(b, a, 1);
  });

  monadic('⍒', 'Grade down', function(b, a) {
    return grade(b, a, -1);
  });

  monadic('⊤', 'Encode', function(b, a) {
    var i, isNeg, j, k, m, n, r, sa, sb, x, y, _i, _j, _k, _len, _ref1;
    sa = shapeOf(a);
    sb = shapeOf(b);
    if (isSimple(a)) {
      a = [a];
    }
    if (isSimple(b)) {
      b = [b];
    }
    r = Array(a.length * b.length);
    n = sa.length ? sa[0] : 1;
    m = a.length / n;
    for (i = _i = 0; 0 <= m ? _i < m : _i > m; i = 0 <= m ? ++_i : --_i) {
      for (j = _j = 0, _len = b.length; _j < _len; j = ++_j) {
        y = b[j];
        if (isNeg = y < 0) {
          y = -y;
        }
        for (k = _k = _ref1 = n - 1; _k >= 0; k = _k += -1) {
          x = a[k * m + i];
          if (x === 0) {
            r[(k * m + i) * b.length + j] = y;
            y = 0;
          } else {
            r[(k * m + i) * b.length + j] = y % x;
            y = round((y - (y % x)) / x);
          }
        }
      }
    }
    return withShape(sa.concat(sb), r);
  });

  monadic('⊥', 'Decode', function(b, a) {
    var firstDimB, i, j, k, lastDimA, r, sa, sb, x, y, z, _i, _j, _k, _ref1, _ref2, _ref3;
    sa = shapeOf(a);
    sb = shapeOf(b);
    lastDimA = sa.length ? sa[sa.length - 1] : 1;
    firstDimB = sb.length ? sb[0] : 1;
    assert(lastDimA === 1 || firstDimB === 1 || lastDimA === firstDimB, 'Incompatible shapes for ⊥ ("Decode")');
    if (isSimple(a)) {
      a = [a];
    }
    if (isSimple(b)) {
      b = [b];
    }
    r = [];
    for (i = _i = 0, _ref1 = a.length / lastDimA; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
      for (j = _j = 0, _ref2 = b.length / firstDimB; 0 <= _ref2 ? _j < _ref2 : _j > _ref2; j = 0 <= _ref2 ? ++_j : --_j) {
        x = a.slice(i * lastDimA, (i + 1) * lastDimA);
        y = (function() {
          var _k, _results;
          _results = [];
          for (k = _k = 0; 0 <= firstDimB ? _k < firstDimB : _k > firstDimB; k = 0 <= firstDimB ? ++_k : --_k) {
            _results.push(b[j + k * (b.length / firstDimB)]);
          }
          return _results;
        })();
        if (x.length === 1) {
          x = (function() {
            var _k, _ref3, _results;
            _results = [];
            for (_k = 0, _ref3 = y.length; 0 <= _ref3 ? _k < _ref3 : _k > _ref3; 0 <= _ref3 ? _k++ : _k--) {
              _results.push(x[0]);
            }
            return _results;
          })();
        }
        if (y.length === 1) {
          y = (function() {
            var _k, _ref3, _results;
            _results = [];
            for (_k = 0, _ref3 = x.length; 0 <= _ref3 ? _k < _ref3 : _k > _ref3; 0 <= _ref3 ? _k++ : _k--) {
              _results.push(y[0]);
            }
            return _results;
          })();
        }
        z = y[0];
        for (k = _k = 1, _ref3 = y.length; 1 <= _ref3 ? _k < _ref3 : _k > _ref3; k = 1 <= _ref3 ? ++_k : --_k) {
          z = z * x[k] + y[k];
        }
        r.push(z);
      }
    }
    if (sa.length <= 1 && sb.length <= 1) {
      return r[0];
    } else {
      return withShape(sa.slice(0, -1).concat(sb.slice(1)), r);
    }
  });

  monadic('⍕', 'Format', function(b) {
    var t;
    t = formatter.format(b);
    return withShape([t.length, t[0].length], t.join('').split(''));
  });

  dyadic('⍕', 'Format by example or specification');

  monadic('⍎', 'Execute', function(b) {
    var c, s, _i, _len, _ref1;
    s = '';
    _ref1 = array(b);
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      c = _ref1[_i];
      assert(typeof c === 'string', 'The argument to ⍎ must be a character or a string.');
      s += c;
    }
    return require('./compiler').exec(s);
  });

  monadic('⊣', 'Stop', function(b) {
    return [];
  });

  dyadic('⊣', 'Left', function(b, a) {
    return a;
  });

  monadic('⊢', 'Pass', function(b) {
    return b;
  });

  dyadic('⊢', 'Right', function(b, a) {
    return b;
  });

  vocabulary['get_⍬'] = function() {
    return [];
  };

  vocabulary['set_⍬'] = function() {
    return die('Symbol zilde (⍬) is read-only.');
  };

  vocabulary['get_⎕IO'] = function() {
    return 0;
  };

  vocabulary['set_⎕IO'] = function(x) {
    if (x !== 0) {
      throw Error('The index origin (⎕IO) is fixed at 0');
    } else {
      return x;
    }
  };

  reduce = function(f, _, axis) {
    if (axis == null) {
      axis = -1;
    }
    return function(b, a) {
      var i, invokedAsMonadic, isBackwards, items, j, k, n, r, sItem, sb, x, _i, _j, _ref1;
      invokedAsMonadic = a == null;
      if (invokedAsMonadic) {
        a = 0;
      }
      a = floor(num(a));
      isBackwards = a < 0;
      if (isBackwards) {
        a = -a;
      }
      b = isSimple(b) ? [b] : b;
      sb = shapeOf(b);
      if (axis < 0) {
        axis += sb.length;
      }
      assert((0 <= axis && axis < sb.length), 'Invalid axis');
      n = sb[axis];
      if (a === 0) {
        a = n;
      }
      if (sb.length === 1) {
        items = b;
      } else {
        sItem = sb.slice(0, axis).concat(sb.slice(axis + 1));
        k = prod(sb.slice(axis + 1));
        items = (function() {
          var _i, _results;
          _results = [];
          for (_i = 0; 0 <= n ? _i < n : _i > n; 0 <= n ? _i++ : _i--) {
            _results.push([]);
          }
          return _results;
        })();
        for (i = _i = 0, _ref1 = b.length; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
          items[floor(i / k) % n].push(b[i]);
        }
        for (i = _j = 0; 0 <= n ? _j < n : _j > n; i = 0 <= n ? ++_j : --_j) {
          items[i] = withShape(sItem, items[i]);
        }
      }
      r = (function() {
        var _k, _l, _m, _n, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _results, _results1;
        if (isBackwards) {
          _results = [];
          for (i = _k = 0, _ref2 = n - a + 1; 0 <= _ref2 ? _k < _ref2 : _k > _ref2; i = 0 <= _ref2 ? ++_k : --_k) {
            x = items[i + a - 1];
            for (j = _l = _ref3 = i + a - 2, _ref4 = i - 1; _l > _ref4; j = _l += -1) {
              x = f(items[j], x);
            }
            _results.push(x);
          }
          return _results;
        } else {
          _results1 = [];
          for (i = _m = 0, _ref5 = n - a + 1; 0 <= _ref5 ? _m < _ref5 : _m > _ref5; i = 0 <= _ref5 ? ++_m : --_m) {
            x = items[i];
            for (j = _n = _ref6 = i + 1, _ref7 = i + a; _n < _ref7; j = _n += 1) {
              x = f(items[j], x);
            }
            _results1.push(x);
          }
          return _results1;
        }
      })();
      if (invokedAsMonadic) {
        return r[0];
      } else {
        return r;
      }
    };
  };

  compressOrReplicate = function(b, a, axis) {
    var filler, i, isExpansive, isExtensive, isHyperexpansive, j, k, nNonNegative, ni, nj, nk, r, sb, sr, x, _i, _j, _k, _l, _len, _len1, _m, _n, _ref1;
    if (axis == null) {
      axis = -1;
    }
    if (isSimple(b)) {
      b = [b];
    }
    sb = shapeOf(b);
    if (axis < 0) {
      axis += sb.length;
    }
    assert((0 <= axis && axis < sb.length), 'Axis out of bounds');
    sr = sb.slice(0);
    sr[axis] = 0;
    assert(shapeOf(a).length <= 1, 'Left argument to / must be an integer or a vector of integers');
    if (!a.length) {
      a = (function() {
        var _i, _ref1, _results;
        _results = [];
        for (_i = 0, _ref1 = sb[axis]; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; 0 <= _ref1 ? _i++ : _i--) {
          _results.push(a);
        }
        return _results;
      })();
    }
    nNonNegative = 0;
    for (_i = 0, _len = a.length; _i < _len; _i++) {
      x = a[_i];
      assert(typeof x === 'number' && x === floor(x, 'Left argument to / must be an integer or a vector of integers'));
      sr[axis] += abs(x);
      nNonNegative += x >= 0;
    }
    isExtensive = true;
    isExpansive = isHyperexpansive = false;
    if (sb[axis] !== 1) {
      isExtensive = false;
      isExpansive = a.length === sb[axis];
      isHyperexpansive = !isExpansive;
      assert((!isHyperexpansive) || nNonNegative === sb[axis], 'For A/B, the length of B along the selected axis ' + 'must be equal either to one, ' + 'or the length of A, ' + 'or to the number of non-negative elements in A.');
    }
    r = [];
    ni = prod(sb.slice(0, axis));
    nj = sb[axis];
    nk = prod(sb.slice(axis + 1));
    for (i = _j = 0; 0 <= ni ? _j < ni : _j > ni; i = 0 <= ni ? ++_j : --_j) {
      j = 0;
      for (_k = 0, _len1 = a.length; _k < _len1; _k++) {
        x = a[_k];
        if (x > 0) {
          for (_l = 0; 0 <= x ? _l < x : _l > x; 0 <= x ? _l++ : _l--) {
            for (k = _m = 0; 0 <= nk ? _m < nk : _m > nk; k = 0 <= nk ? ++_m : --_m) {
              r.push(b[k + nk * (j + nj * i)]);
            }
          }
          j += isExpansive || isHyperexpansive;
        } else {
          filler = prototypeOf(isExpansive ? [b[nk * (j + nj * i)]] : [b[nk * nj * i]]);
          for (_n = 0, _ref1 = -x * nk; 0 <= _ref1 ? _n < _ref1 : _n > _ref1; 0 <= _ref1 ? _n++ : _n--) {
            r.push(filler);
          }
          j += isExpansive;
        }
      }
    }
    return withShape(sr, r);
  };

  postfixAdverb('/', 'Reduce, compress, or replicate', function(b, a, axis) {
    if (axis == null) {
      axis = -1;
    }
    if (typeof b === 'function') {
      return reduce(b, void 0, axis);
    } else {
      return compressOrReplicate(b, a, axis);
    }
  });

  postfixAdverb('⌿', '1st axis reduce, compress, or replicate', function(b, a, axis) {
    if (axis == null) {
      axis = 0;
    }
    if (typeof b === 'function') {
      return reduce(b, void 0, axis);
    } else {
      return compressOrReplicate(b, a, axis);
    }
  });

  scan = function(f, _, axis) {
    if (axis == null) {
      axis = -1;
    }
    return function(b, a) {
      var i, ijk, j, k, ni, nj, nk, r, sb, t, x, _i, _j, _k, _l, _ref1;
      assert(a == null, 'Scan can only be applied monadically.');
      sb = shapeOf(b);
      if (sb.length === 0) {
        return b;
      }
      if (axis < 0) {
        axis += sb.length;
      }
      assert((0 <= axis && axis < sb.length), 'Invalid axis');
      r = Array(b.length);
      ni = prod(sb.slice(0, axis));
      nj = sb[axis];
      nk = prod(sb.slice(axis + 1));
      for (i = _i = 0; 0 <= ni ? _i < ni : _i > ni; i = 0 <= ni ? ++_i : --_i) {
        for (k = _j = 0; 0 <= nk ? _j < nk : _j > nk; k = 0 <= nk ? ++_j : --_j) {
          for (j = _k = 0; 0 <= nj ? _k < nj : _k > nj; j = 0 <= nj ? ++_k : --_k) {
            ijk = (i * nj + j) * nk + k;
            x = b[ijk];
            for (t = _l = _ref1 = j - 1; _l >= 0; t = _l += -1) {
              x = f(x, b[(i * nj + t) * nk + k]);
            }
            r[ijk] = x;
          }
        }
      }
      return withShape(shapeOf(b), r);
    };
  };

  expand = function() {};

  postfixAdverb('\\', 'Scan or expand', function(b, a, axis) {
    if (axis == null) {
      axis = -1;
    }
    if (typeof b === 'function') {
      return scan(b, void 0, axis);
    } else {
      return expand(b, a, axis);
    }
  });

  postfixAdverb('⍀', '1st axis scan or expand', function(b, a, axis) {
    if (axis == null) {
      axis = 0;
    }
    if (typeof b === 'function') {
      return scan(b, void 0, axis);
    } else {
      return expand(b, a, axis);
    }
  });

  postfixAdverb('¨', 'Each', function(f) {
    return function(b, a) {
      var i, x;
      if (a == null) {
        return withShape(shapeOf(b), (function() {
          var _i, _len, _ref1, _results;
          _ref1 = array(b);
          _results = [];
          for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
            x = _ref1[_i];
            _results.push(f(x));
          }
          return _results;
        })());
      }
      if (isSimple(a)) {
        return withShape(shapeOf(b), (function() {
          var _i, _len, _ref1, _results;
          _ref1 = array(b);
          _results = [];
          for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
            x = _ref1[_i];
            _results.push(f(x, a));
          }
          return _results;
        })());
      }
      if (match(shapeOf(a), shapeOf(b))) {
        return withShape(shapeOf(b), (function() {
          var _i, _ref1, _results;
          _results = [];
          for (i = _i = 0, _ref1 = a.length; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
            _results.push(f(b[i], a[i]));
          }
          return _results;
        })());
      }
      if (a.length === 1) {
        return withShape(shapeOf(b), (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = b.length; _i < _len; _i++) {
            x = b[_i];
            _results.push(f(x, a[0]));
          }
          return _results;
        })());
      }
      if (b.length === 1) {
        return withShape(shapeOf(a), (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = a.length; _i < _len; _i++) {
            x = a[_i];
            _results.push(f(b[0], x));
          }
          return _results;
        })());
      }
      return die('Length error');
    };
  });

  prefixAdverb('∘.', 'Outer product', outerProduct = function(f) {
    assert(typeof f === 'function');
    return function(b, a) {
      var r, x, y, _i, _j, _len, _len1;
      assert(a != null, 'Adverb ∘. (Outer product) can be applied to dyadic verbs only');
      a = array(a);
      b = array(b);
      r = [];
      for (_i = 0, _len = a.length; _i < _len; _i++) {
        x = a[_i];
        for (_j = 0, _len1 = b.length; _j < _len1; _j++) {
          y = b[_j];
          r.push(f(y, x));
        }
      }
      return withShape((shapeOf(a)).concat(shapeOf(b)), r);
    };
  });

  conjunction('.', 'Inner product', function(g, f) {
    var F;
    F = reduce(f);
    return function(b, a) {
      assert(shapeOf(a).length <= 1 && shapeOf(b).length <= 1, 'Inner product (.) is implemented only for ' + 'arrays of rank no more than 1.');
      return F(g(b, a));
    };
  });

  conjunction('⍣', 'Power operator', function(g, f) {
    var h;
    if (typeof f === 'number' && typeof g === 'function') {
      h = f;
      f = g;
      g = h;
    } else {
      assert(typeof f === 'function');
    }
    if (typeof g === 'number') {
      return function(y, x) {
        var _i;
        for (_i = 0; 0 <= g ? _i < g : _i > g; 0 <= g ? _i++ : _i--) {
          y = f(y, x);
        }
        return y;
      };
    } else {
      return function(y, x) {
        var y1;
        while (true) {
          y1 = f(y, x);
          if (g(y, y1)) {
            return y;
          }
          y = y1;
        }
      };
    }
  });

  postfixAdverb('⍨', 'Commute', function(f) {
    assert(typeof f === 'function');
    return function(b, a) {
      if (a != null) {
        return f(a, b);
      } else {
        return f(b);
      }
    };
  });

  vocabulary['set_⎕'] = function(x) {
    process.stdout.write(require('./formatter').format(x).join('\n') + '\n');
    return x;
  };

  vocabulary['get_⎕'] = function() {
    return die('Reading from ⎕ is not implemented.');
  };

  vocabulary['set_⍞'] = function(x) {
    process.stdout.write(require('./formatter').format(x).join('\n'));
    return x;
  };

  vocabulary['get_⍞'] = function() {
    return die('Reading from ⍞ is not implemented.');
  };

  vocabulary['⎕aplify'] = function(x) {
    assert(x !== null);
    assert(typeof x !== 'undefined');
    if (typeof x === 'string' && x.length !== 1) {
      x = withPrototype(' ', x.split(''));
    }
    return x;
  };

  vocabulary['⎕bool'] = bool;

  vocabulary['⎕complex'] = require('./complex').Complex;

  vocabulary['⎕hook'] = function(g, f) {
    assert(typeof f === 'function');
    assert(typeof g === 'function');
    return function(b, a) {
      return f(g(b), a != null ? a : b);
    };
  };

  vocabulary['⎕fork'] = function(verbs) {
    var f, _i, _len;
    assert(verbs.length % 2 === 1);
    assert(verbs.length >= 3);
    for (_i = 0, _len = verbs.length; _i < _len; _i++) {
      f = verbs[_i];
      assert(typeof f === 'function');
    }
    return function(b, a) {
      var i, r, _j, _ref1;
      r = verbs[verbs.length - 1](b, a);
      for (i = _j = _ref1 = verbs.length - 2; _j > 0; i = _j += -2) {
        r = verbs[i](r, verbs[i - 1](b, a));
      }
      return r;
    };
  };

  endOfVocabulary();

  (function() {
    var k, v, _results;
    _results = [];
    for (k in vocabulary) {
      v = vocabulary[k];
      _results.push(exports[k] = v);
    }
    return _results;
  })();

}).call(this);

  return exports;
});defModule('./formatter', function (exports, require) {
  (function() {
  var format, isSimple, prod, repeat, shapeOf, _ref;

  _ref = require('./helpers'), isSimple = _ref.isSimple, shapeOf = _ref.shapeOf, prod = _ref.prod, repeat = _ref.repeat;

  exports.format = format = function(a) {
    var bottom, box, c, cols, d, grid, i, j, k, left, nCols, nRows, r, result, right, rows, sa, step, t, x, _i, _j, _k, _l, _len, _len1, _len2, _m, _n, _o, _p, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8;
    if (typeof a === 'undefined') {
      return ['undefined'];
    } else if (a === null) {
      return ['null'];
    } else if (typeof a === 'string') {
      return [a];
    } else if (typeof a === 'number') {
      return [('' + a).replace(/-|Infinity/g, '¯')];
    } else if (typeof a === 'function') {
      return ['function'];
    } else if (isSimple(a)) {
      return ['' + a];
    } else if (a.length === 0) {
      return [''];
    } else {
      sa = shapeOf(a);
      if (!sa.length) {
        return format(a[0]);
      }
      nRows = prod(sa.slice(0, sa.length - 1));
      nCols = sa[sa.length - 1];
      rows = (function() {
        var _i, _results;
        _results = [];
        for (_i = 0; 0 <= nRows ? _i < nRows : _i > nRows; 0 <= nRows ? _i++ : _i--) {
          _results.push({
            height: 0,
            bottomMargin: 0
          });
        }
        return _results;
      })();
      cols = (function() {
        var _i, _results;
        _results = [];
        for (_i = 0; 0 <= nCols ? _i < nCols : _i > nCols; 0 <= nCols ? _i++ : _i--) {
          _results.push({
            type: 0,
            width: 0,
            leftMargin: 0,
            rightMargin: 0
          });
        }
        return _results;
      })();
      grid = (function() {
        var _i, _len, _results;
        _results = [];
        for (i = _i = 0, _len = rows.length; _i < _len; i = ++_i) {
          r = rows[i];
          _results.push((function() {
            var _j, _len1, _results1;
            _results1 = [];
            for (j = _j = 0, _len1 = cols.length; _j < _len1; j = ++_j) {
              c = cols[j];
              x = a[nCols * i + j];
              box = format(x);
              r.height = Math.max(r.height, box.length);
              c.width = Math.max(c.width, box[0].length);
              c.type = Math.max(c.type, typeof x === 'string' && x.length === 1 ? 0 : x.length == null ? 1 : 2);
              _results1.push(box);
            }
            return _results1;
          })());
        }
        return _results;
      })();
      step = 1;
      for (d = _i = _ref1 = sa.length - 2; _i >= 1; d = _i += -1) {
        step *= sa[d];
        for (i = _j = _ref2 = step - 1, _ref3 = nRows - 1; step > 0 ? _j < _ref3 : _j > _ref3; i = _j += step) {
          rows[i].bottomMargin++;
        }
      }
      for (j = _k = 0, _len = cols.length; _k < _len; j = ++_k) {
        c = cols[j];
        if (j !== nCols - 1 && !((c.type === (_ref4 = cols[j + 1].type) && _ref4 === 0))) {
          c.rightMargin++;
        }
        if (c.type === 2) {
          c.leftMargin++;
          c.rightMargin++;
        }
      }
      result = [];
      for (i = _l = 0, _len1 = rows.length; _l < _len1; i = ++_l) {
        r = rows[i];
        for (j = _m = 0, _len2 = cols.length; _m < _len2; j = ++_m) {
          c = cols[j];
          t = grid[i][j];
          if (c.type === 1) {
            left = repeat(' ', c.leftMargin + c.width - t[0].length);
            right = repeat(' ', c.rightMargin);
          } else {
            left = repeat(' ', c.leftMargin);
            right = repeat(' ', c.rightMargin + c.width - t[0].length);
          }
          for (k = _n = 0, _ref5 = t.length; 0 <= _ref5 ? _n < _ref5 : _n > _ref5; k = 0 <= _ref5 ? ++_n : --_n) {
            t[k] = left + t[k] + right;
          }
          bottom = repeat(' ', t[0].length);
          for (_o = _ref6 = t.length, _ref7 = r.height + r.bottomMargin; _ref6 <= _ref7 ? _o < _ref7 : _o > _ref7; _ref6 <= _ref7 ? _o++ : _o--) {
            t.push(bottom);
          }
        }
        for (k = _p = 0, _ref8 = r.height + r.bottomMargin; 0 <= _ref8 ? _p < _ref8 : _p > _ref8; k = 0 <= _ref8 ? ++_p : --_p) {
          result.push(((function() {
            var _q, _results;
            _results = [];
            for (j = _q = 0; 0 <= nCols ? _q < nCols : _q > nCols; j = 0 <= nCols ? ++_q : --_q) {
              _results.push(grid[i][j][k]);
            }
            return _results;
          })()).join(''));
        }
      }
      return result;
    }
  };

}).call(this);

  return exports;
});// Generated code, do not edit
window.examples = [
  ["rho-iota","⍝  ⍳ n  generates a list of numbers from 0 to n−1\n⍝  n n ⍴ A  arranges the elements of A in an n×n matrix\n\n5 5 ⍴ ⍳ 25"],
  ["mult","⍝ Multiplication table\n⍝  a × b    scalar multiplication, \"a times b\"\n⍝  ∘.       is the \"outer product\" operator\n⍝  A ∘.× B  every item in A times every item in B\n(⍳ 10) ∘.× ⍳ 10"],
  ["sierpinski","⍝ Sierpinski's triangle\n\n⍝ It's a recursively defined figure.\n⍝ We will use the following definition:\n⍝\n⍝   * the Sierpinski triangle of rank 0 is a one-by-one matrix 'X'\n⍝\n⍝   * if S is the triangle of rank n, then rank n+1 would be\n⍝     the two-dimensional catenation:\n⍝             S 0\n⍝             S S\n⍝     where \"0\" is an all-blank matrix same size as S.\n\nf ← {(⍵,(⍴⍵)⍴0)⍪⍵,⍵}\nS ← {' #'[(f⍣⍵) 1 1 ⍴ 1]}\nS 5"],
  ["erato","⍝ Sieve of Eratosthenes\n(2=+⌿0=A∘.∣A)/A←⍳200"],
  ["life","⍝ Conway's game of life\n\n⍝ This example was inspired by the impressive demo at\n⍝ http://www.youtube.com/watch?v=a9xAKttWgP4\n\n⍝ Create a matrix:\n⍝     0 1 1\n⍝     1 1 0\n⍝     0 1 0\ncreature ← (3 3 ⍴ ⍳ 9) ∈ 1 2 3 4 7   ⍝ Original creature from demo\ncreature ← (3 3 ⍴ ⍳ 9) ∈ 1 3 6 7 8   ⍝ Glider\n\n⍝ Place the creature on a larger board, near the centre\nboard ← ¯1 ⊖ ¯2 ⌽ 5 7 ↑ creature\n\n⍝ A function to move from one generation to the next\nlife ← {∨/ 1 ⍵ ∧ 3 4 = ⊂+/ +⌿ 1 0 ¯1 ∘.⊖ 1 0 ¯1 ⌽¨ ⊂⍵}\n\n⍝ Compute n-th generation and format it as a\n⍝ character matrix\ngen ← {' #'[(life ⍣ ⍵) board]}\n\n⍝ Show first three generations\n(gen 1) (gen 2) (gen 3)"],
  ["langton","⍝ Langton's ant\n⍝\n⍝ It lives in an infinite boolean matrix and has a position and a direction\n⍝ (north, south, east, or west).  At every step the ant:\n⍝   * turns left or right depending on whether the occupied cell is true or false\n⍝   * inverts the value of the occupied cell\n⍝   * moves one cell forward\n⍝\n⍝ In this program, we use a finite matrix with torus topology, and we keep the\n⍝ ant in the centre, pointing upwards (north), rotating the whole matrix\n⍝ instead.\n\nm ← 5\nn ← 1+2×m\n\nA0 ← (−m) ⊖ (−m) ⌽ n n ↑ 1 1 ⍴ 1\nnext ← {0≠A0−¯1⊖⌽[⍵[m;m]]⍉⍵}\n\n' #'[(next⍣300) A0]"]
];/*! jQuery v1.9.1 | (c) 2005, 2012 jQuery Foundation, Inc. | jquery.org/license
//@ sourceMappingURL=jquery.min.map
*/(function(e,t){var n,r,i=typeof t,o=e.document,a=e.location,s=e.jQuery,u=e.$,l={},c=[],p="1.9.1",f=c.concat,d=c.push,h=c.slice,g=c.indexOf,m=l.toString,y=l.hasOwnProperty,v=p.trim,b=function(e,t){return new b.fn.init(e,t,r)},x=/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source,w=/\S+/g,T=/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,N=/^(?:(<[\w\W]+>)[^>]*|#([\w-]*))$/,C=/^<(\w+)\s*\/?>(?:<\/\1>|)$/,k=/^[\],:{}\s]*$/,E=/(?:^|:|,)(?:\s*\[)+/g,S=/\\(?:["\\\/bfnrt]|u[\da-fA-F]{4})/g,A=/"[^"\\\r\n]*"|true|false|null|-?(?:\d+\.|)\d+(?:[eE][+-]?\d+|)/g,j=/^-ms-/,D=/-([\da-z])/gi,L=function(e,t){return t.toUpperCase()},H=function(e){(o.addEventListener||"load"===e.type||"complete"===o.readyState)&&(q(),b.ready())},q=function(){o.addEventListener?(o.removeEventListener("DOMContentLoaded",H,!1),e.removeEventListener("load",H,!1)):(o.detachEvent("onreadystatechange",H),e.detachEvent("onload",H))};b.fn=b.prototype={jquery:p,constructor:b,init:function(e,n,r){var i,a;if(!e)return this;if("string"==typeof e){if(i="<"===e.charAt(0)&&">"===e.charAt(e.length-1)&&e.length>=3?[null,e,null]:N.exec(e),!i||!i[1]&&n)return!n||n.jquery?(n||r).find(e):this.constructor(n).find(e);if(i[1]){if(n=n instanceof b?n[0]:n,b.merge(this,b.parseHTML(i[1],n&&n.nodeType?n.ownerDocument||n:o,!0)),C.test(i[1])&&b.isPlainObject(n))for(i in n)b.isFunction(this[i])?this[i](n[i]):this.attr(i,n[i]);return this}if(a=o.getElementById(i[2]),a&&a.parentNode){if(a.id!==i[2])return r.find(e);this.length=1,this[0]=a}return this.context=o,this.selector=e,this}return e.nodeType?(this.context=this[0]=e,this.length=1,this):b.isFunction(e)?r.ready(e):(e.selector!==t&&(this.selector=e.selector,this.context=e.context),b.makeArray(e,this))},selector:"",length:0,size:function(){return this.length},toArray:function(){return h.call(this)},get:function(e){return null==e?this.toArray():0>e?this[this.length+e]:this[e]},pushStack:function(e){var t=b.merge(this.constructor(),e);return t.prevObject=this,t.context=this.context,t},each:function(e,t){return b.each(this,e,t)},ready:function(e){return b.ready.promise().done(e),this},slice:function(){return this.pushStack(h.apply(this,arguments))},first:function(){return this.eq(0)},last:function(){return this.eq(-1)},eq:function(e){var t=this.length,n=+e+(0>e?t:0);return this.pushStack(n>=0&&t>n?[this[n]]:[])},map:function(e){return this.pushStack(b.map(this,function(t,n){return e.call(t,n,t)}))},end:function(){return this.prevObject||this.constructor(null)},push:d,sort:[].sort,splice:[].splice},b.fn.init.prototype=b.fn,b.extend=b.fn.extend=function(){var e,n,r,i,o,a,s=arguments[0]||{},u=1,l=arguments.length,c=!1;for("boolean"==typeof s&&(c=s,s=arguments[1]||{},u=2),"object"==typeof s||b.isFunction(s)||(s={}),l===u&&(s=this,--u);l>u;u++)if(null!=(o=arguments[u]))for(i in o)e=s[i],r=o[i],s!==r&&(c&&r&&(b.isPlainObject(r)||(n=b.isArray(r)))?(n?(n=!1,a=e&&b.isArray(e)?e:[]):a=e&&b.isPlainObject(e)?e:{},s[i]=b.extend(c,a,r)):r!==t&&(s[i]=r));return s},b.extend({noConflict:function(t){return e.$===b&&(e.$=u),t&&e.jQuery===b&&(e.jQuery=s),b},isReady:!1,readyWait:1,holdReady:function(e){e?b.readyWait++:b.ready(!0)},ready:function(e){if(e===!0?!--b.readyWait:!b.isReady){if(!o.body)return setTimeout(b.ready);b.isReady=!0,e!==!0&&--b.readyWait>0||(n.resolveWith(o,[b]),b.fn.trigger&&b(o).trigger("ready").off("ready"))}},isFunction:function(e){return"function"===b.type(e)},isArray:Array.isArray||function(e){return"array"===b.type(e)},isWindow:function(e){return null!=e&&e==e.window},isNumeric:function(e){return!isNaN(parseFloat(e))&&isFinite(e)},type:function(e){return null==e?e+"":"object"==typeof e||"function"==typeof e?l[m.call(e)]||"object":typeof e},isPlainObject:function(e){if(!e||"object"!==b.type(e)||e.nodeType||b.isWindow(e))return!1;try{if(e.constructor&&!y.call(e,"constructor")&&!y.call(e.constructor.prototype,"isPrototypeOf"))return!1}catch(n){return!1}var r;for(r in e);return r===t||y.call(e,r)},isEmptyObject:function(e){var t;for(t in e)return!1;return!0},error:function(e){throw Error(e)},parseHTML:function(e,t,n){if(!e||"string"!=typeof e)return null;"boolean"==typeof t&&(n=t,t=!1),t=t||o;var r=C.exec(e),i=!n&&[];return r?[t.createElement(r[1])]:(r=b.buildFragment([e],t,i),i&&b(i).remove(),b.merge([],r.childNodes))},parseJSON:function(n){return e.JSON&&e.JSON.parse?e.JSON.parse(n):null===n?n:"string"==typeof n&&(n=b.trim(n),n&&k.test(n.replace(S,"@").replace(A,"]").replace(E,"")))?Function("return "+n)():(b.error("Invalid JSON: "+n),t)},parseXML:function(n){var r,i;if(!n||"string"!=typeof n)return null;try{e.DOMParser?(i=new DOMParser,r=i.parseFromString(n,"text/xml")):(r=new ActiveXObject("Microsoft.XMLDOM"),r.async="false",r.loadXML(n))}catch(o){r=t}return r&&r.documentElement&&!r.getElementsByTagName("parsererror").length||b.error("Invalid XML: "+n),r},noop:function(){},globalEval:function(t){t&&b.trim(t)&&(e.execScript||function(t){e.eval.call(e,t)})(t)},camelCase:function(e){return e.replace(j,"ms-").replace(D,L)},nodeName:function(e,t){return e.nodeName&&e.nodeName.toLowerCase()===t.toLowerCase()},each:function(e,t,n){var r,i=0,o=e.length,a=M(e);if(n){if(a){for(;o>i;i++)if(r=t.apply(e[i],n),r===!1)break}else for(i in e)if(r=t.apply(e[i],n),r===!1)break}else if(a){for(;o>i;i++)if(r=t.call(e[i],i,e[i]),r===!1)break}else for(i in e)if(r=t.call(e[i],i,e[i]),r===!1)break;return e},trim:v&&!v.call("\ufeff\u00a0")?function(e){return null==e?"":v.call(e)}:function(e){return null==e?"":(e+"").replace(T,"")},makeArray:function(e,t){var n=t||[];return null!=e&&(M(Object(e))?b.merge(n,"string"==typeof e?[e]:e):d.call(n,e)),n},inArray:function(e,t,n){var r;if(t){if(g)return g.call(t,e,n);for(r=t.length,n=n?0>n?Math.max(0,r+n):n:0;r>n;n++)if(n in t&&t[n]===e)return n}return-1},merge:function(e,n){var r=n.length,i=e.length,o=0;if("number"==typeof r)for(;r>o;o++)e[i++]=n[o];else while(n[o]!==t)e[i++]=n[o++];return e.length=i,e},grep:function(e,t,n){var r,i=[],o=0,a=e.length;for(n=!!n;a>o;o++)r=!!t(e[o],o),n!==r&&i.push(e[o]);return i},map:function(e,t,n){var r,i=0,o=e.length,a=M(e),s=[];if(a)for(;o>i;i++)r=t(e[i],i,n),null!=r&&(s[s.length]=r);else for(i in e)r=t(e[i],i,n),null!=r&&(s[s.length]=r);return f.apply([],s)},guid:1,proxy:function(e,n){var r,i,o;return"string"==typeof n&&(o=e[n],n=e,e=o),b.isFunction(e)?(r=h.call(arguments,2),i=function(){return e.apply(n||this,r.concat(h.call(arguments)))},i.guid=e.guid=e.guid||b.guid++,i):t},access:function(e,n,r,i,o,a,s){var u=0,l=e.length,c=null==r;if("object"===b.type(r)){o=!0;for(u in r)b.access(e,n,u,r[u],!0,a,s)}else if(i!==t&&(o=!0,b.isFunction(i)||(s=!0),c&&(s?(n.call(e,i),n=null):(c=n,n=function(e,t,n){return c.call(b(e),n)})),n))for(;l>u;u++)n(e[u],r,s?i:i.call(e[u],u,n(e[u],r)));return o?e:c?n.call(e):l?n(e[0],r):a},now:function(){return(new Date).getTime()}}),b.ready.promise=function(t){if(!n)if(n=b.Deferred(),"complete"===o.readyState)setTimeout(b.ready);else if(o.addEventListener)o.addEventListener("DOMContentLoaded",H,!1),e.addEventListener("load",H,!1);else{o.attachEvent("onreadystatechange",H),e.attachEvent("onload",H);var r=!1;try{r=null==e.frameElement&&o.documentElement}catch(i){}r&&r.doScroll&&function a(){if(!b.isReady){try{r.doScroll("left")}catch(e){return setTimeout(a,50)}q(),b.ready()}}()}return n.promise(t)},b.each("Boolean Number String Function Array Date RegExp Object Error".split(" "),function(e,t){l["[object "+t+"]"]=t.toLowerCase()});function M(e){var t=e.length,n=b.type(e);return b.isWindow(e)?!1:1===e.nodeType&&t?!0:"array"===n||"function"!==n&&(0===t||"number"==typeof t&&t>0&&t-1 in e)}r=b(o);var _={};function F(e){var t=_[e]={};return b.each(e.match(w)||[],function(e,n){t[n]=!0}),t}b.Callbacks=function(e){e="string"==typeof e?_[e]||F(e):b.extend({},e);var n,r,i,o,a,s,u=[],l=!e.once&&[],c=function(t){for(r=e.memory&&t,i=!0,a=s||0,s=0,o=u.length,n=!0;u&&o>a;a++)if(u[a].apply(t[0],t[1])===!1&&e.stopOnFalse){r=!1;break}n=!1,u&&(l?l.length&&c(l.shift()):r?u=[]:p.disable())},p={add:function(){if(u){var t=u.length;(function i(t){b.each(t,function(t,n){var r=b.type(n);"function"===r?e.unique&&p.has(n)||u.push(n):n&&n.length&&"string"!==r&&i(n)})})(arguments),n?o=u.length:r&&(s=t,c(r))}return this},remove:function(){return u&&b.each(arguments,function(e,t){var r;while((r=b.inArray(t,u,r))>-1)u.splice(r,1),n&&(o>=r&&o--,a>=r&&a--)}),this},has:function(e){return e?b.inArray(e,u)>-1:!(!u||!u.length)},empty:function(){return u=[],this},disable:function(){return u=l=r=t,this},disabled:function(){return!u},lock:function(){return l=t,r||p.disable(),this},locked:function(){return!l},fireWith:function(e,t){return t=t||[],t=[e,t.slice?t.slice():t],!u||i&&!l||(n?l.push(t):c(t)),this},fire:function(){return p.fireWith(this,arguments),this},fired:function(){return!!i}};return p},b.extend({Deferred:function(e){var t=[["resolve","done",b.Callbacks("once memory"),"resolved"],["reject","fail",b.Callbacks("once memory"),"rejected"],["notify","progress",b.Callbacks("memory")]],n="pending",r={state:function(){return n},always:function(){return i.done(arguments).fail(arguments),this},then:function(){var e=arguments;return b.Deferred(function(n){b.each(t,function(t,o){var a=o[0],s=b.isFunction(e[t])&&e[t];i[o[1]](function(){var e=s&&s.apply(this,arguments);e&&b.isFunction(e.promise)?e.promise().done(n.resolve).fail(n.reject).progress(n.notify):n[a+"With"](this===r?n.promise():this,s?[e]:arguments)})}),e=null}).promise()},promise:function(e){return null!=e?b.extend(e,r):r}},i={};return r.pipe=r.then,b.each(t,function(e,o){var a=o[2],s=o[3];r[o[1]]=a.add,s&&a.add(function(){n=s},t[1^e][2].disable,t[2][2].lock),i[o[0]]=function(){return i[o[0]+"With"](this===i?r:this,arguments),this},i[o[0]+"With"]=a.fireWith}),r.promise(i),e&&e.call(i,i),i},when:function(e){var t=0,n=h.call(arguments),r=n.length,i=1!==r||e&&b.isFunction(e.promise)?r:0,o=1===i?e:b.Deferred(),a=function(e,t,n){return function(r){t[e]=this,n[e]=arguments.length>1?h.call(arguments):r,n===s?o.notifyWith(t,n):--i||o.resolveWith(t,n)}},s,u,l;if(r>1)for(s=Array(r),u=Array(r),l=Array(r);r>t;t++)n[t]&&b.isFunction(n[t].promise)?n[t].promise().done(a(t,l,n)).fail(o.reject).progress(a(t,u,s)):--i;return i||o.resolveWith(l,n),o.promise()}}),b.support=function(){var t,n,r,a,s,u,l,c,p,f,d=o.createElement("div");if(d.setAttribute("className","t"),d.innerHTML="  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>",n=d.getElementsByTagName("*"),r=d.getElementsByTagName("a")[0],!n||!r||!n.length)return{};s=o.createElement("select"),l=s.appendChild(o.createElement("option")),a=d.getElementsByTagName("input")[0],r.style.cssText="top:1px;float:left;opacity:.5",t={getSetAttribute:"t"!==d.className,leadingWhitespace:3===d.firstChild.nodeType,tbody:!d.getElementsByTagName("tbody").length,htmlSerialize:!!d.getElementsByTagName("link").length,style:/top/.test(r.getAttribute("style")),hrefNormalized:"/a"===r.getAttribute("href"),opacity:/^0.5/.test(r.style.opacity),cssFloat:!!r.style.cssFloat,checkOn:!!a.value,optSelected:l.selected,enctype:!!o.createElement("form").enctype,html5Clone:"<:nav></:nav>"!==o.createElement("nav").cloneNode(!0).outerHTML,boxModel:"CSS1Compat"===o.compatMode,deleteExpando:!0,noCloneEvent:!0,inlineBlockNeedsLayout:!1,shrinkWrapBlocks:!1,reliableMarginRight:!0,boxSizingReliable:!0,pixelPosition:!1},a.checked=!0,t.noCloneChecked=a.cloneNode(!0).checked,s.disabled=!0,t.optDisabled=!l.disabled;try{delete d.test}catch(h){t.deleteExpando=!1}a=o.createElement("input"),a.setAttribute("value",""),t.input=""===a.getAttribute("value"),a.value="t",a.setAttribute("type","radio"),t.radioValue="t"===a.value,a.setAttribute("checked","t"),a.setAttribute("name","t"),u=o.createDocumentFragment(),u.appendChild(a),t.appendChecked=a.checked,t.checkClone=u.cloneNode(!0).cloneNode(!0).lastChild.checked,d.attachEvent&&(d.attachEvent("onclick",function(){t.noCloneEvent=!1}),d.cloneNode(!0).click());for(f in{submit:!0,change:!0,focusin:!0})d.setAttribute(c="on"+f,"t"),t[f+"Bubbles"]=c in e||d.attributes[c].expando===!1;return d.style.backgroundClip="content-box",d.cloneNode(!0).style.backgroundClip="",t.clearCloneStyle="content-box"===d.style.backgroundClip,b(function(){var n,r,a,s="padding:0;margin:0;border:0;display:block;box-sizing:content-box;-moz-box-sizing:content-box;-webkit-box-sizing:content-box;",u=o.getElementsByTagName("body")[0];u&&(n=o.createElement("div"),n.style.cssText="border:0;width:0;height:0;position:absolute;top:0;left:-9999px;margin-top:1px",u.appendChild(n).appendChild(d),d.innerHTML="<table><tr><td></td><td>t</td></tr></table>",a=d.getElementsByTagName("td"),a[0].style.cssText="padding:0;margin:0;border:0;display:none",p=0===a[0].offsetHeight,a[0].style.display="",a[1].style.display="none",t.reliableHiddenOffsets=p&&0===a[0].offsetHeight,d.innerHTML="",d.style.cssText="box-sizing:border-box;-moz-box-sizing:border-box;-webkit-box-sizing:border-box;padding:1px;border:1px;display:block;width:4px;margin-top:1%;position:absolute;top:1%;",t.boxSizing=4===d.offsetWidth,t.doesNotIncludeMarginInBodyOffset=1!==u.offsetTop,e.getComputedStyle&&(t.pixelPosition="1%"!==(e.getComputedStyle(d,null)||{}).top,t.boxSizingReliable="4px"===(e.getComputedStyle(d,null)||{width:"4px"}).width,r=d.appendChild(o.createElement("div")),r.style.cssText=d.style.cssText=s,r.style.marginRight=r.style.width="0",d.style.width="1px",t.reliableMarginRight=!parseFloat((e.getComputedStyle(r,null)||{}).marginRight)),typeof d.style.zoom!==i&&(d.innerHTML="",d.style.cssText=s+"width:1px;padding:1px;display:inline;zoom:1",t.inlineBlockNeedsLayout=3===d.offsetWidth,d.style.display="block",d.innerHTML="<div></div>",d.firstChild.style.width="5px",t.shrinkWrapBlocks=3!==d.offsetWidth,t.inlineBlockNeedsLayout&&(u.style.zoom=1)),u.removeChild(n),n=d=a=r=null)}),n=s=u=l=r=a=null,t}();var O=/(?:\{[\s\S]*\}|\[[\s\S]*\])$/,B=/([A-Z])/g;function P(e,n,r,i){if(b.acceptData(e)){var o,a,s=b.expando,u="string"==typeof n,l=e.nodeType,p=l?b.cache:e,f=l?e[s]:e[s]&&s;if(f&&p[f]&&(i||p[f].data)||!u||r!==t)return f||(l?e[s]=f=c.pop()||b.guid++:f=s),p[f]||(p[f]={},l||(p[f].toJSON=b.noop)),("object"==typeof n||"function"==typeof n)&&(i?p[f]=b.extend(p[f],n):p[f].data=b.extend(p[f].data,n)),o=p[f],i||(o.data||(o.data={}),o=o.data),r!==t&&(o[b.camelCase(n)]=r),u?(a=o[n],null==a&&(a=o[b.camelCase(n)])):a=o,a}}function R(e,t,n){if(b.acceptData(e)){var r,i,o,a=e.nodeType,s=a?b.cache:e,u=a?e[b.expando]:b.expando;if(s[u]){if(t&&(o=n?s[u]:s[u].data)){b.isArray(t)?t=t.concat(b.map(t,b.camelCase)):t in o?t=[t]:(t=b.camelCase(t),t=t in o?[t]:t.split(" "));for(r=0,i=t.length;i>r;r++)delete o[t[r]];if(!(n?$:b.isEmptyObject)(o))return}(n||(delete s[u].data,$(s[u])))&&(a?b.cleanData([e],!0):b.support.deleteExpando||s!=s.window?delete s[u]:s[u]=null)}}}b.extend({cache:{},expando:"jQuery"+(p+Math.random()).replace(/\D/g,""),noData:{embed:!0,object:"clsid:D27CDB6E-AE6D-11cf-96B8-444553540000",applet:!0},hasData:function(e){return e=e.nodeType?b.cache[e[b.expando]]:e[b.expando],!!e&&!$(e)},data:function(e,t,n){return P(e,t,n)},removeData:function(e,t){return R(e,t)},_data:function(e,t,n){return P(e,t,n,!0)},_removeData:function(e,t){return R(e,t,!0)},acceptData:function(e){if(e.nodeType&&1!==e.nodeType&&9!==e.nodeType)return!1;var t=e.nodeName&&b.noData[e.nodeName.toLowerCase()];return!t||t!==!0&&e.getAttribute("classid")===t}}),b.fn.extend({data:function(e,n){var r,i,o=this[0],a=0,s=null;if(e===t){if(this.length&&(s=b.data(o),1===o.nodeType&&!b._data(o,"parsedAttrs"))){for(r=o.attributes;r.length>a;a++)i=r[a].name,i.indexOf("data-")||(i=b.camelCase(i.slice(5)),W(o,i,s[i]));b._data(o,"parsedAttrs",!0)}return s}return"object"==typeof e?this.each(function(){b.data(this,e)}):b.access(this,function(n){return n===t?o?W(o,e,b.data(o,e)):null:(this.each(function(){b.data(this,e,n)}),t)},null,n,arguments.length>1,null,!0)},removeData:function(e){return this.each(function(){b.removeData(this,e)})}});function W(e,n,r){if(r===t&&1===e.nodeType){var i="data-"+n.replace(B,"-$1").toLowerCase();if(r=e.getAttribute(i),"string"==typeof r){try{r="true"===r?!0:"false"===r?!1:"null"===r?null:+r+""===r?+r:O.test(r)?b.parseJSON(r):r}catch(o){}b.data(e,n,r)}else r=t}return r}function $(e){var t;for(t in e)if(("data"!==t||!b.isEmptyObject(e[t]))&&"toJSON"!==t)return!1;return!0}b.extend({queue:function(e,n,r){var i;return e?(n=(n||"fx")+"queue",i=b._data(e,n),r&&(!i||b.isArray(r)?i=b._data(e,n,b.makeArray(r)):i.push(r)),i||[]):t},dequeue:function(e,t){t=t||"fx";var n=b.queue(e,t),r=n.length,i=n.shift(),o=b._queueHooks(e,t),a=function(){b.dequeue(e,t)};"inprogress"===i&&(i=n.shift(),r--),o.cur=i,i&&("fx"===t&&n.unshift("inprogress"),delete o.stop,i.call(e,a,o)),!r&&o&&o.empty.fire()},_queueHooks:function(e,t){var n=t+"queueHooks";return b._data(e,n)||b._data(e,n,{empty:b.Callbacks("once memory").add(function(){b._removeData(e,t+"queue"),b._removeData(e,n)})})}}),b.fn.extend({queue:function(e,n){var r=2;return"string"!=typeof e&&(n=e,e="fx",r--),r>arguments.length?b.queue(this[0],e):n===t?this:this.each(function(){var t=b.queue(this,e,n);b._queueHooks(this,e),"fx"===e&&"inprogress"!==t[0]&&b.dequeue(this,e)})},dequeue:function(e){return this.each(function(){b.dequeue(this,e)})},delay:function(e,t){return e=b.fx?b.fx.speeds[e]||e:e,t=t||"fx",this.queue(t,function(t,n){var r=setTimeout(t,e);n.stop=function(){clearTimeout(r)}})},clearQueue:function(e){return this.queue(e||"fx",[])},promise:function(e,n){var r,i=1,o=b.Deferred(),a=this,s=this.length,u=function(){--i||o.resolveWith(a,[a])};"string"!=typeof e&&(n=e,e=t),e=e||"fx";while(s--)r=b._data(a[s],e+"queueHooks"),r&&r.empty&&(i++,r.empty.add(u));return u(),o.promise(n)}});var I,z,X=/[\t\r\n]/g,U=/\r/g,V=/^(?:input|select|textarea|button|object)$/i,Y=/^(?:a|area)$/i,J=/^(?:checked|selected|autofocus|autoplay|async|controls|defer|disabled|hidden|loop|multiple|open|readonly|required|scoped)$/i,G=/^(?:checked|selected)$/i,Q=b.support.getSetAttribute,K=b.support.input;b.fn.extend({attr:function(e,t){return b.access(this,b.attr,e,t,arguments.length>1)},removeAttr:function(e){return this.each(function(){b.removeAttr(this,e)})},prop:function(e,t){return b.access(this,b.prop,e,t,arguments.length>1)},removeProp:function(e){return e=b.propFix[e]||e,this.each(function(){try{this[e]=t,delete this[e]}catch(n){}})},addClass:function(e){var t,n,r,i,o,a=0,s=this.length,u="string"==typeof e&&e;if(b.isFunction(e))return this.each(function(t){b(this).addClass(e.call(this,t,this.className))});if(u)for(t=(e||"").match(w)||[];s>a;a++)if(n=this[a],r=1===n.nodeType&&(n.className?(" "+n.className+" ").replace(X," "):" ")){o=0;while(i=t[o++])0>r.indexOf(" "+i+" ")&&(r+=i+" ");n.className=b.trim(r)}return this},removeClass:function(e){var t,n,r,i,o,a=0,s=this.length,u=0===arguments.length||"string"==typeof e&&e;if(b.isFunction(e))return this.each(function(t){b(this).removeClass(e.call(this,t,this.className))});if(u)for(t=(e||"").match(w)||[];s>a;a++)if(n=this[a],r=1===n.nodeType&&(n.className?(" "+n.className+" ").replace(X," "):"")){o=0;while(i=t[o++])while(r.indexOf(" "+i+" ")>=0)r=r.replace(" "+i+" "," ");n.className=e?b.trim(r):""}return this},toggleClass:function(e,t){var n=typeof e,r="boolean"==typeof t;return b.isFunction(e)?this.each(function(n){b(this).toggleClass(e.call(this,n,this.className,t),t)}):this.each(function(){if("string"===n){var o,a=0,s=b(this),u=t,l=e.match(w)||[];while(o=l[a++])u=r?u:!s.hasClass(o),s[u?"addClass":"removeClass"](o)}else(n===i||"boolean"===n)&&(this.className&&b._data(this,"__className__",this.className),this.className=this.className||e===!1?"":b._data(this,"__className__")||"")})},hasClass:function(e){var t=" "+e+" ",n=0,r=this.length;for(;r>n;n++)if(1===this[n].nodeType&&(" "+this[n].className+" ").replace(X," ").indexOf(t)>=0)return!0;return!1},val:function(e){var n,r,i,o=this[0];{if(arguments.length)return i=b.isFunction(e),this.each(function(n){var o,a=b(this);1===this.nodeType&&(o=i?e.call(this,n,a.val()):e,null==o?o="":"number"==typeof o?o+="":b.isArray(o)&&(o=b.map(o,function(e){return null==e?"":e+""})),r=b.valHooks[this.type]||b.valHooks[this.nodeName.toLowerCase()],r&&"set"in r&&r.set(this,o,"value")!==t||(this.value=o))});if(o)return r=b.valHooks[o.type]||b.valHooks[o.nodeName.toLowerCase()],r&&"get"in r&&(n=r.get(o,"value"))!==t?n:(n=o.value,"string"==typeof n?n.replace(U,""):null==n?"":n)}}}),b.extend({valHooks:{option:{get:function(e){var t=e.attributes.value;return!t||t.specified?e.value:e.text}},select:{get:function(e){var t,n,r=e.options,i=e.selectedIndex,o="select-one"===e.type||0>i,a=o?null:[],s=o?i+1:r.length,u=0>i?s:o?i:0;for(;s>u;u++)if(n=r[u],!(!n.selected&&u!==i||(b.support.optDisabled?n.disabled:null!==n.getAttribute("disabled"))||n.parentNode.disabled&&b.nodeName(n.parentNode,"optgroup"))){if(t=b(n).val(),o)return t;a.push(t)}return a},set:function(e,t){var n=b.makeArray(t);return b(e).find("option").each(function(){this.selected=b.inArray(b(this).val(),n)>=0}),n.length||(e.selectedIndex=-1),n}}},attr:function(e,n,r){var o,a,s,u=e.nodeType;if(e&&3!==u&&8!==u&&2!==u)return typeof e.getAttribute===i?b.prop(e,n,r):(a=1!==u||!b.isXMLDoc(e),a&&(n=n.toLowerCase(),o=b.attrHooks[n]||(J.test(n)?z:I)),r===t?o&&a&&"get"in o&&null!==(s=o.get(e,n))?s:(typeof e.getAttribute!==i&&(s=e.getAttribute(n)),null==s?t:s):null!==r?o&&a&&"set"in o&&(s=o.set(e,r,n))!==t?s:(e.setAttribute(n,r+""),r):(b.removeAttr(e,n),t))},removeAttr:function(e,t){var n,r,i=0,o=t&&t.match(w);if(o&&1===e.nodeType)while(n=o[i++])r=b.propFix[n]||n,J.test(n)?!Q&&G.test(n)?e[b.camelCase("default-"+n)]=e[r]=!1:e[r]=!1:b.attr(e,n,""),e.removeAttribute(Q?n:r)},attrHooks:{type:{set:function(e,t){if(!b.support.radioValue&&"radio"===t&&b.nodeName(e,"input")){var n=e.value;return e.setAttribute("type",t),n&&(e.value=n),t}}}},propFix:{tabindex:"tabIndex",readonly:"readOnly","for":"htmlFor","class":"className",maxlength:"maxLength",cellspacing:"cellSpacing",cellpadding:"cellPadding",rowspan:"rowSpan",colspan:"colSpan",usemap:"useMap",frameborder:"frameBorder",contenteditable:"contentEditable"},prop:function(e,n,r){var i,o,a,s=e.nodeType;if(e&&3!==s&&8!==s&&2!==s)return a=1!==s||!b.isXMLDoc(e),a&&(n=b.propFix[n]||n,o=b.propHooks[n]),r!==t?o&&"set"in o&&(i=o.set(e,r,n))!==t?i:e[n]=r:o&&"get"in o&&null!==(i=o.get(e,n))?i:e[n]},propHooks:{tabIndex:{get:function(e){var n=e.getAttributeNode("tabindex");return n&&n.specified?parseInt(n.value,10):V.test(e.nodeName)||Y.test(e.nodeName)&&e.href?0:t}}}}),z={get:function(e,n){var r=b.prop(e,n),i="boolean"==typeof r&&e.getAttribute(n),o="boolean"==typeof r?K&&Q?null!=i:G.test(n)?e[b.camelCase("default-"+n)]:!!i:e.getAttributeNode(n);return o&&o.value!==!1?n.toLowerCase():t},set:function(e,t,n){return t===!1?b.removeAttr(e,n):K&&Q||!G.test(n)?e.setAttribute(!Q&&b.propFix[n]||n,n):e[b.camelCase("default-"+n)]=e[n]=!0,n}},K&&Q||(b.attrHooks.value={get:function(e,n){var r=e.getAttributeNode(n);return b.nodeName(e,"input")?e.defaultValue:r&&r.specified?r.value:t},set:function(e,n,r){return b.nodeName(e,"input")?(e.defaultValue=n,t):I&&I.set(e,n,r)}}),Q||(I=b.valHooks.button={get:function(e,n){var r=e.getAttributeNode(n);return r&&("id"===n||"name"===n||"coords"===n?""!==r.value:r.specified)?r.value:t},set:function(e,n,r){var i=e.getAttributeNode(r);return i||e.setAttributeNode(i=e.ownerDocument.createAttribute(r)),i.value=n+="","value"===r||n===e.getAttribute(r)?n:t}},b.attrHooks.contenteditable={get:I.get,set:function(e,t,n){I.set(e,""===t?!1:t,n)}},b.each(["width","height"],function(e,n){b.attrHooks[n]=b.extend(b.attrHooks[n],{set:function(e,r){return""===r?(e.setAttribute(n,"auto"),r):t}})})),b.support.hrefNormalized||(b.each(["href","src","width","height"],function(e,n){b.attrHooks[n]=b.extend(b.attrHooks[n],{get:function(e){var r=e.getAttribute(n,2);return null==r?t:r}})}),b.each(["href","src"],function(e,t){b.propHooks[t]={get:function(e){return e.getAttribute(t,4)}}})),b.support.style||(b.attrHooks.style={get:function(e){return e.style.cssText||t},set:function(e,t){return e.style.cssText=t+""}}),b.support.optSelected||(b.propHooks.selected=b.extend(b.propHooks.selected,{get:function(e){var t=e.parentNode;return t&&(t.selectedIndex,t.parentNode&&t.parentNode.selectedIndex),null}})),b.support.enctype||(b.propFix.enctype="encoding"),b.support.checkOn||b.each(["radio","checkbox"],function(){b.valHooks[this]={get:function(e){return null===e.getAttribute("value")?"on":e.value}}}),b.each(["radio","checkbox"],function(){b.valHooks[this]=b.extend(b.valHooks[this],{set:function(e,n){return b.isArray(n)?e.checked=b.inArray(b(e).val(),n)>=0:t}})});var Z=/^(?:input|select|textarea)$/i,et=/^key/,tt=/^(?:mouse|contextmenu)|click/,nt=/^(?:focusinfocus|focusoutblur)$/,rt=/^([^.]*)(?:\.(.+)|)$/;function it(){return!0}function ot(){return!1}b.event={global:{},add:function(e,n,r,o,a){var s,u,l,c,p,f,d,h,g,m,y,v=b._data(e);if(v){r.handler&&(c=r,r=c.handler,a=c.selector),r.guid||(r.guid=b.guid++),(u=v.events)||(u=v.events={}),(f=v.handle)||(f=v.handle=function(e){return typeof b===i||e&&b.event.triggered===e.type?t:b.event.dispatch.apply(f.elem,arguments)},f.elem=e),n=(n||"").match(w)||[""],l=n.length;while(l--)s=rt.exec(n[l])||[],g=y=s[1],m=(s[2]||"").split(".").sort(),p=b.event.special[g]||{},g=(a?p.delegateType:p.bindType)||g,p=b.event.special[g]||{},d=b.extend({type:g,origType:y,data:o,handler:r,guid:r.guid,selector:a,needsContext:a&&b.expr.match.needsContext.test(a),namespace:m.join(".")},c),(h=u[g])||(h=u[g]=[],h.delegateCount=0,p.setup&&p.setup.call(e,o,m,f)!==!1||(e.addEventListener?e.addEventListener(g,f,!1):e.attachEvent&&e.attachEvent("on"+g,f))),p.add&&(p.add.call(e,d),d.handler.guid||(d.handler.guid=r.guid)),a?h.splice(h.delegateCount++,0,d):h.push(d),b.event.global[g]=!0;e=null}},remove:function(e,t,n,r,i){var o,a,s,u,l,c,p,f,d,h,g,m=b.hasData(e)&&b._data(e);if(m&&(c=m.events)){t=(t||"").match(w)||[""],l=t.length;while(l--)if(s=rt.exec(t[l])||[],d=g=s[1],h=(s[2]||"").split(".").sort(),d){p=b.event.special[d]||{},d=(r?p.delegateType:p.bindType)||d,f=c[d]||[],s=s[2]&&RegExp("(^|\\.)"+h.join("\\.(?:.*\\.|)")+"(\\.|$)"),u=o=f.length;while(o--)a=f[o],!i&&g!==a.origType||n&&n.guid!==a.guid||s&&!s.test(a.namespace)||r&&r!==a.selector&&("**"!==r||!a.selector)||(f.splice(o,1),a.selector&&f.delegateCount--,p.remove&&p.remove.call(e,a));u&&!f.length&&(p.teardown&&p.teardown.call(e,h,m.handle)!==!1||b.removeEvent(e,d,m.handle),delete c[d])}else for(d in c)b.event.remove(e,d+t[l],n,r,!0);b.isEmptyObject(c)&&(delete m.handle,b._removeData(e,"events"))}},trigger:function(n,r,i,a){var s,u,l,c,p,f,d,h=[i||o],g=y.call(n,"type")?n.type:n,m=y.call(n,"namespace")?n.namespace.split("."):[];if(l=f=i=i||o,3!==i.nodeType&&8!==i.nodeType&&!nt.test(g+b.event.triggered)&&(g.indexOf(".")>=0&&(m=g.split("."),g=m.shift(),m.sort()),u=0>g.indexOf(":")&&"on"+g,n=n[b.expando]?n:new b.Event(g,"object"==typeof n&&n),n.isTrigger=!0,n.namespace=m.join("."),n.namespace_re=n.namespace?RegExp("(^|\\.)"+m.join("\\.(?:.*\\.|)")+"(\\.|$)"):null,n.result=t,n.target||(n.target=i),r=null==r?[n]:b.makeArray(r,[n]),p=b.event.special[g]||{},a||!p.trigger||p.trigger.apply(i,r)!==!1)){if(!a&&!p.noBubble&&!b.isWindow(i)){for(c=p.delegateType||g,nt.test(c+g)||(l=l.parentNode);l;l=l.parentNode)h.push(l),f=l;f===(i.ownerDocument||o)&&h.push(f.defaultView||f.parentWindow||e)}d=0;while((l=h[d++])&&!n.isPropagationStopped())n.type=d>1?c:p.bindType||g,s=(b._data(l,"events")||{})[n.type]&&b._data(l,"handle"),s&&s.apply(l,r),s=u&&l[u],s&&b.acceptData(l)&&s.apply&&s.apply(l,r)===!1&&n.preventDefault();if(n.type=g,!(a||n.isDefaultPrevented()||p._default&&p._default.apply(i.ownerDocument,r)!==!1||"click"===g&&b.nodeName(i,"a")||!b.acceptData(i)||!u||!i[g]||b.isWindow(i))){f=i[u],f&&(i[u]=null),b.event.triggered=g;try{i[g]()}catch(v){}b.event.triggered=t,f&&(i[u]=f)}return n.result}},dispatch:function(e){e=b.event.fix(e);var n,r,i,o,a,s=[],u=h.call(arguments),l=(b._data(this,"events")||{})[e.type]||[],c=b.event.special[e.type]||{};if(u[0]=e,e.delegateTarget=this,!c.preDispatch||c.preDispatch.call(this,e)!==!1){s=b.event.handlers.call(this,e,l),n=0;while((o=s[n++])&&!e.isPropagationStopped()){e.currentTarget=o.elem,a=0;while((i=o.handlers[a++])&&!e.isImmediatePropagationStopped())(!e.namespace_re||e.namespace_re.test(i.namespace))&&(e.handleObj=i,e.data=i.data,r=((b.event.special[i.origType]||{}).handle||i.handler).apply(o.elem,u),r!==t&&(e.result=r)===!1&&(e.preventDefault(),e.stopPropagation()))}return c.postDispatch&&c.postDispatch.call(this,e),e.result}},handlers:function(e,n){var r,i,o,a,s=[],u=n.delegateCount,l=e.target;if(u&&l.nodeType&&(!e.button||"click"!==e.type))for(;l!=this;l=l.parentNode||this)if(1===l.nodeType&&(l.disabled!==!0||"click"!==e.type)){for(o=[],a=0;u>a;a++)i=n[a],r=i.selector+" ",o[r]===t&&(o[r]=i.needsContext?b(r,this).index(l)>=0:b.find(r,this,null,[l]).length),o[r]&&o.push(i);o.length&&s.push({elem:l,handlers:o})}return n.length>u&&s.push({elem:this,handlers:n.slice(u)}),s},fix:function(e){if(e[b.expando])return e;var t,n,r,i=e.type,a=e,s=this.fixHooks[i];s||(this.fixHooks[i]=s=tt.test(i)?this.mouseHooks:et.test(i)?this.keyHooks:{}),r=s.props?this.props.concat(s.props):this.props,e=new b.Event(a),t=r.length;while(t--)n=r[t],e[n]=a[n];return e.target||(e.target=a.srcElement||o),3===e.target.nodeType&&(e.target=e.target.parentNode),e.metaKey=!!e.metaKey,s.filter?s.filter(e,a):e},props:"altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),fixHooks:{},keyHooks:{props:"char charCode key keyCode".split(" "),filter:function(e,t){return null==e.which&&(e.which=null!=t.charCode?t.charCode:t.keyCode),e}},mouseHooks:{props:"button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement".split(" "),filter:function(e,n){var r,i,a,s=n.button,u=n.fromElement;return null==e.pageX&&null!=n.clientX&&(i=e.target.ownerDocument||o,a=i.documentElement,r=i.body,e.pageX=n.clientX+(a&&a.scrollLeft||r&&r.scrollLeft||0)-(a&&a.clientLeft||r&&r.clientLeft||0),e.pageY=n.clientY+(a&&a.scrollTop||r&&r.scrollTop||0)-(a&&a.clientTop||r&&r.clientTop||0)),!e.relatedTarget&&u&&(e.relatedTarget=u===e.target?n.toElement:u),e.which||s===t||(e.which=1&s?1:2&s?3:4&s?2:0),e}},special:{load:{noBubble:!0},click:{trigger:function(){return b.nodeName(this,"input")&&"checkbox"===this.type&&this.click?(this.click(),!1):t}},focus:{trigger:function(){if(this!==o.activeElement&&this.focus)try{return this.focus(),!1}catch(e){}},delegateType:"focusin"},blur:{trigger:function(){return this===o.activeElement&&this.blur?(this.blur(),!1):t},delegateType:"focusout"},beforeunload:{postDispatch:function(e){e.result!==t&&(e.originalEvent.returnValue=e.result)}}},simulate:function(e,t,n,r){var i=b.extend(new b.Event,n,{type:e,isSimulated:!0,originalEvent:{}});r?b.event.trigger(i,null,t):b.event.dispatch.call(t,i),i.isDefaultPrevented()&&n.preventDefault()}},b.removeEvent=o.removeEventListener?function(e,t,n){e.removeEventListener&&e.removeEventListener(t,n,!1)}:function(e,t,n){var r="on"+t;e.detachEvent&&(typeof e[r]===i&&(e[r]=null),e.detachEvent(r,n))},b.Event=function(e,n){return this instanceof b.Event?(e&&e.type?(this.originalEvent=e,this.type=e.type,this.isDefaultPrevented=e.defaultPrevented||e.returnValue===!1||e.getPreventDefault&&e.getPreventDefault()?it:ot):this.type=e,n&&b.extend(this,n),this.timeStamp=e&&e.timeStamp||b.now(),this[b.expando]=!0,t):new b.Event(e,n)},b.Event.prototype={isDefaultPrevented:ot,isPropagationStopped:ot,isImmediatePropagationStopped:ot,preventDefault:function(){var e=this.originalEvent;this.isDefaultPrevented=it,e&&(e.preventDefault?e.preventDefault():e.returnValue=!1)},stopPropagation:function(){var e=this.originalEvent;this.isPropagationStopped=it,e&&(e.stopPropagation&&e.stopPropagation(),e.cancelBubble=!0)},stopImmediatePropagation:function(){this.isImmediatePropagationStopped=it,this.stopPropagation()}},b.each({mouseenter:"mouseover",mouseleave:"mouseout"},function(e,t){b.event.special[e]={delegateType:t,bindType:t,handle:function(e){var n,r=this,i=e.relatedTarget,o=e.handleObj;
return(!i||i!==r&&!b.contains(r,i))&&(e.type=o.origType,n=o.handler.apply(this,arguments),e.type=t),n}}}),b.support.submitBubbles||(b.event.special.submit={setup:function(){return b.nodeName(this,"form")?!1:(b.event.add(this,"click._submit keypress._submit",function(e){var n=e.target,r=b.nodeName(n,"input")||b.nodeName(n,"button")?n.form:t;r&&!b._data(r,"submitBubbles")&&(b.event.add(r,"submit._submit",function(e){e._submit_bubble=!0}),b._data(r,"submitBubbles",!0))}),t)},postDispatch:function(e){e._submit_bubble&&(delete e._submit_bubble,this.parentNode&&!e.isTrigger&&b.event.simulate("submit",this.parentNode,e,!0))},teardown:function(){return b.nodeName(this,"form")?!1:(b.event.remove(this,"._submit"),t)}}),b.support.changeBubbles||(b.event.special.change={setup:function(){return Z.test(this.nodeName)?(("checkbox"===this.type||"radio"===this.type)&&(b.event.add(this,"propertychange._change",function(e){"checked"===e.originalEvent.propertyName&&(this._just_changed=!0)}),b.event.add(this,"click._change",function(e){this._just_changed&&!e.isTrigger&&(this._just_changed=!1),b.event.simulate("change",this,e,!0)})),!1):(b.event.add(this,"beforeactivate._change",function(e){var t=e.target;Z.test(t.nodeName)&&!b._data(t,"changeBubbles")&&(b.event.add(t,"change._change",function(e){!this.parentNode||e.isSimulated||e.isTrigger||b.event.simulate("change",this.parentNode,e,!0)}),b._data(t,"changeBubbles",!0))}),t)},handle:function(e){var n=e.target;return this!==n||e.isSimulated||e.isTrigger||"radio"!==n.type&&"checkbox"!==n.type?e.handleObj.handler.apply(this,arguments):t},teardown:function(){return b.event.remove(this,"._change"),!Z.test(this.nodeName)}}),b.support.focusinBubbles||b.each({focus:"focusin",blur:"focusout"},function(e,t){var n=0,r=function(e){b.event.simulate(t,e.target,b.event.fix(e),!0)};b.event.special[t]={setup:function(){0===n++&&o.addEventListener(e,r,!0)},teardown:function(){0===--n&&o.removeEventListener(e,r,!0)}}}),b.fn.extend({on:function(e,n,r,i,o){var a,s;if("object"==typeof e){"string"!=typeof n&&(r=r||n,n=t);for(a in e)this.on(a,n,r,e[a],o);return this}if(null==r&&null==i?(i=n,r=n=t):null==i&&("string"==typeof n?(i=r,r=t):(i=r,r=n,n=t)),i===!1)i=ot;else if(!i)return this;return 1===o&&(s=i,i=function(e){return b().off(e),s.apply(this,arguments)},i.guid=s.guid||(s.guid=b.guid++)),this.each(function(){b.event.add(this,e,i,r,n)})},one:function(e,t,n,r){return this.on(e,t,n,r,1)},off:function(e,n,r){var i,o;if(e&&e.preventDefault&&e.handleObj)return i=e.handleObj,b(e.delegateTarget).off(i.namespace?i.origType+"."+i.namespace:i.origType,i.selector,i.handler),this;if("object"==typeof e){for(o in e)this.off(o,n,e[o]);return this}return(n===!1||"function"==typeof n)&&(r=n,n=t),r===!1&&(r=ot),this.each(function(){b.event.remove(this,e,r,n)})},bind:function(e,t,n){return this.on(e,null,t,n)},unbind:function(e,t){return this.off(e,null,t)},delegate:function(e,t,n,r){return this.on(t,e,n,r)},undelegate:function(e,t,n){return 1===arguments.length?this.off(e,"**"):this.off(t,e||"**",n)},trigger:function(e,t){return this.each(function(){b.event.trigger(e,t,this)})},triggerHandler:function(e,n){var r=this[0];return r?b.event.trigger(e,n,r,!0):t}}),function(e,t){var n,r,i,o,a,s,u,l,c,p,f,d,h,g,m,y,v,x="sizzle"+-new Date,w=e.document,T={},N=0,C=0,k=it(),E=it(),S=it(),A=typeof t,j=1<<31,D=[],L=D.pop,H=D.push,q=D.slice,M=D.indexOf||function(e){var t=0,n=this.length;for(;n>t;t++)if(this[t]===e)return t;return-1},_="[\\x20\\t\\r\\n\\f]",F="(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",O=F.replace("w","w#"),B="([*^$|!~]?=)",P="\\["+_+"*("+F+")"+_+"*(?:"+B+_+"*(?:(['\"])((?:\\\\.|[^\\\\])*?)\\3|("+O+")|)|)"+_+"*\\]",R=":("+F+")(?:\\(((['\"])((?:\\\\.|[^\\\\])*?)\\3|((?:\\\\.|[^\\\\()[\\]]|"+P.replace(3,8)+")*)|.*)\\)|)",W=RegExp("^"+_+"+|((?:^|[^\\\\])(?:\\\\.)*)"+_+"+$","g"),$=RegExp("^"+_+"*,"+_+"*"),I=RegExp("^"+_+"*([\\x20\\t\\r\\n\\f>+~])"+_+"*"),z=RegExp(R),X=RegExp("^"+O+"$"),U={ID:RegExp("^#("+F+")"),CLASS:RegExp("^\\.("+F+")"),NAME:RegExp("^\\[name=['\"]?("+F+")['\"]?\\]"),TAG:RegExp("^("+F.replace("w","w*")+")"),ATTR:RegExp("^"+P),PSEUDO:RegExp("^"+R),CHILD:RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\("+_+"*(even|odd|(([+-]|)(\\d*)n|)"+_+"*(?:([+-]|)"+_+"*(\\d+)|))"+_+"*\\)|)","i"),needsContext:RegExp("^"+_+"*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\("+_+"*((?:-\\d)?\\d*)"+_+"*\\)|)(?=[^-]|$)","i")},V=/[\x20\t\r\n\f]*[+~]/,Y=/^[^{]+\{\s*\[native code/,J=/^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,G=/^(?:input|select|textarea|button)$/i,Q=/^h\d$/i,K=/'|\\/g,Z=/\=[\x20\t\r\n\f]*([^'"\]]*)[\x20\t\r\n\f]*\]/g,et=/\\([\da-fA-F]{1,6}[\x20\t\r\n\f]?|.)/g,tt=function(e,t){var n="0x"+t-65536;return n!==n?t:0>n?String.fromCharCode(n+65536):String.fromCharCode(55296|n>>10,56320|1023&n)};try{q.call(w.documentElement.childNodes,0)[0].nodeType}catch(nt){q=function(e){var t,n=[];while(t=this[e++])n.push(t);return n}}function rt(e){return Y.test(e+"")}function it(){var e,t=[];return e=function(n,r){return t.push(n+=" ")>i.cacheLength&&delete e[t.shift()],e[n]=r}}function ot(e){return e[x]=!0,e}function at(e){var t=p.createElement("div");try{return e(t)}catch(n){return!1}finally{t=null}}function st(e,t,n,r){var i,o,a,s,u,l,f,g,m,v;if((t?t.ownerDocument||t:w)!==p&&c(t),t=t||p,n=n||[],!e||"string"!=typeof e)return n;if(1!==(s=t.nodeType)&&9!==s)return[];if(!d&&!r){if(i=J.exec(e))if(a=i[1]){if(9===s){if(o=t.getElementById(a),!o||!o.parentNode)return n;if(o.id===a)return n.push(o),n}else if(t.ownerDocument&&(o=t.ownerDocument.getElementById(a))&&y(t,o)&&o.id===a)return n.push(o),n}else{if(i[2])return H.apply(n,q.call(t.getElementsByTagName(e),0)),n;if((a=i[3])&&T.getByClassName&&t.getElementsByClassName)return H.apply(n,q.call(t.getElementsByClassName(a),0)),n}if(T.qsa&&!h.test(e)){if(f=!0,g=x,m=t,v=9===s&&e,1===s&&"object"!==t.nodeName.toLowerCase()){l=ft(e),(f=t.getAttribute("id"))?g=f.replace(K,"\\$&"):t.setAttribute("id",g),g="[id='"+g+"'] ",u=l.length;while(u--)l[u]=g+dt(l[u]);m=V.test(e)&&t.parentNode||t,v=l.join(",")}if(v)try{return H.apply(n,q.call(m.querySelectorAll(v),0)),n}catch(b){}finally{f||t.removeAttribute("id")}}}return wt(e.replace(W,"$1"),t,n,r)}a=st.isXML=function(e){var t=e&&(e.ownerDocument||e).documentElement;return t?"HTML"!==t.nodeName:!1},c=st.setDocument=function(e){var n=e?e.ownerDocument||e:w;return n!==p&&9===n.nodeType&&n.documentElement?(p=n,f=n.documentElement,d=a(n),T.tagNameNoComments=at(function(e){return e.appendChild(n.createComment("")),!e.getElementsByTagName("*").length}),T.attributes=at(function(e){e.innerHTML="<select></select>";var t=typeof e.lastChild.getAttribute("multiple");return"boolean"!==t&&"string"!==t}),T.getByClassName=at(function(e){return e.innerHTML="<div class='hidden e'></div><div class='hidden'></div>",e.getElementsByClassName&&e.getElementsByClassName("e").length?(e.lastChild.className="e",2===e.getElementsByClassName("e").length):!1}),T.getByName=at(function(e){e.id=x+0,e.innerHTML="<a name='"+x+"'></a><div name='"+x+"'></div>",f.insertBefore(e,f.firstChild);var t=n.getElementsByName&&n.getElementsByName(x).length===2+n.getElementsByName(x+0).length;return T.getIdNotName=!n.getElementById(x),f.removeChild(e),t}),i.attrHandle=at(function(e){return e.innerHTML="<a href='#'></a>",e.firstChild&&typeof e.firstChild.getAttribute!==A&&"#"===e.firstChild.getAttribute("href")})?{}:{href:function(e){return e.getAttribute("href",2)},type:function(e){return e.getAttribute("type")}},T.getIdNotName?(i.find.ID=function(e,t){if(typeof t.getElementById!==A&&!d){var n=t.getElementById(e);return n&&n.parentNode?[n]:[]}},i.filter.ID=function(e){var t=e.replace(et,tt);return function(e){return e.getAttribute("id")===t}}):(i.find.ID=function(e,n){if(typeof n.getElementById!==A&&!d){var r=n.getElementById(e);return r?r.id===e||typeof r.getAttributeNode!==A&&r.getAttributeNode("id").value===e?[r]:t:[]}},i.filter.ID=function(e){var t=e.replace(et,tt);return function(e){var n=typeof e.getAttributeNode!==A&&e.getAttributeNode("id");return n&&n.value===t}}),i.find.TAG=T.tagNameNoComments?function(e,n){return typeof n.getElementsByTagName!==A?n.getElementsByTagName(e):t}:function(e,t){var n,r=[],i=0,o=t.getElementsByTagName(e);if("*"===e){while(n=o[i++])1===n.nodeType&&r.push(n);return r}return o},i.find.NAME=T.getByName&&function(e,n){return typeof n.getElementsByName!==A?n.getElementsByName(name):t},i.find.CLASS=T.getByClassName&&function(e,n){return typeof n.getElementsByClassName===A||d?t:n.getElementsByClassName(e)},g=[],h=[":focus"],(T.qsa=rt(n.querySelectorAll))&&(at(function(e){e.innerHTML="<select><option selected=''></option></select>",e.querySelectorAll("[selected]").length||h.push("\\["+_+"*(?:checked|disabled|ismap|multiple|readonly|selected|value)"),e.querySelectorAll(":checked").length||h.push(":checked")}),at(function(e){e.innerHTML="<input type='hidden' i=''/>",e.querySelectorAll("[i^='']").length&&h.push("[*^$]="+_+"*(?:\"\"|'')"),e.querySelectorAll(":enabled").length||h.push(":enabled",":disabled"),e.querySelectorAll("*,:x"),h.push(",.*:")})),(T.matchesSelector=rt(m=f.matchesSelector||f.mozMatchesSelector||f.webkitMatchesSelector||f.oMatchesSelector||f.msMatchesSelector))&&at(function(e){T.disconnectedMatch=m.call(e,"div"),m.call(e,"[s!='']:x"),g.push("!=",R)}),h=RegExp(h.join("|")),g=RegExp(g.join("|")),y=rt(f.contains)||f.compareDocumentPosition?function(e,t){var n=9===e.nodeType?e.documentElement:e,r=t&&t.parentNode;return e===r||!(!r||1!==r.nodeType||!(n.contains?n.contains(r):e.compareDocumentPosition&&16&e.compareDocumentPosition(r)))}:function(e,t){if(t)while(t=t.parentNode)if(t===e)return!0;return!1},v=f.compareDocumentPosition?function(e,t){var r;return e===t?(u=!0,0):(r=t.compareDocumentPosition&&e.compareDocumentPosition&&e.compareDocumentPosition(t))?1&r||e.parentNode&&11===e.parentNode.nodeType?e===n||y(w,e)?-1:t===n||y(w,t)?1:0:4&r?-1:1:e.compareDocumentPosition?-1:1}:function(e,t){var r,i=0,o=e.parentNode,a=t.parentNode,s=[e],l=[t];if(e===t)return u=!0,0;if(!o||!a)return e===n?-1:t===n?1:o?-1:a?1:0;if(o===a)return ut(e,t);r=e;while(r=r.parentNode)s.unshift(r);r=t;while(r=r.parentNode)l.unshift(r);while(s[i]===l[i])i++;return i?ut(s[i],l[i]):s[i]===w?-1:l[i]===w?1:0},u=!1,[0,0].sort(v),T.detectDuplicates=u,p):p},st.matches=function(e,t){return st(e,null,null,t)},st.matchesSelector=function(e,t){if((e.ownerDocument||e)!==p&&c(e),t=t.replace(Z,"='$1']"),!(!T.matchesSelector||d||g&&g.test(t)||h.test(t)))try{var n=m.call(e,t);if(n||T.disconnectedMatch||e.document&&11!==e.document.nodeType)return n}catch(r){}return st(t,p,null,[e]).length>0},st.contains=function(e,t){return(e.ownerDocument||e)!==p&&c(e),y(e,t)},st.attr=function(e,t){var n;return(e.ownerDocument||e)!==p&&c(e),d||(t=t.toLowerCase()),(n=i.attrHandle[t])?n(e):d||T.attributes?e.getAttribute(t):((n=e.getAttributeNode(t))||e.getAttribute(t))&&e[t]===!0?t:n&&n.specified?n.value:null},st.error=function(e){throw Error("Syntax error, unrecognized expression: "+e)},st.uniqueSort=function(e){var t,n=[],r=1,i=0;if(u=!T.detectDuplicates,e.sort(v),u){for(;t=e[r];r++)t===e[r-1]&&(i=n.push(r));while(i--)e.splice(n[i],1)}return e};function ut(e,t){var n=t&&e,r=n&&(~t.sourceIndex||j)-(~e.sourceIndex||j);if(r)return r;if(n)while(n=n.nextSibling)if(n===t)return-1;return e?1:-1}function lt(e){return function(t){var n=t.nodeName.toLowerCase();return"input"===n&&t.type===e}}function ct(e){return function(t){var n=t.nodeName.toLowerCase();return("input"===n||"button"===n)&&t.type===e}}function pt(e){return ot(function(t){return t=+t,ot(function(n,r){var i,o=e([],n.length,t),a=o.length;while(a--)n[i=o[a]]&&(n[i]=!(r[i]=n[i]))})})}o=st.getText=function(e){var t,n="",r=0,i=e.nodeType;if(i){if(1===i||9===i||11===i){if("string"==typeof e.textContent)return e.textContent;for(e=e.firstChild;e;e=e.nextSibling)n+=o(e)}else if(3===i||4===i)return e.nodeValue}else for(;t=e[r];r++)n+=o(t);return n},i=st.selectors={cacheLength:50,createPseudo:ot,match:U,find:{},relative:{">":{dir:"parentNode",first:!0}," ":{dir:"parentNode"},"+":{dir:"previousSibling",first:!0},"~":{dir:"previousSibling"}},preFilter:{ATTR:function(e){return e[1]=e[1].replace(et,tt),e[3]=(e[4]||e[5]||"").replace(et,tt),"~="===e[2]&&(e[3]=" "+e[3]+" "),e.slice(0,4)},CHILD:function(e){return e[1]=e[1].toLowerCase(),"nth"===e[1].slice(0,3)?(e[3]||st.error(e[0]),e[4]=+(e[4]?e[5]+(e[6]||1):2*("even"===e[3]||"odd"===e[3])),e[5]=+(e[7]+e[8]||"odd"===e[3])):e[3]&&st.error(e[0]),e},PSEUDO:function(e){var t,n=!e[5]&&e[2];return U.CHILD.test(e[0])?null:(e[4]?e[2]=e[4]:n&&z.test(n)&&(t=ft(n,!0))&&(t=n.indexOf(")",n.length-t)-n.length)&&(e[0]=e[0].slice(0,t),e[2]=n.slice(0,t)),e.slice(0,3))}},filter:{TAG:function(e){return"*"===e?function(){return!0}:(e=e.replace(et,tt).toLowerCase(),function(t){return t.nodeName&&t.nodeName.toLowerCase()===e})},CLASS:function(e){var t=k[e+" "];return t||(t=RegExp("(^|"+_+")"+e+"("+_+"|$)"))&&k(e,function(e){return t.test(e.className||typeof e.getAttribute!==A&&e.getAttribute("class")||"")})},ATTR:function(e,t,n){return function(r){var i=st.attr(r,e);return null==i?"!="===t:t?(i+="","="===t?i===n:"!="===t?i!==n:"^="===t?n&&0===i.indexOf(n):"*="===t?n&&i.indexOf(n)>-1:"$="===t?n&&i.slice(-n.length)===n:"~="===t?(" "+i+" ").indexOf(n)>-1:"|="===t?i===n||i.slice(0,n.length+1)===n+"-":!1):!0}},CHILD:function(e,t,n,r,i){var o="nth"!==e.slice(0,3),a="last"!==e.slice(-4),s="of-type"===t;return 1===r&&0===i?function(e){return!!e.parentNode}:function(t,n,u){var l,c,p,f,d,h,g=o!==a?"nextSibling":"previousSibling",m=t.parentNode,y=s&&t.nodeName.toLowerCase(),v=!u&&!s;if(m){if(o){while(g){p=t;while(p=p[g])if(s?p.nodeName.toLowerCase()===y:1===p.nodeType)return!1;h=g="only"===e&&!h&&"nextSibling"}return!0}if(h=[a?m.firstChild:m.lastChild],a&&v){c=m[x]||(m[x]={}),l=c[e]||[],d=l[0]===N&&l[1],f=l[0]===N&&l[2],p=d&&m.childNodes[d];while(p=++d&&p&&p[g]||(f=d=0)||h.pop())if(1===p.nodeType&&++f&&p===t){c[e]=[N,d,f];break}}else if(v&&(l=(t[x]||(t[x]={}))[e])&&l[0]===N)f=l[1];else while(p=++d&&p&&p[g]||(f=d=0)||h.pop())if((s?p.nodeName.toLowerCase()===y:1===p.nodeType)&&++f&&(v&&((p[x]||(p[x]={}))[e]=[N,f]),p===t))break;return f-=i,f===r||0===f%r&&f/r>=0}}},PSEUDO:function(e,t){var n,r=i.pseudos[e]||i.setFilters[e.toLowerCase()]||st.error("unsupported pseudo: "+e);return r[x]?r(t):r.length>1?(n=[e,e,"",t],i.setFilters.hasOwnProperty(e.toLowerCase())?ot(function(e,n){var i,o=r(e,t),a=o.length;while(a--)i=M.call(e,o[a]),e[i]=!(n[i]=o[a])}):function(e){return r(e,0,n)}):r}},pseudos:{not:ot(function(e){var t=[],n=[],r=s(e.replace(W,"$1"));return r[x]?ot(function(e,t,n,i){var o,a=r(e,null,i,[]),s=e.length;while(s--)(o=a[s])&&(e[s]=!(t[s]=o))}):function(e,i,o){return t[0]=e,r(t,null,o,n),!n.pop()}}),has:ot(function(e){return function(t){return st(e,t).length>0}}),contains:ot(function(e){return function(t){return(t.textContent||t.innerText||o(t)).indexOf(e)>-1}}),lang:ot(function(e){return X.test(e||"")||st.error("unsupported lang: "+e),e=e.replace(et,tt).toLowerCase(),function(t){var n;do if(n=d?t.getAttribute("xml:lang")||t.getAttribute("lang"):t.lang)return n=n.toLowerCase(),n===e||0===n.indexOf(e+"-");while((t=t.parentNode)&&1===t.nodeType);return!1}}),target:function(t){var n=e.location&&e.location.hash;return n&&n.slice(1)===t.id},root:function(e){return e===f},focus:function(e){return e===p.activeElement&&(!p.hasFocus||p.hasFocus())&&!!(e.type||e.href||~e.tabIndex)},enabled:function(e){return e.disabled===!1},disabled:function(e){return e.disabled===!0},checked:function(e){var t=e.nodeName.toLowerCase();return"input"===t&&!!e.checked||"option"===t&&!!e.selected},selected:function(e){return e.parentNode&&e.parentNode.selectedIndex,e.selected===!0},empty:function(e){for(e=e.firstChild;e;e=e.nextSibling)if(e.nodeName>"@"||3===e.nodeType||4===e.nodeType)return!1;return!0},parent:function(e){return!i.pseudos.empty(e)},header:function(e){return Q.test(e.nodeName)},input:function(e){return G.test(e.nodeName)},button:function(e){var t=e.nodeName.toLowerCase();return"input"===t&&"button"===e.type||"button"===t},text:function(e){var t;return"input"===e.nodeName.toLowerCase()&&"text"===e.type&&(null==(t=e.getAttribute("type"))||t.toLowerCase()===e.type)},first:pt(function(){return[0]}),last:pt(function(e,t){return[t-1]}),eq:pt(function(e,t,n){return[0>n?n+t:n]}),even:pt(function(e,t){var n=0;for(;t>n;n+=2)e.push(n);return e}),odd:pt(function(e,t){var n=1;for(;t>n;n+=2)e.push(n);return e}),lt:pt(function(e,t,n){var r=0>n?n+t:n;for(;--r>=0;)e.push(r);return e}),gt:pt(function(e,t,n){var r=0>n?n+t:n;for(;t>++r;)e.push(r);return e})}};for(n in{radio:!0,checkbox:!0,file:!0,password:!0,image:!0})i.pseudos[n]=lt(n);for(n in{submit:!0,reset:!0})i.pseudos[n]=ct(n);function ft(e,t){var n,r,o,a,s,u,l,c=E[e+" "];if(c)return t?0:c.slice(0);s=e,u=[],l=i.preFilter;while(s){(!n||(r=$.exec(s)))&&(r&&(s=s.slice(r[0].length)||s),u.push(o=[])),n=!1,(r=I.exec(s))&&(n=r.shift(),o.push({value:n,type:r[0].replace(W," ")}),s=s.slice(n.length));for(a in i.filter)!(r=U[a].exec(s))||l[a]&&!(r=l[a](r))||(n=r.shift(),o.push({value:n,type:a,matches:r}),s=s.slice(n.length));if(!n)break}return t?s.length:s?st.error(e):E(e,u).slice(0)}function dt(e){var t=0,n=e.length,r="";for(;n>t;t++)r+=e[t].value;return r}function ht(e,t,n){var i=t.dir,o=n&&"parentNode"===i,a=C++;return t.first?function(t,n,r){while(t=t[i])if(1===t.nodeType||o)return e(t,n,r)}:function(t,n,s){var u,l,c,p=N+" "+a;if(s){while(t=t[i])if((1===t.nodeType||o)&&e(t,n,s))return!0}else while(t=t[i])if(1===t.nodeType||o)if(c=t[x]||(t[x]={}),(l=c[i])&&l[0]===p){if((u=l[1])===!0||u===r)return u===!0}else if(l=c[i]=[p],l[1]=e(t,n,s)||r,l[1]===!0)return!0}}function gt(e){return e.length>1?function(t,n,r){var i=e.length;while(i--)if(!e[i](t,n,r))return!1;return!0}:e[0]}function mt(e,t,n,r,i){var o,a=[],s=0,u=e.length,l=null!=t;for(;u>s;s++)(o=e[s])&&(!n||n(o,r,i))&&(a.push(o),l&&t.push(s));return a}function yt(e,t,n,r,i,o){return r&&!r[x]&&(r=yt(r)),i&&!i[x]&&(i=yt(i,o)),ot(function(o,a,s,u){var l,c,p,f=[],d=[],h=a.length,g=o||xt(t||"*",s.nodeType?[s]:s,[]),m=!e||!o&&t?g:mt(g,f,e,s,u),y=n?i||(o?e:h||r)?[]:a:m;if(n&&n(m,y,s,u),r){l=mt(y,d),r(l,[],s,u),c=l.length;while(c--)(p=l[c])&&(y[d[c]]=!(m[d[c]]=p))}if(o){if(i||e){if(i){l=[],c=y.length;while(c--)(p=y[c])&&l.push(m[c]=p);i(null,y=[],l,u)}c=y.length;while(c--)(p=y[c])&&(l=i?M.call(o,p):f[c])>-1&&(o[l]=!(a[l]=p))}}else y=mt(y===a?y.splice(h,y.length):y),i?i(null,a,y,u):H.apply(a,y)})}function vt(e){var t,n,r,o=e.length,a=i.relative[e[0].type],s=a||i.relative[" "],u=a?1:0,c=ht(function(e){return e===t},s,!0),p=ht(function(e){return M.call(t,e)>-1},s,!0),f=[function(e,n,r){return!a&&(r||n!==l)||((t=n).nodeType?c(e,n,r):p(e,n,r))}];for(;o>u;u++)if(n=i.relative[e[u].type])f=[ht(gt(f),n)];else{if(n=i.filter[e[u].type].apply(null,e[u].matches),n[x]){for(r=++u;o>r;r++)if(i.relative[e[r].type])break;return yt(u>1&&gt(f),u>1&&dt(e.slice(0,u-1)).replace(W,"$1"),n,r>u&&vt(e.slice(u,r)),o>r&&vt(e=e.slice(r)),o>r&&dt(e))}f.push(n)}return gt(f)}function bt(e,t){var n=0,o=t.length>0,a=e.length>0,s=function(s,u,c,f,d){var h,g,m,y=[],v=0,b="0",x=s&&[],w=null!=d,T=l,C=s||a&&i.find.TAG("*",d&&u.parentNode||u),k=N+=null==T?1:Math.random()||.1;for(w&&(l=u!==p&&u,r=n);null!=(h=C[b]);b++){if(a&&h){g=0;while(m=e[g++])if(m(h,u,c)){f.push(h);break}w&&(N=k,r=++n)}o&&((h=!m&&h)&&v--,s&&x.push(h))}if(v+=b,o&&b!==v){g=0;while(m=t[g++])m(x,y,u,c);if(s){if(v>0)while(b--)x[b]||y[b]||(y[b]=L.call(f));y=mt(y)}H.apply(f,y),w&&!s&&y.length>0&&v+t.length>1&&st.uniqueSort(f)}return w&&(N=k,l=T),x};return o?ot(s):s}s=st.compile=function(e,t){var n,r=[],i=[],o=S[e+" "];if(!o){t||(t=ft(e)),n=t.length;while(n--)o=vt(t[n]),o[x]?r.push(o):i.push(o);o=S(e,bt(i,r))}return o};function xt(e,t,n){var r=0,i=t.length;for(;i>r;r++)st(e,t[r],n);return n}function wt(e,t,n,r){var o,a,u,l,c,p=ft(e);if(!r&&1===p.length){if(a=p[0]=p[0].slice(0),a.length>2&&"ID"===(u=a[0]).type&&9===t.nodeType&&!d&&i.relative[a[1].type]){if(t=i.find.ID(u.matches[0].replace(et,tt),t)[0],!t)return n;e=e.slice(a.shift().value.length)}o=U.needsContext.test(e)?0:a.length;while(o--){if(u=a[o],i.relative[l=u.type])break;if((c=i.find[l])&&(r=c(u.matches[0].replace(et,tt),V.test(a[0].type)&&t.parentNode||t))){if(a.splice(o,1),e=r.length&&dt(a),!e)return H.apply(n,q.call(r,0)),n;break}}}return s(e,p)(r,t,d,n,V.test(e)),n}i.pseudos.nth=i.pseudos.eq;function Tt(){}i.filters=Tt.prototype=i.pseudos,i.setFilters=new Tt,c(),st.attr=b.attr,b.find=st,b.expr=st.selectors,b.expr[":"]=b.expr.pseudos,b.unique=st.uniqueSort,b.text=st.getText,b.isXMLDoc=st.isXML,b.contains=st.contains}(e);var at=/Until$/,st=/^(?:parents|prev(?:Until|All))/,ut=/^.[^:#\[\.,]*$/,lt=b.expr.match.needsContext,ct={children:!0,contents:!0,next:!0,prev:!0};b.fn.extend({find:function(e){var t,n,r,i=this.length;if("string"!=typeof e)return r=this,this.pushStack(b(e).filter(function(){for(t=0;i>t;t++)if(b.contains(r[t],this))return!0}));for(n=[],t=0;i>t;t++)b.find(e,this[t],n);return n=this.pushStack(i>1?b.unique(n):n),n.selector=(this.selector?this.selector+" ":"")+e,n},has:function(e){var t,n=b(e,this),r=n.length;return this.filter(function(){for(t=0;r>t;t++)if(b.contains(this,n[t]))return!0})},not:function(e){return this.pushStack(ft(this,e,!1))},filter:function(e){return this.pushStack(ft(this,e,!0))},is:function(e){return!!e&&("string"==typeof e?lt.test(e)?b(e,this.context).index(this[0])>=0:b.filter(e,this).length>0:this.filter(e).length>0)},closest:function(e,t){var n,r=0,i=this.length,o=[],a=lt.test(e)||"string"!=typeof e?b(e,t||this.context):0;for(;i>r;r++){n=this[r];while(n&&n.ownerDocument&&n!==t&&11!==n.nodeType){if(a?a.index(n)>-1:b.find.matchesSelector(n,e)){o.push(n);break}n=n.parentNode}}return this.pushStack(o.length>1?b.unique(o):o)},index:function(e){return e?"string"==typeof e?b.inArray(this[0],b(e)):b.inArray(e.jquery?e[0]:e,this):this[0]&&this[0].parentNode?this.first().prevAll().length:-1},add:function(e,t){var n="string"==typeof e?b(e,t):b.makeArray(e&&e.nodeType?[e]:e),r=b.merge(this.get(),n);return this.pushStack(b.unique(r))},addBack:function(e){return this.add(null==e?this.prevObject:this.prevObject.filter(e))}}),b.fn.andSelf=b.fn.addBack;function pt(e,t){do e=e[t];while(e&&1!==e.nodeType);return e}b.each({parent:function(e){var t=e.parentNode;return t&&11!==t.nodeType?t:null},parents:function(e){return b.dir(e,"parentNode")},parentsUntil:function(e,t,n){return b.dir(e,"parentNode",n)},next:function(e){return pt(e,"nextSibling")},prev:function(e){return pt(e,"previousSibling")},nextAll:function(e){return b.dir(e,"nextSibling")},prevAll:function(e){return b.dir(e,"previousSibling")},nextUntil:function(e,t,n){return b.dir(e,"nextSibling",n)},prevUntil:function(e,t,n){return b.dir(e,"previousSibling",n)},siblings:function(e){return b.sibling((e.parentNode||{}).firstChild,e)},children:function(e){return b.sibling(e.firstChild)},contents:function(e){return b.nodeName(e,"iframe")?e.contentDocument||e.contentWindow.document:b.merge([],e.childNodes)}},function(e,t){b.fn[e]=function(n,r){var i=b.map(this,t,n);return at.test(e)||(r=n),r&&"string"==typeof r&&(i=b.filter(r,i)),i=this.length>1&&!ct[e]?b.unique(i):i,this.length>1&&st.test(e)&&(i=i.reverse()),this.pushStack(i)}}),b.extend({filter:function(e,t,n){return n&&(e=":not("+e+")"),1===t.length?b.find.matchesSelector(t[0],e)?[t[0]]:[]:b.find.matches(e,t)},dir:function(e,n,r){var i=[],o=e[n];while(o&&9!==o.nodeType&&(r===t||1!==o.nodeType||!b(o).is(r)))1===o.nodeType&&i.push(o),o=o[n];return i},sibling:function(e,t){var n=[];for(;e;e=e.nextSibling)1===e.nodeType&&e!==t&&n.push(e);return n}});function ft(e,t,n){if(t=t||0,b.isFunction(t))return b.grep(e,function(e,r){var i=!!t.call(e,r,e);return i===n});if(t.nodeType)return b.grep(e,function(e){return e===t===n});if("string"==typeof t){var r=b.grep(e,function(e){return 1===e.nodeType});if(ut.test(t))return b.filter(t,r,!n);t=b.filter(t,r)}return b.grep(e,function(e){return b.inArray(e,t)>=0===n})}function dt(e){var t=ht.split("|"),n=e.createDocumentFragment();if(n.createElement)while(t.length)n.createElement(t.pop());return n}var ht="abbr|article|aside|audio|bdi|canvas|data|datalist|details|figcaption|figure|footer|header|hgroup|mark|meter|nav|output|progress|section|summary|time|video",gt=/ jQuery\d+="(?:null|\d+)"/g,mt=RegExp("<(?:"+ht+")[\\s/>]","i"),yt=/^\s+/,vt=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,bt=/<([\w:]+)/,xt=/<tbody/i,wt=/<|&#?\w+;/,Tt=/<(?:script|style|link)/i,Nt=/^(?:checkbox|radio)$/i,Ct=/checked\s*(?:[^=]|=\s*.checked.)/i,kt=/^$|\/(?:java|ecma)script/i,Et=/^true\/(.*)/,St=/^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g,At={option:[1,"<select multiple='multiple'>","</select>"],legend:[1,"<fieldset>","</fieldset>"],area:[1,"<map>","</map>"],param:[1,"<object>","</object>"],thead:[1,"<table>","</table>"],tr:[2,"<table><tbody>","</tbody></table>"],col:[2,"<table><tbody></tbody><colgroup>","</colgroup></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],_default:b.support.htmlSerialize?[0,"",""]:[1,"X<div>","</div>"]},jt=dt(o),Dt=jt.appendChild(o.createElement("div"));At.optgroup=At.option,At.tbody=At.tfoot=At.colgroup=At.caption=At.thead,At.th=At.td,b.fn.extend({text:function(e){return b.access(this,function(e){return e===t?b.text(this):this.empty().append((this[0]&&this[0].ownerDocument||o).createTextNode(e))},null,e,arguments.length)},wrapAll:function(e){if(b.isFunction(e))return this.each(function(t){b(this).wrapAll(e.call(this,t))});if(this[0]){var t=b(e,this[0].ownerDocument).eq(0).clone(!0);this[0].parentNode&&t.insertBefore(this[0]),t.map(function(){var e=this;while(e.firstChild&&1===e.firstChild.nodeType)e=e.firstChild;return e}).append(this)}return this},wrapInner:function(e){return b.isFunction(e)?this.each(function(t){b(this).wrapInner(e.call(this,t))}):this.each(function(){var t=b(this),n=t.contents();n.length?n.wrapAll(e):t.append(e)})},wrap:function(e){var t=b.isFunction(e);return this.each(function(n){b(this).wrapAll(t?e.call(this,n):e)})},unwrap:function(){return this.parent().each(function(){b.nodeName(this,"body")||b(this).replaceWith(this.childNodes)}).end()},append:function(){return this.domManip(arguments,!0,function(e){(1===this.nodeType||11===this.nodeType||9===this.nodeType)&&this.appendChild(e)})},prepend:function(){return this.domManip(arguments,!0,function(e){(1===this.nodeType||11===this.nodeType||9===this.nodeType)&&this.insertBefore(e,this.firstChild)})},before:function(){return this.domManip(arguments,!1,function(e){this.parentNode&&this.parentNode.insertBefore(e,this)})},after:function(){return this.domManip(arguments,!1,function(e){this.parentNode&&this.parentNode.insertBefore(e,this.nextSibling)})},remove:function(e,t){var n,r=0;for(;null!=(n=this[r]);r++)(!e||b.filter(e,[n]).length>0)&&(t||1!==n.nodeType||b.cleanData(Ot(n)),n.parentNode&&(t&&b.contains(n.ownerDocument,n)&&Mt(Ot(n,"script")),n.parentNode.removeChild(n)));return this},empty:function(){var e,t=0;for(;null!=(e=this[t]);t++){1===e.nodeType&&b.cleanData(Ot(e,!1));while(e.firstChild)e.removeChild(e.firstChild);e.options&&b.nodeName(e,"select")&&(e.options.length=0)}return this},clone:function(e,t){return e=null==e?!1:e,t=null==t?e:t,this.map(function(){return b.clone(this,e,t)})},html:function(e){return b.access(this,function(e){var n=this[0]||{},r=0,i=this.length;if(e===t)return 1===n.nodeType?n.innerHTML.replace(gt,""):t;if(!("string"!=typeof e||Tt.test(e)||!b.support.htmlSerialize&&mt.test(e)||!b.support.leadingWhitespace&&yt.test(e)||At[(bt.exec(e)||["",""])[1].toLowerCase()])){e=e.replace(vt,"<$1></$2>");try{for(;i>r;r++)n=this[r]||{},1===n.nodeType&&(b.cleanData(Ot(n,!1)),n.innerHTML=e);n=0}catch(o){}}n&&this.empty().append(e)},null,e,arguments.length)},replaceWith:function(e){var t=b.isFunction(e);return t||"string"==typeof e||(e=b(e).not(this).detach()),this.domManip([e],!0,function(e){var t=this.nextSibling,n=this.parentNode;n&&(b(this).remove(),n.insertBefore(e,t))})},detach:function(e){return this.remove(e,!0)},domManip:function(e,n,r){e=f.apply([],e);var i,o,a,s,u,l,c=0,p=this.length,d=this,h=p-1,g=e[0],m=b.isFunction(g);if(m||!(1>=p||"string"!=typeof g||b.support.checkClone)&&Ct.test(g))return this.each(function(i){var o=d.eq(i);m&&(e[0]=g.call(this,i,n?o.html():t)),o.domManip(e,n,r)});if(p&&(l=b.buildFragment(e,this[0].ownerDocument,!1,this),i=l.firstChild,1===l.childNodes.length&&(l=i),i)){for(n=n&&b.nodeName(i,"tr"),s=b.map(Ot(l,"script"),Ht),a=s.length;p>c;c++)o=l,c!==h&&(o=b.clone(o,!0,!0),a&&b.merge(s,Ot(o,"script"))),r.call(n&&b.nodeName(this[c],"table")?Lt(this[c],"tbody"):this[c],o,c);if(a)for(u=s[s.length-1].ownerDocument,b.map(s,qt),c=0;a>c;c++)o=s[c],kt.test(o.type||"")&&!b._data(o,"globalEval")&&b.contains(u,o)&&(o.src?b.ajax({url:o.src,type:"GET",dataType:"script",async:!1,global:!1,"throws":!0}):b.globalEval((o.text||o.textContent||o.innerHTML||"").replace(St,"")));l=i=null}return this}});function Lt(e,t){return e.getElementsByTagName(t)[0]||e.appendChild(e.ownerDocument.createElement(t))}function Ht(e){var t=e.getAttributeNode("type");return e.type=(t&&t.specified)+"/"+e.type,e}function qt(e){var t=Et.exec(e.type);return t?e.type=t[1]:e.removeAttribute("type"),e}function Mt(e,t){var n,r=0;for(;null!=(n=e[r]);r++)b._data(n,"globalEval",!t||b._data(t[r],"globalEval"))}function _t(e,t){if(1===t.nodeType&&b.hasData(e)){var n,r,i,o=b._data(e),a=b._data(t,o),s=o.events;if(s){delete a.handle,a.events={};for(n in s)for(r=0,i=s[n].length;i>r;r++)b.event.add(t,n,s[n][r])}a.data&&(a.data=b.extend({},a.data))}}function Ft(e,t){var n,r,i;if(1===t.nodeType){if(n=t.nodeName.toLowerCase(),!b.support.noCloneEvent&&t[b.expando]){i=b._data(t);for(r in i.events)b.removeEvent(t,r,i.handle);t.removeAttribute(b.expando)}"script"===n&&t.text!==e.text?(Ht(t).text=e.text,qt(t)):"object"===n?(t.parentNode&&(t.outerHTML=e.outerHTML),b.support.html5Clone&&e.innerHTML&&!b.trim(t.innerHTML)&&(t.innerHTML=e.innerHTML)):"input"===n&&Nt.test(e.type)?(t.defaultChecked=t.checked=e.checked,t.value!==e.value&&(t.value=e.value)):"option"===n?t.defaultSelected=t.selected=e.defaultSelected:("input"===n||"textarea"===n)&&(t.defaultValue=e.defaultValue)}}b.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(e,t){b.fn[e]=function(e){var n,r=0,i=[],o=b(e),a=o.length-1;for(;a>=r;r++)n=r===a?this:this.clone(!0),b(o[r])[t](n),d.apply(i,n.get());return this.pushStack(i)}});function Ot(e,n){var r,o,a=0,s=typeof e.getElementsByTagName!==i?e.getElementsByTagName(n||"*"):typeof e.querySelectorAll!==i?e.querySelectorAll(n||"*"):t;if(!s)for(s=[],r=e.childNodes||e;null!=(o=r[a]);a++)!n||b.nodeName(o,n)?s.push(o):b.merge(s,Ot(o,n));return n===t||n&&b.nodeName(e,n)?b.merge([e],s):s}function Bt(e){Nt.test(e.type)&&(e.defaultChecked=e.checked)}b.extend({clone:function(e,t,n){var r,i,o,a,s,u=b.contains(e.ownerDocument,e);if(b.support.html5Clone||b.isXMLDoc(e)||!mt.test("<"+e.nodeName+">")?o=e.cloneNode(!0):(Dt.innerHTML=e.outerHTML,Dt.removeChild(o=Dt.firstChild)),!(b.support.noCloneEvent&&b.support.noCloneChecked||1!==e.nodeType&&11!==e.nodeType||b.isXMLDoc(e)))for(r=Ot(o),s=Ot(e),a=0;null!=(i=s[a]);++a)r[a]&&Ft(i,r[a]);if(t)if(n)for(s=s||Ot(e),r=r||Ot(o),a=0;null!=(i=s[a]);a++)_t(i,r[a]);else _t(e,o);return r=Ot(o,"script"),r.length>0&&Mt(r,!u&&Ot(e,"script")),r=s=i=null,o},buildFragment:function(e,t,n,r){var i,o,a,s,u,l,c,p=e.length,f=dt(t),d=[],h=0;for(;p>h;h++)if(o=e[h],o||0===o)if("object"===b.type(o))b.merge(d,o.nodeType?[o]:o);else if(wt.test(o)){s=s||f.appendChild(t.createElement("div")),u=(bt.exec(o)||["",""])[1].toLowerCase(),c=At[u]||At._default,s.innerHTML=c[1]+o.replace(vt,"<$1></$2>")+c[2],i=c[0];while(i--)s=s.lastChild;if(!b.support.leadingWhitespace&&yt.test(o)&&d.push(t.createTextNode(yt.exec(o)[0])),!b.support.tbody){o="table"!==u||xt.test(o)?"<table>"!==c[1]||xt.test(o)?0:s:s.firstChild,i=o&&o.childNodes.length;while(i--)b.nodeName(l=o.childNodes[i],"tbody")&&!l.childNodes.length&&o.removeChild(l)
}b.merge(d,s.childNodes),s.textContent="";while(s.firstChild)s.removeChild(s.firstChild);s=f.lastChild}else d.push(t.createTextNode(o));s&&f.removeChild(s),b.support.appendChecked||b.grep(Ot(d,"input"),Bt),h=0;while(o=d[h++])if((!r||-1===b.inArray(o,r))&&(a=b.contains(o.ownerDocument,o),s=Ot(f.appendChild(o),"script"),a&&Mt(s),n)){i=0;while(o=s[i++])kt.test(o.type||"")&&n.push(o)}return s=null,f},cleanData:function(e,t){var n,r,o,a,s=0,u=b.expando,l=b.cache,p=b.support.deleteExpando,f=b.event.special;for(;null!=(n=e[s]);s++)if((t||b.acceptData(n))&&(o=n[u],a=o&&l[o])){if(a.events)for(r in a.events)f[r]?b.event.remove(n,r):b.removeEvent(n,r,a.handle);l[o]&&(delete l[o],p?delete n[u]:typeof n.removeAttribute!==i?n.removeAttribute(u):n[u]=null,c.push(o))}}});var Pt,Rt,Wt,$t=/alpha\([^)]*\)/i,It=/opacity\s*=\s*([^)]*)/,zt=/^(top|right|bottom|left)$/,Xt=/^(none|table(?!-c[ea]).+)/,Ut=/^margin/,Vt=RegExp("^("+x+")(.*)$","i"),Yt=RegExp("^("+x+")(?!px)[a-z%]+$","i"),Jt=RegExp("^([+-])=("+x+")","i"),Gt={BODY:"block"},Qt={position:"absolute",visibility:"hidden",display:"block"},Kt={letterSpacing:0,fontWeight:400},Zt=["Top","Right","Bottom","Left"],en=["Webkit","O","Moz","ms"];function tn(e,t){if(t in e)return t;var n=t.charAt(0).toUpperCase()+t.slice(1),r=t,i=en.length;while(i--)if(t=en[i]+n,t in e)return t;return r}function nn(e,t){return e=t||e,"none"===b.css(e,"display")||!b.contains(e.ownerDocument,e)}function rn(e,t){var n,r,i,o=[],a=0,s=e.length;for(;s>a;a++)r=e[a],r.style&&(o[a]=b._data(r,"olddisplay"),n=r.style.display,t?(o[a]||"none"!==n||(r.style.display=""),""===r.style.display&&nn(r)&&(o[a]=b._data(r,"olddisplay",un(r.nodeName)))):o[a]||(i=nn(r),(n&&"none"!==n||!i)&&b._data(r,"olddisplay",i?n:b.css(r,"display"))));for(a=0;s>a;a++)r=e[a],r.style&&(t&&"none"!==r.style.display&&""!==r.style.display||(r.style.display=t?o[a]||"":"none"));return e}b.fn.extend({css:function(e,n){return b.access(this,function(e,n,r){var i,o,a={},s=0;if(b.isArray(n)){for(o=Rt(e),i=n.length;i>s;s++)a[n[s]]=b.css(e,n[s],!1,o);return a}return r!==t?b.style(e,n,r):b.css(e,n)},e,n,arguments.length>1)},show:function(){return rn(this,!0)},hide:function(){return rn(this)},toggle:function(e){var t="boolean"==typeof e;return this.each(function(){(t?e:nn(this))?b(this).show():b(this).hide()})}}),b.extend({cssHooks:{opacity:{get:function(e,t){if(t){var n=Wt(e,"opacity");return""===n?"1":n}}}},cssNumber:{columnCount:!0,fillOpacity:!0,fontWeight:!0,lineHeight:!0,opacity:!0,orphans:!0,widows:!0,zIndex:!0,zoom:!0},cssProps:{"float":b.support.cssFloat?"cssFloat":"styleFloat"},style:function(e,n,r,i){if(e&&3!==e.nodeType&&8!==e.nodeType&&e.style){var o,a,s,u=b.camelCase(n),l=e.style;if(n=b.cssProps[u]||(b.cssProps[u]=tn(l,u)),s=b.cssHooks[n]||b.cssHooks[u],r===t)return s&&"get"in s&&(o=s.get(e,!1,i))!==t?o:l[n];if(a=typeof r,"string"===a&&(o=Jt.exec(r))&&(r=(o[1]+1)*o[2]+parseFloat(b.css(e,n)),a="number"),!(null==r||"number"===a&&isNaN(r)||("number"!==a||b.cssNumber[u]||(r+="px"),b.support.clearCloneStyle||""!==r||0!==n.indexOf("background")||(l[n]="inherit"),s&&"set"in s&&(r=s.set(e,r,i))===t)))try{l[n]=r}catch(c){}}},css:function(e,n,r,i){var o,a,s,u=b.camelCase(n);return n=b.cssProps[u]||(b.cssProps[u]=tn(e.style,u)),s=b.cssHooks[n]||b.cssHooks[u],s&&"get"in s&&(a=s.get(e,!0,r)),a===t&&(a=Wt(e,n,i)),"normal"===a&&n in Kt&&(a=Kt[n]),""===r||r?(o=parseFloat(a),r===!0||b.isNumeric(o)?o||0:a):a},swap:function(e,t,n,r){var i,o,a={};for(o in t)a[o]=e.style[o],e.style[o]=t[o];i=n.apply(e,r||[]);for(o in t)e.style[o]=a[o];return i}}),e.getComputedStyle?(Rt=function(t){return e.getComputedStyle(t,null)},Wt=function(e,n,r){var i,o,a,s=r||Rt(e),u=s?s.getPropertyValue(n)||s[n]:t,l=e.style;return s&&(""!==u||b.contains(e.ownerDocument,e)||(u=b.style(e,n)),Yt.test(u)&&Ut.test(n)&&(i=l.width,o=l.minWidth,a=l.maxWidth,l.minWidth=l.maxWidth=l.width=u,u=s.width,l.width=i,l.minWidth=o,l.maxWidth=a)),u}):o.documentElement.currentStyle&&(Rt=function(e){return e.currentStyle},Wt=function(e,n,r){var i,o,a,s=r||Rt(e),u=s?s[n]:t,l=e.style;return null==u&&l&&l[n]&&(u=l[n]),Yt.test(u)&&!zt.test(n)&&(i=l.left,o=e.runtimeStyle,a=o&&o.left,a&&(o.left=e.currentStyle.left),l.left="fontSize"===n?"1em":u,u=l.pixelLeft+"px",l.left=i,a&&(o.left=a)),""===u?"auto":u});function on(e,t,n){var r=Vt.exec(t);return r?Math.max(0,r[1]-(n||0))+(r[2]||"px"):t}function an(e,t,n,r,i){var o=n===(r?"border":"content")?4:"width"===t?1:0,a=0;for(;4>o;o+=2)"margin"===n&&(a+=b.css(e,n+Zt[o],!0,i)),r?("content"===n&&(a-=b.css(e,"padding"+Zt[o],!0,i)),"margin"!==n&&(a-=b.css(e,"border"+Zt[o]+"Width",!0,i))):(a+=b.css(e,"padding"+Zt[o],!0,i),"padding"!==n&&(a+=b.css(e,"border"+Zt[o]+"Width",!0,i)));return a}function sn(e,t,n){var r=!0,i="width"===t?e.offsetWidth:e.offsetHeight,o=Rt(e),a=b.support.boxSizing&&"border-box"===b.css(e,"boxSizing",!1,o);if(0>=i||null==i){if(i=Wt(e,t,o),(0>i||null==i)&&(i=e.style[t]),Yt.test(i))return i;r=a&&(b.support.boxSizingReliable||i===e.style[t]),i=parseFloat(i)||0}return i+an(e,t,n||(a?"border":"content"),r,o)+"px"}function un(e){var t=o,n=Gt[e];return n||(n=ln(e,t),"none"!==n&&n||(Pt=(Pt||b("<iframe frameborder='0' width='0' height='0'/>").css("cssText","display:block !important")).appendTo(t.documentElement),t=(Pt[0].contentWindow||Pt[0].contentDocument).document,t.write("<!doctype html><html><body>"),t.close(),n=ln(e,t),Pt.detach()),Gt[e]=n),n}function ln(e,t){var n=b(t.createElement(e)).appendTo(t.body),r=b.css(n[0],"display");return n.remove(),r}b.each(["height","width"],function(e,n){b.cssHooks[n]={get:function(e,r,i){return r?0===e.offsetWidth&&Xt.test(b.css(e,"display"))?b.swap(e,Qt,function(){return sn(e,n,i)}):sn(e,n,i):t},set:function(e,t,r){var i=r&&Rt(e);return on(e,t,r?an(e,n,r,b.support.boxSizing&&"border-box"===b.css(e,"boxSizing",!1,i),i):0)}}}),b.support.opacity||(b.cssHooks.opacity={get:function(e,t){return It.test((t&&e.currentStyle?e.currentStyle.filter:e.style.filter)||"")?.01*parseFloat(RegExp.$1)+"":t?"1":""},set:function(e,t){var n=e.style,r=e.currentStyle,i=b.isNumeric(t)?"alpha(opacity="+100*t+")":"",o=r&&r.filter||n.filter||"";n.zoom=1,(t>=1||""===t)&&""===b.trim(o.replace($t,""))&&n.removeAttribute&&(n.removeAttribute("filter"),""===t||r&&!r.filter)||(n.filter=$t.test(o)?o.replace($t,i):o+" "+i)}}),b(function(){b.support.reliableMarginRight||(b.cssHooks.marginRight={get:function(e,n){return n?b.swap(e,{display:"inline-block"},Wt,[e,"marginRight"]):t}}),!b.support.pixelPosition&&b.fn.position&&b.each(["top","left"],function(e,n){b.cssHooks[n]={get:function(e,r){return r?(r=Wt(e,n),Yt.test(r)?b(e).position()[n]+"px":r):t}}})}),b.expr&&b.expr.filters&&(b.expr.filters.hidden=function(e){return 0>=e.offsetWidth&&0>=e.offsetHeight||!b.support.reliableHiddenOffsets&&"none"===(e.style&&e.style.display||b.css(e,"display"))},b.expr.filters.visible=function(e){return!b.expr.filters.hidden(e)}),b.each({margin:"",padding:"",border:"Width"},function(e,t){b.cssHooks[e+t]={expand:function(n){var r=0,i={},o="string"==typeof n?n.split(" "):[n];for(;4>r;r++)i[e+Zt[r]+t]=o[r]||o[r-2]||o[0];return i}},Ut.test(e)||(b.cssHooks[e+t].set=on)});var cn=/%20/g,pn=/\[\]$/,fn=/\r?\n/g,dn=/^(?:submit|button|image|reset|file)$/i,hn=/^(?:input|select|textarea|keygen)/i;b.fn.extend({serialize:function(){return b.param(this.serializeArray())},serializeArray:function(){return this.map(function(){var e=b.prop(this,"elements");return e?b.makeArray(e):this}).filter(function(){var e=this.type;return this.name&&!b(this).is(":disabled")&&hn.test(this.nodeName)&&!dn.test(e)&&(this.checked||!Nt.test(e))}).map(function(e,t){var n=b(this).val();return null==n?null:b.isArray(n)?b.map(n,function(e){return{name:t.name,value:e.replace(fn,"\r\n")}}):{name:t.name,value:n.replace(fn,"\r\n")}}).get()}}),b.param=function(e,n){var r,i=[],o=function(e,t){t=b.isFunction(t)?t():null==t?"":t,i[i.length]=encodeURIComponent(e)+"="+encodeURIComponent(t)};if(n===t&&(n=b.ajaxSettings&&b.ajaxSettings.traditional),b.isArray(e)||e.jquery&&!b.isPlainObject(e))b.each(e,function(){o(this.name,this.value)});else for(r in e)gn(r,e[r],n,o);return i.join("&").replace(cn,"+")};function gn(e,t,n,r){var i;if(b.isArray(t))b.each(t,function(t,i){n||pn.test(e)?r(e,i):gn(e+"["+("object"==typeof i?t:"")+"]",i,n,r)});else if(n||"object"!==b.type(t))r(e,t);else for(i in t)gn(e+"["+i+"]",t[i],n,r)}b.each("blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error contextmenu".split(" "),function(e,t){b.fn[t]=function(e,n){return arguments.length>0?this.on(t,null,e,n):this.trigger(t)}}),b.fn.hover=function(e,t){return this.mouseenter(e).mouseleave(t||e)};var mn,yn,vn=b.now(),bn=/\?/,xn=/#.*$/,wn=/([?&])_=[^&]*/,Tn=/^(.*?):[ \t]*([^\r\n]*)\r?$/gm,Nn=/^(?:about|app|app-storage|.+-extension|file|res|widget):$/,Cn=/^(?:GET|HEAD)$/,kn=/^\/\//,En=/^([\w.+-]+:)(?:\/\/([^\/?#:]*)(?::(\d+)|)|)/,Sn=b.fn.load,An={},jn={},Dn="*/".concat("*");try{yn=a.href}catch(Ln){yn=o.createElement("a"),yn.href="",yn=yn.href}mn=En.exec(yn.toLowerCase())||[];function Hn(e){return function(t,n){"string"!=typeof t&&(n=t,t="*");var r,i=0,o=t.toLowerCase().match(w)||[];if(b.isFunction(n))while(r=o[i++])"+"===r[0]?(r=r.slice(1)||"*",(e[r]=e[r]||[]).unshift(n)):(e[r]=e[r]||[]).push(n)}}function qn(e,n,r,i){var o={},a=e===jn;function s(u){var l;return o[u]=!0,b.each(e[u]||[],function(e,u){var c=u(n,r,i);return"string"!=typeof c||a||o[c]?a?!(l=c):t:(n.dataTypes.unshift(c),s(c),!1)}),l}return s(n.dataTypes[0])||!o["*"]&&s("*")}function Mn(e,n){var r,i,o=b.ajaxSettings.flatOptions||{};for(i in n)n[i]!==t&&((o[i]?e:r||(r={}))[i]=n[i]);return r&&b.extend(!0,e,r),e}b.fn.load=function(e,n,r){if("string"!=typeof e&&Sn)return Sn.apply(this,arguments);var i,o,a,s=this,u=e.indexOf(" ");return u>=0&&(i=e.slice(u,e.length),e=e.slice(0,u)),b.isFunction(n)?(r=n,n=t):n&&"object"==typeof n&&(a="POST"),s.length>0&&b.ajax({url:e,type:a,dataType:"html",data:n}).done(function(e){o=arguments,s.html(i?b("<div>").append(b.parseHTML(e)).find(i):e)}).complete(r&&function(e,t){s.each(r,o||[e.responseText,t,e])}),this},b.each(["ajaxStart","ajaxStop","ajaxComplete","ajaxError","ajaxSuccess","ajaxSend"],function(e,t){b.fn[t]=function(e){return this.on(t,e)}}),b.each(["get","post"],function(e,n){b[n]=function(e,r,i,o){return b.isFunction(r)&&(o=o||i,i=r,r=t),b.ajax({url:e,type:n,dataType:o,data:r,success:i})}}),b.extend({active:0,lastModified:{},etag:{},ajaxSettings:{url:yn,type:"GET",isLocal:Nn.test(mn[1]),global:!0,processData:!0,async:!0,contentType:"application/x-www-form-urlencoded; charset=UTF-8",accepts:{"*":Dn,text:"text/plain",html:"text/html",xml:"application/xml, text/xml",json:"application/json, text/javascript"},contents:{xml:/xml/,html:/html/,json:/json/},responseFields:{xml:"responseXML",text:"responseText"},converters:{"* text":e.String,"text html":!0,"text json":b.parseJSON,"text xml":b.parseXML},flatOptions:{url:!0,context:!0}},ajaxSetup:function(e,t){return t?Mn(Mn(e,b.ajaxSettings),t):Mn(b.ajaxSettings,e)},ajaxPrefilter:Hn(An),ajaxTransport:Hn(jn),ajax:function(e,n){"object"==typeof e&&(n=e,e=t),n=n||{};var r,i,o,a,s,u,l,c,p=b.ajaxSetup({},n),f=p.context||p,d=p.context&&(f.nodeType||f.jquery)?b(f):b.event,h=b.Deferred(),g=b.Callbacks("once memory"),m=p.statusCode||{},y={},v={},x=0,T="canceled",N={readyState:0,getResponseHeader:function(e){var t;if(2===x){if(!c){c={};while(t=Tn.exec(a))c[t[1].toLowerCase()]=t[2]}t=c[e.toLowerCase()]}return null==t?null:t},getAllResponseHeaders:function(){return 2===x?a:null},setRequestHeader:function(e,t){var n=e.toLowerCase();return x||(e=v[n]=v[n]||e,y[e]=t),this},overrideMimeType:function(e){return x||(p.mimeType=e),this},statusCode:function(e){var t;if(e)if(2>x)for(t in e)m[t]=[m[t],e[t]];else N.always(e[N.status]);return this},abort:function(e){var t=e||T;return l&&l.abort(t),k(0,t),this}};if(h.promise(N).complete=g.add,N.success=N.done,N.error=N.fail,p.url=((e||p.url||yn)+"").replace(xn,"").replace(kn,mn[1]+"//"),p.type=n.method||n.type||p.method||p.type,p.dataTypes=b.trim(p.dataType||"*").toLowerCase().match(w)||[""],null==p.crossDomain&&(r=En.exec(p.url.toLowerCase()),p.crossDomain=!(!r||r[1]===mn[1]&&r[2]===mn[2]&&(r[3]||("http:"===r[1]?80:443))==(mn[3]||("http:"===mn[1]?80:443)))),p.data&&p.processData&&"string"!=typeof p.data&&(p.data=b.param(p.data,p.traditional)),qn(An,p,n,N),2===x)return N;u=p.global,u&&0===b.active++&&b.event.trigger("ajaxStart"),p.type=p.type.toUpperCase(),p.hasContent=!Cn.test(p.type),o=p.url,p.hasContent||(p.data&&(o=p.url+=(bn.test(o)?"&":"?")+p.data,delete p.data),p.cache===!1&&(p.url=wn.test(o)?o.replace(wn,"$1_="+vn++):o+(bn.test(o)?"&":"?")+"_="+vn++)),p.ifModified&&(b.lastModified[o]&&N.setRequestHeader("If-Modified-Since",b.lastModified[o]),b.etag[o]&&N.setRequestHeader("If-None-Match",b.etag[o])),(p.data&&p.hasContent&&p.contentType!==!1||n.contentType)&&N.setRequestHeader("Content-Type",p.contentType),N.setRequestHeader("Accept",p.dataTypes[0]&&p.accepts[p.dataTypes[0]]?p.accepts[p.dataTypes[0]]+("*"!==p.dataTypes[0]?", "+Dn+"; q=0.01":""):p.accepts["*"]);for(i in p.headers)N.setRequestHeader(i,p.headers[i]);if(p.beforeSend&&(p.beforeSend.call(f,N,p)===!1||2===x))return N.abort();T="abort";for(i in{success:1,error:1,complete:1})N[i](p[i]);if(l=qn(jn,p,n,N)){N.readyState=1,u&&d.trigger("ajaxSend",[N,p]),p.async&&p.timeout>0&&(s=setTimeout(function(){N.abort("timeout")},p.timeout));try{x=1,l.send(y,k)}catch(C){if(!(2>x))throw C;k(-1,C)}}else k(-1,"No Transport");function k(e,n,r,i){var c,y,v,w,T,C=n;2!==x&&(x=2,s&&clearTimeout(s),l=t,a=i||"",N.readyState=e>0?4:0,r&&(w=_n(p,N,r)),e>=200&&300>e||304===e?(p.ifModified&&(T=N.getResponseHeader("Last-Modified"),T&&(b.lastModified[o]=T),T=N.getResponseHeader("etag"),T&&(b.etag[o]=T)),204===e?(c=!0,C="nocontent"):304===e?(c=!0,C="notmodified"):(c=Fn(p,w),C=c.state,y=c.data,v=c.error,c=!v)):(v=C,(e||!C)&&(C="error",0>e&&(e=0))),N.status=e,N.statusText=(n||C)+"",c?h.resolveWith(f,[y,C,N]):h.rejectWith(f,[N,C,v]),N.statusCode(m),m=t,u&&d.trigger(c?"ajaxSuccess":"ajaxError",[N,p,c?y:v]),g.fireWith(f,[N,C]),u&&(d.trigger("ajaxComplete",[N,p]),--b.active||b.event.trigger("ajaxStop")))}return N},getScript:function(e,n){return b.get(e,t,n,"script")},getJSON:function(e,t,n){return b.get(e,t,n,"json")}});function _n(e,n,r){var i,o,a,s,u=e.contents,l=e.dataTypes,c=e.responseFields;for(s in c)s in r&&(n[c[s]]=r[s]);while("*"===l[0])l.shift(),o===t&&(o=e.mimeType||n.getResponseHeader("Content-Type"));if(o)for(s in u)if(u[s]&&u[s].test(o)){l.unshift(s);break}if(l[0]in r)a=l[0];else{for(s in r){if(!l[0]||e.converters[s+" "+l[0]]){a=s;break}i||(i=s)}a=a||i}return a?(a!==l[0]&&l.unshift(a),r[a]):t}function Fn(e,t){var n,r,i,o,a={},s=0,u=e.dataTypes.slice(),l=u[0];if(e.dataFilter&&(t=e.dataFilter(t,e.dataType)),u[1])for(i in e.converters)a[i.toLowerCase()]=e.converters[i];for(;r=u[++s];)if("*"!==r){if("*"!==l&&l!==r){if(i=a[l+" "+r]||a["* "+r],!i)for(n in a)if(o=n.split(" "),o[1]===r&&(i=a[l+" "+o[0]]||a["* "+o[0]])){i===!0?i=a[n]:a[n]!==!0&&(r=o[0],u.splice(s--,0,r));break}if(i!==!0)if(i&&e["throws"])t=i(t);else try{t=i(t)}catch(c){return{state:"parsererror",error:i?c:"No conversion from "+l+" to "+r}}}l=r}return{state:"success",data:t}}b.ajaxSetup({accepts:{script:"text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"},contents:{script:/(?:java|ecma)script/},converters:{"text script":function(e){return b.globalEval(e),e}}}),b.ajaxPrefilter("script",function(e){e.cache===t&&(e.cache=!1),e.crossDomain&&(e.type="GET",e.global=!1)}),b.ajaxTransport("script",function(e){if(e.crossDomain){var n,r=o.head||b("head")[0]||o.documentElement;return{send:function(t,i){n=o.createElement("script"),n.async=!0,e.scriptCharset&&(n.charset=e.scriptCharset),n.src=e.url,n.onload=n.onreadystatechange=function(e,t){(t||!n.readyState||/loaded|complete/.test(n.readyState))&&(n.onload=n.onreadystatechange=null,n.parentNode&&n.parentNode.removeChild(n),n=null,t||i(200,"success"))},r.insertBefore(n,r.firstChild)},abort:function(){n&&n.onload(t,!0)}}}});var On=[],Bn=/(=)\?(?=&|$)|\?\?/;b.ajaxSetup({jsonp:"callback",jsonpCallback:function(){var e=On.pop()||b.expando+"_"+vn++;return this[e]=!0,e}}),b.ajaxPrefilter("json jsonp",function(n,r,i){var o,a,s,u=n.jsonp!==!1&&(Bn.test(n.url)?"url":"string"==typeof n.data&&!(n.contentType||"").indexOf("application/x-www-form-urlencoded")&&Bn.test(n.data)&&"data");return u||"jsonp"===n.dataTypes[0]?(o=n.jsonpCallback=b.isFunction(n.jsonpCallback)?n.jsonpCallback():n.jsonpCallback,u?n[u]=n[u].replace(Bn,"$1"+o):n.jsonp!==!1&&(n.url+=(bn.test(n.url)?"&":"?")+n.jsonp+"="+o),n.converters["script json"]=function(){return s||b.error(o+" was not called"),s[0]},n.dataTypes[0]="json",a=e[o],e[o]=function(){s=arguments},i.always(function(){e[o]=a,n[o]&&(n.jsonpCallback=r.jsonpCallback,On.push(o)),s&&b.isFunction(a)&&a(s[0]),s=a=t}),"script"):t});var Pn,Rn,Wn=0,$n=e.ActiveXObject&&function(){var e;for(e in Pn)Pn[e](t,!0)};function In(){try{return new e.XMLHttpRequest}catch(t){}}function zn(){try{return new e.ActiveXObject("Microsoft.XMLHTTP")}catch(t){}}b.ajaxSettings.xhr=e.ActiveXObject?function(){return!this.isLocal&&In()||zn()}:In,Rn=b.ajaxSettings.xhr(),b.support.cors=!!Rn&&"withCredentials"in Rn,Rn=b.support.ajax=!!Rn,Rn&&b.ajaxTransport(function(n){if(!n.crossDomain||b.support.cors){var r;return{send:function(i,o){var a,s,u=n.xhr();if(n.username?u.open(n.type,n.url,n.async,n.username,n.password):u.open(n.type,n.url,n.async),n.xhrFields)for(s in n.xhrFields)u[s]=n.xhrFields[s];n.mimeType&&u.overrideMimeType&&u.overrideMimeType(n.mimeType),n.crossDomain||i["X-Requested-With"]||(i["X-Requested-With"]="XMLHttpRequest");try{for(s in i)u.setRequestHeader(s,i[s])}catch(l){}u.send(n.hasContent&&n.data||null),r=function(e,i){var s,l,c,p;try{if(r&&(i||4===u.readyState))if(r=t,a&&(u.onreadystatechange=b.noop,$n&&delete Pn[a]),i)4!==u.readyState&&u.abort();else{p={},s=u.status,l=u.getAllResponseHeaders(),"string"==typeof u.responseText&&(p.text=u.responseText);try{c=u.statusText}catch(f){c=""}s||!n.isLocal||n.crossDomain?1223===s&&(s=204):s=p.text?200:404}}catch(d){i||o(-1,d)}p&&o(s,c,p,l)},n.async?4===u.readyState?setTimeout(r):(a=++Wn,$n&&(Pn||(Pn={},b(e).unload($n)),Pn[a]=r),u.onreadystatechange=r):r()},abort:function(){r&&r(t,!0)}}}});var Xn,Un,Vn=/^(?:toggle|show|hide)$/,Yn=RegExp("^(?:([+-])=|)("+x+")([a-z%]*)$","i"),Jn=/queueHooks$/,Gn=[nr],Qn={"*":[function(e,t){var n,r,i=this.createTween(e,t),o=Yn.exec(t),a=i.cur(),s=+a||0,u=1,l=20;if(o){if(n=+o[2],r=o[3]||(b.cssNumber[e]?"":"px"),"px"!==r&&s){s=b.css(i.elem,e,!0)||n||1;do u=u||".5",s/=u,b.style(i.elem,e,s+r);while(u!==(u=i.cur()/a)&&1!==u&&--l)}i.unit=r,i.start=s,i.end=o[1]?s+(o[1]+1)*n:n}return i}]};function Kn(){return setTimeout(function(){Xn=t}),Xn=b.now()}function Zn(e,t){b.each(t,function(t,n){var r=(Qn[t]||[]).concat(Qn["*"]),i=0,o=r.length;for(;o>i;i++)if(r[i].call(e,t,n))return})}function er(e,t,n){var r,i,o=0,a=Gn.length,s=b.Deferred().always(function(){delete u.elem}),u=function(){if(i)return!1;var t=Xn||Kn(),n=Math.max(0,l.startTime+l.duration-t),r=n/l.duration||0,o=1-r,a=0,u=l.tweens.length;for(;u>a;a++)l.tweens[a].run(o);return s.notifyWith(e,[l,o,n]),1>o&&u?n:(s.resolveWith(e,[l]),!1)},l=s.promise({elem:e,props:b.extend({},t),opts:b.extend(!0,{specialEasing:{}},n),originalProperties:t,originalOptions:n,startTime:Xn||Kn(),duration:n.duration,tweens:[],createTween:function(t,n){var r=b.Tween(e,l.opts,t,n,l.opts.specialEasing[t]||l.opts.easing);return l.tweens.push(r),r},stop:function(t){var n=0,r=t?l.tweens.length:0;if(i)return this;for(i=!0;r>n;n++)l.tweens[n].run(1);return t?s.resolveWith(e,[l,t]):s.rejectWith(e,[l,t]),this}}),c=l.props;for(tr(c,l.opts.specialEasing);a>o;o++)if(r=Gn[o].call(l,e,c,l.opts))return r;return Zn(l,c),b.isFunction(l.opts.start)&&l.opts.start.call(e,l),b.fx.timer(b.extend(u,{elem:e,anim:l,queue:l.opts.queue})),l.progress(l.opts.progress).done(l.opts.done,l.opts.complete).fail(l.opts.fail).always(l.opts.always)}function tr(e,t){var n,r,i,o,a;for(i in e)if(r=b.camelCase(i),o=t[r],n=e[i],b.isArray(n)&&(o=n[1],n=e[i]=n[0]),i!==r&&(e[r]=n,delete e[i]),a=b.cssHooks[r],a&&"expand"in a){n=a.expand(n),delete e[r];for(i in n)i in e||(e[i]=n[i],t[i]=o)}else t[r]=o}b.Animation=b.extend(er,{tweener:function(e,t){b.isFunction(e)?(t=e,e=["*"]):e=e.split(" ");var n,r=0,i=e.length;for(;i>r;r++)n=e[r],Qn[n]=Qn[n]||[],Qn[n].unshift(t)},prefilter:function(e,t){t?Gn.unshift(e):Gn.push(e)}});function nr(e,t,n){var r,i,o,a,s,u,l,c,p,f=this,d=e.style,h={},g=[],m=e.nodeType&&nn(e);n.queue||(c=b._queueHooks(e,"fx"),null==c.unqueued&&(c.unqueued=0,p=c.empty.fire,c.empty.fire=function(){c.unqueued||p()}),c.unqueued++,f.always(function(){f.always(function(){c.unqueued--,b.queue(e,"fx").length||c.empty.fire()})})),1===e.nodeType&&("height"in t||"width"in t)&&(n.overflow=[d.overflow,d.overflowX,d.overflowY],"inline"===b.css(e,"display")&&"none"===b.css(e,"float")&&(b.support.inlineBlockNeedsLayout&&"inline"!==un(e.nodeName)?d.zoom=1:d.display="inline-block")),n.overflow&&(d.overflow="hidden",b.support.shrinkWrapBlocks||f.always(function(){d.overflow=n.overflow[0],d.overflowX=n.overflow[1],d.overflowY=n.overflow[2]}));for(i in t)if(a=t[i],Vn.exec(a)){if(delete t[i],u=u||"toggle"===a,a===(m?"hide":"show"))continue;g.push(i)}if(o=g.length){s=b._data(e,"fxshow")||b._data(e,"fxshow",{}),"hidden"in s&&(m=s.hidden),u&&(s.hidden=!m),m?b(e).show():f.done(function(){b(e).hide()}),f.done(function(){var t;b._removeData(e,"fxshow");for(t in h)b.style(e,t,h[t])});for(i=0;o>i;i++)r=g[i],l=f.createTween(r,m?s[r]:0),h[r]=s[r]||b.style(e,r),r in s||(s[r]=l.start,m&&(l.end=l.start,l.start="width"===r||"height"===r?1:0))}}function rr(e,t,n,r,i){return new rr.prototype.init(e,t,n,r,i)}b.Tween=rr,rr.prototype={constructor:rr,init:function(e,t,n,r,i,o){this.elem=e,this.prop=n,this.easing=i||"swing",this.options=t,this.start=this.now=this.cur(),this.end=r,this.unit=o||(b.cssNumber[n]?"":"px")},cur:function(){var e=rr.propHooks[this.prop];return e&&e.get?e.get(this):rr.propHooks._default.get(this)},run:function(e){var t,n=rr.propHooks[this.prop];return this.pos=t=this.options.duration?b.easing[this.easing](e,this.options.duration*e,0,1,this.options.duration):e,this.now=(this.end-this.start)*t+this.start,this.options.step&&this.options.step.call(this.elem,this.now,this),n&&n.set?n.set(this):rr.propHooks._default.set(this),this}},rr.prototype.init.prototype=rr.prototype,rr.propHooks={_default:{get:function(e){var t;return null==e.elem[e.prop]||e.elem.style&&null!=e.elem.style[e.prop]?(t=b.css(e.elem,e.prop,""),t&&"auto"!==t?t:0):e.elem[e.prop]},set:function(e){b.fx.step[e.prop]?b.fx.step[e.prop](e):e.elem.style&&(null!=e.elem.style[b.cssProps[e.prop]]||b.cssHooks[e.prop])?b.style(e.elem,e.prop,e.now+e.unit):e.elem[e.prop]=e.now}}},rr.propHooks.scrollTop=rr.propHooks.scrollLeft={set:function(e){e.elem.nodeType&&e.elem.parentNode&&(e.elem[e.prop]=e.now)}},b.each(["toggle","show","hide"],function(e,t){var n=b.fn[t];b.fn[t]=function(e,r,i){return null==e||"boolean"==typeof e?n.apply(this,arguments):this.animate(ir(t,!0),e,r,i)}}),b.fn.extend({fadeTo:function(e,t,n,r){return this.filter(nn).css("opacity",0).show().end().animate({opacity:t},e,n,r)},animate:function(e,t,n,r){var i=b.isEmptyObject(e),o=b.speed(t,n,r),a=function(){var t=er(this,b.extend({},e),o);a.finish=function(){t.stop(!0)},(i||b._data(this,"finish"))&&t.stop(!0)};return a.finish=a,i||o.queue===!1?this.each(a):this.queue(o.queue,a)},stop:function(e,n,r){var i=function(e){var t=e.stop;delete e.stop,t(r)};return"string"!=typeof e&&(r=n,n=e,e=t),n&&e!==!1&&this.queue(e||"fx",[]),this.each(function(){var t=!0,n=null!=e&&e+"queueHooks",o=b.timers,a=b._data(this);if(n)a[n]&&a[n].stop&&i(a[n]);else for(n in a)a[n]&&a[n].stop&&Jn.test(n)&&i(a[n]);for(n=o.length;n--;)o[n].elem!==this||null!=e&&o[n].queue!==e||(o[n].anim.stop(r),t=!1,o.splice(n,1));(t||!r)&&b.dequeue(this,e)})},finish:function(e){return e!==!1&&(e=e||"fx"),this.each(function(){var t,n=b._data(this),r=n[e+"queue"],i=n[e+"queueHooks"],o=b.timers,a=r?r.length:0;for(n.finish=!0,b.queue(this,e,[]),i&&i.cur&&i.cur.finish&&i.cur.finish.call(this),t=o.length;t--;)o[t].elem===this&&o[t].queue===e&&(o[t].anim.stop(!0),o.splice(t,1));for(t=0;a>t;t++)r[t]&&r[t].finish&&r[t].finish.call(this);delete n.finish})}});function ir(e,t){var n,r={height:e},i=0;for(t=t?1:0;4>i;i+=2-t)n=Zt[i],r["margin"+n]=r["padding"+n]=e;return t&&(r.opacity=r.width=e),r}b.each({slideDown:ir("show"),slideUp:ir("hide"),slideToggle:ir("toggle"),fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"},fadeToggle:{opacity:"toggle"}},function(e,t){b.fn[e]=function(e,n,r){return this.animate(t,e,n,r)}}),b.speed=function(e,t,n){var r=e&&"object"==typeof e?b.extend({},e):{complete:n||!n&&t||b.isFunction(e)&&e,duration:e,easing:n&&t||t&&!b.isFunction(t)&&t};return r.duration=b.fx.off?0:"number"==typeof r.duration?r.duration:r.duration in b.fx.speeds?b.fx.speeds[r.duration]:b.fx.speeds._default,(null==r.queue||r.queue===!0)&&(r.queue="fx"),r.old=r.complete,r.complete=function(){b.isFunction(r.old)&&r.old.call(this),r.queue&&b.dequeue(this,r.queue)},r},b.easing={linear:function(e){return e},swing:function(e){return.5-Math.cos(e*Math.PI)/2}},b.timers=[],b.fx=rr.prototype.init,b.fx.tick=function(){var e,n=b.timers,r=0;for(Xn=b.now();n.length>r;r++)e=n[r],e()||n[r]!==e||n.splice(r--,1);n.length||b.fx.stop(),Xn=t},b.fx.timer=function(e){e()&&b.timers.push(e)&&b.fx.start()},b.fx.interval=13,b.fx.start=function(){Un||(Un=setInterval(b.fx.tick,b.fx.interval))},b.fx.stop=function(){clearInterval(Un),Un=null},b.fx.speeds={slow:600,fast:200,_default:400},b.fx.step={},b.expr&&b.expr.filters&&(b.expr.filters.animated=function(e){return b.grep(b.timers,function(t){return e===t.elem}).length}),b.fn.offset=function(e){if(arguments.length)return e===t?this:this.each(function(t){b.offset.setOffset(this,e,t)});var n,r,o={top:0,left:0},a=this[0],s=a&&a.ownerDocument;if(s)return n=s.documentElement,b.contains(n,a)?(typeof a.getBoundingClientRect!==i&&(o=a.getBoundingClientRect()),r=or(s),{top:o.top+(r.pageYOffset||n.scrollTop)-(n.clientTop||0),left:o.left+(r.pageXOffset||n.scrollLeft)-(n.clientLeft||0)}):o},b.offset={setOffset:function(e,t,n){var r=b.css(e,"position");"static"===r&&(e.style.position="relative");var i=b(e),o=i.offset(),a=b.css(e,"top"),s=b.css(e,"left"),u=("absolute"===r||"fixed"===r)&&b.inArray("auto",[a,s])>-1,l={},c={},p,f;u?(c=i.position(),p=c.top,f=c.left):(p=parseFloat(a)||0,f=parseFloat(s)||0),b.isFunction(t)&&(t=t.call(e,n,o)),null!=t.top&&(l.top=t.top-o.top+p),null!=t.left&&(l.left=t.left-o.left+f),"using"in t?t.using.call(e,l):i.css(l)}},b.fn.extend({position:function(){if(this[0]){var e,t,n={top:0,left:0},r=this[0];return"fixed"===b.css(r,"position")?t=r.getBoundingClientRect():(e=this.offsetParent(),t=this.offset(),b.nodeName(e[0],"html")||(n=e.offset()),n.top+=b.css(e[0],"borderTopWidth",!0),n.left+=b.css(e[0],"borderLeftWidth",!0)),{top:t.top-n.top-b.css(r,"marginTop",!0),left:t.left-n.left-b.css(r,"marginLeft",!0)}}},offsetParent:function(){return this.map(function(){var e=this.offsetParent||o.documentElement;while(e&&!b.nodeName(e,"html")&&"static"===b.css(e,"position"))e=e.offsetParent;return e||o.documentElement})}}),b.each({scrollLeft:"pageXOffset",scrollTop:"pageYOffset"},function(e,n){var r=/Y/.test(n);b.fn[e]=function(i){return b.access(this,function(e,i,o){var a=or(e);return o===t?a?n in a?a[n]:a.document.documentElement[i]:e[i]:(a?a.scrollTo(r?b(a).scrollLeft():o,r?o:b(a).scrollTop()):e[i]=o,t)},e,i,arguments.length,null)}});function or(e){return b.isWindow(e)?e:9===e.nodeType?e.defaultView||e.parentWindow:!1}b.each({Height:"height",Width:"width"},function(e,n){b.each({padding:"inner"+e,content:n,"":"outer"+e},function(r,i){b.fn[i]=function(i,o){var a=arguments.length&&(r||"boolean"!=typeof i),s=r||(i===!0||o===!0?"margin":"border");return b.access(this,function(n,r,i){var o;return b.isWindow(n)?n.document.documentElement["client"+e]:9===n.nodeType?(o=n.documentElement,Math.max(n.body["scroll"+e],o["scroll"+e],n.body["offset"+e],o["offset"+e],o["client"+e])):i===t?b.css(n,r,s):b.style(n,r,i,s)},n,a?i:t,a,null)}})}),e.jQuery=e.$=b,"function"==typeof define&&define.amd&&define.amd.jQuery&&define("jquery",[],function(){return b})})(window);
(function(){var fieldSelection={getSelection:function(){var e=this.jquery?this[0]:this;return(('selectionStart'in e&&function(){var l=e.selectionEnd-e.selectionStart;return{start:e.selectionStart,end:e.selectionEnd,length:l,text:e.value.substr(e.selectionStart,l)};})||(document.selection&&function(){e.focus();var r=document.selection.createRange();if(r==null){return{start:0,end:e.value.length,length:0}}
var re=e.createTextRange();var rc=re.duplicate();re.moveToBookmark(r.getBookmark());rc.setEndPoint('EndToStart',re);return{start:rc.text.length,end:rc.text.length+r.text.length,length:r.text.length,text:r.text};})||function(){return{start:0,end:e.value.length,length:0};})();},replaceSelection:function(){var e=this.jquery?this[0]:this;var text=arguments[0]||'';return(('selectionStart'in e&&function(){e.value=e.value.substr(0,e.selectionStart)+text+e.value.substr(e.selectionEnd,e.value.length);return this;})||(document.selection&&function(){e.focus();document.selection.createRange().text=text;return this;})||function(){e.value+=text;return this;})();}};jQuery.each(fieldSelection,function(i){jQuery.fn[i]=this;});})();
var prev_caret_position=-1;(function($){function getRetypeStyledHtml(options){var construct="";construct=construct+('<div class="retype-container">');construct=construct+('<div class="retype-div">');construct=construct+('<div class="retype-textarea">');construct=construct+('<textarea id="'+options.id+'" rows="10" cols="50" scrolltop="scrollHeight"></textarea>');construct=construct+('</div>');construct=construct+('<div class="retype-options">');for(var i=0;i<options.language.length;i++){var languageId='retype-language-'+options.language[i].name;var languageName=options.language[i].name;var languageDisplayName=languageName;if(options.language[i].displayName){languageDisplayName=options.language[i].displayName;}
construct=construct+('<li class="retype-option">');construct=construct+('<a href="#'+languageName+'" id="'+languageId+'">'+languageDisplayName+'</a>');construct=construct+('</li>');}
construct=construct+('<li class="retype-option-keyboard"><a href="#">Keyboard</a></li>');construct=construct+('</div><!-- options -->');construct=construct+('<div class="retype-help"></div>');construct=construct+('</div><!-- div --></div><!-- container -->');return construct;}
$.fn.retypeStyled=function(mode,options){mode=mode||'on';return this.each(function(){$this=$(this);var number_of_retype_containers_in_dom=$(".retype-container").size();var unique_id="retype-container-no-"+number_of_retype_containers_in_dom;var construct=getRetypeStyledHtml(options);$this.append(construct);$(this).children(".retype-container").attr('id',unique_id);$("#"+unique_id+" .retype-option").each(function(intIndex){$(this).bind("click",function(e){$("#"+unique_id+" *").removeClass("retype-option-selected");$("#"+unique_id+" #retype-language-"+options.language[intIndex].name).addClass("retype-option-selected");$("#"+options.id).retype("off");$("#"+options.id).retype("on",options.language[intIndex]);$("#"+unique_id+" .retype-help").hide();if(options.language[intIndex].help){$("#"+unique_id+" .retype-help").html("<p>"+options.language[intIndex].help+"</p>");}
if(options.language[intIndex].help_url){$("#"+unique_id+" .retype-help").load(options.language[intIndex].help_url);}
$("#"+unique_id+" .retype-help").fadeIn("fast");$("#"+options.id).focus();});});$("#retype-language-"+options.language[0].name).addClass("retype-option-selected");$("#"+options.id).retype("off");$("#"+options.id).retype("on",options.language[0]);if(options.language[0].help){$("#"+unique_id+" .retype-help").html("<p>"+options.language[0].help+"</p>");}
if(options.language[0].help_url){$("#"+unique_id+" .retype-help").load(options.language[0].help_url);}
$("#"+options.id).focus();});};$.fn.retype=function(mode,options){mode=mode||'on';options=$.extend({},$.fn.retype.options,options);if(options.mapping_url){$.get(options.mapping_url,function(data){eval("options.mapping = "+data);});}
return this.each(function(){$this=$(this);if(mode=="on"||mode=="enable"){$this.keydown(handle_echoid);$this.keydown(handle_escape);$this.keypress(handle_alpha);if(options.name!='Dvorak'){$this.keyup(handle_composite);}
$this.keydown(retype_debug).keypress(retype_debug);}else{$this.unbind("keydown");$this.unbind("keyup");$this.unbind("keypress");}
function retype_debug(e){$("#retype-debug").html("clientHeight: "+$("#"+options.id).attr("clientHeight")+"\n"+"scrollHeight: "+$("#"+options.id).attr("scrollHeight")+"\n"+"KeyCode: "+e.charCode+"\n"+"Alt: "+e.altKey+"\n"+"Meta: "+e.metaKey+"\n"+"Shift: "+e.shiftKey+"\n"+"Ctrl: "+e.ctrlKey+"\n");}
function handle_escape(e){if(e.keyCode==27){var scrollTop=this.scrollTop;var range=$(this).getSelection();var current=this.value;var prefix=current.substring(0,range.start);var suffix=current.substring(range.start,current.length);var caret_position=range.start;var the_new_current="";var replacement_length=1;if(e.shiftKey){if(options.mapping["shift-escape"]){replacement_length=options.mapping["shift-escape"].length;the_new_current=prefix+options.mapping["shift-escape"]+suffix;}else{return;}}else{if(options.mapping["escape"]){replacement_length=options.mapping["escape"].length;the_new_current=prefix+options.mapping["escape"]+suffix;}else{return;}}
this.value=the_new_current;this.setSelectionRange(caret_position+replacement_length,caret_position+replacement_length);this.scrollTop=scrollTop;return false;}}
function handle_composite(e){var scrollTop=this.scrollTop;var range=$(this).getSelection();var current=this.value;var prefix=current.substring(0,range.start);var suffix=current.substring(range.start,current.length);var caret_position=range.start;var the_new_current="";var last_typed=current.substring(range.start-1,range.start);if(last_typed=='\u00E4'||last_typed=='\u00F6'||last_typed=='\u00FC'||last_typed=='\u00C4'||last_typed=='\u00D6'||last_typed=='\u00DC'||last_typed=='<'||last_typed=='>'){prefix=current.substring(0,range.start-1);if(options.mapping[last_typed]){var replacement_length=options.mapping[last_typed].length;var the_new_current=prefix+options.mapping[last_typed]+suffix;this.value=the_new_current;this.setSelectionRange(caret_position+replacement_length,caret_position+replacement_length);this.scrollTop=scrollTop;return false;}else{return;}}
this.scrollTop=scrollTop;return false;}
function handle_echoid(e){var scrollTop=this.scrollTop;var range=$(this).getSelection();var current=this.value;var prefix=current.substring(0,range.start);var suffix=current.substring(range.start,current.length);var caret_position=range.start;if(e.altKey){var the_key_string=null;if(e.shiftKey){the_key_string="shift+alt+"+String.fromCharCode(e.keyCode);}else{the_key_string="alt+"+String.fromCharCode(e.keyCode);}
if(options.mapping[the_key_string]){var the_new_current=prefix+options.mapping[the_key_string]+suffix;this.value=the_new_current;this.setSelectionRange(caret_position+1,caret_position+1);this.scrollTop=scrollTop;return false;}}}
function handle_alpha(e){var returnval=true;var caret_position;var scrollTop=this.scrollTop;if(!e.ctrlKey&&!e.altKey&&!e.metaKey){var range=$(this).getSelection();caret_position=range.start;var current=this.value;var the_key_string=String.fromCharCode(e.charCode);if(prev_caret_position+1==caret_position){var prevKey=current.substring(prev_caret_position,caret_position);if(options.mapping[prevKey+the_key_string]){the_key_string=prevKey+the_key_string;--caret_position;}}
if(options.mapping[the_key_string]){var range=$(this).getSelection();var current=this.value;var prefix=current.substring(0,caret_position);var suffix=current.substring(range.start,current.length);var replacement_length=options.mapping[the_key_string].length;var the_new_current=prefix+options.mapping[the_key_string]+suffix;this.value=the_new_current;if(caret_position==-1){caret_position+=1;}
this.setSelectionRange(caret_position+replacement_length,caret_position+replacement_length);returnval=false;}else{}
this.scrollTop=scrollTop;prev_caret_position=caret_position;return returnval;}}});};})(jQuery);/*!
jQuery UI Virtual Keyboard
Version 1.15 minified (MIT License)
Caret code modified from jquery.caret.1.02.js (MIT License)
*/
(function(d){d.keyboard=function(b,l){var a=this,c;a.$el=d(b);a.el=b;a.$el.data("keyboard",a);a.init=function(){a.options=c=d.extend(!0,{},d.keyboard.defaultOptions,l);a.shiftActive=a.altActive=a.metaActive=a.sets=a.capsLock=!1;a.lastKeyset=[!1,!1,!1];a.rows=["","-shift","-alt","-alt-shift"];a.acceptedKeys=[];a.mappedKeys={};d('<\!--[if lte IE 8]><script>jQuery("body").addClass("oldie");<\/script><![endif]--\><\!--[if IE]><script>jQuery("body").addClass("ie");<\/script><![endif]--\>').appendTo("body").remove(); a.msie=d("body").hasClass("oldie");a.allie=d("body").hasClass("ie");a.inPlaceholder=a.$el.attr("placeholder")||"";a.watermark="undefined"!==typeof document.createElement("input").placeholder&&""!==a.inPlaceholder;a.regex=d.keyboard.comboRegex;a.decimal=/^\./.test(c.display.dec)?!0:!1;a.repeatTime=1E3/(c.repeatRate||20);a.temp=d('<input style="position:absolute;left:-9999em;top:-9999em;" type="text" value="testing">').appendTo("body").caret(3,3);a.checkCaret=c.lockInput||3!==a.temp.hide().show().caret().start? !0:!1;a.temp.remove();a.lastCaret={start:0,end:0};a.temp=["",0,0];d.each("initialized visible change hidden canceled accepted beforeClose".split(" "),function(e,f){d.isFunction(c[f])&&a.$el.bind(f+".keyboard",c[f])});c.alwaysOpen&&(c.stayOpen=!0);d(document).bind("mousedown.keyboard keyup.keyboard touchstart.keyboard",function(e){a.opening||(a.escClose(e),e.target&&d(e.target).hasClass("ui-keyboard-input")&&(e=d(e.target).data("keyboard"))&&e.options.openOn&&e.focusOn())});a.$el.addClass("ui-keyboard-input "+ c.css.input).attr({"aria-haspopup":"true",role:"textbox"});(a.$el.is(":disabled")||a.$el.attr("readonly")&&!a.$el.hasClass("ui-keyboard-lockedinput"))&&a.$el.addClass("ui-keyboard-nokeyboard");c.openOn&&a.$el.bind(c.openOn+".keyboard",function(){a.focusOn()});!a.watermark&&(""===a.$el.val()&&""!==a.inPlaceholder&&""!==a.$el.attr("placeholder"))&&a.$el.addClass("ui-keyboard-placeholder").val(a.inPlaceholder);a.$el.trigger("initialized.keyboard",[a,a.el]);c.alwaysOpen&&a.reveal()};a.focusOn=function(){a.$el.is(":visible")&& (a.lastCaret=a.$el.caret());if(!a.isVisible()||c.alwaysOpen)clearTimeout(a.timer),a.reveal(),setTimeout(function(){a.$preview.focus()},100)};a.reveal=function(){a.opening=!0;d(".ui-keyboard:not(.ui-keyboard-always-open)").hide();if(a.$el.is(":disabled")||a.$el.attr("readonly")&&!a.$el.hasClass("ui-keyboard-lockedinput"))a.$el.addClass("ui-keyboard-nokeyboard");else{a.$el.removeClass("ui-keyboard-nokeyboard");c.openOn&&a.$el.unbind(c.openOn+".keyboard");"undefined"===typeof a.$keyboard&&a.startup(); d(".ui-keyboard-has-focus").removeClass("ui-keyboard-has-focus");d(".ui-keyboard-input-current").removeClass("ui-keyboard-input-current");a.$el.addClass("ui-keyboard-input-current");a.isCurrent(!0);!a.watermark&&a.el.value===a.inPlaceholder&&a.$el.removeClass("ui-keyboard-placeholder").val("");a.originalContent=a.$el.val();a.$preview.val(a.originalContent);c.acceptValid&&a.checkValid();var e;a.position=c.position;a.position.of=a.position.of||a.$el.data("keyboardPosition")||a.$el;a.position.collision= c.usePreview?a.position.collision||"fit fit":"flip flip";c.resetDefault&&(a.shiftActive=a.altActive=a.metaActive=!1,a.showKeySet());a.$keyboard.css({position:"absolute",left:0,top:0}).addClass("ui-keyboard-has-focus").show();c.usePreview&&a.msie&&("undefined"===typeof a.width&&(a.$preview.hide(),a.width=Math.ceil(a.$keyboard.width()),a.$preview.show()),a.$preview.width(a.width));a.$keyboard.position(a.position);a.$preview.focus();a.checkDecimal();a.lineHeight=parseInt(a.$preview.css("lineHeight"), 10)||parseInt(a.$preview.css("font-size"),10)+4;a.allie&&(e=a.lastCaret.start||a.originalContent.length,e={start:e,end:e},a.lastCaret||(a.lastCaret=e),0===a.lastCaret.end&&0<a.lastCaret.start&&(a.lastCaret.end=a.lastCaret.start),0>a.lastCaret.start&&(a.lastCaret=e));a.$preview.caret(a.lastCaret.start,a.lastCaret.end);a.$el.trigger("visible.keyboard",[a,a.el]);setTimeout(function(){a.opening=!1},500);return a}};a.startup=function(){a.$keyboard=a.buildKeyboard();a.$allKeys=a.$keyboard.find("button.ui-keyboard-button"); a.preview=a.$preview[0];a.$decBtn=a.$keyboard.find(".ui-keyboard-dec");a.wheel=d.isFunction(d.fn.mousewheel);a.alwaysAllowed=[20,33,34,35,36,37,38,39,40,45,46];c.enterNavigation&&a.alwaysAllowed.push(13);a.$preview.bind("keypress.keyboard",function(e){var f=String.fromCharCode(e.charCode||e.which);a.checkCaret&&(a.lastCaret=a.$preview.caret());a.capsLock=65<=f&&90>=f&&!e.shiftKey||97<=f&&122>=f&&e.shiftKey?!0:!1;if(c.restrictInput){if((8===e.which||0===e.which)&&d.inArray(e.keyCode,a.alwaysAllowed))return; -1===d.inArray(f,a.acceptedKeys)&&e.preventDefault()}else if((e.ctrlKey||e.metaKey)&&(97===e.which||99===e.which||118===e.which||120<=e.which&&122>=e.which))return;a.hasMappedKeys&&a.mappedKeys.hasOwnProperty(f)&&(a.insertText(a.mappedKeys[f]),e.preventDefault());a.checkMaxLength()}).bind("keyup.keyboard",function(e){switch(e.which){case 9:a.tab&&!c.lockInput?(d.keyboard.keyaction.tab(a),a.tab=!1):e.preventDefault();break;case 27:return a.close(),!1}clearTimeout(a.throttled);a.throttled=setTimeout(function(){a.isVisible()&& a.checkCombos()},100);a.checkMaxLength();a.$el.trigger("change.keyboard",[a,a.el])}).bind("keydown.keyboard",function(e){switch(e.which){case 9:if(c.tabNavigation)return!0;a.tab=!0;return!1;case 13:d.keyboard.keyaction.enter(a,null,e);break;case 20:a.shiftActive=a.capsLock=!a.capsLock;a.showKeySet(this);break;case 86:if(e.ctrlKey||e.metaKey){if(c.preventPaste){e.preventDefault();break}a.checkCombos()}}}).bind("mouseup.keyboard touchend.keyboard",function(){a.checkCaret&&(a.lastCaret=a.$preview.caret())}); a.$keyboard.bind("mousedown.keyboard click.keyboard touchstart.keyboard",function(a){a.stopPropagation()});c.preventPaste&&(a.$preview.bind("contextmenu.keyboard",function(a){a.preventDefault()}),a.$el.bind("contextmenu.keyboard",function(a){a.preventDefault()}));c.appendLocally?a.$el.after(a.$keyboard):a.$keyboard.appendTo("body");a.$allKeys.bind(c.keyBinding.split(" ").join(".keyboard ")+".keyboard repeater.keyboard",function(e){var f;f=d.data(this,"key");var b=f.action.split(":")[0];a.$preview.focus(); a.checkCaret&&a.$preview.caret(a.lastCaret.start,a.lastCaret.end);b.match("meta")&&(b="meta");if(d.keyboard.keyaction.hasOwnProperty(b)&&d(this).hasClass("ui-keyboard-actionkey")){if(!1===d.keyboard.keyaction[b](a,this,e))return}else"undefined"!==typeof f.action&&(f=a.wheel&&!d(this).hasClass("ui-keyboard-actionkey")?f.curTxt:f.action,a.insertText(f),!a.capsLock&&(!c.stickyShift&&!e.shiftKey)&&(a.shiftActive=!1,a.showKeySet(this)));a.checkCombos();a.checkMaxLength();a.$el.trigger("change.keyboard", [a,a.el]);a.$preview.focus();e.preventDefault()}).bind("mouseenter.keyboard mouseleave.keyboard",function(e){var f=d(this),b=d.data(this,"key");"mouseenter"===e.type&&"password"!==a.el.type&&f.addClass(c.css.buttonHover).attr("title",function(e,f){return a.wheel&&""===f&&a.sets?c.wheelMessage:f});"mouseleave"===e.type&&(b.curTxt=b.original,b.curNum=0,d.data(this,"key",b),f.removeClass("password"===a.el.type?"":c.css.buttonHover).attr("title",function(a,e){return e===c.wheelMessage?"":e}).find("span").text(b.original))}).bind("mousewheel.keyboard", function(e,f){if(a.wheel){var c,b=d(this),g=d.data(this,"key");c=g.layers||a.getLayers(b);g.curNum+=0<f?-1:1;g.curNum>c.length-1&&(g.curNum=0);0>g.curNum&&(g.curNum=c.length-1);g.layers=c;g.curTxt=c[g.curNum];d.data(this,"key",g);b.find("span").text(c[g.curNum]);return!1}}).bind("mouseup.keyboard mouseleave.kb touchend.kb touchmove.kb touchcancel.kb",function(){a.isVisible()&&a.isCurrent()&&a.$preview.focus();a.mouseRepeat=[!1,""];clearTimeout(a.repeater);a.checkCaret&&a.$preview.caret(a.lastCaret.start, a.lastCaret.end);return!1}).bind("click.keyboard",function(){return!1}).filter(":not(.ui-keyboard-actionkey)").add(".ui-keyboard-tab, .ui-keyboard-bksp, .ui-keyboard-space, .ui-keyboard-enter",a.$keyboard).bind("mousedown.kb touchstart.kb",function(){if(0!==c.repeatRate){var e=d(this);a.mouseRepeat=[!0,e];setTimeout(function(){a.mouseRepeat[0]&&a.mouseRepeat[1]===e&&a.repeatKey(e)},c.repeatDelay)}return!1});d(window).resize(function(){a.isVisible()&&a.$keyboard.position(a.position)})};a.isVisible= function(){return"undefined"===typeof a.$keyboard?!1:a.$keyboard.is(":visible")};a.insertText=function(e){var c,b;b=a.$preview.val();var d=a.$preview.caret(),g=a.$preview.scrollLeft();c=a.$preview.scrollTop();var h=b.length;d.end<d.start&&(d.end=d.start);d.start>h&&(d.end=d.start=h);"TEXTAREA"===a.preview.tagName&&(a.msie&&"\n"===b.substr(d.start,1)&&(d.start+=1,d.end+=1),b=b.split("\n").length-1,a.preview.scrollTop=0<b?a.lineHeight*b:c);c="bksp"===e&&d.start===d.end?!0:!1;e="bksp"===e?"":e;b=d.start+ (c?-1:e.length);g+=parseInt(a.$preview.css("fontSize"),10)*("bksp"===e?-1:1);a.$preview.val(a.$preview.val().substr(0,d.start-(c?1:0))+e+a.$preview.val().substr(d.end)).caret(b,b).scrollLeft(g);a.checkCaret&&(a.lastCaret={start:b,end:b})};a.checkMaxLength=function(){var e,b=a.$preview.val();!1!==c.maxLength&&b.length>c.maxLength&&(e=Math.min(a.$preview.caret().start,c.maxLength),a.$preview.val(b.substring(0,c.maxLength)),a.$preview.caret(e,e),a.lastCaret={start:e,end:e});a.$decBtn.length&&a.checkDecimal()}; a.repeatKey=function(e){e.trigger("repeater.keyboard");a.mouseRepeat[0]&&(a.repeater=setTimeout(function(){a.repeatKey(e)},a.repeatTime))};a.showKeySet=function(e){var b="",d=(a.shiftActive?1:0)+(a.altActive?2:0);a.shiftActive||(a.capsLock=!1);if(a.metaActive){if(b=e&&e.name&&/meta/.test(e.name)?e.name:"",""===b?b=!0===a.metaActive?"":a.metaActive:a.metaActive=b,!c.stickyShift&&a.lastKeyset[2]!==a.metaActive||(a.shiftActive||a.altActive)&&!a.$keyboard.find(".ui-keyboard-keyset-"+b+a.rows[d]).length)a.shiftActive= a.altActive=!1}else!c.stickyShift&&(a.lastKeyset[2]!==a.metaActive&&a.shiftActive)&&(a.shiftActive=a.altActive=!1);d=(a.shiftActive?1:0)+(a.altActive?2:0);b=0===d&&!a.metaActive?"-default":""===b?"":"-"+b;a.$keyboard.find(".ui-keyboard-keyset"+b+a.rows[d]).length?(a.$keyboard.find(".ui-keyboard-alt, .ui-keyboard-shift, .ui-keyboard-actionkey[class*=meta]").removeClass(c.css.buttonAction).end().find(".ui-keyboard-alt")[a.altActive?"addClass":"removeClass"](c.css.buttonAction).end().find(".ui-keyboard-shift")[a.shiftActive? "addClass":"removeClass"](c.css.buttonAction).end().find(".ui-keyboard-lock")[a.capsLock?"addClass":"removeClass"](c.css.buttonAction).end().find(".ui-keyboard-keyset").hide().end().find(".ui-keyboard-keyset"+b+a.rows[d]).show().end().find(".ui-keyboard-actionkey.ui-keyboard"+b).addClass(c.css.buttonAction),a.lastKeyset=[a.shiftActive,a.altActive,a.metaActive]):(a.shiftActive=a.lastKeyset[0],a.altActive=a.lastKeyset[1],a.metaActive=a.lastKeyset[2])};a.checkCombos=function(){var e,b,d,i,g=a.$preview.val(), h=a.$preview.caret(),j=g.length;h.end<h.start&&(h.end=h.start);h.start>j&&(h.end=h.start=j);a.msie&&"\n"===g.substr(h.start,1)&&(h.start+=1,h.end+=1);c.useCombos&&(a.msie?g=g.replace(a.regex,function(a,e,b){return c.combos.hasOwnProperty(e)?c.combos[e][b]||a:a}):a.$preview.length&&(d=h.start-(0<=h.start-2?2:0),a.$preview.caret(d,h.end),i=a.$preview.caret().text.replace(a.regex,function(a,e,b){return c.combos.hasOwnProperty(e)?c.combos[e][b]||a:a}),a.$preview.val(a.$preview.caret().replace(i)),g=a.$preview.val())); if(c.restrictInput&&""!==g){d=g;b=a.acceptedKeys.length;for(e=0;e<b;e++)""!==d&&(i=a.acceptedKeys[e],0<=g.indexOf(i)&&(/[\[|\]|\\|\^|\$|\.|\||\?|\*|\+|\(|\)|\{|\}]/g.test(i)&&(i="\\"+i),d=d.replace(RegExp(i,"g"),"")));""!==d&&(g=g.replace(d,""))}h.start+=g.length-j;h.end+=g.length-j;a.$preview.val(g);a.$preview.caret(h.start,h.end);a.preview.scrollTop=a.lineHeight*(g.substring(0,h.start).split("\n").length-1);a.lastCaret={start:h.start,end:h.end};c.acceptValid&&a.checkValid();return g};a.checkValid= function(){var e=!0;c.validate&&"function"===typeof c.validate&&(e=c.validate(a,a.$preview.val(),!1));a.$keyboard.find(".ui-keyboard-accept")[e?"removeClass":"addClass"]("ui-keyboard-invalid-input")[e?"addClass":"removeClass"]("ui-keyboard-valid-input")};a.checkDecimal=function(){a.decimal&&/\./g.test(a.preview.value)||!a.decimal&&/\,/g.test(a.preview.value)?a.$decBtn.attr({disabled:"disabled","aria-disabled":"true"}).removeClass(c.css.buttonDefault+" "+c.css.buttonHover).addClass(c.css.buttonDisabled): a.$decBtn.removeAttr("disabled").attr({"aria-disabled":"false"}).addClass(c.css.buttonDefault).removeClass(c.css.buttonDisabled)};a.getLayers=function(a){var b;b=a.attr("data-pos");return a.closest(".ui-keyboard").find('button[data-pos="'+b+'"]').map(function(){return d(this).find("> span").text()}).get()};a.isCurrent=function(e){var b=d.keyboard.currentKeyboard||!1;e?b=d.keyboard.currentKeyboard=a.el:!1===e&&b===a.el&&(b=d.keyboard.currentKeyboard="");return b===a.el};a.switchInput=function(e,b){if("function"=== typeof c.switchInput)c.switchInput(a,e,b);else{var k;k=!1;var i=d(".ui-keyboard-input:visible"),g=i.index(a.$el)+(e?1:-1);g>i.length-1&&(k=c.stopAtEnd,g=0);0>g&&(k=c.stopAtEnd,g=i.length-1);k||(a.close(b),(k=i.eq(g).data("keyboard"))&&k.options.openOn.length&&k.focusOn())}return!1};a.close=function(e){if(a.isVisible()){clearTimeout(a.throttled);var b=e?a.checkCombos():a.originalContent;if(e&&(c.validate&&"function"===typeof c.validate&&!c.validate(a,b,!0))&&(b=a.originalContent,e=!1,c.cancelClose))return; a.isCurrent(!1);a.$el.removeClass("ui-keyboard-input-current ui-keyboard-autoaccepted").addClass(e?!0===e?"":"ui-keyboard-autoaccepted":"").trigger(c.alwaysOpen?"":"beforeClose.keyboard",[a,a.el,e||!1]).val(b).scrollTop(a.el.scrollHeight).trigger(e?"accepted.keyboard":"canceled.keyboard",[a,a.el]).trigger(c.alwaysOpen?"inactive.keyboard":"hidden.keyboard",[a,a.el]).blur();c.openOn&&(a.timer=setTimeout(function(){a.$el.bind(c.openOn+".keyboard",function(){a.focusOn()});d(":focus")[0]===a.el&&a.$el.blur()}, 500));c.alwaysOpen||a.$keyboard.hide();!a.watermark&&(""===a.el.value&&""!==a.inPlaceholder)&&a.$el.addClass("ui-keyboard-placeholder").val(a.inPlaceholder)}return!!e};a.accept=function(){return a.close(!0)};a.escClose=function(e){if("keyup"===e.type)return 27===e.which?a.close():"";var b=a.isCurrent();if(a.isVisible()&&!(c.alwaysOpen&&!b||!c.alwaysOpen&&c.stayOpen&&b&&!a.isVisible())&&e.target!==a.el&&b)a.allie&&e.preventDefault(),a.close(c.autoAccept?"true":!1)};a.keyBtn=d("<button />").attr({role:"button", "aria-disabled":"false",tabindex:"-1"}).addClass("ui-keyboard-button");a.addKey=function(b,f,k){var i,g,h,f=!0===k?b:c.display[f]||b,j=!0===k?b.charCodeAt(0):b;/\(.+\)/.test(f)&&(g=f.replace(/\(([^()]+)\)/,""),i=f.match(/\(([^()]+)\)/)[1],f=g,h=g.split(":"),g=""!==h[0]&&1<h.length?h[0]:g,a.mappedKeys[i]=g);h=f.split(":");""===h[0]&&""===h[1]&&(f=":");f=""!==h[0]&&1<h.length?d.trim(h[0]):f;i=1<h.length?d.trim(h[1]).replace(/_/g," ")||"":"";g=1<f.length?" ui-keyboard-widekey":"";g+=k?"":" ui-keyboard-actionkey"; return a.keyBtn.clone().attr({"data-value":f,name:j,"data-pos":a.temp[1]+","+a.temp[2],title:i}).data("key",{action:b,original:f,curTxt:f,curNum:0}).addClass("ui-keyboard-"+j+g+" "+c.css.buttonDefault).html("<span>"+f+"</span>").appendTo(a.temp[0])};a.buildKeyboard=function(){var b,f,k,i,g,h,j,l,p=0,n=d("<div />").addClass("ui-keyboard "+c.css.container+(c.alwaysOpen?" ui-keyboard-always-open":"")).attr({role:"textbox"}).hide();c.usePreview?(a.$preview=a.$el.clone(!1).removeAttr("id").removeClass("ui-keyboard-placeholder ui-keyboard-input").addClass("ui-keyboard-preview "+ c.css.input).attr("tabindex","-1").show(),d("<div />").addClass("ui-keyboard-preview-wrapper").append(a.$preview).appendTo(n)):(a.$preview=a.$el,c.position.at=c.position.at2);c.lockInput&&a.$preview.addClass("ui-keyboard-lockedinput").attr({readonly:"readonly"});if("custom"===c.layout||!d.keyboard.layouts.hasOwnProperty(c.layout))c.layout="custom",d.keyboard.layouts.custom=c.customLayout||{"default":["{cancel}"]};d.each(d.keyboard.layouts[c.layout],function(q,r){if(""!==q){p++;k=d("<div />").attr("name", q).addClass("ui-keyboard-keyset ui-keyboard-keyset-"+q).appendTo(n)["default"===q?"show":"hide"]();for(f=0;f<r.length;f++){g=d.trim(r[f]).replace(/\{(\.?)[\s+]?:[\s+]?(\.?)\}/g,"{$1:$2}");j=g.split(/\s+/);for(h=0;h<j.length;h++)if(a.temp=[k,f,h],i=!1,0!==j[h].length)if(/^\{\S+\}$/.test(j[h]))if(b=j[h].match(/^\{(\S+)\}$/)[1].toLowerCase(),/\!\!/.test(b)&&(b=b.replace("!!",""),i=!0),/^sp:((\d+)?([\.|,]\d+)?)(em|px)?$/.test(b)&&(l=parseFloat(b.replace(/,/,".").match(/^sp:((\d+)?([\.|,]\d+)?)(em|px)?$/)[1]|| 0),d("<span>&nbsp;</span>").width(b.match("px")?l+"px":2*l+"em").addClass("ui-keyboard-button ui-keyboard-spacer").appendTo(k)),/^meta\d+\:?(\w+)?/.test(b))a.addKey(b,b);else switch(b){case "a":case "accept":a.addKey("accept",b).addClass(c.css.buttonAction);break;case "alt":case "altgr":a.addKey("alt","alt");break;case "b":case "bksp":a.addKey("bksp",b);break;case "c":case "cancel":a.addKey("cancel",b).addClass(c.css.buttonAction);break;case "combo":a.addKey("combo","combo").addClass(c.css.buttonAction); break;case "dec":a.acceptedKeys.push(a.decimal?".":",");a.addKey("dec","dec");break;case "e":case "enter":a.addKey("enter",b).addClass(c.css.buttonAction);break;case "s":case "shift":a.addKey("shift",b);break;case "sign":a.acceptedKeys.push("-");a.addKey("sign","sign");break;case "space":a.acceptedKeys.push(" ");a.addKey("space","space");break;case "t":case "tab":a.addKey("tab",b);break;default:if(d.keyboard.keyaction.hasOwnProperty(b))a.addKey(b,b)[i?"addClass":"removeClass"](c.css.buttonAction)}else a.acceptedKeys.push(j[h].split(":")[0]), a.addKey(j[h],j[h],!0);k.find(".ui-keyboard-button:last").after('<br class="ui-keyboard-button-endrow">')}}});1<p&&(a.sets=!0);a.hasMappedKeys=!d.isEmptyObject(a.mappedKeys);return n};a.destroy=function(){d(document).unbind("mousedown.keyboard keyup.keyboard touchstart.keyboard");a.$keyboard&&a.$keyboard.remove();var b=d.trim(c.openOn+" accepted beforeClose canceled change contextmenu hidden initialized keydown keypress keyup visible").split(" ").join(".keyboard ");a.$el.removeClass("ui-keyboard-input ui-keyboard-lockedinput ui-keyboard-placeholder ui-keyboard-notallowed ui-keyboard-always-open "+ c.css.input).removeAttr("aria-haspopup").removeAttr("role").unbind(b+".keyboard").removeData("keyboard")};a.init()};d.keyboard.keyaction={accept:function(b){b.close(!0);return!1},alt:function(b,d){b.altActive=!b.altActive;b.showKeySet(d)},bksp:function(b){b.insertText("bksp")},cancel:function(b){b.close();return!1},clear:function(b){b.$preview.val("")},combo:function(b){var d=!b.options.useCombos;b.options.useCombos=d;b.$keyboard.find(".ui-keyboard-combo")[d?"addClass":"removeClass"](b.options.css.buttonAction); d&&b.checkCombos();return!1},dec:function(b){b.insertText(b.decimal?".":",")},"default":function(b,d){b.shiftActive=b.altActive=b.metaActive=!1;b.showKeySet(d)},enter:function(b,l,a){var l=b.el.tagName,c=b.options;if(a.shiftKey)return c.enterNavigation?b.switchInput(!a[c.enterMod],!0):b.close(!0);if(c.enterNavigation&&("TEXTAREA"!==l||a[c.enterMod]))return b.switchInput(!a[c.enterMod],c.autoAccept?"true":!1);"TEXTAREA"===l&&d(a.target).closest("button").length&&b.insertText(" \n")},lock:function(b, d){b.lastKeyset[0]=b.shiftActive=b.capsLock=!b.capsLock;b.showKeySet(d)},meta:function(b,l){b.metaActive=d(l).hasClass(b.options.css.buttonAction)?!1:!0;b.showKeySet(l)},next:function(b){b.switchInput(!0,b.options.autoAccept);return!1},prev:function(b){b.switchInput(!1,b.options.autoAccept);return!1},shift:function(b,d){b.lastKeyset[0]=b.shiftActive=!b.shiftActive;b.showKeySet(d)},sign:function(b){/^\-?\d*\.?\d*$/.test(b.$preview.val())&&b.$preview.val(-1*b.$preview.val())},space:function(b){b.insertText(" ")}, tab:function(b){var d=b.options;if("INPUT"===b.el.tagName)return d.tabNavigation?b.switchInput(!b.shiftActive,!0):!1;b.insertText("\t")}};d.keyboard.layouts={alpha:{"default":["` 1 2 3 4 5 6 7 8 9 0 - = {bksp}","{tab} a b c d e f g h i j [ ] \\","k l m n o p q r s ; ' {enter}","{shift} t u v w x y z , . / {shift}","{accept} {space} {cancel}"],shift:["~ ! @ # $ % ^ & * ( ) _ + {bksp}","{tab} A B C D E F G H I J { } |",'K L M N O P Q R S : " {enter}',"{shift} T U V W X Y Z < > ? {shift}","{accept} {space} {cancel}"]}, qwerty:{"default":["` 1 2 3 4 5 6 7 8 9 0 - = {bksp}","{tab} q w e r t y u i o p [ ] \\","a s d f g h j k l ; ' {enter}","{shift} z x c v b n m , . / {shift}","{accept} {space} {cancel}"],shift:["~ ! @ # $ % ^ & * ( ) _ + {bksp}","{tab} Q W E R T Y U I O P { } |",'A S D F G H J K L : " {enter}',"{shift} Z X C V B N M < > ? {shift}","{accept} {space} {cancel}"]},international:{"default":["` 1 2 3 4 5 6 7 8 9 0 - = {bksp}","{tab} q w e r t y u i o p [ ] \\","a s d f g h j k l ; ' {enter}","{shift} z x c v b n m , . / {shift}", "{accept} {alt} {space} {alt} {cancel}"],shift:["~ ! @ # $ % ^ & * ( ) _ + {bksp}","{tab} Q W E R T Y U I O P { } |",'A S D F G H J K L : " {enter}',"{shift} Z X C V B N M < > ? {shift}","{accept} {alt} {space} {alt} {cancel}"],alt:["~ \u00a1 \u00b2 \u00b3 \u00a4 \u20ac \u00bc \u00bd \u00be \u2018 \u2019 \u00a5 \u00d7 {bksp}","{tab} \u00e4 \u00e5 \u00e9 \u00ae \u00fe \u00fc \u00fa \u00ed \u00f3 \u00f6 \u00ab \u00bb \u00ac","\u00e1 \u00df \u00f0 f g h j k \u00f8 \u00b6 \u00b4 {enter}","{shift} \u00e6 x \u00a9 v b \u00f1 \u00b5 \u00e7 > \u00bf {shift}", "{accept} {alt} {space} {alt} {cancel}"],"alt-shift":["~ \u00b9 \u00b2 \u00b3 \u00a3 \u20ac \u00bc \u00bd \u00be \u2018 \u2019 \u00a5 \u00f7 {bksp}","{tab} \u00c4 \u00c5 \u00c9 \u00ae \u00de \u00dc \u00da \u00cd \u00d3 \u00d6 \u00ab \u00bb \u00a6","\u00c4 \u00a7 \u00d0 F G H J K \u00d8 \u00b0 \u00a8 {enter}","{shift} \u00c6 X \u00a2 V B \u00d1 \u00b5 \u00c7 . \u00bf {shift}","{accept} {alt} {space} {alt} {cancel}"]},dvorak:{"default":["` 1 2 3 4 5 6 7 8 9 0 [ ] {bksp}","{tab} ' , . p y f g c r l / = \\", "a o e u i d h t n s - {enter}","{shift} ; q j k x b m w v z {shift}","{accept} {space} {cancel}"],shift:["~ ! @ # $ % ^ & * ( ) { } {bksp}",'{tab} " < > P Y F G C R L ? + |',"A O E U I D H T N S _ {enter}","{shift} : Q J K X B M W V Z {shift}","{accept} {space} {cancel}"]},num:{"default":"= ( ) {b};{clear} / * -;7 8 9 +;4 5 6 {sign};1 2 3 %;0 . {a} {c}".split(";")}};d.keyboard.defaultOptions={layout:"qwerty",customLayout:null,position:{of:null,my:"center top",at:"center top",at2:"center bottom"}, usePreview:!0,alwaysOpen:!1,stayOpen:!1,display:{a:"\u2714:Accept (Shift-Enter)",accept:"Accept:Accept (Shift-Enter)",alt:"Alt:\u2325 AltGr",b:"\u232b:Backspace",bksp:"Bksp:Backspace",c:"\u2716:Cancel (Esc)",cancel:"Cancel:Cancel (Esc)",clear:"C:Clear",combo:"\u00f6:Toggle Combo Keys",dec:".:Decimal",e:"\u23ce:Enter",enter:"Enter:Enter \u23ce",lock:"Lock:\u21ea Caps Lock",next:"Next \u21e8",prev:"\u21e6 Prev",s:"\u21e7:Shift",shift:"Shift:Shift",sign:"\u00b1:Change Sign",space:"&nbsp;:Space",t:"\u21e5:Tab", tab:"\u21e5 Tab:Tab"},wheelMessage:"Use mousewheel to see other keys",css:{input:"ui-widget-content ui-corner-all",container:"ui-widget-content ui-widget ui-corner-all ui-helper-clearfix",buttonDefault:"ui-state-default ui-corner-all",buttonHover:"ui-state-hover",buttonAction:"ui-state-active",buttonDisabled:"ui-state-disabled"},autoAccept:!1,lockInput:!1,restrictInput:!1,acceptValid:!1,cancelClose:!0,tabNavigation:!1,enterNavigation:!1,enterMod:"altKey",stopAtEnd:!0,appendLocally:!1,stickyShift:!0, preventPaste:!1,maxLength:!1,repeatDelay:500,repeatRate:20,resetDefault:!1,openOn:"focus",keyBinding:"mousedown touchstart",useCombos:!0,combos:{"`":{a:"\u00e0",A:"\u00c0",e:"\u00e8",E:"\u00c8",i:"\u00ec",I:"\u00cc",o:"\u00f2",O:"\u00d2",u:"\u00f9",U:"\u00d9",y:"\u1ef3",Y:"\u1ef2"},"'":{a:"\u00e1",A:"\u00c1",e:"\u00e9",E:"\u00c9",i:"\u00ed",I:"\u00cd",o:"\u00f3",O:"\u00d3",u:"\u00fa",U:"\u00da",y:"\u00fd",Y:"\u00dd"},'"':{a:"\u00e4",A:"\u00c4",e:"\u00eb",E:"\u00cb",i:"\u00ef",I:"\u00cf",o:"\u00f6", O:"\u00d6",u:"\u00fc",U:"\u00dc",y:"\u00ff",Y:"\u0178"},"^":{a:"\u00e2",A:"\u00c2",e:"\u00ea",E:"\u00ca",i:"\u00ee",I:"\u00ce",o:"\u00f4",O:"\u00d4",u:"\u00fb",U:"\u00db",y:"\u0177",Y:"\u0176"},"~":{a:"\u00e3",A:"\u00c3",e:"\u1ebd",E:"\u1ebc",i:"\u0129",I:"\u0128",o:"\u00f5",O:"\u00d5",u:"\u0169",U:"\u0168",y:"\u1ef9",Y:"\u1ef8",n:"\u00f1",N:"\u00d1"}},validate:function(){return!0}};d.keyboard.comboRegex=/([`\'~\^\"ao])([a-z])/mig;d.keyboard.currentKeyboard="";d.fn.keyboard=function(b){return this.each(function(){d(this).data("keyboard")|| new d.keyboard(this,b)})};d.fn.getkeyboard=function(){return this.data("keyboard")}})(jQuery);

(function(d,b,l,a){d.fn.caret=function(c,d){if("undefined"===typeof this[0]||this.is(":hidden")||"hidden"===this.css("visibility"))return this;var f,k,i,g,h,j;f=document.selection;var m=this[0],p=m.scrollTop;j=window.opera&&"[object Opera]"===window.opera.toString();var n="undefined"!==typeof m.selectionStart;"number"===typeof c&&"number"===typeof d&&(i=c,h=d);if("undefined"!==typeof i)return n?("TEXTAREA"===m.tagName&&j&&(j=this.val(),f=j.substring(0,i).split("\n")[b]-1,i+=0<f?f:0,h+=0<f?f:0),m.selectionStart= i,m.selectionEnd=h):(f=m.createTextRange(),f.collapse(!0),f.moveStart("character",i),f.moveEnd("character",h-i),f.select()),(this.is(":visible")||"hidden"!==this.css("visibility"))&&this.focus(),m.scrollTop=p,this;n?(k=m.selectionStart,g=m.selectionEnd,"TEXTAREA"===m.tagName&&j&&(j=this.val(),f=j.substring(0,k).split("\n")[b]-1,k+=0<f?-f:0,g+=0<f?-f:0)):"TEXTAREA"===m.tagName?(j=this.val(),i=f[l](),h=i[a](),h.moveToElementText(m),h.setEndPoint("EndToEnd",i),k=h.text.replace(/\r\n/g,"\r")[b],g=k+i.text.replace(/\r\n/g, "\r")[b]):(j=this.val().replace(/\r\n/g,"\r"),i=f[l]()[a](),i.moveEnd("character",j[b]),k=""===i.text?j[b]:j.lastIndexOf(i.text),i=f[l]()[a](),i.moveStart("character",-j[b]),g=i.text[b]);i=m.value.substring(k,g);return{start:k,end:g,text:i,replace:function(a){return m.value.substring(0,k)+a+m.value.substring(g,m.value[b])}}}})(jQuery,"length","createRange","duplicate");// tipsy, facebook style tooltips for jquery
// version 1.0.0a
// (c) 2008-2010 jason frame [jason@onehackoranother.com]
// releated under the MIT license

(function($) {
    
    function fixTitle($ele) {
        if ($ele.attr('title') || typeof($ele.attr('original-title')) != 'string') {
            $ele.attr('original-title', $ele.attr('title') || '').removeAttr('title');
        }
    }
    
    function Tipsy(element, options) {
        this.$element = $(element);
        this.options = options;
        this.enabled = true;
        fixTitle(this.$element);
    }
    
    Tipsy.prototype = {
        show: function() {
            var title = this.getTitle();
            if (title && this.enabled) {
                var $tip = this.tip();
                
                $tip.find('.tipsy-inner')[this.options.html ? 'html' : 'text'](title);
                $tip[0].className = 'tipsy'; // reset classname in case of dynamic gravity
                $tip.remove().css({top: 0, left: 0, visibility: 'hidden', display: 'block'}).appendTo(document.body);
                
                var pos = $.extend({}, this.$element.offset(), {
                    width: this.$element[0].offsetWidth,
                    height: this.$element[0].offsetHeight
                });
                
                var actualWidth = $tip[0].offsetWidth, actualHeight = $tip[0].offsetHeight;
                var gravity = (typeof this.options.gravity == 'function')
                                ? this.options.gravity.call(this.$element[0])
                                : this.options.gravity;
                
                var tp;
                switch (gravity.charAt(0)) {
                    case 'n':
                        tp = {top: pos.top + pos.height + this.options.offset, left: pos.left + pos.width / 2 - actualWidth / 2};
                        break;
                    case 's':
                        tp = {top: pos.top - actualHeight - this.options.offset, left: pos.left + pos.width / 2 - actualWidth / 2};
                        break;
                    case 'e':
                        tp = {top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left - actualWidth - this.options.offset};
                        break;
                    case 'w':
                        tp = {top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left + pos.width + this.options.offset};
                        break;
                }
                
                if (gravity.length == 2) {
                    if (gravity.charAt(1) == 'w') {
                        tp.left = pos.left + pos.width / 2 - 15;
                    } else {
                        tp.left = pos.left + pos.width / 2 - actualWidth + 15;
                    }
                }
                
                $tip.css(tp).addClass('tipsy-' + gravity);
                
                if (this.options.fade) {
                    $tip.stop().css({opacity: 0, display: 'block', visibility: 'visible'}).animate({opacity: this.options.opacity});
                } else {
                    $tip.css({visibility: 'visible', opacity: this.options.opacity});
                }
            }
        },
        
        hide: function() {
            if (this.options.fade) {
                this.tip().stop().fadeOut(function() { $(this).remove(); });
            } else {
                this.tip().remove();
            }
        },
        
        getTitle: function() {
            var title, $e = this.$element, o = this.options;
            fixTitle($e);
            var title, o = this.options;
            if (typeof o.title == 'string') {
                title = $e.attr(o.title == 'title' ? 'original-title' : o.title);
            } else if (typeof o.title == 'function') {
                title = o.title.call($e[0]);
            }
            title = ('' + title).replace(/(^\s*|\s*$)/, "");
            return title || o.fallback;
        },
        
        tip: function() {
            if (!this.$tip) {
                this.$tip = $('<div class="tipsy"></div>').html('<div class="tipsy-arrow"></div><div class="tipsy-inner"/></div>');
            }
            return this.$tip;
        },
        
        validate: function() {
            if (!this.$element[0].parentNode) {
                this.hide();
                this.$element = null;
                this.options = null;
            }
        },
        
        enable: function() { this.enabled = true; },
        disable: function() { this.enabled = false; },
        toggleEnabled: function() { this.enabled = !this.enabled; }
    };
    
    $.fn.tipsy = function(options) {
        
        if (options === true) {
            return this.data('tipsy');
        } else if (typeof options == 'string') {
            return this.data('tipsy')[options]();
        }
        
        options = $.extend({}, $.fn.tipsy.defaults, options);
        
        function get(ele) {
            var tipsy = $.data(ele, 'tipsy');
            if (!tipsy) {
                tipsy = new Tipsy(ele, $.fn.tipsy.elementOptions(ele, options));
                $.data(ele, 'tipsy', tipsy);
            }
            return tipsy;
        }
        
        function enter() {
            var tipsy = get(this);
            tipsy.hoverState = 'in';
            if (options.delayIn == 0) {
                tipsy.show();
            } else {
                setTimeout(function() { if (tipsy.hoverState == 'in') tipsy.show(); }, options.delayIn);
            }
        };
        
        function leave() {
            var tipsy = get(this);
            tipsy.hoverState = 'out';
            if (options.delayOut == 0) {
                tipsy.hide();
            } else {
                setTimeout(function() { if (tipsy.hoverState == 'out') tipsy.hide(); }, options.delayOut);
            }
        };
        
        if (!options.live) this.each(function() { get(this); });
        
        if (options.trigger != 'manual') {
            var binder   = options.live ? 'live' : 'bind',
                eventIn  = options.trigger == 'hover' ? 'mouseenter' : 'focus',
                eventOut = options.trigger == 'hover' ? 'mouseleave' : 'blur';
            this[binder](eventIn, enter)[binder](eventOut, leave);
        }
        
        return this;
        
    };
    
    $.fn.tipsy.defaults = {
        delayIn: 0,
        delayOut: 0,
        fade: false,
        fallback: '',
        gravity: 'n',
        html: false,
        live: false,
        offset: 0,
        opacity: 0.8,
        title: 'title',
        trigger: 'hover'
    };
    
    // Overwrite this method to provide options on a per-element basis.
    // For example, you could store the gravity in a 'tipsy-gravity' attribute:
    // return $.extend({}, options, {gravity: $(ele).attr('tipsy-gravity') || 'n' });
    // (remember - do not modify 'options' in place!)
    $.fn.tipsy.elementOptions = function(ele, options) {
        return $.metadata ? $.extend({}, options, $(ele).metadata()) : options;
    };
    
    $.fn.tipsy.autoNS = function() {
        return $(this).offset().top > ($(document).scrollTop() + $(window).height() / 2) ? 's' : 'n';
    };
    
    $.fn.tipsy.autoWE = function() {
        return $(this).offset().left > ($(document).scrollLeft() + $(window).width() / 2) ? 'e' : 'w';
    };
    
})(jQuery);
(function() {
  var browserVocabulary, exec, format, inherit;

  exec = require('./compiler').exec;

  browserVocabulary = require('./browser').browserVocabulary;

  inherit = require('./helpers').inherit;

  format = require('./formatter').format;

  jQuery(function($) {
    var a, code, execute, hSymbolDefs, hashParams, i, k, mapping, name, nameValue, rMapping, symbolDef, symbolDefs, tipsyOpts, v, value, _i, _j, _k, _l, _len, _len1, _len2, _ref, _ref1, _ref2, _ref3, _ref4;
    hashParams = {};
    if (location.hash) {
      _ref = location.hash.substring(1).split(',');
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        nameValue = _ref[_i];
        _ref1 = nameValue.split('='), name = _ref1[0], value = _ref1[1];
        hashParams[name] = unescape(value);
      }
    }
    $('#code').text(hashParams.code || '').focus();
    $('#permalink').tipsy({
      gravity: 'e',
      opacity: 1,
      delayIn: 1000
    }).bind('mouseover focus', function() {
      $(this).attr('href', '#code=' + escape($('#code').val()));
      return false;
    });
    execute = function() {
      var ctx, result;
      ctx = inherit(browserVocabulary);
      try {
        result = exec($('#code').val());
        $('#result').removeClass('error').text(format(result).join('\n'));
      } catch (err) {
        if (typeof console !== "undefined" && console !== null) {
          if (typeof console.error === "function") {
            console.error(err);
          }
        }
        $('#result').addClass('error').text(err.message);
      }
    };
    $('#go').tipsy({
      gravity: 'e',
      opacity: 1,
      delayIn: 1000
    }).closest('form').submit(function() {
      execute();
      return false;
    });
    symbolDefs = [
      ['+', 'Conjugate, Add'], ['−', 'Negate, Subtract'], ['×', 'Sign of, Multiply'], ['÷', 'Reciprocal, Divide'], ['⌈', 'Ceiling, Greater of'], ['⌊', 'Floor, Lesser of'], ['∣', 'Absolute value, Residue'], ['⍳', 'Index generator, Index of'], ['?', 'Roll, Deal'], ['⋆', 'Exponential, To the power of'], ['⍟', 'Natural logarithm, Logarithm to the base'], ['○', 'Pi times, Circular and hyperbolic functions'], ['!', 'Factorial, Binomial'], ['⌹', 'Matrix inverse, Matrix divide'], ['<', 'Less than'], ['≤', 'Less than or equal'], ['=', 'Equal'], ['≥', 'Greater than or equal'], ['>', 'Greater than'], ['≠', 'Not equal'], ['≡', 'Depth, Match'], ['≢', 'Not match'], ['∈', 'Enlist, Membership'], ['⍷', 'Find'], ['∪', 'Unique, Union'], ['∩', 'Intersection'], ['∼', 'Not, Without'], ['∨', 'Or (Greatest Common Divisor)'], ['∧', 'And (Least Common Multiple)'], ['⍱', 'Nor'], ['⍲', 'Nand'], ['⍴', 'Shape of, Reshape'], [',', 'Ravel, Catenate'], ['⍪', 'First axis catenate'], ['⌽', 'Reverse, Rotate'], ['⊖', 'First axis rotate'], ['⍉', 'Transpose'], ['↑', 'First, Take'], ['↓', 'Drop'], ['⊂', 'Enclose, Partition'], ['⊃', 'Disclose, Pick'], ['⌷', 'Index'], ['⍋', 'Grade up'], ['⍒', 'Grade down'], ['⊤', 'Encode'], ['⊥', 'Decode'], ['⍕', 'Format, Format by specification'], ['⍎', 'Execute'], ['⊣', 'Stop, Left'], ['⊢', 'Pass, Right'], ['⎕', 'Evaluated input, Output with a newline'], ['⍞', 'Character input, Bare output'], ['¨', 'Each'], [
        '∘.', 'Outer product', {
          keys: '`j.'
        }
      ], ['/', 'Reduce'], ['⌿', '1st axis reduce'], ['\\', 'Scan'], ['⍀', '1st axis scan'], ['⍣', 'Power operator'], ['¯', 'Negative number sign'], ['⍝', 'Comment'], ['←', 'Assignment'], ['⍬', 'Zilde'], ['◇', 'Statement separator'], ['⍺', 'Left formal parameter'], ['⍵', 'Right formal parameter']
    ];
    mapping = {};
    rMapping = {};
    a = '`< «   `= ×   `> »   `_ ≡   `- −   `, ⍪   `; ◇   `: ÷   `! ⍣   `/ ⌿   `( ⍱\n`) ⍲   `[ ←   `\\ ⍀  `0 ∧   `1 ¨   `2 ¯   `4 ≤   `6 ≥   `8 ≠   `9 ∨   `a ⍺\n`A ⊖   `b ⊥   `B ⍎   `c ∩   `C ⍝   `d ⌊   `e ∈   `E ⍷   `g ∇   `G ⍒   `h ∆\n`H ⍋   `i ⍳   `I ⌷   `j ∘   `l ⎕   `L ⍞   `m ∣   `n ⊤   `N ⍕   `o ○   `O ⍬\n`p ⋆   `P ⍟   `r ⍴   `s ⌈   `t ∼   `T ⍉   `u ↓   `v ∪   `w ⍵   `W ⌽   `x ⊃\n`y ↑   `z ⊂'.replace(/(^\s+|\s+$)/g, '').split(/\s+/);
    for (i = _j = 0, _ref2 = a.length / 2; 0 <= _ref2 ? _j < _ref2 : _j > _ref2; i = 0 <= _ref2 ? ++_j : --_j) {
      k = a[2 * i];
      v = a[2 * i + 1];
      mapping[k] = v;
      rMapping[v] = k;
    }
    hSymbolDefs = {};
    for (_k = 0, _len1 = symbolDefs.length; _k < _len1; _k++) {
      symbolDef = symbolDefs[_k];
      hSymbolDefs[symbolDef[0]] = symbolDef;
    }
    $('#code').keydown(function(event) {
      if (event.keyCode === 13 && event.ctrlKey) {
        $('#go').click();
        return false;
      }
    });
    $('#code').retype('on', {
      mapping: mapping
    });
    $('textarea').keyboard({
      layout: 'custom',
      useCombos: false,
      display: {
        bksp: 'Bksp',
        shift: '⇧',
        alt: 'Alt',
        enter: 'Enter',
        exec: '⍎'
      },
      autoAccept: true,
      usePreview: false,
      customLayout: {
        "default": ['1 2 3 4 5 6 7 8 9 0 - =', 'q w e r t y u i o p [ ]', 'a s d f g h j k l {enter}', '{shift} z x c v b n m , . {bksp}', '{alt} {space} {exec!!}'],
        shift: ['! @ # $ % ^ & * ( ) _ +', 'Q W E R T Y U I O P { }', 'A S D F G H J K L {enter}', '{shift} Z X C V B N M < > {bksp}', '{alt} {space} {exec!!}'],
        alt: ['¨ ¯ < ≤ = ≥ > ≠ ∨ ∧ − ×', '░ ⍵ ∈ ⍴ ∼ ↑ ↓ ⍳ ○ ⋆ ← ░', '⍺ ⌈ ⌊ ░ ∇ ∆ ∘ ░ ⎕ {enter}', '{shift} ⊂ ⊃ ∩ ∪ ⊥ ⊤ ∣ ⍪ ░ {bksp}', '{alt} {space} {exec!!}'],
        'alt-shift': ['⍣ ░ ░ ░ ░ ░ ░ ░ ⍱ ⍲ ≡ ░', '░ ⌽ ⍷ ░ ⍉ ░ ░ ⌷ ⍬ ⍟ ░ ░', '⊖ ░ ░ ░ ⍒ ⍋ ░ ░ ⍞ {enter}', '{shift} ░ ░ ⍝ ░ ⍎ ⍕ ░ « » {bksp}', '{alt} {space} {exec!!}']
      }
    });
    $.keyboard.keyaction.exec = execute;
    $('textarea').focus();
    tipsyOpts = {
      title: function() {
        return (hSymbolDefs[$(this).text()] || {})[1] || '';
      },
      gravity: 's',
      delayIn: 1000,
      opacity: 1
    };
    $('.ui-keyboard').on('mouseover', '.ui-keyboard-button', function(event) {
      var $b;
      $b = $(event.target).closest('.ui-keyboard-button');
      if (!$b.data('tipsyInitialised')) {
        $b.data('tipsyInitialised', true).tipsy(tipsyOpts).tipsy('show');
      }
      return false;
    });
    _ref3 = window.examples;
    for (i = _l = 0, _len2 = _ref3.length; _l < _len2; i = ++_l) {
      _ref4 = _ref3[i], name = _ref4[0], code = _ref4[1];
      $('#examples').append(" <a href='#example" + i + "'>" + name + "</a>");
    }
    $('#examples').on('click', 'a', function() {
      var _ref5;
      _ref5 = window.examples[parseInt($(this).attr('href').replace(/#example(\d+)$/, '$1'))], name = _ref5[0], code = _ref5[1];
      $('#code').val(code).focus();
      return false;
    });
    return {};
  });

}).call(this);
