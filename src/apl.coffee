# This is the main entry point of the `apl` package.
#
# When calling `require('apl')` in node.js this is the file that will actually
# be required.


exports = module.exports = (aplSource) ->
  require('./compiler').exec aplSource

exports.createGlobalContext = ->
  require('./helpers').inherit require('./builtins').builtins

exports.compile = require('./compiler').compile
