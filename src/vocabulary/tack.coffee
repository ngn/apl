{APLArray} = require '../array'

# Left (`⊣`)
#
# 123⊣456 <=> 123
# ⊣456 <=> ⍬
@['⊣'] = (omega, alpha = APLArray.zilde) -> alpha

# Left (`⊢`)
#
# 123⊢456 <=> 456
# ⊢456 <=> 456
@['⊢'] = (omega) -> omega
