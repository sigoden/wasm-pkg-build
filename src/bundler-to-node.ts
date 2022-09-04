#!/usr/bin/env node

import { parse, traverse, template, types, transformFromAstSync } from '@babel/core';
import fs from 'fs';
import generate from '@babel/generator';

const [bundlerFile, targetFile] = process.argv.slice(2);
if (!bundlerFile) {
  console.log('Usage: bundler-to-node <pkg_bg.js> <pkg.js>');
  process.exit(0);
}

let code: string;
try {
  code = fs.readFileSync(bundlerFile, 'utf-8');
} catch (err) {
  console.log(`error: failed to read '${bundlerFile}', ${err.message}`);
}
const ast = parse(code, { sourceType: 'module' });

let wasm: string = '';
traverse(ast, {
  enter(path) {
    if (path.isIdentifier({ name: 'lTextDecoder' })) {
      path.parentPath.parentPath.remove();
    } else if (path.isIdentifier({ name: 'lTextEncoder' })) {
      path.parentPath.parentPath.remove();
    } else if (path.isIdentifier({ name: 'cachedTextEncoder' })) {
      const node = path.parent as any;
      if (node?.init?.callee?.name) node.init.callee.name = 'TextEncoder'
    } else if (path.isIdentifier({ name: 'cachedTextDecoder' })) {
      const node = path.parent as any;
      if (node?.init?.callee?.name) node.init.callee.name = 'TextDecoder'
    } else if (path.type === 'ImportDeclaration') {
      let source: string = (path.node as any).source.value;
      if (source.endsWith(".wasm")) {
        wasm = source;
        path.remove();
      }
    }
  }
});

const newAst = transformFromAstSync(ast, null, {
  plugins: ["@babel/plugin-transform-modules-commonjs"],
  ast: true,
}).ast;


newAst.program.body = [
  ...template(`let imports = {};
imports['__wbindgen_placeholder__'] = module.exports;
let wasm;
const { TextDecoder, TextEncoder } = require(\`util\`);`)() as types.Statement[],
  ...newAst.program.body,
  ...template(`const path = require('path').join(__dirname, '${wasm.slice(2)}');
const bytes = require('fs').readFileSync(path);

const wasmModule = new WebAssembly.Module(bytes);
const wasmInstance = new WebAssembly.Instance(wasmModule, imports);
wasm = wasmInstance.exports;
module.exports.__wasm = wasm;`)() as types.Statement[],
]

const output = generate(newAst, {}, code).code
try {
  fs.writeFileSync(targetFile, output);
} catch (err) {
  console.log(`error: failed to write '${targetFile}', ${err.message}`);
  process.exit(2);
}
