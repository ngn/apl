(function() {
  var builtins, cps, cpsCall, exec0, inherit, parse, trampoline, _ref;
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
  cps = function(f) {
    f.cps = true;
    return f;
  };
  cpsCall = function(f, a0, a1, a2, callback) {
    if (f.cps) {
      return function() {
        return f(a0, a1, a2, callback);
      };
    } else {
      return function() {
        var r;
        try {
          r = f(a0, a1, a2);
        } catch (err) {
          return callback(err);
        }
        return callback(null, r);
      };
    }
  };
  exec0 = function(ast, ctx, callback) {
    var F, a, i, name, r, value;
    switch (ast[0]) {
      case 'body':
        i = 1;
        r = 0;
        return F = function() {
          if (i < ast.length) {
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
          } else {
            return function() {
              return callback(null, r);
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
        return function() {
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
                    return cpsCall(ctx['⌷'], indices, indexable, null, callback);
                  };
                }
              }
            };
          });
        };
      case 'assign':
        return function() {
          return exec0(ast[2], ctx, function(err, value) {
            var name;
            if (err) {
              return function() {
                return callback(err);
              };
            }
            name = ast[1];
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
          return callback(null, cps(function(a, b, _, callback1) {
            var ctx1;
            ctx1 = inherit(ctx);
            if (b != null) {
              ctx1['⍺'] = a;
              ctx1['⍵'] = b;
            } else {
              ctx1['⍺'] = 0;
              ctx1['⍵'] = a;
            }
            return function() {
              return exec0(ast[1], ctx1, function(err, res) {
                return function() {
                  return callback1(err, res);
                };
              });
            };
          }));
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
          var j, _ref2;
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
            return F = function() {
              if (i < a.length - 2) {
                if ((typeof a[i] === 'function') && (typeof a[i + 1] === 'function') && a[i + 1].isInfixOperator && (typeof a[i + 2] === 'function')) {
                  return function() {
                    return cpsCall(a[i + 1], a[i], a[i + 2], null, function(err, result) {
                      var _ref3;
                      if (err) {
                        return function() {
                          return callback(err);
                        };
                      }
                      [].splice.apply(a, [i, i + 2 - i + 1].concat(_ref3 = [result])), _ref3;
                      return F;
                    });
                  };
                } else {
                  i++;
                  return F;
                }
              } else {
                i = 0;
                return F = function() {
                  if (i < a.length - 1) {
                    if ((typeof a[i] === 'function') && (typeof a[i + 1] === 'function') && a[i + 1].isPostfixOperator) {
                      return function() {
                        return cpsCall(a[i + 1], a[i], null, null, function(err, result) {
                          var _ref3;
                          if (err) {
                            return function() {
                              return callback(err);
                            };
                          }
                          [].splice.apply(a, [i, i + 1 - i + 1].concat(_ref3 = [result])), _ref3;
                          return F;
                        });
                      };
                    } else {
                      i++;
                      return F;
                    }
                  } else {
                    i = a.length - 2;
                    return F = function() {
                      if (i >= 0) {
                        if ((typeof a[i] === 'function') && a[i].isPrefixOperator && (typeof a[i + 1] === 'function')) {
                          return function() {
                            return cpsCall(a[i], a[i + 1], null, null, function(err, result) {
                              var _ref3;
                              if (err) {
                                return function() {
                                  return callback(err);
                                };
                              }
                              [].splice.apply(a, [i, i + 1 - i + 1].concat(_ref3 = [result])), _ref3;
                              return F;
                            });
                          };
                        } else {
                          i--;
                          return F;
                        }
                      } else {
                        return F = function() {
                          var f, x, y;
                          if (a.length > 1) {
                            if (typeof a[a.length - 1] === 'function') {
                              return function() {
                                return callback(Error('Trailing function in expression'));
                              };
                            } else {
                              y = a.pop();
                              f = a.pop();
                              if (a.length === 0 || typeof a[a.length - 1] === 'function') {
                                return function() {
                                  return cpsCall(f, y, null, null, function(err, result) {
                                    if (err) {
                                      return function() {
                                        return callback(err);
                                      };
                                    }
                                    a.push(result);
                                    return F;
                                  });
                                };
                              } else {
                                x = a.pop();
                                return function() {
                                  return cpsCall(f, x, y, null, function(err, result) {
                                    if (err) {
                                      return function() {
                                        return callback(err);
                                      };
                                    }
                                    a.push(result);
                                    return F;
                                  });
                                };
                              }
                            }
                          } else {
                            return function() {
                              return callback(null, a[0]);
                            };
                          }
                        };
                      }
                    };
                  }
                };
              }
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
