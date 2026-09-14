/**
 * Automated Verification of REDDOT Workstation v3.0 UI/UX Suite
 */
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'wallpaper-ui', 'index.html'), 'utf8');
const js = fs.readFileSync(path.join(__dirname, '..', 'wallpaper-ui', 'wallpaper.js'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '..', 'wallpaper-ui', 'style.css'), 'utf8');

console.log('🧪 Running Comprehensive UI/UX Verification Suite...\n');

let failed = 0;
function assert(name, condition) {
  if (condition) {
    console.log(`✅ PASS: ${name}`);
  } else {
    console.error(`❌ FAIL: ${name}`);
    failed++;
  }
}

// 1. App Shell & Navigation Rail
assert('index.html contains #tabDashboardView', html.includes('id="tabDashboardView"'));
assert('index.html contains #workstationSidebar', html.includes('id="workstationSidebar"'));
assert('index.html contains #btnThemeToggle', html.includes('id="btnThemeToggle"'));
assert('index.html contains #globalOmniboxModal', html.includes('id="globalOmniboxModal"'));
assert('index.html contains #sidebarCpuPercent', html.includes('id="sidebarCpuPercent"'));
assert('index.html contains workstation-system-footer', html.includes('class="workstation-system-footer"'));

// 2. Dashboard Components (Image 1)
assert('index.html contains #dashGreeting', html.includes('id="dashGreeting"'));
assert('index.html contains #dashValEngineersCount', html.includes('id="dashValEngineersCount"'));
assert('index.html contains #dashValShiftHours', html.includes('id="dashValShiftHours"'));
assert('index.html contains #dashShiftProgressBar', html.includes('id="dashShiftProgressBar"'));
assert('index.html contains #dashValVelocityDone', html.includes('id="dashValVelocityDone"'));
assert('index.html contains #dashObjectivesList', html.includes('id="dashObjectivesList"'));
assert('index.html contains #dashActivityStream', html.includes('id="dashActivityStream"'));
assert('index.html contains #dashGaugeCircle', html.includes('id="dashGaugeCircle"'));
assert('index.html contains #dashGaugeHoursText', html.includes('id="dashGaugeHoursText"'));
assert('index.html contains #dashShiftStatusPill', html.includes('id="dashShiftStatusPill"'));
assert('index.html contains #dashToolStorage', html.includes('id="dashToolStorage"'));
assert('index.html contains #dashToolAudit', html.includes('id="dashToolAudit"'));
assert('index.html contains #dashToolMeet', html.includes('id="dashToolMeet"'));

// 3. Time & Shifts (Image 2)
assert('index.html contains #attendanceActivePill', html.includes('id="attendanceActivePill"'));
assert('index.html contains #attendanceActiveText', html.includes('id="attendanceActiveText"'));
assert('index.html contains #personalShiftTimer', html.includes('id="personalShiftTimer"'));
assert('index.html contains #shiftQuotaBar', html.includes('id="shiftQuotaBar"'));
assert('index.html contains #shiftQuotaPercentText', html.includes('id="shiftQuotaPercentText"'));
assert('index.html contains #shiftQuotaRemainingText', html.includes('id="shiftQuotaRemainingText"'));
assert('index.html contains #btnDownloadCsvAudit', html.includes('id="btnDownloadCsvAudit"'));
assert('index.html contains #dailyMeanChart', html.includes('id="dailyMeanChart"'));

// 4. Team Directory (Image 3)
assert('index.html contains #activeNodesCount', html.includes('id="activeNodesCount"'));
assert('index.html contains #searchWorkerInput', html.includes('id="searchWorkerInput"'));
assert('index.html contains #workersDeptPills', html.includes('id="workersDeptPills"'));
assert('index.html contains #workersCardsGrid', html.includes('id="workersCardsGrid"'));

// 5. Tasks & Sprint Management (Image 4)
assert('index.html contains #sprintTotalTasks', html.includes('id="sprintTotalTasks"'));
assert('index.html contains #sprintCompletedTasks', html.includes('id="sprintCompletedTasks"'));
assert('index.html contains #sprintActiveLoad', html.includes('id="sprintActiveLoad"'));
assert('index.html contains #sprintVelocityScore', html.includes('id="sprintVelocityScore"'));
assert('index.html contains #taskDetailDrawer', html.includes('id="taskDetailDrawer"'));
assert('index.html contains #drawerTaskTitle', html.includes('id="drawerTaskTitle"'));
assert('index.html contains #drawerSubtasksChecklist', html.includes('id="drawerSubtasksChecklist"'));
assert('index.html contains #btnDrawerMarkComplete', html.includes('id="btnDrawerMarkComplete"'));

// 6. JavaScript Logic & Bindings
assert('wallpaper.js implements renderDashboard()', js.includes('function renderDashboard()'));
assert('wallpaper.js implements openTaskDrawer()', js.includes('function openTaskDrawer('));
assert('wallpaper.js implements initThemeEngine()', js.includes('function initThemeEngine()'));
assert('wallpaper.js implements initOmniboxSearch()', js.includes('function initOmniboxSearch()'));
assert('wallpaper.js implements exportAttendanceCsv()', js.includes('function exportAttendanceCsv()'));
assert('wallpaper.js binds dashboard in switchTab', js.includes("if (tabId === 'dashboard') renderDashboard();"));
assert('wallpaper.js binds F7/F8 keyboard shortcuts', js.includes("e.key === 'F7'") && js.includes("e.key === 'F8'"));

// 7. Dual Theme CSS Design Tokens
assert('style.css has light theme tokens', css.includes('--shell-bg: #f4f6f9;'));
assert('style.css has dark theme tokens', css.includes('--shell-bg: #0a0b10;'));
assert('style.css styles .dash-kpi-grid', css.includes('.dash-kpi-grid'));
assert('style.css styles .dash-gauge-fill', css.includes('.dash-gauge-fill'));
assert('style.css styles .task-detail-drawer', css.includes('.task-detail-drawer'));
assert('style.css styles .node-member-card', css.includes('.node-member-card'));
assert('style.css styles .omnibox-modal-overlay', css.includes('.omnibox-modal-overlay'));

console.log(`\nResults: ${failed === 0 ? 'ALL CHECKS PASSED 🎉' : `${failed} CHECKS FAILED ❌`}`);
if (failed > 0) process.exit(1);
