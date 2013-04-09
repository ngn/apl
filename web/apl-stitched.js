
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
}).call(this)({"apl": function(exports, require, module) {}, "array": function(exports, require, module) {}, "command": function(exports, require, module) {}, "compiler": function(exports, require, module) {}, "complex": function(exports, require, module) {}, "helpers": function(exports, require, module) {}, "lexer": function(exports, require, module) {(function() {
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
}, "parser": function(exports, require, module) {}, "vocabulary": function(exports, require, module) {(function() {
  var APLArray, Complex, assert, createLazyRequire, fromModule, lazyRequires, name, names, _base, _base1, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2, _ref3,
    __slice = [].slice,
    _this = this;

  assert = require('./helpers').assert;

  APLArray = require('./array').APLArray;

  Complex = require('./complex').Complex;

  lazyRequires = {
    'arithmetic': '+−×÷⋆⍟∣',
    'floorceil': '⌊⌈',
    'question': '?',
    'exclamation': '!',
    'circle': '○',
    'comparisons': '=≠<>≤≥≡≢',
    'logic': '∼∨∧⍱⍲',
    'rho': '⍴',
    'iota': '⍳',
    'rotate': '⌽⊖',
    'transpose': '⍉',
    'epsilon': '∈',
    'zilde': ['get_⍬', 'set_⍬'],
    'comma': ',⍪',
    'grade': '⍋⍒',
    'take': '↑',
    'squish': '⌷',
    'quad': ['get_⎕', 'set_⎕', 'get_⍞', 'set_⍞'],
    'format': '⍕',
    'forkhook': ['⎕fork', '⎕hook'],
    'each': '¨',
    'commute': '⍨',
    'cupcap': '∪∩',
    'find': '⍷',
    'enclose': '⊂',
    'disclose': '⊃',
    'execute': '⍎',
    'poweroperator': '⍣'
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

  _ref = '⍨¨';
  for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
    name = _ref[_j];
    ((_ref1 = (_base = this[name]).aplMetaInfo) != null ? _ref1 : _base.aplMetaInfo = {}).isPostfixAdverb = true;
  }

  _ref2 = '⍣';
  for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
    name = _ref2[_k];
    ((_ref3 = (_base1 = this[name]).aplMetaInfo) != null ? _ref3 : _base1.aplMetaInfo = {}).isConjunction = true;
  }

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
        var _l, _len3, _results;

        _results = [];
        for (_l = 0, _len3 = x.length; _l < _len3; _l++) {
          y = x[_l];
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
    assert(x instanceof APLArray);
    return x.toBool();
  };

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
}, "vocabulary/arithmetic": function(exports, require, module) {}, "vocabulary/cap": function(exports, require, module) {(function() {
  var APLArray, match;

  APLArray = require('../array').APLArray;

  match = require('./vhelpers').match;

  this['∩'] = function(omega, alpha) {
    var a, b, data, found, x, y, _i, _j, _len, _len1;

    if (alpha) {
      data = [];
      a = alpha.toArray();
      b = omega.toArray();
      for (_i = 0, _len = a.length; _i < _len; _i++) {
        x = a[_i];
        found = false;
        for (_j = 0, _len1 = b.length; _j < _len1; _j++) {
          y = b[_j];
          if (!(match(x, y))) {
            continue;
          }
          found = true;
          break;
        }
        if (found) {
          data.push(x);
        }
      }
      return new APLArray(data);
    } else {
      throw Error('Not implemented');
    }
  };

}).call(this);
}, "vocabulary/circle": function(exports, require, module) {}, "vocabulary/comma": function(exports, require, module) {}, "vocabulary/commute": function(exports, require, module) {}, "vocabulary/comparisons": function(exports, require, module) {}, "vocabulary/cup": function(exports, require, module) {(function() {
  var APLArray, match;

  APLArray = require('../array').APLArray;

  match = require('./vhelpers').match;

  this['∪'] = function(omega, alpha) {
    var a, data;

    if (alpha) {
      a = alpha.toArray();
      data = a.slice(0);
      omega.each(function(x) {
        var y, _i, _len;

        for (_i = 0, _len = a.length; _i < _len; _i++) {
          y = a[_i];
          if (match(x, y)) {
            return;
          }
        }
        return data.push(x);
      });
      return new APLArray(data);
    } else {
      data = [];
      omega.each(function(x) {
        var y, _i, _len;

        for (_i = 0, _len = data.length; _i < _len; _i++) {
          y = data[_i];
          if (match(x, y)) {
            return;
          }
        }
        return data.push(x);
      });
      return new APLArray(data);
    }
  };

}).call(this);
}, "vocabulary/cupcap": function(exports, require, module) {}, "vocabulary/disclose": function(exports, require, module) {}, "vocabulary/each": function(exports, require, module) {}, "vocabulary/enclose": function(exports, require, module) {}, "vocabulary/epsilon": function(exports, require, module) {}, "vocabulary/exclamation": function(exports, require, module) {}, "vocabulary/execute": function(exports, require, module) {}, "vocabulary/find": function(exports, require, module) {}, "vocabulary/floorceil": function(exports, require, module) {}, "vocabulary/forkhook": function(exports, require, module) {}, "vocabulary/format": function(exports, require, module) {}, "vocabulary/grade": function(exports, require, module) {}, "vocabulary/iota": function(exports, require, module) {}, "vocabulary/logic": function(exports, require, module) {}, "vocabulary/poweroperator": function(exports, require, module) {}, "vocabulary/quad": function(exports, require, module) {}, "vocabulary/question": function(exports, require, module) {}, "vocabulary/rho": function(exports, require, module) {}, "vocabulary/rotate": function(exports, require, module) {}, "vocabulary/slash": function(exports, require, module) {(function() {
  var APLArray, assert, compressOrReplicate, reduce;

  APLArray = require('../array').APLArray;

  assert = require('../helpers').assert;

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

  reduce = function(f, g, axis) {
    assert(typeof f === 'function');
    assert(typeof g === 'undefined');
    return function(omega, alpha) {
      var a, i, invokedAsMonadic, isBackwards, itemShape, items, j, k, n, r, x, _i, _j, _ref;

      invokedAsMonadic = !alpha;
      a = invokedAsMonadic ? 0 : alpha.toInt();
      isBackwards = a < 0;
      if (isBackwards) {
        a = -a;
      }
      if (omega.shape.length === 0) {
        omega = new APLArray([omega.unbox()]);
      }
      axis = axis != null ? axis.toInt() : omega.shape.length - 1;
      if (!((0 <= axis && axis < omega.shape.length))) {
        throw Error('RANK ERROR');
      }
      n = omega.shape[axis];
      if (a === 0) {
        a = n;
      }
      if (omega.shape.length === 1) {
        items = [omega.toArray()];
      } else {
        itemShape = omega.shape.slice(0);
        itemShape.splice(axis, 1);
        k = prod(sb.slice(axis + 1));
        items = (function() {
          var _i, _results;

          _results = [];
          for (_i = 0; 0 <= n ? _i < n : _i > n; 0 <= n ? _i++ : _i--) {
            _results.push([]);
          }
          return _results;
        })();
        for (i = _i = 0, _ref = b.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
          items[Math.floor(i / k) % n].push(b[i]);
        }
        for (i = _j = 0; 0 <= n ? _j < n : _j > n; i = 0 <= n ? ++_j : --_j) {
          items[i] = withShape(sItem, items[i]);
        }
      }
      r = (function() {
        var _k, _l, _m, _n, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _results, _results1;

        if (isBackwards) {
          _results = [];
          for (i = _k = 0, _ref1 = n - a + 1; 0 <= _ref1 ? _k < _ref1 : _k > _ref1; i = 0 <= _ref1 ? ++_k : --_k) {
            x = items[i + a - 1];
            for (j = _l = _ref2 = i + a - 2, _ref3 = i - 1; _l > _ref3; j = _l += -1) {
              x = f(items[j], x);
            }
            _results.push(x);
          }
          return _results;
        } else {
          _results1 = [];
          for (i = _m = 0, _ref4 = n - a + 1; 0 <= _ref4 ? _m < _ref4 : _m > _ref4; i = 0 <= _ref4 ? ++_m : --_m) {
            x = items[i];
            for (j = _n = _ref5 = i + 1, _ref6 = i + a; _n < _ref6; j = _n += 1) {
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

  compressOrReplicate = function(omega, alpha, axis) {
    var a, nNonNegative, shape, x, _i, _len, _results;

    assert(alpha);
    if (alpha.shape.length > 1) {
      throw Error('RANK ERROR');
    }
    if (omega.shape.length === 0) {
      omega = new APLArray([omega.unbox()]);
    }
    axis = axis ? axis.toInt(0, omega.shape.length) : omega.shape.length - 1;
    shape = omega.shape.slice(0);
    shape[axis] = 0;
    a = alpha.toArray();
    nNonNegative = 0;
    _results = [];
    for (_i = 0, _len = a.length; _i < _len; _i++) {
      x = a[_i];
      if (!isInt(x)) {
        throw Error('DOMAIN ERROR');
      }
      _results.push(shape[axis] += Math.abs(x));
    }
    return _results;
  };

}).call(this);
}, "vocabulary/squish": function(exports, require, module) {(function() {
  var APLArray, assert, isInt, prod, repeat, squish, _ref;

  APLArray = require('../array').APLArray;

  _ref = require('../helpers'), assert = _ref.assert, prod = _ref.prod, repeat = _ref.repeat, isInt = _ref.isInt;

  this['⌷'] = squish = function(omega, alpha, axes) {
    var a, alphaItems, axis, d, data, i, p, subscriptShapes, subscripts, u, x, _i, _j, _k, _l, _len, _len1, _m, _n, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _results, _results1;

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
      throw Error('RANK ERROR');
    }
    alphaItems = alpha.toArray();
    if (alphaItems.length > omega.shape.length) {
      throw Error('LENGTH ERROR');
    }
    axes = axes ? axes.toArray() : (function() {
      _results = [];
      for (var _i = 0, _ref1 = alphaItems.length; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; 0 <= _ref1 ? _i++ : _i--){ _results.push(_i); }
      return _results;
    }).apply(this);
    if (alphaItems.length !== axes.length) {
      throw Error('LENGTH ERROR');
    }
    subscripts = Array(omega.shape.length);
    subscriptShapes = Array(omega.shape.length);
    for (i = _j = 0, _len = axes.length; _j < _len; i = ++_j) {
      axis = axes[i];
      if (!isInt(axis)) {
        throw Error('DOMAIN ERROR');
      }
      if (!((0 <= axis && axis < omega.shape.length))) {
        throw Error('RANK ERROR');
      }
      if (typeof subscripts[axis] !== 'undefined') {
        throw Error('RANK ERROR: Duplicate axis');
      }
      d = alphaItems[i];
      subscripts[axis] = d instanceof APLArray ? d.toArray() : [d];
      assert(subscripts[axis].length);
      subscriptShapes[axis] = d instanceof APLArray ? d.shape : [];
      _ref2 = subscripts[axis];
      for (_k = 0, _len1 = _ref2.length; _k < _len1; _k++) {
        x = _ref2[_k];
        if (!isInt(x)) {
          throw Error('DOMAIN ERROR');
        }
        if (!((0 <= x && x < omega.shape[axis]))) {
          throw Error('INDEX ERROR');
        }
      }
    }
    for (i = _l = 0, _ref3 = subscripts.length; 0 <= _ref3 ? _l < _ref3 : _l > _ref3; i = 0 <= _ref3 ? ++_l : --_l) {
      if (!(typeof subscripts[i] === 'undefined')) {
        continue;
      }
      subscripts[i] = (function() {
        _results1 = [];
        for (var _m = 0, _ref4 = omega.shape[i]; 0 <= _ref4 ? _m < _ref4 : _m > _ref4; 0 <= _ref4 ? _m++ : _m--){ _results1.push(_m); }
        return _results1;
      }).apply(this);
      subscriptShapes[i] = [omega.shape[i]];
    }
    data = [];
    u = repeat([0], subscripts.length);
    p = omega.offset;
    for (a = _n = 0, _ref5 = subscripts.length; 0 <= _ref5 ? _n < _ref5 : _n > _ref5; a = 0 <= _ref5 ? ++_n : --_n) {
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
    return new APLArray(data, (_ref6 = []).concat.apply(_ref6, subscriptShapes));
  };

}).call(this);
}, "vocabulary/take": function(exports, require, module) {(function() {
  var APLArray, prod, repeat, _ref;

  APLArray = require('../array').APLArray;

  _ref = require('../helpers'), prod = _ref.prod, repeat = _ref.repeat;

  this['↑'] = function(omega, alpha) {
    var a, axis, copyIndices, copyShape, data, i, mustCopy, offset, p, q, shape, stride, x, _i, _j, _k, _l, _len, _len1, _len2, _len3, _m, _ref1;

    if (alpha) {
      if (alpha.shape.length > 1) {
        throw Error('RANK ERROR');
      }
      a = alpha.toArray();
      if (a.length > omega.shape.length) {
        throw Error('RANK ERROR');
      }
      for (_i = 0, _len = a.length; _i < _len; _i++) {
        x = a[_i];
        if (typeof x !== 'number' || x !== Math.floor(x)) {
          throw Error('DOMAIN ERROR');
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
        for (i = _k = _ref1 = stride.length - 2; _k >= 0; i = _k += -1) {
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
  var APLArray, assert, isInt, match, multiplicitySymbol, _ref,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  _ref = require('../helpers'), assert = _ref.assert, isInt = _ref.isInt;

  APLArray = require('../array').APLArray;

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
      var _name, _ref1;

      if (x instanceof APLArray) {
        return x.map(pervadeMonadic);
      } else {
        return (_ref1 = typeof x[_name = F.aplName] === "function" ? x[_name]() : void 0) != null ? _ref1 : monad(x);
      }
    } : function() {
      throw Error('Not implemented');
    };
    pervadeDyadic = dyad ? function(x, y) {
      var axis, tx, ty, xi, yi, _i, _name, _name1, _ref1, _ref2, _ref3;

      tx = multiplicitySymbol(x);
      ty = multiplicitySymbol(y);
      switch (tx + ty) {
        case '..':
          return (_ref1 = (_ref2 = y != null ? typeof y[_name = F.aplName] === "function" ? y[_name](x) : void 0 : void 0) != null ? _ref2 : x != null ? typeof x[_name1 = 'right_' + F.aplName] === "function" ? x[_name1](y) : void 0 : void 0) != null ? _ref1 : dyad(x, y);
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

  this.numeric = function(f) {
    return function(x, y, axis) {
      if (typeof x !== 'number' || ((y != null) && typeof y !== 'number')) {
        throw Error('DOMAIN ERROR');
      }
      return f(x, y, axis);
    };
  };

  this.match = match = function(x, y) {
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

  this.bool = function(x) {
    if (x !== 0 && x !== 1) {
      throw Error('DOMAIN ERROR');
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
      throw Error('SYNTAX ERROR');
    }
    a = axes.unbox();
    if (a instanceof APLArray) {
      a = a.toArray();
      for (i = _i = 0, _len = a.length; _i < _len; i = ++_i) {
        x = a[i];
        if (!isInt(x, 0, rank)) {
          throw Error('DOMAIN ERROR');
        }
        if (__indexOf.call(a.slice(0, i), x) >= 0) {
          throw Error('Non-unique axes');
        }
      }
      return a;
    } else if (isInt(a, 0, rank)) {
      return [a];
    } else {
      throw Error('DOMAIN ERROR');
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
