{APLArray} = require '../array'
{assert} = require '../helpers'
{Complex} = require '../complex'
{match} = require './vhelpers'

@['⎕aplify'] = (x) ->
  assert x?
  if typeof x is 'string' then (if x.length is 1 then APLArray.scalar x else new APLArray x)
  else if typeof x is 'number' then APLArray.scalar x
  else if x instanceof Array
    new APLArray(
      for y in x
        if y instanceof APLArray and y.shape.length is 0 then y.unbox() else y
    )
  else if x instanceof APLArray then x
  else throw Error 'Cannot aplify object ' + x

@['⎕complex'] = (re, im) ->
  APLArray.scalar new Complex re, im

@['⎕bool'] = (x) ->
  assert x instanceof APLArray
  x.toBool()

# Index origin (`⎕IO`)
#
# The index origin is fixed at 0.  Reading it returns 0.  Attempts to set it
# to anything other than that fail.
#
#     ⎕IO     ⍝ returns 0
#     ⎕IO←0   ⍝ returns 0
#     ⎕IO←1   ⍝ throws
@['get_⎕IO'] = -> APLArray.zero
@['set_⎕IO'] = (x) ->
  if match x, APLArray.zero then x else throw Error 'The index origin (⎕IO) is fixed at 0'
