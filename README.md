# wasm-pack-utils

Utilities for wasm pack. 

Use wasm-pack-utils to generate all kinds of js module (esm-bundler, cjs, esm-async, esm-sync) share one wasm file.


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
wasm-pack-utils node test_crate_bg.js -o test_crate.js
```

The module is sync. it can only used in nodejs.

```js
const { reverse } = require("./pkg/test_crate.js");
console.log(reverse("test_crate"));
```

### Generate esm-async module

```sh
wasm-pack-utils web test_crate_bg.js -o test_crate_web.js
```

The module is async. it can only used in web.

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

### Generate esm-sync module

```sh
wasm-pack-utils worker test_crate_bg.js -o test_crate_web.js
```

The module is sync.  The wasm is inline into the `.js` file.  It can used in nodejs and web worker.

```js
import { reverse } from "./pkg/test_crate_worker.js";
console.log(reverse("test_crate"));
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