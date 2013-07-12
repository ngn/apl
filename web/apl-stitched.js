
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
  var compile, exports;

  exports = module.exports = function(aplSource) {
    return require('./compiler').exec(aplSource);
  };

  exports.createGlobalContext = function() {
    return require('./helpers').inherit(require('./vocabulary'));
  };

  compile = require("./compiler").compile;

  exports.compile = function(code) {
    return "(function(){" + (compile(code, {
      embedded: true
    })) + "})()";
  };

  exports.fn = {
    compile: function(code) {
      return "function(){" + (compile(code, {
        embedded: true
      })) + "}";
    }
  };

}).call(this);
}, "array": function(exports, require, module) {(function() {
  var APLArray, DomainError, LengthError, assert, extend, isInt, prod, strideForShape, _ref, _ref1;

  _ref = require('./helpers'), assert = _ref.assert, extend = _ref.extend, prod = _ref.prod, isInt = _ref.isInt;

  _ref1 = require('./errors'), LengthError = _ref1.LengthError, DomainError = _ref1.DomainError;

  this.APLArray = APLArray = (function() {
    function APLArray(data, shape, stride, offset) {
      var i, x, _i, _j, _len, _len1, _ref2, _ref3;
      this.data = data;
      this.shape = shape;
      this.stride = stride;
      this.offset = offset != null ? offset : 0;
      if (this.shape == null) {
        this.shape = [this.data.length];
      }
      if (this.stride == null) {
        this.stride = strideForShape(this.shape);
      }
      assert(this.data instanceof Array || typeof this.data === 'string');
      assert(this.shape instanceof Array);
      assert(this.stride instanceof Array);
      assert(this.data.length === 0 || isInt(this.offset, 0, this.data.length));
      assert(this.shape.length === this.stride.length);
      _ref2 = this.shape;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        x = _ref2[_i];
        assert(isInt(x, 0));
      }
      if (this.data.length) {
        _ref3 = this.stride;
        for (i = _j = 0, _len1 = _ref3.length; _j < _len1; i = ++_j) {
          x = _ref3[i];
          assert(isInt(x, -this.data.length, this.data.length + 1));
        }
      } else {
        assert(prod(this.shape) === 0);
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

    APLArray.prototype.empty = function() {
      var d, _i, _len, _ref2;
      _ref2 = this.shape;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        d = _ref2[_i];
        if (!d) {
          return true;
        }
      }
      return false;
    };

    APLArray.prototype.each = function(f) {
      var axis, indices, p;
      assert(typeof f === 'function');
      if (this.empty()) {
        return;
      }
      p = this.offset;
      indices = (function() {
        var _i, _len, _ref2, _results;
        _ref2 = this.shape;
        _results = [];
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          axis = _ref2[_i];
          _results.push(0);
        }
        return _results;
      }).call(this);
      while (true) {
        f(this.data[p], indices);
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
      var axis, indices, p, q, _i, _ref2;
      assert(a instanceof APLArray);
      assert(typeof f === 'function');
      assert(this.shape.length === a.shape.length);
      for (axis = _i = 0, _ref2 = this.shape.length; 0 <= _ref2 ? _i < _ref2 : _i > _ref2; axis = 0 <= _ref2 ? ++_i : --_i) {
        assert(this.shape[axis] === a.shape[axis]);
      }
      if (this.empty()) {
        return;
      }
      p = this.offset;
      q = a.offset;
      indices = (function() {
        var _j, _len, _ref3, _results;
        _ref3 = this.shape;
        _results = [];
        for (_j = 0, _len = _ref3.length; _j < _len; _j++) {
          axis = _ref3[_j];
          _results.push(0);
        }
        return _results;
      }).call(this);
      while (true) {
        f(this.data[p], a.data[q], indices);
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
      this.each(function(x, indices) {
        return data.push(f(x, indices));
      });
      return new APLArray(data, this.shape);
    };

    APLArray.prototype.map2 = function(a, f) {
      var data;
      assert(a instanceof APLArray);
      assert(typeof f === 'function');
      data = [];
      this.each2(a, function(x, y, indices) {
        return data.push(f(x, y, indices));
      });
      return new APLArray(data, this.shape);
    };

    APLArray.prototype.toArray = function(limit) {
      var e, r;
      if (limit == null) {
        limit = Infinity;
      }
      r = [];
      try {
        this.each(function(x) {
          if (r.length >= limit) {
            throw 'break';
          }
          r.push(x);
        });
      } catch (_error) {
        e = _error;
        if (e !== 'break') {
          throw e;
        }
      }
      return r;
    };

    APLArray.prototype.toInt = function(start, end) {
      var r;
      if (start == null) {
        start = -Infinity;
      }
      if (end == null) {
        end = Infinity;
      }
      r = this.unwrap();
      if (typeof r !== 'number' || r !== ~~r || !((start <= r && r < end))) {
        throw DomainError();
      }
      return r;
    };

    APLArray.prototype.toBool = function() {
      return this.toInt(0, 2);
    };

    APLArray.prototype.isSingleton = function() {
      var n, _i, _len, _ref2;
      _ref2 = this.shape;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        n = _ref2[_i];
        if (n !== 1) {
          return false;
        }
      }
      return true;
    };

    APLArray.prototype.unwrap = function() {
      if (prod(this.shape) !== 1) {
        throw LengthError();
      }
      return this.data[this.offset];
    };

    APLArray.prototype.getPrototype = function() {
      if (this.empty() || typeof this.data[this.offset] !== 'string') {
        return 0;
      } else {
        return ' ';
      }
    };

    return APLArray;

  })();

  this.strideForShape = strideForShape = function(shape) {
    var i, r, _i, _ref2;
    assert(shape instanceof Array);
    if (shape.length === 0) {
      return [];
    }
    r = Array(shape.length);
    r[r.length - 1] = 1;
    for (i = _i = _ref2 = r.length - 2; _i >= 0; i = _i += -1) {
      assert(isInt(shape[i], 0));
      r[i] = r[i + 1] * shape[i + 1];
    }
    return r;
  };

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
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  optimist = require('optimist');

  fs = require('fs');

  _ref = require('./compiler'), nodes = _ref.nodes, compile = _ref.compile, exec = _ref.exec;

  this.main = function() {
    var a, aplCode, argv, b, ctx, filename, jsCode, k, knownOptions, opts;
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
      aplCode = fs.readFileSync(opts.file, 'utf8');
    }
    if (argv.nodes) {
      printAST(nodes(aplCode, opts));
      return;
    }
    jsCode = compile(aplCode, opts);
    if (argv.compile) {
      jsCode = "\#!/usr/bin/env node\nvar _ = require('apl').createGlobalContext();\n" + jsCode;
      if (argv.stdio || argv.print) {
        return process.stdout.write(jsCode);
      } else {
        filename = argv._[0].replace(/\.(apl|coffee)$/, '.js');
        return fs.writeFileSync(filename, jsCode, 'utf8');
      }
    } else {
      return (new Function("var _ = arguments[0];\n" + jsCode))(require('./apl').createGlobalContext());
    }
  };

  repl = function(ctx) {
    var format, readline, rl;
    readline = require('readline');
    rl = readline.createInterface(process.stdin, process.stdout);
    rl.setPrompt('APL> ');
    format = require('./vocabulary/format').format;
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
  var SyntaxError, all, assert, compile, compilerError, inherit, nodes, parser, resolveExprs, toJavaScript, vocabulary, _ref;

  parser = require('./parser');

  vocabulary = require('./vocabulary');

  _ref = require('./helpers'), inherit = _ref.inherit, assert = _ref.assert, all = _ref.all;

  SyntaxError = require('./errors').SyntaxError;

  resolveExprs = function(ast, opts) {
    var k, m, node, queue, scopeNode, v, varInfo, vars, visit, _i, _j, _len, _len1, _ref1, _ref2;
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
    ast.scopeDepth = 0;
    queue = [ast];
    while (queue.length) {
      vars = (scopeNode = queue.shift()).vars;
      visit = function(node) {
        var a, c, h, i, j, name, t, x, _j, _k, _len1, _ref10, _ref11, _ref12, _ref13, _ref14, _ref15, _ref16, _ref17, _ref18, _ref19, _ref2, _ref20, _ref21, _ref22, _ref23, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9;
        node.scopeNode = scopeNode;
        switch (node[0]) {
          case 'body':
            node.vars = inherit(vars);
            node.scopeDepth = scopeNode.scopeDepth + 1;
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
                jsCode: "_" + scopeNode.scopeDepth + "[" + (JSON.stringify(name)) + "]"
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
            return assert(false, "Unrecognised node type, '" + node[0] + "'");
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
          a = ["var _" + node.scopeDepth + " = {}"];
          _ref1 = node.slice(1);
          for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
            child = _ref1[_i];
            a.push(toJavaScript(child));
          }
          a[a.length - 1] = "return " + a[a.length - 1] + ";";
          return a.join(';\n');
        }
        break;
      case 'guard':
        return "if (_._bool(" + (toJavaScript(node[1])) + ")) {\n  return " + (toJavaScript(node[2])) + ";\n}";
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
        return "_._aplify(" + (d + s.slice(1, -1).replace(RegExp("" + (d + d), "g"), '\\' + d) + d) + ")";
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
          return "_._aplify(" + a[0] + ")";
        } else {
          return "new _._complex(" + a[0] + ", " + a[1] + ")";
        }
        break;
      case 'index':
        return "_._index(        _._aplify([" + (((function() {
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
        })()).join(', ')) + "]),        " + (toJavaScript(node[1])) + ",        _._aplify([" + ((function() {
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
        })()) + "])      )";
      case 'expr':
        return assert(false, 'No "expr" nodes are expected at this stage.');
      case 'vector':
        n = node.length - 1;
        return "_._aplify([" + (((function() {
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
        return "_._hook(" + (toJavaScript(node[2])) + ", " + (toJavaScript(node[1])) + ")";
      case 'fork':
        return "_._fork([" + ((function() {
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
        return "_._aplify(" + (node[1].replace(/(^«|»$)/g, '')) + ")";
      default:
        return assert(false, "Unrecognised node type, '" + node[0] + "'");
    }
  };

  compilerError = function(node, opts, message) {
    throw SyntaxError(message, {
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
  var Complex, DomainError, assert;

  assert = require('./helpers').assert;

  DomainError = require('./errors').DomainError;

  this.complexify = function(x) {
    if (typeof x === 'number') {
      return new Complex(x, 0);
    } else if (x instanceof Complex) {
      return x;
    } else {
      throw DomainError();
    }
  };

  this.simplify = function(re, im) {
    if (im) {
      return new Complex(re, im);
    } else {
      return re;
    }
  };

  this.Complex = Complex = (function() {
    function Complex(re, im) {
      this.re = re;
      this.im = im != null ? im : 0;
      assert(typeof this.re === 'number');
      assert(typeof this.im === 'number');
    }

    Complex.prototype.toString = function() {
      return ("" + this.re + "J" + this.im).replace(/-/g, '¯');
    };

    return Complex;

  })();

}).call(this);
}, "errors": function(exports, require, module) {(function() {
  var APLError, assert, repeat, _ref;

  _ref = require('./helpers'), assert = _ref.assert, repeat = _ref.repeat;

  APLError = function(name, message, opts) {
    var e, k, v, _ref1;
    if (message == null) {
      message = '';
    }
    assert(typeof name === 'string');
    assert(typeof message === 'string');
    if (opts != null) {
      assert(typeof opts === 'object');
      if ((opts.aplCode != null) && (opts.line != null) && (opts.col != null)) {
        assert(typeof opts.aplCode === 'string');
        assert(typeof opts.line === 'number');
        assert(typeof opts.col === 'number');
        assert((_ref1 = typeof opts.file) === 'string' || _ref1 === 'undefined');
        message += "\n" + (opts.file || '-') + ":#" + opts.line + ":" + opts.col + "\n" + (opts.aplCode.split('\n')[opts.line - 1]) + "\n" + (repeat('_', opts.col - 1)) + "^";
      }
    }
    e = Error(message);
    e.name = name;
    for (k in opts) {
      v = opts[k];
      e[k] = v;
    }
    return e;
  };

  this.SyntaxError = function(message, opts) {
    return APLError('SYNTAX ERROR', message, opts);
  };

  this.DomainError = function(message, opts) {
    return APLError('DOMAIN ERROR', message, opts);
  };

  this.LengthError = function(message, opts) {
    return APLError('LENGTH ERROR', message, opts);
  };

  this.RankError = function(message, opts) {
    return APLError('RANK ERROR', message, opts);
  };

  this.IndexError = function(message, opts) {
    return APLError('INDEX ERROR', message, opts);
  };

}).call(this);
}, "helpers": function(exports, require, module) {(function() {
  var assert, extend, isInt, repeat;

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

  this.prod = function(xs) {
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

  this.repeat = repeat = function(a, n) {
    var m;
    assert(typeof a === 'string' || a instanceof Array);
    assert(isInt(n, 0));
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

  this.isInt = isInt = function(x, start, end) {
    if (start == null) {
      start = -Infinity;
    }
    if (end == null) {
      end = Infinity;
    }
    return x === ~~x && (start <= x && x < end);
  };

}).call(this);
}, "lexer": function(exports, require, module) {(function() {
  var SyntaxError, tokenDefs;

  SyntaxError = require('./errors').SyntaxError;

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
            throw SyntaxError('Unrecognised token', {
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
  var SyntaxError, lexer,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  lexer = require('./lexer');

  SyntaxError = require('./errors').SyntaxError;

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
      throw SyntaxError(message, {
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
        while (consume('separator newline')) {}
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
  var createLazyRequire, fromModule, k, lazyRequires, name, names, v, _base, _base1, _base2, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref, _ref1, _ref2,
    __slice = [].slice;

  lazyRequires = {
    arithmetic: '+-×÷*⍟∣|',
    floorceil: '⌊⌈',
    question: '?',
    exclamation: '!',
    circle: '○',
    comparisons: '=≠<>≤≥≡≢',
    logic: '~∨∧⍱⍲',
    rho: '⍴',
    iota: '⍳',
    rotate: '⌽⊖',
    transpose: '⍉',
    epsilon: '∊',
    zilde: ['get_⍬', 'set_⍬'],
    comma: ',⍪',
    grade: '⍋⍒',
    take: '↑',
    drop: '↓',
    squish: ['⌷', '_index'],
    quad: ['get_⎕', 'set_⎕', 'get_⍞', 'set_⍞'],
    format: '⍕',
    forkhook: ['_fork', '_hook'],
    each: '¨',
    commute: '⍨',
    cupcap: '∪∩',
    find: '⍷',
    enclose: '⊂',
    disclose: '⊃',
    execute: '⍎',
    poweroperator: '⍣',
    innerproduct: '.',
    outerproduct: ['∘.'],
    slash: '/⌿',
    backslash: '\\⍀',
    tack: '⊣⊢',
    encode: '⊤',
    decode: '⊥',
    special: ['_aplify', '_complex', '_bool', 'get_⎕IO', 'set_⎕IO']
  };

  createLazyRequire = function(obj, name, fromModule) {
    return obj[name] = function() {
      var args, f;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      obj[name] = f = require(fromModule)[name];
      f.aplName = name;
      f.aplMetaInfo = arguments.callee.aplMetaInfo;
      return f.apply(null, args);
    };
  };

  for (fromModule in lazyRequires) {
    names = lazyRequires[fromModule];
    for (_i = 0, _len = names.length; _i < _len; _i++) {
      name = names[_i];
      createLazyRequire(this, name, './vocabulary/' + fromModule);
    }
  }

  _ref = ['∘.'];
  for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
    name = _ref[_j];
    ((_base = this[name]).aplMetaInfo != null ? (_base = this[name]).aplMetaInfo : _base.aplMetaInfo = {}).isPrefixAdverb = true;
  }

  _ref1 = '⍨¨/⌿\\⍀';
  for (_k = 0, _len2 = _ref1.length; _k < _len2; _k++) {
    name = _ref1[_k];
    ((_base1 = this[name]).aplMetaInfo != null ? (_base1 = this[name]).aplMetaInfo : _base1.aplMetaInfo = {}).isPostfixAdverb = true;
  }

  _ref2 = '.⍣';
  for (_l = 0, _len3 = _ref2.length; _l < _len3; _l++) {
    name = _ref2[_l];
    ((_base2 = this[name]).aplMetaInfo != null ? (_base2 = this[name]).aplMetaInfo : _base2.aplMetaInfo = {}).isConjunction = true;
  }

  for (k in this) {
    v = this[k];
    if (typeof v === 'function') {
      v.aplName = k;
    }
  }

}).call(this);
}, "vocabulary/arithmetic": function(exports, require, module) {(function() {
  var Complex, DomainError, complexify, div, exp, ln, mult, pervasive, simplify, _ref;

  pervasive = require('./vhelpers').pervasive;

  _ref = require('../complex'), Complex = _ref.Complex, complexify = _ref.complexify, simplify = _ref.simplify;

  DomainError = require('../errors').DomainError;

  this['+'] = pervasive({
    monad: function(x) {
      if (typeof x === 'number') {
        return x;
      } else if (x instanceof Complex) {
        return new Complex(x.re, -x.im);
      } else {
        throw DomainError();
      }
    },
    dyad: function(y, x) {
      if (typeof x === 'number' && typeof y === 'number') {
        return x + y;
      } else {
        x = complexify(x);
        y = complexify(y);
        return simplify(x.re + y.re, x.im + y.im);
      }
    }
  });

  this['-'] = pervasive({
    monad: function(x) {
      if (typeof x === 'number') {
        return -x;
      } else if (x instanceof Complex) {
        return new Complex(-x.re, -x.im);
      } else {
        throw DomainError();
      }
    },
    dyad: function(y, x) {
      if (typeof x === 'number' && typeof y === 'number') {
        return x - y;
      } else {
        x = complexify(x);
        y = complexify(y);
        return simplify(x.re - y.re, x.im - y.im);
      }
    }
  });

  this['×'] = pervasive({
    monad: function(x) {
      var d;
      if (typeof x === 'number') {
        return (x > 0) - (x < 0);
      } else if (x instanceof Complex) {
        d = Math.sqrt(x.re * x.re + x.im * x.im);
        return simplify(x.re / d, x.im / d);
      } else {
        throw DomainError();
      }
    },
    dyad: mult = function(y, x) {
      var _ref1;
      if ((typeof x === (_ref1 = typeof y) && _ref1 === 'number')) {
        return x * y;
      } else {
        x = complexify(x);
        y = complexify(y);
        return simplify(x.re * y.re - x.im * y.im, x.re * y.im + x.im * y.re);
      }
    }
  });

  this['÷'] = pervasive({
    monad: function(x) {
      var d;
      if (typeof x === 'number') {
        return 1 / x;
      } else if (x instanceof Complex) {
        d = x.re * x.re + x.im * x.im;
        return simplify(x.re / d, -x.im / d);
      } else {
        throw DomainError();
      }
    },
    dyad: div = function(y, x) {
      var d, _ref1;
      if ((typeof x === (_ref1 = typeof y) && _ref1 === 'number')) {
        return x / y;
      } else {
        x = complexify(x);
        y = complexify(y);
        d = y.re * y.re + y.im * y.im;
        return simplify((x.re * y.re + x.im * y.im) / d, (y.re * x.im - y.im * x.re) / d);
      }
    }
  });

  this['*'] = pervasive({
    monad: exp = function(x) {
      var r;
      if (typeof x === 'number') {
        return Math.exp(x);
      } else if (x instanceof Complex) {
        r = Math.exp(x.re);
        return simplify(r * Math.cos(x.im), r * Math.sin(x.im));
      } else {
        throw DomainError();
      }
    },
    dyad: function(y, x) {
      var _ref1;
      if ((typeof x === (_ref1 = typeof y) && _ref1 === 'number') && x >= 0) {
        return Math.pow(x, y);
      } else {
        x = complexify(x);
        y = complexify(y);
        return exp(mult(ln(x), y));
      }
    }
  });

  this['⍟'] = pervasive({
    monad: ln = function(x) {
      if (typeof x === 'number' && x > 0) {
        return Math.log(x);
      } else {
        x = complexify(x);
        return simplify(Math.log(Math.sqrt(x.re * x.re + x.im * x.im)), Math.atan2(x.im, x.re));
      }
    },
    dyad: function(y, x) {
      var _ref1;
      if ((typeof x === (_ref1 = typeof y) && _ref1 === 'number') && x > 0 && y > 0) {
        return Math.log(y) / Math.log(x);
      } else {
        x = complexify(x);
        y = complexify(y);
        return div(ln(x), ln(y));
      }
    }
  });

  this['∣'] = this['|'] = pervasive({
    monad: function(x) {
      if (typeof x === 'number') {
        return Math.abs(x);
      } else if (x instanceof Complex) {
        return Math.sqrt(x.re * x.re + x.im * x.im);
      } else {
        throw DomainError();
      }
    },
    dyad: function(y, x) {
      var _ref1;
      if ((typeof x === (_ref1 = typeof y) && _ref1 === 'number')) {
        return y % x;
      } else {
        throw DomainError();
      }
    }
  });

}).call(this);
}, "vocabulary/backslash": function(exports, require, module) {(function() {
  var APLArray, assert, expand, scan;

  APLArray = require('../array').APLArray;

  assert = require('../helpers').assert;

  this['\\'] = function(omega, alpha, axis) {
    if (typeof omega === 'function') {
      return scan(omega, void 0, axis);
    } else {
      return expand(omega, alpha, axis);
    }
  };

  this['⍀'] = function(omega, alpha, axis) {
    if (axis == null) {
      axis = APLArray.zero;
    }
    if (typeof omega === 'function') {
      return scan(omega, void 0, axis);
    } else {
      return expand(omega, alpha, axis);
    }
  };

  scan = function(f, g, axis) {
    assert(typeof g === 'undefined');
    return function(omega, alpha) {
      assert(alpha == null);
      if (omega.shape.length === 0) {
        return omega;
      }
      axis = axis ? axis.toInt(0, omega.shape.length) : omega.shape.length - 1;
      return omega.map(function(x, indices) {
        var a, index, j, p, y, _i, _j, _len, _ref;
        p = omega.offset;
        for (a = _i = 0, _len = indices.length; _i < _len; a = ++_i) {
          index = indices[a];
          p += index * omega.stride[a];
        }
        if (!(x instanceof APLArray)) {
          x = APLArray.scalar(x);
        }
        for (j = _j = 0, _ref = indices[axis]; _j < _ref; j = _j += 1) {
          p -= omega.stride[axis];
          y = omega.data[p];
          if (!(y instanceof APLArray)) {
            y = APLArray.scalar(y);
          }
          x = f(x, y);
        }
        if (x.shape.length === 0) {
          x = x.unwrap();
        }
        return x;
      });
    };
  };

  expand = function() {};

}).call(this);
}, "vocabulary/circle": function(exports, require, module) {(function() {
  var APLArray, numeric, pervasive, _ref;

  APLArray = require('../array').APLArray;

  _ref = require('./vhelpers'), numeric = _ref.numeric, pervasive = _ref.pervasive;

  this['○'] = pervasive({
    monad: numeric(function(x) {
      return Math.PI * x;
    }),
    dyad: numeric(function(x, i) {
      var ex;
      switch (i) {
        case 0:
          return Math.sqrt(1 - x * x);
        case 1:
          return Math.sin(x);
        case 2:
          return Math.cos(x);
        case 3:
          return Math.tan(x);
        case 4:
          return Math.sqrt(1 + x * x);
        case 5:
          return (Math.exp(2 * x) - 1) / 2;
        case 6:
          return (Math.exp(2 * x) + 1) / 2;
        case 7:
          ex = Math.exp(2 * x);
          return (ex - 1) / (ex + 1);
        case -1:
          return Math.asin(x);
        case -2:
          return Math.acos(x);
        case -3:
          return Math.atan(x);
        case -4:
          return Math.sqrt(x * x - 1);
        case -5:
          return Math.log(x + Math.sqrt(x * x + 1));
        case -6:
          return Math.log(x + Math.sqrt(x * x - 1));
        case -7:
          return Math.log((1 + x) / (1 - x)) / 2;
        default:
          throw Error('Unknown circular or hyperbolic function ' + i);
      }
    })
  });

}).call(this);
}, "vocabulary/comma": function(exports, require, module) {(function() {
  var APLArray, DomainError, LengthError, RankError, assert, catenate, isInt, prod, repeat, _ref, _ref1;

  APLArray = require('../array').APLArray;

  _ref = require('../errors'), DomainError = _ref.DomainError, RankError = _ref.RankError, LengthError = _ref.LengthError;

  _ref1 = require('../helpers'), assert = _ref1.assert, prod = _ref1.prod, repeat = _ref1.repeat, isInt = _ref1.isInt;

  this[','] = function(omega, alpha, axis) {
    var data;
    if (alpha) {
      return catenate(omega, alpha, axis);
    } else {
      data = [];
      omega.each(function(x) {
        return data.push(x);
      });
      return new APLArray(data);
    }
  };

  this['⍪'] = function(omega, alpha, axis) {
    if (axis == null) {
      axis = APLArray.zero;
    }
    if (alpha) {
      return catenate(omega, alpha, axis);
    } else {
      throw Error('Not implemented');
    }
  };

  catenate = function(omega, alpha, axis) {
    var a, data, i, nAxes, p, pIndices, q, r, rStride, s, shape, stride, _i, _j, _ref2, _ref3;
    assert(alpha);
    assert(typeof axis === 'undefined' || axis instanceof APLArray);
    nAxes = Math.max(alpha.shape.length, omega.shape.length);
    if (axis) {
      axis = axis.unwrap();
      if (typeof axis !== 'number') {
        throw DomainError();
      }
      if (!((-1 < axis && axis < nAxes))) {
        throw RankError();
      }
    } else {
      axis = nAxes - 1;
    }
    if (alpha.shape.length === 0 && omega.shape.length === 0) {
      return new APLArray([alpha.unwrap(), omega.unwrap()]);
    } else if (alpha.shape.length === 0) {
      s = omega.shape.slice(0);
      if (isInt(axis)) {
        s[axis] = 1;
      }
      alpha = new APLArray([alpha.unwrap()], s, repeat([0], omega.shape.length));
    } else if (omega.shape.length === 0) {
      s = alpha.shape.slice(0);
      if (isInt(axis)) {
        s[axis] = 1;
      }
      omega = new APLArray([omega.unwrap()], s, repeat([0], alpha.shape.length));
    } else if (alpha.shape.length + 1 === omega.shape.length) {
      if (!isInt(axis)) {
        throw RankError();
      }
      shape = alpha.shape.slice(0);
      shape.splice(axis, 0, 1);
      stride = alpha.stride.slice(0);
      stride.splice(axis, 0, 0);
      alpha = new APLArray(alpha.data, shape, stride, alpha.offset);
    } else if (alpha.shape.length === omega.shape.length + 1) {
      if (!isInt(axis)) {
        throw RankError();
      }
      shape = omega.shape.slice(0);
      shape.splice(axis, 0, 1);
      stride = omega.stride.slice(0);
      stride.splice(axis, 0, 0);
      omega = new APLArray(omega.data, shape, stride, omega.offset);
    } else if (alpha.shape.length !== omega.shape.length) {
      throw RankError();
    }
    assert(alpha.shape.length === omega.shape.length);
    for (i = _i = 0, _ref2 = alpha.shape.length; 0 <= _ref2 ? _i < _ref2 : _i > _ref2; i = 0 <= _ref2 ? ++_i : --_i) {
      if (i !== axis && alpha.shape[i] !== omega.shape[i]) {
        throw LengthError();
      }
    }
    shape = alpha.shape.slice(0);
    if (isInt(axis)) {
      shape[axis] += omega.shape[axis];
    } else {
      shape.splice(Math.ceil(axis), 0, 2);
    }
    data = Array(prod(shape));
    stride = Array(shape.length);
    stride[shape.length - 1] = 1;
    for (i = _j = _ref3 = shape.length - 2; _j >= 0; i = _j += -1) {
      stride[i] = stride[i + 1] * shape[i + 1];
    }
    if (isInt(axis)) {
      rStride = stride;
    } else {
      rStride = stride.slice(0);
      rStride.splice(Math.ceil(axis), 1);
    }
    if (!alpha.empty()) {
      r = 0;
      p = alpha.offset;
      pIndices = repeat([0], alpha.shape.length);
      while (true) {
        data[r] = alpha.data[p];
        a = pIndices.length - 1;
        while (a >= 0 && pIndices[a] + 1 === alpha.shape[a]) {
          p -= pIndices[a] * alpha.stride[a];
          r -= pIndices[a] * rStride[a];
          pIndices[a--] = 0;
        }
        if (a < 0) {
          break;
        }
        p += alpha.stride[a];
        r += rStride[a];
        pIndices[a]++;
      }
    }
    if (!omega.empty()) {
      r = isInt(axis) ? stride[axis] * alpha.shape[axis] : stride[Math.ceil(axis)];
      q = omega.offset;
      pIndices = repeat([0], omega.shape.length);
      while (true) {
        data[r] = omega.data[q];
        a = pIndices.length - 1;
        while (a >= 0 && pIndices[a] + 1 === omega.shape[a]) {
          q -= pIndices[a] * omega.stride[a];
          r -= pIndices[a] * rStride[a];
          pIndices[a--] = 0;
        }
        if (a < 0) {
          break;
        }
        q += omega.stride[a];
        r += rStride[a];
        pIndices[a]++;
      }
    }
    return new APLArray(data, shape, stride);
  };

}).call(this);
}, "vocabulary/commute": function(exports, require, module) {(function() {
  var assert;

  assert = require('../helpers').assert;

  this['⍨'] = function(f) {
    assert(typeof f === 'function');
    return function(omega, alpha, axis) {
      if (alpha) {
        return f(alpha, omega, axis);
      } else {
        return f(omega, void 0, axis);
      }
    };
  };

}).call(this);
}, "vocabulary/comparisons": function(exports, require, module) {(function() {
  var APLArray, Complex, depthOf, eq, match, numeric, pervasive, _ref;

  APLArray = require('../array').APLArray;

  _ref = require('./vhelpers'), pervasive = _ref.pervasive, numeric = _ref.numeric, match = _ref.match;

  Complex = require('../complex').Complex;

  this['='] = pervasive({
    dyad: eq = function(y, x) {
      if (x instanceof Complex && y instanceof Complex) {
        return +(x.re === y.re && x.im === y.im);
      } else {
        return +(x === y);
      }
    }
  });

  this['≠'] = pervasive({
    dyad: function(y, x) {
      return 1 - eq(y, x);
    }
  });

  this['<'] = pervasive({
    dyad: numeric(function(y, x) {
      return +(x < y);
    })
  });

  this['>'] = pervasive({
    dyad: numeric(function(y, x) {
      return +(x > y);
    })
  });

  this['≤'] = pervasive({
    dyad: numeric(function(y, x) {
      return +(x <= y);
    })
  });

  this['≥'] = pervasive({
    dyad: numeric(function(y, x) {
      return +(x >= y);
    })
  });

  this['≡'] = function(omega, alpha) {
    if (alpha) {
      return APLArray.bool[+match(omega, alpha)];
    } else {
      return new APLArray([depthOf(omega)], []);
    }
  };

  depthOf = function(x) {
    var r;
    if (x instanceof APLArray) {
      if (x.shape.length === 0 && !(x.data[0] instanceof APLArray)) {
        return 0;
      }
      r = 0;
      x.each(function(y) {
        return r = Math.max(r, depthOf(y));
      });
      return r + 1;
    } else {
      return 0;
    }
  };

  this['≢'] = function(omega, alpha) {
    if (alpha) {
      return APLArray.bool[+(!match(omega, alpha))];
    } else {
      throw Error('Not implemented');
    }
  };

}).call(this);
}, "vocabulary/cupcap": function(exports, require, module) {(function() {
  var APLArray, RankError, assert, contains, match;

  APLArray = require('../array').APLArray;

  match = require('./vhelpers').match;

  assert = require('../helpers').assert;

  RankError = require('../errors').RankError;

  this['∪'] = function(omega, alpha) {
    var a, data, _i, _len, _ref;
    if (alpha) {
      data = [];
      _ref = [alpha, omega];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        a = _ref[_i];
        if (a.shape.length > 1) {
          throw RankError();
        }
        a.each(function(x) {
          if (!contains(data, x)) {
            return data.push(x);
          }
        });
      }
      return new APLArray(data);
    } else {
      data = [];
      omega.each(function(x) {
        if (!contains(data, x)) {
          return data.push(x);
        }
      });
      return new APLArray(data);
    }
  };

  this['∩'] = function(omega, alpha) {
    var b, data, x, _i, _len, _ref;
    if (alpha) {
      data = [];
      b = omega.toArray();
      _ref = alpha.toArray();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        x = _ref[_i];
        if (contains(b, x)) {
          data.push(x);
        }
      }
      return new APLArray(data);
    } else {
      throw Error('Not implemented');
    }
  };

  contains = function(a, x) {
    var y, _i, _len;
    assert(a instanceof Array);
    for (_i = 0, _len = a.length; _i < _len; _i++) {
      y = a[_i];
      if (match(x, y)) {
        return true;
      }
    }
    return false;
  };

}).call(this);
}, "vocabulary/decode": function(exports, require, module) {(function() {
  var APLArray, assert;

  APLArray = require('../array').APLArray;

  assert = require('../helpers').assert;

  this['⊥'] = function(omega, alpha) {
    var a, b, data, firstDimB, i, j, k, lastDimA, x, y, z, _i, _j, _k, _ref, _ref1, _ref2;
    assert(alpha);
    if (alpha.shape.length === 0) {
      alpha = new APLArray([alpha.unwrap()]);
    }
    if (omega.shape.length === 0) {
      omega = new APLArray([omega.unwrap()]);
    }
    lastDimA = alpha.shape[alpha.shape.length - 1];
    firstDimB = omega.shape[0];
    if (lastDimA !== 1 && firstDimB !== 1 && lastDimA !== firstDimB) {
      throw LengthError();
    }
    a = alpha.toArray();
    b = omega.toArray();
    data = [];
    for (i = _i = 0, _ref = a.length / lastDimA; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
      for (j = _j = 0, _ref1 = b.length / firstDimB; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; j = 0 <= _ref1 ? ++_j : --_j) {
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
            var _k, _ref2, _results;
            _results = [];
            for (_k = 0, _ref2 = y.length; 0 <= _ref2 ? _k < _ref2 : _k > _ref2; 0 <= _ref2 ? _k++ : _k--) {
              _results.push(x[0]);
            }
            return _results;
          })();
        }
        if (y.length === 1) {
          y = (function() {
            var _k, _ref2, _results;
            _results = [];
            for (_k = 0, _ref2 = x.length; 0 <= _ref2 ? _k < _ref2 : _k > _ref2; 0 <= _ref2 ? _k++ : _k--) {
              _results.push(y[0]);
            }
            return _results;
          })();
        }
        z = y[0];
        for (k = _k = 1, _ref2 = y.length; 1 <= _ref2 ? _k < _ref2 : _k > _ref2; k = 1 <= _ref2 ? ++_k : --_k) {
          z = z * x[k] + y[k];
        }
        data.push(z);
      }
    }
    return new APLArray(data, alpha.shape.slice(0, -1).concat(omega.shape.slice(1)));
  };

}).call(this);
}, "vocabulary/disclose": function(exports, require, module) {(function() {
  var APLArray;

  APLArray = require('../array').APLArray;

  this['⊃'] = function(omega, alpha) {
    var x;
    if (alpha) {
      throw Error('Not implemented');
    } else {
      if (omega.empty()) {
        return APLArray.zero;
      } else {
        x = omega.data[omega.offset];
        if (x instanceof APLArray) {
          return x;
        } else {
          return APLArray.scalar(x);
        }
      }
    }
  };

}).call(this);
}, "vocabulary/drop": function(exports, require, module) {(function() {
  var APLArray, DomainError, RankError, isInt, prod, repeat, _ref, _ref1;

  APLArray = require('../array').APLArray;

  _ref = require('../helpers'), isInt = _ref.isInt, repeat = _ref.repeat, prod = _ref.prod;

  _ref1 = require('../errors'), DomainError = _ref1.DomainError, RankError = _ref1.RankError;

  this['↓'] = function(omega, alpha, axis) {
    var a, i, offset, shape, x, _i, _j, _len, _len1;
    if (alpha) {
      if (alpha.shape.length > 1) {
        throw RankError();
      }
      a = alpha.toArray();
      for (_i = 0, _len = a.length; _i < _len; _i++) {
        x = a[_i];
        if (!isInt(x)) {
          throw DomainError();
        }
      }
      if (omega.shape.length === 0) {
        omega = new APLArray(omega.data, repeat([1], a.length), omega.stride, omega.offset);
      } else {
        if (a.length > omega.shape.length) {
          throw RankError();
        }
      }
      shape = omega.shape.slice(0);
      offset = omega.offset;
      for (i = _j = 0, _len1 = a.length; _j < _len1; i = ++_j) {
        x = a[i];
        shape[i] = Math.max(0, omega.shape[i] - Math.abs(x));
        if (x > 0) {
          offset += x * omega.stride[i];
        }
      }
      if (prod(shape) === 0) {
        return new APLArray([], shape);
      } else {
        return new APLArray(omega.data, shape, omega.stride, offset);
      }
    } else {
      throw Error('Not implemented');
    }
  };

}).call(this);
}, "vocabulary/each": function(exports, require, module) {(function() {
  var APLArray, LengthError, arrayEquals, assert;

  APLArray = require('../array').APLArray;

  LengthError = require('../errors').LengthError;

  assert = require('../helpers').assert;

  this['¨'] = function(f, g) {
    assert(typeof f === 'function');
    assert(typeof g === 'undefined');
    return function(omega, alpha) {
      var x, y;
      if (!alpha) {
        return omega.map(function(x) {
          var r;
          if (!(x instanceof APLArray)) {
            x = new APLArray([x], []);
          }
          r = f(x);
          assert(r instanceof APLArray);
          if (r.shape.length === 0) {
            return r.unwrap();
          } else {
            return r;
          }
        });
      } else if (arrayEquals(alpha.shape, omega.shape)) {
        return omega.map2(alpha, function(x, y) {
          var r;
          if (!(x instanceof APLArray)) {
            x = new APLArray([x], []);
          }
          if (!(y instanceof APLArray)) {
            y = new APLArray([y], []);
          }
          r = f(x, y);
          assert(r instanceof APLArray);
          if (r.shape.length === 0) {
            return r.unwrap();
          } else {
            return r;
          }
        });
      } else if (alpha.isSingleton()) {
        y = alpha.data[0] instanceof APLArray ? alpha.unwrap() : alpha;
        return omega.map(function(x) {
          var r;
          if (!(x instanceof APLArray)) {
            x = new APLArray([x], []);
          }
          r = f(x, y);
          assert(r instanceof APLArray);
          if (r.shape.length === 0) {
            return r.unwrap();
          } else {
            return r;
          }
        });
      } else if (omega.isSingleton()) {
        x = omega.data[0] instanceof APLArray ? omega.unwrap() : omega;
        return alpha.map(function(y) {
          var r;
          if (!(y instanceof APLArray)) {
            y = new APLArray([y], []);
          }
          r = f(x, y);
          assert(r instanceof APLArray);
          if (r.shape.length === 0) {
            return r.unwrap();
          } else {
            return r;
          }
        });
      } else {
        throw LengthError();
      }
    };
  };

  arrayEquals = function(a, b) {
    var i, x, _i, _len;
    assert(a instanceof Array);
    assert(b instanceof Array);
    if (a.length !== b.length) {
      return false;
    }
    for (i = _i = 0, _len = a.length; _i < _len; i = ++_i) {
      x = a[i];
      if (x !== b[i]) {
        return false;
      }
    }
    return true;
  };

}).call(this);
}, "vocabulary/enclose": function(exports, require, module) {(function() {
  var APLArray, getAxisList, repeat,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  APLArray = require('../array').APLArray;

  repeat = require('../helpers').repeat;

  getAxisList = require('./vhelpers').getAxisList;

  this['⊂'] = function(omega, alpha, axes) {
    var a, axis, data, indices, p, resultAxes, shape, stride, unitShape, unitStride, _i, _ref, _results;
    if (alpha) {
      throw Error('Not implemented');
    } else {
      axes = axes != null ? getAxisList(axes, omega.shape.length) : (function() {
        _results = [];
        for (var _i = 0, _ref = omega.shape.length; 0 <= _ref ? _i < _ref : _i > _ref; 0 <= _ref ? _i++ : _i--){ _results.push(_i); }
        return _results;
      }).apply(this);
      if (omega.shape.length === 0) {
        return omega;
      }
      unitShape = (function() {
        var _j, _len, _results1;
        _results1 = [];
        for (_j = 0, _len = axes.length; _j < _len; _j++) {
          axis = axes[_j];
          _results1.push(omega.shape[axis]);
        }
        return _results1;
      })();
      unitStride = (function() {
        var _j, _len, _results1;
        _results1 = [];
        for (_j = 0, _len = axes.length; _j < _len; _j++) {
          axis = axes[_j];
          _results1.push(omega.stride[axis]);
        }
        return _results1;
      })();
      resultAxes = (function() {
        var _j, _ref1, _results1;
        _results1 = [];
        for (axis = _j = 0, _ref1 = omega.shape.length; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; axis = 0 <= _ref1 ? ++_j : --_j) {
          if (__indexOf.call(axes, axis) < 0) {
            _results1.push(axis);
          }
        }
        return _results1;
      })();
      shape = (function() {
        var _j, _len, _results1;
        _results1 = [];
        for (_j = 0, _len = resultAxes.length; _j < _len; _j++) {
          axis = resultAxes[_j];
          _results1.push(omega.shape[axis]);
        }
        return _results1;
      })();
      stride = (function() {
        var _j, _len, _results1;
        _results1 = [];
        for (_j = 0, _len = resultAxes.length; _j < _len; _j++) {
          axis = resultAxes[_j];
          _results1.push(omega.stride[axis]);
        }
        return _results1;
      })();
      data = [];
      p = omega.offset;
      indices = repeat([0], shape.length);
      while (true) {
        data.push(new APLArray(omega.data, unitShape, unitStride, p));
        a = indices.length - 1;
        while (a >= 0 && indices[a] + 1 === shape[a]) {
          p -= indices[a] * stride[a];
          indices[a--] = 0;
        }
        if (a < 0) {
          break;
        }
        p += stride[a];
        indices[a]++;
      }
      return new APLArray(data, shape);
    }
  };

}).call(this);
}, "vocabulary/encode": function(exports, require, module) {(function() {
  var APLArray, assert, prod, _ref;

  APLArray = require('../array').APLArray;

  _ref = require('../helpers'), prod = _ref.prod, assert = _ref.assert;

  this['⊤'] = function(omega, alpha) {
    var a, b, data, i, isNeg, j, k, m, n, shape, x, y, _i, _j, _k, _len, _ref1;
    assert(alpha);
    a = alpha.toArray();
    b = omega.toArray();
    shape = alpha.shape.concat(omega.shape);
    data = Array(prod(shape));
    n = alpha.shape.length ? alpha.shape[0] : 1;
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
            data[(k * m + i) * b.length + j] = y;
            y = 0;
          } else {
            data[(k * m + i) * b.length + j] = y % x;
            y = Math.round((y - (y % x)) / x);
          }
        }
      }
    }
    return new APLArray(data, shape);
  };

}).call(this);
}, "vocabulary/epsilon": function(exports, require, module) {(function() {
  var APLArray, enlist, match;

  APLArray = require('../array').APLArray;

  match = require('./vhelpers').match;

  enlist = function(x, r) {
    if (x instanceof APLArray) {
      return x.each(function(y) {
        return enlist(y, r);
      });
    } else {
      return r.push(x);
    }
  };

  this['∊'] = function(omega, alpha) {
    var a, data;
    if (alpha) {
      a = omega.toArray();
      return alpha.map(function(x) {
        var y, _i, _len;
        for (_i = 0, _len = a.length; _i < _len; _i++) {
          y = a[_i];
          if (match(x, y)) {
            return 1;
          }
        }
        return 0;
      });
    } else {
      data = [];
      enlist(omega, data);
      return new APLArray(data);
    }
  };

}).call(this);
}, "vocabulary/exclamation": function(exports, require, module) {(function() {
  var Gamma, isInt, numeric, pervasive, _ref;

  _ref = require('./vhelpers'), pervasive = _ref.pervasive, numeric = _ref.numeric;

  isInt = require('../helpers').isInt;

  this['!'] = pervasive({
    monad: numeric(function(x) {
      var i, r;
      if (isInt(x, 0, 25)) {
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
    }),
    dyad: numeric(function(n, k) {
      var i, u, v, _i;
      if (isInt(k, 0, 100) && isInt(n, 0, 100)) {
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
    })
  });

  Gamma = function(x) {
    var a, i, p, t, _i, _ref1;
    p = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (x < 0.5) {
      return Math.PI / (Math.sin(Math.PI * x) * Gamma(1 - x));
    }
    x--;
    a = p[0];
    t = x + 7.5;
    for (i = _i = 1, _ref1 = p.length; 1 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 1 <= _ref1 ? ++_i : --_i) {
      a += p[i] / (x + i);
    }
    return Math.sqrt(2 * Math.PI) * Math.pow(t, x + 0.5) * Math.exp(-t) * a;
  };

}).call(this);
}, "vocabulary/execute": function(exports, require, module) {(function() {
  var DomainError;

  DomainError = require('../errors').DomainError;

  this['⍎'] = function(omega, alpha) {
    var s;
    if (alpha) {
      throw Error('Not implemented');
    } else {
      s = '';
      omega.each(function(c) {
        if (typeof c !== 'string') {
          throw DomainError();
        }
        return s += c;
      });
      return require('../compiler').exec(s);
    }
  };

}).call(this);
}, "vocabulary/find": function(exports, require, module) {(function() {
  var APLArray, match, prod, repeat, strideForShape, _ref, _ref1;

  _ref = require('../array'), APLArray = _ref.APLArray, strideForShape = _ref.strideForShape;

  _ref1 = require('../helpers'), prod = _ref1.prod, repeat = _ref1.repeat;

  match = require('./vhelpers').match;

  this['⍷'] = function(omega, alpha) {
    var a, d, data, findShape, i, indices, p, q, stride, _i, _ref2;
    if (alpha) {
      if (alpha.shape.length > omega.shape.length) {
        return new APLArray([0], omega.shape, repeat([0], omega.shape.length));
      }
      if (alpha.shape.length < omega.shape.length) {
        alpha = new APLArray(alpha.data, repeat([1], omega.shape.length - alpha.shape.length).concat(alpha.shape), repeat([0], omega.shape.length - alpha.shape.length).concat(alpha.stride), alpha.offset);
      }
      if (prod(alpha.shape) === 0) {
        return new APLArray([1], omega.shape, repeat([0], omega.shape.length));
      }
      findShape = [];
      for (i = _i = 0, _ref2 = omega.shape.length; 0 <= _ref2 ? _i < _ref2 : _i > _ref2; i = 0 <= _ref2 ? ++_i : --_i) {
        d = omega.shape[i] - alpha.shape[i] + 1;
        if (d <= 0) {
          return new APLArray([0], omega.shape, repeat([0], omega.shape.length));
        }
        findShape.push(d);
      }
      stride = strideForShape(omega.shape);
      data = repeat([0], prod(omega.shape));
      p = omega.offset;
      q = 0;
      indices = repeat([0], findShape.length);
      while (true) {
        data[q] = +match(alpha, new APLArray(omega.data, alpha.shape, omega.stride, p));
        a = findShape.length - 1;
        while (a >= 0 && indices[a] + 1 === findShape[a]) {
          p -= indices[a] * omega.stride[a];
          q -= indices[a] * stride[a];
          indices[a--] = 0;
        }
        if (a < 0) {
          break;
        }
        p += omega.stride[a];
        q += stride[a];
        indices[a]++;
      }
      return new APLArray(data, omega.shape);
    } else {
      throw Error('Not implemented');
    }
  };

}).call(this);
}, "vocabulary/floorceil": function(exports, require, module) {(function() {
  var numeric, pervasive, _ref;

  _ref = require('./vhelpers'), pervasive = _ref.pervasive, numeric = _ref.numeric;

  this['⌊'] = pervasive({
    monad: numeric(Math.floor),
    dyad: numeric(function(y, x) {
      return Math.min(y, x);
    })
  });

  this['⌈'] = pervasive({
    monad: numeric(Math.ceil),
    dyad: numeric(function(y, x) {
      return Math.max(y, x);
    })
  });

}).call(this);
}, "vocabulary/forkhook": function(exports, require, module) {(function() {
  var assert;

  assert = require('../helpers').assert;

  this._hook = function(g, f) {
    assert(typeof f === 'function');
    assert(typeof g === 'function');
    return function(b, a) {
      return f(g(b), a != null ? a : b);
    };
  };

  this._fork = function(verbs) {
    var f, _i, _len;
    assert(verbs.length % 2 === 1);
    assert(verbs.length >= 3);
    for (_i = 0, _len = verbs.length; _i < _len; _i++) {
      f = verbs[_i];
      assert(typeof f === 'function');
    }
    return function(b, a) {
      var i, r, _j, _ref;
      r = verbs[verbs.length - 1](b, a);
      for (i = _j = _ref = verbs.length - 2; _j > 0; i = _j += -2) {
        r = verbs[i](r, verbs[i - 1](b, a));
      }
      return r;
    };
  };

}).call(this);
}, "vocabulary/format": function(exports, require, module) {(function() {
  var APLArray, format, prod, repeat, _ref;

  APLArray = require('../array').APLArray;

  _ref = require('../helpers'), prod = _ref.prod, repeat = _ref.repeat;

  this['⍕'] = function(omega, alpha) {
    var t;
    if (alpha) {
      throw Error('Not implemented');
    } else {
      t = format(omega);
      return new APLArray(t.join(''), [t.length, t[0].length]);
    }
  };

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
    } else if (!(a instanceof APLArray)) {
      return ['' + a];
    } else if (a.length === 0) {
      return [''];
    } else {
      sa = a.shape;
      a = a.toArray();
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
              c.type = Math.max(c.type, typeof x === 'string' && x.length === 1 ? 0 : !(x instanceof APLArray) ? 1 : 2);
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
}, "vocabulary/grade": function(exports, require, module) {(function() {
  var APLArray, DomainError, RankError, grade, repeat, _ref;

  APLArray = require('../array').APLArray;

  _ref = require('../errors'), RankError = _ref.RankError, DomainError = _ref.DomainError;

  repeat = require('../helpers').repeat;

  this['⍋'] = function(omega, alpha) {
    return grade(omega, alpha, 1);
  };

  this['⍒'] = function(omega, alpha) {
    return grade(omega, alpha, -1);
  };

  grade = function(omega, alpha, direction) {
    var h, _i, _ref1, _results;
    h = {};
    if (alpha) {
      if (!alpha.shape.length) {
        throw RankError();
      }
      h = {};
      alpha.each(function(x, indices) {
        if (typeof x !== 'string') {
          throw DomainError();
        }
        return h[x] = indices[indices.length - 1];
      });
    }
    if (!omega.shape.length) {
      throw RankError();
    }
    return new APLArray((function() {
      _results = [];
      for (var _i = 0, _ref1 = omega.shape[0]; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; 0 <= _ref1 ? _i++ : _i--){ _results.push(_i); }
      return _results;
    }).apply(this).sort(function(i, j) {
      var a, indices, p, tx, ty, x, y;
      p = omega.offset;
      indices = repeat([0], omega.shape.length);
      while (true) {
        x = omega.data[p + i * omega.stride[0]];
        y = omega.data[p + j * omega.stride[0]];
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
        a = indices.length - 1;
        while (a > 0 && indices[a] + 1 === omega.shape[a]) {
          p -= omega.stride[a] * indices[a];
          indices[a--] = 0;
        }
        if (a <= 0) {
          break;
        }
        p += omega.stride[a];
        indices[a]++;
      }
      return 0;
    }));
  };

}).call(this);
}, "vocabulary/innerproduct": function(exports, require, module) {(function() {
  var APLArray, each, enclose, outerProduct, reduce;

  APLArray = require('../array').APLArray;

  reduce = require('./slash')['/'];

  enclose = require('./enclose')['⊂'];

  outerProduct = require('./outerproduct')['∘.'];

  each = require('./each')['¨'];

  this['.'] = function(g, f) {
    var F, G;
    F = each(reduce(f));
    G = outerProduct(g);
    return function(omega, alpha) {
      if (alpha.shape.length === 0) {
        alpha = new APLArray([alpha.unwrap()]);
      }
      if (omega.shape.length === 0) {
        omega = new APLArray([omega.unwrap()]);
      }
      return F(G(enclose(omega, void 0, new APLArray([0])), enclose(alpha, void 0, new APLArray([alpha.shape.length - 1]))));
    };
  };

}).call(this);
}, "vocabulary/iota": function(exports, require, module) {(function() {
  var APLArray, DomainError, RankError, isInt, match, prod, repeat, _ref, _ref1;

  APLArray = require('../array').APLArray;

  _ref = require('../errors'), DomainError = _ref.DomainError, RankError = _ref.RankError;

  _ref1 = require('../helpers'), repeat = _ref1.repeat, prod = _ref1.prod, isInt = _ref1.isInt;

  match = require('./vhelpers').match;

  this['⍳'] = function(omega, alpha) {
    var a, axis, d, data, indices, _i, _j, _len, _ref2, _results;
    if (alpha) {
      if (alpha.shape.length !== 1) {
        throw RankError();
      }
      return omega.map(function(x) {
        var e, r;
        try {
          r = alpha.shape;
          alpha.each(function(y, indices) {
            if (match(x, y)) {
              r = indices;
              throw 'break';
            }
          });
        } catch (_error) {
          e = _error;
          if (e !== 'break') {
            throw e;
          }
        }
        if (r.length === 1) {
          return r[0];
        } else {
          return new APLArray(r);
        }
      });
    } else {
      if (omega.shape.length > 1) {
        throw RankError();
      }
      a = omega.toArray();
      for (_i = 0, _len = a.length; _i < _len; _i++) {
        d = a[_i];
        if (!isInt(d, 0)) {
          throw DomainError();
        }
      }
      data = [];
      if (prod(a)) {
        if (a.length === 1) {
          data = (function() {
            _results = [];
            for (var _j = 0, _ref2 = a[0]; 0 <= _ref2 ? _j < _ref2 : _j > _ref2; 0 <= _ref2 ? _j++ : _j--){ _results.push(_j); }
            return _results;
          }).apply(this);
        } else {
          indices = repeat([0], a.length);
          while (true) {
            data.push(new APLArray(indices.slice(0)));
            axis = a.length - 1;
            while (axis >= 0 && indices[axis] + 1 === a[axis]) {
              indices[axis--] = 0;
            }
            if (axis < 0) {
              break;
            }
            indices[axis]++;
          }
        }
      }
      return new APLArray(data, a);
    }
  };

}).call(this);
}, "vocabulary/logic": function(exports, require, module) {(function() {
  var APLArray, DomainError, RankError, assert, bool, isInt, match, negate, numeric, pervasive, _ref, _ref1, _ref2;

  APLArray = require('../array').APLArray;

  _ref = require('../errors'), RankError = _ref.RankError, DomainError = _ref.DomainError;

  _ref1 = require('./vhelpers'), numeric = _ref1.numeric, pervasive = _ref1.pervasive, bool = _ref1.bool, match = _ref1.match;

  _ref2 = require('../helpers'), assert = _ref2.assert, isInt = _ref2.isInt;

  negate = pervasive({
    monad: function(x) {
      return +(!bool(x));
    }
  });

  this['~'] = function(omega, alpha) {
    var data;
    if (alpha) {
      if (alpha.shape.length > 1) {
        throw RankError();
      }
      data = [];
      alpha.each(function(x) {
        var e;
        try {
          omega.each(function(y) {
            if (match(x, y)) {
              throw 'break';
            }
          });
          return data.push(x);
        } catch (_error) {
          e = _error;
          if (e !== 'break') {
            throw e;
          }
        }
      });
      return new APLArray(data);
    } else {
      return negate(omega);
    }
  };

  this['∨'] = pervasive({
    dyad: numeric(function(y, x) {
      var _ref3, _ref4;
      if (!(isInt(x, 0) && isInt(y, 0))) {
        throw DomainError('∨ is implemented only for non-negative integers');
      }
      if (x === 0 && y === 0) {
        return 0;
      }
      if (x < y) {
        _ref3 = [y, x], x = _ref3[0], y = _ref3[1];
      }
      while (y) {
        _ref4 = [y, x % y], x = _ref4[0], y = _ref4[1];
      }
      return x;
    })
  });

  this['∧'] = pervasive({
    dyad: numeric(function(y, x) {
      var p, _ref3, _ref4;
      assert(x === Math.floor(x) && y === Math.floor(y), '∧ is defined only for integers');
      if (x === 0 || y === 0) {
        return 0;
      }
      p = x * y;
      if (x < y) {
        _ref3 = [y, x], x = _ref3[0], y = _ref3[1];
      }
      while (y) {
        _ref4 = [y, x % y], x = _ref4[0], y = _ref4[1];
      }
      return p / x;
    })
  });

  this['⍱'] = pervasive({
    dyad: numeric(function(y, x) {
      return +(!(bool(x) | bool(y)));
    })
  });

  this['⍲'] = pervasive({
    dyad: numeric(function(y, x) {
      return +(!(bool(x) & bool(y)));
    })
  });

}).call(this);
}, "vocabulary/outerproduct": function(exports, require, module) {(function() {
  var APLArray, assert;

  APLArray = require('../array').APLArray;

  assert = require('../helpers').assert;

  this['∘.'] = function(f) {
    assert(typeof f === 'function');
    return function(omega, alpha) {
      var a, b, data, x, y, z, _i, _j, _len, _len1;
      if (!alpha) {
        throw Error('Adverb ∘. (Outer product) can be applied to dyadic verbs only');
      }
      a = alpha.toArray();
      b = omega.toArray();
      data = [];
      for (_i = 0, _len = a.length; _i < _len; _i++) {
        x = a[_i];
        for (_j = 0, _len1 = b.length; _j < _len1; _j++) {
          y = b[_j];
          if (!(x instanceof APLArray)) {
            x = APLArray.scalar(x);
          }
          if (!(y instanceof APLArray)) {
            y = APLArray.scalar(y);
          }
          z = f(y, x);
          if (z.shape.length === 0) {
            z = z.unwrap();
          }
          data.push(z);
        }
      }
      return new APLArray(data, alpha.shape.concat(omega.shape));
    };
  };

}).call(this);
}, "vocabulary/poweroperator": function(exports, require, module) {(function() {
  var assert, isInt, _ref;

  _ref = require('../helpers'), assert = _ref.assert, isInt = _ref.isInt;

  this['⍣'] = function(g, f) {
    var h, n;
    if (typeof f === 'number' && typeof g === 'function') {
      h = f;
      f = g;
      g = h;
    } else {
      assert(typeof f === 'function');
    }
    if (typeof g === 'function') {
      return function(omega, alpha) {
        var omega1;
        while (true) {
          omega1 = f(omega, alpha);
          if (g(omega, omega1).toBool()) {
            return omega;
          }
          omega = omega1;
        }
      };
    } else {
      n = g.toInt(0);
      return function(omega, alpha) {
        var _i;
        for (_i = 0; 0 <= n ? _i < n : _i > n; 0 <= n ? _i++ : _i--) {
          omega = f(omega, alpha);
        }
        return omega;
      };
    }
  };

}).call(this);
}, "vocabulary/quad": function(exports, require, module) {(function() {
  var format;

  format = require('./format').format;

  this['get_⎕'] = function() {
    if (typeof (typeof window !== "undefined" && window !== null ? window.prompt : void 0) === 'function') {
      return new APLArray(prompt('⎕:') || '');
    } else {
      throw Error('Reading from ⎕ is not implemented.');
    }
  };

  this['set_⎕'] = function(x) {
    var s;
    s = format(x).join('\n') + '\n';
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
      throw Error('Reading from ⍞ is not implemented.');
    }
  };

  this['set_⍞'] = function(x) {
    var s;
    s = format(x).join('\n');
    if (typeof (typeof window !== "undefined" && window !== null ? window.alert : void 0) === 'function') {
      window.alert(s);
    } else {
      process.stdout.write(s);
    }
    return x;
  };

}).call(this);
}, "vocabulary/question": function(exports, require, module) {(function() {
  var APLArray, DomainError, deal, numeric, pervasive, roll, _ref;

  APLArray = require('../array').APLArray;

  DomainError = require('../errors').DomainError;

  _ref = require('./vhelpers'), numeric = _ref.numeric, pervasive = _ref.pervasive;

  roll = pervasive({
    monad: numeric(function(x) {
      return Math.floor(Math.random() * x);
    })
  });

  deal = function(omega, alpha) {
    var available, x, y, _i, _results;
    y = omega.unwrap();
    x = alpha.unwrap();
    if (x > y) {
      throw DomainError();
    }
    available = (function() {
      _results = [];
      for (var _i = 0; 0 <= y ? _i < y : _i > y; 0 <= y ? _i++ : _i--){ _results.push(_i); }
      return _results;
    }).apply(this);
    return new APLArray((function() {
      var _j, _results1;
      _results1 = [];
      for (_j = 0; 0 <= x ? _j < x : _j > x; 0 <= x ? _j++ : _j--) {
        _results1.push(available.splice(Math.floor(available.length * Math.random()), 1)[0]);
      }
      return _results1;
    })());
  };

  this['?'] = function(omega, alpha) {
    if (alpha) {
      return deal(omega, alpha);
    } else {
      return roll(omega);
    }
  };

}).call(this);
}, "vocabulary/rho": function(exports, require, module) {(function() {
  var APLArray, DomainError, RankError, assert, isInt, prod, repeat, _ref, _ref1;

  APLArray = require('../array').APLArray;

  _ref = require('../errors'), RankError = _ref.RankError, DomainError = _ref.DomainError;

  _ref1 = require('../helpers'), assert = _ref1.assert, prod = _ref1.prod, isInt = _ref1.isInt, repeat = _ref1.repeat;

  this['⍴'] = function(omega, alpha) {
    var a, d, n, shape, _i, _len;
    if (alpha) {
      if (alpha.shape.length > 1) {
        throw RankError();
      }
      shape = alpha.toArray();
      for (_i = 0, _len = shape.length; _i < _len; _i++) {
        d = shape[_i];
        if (!isInt(d, 0)) {
          throw DomainError();
        }
      }
      n = prod(shape);
      a = omega.toArray(n);
      assert(a.length <= n);
      if (a.length) {
        while (2 * a.length < n) {
          a = a.concat(a);
        }
        if (a.length !== n) {
          a = a.concat(a.slice(0, n - a.length));
        }
      } else {
        a = repeat([omega.getPrototype()], n);
      }
      return new APLArray(a, shape);
    } else {
      return new APLArray(omega.shape);
    }
  };

}).call(this);
}, "vocabulary/rotate": function(exports, require, module) {(function() {
  var APLArray, DomainError, IndexError, LengthError, assert, isInt, prod, repeat, rotate, _ref, _ref1;

  APLArray = require('../array').APLArray;

  _ref = require('../errors'), DomainError = _ref.DomainError, LengthError = _ref.LengthError, IndexError = _ref.IndexError;

  _ref1 = require('../helpers'), assert = _ref1.assert, prod = _ref1.prod, repeat = _ref1.repeat, isInt = _ref1.isInt;

  this['⌽'] = rotate = function(omega, alpha, axis) {
    var a, data, indices, n, offset, p, shape, step, stride;
    assert(typeof axis === 'undefined' || axis instanceof APLArray);
    if (alpha) {
      axis = !axis ? omega.shape.length - 1 : axis.unwrap();
      if (!isInt(axis)) {
        throw DomainError();
      }
      if (omega.shape.length && !((0 <= axis && axis < omega.shape.length))) {
        throw IndexError();
      }
      step = alpha.unwrap();
      if (!isInt(step)) {
        throw DomainError();
      }
      if (!step) {
        return omega;
      }
      n = omega.shape[axis];
      step = (n + (step % n)) % n;
      if (omega.empty() || step === 0) {
        return omega;
      }
      data = [];
      shape = omega.shape, stride = omega.stride;
      p = omega.offset;
      indices = repeat([0], shape.length);
      while (true) {
        data.push(omega.data[p + ((indices[axis] + step) % shape[axis] - indices[axis]) * stride[axis]]);
        a = shape.length - 1;
        while (a >= 0 && indices[a] + 1 === shape[a]) {
          p -= indices[a] * stride[a];
          indices[a--] = 0;
        }
        if (a < 0) {
          break;
        }
        indices[a]++;
        p += stride[a];
      }
      return new APLArray(data, shape);
    } else {
      if (axis) {
        if (!axis.isSingleton()) {
          throw LengthError();
        }
        axis = axis.unwrap();
        if (!isInt(axis)) {
          throw DomainError();
        }
        if (!((0 <= axis && axis < omega.shape.length))) {
          throw IndexError();
        }
      } else {
        axis = [omega.shape.length - 1];
      }
      if (omega.shape.length === 0) {
        return omega;
      }
      stride = omega.stride.slice(0);
      stride[axis] = -stride[axis];
      offset = omega.offset + (omega.shape[axis] - 1) * omega.stride[axis];
      return new APLArray(omega.data, omega.shape, stride, offset);
    }
  };

  this['⊖'] = function(omega, alpha, axis) {
    if (axis == null) {
      axis = APLArray.zero;
    }
    return rotate(omega, alpha, axis);
  };

}).call(this);
}, "vocabulary/slash": function(exports, require, module) {(function() {
  var APLArray, DomainError, LengthError, RankError, assert, compressOrReplicate, isInt, reduce, repeat, _ref, _ref1;

  APLArray = require('../array').APLArray;

  _ref = require('../errors'), RankError = _ref.RankError, LengthError = _ref.LengthError, DomainError = _ref.DomainError;

  _ref1 = require('../helpers'), assert = _ref1.assert, repeat = _ref1.repeat, isInt = _ref1.isInt;

  this['/'] = function(omega, alpha, axis) {
    if (typeof omega === 'function') {
      return reduce(omega, alpha, axis);
    } else {
      return compressOrReplicate(omega, alpha, axis);
    }
  };

  this['⌿'] = function(omega, alpha, axis) {
    if (axis == null) {
      axis = APLArray.zero;
    }
    if (typeof omega === 'function') {
      return reduce(omega, alpha, axis);
    } else {
      return compressOrReplicate(omega, alpha, axis);
    }
  };

  reduce = this.reduce = function(f, g, axis0) {
    assert(typeof f === 'function');
    assert(typeof g === 'undefined');
    assert((typeof axis0 === 'undefined') || (axis0 instanceof APLArray));
    return function(omega, alpha) {
      var a, axis, data, i, indices, isBackwards, isMonadic, isNWise, n, p, rShape, shape, x, y, _i, _j, _ref2;
      if (omega.shape.length === 0) {
        omega = new APLArray([omega.unwrap()]);
      }
      axis = axis0 != null ? axis0.toInt() : omega.shape.length - 1;
      if (!((0 <= axis && axis < omega.shape.length))) {
        throw RankError();
      }
      if (alpha) {
        isNWise = true;
        n = alpha.toInt();
        if (n < 0) {
          isBackwards = true;
          n = -n;
        }
      } else {
        n = omega.shape[axis];
        isMonadic = true;
      }
      shape = omega.shape.slice(0);
      shape[axis] = omega.shape[axis] - n + 1;
      rShape = shape;
      if (isNWise) {
        if (shape[axis] === 0) {
          return new APLArray([], rShape);
        }
        if (shape[axis] < 0) {
          throw LengthError();
        }
      } else {
        rShape = rShape.slice(0);
        rShape.splice(axis, 1);
      }
      if (omega.empty()) {
        throw DomainError();
      }
      data = [];
      indices = repeat([0], shape.length);
      p = omega.offset;
      while (true) {
        if (isBackwards) {
          x = omega.data[p];
          x = x instanceof APLArray ? x : APLArray.scalar(x);
          for (i = _i = 1; _i < n; i = _i += 1) {
            y = omega.data[p + i * omega.stride[axis]];
            y = y instanceof APLArray ? y : APLArray.scalar(y);
            x = f(x, y);
          }
        } else {
          x = omega.data[p + (n - 1) * omega.stride[axis]];
          x = x instanceof APLArray ? x : APLArray.scalar(x);
          for (i = _j = _ref2 = n - 2; _j >= 0; i = _j += -1) {
            y = omega.data[p + i * omega.stride[axis]];
            y = y instanceof APLArray ? y : APLArray.scalar(y);
            x = f(x, y);
          }
        }
        if (x.shape.length === 0) {
          x = x.unwrap();
        }
        data.push(x);
        a = indices.length - 1;
        while (a >= 0 && indices[a] + 1 === shape[a]) {
          p -= indices[a] * omega.stride[a];
          indices[a--] = 0;
        }
        if (a < 0) {
          break;
        }
        p += omega.stride[a];
        indices[a]++;
      }
      return new APLArray(data, rShape);
    };
  };

  compressOrReplicate = function(omega, alpha, axis) {
    var a, b, data, filler, i, indices, n, p, shape, x, _i, _j, _len, _ref2;
    if (omega.shape.length === 0) {
      omega = new APLArray([omega.unwrap()]);
    }
    axis = axis ? axis.toInt(0, omega.shape.length) : omega.shape.length - 1;
    if (alpha.shape.length > 1) {
      throw RankError();
    }
    a = alpha.toArray();
    n = omega.shape[axis];
    if (a.length === 1) {
      a = repeat(a, n);
    }
    if (n !== 1 && n !== a.length) {
      throw LengthError();
    }
    shape = omega.shape.slice(0);
    shape[axis] = 0;
    b = [];
    for (i = _i = 0, _len = a.length; _i < _len; i = ++_i) {
      x = a[i];
      if (!isInt(x)) {
        throw DomainError();
      }
      shape[axis] += Math.abs(x);
      for (_j = 0, _ref2 = Math.abs(x); 0 <= _ref2 ? _j < _ref2 : _j > _ref2; 0 <= _ref2 ? _j++ : _j--) {
        b.push(x > 0 ? i : null);
      }
    }
    if (n === 1) {
      b = (function() {
        var _k, _len1, _results;
        _results = [];
        for (_k = 0, _len1 = b.length; _k < _len1; _k++) {
          x = b[_k];
          _results.push(x != null ? 0 : x);
        }
        return _results;
      })();
    }
    data = [];
    if (shape[axis] !== 0 && !omega.empty()) {
      filler = omega.getPrototype();
      p = omega.offset;
      indices = repeat([0], shape.length);
      while (true) {
        x = b[indices[axis]] != null ? omega.data[p + b[indices[axis]] * omega.stride[axis]] : filler;
        data.push(x);
        i = shape.length - 1;
        while (i >= 0 && indices[i] + 1 === shape[i]) {
          if (i !== axis) {
            p -= omega.stride[i] * indices[i];
          }
          indices[i--] = 0;
        }
        if (i < 0) {
          break;
        }
        if (i !== axis) {
          p += omega.stride[i];
        }
        indices[i]++;
      }
    }
    return new APLArray(data, shape);
  };

}).call(this);
}, "vocabulary/special": function(exports, require, module) {(function() {
  var APLArray, Complex, assert, match;

  APLArray = require('../array').APLArray;

  assert = require('../helpers').assert;

  Complex = require('../complex').Complex;

  match = require('./vhelpers').match;

  this._aplify = function(x) {
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
            _results.push(y.unwrap());
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

  this._complex = function(re, im) {
    return APLArray.scalar(new Complex(re, im));
  };

  this._bool = function(x) {
    assert(x instanceof APLArray);
    return x.toBool();
  };

  this['get_⎕IO'] = function() {
    return APLArray.zero;
  };

  this['set_⎕IO'] = function(x) {
    if (match(x, APLArray.zero)) {
      return x;
    } else {
      throw Error('The index origin (⎕IO) is fixed at 0');
    }
  };

}).call(this);
}, "vocabulary/squish": function(exports, require, module) {(function() {
  var APLArray, DomainError, IndexError, LengthError, RankError, assert, isInt, prod, repeat, squish, _ref, _ref1;

  APLArray = require('../array').APLArray;

  _ref = require('../errors'), DomainError = _ref.DomainError, IndexError = _ref.IndexError, RankError = _ref.RankError, LengthError = _ref.LengthError;

  _ref1 = require('../helpers'), assert = _ref1.assert, prod = _ref1.prod, repeat = _ref1.repeat, isInt = _ref1.isInt;

  this['⌷'] = squish = function(omega, alpha, axes) {
    var a, alphaItems, axis, d, data, i, p, subscriptShapes, subscripts, u, x, _i, _j, _k, _l, _len, _len1, _m, _n, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _results, _results1;
    if (typeof omega === 'function') {
      return function(x, y) {
        return omega(x, y, alpha);
      };
    }
    if (!alpha) {
      throw Error('Not implemented');
    }
    assert(alpha instanceof APLArray);
    assert(omega instanceof APLArray);
    assert((axes == null) || axes instanceof APLArray);
    if (alpha.shape.length > 1) {
      throw RankError();
    }
    alphaItems = alpha.toArray();
    if (alphaItems.length > omega.shape.length) {
      throw LengthError();
    }
    axes = axes ? axes.toArray() : (function() {
      _results = [];
      for (var _i = 0, _ref2 = alphaItems.length; 0 <= _ref2 ? _i < _ref2 : _i > _ref2; 0 <= _ref2 ? _i++ : _i--){ _results.push(_i); }
      return _results;
    }).apply(this);
    if (alphaItems.length !== axes.length) {
      throw LengthError();
    }
    subscripts = Array(omega.shape.length);
    subscriptShapes = Array(omega.shape.length);
    for (i = _j = 0, _len = axes.length; _j < _len; i = ++_j) {
      axis = axes[i];
      if (!isInt(axis)) {
        throw DomainError();
      }
      if (!((0 <= axis && axis < omega.shape.length))) {
        throw RankError();
      }
      if (typeof subscripts[axis] !== 'undefined') {
        throw RankError('Duplicate axis');
      }
      d = alphaItems[i];
      subscripts[axis] = d instanceof APLArray ? d.toArray() : [d];
      assert(subscripts[axis].length);
      subscriptShapes[axis] = d instanceof APLArray ? d.shape : [];
      _ref3 = subscripts[axis];
      for (_k = 0, _len1 = _ref3.length; _k < _len1; _k++) {
        x = _ref3[_k];
        if (!isInt(x)) {
          throw DomainError();
        }
        if (!((0 <= x && x < omega.shape[axis]))) {
          throw IndexError();
        }
      }
    }
    for (i = _l = 0, _ref4 = subscripts.length; 0 <= _ref4 ? _l < _ref4 : _l > _ref4; i = 0 <= _ref4 ? ++_l : --_l) {
      if (!(typeof subscripts[i] === 'undefined')) {
        continue;
      }
      subscripts[i] = (function() {
        _results1 = [];
        for (var _m = 0, _ref5 = omega.shape[i]; 0 <= _ref5 ? _m < _ref5 : _m > _ref5; 0 <= _ref5 ? _m++ : _m--){ _results1.push(_m); }
        return _results1;
      }).apply(this);
      subscriptShapes[i] = [omega.shape[i]];
    }
    data = [];
    u = repeat([0], subscripts.length);
    p = omega.offset;
    for (a = _n = 0, _ref6 = subscripts.length; 0 <= _ref6 ? _n < _ref6 : _n > _ref6; a = 0 <= _ref6 ? ++_n : --_n) {
      p += subscripts[a][0] * omega.stride[a];
    }
    while (true) {
      data.push(omega.data[p]);
      a = subscripts.length - 1;
      while (a >= 0 && u[a] + 1 === subscripts[a].length) {
        p += (subscripts[a][0] - subscripts[a][u[a]]) * omega.stride[a];
        u[a--] = 0;
      }
      if (a < 0) {
        break;
      }
      p += (subscripts[a][u[a] + 1] - subscripts[a][u[a]]) * omega.stride[a];
      u[a]++;
    }
    return new APLArray(data, (_ref7 = []).concat.apply(_ref7, subscriptShapes));
  };

  this._index = function(alpha, omega, axes) {
    return squish(omega, alpha, axes);
  };

}).call(this);
}, "vocabulary/tack": function(exports, require, module) {(function() {
  var APLArray;

  APLArray = require('../array').APLArray;

  this['⊣'] = function(omega, alpha) {
    if (alpha == null) {
      alpha = APLArray.zilde;
    }
    return alpha;
  };

  this['⊢'] = function(omega) {
    return omega;
  };

}).call(this);
}, "vocabulary/take": function(exports, require, module) {(function() {
  var APLArray, DomainError, RankError, prod, repeat, _ref, _ref1;

  APLArray = require('../array').APLArray;

  _ref = require('../errors'), DomainError = _ref.DomainError, RankError = _ref.RankError;

  _ref1 = require('../helpers'), prod = _ref1.prod, repeat = _ref1.repeat;

  this['↑'] = function(omega, alpha) {
    var a, axis, copyIndices, copyShape, data, i, mustCopy, offset, p, q, shape, stride, x, _i, _j, _k, _l, _len, _len1, _len2, _len3, _m, _ref2;
    if (alpha) {
      if (alpha.shape.length > 1) {
        throw RankError();
      }
      if (omega.shape.length === 0) {
        omega = new APLArray([omega.unwrap()]);
      }
      a = alpha.toArray();
      if (a.length > omega.shape.length) {
        throw RankError();
      }
      for (_i = 0, _len = a.length; _i < _len; _i++) {
        x = a[_i];
        if (typeof x !== 'number' || x !== Math.floor(x)) {
          throw DomainError();
        }
      }
      mustCopy = false;
      shape = [];
      for (i = _j = 0, _len1 = a.length; _j < _len1; i = ++_j) {
        x = a[i];
        shape.push(Math.abs(x));
        if (shape[i] > omega.shape[i]) {
          mustCopy = true;
        }
      }
      if (mustCopy) {
        stride = Array(shape.length);
        stride[stride.length - 1] = 1;
        for (i = _k = _ref2 = stride.length - 2; _k >= 0; i = _k += -1) {
          stride[i] = stride[i + 1] * shape[i + 1];
        }
        data = repeat([omega.getPrototype()], prod(shape));
        copyShape = [];
        p = omega.offset;
        q = 0;
        for (i = _l = 0, _len2 = a.length; _l < _len2; i = ++_l) {
          x = a[i];
          copyShape.push(Math.min(omega.shape[i], Math.abs(x)));
          if (x < 0) {
            if (x < -omega.shape[i]) {
              q -= (x + omega.shape[i]) * stride[i];
            } else {
              p += (x + omega.shape[i]) * omega.stride[i];
            }
          }
        }
        if (prod(copyShape)) {
          copyIndices = repeat([0], copyShape.length);
          while (true) {
            data[q] = omega.data[p];
            axis = copyShape.length - 1;
            while (axis >= 0 && copyIndices[axis] + 1 === copyShape[axis]) {
              p -= copyIndices[axis] * omega.stride[axis];
              q -= copyIndices[axis] * stride[axis];
              copyIndices[axis--] = 0;
            }
            if (axis < 0) {
              break;
            }
            p += omega.stride[axis];
            q += stride[axis];
            copyIndices[axis]++;
          }
        }
        return new APLArray(data, shape, stride);
      } else {
        stride = [];
        offset = omega.offset;
        for (i = _m = 0, _len3 = a.length; _m < _len3; i = ++_m) {
          x = a[i];
          if (x >= 0) {
            stride.push(omega.stride[i]);
          } else {
            stride.push(omega.stride[i]);
            offset += (omega.shape[i] + x) * omega.stride[i];
          }
        }
        return new APLArray(omega.data, shape, stride, offset);
      }
    } else {
      throw Error('Not implemented');
    }
  };

}).call(this);
}, "vocabulary/transpose": function(exports, require, module) {(function() {
  var APLArray, assert, prod, _ref;

  APLArray = require('../array').APLArray;

  _ref = require('../helpers'), assert = _ref.assert, prod = _ref.prod;

  this['⍉'] = function(omega, alpha) {
    if (alpha) {
      throw Error('Not implemented');
    } else {
      return new APLArray(omega.data, omega.shape.slice(0).reverse(), omega.stride.slice(0).reverse(), omega.offset);
    }
  };

}).call(this);
}, "vocabulary/vhelpers": function(exports, require, module) {(function() {
  var APLArray, Complex, DomainError, LengthError, RankError, SyntaxError, approx, assert, eps, isInt, match, multiplicitySymbol, numApprox, _ref, _ref1,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  _ref = require('../helpers'), assert = _ref.assert, isInt = _ref.isInt;

  _ref1 = require('../errors'), DomainError = _ref1.DomainError, LengthError = _ref1.LengthError, RankError = _ref1.RankError, SyntaxError = _ref1.SyntaxError;

  APLArray = require('../array').APLArray;

  Complex = require('../complex').Complex;

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

  this.pervasive = function(_arg) {
    var F, dyad, monad, pervadeDyadic, pervadeMonadic;
    monad = _arg.monad, dyad = _arg.dyad;
    pervadeMonadic = monad ? function(x) {
      var _name, _ref2;
      if (x instanceof APLArray) {
        return x.map(pervadeMonadic);
      } else {
        return (_ref2 = typeof x[_name = F.aplName] === "function" ? x[_name]() : void 0) != null ? _ref2 : monad(x);
      }
    } : function() {
      throw Error('Not implemented');
    };
    pervadeDyadic = dyad ? function(x, y) {
      var axis, tx, ty, xi, yi, _i, _name, _name1, _ref2, _ref3, _ref4;
      tx = multiplicitySymbol(x);
      ty = multiplicitySymbol(y);
      switch (tx + ty) {
        case '..':
          return (_ref2 = (_ref3 = y != null ? typeof y[_name = F.aplName] === "function" ? y[_name](x) : void 0 : void 0) != null ? _ref3 : x != null ? typeof x[_name1 = 'right_' + F.aplName] === "function" ? x[_name1](y) : void 0 : void 0) != null ? _ref2 : dyad(x, y);
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
          xi = x.unwrap();
          return y.map(function(yi) {
            return pervadeDyadic(xi, yi);
          });
        case '*1':
          yi = y.unwrap();
          return x.map(function(xi) {
            return pervadeDyadic(xi, yi);
          });
        case '11':
          yi = y.unwrap();
          return x.map(function(xi) {
            return pervadeDyadic(xi, yi);
          });
        case '**':
          if (x.shape.length !== y.shape.length) {
            throw RankError();
          }
          for (axis = _i = 0, _ref4 = x.shape.length; 0 <= _ref4 ? _i < _ref4 : _i > _ref4; axis = 0 <= _ref4 ? ++_i : --_i) {
            if (x.shape[axis] !== y.shape[axis]) {
              throw LengthError();
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

  this.numeric = function(f) {
    return function(x, y, axis) {
      if (typeof x !== 'number' || ((y != null) && typeof y !== 'number')) {
        throw DomainError();
      }
      return f(x, y, axis);
    };
  };

  this.match = match = function(x, y) {
    var axis, r, _i, _ref2;
    if (x instanceof APLArray) {
      if (!(y instanceof APLArray)) {
        return false;
      } else {
        if (x.shape.length !== y.shape.length) {
          return false;
        }
        for (axis = _i = 0, _ref2 = x.shape.length; 0 <= _ref2 ? _i < _ref2 : _i > _ref2; axis = 0 <= _ref2 ? ++_i : --_i) {
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
        if (x instanceof Complex && y instanceof Complex) {
          return x.re === y.re && x.im === y.im;
        } else {
          return x === y;
        }
      }
    }
  };

  eps = 1e-13;

  numApprox = function(x, y) {
    return x === y || Math.abs(x - y) < eps;
  };

  this.approx = approx = function(x, y) {
    var axis, r, _i, _ref2, _ref3, _ref4;
    if (x instanceof APLArray) {
      if (!(y instanceof APLArray)) {
        return false;
      } else {
        if (x.shape.length !== y.shape.length) {
          return false;
        }
        for (axis = _i = 0, _ref2 = x.shape.length; 0 <= _ref2 ? _i < _ref2 : _i > _ref2; axis = 0 <= _ref2 ? ++_i : --_i) {
          if (x.shape[axis] !== y.shape[axis]) {
            return false;
          }
        }
        r = true;
        x.each2(y, function(xi, yi) {
          if (!approx(xi, yi)) {
            return r = false;
          }
        });
        return r;
      }
    } else {
      if (y instanceof APLArray) {
        return false;
      } else if (!((x != null) && (y != null))) {
        return false;
      } else {
        if (typeof x === 'number') {
          x = new Complex(x);
        }
        if (typeof y === 'number') {
          y = new Complex(y);
        }
        if (x instanceof Complex) {
          return y instanceof Complex && numApprox(x.re, y.re) && numApprox(x.im, y.im);
        } else {
          return (_ref3 = (_ref4 = typeof x['≡'] === "function" ? x['≡'](y) : void 0) != null ? _ref4 : typeof y['≡'] === "function" ? y['≡'](x) : void 0) != null ? _ref3 : x === y;
        }
      }
    }
  };

  this.bool = function(x) {
    if (x !== 0 && x !== 1) {
      throw DomainError();
    }
    return x;
  };

  this.getAxisList = function(axes, rank) {
    var a, i, x, _i, _len;
    assert(isInt(rank, 0));
    if (typeof axes === 'undefined') {
      return [];
    }
    assert(axes instanceof APLArray);
    if (axes.shape.length !== 1 || axes.shape[0] !== 1) {
      throw SyntaxError();
    }
    a = axes.unwrap();
    if (a instanceof APLArray) {
      a = a.toArray();
      for (i = _i = 0, _len = a.length; _i < _len; i = ++_i) {
        x = a[i];
        if (!isInt(x, 0, rank)) {
          throw DomainError();
        }
        if (__indexOf.call(a.slice(0, i), x) >= 0) {
          throw Error('Non-unique axes');
        }
      }
      return a;
    } else if (isInt(a, 0, rank)) {
      return [a];
    } else {
      throw DomainError();
    }
  };

}).call(this);
}, "vocabulary/zilde": function(exports, require, module) {(function() {
  var APLArray;

  APLArray = require('../array').APLArray;

  this['get_⍬'] = function() {
    return APLArray.zilde;
  };

  this['set_⍬'] = function() {
    throw Error('Symbol zilde (⍬) is read-only.');
  };

}).call(this);
}});
