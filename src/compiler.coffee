exec = (aplCode, opts = {}) ->
  execInternal(aplCode, opts).result

execInternal = (aplCode, opts = {}) ->
  ast = parse aplCode, opts
  code = compileAST ast, opts
  env = if prelude then (for frame in prelude.env then frame[0...]) else [[]]
  for k, v of ast.vars then env[0][v.slot] = opts.ctx[k]
  result = vm {code, env}
  for k, v of ast.vars then opts.ctx[k] = env[0][v.slot]
  {ast, code, env, result}

compile = (aplCode, opts = {}) ->
  opts.aplCode = aplCode
  compileAST parse(aplCode, opts), opts

compileAST = (ast, opts = {}) ->
  ast.scopeDepth = 0
  ast.nSlots = if prelude then prelude.ast.nSlots else 0
  ast.vars = if prelude then ast.vars = Object.create prelude.ast.vars else {}
  do ->
    opts.ctx ?= Object.create vocabulary
    for k, v of opts.ctx when not ast.vars[k]
      ast.vars[k] = varInfo = type: 'X', slot: ast.nSlots++, scopeDepth: ast.scopeDepth
      if typeof v is 'function' or v instanceof λ
        varInfo.type = 'F'
        if v.aplMetaInfo?.isAdverb      then varInfo.isAdverb      = true
        if v.aplMetaInfo?.isConjunction then varInfo.isConjunction = true
        if /^[gs]et_.*/.test k then ast.vars[k[4...]] = type: 'X'

  err = (node, message) ->
    throw SyntaxError message, file: opts.file, line: node.startLine, col: node.startCol, aplCode: opts.aplCode

  (markOperators = (node) ->
    switch node[0]
      when 'body', 'guard', 'assign', 'index', 'lambda', 'expr'
        r = 0; for i in [1...node.length] by 1 when node[i] then r |= markOperators node[i]
        if r and node[0] is 'lambda'
          if r & 1 then node.isAdverb = true
          if r & 2 then node.isConjunction = true
          0
        else
          r
      when 'string', 'number', 'embedded' then 0
      when 'symbol'
        switch node[1]
          when '⍺⍺', '⍶', '∇∇' then 1
          when '⍵⍵', '⍹' then 3
          else 0
      else throw Error "Unrecognized node type, '#{node[0]}'"
  ) ast

  queue = [ast] # accumulates "body" nodes which we encounter on our way
  while queue.length
    {vars} = scopeNode = queue.shift()

    visit = (node) ->
      node.scopeNode = scopeNode
      switch node[0]
        when 'guard' then r = visit node[1]; visit node[2]; r
        when 'assign' then visitLHS node[1], visit node[2]
        when 'symbol'
          name = node[1]
          if (v = vars["get_#{name}"])?.type is 'F'
            {type: 'X'}
          else
            vars[name] or err node, "Symbol '#{name}' is referenced before assignment."
        when 'lambda'
          queue.push extend (body = node[1]),
            scopeNode: scopeNode
            scopeDepth: (d = scopeNode.scopeDepth + 1 + !!(node.isAdverb or node.isConjunction))
            nSlots: 3
            vars: extend Object.create(vars),
              '⍵': type: 'X', slot: 0, scopeDepth: d
              '∇': type: 'F', slot: 1, scopeDepth: d
              '⍺': type: 'X', slot: 2, scopeDepth: d
          if node.isConjunction
            extend body.vars,
              '⍵⍵': type: 'F', slot: 0, scopeDepth: d - 1
              '⍹':  type: 'F', slot: 0, scopeDepth: d - 1
              '∇∇': type: 'F', slot: 1, scopeDepth: d - 1, isConjunction: true
              '⍺⍺': type: 'F', slot: 2, scopeDepth: d - 1
              '⍶':  type: 'F', slot: 2, scopeDepth: d - 1
          else if node.isAdverb
            extend body.vars,
              '⍺⍺': type: 'F', slot: 0, scopeDepth: d - 1
              '⍶':  type: 'F', slot: 0, scopeDepth: d - 1
              '∇∇': type: 'F', slot: 1, scopeDepth: d - 1, isAdverb: true
          type: 'F', isAdverb: node.isAdverb, isConjunction: node.isConjunction
        when 'string', 'number', 'embedded' then {type: 'X'}
        when 'index'
          for c in node[2...] when c
            visit(c).type is 'X' or err node, 'Only expressions of type data can be used as an index.'
          visit node[1]
        when 'expr'
          a = node[1...]
          h = Array a.length
          for i in [a.length - 1 .. 0]
            h[i] = visit a[i]
          # Form vectors from sequences of data
          i = 0
          while i < a.length - 1
            if h[i].type is h[i + 1].type is 'X'
              j = i + 2
              while j < a.length and h[j].type is 'X' then j++
              a[i...j] = [['vector'].concat a[i...j]]
              h[i...j] = [{type: 'X'}]
            else
              i++
          # Apply conjunctions
          i = a.length - 2
          while --i >= 0
            if (h[i + 1].isConjunction and
                (h[i].type is 'F' or h[i + 2].type is 'F'))
              a[i...i+3] = [['conjunction'].concat a[i...i+3]]
              h[i...i+3] = [{type: 'F'}]
              i--
          # Apply postfix adverbs
          i = 0
          while i < a.length - 1
            if h[i].type is 'F' and h[i + 1].isAdverb
              a[i...i+2] = [['adverb'].concat a[i...i+2]]
              h[i...i+2] = [{type: 'F'}]
            else
              i++
          # Hooks
          if h.length is 2 and h[0].type is h[1].type is 'F'
            a = [['hook'].concat a]
            h = [{type: 'F'}]
          # Forks
          if (h.length >= 3 and h.length % 2 is 1 and
                  all(for x in h then x.type is 'F'))
            a = [['fork'].concat a]
            h = [{type: 'F'}]
          if h[h.length - 1].type is 'F'
            if h.length > 1
              err a[h.length - 1], 'Trailing function in expression'
          else
            # Apply monadic and dyadic functions
            while h.length > 1
              if h.length is 2 or h[h.length - 3].type is 'F'
                a[h.length - 2...] = [['monadic'].concat a[h.length - 2...]]
                h[h.length - 2...] = [{type: 'X'}]
              else
                a[h.length - 3...] = [['dyadic'].concat a[h.length - 3...]]
                h[h.length - 3...] = [{type: 'X'}]
          # Replace `"expr"` node with `a[0]` in the AST
          node[...] = a[0]
          extend node, a[0]
          h[0]
        else
          throw Error "Unrecognized node type, '#{node[0]}'"

    visitLHS = (node, rhsInfo) ->
      node.scopeNode = scopeNode
      switch node[0]
        when 'symbol'
          name = node[1]
          if name is '∇' then err node, 'Assignment to ∇ is not allowed.'
          if vars[name]
            if vars[name].type isnt rhsInfo.type
              err node, "Inconsistent usage of symbol '#{name}', it is assigned both nouns and verbs."
          else
            vars[name] = extend {scopeDepth: scopeNode.scopeDepth, slot: scopeNode.nSlots++}, rhsInfo
        when 'expr'
          rhsInfo.type is 'X' or err node, 'Strand assignment can be used only for nouns.'
          for child in node[1...] then visitLHS child, rhsInfo
        when 'index'
          rhsInfo.type is 'X' or err node, 'Index assignment can be used only for nouns.'
          visitLHS node[1], rhsInfo
          for c in node[2...] when c then visit c
        else
          err node, "Invalid LHS node type: #{JSON.stringify node[0]}"
      rhsInfo

    for node in scopeNode[1...] then visit node

  render = (node) ->
    switch node[0]
      when 'body'
        if node.length is 1
          # {}0   <=>   ⍬
          [LDC, APLArray.zilde, RET]
        else
          a = for child in node[1...] then [POP].concat render child
          [].concat(a...)[1...].concat RET
      when 'guard'
        x = render node[1]
        y = render node[2]
        x.concat JEQ, y.length + 2, POP, y, RET
      when 'assign'
        # A←5     <=> 5
        # A×A←2 5 <=> 4 25
        render(node[2]).concat renderLHS node[1]
      when 'symbol'
        # radius ← 3
        # ... get_circumference ← {2×○radius}
        # ... get_surface ← {○radius*2}
        # ...
        # ... before ← 0.01× ⌊ 100× radius circumference surface
        # ... radius ← radius + 1
        # ... after  ← 0.01× ⌊ 100× radius circumference surface
        # ...
        # ... before after
        # ... <=> (3 18.84 28.27)(4 25.13 50.26)
        name = node[1]
        {vars} = node.scopeNode
        if (v = vars["get_#{name}"])?.type is 'F'
          [LDC, APLArray.zero, GET, v.scopeDepth, v.slot, MON]
        else
          v = vars[name]
          [GET, v.scopeDepth, v.slot]
      when 'lambda'
        # {1 + 1} 1                    <=> 2
        # {⍵=0:1 ⋄ 2×∇⍵-1} 5           <=> 32 # two to the power of
        # {⍵<2 : 1 ⋄ (∇⍵-1)+(∇⍵-2) } 8 <=> 34 # Fibonacci sequence
        # ⊂{⍺⍺ ⍺⍺ ⍵}'hello'            <=> ⊂⊂'hello'
        # ⊂{⍺⍺ ⍵⍵ ⍵}⌽'hello'           <=> ⊂'olleh'
        # ⊂{⍶⍶⍵}'hello'                <=> ⊂⊂'hello'
        # ⊂{⍶⍹⍵}⌽'hello'               <=> ⊂'olleh'
        # +{⍵⍶⍵}10 20 30               <=> 20 40 60
        # f←{⍵⍶⍵} ⋄ +f 10 20 30        <=> 20 40 60
        # twice←{⍶⍶⍵} ⋄ *twice 2       <=> 1618.1779919126539
        code = render node[1]
        if node.isAdverb or node.isConjunction
          [LAM, code.length + 3, LAM, code.length].concat code, RET
        else
          [LAM, code.length].concat code
      when 'string'
        # Strings of length one are scalars, all other strings are vectors:
        #   ⍴⍴''   <=> ,1
        #   ⍴⍴'x'  <=> ,0
        #   ⍴⍴'xx' <=> ,1
        # Pairs of quotes inside strings:
        #   'Let''s parse it!'        <=> 'Let\'s parse it!'
        #   "0x22's the code for ""." <=> '0x22\'s the code for ".'
        #   ⍴"\f\t\n\r\u1234\xff"     <=> ,6
        # "unclosed string !!!
        d = node[1][0] # the delimiter: '"' or "'"
        s = eval d + node[1][1...-1].replace(///#{d + d}///g, '\\' + d) + d
        v = if s.length is 1 then new APLArray s, [] else new APLArray s
        [LDC, v]
      when 'number'
        a = for x in node[1].replace(/¯/g, '-').split /j/i
              if x is '-' then Infinity
              else if x is '--' then -Infinity
              else if x.match /^-?0x/i then parseInt x, 16
              else parseFloat x
        v = if a[1] then new Complex(a[0], a[1]) else a[0]
        [LDC, new APLArray [v], []]
      when 'embedded'
        f = eval "(function (_w, _a) {return (#{node[1].replace /^«|»$/g, ''});})"
        [EMB, (_w, _a) -> aplify f _w, _a]
      when 'index'
        # ⍴ x[⍋x←6?40] <=> ,6
        v = node.scopeNode.vars._index
        axes = for c, i in node[2...] when c then i
        [].concat(
          (for c in node[2...] when c then render c)...
          VEC, axes.length
          LDC, new APLArray axes
          VEC, 2,
          GET, v.scopeDepth, v.slot,
          render(node[1]),
          DYA
        )
      when 'vector'
        fragments = for child in node[1...] then render child
        if all(for f in fragments then f.length is 2 and f[0] is LDC)
          [LDC, new APLArray(for f in fragments then (if (x = f[1]).isSimple() then x.unwrap() else x))]
        else
          [].concat fragments..., VEC, node.length - 1
      when 'monadic' then render(node[2]).concat render(node[1]), MON
      when 'adverb'  then render(node[1]).concat render(node[2]), MON
      when 'dyadic', 'conjunction' then render(node[3]).concat render(node[2]), render(node[1]), DYA
      when 'hook'
        v = node.scopeNode.vars._hook
        render(node[2]).concat GET, v.scopeDepth, v.slot, render(node[1]), DYA
      when 'fork'
        u = node.scopeNode.vars._hook
        v = node.scopeNode.vars._fork1
        w = node.scopeNode.vars._fork2
        i = node.length - 1
        r = render node[i--]
        while i >= 2
          r = r.concat(
            GET, v.scopeDepth, v.slot, render(node[i--]), DYA,
            GET, w.scopeDepth, w.slot, render(node[i--]), DYA
          )
        if i then r.concat render(node[1]), GET, u.scopeDepth, u.slot, DYA else r
      else throw Error "Unrecognized node type, '#{node[0]}'"

  renderLHS = (node) ->
    switch node[0]
      when 'symbol'
        name = node[1]
        {vars} = node.scopeNode
        if (v = vars["set_#{name}"])?.type is 'F'
          [GET, v.scopeDepth, v.slot, MON]
        else
          v = vars[name]
          [SET, v.scopeDepth, v.slot]
      when 'expr' # strand assignment
        # (a b) ← 1 2 ⋄ a           <=> 1
        # (a b) ← 1 2 ⋄ b           <=> 2
        # (a b) ← +                 !!!
        # (a b c) ← 3 4 5 ⋄ a b c   <=> 3 4 5
        # (a b c) ← 6     ⋄ a b c   <=> 6 6 6
        # (a b c) ← 7 8   ⋄ a b c   !!!
        # ((a b)c)←3(4 5) ⋄ a b c   <=> 3 3 (4 5)
        n = node.length - 1
        [SPL, n].concat (for child in node[1...] then renderLHS(child).concat POP)...
      when 'index' # index assignment
        v = node.scopeNode.vars._substitute
        axes = for c, i in node[2...] when c then i
        [].concat(
          (for c in node[2...] when c then render c)...
          VEC, axes.length
          render node[1]
          LDC, new APLArray axes
          VEC, 4, GET, v.scopeDepth, v.slot, MON
          renderLHS node[1]
        )
      else
        throw Error "Unrecognized node type for assignment, '#{node[0]}'"

  render ast

prelude = execInternal(
  macro -> macro.valToNode macro.require('fs').readFileSync macro.file.replace(/[^\/]+$/, 'prelude.apl'), 'utf8'
  ctx: vocabulary
)

aplify = (x) ->
  if typeof x is 'string' then (if x.length is 1 then APLArray.scalar x else new APLArray x)
  else if typeof x is 'number' then APLArray.scalar x
  else if x instanceof Array
    new APLArray(for y in x then (y = aplify y; if not y.shape.length then y.unwrap() else y))
  else if x instanceof APLArray then x
  else throw Error 'Cannot aplify object ' + x
