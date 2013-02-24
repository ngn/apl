if typeof define isnt 'function' then define = require('amdefine')(module)
# `browser.coffee` provides the APL vocabulary in a browser environment.
# It builds on top of [`vocabulary.coffee`](./vocabulary.html).

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
