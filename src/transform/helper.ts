/**
 * Transform Helper
 * 
 * The main differences between the generated _bg.js files are listed below
 * 
 * 1. < 0.2.83
 * import * as wasm from './<name>.wasm'
 * 
 * 2. >- now
 * 
 * [const l... = ...;]
 * let wasm;
 * export function __wbg_set_wasm(val) {
 *     wasm = val;
 * }
 * 
 */

import { parse, traverse, NodePath, types } from '@babel/core';
import * as t from '@babel/types';
import generate from '@babel/generator';

export enum Kind {
  Node,
  Web,
  Worker,
}

export function transformAst(code: string, kind: Kind) {
  let wasmExportName = '';
  if (code.startsWith("import * as wasm")) {
    code = code.split("\n").slice(1).join("\n");
    wasmExportName = "wasm";
  } else if (code.match(/^let wasm;$/m)) {
    // Remove the wasm export
    code = code.replace(/let wasm;\nexport function __wbg_set_wasm\(val\) {\n    wasm = val;\n}\n/, "")
    wasmExportName = "wasm";
  } else {
    throw new Error("Your current wasm-bindgen is not supported yet")
  }

  const ast = parse(code, { sourceType: 'module' }) as t.Node
  const exportNames: string[] = [];
  const memviews: string[] = [];

  traverse(ast, {
    enter(path) {
      if (path.isVariableDeclarator() && pathLevel(path) === 1) {
        let id = path.node.id;
        if (types.isIdentifier(id)) {
          if (['lTextDecoder', 'lTextEncoder'].indexOf(id.name) > -1) {
            if (kind !== Kind.Worker) path.parentPath.remove();
          } else if (['cachedTextEncoder', 'cachedTextDecoder'].indexOf(id.name) > -1) {
            if (kind !== Kind.Worker) {
              let init = path.node.init;
              if (types.isNewExpression(init)) {
                if (types.isIdentifier(init.callee)) {
                  init.callee.name = id.name.replace(/cached/, '')
                }
              }
            }
          } else if (id.name.startsWith("cachedUint")) {
            if (kind == Kind.Web) {
              memviews.push(`${id.name} = ${stringifyAst(path.node.init)}`);
            }
          }
        }
      } else if (path.isExportNamedDeclaration()) {
        const declaration = path.node.declaration;
        if (types.isFunctionDeclaration(declaration)) {
          const name = declaration?.id?.name;
          if (kind !== Kind.Node) {
            exportNames.push(name);
          } else {
            const body = (path.parent as any).body;
            const left = types.memberExpression(types.memberExpression(types.identifier("module"), types.identifier("exports")), types.identifier(name))
            const right = types.functionExpression(null, declaration.params, declaration.body);
            const assign = types.assignmentExpression(("="), left, right);
            body.push(types.expressionStatement(assign));
            path.remove();
          }
        } else if (types.isClassDeclaration(declaration)) {
          const name = declaration.id.name;
          if (kind !== Kind.Node) {
            exportNames.push(name);
          } else {
            const body = (path.parent as any).body;
            body.push(declaration);
            const left = types.memberExpression(types.memberExpression(types.identifier("module"), types.identifier("exports")), types.identifier(name))
            const assign = types.assignmentExpression(("="), left, types.identifier(name));
            body.push(types.expressionStatement(assign));
            path.remove();
          }
        }
      }
    }
  });
  return { ast, wasmExportName, exportNames, memviews };
}

export function inlineWasm(wasmData: string, kind: Kind) {
  if (kind !== Kind.Node) {
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


function pathLevel(path: NodePath, level = 0) {
  const parentPath = path.parentPath;
  if (!parentPath || parentPath.type === "Program") {
    return level
  }
  return pathLevel(parentPath, level + 1);
}

function stringifyAst(node: types.Node) {
  return generate(node).code
}