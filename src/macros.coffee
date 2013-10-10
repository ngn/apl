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
