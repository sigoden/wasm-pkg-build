import { parse, types } from '@babel/core';
import generate from '@babel/generator';
import { transformAst } from "./helper";

export default function transform(code: string) {
  const {
    ast,
    wasmFilename,
    wasmExportName,
    wbindgenExports
  } = transformAst(parse(code, { sourceType: 'module' }), true);

  const middle = generate(ast).code;
  return `
let ${wasmExportName};
${middle}
function getImports() {
    const imports = {};
    imports["./${wasmFilename}.js"] = {};
    ${generate(types.program(wbindgenExports)).code}
    return imports;
}

async function load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);

            } catch (e) {
                if (module.headers.get('Content-Type') != 'application/wasm') {
                    console.warn("\`WebAssembly.instantiateStreaming\` failed because your server does not serve wasm with \`application/wasm\` MIME type. Falling back to \`WebAssembly.instantiate\` which is slower. Original error:\\n", e);

                } else {
                    throw e;
                }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);

    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };

        } else {
            return instance;
        }
    }
}

export default async function init(input) {
    if (typeof input === 'undefined') {
        input = new URL('${wasmFilename}.wasm', import.meta.url);
    }
    const imports = getImports();

    if (typeof input === 'string' || (typeof Request === 'function' && input instanceof Request) || (typeof URL === 'function' && input instanceof URL)) {
        input = fetch(input);
    }

    const { instance, module } = await load(await input, imports);

    init.__${wasmExportName} = ${wasmExportName} = instance.exports;
    init.__wbindgen_wasm_module = module;
    cachedUint8Memory0 = new Uint8Array();

    return imports["./${wasmFilename}.js"];
}
  `;
}