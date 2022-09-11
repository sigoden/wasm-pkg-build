import chalk from "chalk";
import fs from "fs/promises";
import cp from "child_process";
import path from 'path';
import os from 'os';

export function debug(s: string) {
  console.debug(chalk.blue("> " + s));
}

export function info(s: string) {
  console.info(chalk.yellow(s));
}

export function rm(path: string) {
  return fs.rm(path, { recursive: true })
}

export function mv(from, to) {
  return fs.rename(from, to);
}

export function mkdir(path) {
  return fs.mkdir(path, { recursive: true });
}

export async function exists(path: string) {
  try {
    await fs.access(path)
    return true;
  } catch {
    return false;
  }
}

export function read(path: string) {
  return fs.readFile(path)
}

export function readString(path: string) {
  return fs.readFile(path, { encoding: "utf8" })
}

export function write(path: string, data: string | Buffer) {
  return fs.writeFile(path, data);
}

export function exec(cmd: string, options): Promise<string> {
  return new Promise((resolve, reject) => {
    cp.exec(cmd, options, (err, stdout, stderr) => {
      if (err) {
        reject(err);

      } else if (stderr.length > 0) {
        reject(stderr);

      } else {
        resolve(stdout as unknown as string);
      }
    });
  });
}

export function spawn(command: string, args: string[], options: cp.SpawnOptions) {
  return wait(cp.spawn(command, args, options));
}

export function wait(p): Promise<void> {
  return new Promise((resolve, reject) => {
    p.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error("Command `" + p.spawnargs.join(" ") + "` failed with error code: " + code));
      }
    });

    p.on("error", reject);
  });
}

const lockState = {
  locked: false,
  pending: [],
};

export async function lock<O>(f: () => Promise<O>) {
  if (lockState.locked) {
    await new Promise(function (resolve, reject) {
      lockState.pending.push(resolve);
    });

    if (lockState.locked) {
      throw new Error("Invalid lock state");
    }
  }

  lockState.locked = true;

  try {
    return await f();

  } finally {
    lockState.locked = false;

    if (lockState.pending.length !== 0) {
      const resolve = lockState.pending.shift();
      // Wake up pending task
      resolve();
    }
  }
}

export function getCacheDir(name: string) {
    switch (process.platform) {
    case "win32":
        const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local");
        return path.join(localAppData, name, "Cache");

    case "darwin":
        return path.join(os.homedir(), "Library", "Caches", name);

    // https://specifications.freedesktop.org/basedir-spec/basedir-spec-latest.html
    default:
        const cacheDir = process.env.XDG_CACHE_HOME || path.join(os.homedir(), ".cache");
        return path.join(cacheDir, name);
    }
}
