import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { firebaseBridge } from '../src/services/firebaseBridge.js';

const appSource = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
const teamViewSource = await readFile(new URL('../src/components/TeamView.jsx', import.meta.url), 'utf8');
const messageViewSource = await readFile(new URL('../src/components/MessagesView.jsx', import.meta.url), 'utf8');
const workspaceOsSource = await readFile(new URL('../src/components/WorkspaceOsModal.jsx', import.meta.url), 'utf8');
const firebaseServiceSource = await readFile(new URL('../public/firebase-service.js', import.meta.url), 'utf8');

test('member presence expires on heartbeat age while duty remains independent', () => {
  const recent = firebaseBridge.mapMemberDoc({
    uid: 'user-online',
    email: 'online@example.com',
    displayName: 'Online Member',
    status: 'DUTY_ON',
    presenceState: 'online',
    lastSeenAt: Date.now()
  });
  const stale = firebaseBridge.mapMemberDoc({
    uid: 'user-stale',
    email: 'stale@example.com',
    displayName: 'Stale Member',
    status: 'DUTY_ON',
    presenceState: 'online',
    lastSeenAt: Date.now() - 151000
  });

  assert.equal(recent.isOnline, true);
  assert.equal(recent.status, 'Online');
  assert.equal(recent.dutyStatus, 'On Duty');
  assert.equal(stale.isOnline, false);
  assert.equal(stale.status, 'Offline');
  assert.equal(stale.dutyStatus, 'On Duty');
});

test('presence subscription uses RTDB and cleans up its listener', async () => {
  const originalEnsureReady = firebaseBridge.ensureReady;
  let subscriptionCallback = null;
  let unsubscribed = false;
  firebaseBridge.ensureReady = async () => ({
    rtdb: {},
    subscribeAllPresence: callback => {
      subscriptionCallback = callback;
      return () => { unsubscribed = true; };
    }
  });

  try {
    let receivedPresence = null;
    const unsubscribe = firebaseBridge.subscribePresence(presence => {
      receivedPresence = presence;
    });
    await new Promise(resolve => setImmediate(resolve));
    subscriptionCallback({ 'user-1': { state: 'online', isOnline: true } });
    assert.deepEqual(receivedPresence, { 'user-1': { state: 'online', isOnline: true } });
    unsubscribe();
    assert.equal(unsubscribed, true);
  } finally {
    firebaseBridge.ensureReady = originalEnsureReady;
  }
});

test('message sends are authenticated, stable-ID writes using the current account identity', async () => {
  const originalEnsureReady = firebaseBridge.ensureReady;
  const originalActiveUser = firebaseBridge.activeUser;
  const serviceCalls = [];
  firebaseBridge.ensureReady = async () => ({
    auth: { currentUser: { uid: 'firebase-user-1' } },
    sendMessage: async (channelId, text, options) => {
      serviceCalls.push({ channelId, text, options });
      return { id: options.id };
    }
  });
  firebaseBridge.setActiveUser({
    uid: 'firebase-user-1',
    id: 'employee-1',
    name: 'Current Employee',
    email: 'employee@example.com'
  });

  try {
    const sent = await firebaseBridge.sendMessage('general', 'Hello', {
      id: 'stable-message-id',
      createdAt: 12345
    });
    assert.equal(serviceCalls.length, 1);
    assert.equal(serviceCalls[0].options.senderUid, 'firebase-user-1');
    assert.equal(serviceCalls[0].options.senderEmail, 'employee@example.com');
    assert.equal(serviceCalls[0].options.id, 'stable-message-id');
    assert.equal(sent.id, 'stable-message-id');
  } finally {
    firebaseBridge.ensureReady = originalEnsureReady;
    firebaseBridge.setActiveUser(originalActiveUser);
  }
});

test('live punch subscription is bounded to the newest 250 records', async () => {
  const originalEnsureReady = firebaseBridge.ensureReady;
  let requestedLimit = null;
  let onSnapshotCallback = null;
  firebaseBridge.ensureReady = async () => ({
    db: {
      collection: () => ({
        orderBy() { return this; },
        limit(count) {
          requestedLimit = count;
          return this;
        },
        onSnapshot(callback) {
          onSnapshotCallback = callback;
          return () => {};
        }
      })
    }
  });

  try {
    const unsubscribe = firebaseBridge.subscribePunchLogs(() => {});
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(requestedLimit, 250);
    assert.equal(typeof onSnapshotCallback, 'function');
    unsubscribe();
  } finally {
    firebaseBridge.ensureReady = originalEnsureReady;
  }
});

test('attendance month fetch uses a bounded timestamp range', async () => {
  const originalEnsureReady = firebaseBridge.ensureReady;
  const filters = [];
  let orderByField = null;
  firebaseBridge.ensureReady = async () => ({
    auth: { currentUser: { uid: 'user-1' } },
    db: {
      collection: () => ({
        where(field, operator, value) {
          filters.push({ field, operator, value });
          return this;
        },
        orderBy(field, direction) {
          orderByField = { field, direction };
          return this;
        },
        get: async () => ({
          forEach(callback) {
            callback({
              id: 'punch-1',
              data: () => ({ uid: 'user-1', action: 'CLOCK_IN', timestamp: new Date(2026, 2, 10).getTime() })
            });
          }
        })
      })
    }
  });

  try {
    const punches = await firebaseBridge.fetchPunchLogsForMonth(2026, 2);
    assert.equal(filters.length, 2);
    assert.deepEqual(filters.map(filter => [filter.field, filter.operator]), [
      ['timestamp', '>='],
      ['timestamp', '<']
    ]);
    assert.equal(filters[0].value, new Date(2026, 2, 1).getTime());
    assert.equal(filters[1].value, new Date(2026, 3, 1).getTime());
    assert.deepEqual(orderByField, { field: 'timestamp', direction: 'desc' });
    assert.equal(punches.length, 1);
    assert.equal(punches[0].id, 'punch-1');
  } finally {
    firebaseBridge.ensureReady = originalEnsureReady;
  }
});

test('presence status uses RTDB connection state and avoids fake device telemetry', () => {
  assert.match(appSource, /firebaseBridge\.subscribePresence/);
  assert.match(appSource, /presenceSource: 'rtdb'/);
  assert.match(appSource, /livePresenceReadyRef\.current = true/);
  assert.doesNotMatch(appSource, /updateMemberStatus/);
  assert.match(teamViewSource, /memberDutyLabel/);
  assert.match(teamViewSource, /memberLastSeenLabel/);
  assert.doesNotMatch(teamViewSource, /Toggle Online \/ Offline/);
  assert.doesNotMatch(workspaceOsSource, /setCpuUsage|12ms TLS 1\.3|EXECUTIVE CLUSTER SYNCHRONIZED/);
  assert.match(workspaceOsSource, /APP USAGE/);
  assert.match(workspaceOsSource, /Not collected/);
  assert.match(firebaseServiceSource, /userPresenceRef\.onDisconnect\(\)\.set\(offlineStatus\)/);
  assert.doesNotMatch(firebaseServiceSource, /updateMyPresence|updatePresenceFirestore|toolDailyUsage|backgroundTools|activeTool/);
  assert.match(messageViewSource, /currentUserEmail/);
  assert.doesNotMatch(messageViewSource, /RD-FOUNDER-001|jagadish2k2006@gmail\.com/);
});
