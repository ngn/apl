fs = require 'fs'
{exec} = require './interpreter'
{builtins} = require './builtins'
{inherit, cps, trampoline, isSimple, shapeOf, sum, prod, repeat} = require './helpers'

format = (a) -> format0(a).join '\n'

format0 = (a) -> # todo: handle 3+ dimensional arrays properly
  if typeof a is 'undefined' then ['<<UNDEFINED>>']
  else if a is null then ['<<NULL>>']
  else if typeof a is 'string' then [a]
  else if typeof a is 'number' then [if a < 0 then '¯' + (-a) else '' + a]
  else if isSimple a then ['' + a]
  else
    if a.length is 0 then return [',-.', '| |', "`-'"] # empty array
    sa = shapeOf a
    nc = if sa.length is 0 then 1 else sa[sa.length - 1]
    nr = a.length / nc
    h = for [0...nr] then 0 # row heights
    w = for [0...nc] then 0 # column widths
    boxes =
      for r in [0...nr]
        for c in [0...nc]
          box = format0 a[r * nc + c]
          h[r] = Math.max h[r], box.length
          w[c] = Math.max w[c], box[0].length
          box
    bigWidth = nc - 1 + sum w # from border to border, excluding the borders
    result = [TOPLFT + repeat(TOP, bigWidth) + TOPRGT]
    for r in [0...nr]
      for c in [0...nc]
        vpad boxes[r][c], h[r]
        hpad boxes[r][c], w[c]
      for i in [0...h[r]]
        s = ''; for c in [0...nc] then s += ' ' + boxes[r][c][i]
        result.push LFT + s[1...] + RGT
    result.push BTMLFT + repeat(BTM, bigWidth) + BTMRGT
    result

hpad = (box, width) -> # horizontally extend a box (a box is a list of same-length strings)
  if box[0].length < width
    padding = repeat ' ', width - box[0].length
    for i in [0...box.length] then box[i] += padding
    0

vpad = (box, height) -> # vertically extend a box
  if box.length < height
    padding = repeat ' ', box[0].length
    for i in [box.length...height] then box.push padding
    0

# Graphics symbols for the surrounding border:

# (An idea: these can be used to surrond arrays at different depths;
# arrays with a deeper structure would have thicker borders.)

#[TOP, BTM, LFT, RGT, TOPLFT, TOPRGT, BTMLFT, BTMRGT] = "--||,.`'"
[TOP, BTM, LFT, RGT, TOPLFT, TOPRGT, BTMLFT, BTMRGT] = "──││┌┐└┘"
#[TOP, BTM, LFT, RGT, TOPLFT, TOPRGT, BTMLFT, BTMRGT] = "──││╭╮╰╯"
#[TOP, BTM, LFT, RGT, TOPLFT, TOPRGT, BTMLFT, BTMRGT] = "━━┃┃┏┓┗┛"
#[TOP, BTM, LFT, RGT, TOPLFT, TOPRGT, BTMLFT, BTMRGT] = "▄▀▐▌▗▖▝▘"
#[TOP, BTM, LFT, RGT, TOPLFT, TOPRGT, BTMLFT, BTMRGT] = "▀▄▌▐▛▜▙▟"
#[TOP, BTM, LFT, RGT, TOPLFT, TOPRGT, BTMLFT, BTMRGT] = "▓▓▓▓▓▓▓▓"
#[TOP, BTM, LFT, RGT, TOPLFT, TOPRGT, BTMLFT, BTMRGT] = "████████"



createGetline = (input) ->
  buf = ''
  callbacks = []

  feedCallbacks = ->
    loop
      i = buf.indexOf '\n'
      if i is -1 or not callbacks.length then break
      s = buf[...i]
      buf = buf[i + 1 ...]
      trampoline -> callbacks.shift() null, s.split ''

  input.on 'data', (chunk) -> buf += chunk; feedCallbacks(); 0
  (callback) -> callbacks.push callback; feedCallbacks(); 0



exports.main = ->
  filename = process.argv[2] or '-'

  if filename in ['-h', '-help', '--help']
    process.stderr.write '''
      Usage: apl [ FILENAME [ ARGS... ] ]
      If "FILENAME" is "-" or not present, APL source code will be read from stdin.\n
    '''
    return

  process.stdin.resume()
  process.stdin.setEncoding 'utf8'
  if filename is '-'
    input = process.stdin
    getline = (callback) -> trampoline -> callback Error 'Symbols ⎕ and ⍞ cannot be read when APL source code is read from stdin.'
  else
    input = fs.createReadStream filename
    getline = createGetline process.stdin

  code = ''
  input.on 'data', (chunk) -> code += chunk
  input.on 'end', ->

    ctx = inherit builtins

    ctx['⍵'] = for a in process.argv then a.split ''

    ctx['get_⎕'] = cps (_, _, _, callback) -> -> getline callback

    ctx['set_⎕'] = cps (x, _, _, callback) ->
      -> process.stdout.write format(x) + '\n', (err) -> trampoline ->
        if err then return -> callback err
        -> callback null, 0

    exec code, ctx, (err) -> if err then throw err else process.exit 0
