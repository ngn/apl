#!/bin/bash
set -e
source $(dirname "$0")/build

i=test/doctest.coffee ; o=test/doctest.js
[ $i -nt $o ] && echo "Compiling $i" && node_modules/.bin/coffee -b -c $i

echo 'Running doctests'
node test/doctest.js

echo 'Running example tests'
test/examplestest.sh
