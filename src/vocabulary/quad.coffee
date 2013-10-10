macro -> macro.fileToNode 'src/macros.coffee'
{format} = require './format'
{APLArray} = require '../array'

@vocabulary =

  'get_⎕': ->
    if typeof window?.prompt is 'function'
      new APLArray(prompt('⎕:') or '')
    else
      throw Error 'Reading from ⎕ is not implemented.'

  'set_⎕': (x) ->
    s = format(x).join('\n') + '\n'
    if typeof window?.alert is 'function'
      window.alert s
    else
      process.stdout.write s
    x

  'get_⍞': ->
    if typeof window?.prompt is 'function'
      prompt('') or ''
    else
      throw Error 'Reading from ⍞ is not implemented.'

  'set_⍞': (x) ->
    s = format(x).join '\n'
    if typeof window?.alert is 'function'
      window.alert s
    else
      process.stdout.write s
    x
