const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const uiJsPath = path.join(root, 'wallpaper-ui', 'wallpaper.js');
let js = fs.readFileSync(uiJsPath, 'utf8');

// Ensure backup
fs.writeFileSync(path.join(__dirname, 'wallpaper.js.pre_complete_fix.bak'), js, 'utf8');

// 1. Check state initialization for task properties
if (!js.includes('taskViewMode')) {
  // Inject into state object
  js = js.replace(/activeTeamsRailTab:\s*'chat',/, "activeTeamsRailTab: 'chat',\n    taskViewMode: 'list',\n    taskSortMode: 'due',\n    activeSelectedTask: null,");
  console.log('✅ Added taskViewMode, taskSortMode, activeSelectedTask to state');
}

// 2. Replace TASKS MANAGEMENT block
const tasksManagementStart = '  // --- TASKS MANAGEMENT ---';
const tasksManagementEnd = '  function ensureEditTaskModal() {';
const startIdx1 = js.indexOf(tasksManagementStart);
const endIdx1 = js.indexOf(tasksManagementEnd, startIdx1);

if (startIdx1 === -1 || endIdx1 === -1) {
  throw new Error('Could not locate TASKS MANAGEMENT block');
}

const newTasksManagementBlock = `  // --- TASKS MANAGEMENT ---
  function populateAssigneeSelect() {
    const selects = [
      document.getElementById('taskAssigneeSelect'),
      document.getElementById('taskFilterAssigneeSelect'),
      document.getElementById('editTaskAssignee')
    ].filter(Boolean);

    const members = getUniqueMembersList();

    selects.forEach(select => {
      const currentVal = select.value;
      select.replaceChildren();

      const optAll = document.createElement('option');
      optAll.value = 'ALL';
      optAll.dataset.name = 'Entire Team';
      optAll.dataset.email = '';
      optAll.textContent = select.id === 'taskFilterAssigneeSelect' ? 'All Members' : 'Entire Team (ALL)';
      select.appendChild(optAll);

      members.forEach(m => {
        const opt = document.createElement('option');
        const safeMId = m.id || m.uid || 'RD-EMP';
        const safeMName = m.displayName || m.name || (m.email ? m.email.split('@')[0] : 'Team Member');
        opt.value = safeMId;
        opt.dataset.name = safeMName;
        opt.dataset.email = m.email || '';
        opt.dataset.uid = m.uid || '';
        opt.textContent = \`\${safeMName} [\${safeMId}]\`;
        select.appendChild(opt);
      });

      if (currentVal && Array.from(select.options).some(o => o.value === currentVal)) {
        select.value = currentVal;
      } else {
        select.value = 'ALL';
      }
    });
  }

  function formatTimestampForDateInput(timestamp) {
    if (!timestamp) return new Date().toISOString().split('T')[0];
    const d = new Date(Number(timestamp) || timestamp);
    if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
    return d.toISOString().split('T')[0];
  }

  function parseDateInputToTimestamp(dateStr, existingTimestamp) {
    if (!dateStr) {
      return existingTimestamp || Date.now();
    }
    const parsed = new Date(dateStr).getTime();
    return isNaN(parsed) ? (existingTimestamp || Date.now()) : parsed;
  }

  function renderTasks() {
    const container = document.getElementById('taskCardsList');
    const completedContainer = document.getElementById('completedTasksList');
    const inProgressCount = document.getElementById('tasksInProgressCount');
    const completedCount = document.getElementById('tasksCompletedCount');
    if (!container) return;

    // Populate all assignee dropdowns
    populateAssigneeSelect();

    // Seed realistic high-priority sprint tasks if empty
    if (!WorkspaceDB.data.tasks || WorkspaceDB.data.tasks.length === 0) {
      WorkspaceDB.data.tasks = [
        {
          id: 'task_001',
          code: 'TASK-4892',
          title: 'Industrial UI Architecture Design',
          category: 'CORE ARCHITECTURE',
          pipeline: 'feat/carbon-v4',
          priority: 'HIGH',
          status: 'REACHED',
          dueAt: 'Today, 5:00 PM',
          assigneeName: 'Jagadish K (Lead Design)',
          description: 'Formalizing the strict Carbon-compliant micro-tokens, unified visual primitives, spacing lattices, and fluid grid contracts for workstation sub-modules.',
          scope: 'Refine the high-density workstation UI. Replace bulky UI matrices with clean micro-cards, zero decorative clutter, and absolute typographic rhythm aligned strictly with IBM Carbon principles.',
          subtasks: [
            { label: 'Audit color tokens against contrast threshold', done: true },
            { label: 'Draft high-contrast typography hierarchy', done: true },
            { label: 'Implement task card hover micro-animations', done: true },
            { label: 'Conduct keyboard navigation and screen-reader pass', done: false }
          ],
          createdAt: Date.now() - 3600000
        },
        {
          id: 'task_002',
          code: 'TASK-4893',
          title: 'Local SQLite NVMe WAL Sync Optimization',
          category: 'STORAGE & NVME',
          pipeline: 'perf/nvme-wal',
          priority: 'MEDIUM',
          status: 'REACHED',
          dueAt: 'Tomorrow',
          assigneeName: 'Vikram S (Backend Systems)',
          description: 'Eliminate synchronous disk lockups across hot telemetry write cycles by migrating ring-buffers directly into zero-copy WAL structures.',
          scope: 'Benchmark WAL mode performance under 10,000 IOPS writes to NVMe persistent disk vault.',
          subtasks: [
            { label: 'Migrate file locking to atomic serial queue', done: true },
            { label: 'Configure WAL checkpoint intervals', done: false },
            { label: 'Stress test crash recovery', done: false }
          ],
          createdAt: Date.now() - 7200000
        },
        {
          id: 'task_003',
          code: 'TASK-4894',
          title: 'TPU Enclave Biometric Pulse Bridge',
          category: 'HARDWARE KERNEL',
          pipeline: 'feat/tpu-bridge',
          priority: 'LOW',
          status: 'REACHED',
          dueAt: 'In 4 Days',
          assigneeName: 'Ananya M (Firmware Engineer)',
          description: 'Interfacing physical cryptographic keys with embedded security chip enclave, handling real-time driver interrupts securely.',
          scope: 'Implement hardware interrupt service routines for cryptographic enclave bus transactions.',
          subtasks: [
            { label: 'Draft TPU register mappings', done: false },
            { label: 'Test ring buffer memory safety', done: false }
          ],
          createdAt: Date.now() - 14400000
        }
      ];
      WorkspaceDB.save().catch(() => {});
    }

    const allTasks = WorkspaceDB.data.tasks || [];
    const completedTasksList = [
      {
        title: 'Zero-Surveillance Privacy Attestation Docs',
        category: 'Compliance',
        verifier: 'Pavithra R',
        time: 'Merged to production 6 hrs ago',
        badge: '✓ Audit Passed'
      },
      {
        title: 'Tokenized Hex Mappings to Carbon Spec v4.8',
        category: 'Tokens',
        verifier: 'Jagadish K',
        time: 'Merged yesterday 21:40',
        badge: '✓ Token Validated'
      }
    ];

    const completedTotal = 22 + allTasks.filter(t => t.status === 'COMPLETED' || t.status === 'ACCOMPLISHED').length;
    const activeTasks = allTasks.filter(t => t.status !== 'COMPLETED' && t.status !== 'ACCOMPLISHED');
    const totalCount = Math.max(allTasks.length + 22, 28);
    const velocityScore = Math.round((completedTotal / totalCount) * 100);

    const sTotal = document.getElementById('sprintTotalTasks');
    if (sTotal) sTotal.textContent = String(totalCount);
    const sComp = document.getElementById('sprintCompletedTasks');
    if (sComp) sComp.textContent = String(completedTotal);
    const sLoad = document.getElementById('sprintActiveLoad');
    if (sLoad) sLoad.textContent = String(activeTasks.length);
    const sVelo = document.getElementById('sprintVelocityScore');
    if (sVelo) sVelo.textContent = \`\${velocityScore}%\`;

    // Filter tasks
    let filteredTasks = [...activeTasks];

    const searchInput = document.getElementById('filterTaskInput');
    const searchQuery = (searchInput?.value || '').trim().toLowerCase();
    if (searchQuery) {
      filteredTasks = filteredTasks.filter(t => 
        (t.title && t.title.toLowerCase().includes(searchQuery)) ||
        (t.code && t.code.toLowerCase().includes(searchQuery)) ||
        (t.category && t.category.toLowerCase().includes(searchQuery)) ||
        (t.assigneeName && t.assigneeName.toLowerCase().includes(searchQuery)) ||
        (t.description && t.description.toLowerCase().includes(searchQuery))
      );
    }

    const catFilter = document.getElementById('taskFilterCategorySelect')?.value || 'ALL';
    if (catFilter !== 'ALL') {
      filteredTasks = filteredTasks.filter(t => (t.category || '').toUpperCase().includes(catFilter.toUpperCase()));
    }

    const assigneeFilter = document.getElementById('taskFilterAssigneeSelect')?.value || 'ALL';
    if (assigneeFilter !== 'ALL') {
      filteredTasks = filteredTasks.filter(t => 
        t.assigneeId === assigneeFilter || 
        (t.assigneeName && t.assigneeName.toLowerCase().includes(assigneeFilter.toLowerCase()))
      );
    }

    const priorityFilter = document.getElementById('taskFilterPrioritySelect')?.value || 'ALL';
    if (priorityFilter !== 'ALL') {
      filteredTasks = filteredTasks.filter(t => (t.priority || '').toUpperCase() === priorityFilter.toUpperCase());
    }

    // Sort tasks
    if (state.taskSortMode === 'priority') {
      const pRank = { CRITICAL: 4, URGENT: 4, HIGH: 3, MEDIUM: 2, NORMAL: 2, LOW: 1 };
      filteredTasks.sort((a, b) => (pRank[b.priority] || 2) - (pRank[a.priority] || 2));
    } else {
      filteredTasks.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }

    if (inProgressCount) inProgressCount.textContent = String(filteredTasks.length);
    if (completedCount) completedCount.textContent = \`\${completedTotal} Total\`;

    // If Board View is active, render Kanban Board
    if (state.taskViewMode === 'board') {
      renderKanbanBoard(allTasks);
      return;
    }

    // LIST VIEW
    container.replaceChildren();
    if (completedContainer) completedContainer.replaceChildren();

    if (filteredTasks.length === 0) {
      const emptyNotice = document.createElement('div');
      emptyNotice.style.cssText = 'padding: 28px; text-align: center; color: var(--text-muted); font-size: 13px; background: var(--card-bg); border: 1px dashed var(--card-border); border-radius: 8px;';
      emptyNotice.innerHTML = '🔍 No matching sprint tasks found. Try adjusting filters or click <strong>+ Add Task</strong> above.';
      container.appendChild(emptyNotice);
    } else {
      filteredTasks.forEach((task, idx) => {
        const card = document.createElement('div');
        card.className = 'task-card-v3';
        card.dataset.taskId = task.id;

        const isSelected = state.activeSelectedTask ? state.activeSelectedTask.id === task.id : idx === 0;
        if (isSelected) {
          card.classList.add('active-selected');
          state.activeSelectedTask = task;
        }

        const priorityClass = (task.priority === 'HIGH' || task.priority === 'CRITICAL' || task.priority === 'URGENT') ? 'p-high' : (task.priority === 'MEDIUM' ? 'p-med' : 'p-low');
        const safePriority = escapeHtml(task.priority || 'NORMAL');
        const safeCategory = escapeHtml(task.category || 'CORE ARCHITECTURE');
        const safeDue = escapeHtml(task.dueAt || 'Due Today, 5:00 PM');
        const safeTitle = escapeHtml(task.title || 'Workspace Task');
        const safeDesc = escapeHtml(task.description || '');
        const safeAssignee = escapeHtml(task.assigneeName || 'Jagadish K (Lead Design)');
        const assigneeInitials = safeAssignee.slice(0, 2).toUpperCase();

        const subtasks = task.subtasks || [
          { label: 'Review scope and requirements', done: true },
          { label: 'Execute implementation pass', done: true },
          { label: 'Conduct code audit', done: false }
        ];
        const doneSub = subtasks.filter(s => s.done).length;
        const totalSub = subtasks.length;
        const subPercent = totalSub > 0 ? Math.round((doneSub / totalSub) * 100) : 0;

        card.innerHTML = \`
          <div class="task-card-meta-top">
            <div class="task-tags-group">
              <span class="task-p-badge \${priorityClass}">\${safePriority} PRIORITY</span>
              <span class="task-mod-badge">\${safeCategory}</span>
            </div>
            <span class="task-due-date">📅 \${safeDue}</span>
          </div>

          <h4 class="task-card-title">\${safeTitle}</h4>
          <p class="task-card-desc">\${safeDesc}</p>

          <div class="task-card-footer">
            <div class="task-assignee-chip">
              <div class="task-assignee-avatar">\${assigneeInitials}</div>
              <span class="task-assignee-name">\${safeAssignee}</span>
            </div>
            <div class="task-subtasks-progress">
              <span class="subtasks-count">\${doneSub}/\${totalSub} subtasks</span>
              <div class="subtasks-bar-track">
                <div class="subtasks-bar-fill" style="width: \${subPercent}%;"></div>
              </div>
            </div>
          </div>
        \`;

        card.addEventListener('click', () => {
          document.querySelectorAll('.task-card-v3').forEach(c => c.classList.remove('active-selected'));
          card.classList.add('active-selected');
          state.activeSelectedTask = task;
          openTaskDrawer(task);
        });

        container.appendChild(card);
      });

      // Auto-open selected or first task in drawer
      if (state.activeSelectedTask) {
        openTaskDrawer(state.activeSelectedTask);
      } else if (filteredTasks.length > 0) {
        openTaskDrawer(filteredTasks[0]);
      }
    }

    // Render Completed Tasks Section
    if (completedContainer) {
      completedTasksList.forEach(ct => {
        const row = document.createElement('div');
        row.style.cssText = 'background:var(--card-bg); border:1px solid var(--card-border); border-radius:8px; padding:12px 16px; display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;';
        row.innerHTML = \`
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="width:18px; height:18px; background:#008a3e; color:#fff; border-radius:3px; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:800;">✓</div>
            <div>
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:13px; font-weight:700; color:var(--text-white);">\${escapeHtml(ct.title)}</span>
                <span style="font-size:10px; background:var(--shell-bg); padding:2px 6px; border-radius:4px; color:var(--text-muted); font-weight:600;">\${escapeHtml(ct.category)}</span>
              </div>
              <p style="font-size:11.5px; color:var(--text-muted); margin:2px 0 0 0;">Verified by \${escapeHtml(ct.verifier)} &bull; \${escapeHtml(ct.time)}</p>
            </div>
          </div>
          <span style="font-size:11px; font-weight:700; color:#008a3e; background:rgba(0,138,62,0.1); padding:3px 10px; border-radius:6px; border:1px solid rgba(0,138,62,0.2);">\${escapeHtml(ct.badge)}</span>
        \`;
        completedContainer.appendChild(row);
      });
    }
  }

  function renderKanbanBoard(allTasks) {
    const listDeck = document.getElementById('tasksListDeck');
    const boardDeck = document.getElementById('tasksBoardDeck');
    if (listDeck) listDeck.classList.add('hidden');
    if (boardDeck) boardDeck.classList.remove('hidden');

    const todoCol = document.getElementById('kanbanCardsTodo');
    const inProgCol = document.getElementById('kanbanCardsInProgress');
    const compCol = document.getElementById('kanbanCardsCompleted');
    if (!todoCol || !inProgCol || !compCol) return;

    todoCol.replaceChildren();
    inProgCol.replaceChildren();
    compCol.replaceChildren();

    const todoTasks = allTasks.filter(t => t.status === 'ASSIGNED' || t.status === 'TODO' || t.status === 'NEW');
    const inProgTasks = allTasks.filter(t => t.status === 'REACHED' || t.status === 'IN_PROGRESS' || t.status === 'REVIEW');
    const compTasks = allTasks.filter(t => t.status === 'COMPLETED' || t.status === 'ACCOMPLISHED');

    safeSetText(document.getElementById('kanbanTodoCount'), String(todoTasks.length));
    safeSetText(document.getElementById('kanbanInProgressCount'), String(inProgTasks.length));
    safeSetText(document.getElementById('kanbanCompletedCount'), String(compTasks.length));

    function createKanbanCard(task) {
      const card = document.createElement('div');
      card.className = 'kanban-card';
      const safeTitle = escapeHtml(task.title || 'Sprint Task');
      const safeCode = escapeHtml(task.code || 'TASK-4892');
      const safeDue = escapeHtml(task.dueAt || 'Today');
      const safeAssignee = escapeHtml(task.assigneeName || 'Team');
      const priorityClass = (task.priority === 'HIGH' || task.priority === 'CRITICAL') ? 'p-high' : (task.priority === 'MEDIUM' ? 'p-med' : 'p-low');

      card.innerHTML = \`
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <span style="font-size:10px; font-weight:800; color:var(--text-muted);">\${safeCode}</span>
          <span class="task-p-badge \${priorityClass}" style="font-size:9px; padding:1px 6px;">\${escapeHtml(task.priority || 'NORMAL')}</span>
        </div>
        <div style="font-size:12.5px; font-weight:700; color:var(--text-white); margin-bottom:8px;">\${safeTitle}</div>
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:10.5px; color:var(--text-muted); border-top:1px solid var(--card-border); padding-top:6px;">
          <span>👤 \${safeAssignee.slice(0, 16)}</span>
          <span>⏰ \${safeDue}</span>
        </div>
      \`;

      card.addEventListener('click', () => {
        state.activeSelectedTask = task;
        openEditTaskModal(task);
      });
      return card;
    }

    todoTasks.forEach(t => todoCol.appendChild(createKanbanCard(t)));
    inProgTasks.forEach(t => inProgCol.appendChild(createKanbanCard(t)));
    compTasks.forEach(t => compCol.appendChild(createKanbanCard(t)));

    if (todoTasks.length === 0) {
      todoCol.innerHTML = '<div style="padding:16px; text-align:center; font-size:11px; color:var(--text-muted);">No tasks in backlog</div>';
    }
    if (inProgTasks.length === 0) {
      inProgCol.innerHTML = '<div style="padding:16px; text-align:center; font-size:11px; color:var(--text-muted);">No active tasks</div>';
    }
    if (compTasks.length === 0) {
      compCol.innerHTML = '<div style="padding:16px; text-align:center; font-size:11px; color:var(--text-muted);">No completed tasks yet</div>';
    }
  }
\n`;

// 3. Replace EDIT TASK MODAL block
const editModalStart = '  function ensureEditTaskModal() {';
const editModalEnd = '  function openTaskActivityModal(task) {';
const startIdx2 = js.indexOf(editModalStart);
const endIdx2 = js.indexOf(editModalEnd, startIdx2);

if (startIdx2 === -1 || endIdx2 === -1) {
  throw new Error('Could not locate EDIT TASK MODAL block');
}

const newEditModalBlock = `  function ensureEditTaskModal() {
    const modal = document.getElementById('editTaskModal');
    if (modal) {
      document.getElementById('btnCloseEditTask')?.addEventListener('click', closeEditTaskModal);
      document.getElementById('btnCancelEditTask')?.addEventListener('click', closeEditTaskModal);
      document.getElementById('editTaskBackdrop')?.addEventListener('click', closeEditTaskModal);
      return modal;
    }
    return null;
  }

  function openCreateTaskModal() {
    const modal = ensureEditTaskModal();
    if (!modal) return;

    safeSetText(document.getElementById('editTaskModalTitle'), 'CREATE NEW SPRINT TASK');

    const idInput = document.getElementById('editTaskId');
    const titleInput = document.getElementById('editTaskTitle');
    const assigneeSelect = document.getElementById('editTaskAssignee');
    const prioritySelect = document.getElementById('editTaskPriority');
    const statusSelect = document.getElementById('editTaskStatus');
    const dueInput = document.getElementById('editTaskDue');
    const dateInput = document.getElementById('editTaskDate');
    const descInput = document.getElementById('editTaskDesc');

    if (idInput) idInput.value = 'new_' + Date.now();
    if (titleInput) titleInput.value = '';

    if (assigneeSelect) {
      assigneeSelect.replaceChildren();
      const optAll = document.createElement('option');
      optAll.value = 'ALL';
      optAll.dataset.name = 'Entire Team';
      optAll.textContent = 'Entire Team (ALL)';
      assigneeSelect.appendChild(optAll);

      getUniqueMembersList().forEach(m => {
        const opt = document.createElement('option');
        const safeMId = m.id || m.uid || 'RD-EMP';
        const safeMName = m.displayName || m.name || (m.email ? m.email.split('@')[0] : 'Team Member');
        opt.value = safeMId;
        opt.dataset.name = safeMName;
        opt.dataset.email = m.email || '';
        opt.dataset.uid = m.uid || '';
        opt.textContent = \`\${safeMName} [\${safeMId}]\`;
        assigneeSelect.appendChild(opt);
      });
      assigneeSelect.value = state.currentMemberId || 'ALL';
    }

    if (prioritySelect) prioritySelect.value = 'HIGH';
    if (statusSelect) statusSelect.value = 'REACHED';
    if (dueInput) dueInput.value = 'Today, 5:00 PM';
    if (dateInput) dateInput.value = formatTimestampForDateInput(Date.now());
    if (descInput) descInput.value = '';

    modal.classList.remove('hidden');
    setTimeout(() => titleInput?.focus(), 60);
  }

  function openEditTaskModal(task, focusField = 'title') {
    if (!task) return;
    state.activeSelectedTask = task;
    const modal = ensureEditTaskModal();
    if (!modal) return;

    safeSetText(document.getElementById('editTaskModalTitle'), \`EDIT TASK: \${task.title || 'Task'}\`);

    const idInput = document.getElementById('editTaskId');
    const titleInput = document.getElementById('editTaskTitle');
    const assigneeSelect = document.getElementById('editTaskAssignee');
    const prioritySelect = document.getElementById('editTaskPriority');
    const statusSelect = document.getElementById('editTaskStatus');
    const dueInput = document.getElementById('editTaskDue');
    const dateInput = document.getElementById('editTaskDate');
    const descInput = document.getElementById('editTaskDesc');

    if (idInput) idInput.value = task.id || '';
    if (titleInput) titleInput.value = task.title || '';

    // Populate assignee dropdown
    if (assigneeSelect) {
      assigneeSelect.replaceChildren();
      const optAll = document.createElement('option');
      optAll.value = 'ALL';
      optAll.dataset.name = 'Entire Team';
      optAll.textContent = 'Entire Team (ALL)';
      assigneeSelect.appendChild(optAll);

      getUniqueMembersList().forEach(m => {
        const opt = document.createElement('option');
        const safeMId = m.id || m.uid || 'RD-EMP';
        const safeMName = m.displayName || m.name || (m.email ? m.email.split('@')[0] : 'Team Member');
        opt.value = safeMId;
        opt.dataset.name = safeMName;
        opt.dataset.email = m.email || '';
        opt.dataset.uid = m.uid || '';
        opt.textContent = \`\${safeMName} [\${safeMId}]\`;
        assigneeSelect.appendChild(opt);
      });

      assigneeSelect.value = task.assigneeId || 'ALL';
      if (!assigneeSelect.value) assigneeSelect.value = 'ALL';
    }

    if (prioritySelect) prioritySelect.value = task.priority || 'NORMAL';
    if (statusSelect) {
      statusSelect.value = task.status === 'COMPLETED' ? 'ACCOMPLISHED' : (task.status || 'REACHED');
    }
    if (dueInput) dueInput.value = task.dueAt || '';
    if (dateInput) {
      dateInput.value = formatTimestampForDateInput(task.createdAt || task.taskDate || Date.now());
    }
    if (descInput) descInput.value = task.description || '';

    modal.classList.remove('hidden');
    setTimeout(() => {
      if (focusField === 'date' && dateInput) {
        dateInput.focus();
        try { dateInput.showPicker?.(); } catch (_) {}
      } else if (focusField === 'due' && dueInput) {
        dueInput.focus();
        dueInput.select();
      } else if (focusField === 'assignee' && assigneeSelect) {
        assigneeSelect.focus();
      } else {
        titleInput?.focus();
      }
    }, 60);
  }

  function closeEditTaskModal() {
    const modal = document.getElementById('editTaskModal');
    if (modal) modal.classList.add('hidden');
  }
\n`;

// 4. Replace FORM EDIT TASK submit listener block
const formEditStart = "document.getElementById('formEditTask')?.addEventListener('submit'";
const formEditEnd = "    // --- TEAMS CHANNEL HUB TABS ---";
const startIdx3 = js.indexOf(formEditStart);
const endIdx3 = js.indexOf(formEditEnd, startIdx3);

if (startIdx3 === -1 || endIdx3 === -1) {
  throw new Error('Could not locate FORM EDIT TASK block');
}

const newFormEditBlock = `document.getElementById('editTaskBackdrop')?.addEventListener('click', closeEditTaskModal);
    document.getElementById('btnCloseEditTask')?.addEventListener('click', closeEditTaskModal);
    document.getElementById('btnCancelEditTask')?.addEventListener('click', closeEditTaskModal);

    document.getElementById('formEditTask')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const taskId = document.getElementById('editTaskId')?.value;
      const title = document.getElementById('editTaskTitle')?.value.trim();
      if (!title) {
        showQuickToast('Please provide a task title', 'error');
        return;
      }

      const selectEl = document.getElementById('editTaskAssignee');
      const rawVal = selectEl?.value || 'ALL';

      let assigneeId = rawVal;
      let assigneeName = 'Entire Team';
      let assigneeEmail = '';
      let assigneeUid = '';

      if (rawVal !== 'ALL') {
        const member = getUniqueMembersList().find(m => m.id === rawVal || m.uid === rawVal || m.email === rawVal);
        if (member) {
          assigneeId = member.id || rawVal;
          assigneeName = member.displayName || member.name || rawVal;
          assigneeEmail = member.email || '';
          assigneeUid = member.uid || '';
        } else {
          const opt = selectEl?.selectedOptions ? selectEl.selectedOptions[0] : null;
          assigneeName = opt?.dataset?.name || rawVal;
          assigneeEmail = opt?.dataset?.email || '';
          assigneeUid = opt?.dataset?.uid || '';
        }
      }

      const priority = document.getElementById('editTaskPriority')?.value || 'NORMAL';
      const rawStatus = document.getElementById('editTaskStatus')?.value || 'REACHED';
      const status = rawStatus === 'ACCOMPLISHED' ? 'COMPLETED' : rawStatus;
      const dueAt = document.getElementById('editTaskDue')?.value.trim() || 'Today 5:00 PM';
      const rawDate = document.getElementById('editTaskDate')?.value;
      const description = document.getElementById('editTaskDesc')?.value.trim();
      const editorName = WorkspaceDB.data.members[state.currentMemberId]?.name || state.currentUser?.displayName || 'JAGADISH K';

      let task = (WorkspaceDB.data.tasks || []).find(t => t.id === taskId);

      if (!task || !taskId || taskId.startsWith('new_')) {
        // Create brand new task
        const newTimestamp = rawDate ? parseDateInputToTimestamp(rawDate) : Date.now();
        const newTask = {
          id: 'task_' + Date.now(),
          code: 'TASK-' + (Math.floor(1000 + Math.random() * 9000)),
          title,
          category: 'CORE ARCHITECTURE',
          pipeline: 'feat/sprint-14',
          priority,
          status,
          dueAt,
          assigneeId,
          assigneeName,
          assigneeEmail,
          assigneeUid,
          description,
          scope: description || 'Execute sprint workstation objectives aligned with Reddot engineering standards.',
          subtasks: [
            { label: 'Initial specification & architectural verification', done: false },
            { label: 'Implementation pass & test coverage', done: false },
            { label: 'Security attestation & code review', done: false }
          ],
          createdAt: newTimestamp,
          taskDate: rawDate || formatTimestampForDateInput(newTimestamp),
          updatedAt: Date.now(),
          activity: [{
            authorName: editorName,
            text: \`Created new sprint task: \${title}\`,
            timestamp: Date.now()
          }]
        };

        if (!WorkspaceDB.data.tasks) WorkspaceDB.data.tasks = [];
        WorkspaceDB.data.tasks.unshift(newTask);
        state.activeSelectedTask = newTask;

        await WorkspaceDB.save();

        if (window.FirebaseService?.createTask) {
          FirebaseService.createTask(newTask).catch(() => {});
        }

        closeEditTaskModal();
        renderTasks();
        playNotificationChirp(true);
        showQuickToast(\`New sprint task "\${title}" created successfully!\`, 'success');
      } else {
        // Update existing task
        let newTimestamp = task.createdAt || Date.now();
        if (rawDate) {
          newTimestamp = parseDateInputToTimestamp(rawDate, task.createdAt);
        }

        task.title = title;
        task.description = description;
        task.assigneeId = assigneeId;
        task.assigneeName = assigneeName;
        task.assigneeEmail = assigneeEmail;
        task.assigneeUid = assigneeUid;
        task.priority = priority;
        task.status = status;
        task.dueAt = dueAt;
        task.createdAt = newTimestamp;
        task.taskDate = rawDate || formatTimestampForDateInput(newTimestamp);
        task.updatedAt = Date.now();

        if (!task.activity) task.activity = [];
        task.activity.push({
          authorName: editorName,
          text: \`Updated task details: \${title} (\${status})\`,
          timestamp: Date.now()
        });

        await WorkspaceDB.save();

        if (window.FirebaseService?.updateTask) {
          FirebaseService.updateTask(task.id, {
            title,
            description,
            assigneeId,
            assigneeName,
            assigneeEmail,
            assigneeUid,
            priority,
            status,
            dueAt,
            createdAt: newTimestamp,
            taskDate: task.taskDate,
            updatedAt: Date.now()
          }).catch(() => {});
        }

        closeEditTaskModal();
        state.activeSelectedTask = task;
        renderTasks();
        playNotificationChirp(true);
        showQuickToast(\`Task "\${title}" updated successfully!\`, 'success');
      }
    });\n\n`;

// 5. Replace OPEN TASK DRAWER block
const openDrawerStart = '  function openTaskDrawer(task) {';
const openDrawerEnd = '  // --- DUAL THEME ENGINE ---';
const startIdx4 = js.indexOf(openDrawerStart);
const endIdx4 = js.indexOf(openDrawerEnd, startIdx4);

if (startIdx4 === -1 || endIdx4 === -1) {
  throw new Error('Could not locate OPEN TASK DRAWER block');
}

const newOpenDrawerBlock = `  function openTaskDrawer(task) {
    if (!task) return;
    state.activeSelectedTask = task;
    const drawer = document.getElementById('taskDetailDrawer');
    if (!drawer) return;

    const taskCodeEl = document.getElementById('drawerTaskCode');
    if (taskCodeEl) taskCodeEl.textContent = \`\${task.code || 'TASK-4892'} • Sprint 14 Node\`;
    const titleEl = document.getElementById('drawerTaskTitle');
    if (titleEl) titleEl.textContent = task.title || 'Task Details';
    const pipeEl = document.getElementById('drawerBranchPipeline');
    if (pipeEl) pipeEl.textContent = task.pipeline || 'feat/carbon-v4';
    const engEl = document.getElementById('drawerLeadEngineer');
    if (engEl) engEl.textContent = task.engineer || task.assigneeName || 'Jagadish K (Founder)';
    const timeEl = document.getElementById('drawerSprintTimeline');
    if (timeEl) timeEl.textContent = task.dueAt ? \`• \${task.dueAt}\` : (task.timeline || '• Due Today, 17:00');
    const scopeEl = document.getElementById('drawerScopeText');
    if (scopeEl) scopeEl.textContent = task.scope || task.description || 'Refine the high-density workstation UI. Replace bulky UI matrices with clean micro-cards, zero decorative clutter, and absolute typographic rhythm aligned strictly with IBM Carbon principles.';

    const subtasks = task.subtasks || [
      { label: 'Audit color tokens against contrast threshold', done: true },
      { label: 'Draft high-contrast typography hierarchy', done: true },
      { label: 'Implement task card hover micro-animations', done: true },
      { label: 'Conduct keyboard navigation and screen-reader pass', done: false }
    ];

    const doneCount = subtasks.filter(s => s.done).length;
    const totalCount = subtasks.length;
    const percent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

    const doneText = document.getElementById('drawerSubtasksDoneText');
    if (doneText) doneText.textContent = \`\${doneCount}/\${totalCount} DONE\`;
    const percentText = document.getElementById('drawerSubtasksPercentText');
    if (percentText) percentText.textContent = \`\${percent}% Complete\`;

    const checklist = document.getElementById('drawerSubtasksChecklist');
    if (checklist) {
      checklist.replaceChildren();
      subtasks.forEach(st => {
        const item = document.createElement('div');
        item.className = \`subtask-check-row \${st.done ? 'done' : ''}\`;
        item.innerHTML = \`<div class="subtask-checkbox">\${st.done ? '✓' : ''}</div><span>\${escapeHtml(st.label)}</span>\`;
        item.addEventListener('click', async () => {
          st.done = !st.done;
          await WorkspaceDB.save();
          openTaskDrawer(task);
          renderTasks();
          playNotificationChirp(true);
        });
        checklist.appendChild(item);
      });
    }

    // Prototype preview
    const protoImg = document.getElementById('drawerPrototypeImg');
    const protoFilename = document.getElementById('drawerPrototypeFilename');
    if (protoImg) {
      protoImg.src = task.prototypeImg || 'assets/id-card.png';
      protoImg.style.display = 'block';
    }
    if (protoFilename) {
      protoFilename.textContent = task.prototypeFilename || (task.code ? \`\${task.code.toLowerCase()}-spec.fig\` : 'carbon-v4-spec-draft.fig');
    }

    drawer.style.display = 'flex';
  }
\n`;

// 6. Replace BIND V3 LISTENERS block
const bindV3Start = '  function bindV3EventListeners() {';
const bindV3End = '  // --- ENTERPRISE BOOTLOADER ANIMATION ---';
const startIdx5 = js.indexOf(bindV3Start);
const endIdx5 = js.indexOf(bindV3End, startIdx5);

if (startIdx5 === -1 || endIdx5 === -1) {
  throw new Error('Could not locate BIND V3 LISTENERS block');
}

const newBindV3Block = `  function bindV3EventListeners() {
    // Navigation Rail
    document.getElementById('tabBtnDashboard')?.addEventListener('click', () => switchTab('dashboard'));

    // Dashboard Quick Action Buttons
    document.getElementById('dashBtnLogShift')?.addEventListener('click', () => switchTab('timesheets'));
    document.getElementById('dashBtnNewTask')?.addEventListener('click', () => {
      switchTab('tasks');
      openCreateTaskModal();
    });
    document.getElementById('dashBtnBreak')?.addEventListener('click', () => {
      document.getElementById('btnPersonalBreak')?.click();
    });
    document.getElementById('dashBtnClockOut')?.addEventListener('click', () => {
      document.getElementById('btnPersonalClockOut')?.click();
    });
    document.getElementById('dashBtnViewFullAudit')?.addEventListener('click', () => switchTab('timesheets'));

    // Dashboard Quick Tool Cards
    document.getElementById('dashToolStorage')?.addEventListener('click', () => switchTab('database'));
    document.getElementById('dashToolAudit')?.addEventListener('click', () => switchTab('timesheets'));
    document.getElementById('dashToolMeet')?.addEventListener('click', () => {
      switchTab('chat');
      document.getElementById('btnStartMeeting')?.click();
    });

    // Time & Shifts CSV Export
    document.getElementById('btnDownloadCsvAudit')?.addEventListener('click', exportAttendanceCsv);

    // Keyboard Shortcuts: F7 (Take Break), F8 (Clock Out)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'F7') {
        e.preventDefault();
        const btn = document.getElementById('btnPersonalBreak');
        if (btn && !btn.disabled) btn.click();
      } else if (e.key === 'F8') {
        e.preventDefault();
        const btn = document.getElementById('btnPersonalClockOut');
        if (btn && !btn.disabled) btn.click();
      }
    });

    // Task View Mode Toggle (List vs Board)
    const btnList = document.getElementById('btnTaskViewList');
    const btnBoard = document.getElementById('btnTaskViewBoard');

    btnList?.addEventListener('click', () => {
      state.taskViewMode = 'list';
      btnList.classList.add('active');
      btnBoard?.classList.remove('active');
      document.getElementById('tasksListDeck')?.classList.remove('hidden');
      document.getElementById('tasksBoardDeck')?.classList.add('hidden');
      renderTasks();
    });

    btnBoard?.addEventListener('click', () => {
      state.taskViewMode = 'board';
      btnBoard.classList.add('active');
      btnList?.classList.remove('active');
      document.getElementById('tasksListDeck')?.classList.add('hidden');
      document.getElementById('tasksBoardDeck')?.classList.remove('hidden');
      renderTasks();
    });

    // Tasks + Add Task Button
    document.getElementById('btnOpenCreateTaskModal')?.addEventListener('click', () => {
      openCreateTaskModal();
    });

    // Task Detail Drawer Buttons
    document.getElementById('btnDrawerClose')?.addEventListener('click', () => {
      const drawer = document.getElementById('taskDetailDrawer');
      if (drawer) drawer.style.display = 'none';
    });

    document.getElementById('btnDrawerExpand')?.addEventListener('click', () => {
      if (state.activeSelectedTask) {
        openEditTaskModal(state.activeSelectedTask);
      }
    });

    document.getElementById('btnDrawerReassign')?.addEventListener('click', () => {
      if (state.activeSelectedTask) {
        openEditTaskModal(state.activeSelectedTask, 'assignee');
      }
    });

    document.getElementById('btnDrawerReschedule')?.addEventListener('click', () => {
      if (state.activeSelectedTask) {
        openEditTaskModal(state.activeSelectedTask, 'due');
      }
    });

    document.getElementById('btnDrawerMarkComplete')?.addEventListener('click', async () => {
      if (!state.activeSelectedTask) return;
      state.activeSelectedTask.status = 'COMPLETED';
      state.activeSelectedTask.updatedAt = Date.now();
      await WorkspaceDB.save();

      if (window.FirebaseService?.updateTask) {
        FirebaseService.updateTask(state.activeSelectedTask.id, {
          status: 'COMPLETED',
          updatedAt: Date.now()
        }).catch(() => {});
      }

      playNotificationChirp(true);
      showQuickToast(\`Task "\${state.activeSelectedTask.title}" marked as complete!\`, 'success');
      renderTasks();
    });

    // Task Filter Toolbar Listeners
    document.getElementById('filterTaskInput')?.addEventListener('input', () => {
      renderTasks();
    });

    document.getElementById('taskFilterCategorySelect')?.addEventListener('change', () => {
      renderTasks();
    });

    document.getElementById('taskFilterAssigneeSelect')?.addEventListener('change', () => {
      renderTasks();
    });

    document.getElementById('taskFilterPrioritySelect')?.addEventListener('change', () => {
      renderTasks();
    });

    // Task Sort Button
    document.querySelector('.btn-sort-tasks')?.addEventListener('click', () => {
      state.taskSortMode = state.taskSortMode === 'priority' ? 'due' : 'priority';
      const sortBtn = document.querySelector('.btn-sort-tasks span');
      if (sortBtn) {
        sortBtn.textContent = state.taskSortMode === 'priority' ? '⇅ Sort by Priority' : '⇅ Sort by Due Date';
      }
      playNotificationChirp(true);
      showQuickToast(\`Tasks sorted by \${state.taskSortMode === 'priority' ? 'Priority (High to Low)' : 'Due Date'}.\`, 'info');
      renderTasks();
    });

    // Archive Review Button
    document.querySelector('.btn-archive-review')?.addEventListener('click', () => {
      playNotificationChirp(true);
      showQuickToast('Sprint 14 Archive: 22 completed tasks verified & locked to ledger.', 'info');
    });

    // Header Notification Bell & Dropdown
    const bellBtn = document.getElementById('btnNotificationBell');
    const notifDropdown = document.getElementById('headerNotificationDropdown');

    bellBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      notifDropdown?.classList.toggle('hidden');
    });

    document.getElementById('btnMarkAllNotifsRead')?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelectorAll('.notif-item-unread').forEach(item => item.classList.remove('notif-item-unread'));
      const badge = document.getElementById('headerNotifBadge');
      if (badge) {
        badge.textContent = '0';
        badge.style.display = 'none';
      }
      const titleSpan = notifDropdown?.querySelector('.notif-head span');
      if (titleSpan) titleSpan.textContent = 'SYSTEM NOTIFICATIONS (0)';
      playNotificationChirp(true);
      showQuickToast('All notifications marked as read.', 'info');
    });

    // Close notification dropdown when clicking anywhere outside
    window.addEventListener('click', (e) => {
      if (notifDropdown && !notifDropdown.classList.contains('hidden')) {
        if (!notifDropdown.contains(e.target) && e.target !== bellBtn && !bellBtn?.contains(e.target)) {
          notifDropdown.classList.add('hidden');
        }
      }
    });

    // Omnibox Header Trigger
    document.getElementById('topOmniboxSearchTrigger')?.addEventListener('click', () => {
      document.getElementById('globalOmniboxModal')?.classList.remove('hidden');
      document.getElementById('omniboxModalInput')?.focus();
    });
  }
\n`;

// Perform replacements in order of descending indices so earlier indices don't shift
const replacements = [
  { start: startIdx5, end: endIdx5, content: newBindV3Block },
  { start: startIdx4, end: endIdx4, content: newOpenDrawerBlock },
  { start: startIdx3, end: endIdx3, content: newFormEditBlock },
  { start: startIdx2, end: endIdx2, content: newEditModalBlock },
  { start: startIdx1, end: endIdx1, content: newTasksManagementBlock },
];

replacements.sort((a, b) => b.start - a.start);

for (const r of replacements) {
  js = js.slice(0, r.start) + r.content + js.slice(r.end);
}

// Test syntax with node vm
const vm = require('vm');
try {
  new vm.Script(js);
  console.log('✅ Syntax validation PASSED!');
} catch (err) {
  console.error('❌ Syntax error:', err);
  process.exit(1);
}

// Write to wallpaper-ui/wallpaper.js
fs.writeFileSync(uiJsPath, js, 'utf8');
console.log('✅ Successfully wrote updated wallpaper.js');
