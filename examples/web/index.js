(function() {
  jQuery(function($) {
    var $keyboard, c, ch, code, description, esc, escHard, escT, examples, formatAsHTML, formatHTMLTable, hSymbolDefs, href, i, isKeyboardShown, key, mapping, name, renderKey, renderKeyboard, s, symbolDef, symbolDefs, symbolsHTML, td, _i, _len, _len2, _ref;
    escT = {
      '<': 'lt',
      '>': 'gt',
      '&': 'amp',
      "'": 'apos',
      '"': 'quot'
    };
    esc = function(s) {
      if (s) {
        return s.replace(/[<>&'"]/g, function(x) {
          return "&" + escT[x] + ";";
        });
      } else {
        return '';
      }
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
          return "<span class='function'>" + (x.isPrefixOperator || x.isInfixOperator || x.isPostfixOperator ? 'operator' : 'function') + (x.aplName ? ' ' + x.aplName : '') + "</span>";
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
    symbolDefs = [['+', '', 'Conjugate, Add'], ['−', '`-', 'Negate, Subtract'], ['×', '`=', 'Sign of, Multiply'], ['÷', '`:', 'Reciprocal, Divide'], ['⌈', '`s', 'Ceiling, Greater of'], ['⌊', '`d', 'Floor, Lesser of'], ['∣', '`m', 'Absolute value, Residue'], ['⍳', '`i', 'Index generator, Index of'], ['?', '', 'Roll, Deal'], ['⋆', '`p', 'Exponential, To the power of'], ['⍟', '`P', 'Natural logarithm, Logarithm to the base'], ['○', '`o', 'Pi times, Circular and hyperbolic functions'], ['!', '', 'Factorial, Binomial'], ['⌹', '', 'Matrix inverse, Matrix divide'], ['<', '', 'Less than'], ['≤', '`4', 'Less than or equal'], ['=', '', 'Equal'], ['≥', '`6', 'Greater than or equal'], ['>', '', 'Greater than'], ['≠', '`8', 'Not equal'], ['≡', '`_', 'Depth, Match'], ['≢', '', 'Not match'], ['∈', '`e', 'Enlist, Membership'], ['⍷', '`E', 'Find'], ['∪', '`v', 'Unique, Union'], ['∩', '`c', 'Intersection'], ['∼', '`t', 'Not, Without'], ['∨', '`9', 'Or'], ['∧', '`0', 'And'], ['⍱', '`(', 'Nor'], ['⍲', '`)', 'Nand'], ['⍴', '`r', 'Shape of, Reshape'], [',', '', 'Ravel, Catenate'], ['⍪', '`,', 'First axis catenate'], ['⌽', '`W', 'Reverse, Rotate'], ['⊖', '`A', 'First axis rotate'], ['⍉', '`T', 'Transpose'], ['↑', '`y', 'First, Take'], ['↓', '`u', 'Drop'], ['⊂', '`z', 'Enclose, Partition'], ['⊃', '`x', 'Disclose, Pick'], ['⌷', '`I', 'Index'], ['⍋', '`g', 'Grade up'], ['⍒', '`h', 'Grade down'], ['⊤', '`n', 'Encode'], ['⊥', '`b', 'Decode'], ['⍕', '`N', 'Format, Format by specification'], ['⍎', '`B', 'Execute'], ['⊣', '', 'Stop, Left'], ['⊢', '', 'Pass, Right'], ['⎕', '`l', 'Evaluated input, Output with a newline'], ['⍞', '`L', 'Character input, Bare output'], ['¨', '`1', 'Each'], ['∘.', '`j', 'Outer product'], ['/', '', 'Reduce'], ['⌿', '`/', '1st axis reduce'], ['\\', '', 'Scan'], ['⍀', '`\\', '1st axis scan'], ['⍣', '`!', 'Power operator'], ['¯', '`2', 'Negative number sign'], ['⍝', '`C', 'Comment'], ['←', '`[', 'Assignment'], ['⍬', '`O', 'Zilde'], ['◇', '`;', 'Statement separator'], ['⍺', '`a', 'Left formal parameter'], ['⍵', '`w', 'Right formal parameter']];
    mapping = {};
    hSymbolDefs = {};
    symbolsHTML = '';
    for (_i = 0, _len = symbolDefs.length; _i < _len; _i++) {
      symbolDef = symbolDefs[_i];
      ch = symbolDef[0], key = symbolDef[1], description = symbolDef[2];
      hSymbolDefs[ch] = symbolDef;
      href = '#' + ((function() {
        var _j, _len2, _results;
        _results = [];
        for (_j = 0, _len2 = ch.length; _j < _len2; _j++) {
          c = ch[_j];
          s = '0000' + c.charCodeAt(0).toString(16).toUpperCase();
          _results.push('U+' + s.slice(s.length - 4));
        }
        return _results;
      })()).join(',');
      if (key) {
        mapping[key] = ch;
      }
      symbolsHTML += "<a href='" + href + "'>" + (esc(ch)) + "</a>";
    }
    $('#symbols').html("<p>" + symbolsHTML + "</p>");
    $('#symbols a').live('click', function() {
      $('#code').focus().replaceSelection($(this).text());
      return false;
    });
    $('#symbols a').tooltip({
      showURL: false,
      bodyHandler: function() {
        var k, _ref;
        _ref = hSymbolDefs[$(this).text()], ch = _ref[0], key = _ref[1], description = _ref[2];
        return "<span class='keys' style=\"float: right\">" + (((function() {
          var _j, _len2, _results;
          _results = [];
          for (_j = 0, _len2 = key.length; _j < _len2; _j++) {
            k = key[_j];
            s = "<span class='key'>" + k + "</span>";
            if (k !== k.toLowerCase()) {
              s = "<span class='key'>Shift&nbsp;⇧</span>" + s;
            }
            _results.push(s);
          }
          return _results;
        })()).join(' ')) + "</span>\n<span class='symbol'>" + ch + "</span>\n<p class='description'>" + description + "</p>";
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
    renderKey = function(lowerRegister, upperRegister) {
      return "<table class='key'>\n  <tr>\n    <td class='upperRegister'>" + (esc(upperRegister)) + "</td>\n    <td class='upperAPLRegister'>" + (esc(mapping['`' + upperRegister])) + "</td>\n  </tr>\n  <tr>\n    <td class='lowerRegister'>" + (esc(lowerRegister)) + "</td>\n    <td class='lowerAPLRegister'>" + (esc(mapping['`' + lowerRegister])) + "</td>\n  </tr>\n</table>";
    };
    td = function(content) {
      return "<td>" + content + "</td>";
    };
    renderKeyboard = function(mapping) {
      return "<div class=\"keyboard\">\n  <table class=\"row\"><tr>" + ([td(renderKey('`', '~')), td(renderKey('1', '!')), td(renderKey('2', '@')), td(renderKey('3', '#')), td(renderKey('4', '$')), td(renderKey('5', '%')), td(renderKey('6', '^')), td(renderKey('7', '&')), td(renderKey('8', '*')), td(renderKey('9', '(')), td(renderKey('0', ')')), td(renderKey('-', '_')), td(renderKey('=', '+'))].join('')) + "\n    <td><table class=\"key backspaceKey\"><tr><td>Backspace<br/>⟵</td></tr></table></td>\n  </tr></table>\n  <table class=\"row\"><tr>\n    <td><table class=\"key tabKey\"><tr><td>Tab<br/>↹</td></tr></table></td>\n    " + ([td(renderKey('q', 'Q')), td(renderKey('w', 'W')), td(renderKey('e', 'E')), td(renderKey('r', 'R')), td(renderKey('t', 'T')), td(renderKey('y', 'Y')), td(renderKey('u', 'U')), td(renderKey('i', 'I')), td(renderKey('o', 'O')), td(renderKey('p', 'P')), td(renderKey('[', '{')), td(renderKey(']', '}')), td(renderKey('\\', '|'))].join('')) + "\n  </tr></table>\n  <table class=\"row\"><tr>\n    <td><table class=\"key capsLockKey\"><tr><td>Caps Lock</td></tr></table></td>\n    " + ([td(renderKey('a', 'A')), td(renderKey('s', 'S')), td(renderKey('d', 'D')), td(renderKey('f', 'F')), td(renderKey('g', 'G')), td(renderKey('h', 'H')), td(renderKey('j', 'J')), td(renderKey('k', 'K')), td(renderKey('l', 'L')), td(renderKey(';', ':')), td(renderKey("'", '"'))].join('')) + "\n    <td><table class=\"key enterKey\"><tr><td>Enter<br/>⏎</td></tr></table></td>\n  </tr></table>\n  <table class=\"row\"><tr>\n    <td><table class=\"key leftShiftKey\"><tr><td>Shift&nbsp;⇧</td></tr></table></td>\n    " + ([td(renderKey('z', 'Z')), td(renderKey('x', 'X')), td(renderKey('c', 'C')), td(renderKey('v', 'V')), td(renderKey('b', 'B')), td(renderKey('n', 'N')), td(renderKey('m', 'M')), td(renderKey(',', '<')), td(renderKey('.', '>')), td(renderKey('/', '?'))].join('')) + "\n    <td><table class=\"key rightShiftKey\"><tr><td>Shift&nbsp;⇧</td></tr></table></td>\n  </tr></table>\n</div>";
    };
    isKeyboardShown = false;
    $keyboard = null;
    $('#keyboardSwitch a').live('click', function(event) {
      isKeyboardShown = !isKeyboardShown;
            if ($keyboard != null) {
        $keyboard;
      } else {
        $keyboard = $(renderKeyboard()).appendTo('#keyboardSwitch');
      };
      $keyboard.toggle(isKeyboardShown);
      $(this).text(isKeyboardShown ? 'Hide keyboard' : 'Show keyboard');
      return false;
    });
    examples = [['Rho-Iota', '⍝  ⍳ n  generates a list of numbers from 0 to n−1\n⍝  n n ⍴ A  arranges the elements of A in an n×n matrix\n\n5 5 ⍴ ⍳ 25'], ['Multiplication table', '⍝  ∘.       is the "outer product" operator\n⍝  a × b    scalar multiplication, "a times b"\n⍝  A ∘.× B  every item in A times every item in B\n\n(⍳ 10) ∘.× ⍳ 10'], ['Life', '⍝ Conway\'s game of life\nr←(3 3 ⍴ ⍳ 9)∈1 3 6 7 8\nR←¯1⊖¯2⌽5 7↑r\nlife←{∨/1⍵∧3 4=⊂+/+⌿1 0 ¯1∘.⊖1 0 ¯1⌽¨⊂⍵}\nR (life R) (life life R)']];
    for (i = 0, _len2 = examples.length; i < _len2; i++) {
      _ref = examples[i], name = _ref[0], code = _ref[1];
      $('#examples').append(" <a href='#example" + i + "'>" + name + "</a>");
    }
    return $('#examples a').live('click', function() {
      var _ref2;
      _ref2 = examples[parseInt($(this).attr('href').replace(/#example(\d+)$/, '$1'))], name = _ref2[0], code = _ref2[1];
      $('#code').val(code).focus();
      return false;
    });
  });
}).call(this);
