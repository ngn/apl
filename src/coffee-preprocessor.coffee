# A pre-processor for CoffeeScript
#
# Compiles APL fragments to JavaScript literals (surrounded by backquotes)
if typeof define isnt 'function' then define = require('amdefine')(module)

define ->
  {compile} = require './compiler'

  preprocess: (coffeeCode) ->

    # Compile fragments delimited by `«»`
    coffeeCode = coffeeCode.replace /«([^»]*)»/g, (_1, fragment) ->
      "`(function () {
        var _ = require('apl').createGlobalContext();
        #{compile fragment}
      })()`"

    # Compile bodies of squiggly arrow funtions (`~>`)
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
        fragment = lines[i + 1 ... j].join '\n'
        lines[i...j] = [lines[i].replace /~>$/, "`(function () {
          var _ = require('apl').createGlobalContext();
          #{compile fragment}
        })`"]
      i++
    lines.join '\n'
