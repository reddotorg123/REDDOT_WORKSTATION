/**
 * REDDOT Workstation OS - Cloud OTA Publisher
 * Publishes release manifest and hotpatch bundle directly to Cloud Firestore REST endpoints.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const API_KEY = 'AIzaSyBpjenDcXDREseIDv5NfgpDo2fAk_gUhdk';
const MANIFEST_URL = `https://firestore.googleapis.com/v1/projects/reddot-workspace/databases/(default)/documents/organizations/reddot/system/otaRelease?key=${API_KEY}`;
const BUNDLE_URL = `https://firestore.googleapis.com/v1/projects/reddot-workspace/databases/(default)/documents/organizations/reddot/ota/bundle?key=${API_KEY}`;

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

  console.log('📡 1/2 Publishing Release Manifest to organizations/reddot/system/otaRelease...');
  const manifestRes = await patchDocument(MANIFEST_URL, manifestPayload);
  console.log('✅ Manifest Published Successfully! Document update time:', manifestRes.updateTime);

  // 2. Publish Hotpatch Bundle
  const bundlePayload = {
    fields: {
      version: { stringValue: versionData.version },
      releaseDate: { stringValue: versionData.releaseDate },
      updatedAt: { stringValue: new Date().toISOString() },
      wallpaperJs: { stringValue: wallpaperJs },
      firebaseServiceJs: { stringValue: firebaseServiceJs },
      styleCss: { stringValue: styleCss },
      indexHtml: { stringValue: indexHtml },
      changelog: {
        arrayValue: {
          values: (versionData.changelog || []).map(item => ({ stringValue: item }))
        }
      }
    }
  };

  console.log('📡 2/2 Publishing Hotpatch Bundle to organizations/reddot/ota/bundle...');
  const bundleRes = await patchDocument(BUNDLE_URL, bundlePayload);
  console.log('✅ Bundle Published Successfully! Document update time:', bundleRes.updateTime);

  console.log(`\n🎉 OTA Release v${versionData.version} is now LIVE on REDDOT Cloud!`);
}

main().catch(err => {
  console.error('❌ OTA Publication failed:', err);
  process.exit(1);
});
