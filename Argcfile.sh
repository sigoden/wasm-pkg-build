#/usr/bin/env bash

set -e

crate=test-crate

# @cmd
run() {
    npx ts-node src/bin.ts $@
}

# @cmd
build() {
    npm run build
}

# @cmd
test() {
    local name=${crate/-/_}
    npx ts-node src/bin.ts $crate --verbose --modules cjs,esm,cjs-inline,esm-inline,esm-sync
    cp $crate/package.json $crate/pkg
    cp $crate/pkg/${name}_worker.js $crate/pkg/${name}_worker.mjs
    node test-crate/test-node.js
    node test-crate/test-worker.mjs
}

eval "$(argc --argc-eval "$0" "$@")"