const https = require('https');

const callId = 'call_test_' + Date.now();
const data = JSON.stringify({
  fields: {
    callId: { stringValue: callId },
    callerUid: { stringValue: "Uvhr9MPQ0RODCujtxzUiWcJBzHk2" },
    callerEmail: { stringValue: "jagadish2k2006@gmail.com" },
    callerName: { stringValue: "JAGADISH K" },
    callerPhoto: { stringValue: "" },
    targetUid: { stringValue: "Yp9Rm1HggQYJYMDc6x8e7DFxRyR2" },
    targetEmail: { stringValue: "pavithratech1206@gmail.com" },
    targetName: { stringValue: "Pavithra R" },
    roomUrl: { stringValue: "https://meet.jit.si/reddot-test-room" },
    callType: { stringValue: "video" },
    status: { stringValue: "RINGING" },
    createdAt: { integerValue: String(Date.now()) },
    updatedAt: { integerValue: String(Date.now()) }
  }
});

const url = `https://firestore.googleapis.com/v1/projects/reddot-workspace/databases/(default)/documents/organizations/reddot/calls/${callId}?key=AIzaSyBpjenDcXDREseIDv5NfgpDo2fAk_gUhdk`;

const req = https.request(url, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
}, (res) => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => {
    console.log('Call signaling write status:', res.statusCode);
  });
});
req.write(data);
req.end();
