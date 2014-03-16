[LDC, VEC, GET, SET, MON, DYA, LAM, RET, POP, SPL, JEQ, EMB, CON] = [1..13]

class λ
  constructor: (@code, @addr, @size, @env) ->
  toFunction: -> (x, y) => vm code: @code, env: @env.concat([[x, @, y, null]]), pc: @addr
  toString: -> 'λ'

vm = ({code, env, stack, pc}) ->
  assert code instanceof Array
  assert env instanceof Array
  for frame in env then assert frame instanceof Array
  stack ?= []
  pc ?= 0
  loop
    switch code[pc++]
      when LDC then stack.push code[pc++]
      when VEC
        a = []
        for x in stack.splice stack.length - code[pc++]
          a.push(if x.isSimple() then x.unwrap() else x)
        stack.push new APLArray a
      when GET then stack.push(env[code[pc++]][code[pc++]] ? valueError())
      when SET then env[code[pc++]][code[pc++]] = stack[stack.length - 1]
      when MON
        [w, f] = stack.splice -2
        if typeof f is 'function'
          if w instanceof λ then w = w.toFunction()
          if f.cps
            f w, undefined, undefined, (r) -> stack.push r; vm {code, env, stack, pc}; return
            return
          else
            stack.push f w
        else
          bp = stack.length
          stack.push code, pc, env
          {code} = f
          pc = f.addr
          env = f.env.concat [[w, f, null, bp]]
      when DYA
        [w, f, a] = stack.splice -3
        if typeof f is 'function'
          if w instanceof λ then w = w.toFunction()
          if a instanceof λ then a = a.toFunction()
          if f.cps
            f w, a, undefined, (r) -> stack.push r; vm {code, env, stack, pc}; return
            return
          else
            stack.push f w, a
        else
          bp = stack.length
          stack.push code, pc, env
          {code} = f
          pc = f.addr
          env = f.env.concat [[w, f, a, bp]]
      when LAM
        size = code[pc++]
        stack.push new λ code, pc, size, env
        pc += size
      when RET
        if stack.length is 1 then return stack[0]
        [code, pc, env] = stack.splice -4, 3
      when POP then stack.pop()
      when SPL
        n = code[pc++]
        a = stack[stack.length - 1].toArray().reverse()
        a = for x in a then (if x instanceof APLArray then x else new APLArray [x], [])
        if a.length is 1
          a = repeat a, n
        else if a.length isnt n
          lengthError()
        stack.push a...
      when JEQ
        n = code[pc++]
        if !stack[stack.length - 1].toBool()
          pc += n
      when EMB
        frame = env[env.length - 1]
        stack.push code[pc++](frame[0], frame[2])
      when CON
        frame = env[env.length - 1]
        do ->
          cont =
            code: code
            env: for x in env then x[..]
            stack: stack[...frame[3]]
            pc: frame[1].addr + frame[1].size - 1
          assert code[cont.pc] is RET
          stack.push (r) -> {code, env, stack, pc} = cont; stack.push r
      else aplError 'Unrecognized instruction: ' + code[pc - 1] + ', pc:' + pc
  return
