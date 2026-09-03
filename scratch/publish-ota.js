const https = require('https');

const data = JSON.stringify({
  fields: {
    version: { stringValue: "2.5.1" },
    releaseDate: { stringValue: "2026-09-02" },
    minRequiredVersion: { stringValue: "2.0.0" },
    mandatory: { booleanValue: false },
    changelog: {
      arrayValue: {
        values: [
          { stringValue: "Instant bi-directional team chat with Google Cloud REST fallback" },
          { stringValue: "Individual teammate task assignment (Pavithra R) without duplicates" },
          { stringValue: "Full keyboard responsiveness and input text focus enhancements" },
          { stringValue: "Automated Over-The-Air (OTA) continuous cloud update sync" }
        ]
      }
    },
    downloadUrl: { stringValue: "https://github.com/reddot/workstation/releases/download/v2.5.1/REDDOT-Workstation-OS-Setup.exe" }
  }
});

const url = "https://firestore.googleapis.com/v1/projects/reddot-workspace/databases/(default)/documents/organizations/reddot/system/otaRelease?key=AIzaSyBpjenDcXDREseIDv5NfgpDo2fAk_gUhdk";

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
    console.log('Status code:', res.statusCode);
    console.log('Response body:', body);
  });
});

req.on('error', (e) => {
  console.error('Request error:', e);
});

req.write(data);
req.end();
