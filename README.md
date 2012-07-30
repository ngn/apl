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
Uses [Jison](http://zaach.github.com/jison/) for parsing

[Literate source code](http://ngn.github.com/apl/docs/builtins.html)

[In-browser demo](http://ngn.github.com/apl/web/index.html)

# Sample code

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

# Goodies

[Vim keymap and syntax](https://github.com/ngn/vim-apl)
