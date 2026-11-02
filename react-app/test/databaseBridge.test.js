import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { databaseBridge } from '../src/services/databaseBridge.js';
import { electronBridge } from '../src/services/electronBridge.js';

const originalDatabase = {
  members: [{ id: 'member-1', name: 'Team member' }],
  tasks: [{ id: 'task-1', title: 'Existing task' }],
  punchLogs: [{ id: 'punch-1', action: 'CLOCK_IN' }],
  files: [{ id: 'file-old', name: 'Existing file' }],
  userProfile: { name: 'Team member', theme: 'dark' },
  appSettings: { autoStart: true }
};

let persistedDatabase;

beforeEach(async () => {
  persistedDatabase = structuredClone(originalDatabase);
  electronBridge.loadState = async () => structuredClone(originalDatabase);
  electronBridge.saveState = async state => {
    persistedDatabase = structuredClone(state);
    return true;
  };
  await databaseBridge.loadWorkspaceDatabase();
});

test('saving files preserves unrelated workspace data', async () => {
  await databaseBridge.saveWorkspaceSection('files', [{ id: 'file-new', name: 'New file' }]);

  assert.deepEqual(persistedDatabase.files, [{ id: 'file-new', name: 'New file' }]);
  assert.deepEqual(persistedDatabase.members, originalDatabase.members);
  assert.deepEqual(persistedDatabase.tasks, originalDatabase.tasks);
  assert.deepEqual(persistedDatabase.punchLogs, originalDatabase.punchLogs);
  assert.deepEqual(persistedDatabase.userProfile, originalDatabase.userProfile);
  assert.deepEqual(persistedDatabase.appSettings, originalDatabase.appSettings);
});

test('saving a profile preserves files and other workspace data', async () => {
  await databaseBridge.saveWorkspaceSection('userProfile', { ...originalDatabase.userProfile, avatar: 'photo-data' });

  assert.deepEqual(persistedDatabase.userProfile, { ...originalDatabase.userProfile, avatar: 'photo-data' });
  assert.deepEqual(persistedDatabase.files, originalDatabase.files);
  assert.deepEqual(persistedDatabase.members, originalDatabase.members);
  assert.deepEqual(persistedDatabase.tasks, originalDatabase.tasks);
});

test('workspace section writes reject invalid values and unsupported keys', async () => {
  await assert.rejects(databaseBridge.saveWorkspaceSection('files', {}), TypeError);
  await assert.rejects(databaseBridge.saveWorkspaceSection('userProfile', []), TypeError);
  await assert.rejects(databaseBridge.saveWorkspaceSection('tasks', []), TypeError);

  assert.deepEqual(persistedDatabase, originalDatabase);
});

test('workspace section write reports persistence failures', async () => {
  electronBridge.saveState = async () => {
    throw new Error('disk write failed');
  };

  await assert.rejects(
    databaseBridge.saveWorkspaceSection('files', []),
    /disk write failed/
  );
});

test('attendance punch retries update the stable local record instead of duplicating it', async () => {
  const punch = { id: 'punch-stable', action: 'CLOCK_IN', cloudSynced: false };
  await databaseBridge.appendPunchLog(punch);
  await databaseBridge.appendPunchLog({ ...punch, cloudSynced: true });

  const matchingPunches = persistedDatabase.punchLogs.filter(entry => entry.id === punch.id);
  assert.equal(matchingPunches.length, 1);
  assert.equal(matchingPunches[0].cloudSynced, true);
});
