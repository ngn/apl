@runDocTest = ([code, mode, expectation], exec, approx) ->
  if mode is '←→'
    try
      y = exec expectation
    catch e
      return {
        success: false
        error: e
        reason: "Cannot compute expected value #{JSON.stringify expectation}"
      }
    try
      x = exec code
      if not approx x, y
        return {
          success: false
          reason: "Expected #{JSON.stringify y} but got #{JSON.stringify x}"
        }
    catch e
      return {
        success: false
        error: e
      }
  else if mode is '!!!'
    try
      exec code
      return {
        success: false
        reason: "It should have thrown an error, but it didn't."
      }
    catch e
      if expectation and e.name[...expectation.length] isnt expectation
        return {
          success: false
          error: e
          reason: "It should have failed with #{
                    JSON.stringify expectation}, but it failed with #{
                    JSON.stringify e.message}"
        }
  else
    return {
      success: false
      reason: "Unrecognised expectation: #{JSON.stringify expectation}"
    }
  {success: true}
