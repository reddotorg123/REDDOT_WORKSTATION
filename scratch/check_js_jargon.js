const fs = require('fs');
const js = fs.readFileSync('wallpaper-ui/wallpaper.js', 'utf8');

const checks = [
  'ACTIVE ENGINEERS',
  'SPRINT VELOCITY',
  'Priority Objectives',
  'Activity Stream',
  'Shift Status',
  'DELIVERABLE',
  'Active Directives',
  'ACTIVE WORK DIRECTIVE',
  'Target Architecture',
  'us-east-core-01',
  'eu-west-rt-03',
  'BGA Signal Integrity',
  'Lead Engineer',
  'Branch Pipeline',
  'SCOPE & OBJECTIVE',
  'Session #4882',
  'NTP Time',
  'WEEKLY LOAD',
  'DAILY MEAN',
  'COMPLIANCE RATING',
  'Cryptographically Signed',
  'Audit Ledger',
  'Hardware Architecture & // EMBEDDED SYSTEMS'
];

checks.forEach(c => {
  const found = js.includes(c);
  console.log(`${c} -> ${found}`);
});
