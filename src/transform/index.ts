
export const SUPPORT_MODULES = ['cjs', 'cjs-inline', 'esm', 'esm-inline', 'esm-sync'];

import { transform as transformCJS } from "./cjs";
import { transform as transformESM } from "./esm";
import { transform as transformESMSync } from "./esm-sync";

export function transform(module: string, wasmFilename, code: string, wasmData?: string) {
  switch (module) {
    case 'cjs':
      return transformCJS(wasmFilename, code);
    case 'cjs-inline':
      return transformCJS(wasmFilename, code, wasmData);
    case 'esm':
      return transformESM(wasmFilename, code);
    case 'esm-inline':
      return transformESM(wasmFilename, code, wasmData);
    case 'esm-sync':
      return transformESMSync(wasmFilename, code, wasmData);
    default:
      throw new Error(`Unsupported module ${module}`);
  }
}

export { transformCJS, transformESM, transformESMSync };