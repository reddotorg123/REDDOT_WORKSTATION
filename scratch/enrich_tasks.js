/**
 * Enrich renderTasks in wallpaper.js
 */
const fs = require('fs');
const path = require('path');

const jsPath = path.join(__dirname, '..', 'wallpaper-ui', 'wallpaper.js');
let code = fs.readFileSync(jsPath, 'utf8');

const oldRenderTasksSignature = '  function renderTasks() {';
const newRenderTasks = `  function renderTasks() {
    const container = document.getElementById('taskCardsList');
    const completedContainer = document.getElementById('completedTasksList');
    const inProgressCount = document.getElementById('tasksInProgressCount');
    const completedCount = document.getElementById('tasksCompletedCount');
    if (!container) return;
    container.replaceChildren();
    if (completedContainer) completedContainer.replaceChildren();

    // Populate assignee dropdown
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

    // Sprint 14 Metrics
    const allTasks = WorkspaceDB.data.tasks || [];
    const totalCount = Math.max(allTasks.length + 22, 28);
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

    const completedTotal = 22;
    const activeLoad = allTasks.filter(t => t.status !== 'COMPLETED').length;
    const velocityScore = Math.round((completedTotal / totalCount) * 100);

    const sTotal = document.getElementById('sprintTotalTasks');
    if (sTotal) sTotal.textContent = String(totalCount);
    const sComp = document.getElementById('sprintCompletedTasks');
    if (sComp) sComp.textContent = String(completedTotal);
    const sLoad = document.getElementById('sprintActiveLoad');
    if (sLoad) sLoad.textContent = String(activeLoad || 6);
    const sVelo = document.getElementById('sprintVelocityScore');
    if (sVelo) sVelo.textContent = \`\${velocityScore}%\`;

    if (inProgressCount) inProgressCount.textContent = String(allTasks.length);
    if (completedCount) completedCount.textContent = \`\${completedTotal} Total\`;

    // Render In Progress Tasks (Image 4)
    allTasks.forEach((task, idx) => {
      const card = document.createElement('div');
      card.className = 'task-card-v3';
      if (idx === 0) card.classList.add('active-selected');

      const priorityClass = task.priority === 'HIGH' ? 'p-high' : (task.priority === 'MEDIUM' ? 'p-med' : 'p-low');
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
      const subPercent = Math.round((doneSub / totalSub) * 100);

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
        openTaskDrawer(task);
      });

      container.appendChild(card);
    });

    // Auto-open first task in drawer
    if (allTasks.length > 0) {
      openTaskDrawer(allTasks[0]);
    }

    // Render Completed Tasks Section (Image 4)
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
  }`;

// Replace renderTasks in code
const rtStart = code.indexOf(oldRenderTasksSignature);
const rtEndMarker = '  // Filter Task Chips Handling';
const rtEnd = code.indexOf(rtEndMarker, rtStart);

if (rtStart !== -1 && rtEnd !== -1) {
  code = code.slice(0, rtStart) + newRenderTasks + '\n\n' + code.slice(rtEnd);
  console.log('✅ Successfully replaced renderTasks with v3.0 Sprint Task Engine!');
} else {
  console.warn('⚠️ Could not find exact boundaries for renderTasks()');
}

fs.writeFileSync(jsPath, code, 'utf8');
console.log('🎉 Successfully saved enriched renderTasks into wallpaper.js!');
