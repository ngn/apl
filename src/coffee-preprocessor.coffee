# A pre-processor for CoffeeScript
#
# Compiles APL fragments to JavaScript literals (surrounded by backquotes)
if typeof define isnt 'function' then define = require('amdefine')(module)

define ->
  {compile} = require './compiler'

  preprocess: (coffeeCode) ->

    # # Step 1

    # Collect APL fragments and replace them with placeholders of the form
    # `` `@123` ``, where `123` is the fragment id.
    fragments = []

    # Collect fragments delimited by `«»`
    coffeeCode = coffeeCode.replace /«([^»]*)»/g, (_1, aplCode) ->
      fragments.push(
        kind: 'expression'
        aplCode: aplCode
      )
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
        fragments.push(
          kind: 'function'
          aplCode: lines[i + 1 ... j].join('\n')
        )
        lines[i...j] = [lines[i].replace /~>$/, "`@#{fragments.length - 1}`"]
      i++
    coffeeCode = lines.join '\n'

    # # Step 2

    # Replace each placeholder with the compiled code for the corresponding
    # fragment.
    coffeeCode.replace /`@(\d+)`/g, (_1, id) ->
      f = fragments[+id]
      jsCode = """(function () {
        var _ = require('apl').createGlobalContext();
        #{compile f.aplCode}
      })"""
      if f.kind is 'expression' then jsCode += '()'
      "`#{jsCode}`"
