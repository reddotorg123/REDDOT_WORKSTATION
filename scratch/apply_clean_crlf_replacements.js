const fs = require('fs');
let s = fs.readFileSync('wallpaper-ui/index.html', 'utf8');

function replaceAll(target, replacement) {
  let count = 0;
  while (s.includes(target)) {
    s = s.replace(target, replacement);
    count++;
  }
  console.log(`Replaced "${target.substring(0, 30)}..." : ${count} times`);
}

// 1. Wallpaper Mode button text
replaceAll('... Wallpaper Mode [Esc]', 'Back to Desktop [Esc]');
replaceAll('title="Minimize to Desktop Wallpaper [Esc]"', 'title="Back to Desktop (Esc)"');

// 2. Dashboard KPI labels & subtitles
replaceAll('>ACTIVE ENGINEERS<', '>TEAM ONLINE<');
replaceAll('>TODAY\'S WORK SHIFT<', '>TIME WORKED TODAY<');
replaceAll('>SPRINT VELOCITY<', '>TASKS DONE<');
replaceAll('>STORAGE &amp; NODE SYNC<', '>CLOUD STORAGE<');
replaceAll('>STORAGE & NODE SYNC<', '>CLOUD STORAGE<');
replaceAll('0 on scheduled break, 1 offline', '1 active, 1 offline');
replaceAll('Target: 08h 00m &bull; Active session', 'Target: 8 hours');
replaceAll('67% of sprint deliverables completed', '67% completed');
replaceAll('Priority Objectives for Today', 'Today\'s Tasks');
replaceAll('Recent Team Activity Stream', 'Recent Activity');
replaceAll('View full audit trail', 'View all history');
replaceAll('ACTIVE SESSION', 'CURRENT STATUS');
replaceAll('Shift Status Summary', 'Work Timer');
replaceAll('STRICT ENFORCEMENT FOR ALL REGIONAL NODES', 'All workstations synced');
replaceAll('Strict enforcement for all regional nodes.', 'Local database synced and offline protection active.');

// 3. Security Posture block replacement
const secOld = `<div class="dash-security-card">`;
if (s.includes('SECURITY POSTURE')) {
  s = s.replace(/<span class="security-title">SECURITY POSTURE<\/span>/g, '<span class="security-title">SYSTEM STATUS</span>');
  s = s.replace(/<span>Secure Handshake TLS 1\.3<\/span>/g, '<span>Encrypted &amp; Synced</span>');
}

// 4. Tasks View
replaceAll('Sprint 14 Execution Cycle', 'Current Sprint');
replaceAll('PHASE 3 RUNNING', 'In Progress');
replaceAll('Oct 20 &ndash; Nov 03, 2026 &bull; 4 days remaining', 'Oct 20 &ndash; Nov 3, 2026 &bull; 4 days left');
replaceAll('Filter by title, node, or engineer...', 'Search tasks...');
replaceAll('Category: All Modules', 'All Categories');
replaceAll('Assignee: All Members', 'All Assignees');
replaceAll('Priority: High to Low', 'High Priority First');
replaceAll('TASK-4892 &bull; Active Sprint', 'Task Details');
replaceAll('Branch Pipeline:', 'Module:');
replaceAll('Lead Engineer:', 'Assigned To:');
replaceAll('Sprint Timeline:', 'Due Date:');
replaceAll('SCOPE &amp; OBJECTIVE', 'DESCRIPTION');
replaceAll('SCOPE & OBJECTIVE', 'DESCRIPTION');
replaceAll('DELIVERABLE PROTOTYPE', 'ATTACHMENTS');

// 5. Team Directory
replaceAll('PERSONNEL MATRIX SYS.DIR//v3.4.1', 'TEAM DIRECTORY');
replaceAll('Team Directory &amp; Engineering Nodes', 'Team Members');
replaceAll('Team Directory & Engineering Nodes', 'Team Members');
replaceAll('Engineering staff, node telemetry, role assignments, and active work directives across distributed fabric clusters.', 'View and manage team members, roles, and attendance status.');
replaceAll('placeholder="Search by name, role, or cluster node..."', 'placeholder="Search team members..."');
replaceAll('Active Nodes', 'Online');

// 6. Attendance / Timesheets
replaceAll('ATTENDANCE LOG &bull; NODE-US-04 &bull; Session #4882-TK', 'ATTENDANCE &amp; WORK HOURS');
replaceAll('NTP Time Synchronized (+0.04ms)', 'Real-Time Sync Active');
replaceAll('DUTY OFF &bull; WORKSTATION STANDBY', 'OFF DUTY');
replaceAll('04:00 (Half-Shift)', '04:00 (Half Day)');
replaceAll('08:00:00 Quota', '08:00:00 (Full Day)');
replaceAll('WEEKLY LOAD', 'THIS WEEK');
replaceAll('DAILY MEAN WORK', 'DAILY AVERAGE');
replaceAll('COMPLIANCE RATING', 'ON-TIME RATE');
replaceAll('Shift Punch Log &amp; Audit Ledger', 'Attendance History');
replaceAll('Shift Punch Log & Audit Ledger', 'Attendance History');
replaceAll('Direct hardware timestamps logged via local workstation agent', 'Daily clock-in, break, and clock-out history');
replaceAll('Download CSV Audit', 'Export CSV Report');
replaceAll('Cryptographically Signed Ledger (SHA-256)', 'Verified Work Records');
replaceAll('&#x1F512; Cryptographically Signed Ledger (SHA-256)', '&#x2714; Verified Work Records');
replaceAll('VERIFICATION STATUS', 'STATUS');

// 7. Footer
replaceAll('REDDOT Engine v3.0.1', 'REDDOT Workstation v3.0');
replaceAll('Instance: node-04a', 'Workspace Ready');
replaceAll('Secure Handshake TLS 1.3', 'All Systems Connected');

fs.writeFileSync('wallpaper-ui/index.html', s, 'utf8');
console.log('✅ Updated wallpaper-ui/index.html successfully!');
