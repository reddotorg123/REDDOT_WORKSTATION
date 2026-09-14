const http = require('http');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');
const uiDir = path.join(rootDir, 'wallpaper-ui');

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(uiDir, safePath);

  if (!fs.existsSync(filePath) && (safePath === '\\version.json' || safePath === '/version.json' || safePath === 'version.json')) {
    filePath = path.join(rootDir, 'version.json');
  }

  if (!fs.existsSync(filePath) && (safePath.toLowerCase().endsWith('favicon.ico') || safePath === '/favicon.ico' || safePath === 'favicon.ico')) {
    filePath = path.join(uiDir, 'assets', 'id-card.png');
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found: ' + reqPath);
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
    '.ttf': 'font/ttf'
  };

  const contentType = mimeTypes[ext] || 'application/octet-stream';
  res.writeHead(200, {
    'Content-Type': contentType,
    'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
    'Access-Control-Allow-Origin': '*',
    'Cross-Origin-Opener-Policy': 'same-origin-allow-popups'
  });
  fs.createReadStream(filePath).pipe(res);
});

const PORT = 8085;
server.listen(PORT, '127.0.0.1', () => {
  console.log(`[TEST-SERVER] Serving wallpaper-ui on http://127.0.0.1:${PORT}`);
});
