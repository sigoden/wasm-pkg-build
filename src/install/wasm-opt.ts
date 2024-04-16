import { getLatestVersion, getOrInstall, InstallOptions } from "./helper";

export async function getWasmOpt(options: InstallOptions, version?: string) {
  if (!version || version == "latest") {
    const repo = { owner: "WebAssembly", name: "binaryen", command: "wasm-opt" };
    version = await getLatestVersion(repo, options);
  } else if (/^\d+$/.test(version)) {
    version = "version_" + version;
  }
  const [url, exePath] = await getUrlAndExePath('WebAssembly', 'binaryen', version);
  return getOrInstall(url, exePath, options);
}

async function getUrlAndExePath(author: string, name: string, version: string) {
  const { arch, platform } = process;
  const baseURL = `https://github.com//${author}/${name}/releases/download/${version}`;
  const execPath = `${name}-${version}/bin/wasm-opt`;

  switch (platform) {
    case 'win32':
      if (arch === 'x64') {
        return [`${baseURL}/${name}-${version}-x86_64-windows.tar.gz`, `${execPath}.exe`];
      }
      break;
    case 'darwin':
      if (arch === 'arm64') {
        return [`${baseURL}/${name}-${version}-arm64-macos.tar.gz`, execPath];
      }
      if (arch === 'x64') {
        return [`${baseURL}/${name}-${version}-x86_64-macos.tar.gz`, execPath];
      }
      break;
    case 'linux':
      if (arch === 'x64') {
        return [`${baseURL}/${name}-${version}-x86_64-linux.tar.gz`, execPath];
      }
      break;
  }

  throw new Error(`'wasm-opt' is not supported on your platform`);
}
