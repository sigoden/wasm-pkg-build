# wasm-pack-utils

wasm-pack-utils is a alternative to wasm-pack.

wasm-pack-utils generate all kinds of wasm js modules (esm-bundler, cjs, esm-async, esm-sync) shares same wasm file. 

## Install

```
npm i -D wasm-pack-utils
```

## Get Started

Javascript has two module type: cjs and esm.

WebAssembly has two initialization style: sync(`WebAssembly.Instance`) and async(`WebAssembly.instantiate`/`WebAssembly.instantiateStreaming`).

There is also an option to inline wasm into a single js file.

So the wasm js module has the following module types:

| name        | sync | inline | target       | cli                                |
| ----------- | ---- | ------ | ------------ | ---------------------------------- |
| esm-bundler | -    | ✗      | -            | wasm-pack-utils build              |
| cjs         | ✓    | ✗      | node         | wasm-pack-utils node               |
| cjs-inline  | ✓    | ✓      | node         | wasm-pack-utils node --inline-wasm |
| esm-async   | ✗    | ✗      | web          | wasm-pack-utils web                |
| esm-inline  | ✗    | ✓      | web          | wasm-pack-utils web --inline-wasm  |
| esm-sync    | ✓    | ✓      | worker, node | wasm-pack-utils worker             |


Generate cjs module:

```
cd test-crate
wasm-pack-utils build
wasm-pack-utils node pkg/test_crate_bg.js -o pkg/test_crate.js
```

Import cjs/cjs-inline module:

```js
const { reverse } = require("./pkg/test_crate.js");
console.log(reverse("test_crate"));
```

Import esm-async/esm-inline module:

```js
import init from "./pkg/test_crate_web.js";
init().then(mod => {
  console.log(mod.reverse("test_crate_web"));
})
```

Import esm-sync module:

```js
import { reverse } from "./pkg/test_crate_worker.js";
console.log(reverse("test_crate"));
```

### Best practice

Use `module` to export esm-bundler module.
Use `main` to export cjs module, so it can works on node just like plain js modules. 
Also includes esm-async module, so it can run on the web without a bundler.

```json
{
  "name": "test-crate",
  "version": "0.1.0",
  "main": "test_crate.js",
  "module": "test_crate_bg.js",
  "types": "test_crate.d.ts",
  "files": [
    "test_crate_bg.wasm",
    "test_crate_bg.wasm.d.ts",
    "test_crate_bg.js",
    "test_crate.js",
    "test_crate.d.ts",
    "test_crate_web.js",
    "test_crate_web.d.ts",
  ],
  "sideEffects": false,
}
```
