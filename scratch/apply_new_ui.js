/**
 * Transform index.html with REDDOT Workstation v3.0 UI/UX
 */
const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'wallpaper-ui', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// 1. New Executive Top Header
const newHeader = `      <!-- WORKSTATION EXECUTIVE TOP HEADER (v3.0) -->
      <header class="command-header workstation-top-header">
        <div class="header-left">
          <div class="cmd-brand-icon" title="REDDOT Workstation v3.0">
            <span class="cmd-brand-letter">RD</span>
          </div>
          <div class="cmd-title-meta">
            <div class="cmd-title-row">
              <h2 class="cmd-title" id="cmdTitle">REDDOT Workstation v3.0</h2>
              <span class="connected-badge">
                <span class="pulse-dot"></span> Connected
              </span>
            </div>
            <p class="cmd-subtitle" id="cmdSubtitle">Cluster: primary-us-east &bull; Org: reddot</p>
          </div>
        </div>

        <!-- Universal Omnibox Search (Ctrl+K) -->
        <div class="omnibox-search-bar" id="topOmniboxSearchTrigger" title="Search commands, tasks, resources (Ctrl+K)">
          <span class="search-icon">&#x1F50D;</span>
          <input type="text" id="globalOmniboxInput" class="omnibox-input" placeholder="Search commands, tasks, resources..." readonly>
          <kbd class="omnibox-kbd">Ctrl+K</kbd>
        </div>

        <!-- Window Controls & User Profile -->
        <div class="header-right">
          <!-- Dual Theme Switcher (Light Enterprise vs Obsidian Crimson Dark) -->
          <button type="button" id="btnThemeToggle" class="btn-header-tool" title="Toggle Light / Dark Workstation Theme (Alt+T)">
            <span id="themeToggleIcon">&#x2600;&#xFE0F;</span>
          </button>

          <!-- OTA Update Pill -->
          <button type="button" id="headerOtaPill" class="ota-header-pill hidden" title="New update available! Click to update now">
            <span class="ota-pill-dot"></span>
            <span id="headerOtaPillText">&#x26A1; UPDATE v2.5.7</span>
          </button>

          <!-- Notification Bell -->
          <button type="button" id="btnNotificationBell" class="btn-header-tool btn-notif-bell" title="System Alerts &amp; Directives">
            <span class="bell-icon">&#x1F514;</span>
            <span class="bell-badge" id="headerNotifBadge">3</span>
          </button>

          <!-- User Profile Chip -->
          <div class="header-user-profile" id="btnAuthTrigger" title="Switch User / View Profile">
            <img id="headerUserAvatar" class="header-user-avatar" src="assets/id-card.png" alt="User Profile" onerror="this.src='assets/id-card.png';">
            <div class="header-user-info">
              <span class="header-user-name" id="headerUserName">Jagadish K</span>
              <span class="header-user-role" id="headerUserRole">Founder</span>
            </div>
            <span class="header-user-caret">&#x25BE;</span>
          </div>

          <!-- Pin to Wallpaper Mode -->
          <button id="btnCmdPinToggle" class="btn-outline-action" title="Toggle Desktop Background Pin Mode">
            <span id="cmdPinIcon">&#x1F4CC;</span> <span id="cmdPinText">Pin Mode</span>
          </button>
          <button id="btnToggleWallpaperMode" class="btn-outline-action" title="Return to Clean Live Wallpaper (Esc)">
            <span>&#x29E2; Wallpaper Mode [Esc]</span>
          </button>

          <!-- Native Window Buttons -->
          <div class="cmd-win-ctrl-group">
            <button id="btnCmdMinimize" class="cmd-win-btn" title="Minimize Window">&minus;</button>
            <button id="btnCmdMaximize" class="cmd-win-btn" title="Maximize Window">&#x25A2;</button>
            <button id="btnCloseCommandCenter" class="drawer-close-btn" title="Close (Esc)">&times;</button>
          </div>
        </div>
      </header>

      <!-- MAIN WORKSTATION BODY LAYOUT (Left Navigation Rail + Content Deck) -->
      <div class="workstation-body-layout">
        <!-- Iconic Left Navigation Rail (Workspace Sidebar) -->
        <aside class="workstation-sidebar" id="workstationSidebar">
          <div class="sidebar-section-label">WORKSPACE</div>
          <nav class="sidebar-nav-list" id="cmdTabNav">
            <button class="sidebar-nav-item cmd-tab-btn active" data-target="tabDashboardView" id="tabBtnDashboard" title="Daily Executive Pulse">
              <span class="nav-icon">&#x229E;</span>
              <span class="nav-label">Dashboard</span>
            </button>
            <button class="sidebar-nav-item cmd-tab-btn" data-target="tabTasksView" id="tabBtnTasks" title="Tasks &amp; Sprint Management">
              <span class="nav-icon">&#x2611;</span>
              <span class="nav-label">Tasks &amp; Projects</span>
            </button>
            <button class="sidebar-nav-item cmd-tab-btn" data-target="tabWorkersView" id="tabBtnWorkers" title="Team Directory &amp; Engineering Nodes">
              <span class="nav-icon">&#x1F465;</span>
              <span class="nav-label">Team &amp; Directory</span>
            </button>
            <button class="sidebar-nav-item cmd-tab-btn" data-target="tabTimesheetsView" id="tabBtnTimesheets" title="Time &amp; Shifts Attendance">
              <span class="nav-icon">&#x23F1;</span>
              <span class="nav-label">Time &amp; Shifts</span>
            </button>
            <button class="sidebar-nav-item cmd-tab-btn" data-target="tabChatView" id="tabBtnChat" title="Team Chat &amp; Meet">
              <span class="nav-icon">&#x1F4AC;</span>
              <span class="nav-label">Team Chat</span>
            </button>
            <button class="sidebar-nav-item cmd-tab-btn" data-target="tabDatabaseView" id="tabBtnDatabase" title="Storage &amp; Cloud Hub">
              <span class="nav-icon">&#x2601;</span>
              <span class="nav-label">Storage &amp; Cloud</span>
            </button>
            <button class="sidebar-nav-item cmd-tab-btn" data-target="tabWallpapersView" id="tabBtnWallpapers" title="System Display &amp; Settings">
              <span class="nav-icon">&#x2699;</span>
              <span class="nav-label">System &amp; Settings</span>
            </button>
          </nav>

          <!-- Bottom Telemetry: CPU Allocation Widget -->
          <div class="sidebar-footer-widget">
            <div class="sidebar-cpu-box">
              <div class="cpu-meta-row">
                <span class="cpu-label">CPU Allocation</span>
                <span class="cpu-val" id="sidebarCpuPercent">28%</span>
              </div>
              <div class="cpu-bar-track">
                <div class="cpu-bar-fill" id="sidebarCpuFill" style="width: 28%;"></div>
              </div>
            </div>
          </div>
        </aside>

        <!-- Main Tab Content Area -->
        <main class="command-body">

          <!-- TAB 0: DAILY EXECUTIVE PULSE DASHBOARD (Reference Image 1) -->
          <section id="tabDashboardView" class="cmd-tab-pane active">
            <div class="dash-exec-header">
              <div class="dash-exec-badge">
                <span class="pulse-green"></span>
                <span>DAILY EXECUTIVE PULSE &bull; All Systems Operational</span>
              </div>
              <div class="dash-exec-main-row">
                <div class="dash-exec-title-block">
                  <h1 class="dash-exec-greeting" id="dashGreeting">Good morning, Jagadish K</h1>
                  <p class="dash-exec-sub" id="dashDateCluster">Saturday, September 12, 2026 &bull; Production Cluster 04a</p>
                </div>
                <div class="dash-exec-actions">
                  <button type="button" id="dashBtnLogShift" class="btn-dash-action secondary" title="Log Shift / Time Management">
                    <span>&#x23F1; Log Shift</span>
                  </button>
                  <button type="button" id="dashBtnNewTask" class="btn-dash-action primary" title="Create New Task">
                    <span>+ New Task</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- 4 Key Stat Metric Cards (Image 1) -->
            <div class="dash-kpi-grid">
              <div class="dash-kpi-card" id="dashKpiEngineers">
                <div class="dash-kpi-top">
                  <span class="dash-kpi-label">ACTIVE ENGINEERS</span>
                  <span class="dash-kpi-icon">&#x1F465;</span>
                </div>
                <div class="dash-kpi-value-row">
                  <span class="dash-kpi-val" id="dashValEngineersCount">18</span>
                  <span class="dash-kpi-unit">Online</span>
                </div>
                <div class="dash-kpi-sub" id="dashSubEngineers">2 on scheduled break, 4 offline</div>
              </div>

              <div class="dash-kpi-card" id="dashKpiShift">
                <div class="dash-kpi-top">
                  <span class="dash-kpi-label">TODAY'S WORK SHIFT</span>
                  <span class="dash-kpi-icon">&#x23F1;</span>
                </div>
                <div class="dash-kpi-value-row">
                  <span class="dash-kpi-val" id="dashValShiftHours">06<span class="dash-kpi-sub-unit">h</span> 11<span class="dash-kpi-sub-unit">m</span></span>
                </div>
                <div class="dash-kpi-bar-wrap">
                  <div class="dash-kpi-bar" id="dashShiftProgressBar" style="width: 77%;"></div>
                  <span class="dash-kpi-bar-text" id="dashShiftProgressPercent">77%</span>
                </div>
              </div>

              <div class="dash-kpi-card" id="dashKpiVelocity">
                <div class="dash-kpi-top">
                  <span class="dash-kpi-label">SPRINT VELOCITY</span>
                  <span class="dash-kpi-icon">&#x26A1;</span>
                </div>
                <div class="dash-kpi-value-row">
                  <span class="dash-kpi-val" id="dashValVelocityDone">24</span>
                  <span class="dash-kpi-unit" id="dashValVelocityTotal">/ 32 Done</span>
                </div>
                <div class="dash-kpi-sub green-accent" id="dashSubVelocity">&#x2197; Ahead of schedule (+18%)</div>
              </div>

              <div class="dash-kpi-card" id="dashKpiSync">
                <div class="dash-kpi-top">
                  <span class="dash-kpi-label">STORAGE &amp; NODE SYNC</span>
                  <span class="dash-kpi-icon">&#x2601;</span>
                </div>
                <div class="dash-kpi-value-row">
                  <span class="dash-kpi-val" id="dashValSyncPercent">100%</span>
                </div>
                <div class="dash-kpi-sub" id="dashSubSync">Synchronized &bull; Snapshot 12s ago</div>
              </div>
            </div>

            <!-- 2-Column Responsive Dashboard Layout (Image 1) -->
            <div class="dash-columns-grid">
              <!-- Left Column: Priority Objectives & Activity Stream -->
              <div class="dash-col-left">
                <div class="dash-panel">
                  <div class="dash-panel-header">
                    <div class="dash-panel-title-wrap">
                      <h3 class="dash-panel-title">Priority Objectives for Today</h3>
                      <span class="dash-panel-badge" id="dashPendingObjectivesCount">3 pending actions</span>
                    </div>
                  </div>
                  <div class="dash-objectives-list" id="dashObjectivesList">
                    <!-- Dynamically populated from tasks -->
                  </div>
                </div>

                <div class="dash-panel mt-20">
                  <div class="dash-panel-header">
                    <h3 class="dash-panel-title">Recent Team Activity Stream</h3>
                    <button type="button" id="dashBtnViewFullAudit" class="dash-link-action">View full audit trail</button>
                  </div>
                  <div class="dash-activity-stream" id="dashActivityStream">
                    <!-- Dynamically populated from activity log -->
                  </div>
                </div>
              </div>

              <!-- Right Column: Active Session & Quick Tools & Security Posture -->
              <div class="dash-col-right">
                <div class="dash-panel">
                  <div class="dash-panel-header">
                    <div>
                      <span class="dash-section-eyebrow">ACTIVE SESSION</span>
                      <h3 class="dash-panel-title">Shift Status Summary</h3>
                    </div>
                    <span class="status-pill status-pill-active" id="dashShiftStatusPill">&bull; Active Duty</span>
                  </div>
                  <div class="dash-shift-summary-body">
                    <!-- Circular SVG Gauge Ring -->
                    <div class="dash-gauge-container">
                      <svg class="dash-gauge-svg" viewBox="0 0 160 160">
                        <circle class="dash-gauge-bg" cx="80" cy="80" r="64"></circle>
                        <circle class="dash-gauge-fill" id="dashGaugeCircle" cx="80" cy="80" r="64"></circle>
                      </svg>
                      <div class="dash-gauge-inner">
                        <span class="dash-gauge-value" id="dashGaugeHoursText">6.2h</span>
                        <span class="dash-gauge-label">LOGGED</span>
                      </div>
                    </div>
                    <div class="dash-shift-meta-list">
                      <div class="dash-shift-meta-item">
                        <span class="meta-label">Start Time</span>
                        <span class="meta-val" id="dashShiftStartTime">12:40 PM</span>
                      </div>
                      <div class="dash-shift-meta-item">
                        <span class="meta-label">Expected Clock-Out</span>
                        <span class="meta-val" id="dashShiftExpectedEnd">08:40 PM (01h 49m left)</span>
                      </div>
                    </div>
                    <div class="dash-shift-action-btns">
                      <button type="button" id="dashBtnBreak" class="btn-shift-action break">
                        <span>&#x2615; Take Break</span>
                      </button>
                      <button type="button" id="dashBtnClockOut" class="btn-shift-action clockout">
                        <span>&#x1F6AA; Clock Out</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div class="dash-panel mt-20">
                  <span class="dash-section-eyebrow">QUICK TOOLS &amp; WORKFLOWS</span>
                  <div class="dash-quick-tools-grid">
                    <div class="dash-quick-tool-card" id="dashToolStorage">
                      <div class="quick-tool-icon">&#x1F4BE;</div>
                      <div class="quick-tool-name">Storage Hub</div>
                      <div class="quick-tool-sub">984 GB Free</div>
                    </div>
                    <div class="dash-quick-tool-card" id="dashToolAudit">
                      <div class="quick-tool-icon">&#x1F4CB;</div>
                      <div class="quick-tool-name">Audit Logs</div>
                      <div class="quick-tool-sub">Zero Alerts</div>
                    </div>
                    <div class="dash-quick-tool-card" id="dashToolMeet">
                      <div class="quick-tool-icon">&#x1F4F9;</div>
                      <div class="quick-tool-name">Meet Channel</div>
                      <div class="quick-tool-sub">3 Eng In-Call</div>
                    </div>
                  </div>
                </div>

                <div class="dash-panel mt-20 dash-security-panel">
                  <div class="dash-security-row">
                    <span class="security-shield-icon">&#x1F6E1;</span>
                    <span class="security-title">SECURITY POSTURE</span>
                  </div>
                  <div class="dash-security-meta">
                    <span class="security-dot">&bull;</span>
                    <span>Latency: 12ms</span>
                    <span class="divider">|</span>
                    <span>Secure Handshake TLS 1.3</span>
                  </div>
                  <div class="security-policy-sub">Strict enforcement for all regional nodes.</div>
                </div>
              </div>
            </div>
          </section>`;

// Replace from <header class="command-header"> to <main class="command-body">
const startMarker = '<header class="command-header">';
const endMarker = '<main class="command-body">';
const sIdx = html.indexOf(startMarker);
const eIdx = html.indexOf(endMarker);

if (sIdx === -1 || eIdx === -1) {
  console.error('Could not find start/end markers in index.html!');
  process.exit(1);
}

html = html.slice(0, sIdx) + newHeader + html.slice(eIdx + endMarker.length);

// 2. Now let's update tabWorkersView (Team Directory & Engineering Nodes)
const workerSectionStart = '<section id="tabWorkersView" class="cmd-tab-pane">';
const workerSectionOldEnd = '<div class="workers-grid" id="workersCardsGrid">';
const wIdx = html.indexOf(workerSectionStart);
const wEndIdx = html.indexOf(workerSectionOldEnd, wIdx);

if (wIdx !== -1 && wEndIdx !== -1) {
  const newWorkersHeader = `<section id="tabWorkersView" class="cmd-tab-pane">
          <div class="personnel-header">
            <div class="personnel-badge">PERSONNEL MATRIX SYS.DIR//v3.4.1</div>
            <div class="personnel-title-row">
              <div class="personnel-titles">
                <h2 class="personnel-title">Team Directory &amp; Engineering Nodes</h2>
                <p class="personnel-sub">Engineering staff, node telemetry, role assignments, and active work directives across distributed fabric clusters.</p>
              </div>
              <div class="personnel-telemetry-row">
                <div class="telemetry-pill">
                  <span class="telemetry-label">Active Nodes</span>
                  <span class="telemetry-val" id="activeNodesCount">24 <span class="telemetry-slash">/ 24</span></span>
                </div>
                <div class="telemetry-pill">
                  <span class="telemetry-label">Avg. Ping</span>
                  <span class="telemetry-val">14 <span class="telemetry-unit">ms</span></span>
                </div>
                <button type="button" id="btnOpenCreateWorkerModal" class="btn-primary-action" title="Add Team Member">
                  <span>+ Add Team Member</span>
                </button>
              </div>
            </div>
          </div>

          <div class="workers-filter-bar">
            <div class="workers-search-wrap">
              <span class="search-icon">&#x1F50D;</span>
              <input type="text" id="searchWorkerInput" class="workers-search-input" placeholder="Search by name, role, or cluster node...">
            </div>
            <div class="workers-dept-pills" id="workersDeptPills">
              <button type="button" class="dept-pill active" data-dept="ALL">All Depts</button>
              <button type="button" class="dept-pill" data-dept="Hardware">Hardware</button>
              <button type="button" class="dept-pill" data-dept="Core Runtime">Core Runtime</button>
              <button type="button" class="dept-pill" data-dept="SecOps">SecOps</button>
              <button type="button" class="dept-pill" data-dept="Design">Design</button>
            </div>
            <div class="workers-status-select-wrap">
              <select id="workersStatusSelect" class="workers-status-select">
                <option value="ALL">Status: All (24)</option>
                <option value="ONLINE">Online</option>
                <option value="IN_FOCUS">In Focus</option>
                <option value="ON_BREAK">On Break</option>
                <option value="OFFLINE">Offline</option>
              </select>
            </div>
          </div>

          <div class="workers-grid" id="workersCardsGrid">`;
  html = html.slice(0, wIdx) + newWorkersHeader + html.slice(wEndIdx + workerSectionOldEnd.length);
}

// 3. Now let's update tabTimesheetsView (Attendance Log & Shifts)
const timesheetStart = '<section id="tabTimesheetsView" class="cmd-tab-pane">';
const timesheetOldEnd = '</section>\n\n        <!-- TAB 4: TASKS & GOALS -->';
const tIdx = html.indexOf(timesheetStart);
const tEndIdx = html.indexOf(timesheetOldEnd, tIdx);

if (tIdx !== -1 && tEndIdx !== -1) {
  const newTimesheetContent = `<section id="tabTimesheetsView" class="cmd-tab-pane">
          <div class="shift-view-header">
            <div class="shift-view-meta">
              <span class="shift-header-tag">ATTENDANCE LOG &bull; NODE-US-04 &bull; Session #4882-TK</span>
            </div>
            <div class="shift-header-sync">
              <span class="sync-dot">&bull;</span>
              <span>NTP Time Synchronized (+0.04ms)</span>
            </div>
          </div>

          <!-- Giant Attendance Hero Card (Image 2) -->
          <div class="attendance-hero-card">
            <div class="attendance-hero-top">
              <div class="attendance-active-pill" id="attendanceActivePill">
                <span class="active-pulse-dot"></span>
                <span id="attendanceActiveText">ON DUTY &bull; ACTIVE SINCE 12:40 PM IST</span>
              </div>
              <span class="attendance-tz">IST (UTC +05:30)</span>
            </div>
            <div class="attendance-hero-main">
              <div class="attendance-clock-block">
                <h1 class="attendance-huge-clock">
                  <span id="personalShiftTimer">06:11:24</span>
                  <span class="clock-unit-label">HRS ACTIVE</span>
                </h1>
                <div class="attendance-progress-meta">
                  <span>Target: 08:00:00</span>
                  <span class="dot-sep">&bull;</span>
                  <span class="text-accent" id="shiftQuotaPercentText">77.5% Completed</span>
                  <span class="dot-sep">&bull;</span>
                  <span id="shiftQuotaRemainingText">1h 48m remaining</span>
                </div>
                <div class="attendance-progress-track">
                  <div class="attendance-progress-fill" id="shiftQuotaBar" style="width: 77.5%;"></div>
                </div>
                <div class="attendance-track-markers">
                  <span>00:00:00</span>
                  <span>04:00 (Half-Shift)</span>
                  <span>08:00:00 Quota</span>
                </div>
              </div>
              <div class="attendance-actions-block">
                <button type="button" id="btnPersonalBreak" class="btn-attendance-action break" disabled title="Take Break (Key: F7)">
                  <span class="action-icon">&#x23F8;</span>
                  <span class="action-label">Take Break</span>
                  <kbd class="action-kbd">F7</kbd>
                </button>
                <button type="button" id="btnPersonalClockOut" class="btn-attendance-action clockout" disabled title="Clock Out (Key: F8)">
                  <span class="action-icon">&#x1F6AA;</span>
                  <span class="action-label">Clock Out</span>
                  <kbd class="action-kbd">F8</kbd>
                </button>
                <button type="button" id="btnPersonalClockIn" class="btn-attendance-action clockin" title="Clock In">
                  <span class="action-icon">&#x25B6;</span>
                  <span class="action-label">Clock In</span>
                </button>
              </div>
            </div>
          </div>

          <!-- 3 KPI Cards (Weekly Load, Daily Mean, Compliance) -->
          <div class="attendance-kpi-grid">
            <div class="attendance-kpi-card">
              <div class="att-kpi-top">
                <span class="att-kpi-label">WEEKLY LOAD</span>
                <span class="att-kpi-icon">&#x23F1;</span>
              </div>
              <div class="att-kpi-val-row">
                <span class="att-kpi-val" id="weeklyLoadHours">34.5</span>
                <span class="att-kpi-unit">hrs</span>
              </div>
              <div class="att-kpi-bar-wrap">
                <div class="att-kpi-bar" id="weeklyLoadBar" style="width: 86.2%;"></div>
                <span class="att-kpi-target">Target: 40.0 hrs &bull; 86.2%</span>
              </div>
              <div class="att-kpi-sub text-green">&#x2197; Paced to fulfill weekly quota by Fri 17:00</div>
            </div>

            <div class="attendance-kpi-card">
              <div class="att-kpi-top">
                <span class="att-kpi-label">DAILY MEAN WORK</span>
                <span class="att-kpi-icon">&#x1F4CA;</span>
              </div>
              <div class="att-kpi-val-row">
                <span class="att-kpi-val" id="dailyMeanHours">7.2</span>
                <span class="att-kpi-unit">hrs</span>
              </div>
              <!-- 7-day mini bar chart -->
              <div class="att-mini-chart" id="dailyMeanChart">
                <div class="att-chart-col"><div class="att-chart-bar" style="height: 45%;"></div><span>M</span></div>
                <div class="att-chart-col"><div class="att-chart-bar" style="height: 60%;"></div><span>T</span></div>
                <div class="att-chart-col"><div class="att-chart-bar" style="height: 55%;"></div><span>W</span></div>
                <div class="att-chart-col"><div class="att-chart-bar" style="height: 35%;"></div><span>T</span></div>
                <div class="att-chart-col active"><div class="att-chart-bar" style="height: 85%;"></div><span>F</span></div>
                <div class="att-chart-col"><div class="att-chart-bar" style="height: 10%;"></div><span>S</span></div>
                <div class="att-chart-col"><div class="att-chart-bar" style="height: 10%;"></div><span>S</span></div>
              </div>
            </div>

            <div class="attendance-kpi-card">
              <div class="att-kpi-top">
                <span class="att-kpi-label">COMPLIANCE RATING</span>
                <span class="att-kpi-icon">&#x2705;</span>
              </div>
              <div class="att-kpi-val-row">
                <span class="att-kpi-val">100%</span>
              </div>
              <div class="att-kpi-sub text-green">&bull; On-Time Arrival: 5/5 shifts</div>
              <div class="att-kpi-sub" style="margin-top: 6px;">&#x1F512; Cryptographically Signed Ledger (SHA-256)</div>
            </div>
          </div>

          <!-- Shift Punch Log & Audit Ledger -->
          <div class="punch-log-section">
            <div class="punch-log-header-row">
              <div>
                <h4 class="section-title">Shift Punch Log &amp; Audit Ledger</h4>
                <p class="section-sub">Direct hardware timestamps logged via local workstation agent</p>
              </div>
              <div class="punch-log-actions">
                <div id="punchFilterWrap" class="hidden">
                  <select id="punchLogMemberFilter" class="custom-select"></select>
                </div>
                <button type="button" id="btnDownloadCsvAudit" class="btn-secondary-action">
                  <span>&#x2B07;&#xFE0F; Download CSV Audit</span>
                </button>
              </div>
            </div>
            <div class="punch-table-wrap">
              <table class="punch-table">
                <thead>
                  <tr>
                    <th>DATE &bull; DAY</th>
                    <th>PUNCH IN</th>
                    <th>PUNCH OUT</th>
                    <th>DURATION</th>
                    <th>TERMINAL NODE</th>
                    <th>VERIFICATION STATUS</th>
                  </tr>
                </thead>
                <tbody id="punchLogTableBody"></tbody>
              </table>
            </div>
          </div>

          <!-- Hidden Team Hours Grid for Data Binding -->
          <div class="team-hours-grid hidden" id="teamHoursGrid"></div>
          <span class="hidden" id="personalShiftBadge"></span>
        </section>`;
  html = html.slice(0, tIdx) + newTimesheetContent + html.slice(tEndIdx);
}

// 4. Update tabTasksView with Sprint 14 Banner and Drawer (Image 4)
const tasksStart = '<section id="tabTasksView" class="cmd-tab-pane">';
const tasksOldEnd = '</section>\n\n        <!-- TAB 5: MICROSOFT TEAMS SUITE -->';
const tsIdx = html.indexOf(tasksStart);
const tsEndIdx = html.indexOf(tasksOldEnd, tsIdx);

if (tsIdx !== -1 && tsEndIdx !== -1) {
  const newTasksContent = `<section id="tabTasksView" class="cmd-tab-pane">
          <div class="sprint-header">
            <div class="sprint-header-top">
              <span class="sprint-tag">WORKSTREAM // SPRINT 14</span>
              <span class="sprint-sync-pill"><span class="pulse-green"></span> System Sync Active</span>
            </div>
            <div class="sprint-title-row">
              <div class="sprint-titles">
                <h2 class="sprint-title">Tasks &amp; Sprint Management</h2>
                <p class="sprint-sub">Manage ongoing sprints, verify deliverables, and orchestrate work pipelines across autonomous cluster nodes.</p>
              </div>
              <div class="sprint-view-controls">
                <div class="view-mode-toggle">
                  <button type="button" class="view-mode-btn active" id="btnTaskViewList">&#x1F15C; List</button>
                  <button type="button" class="view-mode-btn" id="btnTaskViewBoard">&#x229E; Board</button>
                </div>
                <button type="button" id="btnOpenCreateTaskModal" class="btn-primary-action">
                  <span>+ Add Task</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Sprint 14 Execution Cycle Banner (Image 4) -->
          <div class="sprint-cycle-banner">
            <div class="sprint-cycle-left">
              <div class="sprint-cycle-icon">&#x1F680;</div>
              <div class="sprint-cycle-info">
                <div class="sprint-cycle-name-row">
                  <span class="sprint-cycle-name">Sprint 14 Execution Cycle</span>
                  <span class="sprint-phase-pill">PHASE 3 RUNNING</span>
                </div>
                <div class="sprint-cycle-date">Oct 20 &ndash; Nov 03, 2026 &bull; 4 days remaining</div>
                <div class="sprint-cycle-bar-wrap">
                  <div class="sprint-cycle-bar" id="sprintExecutionProgressBar" style="width: 78%;"></div>
                </div>
              </div>
            </div>
            <div class="sprint-cycle-stats">
              <div class="sprint-stat-item">
                <span class="sprint-stat-label">TOTAL TASKS</span>
                <span class="sprint-stat-val" id="sprintTotalTasks">28</span>
              </div>
              <div class="sprint-stat-item">
                <span class="sprint-stat-label">COMPLETED</span>
                <span class="sprint-stat-val text-green" id="sprintCompletedTasks">22</span>
              </div>
              <div class="sprint-stat-item">
                <span class="sprint-stat-label">ACTIVE LOAD</span>
                <span class="sprint-stat-val text-blue" id="sprintActiveLoad">6</span>
              </div>
              <div class="sprint-stat-item">
                <span class="sprint-stat-label">VELOCITY SCORE</span>
                <span class="sprint-stat-val" id="sprintVelocityScore">78%</span>
              </div>
            </div>
          </div>

          <!-- Filter Toolbar (Image 4) -->
          <div class="tasks-filter-bar">
            <div class="tasks-search-wrap">
              <span class="search-icon">&#x1F50D;</span>
              <input type="text" id="filterTaskInput" class="tasks-search-input" placeholder="Filter by title, node, or engineer...">
            </div>
            <div class="tasks-dropdown-group">
              <div class="tasks-filter-select-wrap">
                <label>Category:</label>
                <select id="taskFilterCategorySelect" class="tasks-filter-select">
                  <option value="ALL">All Modules</option>
                  <option value="FIRMWARE">Firmware</option>
                  <option value="UI ARCHITECTURE">UI Architecture</option>
                  <option value="CORE ARCHITECTURE">Core Architecture</option>
                  <option value="CLOUD SYNC">Cloud Sync</option>
                  <option value="STORAGE & NVME">Storage &amp; NVMe</option>
                </select>
              </div>
              <div class="tasks-filter-select-wrap">
                <label>Assignee:</label>
                <select id="taskFilterAssigneeSelect" class="tasks-filter-select">
                  <option value="ALL">All Members</option>
                </select>
              </div>
              <div class="tasks-filter-select-wrap">
                <label>Priority:</label>
                <select id="taskFilterPrioritySelect" class="tasks-filter-select">
                  <option value="ALL">High to Low</option>
                  <option value="URGENT">Urgent Priority</option>
                  <option value="HIGH">High Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="NORMAL">Normal</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Main Tasks Deck: In Progress + Completed Lists + Slide-Out Drawer -->
          <div class="tasks-main-deck-wrapper">
            <div class="tasks-deck-scroll-area">
              <!-- IN PROGRESS SECTION -->
              <div class="tasks-section-block">
                <div class="tasks-section-header-row">
                  <div class="section-title-dot-wrap">
                    <span class="section-indicator-dot blue-dot"></span>
                    <span class="tasks-section-title">IN PROGRESS</span>
                    <span class="tasks-section-count-badge" id="tasksInProgressCount">3</span>
                  </div>
                  <button type="button" class="btn-sort-tasks">
                    <span>&#x21C5; Sort by Due Date</span>
                  </button>
                </div>
                <div class="task-cards-list" id="taskCardsList">
                  <!-- Dynamically populated from Database -->
                </div>
              </div>

              <!-- COMPLETED THIS WEEK SECTION -->
              <div class="tasks-section-block mt-24">
                <div class="tasks-section-header-row">
                  <div class="section-title-dot-wrap">
                    <span class="section-indicator-dot green-dot"></span>
                    <span class="tasks-section-title">COMPLETED THIS WEEK</span>
                    <span class="tasks-section-count-badge green-badge" id="tasksCompletedCount">5 Total</span>
                  </div>
                  <button type="button" class="btn-archive-review">Archive Review &rsaquo;</button>
                </div>
                <div class="completed-tasks-list" id="completedTasksList">
                  <!-- Dynamically populated completed tasks -->
                </div>
              </div>
            </div>

            <!-- Slide-Out Task Detail Drawer (Image 4) -->
            <aside class="task-detail-drawer" id="taskDetailDrawer">
              <div class="task-drawer-header">
                <div class="drawer-code-row">
                  <span class="drawer-task-code" id="drawerTaskCode">TASK-4892 &bull; Sprint 14 Node</span>
                  <div class="drawer-window-tools">
                    <button type="button" class="btn-drawer-tool" id="btnDrawerExpand" title="Open Full View">&#x2197;</button>
                    <button type="button" class="btn-drawer-tool" id="btnDrawerClose" title="Close Drawer">&times;</button>
                  </div>
                </div>
                <h2 class="drawer-task-title" id="drawerTaskTitle">Industrial UI Architecture Design</h2>
              </div>

              <div class="task-drawer-body">
                <div class="drawer-meta-table">
                  <div class="drawer-meta-row">
                    <span class="drawer-meta-label">Branch Pipeline:</span>
                    <span class="drawer-meta-val link-val" id="drawerBranchPipeline">&#x2442; feat/carbon-v4</span>
                  </div>
                  <div class="drawer-meta-row">
                    <span class="drawer-meta-label">Lead Engineer:</span>
                    <span class="drawer-meta-val" id="drawerLeadEngineer">Jagadish K (Founder)</span>
                  </div>
                  <div class="drawer-meta-row">
                    <span class="drawer-meta-label">Sprint Timeline:</span>
                    <span class="drawer-meta-val text-red" id="drawerSprintTimeline">&bull; Due Today, 17:00</span>
                  </div>
                </div>

                <div class="drawer-section mt-16">
                  <span class="drawer-section-heading">SCOPE &amp; OBJECTIVE</span>
                  <p class="drawer-scope-text" id="drawerScopeText">
                    Refine the high-density workstation UI. Replace bulky UI matrices with clean micro-cards, zero decorative clutter, and absolute typographic rhythm aligned strictly with IBM Carbon principles.
                  </p>
                </div>

                <div class="drawer-section mt-16">
                  <div class="drawer-subtasks-head">
                    <span class="drawer-section-heading">SUBTASKS (<span id="drawerSubtasksDoneText">3/4 DONE</span>)</span>
                    <span class="drawer-subtasks-percent" id="drawerSubtasksPercentText">75% Complete</span>
                  </div>
                  <div class="drawer-subtasks-checklist" id="drawerSubtasksChecklist">
                    <!-- Interactive checkboxes rendered dynamically -->
                  </div>
                </div>

                <div class="drawer-section mt-16">
                  <span class="drawer-section-heading">DELIVERABLE PROTOTYPE</span>
                  <div class="drawer-prototype-card" id="drawerPrototypePreview">
                    <img id="drawerPrototypeImg" src="assets/id-card.png" alt="Prototype preview" onerror="this.style.display='none';">
                    <div class="prototype-overlay-tag" id="drawerPrototypeFilename">carbon-v4-spec-draft.fig</div>
                  </div>
                </div>

                <div class="drawer-actions-block mt-20">
                  <button type="button" id="btnDrawerMarkComplete" class="btn-drawer-action primary">
                    <span>&#x2714; Mark Task Complete</span>
                  </button>
                  <div class="drawer-secondary-actions">
                    <button type="button" id="btnDrawerReassign" class="btn-drawer-action secondary">
                      <span>&#x1F464; Reassign</span>
                    </button>
                    <button type="button" id="btnDrawerReschedule" class="btn-drawer-action secondary">
                      <span>&#x23F0; Reschedule</span>
                    </button>
                  </div>
                </div>
              </div>
            </aside>
          </div>

          <!-- Hidden Form Element to Preserve Form Handler Bindings -->
          <form id="formCreateTask" class="hidden">
            <input type="text" id="taskTitleInput">
            <select id="taskAssigneeSelect"></select>
            <select id="taskPrioritySelect"></select>
            <input type="date" id="taskDateInput">
            <input type="text" id="taskDeadlineInput">
            <textarea id="taskDescInput"></textarea>
          </form>
          <div class="hidden" id="taskFilterGroup"></div>
          <span class="hidden" id="tasksTotalBadge"></span>
        </section>`;
  html = html.slice(0, tsIdx) + newTasksContent + html.slice(tsEndIdx);
}

// 5. Close workstation-body-layout and add workstation-system-footer
const mainCloseMarker = '</main>\n    </div>\n  </div>';
const mcIdx = html.indexOf(mainCloseMarker);

if (mcIdx !== -1) {
  const newFooter = `</main>
      </div>

      <!-- WORKSTATION SYSTEM STATUS FOOTER (Images 1-4) -->
      <footer class="workstation-system-footer">
        <div class="footer-left">
          <span class="footer-engine-tag">REDDOT Engine v3.0.1</span>
          <span class="footer-divider">|</span>
          <span class="footer-instance-tag">Instance: node-04a</span>
        </div>
        <div class="footer-right">
          <span class="latency-dot">&bull;</span>
          <span class="footer-latency-tag">Latency: 12ms</span>
          <span class="footer-divider">|</span>
          <span class="footer-security-tag">Secure Handshake TLS 1.3</span>
        </div>
      </footer>
    </div>
  </div>`;
  html = html.slice(0, mcIdx) + newFooter + html.slice(mcIdx + mainCloseMarker.length);
}

// 6. Add Universal Omnibox Search Modal before </body>
const bodyCloseMarker = '</body>';
const bcIdx = html.lastIndexOf(bodyCloseMarker);

if (bcIdx !== -1) {
  const omniboxModal = `  <!-- UNIVERSAL OMNIBOX QUICK-SEARCH MODAL (Ctrl+K) -->
  <div id="globalOmniboxModal" class="omnibox-modal-overlay hidden">
    <div class="omnibox-modal-backdrop" id="omniboxModalBackdrop"></div>
    <div class="omnibox-modal-card">
      <div class="omnibox-modal-search">
        <span class="omnibox-modal-icon">&#x1F50D;</span>
        <input type="text" id="omniboxModalInput" class="omnibox-modal-input" placeholder="Type a command, search tasks, members, or channels... (Esc to close)" autocomplete="off">
        <kbd class="omnibox-modal-esc" id="btnOmniboxClose">ESC</kbd>
      </div>
      <div class="omnibox-results-list" id="omniboxResultsList">
        <!-- Dynamically rendered search results -->
      </div>
      <div class="omnibox-footer-shortcuts">
        <span><kbd>&uarr;</kbd> <kbd>&darr;</kbd> Navigate</span>
        <span><kbd>&crarr;</kbd> Select</span>
        <span><kbd>Esc</kbd> Close</span>
      </div>
    </div>
  </div>\n\n`;
  html = html.slice(0, bcIdx) + omniboxModal + html.slice(bcIdx);
}

fs.writeFileSync(indexPath, html, 'utf8');
console.log('✅ Successfully updated index.html with REDDOT Workstation v3.0 UI layout!');
