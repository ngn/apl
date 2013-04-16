lazyRequires =
  arithmetic:    '+-×÷*⍟∣|'
  floorceil:     '⌊⌈'
  question:      '?'
  exclamation:   '!'
  circle:        '○'
  comparisons:   '=≠<>≤≥≡≢'
  logic:         '~∨∧⍱⍲'
  rho:           '⍴'
  iota:          '⍳'
  rotate:        '⌽⊖'
  transpose:     '⍉'
  epsilon:       '∊'
  zilde:         ['get_⍬', 'set_⍬']
  comma:         ',⍪'
  grade:         '⍋⍒'
  take:          '↑'
  drop:          '↓'
  squish:        '⌷'
  quad:          ['get_⎕', 'set_⎕', 'get_⍞', 'set_⍞']
  format:        '⍕'
  forkhook:      ['⎕fork', '⎕hook']
  each:          '¨'
  commute:       '⍨'
  cupcap:        '∪∩'
  find:          '⍷'
  enclose:       '⊂'
  disclose:      '⊃'
  execute:       '⍎'
  poweroperator: '⍣'
  innerproduct:  '.'
  outerproduct:  ['∘.']
  slash:         '/⌿'
  backslash:     '\\⍀'
  tack:          '⊣⊢'
  encode:        '⊤'
  decode:        '⊥'
  special:       ['⎕aplify', '⎕complex', '⎕bool', 'get_⎕IO', 'set_⎕IO']

createLazyRequire = (obj, name, fromModule) ->
  obj[name] = (args...) ->
    obj[name] = f = require(fromModule)[name]
    f.aplName = name
    f.aplMetaInfo = arguments.callee.aplMetaInfo
    f args...

for fromModule, names of lazyRequires
  for name in names
    createLazyRequire @, name, './vocabulary/' + fromModule

for name in ['∘.'] then (@[name].aplMetaInfo ?= {}).isPrefixAdverb = true
for name in '⍨¨/⌿\\⍀' then (@[name].aplMetaInfo ?= {}).isPostfixAdverb = true
for name in '.⍣' then (@[name].aplMetaInfo ?= {}).isConjunction = true

for k, v of @ when typeof v is 'function' then v.aplName = k
