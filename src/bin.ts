#!/usr/bin/env node

import { Command, InvalidOptionArgumentError } from 'commander';
import path from 'path';
import { BuildOptions, build, SUPPORT_MODULES } from './index';
import { getCacheDir } from './utils';

let pkg = require('../package.json');

const program = new Command();

program
  .description(pkg.description)
  .argument('[crate]', 'path to a wasm crate [default: <cwd>]')
  .option('--out-dir <dir>', 'output directory relative to crate [default: <crate>/pkg]')
  .option('--out-name <var>', 'set a custom output filename (Without extension) [default: <crate_name>]')
  .option('--verbose', 'whether to display extra compilation information in the console')
  .option('--debug', 'whether to build in debug mode or release mode')
  .option('--cargo-args <args>', `extra args to pass to 'cargo build'`)
  .option('--wasm-bindgen-args <args>', `extra args to pass to 'wasm-bindgen'`)
  .option('--wasm-opt-args <args>', `extra args to pass to 'wasm-opt'`)
  .option('--wasm-opt-version <ver>', `specify the version of 'wasm-opt' [default: latest]`)
  .option('--modules <modules>', `generate additional js modules(cjs,cjs-inline,esm,esm-inline,esm-sync) [default: 'cjs,esm']`, parseModules)
  .version(pkg.version)
  .action(crate => {
    const opts = program.opts();
    const dir = path.resolve(crate ?? process.cwd());
    const outDir = path.resolve(opts.outDir ?? path.resolve(dir, "pkg"));
    const options: BuildOptions = {
      dir,
      outDir,
      outName: opts.outName,
      verbose: !!opts.verbose,
      debug: !!opts.debug,
      modules: opts.modules ?? ['cjs', 'esm'],
      cargoArgs: opts.cargoArgs ? opts.cargoArgs.split(' ') : [],
      wasmBindgenArgs: opts.wasmBindgenArgs ? opts.wasmBindgenArgs.split(' ') : [],
      wasmOptArgs: opts.wasmOptArgs ? opts.wasmOptArgs.split(' ') : ['-O'],
      wasmOptVersion: opts.wasmOptVersion,
      install: {
        cacheDir: getCacheDir('wasm-pkg-build'),
        downloadBinaryTimeout: 60000,
        getVersionTimeout: 60000,
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        verbose: !!opts.verbose,
      }
    };
    build(options).catch(err => {
      console.error(err?.message || err);
      process.exit(1);
    })
  })
  .parse()

function parseModules(value: string) {
  const modules = value.split(',').map(v => v.trim());
  const unsupportedModules = modules.filter(v => SUPPORT_MODULES.indexOf(v) === -1);
  if (unsupportedModules.length > 0) {
    throw new InvalidOptionArgumentError(`Unsupported '${unsupportedModules.join(',')}'`);
  }
  return modules;
}
