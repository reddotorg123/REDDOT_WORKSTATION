const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..', '..');
const outputFile = path.join(rootDir, 'all_code_in_one.txt');
const copyToDesktopApp = path.join(rootDir, 'wallpaper-desktop-app', 'all_code_in_one.txt');

const includeExtensions = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.json',
  '.cpp', '.h', '.hpp', '.qml', '.ps1', '.bat', '.sh'
]);

const excludeDirs = new Set([
  'node_modules', '.git', '.vscode', '.playwright-mcp', '.qtcreator',
  'build', 'dist', 'out', 'vendor', 'scratch', 'edge_temp',
  'asar_staging', 'asar_staging_installed', 'asar_staging_updated',
  'asar_full_staging', 'storage', 'vault', 'app', 'wallpaper-ui-backup',
  'assets'
]);

const excludeFiles = new Set([
  'package-lock.json', 'all_code_in_one.txt', 'reddot_workstation_complete_codebase.txt',
  'input_att_0.txt', 'service-account.json', 'gdrive_tokens.json', 'vk_swiftshader_icd.json',
  'bundle_all.js'
]);

const filesToInclude = [];

function scanDir(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    return;
  }
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(rootDir, fullPath).split(path.sep).join('/');

    if (entry.isDirectory()) {
      if (excludeDirs.has(entry.name)) continue;
      scanDir(fullPath);
    } else if (entry.isFile()) {
      if (excludeFiles.has(entry.name)) continue;
      const ext = path.extname(entry.name).toLowerCase();
      if (!includeExtensions.has(ext)) continue;
      if (entry.name.endsWith('.log') || entry.name.endsWith('.log.txt')) continue;
      filesToInclude.push({ fullPath, relPath });
    }
  }
}

scanDir(rootDir);

function getPriority(norm) {
  // 1. Core Wallpaper Desktop UI
  if (norm === 'wallpaper-desktop-app/wallpaper-ui/index.html') return 1;
  if (norm === 'wallpaper-desktop-app/wallpaper-ui/style.css') return 2;
  if (norm === 'wallpaper-desktop-app/wallpaper-ui/wallpaper.js') return 3;
  if (norm.startsWith('wallpaper-desktop-app/wallpaper-ui/firebase-')) return 4;
  if (norm.startsWith('wallpaper-desktop-app/wallpaper-ui/')) return 5;
  // 2. Electron Main Process
  if (norm === 'wallpaper-desktop-app/main.js') return 6;
  if (norm === 'wallpaper-desktop-app/preload.js') return 7;
  if (norm === 'wallpaper-desktop-app/package.json') return 8;
  if (norm === 'wallpaper-desktop-app/version.json') return 9;
  // 3. Desktop App Scripts & Root
  if (norm.startsWith('wallpaper-desktop-app/scripts/')) return 15;
  if (norm.startsWith('wallpaper-desktop-app/react-app/')) return 30;
  if (norm.startsWith('wallpaper-desktop-app/')) return 20;
  // 4. Backend & Microservices
  if (norm.startsWith('backend/')) return 40;
  if (norm.startsWith('attachment-service/')) return 50;
  // 5. Qt 6 Workstation
  if (norm.startsWith('reddot-workstation-qt/')) return 60;
  return 70;
}

filesToInclude.sort((a, b) => {
  const pA = getPriority(a.relPath);
  const pB = getPriority(b.relPath);
  if (pA !== pB) return pA - pB;
  return a.relPath.localeCompare(b.relPath);
});

const outStream = fs.createWriteStream(outputFile, { encoding: 'utf8' });

outStream.write('////////////////////////////////////////////////////////////////////////////////\n');
outStream.write('// REDDOT WORKSTATION • COMPLETE ARCHITECTURE & FULL CODEBASE\n');
outStream.write('// Generated: ' + new Date().toISOString() + '\n');
outStream.write('// Total Bundled Files: ' + filesToInclude.length + '\n');
outStream.write('// Primary Focus: Wallpaper Desktop App (Electron + Live Wallpaper UI)\n');
outStream.write('// Includes: React App, Backend Services, Attachment Service, and Qt 6 C++/QML\n');
outStream.write('////////////////////////////////////////////////////////////////////////////////\n\n');

outStream.write('================================================================================\n');
outStream.write('TABLE OF CONTENTS\n');
outStream.write('================================================================================\n');
filesToInclude.forEach((f, idx) => {
  outStream.write((idx + 1).toString().padStart(3, ' ') + '. ' + f.relPath + '\n');
});
outStream.write('\n\n');

for (const file of filesToInclude) {
  const content = fs.readFileSync(file.fullPath, 'utf8');
  const lines = content.split('\n').length;
  const size = Buffer.byteLength(content, 'utf8');

  outStream.write('================================================================================\n');
  outStream.write('FILE: ' + file.relPath + '\n');
  outStream.write('LINES: ' + lines + ' | SIZE: ' + size + ' bytes\n');
  outStream.write('================================================================================\n');
  outStream.write(content);
  outStream.write('\n\n');
}

outStream.end(() => {
  const outStats = fs.statSync(outputFile);
  console.log('Successfully written ' + filesToInclude.length + ' files (' + (outStats.size / 1024 / 1024).toFixed(2) + ' MB)');
  fs.copyFileSync(outputFile, copyToDesktopApp);
  console.log('Mirrored to: ' + copyToDesktopApp);
});
