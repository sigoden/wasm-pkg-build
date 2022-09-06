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