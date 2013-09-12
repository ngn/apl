{assert} = require '../helpers'

# Composition operator (`∘`)
#
# (÷∘-)2     <=> ¯0.5
# 8(÷∘-)2    <=> ¯4
# ÷∘-2       <=> ¯0.5
# 8÷∘-2      <=> ¯4
# ⍴∘⍴2 3⍴⍳6  <=> ,2
# 3⍴∘⍴2 3⍴⍳6 <=> 2 3 2
# 3∘-1       <=> 2
# (-∘2)9     <=> 7
@['∘'] = (g, f) ->
  if typeof f is 'function'
    if typeof g is 'function'
      (omega, alpha) -> # f∘g
        f (g omega), alpha
    else
      (omega, alpha) -> # f∘B
        assert not alpha?
        f g, omega
  else
    assert typeof g is 'function'
    (omega, alpha) -> # A∘g
      assert not alpha?
      g omega, f
