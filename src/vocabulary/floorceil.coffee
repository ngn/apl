macro -> macro.fileToNode 'src/macros.coffee'
{numeric, pervasive, real, withIdentity} = require './vhelpers'
{APLArray} = require '../array'
{Complex} = require '../complex'

@vocabulary =

  '⌊': withIdentity Infinity, pervasive

    # Floor (`⌊`)
    #
    # ⌊123   <=> 123
    # ⌊12.3  <=> 12
    # ⌊¯12.3 <=> ¯13
    # ⌊¯123  <=> ¯123
    # ⌊'a'   !!! DOMAIN ERROR
    # ⌊12j3      <=> 12j3
    # ⌊1.2j2.3   <=> 1j2
    # ⌊1.2j¯2.3  <=> 1j¯3
    # ⌊¯1.2j2.3  <=> ¯1j2
    # ⌊¯1.2j¯2.3 <=> ¯1j¯3
    # ⌊0 5 ¯5 (○1) ¯1.5   <=> 0 5 ¯5 3 ¯2
    monad: Complex.floor

    # Lesser of (`⌊`)
    #
    # 3⌊5 <=> 3
    # ⌊/⍬ <=> ¯
    dyad: real (y, x) -> Math.min y, x

  '⌈': withIdentity -Infinity, pervasive

    # Ceiling (`⌈`)
    #
    # ⌈123   <=> 123
    # ⌈12.3  <=> 13
    # ⌈¯12.3 <=> ¯12
    # ⌈¯123  <=> ¯123
    # ⌈'a'   !!! DOMAIN ERROR
    # ⌈12j3      <=> 12j3
    # ⌈1.2j2.3   <=> 1j3
    # ⌈1.2j¯2.3  <=> 1j¯2
    # ⌈¯1.2j2.3  <=> ¯1j3
    # ⌈¯1.2j¯2.3 <=> ¯1j¯2
    # ⌈0 5 ¯5 (○1) ¯1.5 <=> 0 5 ¯5 4 ¯1
    monad: Complex.ceil

    # Greater of (`⌈`)
    #
    # 3⌈5 <=> 5
    # ⌈/⍬ <=> ¯¯
    dyad: real (y, x) -> Math.max y, x
