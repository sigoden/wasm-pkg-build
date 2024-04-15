import generate from '@babel/generator';
import { inlineWasm, Kind, transformAst } from './helper';

/**
 * Transform bundler bg.js to cjs module
 * @param wasmFilename - wasm file name e.g. test_crate_bg
 * @param code - source code
 * @param wasmData - wasm code in base64
 * @returns Generated code
 */
export function transform(wasmFilename: string, code: string, wasmData?: string) {
  const {
    ast,
  } = transformAst(code, Kind.Node);

  const middle = generate(ast).code
  return `let imports = {};
imports['./${wasmFilename}.js'] = module.exports;
let wasm;
const { TextDecoder, TextEncoder } = require(\`util\`);
${middle}
${generateLoadWasm(wasmFilename, wasmData)}

const wasmModule = new WebAssembly.Module(bytes);
const wasmInstance = new WebAssembly.Instance(wasmModule, imports);
wasm = wasmInstance.exports;
module.exports.__wasm = wasm;`
}

function generateLoadWasm(wasmFilename: string, wasmData?: string) {
  if (wasmData) {
    return `const bytes = ${inlineWasm(wasmData, Kind.Node)};`
  } else {
    return `const path = require('path').join(__dirname, '${wasmFilename}.wasm');
const bytes = require('fs').readFileSync(path);`
  }
}