async function run() {
  const resp = await fetch('http://127.0.0.1:9222/json');
  const targets = await resp.json();
  const ws = new WebSocket(targets[0].webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 1;
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
  const chatBottom = await evaluate(`(() => {
    const pane = document.getElementById('tabChatView');
    if (!pane) return null;
    return Array.from(pane.querySelectorAll('textarea, input, button')).map(el => ({
      id: el.id,
      tag: el.tagName,
      className: el.className,
      placeholder: el.placeholder,
      title: el.title,
      text: el.textContent.trim().slice(0, 30)
    }));
  })()`);
  console.log('Chat Inputs/Buttons:', JSON.stringify(chatBottom, null, 2));
  ws.close();
}
run().catch(console.error);
