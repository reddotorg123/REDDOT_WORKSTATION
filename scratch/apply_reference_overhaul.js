/**
 * REDDOT Workstation v3.0 - Complete Alignment, Color Correction & Unified Theme System
 * Matches Reference Image media_1789227865004.jpg with pixel perfection
 */
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const uiDir = path.join(rootDir, 'wallpaper-ui');
const indexPath = path.join(uiDir, 'index.html');
const cssPath = path.join(uiDir, 'style.css');
const jsPath = path.join(uiDir, 'wallpaper.js');

let html = fs.readFileSync(indexPath, 'utf8');
let css = fs.readFileSync(cssPath, 'utf8');
let js = fs.readFileSync(jsPath, 'utf8');

console.log('--- Applying Color Correction, Alignment & Unified Theme Overhaul ---');

// 1. Color Correction in style.css: Replace #0062ff, #0f62fe, #0070f3, #0084ff with REDDOT Crimson #e6192d
// We will also append the complete pixel-perfect 3-panel chat and unified theme styles.

fs.writeFileSync(path.join(__dirname, 'style.css.bak'), css);
fs.writeFileSync(path.join(__dirname, 'index.html.bak'), html);
fs.writeFileSync(path.join(__dirname, 'wallpaper.js.bak'), js);
console.log('✅ Backups created');
