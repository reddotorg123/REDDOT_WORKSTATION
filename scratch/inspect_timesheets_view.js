const fs = require('fs');
const s = fs.readFileSync('wallpaper-ui/index.html', 'utf8');
const pos = s.indexOf('COMPLIANCE RATING');
console.log(s.substring(pos, pos + 2500));
