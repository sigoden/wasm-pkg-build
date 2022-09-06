import { parse, types } from '@babel/core';
import generate from '@babel/generator';
import { transformAst } from './helper';

export default function transform(code: string) {
  const {
    ast,
    wasmFilename,
    wbindgenExports
  } = transformAst(parse(code, { sourceType: 'module' }), false);

  const middle = generate(ast).code
  return `let imports = {};
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
}
