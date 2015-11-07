function aplError(name,m,o){ // m:message, o:options
  m=m||''
  if(o&&o.aplCode&&o.offset!=null){
    var a=o.aplCode.slice(0,o.offset).split('\n')
    var l=a.length,c=1+(a[a.length-1]||'').length // line and column
    m+='\n'+(o.file||'-')+':'+l+':'+c+o.aplCode.split('\n')[l-1]+'_'.repeat(c-1)+'^'
  }
  var e=Error(m);e.name=name;for(var k in o)e[k]=o[k]
  throw e
}
function syntaxError(m,o){aplError('SYNTAX ERROR',m,o)}
function domainError(m,o){aplError('DOMAIN ERROR',m,o)}
function lengthError(m,o){aplError('LENGTH ERROR',m,o)}
function   rankError(m,o){aplError(  'RANK ERROR',m,o)}
function  indexError(m,o){aplError( 'INDEX ERROR',m,o)}
function  nonceError(m,o){aplError( 'NONCE ERROR',m,o)}
function  valueError(m,o){aplError( 'VALUE ERROR',m,o)}
