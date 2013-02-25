(function() {
  var define,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __slice = [].slice;

  if (typeof define !== 'function') {
    define = require('amdefine')(module);
  }

  define(['./compiler', 'optimist', 'fs'], function(compiler, optimist, fs) {
    var compile, exec, isArray, main, nodes, printAST, repl;
    nodes = compiler.nodes, compile = compiler.compile, exec = compiler.exec;
    main = function() {
      var a, aplCode, argv, b, cs, ctx, fakeRequire, filename, isCoffeeScript, jsCode, k, knownOptions, pp;
      argv = optimist.usage('Usage: apl [options] path/to/script.apl [args]\n\nIf called without options, `apl` will run your script.').describe({
        c: 'compile to JavaScript and save as .js files',
        h: 'display this help message',
        i: 'run an interactive APL REPL',
        n: 'print out the parse tree that the parser produces',
        p: 'print out the compiled JavaScript',
        s: 'listen for and compile scripts over stdio'
      }).alias({
        c: 'compile',
        h: 'help',
        i: 'interactive',
        n: 'nodes',
        p: 'print',
        s: 'stdio'
      }).boolean('chinps'.split('')).argv;
      if (argv.help) {
        return optimist.showHelp();
      }
      knownOptions = 'c compile h help i interactive n nodes p print s stdio _'.split(' ');
      for (k in argv) {
        if (!((__indexOf.call(knownOptions, k) < 0) && !k.match(/^\$\d+/))) {
          continue;
        }
        process.stderr.write("Unknown option, \"" + k + "\"\n\n");
        optimist.showHelp();
        return;
      }
      if (argv.interactive && (argv.compile || argv.nodes || argv.print || argv.stdio)) {
        process.stderr.write('Option -i (--interactive) is incompatible with the following options:\n  -c, --compile\n  -n, --nodes\n  -p, --print\n  -s, --stdio\n\n');
        optimist.showHelp();
        return;
      }
      if (argv.interactive && argv._.length) {
        process.stderr.write('Option -i (--interactive) cannot be used with positional arguments.\n\n');
        optimist.showHelp();
        return;
      }
      ctx = {
        '⍵': (function() {
          var _i, _len, _ref, _results;
          _ref = argv._;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            a = _ref[_i];
            _results.push(a.split(''));
          }
          return _results;
        })()
      };
      if (argv.interactive || !(argv._.length || argv.stdio)) {
        return repl(ctx);
      }
      aplCode = argv.stdio ? Buffer.concat((function() {
        var _results;
        _results = [];
        while (true) {
          b = new Buffer(1024);
          k = fs.readSync(0, b, 0, b.length, null);
          if (!k) {
            break;
          }
          _results.push(b.slice(0, k));
        }
        return _results;
      })()).toString('utf8') : (isCoffeeScript = /\.coffee$/.test(argv._[0]), fs.readFileSync(argv._[0], 'utf8'));
      if (argv.nodes) {
        printAST(nodes(aplCode));
        return;
      }
      if (isCoffeeScript) {
        cs = require('coffee-script');
        pp = require('coffee-subscript');
        jsCode = cs.compile(pp.preprocess(aplCode));
      } else {
        jsCode = compile(aplCode);
      }
      if (argv.compile) {
        if (isCoffeeScript) {
          jsCode = "\#!/usr/bin/env node\n" + jsCode;
        } else {
          jsCode = "\#!/usr/bin/env node\nvar _ = require('apl').createGlobalContext();\n" + jsCode;
        }
        if (argv.stdio || argv.print) {
          return process.stdout.write(jsCode);
        } else {
          filename = argv._[0].replace(/\.(apl|coffee)$/, '.js');
          return fs.writeFileSync(filename, jsCode, 'utf8');
        }
      } else {
        if (isCoffeeScript) {
          fakeRequire = function() {
            var args;
            args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
            if (args.length === 1 && args[0] === 'apl') {
              return require('./apl');
            } else {
              return require.apply(null, args);
            }
          };
          return (new Function("var require = arguments[0];\n" + jsCode))(fakeRequire);
        } else {
          return (new Function("var _ = arguments[0];\n" + jsCode))(require('./apl').createGlobalContext());
        }
      }
    };
    repl = function(ctx) {
      var format, readline, rl;
      readline = require('readline');
      rl = readline.createInterface(process.stdin, process.stdout);
      rl.setPrompt('APL> ');
      format = require('./formatter').format;
      rl.on('line', function(line) {
        var result;
        try {
          if (!line.match(/^[\ \t\f\r\n]*$/)) {
            result = exec(line, {
              extraContext: ctx
            });
            process.stdout.write(format(result).join('\n') + '\n');
          }
        } catch (e) {
          console.error(e);
        }
        rl.prompt();
      });
      rl.on('close', function() {
        process.stdout.write('\n');
        process.exit(0);
      });
      rl.prompt();
    };
    printAST = function(x, indent) {
      var y, _i, _len, _ref;
      if (indent == null) {
        indent = '';
      }
      if (isArray(x)) {
        if (x.length === 2 && !isArray(x[1])) {
          console.info(indent + x[0] + ' ' + JSON.stringify(x[1]));
        } else {
          console.info(indent + x[0]);
          _ref = x.slice(1);
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            y = _ref[_i];
            printAST(y, indent + '  ');
          }
        }
      } else {
        console.info(indent + JSON.stringify(x));
      }
    };
    isArray = function(x) {
      return ((x != null ? x.length : void 0) != null) && typeof x !== 'string';
    };
    return {
      main: main
    };
  });

}).call(this);
