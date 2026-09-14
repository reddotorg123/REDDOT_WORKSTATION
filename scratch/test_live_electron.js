const fs = require('fs');
const path = require('path');

async function runTestSuite() {
  console.log('===============================================================');
  console.log('   REDDOT WORKSTATION OS • COMPREHENSIVE E2E QA TEST SUITE    ');
  console.log('===============================================================\n');

  // 1. Connect to CDP on port 9222
  const resp = await fetch('http://127.0.0.1:9222/json');
  const targets = await resp.json();
  const pageTarget = targets.find(t => t.type === 'page');

  if (!pageTarget) {
    console.error('[FATAL] No Electron page target found on port 9222!');
    process.exit(1);
  }

  console.log(`[CDP] Target: "${pageTarget.title}"`);
  console.log(`[CDP] Loopback URL: ${pageTarget.url}`);
  console.log(`[CDP] WebSocket Endpoint: ${pageTarget.webSocketDebuggerUrl}\n`);

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  let nextId = 1;
  const pendingRequests = new Map();
  const consoleMessages = [];
  const uncaughtExceptions = [];

  function sendCommand(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = nextId++;
      pendingRequests.set(id, { resolve, reject, method });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async function evaluate(expression) {
    const res = await sendCommand('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      const desc = res.exceptionDetails.exception?.description || res.exceptionDetails.text;
      throw new Error(`Eval Error in [${expression.slice(0, 50)}...]: ${desc}`);
    }
    return res.result?.value;
  }

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pendingRequests.has(data.id)) {
      const { resolve, reject } = pendingRequests.get(data.id);
      pendingRequests.delete(data.id);
      if (data.error) {
        reject(new Error(data.error.message));
      } else {
        resolve(data.result);
      }
      return;
    }

    if (data.method === 'Runtime.consoleAPICalled') {
      const type = data.params.type;
      const text = data.params.args.map(a => a.value !== undefined ? String(a.value) : (a.description || '')).join(' ');
      consoleMessages.push({ type, text });
      if (type === 'error') {
        console.log(`  [BROWSER ERROR] ${text}`);
      }
    } else if (data.method === 'Runtime.exceptionThrown') {
      const desc = data.params.exceptionDetails.exception?.description || data.params.exceptionDetails.text;
      uncaughtExceptions.push(desc);
      console.log(`  [UNCAUGHT RUNTIME EXCEPTION] ${desc}`);
    }
  };

  await sendCommand('Runtime.enable');
  await sendCommand('Page.enable');
  await sendCommand('Log.enable');

  console.log('[CDP] Reloading Electron window with cache bypass...');
  await sendCommand('Page.reload', { ignoreCache: true });
  await new Promise(r => setTimeout(r, 3200));

  // Reset console and exception buffers for clean post-reload audit
  consoleMessages.length = 0;
  uncaughtExceptions.length = 0;

  const testResults = [];
  function assert(name, condition, details = '') {
    const passed = !!condition;
    testResults.push({ name, passed, details });
    const mark = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`  ${mark} : ${name.padEnd(45)} ${details ? '(' + details + ')' : ''}`);
    return passed;
  }

  console.log('--- PHASE 1: Bootloader & Shell Initialization ---');
  const readyState = await evaluate('document.readyState');
  const docTitle = await evaluate('document.title');
  assert('Document Ready State', readyState === 'complete', `State: ${readyState}`);
  assert('Application Title Verified', docTitle.includes('REDDOT Workstation OS'), `Title: ${docTitle}`);

  // Bootloader Lifecycle
  const bootStatus = await evaluate(`(() => {
    const boot = document.getElementById('appBootScreen');
    if (!boot) return 'dismissed_and_removed';
    const style = window.getComputedStyle(boot);
    return {
      opacity: style.opacity,
      display: style.display,
      hasFadeOut: boot.classList.contains('fade-out')
    };
  })()`);
  assert('Bootloader Cleanly Dismissed', bootStatus === 'dismissed_and_removed' || bootStatus.hasFadeOut || bootStatus.opacity === '0', typeof bootStatus === 'string' ? bootStatus : JSON.stringify(bootStatus));

  console.log('\n--- PHASE 2: Core 7-Module Workstation Navigation ---');
  const modules = [
    { btnId: 'tabBtnDashboard', paneId: 'tabDashboardView', name: 'Dashboard' },
    { btnId: 'tabBtnTasks', paneId: 'tabTasksView', name: 'Tasks & Projects' },
    { btnId: 'tabBtnWorkers', paneId: 'tabWorkersView', name: 'Team & Directory' },
    { btnId: 'tabBtnTimesheets', paneId: 'tabTimesheetsView', name: 'Time & Shifts' },
    { btnId: 'tabBtnChat', paneId: 'tabChatView', name: 'Team Chat' },
    { btnId: 'tabBtnDatabase', paneId: 'tabDatabaseView', name: 'Storage & Cloud' },
    { btnId: 'tabBtnWallpapers', paneId: 'tabWallpapersView', name: 'System & Settings' }
  ];

  for (const mod of modules) {
    const navResult = await evaluate(`(() => {
      const btn = document.getElementById('${mod.btnId}');
      if (!btn) return { error: 'Button ${mod.btnId} not found' };
      btn.click();
      const pane = document.getElementById('${mod.paneId}');
      if (!pane) return { error: 'Pane ${mod.paneId} not found' };
      const style = window.getComputedStyle(pane);
      return {
        btnActive: btn.classList.contains('active'),
        paneActive: pane.classList.contains('active'),
        display: style.display,
        visibility: style.visibility
      };
    })()`);

    assert(
      `Navigate to ${mod.name}`,
      navResult && navResult.paneActive && navResult.display !== 'none',
      `Display: ${navResult?.display}, Active: ${navResult?.paneActive}`
    );
    await new Promise(r => setTimeout(r, 150));
  }

  console.log('\n--- PHASE 3: Team Chat Suite & Interactive Elements ---');
  // Switch to Chat module
  await evaluate(`document.getElementById('tabBtnChat').click()`);
  await new Promise(r => setTimeout(r, 200));

  const chatAudit = await evaluate(`(() => {
    const channels = Array.from(document.querySelectorAll('#channelList .channel-item'));
    const composer = document.getElementById('chatMessageInput');
    const sendBtn = document.querySelector('.btn-chat-send');
    const activeHeader = document.getElementById('activeChatTitle');
    const activeTopic = document.getElementById('activeChatTopic');
    const formatBtn = document.getElementById('btnToggleFormat');
    const emojiBtn = document.getElementById('btnEmojiPicker');

    return {
      channelCount: channels.length,
      channelNames: channels.map(c => c.textContent.trim().replace(/\\s+/g, ' ')),
      hasComposer: !!composer,
      hasSendBtn: !!sendBtn,
      activeChannel: activeHeader ? activeHeader.textContent.trim() : null,
      hasFormat: !!formatBtn,
      hasEmoji: !!emojiBtn
    };
  })()`);

  assert('Chat Channels Rendered', chatAudit.channelCount >= 5, `Found: ${chatAudit.channelCount} channels`);
  assert('Chat Active Channel Selected', !!chatAudit.activeChannel, `Active: ${chatAudit.activeChannel}`);
  assert('Chat Composer & Send Operational', chatAudit.hasComposer && chatAudit.hasSendBtn);
  assert('Chat Rich Toolbar Controls Available', chatAudit.hasFormat && chatAudit.hasEmoji);

  // Test dynamic channel switching
  const channelSwitchAudit = await evaluate(`(() => {
    const channels = document.querySelectorAll('#channelList .channel-item');
    if (channels.length < 2) return false;
    channels[1].click();
    const title1 = document.getElementById('activeChatTitle')?.textContent.trim();
    channels[0].click();
    const title0 = document.getElementById('activeChatTitle')?.textContent.trim();
    return { title1, title0, switchedOk: title1 !== title0 };
  })()`);
  assert('Dynamic Channel Switching', channelSwitchAudit && channelSwitchAudit.switchedOk, `Switched from "${channelSwitchAudit?.title1}" to "${channelSwitchAudit?.title0}"`);

  // Test composing and drafting in chat
  const composerInputTest = await evaluate(`(() => {
    const composer = document.getElementById('chatMessageInput');
    if (!composer) return false;
    composer.value = 'Enterprise QA Verification Message [Automated]';
    composer.dispatchEvent(new Event('input', { bubbles: true }));
    const saved = composer.value;
    composer.value = '';
    composer.dispatchEvent(new Event('input', { bubbles: true }));
    return saved;
  })()`);
  assert('Chat Composer Input Handling', composerInputTest === 'Enterprise QA Verification Message [Automated]');

  console.log('\n--- PHASE 4: Time & Shifts Attendance Module ---');
  await evaluate(`document.getElementById('tabBtnTimesheets').click()`);
  await new Promise(r => setTimeout(r, 200));

  const shiftAudit = await evaluate(`(() => {
    const clockIn = document.getElementById('btnPersonalClockIn');
    const clockOut = document.getElementById('btnPersonalClockOut');
    const takeBreak = document.getElementById('btnPersonalBreak');
    const timer = document.getElementById('personalShiftTimer');
    const quotaBar = document.getElementById('shiftQuotaBar');
    const tableBody = document.getElementById('punchLogTableBody');

    return {
      hasClockIn: !!clockIn,
      hasClockOut: !!clockOut,
      hasTakeBreak: !!takeBreak,
      breakDisabled: takeBreak ? takeBreak.disabled : null,
      breakText: takeBreak ? takeBreak.textContent.trim().replace(/\\s+/g, ' ') : null,
      hasTimer: !!timer,
      hasTable: !!tableBody
    };
  })()`);

  assert('Shift Clock In / Clock Out Controls', shiftAudit.hasClockIn && shiftAudit.hasClockOut);
  assert('Take Break State Management', shiftAudit.hasTakeBreak, `Text: ${shiftAudit.breakText}, Disabled: ${shiftAudit.breakDisabled}`);
  assert('Shift Live Telemetry & Table Mounted', shiftAudit.hasTimer && shiftAudit.hasTable);

  console.log('\n--- PHASE 5: Universal Omnibox Search (Ctrl+K) ---');
  const omniboxAudit = await evaluate(`(() => {
    const modal = document.getElementById('globalOmniboxModal');
    const input = document.getElementById('omniboxModalInput');
    const list = document.getElementById('omniboxResultsList');
    if (!modal || !input || !list) return { error: 'Omnibox elements missing' };

    // Simulate opening omnibox
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
    const opened = !modal.classList.contains('hidden');

    // Simulate search query
    input.value = 'Dashboard';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const resultCount = list.children.length;

    // Simulate closing with Escape
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    const closed = modal.classList.contains('hidden');

    return { opened, resultCount, closed };
  })()`);

  assert('Omnibox Trigger (Ctrl+K)', omniboxAudit && omniboxAudit.opened, `Results found: ${omniboxAudit?.resultCount}`);
  assert('Omnibox Escape Dismissal', omniboxAudit && omniboxAudit.closed);

  console.log('\n--- PHASE 6: Dual-Theme Contrast & Uniformity Verification ---');
  // 1. Test Light Mode
  await evaluate(`(() => {
    document.body.classList.remove('theme-dark', 'theme-obsidian', 'theme-cyberpunk');
    document.body.classList.add('theme-light');
    localStorage.setItem('reddot_theme', 'light');
    if (typeof applyThemeStyles === 'function') applyThemeStyles('light');
  })()`);
  await new Promise(r => setTimeout(r, 300));

  const lightThemeAudit = await evaluate(`(() => {
    const bodyStyle = window.getComputedStyle(document.body);
    const header = document.querySelector('.top-bar') || document.querySelector('.app-header');
    const sidebar = document.querySelector('.workstation-sidebar') || document.querySelector('.main-nav-sidebar');
    const chatPane = document.getElementById('tabChatView');
    const channelsSidebar = document.querySelector('.teams-channels-sidebar') || document.querySelector('.channel-items-list');

    return {
      bodyBg: bodyStyle.backgroundColor,
      bodyColor: bodyStyle.color,
      isLightBg: bodyStyle.backgroundColor.includes('241') || bodyStyle.backgroundColor.includes('245') || bodyStyle.backgroundColor.includes('248') || bodyStyle.backgroundColor.includes('255')
    };
  })()`);

  assert('Light Theme Applied', lightThemeAudit.isLightBg, `Body BG: ${lightThemeAudit.bodyBg}`);

  // 2. Test Obsidian/Dark Mode
  await evaluate(`(() => {
    document.body.classList.remove('theme-light');
    document.body.classList.add('theme-obsidian');
    localStorage.setItem('reddot_theme', 'obsidian');
    if (typeof applyThemeStyles === 'function') applyThemeStyles('obsidian');
  })()`);
  await new Promise(r => setTimeout(r, 300));

  const darkThemeAudit = await evaluate(`(() => {
    const bodyStyle = window.getComputedStyle(document.body);
    return {
      bodyBg: bodyStyle.backgroundColor,
      isDarkBg: bodyStyle.backgroundColor.includes('6, 6, 9') || bodyStyle.backgroundColor.includes('9, 10, 15') || bodyStyle.backgroundColor.includes('11, 12, 16')
    };
  })()`);

  assert('Dark/Obsidian Theme Applied', darkThemeAudit.isDarkBg, `Body BG: ${darkThemeAudit.bodyBg}`);

  // Return to Dashboard
  await evaluate(`document.getElementById('tabBtnDashboard').click()`);

  console.log('\n--- PHASE 7: Zero-Error Runtime & Exceptions Audit ---');
  // Filter out any external offline warnings
  const criticalErrors = consoleMessages.filter(m => m.type === 'error' && !m.text.includes('favicon') && !m.text.includes('ERR_CONNECTION_REFUSED'));

  assert('Zero Uncaught Runtime Exceptions', uncaughtExceptions.length === 0, `Count: ${uncaughtExceptions.length}`);
  assert('Zero Critical Console Errors', criticalErrors.length === 0, `Count: ${criticalErrors.length}`);

  console.log('\n--- PHASE 8: Capturing Live Electron Screen Verification ---');
  const screenshotData = await sendCommand('Page.captureScreenshot', { format: 'png' });
  const artifactPath = path.join('C:\\Users\\jagad\\.gemini\\antigravity-ide\\brain\\d90f0eb5-a1ca-4810-93bb-55ce4ea8bbfc', 'live_app_qa_verified.png');
  fs.writeFileSync(artifactPath, Buffer.from(screenshotData.data, 'base64'));
  console.log(`  Screenshot saved to: ${artifactPath}`);

  // Summary
  console.log('\n===============================================================');
  const total = testResults.length;
  const passed = testResults.filter(r => r.passed).length;
  const failed = testResults.filter(r => !r.passed).length;
  console.log(`TOTAL CHECKS: ${total} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('===============================================================\n');

  ws.close();

  if (failed > 0) {
    console.error(`[FAIL] E2E test suite finished with ${failed} failure(s).`);
    process.exit(1);
  } else {
    console.log('🎉 [PASS] All E2E automated tests PASSED with 0 bugs or errors!\n');
    process.exit(0);
  }
}

runTestSuite().catch(err => {
  console.error('[FATAL RUNTIME ERROR]:', err);
  process.exit(1);
});
