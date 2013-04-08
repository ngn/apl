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

An APL compiler written in [CoffeeScript](http://jashkenas.github.com/coffee-script/)<br/>
Runs on [node.js](http://nodejs.org/) or in a browser<br/>

**[In-browser demo](http://ngn.github.com/apl/web/index.html)**

**[Mobile demo](http://ngn.github.com/apl/m/index.html)** (still a web page,
but intended for small touchscreens)

# Wtf is this?

APL is a programming language that's

* **ancient:** It was conceived in the 1960s based on a Harvard professor's
  mathematical notation, which he published in a book titled "A Programming
  Language", hence the name.

* **array-oriented:** Every variable is viewed as a multi-dimensional array; in
  particular, scalars are 0-dimensional arrays.  When a function is applied on
  an array, it acts on all items simultaneously.

* **bizarre:** APL uses non-ASCII characters for most of its built-in
  functions.  When it was invented, ASCII hadn't yet been established as a
  standard anyway.

* **elegant:** APL code tends to be very concise and expressive.  Many
  well-known algorithms can literally fit into several characters.  What is
  more, code is agnostic about the number of dimensions, so it often works
  without modification for higher-dimensional inputs.

This project is an attempt to breathe back life into APL for a modern
execution environment, namely the ubiquitous JavaScript.

# Sample code

Classic examples

    1 2 3 + 4 5 6  ⍝ returns 5 7 9; the array 1 2 3 added to 4 5 6, item by item
    7 + 4 5 6      ⍝ returns 11 12 13; the scalar 7 is extended to match the length of 4 5 6
    ¯1             ⍝ the high minus (¯) is used for negative numbers
    2j3 ÷ 4j5      ⍝ complex numbers; AjB stands for A+iB in the usual math notation
    2 × 3 + 4      ⍝ = 2 × (3 + 4); all functions have the same precedence and are right-associative
    ⍳ 5            ⍝ the iota, or index generator; returns 0 1 2 3 4
    3 ≤ 4          ⍝ returns 1; integers 0 and 1 are used as booleans
    3 ≤ ⍳ 5        ⍝ returns 0 0 0 1 1; the 3 is compared against each item in ⍳5
    2 3 ⍴ ⍳ 6      ⍝ a matrix with 0 1 2 in the first row and 3 4 5 in the second
    6 ? 49         ⍝ randomly select 6 distinct numbers between 0 and 48
    +/ 3 5 8       ⍝ 16, slash is the "reduce" operator, so plus-slash means "sum"
    +/[k] A        ⍝ summation along the k-th axis
    A +.× B        ⍝ matrix multiplication; . is an operator, it gives the inner product of two functions
    ⌊3.14          ⍝ 3; functions have double meaning; e.g. with only one (right) arg, ⌊ means "floor"
    7⌊5            ⍝ 5; with 2 args it means "minimum"; 1-arg is said to be "monadic", 2-arg "dyadic"

Lambda expressions

    f ← {⍺+2×⍵}    ⍝ ⍺ and ⍵ are the left and right formal parameters
    5 f 3          ⍝ would return 11

Map, filter, reduce

    a ← 1 2 3 4
    {1+3×⍵} a      ⍝ map; simply apply the function on the array; returns 4 7 10 13
    ({⍵>2} a) / a  ⍝ filter; returns 3 4; note that here / is used as a function, not operator
    {⍺×⍵} / a      ⍝ reduce; returns 24; here / is an operator, it takes a function on the left
    ×/a            ⍝ same as {⍺×⍵}/a
    {(⍺×t)+⍵} / a  ⍝ evaluate polynomial with coefficients a at point t

Head and tail (or `car` and `cdr`, if you prefer)

    a ← 5 6 7 8
    1 ↑ a          ⍝ returns 5; pronounced "one take of a"
    1 ↓ a          ⍝ returns 6 7 8; pronounced "one drop of a"

Tacit programming

    (f g) x        ⍝ this is called a hook, equivalent to: x f g x
    (÷⍟) N         ⍝ N÷log(N) = approx number of primes below N
    x (f g) y      ⍝ dyadic hook: x f g y
    (f g h) x      ⍝ a fork: (f x) g (h x)
    avg ← +/ ÷ ⍴   ⍝ arithmetic mean
    x (f g h) y    ⍝ dyadic fork: (x f y) g (x h y)
    7 (+,-) 4      ⍝ sum and difference, returns 11 3
    ((−b)(+,−)D⋆÷2) ÷ 2×a   ⍝ solutions to a quadratic equation


# Some unorthodox additions

The index origin is fixed at 0

    ⎕IO                    ⍝ returns 0
    ⎕IO ← 1                ⍝ gives an error

Embedded JavaScript

    3 + «Math.sqrt(25)»    ⍝ returns 8

Computed variables are syntactically indistinguishable from other variables

    r←3                    ⍝ radius
    get_c←{○ r×2}          ⍝ circumference
    get_S←{○ r⋆2}          ⍝ surface
    ⌊ r c S                ⍝ gives 3 18 28  ("⌊" is the floor function)
    r←5
    ⌊ r c S                ⍝ gives 5 31 78

# Usage

As a hashbang interpreter for APL scripts:

    sudo npm install apl -g

    cat >a.apl <<EOF
    #!/usr/bin/env apl
    ⎕ ← 'Hell, oh, world!'
    EOF

    chmod +x a.apl
    ./a.apl

As a compiler:

    apl -c a.apl
    node a.js

As a library:

    npm install apl
    node <<EOF
    var apl = require('apl');
    console.info(apl('1 2 3 + 4 5 6'));
    EOF

# Integration with CoffeeScript

The `apl` command is capable of compiling and running `.coffee` files which
contain a mixture of CoffeeScript and APL (it uses
[coffee-subscript](https://github.com/ngn/coffee-subscript) to do that).  APL
fragments should be enclosed in guillemets (`«»`) or indented as the body of a
squiggly arrow function (`~>`):

    #!/usr/bin/env apl

    a = [4, 3, 8]
    console.info «⌽a» # prints [8, 3, 4]
    avg = «+/÷⍴»
    console.info avg a # prints 5

    counter = 0
    tick = ~>
      ⍝ Read/write access to variables from enclosing CoffeeScript scopes
      counter ← counter + 1

    for [0...10] then tick()
    console.info counter # prints 10

# Editor support

[Vim keymap and syntax](https://github.com/ngn/vim-apl)

# How you can help

Spread the word about this project.

Design a logo.

And here is a list of features I would love to include but I didn't have the
time or skill to implement yet; your ideas or contributions in code are
welcome:

* namespaces
* destructuring assignment (`a b[1] (⌽c) ← 1 2 (3 4)`)
* function assignment (`a +← 1`)
* del syntax for functions (`∇ result ← left f right`)
* laminate (`,[.5]`)
* syntax for user-defined operators (`⍺⍺` and `⍵⍵`)
* matrix inverse and matrix divide (`⌹`)
* partition with axis (dyadic `⊂`)
* pick (monadic `⊃`)
* format by specification (dyadic `⍎`)
* expand (`\` and `⍀` when applied to nouns)
* inner product (`.`) for ranks higher than 2
* synchronous readline from stdin (getters for `⎕` and `⍞`)
* an APL keyboard layout
* an APL mode for Emacs
