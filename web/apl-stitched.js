
(function(/*! Stitch !*/) {
  if (!this.require) {
    var modules = {}, cache = {}, require = function(name, root) {
      var path = expand(root, name), module = cache[path], fn;
      if (module) {
        return module.exports;
      } else if (fn = modules[path] || modules[path = expand(path, './index')]) {
        module = {id: path, exports: {}};
        try {
          cache[path] = module;
          fn.apply(module.exports, [module.exports, function(name) {
            return require(name, dirname(path));
          }, module]);
          return module.exports;
        } catch (err) {
          delete cache[path];
          throw err;
        }
      } else {
        throw 'module \'' + name + '\' not found';
      }
    }, expand = function(root, name) {
      var results = [], parts, part;
      if (/^\.\.?(\/|$)/.test(name)) {
        parts = [root, name].join('/').split('/');
      } else {
        parts = name.split('/');
      }
      for (var i = 0, length = parts.length; i < length; i++) {
        part = parts[i];
        if (part == '..') {
          results.pop();
        } else if (part != '.' && part != '') {
          results.push(part);
        }
      }
      return results.join('/');
    }, dirname = function(path) {
      return path.split('/').slice(0, -1).join('/');
    };
    this.require = function(name) {
      return require(name, '');
    }
    this.require.define = function(bundle) {
      for (var key in bundle)
        modules[key] = bundle[key];
    };
  }
  return this.require.define;
}).call(this)({"apl": function(exports, require, module) {(function() {
  var exports;

  exports = module.exports = function(aplSource) {
    return require('./compiler').exec(aplSource);
  };

  exports.createGlobalContext = function() {
    return require('./helpers').inherit(require('./vocabulary'));
  };

  exports.compile = require('./compiler').compile;

}).call(this);
}, "command": function(exports, require, module) {(function() {
  var compile, exec, fs, isArray, nodes, optimist, printAST, repl, _ref,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __slice = [].slice;

  optimist = require('optimist');

  fs = require('fs');

  _ref = require('./compiler'), nodes = _ref.nodes, compile = _ref.compile, exec = _ref.exec;

  this.main = function() {
    var a, aplCode, argv, b, cs, ctx, fakeRequire, filename, isCoffeeScript, jsCode, k, knownOptions, opts, pp;

    argv = optimist.usage('Usage: apl [options] path/to/script.apl [args]\n\nIf called without options, `apl` will run your script.').describe({
      c: 'compile to JavaScript and save as .js files',
      h: 'display this help message',
      i: 'run an interactive APL REPL',
      n: 'print out the parse tree that the parser produces',
      p: 'print out the compiled JavaScript',
      s: 'listen for and compile scripts over stdio'
    }).alias({
      c: 'compile',
      h: 'help',
      i: 'interactive',
      n: 'nodes',
      p: 'print',
      s: 'stdio'
    }).boolean('chinps'.split('')).argv;
    if (argv.help) {
      return optimist.showHelp();
    }
    knownOptions = 'c compile h help i interactive n nodes p print s stdio _'.split(' ');
    for (k in argv) {
      if (!((__indexOf.call(knownOptions, k) < 0) && !k.match(/^\$\d+/))) {
        continue;
      }
      process.stderr.write("Unknown option, \"" + k + "\"\n\n");
      optimist.showHelp();
      return;
    }
    if (argv.interactive && (argv.compile || argv.nodes || argv.print || argv.stdio)) {
      process.stderr.write('Option -i (--interactive) is incompatible with the following options:\n  -c, --compile\n  -n, --nodes\n  -p, --print\n  -s, --stdio\n\n');
      optimist.showHelp();
      return;
    }
    if (argv.interactive && argv._.length) {
      process.stderr.write('Option -i (--interactive) cannot be used with positional arguments.\n\n');
      optimist.showHelp();
      return;
    }
    ctx = {
      '⍵': (function() {
        var _i, _len, _ref1, _results;

        _ref1 = argv._;
        _results = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          a = _ref1[_i];
          _results.push(a.split(''));
        }
        return _results;
      })()
    };
    if (argv.interactive || !(argv._.length || argv.stdio)) {
      return repl(ctx);
    }
    opts = {};
    if (argv.stdio) {
      opts.file = '<stdin>';
      aplCode = Buffer.concat((function() {
        var _results;

        _results = [];
        while (true) {
          b = new Buffer(1024);
          k = fs.readSync(0, b, 0, b.length, null);
          if (!k) {
            break;
          }
          _results.push(b.slice(0, k));
        }
        return _results;
      })()).toString('utf8');
    } else {
      opts.file = argv._[0];
      isCoffeeScript = /\.coffee$/.test(opts.file);
      aplCode = fs.readFileSync(opts.file, 'utf8');
    }
    if (argv.nodes) {
      printAST(nodes(aplCode, opts));
      return;
    }
    if (isCoffeeScript) {
      cs = require('coffee-script');
      pp = require('coffee-subscript');
      jsCode = cs.compile(pp.preprocess(aplCode, opts));
    } else {
      jsCode = compile(aplCode, opts);
    }
    if (argv.compile) {
      if (isCoffeeScript) {
        jsCode = "\#!/usr/bin/env node\n" + jsCode;
      } else {
        jsCode = "\#!/usr/bin/env node\nvar _ = require('apl').createGlobalContext();\n" + jsCode;
      }
      if (argv.stdio || argv.print) {
        return process.stdout.write(jsCode);
      } else {
        filename = argv._[0].replace(/\.(apl|coffee)$/, '.js');
        return fs.writeFileSync(filename, jsCode, 'utf8');
      }
    } else {
      if (isCoffeeScript) {
        fakeRequire = function() {
          var args;

          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          if (args.length === 1 && args[0] === 'apl') {
            return require('./apl');
          } else {
            return require.apply(null, args);
          }
        };
        return (new Function("var require = arguments[0];\n" + jsCode))(fakeRequire);
      } else {
        return (new Function("var _ = arguments[0];\n" + jsCode))(require('./apl').createGlobalContext());
      }
    }
  };

  repl = function(ctx) {
    var format, readline, rl;

    readline = require('readline');
    rl = readline.createInterface(process.stdin, process.stdout);
    rl.setPrompt('APL> ');
    format = require('./formatter').format;
    rl.on('line', function(line) {
      var e, result;

      try {
        if (!line.match(/^[\ \t\f\r\n]*$/)) {
          result = exec(line, {
            extraContext: ctx
          });
          process.stdout.write(format(result).join('\n') + '\n');
        }
      } catch (_error) {
        e = _error;
        console.error(e);
      }
      rl.prompt();
    });
    rl.on('close', function() {
      process.stdout.write('\n');
      process.exit(0);
    });
    rl.prompt();
  };

  printAST = function(x, indent) {
    var y, _i, _len, _ref1;

    if (indent == null) {
      indent = '';
    }
    if (isArray(x)) {
      if (x.length === 2 && !isArray(x[1])) {
        console.info(indent + x[0] + ' ' + JSON.stringify(x[1]));
      } else {
        console.info(indent + x[0]);
        _ref1 = x.slice(1);
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          y = _ref1[_i];
          printAST(y, indent + '  ');
        }
      }
    } else {
      console.info(indent + JSON.stringify(x));
    }
  };

  isArray = function(x) {
    return ((x != null ? x.length : void 0) != null) && typeof x !== 'string';
  };

}).call(this);
}, "compiler": function(exports, require, module) {(function() {
  var all, assert, compile, compilerError, die, inherit, nodes, parser, resolveExprs, toJavaScript, vocabulary, _ref;

  parser = require('./parser');

  vocabulary = require('./vocabulary');

  _ref = require('./helpers'), inherit = _ref.inherit, die = _ref.die, assert = _ref.assert, all = _ref.all;

  resolveExprs = function(ast, opts) {
    var k, m, node, queue, scopeCounter, scopeNode, v, varInfo, vars, visit, _i, _j, _len, _len1, _ref1, _ref2;

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
      ast.vars[k] = varInfo = {
        type: 'X',
        jsCode: "_[" + (JSON.stringify(k)) + "]"
      };
      if (typeof v === 'function') {
        varInfo.type = 'F';
        if ((m = v.aplMetaInfo) != null) {
          if (m.isPrefixAdverb) {
            varInfo.isPrefixAdverb = true;
          }
          if (m.isPostfixAdverb) {
            varInfo.isPostfixAdverb = true;
          }
          if (m.isConjunction) {
            varInfo.isConjunction = true;
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
        var a, c, h, i, j, name, t, x, _j, _k, _len1, _ref10, _ref11, _ref12, _ref13, _ref14, _ref15, _ref16, _ref17, _ref18, _ref19, _ref2, _ref20, _ref21, _ref22, _ref23, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9;

        node.scopeNode = scopeNode;
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
            if (!(node[1] instanceof Array && node[1][0] === 'symbol')) {
              compilerError(node, opts, 'Compound assignment is not supported.');
            }
            name = node[1][1];
            assert(typeof name === 'string');
            h = visit(node[2]);
            if (vars[name]) {
              if (vars[name].type !== h.type) {
                compilerError(node, opts, ("Inconsistent usage of symbol '" + name + "', it is ") + "assigned both data and functions.");
              }
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
              if (!v) {
                compilerError(node, opts, "Symbol '" + name + "' is referenced before assignment.");
              }
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
            _ref3 = node.slice(2);
            for (_j = 0, _len1 = _ref3.length; _j < _len1; _j++) {
              c = _ref3[_j];
              if (!(c !== null)) {
                continue;
              }
              t = visit(c);
              if (t.type !== 'X') {
                compilerError(node, opts, 'Only expressions of type data can be used as an index.');
              }
            }
            return visit(node[1]);
          case 'expr':
            a = node.slice(1);
            h = Array(a.length);
            for (i = _k = _ref4 = a.length - 1; _ref4 <= 0 ? _k <= 0 : _k >= 0; i = _ref4 <= 0 ? ++_k : --_k) {
              h[i] = visit(a[i]);
            }
            i = 0;
            while (i < a.length - 1) {
              if ((h[i].type === (_ref5 = h[i + 1].type) && _ref5 === 'X')) {
                j = i + 2;
                while (j < a.length && h[j].type === 'X') {
                  j++;
                }
                [].splice.apply(a, [i, j - i].concat(_ref6 = [['vector'].concat(a.slice(i, j))])), _ref6;
                [].splice.apply(h, [i, j - i].concat(_ref7 = [
                  {
                    type: 'X'
                  }
                ])), _ref7;
              } else {
                i++;
              }
            }
            i = a.length - 2;
            while (--i >= 0) {
              if (h[i + 1].isConjunction && (h[i].type === 'F' || h[i + 2].type === 'F')) {
                [].splice.apply(a, [i, (i + 3) - i].concat(_ref8 = [['conjunction'].concat(a.slice(i, i + 3))])), _ref8;
                [].splice.apply(h, [i, (i + 3) - i].concat(_ref9 = [
                  {
                    type: 'F'
                  }
                ])), _ref9;
                i--;
              }
            }
            i = 0;
            while (i < a.length - 1) {
              if (h[i].type === 'F' && h[i + 1].isPostfixAdverb) {
                [].splice.apply(a, [i, (i + 2) - i].concat(_ref10 = [['postfixAdverb'].concat(a.slice(i, i + 2))])), _ref10;
                [].splice.apply(h, [i, (i + 2) - i].concat(_ref11 = [
                  {
                    type: 'F'
                  }
                ])), _ref11;
              } else {
                i++;
              }
            }
            i = a.length - 1;
            while (--i >= 0) {
              if (h[i].isPrefixAdverb && h[i + 1].type === 'F') {
                [].splice.apply(a, [i, (i + 2) - i].concat(_ref12 = [['prefixAdverb'].concat(a.slice(i, i + 2))])), _ref12;
                [].splice.apply(h, [i, (i + 2) - i].concat(_ref13 = [
                  {
                    type: 'F'
                  }
                ])), _ref13;
              }
            }
            if (h.length === 2 && (h[0].type === (_ref14 = h[1].type) && _ref14 === 'F')) {
              a = [['hook'].concat(a)];
              h = [
                {
                  type: 'F'
                }
              ];
            }
            if (h.length >= 3 && h.length % 2 === 1 && all((function() {
              var _l, _len2, _results;

              _results = [];
              for (_l = 0, _len2 = h.length; _l < _len2; _l++) {
                x = h[_l];
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
              if (h.length > 1) {
                compilerError(a[h.length - 1], opts, 'Trailing function in expression');
              }
            } else {
              while (h.length > 1) {
                if (h.length === 2 || h[h.length - 3].type === 'F') {
                  [].splice.apply(a, [(_ref15 = h.length - 2), 9e9].concat(_ref16 = [['monadic'].concat(a.slice(h.length - 2))])), _ref16;
                  [].splice.apply(h, [(_ref17 = h.length - 2), 9e9].concat(_ref18 = [
                    {
                      type: 'X'
                    }
                  ])), _ref18;
                } else {
                  [].splice.apply(a, [(_ref19 = h.length - 3), 9e9].concat(_ref20 = [['dyadic'].concat(a.slice(h.length - 3))])), _ref20;
                  [].splice.apply(h, [(_ref21 = h.length - 3), 9e9].concat(_ref22 = [
                    {
                      type: 'X'
                    }
                  ])), _ref22;
                }
              }
            }
            [].splice.apply(node, [0, 9e9].concat(_ref23 = a[0])), _ref23;
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

  toJavaScript = function(node) {
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
            a.push(toJavaScript(child));
          }
          a[a.length - 1] = "return " + a[a.length - 1] + ";\n";
          return a.join(';\n');
        }
        break;
      case 'guard':
        return "if (_['⎕bool'](" + (toJavaScript(node[1])) + ")) {\n  return " + (toJavaScript(node[2])) + ";\n}";
      case 'assign':
        if (!(node[1] instanceof Array && node[1].length === 2 && node[1][0] === 'symbol')) {
          compilerError(node, opts, 'Compound assignment is not supported.');
        }
        name = node[1][1];
        assert(typeof name === 'string');
        if (name === '∇') {
          compilerError(node, opts, 'Assignment to ∇ is not allowed.');
        }
        vars = node.scopeNode.vars;
        if (((_ref2 = (v = vars["set_" + name])) != null ? _ref2.type : void 0) === 'F') {
          v.used = true;
          return "" + v.jsCode + "(" + (toJavaScript(node[2])) + ")";
        } else {
          return "" + vars[name].jsCode + " = " + (toJavaScript(node[2]));
        }
        break;
      case 'symbol':
        name = node[1];
        vars = node.scopeNode.vars;
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
        return "function (_w, _a) {\n  " + (toJavaScript(node[1])) + "\n}";
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
        return "_['⍨'](_['⌷'])(        [" + (((function() {
          var _j, _len1, _ref4, _results;

          _ref4 = node.slice(2);
          _results = [];
          for (_j = 0, _len1 = _ref4.length; _j < _len1; _j++) {
            c = _ref4[_j];
            if (c) {
              _results.push(toJavaScript(c));
            }
          }
          return _results;
        })()).join(', ')) + "],        " + (toJavaScript(node[1])) + ",        [" + ((function() {
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
        })()) + "]      )";
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
            _results.push(toJavaScript(child));
          }
          return _results;
        })()).join(', ')) + "]";
      case 'monadic':
        return "" + (toJavaScript(node[1])) + "(" + (toJavaScript(node[2])) + ")";
      case 'dyadic':
        return "" + (toJavaScript(node[2])) + "(" + (toJavaScript(node[3])) + ", " + (toJavaScript(node[1])) + ")";
      case 'prefixAdverb':
        return "" + (toJavaScript(node[1])) + "(" + (toJavaScript(node[2])) + ")";
      case 'conjunction':
        return "" + (toJavaScript(node[2])) + "(" + (toJavaScript(node[3])) + ", " + (toJavaScript(node[1])) + ")";
      case 'postfixAdverb':
        return "" + (toJavaScript(node[2])) + "(" + (toJavaScript(node[1])) + ")";
      case 'hook':
        return "_['⎕hook'](" + (toJavaScript(node[2])) + ", " + (toJavaScript(node[1])) + ")";
      case 'fork':
        return "_['⎕fork']([" + ((function() {
          var _j, _len1, _ref4, _results;

          _ref4 = node.slice(1);
          _results = [];
          for (_j = 0, _len1 = _ref4.length; _j < _len1; _j++) {
            c = _ref4[_j];
            _results.push(toJavaScript(c));
          }
          return _results;
        })()) + "])";
      case 'embedded':
        return "_['⎕aplify'](" + (node[1].replace(/(^«|»$)/g, '')) + ")";
      default:
        return die("Unrecognised node type, '" + node[0] + "'");
    }
  };

  compilerError = function(node, opts, message) {
    return die(message, {
      name: 'APLCompilerError',
      file: opts.file,
      line: node.startLine,
      col: node.startCol,
      aplCode: opts.aplCode
    });
  };

  this.nodes = nodes = function(aplCode, opts) {
    var ast;

    if (opts == null) {
      opts = {};
    }
    opts.aplCode = aplCode;
    ast = parser.parse(aplCode, opts);
    resolveExprs(ast, opts);
    return ast;
  };

  this.compile = compile = function(aplCode, opts) {
    var jsCode;

    if (opts == null) {
      opts = {};
    }
    opts.aplCode = aplCode;
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
    opts.aplCode = aplCode;
    return (new Function("var _ = arguments[0];\n" + (compile(aplCode, opts))))(inherit(vocabulary, opts.extraContext));
  };

}).call(this);
}, "complex": function(exports, require, module) {(function() {
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

  this.Complex = Complex = (function() {
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

}).call(this);
}, "formatter": function(exports, require, module) {(function() {
  var format, isSimple, prod, repeat, shapeOf, _ref;

  _ref = require('./helpers'), isSimple = _ref.isSimple, shapeOf = _ref.shapeOf, prod = _ref.prod, repeat = _ref.repeat;

  this.format = format = function(a) {
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
}, "helpers": function(exports, require, module) {(function() {
  var assert, isSimple, prod, prototypeOf, repeat, shapeOf, withPrototype, withShape,
    __slice = [].slice;

  this.inherit = function(x, extraProperties) {
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

  this.isSimple = isSimple = function(x) {
    return !(x instanceof Array);
  };

  this.shapeOf = shapeOf = function(a) {
    return a.shape || ((a.length != null) && !(typeof a === 'string' && a.length === 1) ? [a.length] : []);
  };

  this.withShape = withShape = function(shape, a) {
    assert((shape == null) || a.length === prod(shape));
    if ((shape != null) && shape.length !== 1) {
      a.shape = shape;
    }
    return a;
  };

  this.prototypeOf = prototypeOf = function(x) {
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

  this.withPrototype = withPrototype = function(p, x) {
    if ((x instanceof Array) && (!x.length) && (p !== 0)) {
      x.aplPrototype = p;
    }
    return x;
  };

  this.withPrototypeCopiedFrom = function(y, x) {
    if (x instanceof Array && !x.length) {
      withPrototype(prototypeOf(y), x);
    }
    return x;
  };

  this.sum = function(xs) {
    var r, x, _i, _len;

    r = 0;
    for (_i = 0, _len = xs.length; _i < _len; _i++) {
      x = xs[_i];
      r += x;
    }
    return r;
  };

  this.prod = prod = function(xs) {
    var r, x, _i, _len;

    r = 1;
    for (_i = 0, _len = xs.length; _i < _len; _i++) {
      x = xs[_i];
      r *= x;
    }
    return r;
  };

  this.all = function(xs) {
    var x, _i, _len;

    for (_i = 0, _len = xs.length; _i < _len; _i++) {
      x = xs[_i];
      if (!x) {
        return false;
      }
    }
    return true;
  };

  this.enc = function(x, a) {
    var i, r, _i, _ref;

    r = [];
    for (i = _i = _ref = a.length - 1; _i >= 0; i = _i += -1) {
      r.push(x % a[i]);
      x = Math.floor(x / a[i]);
    }
    return r.reverse();
  };

  this.dec = function(xs, a) {
    var i, r, x, _i, _len;

    assert(xs.length === a.length);
    r = 0;
    for (i = _i = 0, _len = xs.length; _i < _len; i = ++_i) {
      x = xs[i];
      r = r * a[i] + x;
    }
    return r;
  };

  this.repeat = repeat = function(s, n) {
    var r, _i;

    r = '';
    for (_i = 0; 0 <= n ? _i < n : _i > n; 0 <= n ? _i++ : _i--) {
      r += s;
    }
    return r;
  };

  this.assert = assert = function(flag, s) {
    if (s == null) {
      s = 'Assertion failed';
    }
    if (!flag) {
      throw Error(s);
    }
  };

  this.die = function() {
    var args, e, k, message, opts, v, _ref;

    message = arguments[0], opts = arguments[1], args = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
    if (opts == null) {
      opts = {};
    }
    assert(typeof message === 'string');
    assert(typeof opts === 'object');
    assert(!args.length);
    if ((opts.aplCode != null) && (opts.line != null) && (opts.col != null)) {
      assert(typeof opts.aplCode === 'string');
      assert(typeof opts.line === 'number');
      assert(typeof opts.col === 'number');
      assert((_ref = typeof opts.file) === 'string' || _ref === 'undefined');
      message += "\n" + (opts.file || '-') + ":#" + opts.line + ":" + opts.col + "\n" + (opts.aplCode.split('\n')[opts.line - 1]) + "\n" + (repeat('_', opts.col - 1)) + "^";
    }
    e = Error(message);
    for (k in opts) {
      v = opts[k];
      assert(k === 'aplCode' || k === 'line' || k === 'col' || k === 'file' || k === 'name');
      e[k] = v;
    }
    throw e;
  };

}).call(this);
}, "lexer": function(exports, require, module) {(function() {
  var die, tokenDefs;

  die = require('./helpers').die;

  tokenDefs = [['-', /^(?:[ \t]+|[⍝\#].*)+/], ['newline', /^[\n\r]+/], ['separator', /^[◇⋄]/], ['number', /^¯?(?:0x[\da-f]+|\d*\.?\d+(?:e[+¯]?\d+)?|¯)(?:j¯?(?:0x[\da-f]+|\d*\.?\d+(?:e[+¯]?\d+)?|¯))?/i], ['string', /^(?:'(?:[^\\']|\\.)*'|"(?:[^\\"]|\\.)*")+/], ['', /^[\(\)\[\]\{\}:;←]/], ['embedded', /^«[^»]*»/], ['symbol', /^(?:∘\.|⎕?[a-z_][0-9a-z_]*|[^¯'":«»])/i]];

  this.tokenize = function(aplCode, opts) {
    var col, line, stack;

    if (opts == null) {
      opts = {};
    }
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
            die('Unrecognised token', {
              name: 'APLLexicalError',
              file: opts.file,
              line: line,
              col: col,
              aplCode: opts.aplCode
            });
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
}, "parser": function(exports, require, module) {(function() {
  var die, lexer,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  lexer = require('./lexer');

  die = require('./helpers').die;

  this.parse = function(aplCode, opts) {
    var consume, demand, parseBody, parseExpr, parseIndexable, parseIndices, parseItem, parserError, result, token, tokenStream;

    if (opts == null) {
      opts = {};
    }
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
        parserError("Expected token of type '" + tt + "' but got '" + token.type + "'");
      }
      token = tokenStream.next();
    };
    parserError = function(message) {
      return die(message, {
        name: 'APLParserError',
        file: opts.file,
        line: token.startLine,
        col: token.startCol,
        aplCode: aplCode
      });
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
        return parserError("Encountered unexpected token of type '" + token.type + "'");
      }
    };
    result = parseBody();
    demand('eof');
    return result;
  };

}).call(this);
}, "vocabulary": function(exports, require, module) {(function() {
  var Gamma, PI, abs, acos, ambivalent, array, asin, assert, atan, bool, catenate, ceil, compressOrReplicate, conjunction, contains, cos, dec, def, depthOf, die, dyadic, enc, endOfVocabulary, exp, expand, factorial, floor, formatter, grade, inherit, isSimple, log, match, max, maybeMakePervasive, min, monadic, num, outerProduct, overloadable, pervasive, postfixAdverb, pow, prefixAdverb, prod, prototypeOf, random, reduce, reverse, round, scan, shapeOf, sin, sqrt, tan, tmp, vocabulary, withMetaInfoFrom, withPrototype, withPrototypeCopiedFrom, withShape, _ref,
    __slice = [].slice,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  _ref = require('./helpers'), assert = _ref.assert, die = _ref.die, inherit = _ref.inherit, isSimple = _ref.isSimple, shapeOf = _ref.shapeOf, withShape = _ref.withShape, prod = _ref.prod, prototypeOf = _ref.prototypeOf, withPrototype = _ref.withPrototype, withPrototypeCopiedFrom = _ref.withPrototypeCopiedFrom, enc = _ref.enc, dec = _ref.dec;

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

  vocabulary = this;

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
      a = isSimple(a) ? [a] : [a[0]];
    }
    sb = shapeOf(b);
    if (sb.length === 0) {
      sb = [1];
      b = isSimple(b) ? [b] : [b[0]];
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

  monadic('⊂', 'Enclose', function(a, _, axes) {
    var axis, i, ii, j, jj, k, kk, nr, nu, rAxes, sa, sr, su, _i, _j, _len, _ref1, _results;

    sa = shapeOf(a);
    if (typeof axes === 'undefined') {
      axes = (function() {
        _results = [];
        for (var _i = 0, _ref1 = sa.length; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; 0 <= _ref1 ? _i++ : _i--){ _results.push(_i); }
        return _results;
      }).apply(this);
    } else {
      assert(axes.length === 1, 'Axes cannot be specified using strand notation.');
      axes = axes[0];
      if (typeof axes === 'number') {
        axes = [axes];
      }
      for (i = _j = 0, _len = axes.length; _j < _len; i = ++_j) {
        axis = axes[i];
        assert(typeof axis === 'number', 'Axes must be numbers.');
        assert(axis === Math.floor(axis, 'Axes must be integers.'));
        assert((0 <= axis && axis < sa.length), 'Axes must be between 0 and the argument\'s rank.');
        assert(__indexOf.call(axes.slice(0, i), axis) < 0, 'Axes must be unique.');
      }
    }
    if (isSimple(a)) {
      return a;
    }
    su = (function() {
      var _k, _len1, _results1;

      _results1 = [];
      for (_k = 0, _len1 = axes.length; _k < _len1; _k++) {
        axis = axes[_k];
        _results1.push(sa[axis]);
      }
      return _results1;
    })();
    nu = prod(su);
    rAxes = (function() {
      var _k, _ref2, _results1;

      _results1 = [];
      for (axis = _k = 0, _ref2 = sa.length; 0 <= _ref2 ? _k < _ref2 : _k > _ref2; axis = 0 <= _ref2 ? ++_k : --_k) {
        if (__indexOf.call(axes, axis) < 0) {
          _results1.push(axis);
        }
      }
      return _results1;
    })();
    sr = (function() {
      var _k, _len1, _results1;

      _results1 = [];
      for (_k = 0, _len1 = rAxes.length; _k < _len1; _k++) {
        axis = rAxes[_k];
        _results1.push(sa[axis]);
      }
      return _results1;
    })();
    nr = prod(sr);
    return withShape(sr, (function() {
      var _k, _results1;

      _results1 = [];
      for (j = _k = 0; 0 <= nr ? _k < nr : _k > nr; j = 0 <= nr ? ++_k : --_k) {
        jj = enc(j, sr);
        _results1.push(withShape(su, (function() {
          var _l, _results2;

          _results2 = [];
          for (k = _l = 0; 0 <= nu ? _l < nu : _l > nu; k = 0 <= nu ? ++_l : --_l) {
            kk = enc(k, su);
            ii = (function() {
              var _m, _ref2, _results3;

              _results3 = [];
              for (axis = _m = 0, _ref2 = sa.length; 0 <= _ref2 ? _m < _ref2 : _m > _ref2; axis = 0 <= _ref2 ? ++_m : --_m) {
                if (__indexOf.call(axes, axis) >= 0) {
                  _results3.push(kk[axes.indexOf(axis)]);
                } else {
                  _results3.push(jj[rAxes.indexOf(axis)]);
                }
              }
              return _results3;
            })();
            i = dec(ii, sa);
            _results2.push(a[i]);
          }
          return _results2;
        })()));
      }
      return _results1;
    })());
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
    var i, isNeg, j, k, m, n, r, sa, sb, sr, x, y, _i, _j, _k, _len, _ref1;

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
    sr = sa.concat(sb);
    if (sr.length) {
      return withShape(sr, r);
    } else {
      return r[0];
    }
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

  this['get_⍬'] = function() {
    return [];
  };

  this['set_⍬'] = function() {
    return die('Symbol zilde (⍬) is read-only.');
  };

  this['get_⎕IO'] = function() {
    return 0;
  };

  this['set_⎕IO'] = function(x) {
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
    return function(b, a, axis) {
      if (a != null) {
        return f(a, b, axis);
      } else {
        return f(b, void 0, axis);
      }
    };
  });

  this['get_⎕'] = function() {
    if (typeof (typeof window !== "undefined" && window !== null ? window.prompt : void 0) === 'function') {
      return prompt('⎕:') || '';
    } else {
      return die('Reading from ⎕ is not implemented.');
    }
  };

  this['set_⎕'] = function(x) {
    var s;

    s = formatter.format(x).join('\n') + '\n';
    x;
    if (typeof (typeof window !== "undefined" && window !== null ? window.alert : void 0) === 'function') {
      window.alert(s);
    } else {
      process.stdout.write(s);
    }
    return x;
  };

  this['get_⍞'] = function() {
    if (typeof (typeof window !== "undefined" && window !== null ? window.prompt : void 0) === 'function') {
      return prompt('') || '';
    } else {
      return die('Reading from ⍞ is not implemented.');
    }
  };

  this['set_⍞'] = function(x) {
    var s;

    s = formatter.format(x).join('\n');
    x;
    if (typeof (typeof window !== "undefined" && window !== null ? window.alert : void 0) === 'function') {
      window.alert(s);
    } else {
      process.stdout.write(s);
    }
    return x;
  };

  this['⎕aplify'] = function(x) {
    assert(x !== null);
    assert(typeof x !== 'undefined');
    if (typeof x === 'string' && x.length !== 1) {
      x = withPrototype(' ', x.split(''));
    }
    return x;
  };

  this['⎕bool'] = bool;

  this['⎕complex'] = require('./complex').Complex;

  this['⎕hook'] = function(g, f) {
    assert(typeof f === 'function');
    assert(typeof g === 'function');
    return function(b, a) {
      return f(g(b), a != null ? a : b);
    };
  };

  this['⎕fork'] = function(verbs) {
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

}).call(this);
}});
