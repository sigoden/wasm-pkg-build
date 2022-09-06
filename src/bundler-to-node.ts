import { parse, types } from '@babel/core';
import generate from '@babel/generator';
import { inlineWasm, transformAst } from './helper';

export const IS_WEB = false;

export function transform(code: string, wasmData?: string) {
  const {
    ast,
    wasmFilename,
    wbindgenExports
  } = transformAst(parse(code, { sourceType: 'module' }), IS_WEB);

  const middle = generate(ast).code
  return `let imports = {};
imports['./${wasmFilename}.js'] = module.exports;
let wasm;
const { TextDecoder, TextEncoder } = require(\`util\`);
${middle}
${generate(types.program(wbindgenExports)).code}
${generateLoadWasm(wasmFilename, wasmData)}

const wasmModule = new WebAssembly.Module(bytes);
const wasmInstance = new WebAssembly.Instance(wasmModule, imports);
wasm = wasmInstance.exports;
module.exports.__wasm = wasm;`
}

function generateLoadWasm(wasmFilename: string, wasmData?: string) {
  if (wasmData) {
    return `const bytes = ${inlineWasm(wasmData, IS_WEB)};`
  } else {
    return `const path = require('path').join(__dirname, '${wasmFilename}.wasm');
const bytes = require('fs').readFileSync(path);`
  }
}