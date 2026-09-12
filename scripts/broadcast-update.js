/**
 * REDDOT Workstation OS - Broadcast Update Announcement
 * Posts an official release update alert into the general team chat channel via Firestore REST.
 */

const https = require('https');

const API_KEY = 'AIzaSyBpjenDcXDREseIDv5NfgpDo2fAk_gUhdk';
const PROJECT_ID = 'reddot-workspace';
const ORG_ID = 'reddot';
const CHANNEL_ID = 'general';

const msgId = 'msg_ota_v300_' + Date.now();
const postUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/organizations/${ORG_ID}/channels/${CHANNEL_ID}/messages/${msgId}?key=${API_KEY}`;
const channelMetaUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/organizations/${ORG_ID}/channels/${CHANNEL_ID}?updateMask.fieldPaths=lastMessageText&updateMask.fieldPaths=lastMessageSender&updateMask.fieldPaths=lastMessageTime&updateMask.fieldPaths=updatedAt&key=${API_KEY}`;

const announcementText = `📢 **[MAJOR RELEASE] REDDOT Workstation v3.0 is now LIVE!**\n\n✨ **What's New in Workstation v3.0:**\n• **Executive Daily Pulse Dashboard**: Circular SVG gauge ring for live hours, 4 executive KPI metric cards, priority objectives with department pills, and real-time team activity stream.\n• **Iconic Left Navigation Rail**: High-density workspace navigation with real-time CPU allocation telemetry.\n• **Precision Attendance Log & Hero Card**: Massive clock display (06:11:24 HRS ACTIVE), 8-hour shift quota progress track, and one-click cryptographically auditable CSV export.\n• **Engineering Nodes Personnel Matrix**: Deep node telemetry, target architecture badges, active directives, and instant node provisioning.\n• **Sprint 14 Execution Cycle**: Sprint progress banner, prioritized work streams, and interactive slide-out task detail drawer with subtasks checklist.\n• **Dual-Theme Engine**: Seamless switching between Clean Carbon Light Mode and Obsidian Crimson Dark Mode (Alt+T shortcut).\n• **Universal Omnibox Search**: Instant keyboard search across tasks, members, and commands (Ctrl+K).\n• **Hardware Hotkeys**: Instant F7 (Take Break) and F8 (Clock Out) desktop bindings.\n\n👉 **How to Update:**\nSimply click the glowing **⚡ UPDATE** button in your top header, or go to **Database & Storage Hub > ⚡ 1-Click Fast Cloud Update**!`;

const payload = JSON.stringify({
  fields: {
    id: { stringValue: msgId },
    senderId: { stringValue: 'RD-SYSTEM-BOT' },
    senderUid: { stringValue: 'RD-SYSTEM-BOT' },
    senderEmpId: { stringValue: 'SYS-OTA' },
    senderName: { stringValue: 'REDDOT System Bot ⚡' },
    senderEmail: { stringValue: 'system@reddot.com' },
    senderPhoto: { stringValue: '' },
    text: { stringValue: announcementText },
    createdAt: { integerValue: String(Date.now()) },
    channelId: { stringValue: CHANNEL_ID },
    isEdited: { booleanValue: false },
    isPinned: { booleanValue: true }
  }
});

function postJson(url, data, method = 'PATCH') {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      port: 443,
      path: parsed.pathname + parsed.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(JSON.parse(body)); } catch (_) { resolve(body); }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('📡 Broadcasting v3.0.0 OTA Release Announcement to team chat channel [#general]...');

  // 1. Post announcement message
  await postJson(postUrl, payload, 'PATCH');
  console.log('✅ Announcement message successfully posted!');

  // 2. Update channel metadata
  const channelMetaPayload = JSON.stringify({
    fields: {
      lastMessageText: { stringValue: '📢 REDDOT Workstation v3.0 is now LIVE! Click ⚡ UPDATE' },
      lastMessageSender: { stringValue: 'REDDOT System Bot ⚡' },
      lastMessageTime: { integerValue: String(Date.now()) },
      updatedAt: { integerValue: String(Date.now()) }
    }
  });
  await postJson(channelMetaUrl, channelMetaPayload, 'PATCH');
  console.log('✅ General channel metadata updated.');
}

main().catch(err => {
  console.error('❌ Failed to broadcast announcement:', err);
  process.exit(1);
});
