const fs = require('fs');
let s = fs.readFileSync('wallpaper-ui/index.html', 'utf8');

// 1. Tasks title & filters
s = s.replace(
  '<h2 class="sprint-page-title">Tasks &amp; Sprint Management</h2>',
  '<h2 class="sprint-page-title">Tasks</h2>'
);
s = s.replace(
  '<h2 class="sprint-page-title">Tasks & Sprint Management</h2>',
  '<h2 class="sprint-page-title">Tasks</h2>'
);
s = s.replace(
  '<option value="ALL">Category: All Modules</option>',
  '<option value="ALL">All Categories</option>'
);
s = s.replace(
  '<option value="ALL">All Modules</option>',
  '<option value="ALL">All Categories</option>'
);
s = s.replace(
  '<option value="HIGH_FIRST">Priority: High to Low</option>',
  '<option value="HIGH_FIRST">Priority: High to Low</option>'
);
s = s.replace(
  'COMPLETED THIS WEEK',
  'Completed Tasks'
);

// 2. Team 3rd card & filter pills
s = s.replace(
  'Provision New Node Member',
  'Add Team Member'
);
s = s.replace(
  'Assign telemetry roles, cluster authorization & directives.',
  'Invite or register a new team member to your workspace.'
);
s = s.replace(
  'Assign telemetry roles, cluster authorization &amp; directives.',
  'Invite or register a new team member to your workspace.'
);
s = s.replace(
  '<button type="button" class="dept-pill" data-dept="Core Runtime">Core Runtime</button>',
  '<button type="button" class="dept-pill" data-dept="Engineering">Engineering</button>'
);
s = s.replace(
  '<button type="button" class="dept-pill" data-dept="SecOps">SecOps</button>',
  '<button type="button" class="dept-pill" data-dept="Operations">Operations</button>'
);

// 3. Wallpaper mode button text
s = s.replace(
  /&hellip;\s*Wallpaper Mode\s*\[Esc\]/g,
  'Back to Desktop [Esc]'
);
s = s.replace(
  /\.\.\.\s*Wallpaper Mode\s*\[Esc\]/g,
  'Back to Desktop [Esc]'
);

// 4. Check CPU Allocation widget in sidebar
const cpuIdx = s.indexOf('sidebarCpuPercent');
if (cpuIdx !== -1) {
  const boxStart = s.lastIndexOf('<div class="sidebar-cpu-box">', cpuIdx);
  const boxEnd = s.indexOf('</div>', cpuIdx) + 6;
  const widgetEnd = s.indexOf('</div>', boxEnd) + 6;
  console.log('Replacing CPU box:', s.substring(boxStart, widgetEnd));
  s = s.substring(0, boxStart) +
    `<div class="sidebar-cpu-box">
              <div class="cpu-meta-row">
                <span class="cpu-label">System Status</span>
                <span class="cpu-val" style="color: #10b981;">Online</span>
              </div>
              <div class="cpu-bar-track">
                <div class="cpu-bar-fill" style="width: 100%; background: #10b981;"></div>
              </div>
            </div>` +
    s.substring(widgetEnd);
}

fs.writeFileSync('wallpaper-ui/index.html', s, 'utf8');
console.log('✅ Polished index.html!');
