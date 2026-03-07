function getMagic(buffer) {
  if (!buffer || buffer.length < 4) return null;
  return buffer.subarray(0, 4);
}

function isMachO(magic) {
  if (!magic) return false;
  const hex = magic.toString('hex');
  return (
    hex === 'feedface' ||
    hex === 'cefaedfe' ||
    hex === 'feedfacf' ||
    hex === 'cffaedfe' ||
    hex === 'cafebabe' ||
    hex === 'bebafeca'
  );
}

function isELF(magic) {
  if (!magic) return false;
  return (
    magic[0] === 0x7f &&
    magic[1] === 0x45 &&
    magic[2] === 0x4c &&
    magic[3] === 0x46
  );
}

function isPE(magic) {
  if (!magic) return false;
  return magic[0] === 0x4d && magic[1] === 0x5a;
}

function isBinaryForPlatform(platform, magic) {
  if (platform === 'darwin') return isMachO(magic);
  if (platform === 'linux') return isELF(magic);
  if (platform === 'win32') return isPE(magic);
  return true;
}

function cjsDefault(mod) {
  return mod && typeof mod === 'object' && 'default' in mod ? mod.default : mod;
}

function resolveFromApp({ path, requireResolve }, request) {
  const appDir = path.resolve(__dirname, '..');
  return requireResolve(request, { paths: [appDir] });
}

function getElectronVersion({ fs, path, requireResolve }) {
  const electronPkgPath = resolveFromApp(
    { path, requireResolve },
    'electron/package.json',
  );
  const electronPkg = JSON.parse(fs.readFileSync(electronPkgPath, 'utf8'));
  return electronPkg.version;
}

function getBetterSqlite3Paths({ path, requireResolve }) {
  const pkgJson = resolveFromApp(
    { path, requireResolve },
    'better-sqlite3/package.json',
  );
  const pkgDir = path.dirname(pkgJson);
  const binaryPath = path.join(
    pkgDir,
    'build',
    'Release',
    'better_sqlite3.node',
  );
  return { pkgDir, binaryPath };
}

function runPrebuildInstall({ childProcess, pkgDir, electronVersion }) {
  const pnpmCmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  const args = [
    'exec',
    '--',
    'prebuild-install',
    '--runtime=electron',
    `--target=${electronVersion}`,
    `--arch=${process.arch}`,
    `--platform=${process.platform}`,
  ];

  const result = childProcess.spawnSync(pnpmCmd, args, {
    cwd: pkgDir,
    stdio: 'inherit',
    env: process.env,
  });

  if (result.status !== 0) {
    throw new Error(
      `prebuild-install failed with exit code ${result.status ?? 'unknown'}`,
    );
  }
}

async function main() {
  const fs = cjsDefault(await import('node:fs'));
  const path = cjsDefault(await import('node:path'));
  const childProcess = cjsDefault(await import('node:child_process'));
  const { createRequire } = cjsDefault(await import('node:module'));
  const requireResolve = createRequire(__filename).resolve;

  const electronVersion = getElectronVersion({ fs, path, requireResolve });
  const { pkgDir, binaryPath } = getBetterSqlite3Paths({
    path,
    requireResolve,
  });

  let needsInstall = false;
  if (!fs.existsSync(binaryPath)) {
    needsInstall = true;
  } else {
    const magic = getMagic(fs.readFileSync(binaryPath));
    needsInstall = !isBinaryForPlatform(process.platform, magic);
  }

  if (needsInstall) {
    try {
      fs.rmSync(binaryPath, { force: true });
    } catch (err) {
      void err;
    }
    runPrebuildInstall({ childProcess, pkgDir, electronVersion });
  }

  if (!fs.existsSync(binaryPath)) {
    throw new Error(`Missing native binding after install: ${binaryPath}`);
  }

  const magic = getMagic(fs.readFileSync(binaryPath));
  if (!isBinaryForPlatform(process.platform, magic)) {
    throw new Error(`Native binding platform mismatch: ${binaryPath}`);
  }
}

main().catch((err) => {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
