macro -> macro.fileToNode 'src/macros.coffee'
moduleNames = '''
  arithmetic backslash circle comma commute comparisons compose cupcap decode
  disclose dot drop each enclose encode epsilon exclamation execute find
  floorceil forkhook format grade identity iota logic poweroperator quad
  question rho rotate slash special squish tack take transpose variant vhelpers
  zilde
'''.split /\s+/

for m in moduleNames
  for k, v of require("./vocabulary/#{m}").vocabulary
    @[k] = v
    for alias in v?.aplMetaInfo?.aliases ? []
      @[alias] = v
