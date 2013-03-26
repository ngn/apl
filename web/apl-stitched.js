
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
}, "array": function(exports, require, module) {(function() {
  var APLArray, assert, extend, prod, _ref;

  _ref = require('./helpers'), assert = _ref.assert, extend = _ref.extend, prod = _ref.prod;

  this.APLArray = APLArray = (function() {
    function APLArray(data, shape, stride, offset) {
      var axis, _i, _ref1, _ref2;

      this.data = data;
      this.shape = shape;
      this.stride = stride;
      this.offset = offset != null ? offset : 0;
      if ((_ref1 = this.shape) == null) {
        this.shape = [this.data.length];
      }
      if (!this.stride) {
        this.stride = Array(this.shape.length);
        if (this.shape.length) {
          this.stride[this.shape.length - 1] = 1;
          for (axis = _i = _ref2 = this.shape.length - 2; _i >= 0; axis = _i += -1) {
            this.stride[axis] = this.stride[axis + 1] * this.shape[axis + 1];
          }
        }
      }
    }

    APLArray.prototype.get = function(indices) {
      var axis, index, p, _i, _len;

      p = this.offset;
      for (axis = _i = 0, _len = indices.length; _i < _len; axis = ++_i) {
        index = indices[axis];
        p += index * this.stride[axis];
      }
      return this.data[p];
    };

    APLArray.prototype.each = function(f) {
      var axis, indices, p;

      assert(typeof f === 'function');
      p = this.offset;
      indices = (function() {
        var _i, _len, _ref1, _results;

        _ref1 = this.shape;
        _results = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          axis = _ref1[_i];
          _results.push(0);
        }
        return _results;
      }).call(this);
      while (true) {
        f(this.data[p]);
        axis = this.shape.length - 1;
        while (axis >= 0 && indices[axis] + 1 === this.shape[axis]) {
          p -= indices[axis] * this.stride[axis];
          indices[axis--] = 0;
        }
        if (axis < 0) {
          break;
        }
        indices[axis]++;
        p += this.stride[axis];
      }
    };

    APLArray.prototype.each2 = function(a, f) {
      var axis, indices, p, q, _i, _ref1;

      assert(a instanceof APLArray);
      assert(typeof f === 'function');
      assert(this.shape.length === a.shape.length);
      for (axis = _i = 0, _ref1 = this.shape.length; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; axis = 0 <= _ref1 ? ++_i : --_i) {
        assert(this.shape[axis] === a.shape[axis]);
      }
      p = this.offset;
      q = a.offset;
      indices = (function() {
        var _j, _len, _ref2, _results;

        _ref2 = this.shape;
        _results = [];
        for (_j = 0, _len = _ref2.length; _j < _len; _j++) {
          axis = _ref2[_j];
          _results.push(0);
        }
        return _results;
      }).call(this);
      while (true) {
        f(this.data[p], a.data[q]);
        axis = this.shape.length - 1;
        while (axis >= 0 && indices[axis] + 1 === this.shape[axis]) {
          p -= indices[axis] * this.stride[axis];
          q -= indices[axis] * a.stride[axis];
          indices[axis--] = 0;
        }
        if (axis < 0) {
          break;
        }
        indices[axis]++;
        p += this.stride[axis];
        q += a.stride[axis];
      }
    };

    APLArray.prototype.map = function(f) {
      var data;

      assert(typeof f === 'function');
      data = [];
      this.each(function(x) {
        return data.push(f(x));
      });
      return new APLArray(data, this.shape);
    };

    APLArray.prototype.map2 = function(a, f) {
      var data;

      assert(a instanceof APLArray);
      assert(typeof f === 'function');
      data = [];
      this.each2(a, function(x, y) {
        return data.push(f(x, y));
      });
      return new APLArray(data, this.shape);
    };

    APLArray.prototype.realize = function(limit) {
      var e, r;

      if (limit == null) {
        limit = Infinity;
      }
      r = [];
      try {
        this.each(function(x) {
          r.push(x);
          if (r.length >= limit) {
            throw 'breek';
          }
        });
      } catch (_error) {
        e = _error;
        if (e !== 'break') {
          throw e;
        }
      }
      return r;
    };

    APLArray.prototype.isSingleton = function() {
      var n, _i, _len, _ref1;

      _ref1 = this.shape;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        n = _ref1[_i];
        if (n !== 1) {
          return false;
        }
      }
      return true;
    };

    APLArray.prototype.unbox = function() {
      assert(prod(this.shape) === 1);
      return this.data[this.offset];
    };

    return APLArray;

  })();

  extend(APLArray, {
    zero: new APLArray([0], []),
    one: new APLArray([1], []),
    zilde: new APLArray([], [0]),
    scalar: function(x) {
      return new APLArray([x], []);
    }
  });

  APLArray.bool = [APLArray.zero, APLArray.one];

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
          return "_['⎕aplify'](" + a[0] + ")";
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
        return "_['⎕aplify']([" + (((function() {
          var _j, _len1, _ref4, _results;

          _ref4 = node.slice(1);
          _results = [];
          for (_j = 0, _len1 = _ref4.length; _j < _len1; _j++) {
            child = _ref4[_j];
            _results.push(toJavaScript(child));
          }
          return _results;
        })()).join(', ')) + "])";
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
  var assert, extend, prod, prototypeOf, repeat, withPrototype,
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

  this.extend = extend = function(x, extraProperties) {
    var k, v;

    for (k in extraProperties) {
      v = extraProperties[k];
      x[k] = v;
    }
    return x;
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

  this.repeat = repeat = function(a, n) {
    var m;

    assert(typeof a === 'string' || a instanceof Array);
    assert(typeof n === 'number' && n === Math.floor(n) && n >= 0);
    if (!n) {
      return a.slice(0, 0);
    }
    m = n * a.length;
    while (a.length * 2 < m) {
      a = a.concat(a);
    }
    return a.concat(a.slice(0, m - a.length));
  };

  this.assert = assert = function(flag, s) {
    if (s == null) {
      s = '';
    }
    if (!flag) {
      throw extend(Error(s), {
        name: 'AssertionError'
      });
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
  var APLArray, Complex, assert, match, multiplicitySymbol, numeric, pervasive, prod, repeat, _ref,
    _this = this;

  _ref = require('./helpers'), assert = _ref.assert, prod = _ref.prod, repeat = _ref.repeat;

  APLArray = require('./array').APLArray;

  Complex = require('./complex').Complex;

  this['⎕aplify'] = function(x) {
    var y;

    assert(x != null);
    if (typeof x === 'string') {
      if (x.length === 1) {
        return APLArray.scalar(x);
      } else {
        return new APLArray(x);
      }
    } else if (typeof x === 'number') {
      return APLArray.scalar(x);
    } else if (x instanceof Array) {
      return new APLArray((function() {
        var _i, _len, _results;

        _results = [];
        for (_i = 0, _len = x.length; _i < _len; _i++) {
          y = x[_i];
          if (y instanceof APLArray && y.shape.length === 0) {
            _results.push(y.unbox());
          } else {
            _results.push(y);
          }
        }
        return _results;
      })());
    } else if (x instanceof APLArray) {
      return x;
    } else {
      throw Error('Cannot aplify object ' + x);
    }
  };

  this['⎕complex'] = function(re, im) {
    return APLArray.scalar(new Complex(re, im));
  };

  this['⎕bool'] = function(x) {
    var r;

    assert(x instanceof APLArray);
    if (!x.isSingleton()) {
      throw Error('LENGTH ERROR');
    }
    r = x.unbox();
    if (r !== 0 && r !== 1) {
      throw Error('DOMAIN ERROR: cannot convert to boolean: ' + r);
    }
    return r;
  };

  multiplicitySymbol = function(z) {
    if (z instanceof APLArray) {
      if (z.isSingleton()) {
        return '1';
      } else {
        return '*';
      }
    } else {
      return '.';
    }
  };

  pervasive = function(_arg) {
    var F, dyadic, monadic, pervadeDyadic, pervadeMonadic;

    monadic = _arg.monadic, dyadic = _arg.dyadic;
    pervadeMonadic = monadic ? function(x) {
      var _name, _ref1;

      if (x instanceof APLArray) {
        return x.map(pervadeMonadic);
      } else {
        return (_ref1 = typeof x[_name = F.aplName] === "function" ? x[_name]() : void 0) != null ? _ref1 : monadic(x);
      }
    } : function() {
      throw Error('Not implemented');
    };
    pervadeDyadic = dyadic ? function(x, y) {
      var axis, tx, ty, xi, yi, _i, _name, _name1, _ref1, _ref2, _ref3;

      tx = multiplicitySymbol(x);
      ty = multiplicitySymbol(y);
      switch (tx + ty) {
        case '..':
          return (_ref1 = (_ref2 = x != null ? typeof x[_name = F.aplName] === "function" ? x[_name](y) : void 0 : void 0) != null ? _ref2 : y != null ? typeof y[_name1 = 'right_' + F.aplName] === "function" ? y[_name1](x) : void 0 : void 0) != null ? _ref1 : dyadic(x, y);
        case '.1':
          return y.map(function(yi) {
            return pervadeDyadic(x, yi);
          });
        case '.*':
          return y.map(function(yi) {
            return pervadeDyadic(x, yi);
          });
        case '1.':
          return x.map(function(xi) {
            return pervadeDyadic(xi, y);
          });
        case '*.':
          return x.map(function(xi) {
            return pervadeDyadic(xi, y);
          });
        case '1*':
          xi = x.unbox();
          return y.map(function(yi) {
            return pervadeDyadic(xi, yi);
          });
        case '*1':
          yi = y.unbox();
          return x.map(function(xi) {
            return pervadeDyadic(xi, yi);
          });
        case '11':
          yi = y.unbox();
          return x.map(function(xi) {
            return pervadeDyadic(xi, yi);
          });
        case '**':
          if (x.shape.length !== y.shape.length) {
            throw Error('RANK ERROR');
          }
          for (axis = _i = 0, _ref3 = x.shape.length; 0 <= _ref3 ? _i < _ref3 : _i > _ref3; axis = 0 <= _ref3 ? ++_i : --_i) {
            if (x.shape[axis] !== y.shape[axis]) {
              throw Error('LENGTH ERROR');
            }
          }
          return x.map2(y, pervadeDyadic);
      }
    } : function() {
      throw Error('Not implemented');
    };
    return F = function(omega, alpha) {
      assert(omega instanceof APLArray);
      assert(alpha instanceof APLArray || typeof alpha === 'undefined');
      return (alpha ? pervadeDyadic : pervadeMonadic)(omega, alpha);
    };
  };

  numeric = function(f) {
    return function(x, y, axis) {
      if (typeof x !== 'number' || ((y != null) && typeof y !== 'number')) {
        throw Error('DOMAIN ERROR');
      }
      return f(x, y, axis);
    };
  };

  this['+'] = pervasive({
    monadic: numeric(function(x) {
      return x;
    }),
    dyadic: numeric(function(y, x) {
      return x + y;
    })
  });

  this['−'] = pervasive({
    monadic: numeric(function(x) {
      return -x;
    }),
    dyadic: numeric(function(y, x) {
      return x - y;
    })
  });

  this['×'] = pervasive({
    monadic: numeric(function(x) {
      return (x > 0) - (x < 0);
    }),
    dyadic: numeric(function(y, x) {
      return x * y;
    })
  });

  this['÷'] = pervasive({
    monadic: numeric(function(x) {
      return 1 / x;
    }),
    dyadic: numeric(function(y, x) {
      return x / y;
    })
  });

  this['⋆'] = pervasive({
    monadic: numeric(Math.exp),
    dyadic: numeric(function(y, x) {
      return Math.pow(x, y);
    })
  });

  this['⌽'] = function(omega, alpha, axis) {
    var offset, stride;

    if (alpha == null) {
      if (omega.shape.length === 0) {
        return omega;
      } else {
        stride = omega.stride.slice(0);
        offset = omega.offset + omega.shape[0] * stride[0];
        stride[0] = -stride[0];
        return new APLArray(omega.data, omega.shape, stride, offset);
      }
    }
  };

  this['='] = pervasive({
    dyadic: function(y, x) {
      return +(x === y);
    }
  });

  this['≠'] = pervasive({
    dyadic: function(y, x) {
      return +(x !== y);
    }
  });

  this['<'] = pervasive({
    dyadic: numeric(function(y, x) {
      return +(x < y);
    })
  });

  this['>'] = pervasive({
    dyadic: numeric(function(y, x) {
      return +(x > y);
    })
  });

  this['≤'] = pervasive({
    dyadic: numeric(function(y, x) {
      return +(x <= y);
    })
  });

  this['≥'] = pervasive({
    dyadic: numeric(function(y, x) {
      return +(x >= y);
    })
  });

  this['⌊'] = pervasive({
    monadic: numeric(Math.ceil),
    dyadic: numeric(Math.max)
  });

  this['⌈'] = pervasive({
    monadic: numeric(Math.floor),
    dyadic: numeric(Math.min)
  });

  this['?'] = pervasive({
    monadic: numeric(function(x) {
      if (x !== Math.floor(x) || x <= 0) {
        throw Error('DOMAIN ERROR');
      }
      return Math.floor(Math.random() * x);
    })
  });

  this['○'] = pervasive({
    monadic: numeric(function(x) {
      return Math.PI * x;
    })
  });

  match = function(x, y) {
    var axis, r, _i, _ref1, _ref2, _ref3;

    if (x instanceof APLArray) {
      if (!(y instanceof APLArray)) {
        return false;
      } else {
        if (x.shape.length !== y.shape.length) {
          return false;
        }
        for (axis = _i = 0, _ref1 = x.shape.length; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; axis = 0 <= _ref1 ? ++_i : --_i) {
          if (x.shape[axis] !== y.shape[axis]) {
            return false;
          }
        }
        r = true;
        x.each2(y, function(xi, yi) {
          if (!match(xi, yi)) {
            return r = false;
          }
        });
        return r;
      }
    } else {
      if (y instanceof APLArray) {
        return false;
      } else {
        return (_ref2 = (_ref3 = typeof x['≡'] === "function" ? x['≡'](y) : void 0) != null ? _ref3 : typeof y['≡'] === "function" ? y['≡'](x) : void 0) != null ? _ref2 : x === y;
      }
    }
  };

  this['≡'] = function(omega, alpha) {
    if (alpha) {
      return APLArray.bool[+match(omega, alpha)];
    } else {
      throw Error('Not implemented');
    }
  };

  this[','] = function(omega, alpha) {
    var shape;

    if (alpha) {
      shape = alpha.realize();
      throw Error('Not implemented');
    } else {
      return new APLArray(omega.realize());
    }
  };

  this['⍴'] = function(omega, alpha) {
    var a, d, n, shape, _i, _len;

    if (alpha) {
      if (alpha.shape.length > 1) {
        throw Error('RANK ERROR');
      }
      shape = alpha.realize();
      for (_i = 0, _len = shape.length; _i < _len; _i++) {
        d = shape[_i];
        if (typeof d !== 'number' || d !== Math.floor(d) || d < 0) {
          throw Error('DOMAIN ERROR');
        }
      }
      n = prod(shape);
      a = omega.realize(n);
      assert(a.length <= n);
      while (2 * a.length < n) {
        a = a.concat(a);
      }
      if (a.length !== n) {
        a = a.concat(a.slice(0, n - a.length));
      }
      return new APLArray(a, shape);
    } else {
      return new APLArray(omega.shape);
    }
  };

  this['set_⎕'] = console.info;

  (function() {
    var k, v, _results;

    _results = [];
    for (k in _this) {
      v = _this[k];
      if (typeof v === 'function') {
        _results.push(v.aplName = k);
      }
    }
    return _results;
  })();

}).call(this);
}});
