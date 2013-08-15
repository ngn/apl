#!/usr/bin/env apl
⍝ See https://en.wikipedia.org/wiki/Rule_30

rule ← 30
ruleSet ← ⌽(8/2)⊤rule
n ← 39 ⍝ number of rows to compute
row ← (n/0),1,n/0
table ← (0,⍴row)⍴0
{
    table ← table⍪row
    row ← ruleSet[(1⌽row)+(2×row)+4×¯1⌽row]
}¨⍳n
⎕ ← ' #'[table]
