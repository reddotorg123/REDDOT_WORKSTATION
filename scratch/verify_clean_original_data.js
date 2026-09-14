const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

// Determine actual exe path
const programFilesExe = 'C:\\Program Files\\REDDOT Workstation OS\\REDDOT Workstation OS.exe';
const localAppDataExe = path.join(process.env.LOCALAPPDATA, 'Programs', 'REDDOT-Workstation-OS', 'REDDOT-Workstation-OS.exe');
const exePath = fs.existsSync(programFilesExe) ? programFilesExe : localAppDataExe;

const artifactDir = 'C:\\Users\\jagad\\.gemini\\antigravity-ide\\brain\\d90f0eb5-a1ca-4810-93bb-55ce4ea8bbfc';

async function main() {
  console.log(`⚡ Starting Clean Original Data CDP Verification using:\n${exePath}`);

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
    const nameEl = document.querySelector('.badge-title') || document.querySelector('.founder-name');
    const dockBtn = document.getElementById('btnOpenCommandCenter');
    return {
      wallpaperRootExists: !!document.getElementById('wallpaperRoot'),
      badgeExists: !!badge,
      dockBtnExists: !!dockBtn,
      dockBtnText: dockBtn?.textContent?.trim()?.replace(/\\s+/g, ' ')
    };
  })()`);
  console.log('Wallpaper Audit:', JSON.stringify(wallpaperAudit, null, 2));
  await snap('clean_data_wallpaper_screen.png');

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

  // --- 3. AUDIT DASHBOARD DATA ---
  console.log('Switching to Dashboard and auditing data...');
  await evaluate(`(() => {
    if (window.switchTab) window.switchTab('dashboard');
    else document.getElementById('tabBtnDashboard')?.click();
  })()`);
  await new Promise(r => setTimeout(r, 800));

  const dashboardAudit = await evaluate(`(() => {
    const engineersVal = document.getElementById('dashValEngineersCount')?.textContent?.trim();
    const shiftTime = document.getElementById('dashShiftTime')?.textContent?.trim();
    const weeklyLoad = document.getElementById('dashWeeklyLoad')?.textContent?.trim();
    const sprintDone = document.getElementById('dashSprintDoneCount')?.textContent?.trim();
    const objectivesList = document.getElementById('dashObjectivesList')?.innerText?.trim();
    const activityStream = document.getElementById('dashActivityStream')?.innerText?.trim();
    const notifBadge = document.getElementById('dashNotificationCount')?.textContent?.trim();
    const notifDisplay = document.getElementById('dashNotificationCount')?.style?.display;

    // Check for fake names in DOM
    const bodyText = document.body.innerText;
    const fakeNamesFound = ['Elena Rostova', 'Marcus Chen', 'Alex Rivera', 'RSA-4096', 'Zero-Surveillance'].filter(f => bodyText.includes(f));

    return {
      engineersVal,
      shiftTime,
      weeklyLoad,
      sprintDone,
      objectivesSnippet: objectivesList?.substring(0, 200),
      activitySnippet: activityStream?.substring(0, 200),
      notifBadge,
      notifDisplay,
      fakeNamesFound
    };
  })()`);
  console.log('--- DASHBOARD AUDIT ---', JSON.stringify(dashboardAudit, null, 2));
  await snap('clean_data_dashboard.png');

  // --- 4. AUDIT TASKS DATA ---
  console.log('Switching to Tasks and auditing data...');
  await evaluate(`(() => {
    if (window.switchTab) window.switchTab('tasks');
    else document.getElementById('tabBtnTasks')?.click();
  })()`);
  await new Promise(r => setTimeout(r, 800));

  const tasksAudit = await evaluate(`(() => {
    const sprintTotal = document.getElementById('sprintTotalTasksCount')?.textContent?.trim();
    const sprintVelocity = document.getElementById('sprintVelocityScore')?.textContent?.trim();
    const sprintLoads = document.getElementById('sprintActiveLoadsCount')?.textContent?.trim();
    const completedItems = Array.from(document.querySelectorAll('#completedTasksList .task-card, #completedTasksList .completed-task-row, #completedTasksList > div')).map(el => el.innerText.trim().replace(/\\n/g, ' '));
    const activeTasks = Array.from(document.querySelectorAll('#tasksListContainer .task-card, #tasksListContainer > div')).map(el => el.innerText.trim().replace(/\\n/g, ' '));

    return {
      sprintTotal,
      sprintVelocity,
      sprintLoads,
      completedCount: completedItems.length,
      completedItemsSample: completedItems.slice(0, 5),
      activeTasksSample: activeTasks.slice(0, 5)
    };
  })()`);
  console.log('--- TASKS AUDIT ---', JSON.stringify(tasksAudit, null, 2));
  await snap('clean_data_tasks.png');

  // --- 5. AUDIT WORKERS DATA ---
  console.log('Switching to Workers and auditing data...');
  await evaluate(`(() => {
    if (window.switchTab) window.switchTab('workers');
    else document.getElementById('tabBtnWorkers')?.click();
  })()`);
  await new Promise(r => setTimeout(r, 800));

  const workersAudit = await evaluate(`(() => {
    const activeNodesText = document.getElementById('activeNodesCount')?.textContent?.trim();
    const workerCards = Array.from(document.querySelectorAll('#workersListGrid .worker-card, #workersListGrid > div, .member-node-card')).map(el => {
      const name = el.querySelector('.worker-name, .member-name, h4, h3')?.textContent?.trim();
      const role = el.querySelector('.worker-role, .member-role, p')?.textContent?.trim();
      return { name, role };
    });

    return {
      activeNodesText,
      workerCards
    };
  })()`);
  console.log('--- WORKERS AUDIT ---', JSON.stringify(workersAudit, null, 2));
  await snap('clean_data_workers.png');

  // --- 6. AUDIT TIMESHEETS / ATTENDANCE DATA ---
  console.log('Switching to Attendance/Timesheets and auditing data...');
  await evaluate(`(() => {
    document.getElementById('tabBtnTimesheets')?.click();
  })()`);
  await new Promise(r => setTimeout(r, 800));

  const attendanceAudit = await evaluate(`(() => {
    const weeklyLoad = document.getElementById('weeklyLoadHours')?.textContent?.trim();
    const dailyMean = document.getElementById('dailyMeanHours')?.textContent?.trim();
    const shiftTimer = document.getElementById('personalShiftTimer')?.textContent?.trim();
    const punchRows = Array.from(document.querySelectorAll('#punchLogTableBody tr')).map(tr => {
      const cells = Array.from(tr.querySelectorAll('td')).map(td => td.textContent.trim().replace(/\\s+/g, ' '));
      return cells;
    });

    return {
      weeklyLoad,
      dailyMean,
      shiftTimer,
      punchRowsCount: punchRows.length,
      punchRowsSample: punchRows.slice(0, 5)
    };
  })()`);
  console.log('--- ATTENDANCE AUDIT ---', JSON.stringify(attendanceAudit, null, 2));
  await snap('clean_data_timesheets.png');

  console.log('🏁 Verification finished successfully!');
  ws.close();
}

main().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});

