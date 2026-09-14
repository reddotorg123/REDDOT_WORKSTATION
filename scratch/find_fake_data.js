const fs = require('fs');
const lines = fs.readFileSync('wallpaper-ui/wallpaper.js', 'utf8').split('\n');
const targets = ['Alex Rivera', 'Sharma', 'Vikram', 'Math.max'];
targets.forEach(t => {
  lines.forEach((l, i) => {
    if (l.includes(t)) {
      console.log(`[${t}] Line ${i+1}: ${l.trim().substring(0, 140)}`);
    }
  });
});
