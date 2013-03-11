# `browser.coffee` provides the APL vocabulary in a browser environment.
# It builds on top of [`vocabulary.coffee`](./vocabulary.html).

vocabulary = require './vocabulary'
{inherit} = require './helpers'

@browserVocabulary = inherit vocabulary,
  '⍵': ('' + location).split ''
  'get_⎕': -> (prompt('⎕:') or '').split ''
  'set_⎕': (x) -> alert x
  'get_⍞': -> (prompt() or '').split ''
  'set_⍞': (x) -> alert x
