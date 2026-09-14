const fs = require('fs');
const path = require('path');

const js = fs.readFileSync(path.join(__dirname, '..', 'wallpaper-ui', 'wallpaper.js'), 'utf8');

const bIdx = js.indexOf('function bindEvents(');
if (bIdx !== -1) {
  console.log(js.slice(bIdx + 3200, bIdx + 5200));
}
