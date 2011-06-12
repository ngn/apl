(function() {
  var builtins, exec0, inherit, parse, trampoline, _ref;
  builtins = require('./builtins').builtins;
  _ref = require('./helpers'), inherit = _ref.inherit, trampoline = _ref.trampoline;
  parse = require('./parser').parse;
  exports.exec = function(code, ctx, callback) {
    var ast;
    if (typeof ctx === 'function' && !(callback != null)) {
      callback = ctx;
      ctx = void 0;
    }
        if (ctx != null) {
      ctx;
    } else {
      ctx = inherit(builtins);
    };
        if (callback != null) {
      callback;
    } else {
      callback = function(err) {
        if (err) {
          throw err;
        }
      };
    };
    ast = parse(code);
    try {
      trampoline(function() {
        return exec0(ast, ctx, callback);
      });
    } catch (err) {
      callback(err);
    }
  };
  exec0 = function(ast, ctx, callback) {
    var F, a, i, name, r, value;
    switch (ast[0]) {
      case 'body':
        i = 1;
        r = 0;
        return F = function() {
          if (i >= ast.length) {
            return function() {
              return callback(null, r);
            };
          } else {
            return function() {
              return exec0(ast[i], ctx, function(err, r0) {
                if (err) {
                  return function() {
                    return callback(err);
                  };
                }
                r = r0;
                i++;
                return F;
              });
            };
          }
        };
      case 'num':
        return function() {
          return callback(null, parseFloat(ast[1].replace(/¯/, '-')));
        };
      case 'str':
        return function() {
          return callback(null, eval(ast[1]).split(''));
        };
      case 'index':
        return exec0(ast[1], ctx, function(err, indexable) {
          var indices;
          if (err) {
            return function() {
              return callback(err);
            };
          }
          i = 2;
          indices = [];
          return F = function() {
            if (i < ast.length) {
              return function() {
                return exec0(ast[i], ctx, function(err, index) {
                  if (err) {
                    return function() {
                      return callback(err);
                    };
                  }
                  indices.push(index);
                  i++;
                  return F;
                });
              };
            } else {
              if (typeof indexable === 'function') {
                return function() {
                  return callback(null, function(a, b) {
                    return indexable(a, b, indices);
                  });
                };
              } else {
                return function() {
                  return callback(null, ctx['⌷'](indices, indexable));
                };
              }
            }
          };
        });
      case 'assign':
        name = ast[1];
        return function() {
          return exec0(ast[2], ctx, function(err, value) {
            if (err) {
              return function() {
                return callback(err);
              };
            }
            if (typeof ctx[name] === 'function' && ctx[name].isNiladic) {
              ctx[name](value);
            } else {
              ctx[name] = value;
            }
            return function() {
              return callback(null, value);
            };
          });
        };
      case 'sym':
        name = ast[1];
        value = ctx[name];
        if (!(value != null)) {
          return function() {
            return callback(Error("Symbol " + name + " is not defined."));
          };
        }
        if (typeof value === 'function' && value.isNiladic) {
          value = value();
        }
        return function() {
          return callback(null, value);
        };
      case 'lambda':
        return function() {
          return callback(Error('Lambda form not supported.'));
        };
      case 'seq':
        if (ast.length === 1) {
          return function() {
            return callback(null, 0);
          };
        }
        a = [];
        i = ast.length - 1;
        return F = function() {
          var f, j, x, y, _ref2, _ref3, _ref4, _ref5;
          if (i >= 1) {
            return function() {
              return exec0(ast[i], ctx, function(err, result) {
                if (err) {
                  return function() {
                    return callback(err);
                  };
                }
                a.unshift(result);
                i--;
                return F;
              });
            };
          } else {
            i = 0;
            while (i < a.length) {
              if (typeof a[i] !== 'function') {
                j = i + 1;
                while (j < a.length && typeof a[j] !== 'function') {
                  j++;
                }
                if (j - i > 1) {
                  [].splice.apply(a, [i, j - i].concat(_ref2 = [a.slice(i, j)])), _ref2;
                }
              }
              i++;
            }
            i = 0;
            while (i < a.length - 2) {
              if (typeof a[i] === 'function') {
                if (typeof a[i + 1] === 'function' && a[i + 1].isInfixOperator) {
                  if (typeof a[i + 2] === 'function') {
                    [].splice.apply(a, [i, i + 2 - i + 1].concat(_ref3 = a[i + 1](a[i], a[i + 2]))), _ref3;
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
                  [].splice.apply(a, [i, i + 1 - i + 1].concat(_ref4 = a[i + 1](a[i]))), _ref4;
                  continue;
                }
              }
              i++;
            }
            i = a.length - 2;
            while (i >= 0) {
              if (typeof a[i] === 'function' && a[i].isPrefixOperator) {
                if (typeof a[i + 1] === 'function') {
                  [].splice.apply(a, [i, i + 1 - i + 1].concat(_ref5 = a[i](a[i + 1]))), _ref5;
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
            return function() {
              return callback(null, a[0]);
            };
          }
        };
      default:
        return function() {
          return callback(Error('Unrecognized AST node type: ' + ast[0]));
        };
    }
  };
}).call(this);
