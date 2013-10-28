#!/bin/bash

# If one command fails, the whole script fails:
set -e

cd $(dirname "$0")

cd ../examples/
for f in *.apl; do
    echo "Testing $f"
    ../lib/apl.js $f >tmp
    diff tmp ${f/.apl/.out} # fails if the files are different
done
rm tmp
echo 'Done.'
