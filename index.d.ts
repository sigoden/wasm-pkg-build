/**
 * Transform bundler bg.js to cjs module
 * @param code - source code
 * @param wasmData - wasm code in base64
 * @returns Generated code
 */
export declare function transformForNode(code: string, wasmData?: string): string;

/**
 * Transform bundler bg.js to esm-web module
 * @param code - source code
 * @param wasmData - wasm code in base64
 * @returns Generated code
 */
export declare function transformForWeb(code: string, wasmData?: string): string;
