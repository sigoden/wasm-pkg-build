# wasm-pkg-build

[![CI](https://github.com/sigoden/wasm-pkg-build/actions/workflows/ci.yaml/badge.svg)](https://github.com/sigoden/aichat/actions/workflows/ci.yaml)
[![NPM Version](https://img.shields.io/npm/v/wasm-pkg-build)](https://www.npmjs.com/package/wasm-pkg-build)

Effortlessly create npm packages from Rust wasm crates.

## Key Features:

* **Simplified WASM Package Creation:** wasm-pkg-build automatically handles the process of compiling Rust crates, generating JavaScript bindings, and optimizing WASM files.
* **Single Package, Multiple Module Types:** wasm-pkg-build can produce a single npm package that supports multiple module types and shares a single WASM file.
* **Automated Tool Management:** wasm-pkg-build takes care of managing essential tools like wasm-bindgen and wasm-opt, ensuring you always have the latest versions.

## Installation

```bash
npm i -D wasm-pkg-build
yarn add --dev wasm-pkg-build
```

## Understanding Module Types

JavaScript utilizes CommonJS (CJS) and ECMAScript modules (ESM). WASM can be initialized synchronously or asynchronously.

**wasm-pkg-build** provides various module types to accommodate these differences:

| module      | sync | inline | target       |
| ----------- | ---- | ------ | ------------ |
| esm-bundler | -    | ✗      | -            |
| cjs         | ✓    | ✗      | node         |
| cjs-inline  | ✓    | ✓      | node         |
| esm         | ✗    | ✗      | web          |
| esm-inline  | ✗    | ✓      | web          |
| esm-sync    | ✓    | ✓      | worker, node |

`-inline` means the WASM binary is embedded within the JS file.

## Basic Usage Example

Let's say you have a Rust crate called `test_crate` with a function `greet`:

```rust
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn reverse(input: &str) -> String {
  return input.chars().rev().collect();
}
```

To build a package with all module types:

```bash
wasm-pkg-build test_crate --modules 'cjs,cjs-inline,esm,esm-inline,esm-sync' 
```

This generates files in the `pkg` directory (by default) for each module type:

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

## Importing Modules

Here's how you would import and use the generated modules in JavaScript:

* **CJS/CJS-inline:**

```js
const { reverse } = require("./pkg/test_crate.js"); // or ./pkg/test_crate_inline.js for inline
console.log(reverse("test_crate"));
```

* **ESM/ESM-inline:**

```js
import init from "./pkg/test_crate_web.js"; // or ./pkg/test_crate_web_inline.js for inline
init().then(mod => {
  console.log(mod.reverse("test_crate_web"));
})
```

* **ESM-sync:**

```js
import { reverse } from "./pkg/test_crate_worker.js";
console.log(reverse("test_crate"));
```

## Command-Line Usage

The command-line interface is straightforward and offers several options to customize your build:

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
  --wasm-opt-version <ver>    specify the version of 'wasm-opt' [default: latest]
  --modules <modules>         generate additional js modules(cjs,cjs-inline,esm,esm-inline,esm-sync) [default: 'cjs,esm']
  -V, --version               output the version number
  -h, --help                  display help for command
```

## License

The project is under the MIT License, Refer to the [LICENSE](https://github.com/sigoden/wasm-pkg-build/blob/main/LICENSE) file for detailed information.