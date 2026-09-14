const fs = require('fs');
const s = fs.readFileSync('wallpaper-ui/index.html', 'utf8');

const pActions = s.indexOf('drawer-actions-block');
if (pActions !== -1) {
  console.log(s.substring(pActions, pActions + 800));
}
