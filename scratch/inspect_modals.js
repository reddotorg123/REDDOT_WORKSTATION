const fs = require('fs');
const s = fs.readFileSync('wallpaper-ui/index.html', 'utf8');
const lines = s.split('\n');
lines.forEach((l, i) => {
  if (l.includes('modal-overlay') || l.includes('Modal"')) {
    console.log(`${i+1}: ${l.trim()}`);
  }
});
