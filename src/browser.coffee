# This file will only be sourced when APL is used in a browser environment.

{builtins} = require './builtins'
{inherit} = require './helpers'

exports.browserBuiltins = ctx = inherit builtins
ctx['⍵'] = ('' + location).split ''
ctx['get_⎕'] = -> (prompt('⎕:') or '').split ''
ctx['set_⎕'] = (x) -> alert x
ctx['get_⍞'] = -> (prompt() or '').split ''
ctx['set_⍞'] = (x) -> alert x
