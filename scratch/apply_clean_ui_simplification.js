const fs = require('fs');
let s = fs.readFileSync('wallpaper-ui/index.html', 'utf8');

const replacements = [
  // Header
  ['Cluster: primary-us-east &bull; Org: reddot', 'Connected &bull; Workspace Ready'],
  ['placeholder="Search commands, tasks, resources..."', 'placeholder="Search anything (tasks, members, messages)..."'],
  ['title="Search commands, tasks, resources (Ctrl+K)"', 'title="Search anything (Ctrl+K)"'],
  ['title="Toggle Light / Dark Workstation Theme (Alt+T)"', 'title="Switch Theme (Alt+T)"'],
  ['title="System Alerts &amp; Directives"', 'title="Notifications"'],
  ['title="System Alerts & Directives"', 'title="Notifications"'],
  ['&hellip; Wallpaper Mode [Esc]', 'Back to Desktop [Esc]'],
  ['... Wallpaper Mode [Esc]', 'Back to Desktop [Esc]'],
  ['<span>&#x29E2; Wallpaper Mode [Esc]</span>', '<span>&#x29E2; Back to Desktop [Esc]</span>'],

  // Sidebar
  ['title="Daily Executive Pulse"', 'title="Dashboard"'],
  ['title="Tasks &amp; Sprint Management"', 'title="Tasks"'],
  ['<span class="nav-label">Tasks &amp; Projects</span>', '<span class="nav-label">Tasks</span>'],
  ['title="Team Directory &amp; Engineering Nodes"', 'title="Team"'],
  ['<span class="nav-label">Team &amp; Directory</span>', '<span class="nav-label">Team</span>'],
  ['title="Time &amp; Shifts Attendance"', 'title="Attendance"'],
  ['<span class="nav-label">Time &amp; Shifts</span>', '<span class="nav-label">Attendance</span>'],
  ['<span class="nav-label">Team Chat</span>', '<span class="nav-label">Messages</span>'],
  ['<span class="nav-label">Storage &amp; Cloud</span>', '<span class="nav-label">Files &amp; Cloud</span>'],
  ['<span class="nav-label">System &amp; Settings</span>', '<span class="nav-label">Settings</span>'],
  ['<span class="cpu-label">CPU Allocation</span>', '<span class="cpu-label">System Status</span>'],
  ['id="sidebarCpuPercent">28%</span>', 'id="sidebarCpuPercent" style="color:#10b981;">Online</span>'],

  // Dashboard
  ['DAILY EXECUTIVE PULSE &bull; All Systems Operational', 'Overview &bull; All Systems Ready'],
  ['Saturday, September 12, 2026 &bull; Production Cluster 04a', 'Sunday, September 13, 2026 &bull; Reddot Workstation'],
  ['>ACTIVE ENGINEERS<', '>TEAM ONLINE<'],
  ['>TODAY\'S WORK SHIFT<', '>TIME WORKED TODAY<'],
  ['>SPRINT VELOCITY<', '>TASKS DONE<'],
  ['>STORAGE &amp; NODE SYNC<', '>CLOUD STORAGE<'],
  ['>STORAGE & NODE SYNC<', '>CLOUD STORAGE<'],
  ['Synchronized &bull; Local Storage Active', 'All files backed up &bull; Up to date'],
  ['Priority Objectives for Today', 'Today\'s Tasks'],
  ['Recent Team Activity Stream', 'Recent Activity'],
  ['View full audit trail', 'View all history'],
  ['ACTIVE SESSION', 'CURRENT STATUS'],
  ['Shift Status Summary', 'Work Timer'],
  ['<span class="security-title">SECURITY POSTURE</span>', '<span class="security-title">SYSTEM STATUS</span>'],
  ['Strict enforcement for all regional nodes.', 'Local database synced and offline protection active.'],

  // Tasks
  ['WORKSTREAM // SPRINT 14', 'Sprint 14'],
  ['System Sync Active', 'Active'],
  ['Tasks &amp; Sprint Management', 'Tasks'],
  ['Manage ongoing sprints, verify deliverables, and orchestrate work pipelines across autonomous cluster nodes.', 'Keep track of your team\'s tasks, assignments, and daily deliverables.'],
  ['Sprint 14 Execution Cycle', 'Current Sprint'],
  ['PHASE 3 RUNNING', 'In Progress'],
  ['Oct 20 &ndash; Nov 03, 2026 &bull; 4 days remaining', 'Oct 20 &ndash; Nov 3, 2026 &bull; 4 days left'],
  ['<span class="sprint-stat-label">TOTAL TASKS</span>', '<span class="sprint-stat-label">Total Tasks</span>'],
  ['<span class="sprint-stat-label">COMPLETED</span>', '<span class="sprint-stat-label">Completed</span>'],
  ['<span class="sprint-stat-label">ACTIVE LOAD</span>', '<span class="sprint-stat-label">In Progress</span>'],
  ['<span class="sprint-stat-label">VELOCITY SCORE</span>', '<span class="sprint-stat-label">Progress</span>'],
  ['placeholder="Filter by title, node, or engineer..."', 'placeholder="Search tasks..."'],
  ['<option value="ALL">Category: All Modules</option>', '<option value="ALL">All Categories</option>'],
  ['<option value="ALL">All Modules</option>', '<option value="ALL">All Categories</option>'],
  ['<option value="ALL">Assignee: All Members</option>', '<option value="ALL">All Assignees</option>'],
  ['<option value="HIGH_FIRST">Priority: High to Low</option>', '<option value="HIGH_FIRST">High Priority First</option>'],
  ['<span class="tasks-section-title">IN PROGRESS</span>', '<span class="tasks-section-title">In Progress</span>'],
  ['<span class="tasks-section-title">COMPLETED THIS WEEK</span>', '<span class="tasks-section-title">Completed Tasks</span>'],
  ['Archive Review &rsaquo;', 'View Completed Tasks &rsaquo;'],
  ['TASK-4892 &bull; Sprint 14 Node', 'Task Details'],
  ['TASK-4892 &bull; Active Sprint', 'Task Details'],
  ['TASK-DETAILS &bull; Sprint Node', 'Task Details'],
  ['Select a task from the sprint list to review its scope, requirements, and deliverables.', 'Select a task from the list to view its description and checklist.'],
  ['<span class="drawer-meta-label">Branch Pipeline:</span>', '<span class="drawer-meta-label">Category:</span>'],
  ['<span class="drawer-meta-label">Lead Engineer:</span>', '<span class="drawer-meta-label">Assigned To:</span>'],
  ['<span class="drawer-meta-label">Sprint Timeline:</span>', '<span class="drawer-meta-label">Due Date:</span>'],
  ['<span class="drawer-section-heading">SCOPE &amp; OBJECTIVE</span>', '<span class="drawer-section-heading">DESCRIPTION</span>'],
  ['<span class="drawer-section-heading">SUBTASKS</span>', '<span class="drawer-section-heading">CHECKLIST</span>'],
  ['<span class="drawer-section-heading">DELIVERABLE PROTOTYPE</span>', '<span class="drawer-section-heading">ATTACHMENTS</span>'],

  // Team
  ['PERSONNEL MATRIX SYS.DIR//v3.4.1', 'TEAM DIRECTORY'],
  ['Team Directory &amp; Engineering Nodes', 'Team Members'],
  ['Team Directory & Engineering Nodes', 'Team Members'],
  ['Engineering staff, node telemetry, role assignments, and active work directives across distributed fabric clusters.', 'View and manage team members, roles, and attendance status.'],
  ['<span class="telemetry-label">Active Nodes</span>', '<span class="telemetry-label">Online</span>'],
  ['placeholder="Search by name, role, or cluster node..."', 'placeholder="Search team members..."'],
  ['Provision New Node Member', 'Add Team Member'],
  ['Assign telemetry roles, cluster authorization & directives.', 'Invite or register a new team member.'],
  ['Assign telemetry roles, cluster authorization &amp; directives.', 'Invite or register a new team member.'],
  ['<button type="button" class="dept-pill" data-dept="Core Runtime">Core Runtime</button>', '<button type="button" class="dept-pill" data-dept="Engineering">Engineering</button>'],
  ['<button type="button" class="dept-pill" data-dept="SecOps">SecOps</button>', '<button type="button" class="dept-pill" data-dept="Operations">Operations</button>'],

  // Attendance
  ['ATTENDANCE LOG &bull; NODE-US-04 &bull; Session #4882-TK', 'ATTENDANCE &amp; WORK HOURS'],
  ['NTP Time Synchronized (+0.04ms)', 'Real-Time Sync Active'],
  ['DUTY OFF &bull; WORKSTATION STANDBY', 'OFF DUTY'],
  ['<span class="clock-unit-label">HRS ACTIVE</span>', '<span class="clock-unit-label">Active Today</span>'],
  ['04:00 (Half-Shift)', '04:00 (Half Day)'],
  ['08:00:00 Quota', '08:00:00 (Full Day)'],
  ['<span class="att-kpi-label">WEEKLY LOAD</span>', '<span class="att-kpi-label">THIS WEEK</span>'],
  ['<span class="att-kpi-label">DAILY MEAN WORK</span>', '<span class="att-kpi-label">DAILY AVERAGE</span>'],
  ['<span class="att-kpi-label">COMPLIANCE RATING</span>', '<span class="att-kpi-label">ON-TIME RATE</span>'],
  ['Cryptographically Signed Ledger (SHA-256)', 'Verified Work Records'],
  ['Shift Punch Log &amp; Audit Ledger', 'Attendance History'],
  ['Shift Punch Log & Audit Ledger', 'Attendance History'],
  ['Direct hardware timestamps logged via local workstation agent', 'Daily clock-in, break, and clock-out history'],
  ['Download CSV Audit', 'Export CSV Report'],
  ['<th>VERIFICATION STATUS</th>', '<th>STATUS</th>'],

  // Footer
  ['REDDOT Engine v3.0.1', 'REDDOT Workstation v3.0'],
  ['Instance: node-04a', 'Workspace Ready'],
  ['Secure Handshake TLS 1.3', 'All Systems Connected']
];

let count = 0;
replacements.forEach(([from, to]) => {
  if (s.includes(from)) {
    s = s.split(from).join(to);
    count++;
  } else {
    console.log(`[SKIPPED / NOT FOUND]: ${from.substring(0, 35)}`);
  }
});

fs.writeFileSync('wallpaper-ui/index.html', s, 'utf8');
console.log(`✅ Applied ${count}/${replacements.length} clean text replacements without altering DOM structure!`);
