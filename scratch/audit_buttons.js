const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'wallpaper-ui', 'index.html'), 'utf8');
const js = fs.readFileSync(path.join(root, 'wallpaper-ui', 'wallpaper.js'), 'utf8');

const regex = /<button[^>]*id="([^"]+)"/g;
const ids = [];
let match;
while ((match = regex.exec(html)) !== null) {
  ids.push(match[1]);
}

const unbound = ids.filter(id => !js.includes(id));
console.log('Total button IDs:', ids.length);
console.log('Bound button IDs:', ids.length - unbound.length);
console.log('Unbound button IDs (' + unbound.length + '):');
unbound.forEach(id => console.log('  -', id));
