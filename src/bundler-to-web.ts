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

let wasmFilename = '';
let wasmExportName = '';
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
        wasmExportName = (path.node.specifiers[0] as any).local.name
        wasmFilename = source.slice(2, -5);
        path.remove();
      }
    } else if (path.isExportNamedDeclaration()) {
        const declaration = path.node.declaration as types.FunctionDeclaration;
        const name = declaration?.id?.name;
        const left = types.memberExpression(types.memberExpression(types.identifier("imports"), types.stringLiteral(`./${wasmFilename}.js`), true), types.identifier(name))
        const right = types.functionExpression(null, declaration.params, declaration.body);
        const assign = types.assignmentExpression(("="), left, right);
        wbindgenExports.push(types.expressionStatement(assign));
        path.remove();
      }
  }
});

const middle = generate(ast).code;
const output = `
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

try {
  fs.writeFileSync(targetFile, output);
} catch (err) {
  console.log(`error: failed to write '${targetFile}', ${err.message}`);
  process.exit(2);
}
