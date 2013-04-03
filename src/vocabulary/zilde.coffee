{APLArray} = require '../array'

# Zilde (`⍬`)
#
#     ⍬     ⍝ returns 0⍴0
#     ⍴⍬    ⍝ returns ,0
#     ⍬←5   ⍝ throws
#     ⍳ 0   ⍝ returns ⍬
#     ⍴ 0   ⍝ returns ⍬
#     ⍬     ⍝ returns ⍬
#     ⍬⍬    ⍝ returns ⍬ ⍬
#     1⍬2⍬3 ⍝ returns 1 ⍬ 2 ⍬ 3
@['get_⍬'] = -> APLArray.zilde
@['set_⍬'] = -> throw Error 'Symbol zilde (⍬) is read-only.'
