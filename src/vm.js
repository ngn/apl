var LDC=1,VEC=2,GET=3,SET=4,MON=5,DYA=6,LAM=7,RET=8,POP=9,SPL=10,JEQ=11,EMB=12,CON=13

function Proc(code,addr,size,env){this.code=code;this.addr=addr;this.size=size;this.env=env}
Proc.prototype.toString=function(){return'#procedure'}
Proc.prototype.toFunction=function(){
  var p=this;return function(x,y){return vm({code:p.code,env:p.env.concat([[x,p,y,null]]),pc:p.addr})}
}

function vm(o){
  var code=o.code,env=o.env,stack=o.stack,pc=o.pc
  assert(code instanceof Array);assert(env instanceof Array);for(var i=0;i<env.length;i++)assert(env[i]instanceof Array)
  stack=stack||[];pc=pc||0
  while(1){
    switch(code[pc++]){
      case LDC:stack.push(code[pc++]);break
      case VEC:
        var a=stack.splice(stack.length-code[pc++])
        for(var i=0;i<a.length;i++)if(a[i].isSimple())a[i]=a[i].unwrap()
        stack.push(new A(a))
        break
      case GET:var r=env[code[pc++]][code[pc++]];r!=null||valueError();stack.push(r);break
      case SET:env[code[pc++]][code[pc++]]=stack[stack.length-1];break
      case MON:
        var wf=stack.splice(-2),w=wf[0],f=wf[1]
        if(typeof f==='function'){
          if(w instanceof Proc)w=w.toFunction()
          if(f.cps){
            f(w,undefined,undefined,function(r){stack.push(r);vm({code:code,env:env,stack:stack,pc:pc})})
            return
          }else{
            stack.push(f(w))
          }
        }else{
          var bp=stack.length;stack.push(code,pc,env);code=f.code;pc=f.addr;env=f.env.concat([[w,f,null,bp]])
        }
        break
      case DYA:
        var wfa=stack.splice(-3),w=wfa[0],f=wfa[1],a=wfa[2]
        if(typeof f==='function'){
          if(w instanceof Proc)w=w.toFunction()
          if(a instanceof Proc)a=a.toFunction()
          if(f.cps){
            f(w,a,undefined,function(r){stack.push(r);vm({code:code,env:env,stack:stack,pc:pc})})
            return
          }else{
            stack.push(f(w,a))
          }
        }else{
          var bp=stack.length;stack.push(code,pc,env);code=f.code;pc=f.addr;env=f.env.concat([[w,f,a,bp]])
        }
        break
      case LAM:size=code[pc++];stack.push(new Proc(code,pc,size,env));pc+=size;break
      case RET:
        if(stack.length===1)return stack[0]
        var u=stack.splice(-4,3);code=u[0];pc=u[1];env=u[2]
        break
      case POP:stack.pop();break
      case SPL:
        var n=code[pc++]
        var a=stack[stack.length-1].toArray().reverse()
        for(var i=0;i<a.length;i++)if(!(a[i]instanceof A))a[i]=new A([a[i]],[])
        if(a.length===1){a=repeat(a,n)}else if(a.length!==n){lengthError()}
        stack.push.apply(stack,a)
        break
      case JEQ:var n=code[pc++];stack[stack.length-1].toBool()||(pc+=n);break
      case EMB:var frame=env[env.length-1];stack.push(code[pc++](frame[0],frame[2]));break
      case CON:
        var frame = env[env.length - 1]
        ;(function(){
          var cont={
            code:code,
            env:env.map(function(x){x.slice(0)}),
            stack:stack.slice(0,frame[3]),
            pc:frame[1].addr+frame[1].size-1
          }
          assert(code[cont.pc] === RET)
          stack.push(function(r){code=cont.code;env=cont.env;stack=cont.stack;pc=cont.pc;stack.push(r)})
        }())
        break
      default:aplError('Unrecognized instruction:'+code[pc-1]+',pc:'+pc)
    }
  }
}
