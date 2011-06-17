(function() {
  jQuery(function($) {
    var $keyboard, a, c, ch, code, esc, escHard, escT, formatAsHTML, formatHTMLTable, hSymbolDefs, href, i, isKeyboardShown, k, mapping, name, rMapping, renderKey, renderKeyboard, renderKeys, symbolDef, symbolDefs, symbolsHTML, v, _i, _len, _len2, _ref, _ref2, _ref3;
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
      return esc(s).replace(/\ /g, '&nbsp;').replace(/\n/g, '<br/>');
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
      var browserBuiltins, ctx, exec, inherit;
      exec = require('./interpreter').exec;
      browserBuiltins = require('./browser').browserBuiltins;
      inherit = require('./helpers').inherit;
      ctx = inherit(browserBuiltins);
      exec($('#code').val(), ctx, function(err, result) {
        if (err) {
          if (typeof console !== "undefined" && console !== null) {
            if (typeof console.error === "function") {
              console.error(err);
            }
          }
          return $('#result').html("<div class='error'>" + (escHard(err.message)) + "</div>");
        } else {
          return $('#result').html(formatAsHTML(result));
        }
      });
      return false;
    });
    symbolDefs = [
      ['+', 'Conjugate, Add'], ['−', 'Negate, Subtract'], ['×', 'Sign of, Multiply'], ['÷', 'Reciprocal, Divide'], ['⌈', 'Ceiling, Greater of'], ['⌊', 'Floor, Lesser of'], ['∣', 'Absolute value, Residue'], ['⍳', 'Index generator, Index of'], ['?', 'Roll, Deal'], ['⋆', 'Exponential, To the power of'], ['⍟', 'Natural logarithm, Logarithm to the base'], ['○', 'Pi times, Circular and hyperbolic functions'], ['!', 'Factorial, Binomial'], ['⌹', 'Matrix inverse, Matrix divide'], ['<', 'Less than'], ['≤', 'Less than or equal'], ['=', 'Equal'], ['≥', 'Greater than or equal'], ['>', 'Greater than'], ['≠', 'Not equal'], ['≡', 'Depth, Match'], ['≢', 'Not match'], ['∈', 'Enlist, Membership'], ['⍷', 'Find'], ['∪', 'Unique, Union'], ['∩', 'Intersection'], ['∼', 'Not, Without'], ['∨', 'Or'], ['∧', 'And'], ['⍱', 'Nor'], ['⍲', 'Nand'], ['⍴', 'Shape of, Reshape'], [',', 'Ravel, Catenate'], ['⍪', 'First axis catenate'], ['⌽', 'Reverse, Rotate'], ['⊖', 'First axis rotate'], ['⍉', 'Transpose'], ['↑', 'First, Take'], ['↓', 'Drop'], ['⊂', 'Enclose, Partition'], ['⊃', 'Disclose, Pick'], ['⌷', 'Index'], ['⍋', 'Grade up'], ['⍒', 'Grade down'], ['⊤', 'Encode'], ['⊥', 'Decode'], ['⍕', 'Format, Format by specification'], ['⍎', 'Execute'], ['⊣', 'Stop, Left'], ['⊢', 'Pass, Right'], ['⎕', 'Evaluated input, Output with a newline'], ['⍞', 'Character input, Bare output'], ['¨', 'Each'], [
        '∘.', 'Outer product', {
          keys: '`j.'
        }
      ], ['/', 'Reduce'], ['⌿', '1st axis reduce'], ['\\', 'Scan'], ['⍀', '1st axis scan'], ['⍣', 'Power operator'], ['¯', 'Negative number sign'], ['⍝', 'Comment'], ['←', 'Assignment'], ['⍬', 'Zilde'], ['◇', 'Statement separator'], ['⍺', 'Left formal parameter'], ['⍵', 'Right formal parameter']
    ];
    mapping = {};
    rMapping = {};
    a = '`< «   `= ×   `> »   `_ ≡   `- −   `, ⍪   `; ◇   `: ÷   `! ⍣   `/ ⌿   `( ⍱\n`) ⍲   `[ ←   `\\ ⍀  `0 ∧   `1 ¨   `2 ¯   `4 ≤   `6 ≥   `8 ≠   `9 ∨   `a ⍺\n`A ⊖   `b ⊥   `B ⍎   `c ∩   `C ⍝   `d ⌊   `e ∈   `E ⍷   `g ∇   `G ⍒   `h ∆\n`H ⍋   `i ⍳   `I ⌷   `j ∘   `l ⎕   `L ⍞   `m ∣   `n ⊤   `N ⍕   `o ○   `O ⍬\n`p ⋆   `P ⍟   `r ⍴   `s ⌈   `t ∼   `T ⍉   `u ↓   `v ∪   `w ⍵   `W ⌽   `x ⊃\n`y ↑   `z ⊂'.replace(/(^\s+|\s+$)/g, '').split(/\s+/);
    for (i = 0, _ref = a.length / 2; 0 <= _ref ? i < _ref : i > _ref; 0 <= _ref ? i++ : i--) {
      k = a[2 * i];
      v = a[2 * i + 1];
      mapping[k] = v;
      rMapping[v] = k;
    }
    hSymbolDefs = {};
    symbolsHTML = '';
    for (_i = 0, _len = symbolDefs.length; _i < _len; _i++) {
      symbolDef = symbolDefs[_i];
      ch = symbolDef[0];
      hSymbolDefs[ch] = symbolDef;
      href = '#' + ((function() {
        var _j, _len2, _results;
        _results = [];
        for (_j = 0, _len2 = ch.length; _j < _len2; _j++) {
          c = ch[_j];
          _results.push('U+' + ('000' + c.charCodeAt(0).toString(16).toUpperCase()).slice(-4));
        }
        return _results;
      })()).join(',');
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
        var description, k, opts, s, _ref2;
        _ref2 = hSymbolDefs[$(this).text()], ch = _ref2[0], description = _ref2[1], opts = _ref2[2];
        return "<span class='keys' style=\"float: right\">" + (((function() {
          var _j, _len2, _ref3, _results;
          _ref3 = (opts != null ? opts.keys : void 0) || rMapping[ch] || '';
          _results = [];
          for (_j = 0, _len2 = _ref3.length; _j < _len2; _j++) {
            k = _ref3[_j];
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
      return "<td>\n  <table class='key'>\n    <tr>\n      <td class='upperRegister'>" + (esc(upperRegister)) + "</td>\n      <td class='upperAPLRegister'>" + (esc(mapping['`' + upperRegister])) + "</td>\n    </tr>\n    <tr>\n      <td class='lowerRegister'>" + (esc(lowerRegister)) + "</td>\n      <td class='lowerAPLRegister'>" + (esc(mapping['`' + lowerRegister])) + "</td>\n    </tr>\n  </table>\n</td>";
    };
    renderKeys = function(keysDescription) {
      var x;
      return ((function() {
        var _j, _len2, _ref2, _results;
        _ref2 = keysDescription.split(' ');
        _results = [];
        for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
          x = _ref2[_j];
          _results.push(renderKey(x[0], x[1]));
        }
        return _results;
      })()).join('');
    };
    renderKeyboard = function(mapping) {
      return "<div class=\"keyboard\">\n  <div class=\"help\">Prepend a backquote (`) to get the symbols in blue or red.</div>\n  <table class=\"row\"><tr>\n    " + (renderKeys('`~ 1! 2@ 3# 4$ 5% 6^ 7& 8* 9( 0) -_ =+')) + "\n    <td><table class=\"key backspaceKey\"><tr><td>Backspace<br/>⟵</td></tr></table></td>\n  </tr></table>\n  <table class=\"row\"><tr>\n    <td><table class=\"key tabKey\"><tr><td>Tab<br/>↹</td></tr></table></td>\n    " + (renderKeys('qQ wW eE rR tT yY uU iI oO pP [{ ]} \\|')) + "\n  </tr></table>\n  <table class=\"row\"><tr>\n    <td><table class=\"key capsLockKey\"><tr><td>Caps Lock</td></tr></table></td>\n    " + (renderKeys('aA sS dD fF gG hH jJ kK lL ;: \'"')) + "\n    <td><table class=\"key enterKey\"><tr><td>Enter<br/>⏎</td></tr></table></td>\n  </tr></table>\n  <table class=\"row\"><tr>\n    <td><table class=\"key leftShiftKey\"><tr><td>Shift&nbsp;⇧</td></tr></table></td>\n    " + (renderKeys('zZ xX cC vV bB nN mM ,< .> /?')) + "\n    <td><table class=\"key rightShiftKey\"><tr><td>Shift&nbsp;⇧</td></tr></table></td>\n  </tr></table>\n</div>";
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
      $(this).text(isKeyboardShown ? 'Hide keyboard mapping' : 'Show keyboard mapping');
      return false;
    });
    _ref2 = window.examples;
    for (i = 0, _len2 = _ref2.length; i < _len2; i++) {
      _ref3 = _ref2[i], name = _ref3[0], code = _ref3[1];
      $('#examples').append(" <a href='#example" + i + "'>" + name + "</a>");
    }
    return $('#examples a').live('click', function() {
      var _ref4;
      _ref4 = window.examples[parseInt($(this).attr('href').replace(/#example(\d+)$/, '$1'))], name = _ref4[0], code = _ref4[1];
      $('#code').val(code).focus();
      return false;
    });
  });
}).call(this);
