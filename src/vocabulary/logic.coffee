macro -> macro.fileToNode 'src/macros.coffee'
{APLArray} = require '../array'
{RankError, DomainError} = require '../errors'
{real, pervasive, bool, match, withIdentity, aka} = require './vhelpers'
{isInt} = require '../helpers'
{Complex} = require '../complex'

@vocabulary =

  '~': (omega, alpha) ->
    if alpha

      # Without (`~`)
      #
      # "ABCDEFGHIJKLMNOPQRSTUVWXYZ"~"AEIOU" <=> 'BCDFGHJKLMNPQRSTVWXYZ'
      # 1 2 3 4 5 6 ~ 2 4 6                  <=> 1 3 5
      # "THIS IS TEXT" ~ " "                 <=> 'THISISTEXT'
      # "THIS" "AND" "THAT" ~ "T"            <=> 'THIS' 'AND' 'THAT'
      # "THIS" "AND" "THAT" ~ "AND"          <=> 'THIS' 'AND' 'THAT'
      # "THIS" "AND" "THAT" ~ ⊂"AND"         <=> 'THIS' 'THAT'
      # "THIS" "AND" "THAT" ~ "TH" "AND"     <=> 'THIS' 'THAT'
      #
      # 11 12 13 14 15 16 ~ 2 3⍴1 2 3 14 5 6 <=> 11 12 13 15 16
      if alpha.shape.length > 1
        throw RankError()
      data = []
      alpha.each (x) ->
        try
          omega.each (y) -> if match x, y then throw 'break'
          data.push x
        catch e
          if e isnt 'break' then throw e
      new APLArray data

    else

      # Not (`~`)
      #
      # ~0 1 <=> 1 0
      # ~2   !!! DOMAIN ERROR
      negate omega

  '∨': withIdentity 0, pervasive

    # Or (GCD) (`∨`)
    #
    # 1∨1               <=> 1
    # 1∨0               <=> 1
    # 0∨1               <=> 1
    # 0∨0               <=> 0
    # 0 0 1 1 ∨ 0 1 0 1 <=> 0 1 1 1
    # 12∨18             <=> 6   # 12=2×2×3, 18=2×3×3
    # 299∨323           <=> 1   # 299=13×23, 323=17×19
    # 12345∨12345       <=> 12345
    # 0∨123             <=> 123
    # 123∨0             <=> 123
    # ∨/⍬               <=> 0
    # ¯12∨18            <=> 6
    # 12∨¯18            <=> 6
    # ¯12∨¯18           <=> 6
    # 1.5∨2.5           !!! DOMAIN ERROR
    # 'a'∨1             !!! DOMAIN ERROR
    # 1∨'a'             !!! DOMAIN ERROR
    # 'a'∨'b'           !!! DOMAIN ERROR
    # 135j¯14∨155j34    <=> 5j12
    # 2 3 4∨0j1 1j2 2j3 <=> 1 1 1
    # 2j2 2j4∨5j5 4j4   <=> 1j1 2
    dyad: (y, x) ->
      if not (Complex.isint x) or not (Complex.isint y)
        throw DomainError '∨ is implemented only for Gaussian integers' # todo
      Complex.gcd x, y

  '∧': aka '^', withIdentity 1, pervasive

    # And (LCM) (`∧`)
    #
    # 1∧1                            <=> 1
    # 1∧0                            <=> 0
    # 0∧1                            <=> 0
    # 0∧0                            <=> 0
    # 0 0 1 1∧0 1 0 1                <=> 0 0 0 1
    # 0 0 0 1 1∧1 1 1 1 0            <=> 0 0 0 1 0
    # t←3 3⍴1 1 1 0 0 0 1 0 1 ⋄ 1∧t  <=> 3 3 ⍴ 1 1 1 0 0 0 1 0 1
    # t←3 3⍴1 1 1 0 0 0 1 0 1 ⋄ ∧/t  <=> 1 0 0
    # 12∧18   # 12=2×2×3, 18=2×3×3   <=> 36
    # 299∧323 # 299=13×23, 323=17×19 <=> 96577
    # 12345∧12345                    <=> 12345
    # 0∧123                          <=> 0
    # 123∧0                          <=> 0
    # ∧/⍬                            <=> 1
    # ¯12∧18                         <=> ¯36
    # 12∧¯18                         <=> ¯36
    # ¯12∧¯18                        <=> 36
    # 1.5∧2.5                        !!! DOMAIN ERROR
    # 'a'∧1                          !!! DOMAIN ERROR
    # 1∧'a'                          !!! DOMAIN ERROR
    # 'a'∧'b'                        !!! DOMAIN ERROR
    # 135j¯14∧155j34                 <=> 805j¯1448
    # 2 3 4∧0j1 1j2 2j3              <=> 0j2 3j6 8j12
    # 2j2 2j4∧5j5 4j4                <=> 10j10 ¯4j12
    dyad: (y, x) ->
      if not (Complex.isint x) or not (Complex.isint y)
        throw DomainError '∧ is implemented only for Gaussian integers' # todo
      Complex.lcm x, y

  # Nor (`⍱`)
  #
  # 0⍱0 <=> 1
  # 0⍱1 <=> 0
  # 1⍱0 <=> 0
  # 1⍱1 <=> 0
  # 0⍱2 !!! DOMAIN ERROR
  '⍱': pervasive dyad: real (y, x) -> +!(bool(x) | bool(y))

  # Nand (`⍲`)
  #
  # 0⍲0 <=> 1
  # 0⍲1 <=> 1
  # 1⍲0 <=> 1
  # 1⍲1 <=> 0
  # 0⍲2 !!! DOMAIN ERROR
  '⍲': pervasive dyad: real (y, x) -> +!(bool(x) & bool(y))

negate = pervasive monad: (x) -> +not bool x
