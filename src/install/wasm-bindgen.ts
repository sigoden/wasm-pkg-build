import { InstallOptions, getOrInstall } from './helper';

export async function getWasmBindgen(options: InstallOptions, version: string) {
  const [url, exePath] = await getUrlAndExePath('rustwasm', 'wasm-bindgen', version);
  return getOrInstall(url, exePath, options);
}

async function getUrlAndExePath(author: string, name: string, version: string) {
  const { arch, platform } = process;
  const baseURL = `https://github.com/${author}/${name}/releases/download/${version}`;

  switch (platform) {
    case 'win32':
      if (arch === 'x64') {
        const fileName = `${name}-${version}-x86_64-pc-windows-msvc`;
        return [`${baseURL}/${fileName}.tar.gz`, `${fileName}/${name}.exe`];
      }
      break;
    case 'darwin':
      if (arch === 'x64') {
        const fileName = `${name}-${version}-x86_64-apple-darwin`;
        return [`${baseURL}/${fileName}.tar.gz`, `${fileName}/${name}`];
      } else if (arch == 'arm64') {
        const fileName = `${name}-${version}-aarch64-apple-darwin`;
        return [`${baseURL}/${fileName}.tar.gz`, `${fileName}/${name}`];
      }
      break;
    case 'linux':
      if (arch === 'x64') {
        const fileName = `${name}-${version}-x86_64-unknown-linux-musl`;
        return [`${baseURL}/${fileName}.tar.gz`, `${fileName}/${name}`];
      } else if (arch == 'arm64') {
        const fileName = `${name}-${version}-aarch64-unknown-linux-gnu`;
        return [`${baseURL}/${fileName}.tar.gz`, `${fileName}/${name}`];
      }
      break;
  }

  throw new Error(`'${name}' is not supported on your platform`);
}