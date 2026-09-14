const fs = require('fs');
let s = fs.readFileSync('wallpaper-ui/index.html', 'utf8');

function rep(from, to) {
  if (s.includes(from)) {
    s = s.split(from).join(to);
    console.log(`Replaced: "${from.substring(0, 40)}..."`);
  } else {
    console.warn(`NOT FOUND: "${from.substring(0, 40)}..."`);
  }
}

// 1. Tasks subtitle
rep(
  'Manage ongoing sprints, verify deliverables, and orchestrate work pipelines across autonomous cluster nodes.',
  'Keep track of your team\'s tasks, assignments, and daily deliverables.'
);

// 2. Dashboard date and cluster
rep(
  '<p class="dash-exec-sub" id="dashDateCluster">Saturday, September 12, 2026 &bull; Production Cluster 04a</p>',
  '<p class="dash-exec-sub" id="dashDateCluster">Sunday, September 13, 2026 &bull; Reddot Workstation</p>'
);

// 3. Task drawer Branch Pipeline row -> hide it
rep(
  '<div class="drawer-meta-item">\n                    <span class="drawer-meta-label">Branch Pipeline:</span>\n                    <span class="drawer-meta-val link-val" id="drawerBranchPipeline">&#x2442; --</span>\n                  </div>',
  ''
);
// Also in case of CRLF
rep(
  '<div class="drawer-meta-item">\r\n                    <span class="drawer-meta-label">Branch Pipeline:</span>\r\n                    <span class="drawer-meta-val link-val" id="drawerBranchPipeline">&#x2442; --</span>\r\n                  </div>',
  ''
);

// 4. Task drawer scope text
rep(
  'Select a task from the sprint list to review its scope, requirements, and deliverables.',
  'Select a task from the list to view its description and checklist.'
);

// 5. Notification bell title
rep(
  'title="System Alerts &amp; Directives"',
  'title="Notifications"'
);
rep(
  'title="System Alerts & Directives"',
  'title="Notifications"'
);

// 6. Avg. Ping telemetry pill in workers header
rep(
  `<div class="telemetry-pill">
                  <span class="telemetry-label">Avg. Ping</span>
                  <span class="telemetry-val">14 <span class="telemetry-unit">ms</span></span>
                </div>`,
  ''
);
rep(
  `<div class="telemetry-pill">\r\n                  <span class="telemetry-label">Avg. Ping</span>\r\n                  <span class="telemetry-val">14 <span class="telemetry-unit">ms</span></span>\r\n                </div>`,
  ''
);

// 7. Dashboard velocity empty text
rep(
  'No active sprint deliverables',
  'No active tasks'
);

// 8. Pinned items description
rep(
  'Quick access to critical project directives, pinned notes, and bookmarks saved across team channels.',
  'Quick access to saved notes and important bookmarks.'
);

// 9. Meeting modal
rep(
  'placeholder="Key discussion points, deliverables, or agenda..."',
  'placeholder="Discussion points or agenda..."'
);

fs.writeFileSync('wallpaper-ui/index.html', s, 'utf8');
console.log('✅ Remaining jargon cleaned up in wallpaper-ui/index.html!');
