const fs = require('fs');
const s = fs.readFileSync('wallpaper-ui/index.html', 'utf8');

const buzzwords = [
  'pipeline',
  'autonomous',
  'fabric',
  'telemetry',
  'cluster',
  'enclave',
  'handshake',
  'deliverables',
  'matrix',
  'directives'
];

buzzwords.forEach(bw => {
  const re = new RegExp(bw, 'gi');
  const matches = s.match(re);
  console.log(`${bw}: ${matches ? matches.length : 0} occurrences`);
  if (matches) {
    let idx = -1;
    while ((idx = s.toLowerCase().indexOf(bw, idx + 1)) !== -1) {
      // Don't show if in comment or wallpaperRoot
      const start = Math.max(0, idx - 40);
      const end = Math.min(s.length, idx + bw.length + 40);
      console.log(`  -> "...${s.substring(start, end).replace(/\r?\n/g, ' ')}..."`);
    }
  }
});
