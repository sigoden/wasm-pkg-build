
import path, { join } from 'node:path';
import axios, { AxiosRequestConfig } from 'axios';
import * as tar from 'tar';
import { exists, mkdir, debug } from '../utils';

export interface InstallOptions {
  verbose: boolean
  cacheDir: string,
  fetch: AxiosRequestConfig,
}

export async function getLatestVersion(author: string, name: string, command?: string) {
  try {
    let opts: AxiosRequestConfig = {};
    if (process.env["GITHUB_TOKEN"]) {
      opts.headers = { "Authorization": `token ${process.env["GITHUB_TOKEN"]}` };
    }
    const res = await axios.get(`https://api.github.com/repos/${author}/${name}/releases/latest`, opts)
    return res.data.tag_name
  } catch (err) {
    throw new Error(`Failed to get latest version of '${command ?? name}', ${err?.message || err}`);
  }
}


export async function getOrInstall(url: string, exePath: string, options: InstallOptions) {
  const name = path.basename(exePath, '.exe');
  const binaryPath = join(options.cacheDir, exePath);
  
  if (await exists(binaryPath)) {
    return binaryPath
  }

  mkdir(options.cacheDir);

  if (options.verbose) {
    debug(`Downloading ${name} from ${url}`);
  }

  return axios({ ...options.fetch, url, responseType: "stream" })
    .then(res => {
      return new Promise<void>((resolve, reject) => {
        const sink = res.data.pipe(
          tar.x({ C: options.cacheDir })
        );
        sink.on("finish", () => resolve());
        sink.on("error", err => reject(err));
      });
    })
    .then(() => {
      if (options.verbose) {
        debug(`Install ${name} to ${binaryPath}`);
      }
      return binaryPath
    })
    .catch(e => {
      throw new Error(`Failed to install ${name}, ${e.message}`);
    });
}