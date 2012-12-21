/* Jison generated parser */
var parser = (function(){
var parser = {trace: function trace() { },
yy: {},
symbols_: {"error":2,"root":3,"body":4,"EOF":5,"guard":6,"SEPARATOR":7,"expr":8,":":9,"sequence":10,"assignment":11,"simpleSequence":12,"SYMBOL":13,"ARROW":14,"item":15,"indexable":16,"[":17,"indices":18,"]":19,";":20,"NUMBER":21,"STRING":22,"EMBEDDED":23,"(":24,")":25,"{":26,"}":27,"$accept":0,"$end":1},
terminals_: {2:"error",5:"EOF",7:"SEPARATOR",9:":",13:"SYMBOL",14:"ARROW",17:"[",19:"]",20:";",21:"NUMBER",22:"STRING",23:"EMBEDDED",24:"(",25:")",26:"{",27:"}"},
productions_: [0,[3,2],[4,0],[4,1],[4,2],[4,3],[6,1],[6,3],[8,1],[10,1],[10,1],[10,2],[11,3],[12,1],[12,2],[15,1],[15,4],[18,1],[18,1],[18,3],[18,2],[16,1],[16,1],[16,1],[16,1],[16,3],[16,3]],
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
case 10:this.$ = $$[$0]
break;
case 11:(this.$ = $$[$0-1]).push($$[$0])
break;
case 12:this.$ = ['assign', $$[$0-2], $$[$0]]
break;
case 13:this.$ = ['seq', $$[$0]]
break;
case 14:(this.$ = $$[$0-1]).push($$[$0])
break;
case 15:this.$ = $$[$0]
break;
case 16:this.$ = ['index', $$[$0-3]].concat($$[$0-1])
break;
case 17:this.$ = [$$[$0]]
break;
case 18:this.$ = [null]
break;
case 19:(this.$ = $$[$0-2]).push($$[$0])
break;
case 20:(this.$ = $$[$0-1]).push(null)
break;
case 21:this.$ = ['num', $$[$0]]
break;
case 22:this.$ = ['str', $$[$0]]
break;
case 23:this.$ = ['sym', $$[$0]]
break;
case 24:this.$ = ['embedded', $$[$0]]
break;
case 25:this.$ = $$[$0-1]
break;
case 26:this.$ = ['lambda', $$[$0-1]]
break;
}
},
table: [{3:1,4:2,5:[2,2],6:3,7:[2,2],8:4,10:5,11:6,12:7,13:[1,8],15:9,16:10,21:[1,11],22:[1,12],23:[1,13],24:[1,14],26:[1,15]},{1:[3]},{5:[1,16],7:[1,17]},{5:[2,3],7:[2,3],27:[2,3]},{5:[2,6],7:[2,6],9:[1,18],27:[2,6]},{5:[2,8],7:[2,8],9:[2,8],19:[2,8],20:[2,8],25:[2,8],27:[2,8]},{5:[2,9],7:[2,9],9:[2,9],19:[2,9],20:[2,9],25:[2,9],27:[2,9]},{5:[2,10],7:[2,10],9:[2,10],11:19,13:[1,8],15:20,16:10,19:[2,10],20:[2,10],21:[1,11],22:[1,12],23:[1,13],24:[1,14],25:[2,10],26:[1,15],27:[2,10]},{5:[2,23],7:[2,23],9:[2,23],13:[2,23],14:[1,21],17:[2,23],19:[2,23],20:[2,23],21:[2,23],22:[2,23],23:[2,23],24:[2,23],25:[2,23],26:[2,23],27:[2,23]},{5:[2,13],7:[2,13],9:[2,13],13:[2,13],19:[2,13],20:[2,13],21:[2,13],22:[2,13],23:[2,13],24:[2,13],25:[2,13],26:[2,13],27:[2,13]},{5:[2,15],7:[2,15],9:[2,15],13:[2,15],17:[1,22],19:[2,15],20:[2,15],21:[2,15],22:[2,15],23:[2,15],24:[2,15],25:[2,15],26:[2,15],27:[2,15]},{5:[2,21],7:[2,21],9:[2,21],13:[2,21],17:[2,21],19:[2,21],20:[2,21],21:[2,21],22:[2,21],23:[2,21],24:[2,21],25:[2,21],26:[2,21],27:[2,21]},{5:[2,22],7:[2,22],9:[2,22],13:[2,22],17:[2,22],19:[2,22],20:[2,22],21:[2,22],22:[2,22],23:[2,22],24:[2,22],25:[2,22],26:[2,22],27:[2,22]},{5:[2,24],7:[2,24],9:[2,24],13:[2,24],17:[2,24],19:[2,24],20:[2,24],21:[2,24],22:[2,24],23:[2,24],24:[2,24],25:[2,24],26:[2,24],27:[2,24]},{8:23,10:5,11:6,12:7,13:[1,8],15:9,16:10,21:[1,11],22:[1,12],23:[1,13],24:[1,14],26:[1,15]},{4:24,6:3,7:[2,2],8:4,10:5,11:6,12:7,13:[1,8],15:9,16:10,21:[1,11],22:[1,12],23:[1,13],24:[1,14],26:[1,15],27:[2,2]},{1:[2,1]},{5:[2,4],6:25,7:[2,4],8:4,10:5,11:6,12:7,13:[1,8],15:9,16:10,21:[1,11],22:[1,12],23:[1,13],24:[1,14],26:[1,15],27:[2,4]},{8:26,10:5,11:6,12:7,13:[1,8],15:9,16:10,21:[1,11],22:[1,12],23:[1,13],24:[1,14],26:[1,15]},{5:[2,11],7:[2,11],9:[2,11],19:[2,11],20:[2,11],25:[2,11],27:[2,11]},{5:[2,14],7:[2,14],9:[2,14],13:[2,14],19:[2,14],20:[2,14],21:[2,14],22:[2,14],23:[2,14],24:[2,14],25:[2,14],26:[2,14],27:[2,14]},{8:27,10:5,11:6,12:7,13:[1,8],15:9,16:10,21:[1,11],22:[1,12],23:[1,13],24:[1,14],26:[1,15]},{8:29,10:5,11:6,12:7,13:[1,8],15:9,16:10,18:28,20:[1,30],21:[1,11],22:[1,12],23:[1,13],24:[1,14],26:[1,15]},{25:[1,31]},{7:[1,17],27:[1,32]},{5:[2,5],7:[2,5],27:[2,5]},{5:[2,7],7:[2,7],27:[2,7]},{5:[2,12],7:[2,12],9:[2,12],19:[2,12],20:[2,12],25:[2,12],27:[2,12]},{19:[1,33],20:[1,34]},{19:[2,17],20:[2,17]},{19:[2,18],20:[2,18]},{5:[2,25],7:[2,25],9:[2,25],13:[2,25],17:[2,25],19:[2,25],20:[2,25],21:[2,25],22:[2,25],23:[2,25],24:[2,25],25:[2,25],26:[2,25],27:[2,25]},{5:[2,26],7:[2,26],9:[2,26],13:[2,26],17:[2,26],19:[2,26],20:[2,26],21:[2,26],22:[2,26],23:[2,26],24:[2,26],25:[2,26],26:[2,26],27:[2,26]},{5:[2,16],7:[2,16],9:[2,16],13:[2,16],19:[2,16],20:[2,16],21:[2,16],22:[2,16],23:[2,16],24:[2,16],25:[2,16],26:[2,16],27:[2,16]},{8:35,10:5,11:6,12:7,13:[1,8],15:9,16:10,19:[2,20],20:[2,20],21:[1,11],22:[1,12],23:[1,13],24:[1,14],26:[1,15]},{19:[2,19],20:[2,19]}],
defaultActions: {16:[2,1]},
parseError: function parseError(str, hash) {
    throw new Error(str);
},
parse: function parse(input) {
    var self = this, stack = [0], vstack = [null], lstack = [], table = this.table, yytext = "", yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    this.lexer.setInput(input);
    this.lexer.yy = this.yy;
    this.yy.lexer = this.lexer;
    this.yy.parser = this;
    if (typeof this.lexer.yylloc == "undefined")
        this.lexer.yylloc = {};
    var yyloc = this.lexer.yylloc;
    lstack.push(yyloc);
    var ranges = this.lexer.options && this.lexer.options.ranges;
    if (typeof this.yy.parseError === "function")
        this.parseError = this.yy.parseError;
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
    function lex() {
        var token;
        token = self.lexer.lex() || 1;
        if (typeof token !== "number") {
            token = self.symbols_[token] || token;
        }
        return token;
    }
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == "undefined") {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
        if (typeof action === "undefined" || !action.length || !action[0]) {
            var errStr = "";
            if (!recovering) {
                expected = [];
                for (p in table[state])
                    if (this.terminals_[p] && p > 2) {
                        expected.push("'" + this.terminals_[p] + "'");
                    }
                if (this.lexer.showPosition) {
                    errStr = "Parse error on line " + (yylineno + 1) + ":\n" + this.lexer.showPosition() + "\nExpecting " + expected.join(", ") + ", got '" + (this.terminals_[symbol] || symbol) + "'";
                } else {
                    errStr = "Parse error on line " + (yylineno + 1) + ": Unexpected " + (symbol == 1?"end of input":"'" + (this.terminals_[symbol] || symbol) + "'");
                }
                this.parseError(errStr, {text: this.lexer.match, token: this.terminals_[symbol] || symbol, line: this.lexer.yylineno, loc: yyloc, expected: expected});
            }
        }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error("Parse Error: multiple actions possible at state: " + state + ", token: " + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(this.lexer.yytext);
            lstack.push(this.lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = this.lexer.yyleng;
                yytext = this.lexer.yytext;
                yylineno = this.lexer.yylineno;
                yyloc = this.lexer.yylloc;
                if (recovering > 0)
                    recovering--;
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {first_line: lstack[lstack.length - (len || 1)].first_line, last_line: lstack[lstack.length - 1].last_line, first_column: lstack[lstack.length - (len || 1)].first_column, last_column: lstack[lstack.length - 1].last_column};
            if (ranges) {
                yyval._$.range = [lstack[lstack.length - (len || 1)].range[0], lstack[lstack.length - 1].range[1]];
            }
            r = this.performAction.call(yyval, yytext, yyleng, yylineno, this.yy, action[1], vstack, lstack);
            if (typeof r !== "undefined") {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}
};
undefined/* Jison generated lexer */
var lexer = (function(){
var lexer = ({EOF:1,
parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
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
        if (this.options.ranges) this.yylloc.range = [0,0];
        this.offset = 0;
        return this;
    },
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) this.yylloc.range[1]++;

        this._input = this._input.slice(1);
        return ch;
    },
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length-len-1);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length-1);
        this.matched = this.matched.substr(0, this.matched.length-1);

        if (lines.length-1) this.yylineno -= lines.length-1;
        var r = this.yylloc.range;

        this.yylloc = {first_line: this.yylloc.first_line,
          last_line: this.yylineno+1,
          first_column: this.yylloc.first_column,
          last_column: lines ?
              (lines.length === oldLines.length ? this.yylloc.first_column : 0) + oldLines[oldLines.length - lines.length].length - lines[0].length:
              this.yylloc.first_column - len
          };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        return this;
    },
more:function () {
        this._more = true;
        return this;
    },
less:function (n) {
        this.unput(this.match.slice(n));
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
            tempMatch,
            index,
            col,
            lines;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i=0;i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (!this.options.flex) break;
            }
        }
        if (match) {
            lines = match[0].match(/(?:\r\n?|\n).*/g);
            if (lines) this.yylineno += lines.length;
            this.yylloc = {first_line: this.yylloc.last_line,
                           last_line: this.yylineno+1,
                           first_column: this.yylloc.last_column,
                           last_column: lines ? lines[lines.length-1].length-lines[lines.length-1].match(/\r?\n?/)[0].length : this.yylloc.last_column + match[0].length};
            this.yytext += match[0];
            this.match += match[0];
            this.matches = match;
            this.yyleng = this.yytext.length;
            if (this.options.ranges) {
                this.yylloc.range = [this.offset, this.offset += this.yyleng];
            }
            this._more = false;
            this._input = this._input.slice(match[0].length);
            this.matched += match[0];
            token = this.performAction.call(this, this.yy, this, rules[index],this.conditionStack[this.conditionStack.length-1]);
            if (this.done && this._input) this.done = false;
            if (token) return token;
            else return;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line '+(this.yylineno+1)+'. Unrecognized text.\n'+this.showPosition(),
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
    },
topState:function () {
        return this.conditionStack[this.conditionStack.length-2];
    },
pushState:function begin(condition) {
        this.begin(condition);
    }});
lexer.options = {};
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
lexer.rules = [/^(?:[ \t]+)/,/^(?:[⍝#].*)/,/^(?:[\n\r◇⋄])/,/^(?:¯?(?:0[xX][\da-fA-F]+|\d*\.?\d+(?:[eE][+¯]?\d+)?|¯)(?:[jJ]¯?(?:0[xX][\da-fA-F]+|\d*\.?\d+(?:[eE][+¯]?\d+)?|¯))?)/,/^(?:(?:'[^\\']*(?:\\.[^\\']*)*')+)/,/^(?:(?:"[^\\"]*(?:\\.[^\\"]*)*")+)/,/^(?:\[)/,/^(?:\])/,/^(?:;)/,/^(?:\()/,/^(?:\))/,/^(?:\{)/,/^(?:\})/,/^(?::)/,/^(?:←)/,/^(?:«[^»]*»)/,/^(?:∘.)/,/^(?:⎕?[A-Za-z_][A-Za-z_0-9]*)/,/^(?:[^¯'":«»])/,/^(?:$)/];
lexer.conditions = {"INITIAL":{"rules":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19],"inclusive":true}};
return lexer;})()
parser.lexer = lexer;
function Parser () { this.yy = {}; }Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();
if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
exports.parser = parser;
exports.Parser = parser.Parser;
exports.parse = function () { return parser.parse.apply(parser, arguments); }
exports.main = function commonjsMain(args) {
    if (!args[1])
        throw new Error('Usage: '+args[0]+' FILE');
    var source, cwd;
    if (typeof process !== 'undefined') {
        source = require('fs').readFileSync(require('path').resolve(args[1]), "utf8");
    } else {
        source = require("file").path(require("file").cwd()).join(args[1]).read({charset: "utf-8"});
    }
    return exports.parser.parse(source);
}
if (typeof module !== 'undefined' && require.main === module) {
  exports.main(typeof process !== 'undefined' ? process.argv.slice(1) : require("system").args);
}
}