import { InstallOptions, getOrInstall, getLatestVersion } from './helper';
import which from 'which';

export async function getWasmBindgen(options: InstallOptions) {
  try {
    return await which('wasm-bindgen')
  } catch {}
  const [url, exePath] = await getUrlAndExePath('rustwasm', 'wasm-bindgen');
  return getOrInstall(url, exePath, options);
}

async function getUrlAndExePath(author: string, name: string) {
  const { arch, platform } = process;
  const version = await getLatestVersion(author, name);
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
        const fileName = `${baseURL}/${name}-${version}-x86_64-apple-darwin`;
        return [`${baseURL}/${fileName}.tar.gz`, `${fileName}/${name}`];
      }
      break;
    case 'linux':
      if (arch === 'x64') {
        const fileName = `${baseURL}/${name}-${version}-x86_64-unknown-linux-musl`;
        return [`${baseURL}/${fileName}.tar.gz`, `${fileName}/${name}`];
      }
      break;
  }

  throw new Error(`'${name}' is not supported on your platform`);
}