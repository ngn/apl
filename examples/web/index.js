(function() {
  jQuery(function($) {
    var code, esc, escT, examples, formatAsHTML, formatHTMLTable, i, mapping, name, symbol, symbolsHTML, _len, _ref;
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
            return "<table class='array empty'><tr><td>empty</table>";
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
    $('#code').focus();
    $('#go').closest('form').submit(function() {
      $('#result').html((function() {
        try {
          return formatAsHTML(exec(parser.parse($('#code').val())));
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
    mapping = {};
    symbolsHTML = '';
    symbol = function(ch, key, description) {
      if (key) {
        mapping[key] = ch;
        description += " (key: " + key + ")";
      }
      return symbolsHTML += "<a href='#symbol-" + (esc(ch)) + "' title='" + (esc(description)) + "'>" + (esc(ch)) + "</a>";
    };
    symbol('+', '', 'Conjugate, Add');
    symbol('−', '`-', 'Negate, Subtract');
    symbol('×', '`=', 'Sign of, Multiply');
    symbol('÷', '`:', 'Reciprocal, Divide');
    symbol('⌈', '`s', 'Ceiling, Greater of');
    symbol('⌊', '`d', 'Floor, Lesser of');
    symbol('∣', '`m', 'Absolute value, Residue');
    symbol('⍳', '`i', 'Index generator, Index of');
    symbol('?', '', 'Roll, Deal');
    symbol('⋆', '`p', 'Exponential, To the power of');
    symbol('⍟', '', 'Natural logarithm, Logarithm to the base');
    symbol('○', '`o', 'Pi times, Circular and hyperbolic functions');
    symbol('!', '', 'Factorial, Binomial');
    symbol('⌹', '', 'Matrix inverse, Matrix divide');
    symbol('<', '`3', 'Less than');
    symbol('≤', '`4', 'Less than or equal');
    symbol('=', '`5', 'Equal');
    symbol('≥', '`6', 'Greater than or equal');
    symbol('>', '`7', 'Greater than');
    symbol('≠', '`/', 'Not equal');
    symbol('≡', '', 'Depth, Match');
    symbol('≢', '', 'Not match');
    symbol('∈', '`e', 'Enlist, Membership');
    symbol('⍷', '`f`', 'Find');
    symbol('∪', '`v', 'Unique, Union');
    symbol('∩', '`c', 'Intersection');
    symbol('∼', '`t', 'Not, Without');
    symbol('∨', '`9', 'Or');
    symbol('∧', '`0', 'And');
    symbol('⍱', '', 'Nor');
    symbol('⍲', '', 'Nand');
    symbol('⍴', '`r', 'Shape of, Reshape');
    symbol(',', '', 'Ravel, Catenate');
    symbol('⍪', '`,', 'First axis catenate');
    symbol('⌽', '', 'Reverse, Rotate');
    symbol('⊖', '', 'First axis rotate');
    symbol('⍉', '', 'Transpose');
    symbol('↑', '`y', 'First, Take');
    symbol('↓', '`u', 'Drop');
    symbol('⊂', '`z', 'Enclose, Partition');
    symbol('⊃', '`x', 'Disclose, Pick');
    symbol('⌷', '`l', 'Index');
    symbol('⍋', '`g', 'Grade up');
    symbol('⍒', '`h', 'Grade down');
    symbol('⊤', '`b', 'Encode');
    symbol('⊥', '`n', 'Decode');
    symbol('⍕', '', 'Format, Format by specification');
    symbol('⍎', '', 'Execute');
    symbol('⊣', '', 'Stop, Left');
    symbol('⊢', '', 'Pass, Right');
    symbol('⎕', '', 'Evaluated input, Output with a newline');
    symbol('⍞', '', 'Character input, Bare output');
    symbol('¨', '`1', 'Each');
    symbol('∘.', '`j', 'Outer product');
    symbol('/', '', 'Reduce');
    symbol('⌿', '`/', '1st axis reduce');
    symbol('\\', '', 'Scan');
    symbol('⍀.', '', '1st axis scan');
    symbol('¯', '`2', 'Negative number sign');
    symbol('⍝', '`]', 'Comment');
    symbol('←', '`[', 'Assignment');
    symbol('⍬', '', 'Zilde');
    symbol('◇', '`;', 'Statement separator');
    symbol('⍺', '`a', 'Left formal parameter');
    symbol('⍵', '`w', 'Right formal parameter');
    $('#symbols').html(symbolsHTML);
    $('#symbols a').live('click', function() {
      return $('#code').replaceSelection($(this).text());
    });
    $('#code').keydown(function(event) {
      if (event.keyCode === 13 && event.ctrlKey) {
        $('#go').click();
        return false;
      }
    });
    $('#code').retype('on', {
      mapping: mapping
    });
    examples = [['Rho-Iota', '⍝  ⍳ n  generates a list of numbers from 0 to n−1\n⍝  n n ⍴ A  arranges the elements of A in an n×n matrix\n\n5 5 ⍴ ⍳ 25'], ['Multiplication table', '⍝  ∘.       is the "outer product" operator\n⍝  a × b    scalar multiplication, "a times b"\n⍝  A ∘.× B  every item in A times every item in B\n\n(⍳ 10) ∘.× ⍳ 10'], ['Life', '⍝ Conway\'s game of life\nr←(3 3 ⍴ ⍳ 9)∈1 3 6 7 8\nR←¯1⊖¯2⌽5 7↑r\nlife←{∨/1⍵∧3 4=⊂+/+⌿1 0 ¯1∘.⊖1 0 ¯1⌽¨⊂⍵}\nR (life R) (life life R)']];
    for (i = 0, _len = examples.length; i < _len; i++) {
      _ref = examples[i], name = _ref[0], code = _ref[1];
      $('#examples').append(" <a href='#example" + i + "'>" + name + "</a>");
    }
    return $('#examples a').live('click', function() {
      var _ref2;
      _ref2 = examples[parseInt($(this).attr('href').replace(/#example(\d+)$/, '$1'))], name = _ref2[0], code = _ref2[1];
      return $('#code').val(code).focus();
    });
  });
}).call(this);
