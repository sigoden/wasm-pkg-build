# wasm-pack utils

Utilities for wasm pack

## `bundler-to-node`

Convert bundler `${mod}_bg.js` to commonjs compatiable `${mod}.js` file

```
bundler-to-node pkg/mod_bg.js pkg/mod.js
```

So in your package.json, you can exports modules support both commonjs and esmodule.

```json
{
  "main": "mod.js",
  "module": "mod_bg.js",
}
```
