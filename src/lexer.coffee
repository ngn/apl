tokenize = do ->
  {code, vars, nSlots} = macro ->
    fs = macro.require 'fs'
    {parse, compileAST, repr} = macro.require "#{process.cwd()}/old-apl"
    ast = parse fs.readFileSync "#{process.cwd()}/src/lexer.apl", 'utf8'
    code = compileAST ast
    macro.jsToNode repr code: code, nSlots: ast.nSlots, vars: ast.vars

  f = null
  (s) ->
    if !f?
      env = [[]]
      for k, v of vars then env[0][v.slot] = vocabulary[k]
      vm {code, env}
      f = env[0][vars.tokenize.slot].toFunction()

    a = f new APLArray s

    # a is an APL matrix whose first two column are "type" and "value"
    # Convert a to JavaScript object, as expected by tokenize()'s callers:
    b = a.toArray()
    for i in [0...b.length] by ⍴(a)[1]
      type: b[i]
      value: b[i + 1].toArray().join('')
