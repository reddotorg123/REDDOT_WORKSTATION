/**
 * ============================================================================
 * REDDOT WORKSTATION OS • PRODUCTION FIREBASE SERVICE MODULE
 * Handles Authentication, Firestore, Realtime Presence, and Audit Logs
 * Scoped strictly to: organizations/reddot/
 * ============================================================================
 */

(function(window) {
  'use strict';

  const ORG_ID = window.REDDOT_ORG_ID || 'reddot';

  const FirebaseService = {
    app: null,
    auth: null,
    db: null,
    rtdb: null,
    initialized: false,
    currentUser: null,
    currentMember: null,
    presenceRef: null,
    listeners: [],

    unsubscribeAll() {
      if (this.listeners && this.listeners.length > 0) {
        this.listeners.forEach(unsub => {
          if (typeof unsub === 'function') {
            try { unsub(); } catch (_) {}
          }
        });
        this.listeners = [];
      }
    },

    init() {
      if (this.initialized) return;

      const config = window.REDDOT_FIREBASE_CONFIG;
      if (!config || !window.firebase) {
        console.warn('[FIREBASE] Firebase SDK not loaded or config missing. Check internet connection or CSP.');
        return;
      }

      try {
        if (!firebase.apps.length) {
          this.app = firebase.initializeApp(config);
        } else {
          this.app = firebase.app();
        }

        this.auth = firebase.auth();
        this.db = firebase.firestore();

        // Enable offline persistence for Firestore
        try {
          this.db.enablePersistence({ synchronizeTabs: true }).catch(err => {
            if (err.code === 'failed-precondition' || err.code === 'unimplemented') {
              // Persistence not supported in multi-tab or environment
            }
          });
        } catch (_) {}

        if (firebase.database && config.databaseURL) {
          this.rtdb = firebase.database();
        }

        this.initialized = true;
        console.log('[FIREBASE] Production Firebase initialized for organization:', ORG_ID);
        this.ensureKnownTeamMembers().catch(() => {});
      } catch (err) {
        console.error('[FIREBASE] Initialization error:', err.message);
      }
    },

    async ensureKnownTeamMembers() {
      if (!this.db) return;
      const defaults = [
        {
          uid: 'RD-FOUNDER-001',
          email: 'jagadish2k2006@gmail.com',
          displayName: 'JAGADISH K',
          name: 'JAGADISH K',
          role: 'owner',
          isOwner: true,
          dept: 'Hardware Architecture',
          id: 'RD-FOUNDER-001',
          active: true,
          status: 'DUTY_ON'
        },
        {
          uid: 'pavithratech1206',
          email: 'pavithratech1206@gmail.com',
          displayName: 'PAVITHRA',
          name: 'PAVITHRA',
          role: 'employee',
          isOwner: false,
          dept: 'Engineering Architecture',
          id: 'RD-EMP-002',
          active: true,
          status: 'DUTY_ON'
        }
      ];

      for (const m of defaults) {
        try {
          const docRef = this.db.collection(`organizations/${ORG_ID}/members`).doc(m.uid);
          const snap = await docRef.get();
          if (!snap.exists) {
            await docRef.set({ ...m, createdAt: Date.now(), updatedAt: Date.now() });
          }
        } catch (_) {}
      }
    },

    // --- AUTHENTICATION ---
    onAuthStateChanged(callback) {
      if (!this.auth) {
        setTimeout(() => callback(null, null), 100);
        return () => {};
      }

      return this.auth.onAuthStateChanged(async (user) => {
        this.currentUser = user;
        if (user) {
          try {
            this.currentMember = await this.syncMemberProfile(user);
            this.initPresence(user.uid, this.currentMember.displayName || user.email);
            callback(user, this.currentMember);
          } catch (err) {
            console.error('[FIREBASE] Error syncing member profile:', err);
            callback(user, null);
          }
        } else {
          this.currentMember = null;
          this.cleanupPresence();
          callback(null, null);
        }
      });
    },

    async signIn(email, password) {
      if (!this.auth) throw new Error('Firebase Auth service not ready');
      const cred = await this.auth.signInWithEmailAndPassword(email.trim(), password);
      return cred.user;
    },

    async signInWithGoogle() {
      if (!this.auth) throw new Error('Firebase Auth service not ready');
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      const cred = await this.auth.signInWithPopup(provider);
      const user = cred.user;

      try {
        await this.syncMemberProfile(user);
      } catch (e) {
        console.warn('[FIREBASE] Google sign-in profile sync note:', e);
      }
      return user;
    },

    async signUp(email, password, displayName, requestedRole = 'employee', extraProfile = {}) {
      if (!this.auth) throw new Error('Firebase Auth service not ready');
      const cred = await this.auth.createUserWithEmailAndPassword(email.trim(), password);
      const user = cred.user;

      const isSoleAdmin = (email.trim().toLowerCase() === 'jagadish2k2006@gmail.com');

      if (displayName || isSoleAdmin) {
        try {
          await user.updateProfile({ 
            displayName: (displayName ? displayName.trim() : (isSoleAdmin ? 'JAGADISH K' : '')),
            photoURL: extraProfile.photoURL || ''
          });
        } catch (_) {}
      }

      const role = isSoleAdmin ? 'owner' : (requestedRole === 'owner' ? 'employee' : requestedRole);

      const memberData = {
        uid: user.uid,
        id: isSoleAdmin ? 'RD-FOUNDER-001' : (extraProfile.empId || `RD-${user.uid.slice(0, 6).toUpperCase()}`),
        displayName: displayName ? displayName.trim() : (isSoleAdmin ? 'JAGADISH K' : email.split('@')[0]),
        name: displayName ? displayName.trim() : (isSoleAdmin ? 'JAGADISH K' : email.split('@')[0]),
        email: email.trim().toLowerCase(),
        role: role,
        isOwner: isSoleAdmin,
        dept: isSoleAdmin ? 'Hardware Architecture' : (extraProfile.dept || 'Engineering'),
        photoURL: extraProfile.photoURL || user.photoURL || '',
        photoUrl: extraProfile.photoURL || user.photoURL || '',
        createdAt: Date.now(),
        active: true
      };

      await this.db.collection(`organizations/${ORG_ID}/members`).doc(user.uid).set(memberData);
      await this.logAudit('MEMBER_REGISTERED', `User ${memberData.displayName} registered profile with role [${role}]`, user.uid);

      this.currentMember = memberData;
      return user;
    },

    async signOut() {
      this.cleanupPresence();
      if (this.auth) {
        await this.auth.signOut();
      }
      this.currentUser = null;
      this.currentMember = null;
    },

    async resetPassword(email) {
      if (!this.auth) throw new Error('Firebase Auth service not ready');
      await this.auth.sendPasswordResetEmail(email.trim());
    },

    async syncMemberProfile(user) {
      if (!this.db || !user) return null;

      const email = (user.email || '').toLowerCase().trim();
      const isFounder = (email === 'jagadish2k2006@gmail.com');

      let existingData = null;
      try {
        const snap = await this.db.collection(`organizations/${ORG_ID}/members`).doc(user.uid).get();
        if (snap.exists) {
          existingData = snap.data();
        } else {
          // Check by email-based doc id if exists
          const emailSnap = await this.db.collection(`organizations/${ORG_ID}/members`).doc(email.split('@')[0]).get();
          if (emailSnap.exists) existingData = emailSnap.data();
        }
      } catch (_) {}

      // Check local storage for persistent custom photos
      let localCustomPhoto = null;
      try {
        const storedPhotos = JSON.parse(localStorage.getItem('rd_member_custom_photos') || '{}');
        localCustomPhoto = storedPhotos[email] || storedPhotos[user.uid] || localStorage.getItem('rd_custom_badge_photo');
      } catch (_) {}

      const role = isFounder ? 'owner' : (existingData?.role || 'employee');
      const memberId = isFounder ? 'RD-FOUNDER-001' : (existingData?.id || (email.includes('pavithra') ? 'RD-EMP-002' : `RD-${user.uid.slice(0, 6).toUpperCase()}`));
      const displayName = user.displayName || existingData?.displayName || existingData?.name || (email ? email.split('@')[0].toUpperCase() : 'Team Member');

      // ID card photo takes strict priority over Google profile photo so custom badges never get overwritten
      const resolvedCustomPhoto = existingData?.customPhoto || existingData?.idCardPhoto || localCustomPhoto || null;
      const photoURL = resolvedCustomPhoto || existingData?.photoURL || existingData?.photoUrl || user.photoURL || '';

      const memberData = {
        uid: user.uid,
        id: memberId,
        displayName: displayName,
        name: displayName,
        email: email,
        role: role,
        isOwner: isFounder,
        dept: isFounder ? 'Hardware Architecture' : (existingData?.dept || 'Engineering'),
        idCardPhoto: resolvedCustomPhoto || photoURL,
        customPhoto: resolvedCustomPhoto,
        isCustomPhoto: !!resolvedCustomPhoto,
        photoURL: resolvedCustomPhoto || photoURL,
        photoUrl: resolvedCustomPhoto || photoURL,
        createdAt: existingData?.createdAt || Date.now(),
        updatedAt: Date.now(),
        active: true,
        status: 'DUTY_ON'
      };

      try {
        await this.db.collection(`organizations/${ORG_ID}/members`).doc(user.uid).set(memberData, { merge: true });
        await this.logAudit('MEMBER_PROFILE_SYNCED', `Automated Gmail profile sync for ${displayName} [${role}]`, user.uid);
      } catch (err) {
        console.warn('[FIREBASE] Profile sync warning:', err.message);
      }

      this.currentMember = memberData;
      return memberData;
    },

    async bootstrapMember(user) {
      return this.syncMemberProfile(user);
    },

    async updateMemberPhoto(uid, photoDataUrl) {
      if (!this.db || !photoDataUrl) return;

      const userUid = this.currentUser ? this.currentUser.uid : uid;
      const userEmail = this.currentUser?.email ? this.currentUser.email.toLowerCase().trim() : null;

      const photoPayload = {
        idCardPhoto: photoDataUrl,
        customPhoto: photoDataUrl,
        isCustomPhoto: true,
        photoURL: photoDataUrl,
        photoUrl: photoDataUrl,
        updatedAt: Date.now()
      };

      // 1. Immediately persist in local storage
      try {
        const storedPhotos = JSON.parse(localStorage.getItem('rd_member_custom_photos') || '{}');
        if (userEmail) storedPhotos[userEmail] = photoDataUrl;
        if (uid) storedPhotos[uid] = photoDataUrl;
        if (userUid) storedPhotos[userUid] = photoDataUrl;
        localStorage.setItem('rd_member_custom_photos', JSON.stringify(storedPhotos));
        localStorage.setItem('rd_custom_badge_photo', photoDataUrl);
      } catch (_) {}

      // 2. Update Firestore member docs across all possible lookup keys
      const uidsToUpdate = Array.from(new Set([uid, userUid, 'RD-FOUNDER-001', 'pavithratech1206', userEmail ? userEmail.split('@')[0] : null].filter(Boolean)));
      for (const idToUpdate of uidsToUpdate) {
        try {
          await this.db.collection(`organizations/${ORG_ID}/members`).doc(idToUpdate).set(photoPayload, { merge: true });
        } catch (_) {}
      }

      if (userEmail) {
        try {
          const emailDoc = userEmail.replace(/[^a-z0-9]/gi, '_');
          await this.db.collection(`organizations/${ORG_ID}/members`).doc(emailDoc).set(photoPayload, { merge: true });
        } catch (_) {}
      }

      if (this.currentMember) {
        this.currentMember.idCardPhoto = photoDataUrl;
        this.currentMember.customPhoto = photoDataUrl;
        this.currentMember.isCustomPhoto = true;
        this.currentMember.photoURL = photoDataUrl;
        this.currentMember.photoUrl = photoDataUrl;
      }

      await this.logAudit('MEMBER_PHOTO_UPDATED', `ID card photo updated in Cloud Vault for ${uid}`, uid);
    },

    async getMemberDoc(uid) {
      if (!this.db) return null;
      const doc = await this.db.collection(`organizations/${ORG_ID}/members`).doc(uid).get();
      if (!doc.exists) return null;
      const data = doc.data();
      if (data) {
        if (!data.id) {
          data.id = (data.email && data.email.toLowerCase() === 'jagadish2k2006@gmail.com') ? 'RD-FOUNDER-001' : `RD-${uid.slice(0, 6).toUpperCase()}`;
        }
        if (data.email && data.email.toLowerCase() === 'jagadish2k2006@gmail.com') {
          data.role = 'owner';
          data.isOwner = true;
        }
      }
      return data;
    },

    // --- MEMBERS & ROLES ---
    subscribeMembers(callback) {
      if (!this.db) return () => {};

      if (this.currentUser) {
        this.syncMemberProfile(this.currentUser).catch(() => {});
      }

      const unsub = this.db.collection(`organizations/${ORG_ID}/members`)
        .onSnapshot((snapshot) => {
          const list = [];
          snapshot.forEach(doc => {
            const data = doc.data();
            if (data && data.active !== false) {
              if (!data.id) {
                data.id = (data.email && data.email.toLowerCase() === 'jagadish2k2006@gmail.com') ? 'RD-FOUNDER-001' : `RD-${(data.uid || doc.id).slice(0, 6).toUpperCase()}`;
              }
              list.push(data);
            }
          });
          callback(list);
        }, (err) => {
          console.warn('[FIREBASE] Members subscription error:', err.message);
        });
      this.listeners.push(unsub);
      return unsub;
    },

    async updateMemberRole(targetUid, newRole, newDept = null) {
      if (!targetUid || !newRole) return;

      const payload = {
        role: String(newRole).trim(),
        updatedAt: Date.now()
      };
      if (newDept) {
        payload.dept = String(newDept).trim();
      }

      if (this.db) {
        try {
          await this.db.collection(`organizations/${ORG_ID}/members`).doc(targetUid).set(payload, { merge: true });
        } catch (e) {
          console.warn('[FIREBASE] Role update note:', e.message);
        }
      }

      await this.logAudit('ROLE_UPDATED', `Role for member ${targetUid} changed to [${newRole}]`, targetUid).catch(() => {});
      return payload;
    },

    async inviteMember(email, displayName, role = 'employee') {
      if (!this.currentMember || (this.currentMember.role !== 'owner' && this.currentMember.role !== 'admin')) {
        throw new Error('Permission denied: Only Admins can invite team members');
      }

      const inviteId = 'inv_' + Date.now();
      const inviteData = {
        inviteId,
        email: email.trim().toLowerCase(),
        displayName: displayName.trim(),
        role: role,
        invitedBy: this.currentUser.uid,
        invitedByName: this.currentMember.displayName,
        createdAt: Date.now(),
        status: 'PENDING'
      };

      await this.db.collection(`organizations/${ORG_ID}/invites`).doc(inviteId).set(inviteData);
      await this.logAudit('MEMBER_INVITED', `Invited ${email} with initial role [${role}]`, inviteId);
      return inviteData;
    },

    // --- TASKS (FIRESTORE) ---
    subscribeTasks(callback) {
      if (!this.db) return () => {};
      const unsub = this.db.collection(`organizations/${ORG_ID}/tasks`)
        .orderBy('createdAt', 'desc')
        .onSnapshot((snapshot) => {
          const tasks = [];
          snapshot.forEach(doc => {
            tasks.push({ id: doc.id, ...doc.data() });
          });
          callback(tasks);
        }, (err) => {
          console.warn('[FIREBASE] Tasks subscription error:', err.message);
        });
      this.listeners.push(unsub);
      return unsub;
    },

    async createTask({ id, title, description, priority, assigneeId, assigneeName, assigneeEmail, assigneeUid, dueAt }) {
      const curUid = this.currentUser ? this.currentUser.uid : 'RD-FOUNDER-001';
      const taskId = id || ('task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4));
      const creatorName = this.currentMember?.displayName || this.currentMember?.name || this.currentUser?.displayName || (this.currentUser?.email ? this.currentUser.email.split('@')[0] : 'JAGADISH K');
      const taskData = {
        id: taskId,
        title: String(title || '').trim(),
        description: String(description || '').trim(),
        status: 'ASSIGNED',
        priority: String(priority || 'NORMAL'),
        assigneeId: String(assigneeId || 'ALL'),
        assigneeUid: String(assigneeUid || (assigneeId !== 'ALL' ? assigneeId : '')),
        assigneeName: String(assigneeName || (assigneeId === 'ALL' ? 'Entire Team' : assigneeId)),
        assigneeEmail: String(assigneeEmail || '').toLowerCase(),
        createdBy: curUid,
        createdByName: creatorName,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        dueAt: dueAt || 'Today 5:00 PM'
      };

      if (this.db) {
        await this.db.collection(`organizations/${ORG_ID}/tasks`).doc(taskId).set(taskData);

        // Create initial activity event
        this.db.collection(`organizations/${ORG_ID}/tasks/${taskId}/activity`).add({
          eventType: 'TASK_CREATED',
          authorId: curUid,
          authorName: creatorName,
          text: `Task created and assigned to ${taskData.assigneeName}`,
          timestamp: Date.now()
        }).catch(() => {});

        this.logAudit('TASK_CREATED', `Created task "${taskData.title}" for ${taskData.assigneeName}`, taskId).catch(() => {});
      }

      return { id: taskId, ...taskData };
    },

    async updateTaskStatus(taskId, newStatus) {
      const taskRef = this.db.collection(`organizations/${ORG_ID}/tasks`).doc(taskId);
      const snap = await taskRef.get();
      if (!snap.exists) throw new Error('Task not found');

      const task = snap.data();
      const isAssignee = task.assigneeId === this.currentUser.uid || 
                         task.assigneeId === this.currentMember?.id ||
                         (task.assigneeEmail && task.assigneeEmail === this.currentUser?.email?.toLowerCase()) ||
                         task.assigneeId === 'ALL';
      const isPrivileged = this.currentMember?.role === 'owner' || this.currentMember?.role === 'admin' || this.currentUser?.email?.toLowerCase() === 'jagadish2k2006@gmail.com';

      if (!isAssignee && !isPrivileged) {
        throw new Error('Permission denied: You can only update tasks assigned to you');
      }

      await taskRef.update({
        status: newStatus,
        updatedAt: Date.now(),
        reachedAt: newStatus === 'REACHED' ? Date.now() : (task.reachedAt || null),
        accomplishedAt: newStatus === 'ACCOMPLISHED' ? Date.now() : (task.accomplishedAt || null)
      });

      const authorName = this.currentMember?.displayName || this.currentMember?.name || this.currentUser?.displayName || 'Team Member';
      await this.db.collection(`organizations/${ORG_ID}/tasks/${taskId}/activity`).add({
        eventType: 'STATUS_CHANGED',
        authorId: this.currentUser.uid,
        authorName: authorName,
        text: `Status changed to ${newStatus}`,
        timestamp: Date.now()
      });
    },

    async reassignTask(taskId, newAssigneeId) {
      if (!this.currentMember || (this.currentMember.role !== 'owner' && this.currentMember.role !== 'admin')) {
        throw new Error('Permission denied: Only Owners and Admins can reassign tasks');
      }

      await this.db.collection(`organizations/${ORG_ID}/tasks`).doc(taskId).update({
        assigneeId: newAssigneeId,
        updatedAt: Date.now()
      });

      await this.db.collection(`organizations/${ORG_ID}/tasks/${taskId}/activity`).add({
        eventType: 'TASK_REASSIGNED',
        authorId: this.currentUser.uid,
        authorName: this.currentMember.displayName,
        text: `Reassigned task to ${newAssigneeId}`,
        timestamp: Date.now()
      });
    },

    async deleteTask(taskId) {
      if (!this.currentMember || (this.currentMember.role !== 'owner' && this.currentMember.role !== 'admin')) {
        throw new Error('Permission denied: Only Owners and Admins can delete tasks');
      }

      await this.db.collection(`organizations/${ORG_ID}/tasks`).doc(taskId).delete();
      await this.logAudit('TASK_DELETED', `Deleted task ${taskId}`, taskId);
    },

    subscribeTaskActivity(taskId, callback) {
      if (!this.db || !taskId) return () => {};
      return this.db.collection(`organizations/${ORG_ID}/tasks/${taskId}/activity`)
        .orderBy('timestamp', 'asc')
        .onSnapshot((snapshot) => {
          const events = [];
          snapshot.forEach(doc => events.push({ id: doc.id, ...doc.data() }));
          callback(events);
        });
    },

    async addTaskComment(taskId, commentText) {
      if (!commentText || !commentText.trim()) return;
      await this.db.collection(`organizations/${ORG_ID}/tasks/${taskId}/activity`).add({
        eventType: 'COMMENT',
        authorId: this.currentUser.uid,
        authorName: this.currentMember.displayName,
        text: commentText.trim(),
        timestamp: Date.now()
      });
    },

    async createMemberDoc(memberData) {
      if (!this.db) return null;
      const docId = memberData.uid || memberData.id || `RD-${Date.now()}`;
      const payload = {
        uid: docId,
        id: memberData.id || docId,
        displayName: memberData.name || memberData.displayName || 'Team Member',
        name: memberData.name || memberData.displayName || 'Team Member',
        email: (memberData.email || '').toLowerCase(),
        role: memberData.role || 'Employee',
        dept: memberData.dept || 'Engineering',
        photoURL: memberData.photoUrl || memberData.photoURL || '',
        photoUrl: memberData.photoUrl || memberData.photoURL || '',
        createdAt: memberData.createdAt || Date.now(),
        active: memberData.active !== undefined ? memberData.active : true,
        suspended: !!memberData.suspended
      };

      await this.db.collection(`organizations/${ORG_ID}/members`).doc(docId).set(payload, { merge: true });
      await this.logAudit('MEMBER_CREATED', `Member ${payload.displayName} (${payload.id}) saved to Cloud Firestore`, docId);
      return payload;
    },

    // --- CHANNELS & REALTIME MESSAGES ---
    subscribeChannels(callback) {
      if (!this.db) return () => {};

      // Seed default public channels if not present
      this.ensureDefaultChannels();

      const unsub = this.db.collection(`organizations/${ORG_ID}/channels`)
        .orderBy('createdAt', 'asc')
        .onSnapshot((snapshot) => {
          const channels = [];
          const curUid = this.currentUser?.uid;
          const curEmail = this.currentUser?.email?.toLowerCase();
          const curId = this.currentMember?.id;

          snapshot.forEach(doc => {
            const data = doc.data();
            if (!data) return;

            // Show all public channels
            if (!data.isDirectMessage) {
              channels.push({ id: doc.id, ...data });
            } else {
              // Show Direct Messages that include the current user
              const members = data.members || [];
              const emails = (data.memberEmails || []).map(e => String(e).toLowerCase());
              const ids = data.memberIds || [];

              if (
                (curUid && members.includes(curUid)) ||
                (curEmail && emails.includes(curEmail)) ||
                (curId && (members.includes(curId) || ids.includes(curId)))
              ) {
                channels.push({ id: doc.id, ...data });
              }
            }
          });
          callback(channels);
        }, (err) => {
          console.warn('[FIREBASE] Channels subscription error:', err.message);
        });
      this.listeners.push(unsub);
      return unsub;
    },

    async ensureDefaultChannels() {
      const defaults = [
        { id: 'general', name: 'general', topic: 'Company-wide updates and collaboration', isDirectMessage: false },
        { id: 'announcements', name: 'announcements', topic: 'Official broadcasts and notices', isDirectMessage: false },
        { id: 'engineering', name: 'engineering', topic: 'Technical architecture, hardware & code discussion', isDirectMessage: false },
        { id: 'projects', name: 'projects', topic: 'Active sprint deliverables & hardware milestones', isDirectMessage: false },
        { id: 'watercooler', name: 'watercooler', topic: 'Casual team chat & break room', isDirectMessage: false }
      ];

      for (const ch of defaults) {
        try {
          const ref = this.db.collection(`organizations/${ORG_ID}/channels`).doc(ch.id);
          const doc = await ref.get();
          if (!doc.exists) {
            await ref.set({
              ...ch,
              createdAt: Date.now(),
              updatedAt: Date.now()
            });
          }
        } catch (_) {}
      }
    },

    subscribeMessages(channelId, callback) {
      if (!this.db || !channelId) return () => {};
      const unsub = this.db.collection(`organizations/${ORG_ID}/channels/${channelId}/messages`)
        .orderBy('createdAt', 'asc')
        .limitToLast(150)
        .onSnapshot((snapshot) => {
          const msgs = [];
          snapshot.forEach(doc => {
            msgs.push({ id: doc.id, ...doc.data() });
          });
          callback(msgs);
        }, (err) => {
          console.warn('[FIREBASE] Messages subscription error for channel:', channelId, err.message);
        });
      return unsub;
    },

    async sendMessage(channelId, text) {
      if (!text || !text.trim()) return null;

      const cleanText = text.trim();
      const cleanChannelId = (channelId || 'general').trim();

      const senderUid = this.currentUser ? this.currentUser.uid : (this.currentMember ? (this.currentMember.uid || this.currentMember.id) : 'RD-FOUNDER-001');
      const senderEmpId = this.currentMember ? (this.currentMember.id || `RD-${String(senderUid).slice(0, 6).toUpperCase()}`) : 'RD-FOUNDER-001';
      const senderName = this.currentMember ? (this.currentMember.displayName || this.currentMember.name) : (this.currentUser ? (this.currentUser.displayName || this.currentUser.email.split('@')[0]) : 'JAGADISH K');
      const senderEmail = this.currentUser ? this.currentUser.email.toLowerCase() : 'jagadish2k2006@gmail.com';
      const senderPhoto = this.currentMember?.photoURL || this.currentMember?.photoUrl || this.currentUser?.photoURL || '';

      const messageData = {
        senderId: String(senderUid || 'RD-FOUNDER-001'),
        senderUid: String(senderUid || 'RD-FOUNDER-001'),
        senderEmpId: String(senderEmpId || 'RD-FOUNDER-001'),
        senderName: String(senderName || 'JAGADISH K'),
        senderEmail: String(senderEmail || 'jagadish2k2006@gmail.com').toLowerCase(),
        senderPhoto: String(senderPhoto || ''),
        text: String(cleanText),
        createdAt: Number(Date.now()),
        editedAt: null,
        channelId: String(cleanChannelId)
      };

      let sent = false;

      // 1. Try Firebase Client SDK write
      if (this.db) {
        try {
          const sendPromise = this.db.collection(`organizations/${ORG_ID}/channels/${cleanChannelId}/messages`).add(messageData);
          // 3-second timeout protection
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('SDK_TIMEOUT')), 3000));
          await Promise.race([sendPromise, timeoutPromise]);
          sent = true;

          // Update parent channel document metadata in background (Zero blocking!)
          this.db.collection(`organizations/${ORG_ID}/channels`).doc(cleanChannelId).set({
            id: cleanChannelId,
            isDirectMessage: cleanChannelId.startsWith('dm_'),
            lastMessageText: cleanText.slice(0, 100),
            lastMessageSender: senderName,
            lastMessageTime: Date.now(),
            updatedAt: Date.now()
          }, { merge: true }).catch(() => {});
        } catch (sdkErr) {
          console.warn('[FIREBASE] SDK send warning, activating direct Cloud REST fallback:', sdkErr.message);
        }
      }

      // 2. Direct Cloud REST API Fallback (Guarantees delivery even if SDK hangs or is in transition)
      if (!sent) {
        try {
          const restUrl = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/organizations/${ORG_ID}/channels/${cleanChannelId}/messages?key=${config.apiKey}`;
          const bodyPayload = JSON.stringify({
            fields: {
              senderId: { stringValue: messageData.senderId },
              senderUid: { stringValue: messageData.senderUid },
              senderEmpId: { stringValue: messageData.senderEmpId },
              senderName: { stringValue: messageData.senderName },
              senderEmail: { stringValue: messageData.senderEmail },
              senderPhoto: { stringValue: messageData.senderPhoto },
              text: { stringValue: messageData.text },
              createdAt: { integerValue: String(messageData.createdAt) },
              channelId: { stringValue: messageData.channelId }
            }
          });

          const resp = await fetch(restUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: bodyPayload
          });

          if (resp.ok) {
            sent = true;
            console.log('[FIREBASE] Message delivered via Cloud REST fallback for channel:', cleanChannelId);
          }
        } catch (restErr) {
          console.error('[FIREBASE] REST fallback error:', restErr.message);
        }
      }

      return messageData;
    },

    getDeterministicDMChannelId(userA, userB) {
      const getEmail = (u) => {
        if (!u) return '';
        if (typeof u === 'object') return (u.email || u.uid || u.id || '').toLowerCase().trim();
        return String(u).toLowerCase().trim();
      };
      let emailA = getEmail(userA);
      let emailB = getEmail(userB);

      // Map known IDs to emails
      if (emailA.includes('founder') || emailA.includes('jagadish')) emailA = 'jagadish2k2006@gmail.com';
      if (emailB.includes('founder') || emailB.includes('jagadish')) emailB = 'jagadish2k2006@gmail.com';
      if (emailA.includes('pavithra')) emailA = 'pavithratech1206@gmail.com';
      if (emailB.includes('pavithra')) emailB = 'pavithratech1206@gmail.com';

      const sorted = [emailA || 'user_a', emailB || 'user_b'].sort();
      const safe0 = sorted[0].replace(/[^a-z0-9]/gi, '_');
      const safe1 = sorted[1].replace(/[^a-z0-9]/gi, '_');
      return `dm_${safe0}___${safe1}`;
    },

    async getOrCreateDMChannel(otherMember, otherName = null) {
      const curUid = this.currentUser ? this.currentUser.uid : (this.currentMember?.uid || 'RD-FOUNDER-001');
      const curEmail = this.currentUser ? this.currentUser.email.toLowerCase() : 'jagadish2k2006@gmail.com';
      const curEmpId = this.currentMember?.id || 'RD-FOUNDER-001';
      const curName = this.currentMember?.displayName || 'JAGADISH K';

      const targetUid = typeof otherMember === 'object' ? (otherMember.uid || otherMember.id) : otherMember;
      const targetEmail = typeof otherMember === 'object' ? (otherMember.email || '').toLowerCase() : (String(otherMember).includes('@') ? String(otherMember).toLowerCase() : '');
      const targetEmpId = typeof otherMember === 'object' ? (otherMember.id || targetUid) : targetUid;
      const targetName = typeof otherMember === 'object' ? (otherMember.name || otherMember.displayName || otherName || targetEmpId) : (otherName || targetUid);

      const dmChannelId = this.getDeterministicDMChannelId(curEmail, targetEmail || targetUid);

      if (this.db) {
        const ref = this.db.collection(`organizations/${ORG_ID}/channels`).doc(dmChannelId);
        const doc = await ref.get();

        const membersList = Array.from(new Set([
          curUid, curEmail, curEmpId,
          targetUid, targetEmail, targetEmpId
        ].filter(Boolean)));

        if (!doc.exists) {
          await ref.set({
            id: dmChannelId,
            name: `${targetName}`,
            topic: `Direct conversation between ${curName} and ${targetName}`,
            isDirectMessage: true,
            members: membersList,
            memberEmails: [curEmail, targetEmail].filter(Boolean),
            memberIds: [curEmpId, targetEmpId],
            memberNames: [curName, targetName],
            createdAt: Date.now(),
            updatedAt: Date.now()
          });
        }
      }
      return dmChannelId;
    },

    // --- REALTIME CALL SIGNALING ENGINE ---
    async sendCallInvite(targetMember, roomUrl, callType = 'video') {
      const curUid = String(this.currentUser ? this.currentUser.uid : 'RD-FOUNDER-001');
      const curEmail = String(this.currentUser ? this.currentUser.email : 'jagadish2k2006@gmail.com').toLowerCase().trim();
      const curName = String(this.currentMember?.displayName || this.currentMember?.name || (this.currentUser?.displayName || 'JAGADISH K'));
      const curPhoto = String(this.currentMember?.photoURL || this.currentMember?.photoUrl || '');

      let targetUid = '';
      let targetEmail = '';
      let targetName = 'Teammate';

      if (typeof targetMember === 'object' && targetMember !== null) {
        targetUid = String(targetMember.uid || targetMember.id || '');
        targetEmail = String(targetMember.email || '').toLowerCase().trim();
        targetName = String(targetMember.name || targetMember.displayName || (targetEmail ? targetEmail.split('@')[0] : 'Teammate'));
      } else if (typeof targetMember === 'string') {
        if (targetMember === 'ALL') {
          targetUid = 'ALL';
          targetEmail = '';
          targetName = 'Entire Team';
        } else if (targetMember.includes('@')) {
          targetEmail = targetMember.toLowerCase().trim();
          targetUid = targetEmail;
          targetName = targetEmail.split('@')[0].toUpperCase();
        } else {
          targetUid = targetMember;
          targetName = targetMember;
        }
      }

      const callId = 'call_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const callData = {
        callId: String(callId),
        callerUid: String(curUid),
        callerEmail: String(curEmail),
        callerName: String(curName),
        callerPhoto: String(curPhoto),
        targetUid: String(targetUid),
        targetEmail: String(targetEmail),
        targetName: String(targetName),
        roomUrl: String(roomUrl),
        callType: String(callType || 'video'),
        status: 'RINGING',
        createdAt: Number(Date.now()),
        updatedAt: Number(Date.now())
      };

      let sent = false;

      // 1. Try Firebase Client SDK
      if (this.db) {
        try {
          const writePromise = this.db.collection(`organizations/${ORG_ID}/calls`).doc(callId).set(callData);
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('CALL_TIMEOUT')), 3000));
          await Promise.race([writePromise, timeoutPromise]);
          sent = true;
          this.logAudit('CALL_INVITE_SENT', `Call invite sent to ${targetName} (${callType})`, callId).catch(() => {});
        } catch (e) {
          console.warn('[FIREBASE] SDK call invite warning, activating direct Cloud REST fallback:', e.message);
        }
      }

      // 2. Direct Cloud REST Fallback
      if (!sent) {
        try {
          const restUrl = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/organizations/${ORG_ID}/calls/${callId}?key=${config.apiKey}`;
          const bodyPayload = JSON.stringify({
            fields: {
              callId: { stringValue: callData.callId },
              callerUid: { stringValue: callData.callerUid },
              callerEmail: { stringValue: callData.callerEmail },
              callerName: { stringValue: callData.callerName },
              callerPhoto: { stringValue: callData.callerPhoto },
              targetUid: { stringValue: callData.targetUid },
              targetEmail: { stringValue: callData.targetEmail },
              targetName: { stringValue: callData.targetName },
              roomUrl: { stringValue: callData.roomUrl },
              callType: { stringValue: callData.callType },
              status: { stringValue: 'RINGING' },
              createdAt: { integerValue: String(callData.createdAt) },
              updatedAt: { integerValue: String(callData.updatedAt) }
            }
          });

          const resp = await fetch(restUrl, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: bodyPayload
          });

          if (resp.ok) {
            sent = true;
            console.log('[FIREBASE] Call signal delivered via Cloud REST fallback for:', targetName);
          }
        } catch (restErr) {
          console.error('[FIREBASE] REST call signal fallback error:', restErr.message);
        }
      }

      return callData;
    },

    async respondToCall(callId, status = 'ACCEPTED') {
      if (!this.db || !callId) return;
      await this.db.collection(`organizations/${ORG_ID}/calls`).doc(callId).set({
        status: status,
        updatedAt: Date.now()
      }, { merge: true });
    },

    subscribeIncomingCalls(callback) {
      if (!this.db) return () => {};
      const curUid = this.currentUser?.uid;
      const curEmail = this.currentUser?.email ? this.currentUser.email.toLowerCase().trim() : '';
      const curId = this.currentMember?.id;

      const unsub = this.db.collection(`organizations/${ORG_ID}/calls`)
        .where('status', '==', 'RINGING')
        .onSnapshot((snapshot) => {
          const incoming = [];
          snapshot.forEach(doc => {
            const data = doc.data();
            if (!data) return;
            // Ignore calls initiated by myself
            if (data.callerUid === curUid || (curEmail && data.callerEmail && data.callerEmail.toLowerCase() === curEmail)) return;

            // Ignore calls that expired (older than 60 seconds)
            if (data.createdAt && Date.now() - data.createdAt > 60000) return;

            const tUid = data.targetUid;
            const tEmail = (data.targetEmail || '').toLowerCase().trim();

            const matchesEmail = curEmail && tEmail && (tEmail === curEmail || tEmail.includes(curEmail) || curEmail.includes(tEmail));
            const matchesUid = curUid && tUid && (tUid === curUid || tUid === 'ALL');
            const matchesId = curId && tUid && (tUid === curId || tUid === 'ALL');

            if (matchesEmail || matchesUid || matchesId) {
              incoming.push({ id: doc.id, ...data });
            }
          });
          callback(incoming);
        }, (err) => {
          console.warn('[FIREBASE] Call signaling listener warning:', err.message);
        });

      this.listeners.push(unsub);
      return unsub;
    },

    async updateChannel(channelId, { name, topic }) {
      if (!channelId) return;
      const updateData = {
        name: String(name || channelId).trim(),
        topic: String(topic || '').trim(),
        updatedAt: Date.now()
      };
      if (this.db) {
        await this.db.collection(`organizations/${ORG_ID}/channels`).doc(channelId).set(updateData, { merge: true });
        this.logAudit('CHANNEL_UPDATED', `Updated channel #${channelId} (${updateData.name})`, channelId).catch(() => {});
      }
      return updateData;
    },

    async createCustomChannel({ id, name, topic }) {
      const cleanId = String(id || name || 'channel').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
      const channelData = {
        id: cleanId,
        name: String(name || cleanId).trim(),
        topic: String(topic || 'Workspace team conversation').trim(),
        isDirectMessage: false,
        createdBy: this.currentUser?.email || 'Admin',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      if (this.db) {
        await this.db.collection(`organizations/${ORG_ID}/channels`).doc(cleanId).set(channelData, { merge: true });
        this.logAudit('CHANNEL_CREATED', `Created custom channel #${cleanId}`, cleanId).catch(() => {});
      }
      return channelData;
    },

    async deleteChannel(channelId) {
      if (!channelId || channelId === 'general') {
        throw new Error('Default #general channel cannot be deleted');
      }
      if (this.db) {
        try {
          await this.db.collection(`organizations/${ORG_ID}/channels`).doc(channelId).delete();
          this.logAudit('CHANNEL_DELETED', `Deleted channel #${channelId}`, channelId).catch(() => {});
        } catch (err) {
          console.warn('[FIREBASE] Channel deletion notice:', err.message);
        }
      }
      return true;
    },

    // --- REALTIME PRESENCE & HEARTBEAT ENGINE ---
    heartbeatInterval: null,

    initPresence(uid, displayName, appVersion = '2.6.0') {
      if (!uid) return;

      // 1. Cloud Firestore Heartbeat & Status
      if (this.db) {
        this.updatePresenceFirestore(uid, 'DUTY_ON');
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = setInterval(() => {
          this.updatePresenceFirestore(uid, 'DUTY_ON');
        }, 25000);
      }

      // 2. Realtime Database (RTDB) Presence if configured
      if (this.rtdb) {
        const userPresenceRef = this.rtdb.ref(`organizations/${ORG_ID}/presence/${uid}`);
        const connectedRef = this.rtdb.ref('.info/connected');

        this.presenceRef = userPresenceRef;

        connectedRef.on('value', (snap) => {
          if (snap.val() === true) {
            const onlineStatus = {
              state: 'online',
              displayName: displayName,
              lastSeenAt: firebase.database.ServerValue.TIMESTAMP,
              appVersion: appVersion
            };

            const offlineStatus = {
              state: 'offline',
              displayName: displayName,
              lastSeenAt: firebase.database.ServerValue.TIMESTAMP,
              appVersion: appVersion
            };

            userPresenceRef.onDisconnect().set(offlineStatus).then(() => {
              userPresenceRef.set(onlineStatus);
            });
          }
        });
      }
    },

    updatePresenceFirestore(uid, status = 'DUTY_ON') {
      if (!this.db || !uid) return;
      this.db.collection(`organizations/${ORG_ID}/members`).doc(uid).set({
        status: status,
        lastSeenAt: Date.now(),
        active: true
      }, { merge: true }).catch(() => {});
    },

    setPresenceState(stateName) {
      if (this.presenceRef) {
        this.presenceRef.update({
          state: stateName,
          lastSeenAt: firebase.database.ServerValue.TIMESTAMP
        });
      }
      if (this.currentUser) {
        const statusMap = { online: 'DUTY_ON', away: 'DUTY_BREAK', break: 'DUTY_BREAK', offline: 'DUTY_OFF' };
        this.updatePresenceFirestore(this.currentUser.uid, statusMap[stateName] || 'DUTY_ON');
      }
    },

    cleanupPresence() {
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }
      if (this.currentUser && this.db) {
        this.updatePresenceFirestore(this.currentUser.uid, 'DUTY_OFF');
      }
      if (this.presenceRef) {
        this.presenceRef.set({
          state: 'offline',
          lastSeenAt: Date.now()
        }).catch(() => {});
        this.presenceRef = null;
      }
    },

    subscribeAllPresence(callback) {
      if (!this.rtdb) return () => {};
      const ref = this.rtdb.ref(`organizations/${ORG_ID}/presence`);
      const listener = ref.on('value', (snap) => {
        const val = snap.val() || {};
        callback(val);
      });
      return () => ref.off('value', listener);
    },

    // --- AUDIT LOGS ---
    async logAudit(action, details, targetId = '') {
      if (!this.db || !this.currentUser) return;
      try {
        await this.db.collection(`organizations/${ORG_ID}/auditLogs`).add({
          action,
          details,
          targetId,
          performedBy: this.currentUser.uid,
          performedByName: this.currentMember?.displayName || 'System User',
          timestamp: Date.now()
        });
      } catch (err) {
        console.warn('[FIREBASE] Audit log write warning:', err.message);
      }
    },

    subscribeAuditLogs(callback) {
      if (!this.db) return () => {};
      return this.db.collection(`organizations/${ORG_ID}/auditLogs`)
        .orderBy('timestamp', 'desc')
        .limit(50)
        .onSnapshot((snapshot) => {
          const logs = [];
          snapshot.forEach(doc => logs.push({ id: doc.id, ...doc.data() }));
          callback(logs);
        });
    }
  };

  window.FirebaseService = FirebaseService;

})(window);
