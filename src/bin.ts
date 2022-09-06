#!/usr/bin/env node

const fs = require("fs");
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
    const data = require("./bundler-to-node").default(readFile(argv.target));
    if (argv.output) {
      writeFile(argv.output, data);
    } else {
      console.log(data);
    }
  })
  .command('web <target>', 'Convert bundler to node target', (yargs) => {
    return commonOptions(yargs)
      .positional('target', {
        type: 'string',
        description: 'Wasm-pack generated bundler_bg.js file'
      })
  }, (argv) => {
    const data = require("./bundler-to-web").default(readFile(argv.target));
    if (argv.output) {
      writeFile(argv.output, data);
    } else {
      console.log(data);
    }
  })
  .help()
  .version()
  .demandCommand()
  .alias("h", "help")
  .alias("v", "version")
  .argv


function commonOptions(yargs) {
  return yargs.options('output', {
    alias: 'o',
    type: 'string',
    description: 'Sets the output js file path',
  })
}

function readFile(bundlerFile: string) {
  try {
    return fs.readFileSync(bundlerFile, 'utf-8');
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