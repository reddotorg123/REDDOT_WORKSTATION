const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'wallpaper-ui', 'index.html'), 'utf8');

const regex = /<section[^>]+id="([^"]+)"[^>]*class="([^"]*cmd-tab-pane[^"]*)"/g;
let m;
while ((m = regex.exec(html)) !== null) {
  console.log(m[1].padEnd(22), m[2]);
}
