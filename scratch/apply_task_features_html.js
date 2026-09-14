const fs = require('fs');

let html = fs.readFileSync('wallpaper-ui/index.html', 'utf8');

// 1. Add Status filter to tasks filter bar
const oldPrioritySelect = `<div class="tasks-filter-select-wrap">
                <label>Priority:</label>
                <select id="taskFilterPrioritySelect" class="tasks-filter-select">
                  <option value="ALL">High to Low</option>
                  <option value="URGENT">Urgent Priority</option>
                  <option value="HIGH">High Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="NORMAL">Normal</option>
                </select>
              </div>`;

const newPriorityAndStatus = `<div class="tasks-filter-select-wrap">
                <label>Priority:</label>
                <select id="taskFilterPrioritySelect" class="tasks-filter-select">
                  <option value="ALL">High to Low</option>
                  <option value="URGENT">Urgent Priority</option>
                  <option value="HIGH">High Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="NORMAL">Normal</option>
                </select>
              </div>
              <div class="tasks-filter-select-wrap">
                <label>Status:</label>
                <select id="taskFilterStatusSelect" class="tasks-filter-select">
                  <option value="ALL">All Tasks</option>
                  <option value="ACTIVE">In Progress Only</option>
                  <option value="COMPLETED">Completed / Past Tasks Only</option>
                </select>
              </div>`;

if (html.includes(oldPrioritySelect)) {
  html = html.replace(oldPrioritySelect, newPriorityAndStatus);
  console.log('✅ Added Status filter dropdown to tasks-filter-bar');
} else {
  console.warn('⚠️ oldPrioritySelect not found!');
}

// 2. Add IDs to the In Progress and Completed sections in tasks deck
html = html.replace(
  '<div class="tasks-section-block">',
  '<div class="tasks-section-block" id="inProgressTasksSection">'
);
html = html.replace(
  '<div class="tasks-section-block mt-24">',
  '<div class="tasks-section-block mt-24" id="completedTasksSection">'
);

// 3. Add Delete buttons to taskDetailDrawer
const oldDrawerTools = `<div class="drawer-window-tools">
                    <button type="button" class="btn-drawer-tool" id="btnDrawerExpand" title="Open Full View">&#x2197;</button>
                    <button type="button" class="btn-drawer-tool" id="btnDrawerClose" title="Close Drawer">&times;</button>
                  </div>`;

const newDrawerTools = `<div class="drawer-window-tools">
                    <button type="button" class="btn-drawer-tool text-red" id="btnDrawerDeleteHeader" title="Delete Task" style="color: #ef4444; font-size: 15px; margin-right: 4px; padding: 4px 8px; border-radius: 4px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25); cursor: pointer;">🗑</button>
                    <button type="button" class="btn-drawer-tool" id="btnDrawerExpand" title="Edit Task">&#x270E;</button>
                    <button type="button" class="btn-drawer-tool" id="btnDrawerClose" title="Close Drawer">&times;</button>
                  </div>`;

if (html.includes(oldDrawerTools)) {
  html = html.replace(oldDrawerTools, newDrawerTools);
  console.log('✅ Added Delete button to drawer header');
} else {
  console.warn('⚠️ oldDrawerTools not found!');
}

const oldDrawerActions = `<div class="drawer-actions-block mt-20">
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
                </div>`;

const newDrawerActions = `<div class="drawer-actions-block mt-20">
                  <button type="button" id="btnDrawerMarkComplete" class="btn-drawer-action primary">
                    <span id="btnDrawerMarkCompleteText">&#x2714; Mark Task Complete</span>
                  </button>
                  <div class="drawer-secondary-actions">
                    <button type="button" id="btnDrawerReassign" class="btn-drawer-action secondary">
                      <span>&#x1F464; Reassign</span>
                    </button>
                    <button type="button" id="btnDrawerReschedule" class="btn-drawer-action secondary">
                      <span>&#x23F0; Reschedule</span>
                    </button>
                  </div>
                  <button type="button" id="btnDrawerDeleteAction" class="btn-drawer-action danger" style="margin-top: 10px; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; background: rgba(239, 68, 68, 0.12); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.28); border-radius: 6px; padding: 9px 14px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s ease;">
                    <span>🗑 Delete Task</span>
                  </button>
                </div>`;

if (html.includes(oldDrawerActions)) {
  html = html.replace(oldDrawerActions, newDrawerActions);
  console.log('✅ Added Delete Task button to drawer footer');
} else {
  console.warn('⚠️ oldDrawerActions not found!');
}

// 4. Add Delete button to editTaskModal footer
const oldEditModalFoot = `<div class="modal-foot" style="display: flex; justify-content: flex-end; gap: 10px; padding-top: 12px; border-top: 1px solid rgba(255, 255, 255, 0.08);">
          <button type="button" id="btnCancelEditTask" class="btn-secondary-action">Cancel</button>
          <button type="submit" id="btnSaveEditTask" class="btn-primary-action">
            <span>💾 Save Task Changes</span>
          </button>
        </div>`;

const newEditModalFoot = `<div class="modal-foot" style="display: flex; justify-content: flex-end; align-items: center; gap: 10px; padding-top: 12px; border-top: 1px solid rgba(255, 255, 255, 0.08);">
          <button type="button" id="btnDeleteTaskFromModal" style="margin-right: auto; background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 6px; padding: 7px 14px; font-size: 12.5px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px;">
            <span>🗑 Delete Task</span>
          </button>
          <button type="button" id="btnCancelEditTask" class="btn-secondary-action">Cancel</button>
          <button type="submit" id="btnSaveEditTask" class="btn-primary-action">
            <span>💾 Save Task Changes</span>
          </button>
        </div>`;

if (html.includes(oldEditModalFoot)) {
  html = html.replace(oldEditModalFoot, newEditModalFoot);
  console.log('✅ Added Delete button to editTaskModal');
} else {
  console.warn('⚠️ oldEditModalFoot not found!');
}

// 5. Add Past Completed Tasks Archive Modal before the closing </body> tag
const archiveModalMarkup = `
  <!-- ALL PAST & COMPLETED TASKS ARCHIVE MODAL -->
  <div id="completedArchiveModal" class="modal-overlay hidden" style="z-index: 10010;">
    <div class="modal-backdrop" id="completedArchiveBackdrop"></div>
    <div class="modal-card modal-lg" style="max-width: 840px; width: 92%; max-height: 85vh; display: flex; flex-direction: column;">
      <div class="modal-head" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding: 16px 20px;">
        <div class="head-title-wrap" style="display: flex; align-items: center; gap: 10px;">
          <span class="modal-icon" style="font-size: 20px;">📋</span>
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="modal-title" style="font-size: 15px; font-weight: 700;">ALL PAST &amp; COMPLETED TASKS</span>
              <span id="archiveModalCountBadge" style="background: rgba(16,185,129,0.15); color: #10b981; border: 1px solid rgba(16,185,129,0.3); padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 700;">0 Total</span>
            </div>
            <p style="font-size: 11.5px; color: var(--text-muted); margin: 2px 0 0 0;">Complete archive of all completed tasks, deliverables, and past assignments</p>
          </div>
        </div>
        <button id="btnCloseCompletedArchive" class="modal-close-btn" style="background: none; border: none; color: var(--text-muted); font-size: 22px; cursor: pointer;">&times;</button>
      </div>
      <div class="modal-body" style="padding: 16px 20px; overflow-y: auto; flex: 1;">
        <div style="display: flex; gap: 10px; margin-bottom: 14px;">
          <div style="flex: 1; position: relative;">
            <span style="position: absolute; left: 10px; top: 9px; font-size: 13px; color: var(--text-muted);">&#x1F50D;</span>
            <input type="text" id="archiveSearchInput" class="custom-input" placeholder="Search past tasks by title, assignee, or description..." style="width: 100%; padding-left: 32px;">
          </div>
          <select id="archiveAssigneeFilter" class="custom-select" style="width: 200px;">
            <option value="ALL">All Assignees</option>
          </select>
        </div>
        <div id="archiveTasksListContainer" style="display: flex; flex-direction: column; gap: 10px;">
          <!-- Dynamically populated from JS -->
        </div>
      </div>
      <div class="modal-foot" style="padding: 12px 20px; border-top: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 11.5px; color: var(--text-muted);">Tasks can be reopened back to In Progress at any time.</span>
        <button type="button" id="btnCloseCompletedArchiveFoot" class="btn-secondary-action">Close Archive</button>
      </div>
    </div>
  </div>
`;

if (!html.includes('id="completedArchiveModal"')) {
  html = html.replace('</body>', archiveModalMarkup + '\n</body>');
  console.log('✅ Added completedArchiveModal markup');
}

fs.writeFileSync('wallpaper-ui/index.html', html, 'utf8');
console.log('✅ All HTML updates for task delete & past tasks archive applied successfully!');
