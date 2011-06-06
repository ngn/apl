(function() {
  jQuery.fn.insertAtCaret = function(s) {
    return this.each(function() {
      var actual, diff, index, orig, p, pos, range, start, tmp, _ref;
      if (this.setSelectionRange) {
        p = this.selectionStart;
        this.value = this.value.slice(0, p) + s + this.value.slice(this.selectionEnd, this.value.length);
        this.focus();
        p += s.length;
        return this.setSelectionRange(p, p);
      } else if (document.selection) {
        this.focus();
        orig = this.value.replace(/\r\n/g, '\n');
        range = document.selection.createRange();
        if (range.parentElement() !== e) {
          return false;
        }
        range.text = s;
        actual = tmp = this.value.replace(/\r\n/g, '\n');
        for (diff = 0, _ref = orig.length; 0 <= _ref ? diff < _ref : diff > _ref; 0 <= _ref ? diff++ : diff--) {
          if (orig.charAt(diff) !== actual.charAt(diff)) {
            break;
          }
        }
        index = start = 0;
        while (tmp.match(s) && (tmp = tmp.replace(s, "")) && index <= diff) {
          start = actual.indexOf(s, index);
          index = start + s.length;
        }
        pos = start + s.length;
        range = this.createTextRange();
        range.move('character', pos);
        return range.select();
      } else {
        return this.value += s;
      }
    });
  };
  jQuery(function($) {
    var code, esc, escT, examples, formatAsHTML, formatHTMLTable, h, i, name, symbolDefs, x, _i, _len, _len2, _ref;
    escT = {
      '<': 'lt',
      '>': 'gt',
      '&': 'amp',
      "'": 'apos',
      '"': 'quot'
    };
    esc = function(s) {
      return s.replace(/[<>&'"]/g, function(x) {
        return "&" + escT[x] + ";";
      });
    };
    formatAsHTML = function(x) {
      var i, nPlanes, nc, nr, planeSize, planes, rx, sx, y, _ref;
      try {
        if (typeof x === 'string') {
          return "<span class='character'>" + (esc(x).replace(/\ /g, '&nbsp;')) + "</span>";
        } else if (typeof x === 'number') {
          return "<span class='number'>" + (x < 0 ? '¯' + (-x) : '' + x) + "</span>";
        } else if (typeof x === 'function') {
          return "<span class='function'>function</span>";
        } else if (!(x.length != null)) {
          return "<span class='unknown'>" + (esc('' + x)) + "</span>";
        } else if (x.shape && x.shape.length > 2) {
          sx = x.shape;
          rx = sx.length;
          planeSize = sx[rx - 2] * sx[rx - 1];
          nPlanes = x.length / planeSize;
          planes = (function() {
            var _results;
            _results = [];
            for (i = 0; 0 <= nPlanes ? i < nPlanes : i > nPlanes; 0 <= nPlanes ? i++ : i--) {
              _results.push(formatHTMLTable(x.slice(i * planeSize, (i + 1) * planeSize), sx[rx - 1], sx[rx - 2], 'subarray'));
            }
            return _results;
          })();
          nc = sx[rx - 3];
          nr = nPlanes / nc;
          return formatHTMLTable(planes, nr, nc, 'array');
        } else {
          if (x.length === 0) {
            return "<table class='" + cssClass + "'><tr><td>&nbsp;</table>";
          }
          _ref = x.shape || [1, x.length], nr = _ref[0], nc = _ref[1];
          x = (function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = x.length; _i < _len; _i++) {
              y = x[_i];
              _results.push(formatAsHTML(y));
            }
            return _results;
          })();
          return formatHTMLTable(x, nr, nc, 'array');
        }
      } catch (e) {
        if (typeof console !== "undefined" && console !== null) {
          if (typeof console.error === "function") {
            console.error(e);
          }
        }
        return '<span class="error">Presentation error</span>';
      }
    };
    formatHTMLTable = function(a, nr, nc, cssClass) {
      var c, r, s;
      s = "<table class='" + cssClass + "'>";
      for (r = 0; 0 <= nr ? r < nr : r > nr; 0 <= nr ? r++ : r--) {
        s += '<tr>';
        for (c = 0; 0 <= nc ? c < nc : c > nc; 0 <= nc ? c++ : c--) {
          s += "<td>" + a[nc * r + c] + "</td>";
        }
        s += '</tr>';
      }
      return s += '</table>';
    };
    $('#program').focus();
    $('#go').closest('form').submit(function() {
      $('#result').html((function() {
        try {
          return formatAsHTML(exec(parser.parse($('#program').val())));
        } catch (e) {
          if (typeof console !== "undefined" && console !== null) {
            if (typeof console.error === "function") {
              console.error(e);
            }
          }
          return "<div class='error'>" + (esc(e.message)) + "</div>";
        }
      })());
      return false;
    });
    symbolDefs = [['+', 'Conjugate, Add'], ['−', 'Negate, Subtract'], ['×', 'Sign of, Multiply'], ['÷', 'Reciprocal, Divide'], ['⌈', 'Ceiling, Greater of'], ['⌊', 'Floor, Lesser of'], ['∣', 'Absolute value, Residue'], ['⍳', 'Index generator, Index of'], ['?', 'Roll, Deal'], ['⋆', 'Exponential, To the power of'], ['⍟', 'Natural logarithm, Logarithm to the base'], ['○', 'Pi times, Circular and hyperbolic functions'], ['!', 'Factorial, Binomial'], ['⌹', 'Matrix inverse, Matrix divide'], ['<', 'Less than'], ['≤', 'Less than or equal'], ['=', 'Equal'], ['≥', 'Greater than or equal'], ['>', 'Greater than'], ['≠', 'Not equal'], ['≡', 'Depth, Match'], ['≢', 'Not match'], ['∈', 'Enlist, Membership'], ['⍷', 'Find'], ['∪', 'Unique, Union'], ['∩', 'Intersection'], ['∼', 'Not, Without'], ['∨', 'Or'], ['∧', 'And'], ['⍱', 'Nor'], ['⍲', 'Nand'], ['⍴', 'Shape of, Reshape'], [',', 'Ravel, Catenate'], ['⍪', 'First axis catenate'], ['⌽', 'Reverse, Rotate'], ['⊖', 'First axis rotate'], ['⍉', 'Transpose'], ['↑', 'First, Take'], ['↓', 'Drop'], ['⊂', 'Enclose, Partition'], ['⊃', 'Disclose, Pick'], ['⌷', 'Index'], ['⍋', 'Grade up'], ['⍒', 'Grade down'], ['⊤', 'Encode'], ['⊥', 'Decode'], ['⍕', 'Format, Format by specification'], ['⍎', 'Execute'], ['⊣', 'Stop, Left'], ['⊢', 'Pass, Right'], ['⎕', 'Evaluated input, Output with a newline'], ['⍞', 'Character input, Bare output'], ['¨', 'Each'], ['¯', 'Negative number sign'], ['⍝', 'Comment'], ['←', 'Assignment'], ['⍬', 'Zilde'], ['◇', 'Statement separator'], ['⍺', 'Left formal parameter'], ['⍵', 'Right formal parameter']];
    h = '';
    for (_i = 0, _len = symbolDefs.length; _i < _len; _i++) {
      x = symbolDefs[_i];
      h += "<a href='#' title='" + (esc(x[1])) + "'>" + x[0] + "</a>";
    }
    $('#symbols').html(h);
    $('#symbols a').live('click', function() {
      return $('#program').insertAtCaret($(this).text());
    });
    examples = [['Rho-Iota', '⍝  ⍳ n  generates a list of numbers from 0 to n−1\n⍝  n n ⍴ A  arranges the elements of A in an n×n matrix\n\n5 5 ⍴ ⍳ 25'], ['Multiplication table', '⍝  ∘.       is the "outer product" operator\n⍝  A ∘.× B  multiplies every item in A to every item in B\n\n(⍳ 10) ∘.× ⍳ 10'], ['Life', '⍝ Conway\'s game of life\nr←(3 3 ⍴ ⍳ 9)∈1 3 6 7 8\nR←¯1⊖¯2⌽5 7↑r\nlife←{∨/1⍵∧3 4=⊂+/+⌿1 0 ¯1∘.⊖1 0 ¯1⌽¨⊂⍵}\nR (life R) (life life R)']];
    for (i = 0, _len2 = examples.length; i < _len2; i++) {
      _ref = examples[i], name = _ref[0], code = _ref[1];
      $('#examples').append(" <a href='#example" + i + "'>" + name + "</a>");
    }
    return $('#examples a').live('click', function() {
      var _ref2;
      _ref2 = examples[parseInt($(this).attr('href').replace(/#example(\d+)$/, '$1'))], name = _ref2[0], code = _ref2[1];
      return $('#program').val(code);
    });
  });
}).call(this);
