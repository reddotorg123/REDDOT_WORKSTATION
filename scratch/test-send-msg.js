const https = require('https');

// Test REST API write directly to the DM channel messages subcollection
const data = JSON.stringify({
  fields: {
    senderId: { stringValue: "Uvhr9MPQ0RODCujtxzUiWcJBzHk2" },
    senderUid: { stringValue: "Uvhr9MPQ0RODCujtxzUiWcJBzHk2" },
    senderEmpId: { stringValue: "RD-FOUNDER-001" },
    senderName: { stringValue: "JAGADISH K" },
    senderEmail: { stringValue: "jagadish2k2006@gmail.com" },
    text: { stringValue: "Hello Pavithra, checking realtime chat link" },
    createdAt: { integerValue: String(Date.now()) },
    channelId: { stringValue: "dm_jagadish2k2006_gmail_com___pavithratech1206_gmail_com" }
  }
});

const url = "https://firestore.googleapis.com/v1/projects/reddot-workspace/databases/(default)/documents/organizations/reddot/channels/dm_jagadish2k2006_gmail_com___pavithratech1206_gmail_com/messages?key=AIzaSyBpjenDcXDREseIDv5NfgpDo2fAk_gUhdk";

const req = https.request(url, {
  method: 'POST',
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
