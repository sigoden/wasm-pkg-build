#/usr/bin/env bash

set -e

crate=test-crate
crate_pkg=${crate/-/_}

# @cmd
run() {
    ts-node src/bin.ts $@
}

# @cmd
build() {
    npm run build
}

# @cmd
build-crate() {
    wasm-pack build $crate
    cp $crate/package.json $crate/pkg
}

# @cmd
test() {
    echo Generate cjs
    ts-node src/bin.ts node ${crate}/pkg/${crate_pkg}_bg.js -o ${crate}/pkg/${crate_pkg}.js
    echo Generate cjs-inline
    ts-node src/bin.ts node --inline-wasm ${crate}/pkg/${crate_pkg}_bg.js -o ${crate}/pkg/${crate_pkg}_inline.js
    echo Generate esm-web
    ts-node src/bin.ts web ${crate}/pkg/${crate_pkg}_bg.js -o ${crate}/pkg/${crate_pkg}_web.js
    echo Generate esm-web-inline
    ts-node src/bin.ts web --inline-wasm ${crate}/pkg/${crate_pkg}_bg.js -o ${crate}/pkg/${crate_pkg}_web_inline.js
    echo Generate worker
    ts-node src/bin.ts worker ${crate}/pkg/${crate_pkg}_bg.js -o ${crate}/pkg/${crate_pkg}_worker.mjs
    node test-crate/test-node.js
    node test-crate/test-worker.mjs
}

eval $(argc --argc-eval "$0" "$@")