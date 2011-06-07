%lex
%%

[ \t]+                          /* skip whitespace */
[⍝#].*                          /* skip comments */
[\n\r◇]                         return 'SEPARATOR'
"¯"?[0-9]+("."[0-9]+)?\b        return 'NUMBER'
\'([^\'\\\r\n]|\'\'|\\[a-z])*\' return 'STRING'
\"([^\"\\\r\n]|\"\"|\\[a-z])*\" return 'STRING'
"["                             return '['
"]"                             return ']'
";"                             return ';'
"("                             return '('
")"                             return ')'
"{"                             return '{'
"}"                             return '}'
"←"                             return 'ARROW'
"∘."                            return 'SYMBOL'
[A-Za-z_][A-Za-z_0-9]*          return 'SYMBOL'
.                               return 'SYMBOL'
<<EOF>>                         return 'EOF'

/lex

%start root
%%

root
    : body EOF                   { return $1; }
    ;

body
    :                            { $$ = ['body']; }
    | expr                       { $$ = ['body', $1]; }
    | body SEPARATOR             { $$ = $1; }
    | body SEPARATOR expr        { ($$ = $1).push($3); }
    ;

expr
    : sequence                   { $$ = $1; }
    | assignment                 { $$ = $1; }
    | sequence assignment        { ($$ = $1).push($2); }
    ;

assignment
    : SYMBOL ARROW expr          { $$ = ['assign', $1, $3]; }
    ;

sequence
    : item                       { $$ = ['seq', $1]; }
    | sequence item              { ($$ = $1).push($2); }
    ;

item
    : indexable                  { $$ = $1; }
    | indexable '[' sequence ']' { $$ = ['[]', $1, $2]; }
    ;

indexable
    : NUMBER                     { $$ = ['num', $1]; }
    | STRING                     { $$ = ['str', $1]; }
    | SYMBOL                     { $$ = ['sym', $1]; }
    | '(' expr ')'               { $$ = $2; }
    | '{' body '}'               { $$ = ['lambda', $2]; }
    ;
