
export const SUPPORT_MODULES = ['cjs', 'cjs-inline', 'esm', 'esm-inline', 'esm-sync'];

import { transform as transformCJS } from "./cjs";
import { transform as transformESM } from "./esm";
import { transform as transformESMSync } from "./esm-sync";

export function transform(module: string, code: string, wasmData?: string) {
  switch (module) {
    case 'cjs':
      return transformCJS(code);
    case 'cjs-inline':
      return transformCJS(code, wasmData);
    case 'esm':
      return transformESM(code);
    case 'esm-inline':
      return transformESM(code, wasmData);
    case 'esm-sync':
      return transformESMSync(code, wasmData);
    default:
      throw new Error(`Unsupported module ${module}`);
  }
}

export { transformCJS, transformESM, transformESMSync };