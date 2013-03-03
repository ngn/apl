(function() {
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

  Complex = (function() {

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

  exports.Complex = Complex;

}).call(this);
