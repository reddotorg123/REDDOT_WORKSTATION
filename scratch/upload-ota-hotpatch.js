const fs = require('fs');
const path = require('path');
const https = require('https');

const API_KEY = "AIzaSyBpjenDcXDREseIDv5NfgpDo2fAk_gUhdk";
const ORG_ID = "reddot";

function postDocument(docId, fields) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ fields });
    const url = `https://firestore.googleapis.com/v1/projects/reddot-workspace/databases/(default)/documents/organizations/${ORG_ID}/ota/${docId}?key=${API_KEY}`;
    
    const req = https.request(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(body));
        } else {
          reject(new Error(`Failed ${docId}: HTTP ${res.statusCode} - ${body}`));
        }
      });
    });
    
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function uploadHotpatch() {
  console.log('[OTA] Packaging latest production files into Firestore Cloud OTA Vault...');

  const wallpaperJs = fs.readFileSync(path.join(__dirname, '..', 'wallpaper-ui', 'wallpaper.js'), 'utf8');
  const firebaseServiceJs = fs.readFileSync(path.join(__dirname, '..', 'wallpaper-ui', 'firebase-service.js'), 'utf8');
  const styleCss = fs.readFileSync(path.join(__dirname, '..', 'wallpaper-ui', 'style.css'), 'utf8');

  console.log(`- wallpaper.js: ${Buffer.byteLength(wallpaperJs)} bytes`);
  console.log(`- firebase-service.js: ${Buffer.byteLength(firebaseServiceJs)} bytes`);
  console.log(`- style.css: ${Buffer.byteLength(styleCss)} bytes`);

  await postDocument('bundle', {
    version: { stringValue: '2.5.1' },
    releaseDate: { stringValue: '2026-09-02' },
    updatedAt: { integerValue: String(Date.now()) },
    wallpaperJs: { stringValue: wallpaperJs },
    firebaseServiceJs: { stringValue: firebaseServiceJs },
    styleCss: { stringValue: styleCss },
    changelog: {
      arrayValue: {
        values: [
          { stringValue: "Bi-directional real-time chat with direct Cloud REST fallback" },
          { stringValue: "Individual teammate task assignment (Pavithra R) without duplicates" },
          { stringValue: "Full keyboard responsiveness and input text focus enhancements" },
          { stringValue: "Instant Over-The-Air (OTA) continuous cloud update sync" }
        ]
      }
    }
  });

  console.log('✅ Successfully published v2.5.1 hotpatch bundle to Cloud Firestore!');
}

uploadHotpatch().catch(err => {
  console.error('❌ Error publishing hotpatch:', err);
  process.exit(1);
});
