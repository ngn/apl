{APLArray} = require '../array'
{assert} = require '../helpers'

# Each (`¨`)
#
#     ⍴¨ (0 0 0 0) (0 0 0)                 ⍝ returns (,4) (,3)
#     ⍴¨ "MONDAY" "TUESDAY"                ⍝ returns (,6) (,7)
#     ⍴    (2 2⍴⍳4) (⍳10) 97.3 (3 4⍴"K")   ⍝ returns ,4
#     ⍴¨   (2 2⍴⍳4) (⍳10) 97.3 (3 4⍴"K")   ⍝ returns (2 2) (,10) ⍬ (3 4)
#     ⍴⍴¨  (2 2⍴⍳4) (⍳10) 97.3 (3 4⍴"K")   ⍝ returns ,4
#     ⍴¨⍴¨ (2 2⍴⍳4) (⍳10) 97.3 (3 4⍴"K")   ⍝ returns (,2) (,1) (,0) (,2)
#     (1 2 3) ,¨ 4 5 6                     ⍝ returns (1 4) (2 5) (3 6)
#     2 3 ↑¨ 'MONDAY' 'TUESDAY'            ⍝ returns 'MO' 'TUE'
#     2 ↑¨ 'MONDAY' 'TUESDAY'              ⍝ returns 'MO' 'TU'
#     2 3 ⍴¨ 1 2                           ⍝ returns (1 1) (2 2 2)
#     4 5 ⍴¨ "THE" "CAT"                   ⍝ returns 'THET' 'CATCA'
#     {1+⍵⋆2}¨ 2 3 ⍴ ⍳ 6                   ⍝ returns 2 3 ⍴ 1 2 5 10 17 26
@['¨'] = (f, g) ->
  assert typeof f is 'function'
  assert typeof g is 'undefined'
  (omega, alpha) ->
    if not alpha
      omega.map (x) ->
        if not (x instanceof APLArray) then x = new APLArray [x], []
        r = f x
        assert r instanceof APLArray
        if r.shape.length is 0 then r.unbox() else r
    else if arrayEquals alpha.shape, omega.shape
      omega.map2 alpha, (x, y) ->
        if not (x instanceof APLArray) then x = new APLArray [x], []
        if not (y instanceof APLArray) then y = new APLArray [y], []
        r = f x, y
        assert r instanceof APLArray
        if r.shape.length is 0 then r.unbox() else r
    else if alpha.isSingleton()
      omega.map (x) ->
        if not (x instanceof APLArray) then x = new APLArray [x], []
        r = f x, alpha
        assert r instanceof APLArray
        if r.shape.length is 0 then r.unbox() else r
    else if omega.isSingleton()
      alpha.map (x) ->
        if not (x instanceof APLArray) then x = new APLArray [x], []
        r = f omega, x
        assert r instanceof APLArray
        if r.shape.length is 0 then r.unbox() else r
    else
      throw Error 'LENGTH ERROR'

arrayEquals = (a, b) ->
  assert a instanceof Array
  assert b instanceof Array
  if a.length isnt b.length then return false
  for x, i in a when x isnt b[i] then return false
  true
