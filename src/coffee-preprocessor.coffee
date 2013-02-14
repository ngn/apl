# A pre-processor for CoffeeScript
#
# Compiles APL fragments to JavaScript literals (surrounded by backquotes)
if typeof define isnt 'function' then define = require('amdefine')(module)

define ->
  {compile} = require './compiler'
  {inherit} = require './helpers'

  preprocess: (coffeeCode) ->

    # # Step 1

    # Collect APL fragments and replace them with placeholders of the form
    # `` `@123` ``, where `123` is the fragment id.
    fragments = []

    # Collect fragments delimited by `«»`
    coffeeCode = coffeeCode.replace /«([^»]*)»/g, (_1, aplCode) ->
      fragments.push kind: 'expression', aplCode: aplCode
      "`@#{fragments.length - 1}`"

    # Collect bodies of squiggly arrow funtions (`~>`)
    lines = coffeeCode.split '\n'
    i = 0
    while i < lines.length
      if /~>$/.test lines[i]
        indent = lines[i].replace /^([ \t]*).*$/, '$1'
        indentRE = new RegExp '^' + indent.replace(/\t/g, '\\t') + '[ \\t]'
        j = i + 1
        while (j < lines.length and
               (/^[ \t]*([#⍝].*)?$/.test(lines[j]) or indentRE.test(lines[j])))
          j++
        fragments.push kind: 'function', aplCode: lines[i + 1 ... j].join('\n')
        lines[i...j] = [lines[i].replace /~>$/, "`@#{fragments.length - 1}`"]
      i++
    coffeeCode = lines.join '\n'

    # # Step 2

    # Walk the AST produced by CoffeeScript, record the variables used in each
    # scope, and associate each APL fragment with the `vars` of the closest
    # scope.

    ast = require('coffee-script').nodes coffeeCode
    ast.vars = {}
    queue = [ast]
    while queue.length
      scopeNode = queue.shift()
      scopeNode.traverseChildren false, (node) ->
        {name} = node.constructor
        if name is 'Code'
          node.vars = inherit scopeNode.vars
          queue.push node
        else if name is 'Literal' and m = node.value.match /^@(\d+)$/
          fragments[+m[1]].vars = scopeNode.vars
        else if name is 'Assign'
          if v = node.variable?.base?.value
            scopeNode.vars[v] = {type: 'X', jsCode: v}
        true

    # # Step 3

    # Replace each placeholder with the compiled code for the corresponding
    # fragment.
    coffeeCode.replace /`@(\d+)`/g, (_1, id) ->
      f = fragments[+id]
      jsCode = """(function () {
        var _ = require('apl').createGlobalContext();
        #{compile f.aplCode, extraVars: f.vars}
      })"""
      if f.kind is 'expression' then jsCode += '()'
      "`#{jsCode}`"
