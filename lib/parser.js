(function() {
  var lexer,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  lexer = require('./lexer');

  exports.parse = function(aplCode) {
    var consume, demand, fail, parseBody, parseExpr, parseIndexable, parseIndices, parseItem, token, tokenStream;
    tokenStream = lexer.tokenize(aplCode);
    token = tokenStream.next();
    consume = function(tt) {
      var _ref;
      if (_ref = token.type, __indexOf.call(tt.split(' '), _ref) >= 0) {
        return token = tokenStream.next();
      }
    };
    demand = function(tt) {
      if (token.type !== tt) {
        fail("Expected " + tt + " but got " + token.type);
      }
      token = tokenStream.next();
    };
    fail = function(message) {
      throw Error("Syntax error: " + message + " at " + token.startLine + ":" + token.startCol + "\n" + (aplCode.split('\n')[token.startLine - 1]) + "\n" + (new Array(token.startCol).join('-') + '^'));
    };
    parseBody = function() {
      var body, expr, _ref, _ref1;
      body = ['body'];
      while (true) {
        if ((_ref = token.type) === 'eof' || _ref === '}') {
          return body;
        }
        while (consume('separator newline')) {}
        if ((_ref1 = token.type) === 'eof' || _ref1 === '}') {
          return body;
        }
        expr = parseExpr();
        if (consume(':')) {
          expr = ['guard', expr, parseExpr()];
        }
        body.push(expr);
      }
    };
    parseExpr = function() {
      var expr, item, _ref;
      expr = ['expr'];
      while (true) {
        item = parseItem();
        if (consume('←')) {
          return expr.concat([['assign', item, parseExpr()]]);
        }
        expr.push(item);
        if (_ref = token.type, __indexOf.call(') ] } : ; separator newline eof'.split(' '), _ref) >= 0) {
          return expr;
        }
      }
    };
    parseItem = function() {
      var item;
      item = parseIndexable();
      if (consume('[')) {
        item = ['index', item].concat(parseIndices());
        demand(']');
      }
      return item;
    };
    parseIndices = function() {
      var indices;
      indices = [];
      while (true) {
        if (consume(';')) {
          indices.push(null);
        } else if (token.type === ']') {
          indices.push(null);
          return indices;
        } else {
          indices.push(parseExpr());
          if (token.type === ']') {
            return indices;
          }
          demand(';');
        }
      }
    };
    parseIndexable = function() {
      var b, expr, t;
      t = token;
      if (consume('number string symbol embedded')) {
        return [t.type, t.value];
      } else if (consume('(')) {
        expr = parseExpr();
        demand(')');
        return expr;
      } else if (consume('{')) {
        b = parseBody();
        demand('}');
        return ['lambda', b];
      } else {
        return fail("Expected indexable but got " + token.type);
      }
    };
    return parseBody();
  };

}).call(this);
