macro -> macro.fileToNode 'src/macros.coffee'
{APLArray} = require '../array'
{LengthError} = require '../errors'
{adverb} = require './vhelpers'

@vocabulary =

  # Each (`¨`)
  #
  # ⍴¨ (0 0 0 0) (0 0 0)               <=> (,4) (,3)
  # ⍴¨ "MONDAY" "TUESDAY"              <=> (,6) (,7)
  # ⍴    (2 2⍴⍳4) (⍳10) 97.3 (3 4⍴"K") <=> ,4
  # ⍴¨   (2 2⍴⍳4) (⍳10) 97.3 (3 4⍴"K") <=> (2 2) (,10) ⍬ (3 4)
  # ⍴⍴¨  (2 2⍴⍳4) (⍳10) 97.3 (3 4⍴"K") <=> ,4
  # ⍴¨⍴¨ (2 2⍴⍳4) (⍳10) 97.3 (3 4⍴"K") <=> (,2) (,1) (,0) (,2)
  # (1 2 3) ,¨ 4 5 6                   <=> (1 4) (2 5) (3 6)
  # 2 3 ↑¨ 'MONDAY' 'TUESDAY'          <=> 'MO' 'TUE'
  # 2 ↑¨ 'MONDAY' 'TUESDAY'            <=> 'MO' 'TU'
  # 2 3 ⍴¨ 1 2                         <=> (1 1) (2 2 2)
  # 4 5 ⍴¨ "THE" "CAT"                 <=> 'THET' 'CATCA'
  # {1+⍵*2}¨ 2 3 ⍴ ⍳ 6                 <=> 2 3 ⍴ 1 2 5 10 17 26
  '¨': adverb (f, g) ->
    assert typeof f is 'function'
    assert typeof g is 'undefined'
    (omega, alpha) ->
      if not alpha
        omega.map (x) ->
          if not (x instanceof APLArray) then x = new APLArray [x], []
          r = f x
          assert r instanceof APLArray
          if r.shape.length is 0 then r.unwrap() else r
      else if arrayEquals alpha.shape, omega.shape
        omega.map2 alpha, (x, y) ->
          if not (x instanceof APLArray) then x = new APLArray [x], []
          if not (y instanceof APLArray) then y = new APLArray [y], []
          r = f x, y
          assert r instanceof APLArray
          if r.shape.length is 0 then r.unwrap() else r
      else if alpha.isSingleton()
        y = if alpha.data[0] instanceof APLArray then alpha.unwrap() else alpha
        omega.map (x) ->
          if not (x instanceof APLArray) then x = new APLArray [x], []
          r = f x, y
          assert r instanceof APLArray
          if r.shape.length is 0 then r.unwrap() else r
      else if omega.isSingleton()
        x = if omega.data[0] instanceof APLArray then omega.unwrap() else omega
        alpha.map (y) ->
          if not (y instanceof APLArray) then y = new APLArray [y], []
          r = f x, y
          assert r instanceof APLArray
          if r.shape.length is 0 then r.unwrap() else r
      else
        throw LengthError()

arrayEquals = (a, b) ->
  assert a instanceof Array
  assert b instanceof Array
  if a.length isnt b.length then return false
  for x, i in a when x isnt b[i] then return false
  true
