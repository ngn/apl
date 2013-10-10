macro -> macro.tmpCounter = 0

macro assert (condition) ->
  (macro.codeToNode ->
    if not condition
      throw Error s
  ).subst
    condition: new macro.Parens condition
    s: macro.valToNode(
      "#{
        JSON.stringify(
          macro.require('fs')
            .readFileSync(macro.file, 'utf8')
            .split('\n')[macro.line - 1]
            .replace /^ */, ''
        )
      } at #{macro.file}:#{macro.line}"
    )

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
