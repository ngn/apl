addVocabulary

  'get_⎕': cps (_, _1, _2, callback) ->
    if typeof window?.prompt is 'function'
      setTimeout (-> callback new A(prompt('⎕:') or '')), 0
    else
      process.stdout.write '⎕:\n'
      readline '      ', (line) -> callback exec new A(line).toSimpleString()

  'set_⎕': (x) ->
    s = format(x).join('\n') + '\n'
    if typeof window?.alert is 'function'
      window.alert s
    else
      process.stdout.write s
    x

  'get_⍞': cps (_, _1, _2, callback) ->
    if typeof window?.prompt is 'function'
      setTimeout (-> callback new A(prompt('') or '')), 0
    else
      readline '', (line) -> callback new A line

  'set_⍞': (x) ->
    s = format(x).join '\n'
    if typeof window?.alert is 'function'
      window.alert s
    else
      process.stdout.write s
    x

  # The index origin is fixed at 0.  Reading it returns 0.  Attempts to set it
  # to anything other than that fail.
  #
  # ⎕IO   ←→ 0
  # ⎕IO←0 ←→ 0
  # ⎕IO←1 !!!
  'get_⎕IO': -> A.zero
  'set_⎕IO': (x) -> if match x, A.zero then x else domainError 'The index origin (⎕IO) is fixed at 0'

  '⎕DL': cps (⍵, ⍺, _, callback) ->
    t0 = +new Date
    setTimeout (-> callback new A [new Date - t0]), ⍵.unwrap()
    return

  # 'b(c+)d'⎕RE'abcd' ←→ 1 'bcd' (,'c')
  # 'B(c+)d'⎕RE'abcd' ←→ ⍬
  # 'a(b'   ⎕RE'c'           !!! DOMAIN ERROR
  '⎕RE': (⍵, ⍺) ->
    x = ⍺.toSimpleString()
    y = ⍵.toSimpleString()
    try re = new RegExp x catch e then domainError e.toString()
    if m = re.exec y
      r = [m.index]
      for u in m then r.push new A(u or '')
      new A r
    else
      A.zilde

  # ⎕UCS'a' ←→ 97
  # ⎕UCS'ab' ←→ 97 98
  # ⎕UCS 2 2⍴97+⍳4 ←→ 2 2⍴'abcd'
  '⎕UCS': (⍵, ⍺) ->
    if ⍺? then nonceError()
    ⍵.map (x) ->
      if isInt x, 0, 0x10000 then y = String.fromCharCode x
      else if typeof x is 'string' then y = x.charCodeAt 0
      else domainError()

  'get_⎕OFF': -> if process? then process.exit 0 else nonceError()
