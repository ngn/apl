#!/usr/bin/env coffee

# Collect data from ../examples and generate examples.js for inclusion into index.html

fs = require 'fs'

names = for name in fs.readdirSync '../examples' when name.match /.*\.apl/ then name
names.sort()

fs.writeFileSync 'examples.js', """
  // Generated code, do not edit
  window.examples = [
  #{(
    for name in names
      '  ' + JSON.stringify [
        name.replace(/(^\d+-|\.apl$)/g, '')
        fs.readFileSync('../examples/' + name).toString()
          .replace(/(^#!.*\n+|\n+$)/g, '')
          .replace(/\n *⎕ *← *(.*)$/, '\n$1')
      ]
  ).join ',\n'}
  ];
"""
