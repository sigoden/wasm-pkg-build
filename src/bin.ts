#!/usr/bin/env node

import path from 'path';
import { Argv } from 'yargs';
import yargs from 'yargs/yargs';
import { BuildOptions, build, transformForNode, transformForWeb, transformForWorker } from './index';
import { read, readString, write } from './utils';

yargs(process.argv.slice(2))
  .usage('$0 <cmd> [options]')
  .command('build [crate]', 'Build js package from wasm crate', (yargs) => {
    return yargs
      .positional('crate', {
        type: 'string',
        description: 'Path to wasm crate, must contains Cargo.toml'
      })
      .options('out-dir', {
        type: 'string',
        description: 'Output directory relative to crate. Defaults to `pkg`',
      })
      .options('out-name', {
        type: 'string',
        description: 'Set a custom output filename (Without extension), Defaults to crate name',
      })
      .options('cargo-args', {
        type: 'string',
        description: 'Extra args to pass to `cargo build`'
      })
      .options('wasm-bindgen-args', {
        type: 'string',
        description: 'Extra args to pass to `wasm-bindgen`',
      })
      .options('wasm-opt-args', {
        type: 'string',
        description: 'Extra args to pass to `wasm-opt`',
      })
      .options('verbose', {
        type: 'boolean',
        description: 'Whether to display extra compilation information in the console',
      })
      .options('debug', {
        type: 'boolean',
        description: 'Whether to build in debug mode or release mode'
      })
  }, (argv) => {
    const dir = path.resolve(argv.crate ?? process.cwd());
    const outDir = path.resolve(argv.outDir ?? path.resolve(dir, "pkg"));
    const options: BuildOptions = {
      dir,
      outDir,
      outName: argv.outName,
      verbose: !!argv.verbose,
      debug: !!argv.debug,
      cargoArgs: argv.cargoArgs ? argv.cargoArgs.split(' ') : [],
      wasmBindgenArgs: argv.wasmBindgenArgs ? argv.wasmBindgenArgs.split(' ') : [],
      wasmOptArgs: argv.wasmOptArgs ? argv.wasmOptArgs.split(' ') : ['-O'],
    };
    build(options).catch(err => {
      console.error(err);
      process.exit(1);
    })
  })
  .command('node <target>', 'Generate cjs module for node', (yargs) => {
    return convertOptions(yargs)
      .options('inline-wasm', {
        type: 'boolean',
        description: 'Inline wasm into generated js file',
      })
  }, (argv) => {
    run(argv, transformForNode)
  })
  .command('web <target>', 'Generate esm-async module for web', (yargs) => {
    return convertOptions(yargs)
      .options('inline-wasm', {
        type: 'boolean',
        description: 'Inline wasm into generated js file',
      })
  }, (argv) => {
    run(argv, transformForWeb)
  })
  .command('worker <target>', 'Generate esm-sync module for worker', (yargs) => {
    return convertOptions(yargs)
  }, (argv) => {
    argv.inlineWasm = true;
    run(argv, transformForWorker)
  })
  .help()
  .version()
  .demandCommand()
  .alias('h', 'help')
  .alias('v', 'version')
  .argv

async function run(argv, transform) {
  try {
    let wasmData;
    if (argv.inlineWasm) {
      const wasmFile = argv.wasmFile || argv.target.replace(/.js$/, '.wasm');
      const data = await read(wasmFile);
      wasmData = data.toString('base64');
    }
    const data = transform(await readString(argv.target), wasmData);
    if (argv.output) {
      await write(argv.output, data);
    } else {
      console.log(data);
    }
  } catch (err) {
    console.error(err)
    process.exit(1);
  }
}

function convertOptions(yargs: Argv) {
  return yargs
    .positional('target', {
      type: 'string',
      description: 'A js file generated by wasm-pack with _bg.js suffix'
    })
    .options('output', {
      alias: 'o',
      type: 'string',
      description: 'Sets the output js file path',
    })
    .options('wasm-file', {
      type: 'string',
      description: 'Specific wasm file path'
    })
}
