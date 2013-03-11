# `formatter.coffee` provides a utility to visualize APL data structures in a
# character grid such as the TTY or an HTML table.

{isSimple, shapeOf, prod, repeat} = require './helpers'

# Format an APL object as an vector of strings
@format = format = (a) ->
  if typeof a is 'undefined' then ['undefined']
  else if a is null then ['null']
  else if typeof a is 'string' then [a]
  else if typeof a is 'number' then [('' + a).replace /-|Infinity/g, '¯']
  else if typeof a is 'function' then ['function']
  else if isSimple a then ['' + a]
  else if a.length is 0 then ['']
  else
    sa = shapeOf a
    if not sa.length then return format a[0]
    nRows = prod sa[...sa.length - 1]
    nCols = sa[sa.length - 1]

    rows = for [0...nRows]
      height: 0
      bottomMargin: 0

    cols = for [0...nCols]
      type: 0 # 0=characters, 1=numbers, 2=subarrays
      width: 0
      leftMargin: 0
      rightMargin: 0

    grid =
      for r, i in rows
        for c, j in cols
          x = a[nCols * i + j]
          box = format x
          r.height = Math.max r.height, box.length
          c.width = Math.max c.width, box[0].length
          c.type = Math.max c.type,
            if typeof x is 'string' and x.length is 1 then 0
            else if not x.length? then 1
            else 2
          box

    step = 1
    for d in [sa.length - 2..1] by -1
      step *= sa[d]
      for i in [step - 1...nRows - 1] by step
        rows[i].bottomMargin++

    for c, j in cols
      if j isnt nCols - 1 and not (c.type is cols[j + 1].type is 0)
        c.rightMargin++
      if c.type is 2
        c.leftMargin++
        c.rightMargin++

    result = []
    for r, i in rows
      for c, j in cols
        t = grid[i][j]
        if c.type is 1 # numbers should be right-justified
          left = repeat ' ', c.leftMargin + c.width - t[0].length
          right = repeat ' ', c.rightMargin
        else
          left = repeat ' ', c.leftMargin
          right = repeat ' ', c.rightMargin + c.width - t[0].length
        for k in [0...t.length] then t[k] = left + t[k] + right
        bottom = repeat ' ', t[0].length
        for [t.length...r.height + r.bottomMargin] then t.push bottom
      for k in [0...r.height + r.bottomMargin]
        result.push((for j in [0...nCols] then grid[i][j][k]).join '')

    result
