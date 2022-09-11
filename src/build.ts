import $path from 'path';
import $toml from 'toml';
import { getWasmBindgen, getWasmOpt, InstallOptions } from './install';
import { exec, readString, spawn, info, debug, lock, mv, getCacheDir } from './utils';

export interface BuildOptions {
  dir: string,
  outDir: string,
  outName: string,
  cargoArgs: string[],
  wasmBindgenArgs: string[],
  wasmOptArgs: string[],
  verbose: boolean,
  debug: boolean,
  install: InstallOptions,
}

export async function build(options: BuildOptions) {
  const cargoTomlPath = $path.resolve(options.dir, 'Cargo.toml');

  const [targetDir, cargoToml] = await Promise.all([
    getTargetDir(options.dir),
    readString(cargoTomlPath),
  ]);

  return compileRust(targetDir, cargoToml, options);
}

async function getTargetDir(dir: string) {
  const metadata = await exec("cargo metadata --format-version 1 --no-deps --color never", { cwd: dir });
  return JSON.parse(metadata).target_directory;
}


async function compileRust(targetDir: string, cargoToml: string, options: BuildOptions) {
  const toml = $toml.parse(cargoToml);

  validateToml(toml);

  const name: string = toml.package.name.replace(/\-/g, "_");
  if (!options.outName) options.outName = name;

  try {
    return await lock(async function () {
      if (options.verbose) {
        debug(`Using target directory ${targetDir}`);
      }

      await runCargo(options);

      const wasmPath = $path.resolve($path.join(
        targetDir,
        "wasm32-unknown-unknown",
        (options.debug ? "debug" : "release"),
        name + ".wasm"
      ));

      if (options.verbose) {
        debug(`Generate ${wasmPath}`);
        debug(`Using output directory ${options.outDir}`);
      }

      await runWasmBindgen(wasmPath, options);

      if (!options.debug) {
        await runWasmOpt(options);
      }
      return name;
    });

  } catch (e) {
    if (options.verbose) {
      throw e;

    } else {
      const e = new Error("Rust compilation failed");
      e.stack = null;
      throw e;
    }
  }
}

function validateToml(toml) {
  if (toml.lib && Array.isArray(toml.lib["crate-type"]) && toml.lib["crate-type"].indexOf("cdylib") !== -1) {
    return;
  }

  throw new Error("Cargo.toml must use `crate-type = [\"cdylib\"]`");
}

async function runCargo(options: BuildOptions) {
  let cargoArgs = [
    "build",
    "--lib",
    "--target", "wasm32-unknown-unknown",
  ];

  if (!options.debug) {
    cargoArgs.push("--release");
  }

  if (options.cargoArgs) {
    cargoArgs = cargoArgs.concat(options.cargoArgs);
  }

  if (options.verbose) {
    debug(`Running cargo ${cargoArgs.join(" ")}`);
  }

  await spawn("cargo", cargoArgs, { cwd: options.dir, stdio: "inherit" });
}

async function runWasmBindgen(wasmPath: string, options: BuildOptions) {
  const wasmBindgenCommand = await getWasmBindgen(options.install)
  let wasmBindgenArgs: string[] = [
    "--out-dir", $path.relative(options.dir, options.outDir),
    "--out-name", options.outName,
    "--target", "bundler",
    wasmPath,
  ];

  if (options.debug) {
    wasmBindgenArgs = wasmBindgenArgs.concat(["--debug", "--no-demangle"]);
  }

  if (options.wasmBindgenArgs) {
    wasmBindgenArgs = wasmBindgenArgs.concat(options.wasmBindgenArgs);
  }

  if (options.verbose) {
    debug(`Running ${wasmBindgenCommand} ${wasmBindgenArgs.join(" ")}`);
  }

  await spawn(wasmBindgenCommand, wasmBindgenArgs, { cwd: options.dir, stdio: "inherit" });
}

async function runWasmOpt(options: BuildOptions) {
  const wasmOptCommand = await getWasmOpt(options.install)
  const path = `${options.outName}_bg.wasm`;
  const tmp = `${options.outName}_bg_opt.wasm`;

  const wasmOptArgs = [...options.wasmOptArgs, "--output", tmp, path];

  if (options.verbose) {
    debug(`Running ${wasmOptCommand} ${wasmOptArgs.join(" ")}`);
  }

  try {
    await spawn(wasmOptCommand, wasmOptArgs, { cwd: options.outDir, stdio: "inherit" });
  } catch (e) {
    info("wasm-opt failed: " + e.message)
    return;
  }

  await mv($path.join(options.outDir, tmp), $path.join(options.outDir, path));
}
