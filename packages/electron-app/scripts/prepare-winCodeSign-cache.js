const WIN_CODESIGN_VERSION = '2.6.0';
const WIN_CODESIGN_URL = `https://github.com/electron-userland/electron-builder-binaries/releases/download/winCodeSign-${WIN_CODESIGN_VERSION}/winCodeSign-${WIN_CODESIGN_VERSION}.7z`;

function cjsDefault(mod) {
  return mod && typeof mod === 'object' && 'default' in mod ? mod.default : mod;
}

function getCacheRootDir(path, os) {
  const localAppData = process.env.LOCALAPPDATA;
  if (localAppData) {
    return path.join(localAppData, 'electron-builder', 'Cache', 'winCodeSign');
  }
  return path.join(
    os.homedir(),
    'AppData',
    'Local',
    'electron-builder',
    'Cache',
    'winCodeSign',
  );
}

function downloadToFile(https, fs, url, filePath) {
  return new Promise((resolve, reject) => {
    const request = https.get(
      url,
      {
        headers: {
          'User-Agent': 'node',
          Accept: 'application/octet-stream',
        },
      },
      (response) => {
        if (
          response.statusCode &&
          response.statusCode >= 300 &&
          response.statusCode < 400 &&
          response.headers.location
        ) {
          response.resume();
          downloadToFile(https, fs, response.headers.location, filePath).then(
            resolve,
            reject,
          );
          return;
        }

        if (response.statusCode !== 200) {
          const err = new Error(
            `Download failed: ${url} (${response.statusCode})`,
          );
          response.resume();
          reject(err);
          return;
        }

        const file = fs.createWriteStream(filePath);
        response.pipe(file);
        file.on('finish', () => file.close(resolve));
        file.on('error', reject);
      },
    );

    request.on('error', reject);
  });
}

async function exists(fsp, p) {
  try {
    await fsp.access(p);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(fsp, p) {
  await fsp.mkdir(p, { recursive: true });
}

async function removeDir(fsp, p) {
  await fsp.rm(p, { recursive: true, force: true });
}

async function main() {
  const fs = cjsDefault(await import('node:fs'));
  const fsp = cjsDefault(await import('node:fs/promises'));
  const https = cjsDefault(await import('node:https'));
  const os = cjsDefault(await import('node:os'));
  const path = cjsDefault(await import('node:path'));
  const { spawnSync } = cjsDefault(await import('node:child_process'));

  const cacheRoot = getCacheRootDir(path, os);
  const destDir = path.join(cacheRoot, `winCodeSign-${WIN_CODESIGN_VERSION}`);
  const marker = path.join(destDir, 'windows-10', 'x64', 'signtool.exe');

  if (await exists(fsp, marker)) {
    return;
  }

  await ensureDir(fsp, cacheRoot);
  await removeDir(fsp, destDir);
  await ensureDir(fsp, destDir);

  const tmpArchivePath = path.join(
    os.tmpdir(),
    `winCodeSign-${WIN_CODESIGN_VERSION}.7z`,
  );
  await downloadToFile(https, fs, WIN_CODESIGN_URL, tmpArchivePath);

  const sevenZipBin = cjsDefault(await import('7zip-bin'));
  const sevenZipPath = sevenZipBin.path7za;

  try {
    await fsp.chmod(sevenZipPath, 0o755);
  } catch (err) {
    void err;
  }

  const result = spawnSync(
    sevenZipPath,
    ['x', '-y', '-bd', tmpArchivePath, `-o${destDir}`, '-x!darwin'],
    { stdio: 'inherit' },
  );

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(
      `Extract winCodeSign failed (status=${result.status}, signal=${
        result.signal ?? 'null'
      })`,
    );
  }

  if (!(await exists(fsp, marker))) {
    throw new Error('winCodeSign cache prepared but marker file is missing');
  }
}

main().catch((err) => {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
