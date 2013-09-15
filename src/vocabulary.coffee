moduleNames = '''
  arithmetic backslash circle comma commute comparisons compose cupcap decode
  disclose drop each enclose encode epsilon exclamation execute find floorceil
  forkhook format grade identity innerproduct iota logic outerproduct
  poweroperator quad question rho rotate slash special squish tack take
  transpose variant vhelpers zilde
'''.split /\s+/

for moduleName in moduleNames
  for k, v of require "./vocabulary/#{moduleName}"
    @[k] = v
    if typeof v is 'function' then v.aplName = k

# Some symbols can act as adverbs or conjunctions.  They need to be marked as such.
for name in ['∘.']    then (@[name].aplMetaInfo ?= {}).isPrefixAdverb  = true
for name in '⍨¨/⌿\\⍀' then (@[name].aplMetaInfo ?= {}).isPostfixAdverb = true
for name in '.⍣⍠∘⍁'   then (@[name].aplMetaInfo ?= {}).isConjunction   = true
