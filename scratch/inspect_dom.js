async function inspect() {
  const resp = await fetch('http://127.0.0.1:9222/json');
  const targets = await resp.json();
  const pageTarget = targets.find(t => t.type === 'page');
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  
  await new Promise(r => ws.onopen = r);
  
  let nextId = 1;
  function evalCmd(expr) {
    return new Promise((resolve) => {
      const id = nextId++;
      ws.send(JSON.stringify({
        id,
        method: 'Runtime.evaluate',
        params: { expression: expr, returnByValue: true, awaitPromise: true }
      }));
      const handler = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id === id) {
          ws.removeEventListener('message', handler);
          resolve(msg.result?.result?.value);
        }
      };
      ws.addEventListener('message', handler);
    });
  }

  const navButtons = await evalCmd(`(() => {
    return Array.from(document.querySelectorAll('button, .nav-item, [id*="tab"], [id*="Btn"]'))
      .map(el => ({ id: el.id, className: el.className, text: el.textContent.trim().slice(0, 30) }))
      .filter(el => el.id);
  })()`);
  console.log('--- Buttons with IDs ---');
  console.log(navButtons.slice(0, 40));

  const tabPanes = await evalCmd(`(() => {
    return Array.from(document.querySelectorAll('.tab-content, .tab-pane, [id*="tab"], [id*="View"]'))
      .map(el => ({ id: el.id, className: el.className, tag: el.tagName }))
      .filter(el => el.id);
  })()`);
  console.log('--- Tab Panes with IDs ---');
  console.log(tabPanes.slice(0, 30));

  const chatEls = await evalCmd(`(() => {
    return Array.from(document.querySelectorAll('[id*="chat" i], [id*="message" i], [id*="channel" i]'))
      .map(el => ({ id: el.id, tag: el.tagName, className: el.className }))
      .filter(el => el.id);
  })()`);
  console.log('--- Chat Elements with IDs ---');
  console.log(chatEls.slice(0, 30));

  const shiftEls = await evalCmd(`(() => {
    return Array.from(document.querySelectorAll('[id*="shift" i], [id*="clock" i], [id*="break" i], [id*="punch" i]'))
      .map(el => ({ id: el.id, tag: el.tagName, className: el.className }))
      .filter(el => el.id);
  })()`);
  console.log('--- Shift Elements with IDs ---');
  console.log(shiftEls.slice(0, 30));

  ws.close();
}

inspect().catch(console.error);
