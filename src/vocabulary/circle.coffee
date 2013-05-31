{APLArray} = require '../array'
{numeric, pervasive} = require './vhelpers'

@['○'] = pervasive

  # Pi times (`○`)
  #
  # ○2 <=> 6.283185307179586
  monad: numeric (x) -> Math.PI * x

  # Circular and hyperbolic functions (`○`)
  #
  # 1e¯10>∣.5-1○○÷6 <=> 1 # sin(pi/6) = .5
  dyad: numeric (x, i) ->
    switch i
      when 0 then Math.sqrt(1 - x * x)
      when 1 then Math.sin x
      when 2 then Math.cos x
      when 3 then Math.tan x
      when 4 then Math.sqrt(1 + x * x)
      when 5 then (Math.exp(2 * x) - 1) / 2 # sinh
      when 6 then (Math.exp(2 * x) + 1) / 2 # cosh
      when 7 then ex = Math.exp(2 * x); (ex - 1) / (ex + 1) # tanh
      when -1 then Math.asin x
      when -2 then Math.acos x
      when -3 then Math.atan x
      when -4 then Math.sqrt(x * x - 1)
      when -5 then Math.log(x + Math.sqrt(x * x + 1)) # arcsinh
      when -6 then Math.log(x + Math.sqrt(x * x - 1)) # arccosh
      when -7 then Math.log((1 + x) / (1 - x)) / 2 # arctanh
      else throw Error 'Unknown circular or hyperbolic function ' + i
