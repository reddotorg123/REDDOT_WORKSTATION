const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'wallpaper-ui', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// Check CRLF
const isCrlf = html.includes('\r\n');
console.log('File uses CRLF:', isCrlf);

// 1. Check timesheets section
const timesheetStart = '<section id="tabTimesheetsView" class="cmd-tab-pane">';
const tab4Comment = '<!-- TAB 4: TASKS & GOALS -->';
const tStartIdx = html.indexOf(timesheetStart);
const tab4Idx = html.indexOf(tab4Comment);

console.log('tabTimesheetsView found at:', tStartIdx);
console.log('tab4Comment found at:', tab4Idx);

if (tStartIdx !== -1 && tab4Idx !== -1) {
  // find the </section> right before tab4Comment
  const tEndIdx = html.lastIndexOf('</section>', tab4Idx) + '</section>'.length;
  console.log('Timesheets end at:', tEndIdx);

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

  html = html.slice(0, tStartIdx) + newTimesheetContent + html.slice(tEndIdx);
  console.log('Replaced tabTimesheetsView successfully!');
}

// 2. Tasks & Goals Section
const tasksStart = '<section id="tabTasksView" class="cmd-tab-pane">';
const tab5Comment = '<!-- TAB 5: MICROSOFT TEAMS SUITE -->';
const tsStartIdx = html.indexOf(tasksStart);
const tab5Idx = html.indexOf(tab5Comment);

console.log('tabTasksView found at:', tsStartIdx);
console.log('tab5Comment found at:', tab5Idx);

if (tsStartIdx !== -1 && tab5Idx !== -1) {
  const tsEndIdx = html.lastIndexOf('</section>', tab5Idx) + '</section>'.length;
  console.log('Tasks section end at:', tsEndIdx);

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

  html = html.slice(0, tsStartIdx) + newTasksContent + html.slice(tsEndIdx);
  console.log('Replaced tabTasksView successfully!');
}

// 3. Workstation System Footer
if (!html.includes('class="workstation-system-footer"')) {
  // Find where main.command-body ends before the modals
  const mainEndRegex = /<\/main>\s*<\/div>\s*<\/div>/i;
  const match = html.match(mainEndRegex);
  if (match) {
    const footerHtml = `</main>
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
    html = html.replace(mainEndRegex, footerHtml);
    console.log('Added workstation-system-footer successfully!');
  } else {
    console.warn('Could not match main closing structure for footer!');
  }
}

// 4. Check Omnibox modal
if (!html.includes('id="globalOmniboxModal"')) {
  const bodyClose = '</body>';
  const bcIdx = html.lastIndexOf(bodyClose);
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
    console.log('Added globalOmniboxModal successfully!');
  }
}

fs.writeFileSync(indexPath, html, 'utf8');
console.log('✅ Finished updating index.html');
