const fs = require('fs');
const path = require('path');

async function captureScreens() {
  const resp = await fetch('http://127.0.0.1:9222/json');
  const targets = await resp.json();
  const pageTarget = targets.find(t => t.type === 'page');
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
    const targetPath = path.join('C:\\Users\\jagad\\.gemini\\antigravity-ide\\brain\\d90f0eb5-a1ca-4810-93bb-55ce4ea8bbfc', filename);
    fs.writeFileSync(targetPath, Buffer.from(shot.data, 'base64'));
    console.log(`Saved screenshot: ${filename}`);
  }

  // 1. Live Chat - Dark Mode
  await evaluate(`(() => {
    document.body.classList.remove('theme-light');
    document.body.classList.add('theme-obsidian');
    document.getElementById('tabBtnChat').click();
  })()`);
  await new Promise(r => setTimeout(r, 400));
  await snap('live_chat_dark.png');

  // 2. Live Chat - Light Mode
  await evaluate(`(() => {
    document.body.classList.remove('theme-dark', 'theme-obsidian');
    document.body.classList.add('theme-light');
  })()`);
  await new Promise(r => setTimeout(r, 400));
  await snap('live_chat_light.png');

  // 3. Live Timesheets / Shifts
  await evaluate(`(() => {
    document.getElementById('tabBtnTimesheets').click();
  })()`);
  await new Promise(r => setTimeout(r, 400));
  await snap('live_timesheets.png');

  // 4. Live Tasks Board
  await evaluate(`(() => {
    document.getElementById('tabBtnTasks').click();
  })()`);
  await new Promise(r => setTimeout(r, 400));
  await snap('live_tasks.png');

  // Switch back to Dark Dashboard
  await evaluate(`(() => {
    document.body.classList.remove('theme-light');
    document.body.classList.add('theme-obsidian');
    document.getElementById('tabBtnDashboard').click();
  })()`);

  ws.close();
  console.log('All live screenshots captured successfully!');
}

captureScreens().catch(console.error);
