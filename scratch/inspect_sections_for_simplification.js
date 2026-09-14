const fs = require('fs');
const s = fs.readFileSync('wallpaper-ui/index.html', 'utf8');

const pDrawer = s.indexOf('id="commandCenterDrawer"');
console.log(s.substring(pDrawer, pDrawer + 2200));
