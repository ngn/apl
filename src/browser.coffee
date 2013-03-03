# `browser.coffee` provides the APL vocabulary in a browser environment.
# It builds on top of [`vocabulary.coffee`](./vocabulary.html).

vocabulary = require './vocabulary'
{inherit} = require './helpers'

browserVocabulary = ctx = inherit vocabulary
ctx['⍵'] = ('' + location).split ''
ctx['get_⎕'] = -> (prompt('⎕:') or '').split ''
ctx['set_⎕'] = (x) -> alert x
ctx['get_⍞'] = -> (prompt() or '').split ''
ctx['set_⍞'] = (x) -> alert x
exports.browserVocabulary = browserVocabulary
