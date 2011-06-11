(function() {
  var builtins, exec, inherit;
  builtins = require('./builtins').builtins;
  inherit = require('./helpers').inherit;
  exec = exports.exec = function(ast, ctx) {
    var a, f, i, j, name, r, subscriptAST, value, x, y, _i, _len, _ref, _ref2, _ref3, _ref4, _ref5, _ref6;
        if (ctx != null) {
      ctx;
    } else {
      ctx = inherit(builtins);
    };
    switch (ast[0]) {
      case 'body':
        r = 0;
        _ref = ast.slice(1);
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          x = _ref[_i];
          r = exec(x, ctx);
        }
        return r;
      case 'num':
        return parseFloat(ast[1].replace(/¯/, '-'));
      case 'str':
        return eval(ast[1]).split('');
      case 'index':
        x = exec(ast[1], ctx);
        y = (function() {
          var _j, _len2, _ref2, _results;
          _ref2 = ast.slice(2);
          _results = [];
          for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
            subscriptAST = _ref2[_j];
            _results.push(exec(subscriptAST, ctx));
          }
          return _results;
        })();
        if (typeof x === 'function') {
          return function(a, b) {
            return x(a, b, y);
          };
        } else {
          return builtins['⌷'](y, x);
        }
        break;
      case 'assign':
        name = ast[1];
        value = exec(ast[2], ctx);
        if (typeof ctx[name] === 'function') {
          ctx[name](value);
        } else {
          ctx[name] = value;
        }
        return ctx[name];
      case 'sym':
        name = ast[1];
        value = ctx[name];
        if (!(value != null)) {
          throw Error("Symbol " + name + " is not defined.");
        }
        if (typeof value === 'function' && value.isNiladic) {
          value = value();
        }
        return value;
      case 'lambda':
        return function(a, b) {
          var ctx1;
          ctx1 = inherit(ctx);
          if (b != null) {
            ctx1['⍺'] = a;
            ctx1['⍵'] = b;
          } else {
            ctx1['⍺'] = 0;
            ctx1['⍵'] = a;
          }
          return exec(ast[1], ctx1);
        };
      case 'seq':
        if (ast.length === 1) {
          return 0;
        }
        a = [];
        for (i = _ref2 = ast.length - 1; _ref2 <= 1 ? i <= 1 : i >= 1; _ref2 <= 1 ? i++ : i--) {
          a.unshift(exec(ast[i], ctx));
        }
        i = 0;
        while (i < a.length) {
          if (typeof a[i] !== 'function') {
            j = i + 1;
            while (j < a.length && typeof a[j] !== 'function') {
              j++;
            }
            if (j - i > 1) {
              [].splice.apply(a, [i, j - i].concat(_ref3 = [a.slice(i, j)])), _ref3;
            }
          }
          i++;
        }
        i = 0;
        while (i < a.length - 2) {
          if (typeof a[i] === 'function') {
            if (typeof a[i + 1] === 'function' && a[i + 1].isInfixOperator) {
              if (typeof a[i + 2] === 'function') {
                [].splice.apply(a, [i, i + 2 - i + 1].concat(_ref4 = a[i + 1](a[i], a[i + 2]))), _ref4;
                continue;
              }
            }
          }
          i++;
        }
        i = 0;
        while (i < a.length - 1) {
          if (typeof a[i] === 'function') {
            if (typeof a[i + 1] === 'function' && a[i + 1].isPostfixOperator) {
              [].splice.apply(a, [i, i + 1 - i + 1].concat(_ref5 = a[i + 1](a[i]))), _ref5;
              continue;
            }
          }
          i++;
        }
        i = a.length - 2;
        while (i >= 0) {
          if (typeof a[i] === 'function' && a[i].isPrefixOperator) {
            if (typeof a[i + 1] === 'function') {
              [].splice.apply(a, [i, i + 1 - i + 1].concat(_ref6 = a[i](a[i + 1]))), _ref6;
            }
          }
          i--;
        }
        while (a.length > 1) {
          if (typeof a[a.length - 1] === 'function') {
            throw Error('Trailing function in expression');
          }
          y = a.pop();
          f = a.pop();
          if (a.length === 0 || typeof a[a.length - 1] === 'function') {
            a.push(f(y));
          } else {
            x = a.pop();
            a.push(f(x, y));
          }
        }
        return a[0];
      default:
        throw Error('Unrecognized AST node type: ' + ast[0]);
    }
  };
}).call(this);
