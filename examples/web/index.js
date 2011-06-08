(function() {
  jQuery(function($) {
    var ch, code, description, esc, escHard, escT, examples, formatAsHTML, formatHTMLTable, hSymbolDefs, i, key, mapping, name, symbolDef, symbolDefs, symbolsHTML, _i, _len, _len2, _ref;
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
    escHard = function(s) {
      return esc(s).replace(' ', '&nbsp;', 'g').replace('\n', '<br/>', 'g');
    };
    formatAsHTML = function(x) {
      var i, nPlanes, nc, nr, planeSize, planes, rx, sx, y, _ref;
      try {
        if (typeof x === 'string') {
          return "<span class='character'>" + (esc(x).replace(' ', '&nbsp;', 'g')) + "</span>";
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
          return "<div class='error'>" + (escHard(e.message)) + "</div>";
        }
      })());
      return false;
    });
    symbolDefs = [['+', '', 'Conjugate, Add'], ['−', '`-', 'Negate, Subtract'], ['×', '`=', 'Sign of, Multiply'], ['÷', '`:', 'Reciprocal, Divide'], ['⌈', '`s', 'Ceiling, Greater of'], ['⌊', '`d', 'Floor, Lesser of'], ['∣', '`m', 'Absolute value, Residue'], ['⍳', '`i', 'Index generator, Index of'], ['?', '', 'Roll, Deal'], ['⋆', '`p', 'Exponential, To the power of'], ['⍟', '`P', 'Natural logarithm, Logarithm to the base'], ['○', '`o', 'Pi times, Circular and hyperbolic functions'], ['!', '', 'Factorial, Binomial'], ['⌹', '', 'Matrix inverse, Matrix divide'], ['<', '', 'Less than'], ['≤', '`4', 'Less than or equal'], ['=', '', 'Equal'], ['≥', '`6', 'Greater than or equal'], ['>', '', 'Greater than'], ['≠', '`8', 'Not equal'], ['≡', '`_', 'Depth, Match'], ['≢', '', 'Not match'], ['∈', '`e', 'Enlist, Membership'], ['⍷', '`E', 'Find'], ['∪', '`v', 'Unique, Union'], ['∩', '`c', 'Intersection'], ['∼', '`t', 'Not, Without'], ['∨', '`9', 'Or'], ['∧', '`0', 'And'], ['⍱', '`(', 'Nor'], ['⍲', '`)', 'Nand'], ['⍴', '`r', 'Shape of, Reshape'], [',', '', 'Ravel, Catenate'], ['⍪', '`,', 'First axis catenate'], ['⌽', '`W', 'Reverse, Rotate'], ['⊖', '`A', 'First axis rotate'], ['⍉', '`T', 'Transpose'], ['↑', '`y', 'First, Take'], ['↓', '`u', 'Drop'], ['⊂', '`z', 'Enclose, Partition'], ['⊃', '`x', 'Disclose, Pick'], ['⌷', '`I', 'Index'], ['⍋', '`g', 'Grade up'], ['⍒', '`h', 'Grade down'], ['⊤', '`n', 'Encode'], ['⊥', '`b', 'Decode'], ['⍕', '`N', 'Format, Format by specification'], ['⍎', '`B', 'Execute'], ['⊣', '', 'Stop, Left'], ['⊢', '', 'Pass, Right'], ['⎕', '`l', 'Evaluated input, Output with a newline'], ['⍞', '`L', 'Character input, Bare output'], ['¨', '`1', 'Each'], ['∘.', '`j', 'Outer product'], ['/', '', 'Reduce'], ['⌿', '`/', '1st axis reduce'], ['\\', '', 'Scan'], ['⍀', '`\\', '1st axis scan'], ['¯', '`2', 'Negative number sign'], ['⍝', '`C', 'Comment'], ['←', '`[', 'Assignment'], ['⍬', '`O', 'Zilde'], ['◇', '`;', 'Statement separator'], ['⍺', '`a', 'Left formal parameter'], ['⍵', '`w', 'Right formal parameter']];
    mapping = {};
    hSymbolDefs = {};
    symbolsHTML = '';
    for (_i = 0, _len = symbolDefs.length; _i < _len; _i++) {
      symbolDef = symbolDefs[_i];
      ch = symbolDef[0], key = symbolDef[1], description = symbolDef[2];
      hSymbolDefs[ch] = symbolDef;
      if (key) {
        mapping[key] = ch;
        description += " (key: " + key + ")";
      }
      symbolsHTML += "<a href='#' title='" + (esc(description)) + "'>" + (esc(ch)) + "</a>";
    }
    $('#symbols').html("<p>" + symbolsHTML + "</p>");
    $('#symbols a').live('click', function() {
      return $('#code').replaceSelection($(this).text());
    });
    $('#symbols a').tooltip({
      showURL: false,
      bodyHandler: function() {
        var k, _ref;
        _ref = hSymbolDefs[$(this).text()], ch = _ref[0], key = _ref[1], description = _ref[2];
        return "<span class='keys' style=\"float: right\">\n  " + (((function() {
          var _j, _len2, _ref2, _results;
          _ref2 = key.split('');
          _results = [];
          for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
            k = _ref2[_j];
            _results.push("<span class='key'>" + k + "</span>");
          }
          return _results;
        })()).join(' ')) + "\n</span>\n<span class='symbol'>" + ch + "</span>\n<p class='description'>" + description + "</p>";
      }
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
    for (i = 0, _len2 = examples.length; i < _len2; i++) {
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
