#!/usr/bin/env node

import { parse, traverse, types } from '@babel/core';
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

let wasmFilename: string = '';
const wbindgenExports: types.ExpressionStatement[] = []

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
    } else if (path.isImportDeclaration()) {
      let source: string = (path.node as any).source.value;
      if (source.endsWith(".wasm")) {
        wasmFilename = source.slice(2, -5);
        path.remove();
      }
    } else if (path.isExportNamedDeclaration()) {
        const declaration = path.node.declaration as types.FunctionDeclaration;
        const name = declaration?.id?.name;
        const left = types.memberExpression(types.memberExpression(types.identifier("module"), types.identifier("exports")), types.identifier(name))
        const right = types.functionExpression(null, declaration.params, declaration.body);
        const assign = types.assignmentExpression(("="), left, right);
        wbindgenExports.push(types.expressionStatement(assign));
        path.remove();
    }
  }
});

const middle = generate(ast).code
const output = `let imports = {};
imports['./${wasmFilename}.js'] = module.exports;
let wasm;
const { TextDecoder, TextEncoder } = require(\`util\`);
${middle}
${generate(types.program(wbindgenExports)).code}
const path = require('path').join(__dirname, '${wasmFilename}.wasm');
const bytes = require('fs').readFileSync(path);

const wasmModule = new WebAssembly.Module(bytes);
const wasmInstance = new WebAssembly.Instance(wasmModule, imports);
wasm = wasmInstance.exports;
module.exports.__wasm = wasm;`

try {
  fs.writeFileSync(targetFile, output);
} catch (err) {
  console.log(`error: failed to write '${targetFile}', ${err.message}`);
  process.exit(2);
}
