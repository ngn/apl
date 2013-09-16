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
    for alias in v?.aplMetaInfo?.aliases ? []
      @[alias] = v
