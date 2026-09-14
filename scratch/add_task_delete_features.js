/**
 * add_task_delete_features.js
 * Adds:
 * 1. deleteTask() function
 * 2. Delete button event listeners (drawer header, drawer footer, edit modal)
 * 3. Status filter (All/In Progress/Completed)
 * 4. Completed tasks filtered by search/category/assignee
 * 5. Reopen + Delete buttons on completed task rows
 * 6. openTaskDrawer status-aware toggle (Mark Complete vs Reopen)
 * 7. Mark Complete handler supports Reopen mode
 * 8. showCompletedArchiveModal function
 */

const fs = require('fs');
let js = fs.readFileSync('wallpaper-ui/wallpaper.js', 'utf8');

// ──────────────────────────────────────────────────────────────────────────────
// STEP 1: Add deleteTask async function before openTaskDrawer
// ──────────────────────────────────────────────────────────────────────────────
if (!js.includes('async function deleteTask')) {
  const DELETE_FN = [
    '',
    '  // DELETE TASK',
    '  async function deleteTask(taskId) {',
    '    if (!taskId) return;',
    '    const tasks = WorkspaceDB.data.tasks || [];',
    '    const task = tasks.find(function(t) { return t.id === taskId; });',
    '    if (!task) return;',
    '    const taskTitle = task.title || "this task";',
    '    const confirmed = window.confirm("Are you sure you want to delete the task:\\n\\"" + taskTitle + "\\"?\\n\\nThis action cannot be undone.");',
    '    if (!confirmed) return;',
    '    WorkspaceDB.data.tasks = tasks.filter(function(t) { return t.id !== taskId; });',
    '    await WorkspaceDB.save();',
    '    if (window.FirebaseService && FirebaseService.deleteTask) {',
    '      FirebaseService.deleteTask(taskId).catch(function() {});',
    '    }',
    '    if (state.activeSelectedTask && state.activeSelectedTask.id === taskId) {',
    '      state.activeSelectedTask = null;',
    '      const drawer = document.getElementById("taskDetailDrawer");',
    '      if (drawer) drawer.style.display = "none";',
    '    }',
    '    showQuickToast("Task \\"" + taskTitle + "\\" deleted.", "success");',
    '    playNotificationChirp(false);',
    '    renderTasks();',
    '  }',
    '',
  ].join('\n');

  const pos = js.indexOf('function openTaskDrawer(task)');
  if (pos !== -1) {
    js = js.substring(0, pos) + DELETE_FN + js.substring(pos);
    console.log('OK: deleteTask function added');
  } else {
    console.error('FAIL: could not find openTaskDrawer');
    process.exit(1);
  }
} else {
  console.log('SKIP: deleteTask already exists');
}

// ──────────────────────────────────────────────────────────────────────────────
// STEP 2: Wire delete buttons & status filter - replace archive-review listener
// ──────────────────────────────────────────────────────────────────────────────
const ARCHIVE_SEARCH = "document.querySelector('.btn-archive-review')?.addEventListener('click', () => {";
const archivePos = js.indexOf(ARCHIVE_SEARCH);
if (archivePos !== -1) {
  const blockEnd = js.indexOf('});', archivePos) + 3;
  const NEW_LISTENERS = [
    "document.querySelector('.btn-archive-review')?.addEventListener('click', () => {",
    "      playNotificationChirp(true);",
    "      showCompletedArchiveModal();",
    "    });",
    "",
    "    // Delete button - Drawer Header",
    "    document.getElementById('btnDrawerDeleteHeader')?.addEventListener('click', async () => {",
    "      if (state.activeSelectedTask) await deleteTask(state.activeSelectedTask.id);",
    "    });",
    "",
    "    // Delete button - Drawer Footer Action",
    "    document.getElementById('btnDrawerDeleteAction')?.addEventListener('click', async () => {",
    "      if (state.activeSelectedTask) await deleteTask(state.activeSelectedTask.id);",
    "    });",
    "",
    "    // Delete button - Edit Task Modal",
    "    document.getElementById('btnDeleteTaskFromModal')?.addEventListener('click', async () => {",
    "      const taskId = document.getElementById('editTaskId')?.value || (state.activeSelectedTask && state.activeSelectedTask.id);",
    "      if (taskId) {",
    "        closeEditTaskModal();",
    "        await deleteTask(taskId);",
    "      }",
    "    });",
    "",
    "    // Status Filter dropdown",
    "    document.getElementById('taskFilterStatusSelect')?.addEventListener('change', () => {",
    "      renderTasks();",
    "    });",
  ].join('\n');
  js = js.substring(0, archivePos) + NEW_LISTENERS + js.substring(blockEnd);
  console.log('OK: delete buttons & status filter wired');
} else {
  console.error('FAIL: btn-archive-review listener not found');
}

// ──────────────────────────────────────────────────────────────────────────────
// STEP 3: Update openTaskDrawer - status-aware header and complete/reopen toggle
// ──────────────────────────────────────────────────────────────────────────────
const OLD_CODE_EL = "    const taskCodeEl = document.getElementById('drawerTaskCode');\n    if (taskCodeEl) taskCodeEl.textContent = `${task.code || ('TASK-' + (task.id || '').slice(-4).toUpperCase())} • In Progress`;";
if (js.includes(OLD_CODE_EL)) {
  const NEW_CODE_EL = [
    "    const taskCodeEl = document.getElementById('drawerTaskCode');",
    "    const isTaskCompleted = task.status === 'COMPLETED' || task.status === 'ACCOMPLISHED';",
    "    const drawerStatusLabel = isTaskCompleted ? 'Completed' : (task.status === 'REACHED' ? 'In Progress' : (task.status || 'In Progress'));",
    "    if (taskCodeEl) taskCodeEl.textContent = (task.code || ('TASK-' + (task.id || '').slice(-4).toUpperCase())) + ' • ' + drawerStatusLabel;",
    "    // Toggle complete vs reopen button",
    "    const markCompleteBtn = document.getElementById('btnDrawerMarkComplete');",
    "    if (markCompleteBtn) {",
    "      if (isTaskCompleted) {",
    "        markCompleteBtn.textContent = '\\u21BA Reopen Task';",
    "        markCompleteBtn.style.background = 'rgba(59,130,246,0.15)';",
    "        markCompleteBtn.style.color = '#3b82f6';",
    "        markCompleteBtn.style.borderColor = 'rgba(59,130,246,0.3)';",
    "        markCompleteBtn.dataset.mode = 'reopen';",
    "      } else {",
    "        markCompleteBtn.textContent = '\\u2714 Mark Task Complete';",
    "        markCompleteBtn.style.background = '';",
    "        markCompleteBtn.style.color = '';",
    "        markCompleteBtn.style.borderColor = '';",
    "        markCompleteBtn.dataset.mode = 'complete';",
    "      }",
    "    }",
  ].join('\n');
  js = js.replace(OLD_CODE_EL, NEW_CODE_EL);
  console.log('OK: openTaskDrawer status toggle updated');
} else {
  console.log('WARN: drawerTaskCode line not found - may already be updated');
}

// ──────────────────────────────────────────────────────────────────────────────
// STEP 4: Update Mark Complete handler to support Reopen
// ──────────────────────────────────────────────────────────────────────────────
const MC_SEARCH = "document.getElementById('btnDrawerMarkComplete')?.addEventListener('click', async () => {";
const mcPos = js.indexOf(MC_SEARCH);
if (mcPos !== -1) {
  // Find the closing of this block - look for the toast + renderTasks
  const HANDLER_END_SEARCH = "showQuickToast(`Task \"${state.activeSelectedTask.title}\" marked as complete!`, 'success');\n      renderTasks();\n    });";
  const handlerEndPos = js.indexOf(HANDLER_END_SEARCH, mcPos);
  if (handlerEndPos !== -1) {
    const blockEnd = handlerEndPos + HANDLER_END_SEARCH.length;
    const NEW_HANDLER = [
      "document.getElementById('btnDrawerMarkComplete')?.addEventListener('click', async () => {",
      "      if (!state.activeSelectedTask) return;",
      "      const mcBtn = document.getElementById('btnDrawerMarkComplete');",
      "      const mcMode = mcBtn && mcBtn.dataset.mode ? mcBtn.dataset.mode : 'complete';",
      "",
      "      if (mcMode === 'reopen') {",
      "        state.activeSelectedTask.status = 'IN_PROGRESS';",
      "        state.activeSelectedTask.updatedAt = Date.now();",
      "        delete state.activeSelectedTask.accomplishedAt;",
      "        await WorkspaceDB.save();",
      "        if (window.FirebaseService && FirebaseService.updateTask) {",
      "          FirebaseService.updateTask(state.activeSelectedTask.id, { status: 'IN_PROGRESS', updatedAt: Date.now() }).catch(function() {});",
      "        }",
      "        showQuickToast('Task \"' + state.activeSelectedTask.title + '\" moved back to In Progress.', 'info');",
      "        playNotificationChirp(true);",
      "        renderTasks();",
      "        openTaskDrawer(state.activeSelectedTask);",
      "        return;",
      "      }",
      "",
      "      // Mark as complete",
      "      state.activeSelectedTask.status = 'COMPLETED';",
      "      state.activeSelectedTask.updatedAt = Date.now();",
      "      state.activeSelectedTask.accomplishedAt = Date.now();",
      "      await WorkspaceDB.save();",
      "      if (window.FirebaseService && FirebaseService.updateTask) {",
      "        FirebaseService.updateTask(state.activeSelectedTask.id, {",
      "          status: 'COMPLETED',",
      "          updatedAt: Date.now(),",
      "          accomplishedAt: Date.now()",
      "        }).catch(function() {});",
      "      }",
      "      playNotificationChirp(true);",
      "      showQuickToast('Task \"' + state.activeSelectedTask.title + '\" marked as complete!', 'success');",
      "      renderTasks();",
      "      openTaskDrawer(state.activeSelectedTask);",
      "    });",
    ].join('\n');
    js = js.substring(0, mcPos) + NEW_HANDLER + js.substring(blockEnd);
    console.log('OK: Mark Complete handler updated with Reopen support');
  } else {
    console.log('WARN: Mark Complete handler end not found');
  }
} else {
  console.log('WARN: btnDrawerMarkComplete listener not found');
}

// ──────────────────────────────────────────────────────────────────────────────
// STEP 5: Fix Render Completed Tasks Section - add filters + delete/reopen buttons
// ──────────────────────────────────────────────────────────────────────────────
const COMP_SECTION_SEARCH = '// Render Completed Tasks Section';
const compSectionPos = js.indexOf(COMP_SECTION_SEARCH);
if (compSectionPos !== -1) {
  const checkChunk = js.substring(compSectionPos, compSectionPos + 300);
  if (checkChunk.includes('completedTasks.forEach')) {
    // Find the forEach start 
    const forEachStart = js.indexOf('completedTasks.forEach(ct =>', compSectionPos);
    // We need to:
    // A) Insert status filter + filtering code BEFORE this entire section
    // B) Replace completedTasks.forEach -> filteredCompleted.forEach
    // C) Update the empty notice message
    // D) Add delete/reopen to the row HTML
    // E) Update the row click handler

    // Find the whole "if (completedContainer) {" block that starts the section
    const containerBlockStart = js.lastIndexOf('if (completedContainer) {', forEachStart);
    // We insert the status filter code BEFORE 'if (completedContainer)'
    const STATUS_FILTER_CODE = [
      '    // Status Filter',
      "    const statusFilter = document.getElementById('taskFilterStatusSelect') ? document.getElementById('taskFilterStatusSelect').value : 'ALL';",
      "    const inProgressSection = document.getElementById('inProgressTasksSection');",
      "    const completedSection = document.getElementById('completedTasksSection');",
      "    if (statusFilter === 'ACTIVE') {",
      "      if (inProgressSection) inProgressSection.style.display = '';",
      "      if (completedSection) completedSection.style.display = 'none';",
      "    } else if (statusFilter === 'COMPLETED') {",
      "      if (inProgressSection) inProgressSection.style.display = 'none';",
      "      if (completedSection) completedSection.style.display = '';",
      "    } else {",
      "      if (inProgressSection) inProgressSection.style.display = '';",
      "      if (completedSection) completedSection.style.display = '';",
      "    }",
      "",
      "    // Apply same filters to completedTasks",
      "    let filteredCompleted = completedTasks.slice();",
      "    if (searchQuery) {",
      "      filteredCompleted = filteredCompleted.filter(function(t) {",
      "        return (t.title && t.title.toLowerCase().indexOf(searchQuery) !== -1) ||",
      "          (t.assigneeName && t.assigneeName.toLowerCase().indexOf(searchQuery) !== -1);",
      "      });",
      "    }",
      "    if (catFilter !== 'ALL') {",
      "      filteredCompleted = filteredCompleted.filter(function(t) {",
      "        return (t.category || '').toUpperCase().indexOf(catFilter.toUpperCase()) !== -1;",
      "      });",
      "    }",
      "    if (assigneeFilter !== 'ALL') {",
      "      filteredCompleted = filteredCompleted.filter(function(t) {",
      "        return t.assigneeId === assigneeFilter ||",
      "          (t.assigneeName && t.assigneeName.toLowerCase().indexOf(assigneeFilter.toLowerCase()) !== -1);",
      "      });",
      "    }",
      "    if (completedCount) completedCount.textContent = filteredCompleted.length + ' Total';",
      "",
      "    // Render Completed Tasks Section",
    ].join('\n');

    js = js.substring(0, containerBlockStart) + STATUS_FILTER_CODE + '\n    ' + js.substring(containerBlockStart);
    console.log('OK: Status filter + filteredCompleted inserted');

    // Now replace "completedTasks.length === 0" -> "filteredCompleted.length === 0"
    // and "completedTasks.forEach(ct =>" -> "filteredCompleted.forEach(ct =>"
    // and update the no-tasks message
    // First find the section again
    const compSectionPos2 = js.indexOf('// Render Completed Tasks Section');
    if (compSectionPos2 !== -1) {
      let chunk = js.substring(compSectionPos2, compSectionPos2 + 3000);
      chunk = chunk.replace(
        "if (completedTasks.length === 0) {",
        "if (filteredCompleted.length === 0) {"
      );
      chunk = chunk.replace(
        "'No completed tasks yet. Completed tasks will appear here.'",
        "completedTasks.length === 0 ? 'No completed tasks yet.' : 'No completed tasks match your filters.'"
      );
      chunk = chunk.replace(
        'completedTasks.forEach(ct =>',
        'filteredCompleted.forEach(ct =>'
      );
      js = js.substring(0, compSectionPos2) + chunk + js.substring(compSectionPos2 + 3000);
      console.log('OK: completedTasks -> filteredCompleted in render section');
    }
  } else {
    console.log('SKIP: Completed section may already be updated');
  }
} else {
  console.error('FAIL: Render Completed Tasks Section not found');
}

// ──────────────────────────────────────────────────────────────────────────────
// STEP 6: Fix completedCount.textContent in old location 
// ──────────────────────────────────────────────────────────────────────────────
const OLD_CC = "if (completedCount) completedCount.textContent = `${completedTotal} Total`;";
if (js.includes(OLD_CC)) {
  js = js.replace(OLD_CC, '// completedCount is set after filtering in the section below');
  console.log('OK: removed old completedCount line');
}

// ──────────────────────────────────────────────────────────────────────────────
// STEP 7: Add Reopen + Delete buttons to completed task row HTML
// ──────────────────────────────────────────────────────────────────────────────
const OLD_BADGE = '<span style="font-size:11px; font-weight:700; color:#008a3e; background:rgba(0,138,62,0.1); padding:3px 10px; border-radius:6px; border:1px solid rgba(0,138,62,0.2);">✓ Completed</span>';
const NEW_BADGE = [
  '<div style="display:flex; align-items:center; gap:6px;">',
  '              <span style="font-size:11px; font-weight:700; color:#008a3e; background:rgba(0,138,62,0.1); padding:3px 10px; border-radius:6px; border:1px solid rgba(0,138,62,0.2);">&#10003; Done</span>',
  '              <button class="btn-row-reopen" data-tid="${ct.id}" style="font-size:11px;font-weight:600;color:#3b82f6;background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.25);border-radius:5px;padding:3px 8px;cursor:pointer;">&#8634; Reopen</button>',
  '              <button class="btn-row-delete" data-tid="${ct.id}" style="font-size:11px;font-weight:600;color:#ef4444;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.25);border-radius:5px;padding:3px 8px;cursor:pointer;">&#128465;</button>',
  '            </div>',
].join('\n');
if (js.includes(OLD_BADGE)) {
  js = js.replace(OLD_BADGE, NEW_BADGE);
  console.log('OK: Reopen + Delete buttons added to completed row');
} else {
  console.log('WARN: could not find completed badge - adding after click handler');
}

// ──────────────────────────────────────────────────────────────────────────────
// STEP 8: Update completed row click + add Reopen/Delete handlers
// ──────────────────────────────────────────────────────────────────────────────
const OLD_ROW_CLICK = [
  "          row.addEventListener('click', () => {",
  "            state.activeSelectedTask = ct;",
  "            openTaskDrawer(ct);",
  "          });",
  "          completedContainer.appendChild(row);",
].join('\n');

const NEW_ROW_CLICK = [
  "          row.addEventListener('click', function(e) {",
  "            if (e.target.closest && (e.target.closest('.btn-row-reopen') || e.target.closest('.btn-row-delete'))) return;",
  "            state.activeSelectedTask = ct;",
  "            openTaskDrawer(ct);",
  "          });",
  "          const reopenBtn = row.querySelector('.btn-row-reopen');",
  "          if (reopenBtn) {",
  "            reopenBtn.addEventListener('click', async function(e) {",
  "              e.stopPropagation();",
  "              ct.status = 'IN_PROGRESS';",
  "              ct.updatedAt = Date.now();",
  "              delete ct.accomplishedAt;",
  "              await WorkspaceDB.save();",
  "              if (window.FirebaseService && FirebaseService.updateTask) {",
  "                FirebaseService.updateTask(ct.id, { status: 'IN_PROGRESS', updatedAt: Date.now() }).catch(function() {});",
  "              }",
  "              showQuickToast('Task \"' + ct.title + '\" moved back to In Progress.', 'info');",
  "              playNotificationChirp(true);",
  "              renderTasks();",
  "            });",
  "          }",
  "          const delBtn = row.querySelector('.btn-row-delete');",
  "          if (delBtn) {",
  "            delBtn.addEventListener('click', async function(e) {",
  "              e.stopPropagation();",
  "              await deleteTask(ct.id);",
  "            });",
  "          }",
  "          completedContainer.appendChild(row);",
].join('\n');

if (js.includes(OLD_ROW_CLICK)) {
  js = js.replace(OLD_ROW_CLICK, NEW_ROW_CLICK);
  console.log('OK: completed row click handlers updated');
} else {
  console.log('WARN: could not find old row click pattern');
}

// ──────────────────────────────────────────────────────────────────────────────
// STEP 9: Add showCompletedArchiveModal function before initThemeEngine
// ──────────────────────────────────────────────────────────────────────────────
if (!js.includes('function showCompletedArchiveModal')) {
  const ARCHIVE_MODAL = [
    '',
    '  // Completed Tasks Archive Modal',
    '  function showCompletedArchiveModal() {',
    '    var existing = document.getElementById("completedArchiveOverlay");',
    '    if (existing) existing.remove();',
    '    var overlay = document.createElement("div");',
    '    overlay.id = "completedArchiveOverlay";',
    '    overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:9999;display:flex;align-items:center;justify-content:center;";',
    '    document.body.appendChild(overlay);',
    '',
    '    function buildModal() {',
    '      var allTasks = WorkspaceDB.data.tasks || [];',
    '      var doneTasks = allTasks.filter(function(t) { return t.status === "COMPLETED" || t.status === "ACCOMPLISHED"; });',
    '      var rows = doneTasks.map(function(ct) {',
    '        var ddate = ct.accomplishedAt ? new Date(ct.accomplishedAt).toLocaleDateString("en-GB", {day:"2-digit",month:"short",year:"numeric"}) :',
    '                    ct.updatedAt ? new Date(ct.updatedAt).toLocaleDateString("en-GB", {day:"2-digit",month:"short",year:"numeric"}) : "Unknown";',
    '        var subs = Array.isArray(ct.subtasks) ? ct.subtasks : [];',
    '        var doneSub = subs.filter(function(s) { return s.done; }).length;',
    '        return [',
    '          "<div class=\\"arc-row\\" data-id=\\"" + ct.id + "\\" style=\\"background:var(--card-bg,#1d2231);border:1px solid var(--card-border,#2a3040);border-radius:8px;padding:14px 16px;margin-bottom:10px;display:flex;align-items:flex-start;justify-content:space-between;gap:12px;\\">",',
    '          "  <div style=\\"flex:1;min-width:0;\\">",',
    '          "    <div style=\\"display:flex;align-items:center;gap:8px;margin-bottom:4px;\\">",',
    '          "      <div style=\\"width:16px;height:16px;background:#008a3e;color:#fff;border-radius:3px;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;flex-shrink:0;\\">&#10003;</div>",',
    '          "      <span style=\\"font-size:13px;font-weight:700;color:var(--text-white,#fff);\\">" + (ct.title || "Untitled") + "</span>",',
    '          "      <span style=\\"font-size:10px;background:var(--shell-bg,#10141c);padding:2px 7px;border-radius:4px;color:var(--text-muted,#8892a4);font-weight:600;\\">" + (ct.category || "General") + "</span>",',
    '          "    </div>",',
    '          "    <p style=\\"font-size:11px;color:var(--text-muted,#8892a4);margin:0 0 5px 24px;\\">" + (ct.description || "") + "</p>",',
    '          "    <div style=\\"display:flex;gap:14px;margin-left:24px;\\">",',
    '          "      <span style=\\"font-size:11px;color:var(--text-muted,#8892a4);\\">&#128100; " + (ct.assigneeName || "Unknown") + "</span>",',
    '          "      <span style=\\"font-size:11px;color:var(--text-muted,#8892a4);\\">&#128197; " + ddate + "</span>",',
    '          (subs.length > 0 ? "      <span style=\\"font-size:11px;color:var(--text-muted,#8892a4);\\">" + doneSub + "/" + subs.length + " subtasks</span>" : ""),',
    '          "    </div>",',
    '          "  </div>",',
    '          "  <div style=\\"display:flex;flex-direction:column;gap:5px;flex-shrink:0;\\">",',
    '          "    <button class=\\"arc-view\\" data-id=\\"" + ct.id + "\\" style=\\"font-size:11px;font-weight:600;color:var(--text-white,#fff);background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:5px;padding:4px 10px;cursor:pointer;\\">View</button>",',
    '          "    <button class=\\"arc-reopen\\" data-id=\\"" + ct.id + "\\" style=\\"font-size:11px;font-weight:600;color:#3b82f6;background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.25);border-radius:5px;padding:4px 10px;cursor:pointer;\\">&#8634; Reopen</button>",',
    '          "    <button class=\\"arc-delete\\" data-id=\\"" + ct.id + "\\" style=\\"font-size:11px;font-weight:600;color:#ef4444;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.25);border-radius:5px;padding:4px 10px;cursor:pointer;\\">&#128465; Delete</button>",',
    '          "  </div>",',
    '          "</div>"',
    '        ].join("");',
    '      }).join("");',
    '',
    '      overlay.innerHTML = [',
    '        "<div style=\\"background:var(--panel-bg,#181c24);border:1px solid var(--card-border,#2a3040);border-radius:12px;width:min(700px,95vw);max-height:80vh;display:flex;flex-direction:column;overflow:hidden;\\">",',
    '        "  <div style=\\"padding:16px 20px;border-bottom:1px solid var(--card-border,#2a3040);display:flex;align-items:center;justify-content:space-between;\\">",',
    '        "    <div>",',
    '        "      <h3 style=\\"margin:0;font-size:15px;font-weight:700;color:var(--text-white,#fff);\\">&#9989; Completed Tasks</h3>",',
    '        "      <p style=\\"margin:3px 0 0;font-size:12px;color:var(--text-muted,#8892a4);\\">" + doneTasks.length + " task" + (doneTasks.length !== 1 ? "s" : "") + " completed</p>",',
    '        "    </div>",',
    '        "    <button id=\\"arcClose\\" style=\\"background:none;border:none;color:var(--text-muted,#8892a4);font-size:20px;cursor:pointer;padding:4px 8px;\\">&#10005;</button>",',
    '        "  </div>",',
    '        "  <div style=\\"overflow-y:auto;flex:1;padding:14px;\\">",',
    '        (doneTasks.length === 0 ? "<div style=\\"text-align:center;padding:40px;color:var(--text-muted,#8892a4);font-size:13px;\\">No completed tasks yet.</div>" : rows),',
    '        "  </div>",',
    '        "</div>"',
    '      ].join("");',
    '',
    '      document.getElementById("arcClose").addEventListener("click", function() { overlay.remove(); });',
    '      overlay.addEventListener("click", function(e) { if (e.target === overlay) overlay.remove(); });',
    '',
    '      overlay.querySelectorAll(".arc-view").forEach(function(btn) {',
    '        btn.addEventListener("click", function() {',
    '          var task = (WorkspaceDB.data.tasks || []).find(function(t) { return t.id === btn.dataset.id; });',
    '          if (task) { overlay.remove(); state.activeSelectedTask = task; openTaskDrawer(task); }',
    '        });',
    '      });',
    '',
    '      overlay.querySelectorAll(".arc-reopen").forEach(function(btn) {',
    '        btn.addEventListener("click", async function() {',
    '          var task = (WorkspaceDB.data.tasks || []).find(function(t) { return t.id === btn.dataset.id; });',
    '          if (!task) return;',
    '          task.status = "IN_PROGRESS"; task.updatedAt = Date.now(); delete task.accomplishedAt;',
    '          await WorkspaceDB.save();',
    '          if (window.FirebaseService && FirebaseService.updateTask) FirebaseService.updateTask(task.id, { status: "IN_PROGRESS", updatedAt: Date.now() }).catch(function(){});',
    '          showQuickToast("Task \\"" + task.title + "\\" reopened.", "info");',
    '          playNotificationChirp(true); renderTasks(); buildModal();',
    '        });',
    '      });',
    '',
    '      overlay.querySelectorAll(".arc-delete").forEach(function(btn) {',
    '        btn.addEventListener("click", async function() {',
    '          overlay.remove(); await deleteTask(btn.dataset.id);',
    '        });',
    '      });',
    '    }',
    '    buildModal();',
    '  }',
    '',
  ].join('\n');

  const insertPoint = 'function initThemeEngine';
  const insertPos = js.indexOf(insertPoint);
  if (insertPos !== -1) {
    js = js.substring(0, insertPos) + ARCHIVE_MODAL + js.substring(insertPos);
    console.log('OK: showCompletedArchiveModal added');
  } else {
    console.error('FAIL: initThemeEngine not found');
  }
} else {
  console.log('SKIP: showCompletedArchiveModal already exists');
}

// ──────────────────────────────────────────────────────────────────────────────
// Write
// ──────────────────────────────────────────────────────────────────────────────
fs.writeFileSync('wallpaper-ui/wallpaper.js', js, 'utf8');
console.log('\nDone! wallpaper.js size:', Math.round(js.length / 1024) + 'KB');
