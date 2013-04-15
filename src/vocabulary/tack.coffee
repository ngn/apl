{APLArray} = require '../array'

# Left (`⊣`)
#
#     123⊣456 ⍝ returns 123
#     ⊣456 ⍝ returns ⍬
@['⊣'] = (omega, alpha = APLArray.zilde) -> alpha

# Left (`⊢`)
#
#     123⊢456 ⍝ returns 456
#     ⊢456 ⍝ returns 456
@['⊢'] = (omega) -> omega
