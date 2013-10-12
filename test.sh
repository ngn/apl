#!/bin/bash
set -e
source $(dirname "$0")/build

i=test/collectdoctests.coffee ; o=${i%.coffee}.js
[ $i -nt $o ] && echo "Compiling $i" && node_modules/.bin/coffee -abc $i

i=test/rundoctest.coffee ; o=${i%.coffee}.js
[ $i -nt $o ] && echo "Compiling $i" && node_modules/.bin/coffee -abc $i

i=test/rundoctests.coffee ; o=${i%.coffee}.js
[ $i -nt $o ] && echo "Compiling $i" && node_modules/.bin/coffee -abc $i

echo 'Running doctests'
node test/collectdoctests.js | node test/rundoctests.js

echo 'Running example tests'
test/examplestest.sh
