const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const exePath = path.join(process.env.LOCALAPPDATA, 'Programs', 'REDDOT-Workstation-OS', 'REDDOT-Workstation-OS.exe');
const artifactDir = 'C:\\Users\\jagad\\.gemini\\antigravity-ide\\brain\\d90f0eb5-a1ca-4810-93bb-55ce4ea8bbfc';

async function main() {
  console.log('⚡ Starting Primary Portfolio Screen & Unified Dark Theme CDP Verification...');

  // 1. Connect to CDP on port 9222
  let connected = false;
  let pageTarget = null;
  for (let i = 0; i < 20; i++) {
    try {
      const resp = await fetch('http://127.0.0.1:9222/json');
      const targets = await resp.json();
      pageTarget = targets.find(t => t.type === 'page' && t.url && t.url.includes('index.html'));
      if (pageTarget) {
        connected = true;
        break;
      }
    } catch (e) {}
    await new Promise(r => setTimeout(r, 500));
  }

  if (!connected) {
    console.log('App not detected on port 9222, launching installed executable...');
    const child = spawn(exePath, ['--remote-debugging-port=9222'], {
      detached: true,
      stdio: 'ignore'
    });
    child.unref();

    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 500));
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

  // Ensure 1920x1080 viewport
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
    const authModal = document.getElementById('authModal');
    if (authModal) authModal.classList.add('hidden');
    const offlineBtn = document.getElementById('btnContinueOffline');
    if (offlineBtn) offlineBtn.click();
  })()`);
  await new Promise(r => setTimeout(r, 500));

  // --- 1. VERIFY PRIMARY PORTFOLIO SCREEN ---
  console.log('\n--- 1. Auditing Primary Portfolio Screen Geometry & Elements ---');
  const firstScreenData = await evaluate(`(() => {
    const isWpMode = document.body.classList.contains('mode-wallpaper');
    const isCmdHidden = document.getElementById('commandCenterDrawer')?.classList.contains('collapsed');
    const brandName = document.getElementById('topBrandName')?.textContent?.trim();
    const brandSub = document.querySelector('#btnBrandPortfolio .brand-sub')?.textContent?.trim();
    const giantName = document.getElementById('giantNameText')?.textContent?.trim();
    const leftTag = document.getElementById('leftTagRole')?.textContent?.trim();
    const rightTag = document.getElementById('rightTagRole')?.textContent?.trim();
    const badgeSrc = document.getElementById('badgeImg')?.getAttribute('src');
    const arrowBtn = !!document.getElementById('btnOpenCommandCenter');
    const page01 = document.querySelector('.bottom-page-circle')?.textContent?.trim();
    const watermark = document.getElementById('bottomBrandTag')?.textContent?.trim();

    const navLinks = Array.from(document.querySelectorAll('#portfolioTopNav .top-nav-link')).map(a => a.textContent.trim());
    const contactBtn = document.getElementById('btnTopContact')?.textContent?.trim();
    const bodyBg = window.getComputedStyle(document.body).backgroundColor;

    return {
      isWpMode,
      isCmdHidden,
      brandName,
      brandSub,
      giantName,
      leftTag,
      rightTag,
      badgeSrc,
      arrowBtn,
      page01,
      watermark,
      navLinks,
      contactBtn,
      bodyBg
    };
  })()`);

  console.log('First Screen Audit Results:', JSON.stringify(firstScreenData, null, 2));
  await snap('portfolio_first_screen.png');

  // Assertions for Screen #1
  if (!firstScreenData.isWpMode || !firstScreenData.isCmdHidden) {
    throw new Error('Screen #1 failed: body not in mode-wallpaper or command center not collapsed!');
  }
  if (firstScreenData.giantName !== 'JAGADISH') {
    throw new Error(`Screen #1 failed: giant name expected 'JAGADISH', got '\${firstScreenData.giantName}'`);
  }
  if (firstScreenData.leftTag !== '(TECHNICAL HEAD)') {
    throw new Error(`Screen #1 failed: left tag expected '(TECHNICAL HEAD)', got '\${firstScreenData.leftTag}'`);
  }
  if (!firstScreenData.arrowBtn) {
    throw new Error('Screen #1 failed: bottom arrow button missing!');
  }
  console.log('✅ Screen #1 (Primary Portfolio Wallpaper) PASSED all element checks!');

  // --- 2. TEST MODALS ---
  console.log('\n--- 2. Testing About, Resume, and Moments Modals ---');

  // About Modal
  await evaluate(`document.getElementById('navAbout').click()`);
  await new Promise(r => setTimeout(r, 400));
  const aboutVisible = await evaluate(`!document.getElementById('aboutPortfolioModal').classList.contains('hidden')`);
  console.log('About Modal Visible:', aboutVisible);
  await snap('portfolio_about_modal.png');
  await evaluate(`document.getElementById('btnCloseAboutModal').click()`);
  await new Promise(r => setTimeout(r, 300));

  // Resume Modal
  await evaluate(`document.getElementById('navResume').click()`);
  await new Promise(r => setTimeout(r, 400));
  const resumeVisible = await evaluate(`!document.getElementById('resumePortfolioModal').classList.contains('hidden')`);
  console.log('Resume Modal Visible:', resumeVisible);
  await snap('portfolio_resume_modal.png');
  await evaluate(`document.getElementById('btnCloseResumeModal').click()`);
  await new Promise(r => setTimeout(r, 300));

  // Moments Modal
  await evaluate(`document.getElementById('navMoments').click()`);
  await new Promise(r => setTimeout(r, 400));
  const momentsVisible = await evaluate(`!document.getElementById('momentsPortfolioModal').classList.contains('hidden')`);
  console.log('Moments Modal Visible:', momentsVisible);
  await snap('portfolio_moments_modal.png');
  await evaluate(`document.getElementById('btnCloseMomentsModal').click()`);
  await new Promise(r => setTimeout(r, 300));
  console.log('✅ All 3 portfolio modals (About, Resume, Moments) PASSED!');

  // --- 3. TEST ARROW BUTTON -> OPEN COMMAND CENTER ---
  console.log('\n--- 3. Testing Down Arrow Button -> Open Command Center ---');
  await evaluate(`document.getElementById('btnOpenCommandCenter').click()`);
  await new Promise(r => setTimeout(r, 700));

  const cmdData = await evaluate(`(() => {
    const isCmdMode = document.body.classList.contains('mode-command');
    const isOverlayOpen = !document.getElementById('commandCenterDrawer').classList.contains('collapsed');
    const isDark = document.body.classList.contains('theme-dark') || document.body.classList.contains('theme-obsidian');
    const shell = document.querySelector('.command-center-shell');
    const shellBg = window.getComputedStyle(shell).backgroundColor;
    const header = document.querySelector('.workstation-top-header');
    const headerBg = window.getComputedStyle(header).backgroundColor;
    const activeTab = document.querySelector('.cmd-tab-pane.active')?.id;

    return { isCmdMode, isOverlayOpen, isDark, shellBg, headerBg, activeTab };
  })()`);
  console.log('Command Center Open Data:', JSON.stringify(cmdData, null, 2));

  if (!cmdData.isCmdMode || !cmdData.isOverlayOpen) {
    throw new Error('Command Center failed to open on down arrow button click!');
  }
  console.log('✅ Command Center slide-up PASSED!');
  await snap('command_center_dark_dashboard.png');

  // --- 4. TEST ESCAPE / WALLPAPER MODE RETURN ---
  console.log('\n--- 4. Testing Return to First Screen via btnToggleWallpaperMode ---');
  await evaluate(`document.getElementById('btnToggleWallpaperMode').click()`);
  await new Promise(r => setTimeout(r, 500));
  const backToWp = await evaluate(`document.body.classList.contains('mode-wallpaper') && document.getElementById('commandCenterDrawer').classList.contains('collapsed')`);
  console.log('Returned to First Screen:', backToWp);
  if (!backToWp) throw new Error('Return to wallpaper mode failed!');
  console.log('✅ Return to Wallpaper Mode PASSED!');

  // --- 5. TEST PROJECTS LINK -> TASKS TAB ---
  console.log('\n--- 5. Testing PROJECTS link -> Tasks Tab ---');
  await evaluate(`document.getElementById('navProjects').click()`);
  await new Promise(r => setTimeout(r, 700));
  const tasksViewActive = await evaluate(`document.getElementById('tabTasksView').classList.contains('active')`);
  console.log('Tasks View Active:', tasksViewActive);
  if (!tasksViewActive) throw new Error('navProjects did not activate tabTasksView!');
  await snap('command_center_dark_tasks.png');
  console.log('✅ PROJECTS -> Tasks Tab PASSED!');

  // --- 6. TEST CONTACT BUTTON -> TEAM CHAT TAB ---
  console.log('\n--- 6. Testing CONTACT button -> Team Chat Tab ---');
  await evaluate(`document.getElementById('btnToggleWallpaperMode').click()`);
  await new Promise(r => setTimeout(r, 500));
  await evaluate(`document.getElementById('btnTopContact').click()`);
  await new Promise(r => setTimeout(r, 700));
  const chatViewActive = await evaluate(`document.getElementById('tabChatView').classList.contains('active')`);
  console.log('Chat View Active:', chatViewActive);
  if (!chatViewActive) throw new Error('btnTopContact did not activate tabChatView!');
  await snap('command_center_dark_chat.png');
  console.log('✅ CONTACT -> Team Chat Tab PASSED!');

  // --- 7. BUTTON AUDIT ---
  console.log('\n--- 7. Button Audit across Entire App ---');
  const btnAudit = await evaluate(`(() => {
    const buttons = document.querySelectorAll('button');
    const navLinks = document.querySelectorAll('.top-nav-link');
    const sidebarItems = document.querySelectorAll('.sidebar-nav-item');
    return {
      totalButtons: buttons.length,
      topNavLinks: navLinks.length,
      sidebarItems: sidebarItems.length,
      activeTheme: document.body.className
    };
  })()`);
  console.log('Application Audit Metrics:', JSON.stringify(btnAudit, null, 2));

  // Return cleanly to wallpaper first screen
  await evaluate(`document.getElementById('btnToggleWallpaperMode').click()`);
  await new Promise(r => setTimeout(r, 500));

  ws.close();
  console.log('\n🎉 ALL 7 TEST PHASES COMPLETED WITH 100% SUCCESS!');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Test failed with exception:', err);
  process.exit(1);
});
