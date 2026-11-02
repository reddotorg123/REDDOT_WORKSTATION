/**
 * REDDOT Workstation OS - Broadcast Update Announcement
 * Posts an official release update alert into the general team chat channel via Firestore REST.
 */

const https = require('https');

const API_KEY = 'AIzaSyBpjenDcXDREseIDv5NfgpDo2fAk_gUhdk';
const PROJECT_ID = 'reddot-workspace';
const ORG_ID = 'reddot';
const CHANNEL_ID = 'general';

const msgId = 'msg_ota_v3101_' + Date.now();
const postUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/organizations/${ORG_ID}/channels/${CHANNEL_ID}/messages/${msgId}?key=${API_KEY}`;
const channelMetaUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/organizations/${ORG_ID}/channels/${CHANNEL_ID}?updateMask.fieldPaths=lastMessageText&updateMask.fieldPaths=lastMessageSender&updateMask.fieldPaths=lastMessageTime&updateMask.fieldPaths=updatedAt&key=${API_KEY}`;

const announcementText = `📢 **[OFFICIAL OTA UPDATE] REDDOT Workstation v3.10.1 is now LIVE!**\n\n✨ **What's New in Workstation v3.10.1:**
• **Real-Time Instant Messaging Engine**: Multi-channel listeners across all public channels and teammate Direct Messages ensuring messages appear immediately on the recipient's screen in real-time.
• **High-Visibility Unread Counters**: Glowing unread count badge on the Messages sidebar tab, team channels, and direct message contacts.
• **Smart Audio & Desktop Popups**: Instant audio chirps and native Windows desktop notifications for incoming messages with direct jump-to-chat.
• **Universal Running Apps Synchronization**: Adaptive role-based heuristic ensuring all teammates broadcast their active foreground and background processes reliably across all workstations.
• **Decoupled Real-Time Telemetry**: Independent 6-second presence ticker continuously updating and broadcasting live tools to Firestore whether clocked in or on standby.
• **Profile Running Apps Quick Switcher**: Allows team members to switch foreground focus and manage background tool stacks directly inside their profile.\n\n👉 **How to Update:**\nClick the glowing **⚡ UPDATE v3.10.1** button in your top header or restart your REDDOT Workstation to apply the hotpatch instantly!`;

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
  console.log('📡 Broadcasting v3.6.7 Announcement to team chat channel [#general]...');

  // 1. Post announcement message
  await postJson(postUrl, payload, 'PATCH');
  console.log('✅ Announcement message successfully posted!');

  // 2. Update channel metadata
  const channelMetaPayload = JSON.stringify({
    fields: {
      lastMessageText: { stringValue: '📢 REDDOT Workstation v3.6.7 OTA is now LIVE! Attendance Past Records, Analytics Modal & Card Interactivity Restored.' },
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
