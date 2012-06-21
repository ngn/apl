#!/usr/bin/env apl

⍝ Sierpinski's triangle

⍝ It's a recursively defined figure.
⍝ We will use the following definition:
⍝
⍝   * the Sierpinski triangle of rank 0 is a one-by-one matrix 'X'
⍝
⍝   * if S is the triangle of rank n, then rank n+1 would be
⍝     the two-dimensional catenation:
⍝             S 0
⍝             S S
⍝     where "0" is an all-blank matrix same size as S.

f←{(⍵,(⍴⍵)⍴0)⍪⍵,⍵}
⎕←' X'[(f⍣4) 1 1 ⍴ 1]
