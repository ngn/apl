fs = require 'fs'
{exec} = require './interpreter'
{builtins} = require './builtins'
{inherit} = require './helpers'

exports.main = ->
  filename = process.argv[2] or '-'

  if filename in ['-h', '-help', '--help']
    process.stderr.write '''
      Usage: apl [ FILENAME [ ARGS... ] ]
      If "FILENAME" is "-" or not present, APL source code will be read from stdin.\n
    ''', -> process.exit 0
    return

  if filename is '-'
    input = process.stdin
    input.resume()
    input.setEncoding 'utf8'
  else
    input = fs.createReadStream filename

  code = ''
  input.on 'data', (chunk) -> code += chunk
  input.on 'end', ->
    ctx = inherit builtins
    ctx['⍵'] = for a in process.argv then a.split ''
    exec code, ctx
