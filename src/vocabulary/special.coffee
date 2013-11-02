addVocabulary

  # Index origin (`⎕IO`)
  #
  # The index origin is fixed at 0.  Reading it returns 0.  Attempts to set it
  # to anything other than that fail.
  #
  # ⎕IO   <=> 0
  # ⎕IO←0 <=> 0
  # ⎕IO←1 !!!
  'get_⎕IO': -> APLArray.zero
  'set_⎕IO': (x) ->
    if match x, APLArray.zero then x else throw Error 'The index origin (⎕IO) is fixed at 0'
