#!/usr/bin/env coffee
# Collect data from ../examples and generate examples.js for inclusion into index.html
fs = require 'fs'
glob = require 'glob'
{basename} = require 'path'
fs.writeFileSync "#{__dirname}/examples.js", """
  // Generated code, do not edit
  window.examples = [
    #{(
      for f in glob.sync "#{__dirname}/../examples/*.apl"
        '  ' + JSON.stringify [
          basename(f).replace(/^\d+-|\.apl$/g, '')
          fs.readFileSync(f, 'utf8').replace(/^#!.*\n+|\n+$/g, '').replace(/\n* *⎕ *← *(.*)$/, '\n$1')
        ]
    ).join ',\n'}
  ];
"""
