vocabulary = {}
addVocabulary = (h) ->
  for k, v of h
    vocabulary[k] = v
    for alias in v?.aliases ? []
      vocabulary[alias] = v
  return
