#/usr/bin/env bash

set -e

# @cmd
run() {
    ts-node src/bin.ts $@
}

# @cmd
build() {
    npm run build
}

# @cmd
test() {
    local crate=test-crate
    local name=${crate/-/_}
    wasm-pack build $crate
    ts-node src/bin.ts node ${crate}/pkg/${name}_bg.js -o ${crate}/pkg/${name}.js
    ts-node src/bin.ts node --inline-wasm ${crate}/pkg/${name}_bg.js -o ${crate}/pkg/${name}_inline.js
    ts-node src/bin.ts web ${crate}/pkg/${name}_bg.js -o ${crate}/pkg/${name}_web.js
    ts-node src/bin.ts web --inline-wasm ${crate}/pkg/${name}_bg.js -o ${crate}/pkg/${name}_web_inline.js
    node test-crate/test-node.js
}

eval $(argc --argc-eval "$0" "$@")