const fs = require('fs');
let js = fs.readFileSync('wallpaper-ui/wallpaper.js', 'utf8');

function replaceExact(oldStr, newStr) {
  if (js.includes(oldStr)) {
    js = js.replace(oldStr, newStr);
    console.log(`Replaced: "${oldStr.substring(0, 40)}..."`);
  } else {
    console.warn(`NOT FOUND: "${oldStr.substring(0, 40)}..."`);
  }
}

// 1. Worker card details: replace sci-fi architecture / directives with real department & email
const oldWorkerDetails = `        <div class="node-arch-box">
          <div class="node-arch-label">
            <span>Target Architecture</span>
            <span class="node-arch-code">\${getMemberArchCode(member)}</span>
          </div>
          <div class="node-arch-val">\${safeDept}</div>
        </div>

        <div class="node-directive-box">
          <div class="node-directive-label">ACTIVE WORK DIRECTIVE</div>
          <div class="node-directive-text">\${escapeHtml(getMemberDirective(member))}</div>
        </div>`;

const newWorkerDetails = `        <div class="node-arch-box">
          <div class="node-arch-label">
            <span>Department</span>
          </div>
          <div class="node-arch-val">\${safeDept}</div>
        </div>

        <div class="node-directive-box">
          <div class="node-directive-label">EMAIL</div>
          <div class="node-directive-text" style="color: var(--text-secondary); font-size: 12.5px;">\${escapeHtml(member.email || 'No email provided')}</div>
        </div>`;

replaceExact(oldWorkerDetails, newWorkerDetails);

// 2. Completed task card tags and text
replaceExact(
  "const cat = ct.category || 'DELIVERABLE';",
  "const cat = ct.category || 'Task';"
);
replaceExact(
  "emptyNotice.textContent = 'No completed tasks yet. Completed deliverables will appear here.';",
  "emptyNotice.textContent = 'No completed tasks yet. Completed tasks will appear here.';"
);
replaceExact(
  "<p style=\"font-size:11.5px; color:var(--text-muted); margin:2px 0 0 0;\">Verified by \${escapeHtml(assignee)} &bull; \${escapeHtml(completedDate)}</p>",
  "<p style=\"font-size:11.5px; color:var(--text-muted); margin:2px 0 0 0;\">Completed by \${escapeHtml(assignee)} &bull; \${escapeHtml(completedDate)}</p>"
);
replaceExact(
  "<span style=\"font-size:11px; font-weight:700; color:#008a3e; background:rgba(0,138,62,0.1); padding:3px 10px; border-radius:6px; border:1px solid rgba(0,138,62,0.2);\">✓ Verified</span>",
  "<span style=\"font-size:11px; font-weight:700; color:#008a3e; background:rgba(0,138,62,0.1); padding:3px 10px; border-radius:6px; border:1px solid rgba(0,138,62,0.2);\">✓ Completed</span>"
);

// 3. Active task card category default
replaceExact(
  "const safeCategory = escapeHtml(task.category || 'CORE ARCHITECTURE');",
  "const safeCategory = escapeHtml(task.category || 'General');"
);
replaceExact(
  "<span class=\"task-p-badge \${priorityClass}\">\${safePriority} PRIORITY</span>",
  "<span class=\"task-p-badge \${priorityClass}\">\${safePriority} Priority</span>"
);

// 4. Task Drawer text
replaceExact(
  "taskCodeEl.textContent = `\${task.code || ('TASK-' + (task.id || '').slice(-4).toUpperCase())} • Active Sprint`;",
  "taskCodeEl.textContent = `\${task.code || ('TASK-' + (task.id || '').slice(-4).toUpperCase())} • In Progress`;"
);
replaceExact(
  "doneText.textContent = `\${doneCount}/\${totalCount} DONE`;",
  "doneText.textContent = `\${doneCount}/\${totalCount} Done`;"
);

// 5. Dashboard subtitles and friendly activity feed
replaceExact(
  "subEng.textContent = `\${breakCount} on scheduled break, \${offlineCount} offline`;",
  "subEng.textContent = `\${onlineCount} active, \${offlineCount} offline`;"
);
replaceExact(
  "subVelo.innerHTML = `↗ \${pct}% of sprint deliverables completed`;",
  "subVelo.innerHTML = `↗ \${pct}% of tasks completed`;"
);
replaceExact(
  "subVelo.textContent = 'No active sprint deliverables';",
  "subVelo.textContent = 'No active tasks';"
);
replaceExact(
  "pendingBadge.textContent = `\${pendingTasks.length} pending action\${pendingTasks.length === 1 ? '' : 's'}`;",
  "pendingBadge.textContent = `\${pendingTasks.length} pending`;"
);
replaceExact(
  "const categoryTag = task.category || 'WORKSTREAM';",
  "const categoryTag = task.category || 'General';"
);
replaceExact(
  "const actionName = p.action === 'CLOCK_IN' ? 'clocked in for active shift' : (p.action === 'BREAK' ? 'initiated scheduled break' : 'clocked out');",
  "const actionName = p.action === 'CLOCK_IN' ? 'started work shift' : (p.action === 'BREAK' ? 'took a break' : 'clocked out');"
);

fs.writeFileSync('wallpaper-ui/wallpaper.js', js, 'utf8');
console.log('✅ Updated wallpaper-ui/wallpaper.js successfully!');
