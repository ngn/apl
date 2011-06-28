/* Jison generated parser */
var parser = (function(){
var parser = {trace: function trace() { },
yy: {},
symbols_: {"error":2,"root":3,"body":4,"EOF":5,"guard":6,"SEPARATOR":7,"expr":8,":":9,"sequence":10,"assignment":11,"SYMBOL":12,"ARROW":13,"item":14,"indexable":15,"[":16,"indices":17,"]":18,";":19,"NUMBER":20,"STRING":21,"EMBEDDED":22,"(":23,")":24,"{":25,"}":26,"$accept":0,"$end":1},
terminals_: {2:"error",5:"EOF",7:"SEPARATOR",9:":",12:"SYMBOL",13:"ARROW",16:"[",18:"]",19:";",20:"NUMBER",21:"STRING",22:"EMBEDDED",23:"(",24:")",25:"{",26:"}"},
productions_: [0,[3,2],[4,0],[4,1],[4,2],[4,3],[6,1],[6,3],[8,1],[8,1],[8,2],[11,3],[10,1],[10,2],[14,1],[14,4],[17,1],[17,1],[17,3],[17,2],[15,1],[15,1],[15,1],[15,1],[15,3],[15,3]],
performAction: function anonymous(yytext,yyleng,yylineno,yy,yystate,$$,_$) {

var $0 = $$.length - 1;
switch (yystate) {
case 1:return $$[$0-1]
break;
case 2:this.$ = ['body']
break;
case 3:this.$ = ['body', $$[$0]]
break;
case 4:this.$ = $$[$0-1]
break;
case 5:(this.$ = $$[$0-2]).push($$[$0])
break;
case 6:this.$ = $$[$0]
break;
case 7:this.$ = ['guard', $$[$0-2], $$[$0]]
break;
case 8:this.$ = $$[$0]
break;
case 9:this.$ = $$[$0]
break;
case 10:(this.$ = $$[$0-1]).push($$[$0])
break;
case 11:this.$ = ['assign', $$[$0-2], $$[$0]]
break;
case 12:this.$ = ['seq', $$[$0]]
break;
case 13:(this.$ = $$[$0-1]).push($$[$0])
break;
case 14:this.$ = $$[$0]
break;
case 15:this.$ = ['index', $$[$0-3]].concat($$[$0-1])
break;
case 16:this.$ = [$$[$0]]
break;
case 17:this.$ = [null]
break;
case 18:(this.$ = $$[$0-2]).push($$[$0])
break;
case 19:(this.$ = $$[$0-1]).push(null)
break;
case 20:this.$ = ['num', $$[$0]]
break;
case 21:this.$ = ['str', $$[$0]]
break;
case 22:this.$ = ['sym', $$[$0]]
break;
case 23:this.$ = ['embedded', $$[$0]]
break;
case 24:this.$ = $$[$0-1]
break;
case 25:this.$ = ['lambda', $$[$0-1]]
break;
}
},
table: [{3:1,4:2,5:[2,2],6:3,7:[2,2],8:4,10:5,11:6,12:[1,8],14:7,15:9,20:[1,10],21:[1,11],22:[1,12],23:[1,13],25:[1,14]},{1:[3]},{5:[1,15],7:[1,16]},{5:[2,3],7:[2,3],26:[2,3]},{5:[2,6],7:[2,6],9:[1,17],26:[2,6]},{5:[2,8],7:[2,8],9:[2,8],11:18,12:[1,8],14:19,15:9,18:[2,8],19:[2,8],20:[1,10],21:[1,11],22:[1,12],23:[1,13],24:[2,8],25:[1,14],26:[2,8]},{5:[2,9],7:[2,9],9:[2,9],18:[2,9],19:[2,9],24:[2,9],26:[2,9]},{5:[2,12],7:[2,12],9:[2,12],12:[2,12],18:[2,12],19:[2,12],20:[2,12],21:[2,12],22:[2,12],23:[2,12],24:[2,12],25:[2,12],26:[2,12]},{5:[2,22],7:[2,22],9:[2,22],12:[2,22],13:[1,20],16:[2,22],18:[2,22],19:[2,22],20:[2,22],21:[2,22],22:[2,22],23:[2,22],24:[2,22],25:[2,22],26:[2,22]},{5:[2,14],7:[2,14],9:[2,14],12:[2,14],16:[1,21],18:[2,14],19:[2,14],20:[2,14],21:[2,14],22:[2,14],23:[2,14],24:[2,14],25:[2,14],26:[2,14]},{5:[2,20],7:[2,20],9:[2,20],12:[2,20],16:[2,20],18:[2,20],19:[2,20],20:[2,20],21:[2,20],22:[2,20],23:[2,20],24:[2,20],25:[2,20],26:[2,20]},{5:[2,21],7:[2,21],9:[2,21],12:[2,21],16:[2,21],18:[2,21],19:[2,21],20:[2,21],21:[2,21],22:[2,21],23:[2,21],24:[2,21],25:[2,21],26:[2,21]},{5:[2,23],7:[2,23],9:[2,23],12:[2,23],16:[2,23],18:[2,23],19:[2,23],20:[2,23],21:[2,23],22:[2,23],23:[2,23],24:[2,23],25:[2,23],26:[2,23]},{8:22,10:5,11:6,12:[1,8],14:7,15:9,20:[1,10],21:[1,11],22:[1,12],23:[1,13],25:[1,14]},{4:23,6:3,7:[2,2],8:4,10:5,11:6,12:[1,8],14:7,15:9,20:[1,10],21:[1,11],22:[1,12],23:[1,13],25:[1,14],26:[2,2]},{1:[2,1]},{5:[2,4],6:24,7:[2,4],8:4,10:5,11:6,12:[1,8],14:7,15:9,20:[1,10],21:[1,11],22:[1,12],23:[1,13],25:[1,14],26:[2,4]},{8:25,10:5,11:6,12:[1,8],14:7,15:9,20:[1,10],21:[1,11],22:[1,12],23:[1,13],25:[1,14]},{5:[2,10],7:[2,10],9:[2,10],18:[2,10],19:[2,10],24:[2,10],26:[2,10]},{5:[2,13],7:[2,13],9:[2,13],12:[2,13],18:[2,13],19:[2,13],20:[2,13],21:[2,13],22:[2,13],23:[2,13],24:[2,13],25:[2,13],26:[2,13]},{8:26,10:5,11:6,12:[1,8],14:7,15:9,20:[1,10],21:[1,11],22:[1,12],23:[1,13],25:[1,14]},{8:28,10:5,11:6,12:[1,8],14:7,15:9,17:27,19:[1,29],20:[1,10],21:[1,11],22:[1,12],23:[1,13],25:[1,14]},{24:[1,30]},{7:[1,16],26:[1,31]},{5:[2,5],7:[2,5],26:[2,5]},{5:[2,7],7:[2,7],26:[2,7]},{5:[2,11],7:[2,11],9:[2,11],18:[2,11],19:[2,11],24:[2,11],26:[2,11]},{18:[1,32],19:[1,33]},{18:[2,16],19:[2,16]},{18:[2,17],19:[2,17]},{5:[2,24],7:[2,24],9:[2,24],12:[2,24],16:[2,24],18:[2,24],19:[2,24],20:[2,24],21:[2,24],22:[2,24],23:[2,24],24:[2,24],25:[2,24],26:[2,24]},{5:[2,25],7:[2,25],9:[2,25],12:[2,25],16:[2,25],18:[2,25],19:[2,25],20:[2,25],21:[2,25],22:[2,25],23:[2,25],24:[2,25],25:[2,25],26:[2,25]},{5:[2,15],7:[2,15],9:[2,15],12:[2,15],18:[2,15],19:[2,15],20:[2,15],21:[2,15],22:[2,15],23:[2,15],24:[2,15],25:[2,15],26:[2,15]},{8:34,10:5,11:6,12:[1,8],14:7,15:9,18:[2,19],19:[2,19],20:[1,10],21:[1,11],22:[1,12],23:[1,13],25:[1,14]},{18:[2,18],19:[2,18]}],
defaultActions: {15:[2,1]},
parseError: function parseError(str, hash) {
    throw new Error(str);
},
parse: function parse(input) {
    var self = this,
        stack = [0],
        vstack = [null], // semantic value stack
        lstack = [], // location stack
        table = this.table,
        yytext = '',
        yylineno = 0,
        yyleng = 0,
        recovering = 0,
        TERROR = 2,
        EOF = 1;

    //this.reductionCount = this.shiftCount = 0;

    this.lexer.setInput(input);
    this.lexer.yy = this.yy;
    this.yy.lexer = this.lexer;
    if (typeof this.lexer.yylloc == 'undefined')
        this.lexer.yylloc = {};
    var yyloc = this.lexer.yylloc;
    lstack.push(yyloc);

    if (typeof this.yy.parseError === 'function')
        this.parseError = this.yy.parseError;

    function popStack (n) {
        stack.length = stack.length - 2*n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }

    function lex() {
        var token;
        token = self.lexer.lex() || 1; // $end = 1
        // if token isn't its numeric value, convert
        if (typeof token !== 'number') {
            token = self.symbols_[token] || token;
        }
        return token;
    };

    var symbol, preErrorSymbol, state, action, a, r, yyval={},p,len,newState, expected;
    while (true) {
        // retreive state number from top of stack
        state = stack[stack.length-1];

        // use default actions if available
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol == null)
                symbol = lex();
            // read action for current state and first input
            action = table[state] && table[state][symbol];
        }

        // handle parse error
        if (typeof action === 'undefined' || !action.length || !action[0]) {

            if (!recovering) {
                // Report error
                expected = [];
                for (p in table[state]) if (this.terminals_[p] && p > 2) {
                    expected.push("'"+this.terminals_[p]+"'");
                }
                var errStr = '';
                if (this.lexer.showPosition) {
                    errStr = 'Parse error on line '+(yylineno+1)+":\n"+this.lexer.showPosition()+'\nExpecting '+expected.join(', ');
                } else {
                    errStr = 'Parse error on line '+(yylineno+1)+": Unexpected " +
                                  (symbol == 1 /*EOF*/ ? "end of input" :
                                              ("'"+(this.terminals_[symbol] || symbol)+"'"));
                }
                this.parseError(errStr,
                    {text: this.lexer.match, token: this.terminals_[symbol] || symbol, line: this.lexer.yylineno, loc: yyloc, expected: expected});
            }

            // just recovered from another error
            if (recovering == 3) {
                if (symbol == EOF) {
                    throw new Error(errStr || 'Parsing halted.');
                }

                // discard current lookahead and grab another
                yyleng = this.lexer.yyleng;
                yytext = this.lexer.yytext;
                yylineno = this.lexer.yylineno;
                yyloc = this.lexer.yylloc;
                symbol = lex();
            }

            // try to recover from error
            while (1) {
                // check for error recovery rule in this state
                if ((TERROR.toString()) in table[state]) {
                    break;
                }
                if (state == 0) {
                    throw new Error(errStr || 'Parsing halted.');
                }
                popStack(1);
                state = stack[stack.length-1];
            }

            preErrorSymbol = symbol; // save the lookahead token
            symbol = TERROR;         // insert generic error symbol as new lookahead
            state = stack[stack.length-1];
            action = table[state] && table[state][TERROR];
            recovering = 3; // allow 3 real symbols to be shifted before reporting a new error
        }

        // this shouldn't happen, unless resolve defaults are off
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: '+state+', token: '+symbol);
        }

        switch (action[0]) {

            case 1: // shift
                //this.shiftCount++;

                stack.push(symbol);
                vstack.push(this.lexer.yytext);
                lstack.push(this.lexer.yylloc);
                stack.push(action[1]); // push state
                symbol = null;
                if (!preErrorSymbol) { // normal execution/no error
                    yyleng = this.lexer.yyleng;
                    yytext = this.lexer.yytext;
                    yylineno = this.lexer.yylineno;
                    yyloc = this.lexer.yylloc;
                    if (recovering > 0)
                        recovering--;
                } else { // error just occurred, resume old lookahead f/ before error
                    symbol = preErrorSymbol;
                    preErrorSymbol = null;
                }
                break;

            case 2: // reduce
                //this.reductionCount++;

                len = this.productions_[action[1]][1];

                // perform semantic action
                yyval.$ = vstack[vstack.length-len]; // default to $$ = $1
                // default location, uses first token for firsts, last for lasts
                yyval._$ = {
                    first_line: lstack[lstack.length-(len||1)].first_line,
                    last_line: lstack[lstack.length-1].last_line,
                    first_column: lstack[lstack.length-(len||1)].first_column,
                    last_column: lstack[lstack.length-1].last_column
                };
                r = this.performAction.call(yyval, yytext, yyleng, yylineno, this.yy, action[1], vstack, lstack);

                if (typeof r !== 'undefined') {
                    return r;
                }

                // pop off stack
                if (len) {
                    stack = stack.slice(0,-1*len*2);
                    vstack = vstack.slice(0, -1*len);
                    lstack = lstack.slice(0, -1*len);
                }

                stack.push(this.productions_[action[1]][0]);    // push nonterminal (reduce)
                vstack.push(yyval.$);
                lstack.push(yyval._$);
                // goto new state = table[STATE][NONTERMINAL]
                newState = table[stack[stack.length-2]][stack[stack.length-1]];
                stack.push(newState);
                break;

            case 3: // accept
                return true;
        }

    }

    return true;
}};/* Jison generated lexer */
var lexer = (function(){var lexer = ({EOF:1,
parseError:function parseError(str, hash) {
        if (this.yy.parseError) {
            this.yy.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },
setInput:function (input) {
        this._input = input;
        this._more = this._less = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {first_line:1,first_column:0,last_line:1,last_column:0};
        return this;
    },
input:function () {
        var ch = this._input[0];
        this.yytext+=ch;
        this.yyleng++;
        this.match+=ch;
        this.matched+=ch;
        var lines = ch.match(/\n/);
        if (lines) this.yylineno++;
        this._input = this._input.slice(1);
        return ch;
    },
unput:function (ch) {
        this._input = ch + this._input;
        return this;
    },
more:function () {
        this._more = true;
        return this;
    },
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20)+(next.length > 20 ? '...':'')).replace(/\n/g, "");
    },
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c+"^";
    },
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) this.done = true;

        var token,
            match,
            col,
            lines;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i=0;i < rules.length; i++) {
            match = this._input.match(this.rules[rules[i]]);
            if (match) {
                lines = match[0].match(/\n.*/g);
                if (lines) this.yylineno += lines.length;
                this.yylloc = {first_line: this.yylloc.last_line,
                               last_line: this.yylineno+1,
                               first_column: this.yylloc.last_column,
                               last_column: lines ? lines[lines.length-1].length-1 : this.yylloc.last_column + match[0].length}
                this.yytext += match[0];
                this.match += match[0];
                this.matches = match;
                this.yyleng = this.yytext.length;
                this._more = false;
                this._input = this._input.slice(match[0].length);
                this.matched += match[0];
                token = this.performAction.call(this, this.yy, this, rules[i],this.conditionStack[this.conditionStack.length-1]);
                if (token) return token;
                else return;
            }
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            this.parseError('Lexical error on line '+(this.yylineno+1)+'. Unrecognized text.\n'+this.showPosition(), 
                    {text: "", token: null, line: this.yylineno});
        }
    },
lex:function lex() {
        var r = this.next();
        if (typeof r !== 'undefined') {
            return r;
        } else {
            return this.lex();
        }
    },
begin:function begin(condition) {
        this.conditionStack.push(condition);
    },
popState:function popState() {
        return this.conditionStack.pop();
    },
_currentRules:function _currentRules() {
        return this.conditions[this.conditionStack[this.conditionStack.length-1]].rules;
    }});
lexer.performAction = function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {

var YYSTATE=YY_START
switch($avoiding_name_collisions) {
case 0:
break;
case 1:
break;
case 2:return "SEPARATOR"
break;
case 3:return "NUMBER"
break;
case 4:return "STRING"
break;
case 5:return "STRING"
break;
case 6:return "["
break;
case 7:return "]"
break;
case 8:return ";"
break;
case 9:return "("
break;
case 10:return ")"
break;
case 11:return "{"
break;
case 12:return "}"
break;
case 13:return ":"
break;
case 14:return "ARROW"
break;
case 15:return "EMBEDDED"
break;
case 16:return "SYMBOL"
break;
case 17:return "SYMBOL"
break;
case 18:return "SYMBOL"
break;
case 19:return "EOF"
break;
}
};
lexer.rules = [/^[ \t]+/,/^[⍝#].*/,/^[\n\r◇]/,/^¯?(?:0[xX][\da-fA-F]+|\d*\.?\d+(?:[eE][+¯]?\d+)?)(?:[jJ]¯?(?:0[xX][\da-fA-F]+|\d*\.?\d+(?:[eE][+¯]?\d+)?))?/,/^(?:'[^\\']*(?:\\.[^\\']*)*')+/,/^(?:"[^\\"]*(?:\\.[^\\"]*)*")+/,/^\[/,/^\]/,/^;/,/^\(/,/^\)/,/^\{/,/^\}/,/^:/,/^←/,/^«[^»]*»/,/^∘./,/^⎕?[A-Za-z_][A-Za-z_0-9]*/,/^[^¯'":«»]/,/^$/];
lexer.conditions = {"INITIAL":{"rules":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19],"inclusive":true}};return lexer;})()
parser.lexer = lexer;
return parser;
})();
if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
exports.parser = parser;
exports.parse = function () { return parser.parse.apply(parser, arguments); }
exports.main = function commonjsMain(args) {
    if (!args[1])
        throw new Error('Usage: '+args[0]+' FILE');
    if (typeof process !== 'undefined') {
        var source = require('fs').readFileSync(require('path').join(process.cwd(), args[1]), "utf8");
    } else {
        var cwd = require("file").path(require("file").cwd());
        var source = cwd.join(args[1]).read({charset: "utf-8"});
    }
    return exports.parser.parse(source);
}
if (typeof module !== 'undefined' && require.main === module) {
  exports.main(typeof process !== 'undefined' ? process.argv.slice(1) : require("system").args);
}
}