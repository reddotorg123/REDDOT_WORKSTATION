async function run() {
  const resp = await fetch('http://127.0.0.1:9222/json');
  const targets = await resp.json();
  const ws = new WebSocket(targets[0].webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  
  let id = 1;
  const logs = [];
  const errors = [];
  
  ws.onmessage = (e) => {
    const data = JSON.parse(e.data);
    if (data.method === 'Runtime.consoleAPICalled') {
      const type = data.params.type;
      const text = data.params.args.map(a => a.value !== undefined ? String(a.value) : (a.description || '')).join(' ');
      logs.push({ type, text });
      if (type === 'error') errors.push(text);
    }
  };

  ws.send(JSON.stringify({ id: id++, method: 'Runtime.enable' }));
  ws.send(JSON.stringify({ id: id++, method: 'Log.enable' }));

  // Evaluate and check window errors
  function evaluate(expr) {
    return new Promise(res => {
      const curId = id++;
      ws.send(JSON.stringify({ id: curId, method: 'Runtime.evaluate', params: { expression: expr, returnByValue: true } }));
      const h = (e) => {
        const m = JSON.parse(e.data);
        if (m.id === curId) { ws.removeEventListener('message', h); res(m.result?.result?.value); }
      };
      ws.addEventListener('message', h);
    });
  }

  // Trigger each feature to see if any throws
  console.log('Testing channel clicks...');
  const channelClickResult = await evaluate(`(() => {
    const channels = Array.from(document.querySelectorAll('#channelList .channel-item'));
    if (channels.length < 2) return 'Not enough channels';
    channels[1].click(); // click second channel
    const active1 = document.getElementById('activeChatTitle')?.textContent.trim();
    channels[0].click(); // click back to first
    const active0 = document.getElementById('activeChatTitle')?.textContent.trim();
    return { active1, active0 };
  })()`);
  console.log('Channel Switch Result:', channelClickResult);

  console.log('Testing typing and drafting in chat...');
  const chatInputResult = await evaluate(`(() => {
    const input = document.getElementById('chatMessageInput');
    if (!input) return 'Input not found';
    input.value = 'Testing automated messaging';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const val = input.value;
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    return { typedValue: val };
  })()`);
  console.log('Chat Input Result:', chatInputResult);

  console.log('Testing break button click...');
  const breakResult = await evaluate(`(() => {
    const btn = document.getElementById('btnPersonalBreak');
    if (!btn) return 'Break button not found';
    // Just inspect its event listeners or state without clocking out
    return {
      text: btn.textContent.trim().replace(/\\s+/g, ' '),
      disabled: btn.disabled,
      className: btn.className
    };
  })()`);
  console.log('Break Button Status:', breakResult);

  console.log('Testing Omnibox search trigger (Ctrl+K)...');
  const omniboxResult = await evaluate(`(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
    const modal = document.getElementById('omniboxModal') || document.querySelector('.omnibox-overlay');
    const isVisible = modal ? !modal.classList.contains('hidden') : false;
    // Close it if opened
    if (modal) {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    }
    return { hasModal: !!modal, isVisible };
  })()`);
  console.log('Omnibox Result:', omniboxResult);

  await new Promise(r => setTimeout(r, 1000));

  console.log('\n--- Captured Browser Logs ---');
  console.log(`Total console messages: ${logs.length}`);
  console.log(`Total errors: ${errors.length}`);
  if (errors.length > 0) {
    console.log('Errors:', errors);
  }

  ws.close();
}

run().catch(console.error);
