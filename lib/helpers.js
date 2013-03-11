(function() {
  var assert, isSimple, prod, prototypeOf, shapeOf, withPrototype, withShape;

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

  this.repeat = function(s, n) {
    var r, _i;
    r = '';
    for (_i = 0; 0 <= n ? _i < n : _i > n; 0 <= n ? _i++ : _i--) {
      r += s;
    }
    return r;
  };

  this.die = function(s) {
    throw Error(s);
  };

  this.assert = assert = function(flag, s) {
    if (s == null) {
      s = 'Assertion failed';
    }
    if (!flag) {
      throw Error(s);
    }
  };

}).call(this);
