{numeric, pervasive, real, withIdentity} = require './vhelpers'
{APLArray} = require '../array'
{simplify} = require '../complex'

@vocabulary =

  '⌊': withIdentity new APLArray([Infinity], []), pervasive

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
    monad: numeric Math.floor,
      (x) ->
        [re, im] = [(Math.floor x.re), (Math.floor x.im)]
        [r, i] = [x.re - re, x.im - im]
        if r + i >= 1
          if r >= i then re++ else im++
        simplify re, im

    # Lesser of (`⌊`)
    #
    # 3⌊5 <=> 3
    # ⌊/⍬ <=> ¯
    dyad: real (y, x) -> Math.min y, x

  '⌈': withIdentity new APLArray([-Infinity], []), pervasive

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
    monad: numeric Math.ceil,
      (x) ->
        [re, im] = [(Math.ceil x.re), (Math.ceil x.im)]
        [r, i] = [re - x.re, im - x.im]
        if r + i >= 1
          if r >= i then re-- else im--
        simplify re, im

    # Greater of (`⌈`)
    #
    # 3⌈5 <=> 5
    # ⌈/⍬ <=> ¯¯
    dyad: real (y, x) -> Math.max y, x
