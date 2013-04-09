{assert} = require './helpers'
{APLArray} = require './array'
{Complex} = require './complex'

lazyRequires =
  arithmetic:    '+−×÷⋆⍟∣'
  floorceil:     '⌊⌈'
  question:      '?'
  exclamation:   '!'
  circle:        '○'
  comparisons:   '=≠<>≤≥≡≢'
  logic:         '∼∨∧⍱⍲'
  rho:           '⍴'
  iota:          '⍳'
  rotate:        '⌽⊖'
  transpose:     '⍉'
  epsilon:       '∈'
  zilde:         ['get_⍬', 'set_⍬']
  comma:         ',⍪'
  grade:         '⍋⍒'
  take:          '↑'
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
  outerproduct:  ['∘.']

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
for name in '⍨¨' then (@[name].aplMetaInfo ?= {}).isPostfixAdverb = true
for name in '⍣' then (@[name].aplMetaInfo ?= {}).isConjunction = true

@['⎕aplify'] = (x) ->
  assert x?
  if typeof x is 'string' then (if x.length is 1 then APLArray.scalar x else new APLArray x)
  else if typeof x is 'number' then APLArray.scalar x
  else if x instanceof Array
    new APLArray(
      for y in x
        if y instanceof APLArray and y.shape.length is 0 then y.unbox() else y
    )
  else if x instanceof APLArray then x
  else throw Error 'Cannot aplify object ' + x

@['⎕complex'] = (re, im) ->
  APLArray.scalar new Complex re, im

@['⎕bool'] = (x) ->
  assert x instanceof APLArray
  x.toBool()

do =>
  for k, v of @ when typeof v is 'function'
    v.aplName = k
