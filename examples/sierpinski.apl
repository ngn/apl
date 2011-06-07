#!/usr/bin/env apl
f←{(⍵,(⍴⍵)⍴0)⍪⍵,⍵}
⎕←f f f f 1 1 ⍴ 1
