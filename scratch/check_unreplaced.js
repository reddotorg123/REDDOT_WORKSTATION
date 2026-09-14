const fs = require('fs');
const s = fs.readFileSync('wallpaper-ui/index.html', 'utf8');

const checks = [
  'Wallpaper Mode',
  'PRODUCTION CLUSTER',
  'ACTIVE ENGINEERS',
  'TODAY\'S WORK SHIFT',
  'SPRINT VELOCITY',
  'STORAGE & NODE SYNC',
  'Priority Objectives for Today',
  'Recent Team Activity Stream',
  'SECURITY POSTURE',
  'WORKSTREAM // SPRINT 14',
  'Tasks & Sprint Management',
  'Sprint 14 Execution Cycle',
  'TOTAL TASKS',
  'COMPLETED',
  'ACTIVE LOAD',
  'VELOCITY SCORE',
  'PERSONNEL MATRIX',
  'Engineering staff, node telemetry',
  'ATTENDANCE LOG',
  'NTP Time Synchronized',
  'Cryptographically Signed Ledger',
  'Shift Punch Log & Audit Ledger',
  'REDDOT Engine v3.0.1'
];

checks.forEach(c => {
  const idx = s.indexOf(c);
  if (idx !== -1) {
    console.log(`FOUND: "${c}" at ${idx}:\n  --> ${JSON.stringify(s.substring(idx - 10, idx + c.length + 30))}`);
  } else {
    console.log(`NOT FOUND: "${c}"`);
  }
});
