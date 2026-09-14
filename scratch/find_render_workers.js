const fs = require('fs');
const path = require('path');
const lines = fs.readFileSync(path.join(__dirname, '..', 'wallpaper-ui', 'wallpaper.js'), 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('function renderWorkers')) {
    console.log(`Line ${i + 1}: ${lines[i]}`);
    for (let j = i; j < Math.min(lines.length, i + 50); j++) {
      console.log(`  ${j + 1}: ${lines[j]}`);
    }
  }
}
