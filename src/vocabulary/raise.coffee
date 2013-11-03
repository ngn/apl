addVocabulary

  # Raise error (`↗`)
  #
  # ↗'CUSTOM ERROR' !!! CUSTOM ERROR
  '↗': (omega) ->
    throw APLError omega.toString()
