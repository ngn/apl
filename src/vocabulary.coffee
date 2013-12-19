vocabulary = {}
addVocabulary = (h) ->
  for k, v of h then vocabulary[k] = v
  return
