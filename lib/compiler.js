(function() {
  var Complex, all, assert, assignParents, closestScope, compile, die, inherit, nodes, parser, resolveExprs, toJavaScript, vocabulary, _ref;

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

  this.nodes = nodes = function(aplCode, opts) {
    var ast;
    if (opts == null) {
      opts = {};
    }
    ast = parser.parse(aplCode);
    assignParents(ast);
    resolveExprs(ast, opts);
    return ast;
  };

  this.compile = compile = function(aplCode, opts) {
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

  this.exec = function(aplCode, opts) {
    if (opts == null) {
      opts = {};
    }
    return (new Function("var _ = arguments[0];\n" + (compile(aplCode, opts))))(inherit(vocabulary, opts.extraContext));
  };

}).call(this);
