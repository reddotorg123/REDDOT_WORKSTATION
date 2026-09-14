const fs = require('fs');
let html = fs.readFileSync('wallpaper-ui/index.html', 'utf8');

// 1. Add Status filter next to Priority select
const pPriority = html.indexOf('id="taskFilterPrioritySelect"');
if (pPriority !== -1) {
  const pSelectWrapEnd = html.indexOf('</div>', pPriority) + 6;
  const statusFilterHtml = `\r\n              <div class="tasks-filter-select-wrap">\r\n                <label>Status:</label>\r\n                <select id="taskFilterStatusSelect" class="tasks-filter-select">\r\n                  <option value="ALL">All Tasks</option>\r\n                  <option value="ACTIVE">In Progress Only</option>\r\n                  <option value="COMPLETED">Completed / Past Tasks Only</option>\r\n                </select>\r\n              </div>`;
  if (!html.includes('id="taskFilterStatusSelect"')) {
    html = html.substring(0, pSelectWrapEnd) + statusFilterHtml + html.substring(pSelectWrapEnd);
    console.log('✅ Added taskFilterStatusSelect');
  }
}

// 2. Add Delete button to drawer-window-tools
const pClose = html.indexOf('id="btnDrawerClose"');
if (pClose !== -1) {
  const btnDeleteHeader = `<button type="button" class="btn-drawer-tool text-red" id="btnDrawerDeleteHeader" title="Delete Task" style="color: #ef4444; font-size: 15px; margin-right: 4px; padding: 4px 8px; border-radius: 4px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25); cursor: pointer;">🗑</button>\r\n                    `;
  if (!html.includes('id="btnDrawerDeleteHeader"')) {
    const btnExpand = html.lastIndexOf('<button', pClose);
    html = html.substring(0, btnExpand) + btnDeleteHeader + html.substring(btnExpand);
    console.log('✅ Added btnDrawerDeleteHeader');
  }
}

// 3. Add Delete button to drawer-actions-block
const pDrawerActions = html.indexOf('class="drawer-actions-block');
if (pDrawerActions !== -1) {
  const pSecondary = html.indexOf('drawer-secondary-actions', pDrawerActions);
  if (pSecondary !== -1) {
    const pSecondaryEnd = html.indexOf('</div>', pSecondary) + 6;
    const btnDeleteDrawer = `\r\n                  <button type="button" id="btnDrawerDeleteAction" class="btn-drawer-action danger" style="margin-top: 10px; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; background: rgba(239, 68, 68, 0.12); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.28); border-radius: 6px; padding: 9px 14px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s ease;">\r\n                    <span>🗑 Delete Task</span>\r\n                  </button>`;
    if (!html.includes('id="btnDrawerDeleteAction"')) {
      html = html.substring(0, pSecondaryEnd) + btnDeleteDrawer + html.substring(pSecondaryEnd);
      console.log('✅ Added btnDrawerDeleteAction');
    }
  }
}

// 4. Add Delete button to editTaskModal footer
const pSaveEdit = html.indexOf('id="btnSaveEditTask"');
if (pSaveEdit !== -1) {
  const pModalFoot = html.lastIndexOf('<div class="modal-foot"', pSaveEdit);
  const btnDeleteModal = `\r\n          <button type="button" id="btnDeleteTaskFromModal" style="margin-right: auto; background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 6px; padding: 7px 14px; font-size: 12.5px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px;">\r\n            <span>🗑 Delete Task</span>\r\n          </button>`;
  if (!html.includes('id="btnDeleteTaskFromModal"')) {
    const pFirstBtn = html.indexOf('<button', pModalFoot);
    html = html.substring(0, pFirstBtn) + btnDeleteModal + html.substring(pFirstBtn);
    console.log('✅ Added btnDeleteTaskFromModal');
  }
}

// 5. Ensure section IDs for In Progress and Completed sections
html = html.replace(
  '<div class="tasks-section-block">',
  '<div class="tasks-section-block" id="inProgressTasksSection">'
);
html = html.replace(
  '<div class="tasks-section-block mt-24">',
  '<div class="tasks-section-block mt-24" id="completedTasksSection">'
);

fs.writeFileSync('wallpaper-ui/index.html', html, 'utf8');
console.log('✅ Updated index.html successfully!');
