const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const exePath = path.join(process.env.LOCALAPPDATA, 'Programs', 'REDDOT-Workstation-OS', 'REDDOT-Workstation-OS.exe');

async function main() {
  console.log('Launching app to inspect sidebar overlap...');
  const child = spawn(exePath, ['--remote-debugging-port=9222'], {
    detached: true,
    stdio: 'ignore'
  });
  child.unref();

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

  // Dismiss boot screen
  await new Promise(r => setTimeout(r, 2000));
  await evaluate(`(() => {
    const boot = document.getElementById('appBootScreen');
    if (boot) boot.style.display = 'none';
    const authModal = document.getElementById('authModal');
    if (authModal) authModal.classList.add('hidden');
    const offlineBtn = document.getElementById('btnContinueOffline');
    if (offlineBtn) offlineBtn.click();
    document.body.classList.remove('theme-dark', 'theme-obsidian');
    document.body.classList.add('theme-light');
    document.getElementById('tabBtnTasks').click();
  })()`);
  await new Promise(r => setTimeout(r, 600));

  const result = await evaluate(`(() => {
    const sidebar = document.getElementById('workstationSidebar');
    const activeBtn = document.getElementById('tabBtnTasks');
    const cmdBody = document.querySelector('.command-body');
    const tabPane = document.getElementById('tabTasksView');
    const layout = document.querySelector('.workstation-body-layout');

    function rect(el) {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, left: r.left };
    }

    return {
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      layout: rect(layout),
      sidebar: rect(sidebar),
      activeBtn: rect(activeBtn),
      cmdBody: rect(cmdBody),
      tabPane: rect(tabPane),
      activeBtnComputed: {
        width: window.getComputedStyle(activeBtn).width,
        padding: window.getComputedStyle(activeBtn).padding,
        margin: window.getComputedStyle(activeBtn).margin,
        border: window.getComputedStyle(activeBtn).border,
        boxShadow: window.getComputedStyle(activeBtn).boxShadow,
        borderRadius: window.getComputedStyle(activeBtn).borderRadius,
        position: window.getComputedStyle(activeBtn).position,
        overflow: window.getComputedStyle(activeBtn).overflow
      },
      sidebarComputed: {
        overflow: window.getComputedStyle(sidebar).overflow,
        overflowX: window.getComputedStyle(sidebar).overflowX,
        overflowY: window.getComputedStyle(sidebar).overflowY,
        boxSizing: window.getComputedStyle(sidebar).boxSizing
      }
    };
  })()`);

  console.log('MEASURED GEOMETRY:\n', JSON.stringify(result, null, 2));

  // Also take a screenshot of the exact window
  const shot = await sendCommand('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:\\Users\\jagad\\.gemini\\antigravity-ide\\brain\\d90f0eb5-a1ca-4810-93bb-55ce4ea8bbfc\\inspect_full_geometry.png', Buffer.from(shot.data, 'base64'));

  await evaluate(`window.close()`);
  await new Promise(r => setTimeout(r, 500));
  ws.close();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
