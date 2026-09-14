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
  const channelListDetails = await evaluate(`(() => {
    const channelList = document.getElementById('channelList');
    if (!channelList) return null;
    return {
      childrenCount: channelList.children.length,
      items: Array.from(channelList.querySelectorAll('.channel-item, .chat-list-item')).map(el => ({
        id: el.id,
        className: el.className,
        text: el.textContent.trim().replace(/\\s+/g, ' ').slice(0, 40)
      }))
    };
  })()`);
  console.log('Channel List Items:', JSON.stringify(channelListDetails, null, 2));

  const activeTitle = await evaluate(`(() => {
    const el = document.getElementById('activeChatTitle');
    return el ? el.textContent.trim() : null;
  })()`);
  console.log('Active Chat Title:', activeTitle);

  ws.close();
}
run().catch(console.error);
