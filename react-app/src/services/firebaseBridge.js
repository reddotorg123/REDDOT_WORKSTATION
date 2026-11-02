/**
 * REDDOT WORKSTATION • CLOUD FIRESTORE REALTIME BRIDGE
 * Universal dual-layer database adapter:
 * - Layer 1: Real-time Cloud Firestore WebSDK (onSnapshot push listeners)
 * - Layer 2: Direct Cloud Firestore REST API (immediate GET, PATCH, DELETE operations)
 * - Layer 3: Resilient background synchronization & zero-latency local optimistic updates
 */

const ORG_ID = 'reddot';
const PROJECT_ID = 'reddot-workspace';
const API_KEY = 'AIzaSyBpjenDcXDREseIDv5NfgpDo2fAk_gUhdk';
const FIRESTORE_REST_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/organizations/${ORG_ID}`;

// Helper: Convert JS Value to Firestore REST field
function toFirestoreValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return { integerValue: String(val) };
    return { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  }
  if (typeof val === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

// Helper: Convert Firestore REST field to JS Value
function fromFirestoreValue(val) {
  if (!val) return null;
  if ('stringValue' in val) return val.stringValue;
  if ('booleanValue' in val) return val.booleanValue;
  if ('integerValue' in val) return Number(val.integerValue);
  if ('doubleValue' in val) return Number(val.doubleValue);
  if ('nullValue' in val) return null;
  if ('arrayValue' in val) {
    return (val.arrayValue.values || []).map(fromFirestoreValue);
  }
  if ('mapValue' in val) {
    const obj = {};
    const fields = val.mapValue.fields || {};
    for (const [k, v] of Object.entries(fields)) {
      obj[k] = fromFirestoreValue(v);
    }
    return obj;
  }
  return null;
}

// Helper: Decode a full Firestore REST document
function fromFirestoreDoc(doc) {
  if (!doc) return null;
  const fields = doc.fields || {};
  const res = { id: doc.name.split('/').pop() };
  for (const [k, v] of Object.entries(fields)) {
    res[k] = fromFirestoreValue(v);
  }
  return res;
}

class FirebaseBridgeService {
  constructor() {
    this.service = null;
    this.unsubscribers = [];
    this.isReady = false;
    this.activeUser = null;
  }

  setActiveUser(user) {
    if (user && typeof user === 'object') {
      this.activeUser = { ...user };
    } else {
      this.activeUser = null;
    }
  }

  toAuthProfile(user, member = null) {
    const email = (user?.email || '').trim().toLowerCase();
    const role = member?.role || window.REDDOT_AUTH_POLICY?.roleForEmail(email) || 'Employee';
    const isFounder = email === 'jagadish2k2006@gmail.com' || email === 'reddot.org.123@gmail.com';
    const isKeerthi = email === 'keerthijai909@gmail.com';
    return {
      uid: user.uid,
      id: member?.id || (isFounder ? 'RD-FOUNDER-001' : (isKeerthi ? 'RD-CEO-002' : `RD-${user.uid.slice(0, 6).toUpperCase()}`)),
      name: member?.displayName || member?.name || user.displayName || email.split('@')[0],
      email,
      role: String(role).toUpperCase(),
      department: member?.dept || (isFounder ? 'Hardware Architecture' : (isKeerthi ? 'Executive Management' : 'Engineering')),
      avatar: member?.photoUrl || member?.photoURL || user.photoURL || ''
    };
  }

  async signOut() {
    const svc = await this.ensureReady();
    if (!svc || typeof svc.signOut !== 'function') {
      throw new Error('Firebase Auth service is unavailable.');
    }

    await svc.signOut();
    this.activeUser = null;
  }

  async setSessionPersistence(rememberSession) {
    const svc = await this.ensureReady();
    const persistence = window.firebase?.auth?.Auth?.Persistence;
    if (!svc?.auth || !persistence) {
      throw new Error('Firebase Auth persistence is unavailable.');
    }
    await svc.auth.setPersistence(rememberSession ? persistence.LOCAL : persistence.SESSION);
  }

  async ensureReady() {
    if (this.isReady && this.service && this.service.db) return this.service;

    let retries = 35;
    while (retries > 0) {
      if (typeof window !== 'undefined' && window.FirebaseService) {
        this.service = window.FirebaseService;
        try {
          if (typeof this.service.ensureReady === 'function') {
            await this.service.ensureReady();
          }
          if (this.service.db) {
            this.isReady = true;
            return this.service;
          }
        } catch (e) {
          console.warn('[FIREBASE_BRIDGE] ensureReady warning:', e);
        }
      }
      await new Promise(r => setTimeout(r, 80));
      retries--;
    }

    if (typeof window !== 'undefined' && window.FirebaseService) {
      this.service = window.FirebaseService;
      return this.service;
    }

    return null;
  }

  // Generic REST Request to Firestore
  async restRequest(method, endpoint, payload = null, updateMask = null) {
    try {
      let url = `${FIRESTORE_REST_BASE}/${endpoint}?key=${API_KEY}`;
      if (updateMask && Array.isArray(updateMask)) {
        updateMask.forEach(field => {
          url += `&updateMask.fieldPaths=${encodeURIComponent(field)}`;
        });
      }

      const opts = {
        method,
        headers: { 'Content-Type': 'application/json' }
      };

      if (payload && (method === 'PATCH' || method === 'POST')) {
        const fields = {};
        for (const [k, v] of Object.entries(payload)) {
          if (v !== undefined) fields[k] = toFirestoreValue(v);
        }
        opts.body = JSON.stringify({ fields });
      }

      const res = await this.authenticatedRestFetch(url, opts);
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.warn(`[FIREBASE REST] ${method} ${endpoint} status ${res.status}:`, text.slice(0, 200));
        return null;
      }
      return await res.json().catch(() => ({}));
    } catch (err) {
      console.warn(`[FIREBASE REST] Error on ${method} ${endpoint}:`, err.message);
      return null;
    }
  }

  async authenticatedRestFetch(url, options = {}) {
    const svc = await this.ensureReady();
    const user = svc?.auth?.currentUser;
    if (!user) {
      throw new Error('A signed-in Firebase user is required for Firestore REST requests.');
    }

    const idToken = await user.getIdToken();
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${idToken}`
      }
    });
  }

  // --- Auth & User Profile ---
  onAuthStateChanged(callback) {
    if (typeof window === 'undefined') return () => {};
    let cancelled = false;
    let unsubscribe = null;

    this.ensureReady().then(svc => {
      if (cancelled) return;
      if (svc && typeof svc.onAuthStateChanged === 'function') {
        unsubscribe = svc.onAuthStateChanged((user, member) => {
          if (cancelled) return;
          if (!user) {
            this.setActiveUser(null);
            callback(null);
            return;
          }
          const profile = this.toAuthProfile(user, member);
          this.setActiveUser(profile);
          callback(profile);
        });
      } else {
        console.error('[AUTH] Firebase Auth state listener is unavailable.');
        callback(null);
      }
    }).catch(error => {
      if (!cancelled) {
        console.error('[AUTH] Could not initialize the Firebase Auth state listener:', error);
        callback(null);
      }
    });

    return () => {
      cancelled = true;
      if (typeof unsubscribe === 'function') unsubscribe();
      this.setActiveUser(null);
    };
  }

  // =========================================================================
  // --- TASKS: FULL BIDIRECTIONAL SYNC & REALTIME DATABASE CONNECTION ---
  // =========================================================================

  async fetchTasksRest() {
    try {
      const url = `${FIRESTORE_REST_BASE}/tasks?key=${API_KEY}&pageSize=100`;
      const res = await this.authenticatedRestFetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      return (data.documents || []).map(fromFirestoreDoc);
    } catch (e) {
      console.warn('[FIREBASE REST] fetchTasksRest error:', e.message);
      return [];
    }
  }

  mapTaskDoc(t, index = 0) {
    if (!t) return null;
    const isCompleted = t.completed === true || t.status === 'Completed' || t.status === 'DONE' || t.status === 'COMPLETED';
    let statusLabel = 'Pending';
    if (isCompleted) statusLabel = 'Completed';
    else if (t.status === 'IN_PROGRESS' || t.status === 'In Progress') statusLabel = 'In Progress';

    const rawPriority = String(t.priority || 'High').toUpperCase();
    const cleanPriority = rawPriority.includes('HIGH') ? 'High' : (rawPriority.includes('LOW') ? 'Low' : 'Medium');

    const subtasks = Array.isArray(t.subtasks)
      ? t.subtasks.map((s, idx) => ({
          id: String(s.id || `sub_${idx}`),
          title: String(s.title || s.text || 'Deliverable'),
          done: !!(s.done || s.completed),
          completed: !!(s.done || s.completed),
          image: s.image || null,
          imageName: s.imageName || null,
          imageSize: s.imageSize || null
        }))
      : (typeof t.subtasks === 'object' && t.subtasks !== null ? Object.values(t.subtasks).map((s, idx) => ({
          id: String(s.id || `sub_${idx}`),
          title: String(s.title || s.text || 'Deliverable'),
          done: !!(s.done || s.completed),
          completed: !!(s.done || s.completed),
          image: s.image || null,
          imageName: s.imageName || null,
          imageSize: s.imageSize || null
        })) : []);

    return {
      id: String(t.id || `task_${index}`),
      title: t.title || 'Untitled Task',
      description: t.description || '',
      category: t.category || 'Engineering',
      priority: cleanPriority,
      assignedTo: t.assigneeName || t.assignee || 'Jagadish K',
      assignee: t.assigneeName || t.assignee || 'Jagadish K',
      dueDate: t.dueAt || t.dueDate || 'Today, 5:00 PM',
      dueAt: t.dueAt || t.dueDate || 'Today, 5:00 PM',
      status: statusLabel,
      completed: isCompleted,
      subtasks,
      createdAt: Number(t.createdAt || Date.now()),
      updatedAt: Number(t.updatedAt || Date.now())
    };
  }

  subscribeTasks(callback) {
    let unsub = () => {};
    let isSubscribed = true;

    const loadRestFallback = () => {
      this.fetchTasksRest().then(restTasks => {
        if (isSubscribed && Array.isArray(restTasks) && restTasks.length > 0) {
          callback(restTasks.map((t, idx) => this.mapTaskDoc(t, idx)).filter(Boolean));
        }
      });
    };

    this.ensureReady().then(svc => {
      if (!isSubscribed) return;
      if (svc && svc.db) {
        try {
          unsub = svc.db.collection(`organizations/${ORG_ID}/tasks`)
            .onSnapshot(snap => {
              if (!isSubscribed) return;
              const cloudTasks = [];
              snap.forEach(doc => {
                cloudTasks.push({ id: doc.id, ...doc.data() });
              });
              const mapped = cloudTasks.map((t, idx) => this.mapTaskDoc(t, idx)).filter(Boolean);
              callback(mapped);
            }, err => {
              console.warn('[FIREBASE] Tasks onSnapshot notice:', err.message);
            });
        } catch (e) {
          console.warn('[FIREBASE] Tasks listener setup error:', e.message);
          loadRestFallback();
        }
      } else {
        loadRestFallback();
      }
    }).catch(error => {
      console.warn('[FIREBASE] Tasks listener initialization error:', error.message);
      loadRestFallback();
    });

    return () => {
      isSubscribed = false;
      try { unsub(); } catch {}
    };
  }

  async createTask(task) {
    if (!task) return null;
    const now = Date.now();
    const taskId = task.id || ('task_' + now + '_' + Math.random().toString(36).substr(2, 4));

    const isCompleted = task.completed === true || task.status === 'Completed' || task.status === 'DONE';
    const statusLabel = isCompleted ? 'Completed' : (task.status === 'In Progress' ? 'In Progress' : 'Pending');

    const sanitizedSubtasks = Array.isArray(task.subtasks) ? task.subtasks.map((s, idx) => ({
      id: String(s.id || `sub_${idx}`),
      title: String(s.title || s.text || 'Deliverable'),
      done: !!(s.done || s.completed),
      completed: !!(s.done || s.completed),
      ...(s.image ? { image: String(s.image) } : {}),
      ...(s.imageName ? { imageName: String(s.imageName) } : {}),
      ...(s.imageSize ? { imageSize: String(s.imageSize) } : {})
    })) : [];

    const taskDoc = {
      id: taskId,
      title: task.title || 'Untitled Task',
      description: task.description || '',
      category: task.category || 'Engineering',
      priority: task.priority || 'High',
      assigneeName: task.assignedTo || task.assignee || 'Jagadish K',
      dueAt: task.dueDate || task.dueAt || 'Today, 5:00 PM',
      dueDate: task.dueDate || task.dueAt || 'Today, 5:00 PM',
      status: statusLabel,
      completed: isCompleted,
      subtasks: sanitizedSubtasks,
      createdAt: task.createdAt ? Number(task.createdAt) : now,
      updatedAt: now
    };

    // 1. Direct REST Write (Immediate, reliable across all environments)
    this.restRequest('PATCH', `tasks/${taskId}`, taskDoc).catch(() => {});

    // 2. Also write to SDK DB if ready
    this.ensureReady().then(svc => {
      if (svc && svc.db) {
        svc.db.collection(`organizations/${ORG_ID}/tasks`).doc(taskId).set(taskDoc, { merge: true }).catch(() => {});
      }
    });

    return taskDoc;
  }

  async updateTask(task) {
    if (!task || !task.id) return;
    const now = Date.now();
    const isCompleted = task.completed === true || task.status === 'Completed' || task.status === 'DONE';
    const statusLabel = isCompleted ? 'Completed' : (task.status === 'In Progress' ? 'In Progress' : 'Pending');

    const sanitizedSubtasks = Array.isArray(task.subtasks) ? task.subtasks.map((s, idx) => ({
      id: String(s.id || `sub_${idx}`),
      title: String(s.title || s.text || 'Deliverable'),
      done: !!(s.done || s.completed),
      completed: !!(s.done || s.completed),
      ...(s.image ? { image: String(s.image) } : {}),
      ...(s.imageName ? { imageName: String(s.imageName) } : {}),
      ...(s.imageSize ? { imageSize: String(s.imageSize) } : {})
    })) : [];

    const payload = {
      id: task.id,
      title: task.title,
      description: task.description || '',
      category: task.category || 'Engineering',
      priority: task.priority || 'High',
      assigneeName: task.assignedTo || task.assignee || 'Jagadish K',
      dueAt: task.dueDate || task.dueAt || 'Today, 5:00 PM',
      dueDate: task.dueDate || task.dueAt || 'Today, 5:00 PM',
      status: statusLabel,
      completed: isCompleted,
      subtasks: sanitizedSubtasks,
      documents: Array.isArray(task.documents) ? task.documents : [],
      updatedAt: now
    };

    // 1. Direct REST update
    this.restRequest('PATCH', `tasks/${task.id}`, payload).catch(() => {});

    // 2. SDK update
    this.ensureReady().then(svc => {
      if (svc && svc.db) {
        svc.db.collection(`organizations/${ORG_ID}/tasks`).doc(task.id).set(payload, { merge: true }).catch(() => {});
      }
    });

    return payload;
  }

  async updateTaskStatus(taskId, status, isCompleted = false) {
    if (!taskId) return;
    const now = Date.now();
    const cleanStatus = isCompleted ? 'Completed' : (status === 'Completed' ? 'Completed' : (status === 'In Progress' ? 'In Progress' : 'Pending'));
    const completedVal = isCompleted || cleanStatus === 'Completed';

    const payload = {
      status: cleanStatus,
      completed: completedVal,
      updatedAt: now
    };

    // 1. Direct REST update with updateMask
    this.restRequest('PATCH', `tasks/${taskId}`, payload, ['status', 'completed', 'updatedAt']).catch(() => {});

    // 2. SDK update
    this.ensureReady().then(svc => {
      if (svc && svc.db) {
        svc.db.collection(`organizations/${ORG_ID}/tasks`).doc(taskId).set(payload, { merge: true }).catch(() => {});
      }
    });

    return payload;
  }

  async updateTaskSubtask(taskId, subtaskId, isCompleted) {
    if (!taskId || !subtaskId) return;
    const now = Date.now();

    // Fetch existing task doc via REST, update matching subtask, then save
    try {
      const url = `${FIRESTORE_REST_BASE}/tasks/${taskId}?key=${API_KEY}`;
      const res = await this.authenticatedRestFetch(url);
      if (res.ok) {
        const raw = await res.json();
        const task = fromFirestoreDoc(raw);
        if (task && Array.isArray(task.subtasks)) {
          const updatedSubtasks = task.subtasks.map(s => {
            if (s.id === subtaskId) {
              return { ...s, done: !!isCompleted, completed: !!isCompleted };
            }
            return s;
          });
          await this.restRequest('PATCH', `tasks/${taskId}`, { subtasks: updatedSubtasks, updatedAt: now }, ['subtasks', 'updatedAt']);
        }
      }
    } catch {}

    // Also update via SDK if ready
    this.ensureReady().then(async (svc) => {
      if (svc && svc.db) {
        try {
          const ref = svc.db.collection(`organizations/${ORG_ID}/tasks`).doc(taskId);
          const doc = await ref.get();
          if (doc.exists) {
            const data = doc.data();
            let subtasks = data.subtasks || [];
            if (Array.isArray(subtasks)) {
              subtasks = subtasks.map(s => s.id === subtaskId ? { ...s, done: !!isCompleted, completed: !!isCompleted } : s);
            }
            await ref.update({ subtasks, updatedAt: now });
          }
        } catch {}
      }
    });
  }

  async deleteTask(taskId) {
    if (!taskId) return;

    // 1. Direct REST DELETE
    this.restRequest('DELETE', `tasks/${taskId}`).catch(() => {});

    // 2. SDK delete
    this.ensureReady().then(svc => {
      if (svc && svc.db) {
        svc.db.collection(`organizations/${ORG_ID}/tasks`).doc(taskId).delete().catch(() => {});
      }
    });

    return true;
  }

  // =========================================================================
  // --- TEAM MEMBERS: FULL REALTIME CLOUD CONNECTION ---
  // =========================================================================

  async fetchMembersRest() {
    try {
      const url = `${FIRESTORE_REST_BASE}/members?key=${API_KEY}&pageSize=100`;
      const res = await this.authenticatedRestFetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      return (data.documents || []).map(fromFirestoreDoc);
    } catch (e) {
      console.warn('[FIREBASE REST] fetchMembersRest error:', e.message);
      return [];
    }
  }

  mapMemberDoc(m, index = 0) {
    if (!m) return null;
    const email = (m.email || '').toLowerCase().trim();
    const id = (m.id || m.uid || '').trim();
    const name = (m.displayName || m.name || '').toLowerCase().trim();

    if (!m.email && !m.displayName && !m.name) return null;
    if (id === 'GUEST' || id === 'RD-GUEST' || id.startsWith('RD-RD-') || id === 'RD-EMP-001' || id === 'RD-EMP-002' || id === 'RD-FAE7BQ' || id === 'RD-002' || email.endsWith('@reddot.com') || name === 'team member' || name === 'teammate') {
      return null;
    }

    const rawStatus = String(m.status || '').toUpperCase();
    const presenceState = String(m.presenceState || '').toLowerCase();
    const lastSeenAt = Number(m.lastSeenAt || 0);
    const isRecentlyActive = lastSeenAt > 0 && Date.now() - lastSeenAt < 150000;
    const isExplicitOnline = presenceState
      ? presenceState === 'online'
      : (m.online === true || m.isOnline === true || rawStatus === 'ONLINE' || rawStatus === 'DUTY_ON');
    const isOnline = rawStatus !== 'RESIGNED' && isExplicitOnline && isRecentlyActive;
    const dutyStatus = rawStatus === 'DUTY_ON'
      ? 'On Duty'
      : rawStatus === 'DUTY_OFF'
        ? 'Off Duty'
        : rawStatus === 'ON_BREAK' || rawStatus === 'BREAK'
          ? 'On Break'
          : rawStatus === 'RESIGNED'
            ? 'Resigned'
            : 'Unknown';

    return {
      id: m.id || m.uid || m.docId || String(index + 1).padStart(2, '0'),
      uid: m.uid || m.id || id,
      docId: m.docId || m.uid || m.id,
      name: m.displayName || m.name || (email ? email.split('@')[0] : 'Teammate'),
      email: m.email || '',
      role: m.role || 'Developer',
      department: m.dept || m.department || 'Engineering',
      status: isOnline ? 'Online' : (rawStatus === 'RESIGNED' ? 'Resigned' : 'Offline'),
      isOnline,
      presenceState: isOnline ? 'online' : 'offline',
      lastSeenAt,
      dutyStatus,
      activeTool: m.activeTool || null,
      avatar: m.photoUrl || m.photoURL || m.customPhoto || './assets/id-card.png',
      lastActive: isOnline ? 'Active now' : (lastSeenAt ? this.formatRelativeTime(lastSeenAt) : 'Offline'),
      tasksAssigned: m.tasksAssigned || 0,
      active: m.active !== false
    };
  }

  formatRelativeTime(timestamp) {
    const elapsedMs = Math.max(0, Date.now() - Number(timestamp || 0));
    if (elapsedMs < 60000) return 'Just now';
    const minutes = Math.floor(elapsedMs / 60000);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;
    return `${Math.floor(hours / 24)} day(s) ago`;
  }

  subscribeMembers(callback) {
    let unsub = () => {};
    let isSubscribed = true;

    this.ensureReady().then(svc => {
      if (!isSubscribed) return;
      if (svc && svc.db) {
        try {
          unsub = svc.db.collection(`organizations/${ORG_ID}/members`)
            .onSnapshot(snap => {
              if (!isSubscribed) return;
              const cloudMembers = [];
              snap.forEach(doc => {
                cloudMembers.push({ id: doc.id, ...doc.data() });
              });
              const mapped = cloudMembers.map((m, idx) => this.mapMemberDoc(m, idx)).filter(Boolean);
              if (mapped.length > 0) callback(mapped);
            }, err => {
              console.warn('[FIREBASE] Members onSnapshot notice:', err.message);
            });
        } catch (e) {
          console.warn('[FIREBASE] Members subscription error:', e.message);
          this.fetchMembersRest().then(restMembers => {
            if (!isSubscribed || !Array.isArray(restMembers)) return;
            const mapped = restMembers.map((m, idx) => this.mapMemberDoc(m, idx)).filter(Boolean);
            if (mapped.length > 0) callback(mapped);
          });
        }
      } else {
        this.fetchMembersRest().then(restMembers => {
          if (!isSubscribed || !Array.isArray(restMembers)) return;
          const mapped = restMembers.map((m, idx) => this.mapMemberDoc(m, idx)).filter(Boolean);
          if (mapped.length > 0) callback(mapped);
        });
      }
    }).catch(error => {
      console.warn('[FIREBASE] Members listener initialization error:', error.message);
      this.fetchMembersRest().then(restMembers => {
        if (!isSubscribed || !Array.isArray(restMembers)) return;
        const mapped = restMembers.map((m, idx) => this.mapMemberDoc(m, idx)).filter(Boolean);
        if (mapped.length > 0) callback(mapped);
      });
    });

    return () => {
      isSubscribed = false;
      try { unsub(); } catch {}
    };
  }

  async createMember(member) {
    if (!member) return null;
    const now = Date.now();
    const uid = member.uid || member.id || ('RD_' + now.toString(36).toUpperCase());
    const memberDoc = {
      uid: uid,
      id: member.id || `RD-${uid.slice(0, 6).toUpperCase()}`,
      displayName: member.name,
      name: member.name,
      email: member.email,
      role: member.role || 'Developer',
      dept: member.department || 'Engineering',
      status: member.status === 'Online' ? 'DUTY_ON' : 'DUTY_OFF',
      online: member.status === 'Online',
      isOnline: member.status === 'Online',
      active: true,
      createdAt: now,
      updatedAt: now
    };

    this.restRequest('PATCH', `members/${uid}`, memberDoc).catch(() => {});

    this.ensureReady().then(svc => {
      if (svc && svc.db) {
        svc.db.collection(`organizations/${ORG_ID}/members`).doc(uid).set(memberDoc, { merge: true }).catch(() => {});
      }
    });

    return memberDoc;
  }

  subscribePresence(callback) {
    let isSubscribed = true;
    let unsubscribe = () => {};

    this.ensureReady().then(svc => {
      if (!isSubscribed) return;
      if (!svc?.rtdb || typeof svc.subscribeAllPresence !== 'function') {
        console.error('[PRESENCE] Realtime Database presence is unavailable.');
        return;
      }
      unsubscribe = svc.subscribeAllPresence(presenceMap => {
        if (isSubscribed) callback(presenceMap || {});
      });
    }).catch(error => {
      console.error('[PRESENCE] Could not subscribe to realtime presence:', error);
    });

    return () => {
      isSubscribed = false;
      try {
        unsubscribe();
      } catch (error) {
        console.warn('[PRESENCE] Could not remove realtime presence subscription:', error);
      }
    };
  }

  async updateMemberRole(targetUid, newRole, newDept = null) {
    if (!targetUid || !newRole) return;
    const now = Date.now();
    const payload = {
      role: newRole,
      updatedAt: now
    };
    if (newDept) payload.dept = newDept;

    const fields = ['role', 'updatedAt'];
    if (newDept) fields.push('dept');

    this.restRequest('PATCH', `members/${targetUid}`, payload, fields).catch(() => {});

    this.ensureReady().then(svc => {
      if (svc && svc.db) {
        svc.db.collection(`organizations/${ORG_ID}/members`).doc(targetUid).set(payload, { merge: true }).catch(() => {});
      }
    });
  }

  async updateMemberPhoto(photoDataUrl) {
    if (!photoDataUrl) return;
    const now = Date.now();
    const targetUid = 'Uvhr9MPQ0RODCujtxzUiWcJBzHk2'; // Jagadish K
    const payload = {
      photoURL: photoDataUrl,
      photoUrl: photoDataUrl,
      customPhoto: photoDataUrl,
      isCustomPhoto: true,
      updatedAt: now
    };

    this.restRequest('PATCH', `members/${targetUid}`, payload, ['photoURL', 'photoUrl', 'customPhoto', 'isCustomPhoto', 'updatedAt']).catch(() => {});

    this.ensureReady().then(svc => {
      if (svc && svc.db) {
        svc.db.collection(`organizations/${ORG_ID}/members`).doc(targetUid).set(payload, { merge: true }).catch(() => {});
      }
    });
  }

  // =========================================================================
  // --- ATTENDANCE & SHIFT PUNCH LOGS ---
  // =========================================================================

  async fetchPunchLogsForMonth(year, monthIndex) {
    const svc = await this.ensureReady();
    if (!svc?.db || !svc?.auth?.currentUser) {
      throw new Error('Sign in before loading attendance history.');
    }

    const start = new Date(year, monthIndex, 1).getTime();
    const end = new Date(year, monthIndex + 1, 1).getTime();
    const snapshot = await svc.db.collection(`organizations/${ORG_ID}/punchLogs`)
      .where('timestamp', '>=', start)
      .where('timestamp', '<', end)
      .orderBy('timestamp', 'desc')
      .get();
    const punches = [];
    snapshot.forEach(doc => punches.push({ id: doc.id, ...doc.data() }));
    return punches.map((punch, index) => this.mapPunchDoc(punch, index)).filter(Boolean);
  }

  mapPunchDoc(p, index = 0) {
    if (!p) return null;
    const dateStr = p.date || (p.timestamp ? new Date(p.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '');
    const timeStr = p.time || (p.timestamp ? new Date(p.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--:--');
    return {
      ...p,
      id: p.id || `punch_${index}`,
      employee: p.employeeName || p.name || p.workerName || p.email || p.uid || 'Unknown employee',
      date: dateStr,
      clockIn: (p.action === 'CLOCK_IN' || p.action === 'PUNCH_IN') ? timeStr : (p.clockIn || '--'),
      clockOut: (p.action === 'CLOCK_OUT' || p.action === 'PUNCH_OUT') ? timeStr : (p.clockOut || '--'),
      duration: p.duration || (p.sessionHours ? `${p.sessionHours}h` : ''),
      status: p.status || (p.action === 'CLOCK_OUT' ? 'Completed' : (p.action ? 'Present' : 'Unknown')),
      action: p.action || '',
      timestamp: Number(p.timestamp || 0)
    };
  }

  subscribePunchLogs(callback) {
    let unsub = () => {};
    let isSubscribed = true;

    this.ensureReady().then(svc => {
      if (!isSubscribed) return;
      if (svc && svc.db) {
        try {
          unsub = svc.db.collection(`organizations/${ORG_ID}/punchLogs`)
            .orderBy('timestamp', 'desc')
            .limit(250)
            .onSnapshot(snap => {
              if (!isSubscribed) return;
              const punches = [];
              snap.forEach(doc => punches.push({ id: doc.id, ...doc.data() }));
              const mapped = punches.map((p, idx) => this.mapPunchDoc(p, idx)).filter(Boolean);
              callback(mapped);
            }, err => {
              console.warn('[FIREBASE] Punch logs subscription notice:', err.message);
            });
        } catch (error) {
          console.warn('[FIREBASE] Punch logs listener setup error:', error.message);
        }
      }
    }).catch(error => {
      console.warn('[FIREBASE] Punch logs listener initialization error:', error.message);
    });

    return () => {
      isSubscribed = false;
      try { unsub(); } catch {}
    };
  }

  async recordPunch(actionType, extra = {}) {
    const svc = await this.ensureReady();
    const user = svc?.auth?.currentUser;
    if (!user || !svc?.db) {
      throw new Error('A signed-in Firebase user and Firestore connection are required to record attendance.');
    }

    const now = new Date(Number(extra.timestamp) || Date.now());
    const timestamp = Number(extra.timestamp) || Date.now();
    const profile = this.activeUser?.uid === user.uid
      ? this.activeUser
      : this.toAuthProfile(user, svc.currentMember);
    const punchId = extra.id || `punch_${window.crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).slice(2)}`}`;
    const payload = {
      id: punchId,
      workerId: extra.workerId || profile.id || user.uid,
      uid: user.uid,
      name: extra.employeeName || extra.name || profile.name || user.email.split('@')[0],
      email: user.email.toLowerCase(),
      action: actionType || 'CLOCK_IN',
      time: extra.time || now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      date: extra.date || now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      timestamp: timestamp,
      duration: extra.duration || '',
      productiveDuration: extra.productiveDuration || '',
      efficiency: extra.efficiency || '',
      note: extra.note || ''
    };

    await svc.db.collection(`organizations/${ORG_ID}/punchLogs`).doc(punchId).set(payload);

    const dutyStatus = {
      CLOCK_IN: 'DUTY_ON',
      CLOCK_OUT: 'DUTY_OFF',
      BREAK_START: 'ON_BREAK',
      BREAK_END: 'DUTY_ON'
    }[payload.action];
    if (dutyStatus) {
      await svc.db.collection(`organizations/${ORG_ID}/members`).doc(user.uid)
        .set({ status: dutyStatus, dutyUpdatedAt: timestamp }, { merge: true });
    }

    return { ...payload, cloudSynced: true };
  }

  // =========================================================================
  // --- CHANNELS & REALTIME CHAT MESSAGES ---
  // =========================================================================

  getDeterministicDMChannelId(userA, userB) {
    const getEmail = (u) => {
      if (!u) return '';
      let str = typeof u === 'object' ? (u.email || u.uid || u.id || '') : String(u);
      str = str.toLowerCase().trim();
      return str;
    };
    let emailA = getEmail(userA);
    let emailB = getEmail(userB);
    if (emailA.includes('founder') || emailA.includes('jagadish')) emailA = 'jagadish2k2006@gmail.com';
    if (emailB.includes('founder') || emailB.includes('jagadish')) emailB = 'jagadish2k2006@gmail.com';
    if (emailA.includes('pavithra')) emailA = 'pavithratech1206@gmail.com';
    if (emailB.includes('pavithra')) emailB = 'pavithratech1206@gmail.com';
    if (emailA.includes('keerthi') || emailA.includes('jai')) emailA = 'keerthijai909@gmail.com';
    if (emailB.includes('keerthi') || emailB.includes('jai')) emailB = 'keerthijai909@gmail.com';
    if (emailA.includes('tejaswini')) emailA = 'tejaswinisiva02@gmail.com';
    if (emailB.includes('tejaswini')) emailB = 'tejaswinisiva02@gmail.com';

    const sorted = [emailA || 'user_a', emailB || 'user_b'].sort();
    const safe0 = sorted[0].replace(/[^a-z0-9]/gi, '_');
    const safe1 = sorted[1].replace(/[^a-z0-9]/gi, '_');
    return `dm_${safe0}___${safe1}`;
  }

  async fetchChannelsRest() {
    try {
      const url = `${FIRESTORE_REST_BASE}/channels?key=${API_KEY}&pageSize=50`;
      const res = await this.authenticatedRestFetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      return (data.documents || []).map(fromFirestoreDoc);
    } catch {
      return [];
    }
  }

  subscribeChannels(callback) {
    let unsub = () => {};
    let isSubscribed = true;

    const mapChannels = (raw) => {
      return (raw || []).map(c => {
        const id = c.id || '';
        const isDM = c.isDirectMessage ?? id.startsWith('dm_');
        return {
          id: id,
          title: c.name ? (c.name.startsWith('#') ? c.name : `# ${c.name}`) : id,
          unread: c.unreadCount || 0,
          isGroup: !isDM,
          membersCount: c.membersCount || 6,
          lastMessage: c.lastMessageText || 'Recent discussions',
          time: c.lastMessageTime ? new Date(c.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '12:00 PM',
          timestamp: Number(c.lastMessageTime || c.updatedAt || c.createdAt || 0)
        };
      });
    };

    this.ensureReady().then(svc => {
      if (!isSubscribed) return;
      if (svc && svc.db) {
        try {
          unsub = svc.db.collection(`organizations/${ORG_ID}/channels`)
            .onSnapshot(snap => {
              if (!isSubscribed) return;
              const channels = [];
              snap.forEach(doc => channels.push({ id: doc.id, ...doc.data() }));
              callback(mapChannels(channels));
            }, err => console.warn('[FIREBASE] Channels listener notice:', err.message));
        } catch (error) {
          console.warn('[FIREBASE] Channels listener setup error:', error.message);
          this.fetchChannelsRest().then(channels => {
            if (isSubscribed && Array.isArray(channels)) callback(mapChannels(channels));
          });
        }
      } else {
        this.fetchChannelsRest().then(channels => {
          if (isSubscribed && Array.isArray(channels)) callback(mapChannels(channels));
        });
      }
    }).catch(error => {
      console.warn('[FIREBASE] Channels listener initialization error:', error.message);
      this.fetchChannelsRest().then(channels => {
        if (isSubscribed && Array.isArray(channels)) callback(mapChannels(channels));
      });
    });

    return () => {
      isSubscribed = false;
      try { unsub(); } catch {}
    };
  }

  async createChannel(name, options = {}) {
    const channelId = options.id || name.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const channelDoc = {
      id: channelId,
      name: name,
      title: options.title || `# ${name}`,
      isDirectMessage: !!options.isDirect,
      membersCount: options.membersCount || 4,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastMessageText: 'Channel created'
    };

    this.restRequest('PATCH', `channels/${channelId}`, channelDoc).catch(() => {});

    this.ensureReady().then(svc => {
      if (svc && svc.db) {
        svc.db.collection(`organizations/${ORG_ID}/channels`).doc(channelId).set(channelDoc, { merge: true }).catch(() => {});
      }
    });

    return channelDoc;
  }

  async fetchChannelMessagesRest(channelId) {
    if (!channelId) return [];
    try {
      const runQueryUrl = `${FIRESTORE_REST_BASE}/channels/${channelId}:runQuery?key=${API_KEY}`;
      const res = await this.authenticatedRestFetch(runQueryUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: 'messages' }],
            orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'DESCENDING' }],
            limit: 100
          }
        })
      });

      let rawDocs = [];
      if (res.ok) {
        const queryRes = await res.json();
        rawDocs = (queryRes || []).filter(item => item && item.document).map(item => item.document);
      } else {
        const fallbackUrl = `${FIRESTORE_REST_BASE}/channels/${channelId}/messages?key=${API_KEY}&pageSize=300`;
        const fRes = await this.authenticatedRestFetch(fallbackUrl);
        if (fRes.ok) {
          const fData = await fRes.json();
          rawDocs = fData.documents || [];
        }
      }

      const docs = rawDocs.map(fromFirestoreDoc).filter(Boolean);
      return docs.map(d => {
        let attach = d.attachments || [];
        if (d.attachmentsJson && typeof d.attachmentsJson === 'string') {
          try { attach = JSON.parse(d.attachmentsJson); } catch {}
        }
        let reactions = d.reactions || {};
        if (d.reactionsJson && typeof d.reactionsJson === 'string') {
          try { reactions = JSON.parse(d.reactionsJson); } catch {}
        }
        return {
          id: d.id,
          senderName: d.senderName || 'Teammate',
          senderEmail: d.senderEmail || '',
          senderUid: d.senderUid || '',
          senderEmpId: d.senderEmpId || '',
          senderPhoto: d.senderPhoto || '',
          text: d.text || d.content || '',
          createdAt: Number(d.createdAt || d.timestamp || 0),
          timestamp: Number(d.createdAt || d.timestamp || 0),
          reactions: reactions,
          attachments: attach,
          delivered: true
        };
      }).sort((a, b) => a.createdAt - b.createdAt);
    } catch {
      return [];
    }
  }

  subscribeChannelMessages(channelId, callback) {
    if (!channelId) return () => {};
    let unsub = () => {};
    let isSubscribed = true;

    const normalizeMsgList = (cloudMessages) => {
      if (!Array.isArray(cloudMessages)) return [];
      const activeName = (this.activeUser?.name || 'Jagadish K').toLowerCase().trim();
      const activeEmail = (this.activeUser?.email || '').toLowerCase().trim();
      const activeUid = (this.activeUser?.uid || this.activeUser?.id || '').toLowerCase().trim();

      return cloudMessages.map((m, index) => {
        const senderName = (m.senderName || m.authorName || m.sender || '').toLowerCase().trim();
        const senderEmail = (m.senderEmail || '').toLowerCase().trim();
        const senderUid = (m.senderUid || m.senderId || m.senderEmpId || '').toLowerCase().trim();

        const isSelf = !!(
          m.isSelf ||
          m.isOutgoing ||
          (senderName && senderName === activeName) ||
          (senderEmail && activeEmail && senderEmail === activeEmail) ||
          (senderUid && activeUid && senderUid === activeUid)
        );
        const rawTime = m.createdAt || m.timestamp;
        const msgTs = typeof rawTime === 'number' ? rawTime : (rawTime ? new Date(rawTime).getTime() : Date.now());
        const timeStr = m.time || (rawTime ? new Date(rawTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '12:00 PM');
        const attachList = m.attachments || (m.attachment ? [m.attachment] : []);

        let reactions = m.reactions || {};
        if (m.reactionsJson && typeof m.reactionsJson === 'string') {
          try { reactions = JSON.parse(m.reactionsJson); } catch {}
        }

        return {
          id: m.id || `msg-${index}`,
          sender: m.senderName || m.authorName || m.sender || (isSelf ? (this.activeUser?.name || 'You') : 'Teammate'),
          avatar: m.senderPhoto || m.avatar || (isSelf ? (this.activeUser?.avatar || './assets/profile-photo.jpeg') : './assets/id-card.png'),
          time: timeStr,
          timestamp: msgTs,
          createdAt: msgTs,
          text: m.text || m.content || '',
          attachments: attachList,
          attachment: attachList[0] || null,
          reactions: reactions,
          replyTo: m.replyTo || null,
          status: m.status || (m.delivered ? 'READ' : 'DELIVERED'),
          isSelf,
          isOutgoing: isSelf
        };
      });
    };

    const loadRestFallback = () => {
      this.fetchChannelMessagesRest(channelId).then(messages => {
        if (isSubscribed && Array.isArray(messages)) callback(normalizeMsgList(messages));
      });
    };

    this.ensureReady().then((svc) => {
      if (!isSubscribed) return;
      if (!svc || !svc.db) {
        loadRestFallback();
        return;
      }
      try {
        unsub = svc.db.collection(`organizations/${ORG_ID}/channels/${channelId}/messages`)
          .orderBy('createdAt', 'desc')
          .limit(100)
          .onSnapshot(snap => {
            if (!isSubscribed) return;
            const msgs = [];
            snap.forEach(doc => msgs.push({ id: doc.id, ...doc.data() }));
            msgs.reverse();
            callback(normalizeMsgList(msgs));
          }, err => console.warn('[FIREBASE] Channel messages listener notice:', err.message));
      } catch (error) {
        console.warn('[FIREBASE] Channel messages listener setup error:', error.message);
        loadRestFallback();
      }
    }).catch(error => {
      console.warn('[FIREBASE] Channel messages listener initialization error:', error.message);
      loadRestFallback();
    });

    return () => {
      isSubscribed = false;
      try { unsub(); } catch {}
    };
  }

  async sendMessage(channelId, text, options = {}) {
    const cleanChannelId = (channelId || 'general').trim();
    const cleanText = (text || '').trim();
    const now = Date.now();
    const msgId = options.id || ('msg_' + now + '_' + Math.random().toString(36).substring(2, 7));

    const svc = await this.ensureReady();
    if (!svc?.auth?.currentUser || typeof svc.sendMessage !== 'function') {
      throw new Error('Sign in to Firebase before sending a message.');
    }

    const senderName = options.senderName || this.activeUser?.name || '';
    const senderEmail = (options.senderEmail || this.activeUser?.email || '').toLowerCase();
    const senderUid = options.senderUid || svc.auth.currentUser.uid;
    const senderEmpId = options.senderEmpId || this.activeUser?.id || senderUid;
    const senderPhoto = options.senderPhoto || this.activeUser?.avatar || '';
    const attachments = options.attachments || (options.attachment ? [options.attachment] : []);

    return svc.sendMessage(cleanChannelId, cleanText, {
      ...options,
      id: msgId,
      createdAt: options.createdAt || now,
      senderName,
      senderEmail,
      senderUid,
      senderEmpId,
      senderPhoto,
      attachments
    });
  }

  async deleteMessage(channelId, messageId) {
    if (!channelId || !messageId) return;
    const svc = await this.ensureReady();
    if (!svc?.db || !svc?.auth?.currentUser) {
      throw new Error('Sign in to Firebase before deleting a message.');
    }
    await svc.db.collection(`organizations/${ORG_ID}/channels/${channelId}/messages`).doc(messageId).delete();
  }

  async toggleReaction(channelId, messageId, emoji, userName) {
    if (!channelId || !messageId || !emoji) return;

    // Fetch existing message via REST, toggle reaction, and update
    try {
      const url = `${FIRESTORE_REST_BASE}/channels/${channelId}/messages/${messageId}?key=${API_KEY}`;
      const res = await this.authenticatedRestFetch(url);
      if (res.ok) {
        const raw = await res.json();
        const msg = fromFirestoreDoc(raw);
        let reactions = msg.reactions || {};
        if (msg.reactionsJson && typeof msg.reactionsJson === 'string') {
          try { reactions = JSON.parse(msg.reactionsJson); } catch {}
        }

        const users = Array.isArray(reactions[emoji]) ? [...reactions[emoji]] : [];
        const uIdx = users.indexOf(userName);
        if (uIdx >= 0) {
          users.splice(uIdx, 1);
          if (users.length === 0) delete reactions[emoji];
          else reactions[emoji] = users;
        } else {
          users.push(userName);
          reactions[emoji] = users;
        }

        await this.restRequest('PATCH', `channels/${channelId}/messages/${messageId}`, {
          reactionsJson: JSON.stringify(reactions)
        }, ['reactionsJson']);
      }
    } catch {}
  }

  // --- REAL AUTHENTICATION BRIDGES ---
  async signInWithGoogle(rememberSession = true) {
    await this.ensureReady();
    if (typeof window !== 'undefined' && window.FirebaseService && typeof window.FirebaseService.signInWithGoogle === 'function') {
      await this.setSessionPersistence(rememberSession);
      const user = await window.FirebaseService.signInWithGoogle();
      if (user) {
        const authProfile = this.toAuthProfile(user, window.FirebaseService.currentMember);
        this.setActiveUser(authProfile);
        return authProfile;
      }
    }
    throw new Error('Google Sign-in service unavailable or popup was interrupted.');
  }

  async signInWithCredentials(email, password, rememberSession = true) {
    await this.ensureReady();
    if (typeof window !== 'undefined' && window.FirebaseService && typeof window.FirebaseService.signIn === 'function') {
      await this.setSessionPersistence(rememberSession);
      const user = await window.FirebaseService.signIn(email, password);
      if (user) {
        const authProfile = this.toAuthProfile(user, window.FirebaseService.currentMember);
        this.setActiveUser(authProfile);
        return authProfile;
      }
    }
    throw new Error('Invalid email or password.');
  }
}

export const firebaseBridge = new FirebaseBridgeService();
