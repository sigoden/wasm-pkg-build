
import path, { join } from 'node:path';
import axios, { AxiosRequestConfig } from 'axios';
import * as tar from 'tar';
import { exists, mkdir, debug } from '../utils';

export interface InstallOptions {
  verbose: boolean
  cacheDir: string,
  downloadBinaryTimeout: number,
  getVersionTimeout: number,
  userAgent: string,
}

export interface GithubProject {
  owner: string,
  name: string,
  command?: string,
}

export async function getLatestVersion(project: GithubProject, options: InstallOptions) {
  const command = project.command || project.name;
  const url = `https://api.github.com/repos/${project.owner}/${project.name}/releases/latest`;
  debug(`Fetching ${url} to get latest version of ${command}`);
  let axiosOptions: AxiosRequestConfig = {
    timeout: options.getVersionTimeout,
    headers: {
      "User-Agent": options.userAgent,
    }
  };
  if (process.env["GITHUB_TOKEN"]) {
    axiosOptions.headers["Authorization"] = `token ${process.env["GITHUB_TOKEN"]}`;
  }
  try {
    const res = await axios.get(url, axiosOptions)
    return res.data.tag_name
  } catch (err) {
    throw new Error(`Failed to get latest version of ${command}, ${err?.message || err}`);
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

  return axios({ url, responseType: "stream", timeout: options.downloadBinaryTimeout, headers: { "User-Agent": options.userAgent } })
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
      throw new Error(`Failed to install ${name} to ${binaryPath}, ${e.message}`);
    });
}