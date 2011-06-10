#!/usr/bin/env apl

# Langton's ant

# It lives in an infinite boolean matrix and has a position and a direction
# (north, south, east, or west).  At every step the ant:
#   * turns left or right depending on whether the occupied cell is true or false
#   * inverts the value of the occupied cell
#   * moves one cell forward

# In this program, we use a finite matrix with torus topology, and we keep the
# ant in the centre, pointing upwards (north), rotating the whole matrix
# instead.

m ← 5
n ← 1+2×m

A0 ← (−m) ⊖ (−m) ⌽ n n ↑ 1 1 ⍴ 1
next ← {0≠A0−¯1⊖⌽[⍵[m;m]]⍉⍵}

next10 ← {next next next next next next next next next next ⍵}
next100 ← {next10 next10 next10 next10 next10 next10 next10 next10 next10 next10 ⍵}
⎕ ← ' X'[next100 next100 next100 A0]
