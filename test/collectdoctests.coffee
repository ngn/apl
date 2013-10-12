#!/usr/bin/env coffee

fs = require 'fs'
glob = require 'glob'

trim = (s) -> s.replace /(^ +| +$)/g, ''

tests = []
for f in glob.sync __dirname + '/../src/**/*.coffee'
  lines = fs.readFileSync(f, 'utf8').split '\n'
  i = 0
  while i < lines.length
    line = lines[i++]
    while i < lines.length and (m = lines[i].match(/^ *# *\.\.\.(.*)$/))
      line += '\n' + m[1]
      i++
    if m = line.match /^ *# ([^]*)(<=>|!!!)([^]+)$/
      tests.push [trim(m[1]), trim(m[2]), trim(m[3])]

process.stdout.write "[\n#{tests.map(JSON.stringify).join ',\n'}\n]\n"
