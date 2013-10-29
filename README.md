<pre>
  _   _  ____ _   _          _
 | \ | |/ ___| \ | |        | |
 |  \| | |  _|  \| |      __| |__
 | |\  | |_| | |\  |     / _   _ \
 |_| \_|\____|_| \_|    / / | | \ \
    _    ____  _        | | | | | |
   / \  |  _ \| |       \ \_| |_/ /
  / _ \ | |_) | |        \__   __/
 / ___ \|  __/| |___    ____| |____
/_/   \_\_|   |_____|  |___________|
</pre>

[![Build Status](https://travis-ci.org/ngn/apl.png?branch=master)](https://travis-ci.org/ngn/apl)

An [APL](https://en.wikipedia.org/wiki/APL_%28programming_language%29) compiler written in [CoffeeScript](http://jashkenas.github.com/coffee-script/)<br>
Runs on [NodeJS](http://nodejs.org/) or in a browser<br>

**[In-browser demo](http://ngn.github.com/apl/web/index.html)**

Supports: most primitives, dfns (`{⍺ ⍵}`), nested arrays, complex numbers
(`1j2`), infinities (`¯`), forks and hooks, strand assignment (`a b←c`), index
assignment (`a[b]←c`)

Doesn't support: traditional functions (`∇R←X f Y`), non-zero index origin
(`⎕IO`), comparison tolerance (`⎕CT`), prototypes, NaN-s, function assignment
(`x+←1`), custom operators (`{⍺⍺ ⍵⍵}`), control structures (`:If`),
object-oriented features, namespaces

[More info](https://github.com/ngn/vector-article/#readme)

# Usage

Install [NodeJS](http://nodejs.org/).

Download [apl.js](http://ngn.github.io/apl/lib/apl.js) and make it executable:

    wget http://ngn.github.io/apl/lib/apl.js
    chmod +x apl.js

Running `./apl.js` without arguments starts a REPL.

Running it with an argument executes an APL script:

    ./apl.js filename.apl

It can be `require()`d as a CommonJS module:

    var apl = require('./apl');
    console.log(apl('1 2 3 + 4 5 6').toString());

or used in an HTML page:

    <script src="http://ngn.github.io/apl/lib/apl.js">
    <script>
        var result = apl('1 2 3 + 4 5 6'); // apl is a global variable
    </script>

# Editor support

[Vim keymap and syntax](https://github.com/ngn/vim-apl)
