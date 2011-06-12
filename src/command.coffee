fs = require 'fs'
{exec} = require './interpreter'

exports.main = ->
  if process.argv.length > 3
    process.stderr.write 'Usage: apl [filename]\n', -> process.exit 0
    return
  else if process.argv.length is 3
    input = fs.createReadStream process.argv[2]
  else
    input = process.stdin
    input.resume()
    input.setEncoding 'utf8'

  code = ''
  input.on 'data', (chunk) -> code += chunk
  input.on 'end', -> exec code
