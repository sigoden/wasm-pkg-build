import { ParseResult, traverse, types } from '@babel/core';

export function transformAst(ast: ParseResult, isWeb: boolean) {
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
          let left;
          if (isWeb) {
            left = types.memberExpression(types.memberExpression(types.identifier("imports"), types.stringLiteral(`./${wasmFilename}.js`), true), types.identifier(name))
          } else {
            left = types.memberExpression(types.memberExpression(types.identifier("module"), types.identifier("exports")), types.identifier(name))
          }
          const right = types.functionExpression(null, declaration.params, declaration.body);
          const assign = types.assignmentExpression(("="), left, right);
          wbindgenExports.push(types.expressionStatement(assign));
          path.remove();
      }
    }
  });
  return { ast, wasmFilename, wasmExportName, wbindgenExports };
}

export function inlineWasm(wasmData: string, isWeb: boolean) {
  if (isWeb) {
  return `
    const base64codes = [62,0,0,0,63,52,53,54,55,56,57,58,59,60,61,0,0,0,0,0,0,0,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,0,0,0,0,0,0,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51];
    
    function getBase64Code(charCode) {
      return base64codes[charCode - 43];
    }
    
    function base64Decode(str) {
      let missingOctets = str.endsWith("==") ? 2 : str.endsWith("=") ? 1 : 0;
      let n = str.length;
      let result = new Uint8Array(3 * (n / 4));
      let buffer;
    
      for (let i = 0, j = 0; i < n; i += 4, j += 3) {
          buffer =
              getBase64Code(str.charCodeAt(i)) << 18 |
              getBase64Code(str.charCodeAt(i + 1)) << 12 |
              getBase64Code(str.charCodeAt(i + 2)) << 6 |
              getBase64Code(str.charCodeAt(i + 3));
          result[j] = buffer >> 16;
          result[j + 1] = (buffer >> 8) & 0xFF;
          result[j + 2] = buffer & 0xFF;
      }
    
      return result.subarray(0, result.length - missingOctets);
    }
    
    input = base64Decode("${wasmData}")`
  } else {
    return `Buffer.from('${wasmData}', 'base64')`;
  }
}
