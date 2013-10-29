vocabulary = {}
addVocabulary = (h) ->
  for k, v of h
    vocabulary[k] = v
    for alias in v?.aplMetaInfo?.aliases ? []
      vocabulary[alias] = v
