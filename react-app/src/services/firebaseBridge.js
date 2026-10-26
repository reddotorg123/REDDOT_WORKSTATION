/**
 * REDDOT WORKSTATION • FIREBASE REALTIME ADAPTER
 * Connects React UI components with Cloud Firestore, Multi-Device Presence,
 * Real-time Chat Channels, Live Tasks, and Verified Shift Punches.
 */

const ORG_ID = 'reddot';

class FirebaseBridgeService {
  constructor() {
    this.service = null;
    this.unsubscribers = [];
    this.isReady = false;
  }

  async ensureReady() {
    if (this.isReady && this.service && this.service.db) return this.service;

    let retries = 50;
    while (retries > 0) {
      if (typeof window !== 'undefined' && window.FirebaseService) {
        this.service = window.FirebaseService;
        try {
          if (typeof this.service.ensureReady === 'function') {
            await this.service.ensureReady();
          }
          if (this.service.db && this.service.auth) {
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

    console.warn('[FIREBASE_BRIDGE] FirebaseService not found on window, falling back to local simulation.');
    return null;
  }

  // --- Auth & User Profile ---
  onAuthStateChanged(callback) {
    if (typeof window === 'undefined') return () => {};
    this.ensureReady().then(svc => {
      if (svc && svc.auth) {
        svc.auth.onAuthStateChanged(async (user) => {
          if (user) {
            let memberDoc = null;
            if (typeof svc.getMemberDoc === 'function') {
              try { memberDoc = await svc.getMemberDoc(user.uid); } catch (_) {}
            }
            callback({
              uid: user.uid,
              name: memberDoc?.displayName || user.displayName || user.email?.split('@')[0] || 'Jagadish K',
              email: user.email || 'jagadish2k2006@gmail.com',
              role: (memberDoc?.role || 'FOUNDER').toUpperCase(),
              avatar: memberDoc?.photoUrl || memberDoc?.photoURL || user.photoURL || './assets/id-card.png',
              department: memberDoc?.dept || 'Hardware Architecture'
            });
          } else {
            callback({
              uid: 'guest',
              name: 'Jagadish K',
              email: 'jagadish2k2006@gmail.com',
              role: 'FOUNDER',
              avatar: './assets/id-card.png',
              department: 'Hardware Architecture'
            });
          }
        });
      }
    });
  }

  // --- Team Members Directory ---
  subscribeMembers(callback) {
    let unsub = () => {};
    this.ensureReady().then(svc => {
      if (svc && typeof svc.subscribeMembers === 'function') {
        unsub = svc.subscribeMembers((cloudMembers) => {
          if (!Array.isArray(cloudMembers)) return;
          const now = Date.now();
          const cleanList = cloudMembers.filter(m => {
            if (!m) return false;
            const email = (m.email || '').toLowerCase().trim();
            const id = (m.id || m.uid || '').trim();
            const name = (m.displayName || m.name || '').toLowerCase().trim();
            // Filter out fake mock IDs and placeholder guests
            if (email.endsWith('@reddot.com') || id === 'RD-GUEST' || name === 'team member' || name === 'teammate') {
              return false;
            }
            return true;
          });

          const mapped = cleanList.map(m => {
            const rawStatus = String(m.status || '').toUpperCase();
            // A member is online if explicitly DUTY_ON or isOnline AND not DUTY_OFF/RESIGNED, AND has recent heartbeat within 2 hours
            const lastSeen = m.lastSeenAt || m.updatedAt || 0;
            const isRecentlyActive = lastSeen > 0 && (now - Number(lastSeen)) < (2 * 60 * 60 * 1000);
            const isExplicitOnline = (m.online === true || m.isOnline === true || rawStatus === 'DUTY_ON' || rawStatus === 'ONLINE') &&
                                     rawStatus !== 'DUTY_OFF' && rawStatus !== 'OFFLINE' && rawStatus !== 'RESIGNED';

            const isOnline = isExplicitOnline && (isRecentlyActive || m.email?.toLowerCase().includes('jagadish'));

            return {
              id: m.id || m.uid || m.docId || String(Math.random()),
              uid: m.uid || m.id,
              docId: m.docId || m.uid || m.id,
              name: m.displayName || m.name || (m.email ? m.email.split('@')[0] : 'Teammate'),
              email: m.email || '',
              role: m.role || 'Developer',
              department: m.dept || m.department || 'Engineering',
              status: isOnline ? 'Online' : (rawStatus === 'RESIGNED' ? 'Resigned' : 'Offline'),
              isOnline,
              avatar: m.photoUrl || m.photoURL || m.customPhoto || './assets/id-card.png',
              tasksAssigned: m.tasksAssigned || 0,
              active: m.active !== false
            };
          });
          callback(mapped);
        });
      }
    });
    return () => { try { unsub(); } catch (_) {} };
  }

  async createMember(member) {
    const svc = await this.ensureReady();
    if (!svc || !svc.db) return null;
    const uid = member.uid || member.id || ('RD_' + Date.now().toString(36).toUpperCase());
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
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await svc.db.collection(`organizations/${ORG_ID}/members`).doc(uid).set(memberDoc, { merge: true });
    return memberDoc;
  }

  async updateMemberRole(targetUid, newRole, newDept = null, targetEmail = null) {
    const svc = await this.ensureReady();
    if (svc && typeof svc.updateMemberRole === 'function') {
      return await svc.updateMemberRole(targetUid, newRole, newDept, targetEmail);
    }
  }

  async updateMemberPhoto(photoDataUrl) {
    const svc = await this.ensureReady();
    if (svc && typeof svc.updateMemberPhoto === 'function') {
      const uid = svc.currentUser ? svc.currentUser.uid : 'RD-FOUNDER-001';
      return await svc.updateMemberPhoto(uid, photoDataUrl);
    }
  }

  // --- Live Tasks ---
  subscribeTasks(callback) {
    let unsub = () => {};
    this.ensureReady().then(svc => {
      if (svc && typeof svc.subscribeTasks === 'function') {
        unsub = svc.subscribeTasks((cloudTasks) => {
          if (!Array.isArray(cloudTasks)) return;
          const mapped = cloudTasks.map((t, index) => {
            const rawPriority = String(t.priority || 'High').toUpperCase();
            const cleanPriority = rawPriority.includes('HIGH') ? 'High' : (rawPriority.includes('LOW') ? 'Low' : 'Medium');
            const isCompleted = t.completed === true || t.status === 'Completed' || t.status === 'DONE';
            const statusLabel = isCompleted ? 'Completed' : (t.status === 'IN_PROGRESS' || t.status === 'In Progress' ? 'In Progress' : 'Pending');

            return {
              id: t.id || `task-${index}`,
              title: t.title || 'Untitled Task',
              description: t.description || '',
              category: t.category || 'Engineering',
              priority: cleanPriority,
              assignedTo: t.assigneeName || t.assignee || 'Jagadish K',
              assignee: t.assigneeName || t.assignee || 'Jagadish K',
              dueDate: t.dueAt || t.dueDate || 'Today, 5:00 PM',
              status: statusLabel,
              completed: isCompleted,
              subtasks: Array.isArray(t.subtasks)
                ? t.subtasks.map((s, idx) => ({
                    id: String(s.id || `sub_${idx}`),
                    title: String(s.title || s.text || 'Subtask item'),
                    done: !!(s.done || s.completed),
                    completed: !!(s.done || s.completed),
                    image: s.image || null,
                    imageName: s.imageName || null,
                    imageSize: s.imageSize || null
                  }))
                : (typeof t.subtasks === 'object' && t.subtasks !== null ? Object.values(t.subtasks).map((s, idx) => ({
                    id: String(s.id || `sub_${idx}`),
                    title: String(s.title || s.text || 'Subtask item'),
                    done: !!(s.done || s.completed),
                    completed: !!(s.done || s.completed),
                    image: s.image || null,
                    imageName: s.imageName || null,
                    imageSize: s.imageSize || null
                  })) : []),
              createdAt: t.createdAt || Date.now()
            };
          });
          callback(mapped);
        });
      }
    });
    return () => { try { unsub(); } catch (_) {} };
  }

  async createTask(task) {
    const svc = await this.ensureReady();
    if (svc && typeof svc.createTask === 'function') {
      const sanitizedSubtasks = Array.isArray(task.subtasks) ? task.subtasks.map((s, idx) => {
        const item = {
          id: String(s.id || `sub_${idx}`),
          title: String(s.title || s.text || 'Deliverable'),
          done: !!(s.done || s.completed),
          completed: !!(s.done || s.completed)
        };
        if (s.image) {
          item.image = String(s.image);
          item.imageName = String(s.imageName || 'Screenshot.webp');
          item.imageSize = String(s.imageSize || '35 KB');
        }
        return item;
      }) : [];

      return await svc.createTask({
        id: task.id,
        title: task.title,
        description: task.description || '',
        priority: (task.priority || 'High').toUpperCase(),
        assigneeName: task.assignedTo || task.assignee || 'Jagadish K',
        dueAt: task.dueDate || 'Today, 5:00 PM',
        category: task.category || 'Engineering',
        subtasks: sanitizedSubtasks,
        createdAt: Date.now()
      });
    }
  }

  async updateTaskStatus(taskId, status, isCompleted = false) {
    const svc = await this.ensureReady();
    if (svc && typeof svc.updateTaskStatus === 'function') {
      const backendStatus = isCompleted ? 'DONE' : (status === 'Completed' ? 'DONE' : (status === 'In Progress' ? 'IN_PROGRESS' : 'PENDING'));
      return await svc.updateTaskStatus(taskId, backendStatus);
    }
  }

  async updateTaskSubtask(taskId, subtaskId, isCompleted) {
    const svc = await this.ensureReady();
    if (!svc || !svc.db) return;
    try {
      const taskRef = svc.db.collection(`organizations/${ORG_ID}/tasks`).doc(taskId);
      const doc = await taskRef.get();
      if (doc.exists) {
        const data = doc.data();
        let subtasks = data.subtasks || [];
        if (Array.isArray(subtasks)) {
          subtasks = subtasks.map(s => s.id === subtaskId ? { ...s, completed: isCompleted, done: isCompleted } : s);
        }
        await taskRef.update({ subtasks, updatedAt: Date.now() });
      }
    } catch (e) {
      console.warn('[FIREBASE] Error updating subtask:', e);
    }
  }

  async updateTask(task) {
    const svc = await this.ensureReady();
    if (!svc || !svc.db || !task?.id) return;
    try {
      const sanitizedSubtasks = Array.isArray(task.subtasks) ? task.subtasks.map((s, idx) => {
        const item = {
          id: String(s.id || `sub_${idx}`),
          title: String(s.title || s.text || 'Deliverable'),
          done: !!(s.done || s.completed),
          completed: !!(s.done || s.completed)
        };
        if (s.image) {
          item.image = String(s.image);
          item.imageName = String(s.imageName || 'Screenshot.webp');
          item.imageSize = String(s.imageSize || '35 KB');
        }
        return item;
      }) : [];

      const taskRef = svc.db.collection(`organizations/${ORG_ID}/tasks`).doc(task.id);
      await taskRef.set({
        id: task.id,
        title: task.title,
        description: task.description || '',
        priority: (task.priority || 'High').toUpperCase(),
        assigneeName: task.assignedTo || task.assignee || 'Jagadish K',
        dueAt: task.dueDate || 'Today, 5:00 PM',
        category: task.category || 'Engineering',
        status: task.status === 'Completed' ? 'DONE' : (task.status === 'In Progress' ? 'IN_PROGRESS' : 'PENDING'),
        completed: !!task.completed,
        subtasks: sanitizedSubtasks,
        updatedAt: Date.now()
      }, { merge: true });
    } catch (e) {
      console.warn('[FIREBASE] Error updating task:', e);
    }
  }

  async deleteTask(taskId) {
    const svc = await this.ensureReady();
    if (svc && typeof svc.deleteTask === 'function') {
      return await svc.deleteTask(taskId);
    }
  }

  // --- Attendance & Shift Punches ---
  subscribePunchLogs(callback) {
    let unsub = () => {};
    this.ensureReady().then(svc => {
      if (svc && typeof svc.subscribePunchLogs === 'function') {
        unsub = svc.subscribePunchLogs((cloudPunches) => {
          if (!Array.isArray(cloudPunches)) return;
          const mapped = cloudPunches.map((p, index) => {
            const dateStr = p.date || (p.timestamp ? new Date(p.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today');
            const timeStr = p.time || (p.timestamp ? new Date(p.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--:--');
            return {
              id: p.id || `punch-${index}`,
              employee: p.employeeName || p.workerName || 'Jagadish K',
              date: dateStr,
              clockIn: (p.action === 'CLOCK_IN' || p.action === 'PUNCH_IN') ? timeStr : (p.clockIn || '09:00 AM'),
              clockOut: (p.action === 'CLOCK_OUT' || p.action === 'PUNCH_OUT') ? timeStr : (p.clockOut || '--'),
              duration: p.duration || (p.sessionHours ? `${p.sessionHours}h` : '8h 00m'),
              status: p.action === 'CLOCK_OUT' ? 'Completed' : 'Present'
            };
          });
          callback(mapped);
        });
      }
    });
    return () => { try { unsub(); } catch (_) {} };
  }

  async recordPunch(actionType, extra = {}) {
    const svc = await this.ensureReady();
    if (svc && typeof svc.recordPunchLog === 'function') {
      const now = new Date();
      return await svc.recordPunchLog({
        action: actionType, // 'CLOCK_IN', 'CLOCK_OUT', 'BREAK_START', 'BREAK_END'
        timestamp: Date.now(),
        date: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        employeeName: extra.employeeName || 'Jagadish K',
        ...extra
      });
    }
  }

  // --- Channels & Live Chat Messages ---
  subscribeChannels(callback) {
    let unsub = () => {};
    this.ensureReady().then(svc => {
      if (svc && typeof svc.subscribeChannels === 'function') {
        unsub = svc.subscribeChannels((cloudChannels) => {
          if (!Array.isArray(cloudChannels)) return;
          const mapped = cloudChannels.map(c => ({
            id: c.id,
            title: c.name ? `# ${c.name}` : (c.title || 'General Chat'),
            unread: c.unreadCount || 0,
            isGroup: !c.isDirectMessage,
            membersCount: c.memberIds ? c.memberIds.length : (c.members ? c.members.length : 8),
            lastMessage: c.lastMessageText || 'Recent discussions',
            time: c.lastActivityAt ? new Date(c.lastActivityAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '12:00 PM',
            timestamp: c.lastActivityAt || c.lastMessageTime || c.createdAt || 0
          }));
          callback(mapped);
        });
      }
    });
    return () => { try { unsub(); } catch (_) {} };
  }

  async createChannel(name, options = {}) {
    const svc = await this.ensureReady();
    if (!svc || !svc.db) return null;
    const channelId = options.id || name.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const channelDoc = {
      id: channelId,
      name: name,
      title: options.title || `# ${name}`,
      isDirectMessage: !!options.isDirect,
      membersCount: options.membersCount || 4,
      createdAt: Date.now(),
      lastActivityAt: Date.now(),
      lastMessageText: 'Channel created'
    };
    await svc.db.collection(`organizations/${ORG_ID}/channels`).doc(channelId).set(channelDoc, { merge: true });
    return channelDoc;
  }

  subscribeChannelMessages(channelId, callback) {
    if (!channelId) return () => {};
    let unsub = () => {};

    const normalizeMsgList = (cloudMessages, svc) => {
      if (!Array.isArray(cloudMessages)) return [];
      return cloudMessages.map((m, index) => {
        const isSelf = !!(
          (m.senderUid && svc?.currentUser && m.senderUid === svc.currentUser.uid) ||
          (m.senderEmpId === 'RD-FOUNDER-001') ||
          (m.senderName && m.senderName.toLowerCase().includes('jagadish')) ||
          (m.sender && m.sender.toLowerCase().includes('jagadish')) ||
          (m.senderEmail && m.senderEmail.toLowerCase().includes('jagadish')) ||
          m.isOutgoing ||
          m.isSelf
        );
        const rawTime = m.createdAt || m.timestamp;
        const msgTs = typeof rawTime === 'number' ? rawTime : (rawTime ? new Date(rawTime).getTime() : Date.now());
        const timeStr = m.time || (rawTime ? new Date(rawTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '12:00 PM');
        const attachList = m.attachments || (m.attachment ? [m.attachment] : []);

        return {
          id: m.id || `msg-${index}`,
          sender: m.senderName || m.authorName || m.sender || (isSelf ? 'Jagadish K' : 'Teammate'),
          avatar: m.senderPhoto || m.avatar || (isSelf ? './assets/profile-photo.jpeg' : './assets/id-card.png'),
          time: timeStr,
          timestamp: msgTs,
          createdAt: msgTs,
          text: m.text || m.content || '',
          attachments: attachList,
          attachment: attachList[0] || null,
          reactions: m.reactions || {},
          replyTo: m.replyTo || null,
          status: m.status || (m.delivered ? 'READ' : 'DELIVERED'),
          isSelf,
          isOutgoing: isSelf
        };
      });
    };

    this.ensureReady().then(async (svc) => {
      if (!svc) return;

      // 1. Immediately fetch existing channel messages if available
      if (typeof svc.fetchChannelMessages === 'function') {
        try {
          const initialMsgs = await svc.fetchChannelMessages(channelId);
          if (Array.isArray(initialMsgs) && initialMsgs.length > 0) {
            callback(normalizeMsgList(initialMsgs, svc));
          }
        } catch (_) {}
      }

      // 2. Subscribe to real-time updates via subscribeMessages or subscribeChannel
      const subscribeFn = (typeof svc.subscribeMessages === 'function') 
        ? svc.subscribeMessages.bind(svc)
        : (typeof svc.subscribeChannel === 'function' ? svc.subscribeChannel.bind(svc) : null);

      if (subscribeFn) {
        unsub = subscribeFn(channelId, (cloudMessages) => {
          callback(normalizeMsgList(cloudMessages, svc));
        });
      }
    });

    return () => { try { unsub(); } catch (_) {} };
  }

  async sendMessage(channelId, text, options = {}) {
    const svc = await this.ensureReady();
    if (svc && typeof svc.sendMessage === 'function') {
      return await svc.sendMessage(channelId, text, options);
    }
  }
}

export const firebaseBridge = new FirebaseBridgeService();
