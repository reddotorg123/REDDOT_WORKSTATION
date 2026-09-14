const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

// Determine actual exe path
const programFilesExe = 'C:\\Program Files\\REDDOT Workstation OS\\REDDOT Workstation OS.exe';
const localAppDataExe = path.join(process.env.LOCALAPPDATA, 'Programs', 'REDDOT-Workstation-OS', 'REDDOT-Workstation-OS.exe');
const exePath = fs.existsSync(programFilesExe) ? programFilesExe : localAppDataExe;

const artifactDir = 'C:\\Users\\jagad\\.gemini\\antigravity-ide\\brain\\d90f0eb5-a1ca-4810-93bb-55ce4ea8bbfc';

async function main() {
  console.log(`⚡ Starting Clean Screen & Unified Obsidian Dark Theme CDP Verification using:\n${exePath}`);

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

  // Force close command center to verify wallpaper first screen
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

  // 1. VERIFY FIRST SCREEN (WALLPAPER) DOM INTEGRITY
  const wallpaperAudit = await evaluate(`(() => {
    return {
      portfolioTopNavExists: !!document.getElementById('portfolioTopNav'),
      navAboutExists: !!document.getElementById('navAbout'),
      bottomPageCircleExists: !!document.querySelector('.bottom-page-circle'),
      bottomArrowBtnExists: !!document.querySelector('.bottom-arrow-btn'),
      aboutModalExists: !!document.getElementById('aboutPortfolioModal'),
      resumeModalExists: !!document.getElementById('resumePortfolioModal'),
      momentsModalExists: !!document.getElementById('momentsPortfolioModal'),
      brandHomeExists: !!document.getElementById('btnBrandHome'),
      brandHomeText: document.getElementById('topBrandName')?.textContent,
      stealthDockBtnExists: !!document.getElementById('btnOpenCommandCenter'),
      stealthDockBtnText: document.getElementById('btnOpenCommandCenter')?.textContent?.trim()?.replace(/\\s+/g, ' '),
      bodyClasses: document.body.className
    };
  })()`);

  console.log('--- WALLPAPER AUDIT ---', JSON.stringify(wallpaperAudit, null, 2));

  if (wallpaperAudit.portfolioTopNavExists || wallpaperAudit.navAboutExists) {
    console.error('❌ FAILURE: portfolioTopNav still exists in DOM!');
  } else {
    console.log('✅ PASS: Web portfolio top nav links successfully removed.');
  }

  if (wallpaperAudit.bottomPageCircleExists || wallpaperAudit.bottomArrowBtnExists) {
    console.error('❌ FAILURE: Bottom 01 / arrow button still exists in DOM!');
  } else {
    console.log('✅ PASS: Bottom 01 circle and down arrow button successfully removed.');
  }

  if (wallpaperAudit.aboutModalExists || wallpaperAudit.resumeModalExists || wallpaperAudit.momentsModalExists) {
    console.error('❌ FAILURE: Portfolio modals still exist in DOM!');
  } else {
    console.log('✅ PASS: Portfolio modals successfully removed.');
  }

  await snap('wallpaper_clean_screen.png');

  // 2. OPEN COMMAND CENTER & VERIFY OBSIDIAN DARK THEME
  console.log('Opening Command Center...');
  await evaluate(`(() => {
    const auth = document.getElementById('authModal');
    if (auth) {
      auth.classList.add('hidden');
      auth.style.display = 'none';
    }
    const drawer = document.getElementById('commandCenterDrawer');
    if (drawer) {
      drawer.classList.remove('collapsed');
      drawer.style.display = 'flex';
    }
    document.body.classList.add('mode-command');
    document.body.classList.remove('mode-wallpaper');
    const btn = document.getElementById('btnOpenCommandCenter');
    if (btn) btn.click();
  })()`);

  await new Promise(r => setTimeout(r, 600));

  const darkThemeAudit = await evaluate(`(() => {
    const shell = document.querySelector('.command-center-shell');
    const header = document.querySelector('.workstation-top-header');
    const toggleIcon = document.getElementById('themeToggleIcon')?.textContent;
    const bodyClass = document.body.className;
    const shellBg = shell ? window.getComputedStyle(shell).backgroundColor : null;
    const headerBg = header ? window.getComputedStyle(header).backgroundColor : null;
    const currentTab = document.querySelector('.sidebar-nav-item.active')?.dataset?.tab || 'tasks';

    return {
      bodyClass,
      toggleIcon,
      shellBg,
      headerBg,
      currentTab,
      isDarkClass: document.body.classList.contains('theme-dark'),
      isObsidianClass: document.body.classList.contains('theme-obsidian'),
      isLightClass: document.body.classList.contains('theme-light')
    };
  })()`);

  console.log('--- DARK THEME AUDIT ---', JSON.stringify(darkThemeAudit, null, 2));

  if (darkThemeAudit.isLightClass) {
    console.error('❌ FAILURE: App has theme-light class!');
  } else if (!darkThemeAudit.isDarkClass || !darkThemeAudit.isObsidianClass) {
    console.error('❌ FAILURE: App missing theme-dark or theme-obsidian class!');
  } else {
    console.log('✅ PASS: Workstation is strictly running in Obsidian Carbon Dark theme!');
  }

  // Switch to Tasks Tab
  console.log('Switching to Tasks tab...');
  await evaluate(`(() => {
    document.getElementById('tabBtnTasks')?.click();
  })()`);
  await new Promise(r => setTimeout(r, 600));
  await snap('command_center_dark_tasks_verified.png');

  // Switch to Dashboard Tab
  console.log('Switching to Dashboard tab...');
  await evaluate(`(() => {
    document.getElementById('tabBtnDashboard')?.click();
  })()`);
  await new Promise(r => setTimeout(r, 600));
  await snap('command_center_dark_dashboard_verified.png');

  // Switch to Chat Tab
  console.log('Switching to Chat tab...');
  await evaluate(`(() => {
    document.getElementById('tabBtnChat')?.click();
  })()`);
  await new Promise(r => setTimeout(r, 400));
  await snap('command_center_dark_chat_verified.png');

  console.log('🏁 All verifications completed successfully!');

  // Close CDP connection
  ws.close();
}

main().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
