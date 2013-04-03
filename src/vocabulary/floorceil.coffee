{pervasive, numeric} = require './vhelpers'

@['⌊'] = pervasive

  # Floor (`⌊`)
  #
  #     ⌊ 123   ⍝ returns 123
  #     ⌊ 12.3  ⍝ returns 12
  #     ⌊ ¯12.3 ⍝ returns ¯13
  #     ⌊ ¯123  ⍝ returns ¯123
  #     ⌊ 'a'   ⍝ throws
  #     ⌊ 12j3  ⍝ throws
  #     ⌊ 0 5 ¯5 (○1) ¯1.5   ⍝ returns 0 5 ¯5 3 ¯2
  monad: numeric Math.floor

  # Lesser of (`⌊`)
  #
  #     3 ⌊ 5   ⍝ returns 3
  dyad: numeric (y, x) -> Math.min y, x

@['⌈'] = pervasive

  # Ceiling (`⌈`)
  #
  #     ⌈ 123   ⍝ returns 123
  #     ⌈ 12.3  ⍝ returns 13
  #     ⌈ ¯12.3 ⍝ returns ¯12
  #     ⌈ ¯123  ⍝ returns ¯123
  #     ⌈ 'a'   ⍝ throws
  #     ⌈ 12j3  ⍝ throws
  #     ⌈ 0 5 ¯5 (○1) ¯1.5   ⍝ returns 0 5 ¯5 4 ¯1
  monad: numeric Math.ceil

  # Greater of (`⌈`)
  #
  #     3 ⌈ 5   ⍝ returns 5
  dyad: numeric (y, x) -> Math.max y, x
