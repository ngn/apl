(function() {

  this.Complex = (function() {

    function Complex(re, im) {
      this.re = re != null ? re : 0;
      this.im = im != null ? im : 0;
      if (!this.im) return this.re;
    }

    Complex.prototype.toString = function() {
      return ("" + this.re + "J" + this.im).replace(/-/g, '¯');
    };

    Complex.prototype['='] = function(x) {
      return +((x instanceof Complex) && x.re === this.re && x.im === this.im);
    };

    Complex.prototype['+'] = function(x) {
      if (x != null) {
        if (typeof x === 'number') {
          return new Complex(this.re + x, this.im);
        } else if (x instanceof Complex) {
          return new Complex(this.re + x.re, this.im + x.im);
        } else {
          throw Error('Unsupported operation');
        }
      } else {
        return new Complex(this.re, -this.im);
      }
    };

    Complex.prototype['−'] = function(x) {
      if (x != null) {
        if (typeof x === 'number') {
          return new Complex(this.re - x, this.im);
        } else if (x instanceof Complex) {
          return new Complex(this.re - x.re, this.im - x.im);
        } else {
          throw Error('Unsupported operation');
        }
      } else {
        return new Complex(-this.re, -this.im);
      }
    };

    Complex.prototype['×'] = function(x) {
      if (x != null) {
        if (typeof x === 'number') {
          return new Complex(x * this.re, x * this.im);
        } else if (x instanceof Complex) {
          return new Complex(this.re * x.re - this.im * x.im, this.re * x.im + this.im * x.re);
        } else {
          throw Error('Unsupported operation');
        }
      } else {
        throw Error('Unsupported operation');
      }
    };

    Complex.prototype['÷'] = function(x) {
      var d;
      if (x != null) {
        if (typeof x === 'number') {
          return new Complex(this.re / x, this.im / x);
        } else if (x instanceof Complex) {
          d = x.re * x.re + x.im * x.im;
          return new Complex((this.re * x.re + this.im * x.im) / d, (this.im * x.re - this.re * x.im) / d);
        } else {
          throw Error('Unsupported operation');
        }
      } else {
        d = this.re * this.re + this.im * this.im;
        return new Complex(this.re / d, -this.im / d);
      }
    };

    return Complex;

  })();

}).call(this);
