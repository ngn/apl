addVocabulary

  '⊃': (omega) ->
    # Disclose (`⊃`)
    #
    # ⊃(1 2 3)(4 5 6)   <=> 1 2 3
    # ⊃(1 2)(3 4 5)     <=> 1 2
    # ⊃'AB'             <=> 'A'
    # ⊃123              <=> 123
    # ⊃⍬                <=> 0
    #!    ⊃''               <=> ' '
    x = if omega.empty() then omega.getPrototype() else omega.data[omega.offset]
    if x instanceof APLArray then x else new APLArray [x], []
