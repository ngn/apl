# A pre-processor for CoffeeScript
#
# Compiles APL fragments to JavaScript literals (surrounded by backquotes)
if typeof define isnt 'function' then define = require('amdefine')(module)

define ->
  {compile} = require './compiler'

  preprocess: (code, ctx) ->

    # Compile fragments delimited by `«»`
    code = code.replace /«([^»]*)»/g, (_1, fragment) ->
      "`(require('apl')(function () {#{
        compile(fragment, extraContext: ctx).jsOutput
      }}))`"

    # Compile bodies of squiggly arrow funtions (`~>`)
    lines = code.split '\n'
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
          #{compile(fragment, extraContext: ctx).jsOutput}
        })`"]
      i++
    lines.join '\n'
