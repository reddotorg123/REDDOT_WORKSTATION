const fs = require('fs');

console.log('⚡ Starting UI Simplification & User-Friendly Vocabulary Overhaul...');

// 1. UPDATE wallpaper-ui/index.html
let html = fs.readFileSync('wallpaper-ui/index.html', 'utf8');

const htmlReplacements = [
  // --- Header ---
  {
    from: '<p class="cmd-subtitle" id="cmdSubtitle">Cluster: primary-us-east &bull; Org: reddot</p>',
    to: '<p class="cmd-subtitle" id="cmdSubtitle">Connected &bull; Workspace Ready</p>'
  },
  {
    from: 'placeholder="Search commands, tasks, resources..."',
    to: 'placeholder="Search anything (tasks, members, messages)..."'
  },
  {
    from: 'title="Search commands, tasks, resources (Ctrl+K)"',
    to: 'title="Search anything (Ctrl+K)"'
  },
  {
    from: 'title="Toggle Light / Dark Workstation Theme (Alt+T)"',
    to: 'title="Switch Theme (Alt+T)"'
  },
  {
    from: '<span class="wallpaper-mode-btn-text">&hellip; Wallpaper Mode [Esc]</span>',
    to: '<span class="wallpaper-mode-btn-text">Back to Desktop [Esc]</span>'
  },

  // --- Sidebar Nav ---
  {
    from: '<button class="sidebar-nav-item cmd-tab-btn active" data-target="tabDashboardView" id="tabBtnDashboard" title="Daily Executive Pulse">',
    to: '<button class="sidebar-nav-item cmd-tab-btn active" data-target="tabDashboardView" id="tabBtnDashboard" title="Dashboard">'
  },
  {
    from: '<button class="sidebar-nav-item cmd-tab-btn" data-target="tabTasksView" id="tabBtnTasks" title="Tasks &amp; Sprint Management">',
    to: '<button class="sidebar-nav-item cmd-tab-btn" data-target="tabTasksView" id="tabBtnTasks" title="Tasks">'
  },
  {
    from: '<span class="nav-label">Tasks &amp; Projects</span>',
    to: '<span class="nav-label">Tasks</span>'
  },
  {
    from: '<button class="sidebar-nav-item cmd-tab-btn" data-target="tabWorkersView" id="tabBtnWorkers" title="Team Directory &amp; Engineering Nodes">',
    to: '<button class="sidebar-nav-item cmd-tab-btn" data-target="tabWorkersView" id="tabBtnWorkers" title="Team">'
  },
  {
    from: '<span class="nav-label">Team &amp; Directory</span>',
    to: '<span class="nav-label">Team</span>'
  },
  {
    from: '<button class="sidebar-nav-item cmd-tab-btn" data-target="tabTimesheetsView" id="tabBtnTimesheets" title="Time &amp; Shifts Attendance">',
    to: '<button class="sidebar-nav-item cmd-tab-btn" data-target="tabTimesheetsView" id="tabBtnTimesheets" title="Attendance">'
  },
  {
    from: '<span class="nav-label">Time &amp; Shifts</span>',
    to: '<span class="nav-label">Attendance</span>'
  },
  {
    from: '<button class="sidebar-nav-item cmd-tab-btn" data-target="tabChatView" id="tabBtnChat" title="Team Chat &amp; Meet">',
    to: '<button class="sidebar-nav-item cmd-tab-btn" data-target="tabChatView" id="tabBtnChat" title="Chat">'
  },
  {
    from: '<span class="nav-label">Team Chat</span>',
    to: '<span class="nav-label">Messages</span>'
  },
  {
    from: '<button class="sidebar-nav-item cmd-tab-btn" data-target="tabDatabaseView" id="tabBtnDatabase" title="Storage &amp; Cloud Hub">',
    to: '<button class="sidebar-nav-item cmd-tab-btn" data-target="tabDatabaseView" id="tabBtnDatabase" title="Files &amp; Cloud">'
  },
  {
    from: '<span class="nav-label">Storage &amp; Cloud</span>',
    to: '<span class="nav-label">Files &amp; Cloud</span>'
  },
  {
    from: '<button class="sidebar-nav-item cmd-tab-btn" data-target="tabWallpapersView" id="tabBtnWallpapers" title="System Display &amp; Settings">',
    to: '<button class="sidebar-nav-item cmd-tab-btn" data-target="tabWallpapersView" id="tabBtnWallpapers" title="Settings">'
  },
  {
    from: '<span class="nav-label">System &amp; Settings</span>',
    to: '<span class="nav-label">Settings</span>'
  },

  // --- Sidebar Footer Telemetry Box -> Simple Status ---
  {
    from: `<div class="sidebar-cpu-box">
              <div class="cpu-meta-row">
                <span class="cpu-label">CPU Allocation</span>
                <span class="cpu-val" id="sidebarCpuPercent">28%</span>
              </div>
              <div class="cpu-bar-track">
                <div class="cpu-bar-fill" id="sidebarCpuFill" style="width: 28%;"></div>
              </div>
            </div>`,
    to: `<div class="sidebar-cpu-box">
              <div class="cpu-meta-row">
                <span class="cpu-label">System Status</span>
                <span class="cpu-val" style="color: #10b981;">Online</span>
              </div>
              <div class="cpu-bar-track">
                <div class="cpu-bar-fill" style="width: 100%; background: #10b981;"></div>
              </div>
            </div>`
  },

  // --- TAB 0: DASHBOARD ---
  {
    from: '<span>DAILY EXECUTIVE PULSE &bull; All Systems Operational</span>',
    to: '<span>Overview &bull; All Systems Ready</span>'
  },
  {
    from: '<h1 class="dash-exec-greeting" id="dashGreeting">Good morning, Jagadish K</h1>\n                  <p class="dash-exec-sub" id="dashDateCluster">Saturday, September 12, 2026 &bull; Production Cluster 04a</p>',
    to: '<h1 class="dash-exec-greeting" id="dashGreeting">Good evening, Jagadish K</h1>\n                  <p class="dash-exec-sub" id="dashDateCluster">Sunday, September 13, 2026 &bull; Reddot Workstation</p>'
  },
  {
    from: '<span class="metric-card-title">ACTIVE ENGINEERS</span>',
    to: '<span class="metric-card-title">TEAM ONLINE</span>'
  },
  {
    from: '<span class="metric-card-title">TODAY\'S WORK SHIFT</span>',
    to: '<span class="metric-card-title">TIME WORKED TODAY</span>'
  },
  {
    from: '<span class="metric-card-title">SPRINT VELOCITY</span>',
    to: '<span class="metric-card-title">TASKS DONE</span>'
  },
  {
    from: '<span class="metric-card-title">STORAGE &amp; NODE SYNC</span>',
    to: '<span class="metric-card-title">CLOUD SYNC</span>'
  },
  {
    from: 'Synchronized &bull; Local Storage Active',
    to: 'All files backed up &bull; Up to date'
  },
  {
    from: '<h3 class="dash-block-title">Priority Objectives for Today</h3>',
    to: '<h3 class="dash-block-title">Today\'s Tasks</h3>'
  },
  {
    from: '<h3 class="dash-block-title">Recent Team Activity Stream</h3>',
    to: '<h3 class="dash-block-title">Recent Activity</h3>'
  },
  {
    from: 'View full audit trail',
    to: 'View full history'
  },
  {
    from: '<span class="session-hero-label">ACTIVE SESSION</span>\n                <h3 class="session-hero-title">Shift Status Summary</h3>',
    to: '<span class="session-hero-label">CURRENT STATUS</span>\n                <h3 class="session-hero-title">Work Timer</h3>'
  },

  // Remove fake security posture box in dashboard
  {
    from: `<div class="dash-security-card">
                  <div class="dash-security-header">
                    <span class="security-shield-icon">&#x1F6E1;&#xFE0F;</span>
                    <span class="security-title">SECURITY POSTURE</span>
                  </div>
                  <div class="dash-security-meta">
                    <span class="security-dot">&bull;</span>
                    <span>Latency: 12ms</span>
                    <span class="divider">|</span>
                    <span>Secure Handshake TLS 1.3</span>
                  </div>
                  <div class="security-policy-sub">Strict enforcement for all regional nodes.</div>
                </div>`,
    to: `<div class="dash-security-card" style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 16px;">
                  <div class="dash-security-header" style="display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 13px; color: #10b981;">
                    <span class="security-shield-icon">&#x2714;</span>
                    <span class="security-title">Workstation Connected</span>
                  </div>
                  <div class="dash-security-meta" style="font-size: 12px; color: #94a3b8; margin-top: 6px;">
                    Local database synced &bull; Automatic offline protection enabled.
                  </div>
                </div>`
  },

  // --- TAB 4: TASKS ---
  {
    from: '<span class="sprint-tag">WORKSTREAM // SPRINT 14</span>',
    to: '<span class="sprint-tag">Sprint 14</span>'
  },
  {
    from: '<span class="sprint-sync-pill"><span class="pulse-green"></span> System Sync Active</span>',
    to: '<span class="sprint-sync-pill"><span class="pulse-green"></span> Active</span>'
  },
  {
    from: '<h2 class="sprint-page-title">Tasks &amp; Sprint Management</h2>\n              <p class="sprint-page-sub">Manage ongoing sprints, verify deliverables, and orchestrate work pipelines across autonomous cluster nodes.</p>',
    to: '<h2 class="sprint-page-title">Tasks</h2>\n              <p class="sprint-page-sub">Track team tasks, assignments, and daily deliverables.</p>'
  },
  {
    from: '<h3 class="sprint-card-title">Sprint 14 Execution Cycle</h3>\n                  <span class="sprint-phase-pill">PHASE 3 RUNNING</span>',
    to: '<h3 class="sprint-card-title">Current Sprint</h3>\n                  <span class="sprint-phase-pill">In Progress</span>'
  },
  {
    from: 'Oct 20 &ndash; Nov 03, 2026 &bull; 4 days remaining',
    to: 'Oct 20 &ndash; Nov 3, 2026 &bull; 4 days left'
  },
  {
    from: '<span class="sprint-stat-label">TOTAL TASKS</span>',
    to: '<span class="sprint-stat-label">Total Tasks</span>'
  },
  {
    from: '<span class="sprint-stat-label">COMPLETED</span>',
    to: '<span class="sprint-stat-label">Completed</span>'
  },
  {
    from: '<span class="sprint-stat-label">ACTIVE LOAD</span>',
    to: '<span class="sprint-stat-label">In Progress</span>'
  },
  {
    from: '<span class="sprint-stat-label">VELOCITY SCORE</span>',
    to: '<span class="sprint-stat-label">Progress</span>'
  },
  {
    from: 'placeholder="Filter by title, node, or engineer..."',
    to: 'placeholder="Search tasks..."'
  },
  {
    from: '<option value="ALL">Category: All Modules</option>',
    to: '<option value="ALL">All Categories</option>'
  },
  {
    from: '<option value="ALL">Assignee: All Members</option>',
    to: '<option value="ALL">All Assignees</option>'
  },
  {
    from: '<option value="HIGH_FIRST">Priority: High to Low</option>',
    to: '<option value="HIGH_FIRST">High Priority First</option>'
  },
  {
    from: '<span class="stream-dot in-progress"></span> IN PROGRESS',
    to: '<span class="stream-dot in-progress"></span> In Progress'
  },
  {
    from: '<span class="stream-dot completed"></span> COMPLETED THIS WEEK',
    to: '<span class="stream-dot completed"></span> Completed'
  },
  {
    from: '<button type="button" class="stream-archive-link">Archive Review &rsaquo;</button>',
    to: '<button type="button" class="stream-archive-link">View Completed Tasks &rsaquo;</button>'
  },

  // Task Drawer simplifications
  {
    from: 'TASK-4892 &bull; Active Sprint',
    to: 'Task Details'
  },
  {
    from: '<div class="drawer-meta-item">\n                    <span class="drawer-meta-label">Branch Pipeline:</span>\n                    <span class="drawer-meta-val code" id="drawerBranch">main/active</span>\n                  </div>',
    to: ''
  },
  {
    from: '<span class="drawer-meta-label">Lead Engineer:</span>',
    to: '<span class="drawer-meta-label">Assigned To:</span>'
  },
  {
    from: '<span class="drawer-meta-label">Sprint Timeline:</span>',
    to: '<span class="drawer-meta-label">Due Date:</span>'
  },
  {
    from: '<span class="drawer-section-heading">SCOPE &amp; OBJECTIVE</span>',
    to: '<span class="drawer-section-heading">DESCRIPTION</span>'
  },
  {
    from: '<span class="drawer-section-heading">SUBTASKS (<span id="drawerSubtasksDoneText">0/0 DONE</span>)</span>',
    to: '<span class="drawer-section-heading">CHECKLIST (<span id="drawerSubtasksDoneText">0/0 Done</span>)</span>'
  },
  // Remove deliverable prototype section with fake placeholder image
  {
    from: `<div class="drawer-section mt-16">
                  <span class="drawer-section-heading">DELIVERABLE PROTOTYPE</span>
                  <div class="drawer-prototype-card" id="drawerPrototypePreview">
                    <img id="drawerPrototypeImg" src="assets/id-card.png" alt="Prototype preview" onerror="this.style.display='none';">
                    <div class="prototype-overlay-tag" id="drawerPrototypeFilename" style="display:none;">deliverable.pdf</div>
                  </div>
                </div>`,
    to: ''
  },

  // --- TAB 2: TEAM DIRECTORY ---
  {
    from: '<div class="personnel-badge">PERSONNEL MATRIX SYS.DIR//v3.4.1</div>',
    to: '<div class="personnel-badge">TEAM DIRECTORY</div>'
  },
  {
    from: '<h2 class="personnel-title">Team Directory &amp; Engineering Nodes</h2>\n                <p class="personnel-sub">Engineering staff, node telemetry, role assignments, and active work directives across distributed fabric clusters.</p>',
    to: '<h2 class="personnel-title">Team Members</h2>\n                <p class="personnel-sub">View and manage your team, roles, and attendance status.</p>'
  },
  {
    from: '<span class="telemetry-label">Active Nodes</span>',
    to: '<span class="telemetry-label">Online</span>'
  },
  {
    from: `<div class="telemetry-pill">
                  <span class="telemetry-label">Avg. Ping</span>
                  <span class="telemetry-val">14 <span class="telemetry-unit">ms</span></span>
                </div>`,
    to: ''
  },
  {
    from: 'placeholder="Search by name, role, or cluster node..."',
    to: 'placeholder="Search team members..."'
  },
  {
    from: '<button type="button" class="dept-pill" data-dept="Core Runtime">Core Runtime</button>\n              <button type="button" class="dept-pill" data-dept="SecOps">SecOps</button>',
    to: '<button type="button" class="dept-pill" data-dept="Engineering & Development">Engineering</button>'
  },

  // --- TAB 3: ATTENDANCE (TIMESHEETS) ---
  {
    from: '<span class="shift-header-tag">ATTENDANCE LOG &bull; NODE-US-04 &bull; Session #4882-TK</span>',
    to: '<span class="shift-header-tag">ATTENDANCE &amp; WORK HOURS</span>'
  },
  {
    from: `<div class="shift-header-sync">
              <span class="sync-dot">&bull;</span>
              <span>NTP Time Synchronized (+0.04ms)</span>
            </div>`,
    to: `<div class="shift-header-sync">
              <span class="sync-dot">&bull;</span>
              <span>Real-Time Sync Active</span>
            </div>`
  },
  {
    from: 'DUTY OFF &bull; WORKSTATION STANDBY',
    to: 'OFF DUTY'
  },
  {
    from: '<span class="clock-unit-label">HRS ACTIVE</span>',
    to: '<span class="clock-unit-label">Active Today</span>'
  },
  {
    from: '<span>04:00 (Half-Shift)</span>\n                  <span>08:00:00 Quota</span>',
    to: '<span>04:00 (Half Day)</span>\n                  <span>08:00:00 (Full Day)</span>'
  },
  {
    from: '<span class="att-kpi-label">WEEKLY LOAD</span>',
    to: '<span class="att-kpi-label">THIS WEEK</span>'
  },
  {
    from: '<span class="att-kpi-target" id="weeklyLoadTargetText">Target: 40.0 hrs &bull; 0%</span>',
    to: '<span class="att-kpi-target" id="weeklyLoadTargetText">Target: 40 hrs</span>'
  },
  {
    from: 'Paced to fulfill weekly quota',
    to: 'Weekly hours goal'
  },
  {
    from: '<span class="att-kpi-label">DAILY MEAN WORK</span>',
    to: '<span class="att-kpi-label">DAILY AVERAGE</span>'
  },
  {
    from: '<span class="att-kpi-label">COMPLIANCE RATING</span>',
    to: '<span class="att-kpi-label">ON-TIME RATE</span>'
  },
  {
    from: '&#x1F512; Cryptographically Signed Ledger (SHA-256)',
    to: '&#x2714; Verified Work Records'
  },
  {
    from: '<h4 class="section-title">Shift Punch Log &amp; Audit Ledger</h4>\n                <p class="section-sub">Direct hardware timestamps logged via local workstation agent</p>',
    to: '<h4 class="section-title">Attendance History</h4>\n                <p class="section-sub">Log of your daily clock-in, break, and clock-out times</p>'
  },
  {
    from: '<span>&#x2B07;&#xFE0F; Download CSV Audit</span>',
    to: '<span>&#x2B07;&#xFE0F; Export CSV Report</span>'
  },
  {
    from: '<th>VERIFICATION STATUS</th>',
    to: '<th>STATUS</th>'
  },

  // --- Status Footer ---
  {
    from: `<div class="footer-left">
          <span class="footer-version-tag">REDDOT Engine v3.0.1</span>
          <span class="footer-divider">|</span>
          <span class="footer-instance-tag">Instance: node-04a</span>
        </div>
        <div class="footer-right">
          <span class="latency-dot">&bull;</span>
          <span class="footer-latency-tag">Latency: 12ms</span>
          <span class="footer-divider">|</span>
          <span class="footer-security-tag">Secure Handshake TLS 1.3</span>
        </div>`,
    to: `<div class="footer-left">
          <span class="footer-version-tag">REDDOT Workstation v3.0</span>
        </div>
        <div class="footer-right">
          <span class="latency-dot">&bull;</span>
          <span>Connected</span>
        </div>`
  }
];

let htmlAppliedCount = 0;
htmlReplacements.forEach((rep, idx) => {
  if (html.includes(rep.from)) {
    html = html.replace(rep.from, rep.to);
    htmlAppliedCount++;
  } else {
    console.warn(`[HTML WARNING] Replacement #${idx+1} from text not found!`);
  }
});

fs.writeFileSync('wallpaper-ui/index.html', html, 'utf8');
console.log(`✅ Applied ${htmlAppliedCount}/${htmlReplacements.length} simplifications to wallpaper-ui/index.html`);
