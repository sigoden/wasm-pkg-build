import { parse } from '@babel/core';
import generate from '@babel/generator';
import { inlineWasm, transformAst, Kind } from './helper';


/**
 * Transform bundler bg.js to esm-sync module
 * @param wasmFilename - wasm file name e.g. test_crate_bg
 * @param code - source code
 * @param wasmData - wasm code in base64
 * @returns Generated code
 */
export function transform(wasmFilename: string, code: string, wasmData?: string) {
  const {
    ast,
    wasmExportName,
    exportNames,
  } = transformAst(code, Kind.Worker);

  const middle = generate(ast).code;
  return `
let ${wasmExportName};
${middle}
function getImports() {
    const imports = {};
    imports["./${wasmFilename}.js"] = {};
${exportNames.map(name => `    imports["./${wasmFilename}.js"].${name}=${name}`).join("\n")}
    return imports;
}

const imports = getImports();
let input;
${inlineWasm(wasmData, Kind.Worker)}

const wasmModule = new WebAssembly.Module(input);
const wasmInstance = new WebAssembly.Instance(wasmModule, imports);
wasm = wasmInstance.exports;
export const __wasm = wasm;`
}
