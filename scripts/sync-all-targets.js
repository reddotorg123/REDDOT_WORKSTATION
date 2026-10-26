const fs = require('fs');
const path = require('path');
const asar = require('@electron/asar');

async function syncAllTargets() {
  console.log('=== REDDOT WORKSTATION OS • MASTER MULTI-TARGET SYNC ===');
  const rootDir = path.resolve(__dirname, '..');

  function copyDirRecursive(src, dest) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const item of fs.readdirSync(src)) {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      if (fs.statSync(srcPath).isDirectory()) {
        copyDirRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  // Common Staging for ASAR Repack
  const staging = path.join(rootDir, 'scratch', 'asar_staging');
  if (fs.existsSync(staging)) fs.rmSync(staging, { recursive: true, force: true });
  fs.mkdirSync(staging, { recursive: true });

  fs.copyFileSync(path.join(rootDir, 'main.js'), path.join(staging, 'main.js'));
  fs.copyFileSync(path.join(rootDir, 'preload.js'), path.join(staging, 'preload.js'));
  fs.copyFileSync(path.join(rootDir, 'package.json'), path.join(staging, 'package.json'));
  fs.copyFileSync(path.join(rootDir, 'version.json'), path.join(staging, 'version.json'));
  copyDirRecursive(path.join(rootDir, 'wallpaper-ui'), path.join(staging, 'wallpaper-ui'));

  // TARGET 1: Installed Application in AppData\Local\Programs
  const possibleInstalledDirs = [
    path.join(process.env.LOCALAPPDATA, 'Programs', 'REDDOT Workstation OS', 'resources'),
    path.join(process.env.LOCALAPPDATA, 'Programs', 'REDDOT-Workstation-OS', 'resources')
  ];

  for (const parentResources of possibleInstalledDirs) {
    if (fs.existsSync(parentResources)) {
      console.log(`[TARGET 1] Syncing installed app.asar: ${parentResources}`);
      const unpackedApp = path.join(parentResources, 'app');
      if (fs.existsSync(unpackedApp)) {
        try { fs.rmSync(unpackedApp, { recursive: true, force: true }); } catch (_) {}
      }
      const targetAsar = path.join(parentResources, 'app.asar');
      try {
        await asar.createPackage(staging, targetAsar);
        console.log(`  -> Successfully repacked: ${targetAsar} (${(fs.statSync(targetAsar).size / (1024 * 1024)).toFixed(2)} MB)`);
      } catch (err) {
        console.warn(`  -> Could not repack installed asar: ${err.message}`);
      }
    }
  }

  // TARGET 2: Hotpatch in AppData\Roaming\reddot-workstation-os\hotpatch\wallpaper-ui
  const hotpatchDir = path.join(process.env.APPDATA, 'reddot-workstation-os', 'hotpatch');
  const hotpatchUiDir = path.join(hotpatchDir, 'wallpaper-ui');
  console.log(`[TARGET 2] Syncing hotpatch directory: ${hotpatchUiDir}`);
  if (!fs.existsSync(hotpatchDir)) fs.mkdirSync(hotpatchDir, { recursive: true });
  fs.copyFileSync(path.join(rootDir, 'version.json'), path.join(hotpatchDir, 'version.json'));
  copyDirRecursive(path.join(rootDir, 'wallpaper-ui'), hotpatchUiDir);
  console.log('  -> Target 2 synchronized successfully!');

  // TARGET 3: Repack app.asar in workspace win-unpacked
  const unpackedAsar = path.join(rootDir, 'app', 'v2.5.3', 'win-unpacked', 'resources', 'app.asar');
  if (fs.existsSync(path.dirname(unpackedAsar))) {
    console.log(`[TARGET 3] Repacking workspace win-unpacked app.asar...`);
    await asar.createPackage(staging, unpackedAsar);
    console.log(`  -> Target 3 app.asar repacked successfully! (${(fs.statSync(unpackedAsar).size / (1024 * 1024)).toFixed(2)} MB)`);
  }

  // Ensure backend gateway is synced to all targets
  const backendSrc = path.join(rootDir, 'backend');
  if (fs.existsSync(backendSrc)) {
    for (const parentResources of possibleInstalledDirs) {
      if (fs.existsSync(parentResources)) {
        const destBackend = path.join(parentResources, 'backend');
        console.log(`[TARGET 1] Syncing backend gateway directory: ${destBackend}`);
        copyDirRecursive(backendSrc, destBackend);
      }
    }
    const winUnpackedResources = path.join(rootDir, 'app', 'v2.5.3', 'win-unpacked', 'resources');
    if (fs.existsSync(winUnpackedResources)) {
      const destBackend = path.join(winUnpackedResources, 'backend');
      console.log(`[TARGET 3] Syncing backend gateway directory: ${destBackend}`);
      copyDirRecursive(backendSrc, destBackend);
    }
  }

  console.log('\n[SUCCESS] All distribution targets are 100% up to date!');
}

syncAllTargets().catch(err => {
  console.error('[ERROR] Multi-target sync failed:', err);
  process.exit(1);
});
