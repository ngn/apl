addVocabulary

  '~': pervasive
    # ~0 1 ←→ 1 0
    # ~2   !!! DOMAIN ERROR
    monad: (x) -> +!bool x

  '∨': withIdentity 0, pervasive
    # 1∨1               ←→ 1
    # 1∨0               ←→ 1
    # 0∨1               ←→ 1
    # 0∨0               ←→ 0
    # 0 0 1 1 ∨ 0 1 0 1 ←→ 0 1 1 1
    # 12∨18             ←→ 6 ⍝ 12=2×2×3, 18=2×3×3
    # 299∨323           ←→ 1 ⍝ 299=13×23, 323=17×19
    # 12345∨12345       ←→ 12345
    # 0∨123             ←→ 123
    # 123∨0             ←→ 123
    # ∨/⍬               ←→ 0
    # ¯12∨18            ←→ 6
    # 12∨¯18            ←→ 6
    # ¯12∨¯18           ←→ 6
    # 1.5∨2.5           !!! DOMAIN ERROR
    # 'a'∨1             !!! DOMAIN ERROR
    # 1∨'a'             !!! DOMAIN ERROR
    # 'a'∨'b'           !!! DOMAIN ERROR
    # 135j¯14∨155j34    ←→ 5j12
    # 2 3 4∨0j1 1j2 2j3 ←→ 1 1 1
    # 2j2 2j4∨5j5 4j4   ←→ 1j1 2
    dyad: (y, x) ->
      if (!Z.isint x) or (!Z.isint y)
        domainError '∨ is implemented only for Gaussian integers' # todo
      Z.gcd x, y

  '∧': withIdentity 1, pervasive
    # 1∧1                            ←→ 1
    # 1∧0                            ←→ 0
    # 0∧1                            ←→ 0
    # 0∧0                            ←→ 0
    # 0 0 1 1∧0 1 0 1                ←→ 0 0 0 1
    # 0 0 0 1 1∧1 1 1 1 0            ←→ 0 0 0 1 0
    # t←3 3⍴1 1 1 0 0 0 1 0 1 ⋄ 1∧t  ←→ 3 3 ⍴ 1 1 1 0 0 0 1 0 1
    # t←3 3⍴1 1 1 0 0 0 1 0 1 ⋄ ∧/t  ←→ 1 0 0
    # 12∧18   # 12=2×2×3, 18=2×3×3   ←→ 36
    # 299∧323 # 299=13×23, 323=17×19 ←→ 96577
    # 12345∧12345                    ←→ 12345
    # 0∧123                          ←→ 0
    # 123∧0                          ←→ 0
    # ∧/⍬                            ←→ 1
    # ¯12∧18                         ←→ ¯36
    # 12∧¯18                         ←→ ¯36
    # ¯12∧¯18                        ←→ 36
    # 1.5∧2.5                        !!! DOMAIN ERROR
    # 'a'∧1                          !!! DOMAIN ERROR
    # 1∧'a'                          !!! DOMAIN ERROR
    # 'a'∧'b'                        !!! DOMAIN ERROR
    # 135j¯14∧155j34                 ←→ 805j¯1448
    # 2 3 4∧0j1 1j2 2j3              ←→ 0j2 3j6 8j12
    # 2j2 2j4∧5j5 4j4                ←→ 10j10 ¯4j12
    dyad: (y, x) ->
      if (!Z.isint x) or (!Z.isint y)
        domainError '∧ is implemented only for Gaussian integers' # todo
      Z.lcm x, y

  # 0⍱0 ←→ 1
  # 0⍱1 ←→ 0
  # 1⍱0 ←→ 0
  # 1⍱1 ←→ 0
  # 0⍱2 !!! DOMAIN ERROR
  '⍱': pervasive dyad: real (y, x) -> +!(bool(x) | bool(y))

  # 0⍲0 ←→ 1
  # 0⍲1 ←→ 1
  # 1⍲0 ←→ 1
  # 1⍲1 ←→ 0
  # 0⍲2 !!! DOMAIN ERROR
  '⍲': pervasive dyad: real (y, x) -> +!(bool(x) & bool(y))
