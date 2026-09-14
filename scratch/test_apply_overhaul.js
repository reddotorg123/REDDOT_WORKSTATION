const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const uiDir = path.join(rootDir, 'wallpaper-ui');
const indexPath = path.join(uiDir, 'index.html');

let html = fs.readFileSync(indexPath, 'utf8');

// Ensure backups exist
if (!fs.existsSync(path.join(__dirname, 'index.html.bak'))) {
  fs.writeFileSync(path.join(__dirname, 'index.html.bak'), html, 'utf8');
}

console.log('Original length:', html.length);
require('./apply_overhaul_full.js');

const newHtml = fs.readFileSync(indexPath, 'utf8');
console.log('New length:', newHtml.length);
console.log('Contains rd-chat-3col-layout:', newHtml.includes('rd-chat-3col-layout'));
console.log('Contains workstation-top-header:', newHtml.includes('workstation-top-header'));
console.log('Contains rd-brand-badge:', newHtml.includes('rd-brand-badge'));
