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
  if (!window.CLIENT_SESSION_ID) {
    window.CLIENT_SESSION_ID = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
  }

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
    _authListeners: [],

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

    loadScript(src) {
      return new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) {
          if (existing.getAttribute('data-loaded') === 'true' || window.firebase) return resolve();
          existing.addEventListener('load', resolve, { once: true });
          existing.addEventListener('error', reject, { once: true });
          return;
        }
        const s = document.createElement('script');
        s.src = src;
        s.async = false;
        s.onload = () => { s.setAttribute('data-loaded', 'true'); resolve(); };
        s.onerror = (e) => {
          console.warn(`[FIREBASE] Script failed to load: ${src}`, e);
          reject(e);
        };
        document.head.appendChild(s);
      });
    },

    async ensureReady(timeoutMs = 6000) {
      if (this.initialized && this.auth && this.db) return true;

      const start = Date.now();

      // Step 1: Wait up to 1.5s for local vendor scripts or in-flight scripts
      while ((!window.firebase || typeof window.firebase.initializeApp !== 'function') && (Date.now() - start < 1500)) {
        await new Promise(r => setTimeout(r, 60));
      }

      // Step 2: If still missing, dynamically fetch from Google CDN fallback
      if (!window.firebase || typeof window.firebase.initializeApp !== 'function') {
        try {
          console.warn('[FIREBASE] Local SDK not detected, injecting CDN scripts fallback...');
          await this.loadScript('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
          await this.loadScript('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js');
          await this.loadScript('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js');
        } catch (e) {
          console.error('[FIREBASE] CDN script fallback error:', e);
        }
      }

      // Step 3: Wait for auth and firestore plugins to attach
      const maxWait = Date.now() + Math.max(1200, timeoutMs - (Date.now() - start));
      while (Date.now() < maxWait) {
        if (window.firebase && typeof window.firebase.auth === 'function' && typeof window.firebase.firestore === 'function') {
          break;
        }
        await new Promise(r => setTimeout(r, 60));
      }

      this.init();
      return this.initialized && !!this.auth;
    },

    init() {
      if (this.initialized && this.auth && this.db) return;

      const config = window.REDDOT_FIREBASE_CONFIG || {
        apiKey: "AIzaSyBpjenDcXDREseIDv5NfgpDo2fAk_gUhdk",
        authDomain: "reddot-workspace.firebaseapp.com",
        projectId: "reddot-workspace",
        databaseURL: "",
        storageBucket: "reddot-workspace.firebasestorage.app",
        messagingSenderId: "346765054940",
        appId: "1:346765054940:web:f2feb5855e0131ac383519"
      };

      if (!config || !window.firebase || typeof window.firebase.initializeApp !== 'function') {
        console.warn('[FIREBASE] Firebase SDK not ready yet. Awaiting initialization...');
        return;
      }

      try {
        if (!firebase.apps || !firebase.apps.length) {
          this.app = firebase.initializeApp(config);
        } else {
          this.app = firebase.app();
        }

        if (typeof firebase.auth === 'function') {
          this.auth = firebase.auth();
        }
        if (typeof firebase.firestore === 'function') {
          this.db = firebase.firestore();
        }

        // Enable offline persistence for Firestore
        try {
          if (this.db) {
            this.db.enablePersistence({ synchronizeTabs: true }).catch(err => {
              if (err.code === 'failed-precondition' || err.code === 'unimplemented') {
                // Persistence not supported in multi-tab or environment
              }
            });
          }
        } catch (_) {}

        if (firebase.database && config.databaseURL && typeof config.databaseURL === 'string' && config.databaseURL.startsWith('http')) {
          try {
            this.rtdb = firebase.database();
          } catch (_) {}
        }

        if (this.auth && this.db) {
          this.initialized = true;
          console.log('[FIREBASE] Production Firebase initialized for organization:', ORG_ID);
          this.ensureKnownTeamMembers().catch(() => {});

          // Flush any queued auth listeners
          if (this._authListeners && this._authListeners.length > 0) {
            const queued = [...this._authListeners];
            this._authListeners = [];
            queued.forEach(cb => this.onAuthStateChanged(cb));
          }
        }
      } catch (err) {
        console.error('[FIREBASE] Initialization error:', err.message);
      }
    },

    async ensureKnownTeamMembers() {
      if (!this.db) return;
      try {
        const snap = await this.db.collection(`organizations/${ORG_ID}/members`).get();
        const existingEmails = new Set();
        snap.forEach(doc => {
          const data = doc.data();
          if (data && data.email) existingEmails.add(data.email.toLowerCase());
          // Clean up legacy non-auth doc duplicates if auth uid doc exists
          if (
            doc.id === 'pavithratech1206' ||
            doc.id === 'RD-FOUNDER-001' ||
            doc.id === 'RD-RD-FOU' ||
            (data && (data.id === 'RD-RD-FOU' || (data.name === 'Team Member' && !data.email)))
          ) {
            doc.ref.delete().catch(() => {});
          }
        });

        // Only seed if organization members collection is completely empty
        if (existingEmails.size === 0) {
          const founderDoc = {
            uid: 'Uvhr9MPQ0RODCujtxzUiWcJBzHk2',
            email: 'jagadish2k2006@gmail.com',
            displayName: 'JAGADISH K',
            name: 'JAGADISH K',
            role: 'Founder',
            isOwner: true,
            dept: 'Hardware Architecture',
            id: 'RD-FOUNDER-001',
            active: true,
            status: 'DUTY_ON',
            createdAt: Date.now(),
            updatedAt: Date.now()
          };
          await this.db.collection(`organizations/${ORG_ID}/members`).doc(founderDoc.uid).set(founderDoc, { merge: true });
        }
      } catch (err) {
        console.warn('[FIREBASE] ensureKnownTeamMembers note:', err.message);
      }
    },

    // --- AUTHENTICATION ---
    onAuthStateChanged(callback) {
      if (!this.auth) {
        this._authListeners.push(callback);
        this.ensureReady().catch(() => {});
        return () => {
          const idx = this._authListeners.indexOf(callback);
          if (idx !== -1) this._authListeners.splice(idx, 1);
        };
      }

      return this.auth.onAuthStateChanged(async (user) => {
        this.currentUser = user;
        if (user) {
          // Strict Resignation Check: Immediately terminate session if marked resigned
          const isResigned = await this.isMemberResigned(user.uid, user.email);
          if (isResigned) {
            console.warn('[AUTH] Resigned user session detected and terminated:', user.email);
            await this.signOut();
            callback(null, null);
            if (typeof window.showResignedBanNotice === 'function') {
              window.showResignedBanNotice(user.email);
            }
            return;
          }
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

    async isMemberResigned(identifier, optionalEmail = '') {
      if (!identifier && !optionalEmail) return false;
      const cleanIdent = String(identifier || '').toLowerCase().trim();
      const cleanEmail = String(optionalEmail || (cleanIdent.includes('@') ? cleanIdent : '')).toLowerCase().trim();

      // 1. Check local WorkspaceDB cache
      const localResigned = window.WorkspaceDB?.data?.resignedMembers || [];
      if (localResigned.includes(cleanIdent) || (cleanEmail && localResigned.includes(cleanEmail))) {
        return true;
      }

      if (!this.db) return false;

      try {
        // 2. Check Firestore resignedMembers collection by UID
        if (cleanIdent && !cleanIdent.includes('@')) {
          const snap = await this.db.collection('organizations/' + ORG_ID + '/resignedMembers').doc(cleanIdent).get();
          if (snap.exists) return true;
        }

        // 3. Check Firestore resignedMembers collection by sanitized email
        if (cleanEmail) {
          const emailKey = cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
          const emailSnap = await this.db.collection('organizations/' + ORG_ID + '/resignedMembers').doc(emailKey).get();
          if (emailSnap.exists) return true;
        }

        // 4. Check member profile document
        if (cleanIdent) {
          const mSnap = await this.db.collection('organizations/' + ORG_ID + '/members').doc(cleanIdent).get();
          if (mSnap.exists) {
            const data = mSnap.data();
            if (data?.resigned === true || data?.status === 'RESIGNED') return true;
          }
        }
      } catch (err) {
        console.warn('[FIREBASE] isMemberResigned check notice:', err.message);
      }

      return false;
    },

    async markMemberResigned(member) {
      if (!this.db || !member) return;
      const cleanEmail = (member.email || '').toLowerCase().trim();
      const uid = member.uid || member.id;
      const docId = member.docId || uid;
      const now = Date.now();

      const resignationRecord = {
        uid: uid,
        docId: docId,
        email: cleanEmail,
        name: member.displayName || member.name || 'Team Member',
        resigned: true,
        status: 'RESIGNED',
        active: false,
        isOnline: false,
        resignedAt: now,
        resignedBy: 'Founder (Jagadish K)',
        permanentBan: true
      };

      // 1. Update member profile in organizations/{ORG_ID}/members
      const targets = [docId, uid, member.id].filter(Boolean);
      for (const tid of targets) {
        try {
          await this.db.collection('organizations/' + ORG_ID + '/members').doc(tid).set({
            resigned: true,
            status: 'RESIGNED',
            active: false,
            isOnline: false,
            resignedAt: now,
            resignedBy: 'Founder (Jagadish K)'
          }, { merge: true });
        } catch (_) {}
      }

      // 2. Add to permanent blacklist collection
      try {
        if (uid) {
          await this.db.collection('organizations/' + ORG_ID + '/resignedMembers').doc(uid).set(resignationRecord);
        }
        if (cleanEmail) {
          const emailKey = cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
          await this.db.collection('organizations/' + ORG_ID + '/resignedMembers').doc(emailKey).set(resignationRecord);
        }
      } catch (err) {
        console.warn('[FIREBASE] Error saving resigned blacklist:', err);
      }

      // 3. Kick from RTDB presence
      if (this.rtdb && uid) {
        try {
          await this.rtdb.ref('organizations/' + ORG_ID + '/presence/' + uid).set({
            state: 'offline',
            isOnline: false,
            resigned: true,
            lastSeenAt: now
          });
        } catch (_) {}
      }

      await this.logAudit('MEMBER_RESIGNED', 'Founder Jagadish K officially registered resignation for ' + resignationRecord.name + ' [' + cleanEmail + ']. Workstation access permanently revoked.', uid);
    },

    async signIn(email, password) {
      if (!this.auth) throw new Error('Firebase Auth service not ready');
      const cleanEmail = email.trim().toLowerCase();

      // Pre-login resignation check
      const isPreResigned = await this.isMemberResigned(cleanEmail);
      if (isPreResigned) {
        throw new Error('Access Revoked: You have officially resigned from REDDOT Technologies. Resigned personnel are permanently restricted from logging into the workstation.');
      }

      const cred = await this.auth.signInWithEmailAndPassword(cleanEmail, password);
      const user = cred.user;

      // Post-auth UID verification
      const isPostResigned = await this.isMemberResigned(user.uid, user.email);
      if (isPostResigned) {
        await this.auth.signOut().catch(() => {});
        throw new Error('Access Revoked: You have officially resigned from REDDOT Technologies. Resigned personnel are permanently restricted from logging into the workstation.');
      }

      return user;
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

      // Google UID/email resignation check
      const isGoogleResigned = await this.isMemberResigned(user.uid, user.email);
      if (isGoogleResigned) {
        await this.auth.signOut().catch(() => {});
        throw new Error('Access Revoked: You have officially resigned from REDDOT Technologies. Resigned personnel are permanently restricted from logging into the workstation.');
      }

      try {
        await this.syncMemberProfile(user);
      } catch (e) {
        console.warn('[FIREBASE] Google sign-in profile sync note:', e);
      }
      return user;
    },

    async signUp(email, password, displayName, requestedRole = 'employee', extraProfile = {}) {
      if (!this.auth) throw new Error('Firebase Auth service not ready');
      const cleanEmail = email.trim().toLowerCase();
      const isResigned = await this.isMemberResigned(cleanEmail);
      if (isResigned) {
        throw new Error('Registration Prohibited: This email belongs to resigned personnel. Rejoining or creating new workstation accounts is strictly barred under company policy.');
      }
      const cred = await this.auth.createUserWithEmailAndPassword(cleanEmail, password);
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

      const role = isSoleAdmin ? 'Founder' : (email.toLowerCase() === 'keerthijai909@gmail.com' ? 'CEO' : (requestedRole === 'Intern' ? 'Intern' : 'Employee'));

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

      let role = isFounder ? 'Founder' : (email === 'keerthijai909@gmail.com' ? 'CEO' : (existingData?.role || 'Employee'));
      if (!isFounder && ((role === 'Founder' || role === 'owner') || role === 'founder' || role === 'FOUNDER')) {
        role = (email === 'keerthijai909@gmail.com') ? 'CEO' : 'employee';
      }
      if (email === 'keerthijai909@gmail.com') {
        role = 'CEO';
      }

      const memberId = isFounder ? 'RD-FOUNDER-001' : (existingData?.id || (email.includes('pavithra') ? 'RD-EMP-002' : `RD-${user.uid.slice(0, 6).toUpperCase()}`));
      const displayName = user.displayName || existingData?.displayName || existingData?.name || (email === 'keerthijai909@gmail.com' ? 'Jai Keerthi' : (email ? email.split('@')[0].toUpperCase() : 'Team Member'));

      // ID card photo takes strict priority over Google profile photo so custom badges never get overwritten
      const resolvedCustomPhoto = existingData?.customPhoto || existingData?.idCardPhoto || localCustomPhoto || null;
      const photoURL = resolvedCustomPhoto || existingData?.photoURL || existingData?.photoUrl || user.photoURL || '';

      const dept = isFounder ? 'Hardware Architecture' : ((email === 'keerthijai909@gmail.com') ? 'AI / ML Systems' : (existingData?.dept || 'Engineering'));

      const memberData = {
        uid: user.uid,
        id: memberId,
        displayName: displayName,
        name: displayName,
        email: email,
        role: role,
        isOwner: isFounder,
        dept: dept,
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

      const targetUid = uid || (this.currentUser ? this.currentUser.uid : 'RD-FOUNDER-001');

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
        if (targetUid) storedPhotos[targetUid] = photoDataUrl;
        if (this.currentUser?.email) storedPhotos[this.currentUser.email.toLowerCase()] = photoDataUrl;
        localStorage.setItem('rd_member_custom_photos', JSON.stringify(storedPhotos));
        localStorage.setItem('rd_custom_badge_photo', photoDataUrl);
      } catch (_) {}

      // 2. Update ONLY the target member doc in Firestore
      try {
        await this.db.collection(`organizations/${ORG_ID}/members`).doc(targetUid).set(photoPayload, { merge: true });
      } catch (e) {
        console.warn('[FIREBASE] Member photo cloud sync notice:', e.message);
      }

      if (this.currentMember && (this.currentMember.id === targetUid || this.currentMember.uid === targetUid)) {
        this.currentMember.idCardPhoto = photoDataUrl;
        this.currentMember.customPhoto = photoDataUrl;
        this.currentMember.isCustomPhoto = true;
        this.currentMember.photoUrl = photoDataUrl;
        this.currentMember.photoURL = photoDataUrl;
      }
      await this.logAudit('MEMBER_PHOTO_UPDATED', `ID card photo updated in Cloud Vault for ${targetUid}`, targetUid).catch(() => {});
      return photoPayload;
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
          data.role = 'Founder';
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
            if (!data) return;
            const isCoreMember = !!(data.email && (
              data.email.toLowerCase() === 'tejaswinisiva02@gmail.com' ||
              data.email.toLowerCase() === 'pavithratech1206@gmail.com' ||
              data.email.toLowerCase() === 'keerthijai909@gmail.com' ||
              data.email.toLowerCase() === 'jagadish2k2006@gmail.com'
            ));
            if (!isCoreMember) {
              // Ignore tombstoned or phantom records with no email and corrupted ID
              if (data.active === false || data.deleted === true) return;
              if (doc.id.startsWith('RD-RD-') || (data.id && data.id.startsWith('RD-RD-'))) return;
              if (!data.email && (doc.id.startsWith('RD-') || (data.name === 'Team Member' && !data.displayName))) return;
            }

            data.docId = doc.id;
            if (!data.uid) data.uid = doc.id;
            if (!data.id) {
              data.id = (data.email && data.email.toLowerCase() === 'jagadish2k2006@gmail.com') ? 'RD-FOUNDER-001' : `RD-${(data.uid || doc.id).slice(0, 6).toUpperCase()}`;
            }
            list.push(data);
          });
          callback(list);
        }, (err) => {
          console.warn('[FIREBASE] Members subscription error:', err.message);
        });
      this.listeners.push(unsub);
      return unsub;
    },

    async updateMemberRole(targetUid, newRole, newDept = null, targetEmail = null) {
      if (!targetUid || !newRole) return;

      const payload = {
        role: String(newRole).trim(),
        updatedAt: Date.now()
      };
      if (newDept) {
        payload.dept = String(newDept).trim();
      }

      // 1. Immediately update in local WorkspaceDB so UI reflects changes with zero lag
      try {
        if (window.WorkspaceDB && window.WorkspaceDB.data && window.WorkspaceDB.data.members) {
          Object.values(window.WorkspaceDB.data.members).forEach(m => {
            if (m && (
              m.id === targetUid ||
              m.uid === targetUid ||
              m.docId === targetUid ||
              (targetEmail && m.email && m.email.toLowerCase() === targetEmail.toLowerCase())
            )) {
              m.role = payload.role;
              if (payload.dept) m.dept = payload.dept;
              m.updatedAt = payload.updatedAt;
            }
          });
          window.WorkspaceDB.save();
        }
      } catch (_) {}

      // 2. Persist to Cloud Firestore across all matching documents via SDK
      if (this.db) {
        try {
          // Direct document update on targetUid
          await this.db.collection(`organizations/${ORG_ID}/members`).doc(targetUid).set(payload, { merge: true });

          // Also search and sync other docs matching this member's ID, UID, or Email
          const membersRef = this.db.collection(`organizations/${ORG_ID}/members`);
          const snap = await membersRef.get();
          if (snap && !snap.empty) {
            const batch = this.db.batch();
            let batchCount = 0;
            snap.forEach(doc => {
              const data = doc.data();
              if (!data) return;
              const matchesTarget = (
                doc.id === targetUid ||
                doc.id.toLowerCase() === targetUid.toLowerCase() ||
                data.id === targetUid ||
                data.uid === targetUid ||
                (targetEmail && data.email && data.email.toLowerCase() === targetEmail.toLowerCase())
              );
              if (matchesTarget) {
                batch.set(doc.ref, payload, { merge: true });
                batchCount++;
              }
            });
            if (batchCount > 0) {
              await batch.commit();
            }
          }
        } catch (e) {
          console.warn('[FIREBASE] Role update note:', e.message);
        }
      }

      // 3. Direct Cloud Firestore REST API Fallback (Guaranteed persistence)
      const config = window.REDDOT_FIREBASE_CONFIG || {};
      if (config && config.projectId && config.apiKey) {
        try {
          const patchFields = {
            role: { stringValue: payload.role },
            updatedAt: { integerValue: String(payload.updatedAt) }
          };
          if (newDept) {
            patchFields.dept = { stringValue: payload.dept };
          }
          const mask = `updateMask.fieldPaths=role&updateMask.fieldPaths=updatedAt${newDept ? '&updateMask.fieldPaths=dept' : ''}`;

          // Direct patch to targetUid document
          const patchUrl = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/organizations/${ORG_ID}/members/${encodeURIComponent(targetUid)}?${mask}&key=${config.apiKey}`;
          await fetch(patchUrl, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fields: patchFields })
          }).catch(() => {});

          // Fetch all docs to ensure duplicate/linked doc IDs are also patched
          const listUrl = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/organizations/${ORG_ID}/members?key=${config.apiKey}`;
          const resp = await fetch(listUrl).catch(() => null);
          if (resp && resp.ok) {
            const resJson = await resp.json().catch(() => null);
            if (resJson && resJson.documents) {
              for (const doc of resJson.documents) {
                const docId = doc.name ? doc.name.split('/').pop() : '';
                if (!docId || docId === targetUid) continue;
                const f = doc.fields || {};
                const email = f.email ? f.email.stringValue : '';
                const id = f.id ? f.id.stringValue : '';
                const uid = f.uid ? f.uid.stringValue : '';
                if ((targetEmail && email && email.toLowerCase() === targetEmail.toLowerCase()) || id === targetUid || uid === targetUid) {
                  const subPatchUrl = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/organizations/${ORG_ID}/members/${encodeURIComponent(docId)}?${mask}&key=${config.apiKey}`;
                  await fetch(subPatchUrl, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fields: patchFields })
                  }).catch(() => {});
                }
              }
            }
          }
        } catch (restErr) {
          console.warn('[FIREBASE] Role REST update note:', restErr);
        }
      }

      await this.logAudit('ROLE_UPDATED', `Role for member ${targetUid} changed to [${newRole}]`, targetUid).catch(() => {});
      return payload;
    },

    async inviteMember(email, displayName, role = 'employee') {
      if (!this.currentMember || (!(this.currentMember?.role === 'Founder' || this.currentMember?.role === 'CEO' || this.currentUser?.email?.toLowerCase() === 'jagadish2k2006@gmail.com'))) {
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

    async createTask({ id, title, description, priority, assigneeId, assigneeName, assigneeEmail, assigneeUid, dueAt, createdAt, taskDate, subtasks }) {
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
        createdAt: createdAt ? Number(createdAt) : Date.now(),
        updatedAt: Date.now(),
        dueAt: dueAt || 'Today 5:00 PM',
        taskDate: String(taskDate || ''),
        subtasks: Array.isArray(subtasks) ? subtasks.map(s => ({
          id: String(s.id || 'sub_' + Math.random().toString(36).substr(2, 7)),
          title: String(s.title || '').trim(),
          done: Boolean(s.done || s.completed),
          completed: Boolean(s.done || s.completed),
          ...(s.image ? { image: String(s.image) } : {}),
          ...(s.imageName ? { imageName: String(s.imageName) } : {}),
          ...(s.imageSize ? { imageSize: Number(s.imageSize) } : {})
        })) : []
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
      const isPrivileged = (this.currentMember?.role === 'Founder' || this.currentMember?.role === 'CEO' || this.currentMember?.role === 'owner' || this.currentMember?.role === 'admin') || this.currentUser?.email?.toLowerCase() === 'jagadish2k2006@gmail.com';

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
      if (!this.currentMember || (!(this.currentMember?.role === 'Founder' || this.currentMember?.role === 'CEO' || this.currentUser?.email?.toLowerCase() === 'jagadish2k2006@gmail.com'))) {
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

    async updateTask(taskId, updates) {
      if (!this.db || !taskId) return;
      const cleanUpdates = { ...updates, updatedAt: Date.now() };
      await this.db.collection(`organizations/${ORG_ID}/tasks`).doc(taskId).set(cleanUpdates, { merge: true });

      const curUid = this.currentUser ? this.currentUser.uid : 'RD-FOUNDER-001';
      const authorName = this.currentMember?.displayName || this.currentMember?.name || this.currentUser?.displayName || (this.currentUser?.email ? this.currentUser.email.split('@')[0] : 'JAGADISH K');
      await this.db.collection(`organizations/${ORG_ID}/tasks/${taskId}/activity`).add({
        eventType: 'TASK_EDITED',
        authorId: curUid,
        authorName: authorName,
        text: `Task details updated: "${cleanUpdates.title || 'Task'}" [${cleanUpdates.status || ''}]`,
        timestamp: Date.now()
      }).catch(() => {});

      await this.logAudit('TASK_EDITED', `Updated task ${taskId}: "${cleanUpdates.title || 'Task'}"`, taskId).catch(() => {});
      return cleanUpdates;
    },

    async deleteTask(taskId) {
      if (!this.currentMember || (!(this.currentMember?.role === 'Founder' || this.currentMember?.role === 'CEO' || this.currentUser?.email?.toLowerCase() === 'jagadish2k2006@gmail.com'))) {
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
          const resolvedUser = this.currentUser || window.state?.currentUser || (window.WorkspaceDB?.data?.currentUser);
          const resolvedMember = this.currentMember || (window.state?.currentMember) || (window.WorkspaceDB?.data?.members && window.state?.currentMemberId && window.WorkspaceDB.data.members[window.state.currentMemberId]);
          const curUid = resolvedUser?.uid || resolvedMember?.uid || window.state?.currentMemberId;
          const curEmail = (resolvedUser?.email || resolvedMember?.email || '').toLowerCase().trim();
          const curId = resolvedMember?.id || window.state?.currentMemberId;
          const safeEmail = curEmail ? curEmail.replace(/[^a-z0-9]/gi, '_') : '';
          const safeId = curId ? String(curId).toLowerCase().replace(/[^a-z0-9]/gi, '_') : '';

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
                (curEmail && (emails.includes(curEmail) || (safeEmail && doc.id.includes(safeEmail)))) ||
                (curId && (members.includes(curId) || ids.includes(curId) || (safeId && doc.id.includes(safeId))))
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

    async updateChannel(channelId, updates) {
      if (!channelId || !this.db) return false;
      const cleanId = channelId.trim();
      const payload = {
        name: updates.name ? updates.name.trim() : cleanId,
        topic: updates.topic !== undefined ? String(updates.topic).trim() : '',
        updatedAt: Date.now()
      };
      try {
        await this.db.collection(`organizations/${ORG_ID}/channels`).doc(cleanId).set(payload, { merge: true });
        console.log('[FIREBASE] Channel updated in cloud:', cleanId, payload);
        return true;
      } catch (err) {
        console.error('[FIREBASE] updateChannel error:', err);
        return false;
      }
    },

    async deleteChannel(channelId) {
      if (!channelId || !this.db) return false;
      const cleanId = channelId.trim();
      if (cleanId === 'general') return false; // Protected default channel
      try {
        await this.db.collection(`organizations/${ORG_ID}/channels`).doc(cleanId).delete();
        console.log('[FIREBASE] Channel deleted from cloud:', cleanId);
        return true;
      } catch (err) {
        console.error('[FIREBASE] deleteChannel error:', err);
        return false;
      }
    },

    async fetchChannelMessages(channelId) {
      if (!this.db || !channelId) return [];
      try {
        const snap = await this.db.collection(`organizations/${ORG_ID}/channels/${channelId}/messages`)
          .orderBy('createdAt', 'asc')
          .limitToLast(200)
          .get();
        const msgs = [];
        snap.forEach(doc => {
          const data = doc.data() || {};
          if (data.attachmentsJson && (!data.attachments || data.attachments.length === 0)) {
            try { data.attachments = JSON.parse(data.attachmentsJson); } catch (_) {}
          }
          if (data.voiceNoteJson && !data.voiceNote) {
            try { data.voiceNote = JSON.parse(data.voiceNoteJson); } catch (_) {}
          }
          if (data.delivered === undefined) data.delivered = true;
          msgs.push({ id: doc.id, ...data });
        });
        return msgs;
      } catch (err) {
        console.warn('[FIREBASE] fetchChannelMessages error:', err);
        return [];
      }
    },

    subscribeMessages(channelId, callback) {
      if (!this.db || !channelId) return () => {};
      const unsub = this.db.collection(`organizations/${ORG_ID}/channels/${channelId}/messages`)
        .orderBy('createdAt', 'asc')
        .limitToLast(200)
        .onSnapshot((snapshot) => {
          const msgs = [];
          snapshot.forEach(doc => {
            const data = doc.data() || {};
            if (data.attachmentsJson && (!data.attachments || data.attachments.length === 0)) {
              try { data.attachments = JSON.parse(data.attachmentsJson); } catch (_) {}
            }
            if (data.voiceNoteJson && !data.voiceNote) {
              try { data.voiceNote = JSON.parse(data.voiceNoteJson); } catch (_) {}
            }
            if (data.delivered === undefined) {
              data.delivered = true;
            }
            msgs.push({ id: doc.id, ...data });
          });
          callback(msgs);
        }, (err) => {
          console.warn('[FIREBASE] Messages subscription error for channel:', channelId, err.message);
        });
      return unsub;
    },

    async sendMessage(channelId, text, options = {}) {
      if ((!text || !text.trim()) && (!options.attachments || options.attachments.length === 0) && !options.voiceNote) {
        return null;
      }

      // Security check: resolve active session user with robust fallbacks
      const resolvedUser = this.currentUser || window.state?.currentUser || (window.WorkspaceDB?.data?.currentUser) || {
        uid: options.senderUid || 'RD-FOUNDER-001',
        displayName: options.senderName || 'Jagadish K',
        email: options.senderEmail || 'jagadish2k2006@gmail.com',
        photoURL: options.senderPhoto || './assets/profile-photo.jpeg'
      };
      const resolvedMember = this.currentMember || (window.state?.currentMember) || (window.WorkspaceDB?.data?.members && window.state?.currentMemberId && window.WorkspaceDB.data.members[window.state.currentMemberId]) || {
        id: options.senderEmpId || 'RD-FOUNDER-001',
        name: options.senderName || 'Jagadish K',
        displayName: options.senderName || 'Jagadish K',
        email: options.senderEmail || 'jagadish2k2006@gmail.com',
        photoURL: options.senderPhoto || './assets/profile-photo.jpeg'
      };

      if (!this.currentUser && resolvedUser) {
        this.currentUser = resolvedUser;
      }
      if (!this.currentMember && resolvedMember) {
        this.currentMember = resolvedMember;
      }

      const cleanText = text ? text.trim() : '';
      const cleanChannelId = (channelId || 'general').trim();

      const senderUid = String(resolvedUser?.uid || resolvedMember?.uid || window.state?.currentMemberId || 'RD-FOUNDER-001');
      const senderEmpId = String(resolvedMember?.id || window.state?.currentMemberId || (senderUid ? `RD-${senderUid.slice(0, 6).toUpperCase()}` : 'RD-EMP'));
      const senderName = String(resolvedMember?.displayName || resolvedMember?.name || resolvedUser?.displayName || (resolvedUser?.email ? resolvedUser.email.split('@')[0] : 'Member'));
      const senderEmail = String(resolvedUser?.email || resolvedMember?.email || '').toLowerCase();
      const senderPhoto = String(resolvedMember?.photoURL || resolvedMember?.photoUrl || resolvedUser?.photoURL || '');

      const msgId = options.id || ('msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7));

      const messageData = {
        id: String(msgId),
        senderId: String(senderUid),
        senderUid: String(senderUid),
        senderEmpId: String(senderEmpId),
        senderName: String(senderName),
        senderEmail: String(senderEmail),
        senderPhoto: String(senderPhoto),
        text: String(cleanText),
        createdAt: Number(options.createdAt || Date.now()),
        editedAt: null,
        isEdited: false,
        channelId: String(cleanChannelId),
        reactions: options.reactions || {},
        replyTo: options.replyTo || null,
        attachments: Array.isArray(options.attachments) ? options.attachments.map(a => ({
          id: String(a.id || ''),
          name: String(a.name || 'attachment'),
          size: typeof a.rawSize === 'number' ? Math.round(a.rawSize) : (typeof a.size === 'number' ? Math.round(a.size) : Math.round(parseFloat(a.size) * 1024 || 0)),
          type: String(a.type || 'image/webp'),
          isImage: !!a.isImage,
          dataUrl: String(a.dataUrl || ''),
          previewUrl: String(a.previewUrl || ''),
          downloadUrl: String(a.downloadUrl || ''),
          driveFileId: String(a.driveFileId || '')
        })) : [],
        voiceNote: options.voiceNote || null,
        mentions: options.mentions || [],
        isPinned: false,
        delivered: false,
        deliveredTo: { [senderUid]: Date.now() },
        readBy: {}
      };

      let sent = false;

      // 1. Try Firebase Client SDK write
      if (this.db) {
        try {
          const docRef = this.db.collection(`organizations/${ORG_ID}/channels/${cleanChannelId}/messages`).doc(msgId);
          const sendPromise = docRef.set(messageData);
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('SDK_TIMEOUT')), 3500));
          await Promise.race([sendPromise, timeoutPromise]);
          sent = true;

          // Update parent channel document metadata in background
          this.db.collection(`organizations/${ORG_ID}/channels`).doc(cleanChannelId).set({
            id: cleanChannelId,
            isDirectMessage: cleanChannelId.startsWith('dm_'),
            lastMessageText: (cleanText || (options.attachments?.length ? '📎 Attachment' : '🎙️ Voice note')).slice(0, 100),
            lastMessageSender: senderName,
            lastMessageTime: Date.now(),
            updatedAt: Date.now()
          }, { merge: true }).catch(() => {});
        } catch (sdkErr) {
          console.warn('[FIREBASE] SDK send warning, activating direct Cloud REST fallback:', sdkErr.message);
        }
      }

      // 2. Direct Cloud REST API Fallback
      if (!sent) {
        try {
          const restUrl = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/organizations/${ORG_ID}/channels/${cleanChannelId}/messages/${msgId}?key=${config.apiKey}`;
          const fieldsObj = {
            id: { stringValue: messageData.id },
            senderId: { stringValue: messageData.senderId },
            senderUid: { stringValue: messageData.senderUid },
            senderEmpId: { stringValue: messageData.senderEmpId },
            senderName: { stringValue: messageData.senderName },
            senderEmail: { stringValue: messageData.senderEmail },
            senderPhoto: { stringValue: messageData.senderPhoto },
            text: { stringValue: messageData.text },
            createdAt: { integerValue: String(messageData.createdAt) },
            channelId: { stringValue: messageData.channelId },
            isEdited: { booleanValue: false },
            delivered: { booleanValue: true }
          };

          if (messageData.attachments && messageData.attachments.length > 0) {
            fieldsObj.attachmentsJson = { stringValue: JSON.stringify(messageData.attachments) };
          }
          if (messageData.voiceNote) {
            fieldsObj.voiceNoteJson = { stringValue: JSON.stringify(messageData.voiceNote) };
          }

          const bodyPayload = JSON.stringify({ fields: fieldsObj });

          const resp = await fetch(restUrl, {
            method: 'PATCH',
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

    async updateMessage(channelId, messageId, newText) {
      if (!channelId || !messageId || typeof newText !== 'string') return false;
      const cleanChannelId = channelId.trim();
      const cleanMessageId = messageId.trim();
      const cleanText = newText.trim();
      const updates = {
        text: cleanText,
        isEdited: true,
        editedAt: Date.now()
      };

      if (this.db) {
        try {
          await this.db.collection(`organizations/${ORG_ID}/channels/${cleanChannelId}/messages`).doc(cleanMessageId).set(updates, { merge: true });
          console.log('[FIREBASE] Message updated in Firestore:', cleanMessageId);
          return true;
        } catch (err) {
          console.warn('[FIREBASE] updateMessage error:', err.message);
        }
      }

      // REST fallback
      try {
        const config = window.REDDOT_FIREBASE_CONFIG;
        if (config && config.projectId) {
          const restUrl = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/organizations/${ORG_ID}/channels/${cleanChannelId}/messages/${cleanMessageId}?updateMask.fieldPaths=text&updateMask.fieldPaths=isEdited&updateMask.fieldPaths=editedAt&key=${config.apiKey}`;
          await fetch(restUrl, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fields: {
                text: { stringValue: cleanText },
                isEdited: { booleanValue: true },
                editedAt: { integerValue: String(updates.editedAt) }
              }
            })
          });
          return true;
        }
      } catch (_) {}

      return false;
    },

    async deleteMessage(channelId, messageId, requesterUid = null) {
      if (!channelId || !messageId) return false;
      const cleanChannelId = channelId.trim();
      const cleanMessageId = messageId.trim();

      const myUid = requesterUid || this.currentUser?.uid || this.currentMember?.uid || this.currentMember?.id;
      const myEmail = (this.currentUser?.email || '').toLowerCase();

      if (!myUid && !myEmail) {
        console.warn('[FIREBASE] Unauthorized delete: User not authenticated.');
        return false;
      }

      if (this.db) {
        try {
          const docRef = this.db.collection(`organizations/${ORG_ID}/channels/${cleanChannelId}/messages`).doc(cleanMessageId);
          const doc = await docRef.get();
          if (doc.exists) {
            const data = doc.data() || {};
            const senderUid = data.senderUid || data.senderId;
            const senderEmail = (data.senderEmail || '').toLowerCase();
            const isAuthor = (myUid && (senderUid === myUid || senderUid === this.currentMember?.id)) || (myEmail && senderEmail && senderEmail === myEmail);
            if (!isAuthor) {
              console.warn('[FIREBASE] Unauthorized delete: Only the author can delete their own message!');
              return false;
            }
          }
          await docRef.delete();
          console.log('[FIREBASE] Message deleted from Firestore:', cleanMessageId);
          return true;
        } catch (err) {
          console.warn('[FIREBASE] deleteMessage error:', err.message);
        }
      }

      try {
        const config = window.REDDOT_FIREBASE_CONFIG;
        if (config && config.projectId) {
          const restUrl = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/organizations/${ORG_ID}/channels/${cleanChannelId}/messages/${cleanMessageId}?key=${config.apiKey}`;
          await fetch(restUrl, { method: 'DELETE' });
          return true;
        }
      } catch (e) {
        console.warn('[FIREBASE] REST deleteMessage error:', e);
      }

      return false;
    },

    async markMessageAsRead(channelId, messageId, readerInfo = null) {
      if (!channelId || !messageId || !this.db) return false;
      const cleanChannelId = channelId.trim();
      const cleanMessageId = messageId.trim();
      const readerUid = readerInfo?.uid || this.currentUser?.uid || this.currentMember?.id;
      if (!readerUid) return false;

      const readerName = readerInfo?.name || this.currentMember?.displayName || this.currentMember?.name || this.currentUser?.displayName || 'Teammate';
      const readerEmpId = readerInfo?.empId || this.currentMember?.id || '';

      try {
        const docRef = this.db.collection(`organizations/${ORG_ID}/channels/${cleanChannelId}/messages`).doc(cleanMessageId);
        await docRef.update({
          [`readBy.${readerUid}`]: {
            uid: readerUid,
            name: readerName,
            empId: readerEmpId,
            readAt: Date.now()
          },
          delivered: true
        });
        return true;
      } catch (err) {
        try {
          const docRef = this.db.collection(`organizations/${ORG_ID}/channels/${cleanChannelId}/messages`).doc(cleanMessageId);
          await docRef.set({
            readBy: {
              [readerUid]: {
                uid: readerUid,
                name: readerName,
                empId: readerEmpId,
                readAt: Date.now()
              }
            },
            delivered: true
          }, { merge: true });
          return true;
        } catch (_) {
          return false;
        }
      }
    },

    async markMessageDelivered(channelId, messageId, receiverInfo = null) {
      if (!channelId || !messageId || !this.db) return false;
      const cleanChannelId = channelId.trim();
      const cleanMessageId = messageId.trim();
      const receiverUid = receiverInfo?.uid || this.currentUser?.uid || this.currentMember?.id;
      if (!receiverUid) return false;

      try {
        const docRef = this.db.collection(`organizations/${ORG_ID}/channels/${cleanChannelId}/messages`).doc(cleanMessageId);
        await docRef.update({
          [`deliveredTo.${receiverUid}`]: Date.now(),
          delivered: true
        });
        return true;
      } catch (_) {
        return false;
      }
    },

    async toggleReaction(channelId, messageId, emoji, userObj = null) {
      if (!channelId || !messageId || !emoji || !this.db) return false;
      const cleanChannelId = channelId.trim();
      const cleanMessageId = messageId.trim();

      try {
        const docRef = this.db.collection(`organizations/${ORG_ID}/channels/${cleanChannelId}/messages`).doc(cleanMessageId);
        const doc = await docRef.get();
        if (!doc.exists) return false;

        const data = doc.data() || {};
        const reactions = { ...(data.reactions || {}) };
        let users = Array.isArray(reactions[emoji]) ? [...reactions[emoji]] : [];

        const myUid = userObj?.uid || userObj?.id || this.currentUser?.uid || this.currentMember?.id || 'RD-USER';
        const myName = userObj?.displayName || userObj?.name || this.currentMember?.displayName || 'Teammate';

        const existingIdx = users.findIndex(u => (typeof u === 'string' ? u === myUid : u.uid === myUid));
        if (existingIdx >= 0) {
          users.splice(existingIdx, 1);
        } else {
          users.push({ uid: myUid, name: myName });
        }

        if (users.length === 0) {
          delete reactions[emoji];
        } else {
          reactions[emoji] = users;
        }

        await docRef.set({ reactions }, { merge: true });
        return true;
      } catch (err) {
        console.warn('[FIREBASE] toggleReaction error:', err);
        return false;
      }
    },

    async pinMessage(channelId, messageId, isPinned = true) {
      if (!channelId || !messageId || !this.db) return false;
      const cleanChannelId = channelId.trim();
      const cleanMessageId = messageId.trim();
      try {
        await this.db.collection(`organizations/${ORG_ID}/channels/${cleanChannelId}/messages`).doc(cleanMessageId).set({
          isPinned: !!isPinned,
          pinnedAt: isPinned ? Date.now() : null
        }, { merge: true });
        return true;
      } catch (err) {
        console.warn('[FIREBASE] pinMessage error:', err);
        return false;
      }
    },

    async setTypingStatus(channelId, isTyping = true) {
      if (!channelId || !this.db) return;
      const cleanChannelId = channelId.trim();
      const myUid = this.currentUser?.uid || this.currentMember?.id || 'RD-USER';
      const myName = this.currentMember?.displayName || this.currentMember?.name || (this.currentUser?.displayName || 'Teammate');
      const docRef = this.db.collection(`organizations/${ORG_ID}/channels/${cleanChannelId}/typing`).doc(myUid);
      try {
        if (isTyping) {
          await docRef.set({ uid: myUid, name: myName, timestamp: Date.now() }, { merge: true });
        } else {
          await docRef.delete();
        }
      } catch (_) {}
    },

    subscribeTyping(channelId, callback) {
      if (!this.db || !channelId) return () => {};
      const cleanChannelId = channelId.trim();
      const myUid = this.currentUser?.uid || this.currentMember?.id || 'RD-USER';
      const unsub = this.db.collection(`organizations/${ORG_ID}/channels/${cleanChannelId}/typing`)
        .onSnapshot(snapshot => {
          const typers = [];
          const now = Date.now();
          snapshot.forEach(doc => {
            const d = doc.data();
            if (d && d.uid !== myUid && (now - (d.timestamp || 0) < 6000)) {
              typers.push(d.name || 'A teammate');
            }
          });
          callback(typers);
        }, () => {});
      return unsub;
    },

    getDeterministicDMChannelId(userA, userB) {
      const getEmail = (u) => {
        if (!u) return '';
        let str = '';
        if (typeof u === 'object') {
          str = (u.email || u.uid || u.id || '').toLowerCase().trim();
        } else {
          str = String(u).toLowerCase().trim();
        }
        if (str.includes('@')) return str;

        // Check if matching member in WorkspaceDB or state
        const allMembers = window.WorkspaceDB?.data?.members;
        if (allMembers) {
          for (const k of Object.keys(allMembers)) {
            const m = allMembers[k];
            if (m && (String(m.id).toLowerCase() === str || String(m.uid).toLowerCase() === str || String(m.employeeId).toLowerCase() === str)) {
              if (m.email) return m.email.toLowerCase().trim();
            }
          }
        }
        return str;
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
      const resolvedUser = this.currentUser || window.state?.currentUser || (window.WorkspaceDB?.data?.currentUser);
      const resolvedMember = this.currentMember || (window.state?.currentMember) || (window.WorkspaceDB?.data?.members && window.state?.currentMemberId && window.WorkspaceDB.data.members[window.state.currentMemberId]);

      const curUid = String(resolvedUser?.uid || resolvedMember?.uid || window.state?.currentMemberId || 'RD-FOUNDER-001');
      const curEmail = String(resolvedUser?.email || resolvedMember?.email || 'jagadish2k2006@gmail.com').toLowerCase().trim();
      const curEmpId = String(resolvedMember?.id || window.state?.currentMemberId || 'RD-FOUNDER-001');
      const curName = String(resolvedMember?.displayName || resolvedMember?.name || resolvedUser?.displayName || 'Member');

      const targetUid = typeof otherMember === 'object' ? (otherMember.uid || otherMember.id) : otherMember;
      const targetEmail = typeof otherMember === 'object' ? (otherMember.email || '').toLowerCase() : (String(otherMember).includes('@') ? String(otherMember).toLowerCase() : '');
      const targetEmpId = typeof otherMember === 'object' ? (otherMember.id || targetUid) : targetUid;
      const targetName = typeof otherMember === 'object' ? (otherMember.name || otherMember.displayName || otherName || targetEmpId) : (otherName || targetUid);

      const dmChannelId = this.getDeterministicDMChannelId(curEmail || curEmpId, targetEmail || targetUid);

      if (this.db) {
        try {
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
        } catch (dmErr) {
          console.warn('[FIREBASE] DM channel metadata sync notice:', dmErr.message);
        }
      }
      return dmChannelId;
    },

    // --- REALTIME CALL SIGNALING ENGINE ---
    async sendCallInvite(targetMember, roomUrl, callType = 'video') {
      const config = window.REDDOT_FIREBASE_CONFIG;
      const callerSessionId = window.CLIENT_SESSION_ID || ('sess_' + Date.now());
      const curUid = String(this.currentUser?.uid || window.state?.currentUser?.uid || this.currentMember?.uid || window.state?.currentMemberId || 'RD-FOUNDER-001');
      const curEmail = String(this.currentUser?.email || window.state?.currentUser?.email || this.currentMember?.email || 'jagadish2k2006@gmail.com').toLowerCase().trim();
      const curEmpId = String(this.currentMember?.id || window.state?.currentMemberId || (curUid ? `RD-${curUid.slice(0, 6).toUpperCase()}` : 'RD-001'));
      const curName = String(this.currentMember?.displayName || this.currentMember?.name || window.state?.currentMember?.name || this.currentUser?.displayName || (curEmail ? curEmail.split('@')[0] : 'Teammate'));
      const curPhoto = String(this.currentMember?.photoURL || this.currentMember?.photoUrl || window.state?.currentMember?.photoUrl || '');
      const curDept = String(this.currentMember?.dept || window.state?.currentMember?.dept || 'Hardware Architecture');

      let targetUid = '';
      let targetEmpId = '';
      let targetEmail = '';
      let targetName = 'Teammate';
      let targetPhoto = '';

      if (typeof targetMember === 'object' && targetMember !== null) {
        targetUid = String(targetMember.uid || '');
        targetEmpId = String(targetMember.id || '');
        targetEmail = String(targetMember.email || '').toLowerCase().trim();
        targetName = String(targetMember.name || targetMember.displayName || (targetEmail ? targetEmail.split('@')[0] : 'Teammate'));
        targetPhoto = String(targetMember.photoUrl || targetMember.photoURL || '');
        if (!targetUid && targetEmpId) targetUid = targetEmpId;
      } else if (typeof targetMember === 'string') {
        if (targetMember === 'ALL') {
          targetUid = 'ALL';
          targetEmpId = 'ALL';
          targetName = 'Entire Team';
        } else if (targetMember.includes('@')) {
          targetEmail = targetMember.toLowerCase().trim();
          targetName = targetEmail.split('@')[0].toUpperCase();
          targetUid = targetEmail;
          targetEmpId = targetEmail;
        } else {
          targetUid = targetMember;
          targetEmpId = targetMember;
          targetName = targetMember;
        }
      }

      const callId = 'call_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const callData = {
        callId: String(callId),
        callerSessionId: String(callerSessionId),
        callerUid: String(curUid),
        callerEmpId: String(curEmpId),
        callerEmail: String(curEmail),
        callerName: String(curName),
        callerPhoto: String(curPhoto),
        callerDept: String(curDept),
        targetUid: String(targetUid),
        targetEmpId: String(targetEmpId),
        targetEmail: String(targetEmail),
        targetName: String(targetName),
        targetPhoto: String(targetPhoto),
        roomUrl: String(roomUrl),
        callType: String(callType || 'video'),
        channelId: String(targetMember?.channelId || window.state?.activeChannelId || 'general'),
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
      if (!sent && config) {
        try {
          const restUrl = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/organizations/${ORG_ID}/calls/${callId}?key=${config.apiKey}`;
          const bodyPayload = JSON.stringify({
            fields: {
              callId: { stringValue: callData.callId },
              callerSessionId: { stringValue: callData.callerSessionId },
              callerUid: { stringValue: callData.callerUid },
              callerEmpId: { stringValue: callData.callerEmpId },
              callerEmail: { stringValue: callData.callerEmail },
              callerName: { stringValue: callData.callerName },
              callerPhoto: { stringValue: callData.callerPhoto },
              callerDept: { stringValue: callData.callerDept },
              targetUid: { stringValue: callData.targetUid },
              targetEmpId: { stringValue: callData.targetEmpId },
              targetEmail: { stringValue: callData.targetEmail },
              targetName: { stringValue: callData.targetName },
              targetPhoto: { stringValue: callData.targetPhoto },
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
      if (!callId) return;
      const config = window.REDDOT_FIREBASE_CONFIG;
      const updateData = { status: status, updatedAt: Date.now() };
      if (this.db) {
        try {
          await this.db.collection(`organizations/${ORG_ID}/calls`).doc(callId).set(updateData, { merge: true });
        } catch (e) {
          console.warn('[FIREBASE] Respond to call note:', e.message);
        }
      }
      if (config) {
        try {
          const restUrl = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/organizations/${ORG_ID}/calls/${callId}?updateMask.fieldPaths=status&updateMask.fieldPaths=updatedAt&key=${config.apiKey}`;
          await fetch(restUrl, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fields: {
                status: { stringValue: status },
                updatedAt: { integerValue: String(Date.now()) }
              }
            })
          });
        } catch (_) {}
      }
    },

    async cancelCall(callId) {
      if (!callId) return;
      const config = window.REDDOT_FIREBASE_CONFIG;
      const updateData = { status: 'CANCELLED', updatedAt: Date.now() };
      if (this.db) {
        try {
          await this.db.collection(`organizations/${ORG_ID}/calls`).doc(callId).set(updateData, { merge: true });
        } catch (e) {
          console.warn('[FIREBASE] Cancel call note:', e.message);
        }
      }
      if (config) {
        try {
          const restUrl = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/organizations/${ORG_ID}/calls/${callId}?updateMask.fieldPaths=status&updateMask.fieldPaths=updatedAt&key=${config.apiKey}`;
          await fetch(restUrl, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fields: {
                status: { stringValue: 'CANCELLED' },
                updatedAt: { integerValue: String(Date.now()) }
              }
            })
          });
        } catch (_) {}
      }
    },

    listenToCallStatus(callId, callback) {
      if (!this.db || !callId) return () => {};
      const unsub = this.db.collection(`organizations/${ORG_ID}/calls`).doc(callId)
        .onSnapshot((snap) => {
          if (snap.exists) {
            callback(snap.data());
          }
        }, (err) => {
          console.warn('[FIREBASE] Call status listener error:', err.message);
        });
      this.listeners.push(unsub);
      return unsub;
    },

    
    subscribeActiveCalls(callback) {
      if (!this.db || typeof callback !== 'function') return () => {};

      const processCalls = (snapshot) => {
        const now = Date.now();
        const active = [];
        snapshot.forEach(doc => {
          const d = doc.data();
          const time = Number(d.createdAt || d.updatedAt || 0);
          // Active within last 35 minutes
          if (time && (now - time < 35 * 60 * 1000)) {
            active.push({ id: doc.id, ...d });
          }
        });
        callback(active);
      };

      const unsub = this.db.collection(`organizations/${ORG_ID}/calls`)
        .where('status', 'in', ['RINGING', 'ACTIVE', 'ACCEPTED'])
        .onSnapshot(processCalls, (err) => {
          console.warn('[FIREBASE] Active calls listener warning:', err.message);
        });

      this.listeners.push(unsub);
      return unsub;
    },

    subscribeIncomingCalls(callback) {
      if (!this.db) return () => {};

      const checkCallMatches = (data) => {
        if (!data || data.status !== 'RINGING') return false;

        // 1. Never ring on the exact client session that placed the call
        const mySessionId = window.CLIENT_SESSION_ID;
        if (mySessionId && data.callerSessionId && data.callerSessionId === mySessionId) {
          return false;
        }

        // 2. Discard stale calls older than 45 seconds or missing timestamp
        const callTime = Number(data.createdAt || data.updatedAt || 0);
        if (!callTime || (Date.now() - callTime > 45000)) {
          return false;
        }

        const myUids = [
          this.currentUser?.uid,
          window.state?.currentUser?.uid,
          this.currentMember?.uid,
          window.state?.currentMember?.uid
        ].filter(Boolean).map(s => String(s).trim());

        const myEmpIds = [
          this.currentMember?.id,
          window.state?.currentMemberId,
          window.state?.currentMember?.id
        ].filter(Boolean).map(s => String(s).trim().toLowerCase());

        const myEmails = [
          this.currentUser?.email,
          window.state?.currentUser?.email,
          this.currentMember?.email,
          window.state?.currentMember?.email,
          window.state?.personalShift?.email
        ].filter(Boolean).map(s => String(s).trim().toLowerCase());

        const myNames = [
          this.currentMember?.displayName,
          this.currentMember?.name,
          window.state?.currentMember?.displayName,
          window.state?.currentMember?.name,
          this.currentUser?.displayName
        ].filter(Boolean).map(s => String(s).trim().toLowerCase());

        const tUid = String(data.targetUid || '').trim();
        const tEmpId = String(data.targetEmpId || '').trim().toLowerCase();
        const tEmail = String(data.targetEmail || '').trim().toLowerCase();
        const tName = String(data.targetName || '').trim().toLowerCase();

        // Broadcast to entire team
        if (tUid === 'ALL' || tEmpId === 'all' || tName === 'entire team') return true;

        // Target Email matches
        if (tEmail && myEmails.some(e => e === tEmail)) return true;

        // Target UID matches
        if (tUid && (myUids.includes(tUid) || myEmpIds.includes(tUid.toLowerCase()))) return true;

        // Target Emp ID matches
        if (tEmpId && (myEmpIds.includes(tEmpId) || myUids.map(u => u.toLowerCase()).includes(tEmpId))) return true;

        // Target Name matches
        if (tName && myNames.some(n => n === tName)) return true;

        return false;
      };

      const processSnapshot = (snapshot) => {
        const incoming = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          if (checkCallMatches(data)) {
            incoming.push({ id: doc.id, ...data });
          }
        });
        callback(incoming);
      };

      const unsub = this.db.collection(`organizations/${ORG_ID}/calls`)
        .where('status', '==', 'RINGING')
        .onSnapshot((snapshot) => {
          processSnapshot(snapshot);
        }, (err) => {
          console.warn('[FIREBASE] Call signaling listener warning:', err.message);
        });

      this.listeners.push(unsub);

      // Periodic safety poll every 3.5 seconds
      const pollInterval = setInterval(async () => {
        if (!this.db) return;
        try {
          const snap = await this.db.collection(`organizations/${ORG_ID}/calls`)
            .where('status', '==', 'RINGING')
            .get();
          processSnapshot(snap);
        } catch (_) {}
      }, 3500);

      const compositeUnsub = () => {
        clearInterval(pollInterval);
        unsub();
      };
      this.listeners.push(compositeUnsub);
      return compositeUnsub;
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

      const getActiveDuty = () => (window.state?.personalShift?.status || 'DUTY_OFF');
      const getActiveSec = () => (window.state?.personalShift?.seconds || 0);

      // 1. Cloud Firestore Heartbeat & Status (every 20 seconds)
      if (this.db) {
        this.updatePresenceFirestore(uid, getActiveDuty(), getActiveSec());
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = setInterval(() => {
          this.updatePresenceFirestore(uid, getActiveDuty(), getActiveSec());
          if (this.presenceRef) {
            this.presenceRef.update({
              state: 'online',
              isOnline: true,
              lastSeenAt: firebase.database.ServerValue.TIMESTAMP
            }).catch(() => {});
          }
        }, 20000);

        // Immediate heartbeat on window focus or tab activation (eliminates lag on window restore)
        if (typeof window !== 'undefined' && !this._presenceFocusBound) {
          this._presenceFocusBound = true;
          window.addEventListener('focus', () => {
            const activeUid = this.currentUser?.uid || uid;
            if (activeUid) {
              this.updatePresenceFirestore(activeUid, getActiveDuty(), getActiveSec());
            }
          });
          document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
              const activeUid = this.currentUser?.uid || uid;
              if (activeUid) {
                this.updatePresenceFirestore(activeUid, getActiveDuty(), getActiveSec());
              }
            }
          });
        }
      }

      // 2. Realtime Database (RTDB) Presence if configured
      if (this.rtdb) {
        const userPresenceRef = this.rtdb.ref(`organizations/${ORG_ID}/presence/${uid}`);
        const connectedRef = this.rtdb.ref('.info/connected');

        this.presenceRef = userPresenceRef;

        connectedRef.on('value', (snap) => {
          if (snap.val() === true) {
            const myEmail = (this.currentUser?.email || '').toLowerCase().trim();
            const onlineStatus = {
              uid: uid,
              email: myEmail,
              state: 'online',
              isOnline: true,
              displayName: displayName,
              lastSeenAt: firebase.database.ServerValue.TIMESTAMP,
              appVersion: appVersion
            };

            const offlineStatus = {
              uid: uid,
              email: myEmail,
              state: 'offline',
              isOnline: false,
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

    // --- SHIFT PUNCH AUDIT LOGS (FIRESTORE) ---
    async recordPunchLog(punch) {
      if (!this.db || !punch) return;
      const punchId = punch.id || ('punch_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4));
      const payload = {
        id: punchId,
        workerId: String(punch.workerId || this.currentMember?.id || 'RD-EMP-000'),
        uid: String(punch.uid || this.currentUser?.uid || ''),
        name: String(punch.name || this.currentMember?.displayName || this.currentMember?.name || 'Team Member'),
        email: String(punch.email || this.currentUser?.email || '').toLowerCase(),
        action: String(punch.action || 'CLOCK_IN'),
        time: String(punch.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
        date: String(punch.date || new Date().toLocaleDateString()),
        timestamp: Number(punch.timestamp || Date.now())
      };
      await this.db.collection(`organizations/${ORG_ID}/punchLogs`).doc(punchId).set(payload);
      return payload;
    },

    subscribePunchLogs(callback) {
      if (!this.db) return () => {};
      const unsub = this.db.collection(`organizations/${ORG_ID}/punchLogs`)
        .orderBy('timestamp', 'asc')
        .onSnapshot((snapshot) => {
          const punches = [];
          snapshot.forEach(doc => punches.push({ id: doc.id, ...doc.data() }));
          callback(punches);
        }, (err) => {
          console.warn('[FIREBASE] Punch logs subscription error:', err.message);
        });
      this.listeners.push(unsub);
      return unsub;
    },

    // --- LEAVE & TIME-OFF REQUESTS (FIRESTORE) ---
    async recordLeaveRequest(leaveReq) {
      if (!this.db || !leaveReq) return null;
      const leaveId = leaveReq.id || ('leave_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4));
      const payload = {
        id: leaveId,
        uid: String(leaveReq.uid || this.currentUser?.uid || ''),
        workerId: String(leaveReq.workerId || this.currentMember?.id || 'RD-EMP'),
        name: String(leaveReq.name || this.currentMember?.displayName || this.currentMember?.name || 'Team Member'),
        email: String(leaveReq.email || this.currentUser?.email || '').toLowerCase(),
        leaveType: String(leaveReq.leaveType || 'Personal Time-Off'),
        dates: String(leaveReq.dates || ''),
        reason: String(leaveReq.reason || ''),
        status: String(leaveReq.status || 'PENDING'),
        reviewedBy: leaveReq.reviewedBy || '',
        reviewedAt: leaveReq.reviewedAt || null,
        createdAt: Number(leaveReq.createdAt || Date.now())
      };
      await this.db.collection(`organizations/${ORG_ID}/leaveRequests`).doc(leaveId).set(payload);
      await this.logAudit('LEAVE_REQUESTED', `Leave request submitted by ${payload.name} [${payload.dates}]`, payload.uid);
      return payload;
    },

    async updateLeaveStatus(leaveId, status, reviewedByName = '') {
      if (!this.db || !leaveId) return;
      try {
        await this.db.collection(`organizations/${ORG_ID}/leaveRequests`).doc(String(leaveId)).set({
          status: status,
          reviewedBy: reviewedByName,
          reviewedAt: Date.now()
        }, { merge: true });
        await this.logAudit('LEAVE_STATUS_UPDATED', `Leave request ${leaveId} marked ${status} by ${reviewedByName}`);
      } catch (e) {
        console.warn('[FIREBASE] Error updating leave status in Firestore:', e);
      }
    },

    subscribeLeaveRequests(callback) {
      if (!this.db) return () => {};
      const unsub = this.db.collection(`organizations/${ORG_ID}/leaveRequests`)
        .orderBy('createdAt', 'desc')
        .onSnapshot((snapshot) => {
          const leaves = [];
          snapshot.forEach(doc => leaves.push({ id: doc.id, ...doc.data() }));
          callback(leaves);
        }, (err) => {
          console.warn('[FIREBASE] Leave requests subscription error:', err.message);
        });
      this.listeners.push(unsub);
      return unsub;
    },

    updateMyPresence(data = {}) {
      if (!this.db) return;
      const myUid = this.currentUser?.uid || this.currentMember?.uid || (window.state?.currentMemberId);
      if (!myUid || myUid === 'GUEST') return;
      const targetDocId = (this.currentUser?.uid) || (String(myUid).startsWith('RD-') ? (this.currentMember?.uid || myUid) : myUid);
      if (!targetDocId || targetDocId === 'GUEST') return;

      const payload = {
        isOnline: true,
        state: 'online',
        lastSeenAt: Date.now(),
        active: true,
        todayDate: new Date().toDateString()
      };

      if (data.status) {
        payload.status = data.status;
      }
      if (data.todaySeconds !== undefined && data.todaySeconds !== null) {
        payload.todaySeconds = Math.max(0, Math.floor(data.todaySeconds));
        payload.todayHours = Number((payload.todaySeconds / 3600).toFixed(2));
      } else if (window.state?.personalShift?.seconds !== undefined) {
        payload.todaySeconds = Math.max(0, Math.floor(window.state.personalShift.seconds));
        payload.todayHours = Number((payload.todaySeconds / 3600).toFixed(2));
      }

      if (data.activeTool) {
        payload.activeTool = {
          name: data.activeTool.name || '',
          exe: data.activeTool.exe || '',
          icon: data.activeTool.icon || 'default',
          category: data.activeTool.category || 'Development'
        };
      } else if (window.state?.currentActiveTool) {
        payload.activeTool = {
          name: window.state.currentActiveTool.name || '',
          exe: window.state.currentActiveTool.exe || '',
          icon: window.state.currentActiveTool.icon || 'default',
          category: window.state.currentActiveTool.category || 'Development'
        };
      }

      if (Array.isArray(data.backgroundTools)) {
        payload.backgroundTools = data.backgroundTools.slice(0, 15).map(t => ({
          name: t.name || t.appName || '',
          exe: t.exe || '',
          icon: t.icon || 'default',
          category: t.category || 'Tools'
        }));
      } else if (Array.isArray(window.state?.backgroundTools)) {
        payload.backgroundTools = window.state.backgroundTools.slice(0, 15).map(t => ({
          name: t.name || t.appName || '',
          exe: t.exe || '',
          icon: t.icon || 'default',
          category: t.category || 'Tools'
        }));
      }

      this.db.collection(`organizations/${ORG_ID}/members`).doc(targetDocId).set(payload, { merge: true }).catch(err => {
        console.warn('[FIREBASE] Failed updating presence tools:', err.message);
      });
    },

    updatePresenceFirestore(uid, status = null, todaySeconds = null) {
      if (!this.db || !uid || uid === 'GUEST') return;
      // Target genuine Firebase Auth UID to prevent creating duplicate RD-... phantom docs
      const targetDocId = (this.currentUser?.uid) || (String(uid).startsWith('RD-') ? (this.currentMember?.uid || uid) : uid);
      if (!targetDocId || targetDocId === 'GUEST') return;

      const currentDuty = (status !== null && status !== undefined) ? status : (window.state?.personalShift?.status || 'DUTY_OFF');
      const payload = {
        status: currentDuty,
        isOnline: true,
        state: 'online',
        lastSeenAt: Date.now(),
        active: true,
        todayDate: new Date().toDateString()
      
      };
      if (window.state && window.state.currentActiveTool) {
        payload.activeTool = {
          name: window.state.currentActiveTool.name,
          exe: window.state.currentActiveTool.exe,
          icon: window.state.currentActiveTool.icon || 'default'
        };
      }
      if (window.state && Array.isArray(window.state.backgroundTools)) {
        payload.backgroundTools = window.state.backgroundTools.slice(0, 10).map(t => ({
          name: t.name || t.appName || '',
          exe: t.exe || '',
          icon: t.icon || 'default'
        }));
      }
      if (todaySeconds !== null && todaySeconds !== undefined && typeof todaySeconds === 'number') {
        payload.todaySeconds = Math.max(0, Math.floor(todaySeconds));
        payload.todayHours = Number((payload.todaySeconds / 3600).toFixed(2));
      } else if (window.state?.personalShift?.seconds !== undefined) {
        payload.todaySeconds = Math.max(0, Math.floor(window.state.personalShift.seconds));
        payload.todayHours = Number((payload.todaySeconds / 3600).toFixed(2));
      }
      this.db.collection(`organizations/${ORG_ID}/members`).doc(targetDocId).set(payload, { merge: true }).catch(() => {});
    },

    setPresenceState(stateName) {
      if (this.presenceRef) {
        this.presenceRef.update({
          state: stateName,
          isOnline: stateName !== 'offline',
          lastSeenAt: firebase.database.ServerValue.TIMESTAMP
        });
      }
      const myUid = this.currentUser?.uid || this.currentMember?.uid || (window.state?.currentMemberId);
      if (myUid && this.db) {
        const targetDocId = (this.currentUser?.uid) || (String(myUid).startsWith('RD-') ? (this.currentMember?.uid || myUid) : myUid);
        if (targetDocId) {
          this.db.collection(`organizations/${ORG_ID}/members`).doc(targetDocId).set({
            state: stateName,
            isOnline: stateName !== 'offline',
            lastSeenAt: Date.now()
          }, { merge: true }).catch(() => {});
        }
      }
    },

    // Daily Work Tool Usage (stores which tools each employee used on any date and for how long)
    async recordToolDailyUsage(dateStr, memberId, toolUsage) {
      if (!this.db || !dateStr || !memberId) return;
      try {
        const docId = `${dateStr}_${memberId}`;
        await this.db.collection(`organizations/${ORG_ID}/toolDailyUsage`).doc(docId).set({
          date: dateStr,
          memberId: memberId,
          tools: toolUsage,
          updatedAt: Date.now()
        }, { merge: true });
      } catch (err) {
        console.warn('[FIREBASE] Tool daily usage write notice:', err.message);
      }
    },

    subscribeToolDailyUsage(dateStr, callback) {
      if (!this.db || !dateStr) return () => {};
      const unsub = this.db.collection(`organizations/${ORG_ID}/toolDailyUsage`)
        .where('date', '==', dateStr)
        .onSnapshot((snapshot) => {
          const usageMap = {};
          snapshot.forEach(doc => {
            const data = doc.data();
            if (data.memberId) {
              usageMap[data.memberId] = data.tools || {};
            }
          });
          callback(usageMap);
        }, (err) => {
          console.warn('[FIREBASE] Tool daily usage subscribe error:', err.message);
        });
      this.listeners.push(unsub);
      return unsub;
    },

    cleanupPresence() {
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }
      const myUid = this.currentUser?.uid || this.currentMember?.uid || (window.state?.currentMemberId);
      const targetDocId = (this.currentUser?.uid) || (myUid && String(myUid).startsWith('RD-') ? (this.currentMember?.uid || myUid) : myUid);
      if (targetDocId && this.db) {
        this.db.collection(`organizations/${ORG_ID}/members`).doc(targetDocId).set({
          status: 'DUTY_OFF',
          isOnline: false,
          state: 'offline',
          lastSeenAt: Date.now()
        }, { merge: true }).catch(() => {});
      }
      if (this.presenceRef) {
        this.presenceRef.set({
          state: 'offline',
          isOnline: false,
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
    },

    // =========================================================================
    // MICROSOFT TEAMS SUITE: MEETINGS & CALENDAR
    // =========================================================================
    async createMeeting(meeting) {
      if (!meeting) return null;
      const meetingId = meeting.id || `meet_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      const payload = {
        ...meeting,
        id: meetingId,
        createdAt: meeting.createdAt || Date.now(),
        updatedAt: Date.now(),
        createdBy: this.currentUser?.uid || this.currentMember?.id || 'SYSTEM'
      };

      if (this.db) {
        try {
          await this.db.collection(`organizations/${ORG_ID}/meetings`).doc(meetingId).set(payload, { merge: true });
        } catch (err) {
          console.warn('[FIREBASE] createMeeting error:', err);
        }
      }
      return payload;
    },

    async deleteMeeting(meetingId) {
      if (!meetingId || !this.db) return false;
      try {
        await this.db.collection(`organizations/${ORG_ID}/meetings`).doc(meetingId).delete();
        return true;
      } catch (err) {
        console.warn('[FIREBASE] deleteMeeting error:', err);
        return false;
      }
    },

    subscribeMeetings(callback) {
      if (!this.db) return () => {};
      return this.db.collection(`organizations/${ORG_ID}/meetings`)
        .orderBy('startTime', 'asc')
        .onSnapshot((snapshot) => {
          const meetings = [];
          snapshot.forEach(doc => meetings.push({ id: doc.id, ...doc.data() }));
          callback(meetings);
        }, (err) => {
          console.warn('[FIREBASE] subscribeMeetings note:', err.message);
        });
    },

    // =========================================================================
    // MICROSOFT TEAMS SUITE: THREADED REPLIES
    // =========================================================================
    async saveThreadReply(channelId, rootMsgId, replyData) {
      if (!channelId || !rootMsgId || !replyData) return null;
      const cleanChannelId = channelId.trim();
      const cleanRootId = rootMsgId.trim();
      const replyId = replyData.id || `reply_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

      const payload = {
        ...replyData,
        id: replyId,
        rootMsgId: cleanRootId,
        channelId: cleanChannelId,
        createdAt: replyData.createdAt || Date.now()
      };

      if (this.db) {
        try {
          const threadRef = this.db.collection(`organizations/${ORG_ID}/channels/${cleanChannelId}/messages/${cleanRootId}/replies`).doc(replyId);
          await threadRef.set(payload);

          // Update root message reply counter & last reply timestamp
          const rootRef = this.db.collection(`organizations/${ORG_ID}/channels/${cleanChannelId}/messages`).doc(cleanRootId);
          await rootRef.set({
            replyCount: firebase.firestore.FieldValue.increment(1),
            lastReplyAt: Date.now(),
            lastReplyUser: replyData.senderName || 'Teammate'
          }, { merge: true });
        } catch (err) {
          console.warn('[FIREBASE] saveThreadReply error:', err);
        }
      }
      return payload;
    },

    subscribeThreadReplies(channelId, rootMsgId, callback) {
      if (!channelId || !rootMsgId || !this.db) return () => {};
      const cleanChannelId = channelId.trim();
      const cleanRootId = rootMsgId.trim();
      return this.db.collection(`organizations/${ORG_ID}/channels/${cleanChannelId}/messages/${cleanRootId}/replies`)
        .orderBy('createdAt', 'asc')
        .onSnapshot((snapshot) => {
          const replies = [];
          snapshot.forEach(doc => replies.push({ id: doc.id, ...doc.data() }));
          callback(replies);
        }, (err) => {
          console.warn('[FIREBASE] subscribeThreadReplies note:', err.message);
        });
    },

    // =========================================================================
    // MICROSOFT TEAMS SUITE: ACTIVITY FEED & NOTIFICATIONS
    // =========================================================================
    async logActivity(activity) {
      if (!activity) return null;
      const actId = activity.id || `act_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      const payload = {
        ...activity,
        id: actId,
        timestamp: activity.timestamp || Date.now(),
        unread: activity.unread !== false
      };

      if (this.db) {
        try {
          await this.db.collection(`organizations/${ORG_ID}/activity`).doc(actId).set(payload);
        } catch (err) {
          console.warn('[FIREBASE] logActivity error:', err);
        }
      }
      return payload;
    },

    subscribeActivity(callback) {
      if (!this.db) return () => {};
      return this.db.collection(`organizations/${ORG_ID}/activity`)
        .orderBy('timestamp', 'desc')
        .limit(60)
        .onSnapshot((snapshot) => {
          const list = [];
          snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
          callback(list);
        }, (err) => {
          console.warn('[FIREBASE] subscribeActivity note:', err.message);
        });
    },

    // =========================================================================
    // MICROSOFT TEAMS SUITE: BOOKMARKED MESSAGES
    // =========================================================================
    async toggleBookmark(userId, messageId, bookmarkData = null) {
      if (!userId || !messageId || !this.db) return false;
      try {
        const ref = this.db.collection(`organizations/${ORG_ID}/members/${userId}/bookmarks`).doc(messageId);
        const snap = await ref.get();
        if (snap.exists) {
          await ref.delete();
          return false;
        } else {
          await ref.set({
            id: messageId,
            ...(bookmarkData || {}),
            savedAt: Date.now()
          });
          return true;
        }
      } catch (err) {
        console.warn('[FIREBASE] toggleBookmark error:', err);
        return false;
      }
    },

    subscribeBookmarks(userId, callback) {
      if (!userId || !this.db) return () => {};
      return this.db.collection(`organizations/${ORG_ID}/members/${userId}/bookmarks`)
        .orderBy('savedAt', 'desc')
        .onSnapshot((snapshot) => {
          const list = [];
          snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
          callback(list);
        }, (err) => {
          console.warn('[FIREBASE] subscribeBookmarks note:', err.message);
        });
    },

    // =========================================================================
    // OVER-THE-AIR (OTA) REAL-TIME RELEASE LISTENER & BROADCAST
    // =========================================================================
    listenToOtaRelease(callback) {
      if (!this.db) return () => {};
      try {
        const unsub = this.db.collection('organizations').doc(ORG_ID).collection('system').doc('otaRelease')
          .onSnapshot((docSnap) => {
            if (docSnap && docSnap.exists) {
              callback(docSnap.data());
            }
          }, (err) => {
            console.warn('[FIREBASE] OTA release real-time listener notice:', err.message);
          });
        this.listeners.push(unsub);
        return unsub;
      } catch (e) {
        console.warn('[FIREBASE] OTA release listener error:', e);
        return () => {};
      }
    },

    // =========================================================================
    // ORGANIZATION WORK TOOLS & VERIFIED ACTIVITY
    // =========================================================================
    subscribeWorkTools(callback) {
      if (!this.db) return () => {};
      try {
        const unsub = this.db.collection('organizations').doc(ORG_ID).collection('workTools')
          .onSnapshot((querySnap) => {
            if (!querySnap) return;
            const tools = [];
            querySnap.forEach(doc => {
              tools.push({ id: doc.id, ...doc.data() });
            });
            callback(tools);
          }, (err) => {
            console.warn('[FIREBASE] Work tools real-time listener notice:', err.message);
          });
        this.listeners.push(unsub);
        return unsub;
      } catch (e) {
        console.warn('[FIREBASE] Work tools listener error:', e);
        return () => {};
      }
    },

    async recordWorkTool(tool) {
      await this.ensureReady();
      if (!this.db) return null;
      try {
        const toolId = tool.id || ('tool_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6));
        const payload = {
          ...tool,
          id: toolId,
          updatedAt: Date.now()
        };
        await this.db.collection('organizations').doc(ORG_ID).collection('workTools').doc(toolId).set(payload, { merge: true });
        return payload;
      } catch (e) {
        console.error('[FIREBASE] Error saving work tool:', e);
        return null;
      }
    },

    async deleteWorkTool(toolId) {
      await this.ensureReady();
      if (!this.db || !toolId) return false;
      try {
        await this.db.collection('organizations').doc(ORG_ID).collection('workTools').doc(toolId).delete();
        return true;
      } catch (e) {
        console.error('[FIREBASE] Error deleting work tool:', e);
        return false;
      }
    },

    async recordToolDailyUsage(dateStr, memberId, toolKey, toolData) {
      await this.ensureReady();
      if (!this.db || !dateStr || !memberId || !toolKey) return false;
      try {
        const cleanDate = String(dateStr).trim();
        const cleanToolKey = String(toolKey).replace(/[\/\.\#\$\[\]]/g, '_');
        const docRef = this.db.collection('organizations').doc(ORG_ID).collection('toolDailyUsage').doc(cleanDate);
        
        const payload = {
          date: cleanDate,
          updatedAt: Date.now()
        };
        
        if (toolData.exactSeconds !== undefined) {
          payload[`members.${memberId}.${cleanToolKey}.seconds`] = Math.max(0, Math.floor(toolData.exactSeconds));
        } else if (toolData.addSeconds) {
          const inc = window.firebase?.firestore?.FieldValue?.increment 
            ? window.firebase.firestore.FieldValue.increment(toolData.addSeconds) 
            : toolData.addSeconds;
          payload[`members.${memberId}.${cleanToolKey}.seconds`] = inc;
        } else if (toolData.seconds !== undefined) {
          payload[`members.${memberId}.${cleanToolKey}.seconds`] = Math.max(0, Math.floor(toolData.seconds));
        }
        if (toolData.name) payload[`members.${memberId}.${cleanToolKey}.name`] = toolData.name;
        if (toolData.icon) payload[`members.${memberId}.${cleanToolKey}.icon`] = toolData.icon;
        if (toolData.exe) payload[`members.${memberId}.${cleanToolKey}.exe`] = toolData.exe;
        if (toolData.category) payload[`members.${memberId}.${cleanToolKey}.category`] = toolData.category;
        payload[`members.${memberId}.${cleanToolKey}.lastActive`] = Date.now();

        await docRef.set(payload, { merge: true });
        return true;
      } catch (e) {
        console.warn('[FIREBASE] Error recording tool daily usage:', e);
        return false;
      }
    },

    subscribeToolDailyUsage(dateStr, callback) {
      if (!this.db || !dateStr) return () => {};
      try {
        const cleanDate = String(dateStr).trim();
        const unsub = this.db.collection('organizations').doc(ORG_ID).collection('toolDailyUsage').doc(cleanDate)
          .onSnapshot((doc) => {
            if (!doc || !doc.exists) {
              callback({});
              return;
            }
            const data = doc.data() || {};
            callback(data.members || {});
          }, (err) => {
            console.warn('[FIREBASE] Tool daily usage subscription notice:', err.message);
          });
        this.listeners.push(unsub);
        return unsub;
      } catch (e) {
        console.warn('[FIREBASE] Error subscribing to tool daily usage:', e);
        return () => {};
      }
    },

    async broadcastOtaAnnouncement(version, changelog = []) {
      const summary = Array.isArray(changelog) && changelog.length > 0 
        ? changelog.slice(0, 3).map(c => `• ${c}`).join('\n') 
        : '• Performance enhancements and stability upgrades';
      const text = `📢 **REDDOT Workstation OS v${version} is now available!**\n\n${summary}\n\n👉 Click **⚡ UPDATE** in the top header or go to **Database > OTA Updater** to hotpatch now!`;
      return this.sendMessage('general', text);
    }
  };

  window.FirebaseService = FirebaseService;

  // Proactively ensure Firebase readiness as soon as script evaluates
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => FirebaseService.ensureReady().catch(() => {}));
    } else {
      FirebaseService.ensureReady().catch(() => {});
    }
  }

})(window);
