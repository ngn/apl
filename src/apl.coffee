# This is the main entry point of the `apl` package.
#
# When calling `require('apl')` in node.js this is the file that will actually
# be required.

exports = module.exports = (f) ->
  if typeof f isnt 'function'
    {compile} = require './compiler'
    f = new Function compile(f).jsOutput
  f require('./builtins').builtins
