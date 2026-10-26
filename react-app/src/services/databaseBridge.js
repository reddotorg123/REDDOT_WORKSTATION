/**
 * REDDOT WORKSTATION • NATIVE PERSISTENT DATABASE BRIDGE
 * Directly connects React UI with the local disk vault at:
 * %APPDATA%\reddot-workstation-os\reddot_storage\reddot_database.json
 * Provides zero-latency boot, real tasks, members, chats, and attendance punches.
 */

import { electronBridge } from './electronBridge';

let cachedRawDb = null;
let _dbSaveTimer = null;
let _pendingDbSave = null;

export const databaseBridge = {
  /**
   * Loads and normalizes the full local workspace database.
   */
  async loadWorkspaceDatabase() {
    try {
      const raw = await electronBridge.loadState();
      if (raw && typeof raw === 'object') {
        cachedRawDb = { ...raw };
        return this.normalizeDatabase(raw);
      }
    } catch (err) {
      console.warn('[DB_BRIDGE] Error loading raw database:', err);
    }
    return null;
  },

  /**
   * Normalizes raw reddot_database.json into React components expected data shape.
   */
  normalizeDatabase(db) {
    if (!db || typeof db !== 'object') return null;

    // 1. Normalizing Tasks
    const tasks = (db.tasks || []).map((t, idx) => {
      const isCompleted = t.status === 'Completed' || t.status === 'DONE' || !!t.completed;
      const isInProgress = t.status === 'In Progress' || t.status === 'IN_PROGRESS';
      let cleanStatus = 'Pending';
      if (isCompleted) cleanStatus = 'Completed';
      else if (isInProgress) cleanStatus = 'In Progress';

      return {
        id: t.id || `task_${idx + 1}`,
        title: t.title || 'Untitled Task',
        description: t.description || '',
        status: cleanStatus,
        completed: isCompleted,
        priority: t.priority ? (t.priority.charAt(0).toUpperCase() + t.priority.slice(1).toLowerCase()) : 'High',
        dueDate: t.dueAt || t.dueDate || t.due || 'Today, 5:00 PM',
        dueAt: t.dueAt || t.dueDate || 'Today, 5:00 PM',
        assignedTo: t.assigneeName || t.assignee || 'Unassigned',
        assignee: t.assigneeName || t.assignee || 'Unassigned',
        assignedEmail: t.assigneeEmail || '',
        category: t.category || 'Engineering',
        subtasks: Array.isArray(t.subtasks) ? t.subtasks.map((st, sIdx) => ({
          id: st.id || `st_${sIdx + 1}`,
          title: st.title || st.text || 'Subtask item',
          done: !!(st.done || st.completed || st.status === 'DONE' || st.status === 'COMPLETED'),
          completed: !!(st.done || st.completed || st.status === 'DONE' || st.status === 'COMPLETED'),
          image: st.image || null,
          imageName: st.imageName || null,
          imageSize: st.imageSize || null
        })) : [],
        attachments: t.attachments || [],
        createdAt: t.createdAt || Date.now()
      };
    });

    // 2. Normalizing Team Members (with deduplication by email/uid and recent heartbeat check)
    const rawMembers = Array.isArray(db.members) ? [...db.members] : Object.values(db.members || {});
    const tombstone = Array.isArray(db.deletedMembers) ? db.deletedMembers : [];
    const now = Date.now();

    // Sort by most recent activity timestamp descending
    rawMembers.sort((a, b) => (Number(b.lastSeenAt || b.updatedAt || 0)) - (Number(a.lastSeenAt || a.updatedAt || 0)));
    
    const seenMap = new Map();
    rawMembers.forEach((m, idx) => {
      if (!m) return;
      const mid = m.id || m.uid || m.docId || '';
      const email = (m.email || '').trim().toLowerCase();
      if (
        tombstone.includes(mid) || 
        (email && tombstone.includes(email)) ||
        email.endsWith('@reddot.com') ||
        mid === 'RD-GUEST' ||
        mid === '01' || mid === '02' || mid === '03' || mid === '04' ||
        (m.name && m.name.toLowerCase() === 'team member') ||
        (m.name && m.name.toLowerCase() === 'teammate')
      ) return;

      const dedupeKey = email || mid || (m.name || m.displayName || `m_${idx}`);
      if (seenMap.has(dedupeKey)) return;

      const rawStatus = String(m.status || '').toUpperCase();
      const lastSeen = Number(m.lastSeenAt || 0);
      const isRecentlyActive = lastSeen > 0 && (now - lastSeen) < (2 * 60 * 60 * 1000);
      const isExplicitOnline = (m.isOnline === true || m.online === true || rawStatus === 'DUTY_ON' || rawStatus === 'ONLINE') &&
                               rawStatus !== 'DUTY_OFF' && rawStatus !== 'OFFLINE' && rawStatus !== 'RESIGNED';
      const isSelf = email.includes('jagadish') || (m.name && m.name.toLowerCase().includes('jagadish'));
      const isOnline = isSelf ? true : (isExplicitOnline && isRecentlyActive);

      let finalStatus = 'Offline';
      if (rawStatus === 'RESIGNED') finalStatus = 'Resigned';
      else if (isOnline) finalStatus = 'Online';

      seenMap.set(dedupeKey, {
        id: mid || String(idx + 1).padStart(2, '0'),
        uid: m.uid || mid,
        name: m.displayName || m.name || (email ? email.split('@')[0] : 'Team Member'),
        role: m.role || 'Developer',
        dept: m.dept || m.department || 'Engineering',
        status: finalStatus,
        isOnline,
        email: m.email || '',
        avatar: m.photoUrl || m.photoURL || m.avatar || null,
        lastActive: m.lastSeenAt ? this.formatRelativeTime(m.lastSeenAt) : (m.lastActive || 'Recently'),
        activeTool: m.activeTool || null,
        todayHours: m.todayHours || 0
      });
    });

    const teamMembers = Array.from(seenMap.values());

    // 3. Normalizing Channels & Direct Messages (Personal Chats)
    const channelMap = new Map();

    // Add standard channels
    (db.channels || []).forEach(c => {
      channelMap.set(c.id, {
        id: c.id,
        name: c.name || c.title || 'channel',
        title: c.name ? (c.name.startsWith('#') ? c.name : `# ${c.name}`) : (c.title || '# General'),
        topic: c.topic || '',
        membersCount: c.membersCount || 4,
        time: c.lastMessageTime ? new Date(c.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today',
        timestamp: c.lastMessageTime || c.createdAt || 0,
        isGroup: true,
        lastMessage: c.lastMessageText || c.lastMessage || 'Active channel'
      });
    });

    // Extract direct message chats from db.chats
    if (db.chats && typeof db.chats === 'object') {
      Object.keys(db.chats).forEach(chanId => {
        if (chanId.startsWith('dm_')) {
          const chatMsgs = db.chats[chanId] || [];
          const lastMsg = chatMsgs[chatMsgs.length - 1];
          let participantName = 'Direct Message';
          let participantStatus = 'Offline';
          let participantAvatar = null;
          let isOnline = false;

          // Try matching member (ignoring self and empty emails)
          for (const m of teamMembers) {
            if (!m || !m.email || m.name?.toLowerCase().includes('jagadish') || m.email?.toLowerCase().includes('jagadish')) continue;
            const cleanEmail = (m.email || '').toLowerCase().replace(/[@.]/g, '_');
            const emailUser = m.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_');
            const cleanUid = (m.uid || m.id || '').toLowerCase();
            const lowerChan = chanId.toLowerCase();

            if ((cleanEmail && lowerChan.includes(cleanEmail)) || 
                (emailUser && emailUser.length > 2 && lowerChan.includes(emailUser)) ||
                (cleanUid && cleanUid.length > 3 && lowerChan.includes(cleanUid))) {
              participantName = m.name;
              participantStatus = m.status;
              participantAvatar = m.avatar;
              isOnline = m.isOnline;
              break;
            }
          }

          if (participantName === 'Direct Message' && lastMsg) {
            participantName = (lastMsg.senderName && lastMsg.senderName !== 'JAGADISH K') 
              ? lastMsg.senderName 
              : (lastMsg.recipientName && lastMsg.recipientName !== 'Teammate' ? lastMsg.recipientName : 'Direct Message');
          }

          channelMap.set(chanId, {
            id: chanId,
            name: participantName,
            title: participantName,
            status: participantStatus,
            isOnline,
            avatar: participantAvatar,
            membersCount: 2,
            time: lastMsg?.timestamp ? new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent',
            timestamp: lastMsg?.timestamp || (lastMsg?.createdAt ? new Date(lastMsg.createdAt).getTime() : 0),
            isGroup: false,
            lastMessage: lastMsg?.text || (lastMsg?.attachments?.length ? 'Sent an attachment' : 'Direct Conversation')
          });
        }
      });
    }

    // Ensure EVERY teammate has an active direct message entry in the channel map
    teamMembers.forEach(m => {
      if (m.name.toLowerCase().includes('jagadish')) return; // skip self
      const cleanEmail = (m.email || '').replace(/[@.]/g, '_');
      const directKey = `dm_jagadish2k2006_gmail_com___${cleanEmail || m.id}`;
      if (!channelMap.has(directKey)) {
        channelMap.set(directKey, {
          id: directKey,
          name: m.name,
          title: m.name,
          status: m.status,
          isOnline: m.isOnline,
          avatar: m.avatar,
          membersCount: 2,
          time: m.lastActive || 'Today',
          timestamp: 0,
          isGroup: false,
          lastMessage: m.isOnline ? 'Active now' : 'Start a direct chat'
        });
      }
    });

    // 4. Normalizing Chat Messages by Channel ID
    const messages = {};
    if (db.chats && typeof db.chats === 'object') {
      Object.keys(db.chats).forEach(chanId => {
        messages[chanId] = (db.chats[chanId] || []).map((msg, mIdx) => {
          const isSelf = msg.senderEmpId === 'RD-FOUNDER-001' || 
                         msg.senderName === 'JAGADISH K' || 
                         msg.sender === 'JAGADISH K' || 
                         msg.senderEmail === 'jagadish2k2006@gmail.com' || 
                         msg.isSelfMsg === true;
          const rawCreated = msg.createdAt || msg.timestamp;
          const msgTimestamp = typeof rawCreated === 'number' ? rawCreated : (rawCreated ? new Date(rawCreated).getTime() : 0);
          return {
            id: msg.id || msg.docId || `msg_${chanId}_${mIdx}`,
            sender: msg.senderDisplayName || msg.senderName || msg.sender || (isSelf ? 'Jagadish K' : 'Member'),
            senderRole: msg.senderRoleTag || msg.senderRole || (isSelf ? 'FOUNDER' : 'Team Member'),
            avatar: msg.photoUrl || msg.photo || msg.avatar || null,
            text: msg.cleanText || msg.text || msg.content || '',
            time: msgTimestamp ? new Date(msgTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (msg.time || '12:00 PM'),
            date: msgTimestamp ? new Date(msgTimestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today',
            timestamp: msgTimestamp || Date.now(),
            createdAt: msgTimestamp || Date.now(),
            reactions: msg.reactions || {},
            replyTo: msg.replyTo || null,
            isSelf,
            status: msg.status || 'READ',
            attachment: msg.attachment || (msg.attachments && msg.attachments[0]) || null,
            attachments: (msg.attachments || (msg.attachment ? [msg.attachment] : [])).map(att => {
              const isImg = att.isImage === true || 
                (att.type && String(att.type).startsWith('image/')) || 
                (att.mimeType && String(att.mimeType).startsWith('image/')) ||
                (att.name && /\.(png|jpe?g|webp|gif|svg|bmp)$/i.test(att.name));
              return {
                ...att,
                isImage: isImg,
                previewUrl: att.dataUrl || att.previewUrl || (att.id ? `http://127.0.0.1:5050/api/attachments/${encodeURIComponent(att.id)}/preview` : null),
                downloadUrl: att.downloadUrl || (att.id ? `http://127.0.0.1:5050/api/attachments/${encodeURIComponent(att.id)}/download` : null)
              };
            })
          };
        });

        // Update conversation timestamp with latest message
        const chanItem = channelMap.get(chanId);
        if (chanItem && messages[chanId]?.length > 0) {
          const lastMsg = messages[chanId][messages[chanId].length - 1];
          const lastMsgTs = lastMsg.timestamp || 0;
          if (lastMsgTs > (chanItem.timestamp || 0)) {
            chanItem.timestamp = lastMsgTs;
            chanItem.time = lastMsg.time;
            chanItem.lastMessage = lastMsg.text || (lastMsg.attachments?.length ? 'Sent an attachment' : 'Recent message');
          }
        }
      });
    }

    // Sort all conversations by latest activity (recent chat first)
    const conversations = Array.from(channelMap.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    // 5. Normalizing Punch Logs / Attendance Ledger
    const rawPunches = Array.isArray(db.punchLogs) ? db.punchLogs : [];
    const parsePunchTimestamp = (p) => {
      if (p.timestamp) return Number(p.timestamp);
      if (p.date) {
        const d = new Date(p.date + (p.time ? ' ' + p.time : ''));
        if (!isNaN(d.getTime())) return d.getTime();
      }
      return 0;
    };

    const attendance = [...rawPunches]
      .sort((a, b) => parsePunchTimestamp(b) - parsePunchTimestamp(a))
      .slice(0, 100)
      .map(p => {
        const isClockIn = p.action === 'CLOCK_IN' || p.action === 'PUNCH_IN';
        const isClockOut = p.action === 'CLOCK_OUT' || p.action === 'PUNCH_OUT';
        const isBreak = p.action === 'BREAK_START' || p.action === 'BREAK_END';

        const timeFormatted = p.time || (p.timestamp ? new Date(p.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '09:00 AM');
        const dateFormatted = p.date || (p.timestamp ? new Date(p.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today');

      return {
        id: p.id || `punch_${p.timestamp || Math.random()}`,
        employee: p.name || p.workerName || p.employee || 'Jagadish K',
        member: p.name || p.workerName || p.employee || 'Jagadish K',
        workerId: p.workerId || 'RD-FOUNDER-001',
        date: dateFormatted,
        clockIn: isClockIn ? timeFormatted : (p.clockIn || '09:00 AM'),
        checkIn: isClockIn ? timeFormatted : (p.checkIn || '09:00 AM'),
        clockOut: isClockOut ? timeFormatted : (p.clockOut || '--'),
        checkOut: isClockOut ? timeFormatted : (p.checkOut || '--'),
        workHours: p.duration || p.workHours || '8h 00m',
        duration: p.duration || p.workHours || '8h 00m',
        status: isClockOut ? 'Completed' : (isBreak ? 'On Break' : 'Present'),
        action: p.action,
        time: timeFormatted,
        timestamp: p.timestamp || Date.now(),
        cloudSynced: p.cloudSynced !== false
      };
    });

    // 6. User Profile (Founder / Jagadish K)
    const founder = teamMembers.find(m => m.role.toLowerCase().includes('founder') || m.name.toLowerCase().includes('jagadish'));
    const userProfile = {
      name: founder ? founder.name : 'Jagadish K',
      role: 'FOUNDER',
      email: founder ? founder.email : 'jagadish2k2006@gmail.com',
      avatar: (founder && founder.avatar) ? founder.avatar : './assets/profile-photo.jpeg'
    };

    return {
      tasks,
      teamMembers,
      conversations,
      messages,
      attendance,
      userProfile,
      rawDb: db
    };
  },

  /**
   * Persists updated data directly to the disk database with high-performance debouncing.
   */
  async saveDatabase(rawDb, immediate = false) {
    if (!rawDb || typeof rawDb !== 'object') return false;
    cachedRawDb = { ...rawDb };
    _pendingDbSave = cachedRawDb;

    if (immediate) {
      if (_dbSaveTimer) {
        clearTimeout(_dbSaveTimer);
        _dbSaveTimer = null;
      }
      try {
        await electronBridge.saveState(_pendingDbSave);
        _pendingDbSave = null;
      } catch (err) {
        console.warn('[DB] Immediate save error:', err);
      }
      return true;
    }

    if (_dbSaveTimer) clearTimeout(_dbSaveTimer);
    _dbSaveTimer = setTimeout(async () => {
      _dbSaveTimer = null;
      if (_pendingDbSave) {
        const toSave = _pendingDbSave;
        _pendingDbSave = null;
        try {
          await electronBridge.saveState(toSave);
        } catch (err) {
          console.warn('[DB] Debounced save error:', err);
        }
      }
    }, 800);

    return true;
  },

  /**
   * Batch updates team members in the raw database and saves debounced.
   */
  async updateMembers(updatedMembers) {
    if (!cachedRawDb) await this.loadWorkspaceDatabase();
    if (cachedRawDb) {
      cachedRawDb.members = updatedMembers;
      await this.saveDatabase(cachedRawDb);
    }
  },

  /**
   * Updates tasks in the raw database and saves.
   */
  async updateTasks(updatedTasks) {
    if (!cachedRawDb) await this.loadWorkspaceDatabase();
    if (cachedRawDb) {
      cachedRawDb.tasks = updatedTasks;
      await this.saveDatabase(cachedRawDb);
    }
  },

  /**
   * Appends or updates a single task.
   */
  async saveTask(task) {
    if (!cachedRawDb) await this.loadWorkspaceDatabase();
    if (cachedRawDb) {
      if (!Array.isArray(cachedRawDb.tasks)) cachedRawDb.tasks = [];
      const idx = cachedRawDb.tasks.findIndex(t => t.id === task.id);
      if (idx >= 0) {
        cachedRawDb.tasks[idx] = { ...cachedRawDb.tasks[idx], ...task };
      } else {
        cachedRawDb.tasks.unshift(task);
      }
      await this.saveDatabase(cachedRawDb);
    }
  },

  /**
   * Appends a chat message to a channel in the raw database.
   */
  async appendChatMessage(channelId, message) {
    if (!cachedRawDb) await this.loadWorkspaceDatabase();
    if (cachedRawDb) {
      if (!cachedRawDb.chats) cachedRawDb.chats = {};
      if (!Array.isArray(cachedRawDb.chats[channelId])) cachedRawDb.chats[channelId] = [];
      cachedRawDb.chats[channelId].push(message);

      // Update channel last message
      if (Array.isArray(cachedRawDb.channels)) {
        const chan = cachedRawDb.channels.find(c => c.id === channelId);
        if (chan) {
          chan.lastMessageText = message.text || (message.attachments?.length ? 'Attachment' : '');
          chan.lastMessageTime = message.timestamp || Date.now();
          chan.lastMessageSender = message.sender || 'Jagadish K';
        }
      }
      await this.saveDatabase(cachedRawDb, true);
    }
  },

  /**
   * Deletes a chat message from a channel in the persistent database.
   */
  async deleteChatMessage(channelId, messageId) {
    if (!cachedRawDb) await this.loadWorkspaceDatabase();
    if (cachedRawDb && cachedRawDb.chats && Array.isArray(cachedRawDb.chats[channelId])) {
      cachedRawDb.chats[channelId] = cachedRawDb.chats[channelId].filter(m => (m.id || m.docId) !== messageId);
      await this.saveDatabase(cachedRawDb, true);
    }
  },

  /**
   * Updates a chat message (e.g. reactions or edit) in the persistent database.
   */
  async updateChatMessage(channelId, updatedMessage) {
    if (!cachedRawDb) await this.loadWorkspaceDatabase();
    if (cachedRawDb && cachedRawDb.chats && Array.isArray(cachedRawDb.chats[channelId])) {
      const idx = cachedRawDb.chats[channelId].findIndex(m => (m.id || m.docId) === updatedMessage.id);
      if (idx >= 0) {
        cachedRawDb.chats[channelId][idx] = { ...cachedRawDb.chats[channelId][idx], ...updatedMessage };
        await this.saveDatabase(cachedRawDb);
      }
    }
  },

  /**
   * Appends an attendance punch log.
   */
  async appendPunchLog(punch) {
    if (!cachedRawDb) await this.loadWorkspaceDatabase();
    if (cachedRawDb) {
      if (!Array.isArray(cachedRawDb.punchLogs)) cachedRawDb.punchLogs = [];
      cachedRawDb.punchLogs.push(punch);
      await this.saveDatabase(cachedRawDb);
    }
  },

  /**
   * Updates or adds a team member.
   */
  async saveMember(member) {
    if (!cachedRawDb) await this.loadWorkspaceDatabase();
    if (cachedRawDb) {
      if (!cachedRawDb.members || typeof cachedRawDb.members !== 'object') cachedRawDb.members = {};
      const memberId = member.id || member.uid || `RD-${Date.now().toString(36)}`;
      cachedRawDb.members[memberId] = {
        ...(cachedRawDb.members[memberId] || {}),
        ...member,
        id: memberId,
        updatedAt: Date.now()
      };
      await this.saveDatabase(cachedRawDb);
    }
  },

  /**
   * Retrieves all workspace files and images across chats, tasks, and file vault.
   */
  async getWorkspaceFiles() {
    if (!cachedRawDb) await this.loadWorkspaceDatabase();
    const db = cachedRawDb || {};
    const fileMap = new Map();

    // 1. Files from chats (all channels and direct messages)
    if (db.chats && typeof db.chats === 'object') {
      Object.keys(db.chats).forEach(chanId => {
        const msgs = db.chats[chanId] || [];
        msgs.forEach(msg => {
          const attachList = (msg.attachments && msg.attachments.length > 0)
            ? msg.attachments
            : (msg.attachment ? [msg.attachment] : []);

          attachList.forEach(a => {
            if (!a || (!a.name && !a.id)) return;
            const fileKey = a.name || a.id;
            if (!fileMap.has(fileKey)) {
              const isImg = a.isImage === true || 
                Boolean(a.dataUrl) ||
                (a.type && String(a.type).startsWith('image/')) || 
                (a.mimeType && String(a.mimeType).startsWith('image/')) || 
                (a.name && /\.(png|jpe?g|webp|gif|svg|bmp)$/i.test(a.name));

              const isPdf = (a.type && String(a.type).includes('pdf')) || (a.name && a.name.toLowerCase().endsWith('.pdf'));
              const ext = (a.name ? a.name.split('.').pop() : '').toLowerCase();

              let fileType = 'Document';
              if (isImg) fileType = 'Image';
              else if (isPdf) fileType = 'PDF';
              else if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)) fileType = 'Archive';
              else if (['js', 'jsx', 'ts', 'tsx', 'cpp', 'h', 'py', 'json', 'html', 'css'].includes(ext)) fileType = 'Code';

              let formattedSize = '1.0 MB';
              if (typeof a.size === 'number') {
                formattedSize = a.size > 1024 * 1024 
                  ? `${(a.size / (1024 * 1024)).toFixed(1)} MB` 
                  : `${Math.max(1, Math.round(a.size / 1024))} KB`;
              } else if (a.size) {
                formattedSize = String(a.size);
              }

              const createdAt = a.createdAt || msg.createdAt || msg.timestamp || Date.now();
              const modifiedDate = new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

              fileMap.set(fileKey, {
                id: a.id || `file_${Math.random()}`,
                name: a.name || 'Untitled File',
                type: fileType,
                size: formattedSize,
                modified: modifiedDate,
                timestamp: createdAt,
                downloadUrl: a.downloadUrl || a.dataUrl || ((a.name || a.id) ? `http://127.0.0.1:5050/api/attachments/${encodeURIComponent(a.name || a.id)}/download` : null),
                previewUrl: a.previewUrl || a.dataUrl || ((a.name || a.id) ? `http://127.0.0.1:5050/api/attachments/${encodeURIComponent(a.name || a.id)}/preview` : null),
                dataUrl: a.dataUrl || null,
                isImage: isImg,
                channel: chanId,
                uploader: msg.senderDisplayName || msg.senderName || msg.sender || 'Team Member'
              });
            }
          });
        });
      });
    }

    // 2. Files from tasks (attachments and subtask images)
    if (Array.isArray(db.tasks)) {
      db.tasks.forEach(task => {
        if (Array.isArray(task.attachments)) {
          task.attachments.forEach(a => {
            const fileKey = a.name || a.id;
            if (fileKey && !fileMap.has(fileKey)) {
              fileMap.set(fileKey, {
                id: a.id || `task_file_${Math.random()}`,
                name: a.name || 'Task Attachment',
                type: a.name?.toLowerCase().endsWith('.pdf') ? 'PDF' : 'Document',
                size: a.size || '2.4 MB',
                modified: task.dueDate || 'Today',
                timestamp: Date.now(),
                downloadUrl: a.downloadUrl || null,
                previewUrl: a.previewUrl || null,
                isImage: false,
                uploader: task.assignedTo || 'Founder'
              });
            }
          });
        }
        if (Array.isArray(task.subtasks)) {
          task.subtasks.forEach(st => {
            if (st.image || st.imageUrl) {
              const fileKey = st.imageName || `subtask_${st.id}_img`;
              if (!fileMap.has(fileKey)) {
                fileMap.set(fileKey, {
                  id: `subtask_img_${st.id}`,
                  name: st.imageName || `${st.title || 'Subtask'}.png`,
                  type: 'Image',
                  size: st.imageSize || '350 KB',
                  modified: 'Today',
                  timestamp: Date.now(),
                  previewUrl: st.image || st.imageUrl,
                  downloadUrl: st.image || st.imageUrl,
                  dataUrl: st.image || st.imageUrl,
                  isImage: true,
                  uploader: task.assignedTo || 'Founder'
                });
              }
            }
          });
        }
      });
    }

    return Array.from(fileMap.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  },

  formatRelativeTime(timestamp) {
    if (!timestamp) return 'Recently';
    const diffMs = Date.now() - Number(timestamp);
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }
};
