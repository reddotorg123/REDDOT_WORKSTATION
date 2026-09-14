const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'wallpaper-ui', 'index.html');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Drawer collapsed
content = content.replace(
  '<div id="commandCenterDrawer" class="command-center-overlay">',
  '<div id="commandCenterDrawer" class="command-center-overlay collapsed">'
);

// 2. Notifications
content = content.replace(
  '<span class="bell-badge" id="headerNotifBadge">3</span>',
  '<span class="bell-badge" id="headerNotifBadge" style="display:none;">0</span>'
);
content = content.replace(
  '<span>SYSTEM NOTIFICATIONS (3)</span>',
  '<span>SYSTEM NOTIFICATIONS (0)</span>'
);
content = content.replace(
  /<div class="notif-list">[\s\S]*?<\/div>\s*<\/div>/,
  '<div class="notif-list">\n              <!-- Dynamically populated from genuine system and task events -->\n            </div>\n          </div>'
);

// 3. Dashboard KPI Cards
content = content.replace(
  '<span class="dash-kpi-val" id="dashValEngineersCount">18</span>',
  '<span class="dash-kpi-val" id="dashValEngineersCount">1</span>'
);
content = content.replace(
  '<div class="dash-kpi-sub" id="dashSubEngineers">2 on scheduled break, 4 offline</div>',
  '<div class="dash-kpi-sub" id="dashSubEngineers">0 on scheduled break, 0 offline</div>'
);
content = content.replace(
  '<span class="dash-kpi-val" id="dashValShiftHours">06<span class="dash-kpi-sub-unit">h</span> 11<span class="dash-kpi-sub-unit">m</span></span>',
  '<span class="dash-kpi-val" id="dashValShiftHours">00<span class="dash-kpi-sub-unit">h</span> 00<span class="dash-kpi-sub-unit">m</span></span>'
);
content = content.replace(
  '<div class="dash-kpi-bar" id="dashShiftProgressBar" style="width: 77%;"></div>',
  '<div class="dash-kpi-bar" id="dashShiftProgressBar" style="width: 0%;"></div>'
);
content = content.replace(
  '<span class="dash-kpi-bar-text" id="dashShiftProgressPercent">77%</span>',
  '<span class="dash-kpi-bar-text" id="dashShiftProgressPercent">0%</span>'
);
content = content.replace(
  '<span class="dash-kpi-val" id="dashValVelocityDone">24</span>',
  '<span class="dash-kpi-val" id="dashValVelocityDone">0</span>'
);
content = content.replace(
  '<span class="dash-kpi-unit" id="dashValVelocityTotal">/ 32 Done</span>',
  '<span class="dash-kpi-unit" id="dashValVelocityTotal">/ 0 Done</span>'
);
content = content.replace(
  '<div class="dash-kpi-sub green-accent" id="dashSubVelocity">&#x2197; Ahead of schedule (+18%)</div>',
  '<div class="dash-kpi-sub" id="dashSubVelocity">No active sprint deliverables</div>'
);
content = content.replace(
  '<div class="dash-kpi-sub" id="dashSubSync">Synchronized &bull; Snapshot 12s ago</div>',
  '<div class="dash-kpi-sub" id="dashSubSync">Synchronized &bull; Local Storage Active</div>'
);
content = content.replace(
  '<span class="dash-panel-badge" id="dashPendingObjectivesCount">3 pending actions</span>',
  '<span class="dash-panel-badge" id="dashPendingObjectivesCount">0 pending actions</span>'
);

// 4. Shift Summary (Right Column)
content = content.replace(
  '<span class="dash-gauge-value" id="dashGaugeHoursText">6.2h</span>',
  '<span class="dash-gauge-value" id="dashGaugeHoursText">0.0h</span>'
);
content = content.replace(
  '<span class="meta-val" id="dashShiftStartTime">12:40 PM</span>',
  '<span class="meta-val" id="dashShiftStartTime">--</span>'
);
content = content.replace(
  '<span class="meta-val" id="dashShiftExpectedEnd">08:40 PM (01h 49m left)</span>',
  '<span class="meta-val" id="dashShiftExpectedEnd">Standby</span>'
);
content = content.replace(
  '<span class="status-pill status-pill-active" id="dashShiftStatusPill">&bull; Active Duty</span>',
  '<span class="status-pill" id="dashShiftStatusPill">&bull; Standby</span>'
);
content = content.replace(
  '<div class="quick-tool-sub">3 Eng In-Call</div>',
  '<div class="quick-tool-sub">Instant Video Sync</div>'
);

// 5. Personnel Tab
content = content.replace(
  '<span class="telemetry-val" id="activeNodesCount">24 <span class="telemetry-slash">/ 24</span></span>',
  '<span class="telemetry-val" id="activeNodesCount">1 <span class="telemetry-slash">/ 1</span></span>'
);
content = content.replace(
  '<option value="ALL">Status: All (24)</option>',
  '<option value="ALL">Status: All</option>'
);

// 6. Attendance Tab
content = content.replace(
  '<span id="attendanceActiveText">ON DUTY &bull; ACTIVE SINCE 12:40 PM IST</span>',
  '<span id="attendanceActiveText">DUTY OFF &bull; WORKSTATION STANDBY</span>'
);
content = content.replace(
  '<span id="personalShiftTimer">06:11:24</span>',
  '<span id="personalShiftTimer">00:00:00</span>'
);
content = content.replace(
  '<span class="text-accent" id="shiftQuotaPercentText">77.5% Completed</span>',
  '<span class="text-accent" id="shiftQuotaPercentText">0% Completed</span>'
);
content = content.replace(
  '<span id="shiftQuotaRemainingText">1h 48m remaining</span>',
  '<span id="shiftQuotaRemainingText">8h 00m remaining</span>'
);
content = content.replace(
  '<div class="attendance-progress-fill" id="shiftQuotaBar" style="width: 77.5%;"></div>',
  '<div class="attendance-progress-fill" id="shiftQuotaBar" style="width: 0%;"></div>'
);
content = content.replace(
  '<span class="att-kpi-val" id="weeklyLoadHours">34.5</span>',
  '<span class="att-kpi-val" id="weeklyLoadHours">0.0</span>'
);
content = content.replace(
  '<div class="att-kpi-bar" id="weeklyLoadBar" style="width: 86.2%;"></div>',
  '<div class="att-kpi-bar" id="weeklyLoadBar" style="width: 0%;"></div>'
);
content = content.replace(
  '<span class="att-kpi-target">Target: 40.0 hrs &bull; 86.2%</span>',
  '<span class="att-kpi-target" id="weeklyLoadTargetText">Target: 40.0 hrs &bull; 0%</span>'
);
content = content.replace(
  '<div class="att-kpi-sub text-green">&#x2197; Paced to fulfill weekly quota by Fri 17:00</div>',
  '<div class="att-kpi-sub" id="weeklyLoadSubText">Paced to fulfill weekly quota</div>'
);
content = content.replace(
  '<span class="att-kpi-val" id="dailyMeanHours">7.2</span>',
  '<span class="att-kpi-val" id="dailyMeanHours">0.0</span>'
);

// 7. Tasks Tab
content = content.replace(
  '<div class="sprint-cycle-bar" id="sprintExecutionProgressBar" style="width: 78%;"></div>',
  '<div class="sprint-cycle-bar" id="sprintExecutionProgressBar" style="width: 0%;"></div>'
);
content = content.replace(
  '<span class="sprint-stat-val" id="sprintTotalTasks">28</span>',
  '<span class="sprint-stat-val" id="sprintTotalTasks">0</span>'
);
content = content.replace(
  '<span class="sprint-stat-val text-green" id="sprintCompletedTasks">22</span>',
  '<span class="sprint-stat-val text-green" id="sprintCompletedTasks">0</span>'
);
content = content.replace(
  '<span class="sprint-stat-val text-blue" id="sprintActiveLoad">6</span>',
  '<span class="sprint-stat-val text-blue" id="sprintActiveLoad">0</span>'
);
content = content.replace(
  '<span class="sprint-stat-val" id="sprintVelocityScore">78%</span>',
  '<span class="sprint-stat-val" id="sprintVelocityScore">0%</span>'
);
content = content.replace(
  '<span class="tasks-section-count-badge" id="tasksInProgressCount">3</span>',
  '<span class="tasks-section-count-badge" id="tasksInProgressCount">0</span>'
);
content = content.replace(
  '<span class="tasks-section-count-badge green-badge" id="tasksCompletedCount">5 Total</span>',
  '<span class="tasks-section-count-badge green-badge" id="tasksCompletedCount">0 Total</span>'
);

// 8. Task Drawer
content = content.replace(
  '<span class="drawer-task-code" id="drawerTaskCode">TASK-4892 &bull; Sprint 14 Node</span>',
  '<span class="drawer-task-code" id="drawerTaskCode">TASK-DETAILS &bull; Sprint Node</span>'
);
content = content.replace(
  '<h2 class="drawer-task-title" id="drawerTaskTitle">Industrial UI Architecture Design</h2>',
  '<h2 class="drawer-task-title" id="drawerTaskTitle">Select a Task</h2>'
);
content = content.replace(
  '<span class="drawer-meta-val link-val" id="drawerBranchPipeline">&#x2442; feat/carbon-v4</span>',
  '<span class="drawer-meta-val link-val" id="drawerBranchPipeline">&#x2442; --</span>'
);
content = content.replace(
  '<span class="drawer-meta-val" id="drawerLeadEngineer">Jagadish K (Founder)</span>',
  '<span class="drawer-meta-val" id="drawerLeadEngineer">--</span>'
);
content = content.replace(
  '<span class="drawer-meta-val text-red" id="drawerSprintTimeline">&bull; Due Today, 17:00</span>',
  '<span class="drawer-meta-val" id="drawerSprintTimeline">&bull; --</span>'
);
content = content.replace(
  /<p class="drawer-scope-text" id="drawerScopeText">[\s\S]*?<\/p>/,
  '<p class="drawer-scope-text" id="drawerScopeText">Select a task from the sprint list to review its scope, requirements, and deliverables.</p>'
);
content = content.replace(
  '<span id="drawerSubtasksDoneText">3/4 DONE</span>',
  '<span id="drawerSubtasksDoneText">0/0 DONE</span>'
);
content = content.replace(
  '<span class="drawer-subtasks-percent" id="drawerSubtasksPercentText">75% Complete</span>',
  '<span class="drawer-subtasks-percent" id="drawerSubtasksPercentText">0% Complete</span>'
);
content = content.replace(
  '<div class="prototype-overlay-tag" id="drawerPrototypeFilename">carbon-v4-spec-draft.fig</div>',
  '<div class="prototype-overlay-tag" id="drawerPrototypeFilename" style="display:none;">deliverable.pdf</div>'
);

// 9. Tasks deck ID & Kanban deck if needed
if (!content.includes('id="tasksListDeck"')) {
  content = content.replace('<div class="tasks-main-deck-wrapper">', '<div class="tasks-main-deck-wrapper" id="tasksListDeck">');
}

const kanbanDeckHtml = `
          <!-- Kanban Board View Deck -->
          <div class="tasks-board-grid hidden" id="tasksBoardDeck">
            <!-- 3 Kanban Columns: To Do, In Progress, Completed -->
            <div class="kanban-col" id="kanbanColTodo">
              <div class="kanban-col-head">
                <div class="kanban-col-title-wrap">
                  <span class="section-indicator-dot" style="background:#f59e0b; width:8px; height:8px; border-radius:50%;"></span>
                  <span>TO DO / ASSIGNED</span>
                </div>
                <span class="kanban-col-count" id="kanbanTodoCount">0</span>
              </div>
              <div class="kanban-cards-container" id="kanbanCardsTodo"></div>
            </div>

            <div class="kanban-col" id="kanbanColInProgress">
              <div class="kanban-col-head">
                <div class="kanban-col-title-wrap">
                  <span class="section-indicator-dot blue-dot"></span>
                  <span>IN PROGRESS</span>
                </div>
                <span class="kanban-col-count" id="kanbanInProgressCount">0</span>
              </div>
              <div class="kanban-cards-container" id="kanbanCardsInProgress"></div>
            </div>

            <div class="kanban-col" id="kanbanColCompleted">
              <div class="kanban-col-head">
                <div class="kanban-col-title-wrap">
                  <span class="section-indicator-dot green-dot"></span>
                  <span>COMPLETED</span>
                </div>
                <span class="kanban-col-count" id="kanbanCompletedCount">0</span>
              </div>
              <div class="kanban-cards-container" id="kanbanCardsCompleted"></div>
            </div>
          </div>
`;

if (!content.includes('id="tasksBoardDeck"')) {
  content = content.replace('</aside>\n          </div>', '</aside>\n          </div>\n' + kanbanDeckHtml);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully applied clean authentic data structure to index.html!');
