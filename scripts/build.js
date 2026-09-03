/**
 * REDDOT Workstation OS - Standalone Windows Package & EXE Compilation Pipeline
 * High-performance, offline-first packaging engine that bundles app with Electron runtime
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf8'));
const APP_VERSION = pkg.version || '2.5.1';
const DIST_SOURCE = path.join(ROOT_DIR, 'node_modules', 'electron', 'dist');
const RELEASE_DIR = path.join(ROOT_DIR, 'app', `v${APP_VERSION}`);
const UNPACKED_DIR = path.join(RELEASE_DIR, 'REDDOT-Workstation-OS-win32-x64');

console.log('======================================================================');
console.log('  REDDOT WORKSTATION OS • WINDOWS PACKAGING & EXE PIPELINE');
console.log('======================================================================');

// Helper to copy directory recursively
function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'default_app.asar') continue; // Skip default electron placeholder
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  console.log('[1/4] Preparing clean release directory...');
  try {
    if (fs.existsSync(RELEASE_DIR)) {
      fs.rmSync(RELEASE_DIR, { recursive: true, force: true });
    }
  } catch (e) {
    console.warn('[BUILD] Existing directory in use; updating application files in place.');
  }
  fs.mkdirSync(RELEASE_DIR, { recursive: true });
  fs.mkdirSync(UNPACKED_DIR, { recursive: true });

  console.log('[2/4] Bundling native Electron runtime binary files...');
  if (!fs.existsSync(DIST_SOURCE)) {
    throw new Error(`Electron distribution not found at: ${DIST_SOURCE}`);
  }
  
  fs.cpSync(DIST_SOURCE, UNPACKED_DIR, {
    recursive: true,
    filter: (src) => !src.endsWith('default_app.asar')
  });

  // Rename electron.exe to official application executable
  const origExe = path.join(UNPACKED_DIR, 'electron.exe');
  const targetExe = path.join(UNPACKED_DIR, 'REDDOT-Workstation-OS.exe');
  if (fs.existsSync(origExe)) {
    fs.renameSync(origExe, targetExe);
  }

  console.log('[3/4] Packaging application resources, styles, assets & OTA engine...');
  const appTargetDir = path.join(UNPACKED_DIR, 'resources', 'app');
  fs.mkdirSync(appTargetDir, { recursive: true });

  // Copy app payload
  fs.copyFileSync(path.join(ROOT_DIR, 'package.json'), path.join(appTargetDir, 'package.json'));
  fs.copyFileSync(path.join(ROOT_DIR, 'main.js'), path.join(appTargetDir, 'main.js'));
  fs.copyFileSync(path.join(ROOT_DIR, 'preload.js'), path.join(appTargetDir, 'preload.js'));
  fs.cpSync(path.join(ROOT_DIR, 'wallpaper-ui'), path.join(appTargetDir, 'wallpaper-ui'), { recursive: true });

  // Create 1-Click Launchers in release root
  console.log('[4/4] Generating Standalone Portable Executable & Setup Launchers...');
  
  // Create Portable EXE shortcut runner
  const portableRunnerContent = `@echo off
start "" "%~dp0REDDOT-Workstation-OS-win32-x64\\REDDOT-Workstation-OS.exe"
`;
  fs.writeFileSync(path.join(RELEASE_DIR, 'Launch-REDDOT-Workstation-OS.bat'), portableRunnerContent);

  // Create Setup & Desktop Shortcut Installer script
  const setupScriptContent = `@echo off
title Install REDDOT Workstation OS
echo ==============================================================
echo   INSTALLING REDDOT WORKSTATION OS (DESKTOP SHORTCUT & SYSTEM)
echo ==============================================================
echo.
set "TARGET_DIR=%LOCALAPPDATA%\\Programs\\REDDOT-Workstation-OS"
echo [1/2] Installing to %TARGET_DIR%...
if exist "%TARGET_DIR%" rmdir /s /q "%TARGET_DIR%"
xcopy /e /i /y "%~dp0REDDOT-Workstation-OS-win32-x64" "%TARGET_DIR%" >nul

echo [2/2] Creating Desktop Shortcut...
powershell -Command "$s=(New-Object -COM WScript.Shell).CreateShortcut([Environment]::GetFolderPath('Desktop')+'\\REDDOT Workstation OS.lnk'); $s.TargetPath='%TARGET_DIR%\\REDDOT-Workstation-OS.exe'; $s.WorkingDirectory='%TARGET_DIR%'; $s.Save()"

echo.
echo Installation complete! Desktop shortcut created.
echo Launching application...
start "" "%TARGET_DIR%\\REDDOT-Workstation-OS.exe"
`;
  fs.writeFileSync(path.join(RELEASE_DIR, 'Install-REDDOT-Workstation-OS.bat'), setupScriptContent);

  console.log('\n======================================================================');
  console.log('  PACKAGING COMPLETED SUCCESSFULLY!');
  console.log('======================================================================');
  console.log('Output location:');
  console.log('  -> Executable: ' + targetExe);
  console.log('  -> Portable:   ' + path.join(RELEASE_DIR, 'Launch-REDDOT-Workstation-OS.bat'));
  console.log('  -> Installer:  ' + path.join(RELEASE_DIR, 'Install-REDDOT-Workstation-OS.bat'));
  console.log('======================================================================\n');
  process.exit(0);
} catch (err) {
  console.error('\n[ERROR] Packaging failed:', err);
  process.exit(1);
}
