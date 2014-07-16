#!/usr/bin/env coffee
fs = require 'fs'

trim = (s) -> s.replace /(^ +| +$)/g, ''

tests = []
visit = (d) ->
  for f in fs.readdirSync d
    df = d + '/' + f
    if fs.lstatSync(df).isDirectory()
      visit df
    else if /^(\w|\.)+$/.test f
      lines = fs.readFileSync(df, 'utf8').split '\n'
      i = 0
      while i < lines.length
        line = lines[i++]
        while i < lines.length and (m = lines[i].match(/^ *[#⍝] *\.\.\.(.*)$/))
          line += '\n' + m[1]
          i++
        if m = line.match /^ *[#⍝] ([^]*)(←→|!!!)([^]+)$/
          tests.push [trim(m[1]), trim(m[2]), trim(m[3])]
  return

visit "#{__dirname}/../src"

process.stdout.write "[\n#{tests.map(JSON.stringify).join ',\n'}\n]\n"
