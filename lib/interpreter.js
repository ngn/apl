(function() {
  var Complex, builtins, cps, cpsify, exec0, inherit, parse, trampoline, withPrototype, _ref;
  builtins = require('./builtins').builtins;
  _ref = require('./helpers'), inherit = _ref.inherit, trampoline = _ref.trampoline, cps = _ref.cps, cpsify = _ref.cpsify, withPrototype = _ref.withPrototype;
  parse = require('./parser').parse;
  Complex = require('./complex').Complex;
  exports.exec = function(code, ctx, callback) {
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
    try {
      trampoline(function() {
        return exec0(parse(code), ctx, callback);
      });
    } catch (err) {
      callback(err);
    }
  };
  exec0 = function(ast, ctx, callback) {
    var F, a, code, d, getter, i, name, r, s, value, x;
    switch (ast[0]) {
      case 'body':
        i = 1;
        r = [];
        return F = function() {
          if (i < ast.length) {
            if (ast[i][0] === 'guard') {
              return function() {
                return exec0(ast[i][1], ctx, function(err, rCondition) {
                  if (err) {
                    return function() {
                      return callback(err);
                    };
                  }
                  if (rCondition === 0) {
                    i++;
                    return F;
                  }
                  return function() {
                    return exec0(ast[i][2], ctx, function(err, rConsequence) {
                      if (err) {
                        return function() {
                          return callback(err);
                        };
                      }
                      r = rConsequence;
                      return function() {
                        return callback(null, rConsequence);
                      };
                    });
                  };
                });
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
          } else {
            return function() {
              return callback(null, r);
            };
          }
        };
      case 'num':
        s = ast[1].replace(/¯/g, '-');
        a = (function() {
          var _i, _len, _ref2, _results;
          _ref2 = s.split(/j/i);
          _results = [];
          for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
            x = _ref2[_i];
            _results.push(x.match(/^-?0x/i) ? parseInt(x, 16) : parseFloat(x));
          }
          return _results;
        })();
        value = a.length === 1 ? a[0] : (function(func, args, ctor) {
          ctor.prototype = func.prototype;
          var child = new ctor, result = func.apply(child, args);
          return typeof result === "object" ? result : child;
        })(Complex, a, function() {});
        return function() {
          return callback(null, value);
        };
      case 'str':
        s = ast[1];
        d = s[0];
        s = d + s.slice(1, -1).replace(RegExp("" + (d + d), "g"), '\\' + d) + d;
        value = eval(s).split('');
        return function() {
          return callback(null, withPrototype(' ', value));
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
                    return callback(null, cps(function(a, b, _, callback1) {
                      return function() {
                        return cpsify(indexable)(a, b, indices, callback1);
                      };
                    }));
                  };
                } else {
                  return function() {
                    return cpsify(ctx['⌷'])(indices, indexable, null, callback);
                  };
                }
              }
            };
          });
        };
      case 'assign':
        name = ast[1];
        return function() {
          return exec0(ast[2], ctx, function(err, value) {
            var setter;
            if (err) {
              return function() {
                return callback(err);
              };
            }
            setter = ctx['set_' + name];
            if (typeof setter === 'function') {
              return function() {
                return cpsify(setter)(value, null, null, function(err) {
                  if (err) {
                    return function() {
                      return callback(err);
                    };
                  }
                  return function() {
                    return callback(null, value);
                  };
                });
              };
            } else {
              ctx[name] = value;
              return function() {
                return callback(null, value);
              };
            }
          });
        };
      case 'sym':
        name = ast[1];
        value = ctx[name];
        if (value != null) {
          return function() {
            return callback(null, value);
          };
        }
        getter = ctx['get_' + name];
        if (typeof getter === 'function') {
          return function() {
            return cpsify(getter)(null, null, null, callback);
          };
        }
        return function() {
          return callback(Error("Symbol " + name + " is not defined."));
        };
      case 'embedded':
        try {
          code = ast[1].replace(/(^«|»$)/g, '');
          code = "(function(){return (" + code + ");})()";
          r = eval(code);
          if (!(r != null)) {
            r = 0;
          }
          if (typeof r === 'string') {
            r = r.split('');
          }
          return function() {
            return callback(null, r);
          };
        } catch (err) {
          return function() {
            return callback(err);
          };
        }
        break;
      case 'lambda':
        return function() {
          return callback(null, cps(function(a, b, _, callback1) {
            var ctx1;
            ctx1 = inherit(ctx);
            ctx1['∇'] = arguments.callee;
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
                    return cpsify(a[i + 1])(a[i], a[i + 2], null, function(err, result) {
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
                        return cpsify(a[i + 1])(a[i], null, null, function(err, result) {
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
                            return cpsify(a[i])(a[i + 1], null, null, function(err, result) {
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
                          var f, y;
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
                                  return cpsify(f)(y, null, null, function(err, result) {
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
                                  return cpsify(f)(x, y, null, function(err, result) {
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
