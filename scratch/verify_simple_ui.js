const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

const programFilesExe = 'C:\\Program Files\\REDDOT Workstation OS\\REDDOT Workstation OS.exe';
const localAppDataExe = path.join(process.env.LOCALAPPDATA, 'Programs', 'REDDOT-Workstation-OS', 'REDDOT-Workstation-OS.exe');
const exePath = fs.existsSync(programFilesExe) ? programFilesExe : localAppDataExe;

const artifactDir = 'C:\\Users\\jagad\\.gemini\\antigravity-ide\\brain\\d90f0eb5-a1ca-4810-93bb-55ce4ea8bbfc';

async function main() {
  console.log(`⚡ Starting Simple & Friendly UI CDP Verification using:\n${exePath}`);

  // 1. Terminate any previous REDDOT processes cleanly
  try {
    execSync('powershell -Command "Stop-Process -Name \'*REDDOT*\' -Force -ErrorAction SilentlyContinue"');
  } catch (_) {}

  await new Promise(r => setTimeout(r, 1200));

  console.log('Launching executable with --remote-debugging-port=9222...');
  const child = spawn(exePath, ['--remote-debugging-port=9222'], {
    detached: true,
    stdio: 'ignore'
  });
  child.unref();

  let connected = false;
  let pageTarget = null;
  for (let i = 0; i < 35; i++) {
    await new Promise(r => setTimeout(r, 600));
    try {
      const resp = await fetch('http://127.0.0.1:9222/json');
      const targets = await resp.json();
      pageTarget = targets.find(t => t.type === 'page' && t.url && t.url.includes('index.html'));
      if (pageTarget) {
        connected = true;
        break;
      }
    } catch (e) {}
  }

  if (!connected) {
    console.error('❌ Failed to connect to CDP on port 9222!');
    process.exit(1);
  }

  console.log('✅ Connected to CDP target:', pageTarget.webSocketDebuggerUrl);
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let nextId = 1;
  function sendCommand(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = nextId++;
      const handler = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id === id) {
          ws.removeEventListener('message', handler);
          if (msg.error) reject(new Error(msg.error.message));
          else resolve(msg.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async function evaluate(expr) {
    const res = await sendCommand('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    return res.result?.value;
  }

  async function snap(filename) {
    const shot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    const targetPath = path.join(artifactDir, filename);
    fs.writeFileSync(targetPath, Buffer.from(shot.data, 'base64'));
    console.log(`📸 [SNAPSHOT] Saved: ${filename}`);
  }

  // Set standard 1920x1080 viewport
  await sendCommand('Emulation.setDeviceMetricsOverride', {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false
  });

  // Wait for boot screen dismissal
  console.log('Waiting for boot screen dismissal...');
  await new Promise(r => setTimeout(r, 2200));

  await evaluate(`(() => {
    const boot = document.getElementById('appBootScreen');
    if (boot) boot.style.display = 'none';
    try {
      localStorage.setItem('rd_auth_dismissed', '1');
      sessionStorage.setItem('rd_auth_prompted', '1');
    } catch (_) {}
    const auth = document.getElementById('authModal');
    if (auth) {
      auth.classList.add('hidden');
      auth.style.display = 'none';
    }
  })()`);

  // Ensure first screen mode
  await evaluate(`(() => {
    document.body.classList.add('mode-wallpaper');
    document.body.classList.remove('mode-command');
    const drawer = document.getElementById('commandCenterDrawer');
    if (drawer) {
      drawer.classList.add('collapsed');
      drawer.style.display = 'none';
    }
  })()`);

  await new Promise(r => setTimeout(r, 600));

  // --- 1. AUDIT FIRST SCREEN (WALLPAPER) ---
  console.log('Auditing First Screen (Wallpaper)...');
  const wallpaperAudit = await evaluate(`(() => {
    const badge = document.querySelector('.lanyard-card');
    const dockBtn = document.getElementById('btnOpenCommandCenter');
    return {
      wallpaperRootExists: !!document.getElementById('wallpaperRoot'),
      badgeExists: !!badge,
      dockBtnExists: !!dockBtn,
      dockBtnText: dockBtn?.textContent?.trim()?.replace(/\\s+/g, ' ')
    };
  })()`);
  console.log('Wallpaper Audit:', JSON.stringify(wallpaperAudit, null, 2));
  await snap('simple_wallpaper_screen.png');

  // --- 2. OPEN COMMAND CENTER ---
  console.log('Opening Command Center...');
  await evaluate(`(() => {
    const drawer = document.getElementById('commandCenterDrawer');
    if (drawer) {
      drawer.classList.remove('collapsed');
      drawer.style.display = 'flex';
    }
    document.body.classList.add('mode-command');
    document.body.classList.remove('mode-wallpaper');
  })()`);
  await new Promise(r => setTimeout(r, 600));

  // --- 3. AUDIT TASKS TAB ---
  console.log('Switching to Tasks and auditing simple terminology...');
  await evaluate(`(() => {
    document.getElementById('tabBtnTasks')?.click();
  })()`);
  await new Promise(r => setTimeout(r, 800));

  const tasksAudit = await evaluate(`(() => {
    const pageTitle = document.querySelector('#tabTasksView .sprint-page-title')?.textContent?.trim();
    const pageSub = document.querySelector('#tabTasksView .sprint-page-sub')?.textContent?.trim();
    const sprintTitle = document.querySelector('#tabTasksView .sprint-card-title')?.textContent?.trim();
    const statLabels = Array.from(document.querySelectorAll('#tabTasksView .sprint-stat-label')).map(el => el.textContent.trim());
    const drawerTitle = document.getElementById('drawerTaskTitle')?.textContent?.trim();
    const drawerMetaLabels = Array.from(document.querySelectorAll('.drawer-meta-label')).map(el => el.textContent.trim());

    return {
      pageTitle,
      pageSub,
      sprintTitle,
      statLabels,
      drawerTitle,
      drawerMetaLabels
    };
  })()`);
  console.log('--- TASKS AUDIT ---', JSON.stringify(tasksAudit, null, 2));
  await snap('simple_tasks_view.png');

  // --- 4. AUDIT DASHBOARD TAB ---
  console.log('Switching to Dashboard and auditing simple terminology...');
  await evaluate(`(() => {
    document.getElementById('tabBtnDashboard')?.click();
  })()`);
  await new Promise(r => setTimeout(r, 800));

  const dashboardAudit = await evaluate(`(() => {
    const badgeText = document.querySelector('.dash-exec-badge span:last-child')?.textContent?.trim();
    const metricTitles = Array.from(document.querySelectorAll('#tabDashboardView .metric-card-title')).map(el => el.textContent.trim());
    const objectivesTitle = document.querySelector('.dash-objectives-panel .dash-panel-title')?.textContent?.trim();
    const activityTitle = document.querySelector('.dash-activity-panel .dash-panel-title')?.textContent?.trim();
    const sessionTitle = document.querySelector('.session-hero-title')?.textContent?.trim();

    return {
      badgeText,
      metricTitles,
      objectivesTitle,
      activityTitle,
      sessionTitle
    };
  })()`);
  console.log('--- DASHBOARD AUDIT ---', JSON.stringify(dashboardAudit, null, 2));
  await snap('simple_dashboard_view.png');

  // --- 5. AUDIT TEAM TAB ---
  console.log('Switching to Team tab and auditing simple terminology...');
  await evaluate(`(() => {
    document.getElementById('tabBtnWorkers')?.click();
  })()`);
  await new Promise(r => setTimeout(r, 800));

  const teamAudit = await evaluate(`(() => {
    const title = document.querySelector('.personnel-title')?.textContent?.trim();
    const sub = document.querySelector('.personnel-sub')?.textContent?.trim();
    const onlineLabel = document.querySelector('.telemetry-label')?.textContent?.trim();
    const cards = Array.from(document.querySelectorAll('.node-member-card')).map(el => {
      const name = el.querySelector('.node-card-name')?.textContent?.trim();
      const role = el.querySelector('.node-card-role')?.textContent?.trim();
      const archLabel = el.querySelector('.node-arch-label span')?.textContent?.trim();
      const archVal = el.querySelector('.node-arch-val')?.textContent?.trim();
      const directiveLabel = el.querySelector('.node-directive-label')?.textContent?.trim();
      const directiveText = el.querySelector('.node-directive-text')?.textContent?.trim();
      return { name, role, archLabel, archVal, directiveLabel, directiveText };
    });

    return {
      title,
      sub,
      onlineLabel,
      cards
    };
  })()`);
  console.log('--- TEAM AUDIT ---', JSON.stringify(teamAudit, null, 2));
  await snap('simple_team_view.png');

  // --- 6. AUDIT ATTENDANCE TAB ---
  console.log('Switching to Attendance tab and auditing simple terminology...');
  await evaluate(`(() => {
    document.getElementById('tabBtnTimesheets')?.click();
  })()`);
  await new Promise(r => setTimeout(r, 800));

  const attendanceAudit = await evaluate(`(() => {
    const headerTag = document.querySelector('.shift-header-tag')?.textContent?.trim();
    const clockLabel = document.querySelector('.clock-unit-label')?.textContent?.trim();
    const kpiLabels = Array.from(document.querySelectorAll('.att-kpi-label')).map(el => el.textContent.trim());
    const tableTitle = document.querySelector('.punch-log-header-row .section-title')?.textContent?.trim();
    const tableSub = document.querySelector('.punch-log-header-row .section-sub')?.textContent?.trim();

    return {
      headerTag,
      clockLabel,
      kpiLabels,
      tableTitle,
      tableSub
    };
  })()`);
  console.log('--- ATTENDANCE AUDIT ---', JSON.stringify(attendanceAudit, null, 2));
  await snap('simple_attendance_view.png');

  // --- 7. CHECK FOR ANY REMAINING JARGON IN FULL DOM ---
  const jargonCheck = await evaluate(`(() => {
    const forbidden = [
      'autonomous cluster nodes',
      'personnel matrix sys.dir',
      'velocity score',
      'active load',
      'cryptographically signed',
      'bga signal integrity',
      'branch pipeline'
    ];
    const body = document.body.innerText.toLowerCase();
    const found = forbidden.filter(f => body.includes(f));
    return { foundForbiddenJargon: found };
  })()`);
  console.log('--- JARGON CHECK ---', JSON.stringify(jargonCheck, null, 2));

  console.log('🏁 Verification finished successfully!');
  ws.close();
}

main().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
