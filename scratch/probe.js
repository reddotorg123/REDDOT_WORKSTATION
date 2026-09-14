const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const exePath = path.join(process.env.LOCALAPPDATA, 'Programs', 'REDDOT-Workstation-OS', 'REDDOT-Workstation-OS.exe');

(async () => {
  console.log('Launching app for probe...');
  const child = spawn(exePath, ['--remote-debugging-port=9222'], { detached: true, stdio: 'ignore' });
  child.unref();

  let pageTarget = null;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 500));
    try {
      const resp = await fetch('http://127.0.0.1:9222/json');
      const targets = await resp.json();
      pageTarget = targets.find(t => t.type === 'page' && t.url && t.url.includes('index.html'));
      if (pageTarget) break;
    } catch (e) {}
  }

  if (!pageTarget) {
    console.error('Failed to connect');
    process.exit(1);
  }

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let nextId = 1;
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = nextId++;
      const handler = (e) => {
        const msg = JSON.parse(e.data);
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

  // Listen to console
  ws.addEventListener('message', (e) => {
    const msg = JSON.parse(e.data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      console.log('[BROWSER CONSOLE]', msg.params.type, msg.params.args?.map(a => a.value));
    } else if (msg.method === 'Runtime.exceptionThrown') {
      console.error('[BROWSER EXCEPTION]', msg.params.exceptionDetails);
    }
  });
  await send('Runtime.enable');

  await new Promise(r => setTimeout(r, 2200));

  // Dismiss boot screen
  await send('Runtime.evaluate', {
    expression: `(() => {
      const boot = document.getElementById('appBootScreen');
      if (boot) boot.style.display = 'none';
      const auth = document.getElementById('authModal');
      if (auth) auth.classList.add('hidden');
    })()`
  });
  await new Promise(r => setTimeout(r, 500));

  const probeResult = await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.getElementById('navProjects');
      console.log('Probing navProjects:', btn);
      try {
        btn.click();
      } catch (err) {
        console.error('Click error:', err);
      }
      return {
        activePane: document.querySelector('.cmd-tab-pane.active')?.id,
        isCmdOpen: !document.getElementById('commandCenterDrawer')?.classList.contains('collapsed'),
        allPanes: Array.from(document.querySelectorAll('.cmd-tab-pane')).map(p => ({ id: p.id, active: p.classList.contains('active') }))
      };
    })()`,
    returnByValue: true
  });

  console.log('Probe Result:', JSON.stringify(probeResult.result?.value, null, 2));

  await new Promise(r => setTimeout(r, 1000));
  ws.close();
  process.exit(0);
})();
