/**
 * REDDOT Workstation OS - Cloud OTA Publisher
 * Publishes release manifest and hotpatch bundle directly to Cloud Firestore REST endpoints.
 * Splits the bundle across two Firestore docs (bundle + bundle2) to stay under the 1MB doc limit.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const zlib = require('zlib');

const API_KEY = 'AIzaSyBpjenDcXDREseIDv5NfgpDo2fAk_gUhdk';
const MANIFEST_URL = `https://firestore.googleapis.com/v1/projects/reddot-workspace/databases/(default)/documents/organizations/reddot/system/otaRelease?key=${API_KEY}`;
const BUNDLE_URL = `https://firestore.googleapis.com/v1/projects/reddot-workspace/databases/(default)/documents/organizations/reddot/ota/bundle?key=${API_KEY}`;
const BUNDLE2_URL = `https://firestore.googleapis.com/v1/projects/reddot-workspace/databases/(default)/documents/organizations/reddot/ota/bundle2?key=${API_KEY}`;

function gzipBase64(str) {
  return new Promise((resolve, reject) => {
    zlib.gzip(Buffer.from(str, 'utf8'), (err, buf) => {
      if (err) return reject(err);
      resolve(buf.toString('base64'));
    });
  });
}

function patchDocument(url, data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const parsed = new URL(url);

    const options = {
      hostname: parsed.hostname,
      port: 443,
      path: parsed.pathname + parsed.search,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(body));
          } catch (_) {
            resolve(body);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  console.log('🚀 Starting REDDOT Cloud OTA Update Publication...');

  const rootDir = path.resolve(__dirname, '..');
  const versionPath = path.join(rootDir, 'version.json');
  const versionData = JSON.parse(fs.readFileSync(versionPath, 'utf8'));

  const uiDir = path.join(rootDir, 'wallpaper-ui');
  const wallpaperJs = fs.readFileSync(path.join(uiDir, 'wallpaper.js'), 'utf8');
  const firebaseServiceJs = fs.readFileSync(path.join(uiDir, 'firebase-service.js'), 'utf8');
  const styleCss = fs.readFileSync(path.join(uiDir, 'style.css'), 'utf8');
  const indexHtml = fs.readFileSync(path.join(uiDir, 'index.html'), 'utf8');

  console.log(`📦 Packaging Release v${versionData.version} (${versionData.releaseDate})...`);
  console.log(`   - wallpaper.js: ${wallpaperJs.length} bytes`);
  console.log(`   - firebase-service.js: ${firebaseServiceJs.length} bytes`);
  console.log(`   - style.css: ${styleCss.length} bytes`);
  console.log(`   - index.html: ${indexHtml.length} bytes`);

  // Gzip+base64 compress to stay under Firestore 1MB doc limit
  console.log('🗜️  Compressing files with gzip...');
  const [wallpaperJsGz, firebaseServiceJsGz, styleCssGz, indexHtmlGz] = await Promise.all([
    gzipBase64(wallpaperJs),
    gzipBase64(firebaseServiceJs),
    gzipBase64(styleCss),
    gzipBase64(indexHtml),
  ]);
  console.log(`   - wallpaper.js (gz): ${wallpaperJsGz.length} bytes`);
  console.log(`   - firebase-service.js (gz): ${firebaseServiceJsGz.length} bytes`);
  console.log(`   - style.css (gz): ${styleCssGz.length} bytes`);
  console.log(`   - index.html (gz): ${indexHtmlGz.length} bytes`);

  // 1. Publish Release Manifest
  const manifestPayload = {
    fields: {
      version: { stringValue: versionData.version },
      releaseDate: { stringValue: versionData.releaseDate },
      minRequiredVersion: { stringValue: versionData.minRequiredVersion || '2.0.0' },
      mandatory: { booleanValue: !!versionData.mandatory },
      downloadUrl: { stringValue: versionData.downloadUrl || '' },
      changelog: {
        arrayValue: {
          values: (versionData.changelog || []).map(item => ({ stringValue: item }))
        }
      }
    }
  };

  console.log('📡 1/3 Publishing Release Manifest to organizations/reddot/system/otaRelease...');
  const manifestRes = await patchDocument(MANIFEST_URL, manifestPayload);
  console.log('✅ Manifest Published Successfully! Document update time:', manifestRes.updateTime);

  // 2. Publish Hotpatch Bundle (doc 1: wallpaper.js + firebase-service.js)
  const bundlePayload = {
    fields: {
      version: { stringValue: versionData.version },
      releaseDate: { stringValue: versionData.releaseDate },
      updatedAt: { stringValue: new Date().toISOString() },
      encoding: { stringValue: 'gzip+base64' },
      wallpaperJs: { stringValue: wallpaperJsGz },
      firebaseServiceJs: { stringValue: firebaseServiceJsGz },
      changelog: {
        arrayValue: {
          values: (versionData.changelog || []).map(item => ({ stringValue: item }))
        }
      }
    }
  };

  console.log('📡 2/3 Publishing Hotpatch Bundle (wallpaper.js + firebase-service.js) to ota/bundle...');
  const bundleRes = await patchDocument(BUNDLE_URL, bundlePayload);
  console.log('✅ Bundle (1/2) Published Successfully! Document update time:', bundleRes.updateTime);

  // 3. Publish Hotpatch Bundle 2 (doc 2: style.css + index.html)
  const bundle2Payload = {
    fields: {
      version: { stringValue: versionData.version },
      updatedAt: { stringValue: new Date().toISOString() },
      encoding: { stringValue: 'gzip+base64' },
      styleCss: { stringValue: styleCssGz },
      indexHtml: { stringValue: indexHtmlGz },
    }
  };

  console.log('📡 3/3 Publishing Hotpatch Bundle (style.css + index.html) to ota/bundle2...');
  const bundle2Res = await patchDocument(BUNDLE2_URL, bundle2Payload);
  console.log('✅ Bundle (2/2) Published Successfully! Document update time:', bundle2Res.updateTime);

  console.log(`\n🎉 OTA Release v${versionData.version} is now LIVE on REDDOT Cloud!`);
  console.log(`   Bundle 1: wallpaper.js (${wallpaperJsGz.length} bytes gz) + firebase-service.js`);
  console.log(`   Bundle 2: style.css + index.html`);
}

main().catch(err => {
  console.error('❌ OTA Publication failed:', err);
  process.exit(1);
});
