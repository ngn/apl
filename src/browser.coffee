if typeof define isnt 'function' then define = require('amdefine')(module)
# This file will only be sourced when APL is used in a browser environment.

define ['./builtins', './helpers'], (builtinsModule, helpers) ->
  {builtins} = builtinsModule
  {inherit} = helpers

  browserBuiltins = ctx = inherit builtins
  ctx['⍵'] = ('' + location).split ''
  ctx['get_⎕'] = -> (prompt('⎕:') or '').split ''
  ctx['set_⎕'] = (x) -> alert x
  ctx['get_⍞'] = -> (prompt() or '').split ''
  ctx['set_⍞'] = (x) -> alert x
  {browserBuiltins}
