import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';
import { firebaseBridge } from '../src/services/firebaseBridge.js';

const source = await readFile(new URL('../public/auth-policy.js', import.meta.url), 'utf8');
const authScreenSource = await readFile(new URL('../src/components/AuthScreen.jsx', import.meta.url), 'utf8');
const appSource = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
const mainSource = await readFile(new URL('../../main.js', import.meta.url), 'utf8');
const browserWindow = {};
runInNewContext(source, { window: browserWindow });

test('workspace auth policy approves only the Firestore-rules allowlist', () => {
  const policy = browserWindow.REDDOT_AUTH_POLICY;
  assert.equal(policy.isApprovedEmail('JAGADISH2K2006@gmail.com'), true);
  assert.equal(policy.isApprovedEmail('keerthijai909@gmail.com'), true);
  assert.equal(policy.isApprovedEmail('unknown@example.com'), false);
  assert.equal(policy.isApprovedEmail(''), false);
  assert.equal(policy.isApprovedEmail(null), false);
});

test('workspace auth policy maps approved accounts to their restricted default role', () => {
  const policy = browserWindow.REDDOT_AUTH_POLICY;
  assert.equal(policy.roleForEmail('jagadish2k2006@gmail.com'), 'Founder');
  assert.equal(policy.roleForEmail('keerthijai909@gmail.com'), 'CEO');
  assert.equal(policy.roleForEmail('pavithratech1206@gmail.com'), 'Employee');
  assert.equal(policy.roleForEmail('unknown@example.com'), null);
});

test('Firebase attendance writes use the authenticated UID and a stable document ID', async () => {
  const originalWindow = globalThis.window;
  const originalEnsureReady = firebaseBridge.ensureReady;
  const originalActiveUser = firebaseBridge.activeUser;
  const writes = [];
  globalThis.window = { REDDOT_AUTH_POLICY: browserWindow.REDDOT_AUTH_POLICY };
  firebaseBridge.ensureReady = async () => ({
    auth: { currentUser: { uid: 'firebase-user-1', email: 'pavithratech1206@gmail.com' } },
    currentMember: { id: 'RD-EMP-002', role: 'Employee' },
    db: {
      collection: path => ({
        doc: id => ({
          set: async payload => writes.push({ path, id, payload })
        })
      })
    }
  });
  firebaseBridge.setActiveUser({
    uid: 'firebase-user-1',
    id: 'RD-EMP-002',
    name: 'Approved employee',
    email: 'pavithratech1206@gmail.com'
  });

  try {
    const saved = await firebaseBridge.recordPunch('CLOCK_IN', {
      id: 'punch-stable-id',
      employeeName: 'Approved employee'
    });

    assert.equal(writes.length, 2);
    assert.equal(writes[0].path, 'organizations/reddot/punchLogs');
    assert.equal(writes[0].id, 'punch-stable-id');
    assert.equal(writes[0].payload.uid, 'firebase-user-1');
    assert.equal(writes[0].payload.email, 'pavithratech1206@gmail.com');
    assert.equal(writes[1].path, 'organizations/reddot/members');
    assert.equal(writes[1].id, 'firebase-user-1');
    assert.equal(writes[1].payload.status, 'DUTY_ON');
    assert.equal(saved.cloudSynced, true);
  } finally {
    firebaseBridge.ensureReady = originalEnsureReady;
    firebaseBridge.setActiveUser(originalActiveUser);
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
  }
});

test('Firebase attendance writes reject when no user is authenticated', async () => {
  const originalEnsureReady = firebaseBridge.ensureReady;
  firebaseBridge.ensureReady = async () => ({
    auth: { currentUser: null },
    db: { collection() { throw new Error('unexpected write'); } }
  });

  try {
    await assert.rejects(
      firebaseBridge.recordPunch('CLOCK_IN', { id: 'punch-unauthenticated' }),
      /signed-in Firebase user/
    );
  } finally {
    firebaseBridge.ensureReady = originalEnsureReady;
  }
});

test('Firestore realtime subscriptions do not duplicate initial reads with REST', async () => {
  const originalEnsureReady = firebaseBridge.ensureReady;
  const originalFetchTasks = firebaseBridge.fetchTasksRest;
  const originalFetchMembers = firebaseBridge.fetchMembersRest;
  const originalFetchMessages = firebaseBridge.fetchChannelMessagesRest;
  const restReads = [];
  const subscriptions = [];
  const snapshot = { forEach: callback => callback({ id: 'doc-1', data: () => ({}) }) };
  const query = {
    orderBy() { return this; },
    limit() { return this; },
    onSnapshot(callback) {
      subscriptions.push(callback);
      callback(snapshot);
      return () => {};
    }
  };
  firebaseBridge.ensureReady = async () => ({
    db: {
      collection: () => query
    }
  });
  firebaseBridge.fetchTasksRest = async () => { restReads.push('tasks'); return []; };
  firebaseBridge.fetchMembersRest = async () => { restReads.push('members'); return []; };
  firebaseBridge.fetchChannelMessagesRest = async () => { restReads.push('messages'); return []; };

  try {
    const unsubscribeTasks = firebaseBridge.subscribeTasks(() => {});
    const unsubscribeMembers = firebaseBridge.subscribeMembers(() => {});
    const unsubscribeMessages = firebaseBridge.subscribeChannelMessages('general', () => {});
    await new Promise(resolve => setImmediate(resolve));

    assert.equal(subscriptions.length, 3);
    assert.deepEqual(restReads, []);
    unsubscribeTasks();
    unsubscribeMembers();
    unsubscribeMessages();
  } finally {
    firebaseBridge.ensureReady = originalEnsureReady;
    firebaseBridge.fetchTasksRest = originalFetchTasks;
    firebaseBridge.fetchMembersRest = originalFetchMembers;
    firebaseBridge.fetchChannelMessagesRest = originalFetchMessages;
  }
});

test('clearing the Firebase bridge user removes cached identity', () => {
  firebaseBridge.setActiveUser({
    uid: 'firebase-user-1',
    name: 'Approved employee',
    email: 'pavithratech1206@gmail.com'
  });
  firebaseBridge.setActiveUser(null);

  assert.equal(firebaseBridge.activeUser, null);
});

test('credential login has no cached-member or password-length fallback', () => {
  assert.doesNotMatch(authScreenSource, /teamMembers\.find|password\.length\s*>=\s*4/);
  assert.match(authScreenSource, /setErrorMsg\(err\.message/);
});

test('Firebase bridge logout signs out and clears its cached user', async () => {
  const originalEnsureReady = firebaseBridge.ensureReady;
  let signOutCalled = false;
  firebaseBridge.ensureReady = async () => ({
    signOut: async () => {
      signOutCalled = true;
    }
  });
  firebaseBridge.setActiveUser({ uid: 'firebase-user-1', email: 'pavithratech1206@gmail.com' });

  try {
    await firebaseBridge.signOut();
    assert.equal(signOutCalled, true);
    assert.equal(firebaseBridge.activeUser, null);
  } finally {
    firebaseBridge.ensureReady = originalEnsureReady;
  }
});

test('app launch and shutdown do not create attendance punches', () => {
  assert.doesNotMatch(appSource, /Auto Clock-in on Workstation Start|autoPerformExitClockOut/);
  assert.doesNotMatch(mainSource, /autoPerformExitClockOut/);
});
