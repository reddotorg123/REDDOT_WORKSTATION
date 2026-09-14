/**
 * REDDOT WORKSTATION OS • HOTPATCH SYNC SCRIPT
 * Keeps %APPDATA%\reddot-workstation-os\hotpatch perfectly synchronized with wallpaper-ui/
 */
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const uiDir = path.join(rootDir, 'wallpaper-ui');
const hotpatchDir = path.join(process.env.APPDATA, 'reddot-workstation-os', 'hotpatch');
const hotpatchUiDir = path.join(hotpatchDir, 'wallpaper-ui');

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  console.log('[SYNC] Mirroring wallpaper-ui into hotpatch directory...');
  copyDirRecursive(uiDir, hotpatchUiDir);

  const vJsonSrc = path.join(rootDir, 'version.json');
  if (fs.existsSync(vJsonSrc)) {
    fs.copyFileSync(vJsonSrc, path.join(hotpatchDir, 'version.json'));
  }
  console.log('[SYNC] Successfully synchronized hotpatch to v3.0.1!');
} catch (e) {
  console.error('[SYNC] Failed to synchronize hotpatch:', e.message);
  process.exit(1);
}
