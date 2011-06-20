#!/usr/bin/env coffee

# This file should be run every time modifications are made to it---it
# generates `../lib/parser.js`.

grammar = lex: {rules: []}, bnf: {}

# `t` declares a terminal symbol
t = (name, regex) ->
  grammar.lex.rules.push [
    regex.source,
    name and "return #{JSON.stringify name}"
  ]

# `nt` declares a non-terminal symbol
nt = (name, alternatives) -> grammar.bnf[name] = alternatives

# `o` declares an alternative in the BNF for a non-terminal
o = (args...) -> args



# # Terminals
t '', /[ \t]+/ # skip whitespace
t '', /[⍝#].*/ # skip comments
t 'SEPARATOR', /[\n\r◇]/

t 'NUMBER', ///
  ¯?                             # optional negation
  (?:
    0[xX][\da-fA-F]+             # hexadecimal
    | \d*\.?\d+(?:[eE][+¯]?\d+)? # possibly scientific notation
  )
  (?:
    [jJ]                         # imaginary part for complex numbers
    ¯?
    (?:
      0[xX][\da-fA-F]+
      | \d*\.?\d+(?:[eE][+¯]?\d+)?
    )
  ) ?
///

t 'STRING', /(?:'[^\\']*(?:\\.[^\\']*)*')+/
t 'STRING', /(?:"[^\\"]*(?:\\.[^\\"]*)*")+/
t '[', /\[/
t ']', /\]/
t ';', /;/
t '(', /\(/
t ')', /\)/
t '{', /\{/
t '}', /\}/
t ':', /:/
t 'ARROW', /←/
t 'EMBEDDED', /«[^»]*»/
t 'SYMBOL', /∘./
t 'SYMBOL', /⎕?[A-Za-z_][A-Za-z_0-9]*/
t 'SYMBOL', /[^¯'":«»]/
t 'EOF', /$/



# # Non-terminals
nt 'root', [
  o 'body EOF',                  "return $1"
]

nt 'body', [
  o '',                          "$$ = ['body']"
  o 'guard',                     "$$ = ['body', $1]"
  o 'body SEPARATOR',            "$$ = $1"
  o 'body SEPARATOR guard',      "($$ = $1).push($3)"
]

nt 'guard', [
  o 'expr',                      "$$ = $1"
  o 'expr : expr',               "$$ = ['guard', $1, $3]"
]

nt 'expr', [
  o 'sequence',                  "$$ = $1"
  o 'assignment',                "$$ = $1"
  o 'sequence assignment',       "($$ = $1).push($2)"
]

nt 'assignment', [
  o 'SYMBOL ARROW expr',         "$$ = ['assign', $1, $3]"
]

nt 'sequence', [
  o 'item',                      "$$ = ['seq', $1]"
  o 'sequence item',             "($$ = $1).push($2)"
]

nt 'item', [
  o 'indexable',                 "$$ = $1"
  o "indexable [ indices ]",     "$$ = ['index', $1].concat($3)"
]

nt 'indices', [
  o 'expr',                      "$$ = [$1]"
  o "indices ; expr",            "($$ = $1).push($3)"
]

nt 'indexable', [
  o 'NUMBER',                    "$$ = ['num', $1]"
  o 'STRING',                    "$$ = ['str', $1]"
  o 'SYMBOL',                    "$$ = ['sym', $1]"
  o 'EMBEDDED',                  "$$ = ['embedded', $1]"
  o "( expr )",                  "$$ = $2"
  o "{ body }",                  "$$ = ['lambda', $2]"
]



# Generate parser.js
{Parser} = require 'jison'
fs = require 'fs'
fs.writeFileSync '../lib/parser.js', new Parser(grammar).generate()
