{assert} = require '../helpers'
{APLArray} = require '../array'
{withIdentity} = require './vhelpers'

# Identity operator (`⍁`)
#
# f←{⍺+2×⍵} ⋄ f/⍬           !!! DOMAIN ERROR
# f←{⍺+2×⍵} ⋄ (f⍁123)/⍬     <=> 123
# f←{⍺+2×⍵} ⋄ (456⍁f)/⍬     <=> 456
# f←{⍺+2×⍵} ⋄ g←f⍁789 ⋄ f/⍬ !!! DOMAIN ERROR
@['⍁'] = (f, x) ->
  if f instanceof APLArray then [f, x] = [x, f]
  assert typeof f is 'function'
  assert x instanceof APLArray
  withIdentity x, (omega, alpha, axis) -> f omega, alpha, axis
