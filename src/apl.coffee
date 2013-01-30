# This is the main entry point of the `apl` package.
#
# When calling `require('apl')` in node.js this is the file that will actually
# be required.

exports.getBuiltins = -> require('./builtins').builtins
