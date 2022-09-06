# wasm-pack-utils

Utilities for wasm pack. 

Use wasm-pack-utils to generate all kinds of js module (esm-bundler, esm-web, esm-web-inline, cjs, cjs-inline) share one wasm file.


## Install

```
npm i wasm-pack-utils
```

## Usage

First, You need generate module with wasm-pack

```
wasm-pack build
```

### Generate cjs module 

```sh
wasm-pack-utils node -o test_crate.js test_crate_bg.js 
```

```js
const { reverse } = require("./pkg/test_crate.js");
console.log(reverse("test_crate"));
```

### Generate esm-web module

```sh
wasm-pack-utils web -o test_crate_web.js test_crate_bg.js
```

```html
  <script type="module" src="/test-web.js"></script>
  <script>
  import init from "./pkg/test_crate_web.js";

  async function main() {
    const mod = await init()
    console.log(mod.reverse("test_crate_web"));
  }

  main()
  </script>
```

### Modify package.json

Use `main` to export cjs module, so it can works on node just like normal node modules. 
Also includes `*_web.js`, so it can works on web without need a bunder.

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
    "test_crate.d.ts"
    "test_crate_web.js",
    "test_crate_web.d.ts",
  ],
  "sideEffects": false,
}
```

### Inline wasm 

You can also inline the `.wasm` file into the `.js` file. 

This is slower and it increases the file size by ~33%, but it does not require a separate `.wasm` file.

For cjs, run
```
wasm-pack-utils node --inline-wasm -o test_crate_inline.js test_crate_bg.js 
```

For esm-web, run
```
wasm-pack-utils node --inline-wasm -o test_crate_web_inline.js test_crate_bg.js 
```
