import fs from "node:fs/promises";
import cp from "node:child_process";
import path from 'node:path';
import { promisify } from "node:util";
import os from 'node:os';
import chalk from "chalk";

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

export function exec(cmd: string, options) {
  return promisify(cp.exec)(cmd, options);
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
