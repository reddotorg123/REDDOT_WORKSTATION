/**
 * REDDOT Workstation OS - Broadcast Update Announcement
 * Posts an official release update alert into the general team chat channel via Firestore REST.
 */

const https = require('https');

const API_KEY = 'AIzaSyBpjenDcXDREseIDv5NfgpDo2fAk_gUhdk';
const PROJECT_ID = 'reddot-workspace';
const ORG_ID = 'reddot';
const CHANNEL_ID = 'general';

const msgId = 'msg_ota_v257_' + Date.now();
const postUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/organizations/${ORG_ID}/channels/${CHANNEL_ID}/messages/${msgId}?key=${API_KEY}`;
const channelMetaUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/organizations/${ORG_ID}/channels/${CHANNEL_ID}?updateMask.fieldPaths=lastMessageText&updateMask.fieldPaths=lastMessageSender&updateMask.fieldPaths=lastMessageTime&updateMask.fieldPaths=updatedAt&key=${API_KEY}`;

const announcementText = `📢 **[SYSTEM UPDATE] REDDOT Workstation OS v2.5.7 is now LIVE!**\n\n✨ **What's New in This Release:**\n• **Brand Identity Upgrade**: Official **REDDOT WORKSTATION** designation across the viewport.\n• **Precision Work Hours Engine**: Resolved false shift timing calculations, eliminating previous-day stale hours leakage and double-counting.\n• **Real-Time Shift Audit Trail**: Distinct per-session durations for Clock-Out / Break events and live elapsed tracking for active duties.\n• **Drift-Free Wall-Clock Shift Timer**: Shift timers calculate against high-precision wall-clock time, eliminating time loss from PC sleep or suspension.\n• **Concurrency-Safe Persistence Engine**: Atomic queued file-writing preventing Windows disk file locking collisions.\n• **Automatic Shift & Member Hygiene**: Workstation automatically sanitizes stale metrics and marks inactive members offline on launch.\n\n👉 **How to Update:**\nSimply click the glowing **⚡ UPDATE** button in your top header, or go to **Database & Storage Hub > ⚡ 1-Click Fast Cloud Update**!`;

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
  console.log('📡 Broadcasting v2.5.7 OTA Release Announcement to team chat channel [#general]...');
  const res = await postJson(postUrl, payload, 'PATCH');
  console.log('✅ Announcement message posted! Message ID:', msgId);

  // Update channel meta
  const metaPayload = JSON.stringify({
    fields: {
      lastMessageText: { stringValue: '📢 REDDOT Workstation OS v2.5.7 is now LIVE! Click ⚡ UPDATE' },
      lastMessageSender: { stringValue: 'REDDOT System Bot ⚡' },
      lastMessageTime: { integerValue: String(Date.now()) },
      updatedAt: { integerValue: String(Date.now()) }
    }
  });
  await postJson(channelMetaUrl, metaPayload, 'PATCH');
  console.log('✅ General channel metadata updated.');
}

main().catch(err => {
  console.error('❌ Failed to broadcast announcement:', err);
  process.exit(1);
});
