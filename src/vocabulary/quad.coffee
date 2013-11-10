addVocabulary

  'get_⎕': ->
    if typeof window?.prompt is 'function'
      new APLArray(prompt('⎕:') or '')
    else
      nonceError 'Reading from ⎕ is not implemented.'

  'set_⎕': (x) ->
    s = format(x).join('\n') + '\n'
    if typeof window?.alert is 'function'
      window.alert s
    else
      process.stdout.write s
    x

  'get_⍞': ->
    if typeof window?.prompt is 'function'
      prompt('') or ''
    else
      nonceError 'Reading from ⍞ is not implemented.'

  'set_⍞': (x) ->
    s = format(x).join '\n'
    if typeof window?.alert is 'function'
      window.alert s
    else
      process.stdout.write s
    x

  # Index origin (`⎕IO`)
  #
  # The index origin is fixed at 0.  Reading it returns 0.  Attempts to set it
  # to anything other than that fail.
  #
  # ⎕IO   <=> 0
  # ⎕IO←0 <=> 0
  # ⎕IO←1 !!!
  'get_⎕IO': -> APLArray.zero
  'set_⎕IO': (x) -> if match x, APLArray.zero then x else domainError 'The index origin (⎕IO) is fixed at 0'

  # Delay (`⎕DL`)
  '⎕DL': cps (omega, alpha, _, callback) ->
    t0 = +new Date
    setTimeout (-> callback new APLArray [new Date - t0]), omega.unwrap()
    return
