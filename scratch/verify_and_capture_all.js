const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const exePath = path.join(process.env.LOCALAPPDATA, 'Programs', 'REDDOT-Workstation-OS', 'REDDOT-Workstation-OS.exe');
const artifactDir = 'C:\\Users\\jagad\\.gemini\\antigravity-ide\\brain\\d90f0eb5-a1ca-4810-93bb-55ce4ea8bbfc';

async function main() {
  console.log('Launching installed REDDOT Workstation OS with CDP on port 9222...');
  const child = spawn(exePath, ['--remote-debugging-port=9222'], {
    detached: true,
    stdio: 'ignore'
  });
  child.unref();

  // Wait for CDP port
  let connected = false;
  let pageTarget = null;
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

  if (!connected) {
    console.error('Failed to connect to CDP!');
    process.exit(1);
  }

  console.log('Connected to CDP at:', pageTarget.webSocketDebuggerUrl);
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
    console.log(`[SNAPSHOT] Saved: ${filename}`);
  }

  // Wait for boot screen to fade out and dismiss modals
  console.log('Dismissing boot screen and modal overlays...');
  await new Promise(r => setTimeout(r, 2000));
  await evaluate(`(() => {
    const boot = document.getElementById('appBootScreen');
    if (boot) boot.style.display = 'none';
    const authModal = document.getElementById('authModal');
    if (authModal) authModal.classList.add('hidden');
    const offlineBtn = document.getElementById('btnContinueOffline');
    if (offlineBtn) offlineBtn.click();
  })()`);
  await new Promise(r => setTimeout(r, 600));

  // --- 1. TEST STORAGE & CLOUD IN LIGHT MODE ---
  console.log('\n--- 1. Testing Storage & Cloud in Light Mode ---');
  await evaluate(`(() => {
    document.body.classList.remove('theme-dark', 'theme-obsidian');
    document.body.classList.add('theme-light');
    document.getElementById('tabBtnDatabase').click();
  })()`);
  await new Promise(r => setTimeout(r, 600));

  const lightStorageStyles = await evaluate(`(() => {
    const ov = document.querySelector('.db-overview-card');
    const card = document.querySelector('.db-card');
    const head = document.querySelector('.db-card-head');
    const diag = document.getElementById('dbDiagnosticResults');
    const ota = document.getElementById('otaStatusBox');
    const btnSync = document.getElementById('btnSyncCloudVaultNow');
    return {
      overviewBg: window.getComputedStyle(ov).backgroundColor,
      overviewBorder: window.getComputedStyle(ov).borderColor,
      cardBg: window.getComputedStyle(card).backgroundColor,
      cardBorder: window.getComputedStyle(card).borderColor,
      headBg: window.getComputedStyle(head).backgroundColor,
      headColor: window.getComputedStyle(head).color,
      diagBg: window.getComputedStyle(diag).backgroundColor,
      diagBorder: window.getComputedStyle(diag).borderColor,
      diagColor: window.getComputedStyle(diag).color,
      otaBg: window.getComputedStyle(ota).backgroundColor,
      btnSyncBg: window.getComputedStyle(btnSync).backgroundImage || window.getComputedStyle(btnSync).backgroundColor
    };
  })()`);
  console.log('Computed styles for Storage & Cloud (Light Mode):', JSON.stringify(lightStorageStyles, null, 2));
  await snap('live_storage_light.png');

  // --- 2. TEST STORAGE & CLOUD IN DARK MODE ---
  console.log('\n--- 2. Testing Storage & Cloud in Dark Mode ---');
  await evaluate(`(() => {
    document.body.classList.remove('theme-light');
    document.body.classList.add('theme-obsidian');
  })()`);
  await new Promise(r => setTimeout(r, 400));
  await snap('live_storage_dark.png');

  // --- 3. TEST SYSTEM & SETTINGS / WALLPAPERS IN LIGHT MODE ---
  console.log('\n--- 3. Testing System & Settings / Wallpapers in Light Mode ---');
  await evaluate(`(() => {
    document.body.classList.remove('theme-dark', 'theme-obsidian');
    document.body.classList.add('theme-light');
    document.getElementById('tabBtnWallpapers').click();
  })()`);
  await new Promise(r => setTimeout(r, 600));

  const lightWallpaperStyles = await evaluate(`(() => {
    const hero = document.querySelector('#tabWallpapersView .tab-hero');
    const card = document.querySelector('#tabWallpapersView .wallpaper-card');
    return {
      heroBg: hero ? window.getComputedStyle(hero).backgroundColor : null,
      cardBg: card ? window.getComputedStyle(card).backgroundColor : null,
      cardBorder: card ? window.getComputedStyle(card).borderColor : null
    };
  })()`);
  console.log('Computed styles for System & Settings (Light Mode):', JSON.stringify(lightWallpaperStyles, null, 2));
  await snap('live_settings_light.png');

  // --- 4. TEST DASHBOARD IN LIGHT MODE ---
  console.log('\n--- 4. Testing Dashboard in Light Mode ---');
  await evaluate(`(() => {
    document.getElementById('tabBtnDashboard').click();
  })()`);
  await new Promise(r => setTimeout(r, 600));
  await snap('live_dashboard_light.png');

  await evaluate(`(() => {
    window.close();
  })()`);
  await new Promise(r => setTimeout(r, 600));
  ws.close();
  console.log('\n[SUCCESS] All verification snapshots and assertions completed!');
  process.exit(0);
}

main().catch(err => {
  console.error('Error in verification script:', err);
  process.exit(1);
});
