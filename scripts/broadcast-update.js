/**
 * REDDOT Workstation OS - Broadcast Update Announcement
 * Posts an official release update alert into the general team chat channel via Firestore REST.
 */

const https = require('https');

const API_KEY = 'AIzaSyBpjenDcXDREseIDv5NfgpDo2fAk_gUhdk';
const PROJECT_ID = 'reddot-workspace';
const ORG_ID = 'reddot';
const CHANNEL_ID = 'general';

const msgId = 'msg_ota_v330_' + Date.now();
const postUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/organizations/${ORG_ID}/channels/${CHANNEL_ID}/messages/${msgId}?key=${API_KEY}`;
const channelMetaUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/organizations/${ORG_ID}/channels/${CHANNEL_ID}?updateMask.fieldPaths=lastMessageText&updateMask.fieldPaths=lastMessageSender&updateMask.fieldPaths=lastMessageTime&updateMask.fieldPaths=updatedAt&key=${API_KEY}`;

const announcementText = `📢 **[SYSTEM UPDATE] REDDOT Workstation v3.3.0 is now LIVE!**\n\n✨ **What's New in Workstation v3.3.0:**\n• **📱 App Activity Monitor (Admin Only)**: Jagadish can now see exactly which applications every team member is running — Chrome, Brave, VS Code, WhatsApp, Figma, Discord, Teams, and 40+ more apps tracked live.\n• **Per-User App Breakdown**: Full detail panel per team member showing app name, total time used, % of workday bar, and last active timestamp with live auto-refresh.\n• **Fleet KPIs Dashboard**: Cards for Active Users Tracked, Distinct Apps Today, Total App Hours, and Most Used App across the entire fleet.\n• **Date History View**: Browse any past date to see historical app usage for any team member.\n• **Reliable App Detection**: Uses native tasklist scanner — accurately detects 40+ apps including Chrome, VS Code, WhatsApp, Antigravity IDE, Brave, Discord, Teams, and more.\n• **Background Silent Sync**: Usage syncs automatically every 60 seconds for all users, visible only to the owner.\n\n👉 **How to Update:**\nSimply click the glowing **⚡ UPDATE** button in your top header, or go to **Database & Storage Hub > ⚡ 1-Click Fast Cloud Update**!`;

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
  console.log('📡 Broadcasting v3.3.0 OTA Release Announcement to team chat channel [#general]...');

  // 1. Post announcement message
  await postJson(postUrl, payload, 'PATCH');
  console.log('✅ Announcement message successfully posted!');

  // 2. Update channel metadata
  const channelMetaPayload = JSON.stringify({
    fields: {
      lastMessageText: { stringValue: '📢 REDDOT Workstation v3.3.0 is now LIVE! App Monitor + more. Click ⚡ UPDATE' },
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
