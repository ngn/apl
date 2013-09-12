#!/usr/bin/env apl

⍝ Conway's game of life

⍝ This example was inspired by the impressive demo at
⍝ http://www.youtube.com/watch?v=a9xAKttWgP4

⍝ Create a matrix:
⍝     0 1 1
⍝     1 1 0
⍝     0 1 0
creature ← (3 3 ⍴ ⍳ 9) ∊ 1 2 3 4 7   ⍝ Original creature from demo
creature ← (3 3 ⍴ ⍳ 9) ∊ 1 3 6 7 8   ⍝ Glider

⍝ Place the creature on a larger board, near the centre
board ← ¯1 ⊖ ¯2 ⌽ 5 7 ↑ creature

⍝ A function to move from one generation to the next
life ← {⊃1 ⍵ ∨.∧ 3 4 = +/ +⌿ 1 0 ¯1 ∘.⊖ 1 0 ¯1 ⌽¨ ⊂⍵}

⍝ Compute n-th generation and format it as a
⍝ character matrix
gen ← {' #'[(life ⍣ ⍵) board]}

⍝ Show first three generations
⎕ ← (gen 1) (gen 2) (gen 3)
