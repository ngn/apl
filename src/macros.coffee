macro -> macro.fileToNode 'node_modules/macronym/assert.coffee'

macro -> macro.tmpCounter = 0

macro isInt (x, start, end) ->
  new macro.Parens(
    (
      if end then        macro.codeToNode -> (tmp = x) is ~~tmp and start <= tmp < end
      else if start then macro.codeToNode -> (tmp = x) is ~~tmp and start <= tmp
      else               macro.codeToNode -> (tmp = x) is ~~tmp
    ).subst
      tmp:   macro.csToNode "tmp#{macro.tmpCounter++}"
      x:     new macro.Parens x
      start: new macro.Parens start
      end:   new macro.Parens end
  )
