var apl=this.apl=function(aplCode,opts){return(apl.ws(opts))(aplCode)}
extend(apl,{format:format,approx:approx,parse:parse,compileAST:compileAST,repr:repr})
apl.ws=function(opts){
  opts=opts||{}
  ctx=Object.create(vocabulary)
  if(opts.in )ctx['get_⎕']=ctx['get_⍞']=function(){var s=opts.in();assert(typeof s==='string');return new A(s)}
  if(opts.out)ctx['set_⎕']=ctx['set_⍞']=function(x){opts.out(format(x).join('\n')+'\n')}
  return function(aplCode){return exec(aplCode,{ctx:ctx})}
}
function readline(prompt,f){
  ;(readline.requesters=readline.requesters||[]).push(f)
  var rl=readline.rl
  if(!rl){
    rl=readline.rl=require('readline').createInterface(process.stdin,process.stdout)
    rl.on('line',function(x){var h=readline.requesters.pop();h&&h(x)})
    rl.on('close',function(){process.stdout.write('\n');process.exit(0)})
  }
  rl.setPrompt(prompt);rl.prompt()
}
if(typeof module!=='undefined'){
  module.exports=apl
  if(module===require.main)(function(){
    var usage='Usage: apl.js [options] [filename.apl]\n'+
              'Options:\n'+
              '  -l --linewise   Process stdin line by line and disable prompt\n'
    var file,linewise
    process.argv.slice(2).forEach(function(arg){
      if(arg==='-h'||arg==='--help'){process.stderr.write(usage);process.exit(0)}
      else if(arg==='-l'||arg=='--linewise')linewise=1
      else if(arg[0]==='-'){process.stderr.write('unrecognized option:'+arg+'\n'+usage);process.exit(1)}
      else if(file){process.stderr.write(usage);process.exit(1)}
      else file=arg
    })
    if(file){
      exec(require('fs').readFileSync(file,'utf8'))
    }else if(linewise){
      var fs=require('fs'),ws=apl.ws(),a=Buffer(256),i=0,n=0,b=Buffer(a.length),k
      while(k=fs.readSync(0,b,0,b.length)){
        if(n+k>a.length)a=Buffer.concat([a,a])
        b.copy(a,n,0,k);n+=k
        while(i<n){
          if(a[i]===10){ // '\n'
            var r;try{r=format(ws(''+a.slice(0,i))).join('\n')+'\n'}catch(e){r=e+'\n'}
            process.stdout.write(r);a.copy(a,0,i+1);n-=i+1;i=0
          }else{
            i++
          }
        }
      }
    }else if(!require('tty').isatty()){
      var fs=require('fs'),b=Buffer(1024),n=0,k
      while(k=fs.readSync(0,b,n,b.length-n)){n+=k;n===b.length&&b.copy(b=Buffer(2*n))} // read all of stdin
      exec(b.toString('utf8',0,n))
    }else{
      var ws=apl.ws(),out=process.stdout
      function f(s){
        try{s.match(/^[\ \t\f\r\n]*$/)||out.write(format(ws(s)).join('\n')+'\n')}catch(e){out.write(e+'\n')}
        readline('      ',f)
      }
      f('')
    }
  }())
}
