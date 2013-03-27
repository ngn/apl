{pervasive, numeric} = require './vhelpers'

@['+'] = pervasive
  monad: numeric (x) -> x
  dyad:  numeric (y, x) -> x + y

@['−'] = pervasive
  monad: numeric (x) -> -x
  dyad:  numeric (y, x) -> x - y

@['×'] = pervasive
  monad: numeric (x) -> (x > 0) - (x < 0)
  dyad:  numeric (y, x) -> x * y

@['÷'] = pervasive
  monad: numeric (x) -> 1 / x
  dyad:  numeric (y, x) -> x / y

@['⋆'] = pervasive
  monad: numeric Math.exp
  dyad:  numeric (y, x) -> Math.pow x, y
