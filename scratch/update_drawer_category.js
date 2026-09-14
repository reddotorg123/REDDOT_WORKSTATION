const fs = require('fs');

let html = fs.readFileSync('wallpaper-ui/index.html', 'utf8');
html = html.replace('<span class="drawer-meta-label">Module:</span>', '<span class="drawer-meta-label">Category:</span>');
fs.writeFileSync('wallpaper-ui/index.html', html, 'utf8');

let js = fs.readFileSync('wallpaper-ui/wallpaper.js', 'utf8');
js = js.replace(
  "if (pipeEl) pipeEl.textContent = task.pipeline || 'main/active';",
  "if (pipeEl) pipeEl.textContent = task.category || 'General';"
);
fs.writeFileSync('wallpaper-ui/wallpaper.js', js, 'utf8');
console.log('✅ Updated category in drawer!');
