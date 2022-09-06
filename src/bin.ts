#!/usr/bin/env node

const fs = require('fs');
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')

yargs(hideBin(process.argv))
  .usage('$0 <cmd> [args]')
  .command('node <target>', 'Convert bundler to node target', (yargs) => {
    return commonOptions(yargs)
      .positional('target', {
        type: 'string',
        description: 'Wasm-pack generated <crate_name>_bg.js file'
      })
  }, (argv) => {
    run(argv, require('./bundler-to-node'))
  })
  .command('web <target>', 'Convert bundler to node target', (yargs) => {
    return commonOptions(yargs)
      .positional('target', {
        type: 'string',
        description: 'Wasm-pack generated bundler_bg.js file'
      })
  }, (argv) => {
    run(argv, require('./bundler-to-web'))
  })
  .help()
  .version()
  .demandCommand()
  .alias('h', 'help')
  .alias('v', 'version')
  .argv

function run(argv, mod) {
  let wasmData;
  if (argv.inlineWasm) {
    const wasmFile = argv.wasmFile || argv.target.replace(/.js$/, '.wasm');
    const data = readFile(wasmFile);
    wasmData = data.toString('base64');
  }
  const data = mod.transform(readFile(argv.target, 'utf8'), wasmData);
  if (argv.output) {
    writeFile(argv.output, data);
  } else {
    console.log(data);
  }
}

function commonOptions(yargs) {
  return yargs
    .options('output', {
      alias: 'o',
      type: 'string',
      description: 'Sets the output js file path',
    })
    .options('wasm-file', {
      type: 'string',
      description: 'Sepecific wasm file path'
    })
    .options('inline-wasm', {
      type: 'boolean',
      description: 'Inline wasm into generated js file',
    })
}

function readFile(bundlerFile: string, encoding?: string) {
  try {
    return fs.readFileSync(bundlerFile, encoding);
  } catch (err) {
    console.log(`error: failed to read '${bundlerFile}', ${err.message}`);
    process.exit(1);
  }
}

function writeFile(targetFile: string, data: string) {
  try {
    fs.writeFileSync(targetFile, data);
  } catch (err) {
    console.log(`error: failed to write '${targetFile}', ${err.message}`);
    process.exit(2);
  }
}
