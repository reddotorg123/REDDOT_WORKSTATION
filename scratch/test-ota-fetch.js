const https = require('https');

const url = 'https://firestore.googleapis.com/v1/projects/reddot-workspace/databases/(default)/documents/organizations/reddot/system/otaRelease?key=AIzaSyBpjenDcXDREseIDv5NfgpDo2fAk_gUhdk';

https.get(url, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Status code:', res.statusCode);
    const json = JSON.parse(body);
    console.log('Remote Version:', json.fields?.version?.stringValue);
    console.log('Release Date:', json.fields?.releaseDate?.stringValue);
    console.log('Changelog:', json.fields?.changelog?.arrayValue?.values?.map(v => v.stringValue));
  });
}).on('error', console.error);
