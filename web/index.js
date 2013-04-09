(function() {
  var exec, format;

  exec = require('./compiler').exec;

  format = require('./vocabulary/format').format;

  jQuery(function($) {
    var a, code, execute, hSymbolDefs, hashParams, i, k, mapping, name, nameValue, rMapping, symbolDef, symbolDefs, tipsyOpts, v, value, _i, _j, _k, _l, _len, _len1, _len2, _ref, _ref1, _ref2, _ref3, _ref4;

    hashParams = {};
    if (location.hash) {
      _ref = location.hash.substring(1).split(',');
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        nameValue = _ref[_i];
        _ref1 = nameValue.split('='), name = _ref1[0], value = _ref1[1];
        hashParams[name] = unescape(value);
      }
    }
    $('#code').text(hashParams.code || '').focus();
    $('#permalink').tipsy({
      gravity: 'e',
      opacity: 1,
      delayIn: 1000
    }).bind('mouseover focus', function() {
      $(this).attr('href', '#code=' + escape($('#code').val()));
      return false;
    });
    execute = function() {
      var err, result;

      try {
        result = exec($('#code').val());
        $('#result').removeClass('error').text(format(result).join('\n'));
      } catch (_error) {
        err = _error;
        if (typeof console !== "undefined" && console !== null) {
          if (typeof console.error === "function") {
            console.error(err.stack);
          }
        }
        $('#result').addClass('error').text(err.message);
      }
    };
    $('#go').tipsy({
      gravity: 'e',
      opacity: 1,
      delayIn: 1000
    }).closest('form').submit(function() {
      execute();
      return false;
    });
    symbolDefs = [
      ['+', 'Conjugate, Add'], ['−', 'Negate, Subtract'], ['×', 'Sign of, Multiply'], ['÷', 'Reciprocal, Divide'], ['⌈', 'Ceiling, Greater of'], ['⌊', 'Floor, Lesser of'], ['∣', 'Absolute value, Residue'], ['⍳', 'Index generator, Index of'], ['?', 'Roll, Deal'], ['⋆', 'Exponential, To the power of'], ['⍟', 'Natural logarithm, Logarithm to the base'], ['○', 'Pi times, Circular and hyperbolic functions'], ['!', 'Factorial, Binomial'], ['⌹', 'Matrix inverse, Matrix divide'], ['<', 'Less than'], ['≤', 'Less than or equal'], ['=', 'Equal'], ['≥', 'Greater than or equal'], ['>', 'Greater than'], ['≠', 'Not equal'], ['≡', 'Depth, Match'], ['≢', 'Not match'], ['∈', 'Enlist, Membership'], ['⍷', 'Find'], ['∪', 'Unique, Union'], ['∩', 'Intersection'], ['∼', 'Not, Without'], ['∨', 'Or (Greatest Common Divisor)'], ['∧', 'And (Least Common Multiple)'], ['⍱', 'Nor'], ['⍲', 'Nand'], ['⍴', 'Shape of, Reshape'], [',', 'Ravel, Catenate'], ['⍪', 'First axis catenate'], ['⌽', 'Reverse, Rotate'], ['⊖', 'First axis rotate'], ['⍉', 'Transpose'], ['↑', 'First, Take'], ['↓', 'Drop'], ['⊂', 'Enclose, Partition'], ['⊃', 'Disclose, Pick'], ['⌷', 'Index'], ['⍋', 'Grade up'], ['⍒', 'Grade down'], ['⊤', 'Encode'], ['⊥', 'Decode'], ['⍕', 'Format, Format by specification'], ['⍎', 'Execute'], ['⊣', 'Stop, Left'], ['⊢', 'Pass, Right'], ['⎕', 'Evaluated input, Output with a newline'], ['⍞', 'Character input, Bare output'], ['¨', 'Each'], [
        '∘.', 'Outer product', {
          keys: '`j.'
        }
      ], ['/', 'Reduce'], ['⌿', '1st axis reduce'], ['\\', 'Scan'], ['⍀', '1st axis scan'], ['⍣', 'Power operator'], ['¯', 'Negative number sign'], ['⍝', 'Comment'], ['←', 'Assignment'], ['⍬', 'Zilde'], ['◇', 'Statement separator'], ['⍺', 'Left formal parameter'], ['⍵', 'Right formal parameter']
    ];
    mapping = {};
    rMapping = {};
    a = '`< «   `= ×   `> »   `_ ≡   `- −   `, ⍪   `; ◇   `: ÷   `! ⍣   `/ ⌿   `( ⍱\n`) ⍲   `[ ←   `\\ ⍀  `0 ∧   `1 ¨   `2 ¯   `4 ≤   `6 ≥   `8 ≠   `9 ∨   `a ⍺\n`A ⊖   `b ⊥   `B ⍎   `c ∩   `C ⍝   `d ⌊   `e ∈   `E ⍷   `g ∇   `G ⍒   `h ∆\n`H ⍋   `i ⍳   `I ⌷   `j ∘   `l ⎕   `L ⍞   `m ∣   `n ⊤   `N ⍕   `o ○   `O ⍬\n`p ⋆   `P ⍟   `r ⍴   `s ⌈   `t ∼   `T ⍉   `u ↓   `v ∪   `w ⍵   `W ⌽   `x ⊃\n`y ↑   `z ⊂'.replace(/(^\s+|\s+$)/g, '').split(/\s+/);
    for (i = _j = 0, _ref2 = a.length / 2; 0 <= _ref2 ? _j < _ref2 : _j > _ref2; i = 0 <= _ref2 ? ++_j : --_j) {
      k = a[2 * i];
      v = a[2 * i + 1];
      mapping[k] = v;
      rMapping[v] = k;
    }
    hSymbolDefs = {};
    for (_k = 0, _len1 = symbolDefs.length; _k < _len1; _k++) {
      symbolDef = symbolDefs[_k];
      hSymbolDefs[symbolDef[0]] = symbolDef;
    }
    $('#code').keydown(function(event) {
      if (event.keyCode === 13 && event.ctrlKey) {
        $('#go').click();
        return false;
      }
    });
    $('#code').retype('on', {
      mapping: mapping
    });
    $('textarea').keyboard({
      layout: 'custom',
      useCombos: false,
      display: {
        bksp: 'Bksp',
        shift: '⇧',
        alt: 'Alt',
        enter: 'Enter',
        exec: '⍎'
      },
      autoAccept: true,
      usePreview: false,
      customLayout: {
        "default": ['1 2 3 4 5 6 7 8 9 0 - =', 'q w e r t y u i o p [ ]', 'a s d f g h j k l {enter}', '{shift} z x c v b n m , . {bksp}', '{alt} {space} {exec!!}'],
        shift: ['! @ # $ % ^ & * ( ) _ +', 'Q W E R T Y U I O P { }', 'A S D F G H J K L {enter}', '{shift} Z X C V B N M < > {bksp}', '{alt} {space} {exec!!}'],
        alt: ['¨ ¯ < ≤ = ≥ > ≠ ∨ ∧ − ×', '░ ⍵ ∈ ⍴ ∼ ↑ ↓ ⍳ ○ ⋆ ← ░', '⍺ ⌈ ⌊ ░ ∇ ∆ ∘ ░ ⎕ {enter}', '{shift} ⊂ ⊃ ∩ ∪ ⊥ ⊤ ∣ ⍪ ░ {bksp}', '{alt} {space} {exec!!}'],
        'alt-shift': ['⍣ ░ ░ ░ ░ ░ ░ ░ ⍱ ⍲ ≡ ░', '░ ⌽ ⍷ ░ ⍉ ░ ░ ⌷ ⍬ ⍟ ░ ░', '⊖ ░ ░ ░ ⍒ ⍋ ░ ░ ⍞ {enter}', '{shift} ░ ░ ⍝ ░ ⍎ ⍕ ░ « » {bksp}', '{alt} {space} {exec!!}']
      }
    });
    $.keyboard.keyaction.exec = execute;
    $('textarea').focus();
    tipsyOpts = {
      title: function() {
        return (hSymbolDefs[$(this).text()] || {})[1] || '';
      },
      gravity: 's',
      delayIn: 1000,
      opacity: 1
    };
    $('.ui-keyboard').on('mouseover', '.ui-keyboard-button', function(event) {
      var $b;

      $b = $(event.target).closest('.ui-keyboard-button');
      if (!$b.data('tipsyInitialised')) {
        $b.data('tipsyInitialised', true).tipsy(tipsyOpts).tipsy('show');
      }
      return false;
    });
    _ref3 = window.examples;
    for (i = _l = 0, _len2 = _ref3.length; _l < _len2; i = ++_l) {
      _ref4 = _ref3[i], name = _ref4[0], code = _ref4[1];
      $('#examples').append(" <a href='#example" + i + "'>" + name + "</a>");
    }
    $('#examples').on('click', 'a', function() {
      var _ref5;

      _ref5 = window.examples[parseInt($(this).attr('href').replace(/#example(\d+)$/, '$1'))], name = _ref5[0], code = _ref5[1];
      $('#code').val(code).focus();
      return false;
    });
    return {};
  });

}).call(this);
