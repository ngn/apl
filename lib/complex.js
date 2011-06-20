(function() {
  var Complex;
  Complex = (function() {
    function Complex(re, im) {
      this.re = re != null ? re : 0;
      this.im = im != null ? im : 0;
      if (!this.im) {
        return this.re;
      }
    }
    Complex.prototype.toString = function() {
      return ("" + this.re + "J" + this.im).replace(/-/g, '¯');
    };
    Complex.prototype['+'] = function(x) {
      if (typeof x === 'number') {
        return new Complex(this.re + x, this.im);
      } else if (x instanceof Complex) {
        return new Complex(this.re + x.re, this.im + x.im);
      } else {
        throw Error('Unsupported operation');
      }
    };
    Complex.prototype['×'] = function(x) {
      if (typeof x === 'number') {
        return new Complex(x * this.re, x * this.im);
      } else if (x instanceof Complex) {
        return new Complex(this.re * x.re - this.im * x.im, this.re * x.im + this.im * x.re);
      } else {
        throw Error('Unsupported operation');
      }
    };
    Complex.prototype['='] = function(x) {
      return +((x instanceof Complex) && x.re === this.re && x.im === this.im);
    };
    return Complex;
  })();
  exports.Complex = Complex;
}).call(this);
