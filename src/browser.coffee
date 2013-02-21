if typeof define isnt 'function' then define = require('amdefine')(module)
# This file will only be sourced when APL is used in a browser environment.

define ['./vocabulary', './helpers'], (vocabularyModule, helpers) ->
  {vocabulary} = vocabularyModule
  {inherit} = helpers

  browserVocabulary = ctx = inherit vocabulary
  ctx['⍵'] = ('' + location).split ''
  ctx['get_⎕'] = -> (prompt('⎕:') or '').split ''
  ctx['set_⎕'] = (x) -> alert x
  ctx['get_⍞'] = -> (prompt() or '').split ''
  ctx['set_⍞'] = (x) -> alert x
  {browserVocabulary}
