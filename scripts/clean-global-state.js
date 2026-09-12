/**
 * REDDOT Workstation OS - Global Cloud State Sync & Sanitization
 * Synchronizes global state in Cloud Firestore so all workstations see correct member status and zero stale hours.
 */

const https = require('https');

const API_KEY = 'AIzaSyBpjenDcXDREseIDv5NfgpDo2fAk_gUhdk';
const PROJECT_ID = 'reddot-workspace';
const ORG_ID = 'reddot';

function patchDoc(docPath, fields, maskFields) {
  return new Promise((resolve, reject) => {
    let url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${docPath}?key=${API_KEY}`;
    if (maskFields && maskFields.length) {
      url += '&' + maskFields.map(m => 'updateMask.fieldPaths=' + encodeURIComponent(m)).join('&');
    }
    const payload = JSON.stringify({ fields });
    const parsed = new URL(url);
    const req = https.request({
      hostname: parsed.hostname,
      port: 443,
      path: parsed.pathname + parsed.search,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(JSON.parse(b)); } catch (_) { resolve(b); }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${b}`));
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  console.log('🌐 Executing Global Cloud State Update on Firestore...');

  const todayDateStr = new Date().toDateString();

  // 1. Update RD-EMP-002 (Pavithra R's employee ID doc)
  console.log('1. Updating RD-EMP-002 status to DUTY_OFF, 0h...');
  const empRes = await patchDoc(`organizations/${ORG_ID}/members/RD-EMP-002`, {
    status: { stringValue: 'DUTY_OFF' },
    active: { booleanValue: false },
    todayHours: { integerValue: '0' },
    todaySeconds: { integerValue: '0' },
    todayDate: { stringValue: todayDateStr }
  }, ['status', 'active', 'todayHours', 'todaySeconds', 'todayDate']);
  console.log('✅ RD-EMP-002 updated successfully:', empRes.updateTime);

  // 2. Update Yp9Rm1HggQYJYMDc6x8e7DFxRyR2 (Pavithra R's Auth UID doc)
  console.log('2. Updating UID Yp9Rm1HggQYJYMDc6x8e7DFxRyR2 status to DUTY_OFF, 0h...');
  const userRes = await patchDoc(`organizations/${ORG_ID}/members/Yp9Rm1HggQYJYMDc6x8e7DFxRyR2`, {
    status: { stringValue: 'DUTY_OFF' },
    active: { booleanValue: false },
    todayHours: { integerValue: '0' },
    todaySeconds: { integerValue: '0' },
    todayDate: { stringValue: todayDateStr }
  }, ['status', 'active', 'todayHours', 'todaySeconds', 'todayDate']);
  console.log('✅ Yp9Rm1HggQYJYMDc6x8e7DFxRyR2 updated successfully:', userRes.updateTime);

  console.log('\n🎉 Global Cloud Update completed successfully across all nodes!');
}

main().catch(err => {
  console.error('❌ Global Cloud Update failed:', err);
  process.exit(1);
});
