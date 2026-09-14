const asar = require('@electron/asar');
const path = require('path');
const fs = require('fs');

async function repack() {
  const rootDir = path.resolve(__dirname, '..');
  const staging = path.join(rootDir, 'scratch', 'asar_staging');
  if (fs.existsSync(staging)) fs.rmSync(staging, { recursive: true, force: true });
  fs.mkdirSync(staging, { recursive: true });

  fs.copyFileSync(path.join(rootDir, 'main.js'), path.join(staging, 'main.js'));
  fs.copyFileSync(path.join(rootDir, 'preload.js'), path.join(staging, 'preload.js'));
  fs.copyFileSync(path.join(rootDir, 'package.json'), path.join(staging, 'package.json'));
  fs.copyFileSync(path.join(rootDir, 'version.json'), path.join(staging, 'version.json'));

  function copyDir(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    for (const item of fs.readdirSync(src)) {
      const s = path.join(src, item);
      const d = path.join(dest, item);
      if (fs.statSync(s).isDirectory()) {
        copyDir(s, d);
      } else {
        fs.copyFileSync(s, d);
      }
    }
  }

  copyDir(path.join(rootDir, 'wallpaper-ui'), path.join(staging, 'wallpaper-ui'));

  const targets = [
    path.join(rootDir, 'app', 'v2.5.3', 'win-unpacked', 'resources', 'app.asar')
  ];

  for (const destAsar of targets) {
    if (fs.existsSync(path.dirname(destAsar))) {
      await asar.createPackage(staging, destAsar);
      console.log(`[ASAR] Repacked: ${destAsar} (${(fs.statSync(destAsar).size / (1024 * 1024)).toFixed(2)} MB)`);
    }
  }
}

repack().catch(console.error);
