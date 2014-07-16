#!/usr/bin/env coffee
# Collect data from ../examples and generate examples.js for inclusion into index.html
fs = require 'fs'
fs.writeFileSync "#{__dirname}/examples.js", """
  // Generated code, do not edit
  window.examples = [
    #{(
      for f in fs.readdirSync "#{__dirname}/../examples" when /^\w.+\.apl$/.test f
        '  ' + JSON.stringify [
          f.replace(/^\d+-|\.apl$/g, '')
          fs.readFileSync("#{__dirname}/../examples/#{f}", 'utf8').replace(/^#!.*\n+|\n+$/g, '').replace(/\n* *⎕ *← *(.*)$/, '\n$1')
        ]
    ).join ',\n'}
  ];
"""
