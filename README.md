<pre>
      _           _     ____                                                _
     | |         / \   |  _ \ _ __ ___   __ _ _ __ __ _ _ __ ___  _ __ ___ (_)_ __   __ _
   __| |__      / _ \  | |_) | '__/ _ \ / _` | '__/ _` | '_ ` _ \| '_ ` _ \| | '_ \ / _` |
  / _   _ \    / ___ \ |  __/| | | (_) | (_| | | | (_| | | | | | | | | | | | | | | | (_| |
 / / | | \ \  /_/   \_\|_|   |_|  \___/ \__, |_|  \__,_|_| |_| |_|_| |_| |_|_|_| |_|\__, |
 | | | | | |                  _         |___/                                       |___/
 \ \_| |_/ /                 | |    __ _ _ __   __ _ _   _  __ _  __ _  ___
  \__   __/                  | |   / _` | '_ \ / _` | | | |/ _` |/ _` |/ _ \
 ____| |____                 | |__| (_| | | | | (_| | |_| | (_| | (_| |  __/
|___________|                |_____\__,_|_| |_|\__, |\__,_|\__,_|\__, |\___|
                                               |___/             |___/
</pre>

An APL interpreter written in [CoffeeScript](http://jashkenas.github.com/coffee-script/)<br/>
Runs on [node.js](http://nodejs.org/) or in a browser<br/>
Uses [Jison](http://zaach.github.com/jison/) for parsing

See [`web/index.html`](http://ngn.github.com/apl/web/index.html)
for an in-browser demo.<br/>
To run an APL script, install node.js and type: `bin/apl examples/life.apl`

[Annotated source code](http://ngn.github.com/apl/docs/interpreter.html) is
available in literate programming style.

# Stuff

Most symbols have roughly the same semantics as in
[Dyalog](http://docs.dyalog.com/13.0/Dyalog%20APL%20Language%20Reference.v13.0.pdf)
or [APLX](http://www.microapl.co.uk/apl/APLXLangRef.pdf):

    1 2 3 + 5  ⍝ gives 6 7 8
    ¯1 − 2     ⍝ negative number -1 minus 2 ("minus" is not the ASCII hyphen, but U+2212)
    2 × 3 + 4  ⍝ 14, all functions have the same precedence, and are right-associative
    ⍳ 5        ⍝ 0 1 2 3 4
    2 3 ⍴ ⍳ 6  ⍝ matrix with 0 1 2 in the first row and 3 4 5 in the second
    6 ? 49     ⍝ randomly select 6 numbers between 0 and 48
    +/ 3 5 8   ⍝ 16, slash is the "reduce" operator, so plus-slash means "sum"
    A +.× B    ⍝ matrix multiplication
    ⍉ 1⊖[2]H   ⍝ rotate hypercube H by one at its third axis and then transpose it

Lambda expressions:

    f ← {⍺+2×⍵}    ⍝ ⍺ and ⍵ are the left and right formal parameters
    5 f 3          ⍝ gives 11

Embedded JavaScript:

    3 + «Math.sqrt(25)»    ⍝ gives 8

Getter-setter variables:

    r←3            ⍝ radius
    get_c←{○ r×2}  ⍝ circumference
    get_S←{○ r⋆2}  ⍝ surface
    ⌊ r c S        ⍝ gives 3 18 28  ("⌊" is the floor function)
    r←5
    ⌊ r c S        ⍝ gives 5 31 78

Continuation-passing style throughout the interpreter:

    // Invocation à la node.js
    interpreter.exec("1 + 2 ⍝ Some APL code", function (err, result) {
        // result comes later if APL code does any I/O
    });

Vim keymap and syntax highlighting at [ngn/vim-apl](https://github.com/ngn/vim-apl)
