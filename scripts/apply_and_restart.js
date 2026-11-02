const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');
const asar = require('@electron/asar');

async function applyAndRestart() {
  console.log('=== APPLYING REDESIGN FIXES & RESTARTING REDDOT WORKSTATION ===');

  // Step 1: Kill running instances of the app
  console.log('[STEP 1] Closing currently running REDDOT instances...');
  await new Promise((resolve) => {
    exec('taskkill /F /IM "REDDOT Workstation OS.exe"', () => {
      setTimeout(resolve, 800);
    });
  });

  const appDataDir = path.join(process.env.APPDATA, 'reddot-workstation-os');
  const lockFile = path.join(appDataDir, 'SingletonLock');
  try { if (fs.existsSync(lockFile)) fs.unlinkSync(lockFile); } catch (_) {}

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

  // Step 2: Prepare clean staging for ASAR
  console.log('[STEP 2] Preparing ASAR package staging...');
  const staging = path.join(rootDir, 'scratch', 'asar_staging');
  if (fs.existsSync(staging)) fs.rmSync(staging, { recursive: true, force: true });
  fs.mkdirSync(staging, { recursive: true });

  fs.copyFileSync(path.join(rootDir, 'main.js'), path.join(staging, 'main.js'));
  fs.copyFileSync(path.join(rootDir, 'preload.js'), path.join(staging, 'preload.js'));
  fs.copyFileSync(path.join(rootDir, 'package.json'), path.join(staging, 'package.json'));
  fs.copyFileSync(path.join(rootDir, 'version.json'), path.join(staging, 'version.json'));
  copyDirRecursive(path.join(rootDir, 'wallpaper-ui'), path.join(staging, 'wallpaper-ui'));

  // Step 3: Repack installed app.asar
  const installedResources = path.join(process.env.LOCALAPPDATA, 'Programs', 'REDDOT Workstation OS', 'resources');
  if (fs.existsSync(installedResources)) {
    const targetAsar = path.join(installedResources, 'app.asar');
    console.log(`[STEP 3] Repacking installed application at: ${targetAsar}`);
    await asar.createPackage(staging, targetAsar);
    console.log(`  -> Successfully repacked installed app.asar (${(fs.statSync(targetAsar).size / (1024 * 1024)).toFixed(2)} MB)`);
  }

  // Step 4: Sync Hotpatch directory (ensures dynamic live updates)
  const hotpatchDir = path.join(process.env.APPDATA, 'reddot-workstation-os', 'hotpatch');
  const hotpatchUiDir = path.join(hotpatchDir, 'wallpaper-ui');
  console.log(`[STEP 4] Syncing hotpatch directory: ${hotpatchUiDir}`);
  if (!fs.existsSync(hotpatchDir)) fs.mkdirSync(hotpatchDir, { recursive: true });
  fs.copyFileSync(path.join(rootDir, 'version.json'), path.join(hotpatchDir, 'version.json'));
  copyDirRecursive(path.join(rootDir, 'wallpaper-ui'), hotpatchUiDir);
  console.log('  -> Hotpatch directory synchronized successfully!');

  // Step 5: Clean staging
  try { fs.rmSync(staging, { recursive: true, force: true }); } catch (_) {}

  // Step 6: Launch new instance
  console.log('[STEP 5] Launching updated REDDOT Workstation OS...');
  const exePath = path.join(process.env.LOCALAPPDATA, 'Programs', 'REDDOT Workstation OS', 'REDDOT Workstation OS.exe');
  if (fs.existsSync(exePath)) {
    const cleanEnv = { ...process.env };
    delete cleanEnv.ELECTRON_RUN_AS_NODE;
    const child = spawn(exePath, [], {
      detached: true,
      stdio: 'ignore',
      env: cleanEnv
    });
    child.unref();
    console.log('[SUCCESS] REDDOT Workstation OS launched successfully with new modern UI and design system!');
  } else {
    console.log('[NOTE] Executable not found at default path, launching via electron .');
    const child = spawn('npx', ['electron', '.'], {
      cwd: rootDir,
      detached: true,
      stdio: 'ignore',
      shell: true
    });
    child.unref();
    console.log('[SUCCESS] Launched via electron . successfully!');
  }
}

applyAndRestart().catch((err) => {
  console.error('[FATAL] Failed to apply and restart:', err);
  process.exit(1);
});
