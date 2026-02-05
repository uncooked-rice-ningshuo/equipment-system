const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Ensure logs directory exists
const projectRoot = path.resolve(__dirname, '..');
const logDir = path.join(projectRoot, 'logs');

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Generate log file name with timestamp
const now = new Date();
const timestamp = now
  .toISOString()
  .replace(/T/, '_')
  .replace(/\..+/, '')
  .replace(/:/g, '-');
const logFile = path.join(logDir, `build_${timestamp}.log`);

const logStream = fs.createWriteStream(logFile, { flags: 'a' });

console.log(`\n📋 Logs will be saved to: ${logFile}\n`);

function log(message) {
  process.stdout.write(message);
  logStream.write(message);
}

function runCommand(command, args, cwd = projectRoot) {
  return new Promise((resolve, reject) => {
    const fullCommand = `${command} ${args.join(' ')}`;
    const startMsg = `\n[${new Date().toLocaleTimeString()}] 🚀 Executing: ${fullCommand}\n`;
    log(startMsg);

    const child = spawn(command, args, {
      cwd,
      shell: true,
      stdio: ['inherit', 'pipe', 'pipe'],
      env: { ...process.env, FORCE_COLOR: 'true' }, // Try to keep colors
    });

    child.stdout.on('data', (data) => {
      // Direct pass-through of buffer to preserve formatting
      process.stdout.write(data);
      // Strip ANSI codes for log file
      const str = data.toString();
      const cleanStr = str.replace(
        /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
        '',
      );
      logStream.write(cleanStr);
    });

    child.stderr.on('data', (data) => {
      process.stderr.write(data);
      const str = data.toString();
      const cleanStr = str.replace(
        /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
        '',
      );
      logStream.write(cleanStr);
    });

    child.on('close', (code) => {
      if (code === 0) {
        log(
          `\n[${new Date().toLocaleTimeString()}] ✅ Command completed successfully: ${fullCommand}\n`,
        );
        resolve();
      } else {
        const errorMsg = `\n[${new Date().toLocaleTimeString()}] ❌ Command failed with code ${code}: ${fullCommand}\n`;
        log(errorMsg);
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    child.on('error', (err) => {
      const errorMsg = `\n[${new Date().toLocaleTimeString()}] ❌ Command error: ${
        err.message
      }\n`;
      log(errorMsg);
      reject(err);
    });
  });
}

async function main() {
  const target = process.argv[2];

  if (!target) {
    console.error('Error: Please specify a target platform (mac, win, linux).');
    console.error('Usage: node scripts/build-and-publish.js <target>');
    process.exit(1);
  }

  const validTargets = ['mac', 'win', 'linux'];
  if (!validTargets.includes(target)) {
    console.error(
      `Error: Invalid target "${target}". Supported targets: ${validTargets.join(
        ', ',
      )}`,
    );
    process.exit(1);
  }

  try {
    log(`Starting build and publish process for ${target}...\n`);

    // 1. Run Build
    // Corresponds to "npm run build:<target>"
    await runCommand('npm', ['run', `build:${target}`]);

    // 2. Run Publish
    // Corresponds to "npm run publish:feishu"
    await runCommand('npm', ['run', 'publish:feishu']);

    log(`\n🎉 All steps completed successfully! Logs saved to ${logFile}\n`);
  } catch (error) {
    console.error('\n💥 Build process failed. See logs for details.');
    process.exit(1);
  } finally {
    logStream.end();
  }
}

main();
