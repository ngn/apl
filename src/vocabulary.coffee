{assert, prod, repeat} = require './helpers'
{APLArray} = require './array'
{Complex} = require './complex'
{pervasive, numeric, match} = require './vocabulary/vhelpers'

@['⎕aplify'] = (x) ->
  assert x?
  if typeof x is 'string'
    if x.length is 1
      APLArray.scalar x
    else
      new APLArray x
  else if typeof x is 'number'
    APLArray.scalar x
  else if x instanceof Array
    new APLArray(
      for y in x
        if y instanceof APLArray and y.shape.length is 0 then y.unbox() else y
    )
  else if x instanceof APLArray
    x
  else
    throw Error 'Cannot aplify object ' + x

@['⎕complex'] = (re, im) ->
  APLArray.scalar new Complex re, im

@['⎕bool'] = (x) ->
  assert x instanceof APLArray
  if not x.isSingleton() then throw Error 'LENGTH ERROR'
  r = x.unbox()
  if r not in [0, 1] then throw Error 'DOMAIN ERROR: cannot convert to boolean: ' + r
  r

@['+'] = require('./vocabulary/arithmetic')['+']
@['−'] = require('./vocabulary/arithmetic')['−']
@['×'] = require('./vocabulary/arithmetic')['×']
@['÷'] = require('./vocabulary/arithmetic')['÷']
@['⋆'] = require('./vocabulary/arithmetic')['⋆']
@['⍟'] = require('./vocabulary/arithmetic')['⍟']
@['∣'] = require('./vocabulary/arithmetic')['∣']

@['='] = pervasive dyad: (y, x) -> +(x is y)
@['≠'] = pervasive dyad: (y, x) -> +(x isnt y)
@['<'] = pervasive dyad: numeric (y, x) -> +(x < y)
@['>'] = pervasive dyad: numeric (y, x) -> +(x > y)
@['≤'] = pervasive dyad: numeric (y, x) -> +(x <= y)
@['≥'] = pervasive dyad: numeric (y, x) -> +(x >= y)

@['⌊'] = require('./vocabulary/floorceil')['⌊']
@['⌈'] = require('./vocabulary/floorceil')['⌈']
@['?'] = require('./vocabulary/question')['?']
@['!'] = require('./vocabulary/exclamation')['!']
@['○'] = require('./vocabulary/circle')['○']

@['≡'] = (omega, alpha) ->
  if alpha
    APLArray.bool[+match omega, alpha]
  else
    throw Error 'Not implemented'

@[','] = (omega, alpha) ->
  if alpha
    shape = alpha.toArray()
    throw Error 'Not implemented'
  else
    new APLArray omega.toArray()

@['⍴'] = require('./vocabulary/rho')['⍴']
@['⍳'] = require('./vocabulary/iota')['⍳']
@['⌽'] = require('./vocabulary/rotate')['⌽']
@['⊖'] = require('./vocabulary/rotate')['⊖']
@['⍉'] = require('./vocabulary/transpose')['⍉']

@['∈'] = require('./vocabulary/epsilon')['∈']

# [Commute](http://www.jsoftware.com/papers/opfns1.htm#3) (`⍨`)
#
# Definition: `x f⍨ y  <->  y f x`
#
#     17 −⍨ 23    ⍝ returns 6
#     7 ⍴⍨ 2 3    ⍝ returns 2 3⍴7
#     −⍨ 123      ⍝ returns ¯123
@['⍨'] = (f) ->
  assert typeof f is 'function'
  (omega, alpha, axis) ->
    if alpha then f alpha, omega, axis else f omega, undefined, axis
(@['⍨'].aplMetaInfo ?= {}).isPostfixAdverb = true

@['get_⍬'] = -> APLArray.zilde
@['set_⎕'] = console.info

do =>
  for k, v of @ when typeof v is 'function'
    v.aplName = k
