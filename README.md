# wasm-pkg-build

`wasm-pkg-build` build wasm js pkg from wasm-bindgen crate.

It can generate various wasm js modules (esm-bundler, cjs, esm, esm-inline, esm-sync) that share the same wasm file.

## Install

```
npm i -D wasm-pkg-build
```

## CLI

```
Usage: wasm-pkg-build [options] [crate]

Generate wasm js modules from a wasm crate

Arguments:
  crate                       path to a wasm crate [default: <cwd>]

Options:
  --out-dir <dir>             output directory relative to crate [default: <crate>/pkg]
  --out-name <var>            set a custom output filename (Without extension) [default: <crate_name>]       
  --verbose                   whether to display extra compilation information in the console
  --debug                     whether to build in debug mode or release mode
  --cargo-args <args>         extra args to pass to 'cargo build'
  --wasm-bindgen-args <args>  extra args to pass to 'wasm-bindgen'
  --wasm-opt-args <args>      extra args to pass to 'wasm-opt'
  --modules <modules>         generate additional js modules(cjs,cjs-inline,esm,esm-inline,esm-sync)
                              [default: 'cjs,esm']
  -V, --version               output the version number
  -h, --help                  display help for command
```

Generate a wasm js package

```
wasm-pkg-build test-crate
```

Generate a wasm js package with all modules

```
wasm-pkg-build test-crate --modules 'cjs,cjs-inline,esm,esm-inline,esm-sync' 
```

Will produce files

```
package.json
test_crate.d.ts            
test_crate.js              # cjs
test_crate_bg.js           # esm-bundler
test_crate_bg.wasm         
test_crate_bg.wasm.d.ts
test_crate_inline.js       # cjs-inline
test_crate_web.js          # esm
test_crate_web_inline.js   # esm-inline
test_crate_worker.js       # esm-sync
```

## Modules

Javascript has two module type: cjs and esm.

WebAssembly has two initialization style: sync(`WebAssembly.Instance`) and async(`WebAssembly.instantiate`/`WebAssembly.instantiateStreaming`).

There is also an option to inline wasm into a single js file.

So a wasm js module may have following module type:

| module      | sync | inline | target       |
| ----------- | ---- | ------ | ------------ |
| esm-bundler | -    | ✗      | -            |
| cjs         | ✓    | ✗      | node         |
| cjs-inline  | ✓    | ✓      | node         |
| esm         | ✗    | ✗      | web          |
| esm-inline  | ✗    | ✓      | web          |
| esm-sync    | ✓    | ✓      | worker, node |


import cjs/cjs-inline module:

```js
const { reverse } = require("./pkg/test_crate.js");
console.log(reverse("test_crate"));
```

import esm/esm-inline module:

```js
import init from "./pkg/test_crate_web.js";
init().then(mod => {
  console.log(mod.reverse("test_crate_web"));
})
```

import esm-sync module:

```js
import { reverse } from "./pkg/test_crate_worker.js";
console.log(reverse("test_crate"));
```
