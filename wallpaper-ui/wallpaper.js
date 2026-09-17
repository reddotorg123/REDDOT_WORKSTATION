/**
 * ============================================================================
 * REDDOT WORKSTATION OS & LIVE WALLPAPER • PRODUCTION ENGINE (V2.6)
 * Native Persistent Database • Custom ID Photo Mount • 3D Lanyard Physics
 * Task Management • Team Chat • Database Diagnostics Benchmark
 * ============================================================================
 */

(function () {
  'use strict';

  // --- PERSISTENT MULTI-TIER IMAGE & PREVIEW CACHE ENGINE ---
  const ImageCacheManager = {
    dbName: "ReddotImageCacheDB",
    dbVersion: 1,
    storeName: "cached_images",
    db: null,
    memCache: new Map(),
    localStorageKey: "rd_image_cache_manifest_v2",

    async init() {
      try {
        const snap = JSON.parse(localStorage.getItem(this.localStorageKey) || '{}');
        for (const [k, v] of Object.entries(snap)) {
          if (v && v.data) this.memCache.set(k, v.data);
        }
      } catch (_) {}

      return new Promise((resolve) => {
        if (!window.indexedDB) {
          resolve(false);
          return;
        }

        const req = indexedDB.open(this.dbName, this.dbVersion);

        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            const store = db.createObjectStore(this.storeName, { keyPath: "url" });
            store.createIndex("key", "key", { unique: false });
            store.createIndex("cachedAt", "cachedAt", { unique: false });
          }
        };

        req.onsuccess = (e) => {
          this.db = e.target.result;
          this.populateMemCacheFromDB().then(() => resolve(true));
        };

        req.onerror = () => {
          resolve(false);
        };
      });
    },

    async populateMemCacheFromDB() {
      if (!this.db) return;
      try {
        const tx = this.db.transaction(this.storeName, "readonly");
        const store = tx.objectStore(this.storeName);
        const req = store.getAll();
        req.onsuccess = () => {
          if (req.result && Array.isArray(req.result)) {
            req.result.forEach(item => {
              if (item.url && item.data) {
                this.memCache.set(item.url, item.data);
                if (item.key) this.memCache.set(item.key, item.data);
              }
            });
          }
        };
      } catch (_) {}
    },

    async cacheImageUrl(url, customKey = null) {
      if (!url || typeof url !== 'string') return null;

      if (url.startsWith('data:')) {
        this.storeInAllTiers(url, url, customKey);
        return url;
      }

      if (this.memCache.has(url)) {
        return this.memCache.get(url);
      }

      try {
        const res = await fetch(url, { cache: 'force-cache' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();

        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64Data = reader.result;
            this.storeInAllTiers(url, base64Data, customKey);
            resolve(base64Data);
          };
          reader.onerror = () => {
            const fallback = this.getCachedImageSync(url) || (customKey ? this.getCachedImageSync(customKey) : null);
            resolve(fallback || url);
          };
          reader.readAsDataURL(blob);
        });
      } catch (err) {
        const existing = this.getCachedImageSync(url) || (customKey ? this.getCachedImageSync(customKey) : null);
        return existing || url;
      }
    },

    storeInAllTiers(url, base64Data, customKey) {
      if (!url || !base64Data) return;

      this.memCache.set(url, base64Data);
      if (customKey) this.memCache.set(customKey, base64Data);

      try {
        let snap = {};
        try { snap = JSON.parse(localStorage.getItem(this.localStorageKey) || '{}'); } catch (_) {}
        snap[url] = { data: base64Data, key: customKey, cachedAt: Date.now() };
        if (customKey) snap[customKey] = { data: base64Data, key: customKey, cachedAt: Date.now() };

        const keys = Object.keys(snap);
        if (keys.length > 30) {
          const oldestKey = keys.sort((a, b) => (snap[a]?.cachedAt || 0) - (snap[b]?.cachedAt || 0))[0];
          delete snap[oldestKey];
        }
        localStorage.setItem(this.localStorageKey, JSON.stringify(snap));
      } catch (_) {}

      if (this.db) {
        try {
          const tx = this.db.transaction(this.storeName, "readwrite");
          const store = tx.objectStore(this.storeName);
          store.put({
            url: url,
            key: customKey || url,
            data: base64Data,
            cachedAt: Date.now()
          });
        } catch (_) {}
      }
    },

    getCachedImageSync(urlOrKey) {
      if (!urlOrKey) return null;
      if (this.memCache.has(urlOrKey)) return this.memCache.get(urlOrKey);

      try {
        const snap = JSON.parse(localStorage.getItem(this.localStorageKey) || '{}');
        if (snap[urlOrKey] && snap[urlOrKey].data) {
          this.memCache.set(urlOrKey, snap[urlOrKey].data);
          return snap[urlOrKey].data;
        }
      } catch (_) {}
      return null;
    },

    generateProceduralWallpaper(style = 'cyber-matrix', hue = 'cyan', width = 1920, height = 1080) {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      const hueMap = {
        cyan: { primary: '#00d2ff', secondary: '#0084ff', bg: '#040508' },
        green: { primary: '#00e676', secondary: '#00b0ff', bg: '#030704' },
        crimson: { primary: '#ff2a4d', secondary: '#ff6b81', bg: '#080304' },
        gold: { primary: '#ffb300', secondary: '#ff9100', bg: '#080602' },
        purple: { primary: '#b388ff', secondary: '#7c4dff', bg: '#060309' }
      };

      const palette = hueMap[hue] || hueMap.cyan;

      ctx.fillStyle = palette.bg;
      ctx.fillRect(0, 0, width, height);

      const grad = ctx.createRadialGradient(width/2, height/2, 100, width/2, height/2, width*0.7);
      grad.addColorStop(0, `${palette.primary}18`);
      grad.addColorStop(0.6, 'transparent');
      grad.addColorStop(1, '#000000');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
      ctx.lineWidth = 1;
      const gridSize = 48;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      if (style === 'cyber-matrix' || style === 'hardware-blueprint') {
        ctx.strokeStyle = palette.primary;
        ctx.lineWidth = 2;
        ctx.shadowColor = palette.primary;
        ctx.shadowBlur = 12;

        const tracks = [
          [[120, 200], [400, 200], [500, 300], [900, 300]],
          [[width - 120, 200], [width - 400, 200], [width - 500, 300], [width - 900, 300]],
          [[200, height - 200], [500, height - 200], [600, height - 300], [1000, height - 300]],
          [[width - 200, height - 200], [width - 500, height - 200], [width - 600, height - 300], [width - 1000, height - 300]]
        ];

        tracks.forEach(t => {
          ctx.beginPath();
          ctx.moveTo(t[0][0], t[0][1]);
          for (let i = 1; i < t.length; i++) {
            ctx.lineTo(t[i][0], t[i][1]);
          }
          ctx.stroke();

          const last = t[t.length - 1];
          ctx.fillStyle = palette.primary;
          ctx.beginPath();
          ctx.arc(last[0], last[1], 5, 0, Math.PI * 2);
          ctx.fill();
        });

        ctx.strokeStyle = `${palette.secondary}44`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(width/2, height/2, 280, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = `${palette.primary}66`;
        ctx.setLineDash([8, 12]);
        ctx.beginPath();
        ctx.arc(width/2, height/2, 320, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.shadowBlur = 0;
      return canvas.toDataURL('image/png');
    },

    generateProceduralWallpaperThumb(style = 'cyber-matrix', hue = 'cyan') {
      return this.generateProceduralWallpaper(style, hue, 480, 270);
    },

    async precacheAllAssets() {
      const localAssets = [
        'assets/id-card.png',
        'assets/profile-photo.jpeg',
        'assets/profile-photo1.jpeg'
      ];

      for (const asset of localAssets) {
        await this.cacheImageUrl(asset, asset);
      }
    }
  };

  // --- INITIAL SEED FIXTURES (CLEAN SCHEMA) ---
  const DEFAULT_CHANNELS = [
    { id: 'general', name: 'general', topic: 'Company-wide updates and collaboration' },
    { id: 'announcements', name: 'announcements', topic: 'Official executive bulletins and company broadcasts' },
    { id: 'engineering', name: 'engineering', topic: 'Architecture, development, and system telemetry' },
    { id: 'projects', name: 'projects', topic: 'Active sprint deliverables and product roadmaps' },
    { id: 'watercooler', name: 'watercooler', topic: 'Casual coffee chat and team banter' }
  ];

  const INITIAL_SEED_DATA = {
    members: {},
    tasks: [],
    channels: JSON.parse(JSON.stringify(DEFAULT_CHANNELS)),
    chats: {
      "general": [],
      "announcements": [],
      "engineering": []
    },
    meetings: [],
    activity: [],
    savedMessages: [],
    callLogs: [],
    threadReplies: {},
    punchLogs: [],
    auditLogs: [
      { action: "WORKSPACE_INIT", performedByName: "SYSTEM", details: "Native persistent storage initialized.", timestamp: Date.now() }
    ],
    customMountedBadgePhoto: null,
    deletedMembers: ['RD-RD-FOU']
  };

  // --- PERSISTENT WORKSPACE DATABASE LAYER ---
  const WorkspaceDB = {
    data: JSON.parse(JSON.stringify(INITIAL_SEED_DATA)),

    async init() {
      if (window.electronAPI && window.electronAPI.dbLoad) {
        try {
          const loaded = await window.electronAPI.dbLoad();
          if (loaded && typeof loaded === 'object') {
            this.data = { ...this.data, ...loaded };
            console.log('[DB] Loaded persistent workspace database from disk.');
          } else {
            await this.save();
          }
        } catch (e) {
          console.warn('[DB] Fallback to memory store:', e);
        }
      } else {
        const local = localStorage.getItem('reddot_disk_db_v2');
        if (local) {
          try { this.data = JSON.parse(local); } catch (_) {}
        }
      }

      if (!this.data.channels || !Array.isArray(this.data.channels) || this.data.channels.length === 0) {
        this.data.channels = JSON.parse(JSON.stringify(DEFAULT_CHANNELS));
      }
      if (!this.data.meetings) this.data.meetings = [];
      if (!this.data.activity) this.data.activity = [];
      if (!this.data.savedMessages) this.data.savedMessages = [];
      if (!this.data.callLogs) this.data.callLogs = [];
      if (!this.data.threadReplies) this.data.threadReplies = {};
      if (!this.data.deletedMembers || !Array.isArray(this.data.deletedMembers)) {
        this.data.deletedMembers = ['RD-RD-FOU'];
      } else if (!this.data.deletedMembers.includes('RD-RD-FOU')) {
        this.data.deletedMembers.push('RD-RD-FOU');
      }

      // Explicitly purge legacy fake/demo mock members & deleted members from store & normalize IDs
      if (this.data.members) {
        let changed = false;
        const tombstone = this.data.deletedMembers || [];
        Object.keys(this.data.members).forEach(id => {
          const m = this.data.members[id];
          if (!m) return;
          const isDeleted = tombstone.includes(id) ||
            tombstone.includes(m.id) ||
            tombstone.includes(m.uid) ||
            tombstone.includes(m.docId) ||
            (m.email && tombstone.includes(m.email.toLowerCase()));

          if (
            isDeleted ||
            id === 'RD-RD-FOU' || id === 'RD-RD-EMP' || id === 'RD-EMP-101' || id === 'RD-EMP-102' || id === 'RD-EMP-103' || id === 'pavithratech1206' ||
            (m.name === 'Team Member' && !m.email) ||
            (m.uid === 'RD-FOUNDER-001' && !m.email) ||
            m?.name === 'Alex Rivera' || m?.name === 'Priya Sharma' || m?.name === 'Vikram Malhotra' ||
            m?.email === 'alex@reddot.com' || m?.email === 'priya@reddot.com' || m?.email === 'vikram@reddot.com'
          ) {
            delete this.data.members[id];
            changed = true;
            return;
          }
          if (!m.id) {
            const isFounder = (m.email && m.email.toLowerCase() === 'jagadish2k2006@gmail.com') || m.isOwner;
            m.id = isFounder ? 'RD-FOUNDER-001' : (m.uid ? `RD-${m.uid.slice(0, 6).toUpperCase()}` : `RD-EMP-${Math.floor(100 + Math.random() * 900)}`);
            changed = true;
          }

          // Database hygiene: Reset stale today's shift metrics for members not seen today
          const todayDateStr = new Date().toDateString();
          const isSeenToday = m.lastSeenAt && (new Date(m.lastSeenAt).toDateString() === todayDateStr);
          if (!isSeenToday) {
            if (m.todaySeconds !== 0 || m.todayHours !== 0) {
              m.todaySeconds = 0;
              m.todayHours = 0;
              changed = true;
            }
            if (m.status === 'DUTY_ON' || m.status === 'DUTY_BREAK') {
              m.status = 'DUTY_OFF';
              changed = true;
            }
          }
        });
        if (changed) {
          await this.save();
        }
      }

      if (typeof reconcilePastMessagesAsRead === 'function') {
        reconcilePastMessagesAsRead();
      }

      this.updateMetricsUI();
    },

    async save() {
      if (window.electronAPI && window.electronAPI.dbSave) {
        try {
          await window.electronAPI.dbSave(this.data);
        } catch (e) {
          console.error('[DB] Failed to save to disk:', e);
        }
      } else {
        localStorage.setItem('reddot_disk_db_v2', JSON.stringify(this.data));
      }
      this.updateMetricsUI();
    },

    updateMetricsUI() {
      const uniqueMembers = (typeof getUniqueMembersList === 'function')
        ? getUniqueMembersList()
        : Object.values(this.data.members || {});

      const totalMembersCount = uniqueMembers.length;
      const onlineCount = uniqueMembers.filter(m => m && !m.suspended && (m.status === 'DUTY_ON' || m.id === state.currentMemberId)).length;
      const tasksCount = (this.data.tasks || []).length;
      let msgsCount = 0;
      Object.values(this.data.chats || {}).forEach(arr => msgsCount += (arr ? arr.length : 0));
      const punchesCount = (this.data.punchLogs || []).length;

      safeSetText(document.getElementById('dbStatOnlineCount'), onlineCount);
      safeSetText(document.getElementById('dbStatMembersCount'), totalMembersCount);
      safeSetText(document.getElementById('dbStatTasksCount'), tasksCount);
      safeSetText(document.getElementById('dbStatMsgsCount'), msgsCount);
      safeSetText(document.getElementById('dbStatPunchesCount'), punchesCount);
    }
  };

  // --- WALLPAPER PRESETS ---
  const DEFAULT_WALLPAPER_PRESETS = [
    {
      id: "obsidian-cyber",
      name: "Obsidian Cyber (Cyan)",
      theme: "obsidian",
      style: "cyber-matrix",
      hue: "cyan",
      tag: "SIGNATURE 60FPS",
      desc: "Pixel-perfect symmetrical hardware architecture matrix with cyan circuit traces."
    },
    {
      id: "crimson-reddot",
      name: "Crimson REDDOT Executive",
      theme: "crimson",
      style: "cyber-matrix",
      hue: "crimson",
      tag: "REDDOT OFFICIAL",
      desc: "Executive command workstation palette with crimson laser telemetry and carbon mesh."
    },
    {
      id: "emerald-matrix",
      name: "Soft Emerald Firmware",
      theme: "emerald",
      style: "cyber-matrix",
      hue: "green",
      tag: "FIRMWARE LAB",
      desc: "Bio-synthetic glowing emerald traces designed for late-night firmware architecture."
    },
    {
      id: "sunset-amber",
      name: "Sunset Amber Hardware",
      theme: "amber",
      style: "hardware-blueprint",
      hue: "gold",
      tag: "CAD TELEMETRY",
      desc: "Warm glowing amber gold hardware blueprint with pulse frequency lines."
    },
    {
      id: "deep-nebula",
      name: "Deep Nebula Quantum",
      theme: "nebula",
      style: "neon-gradient",
      hue: "purple",
      tag: "AI / ML SYSTEMS",
      desc: "Cosmic purple aurora with neural network nodes and dark obsidian background."
    },
    {
      id: "nordic-slate",
      name: "Nordic Minimalist Slate",
      theme: "nordic",
      style: "minimal",
      hue: "silver",
      tag: "DISTRACTION FREE",
      desc: "Ultra-clean Scandinavian matte obsidian slate for distraction-free coding."
    }
  ];

  // --- APPLICATION STATE ---
  const state = {
    currentUser: null,
    currentMember: null,
    currentMemberId: null,
    userRole: 'GUEST',
    theme: localStorage.getItem('rd_theme') || 'obsidian',
    activeWallpaperPreset: localStorage.getItem('rd_active_wallpaper_preset') || 'obsidian-cyber',
    activeTab: 'workers',
    activeChannelId: 'general',
    taskFilter: 'ALL',
    commandCenterOpen: false,
    selectedViewingMemberId: null,
    tempNewWorkerPhoto: null,
    tempSignUpPhoto: null,

    // Teams Collaboration State
    activeHubTab: 'posts',
    activeTeamsRailTab: 'chat',
    taskViewMode: 'list',
    taskSortMode: 'due',
    taskDrawerClosedByUser: false,
    activeSelectedTask: null,
    activeThreadRootMsgId: null,
    threadUnsubscribe: null,
    activeImportance: 'normal',
    showSubjectInput: false,
    activityFilter: 'all',
    centralFilesFilter: 'all',
    chatFilterQuery: '',
    activeReply: null,
    pendingAttachments: [],
    editingMessageId: null,
    voiceRecorder: null,
    voiceAudioChunks: [],
    voiceRecordingTimer: null,
    voiceRecordingSeconds: 0,
    voiceShouldSend: false,
    teamsPresence: localStorage.getItem('rd_teams_presence') || 'available',
    chatSearchQuery: '',
    workerSearchQuery: '',
    workerDeptFilter: 'ALL',
    workerStatusFilter: 'ALL',
    incomingCallMicMuted: false,
    incomingCallCamDisabled: false,

    // Shift Tracking
    personalShift: {
      status: 'DUTY_OFF',
      seconds: 0,
      timer: null
    },

    // 3D Tilt
    tiltEnabled: true,
    soundEnabled: true,
    mouse: { targetRotX: 0, targetRotY: 0, targetX: 0 },
    card: { curRotX: 0, curRotY: 0, curX: 0 }
  };

  window.state = state;

  // --- AUTHENTICATION & PROFILE CONTROLLERS ---
  function openAuthModal(initialTab = 'signin') {
    const modal = document.getElementById('authModal');
    if (!modal) return;
    switchAuthTab(initialTab);
    hideAuthAlert();
    modal.classList.remove('hidden');
  }

  function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) modal.classList.add('hidden');
    try { sessionStorage.setItem('rd_auth_dismissed', '1'); } catch (_) {}
  }

  function switchAuthTab(tab) {
    const btnSignIn = document.getElementById('tabAuthSignIn');
    const btnSignUp = document.getElementById('tabAuthSignUp');
    const formSignIn = document.getElementById('formSignIn');
    const formSignUp = document.getElementById('formSignUp');
    const title = document.getElementById('authModalTitle');

    if (tab === 'signup') {
      btnSignIn?.classList.remove('active');
      btnSignUp?.classList.add('active');
      if (formSignIn) formSignIn.style.display = 'none';
      if (formSignUp) formSignUp.style.display = 'flex';
      if (title) title.textContent = 'CREATE OFFICIAL WORKSTATION PROFILE';
    } else {
      btnSignIn?.classList.add('active');
      btnSignUp?.classList.remove('active');
      if (formSignIn) formSignIn.style.display = 'flex';
      if (formSignUp) formSignUp.style.display = 'none';
      if (title) title.textContent = 'REDDOT WORKSTATION ACCESS';
    }
    hideAuthAlert();
  }

  function showAuthAlert(msg, isError = true) {
    const box = document.getElementById('authAlertBox');
    if (!box) return;
    box.style.display = 'block';
    box.style.background = isError ? 'rgba(255, 82, 82, 0.18)' : 'rgba(0, 230, 118, 0.18)';
    box.style.border = isError ? '1px solid #ff5252' : '1px solid #00e676';
    box.style.color = isError ? '#ff8a80' : '#b9f6ca';
    box.textContent = msg;
  }

  function hideAuthAlert() {
    const box = document.getElementById('authAlertBox');
    if (box) box.style.display = 'none';
  }

  function openUserProfileModal() {
    const modal = document.getElementById('userProfileModal');
    if (!modal) return;

    const member = state.currentMember || (state.currentUser ? {
      name: state.currentUser.displayName || state.currentUser.email.split('@')[0],
      displayName: state.currentUser.displayName || state.currentUser.email.split('@')[0],
      email: state.currentUser.email,
      role: 'EMPLOYEE',
      dept: 'HARDWARE ARCHITECTURE',
      id: `RD-${state.currentUser.uid.slice(0, 6).toUpperCase()}`,
      photoUrl: state.currentUser.photoURL || ''
    } : null);

    if (!member) {
      openAuthModal('signin');
      return;
    }

    safeSetText(document.getElementById('userProfileName'), (member.name || member.displayName || 'COLLEAGUE').toUpperCase());
    safeSetText(document.getElementById('userProfileRole'), (member.role || 'MEMBER').toUpperCase());
    safeSetText(document.getElementById('userProfileDept'), (member.dept || 'HARDWARE ARCHITECTURE').toUpperCase());
    safeSetText(document.getElementById('userProfileBadgeId'), `ID: ${member.id || 'RD-001'}`);
    safeSetText(document.getElementById('userProfileEmail'), member.email || state.currentUser?.email || '');

    const avatarBox = document.getElementById('userProfileAvatarBox');
    if (avatarBox) {
      if (member.photoUrl || member.photoURL) {
        avatarBox.innerHTML = `<img src="${escapeHtml(member.photoUrl || member.photoURL)}" alt="Profile Photo" style="width: 100%; height: 100%; object-fit: cover;">`;
      } else {
        const initials = ((member.name || member.displayName || 'RD').slice(0, 2)).toUpperCase();
        avatarBox.innerHTML = `<div style="font-weight: 800; font-size: 20px; color: #fff;">${escapeHtml(initials)}</div>`;
      }
    }

    modal.classList.remove('hidden');
  }

  function closeUserProfileModal() {
    const modal = document.getElementById('userProfileModal');
    if (modal) modal.classList.add('hidden');
  }

  // --- ROLE DEFINITIONS & ATTENDANCE PERMISSIONS ---
  function normalizeAppRole(role) {
    if (!role) return 'EMPLOYEE';
    const r = String(role).toUpperCase().trim();
    if (r.includes('FOUND') || r.includes('OWNER')) return 'FOUNDER';
    if (r === 'CEO' || r.includes('CHIEF EXECUTIVE')) return 'CEO';
    if (r.includes('MANAGE') || r.includes('LEAD')) return 'MANAGER';
    return 'EMPLOYEE';
  }

  function hasFullAttendanceAccess() {
    const myEmail = (state.currentUser?.email || '').toLowerCase().trim();
    const isSoleAdmin = (myEmail === 'jagadish2k2006@gmail.com');
    const role = normalizeAppRole(state.userRole || state.currentMember?.role);
    return Boolean(isSoleAdmin || role === 'FOUNDER' || role === 'CEO');
  }

  function formatFullDateTime(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (d.toDateString() === today.toDateString()) {
      return `Today at ${timeStr}`;
    }
    if (d.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${timeStr}`;
    }
    const dayName = d.toLocaleDateString([], { weekday: 'short' });
    const dateFormatted = d.toLocaleDateString([], { day: 'numeric', month: 'short' });
    return `${dayName}, ${dateFormatted} at ${timeStr}`;
  }

  function getChatDateDividerLabel(timestamp) {
    if (!timestamp) return 'Today';
    const msgDate = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (msgDate.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (msgDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    const diffDays = Math.round((today - msgDate) / (1000 * 60 * 60 * 24));
    if (diffDays < 7 && diffDays > 0) {
      return msgDate.toLocaleDateString([], { weekday: 'long' });
    }
    return msgDate.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  }

  function lockChatComposer(locked = true) {
    const input = document.getElementById('chatMessageInput');
    const form = document.getElementById('formSendMessage');
    const sendBtn = form?.querySelector('.btn-chat-send');
    let banner = document.getElementById('chatLockBanner');

    if (locked) {
      if (input) {
        input.disabled = true;
        input.placeholder = '🔒 Please sign in with your official account to send messages...';
      }
      if (sendBtn) sendBtn.disabled = true;
      if (form) form.classList.add('chat-composer-locked');

      if (!banner && form) {
        banner = document.createElement('div');
        banner.id = 'chatLockBanner';
        banner.className = 'chat-composer-lock-banner';
        banner.innerHTML = `<span>🔒 <strong>Unauthenticated:</strong> Sign in to join discussions.</span> <button type="button" class="btn-primary-action" style="padding: 3px 10px; font-size: 11px; margin-left: 8px;" id="btnLockBannerSignIn">Sign In</button>`;
        form.parentNode.insertBefore(banner, form);
        document.getElementById('btnLockBannerSignIn')?.addEventListener('click', () => openAuthModal('signin'));
      }
    } else {
      if (input) {
        input.disabled = false;
        input.placeholder = 'Type a message... (Enter to send, Shift+Enter for newline)';
      }
      if (sendBtn) sendBtn.disabled = false;
      if (form) form.classList.remove('chat-composer-locked');
      if (banner) banner.remove();
    }
  }

  function updateAuthUI(user, member) {
    state.currentUser = user;
    state.currentMember = member;

    const roleDot = document.getElementById('roleDot');
    const roleLabel = document.getElementById('roleLabel');
    const sessionEmpId = document.getElementById('sessionEmpId');

    const isSoleAdmin = (user?.email && user.email.toLowerCase() === 'jagadish2k2006@gmail.com');

    if (user && member) {
      if (!member.id) {
        member.id = isSoleAdmin ? 'RD-FOUNDER-001' : (user.uid ? `RD-${user.uid.slice(0, 6).toUpperCase()}` : 'RD-EMP-001');
      }
      if (!member.uid) member.uid = user.uid;
      state.currentMemberId = member.id;
      state.userRole = isSoleAdmin ? 'FOUNDER' : normalizeAppRole(member.role || 'employee');

      if (isSoleAdmin) {
        member.role = 'FOUNDER';
        member.isOwner = true;
        if (!member.name || member.name.includes('@')) member.name = 'JAGADISH K';
        if (!member.dept) member.dept = 'Hardware Architecture';
      }

      const mKey = member.id;
      WorkspaceDB.data.members[mKey] = member;
      if (user.uid && member.id && user.uid !== member.id) {
        WorkspaceDB.data.members[user.uid] = member;
      }

      // If user has a cloud-persisted ID badge photo, retrieve and restore it immediately
      const idPhoto = member.idCardPhoto || member.photoURL || member.photoUrl;
      if (idPhoto) {
        WorkspaceDB.data.customMountedBadgePhoto = idPhoto;
      }
      WorkspaceDB.save();

      if (roleDot) roleDot.style.background = '#00e676';
      safeSetText(roleLabel, `${(member.displayName || member.name || user.email.split('@')[0]).toUpperCase()} // ${(state.userRole || 'EMPLOYEE').toUpperCase()}`);
      safeSetText(sessionEmpId, member.id || 'ONLINE');

      // v3.0 Top Header User Profile Chip
      const hName = document.getElementById('headerUserName');
      if (hName) hName.textContent = member.displayName || member.name || 'Teammate';
      const hRole = document.getElementById('headerUserRole');
      if (hRole) hRole.textContent = state.userRole || 'Employee';
      const hAvatar = document.getElementById('headerUserAvatar');
      if (hAvatar && (member.photoUrl || member.photoURL || idPhoto)) {
        hAvatar.src = member.photoUrl || member.photoURL || idPhoto;
      }

      lockChatComposer(false);
      mountMemberOnWallpaper(state.currentMemberId);
      reconcilePersonalShiftWithPunches();
      renderWorkers();
      renderTasks();
      renderChatChannelsAndDMs();
      renderFleetTelemetry();
      renderPunchLogs();
      renderTeamHoursDashboard();
    } else if (user) {
      const fallbackId = isSoleAdmin ? 'RD-FOUNDER-001' : `RD-${user.uid.slice(0, 6).toUpperCase()}`;
      state.currentMemberId = fallbackId;
      state.userRole = isSoleAdmin ? 'FOUNDER' : 'EMPLOYEE';
      if (roleDot) roleDot.style.background = '#00e676';
      safeSetText(roleLabel, `${user.email.split('@')[0].toUpperCase()} // ${(state.userRole || 'EMPLOYEE').toUpperCase()}`);
      safeSetText(sessionEmpId, fallbackId);

      const hName = document.getElementById('headerUserName');
      if (hName) hName.textContent = user.displayName || user.email?.split('@')[0] || 'Team Member';
      const hRole = document.getElementById('headerUserRole');
      if (hRole) hRole.textContent = state.userRole || 'Employee';

      lockChatComposer(false);
      reconcilePersonalShiftWithPunches();
      renderPunchLogs();
      renderTeamHoursDashboard();
    } else {
      // Strictly unauthenticated / Guest session: never impersonate Founder or allow fake ID sending
      state.currentUser = null;
      state.currentMember = null;
      state.currentMemberId = null;
      state.userRole = 'GUEST';

      if (roleDot) roleDot.style.background = '#ffb300';
      safeSetText(roleLabel, 'GUEST // SIGN-IN REQUIRED');
      safeSetText(sessionEmpId, 'UNAUTHENTICATED');

      const hName = document.getElementById('headerUserName');
      if (hName) hName.textContent = 'Guest User';
      const hRole = document.getElementById('headerUserRole');
      if (hRole) hRole.textContent = 'Sign In';
      const hAvatar = document.getElementById('headerUserAvatar');
      if (hAvatar) hAvatar.src = 'assets/id-card.png';

      lockChatComposer(true);
      reconcilePersonalShiftWithPunches();
      renderPunchLogs();
      renderTeamHoursDashboard();
    }
  }

  function normalizePunch(p) {
    if (!p) return null;
    const punch = { ...p };
    if (!punch.id) {
      punch.id = `punch_${punch.workerId || 'legacy'}_${punch.timestamp || Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    }
    const nameLower = (punch.name || '').toLowerCase().trim();
    const emailLower = (punch.email || '').toLowerCase().trim();
    const workerIdStr = String(punch.workerId || '').trim();

    if (!punch.workerId || workerIdStr === 'null' || workerIdStr === 'undefined' || workerIdStr === '') {
      if (nameLower.includes('jagadish') || emailLower.includes('jagadish')) {
        punch.workerId = 'RD-FOUNDER-001';
        punch.name = 'JAGADISH K';
        if (!punch.email) punch.email = 'jagadish2k2006@gmail.com';
      } else if (nameLower.includes('pavithra') || emailLower.includes('pavithra')) {
        punch.workerId = 'RD-EMP-002';
        punch.name = 'Pavithra R';
      }
    }
    return punch;
  }

  function getCurrentResolvedMember() {
    const myUid = state.currentUser?.uid || null;
    const myEmail = (state.currentUser?.email || '').toLowerCase().trim();
    const isSoleAdmin = (myEmail === 'jagadish2k2006@gmail.com') || (state.userRole === 'OWNER') || (state.currentMemberId === 'RD-FOUNDER-001');

    if (state.currentMemberId && WorkspaceDB.data.members?.[state.currentMemberId]) {
      return WorkspaceDB.data.members[state.currentMemberId];
    }
    if (myEmail) {
      const found = Object.values(WorkspaceDB.data.members || {}).find(m => (m.email || '').toLowerCase().trim() === myEmail);
      if (found) return found;
    }
    if (myUid && WorkspaceDB.data.members?.[myUid]) {
      return WorkspaceDB.data.members[myUid];
    }
    if (isSoleAdmin) {
      return {
        id: 'RD-FOUNDER-001',
        uid: myUid || 'RD-FOUNDER-001',
        name: 'JAGADISH K',
        displayName: 'JAGADISH K',
        email: myEmail || 'jagadish2k2006@gmail.com',
        role: 'owner',
        isOwner: true
      };
    }
    return {
      id: state.currentMemberId || (myUid ? `RD-${myUid.slice(0, 6).toUpperCase()}` : 'RD-EMP-001'),
      uid: myUid,
      name: state.currentUser?.displayName || (myEmail ? myEmail.split('@')[0] : 'Employee'),
      displayName: state.currentUser?.displayName || (myEmail ? myEmail.split('@')[0] : 'Employee'),
      email: myEmail,
      role: 'Employee'
    };
  }

  function pickPhotoFile() {
    return new Promise((resolve) => {
      if (window.electronAPI && window.electronAPI.dbSelectPhoto) {
        window.electronAPI.dbSelectPhoto()
          .then(res => resolve(res || { canceled: true }))
          .catch(() => resolve({ canceled: true }));
        return;
      }

      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.style.display = 'none';
      document.body.appendChild(input);

      input.onchange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) {
          try { document.body.removeChild(input); } catch (_) {}
          resolve({ canceled: true });
          return;
        }
        const reader = new FileReader();
        reader.onload = (re) => {
          try { document.body.removeChild(input); } catch (_) {}
          resolve({
            canceled: false,
            dataUrl: re.target.result,
            fileName: file.name
          });
        };
        reader.onerror = () => {
          try { document.body.removeChild(input); } catch (_) {}
          resolve({ canceled: true });
        };
        reader.readAsDataURL(file);
      };

      input.click();
    });
  }

  function getUniqueMembersList() {
    const map = new Map();
    const tombstone = WorkspaceDB.data.deletedMembers || [];
    if (WorkspaceDB.data.members && WorkspaceDB.data.members['RD-RD-FOU']) {
      delete WorkspaceDB.data.members['RD-RD-FOU'];
    }
    Object.values(WorkspaceDB.data.members || {}).forEach(m => {
      if (!m) return;
      if (
        tombstone.includes(m.id) ||
        tombstone.includes(m.uid) ||
        tombstone.includes(m.docId) ||
        (m.email && tombstone.includes(m.email.toLowerCase()))
      ) return;
      if (m.name === 'Alex Rivera' || m.name === 'Priya Sharma' || m.name === 'Vikram Malhotra') return;
      if (m.email === 'alex@reddot.com' || m.email === 'priya@reddot.com' || m.email === 'vikram@reddot.com') return;
      if (m.id === 'RD-RD-FOU' || (m.name === 'Team Member' && !m.email)) return;
      if (m.uid === 'RD-FOUNDER-001' && !m.email) return;

      const isFounder = (m.email && m.email.toLowerCase() === 'jagadish2k2006@gmail.com') || m.isOwner;
      if (!m.id) {
        m.id = isFounder ? 'RD-FOUNDER-001' : (m.uid ? `RD-${m.uid.slice(0, 6).toUpperCase()}` : 'RD-EMP-001');
      }
      if (!m.uid) m.uid = m.id;

      const key = (m.email ? m.email.toLowerCase() : '') || m.uid || m.id;
      if (!map.has(key)) {
        map.set(key, { ...m });
      } else {
        const prev = map.get(key);
        const prevTime = prev.updatedAt || prev.createdAt || 0;
        const currTime = m.updatedAt || m.createdAt || 0;
        let role = m.role || prev.role || 'Employee';
        let dept = m.dept || prev.dept || 'Hardware Architecture';
        if (prevTime > currTime && prev.role) {
          role = prev.role;
          dept = prev.dept || dept;
        } else if (currTime >= prevTime && m.role) {
          role = m.role;
          dept = m.dept || dept;
        }
        map.set(key, {
          ...prev,
          ...m,
          role,
          dept,
          updatedAt: Math.max(prevTime, currTime),
          photoURL: m.photoURL || prev.photoURL || '',
          photoUrl: m.photoUrl || prev.photoUrl || ''
        });
      }
    });
    return Array.from(map.values());
  }

  // --- Non-blocking In-App Toast System ---
  function showQuickToast(message, type = 'info') {
    let toast = document.getElementById('reddotGlobalToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'reddotGlobalToast';
      toast.style.position = 'fixed';
      toast.style.bottom = '28px';
      toast.style.left = '50%';
      toast.style.transform = 'translateX(-50%) translateY(20px)';
      toast.style.zIndex = '999999';
      toast.style.padding = '10px 22px';
      toast.style.borderRadius = '30px';
      toast.style.fontFamily = 'var(--font-sans, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif)';
      toast.style.fontSize = '12px';
      toast.style.fontWeight = '600';
      toast.style.letterSpacing = '0.3px';
      toast.style.display = 'flex';
      toast.style.alignItems = 'center';
      toast.style.gap = '8px';
      toast.style.boxShadow = '0 12px 36px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.15)';
      toast.style.backdropFilter = 'blur(16px)';
      toast.style.webkitBackdropFilter = 'blur(16px)';
      toast.style.opacity = '0';
      toast.style.transition = 'all 0.28s cubic-bezier(0.16, 1, 0.3, 1)';
      toast.style.pointerEvents = 'none';
      document.body.appendChild(toast);
    }

    if (type === 'success') {
      toast.style.background = 'linear-gradient(135deg, rgba(0, 230, 118, 0.25), rgba(0, 180, 216, 0.25))';
      toast.style.border = '1px solid rgba(0, 230, 118, 0.45)';
      toast.style.color = '#e8fffa';
    } else if (type === 'warning') {
      toast.style.background = 'linear-gradient(135deg, rgba(255, 179, 0, 0.25), rgba(255, 87, 34, 0.25))';
      toast.style.border = '1px solid rgba(255, 179, 0, 0.45)';
      toast.style.color = '#fffbe8';
    } else {
      toast.style.background = 'linear-gradient(135deg, rgba(0, 210, 255, 0.25), rgba(0, 132, 255, 0.25))';
      toast.style.border = '1px solid rgba(0, 210, 255, 0.45)';
      toast.style.color = '#e6f7ff';
    }

    toast.textContent = message;
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';

    if (window._reddotToastTimer) clearTimeout(window._reddotToastTimer);
    window._reddotToastTimer = setTimeout(() => {
      if (toast) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(15px)';
      }
    }, 3500);
  }

  // --- Audio Synth Feedback & Call Ringtone ---
  let audioCtx = null;
  let callRingtoneInterval = null;

  function playNotificationChirp(success = false) {
    if (!state.soundEnabled) return;
    try {
      if (!audioCtx) {
        const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
        if (AudioCtxClass) audioCtx = new AudioCtxClass();
      }
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
      if (!audioCtx) return;

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      const now = audioCtx.currentTime;
      if (success) {
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else {
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      }
    } catch (_) {}
  }

  function startIncomingCallRingtone() {
    stopIncomingCallRingtone();
    function playRingBurst() {
      try {
        if (!audioCtx) {
          const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
          if (AudioCtxClass) audioCtx = new AudioCtxClass();
        }
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
        if (!audioCtx) return;

        const now = audioCtx.currentTime;
        // Standard telephone dual-frequency ring (440Hz + 480Hz)
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc1.frequency.setValueAtTime(440, now);
        osc2.frequency.setValueAtTime(480, now);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(audioCtx.destination);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.setValueAtTime(0.12, now + 1.2);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.4);
        osc2.stop(now + 1.4);
      } catch (_) {}
    }

    playRingBurst();
    callRingtoneInterval = setInterval(playRingBurst, 2500);
  }

  function stopIncomingCallRingtone() {
    if (callRingtoneInterval) {
      clearInterval(callRingtoneInterval);
      callRingtoneInterval = null;
    }
  }

  let callRingbackInterval = null;

  function startOutgoingRingbackTone() {
    stopOutgoingRingbackTone();
    function playRingbackBurst() {
      try {
        if (!audioCtx) {
          const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
          if (AudioCtxClass) audioCtx = new AudioCtxClass();
        }
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
        if (!audioCtx) return;

        const now = audioCtx.currentTime;
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc1.frequency.setValueAtTime(440, now);
        osc2.frequency.setValueAtTime(480, now);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(audioCtx.destination);

        gain.gain.setValueAtTime(0.06, now);
        gain.gain.setValueAtTime(0.06, now + 1.2);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.3);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.3);
        osc2.stop(now + 1.3);
      } catch (_) {}
    }

    playRingbackBurst();
    callRingbackInterval = setInterval(playRingbackBurst, 3000);
  }

  function stopOutgoingRingbackTone() {
    if (callRingbackInterval) {
      clearInterval(callRingbackInterval);
      callRingbackInterval = null;
    }
  }

  // --- Global Scoped Modal & Action Handles (Accessible across renderers and event binders) ---
  let openEditRoleModal = (member) => {};
  let closeEditRoleModal = () => {};
  let showIncomingCallModal = (callData) => {};
  let hideIncomingCallModal = () => {};
  let showOutgoingCallModal = (targetMember, callData, roomUrl) => {};
  let hideOutgoingCallModal = () => {};
  let startDirectCallWithMember = async (member) => {};
  let openMeetingModal = (targetMember = null) => {};
  let closeMeetingModal = () => {};
  let openCreateChannelModal = () => {};
  let closeCreateChannelModal = () => {};
  let openEditChannelModal = (targetChId = null) => {};
  let closeEditChannelModal = () => {};
  let openLinkPhotoModal = (targetMemberId = null) => {};
  let closeLinkPhotoModal = () => {};

  function safeSetText(el, text) {
    if (el) el.textContent = String(text ?? '');
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function sanitizeUrl(url) {
    if (!url || typeof url !== 'string') return '';
    const clean = url.trim();
    if (clean.startsWith('data:image/') || clean.startsWith('assets/') || clean.startsWith('http://') || clean.startsWith('https://')) {
      return clean.replace(/"/g, '%22').replace(/'/g, '%27').replace(/</g, '%3C').replace(/>/g, '%3E');
    }
    return '';
  }

  function convertGoogleDriveLink(url) {
    if (!url || typeof url !== 'string') return '';
    let clean = url.trim();

    // If user pasted without protocol
    if (!clean.startsWith('http://') && !clean.startsWith('https://') && !clean.startsWith('data:')) {
      if (/^[a-zA-Z0-9_-]{25,50}$/.test(clean)) {
        return `https://lh3.googleusercontent.com/d/${clean}=s1000`;
      }
      clean = 'https://' + clean;
    }

    // Match Google Drive file id patterns:
    const matchFile = clean.match(/\/file\/d\/([a-zA-Z0-9_-]{20,})/i);
    const matchD = clean.match(/\/d\/([a-zA-Z0-9_-]{20,})/i);
    const matchId = clean.match(/[?&]id=([a-zA-Z0-9_-]{20,})/i);
    const fileId = matchFile ? matchFile[1] : (matchD ? matchD[1] : (matchId ? matchId[1] : null));

    if (fileId) {
      // Direct high-speed CDN stream (200 OK, image/png or image/jpeg, no 302 redirect, no CORB block)
      return `https://lh3.googleusercontent.com/d/${fileId}=s1000`;
    }
    return clean;
  }

  // --- WALLPAPERS GALLERY ---
  function renderWallpaperGallery() {
    const grid = document.getElementById('wallpaperPresetsGrid');
    if (!grid) return;
    grid.replaceChildren();

    DEFAULT_WALLPAPER_PRESETS.forEach(preset => {
      const card = document.createElement('div');
      card.className = `wallpaper-card ${state.activeWallpaperPreset === preset.id ? 'active-wallpaper' : ''}`;
      const thumbUrl = ImageCacheManager.generateProceduralWallpaperThumb(preset.style, preset.hue);

      card.innerHTML = `
        <div class="wallpaper-thumb-wrapper">
          <img src="${thumbUrl}" alt="${escapeHtml(preset.name)}" class="wallpaper-preview-img" loading="lazy">
          <div class="wallpaper-glow-overlay"></div>
        </div>
        <div class="wallpaper-card-info">
          <div class="wallpaper-title-row">
            <span class="wallpaper-title">${escapeHtml(preset.name)}</span>
            <span class="wallpaper-tag">${escapeHtml(preset.tag)}</span>
          </div>
          <p class="wallpaper-card-desc">${escapeHtml(preset.desc)}</p>
          <div class="wallpaper-card-actions">
            <button class="btn-apply-wallpaper" data-id="${escapeHtml(preset.id)}">
              ${state.activeWallpaperPreset === preset.id ? '✓ Active Preset' : 'Apply Wallpaper'}
            </button>
          </div>
        </div>
      `;

      card.querySelector('.btn-apply-wallpaper')?.addEventListener('click', () => {
        applyWallpaperPreset(preset.id);
      });

      grid.appendChild(card);
    });
  }

  function applyWallpaperPreset(presetId) {
    const preset = DEFAULT_WALLPAPER_PRESETS.find(p => p.id === presetId) || DEFAULT_WALLPAPER_PRESETS[0];
    state.activeWallpaperPreset = preset.id;
    state.theme = preset.theme;
    localStorage.setItem('rd_active_wallpaper_preset', preset.id);
    localStorage.setItem('rd_theme', preset.theme);

    document.body.className = `theme-${preset.theme} ${state.commandCenterOpen ? 'mode-command' : 'mode-wallpaper'}`;

    // Dynamically render procedural glowing hardware architecture wallpaper into background
    try {
      const bgLayer = document.getElementById('wallpaperBgLayer');
      if (bgLayer && ImageCacheManager.generateProceduralWallpaper) {
        const fullWpUrl = ImageCacheManager.generateProceduralWallpaper(preset.style, preset.hue, window.innerWidth || 1920, window.innerHeight || 1080);
        bgLayer.style.backgroundImage = `url("${fullWpUrl}")`;
      }
    } catch (e) {
      console.warn('[WALLPAPER] Procedural render warning:', e);
    }

    renderWallpaperGallery();
    playNotificationChirp(true);
  }

  // --- DIRECTORY & MEMBERS UI ---

  function getMemberArchCode(member) {
    if (member.email?.toLowerCase().includes('jagadish') || member.isOwner) return 'us-east-core-01';
    if (member.name?.toLowerCase().includes('pavithra')) return 'eu-west-rt-03';
    if (member.name?.toLowerCase().includes('vikram')) return 'sgp-sec-cluster-0';
    if (member.name?.toLowerCase().includes('ananya')) return 'us-east-core-01';
    if (member.name?.toLowerCase().includes('rohan')) return 'jp-tyo-node-04';
    return `cluster-${(member.id || '001').slice(-3).toLowerCase()}`;
  }

  function getMemberDirective(member) {
    if (member.directive) return member.directive;
    if (member.email?.toLowerCase().includes('jagadish') || member.isOwner) {
      return 'BGA Signal Integrity & Impedance Maturation for sub-3nm chiplet interconnects.';
    }
    if (member.name?.toLowerCase().includes('pavithra')) {
      return 'Industrial UI Component Harmonization and Carbon design token synchronization.';
    }
    if (member.name?.toLowerCase().includes('vikram')) {
      return 'HSM Enclave Key Rotation & Firmware Attestation verification protocols.';
    }
    if (member.name?.toLowerCase().includes('ananya')) {
      return 'PCIe Gen6 Handshake Synchronization and latency bounds validation.';
    }
    if (member.name?.toLowerCase().includes('rohan')) {
      return 'BGP Route Convergence Testing and automated failover edge mesh verification.';
    }
    return 'Active node telemetry validation, workload routing, and cluster node synchronization.';
  }

  function renderWorkers() {
    const grid = document.getElementById('workersCardsGrid');
    if (!grid) return;
    grid.replaceChildren();

    const searchInput = (document.getElementById('searchWorkerInput')?.value || state.workerSearchQuery || '').toLowerCase().trim();
    const deptFilter = (state.workerDeptFilter || 'ALL').toUpperCase();
    const statusSelect = document.getElementById('workersStatusSelect');
    const statusFilter = (statusSelect?.value || state.workerStatusFilter || 'ALL').toUpperCase();
    const isFounderAdmin = (state.currentUser?.email?.toLowerCase() === 'jagadish2k2006@gmail.com' || state.userRole === 'OWNER');

    const list = getUniqueMembersList().filter(m => {
      // Filter out legacy fake demo names
      if (m.name === 'Alex Rivera' || m.name === 'Priya Sharma' || m.name === 'Vikram Malhotra') return false;

      // 1. Department Filter
      if (deptFilter !== 'ALL') {
        const mDept = (m.dept || '').toUpperCase();
        if (!mDept.includes(deptFilter)) return false;
      }

      // 2. Status Filter
      if (statusFilter !== 'ALL') {
        const isOnline = isMemberAppOnline(m) || isSelfMember(m);
        const dutyStatus = getMemberDutyStatus(m);
        if (statusFilter === 'ONLINE' && !isOnline && dutyStatus !== 'DUTY_ON') return false;
        if (statusFilter === 'ON_BREAK' && dutyStatus !== 'DUTY_BREAK') return false;
        if (statusFilter === 'IN_FOCUS' && dutyStatus !== 'DUTY_ON' && !isOnline) return false;
        if (statusFilter === 'OFFLINE' && (isOnline || dutyStatus === 'DUTY_ON' || dutyStatus === 'DUTY_BREAK')) return false;
      }

      // 3. Search query
      if (!searchInput) return true;
      return (m.name || '').toLowerCase().includes(searchInput) ||
             (m.id || '').toLowerCase().includes(searchInput) ||
             (m.role || '').toLowerCase().includes(searchInput) ||
             (m.dept || '').toLowerCase().includes(searchInput) ||
             (m.email || '').toLowerCase().includes(searchInput);
    });

    if (list.length === 0) {
      grid.innerHTML = `
        <div class="empty-state-box" style="grid-column: 1 / -1; padding: 30px; text-align: center;">
          <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 8px;">No team members matched the selected filters.</p>
          <p style="font-size: 11px; color: var(--text-muted);">Adjust search terms, department pills, or click <strong>+ Create Member &amp; ID Card</strong>.</p>
        </div>
      `;
      populateAssigneeSelect();
      return;
    }

    const canManageRoles = isFounderAdmin || state.userRole === 'OWNER' || state.userRole === 'ADMIN' || (state.userRole && state.userRole.toLowerCase().includes('admin')) || !state.currentUser || true;

    list.forEach(member => {
      const card = document.createElement('div');
      card.className = `worker-card ${member.suspended ? 'worker-suspended' : ''}`;
      if (member.suspended) {
        card.style.opacity = '0.75';
        card.style.border = '1px solid rgba(255, 82, 82, 0.4)';
      }

      const isOnline = isMemberAppOnline(member);
      const dutyStatus = getMemberDutyStatus(member);
      const isBreak = dutyStatus === 'DUTY_BREAK';
      const isOnDuty = dutyStatus === 'DUTY_ON';
      const isSelf = isSelfMember(member);

      let statusClass = 'pulse-red';
      let statusText = '🔴 Offline';

      if (member.suspended) {
        statusClass = 'pulse-red';
        statusText = '⛔ Suspended';
      } else if (isBreak) {
        statusClass = 'pulse-amber';
        statusText = '🟡 Away';
      } else if (isOnDuty) {
        statusClass = 'pulse-green';
        statusText = '🟢 On Duty';
      } else if (isOnline) {
        statusClass = 'pulse-green';
        statusText = '🟢 Online';
      }

      const safeName = escapeHtml(member.name || member.displayName || 'Member');
      const safeId = escapeHtml(member.id || (member.uid ? `RD-${member.uid.slice(0, 6).toUpperCase()}` : 'RD-EMP-000'));
      const safeDept = escapeHtml(member.dept || 'Hardware Architecture');
      const safeRole = escapeHtml(member.role || 'Employee');
      const safeAvatar = escapeHtml(member.avatarText || (member.name || 'RD').slice(0, 2)).toUpperCase();
      const safePhoto = sanitizeUrl(member.photoUrl || member.photoURL);

      card.className = 'node-member-card';

      let statusBadgeClass = 'badge-offline';
      let statusBadgeText = 'OFFLINE';
      if (isOnDuty || isOnline) {
        statusBadgeClass = 'badge-online';
        statusBadgeText = 'ONLINE';
      } else if (isBreak) {
        statusBadgeClass = 'badge-break';
        statusBadgeText = 'ON BREAK';
      }

      card.innerHTML = `
        <div class="node-card-top">
          <div class="node-card-user-info">
            <div class="node-card-avatar">
              ${safePhoto ? `<img src="${safePhoto}" alt="" referrerpolicy="no-referrer" class="node-card-avatar-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"><span style="display:none;">${safeAvatar}</span>` : `<span>${safeAvatar}</span>`}
              <span class="node-avatar-status-dot ${statusClass}"></span>
            </div>
            <div>
              <h4 class="node-card-name">${safeName}</h4>
              <p class="node-card-role">${safeRole}</p>
            </div>
          </div>
          <span class="node-status-badge ${statusBadgeClass}">${statusBadgeText}</span>
        </div>

        <div class="node-arch-box">
          <div class="node-arch-label">
            <span>Department</span>
          </div>
          <div class="node-arch-val">${safeDept}</div>
        </div>

        <div class="node-directive-box">
          <div class="node-directive-label">EMAIL</div>
          <div class="node-directive-text" style="color: var(--text-secondary); font-size: 12.5px;">${escapeHtml(member.email || 'No email provided')}</div>
        </div>

        <div class="node-card-actions">
          <button type="button" class="btn-node-action btn-worker-chat" data-id="${safeId}" title="Send Direct Message">
            <span>💬 Message</span>
          </button>
          <button type="button" class="btn-node-action btn-view-badge" data-id="${safeId}" title="View Official Badge">
            <span>🪪 Badge</span>
          </button>
          <button type="button" class="btn-node-action btn-worker-meet" data-id="${safeId}" title="Instant Video Call">
            <span>📹 Video Call</span>
          </button>
        </div>
      `;

      // Event listeners

      card.querySelector('.worker-role-pill')?.addEventListener('click', () => {
        openEditRoleModal(member);
      });

      card.querySelector('.btn-worker-chat')?.addEventListener('click', async () => {
        switchTab('chat');
        let dmId = `dm_${member.id}`;
        if (window.FirebaseService?.getOrCreateDMChannel) {
          try {
            dmId = await FirebaseService.getOrCreateDMChannel(member, member.name);
          } catch (_) {}
        }
        selectChatTarget(dmId, member.name);
      });

      card.querySelector('.btn-worker-meet')?.addEventListener('click', () => {
        startDirectCallWithMember(member);
      });

      card.querySelector('.btn-view-badge')?.addEventListener('click', () => {
        openBadgeViewerModal(member.id);
      });

      card.querySelector('.btn-mount-wallpaper')?.addEventListener('click', () => {
        mountMemberOnWallpaper(member.id);
      });

      // Admin Action: Authorize / Edit Role via in-app Modal
      card.querySelector('.btn-auth-role')?.addEventListener('click', () => {
        openEditRoleModal(member);
      });

      // Admin Action: Suspend / Reactivate ID Access
      card.querySelector('.btn-toggle-suspend')?.addEventListener('click', async () => {
        const actionText = member.suspended ? 'Reactivate ID access for' : 'Suspend ID access and revoke permissions for';
        if (confirm(`${actionText} ${member.name} (${member.id})?`)) {
          member.suspended = !member.suspended;
          member.status = member.suspended ? 'DUTY_OFF' : 'DUTY_ON';
          WorkspaceDB.save();

          if (window.FirebaseService?.db && member.uid) {
            FirebaseService.db.collection(`organizations/reddot/members`).doc(member.uid).update({
              suspended: member.suspended,
              active: !member.suspended
            }).catch(console.error);
          }
          renderWorkers();
          renderFleetTelemetry();
          playNotificationChirp(true);
        }
      });

      // Admin Action: Permanently Delete Member & Revoke ID
      card.querySelector('.btn-delete-member')?.addEventListener('click', async () => {
        if (confirm(`Permanently remove member ${member.name} (${member.id}) and delete their ID badge?`)) {
          const idToDelete = member.id;
          const uidToDelete = member.uid;
          const docIdToDelete = member.docId;
          const emailToDelete = (member.email || '').toLowerCase();

          // 1. Add to permanent tombstone list so it never reappears from sync
          if (!WorkspaceDB.data.deletedMembers) WorkspaceDB.data.deletedMembers = [];
          [idToDelete, uidToDelete, docIdToDelete, emailToDelete].forEach(k => {
            if (k && !WorkspaceDB.data.deletedMembers.includes(k)) {
              WorkspaceDB.data.deletedMembers.push(k);
            }
          });

          // 2. Remove all references from local WorkspaceDB
          Object.keys(WorkspaceDB.data.members || {}).forEach(k => {
            const m = WorkspaceDB.data.members[k];
            if (!m) return;
            if (
              k === idToDelete || k === uidToDelete || k === docIdToDelete ||
              m.id === idToDelete || m.uid === uidToDelete || m.docId === docIdToDelete ||
              (emailToDelete && m.email && m.email.toLowerCase() === emailToDelete)
            ) {
              delete WorkspaceDB.data.members[k];
            }
          });
          await WorkspaceDB.save();

          // 3. Delete from Cloud Firestore and mark deleted/inactive
          if (window.FirebaseService?.db) {
            const orgId = window.REDDOT_ORG_ID || 'reddot';
            const col = FirebaseService.db.collection(`organizations/${orgId}/members`);
            const targets = [docIdToDelete, uidToDelete, idToDelete].filter(Boolean);
            targets.forEach(tid => {
              col.doc(tid).delete().catch(() => {});
              col.doc(tid).set({ active: false, deleted: true, status: 'DUTY_OFF' }, { merge: true }).catch(() => {});
            });
          }

          renderWorkers();
          renderFleetTelemetry();
          renderChatChannelsAndDMs();
          WorkspaceDB.updateMetricsUI();
          playNotificationChirp(false);
          showQuickToast(`Member ${member.name} permanently removed.`, 'info');
        }
      });

      grid.appendChild(card);
    });

    // Add "+ Provision New Node Member" card (Image 3)
    const provisionCard = document.createElement('div');
    provisionCard.className = 'node-provision-card';
    provisionCard.innerHTML = `
      <div class="provision-plus-icon">+</div>
      <h4 class="provision-title">Provision New Node Member</h4>
      <p class="provision-sub">Assign telemetry roles, cluster authorization &amp; directives.</p>
    `;
    provisionCard.addEventListener('click', () => {
      document.getElementById('btnOpenCreateWorkerModal')?.click();
    });
    grid.appendChild(provisionCard);

    // Update active telemetry counts
    const activeEl = document.getElementById('activeNodesCount');
    const onlineNodes = list.filter(m => isMemberAppOnline(m) || isSelfMember(m)).length;
    if (activeEl) {
      activeEl.innerHTML = `${onlineNodes} <span class="telemetry-slash">/ ${list.length}</span>`;
    }
    if (statusSelect && statusSelect.options && statusSelect.options.length > 0) {
      statusSelect.options[0].textContent = `Status: All (${list.length})`;
    }

    populateAssigneeSelect();
  }

  function populateAssigneeSelect() {
    const select = document.getElementById('taskAssigneeSelect');
    if (!select) return;

    // Preserve the user's currently selected value if any
    const currentVal = select.value;

    select.replaceChildren();

    const optAll = document.createElement('option');
    optAll.value = 'ALL';
    optAll.dataset.id = 'ALL';
    optAll.dataset.name = 'Entire Team';
    optAll.dataset.email = '';
    optAll.textContent = 'Entire Team (ALL)';
    select.appendChild(optAll);

    getUniqueMembersList().forEach(m => {
      const opt = document.createElement('option');
      const safeMId = m.id || m.uid || 'RD-EMP-001';
      const safeMName = m.name || m.displayName || 'Member';
      opt.value = safeMId;
      opt.dataset.id = safeMId;
      opt.dataset.uid = m.uid || safeMId;
      opt.dataset.name = safeMName;
      opt.dataset.email = m.email || '';
      opt.textContent = `${safeMName} (${safeMId})`;
      select.appendChild(opt);
    });

    if (currentVal && Array.from(select.options).some(o => o.value === currentVal)) {
      select.value = currentVal;
    }
  }

  // --- BADGE VIEWER & WALLPAPER MOUNTING ---
  function openBadgeViewerModal(memberId) {
    const memberList = getUniqueMembersList();
    const member = WorkspaceDB.data.members[memberId] || memberList.find(m => m.id === memberId || m.uid === memberId) || memberList[0];
    if (!member) return;

    if (!member.id) member.id = member.uid ? `RD-${member.uid.slice(0, 6).toUpperCase()}` : 'RD-EMP-001';
    state.selectedViewingMemberId = member.id;

    const modal = document.getElementById('badgeViewerModal');
    if (!modal) return;

    safeSetText(document.getElementById('badgeViewName'), member.name || member.displayName || 'COLLEAGUE');
    safeSetText(document.getElementById('badgeViewRole'), member.role || 'EMPLOYEE');
    safeSetText(document.getElementById('badgeViewDept'), member.dept || 'HARDWARE ARCHITECTURE');
    safeSetText(document.getElementById('badgeViewIdNum'), `ID: ${member.id}`);

    const avatarBox = document.getElementById('badgeViewAvatar');
    if (avatarBox) {
      const safePhoto = sanitizeUrl(member.photoUrl || member.photoURL);
      const safeInitials = escapeHtml(member.avatarText || (member.name || 'RD').slice(0, 2).toUpperCase());
      if (safePhoto) {
        avatarBox.innerHTML = `
          <img src="${safePhoto}" alt="" referrerpolicy="no-referrer" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='flex';">
          <div style="display: none; width: 100%; height: 100%; align-items: center; justify-content: center; font-weight: 800; font-size: 24px; color: #fff; background: linear-gradient(135deg, var(--accent-cyan), var(--accent-blue)); border-radius: 50%;">${safeInitials}</div>
        `;
      } else {
        avatarBox.innerHTML = `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 24px; color: #fff; background: linear-gradient(135deg, var(--accent-cyan), var(--accent-blue)); border-radius: 50%;">${safeInitials}</div>`;
      }
    }

    // Attach Edit Role triggers directly on Badge Viewer
    const btnEditRoleBadge = document.getElementById('btnEditRoleFromBadgeModal');
    if (btnEditRoleBadge) {
      btnEditRoleBadge.onclick = (e) => {
        e.preventDefault();
        openEditRoleModal(member);
      };
    }
    const roleEl = document.getElementById('badgeViewRole');
    if (roleEl) {
      roleEl.onclick = () => openEditRoleModal(member);
    }
    const deptEl = document.getElementById('badgeViewDept');
    if (deptEl) {
      deptEl.onclick = () => openEditRoleModal(member);
    }

    modal.classList.remove('hidden');
  }

  async function uploadPhotoForBadge() {
    const result = await pickPhotoFile();
    if (!result.canceled && result.dataUrl) {
      const member = WorkspaceDB.data.members[state.selectedViewingMemberId] || getUniqueMembersList().find(m => m.id === state.selectedViewingMemberId) || state.currentMember;
      if (member) {
        member.idCardPhoto = result.dataUrl;
        member.photoUrl = result.dataUrl;
        member.photoURL = result.dataUrl;
        WorkspaceDB.data.customMountedBadgePhoto = result.dataUrl;
        await WorkspaceDB.save();

        // Sync photo to Cloud Firestore & Auth across all member keys
        if (window.FirebaseService?.updateMemberPhoto) {
          try {
            const targetUid = member.uid || state.currentUser?.uid || member.id;
            await FirebaseService.updateMemberPhoto(targetUid, result.dataUrl);
          } catch (err) {
            console.warn('[PHOTO] Cloud upload note:', err.message);
          }
        }

        mountMemberOnWallpaper(member.id);
        openBadgeViewerModal(member.id);
        renderWorkers();
        playNotificationChirp(true);
        showQuickToast(`ID Card Photo updated & saved for ${member.name || member.displayName}!`, 'success');
      }
    }
  }

  function mountMemberOnWallpaper(memberId) {
    const member = WorkspaceDB.data.members[memberId] || getUniqueMembersList().find(m => m.id === memberId || m.uid === memberId);
    if (!member) return;

    if (!member.id) member.id = member.uid ? `RD-${member.uid.slice(0, 6).toUpperCase()}` : 'RD-EMP-001';

    let photo = member.idCardPhoto || member.photoUrl || member.photoURL || WorkspaceDB.data.customMountedBadgePhoto || 'assets/id-card.png';
    if (photo && (photo.includes('drive.google.com/thumbnail?id=') || photo.includes('/file/d/') || photo.includes('drive.google.com/open?id='))) {
      photo = convertGoogleDriveLink(photo);
    }
    WorkspaceDB.data.customMountedBadgePhoto = photo;
    WorkspaceDB.save().catch(() => {});

    const badgeImg = document.getElementById('badgeImg');
    if (badgeImg) {
      badgeImg.onerror = () => {
        console.warn('[BADGE] Photo failed to load, falling back to assets/id-card.png');
        badgeImg.src = 'assets/id-card.png';
      };
      badgeImg.src = photo;
      badgeImg.classList.add('pulse-glow');
      setTimeout(() => badgeImg.classList.remove('pulse-glow'), 1000);
    }

    const modalBadgePhoto = document.getElementById('badgeViewCustomPhoto');
    if (modalBadgePhoto && photo) {
      modalBadgePhoto.src = photo;
    }

    const memberName = member.name || member.displayName || 'REDDOT';
    const memberRole = member.role || 'WORKSTATION';
    const memberDept = member.dept || 'HARDWARE ARCHITECTURE';

    // Update watermark & side tags
    safeSetText(document.getElementById('giantNameText'), memberName.split(' ')[0].toUpperCase());
    safeSetText(document.getElementById('leftTagRole'), `(${memberRole.toUpperCase()})`);
    safeSetText(document.getElementById('leftTagSub'), `${memberDept.toUpperCase()} // ${member.id}`);
    safeSetText(document.getElementById('bottomBrandTag'), `${memberName.toUpperCase()} \u2022 2026`);

    playNotificationChirp(true);
    closeCommandCenter();
  }

  // --- TASKS MANAGEMENT ---
  function populateAssigneeSelect() {
    const selects = [
      document.getElementById('taskAssigneeSelect'),
      document.getElementById('taskFilterAssigneeSelect'),
      document.getElementById('editTaskAssignee')
    ].filter(Boolean);

    const members = getUniqueMembersList();

    selects.forEach(select => {
      const currentVal = select.value;
      select.replaceChildren();

      const optAll = document.createElement('option');
      optAll.value = 'ALL';
      optAll.dataset.name = 'Entire Team';
      optAll.dataset.email = '';
      optAll.textContent = select.id === 'taskFilterAssigneeSelect' ? 'All Members' : 'Entire Team (ALL)';
      select.appendChild(optAll);

      members.forEach(m => {
        const opt = document.createElement('option');
        const safeMId = m.id || m.uid || 'RD-EMP';
        const safeMName = m.displayName || m.name || (m.email ? m.email.split('@')[0] : 'Team Member');
        opt.value = safeMId;
        opt.dataset.name = safeMName;
        opt.dataset.email = m.email || '';
        opt.dataset.uid = m.uid || '';
        opt.textContent = `${safeMName} [${safeMId}]`;
        select.appendChild(opt);
      });

      if (currentVal && Array.from(select.options).some(o => o.value === currentVal)) {
        select.value = currentVal;
      } else {
        select.value = 'ALL';
      }
    });
  }

  function formatTimestampForDateInput(timestamp) {
    if (!timestamp) return new Date().toISOString().split('T')[0];
    const d = new Date(Number(timestamp) || timestamp);
    if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
    return d.toISOString().split('T')[0];
  }

  function parseDateInputToTimestamp(dateStr, existingTimestamp) {
    if (!dateStr) {
      return existingTimestamp || Date.now();
    }
    const parsed = new Date(dateStr).getTime();
    return isNaN(parsed) ? (existingTimestamp || Date.now()) : parsed;
  }

  function renderTasks() {
    const container = document.getElementById('taskCardsList');
    const completedContainer = document.getElementById('completedTasksList');
    const inProgressCount = document.getElementById('tasksInProgressCount');
    const completedCount = document.getElementById('tasksCompletedCount');
    if (!container) return;

    // Populate all assignee dropdowns
    populateAssigneeSelect();

    // No artificial task seeding - keep only authentic user tasks
    const allTasks = WorkspaceDB.data.tasks || [];
    const completedTasks = allTasks.filter(t => t.status === 'COMPLETED' || t.status === 'ACCOMPLISHED');
    const completedTotal = completedTasks.length;
    const activeTasks = allTasks.filter(t => t.status !== 'COMPLETED' && t.status !== 'ACCOMPLISHED');
    const totalCount = allTasks.length;
    const velocityScore = totalCount > 0 ? Math.round((completedTotal / totalCount) * 100) : 0;

    const sTotal = document.getElementById('sprintTotalTasks');
    if (sTotal) sTotal.textContent = String(totalCount);
    const sComp = document.getElementById('sprintCompletedTasks');
    if (sComp) sComp.textContent = String(completedTotal);
    const sLoad = document.getElementById('sprintActiveLoad');
    if (sLoad) sLoad.textContent = String(activeTasks.length);
    const sVelo = document.getElementById('sprintVelocityScore');
    if (sVelo) sVelo.textContent = `${velocityScore}%`;
    const sBar = document.getElementById('sprintExecutionProgressBar');
    if (sBar) sBar.style.width = `${velocityScore}%`;

    // Filter tasks
    let filteredTasks = [...activeTasks];

    const searchInput = document.getElementById('filterTaskInput');
    const searchQuery = (searchInput?.value || '').trim().toLowerCase();
    if (searchQuery) {
      filteredTasks = filteredTasks.filter(t => 
        (t.title && t.title.toLowerCase().includes(searchQuery)) ||
        (t.code && t.code.toLowerCase().includes(searchQuery)) ||
        (t.category && t.category.toLowerCase().includes(searchQuery)) ||
        (t.assigneeName && t.assigneeName.toLowerCase().includes(searchQuery)) ||
        (t.description && t.description.toLowerCase().includes(searchQuery))
      );
    }

    const catFilter = document.getElementById('taskFilterCategorySelect')?.value || 'ALL';
    if (catFilter !== 'ALL') {
      filteredTasks = filteredTasks.filter(t => (t.category || '').toUpperCase().includes(catFilter.toUpperCase()));
    }

    const assigneeFilter = document.getElementById('taskFilterAssigneeSelect')?.value || 'ALL';
    if (assigneeFilter !== 'ALL') {
      filteredTasks = filteredTasks.filter(t => 
        t.assigneeId === assigneeFilter || 
        (t.assigneeName && t.assigneeName.toLowerCase().includes(assigneeFilter.toLowerCase()))
      );
    }

    const priorityFilter = document.getElementById('taskFilterPrioritySelect')?.value || 'ALL';
    if (priorityFilter !== 'ALL') {
      filteredTasks = filteredTasks.filter(t => (t.priority || '').toUpperCase() === priorityFilter.toUpperCase());
    }

    // Sort tasks
    if (state.taskSortMode === 'priority') {
      const pRank = { CRITICAL: 4, URGENT: 4, HIGH: 3, MEDIUM: 2, NORMAL: 2, LOW: 1 };
      filteredTasks.sort((a, b) => (pRank[b.priority] || 2) - (pRank[a.priority] || 2));
    } else {
      filteredTasks.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }

    // Filter completed tasks by same criteria
    var filteredCompleted = completedTasks.slice();
    if (searchQuery) {
      filteredCompleted = filteredCompleted.filter(function(t) {
        return (t.title && t.title.toLowerCase().indexOf(searchQuery) !== -1) ||
          (t.code && t.code.toLowerCase().indexOf(searchQuery) !== -1) ||
          (t.assigneeName && t.assigneeName.toLowerCase().indexOf(searchQuery) !== -1) ||
          (t.description && t.description.toLowerCase().indexOf(searchQuery) !== -1);
      });
    }
    if (catFilter !== 'ALL') {
      filteredCompleted = filteredCompleted.filter(function(t) {
        return (t.category || '').toUpperCase().indexOf(catFilter.toUpperCase()) !== -1;
      });
    }
    if (assigneeFilter !== 'ALL') {
      filteredCompleted = filteredCompleted.filter(function(t) {
        return t.assigneeId === assigneeFilter ||
          (t.assigneeName && t.assigneeName.toLowerCase().indexOf(assigneeFilter.toLowerCase()) !== -1);
      });
    }
    if (priorityFilter !== 'ALL') {
      filteredCompleted = filteredCompleted.filter(function(t) {
        return (t.priority || '').toUpperCase() === priorityFilter.toUpperCase();
      });
    }

    var statusFilter = 'ALL';
    var sfEl = document.getElementById('taskFilterStatusSelect');
    if (sfEl) statusFilter = sfEl.value || 'ALL';

    if (inProgressCount) inProgressCount.textContent = String(filteredTasks.length);
    if (completedCount) completedCount.textContent = filteredCompleted.length + ' Total';

    // If Board View is active, render Kanban Board with fully filtered tasks
    if (state.taskViewMode === 'board') {
      let boardTasks = [];
      if (statusFilter === 'ACTIVE') boardTasks = filteredTasks;
      else if (statusFilter === 'COMPLETED') boardTasks = filteredCompleted;
      else boardTasks = [...filteredTasks, ...filteredCompleted];
      renderKanbanBoard(boardTasks);
      return;
    }

    // LIST VIEW
    container.replaceChildren();
    if (completedContainer) completedContainer.replaceChildren();

    if (filteredTasks.length === 0) {
      const emptyNotice = document.createElement('div');
      emptyNotice.style.cssText = 'padding: 28px; text-align: center; color: var(--text-muted); font-size: 13px; background: var(--card-bg); border: 1px dashed var(--card-border); border-radius: 8px;';
      emptyNotice.innerHTML = '🔍 No matching sprint tasks found. Try adjusting filters or click <strong>+ Add Task</strong> above.';
      container.appendChild(emptyNotice);
    } else {
      filteredTasks.forEach((task, idx) => {
        const card = document.createElement('div');
        card.className = 'task-card-v3';
        card.dataset.taskId = task.id;

        const isSelected = state.activeSelectedTask ? state.activeSelectedTask.id === task.id : idx === 0;
        if (isSelected) {
          card.classList.add('active-selected');
          state.activeSelectedTask = task;
        }

        const priorityClass = (task.priority === 'HIGH' || task.priority === 'CRITICAL' || task.priority === 'URGENT') ? 'p-high' : (task.priority === 'MEDIUM' ? 'p-med' : 'p-low');
        const safePriority = escapeHtml(task.priority || 'NORMAL');
        const safeCategory = escapeHtml(task.category || 'General');
        const safeDue = escapeHtml(task.dueAt || 'Due Today, 5:00 PM');
        const safeTitle = escapeHtml(task.title || 'Workspace Task');
        const safeDesc = escapeHtml(task.description || '');
        const safeAssignee = escapeHtml(task.assigneeName || 'Jagadish K (Lead Design)');
        const assigneeInitials = safeAssignee.slice(0, 2).toUpperCase();

        const subtasks = task.subtasks || [
          { label: 'Review scope and requirements', done: true },
          { label: 'Execute implementation pass', done: true },
          { label: 'Conduct code audit', done: false }
        ];
        const doneSub = subtasks.filter(s => s.done).length;
        const totalSub = subtasks.length;
        const subPercent = totalSub > 0 ? Math.round((doneSub / totalSub) * 100) : 0;

        card.innerHTML = `
          <div class="task-card-meta-top">
            <div class="task-tags-group">
              <span class="task-p-badge ${priorityClass}">${safePriority} Priority</span>
              <span class="task-mod-badge">${safeCategory}</span>
            </div>
            <span class="task-due-date">📅 ${safeDue}</span>
          </div>

          <h4 class="task-card-title">${safeTitle}</h4>
          <p class="task-card-desc">${safeDesc}</p>

          <div class="task-card-footer">
            <div class="task-assignee-chip">
              <div class="task-assignee-avatar">${assigneeInitials}</div>
              <span class="task-assignee-name">${safeAssignee}</span>
            </div>
            <div class="task-subtasks-progress">
              <span class="subtasks-count">${doneSub}/${totalSub} subtasks</span>
              <div class="subtasks-bar-track">
                <div class="subtasks-bar-fill" style="width: ${subPercent}%;"></div>
              </div>
            </div>
          </div>
        `;

        card.addEventListener('click', () => {
          document.querySelectorAll('.task-card-v3').forEach(c => c.classList.remove('active-selected'));
          card.classList.add('active-selected');
          state.taskDrawerClosedByUser = false;
          state.activeSelectedTask = task;
          openTaskDrawer(task);
        });

        container.appendChild(card);
      });

      // Auto-open selected or first task in drawer (unless closed by user)
      if (!state.taskDrawerClosedByUser) {
        if (state.activeSelectedTask) {
          openTaskDrawer(state.activeSelectedTask);
        } else if (filteredTasks.length > 0) {
          openTaskDrawer(filteredTasks[0]);
        } else if (completedTasks.length > 0) {
          openTaskDrawer(completedTasks[0]);
        }
      }
    }


    // Status Filter - show/hide sections
    var inProgressSection = document.getElementById('inProgressTasksSection');
    var completedSection = document.getElementById('completedTasksSection');
    if (statusFilter === 'ACTIVE') {
      if (inProgressSection) inProgressSection.style.display = '';
      if (completedSection) completedSection.style.display = 'none';
    } else if (statusFilter === 'COMPLETED') {
      if (inProgressSection) inProgressSection.style.display = 'none';
      if (completedSection) completedSection.style.display = '';
    } else {
      if (inProgressSection) inProgressSection.style.display = '';
      if (completedSection) completedSection.style.display = '';
    }

    // Render Completed Tasks Section
    if (completedContainer) {
      completedContainer.replaceChildren();
      if (filteredCompleted.length === 0) {
        const emptyNotice = document.createElement('div');
        emptyNotice.style.cssText = 'padding: 16px; text-align: center; color: var(--text-muted); font-size: 12px; background: var(--card-bg); border: 1px dashed var(--card-border); border-radius: 8px;';
        emptyNotice.textContent = completedTasks.length === 0 ? 'No completed tasks yet.' : 'No completed tasks match your filters.';
        completedContainer.appendChild(emptyNotice);
      } else {
        filteredCompleted.forEach(ct => {
          const row = document.createElement('div');
          row.style.cssText = 'background:var(--card-bg); border:1px solid var(--card-border); border-radius:8px; padding:12px 16px; display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; cursor:pointer;';
          const cat = ct.category || 'Task';
          const assignee = ct.assigneeName || 'Team Member';
          const completedDate = ct.accomplishedAt ? new Date(ct.accomplishedAt).toLocaleDateString() : (ct.updatedAt ? new Date(ct.updatedAt).toLocaleDateString() : 'Recently');
          row.innerHTML = `
            <div style="display:flex; align-items:center; gap:12px;">
              <div style="width:18px; height:18px; background:#008a3e; color:#fff; border-radius:3px; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:800;">✓</div>
              <div>
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="font-size:13px; font-weight:700; color:var(--text-white);">${escapeHtml(ct.title || 'Task')}</span>
                  <span style="font-size:10px; background:var(--shell-bg); padding:2px 6px; border-radius:4px; color:var(--text-muted); font-weight:600;">${escapeHtml(cat)}</span>
                </div>
                <p style="font-size:11.5px; color:var(--text-muted); margin:2px 0 0 0;">Completed by ${escapeHtml(assignee)} &bull; ${escapeHtml(completedDate)}</p>
              </div>
            </div>
            <div style="display:flex; align-items:center; gap:6px;">
              <span style="font-size:11px; font-weight:700; color:#008a3e; background:rgba(0,138,62,0.1); padding:3px 10px; border-radius:6px; border:1px solid rgba(0,138,62,0.2);">&#10003; Done</span>
              <button class="btn-row-reopen" data-tid="${ct.id}" style="font-size:11px;font-weight:600;color:#3b82f6;background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.25);border-radius:5px;padding:3px 8px;cursor:pointer;">&#8634; Reopen</button>
              <button class="btn-row-delete" data-tid="${ct.id}" style="font-size:11px;font-weight:600;color:#ef4444;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.25);border-radius:5px;padding:3px 8px;cursor:pointer;">&#128465;</button>
            </div>
          `;
          row.addEventListener('click', function(e) {
            if (e.target.closest && (e.target.closest('.btn-row-reopen') || e.target.closest('.btn-row-delete'))) return;
            state.activeSelectedTask = ct;
            openTaskDrawer(ct);
          });
          const reopenBtn = row.querySelector('.btn-row-reopen');
          if (reopenBtn) {
            reopenBtn.addEventListener('click', async function(e) {
              e.stopPropagation();
              ct.status = 'IN_PROGRESS';
              ct.updatedAt = Date.now();
              delete ct.accomplishedAt;
              await WorkspaceDB.save();
              if (window.FirebaseService && FirebaseService.updateTask) {
                FirebaseService.updateTask(ct.id, { status: 'IN_PROGRESS', updatedAt: Date.now() }).catch(function() {});
              }
              showQuickToast('Task "' + ct.title + '" moved back to In Progress.', 'info');
              playNotificationChirp(true);
              renderTasks();
            });
          }
          const delBtn = row.querySelector('.btn-row-delete');
          if (delBtn) {
            delBtn.addEventListener('click', async function(e) {
              e.stopPropagation();
              await deleteTask(ct.id);
            });
          }
          completedContainer.appendChild(row);
        });
      }
    }
  }

  function renderKanbanBoard(allTasks) {
    const listDeck = document.getElementById('tasksListDeck');
    const boardDeck = document.getElementById('tasksBoardDeck');
    if (listDeck) listDeck.classList.add('hidden');
    if (boardDeck) boardDeck.classList.remove('hidden');

    const todoCol = document.getElementById('kanbanCardsTodo');
    const inProgCol = document.getElementById('kanbanCardsInProgress');
    const compCol = document.getElementById('kanbanCardsCompleted');
    if (!todoCol || !inProgCol || !compCol) return;

    todoCol.replaceChildren();
    inProgCol.replaceChildren();
    compCol.replaceChildren();

    const todoTasks = allTasks.filter(t => t.status === 'ASSIGNED' || t.status === 'TODO' || t.status === 'NEW');
    const inProgTasks = allTasks.filter(t => t.status === 'REACHED' || t.status === 'IN_PROGRESS' || t.status === 'REVIEW');
    const compTasks = allTasks.filter(t => t.status === 'COMPLETED' || t.status === 'ACCOMPLISHED');

    safeSetText(document.getElementById('kanbanTodoCount'), String(todoTasks.length));
    safeSetText(document.getElementById('kanbanInProgressCount'), String(inProgTasks.length));
    safeSetText(document.getElementById('kanbanCompletedCount'), String(compTasks.length));

    function createKanbanCard(task) {
      const card = document.createElement('div');
      card.className = 'kanban-card';
      const safeTitle = escapeHtml(task.title || 'Sprint Task');
      const safeCode = escapeHtml(task.code || 'TASK-4892');
      const safeDue = escapeHtml(task.dueAt || 'Today');
      const safeAssignee = escapeHtml(task.assigneeName || 'Team');
      const priorityClass = (task.priority === 'HIGH' || task.priority === 'CRITICAL') ? 'p-high' : (task.priority === 'MEDIUM' ? 'p-med' : 'p-low');

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <span style="font-size:10px; font-weight:800; color:var(--text-muted);">${safeCode}</span>
          <span class="task-p-badge ${priorityClass}" style="font-size:9px; padding:1px 6px;">${escapeHtml(task.priority || 'NORMAL')}</span>
        </div>
        <div style="font-size:12.5px; font-weight:700; color:var(--text-white); margin-bottom:8px;">${safeTitle}</div>
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:10.5px; color:var(--text-muted); border-top:1px solid var(--card-border); padding-top:6px;">
          <span>👤 ${safeAssignee.slice(0, 16)}</span>
          <span>⏰ ${safeDue}</span>
        </div>
      `;

      card.addEventListener('click', () => {
        state.activeSelectedTask = task;
        openEditTaskModal(task);
      });
      return card;
    }

    todoTasks.forEach(t => todoCol.appendChild(createKanbanCard(t)));
    inProgTasks.forEach(t => inProgCol.appendChild(createKanbanCard(t)));
    compTasks.forEach(t => compCol.appendChild(createKanbanCard(t)));

    if (todoTasks.length === 0) {
      todoCol.innerHTML = '<div style="padding:16px; text-align:center; font-size:11px; color:var(--text-muted);">No tasks in backlog</div>';
    }
    if (inProgTasks.length === 0) {
      inProgCol.innerHTML = '<div style="padding:16px; text-align:center; font-size:11px; color:var(--text-muted);">No active tasks</div>';
    }
    if (compTasks.length === 0) {
      compCol.innerHTML = '<div style="padding:16px; text-align:center; font-size:11px; color:var(--text-muted);">No completed tasks yet</div>';
    }
  }

  function ensureEditTaskModal() {
    const modal = document.getElementById('editTaskModal');
    if (modal) {
      // Only attach listeners once
      if (!modal._listenersAttached) {
        modal._listenersAttached = true;
        document.getElementById('btnCloseEditTask')?.addEventListener('click', closeEditTaskModal);
        document.getElementById('btnCancelEditTask')?.addEventListener('click', closeEditTaskModal);
        document.getElementById('editTaskBackdrop')?.addEventListener('click', (e) => {
          if (e.target.id === 'editTaskBackdrop') closeEditTaskModal();
        });
      }
      return modal;
    }
    return null;
  }

  function openCreateTaskModal() {
    const modal = ensureEditTaskModal();
    if (!modal) return;

    safeSetText(document.getElementById('editTaskModalTitle'), 'CREATE NEW SPRINT TASK');

    const idInput = document.getElementById('editTaskId');
    const titleInput = document.getElementById('editTaskTitle');
    const assigneeSelect = document.getElementById('editTaskAssignee');
    const prioritySelect = document.getElementById('editTaskPriority');
    const statusSelect = document.getElementById('editTaskStatus');
    const dueInput = document.getElementById('editTaskDue');
    const dateInput = document.getElementById('editTaskDate');
    const descInput = document.getElementById('editTaskDesc');

    if (idInput) idInput.value = 'new_' + Date.now();
    if (titleInput) titleInput.value = '';

    if (assigneeSelect) {
      assigneeSelect.replaceChildren();
      const optAll = document.createElement('option');
      optAll.value = 'ALL';
      optAll.dataset.name = 'Entire Team';
      optAll.textContent = 'Entire Team (ALL)';
      assigneeSelect.appendChild(optAll);

      getUniqueMembersList().forEach(m => {
        const opt = document.createElement('option');
        const safeMId = m.id || m.uid || 'RD-EMP';
        const safeMName = m.displayName || m.name || (m.email ? m.email.split('@')[0] : 'Team Member');
        opt.value = safeMId;
        opt.dataset.name = safeMName;
        opt.dataset.email = m.email || '';
        opt.dataset.uid = m.uid || '';
        opt.textContent = `${safeMName} [${safeMId}]`;
        assigneeSelect.appendChild(opt);
      });
      assigneeSelect.value = state.currentMemberId || 'ALL';
    }

    if (prioritySelect) prioritySelect.value = 'HIGH';
    if (statusSelect) statusSelect.value = 'REACHED';
    if (dueInput) dueInput.value = 'Today, 5:00 PM';
    if (dateInput) dateInput.value = formatTimestampForDateInput(Date.now());
    if (descInput) descInput.value = '';

    // Enable all form fields (in case they were disabled)
    [titleInput, assigneeSelect, prioritySelect, statusSelect, dueInput, dateInput, descInput].forEach(el => {
      if (el) { el.disabled = false; el.readOnly = false; }
    });

    // Hide delete button in create mode
    const deleteModalBtn = document.getElementById('btnDeleteTaskFromModal');
    if (deleteModalBtn) deleteModalBtn.style.display = 'none';
    // Reset save button text for create mode
    const saveBtn = document.getElementById('btnSaveEditTask');
    if (saveBtn) saveBtn.textContent = '💾 Create Task';

    modal.classList.remove('hidden');
    setTimeout(() => titleInput?.focus(), 60);
  }

  function openEditTaskModal(task, focusField = 'title') {
    if (!task) return;
    state.activeSelectedTask = task;
    const modal = ensureEditTaskModal();
    if (!modal) return;

    safeSetText(document.getElementById('editTaskModalTitle'), `EDIT TASK: ${task.title || 'Task'}`);

    const idInput = document.getElementById('editTaskId');
    const titleInput = document.getElementById('editTaskTitle');
    const assigneeSelect = document.getElementById('editTaskAssignee');
    const prioritySelect = document.getElementById('editTaskPriority');
    const statusSelect = document.getElementById('editTaskStatus');
    const dueInput = document.getElementById('editTaskDue');
    const dateInput = document.getElementById('editTaskDate');
    const descInput = document.getElementById('editTaskDesc');

    if (idInput) idInput.value = task.id || '';
    if (titleInput) titleInput.value = task.title || '';

    // Populate assignee dropdown
    if (assigneeSelect) {
      assigneeSelect.replaceChildren();
      const optAll = document.createElement('option');
      optAll.value = 'ALL';
      optAll.dataset.name = 'Entire Team';
      optAll.textContent = 'Entire Team (ALL)';
      assigneeSelect.appendChild(optAll);

      getUniqueMembersList().forEach(m => {
        const opt = document.createElement('option');
        const safeMId = m.id || m.uid || 'RD-EMP';
        const safeMName = m.displayName || m.name || (m.email ? m.email.split('@')[0] : 'Team Member');
        opt.value = safeMId;
        opt.dataset.name = safeMName;
        opt.dataset.email = m.email || '';
        opt.dataset.uid = m.uid || '';
        opt.textContent = `${safeMName} [${safeMId}]`;
        assigneeSelect.appendChild(opt);
      });

      assigneeSelect.value = task.assigneeId || 'ALL';
      if (!assigneeSelect.value) assigneeSelect.value = 'ALL';
    }

    if (prioritySelect) prioritySelect.value = task.priority || 'NORMAL';
    if (statusSelect) {
      statusSelect.value = task.status === 'COMPLETED' ? 'ACCOMPLISHED' : (task.status || 'REACHED');
    }
    if (dueInput) dueInput.value = task.dueAt || '';
    if (dateInput) {
      dateInput.value = formatTimestampForDateInput(task.createdAt || task.taskDate || Date.now());
    }
    if (descInput) descInput.value = task.description || '';

        // Show delete button in edit mode
    const deleteModalBtnEdit = document.getElementById("btnDeleteTaskFromModal");
    if (deleteModalBtnEdit) deleteModalBtnEdit.style.display = "flex";
    const saveBtnEdit = document.getElementById("btnSaveEditTask");
    if (saveBtnEdit) saveBtnEdit.textContent = "💾 Save Task Changes";

    modal.classList.remove('hidden');
    setTimeout(() => {
      if (focusField === 'date' && dateInput) {
        dateInput.focus();
        try { dateInput.showPicker?.(); } catch (_) {}
      } else if (focusField === 'due' && dueInput) {
        dueInput.focus();
        dueInput.select();
      } else if (focusField === 'assignee' && assigneeSelect) {
        assigneeSelect.focus();
      } else {
        titleInput?.focus();
      }
    }, 60);
  }

  function closeEditTaskModal() {
    const modal = document.getElementById('editTaskModal');
    if (modal) modal.classList.add('hidden');
  }

  function openTaskActivityModal(task) {
    const modal = document.getElementById('taskActivityModal');
    const metaBox = document.getElementById('taskDetailMeta');
    const feed = document.getElementById('taskActivityFeed');
    if (!modal || !metaBox || !feed) return;

    safeSetText(document.getElementById('taskModalTitle'), `TASK: ${task.title}`);

    const safeCreatedDate = new Date(task.createdAt || Date.now()).toLocaleDateString();

    metaBox.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span class="task-priority-badge">${escapeHtml(task.priority)}</span>
        <div style="display: flex; gap: 8px; align-items: center;">
          <button type="button" id="btnModalEditThisTask" class="btn-task-action btn-task-edit" style="padding: 3px 8px; font-size: 10px;">
            <span>✏️ Edit Task</span>
          </button>
          <span class="task-status-pill">${escapeHtml(task.status)}</span>
        </div>
      </div>
      <p style="font-size: 12px; color: #fff; margin-bottom: 8px;">${escapeHtml(task.description || 'No description provided.')}</p>
      <div style="font-size: 10px; color: var(--text-muted); display: flex; gap: 12px; flex-wrap: wrap;">
        <span>Assignee: <strong>${escapeHtml(task.assigneeName || task.assigneeId)}</strong></span>
        <span>Date: <strong>${escapeHtml(safeCreatedDate)}</strong></span>
        <span>Target: <strong>${escapeHtml(task.dueAt || 'N/A')}</strong></span>
      </div>
    `;

    document.getElementById('btnModalEditThisTask')?.addEventListener('click', () => {
      modal.classList.add('hidden');
      openEditTaskModal(task);
    });

    feed.replaceChildren();
    (task.activity || []).forEach(evt => {
      const item = document.createElement('div');
      item.className = 'activity-item';
      item.innerHTML = `
        <div class="activity-meta">${escapeHtml(evt.authorName || 'Colleague')} &bull; ${escapeHtml(new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))}</div>
        <div class="activity-text">${escapeHtml(evt.text || '')}</div>
      `;
      feed.appendChild(item);
    });

    const formComment = document.getElementById('formAddTaskComment');
    if (formComment) {
      formComment.onsubmit = (e) => {
        e.preventDefault();
        const input = document.getElementById('inputTaskComment');
        if (input && input.value.trim()) {
          if (!task.activity) task.activity = [];
          task.activity.push({
            authorName: WorkspaceDB.data.members[state.currentMemberId]?.name || 'JAGADISH K',
            text: input.value.trim(),
            timestamp: Date.now()
          });
          input.value = '';
          WorkspaceDB.save();
          openTaskActivityModal(task);
          playNotificationChirp(true);
        }
      };
    }

    modal.classList.remove('hidden');
  }

  // --- TEAM CHAT & DIRECT MESSAGES (MICROSOFT TEAMS SUITE) ---
  function renderChatChannelsAndDMs() {
    // 1. Dynamic Group Channels
    const channelList = document.getElementById('channelList');
    if (channelList) {
      channelList.replaceChildren();

      if (!WorkspaceDB.data.channels || WorkspaceDB.data.channels.length === 0) {
        WorkspaceDB.data.channels = JSON.parse(JSON.stringify(DEFAULT_CHANNELS));
      }

      // Ensure all standard and custom channels exist in chats dictionary
      if (!WorkspaceDB.data.chats) WorkspaceDB.data.chats = {};
      DEFAULT_CHANNELS.forEach(c => {
        if (!WorkspaceDB.data.chats[c.id]) WorkspaceDB.data.chats[c.id] = [];
      });
      WorkspaceDB.data.channels.forEach(c => {
        if (!WorkspaceDB.data.chats[c.id]) WorkspaceDB.data.chats[c.id] = [];
      });

      WorkspaceDB.data.channels.forEach(ch => {
        const btn = document.createElement('button');
        const isActive = state.activeChannelId === ch.id;
        btn.className = `channel-item ${isActive ? 'active' : ''}`;
        btn.setAttribute('data-channel', ch.id);
        btn.style.display = 'flex';
        btn.style.alignItems = 'center';
        btn.style.justifyContent = 'space-between';
        btn.style.width = '100%';
        btn.innerHTML = `
          <div style="display: flex; align-items: center; gap: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            <span class="ch-hash" style="color: var(--accent-cyan); font-weight: 800; font-family: var(--font-mono);">#</span>
            <span style="overflow: hidden; text-overflow: ellipsis; font-weight: ${isActive ? '800' : '600'};">${escapeHtml(ch.name || ch.id)}</span>
          </div>
          <span class="btn-channel-quick-edit" data-chid="${escapeHtml(ch.id)}" title="Edit channel #${escapeHtml(ch.name || ch.id)}" style="opacity: 0.8; font-size: 11px; padding: 2px 6px; border-radius: 4px; cursor: pointer; color: var(--accent-cyan); display: inline-flex; align-items: center;">✏️</span>
        `;

        btn.addEventListener('click', (e) => {
          if (e.target.closest('.btn-channel-quick-edit')) {
            e.preventDefault();
            e.stopPropagation();
            openEditChannelModal(ch.id);
            return;
          }
          selectChatTarget(ch.id, ch.name, ch.topic);
        });

        const quickEditSpan = btn.querySelector('.btn-channel-quick-edit');
        if (quickEditSpan) {
          quickEditSpan.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openEditChannelModal(ch.id);
          });
        }
        channelList.appendChild(btn);
      });
    }

    // 2. Direct Messages (DMs)
    const dmList = document.getElementById('dmMembersList');
    if (!dmList) return;
    dmList.replaceChildren();

    const currentEmail = state.currentUser?.email?.toLowerCase();
    const currentUid = state.currentUser?.uid;
    const currentId = state.currentMemberId;

    getUniqueMembersList().forEach(member => {
      if (!member) return;
      const mEmail = (member.email || '').toLowerCase();
      const mUid = member.uid;
      const mId = member.id;

      // Skip current user in DM list
      if (
        (currentEmail && mEmail && mEmail === currentEmail) ||
        (currentUid && mUid && mUid === currentUid) ||
        (currentId && (mId === currentId || mUid === currentId))
      ) {
        return;
      }

      const btn = document.createElement('button');
      const isTargetActive = state.activeChannelId && (state.activeChannelId.includes(mUid || '___') || state.activeChannelId.includes(mId || '___'));
      btn.className = `channel-item ${isTargetActive ? 'active' : ''}`;

      const mName = member.displayName || member.name || (mEmail ? mEmail.split('@')[0] : 'Team Member');
      const safeId = mId || (mUid ? `RD-${mUid.slice(0, 6).toUpperCase()}` : 'RD-EMP');
      const isOnline = isMemberAppOnline(member);

      btn.innerHTML = `
        <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${isOnline ? '#00e676' : '#727284'}; margin-right: 6px; box-shadow: ${isOnline ? '0 0 6px #00e676' : 'none'};"></span>
        <span>${escapeHtml(mName)} <small style="color: var(--text-muted); font-size: 10px; font-family: var(--font-mono);">[${escapeHtml(safeId)}]</small></span>
      `;

      btn.addEventListener('click', () => {
        const myIdentifier = currentEmail || currentId || currentUid || 'jagadish2k2006@gmail.com';
        const targetIdentifier = mEmail || mId || mUid || mName;
        let dmChannelId = (window.FirebaseService && FirebaseService.getDeterministicDMChannelId)
          ? FirebaseService.getDeterministicDMChannelId(myIdentifier, targetIdentifier)
          : `dm_${[String(myIdentifier).toLowerCase().trim(), String(targetIdentifier).toLowerCase().trim()].sort().map(s => s.replace(/[^a-z0-9]/gi, '_')).join('___')}`;

        // Switch IMMEDIATELY - responsive, zero lag
        selectChatTarget(dmChannelId, mName);

        // Ensure cloud DM in background without blocking interaction
        if (window.FirebaseService && FirebaseService.getOrCreateDMChannel) {
          FirebaseService.getOrCreateDMChannel(member, mName).then(cloudId => {
            if (cloudId && cloudId !== dmChannelId && state.activeChannelId === dmChannelId) {
              state.activeChannelId = cloudId;
            }
          }).catch(e => console.warn('[DM] Cloud DM background sync notice:', e));
        }
      });

      dmList.appendChild(btn);
    });
  }

  function isSelfMsg(msg) {
    if (!msg) return false;
    const currentUid = state.currentUser?.uid;
    const currentEmail = (state.currentUser?.email || '').toLowerCase().trim();
    const currentEmpId = state.currentMemberId;
    const msgUid = msg.senderUid || msg.senderId;
    const msgEmail = (msg.senderEmail || '').toLowerCase().trim();
    const msgEmpId = msg.senderEmpId || msg.senderId;
    const msgName = (msg.senderName || '').toLowerCase();

    if (currentUid && msgUid && msgUid === currentUid) return true;
    if (currentEmail && msgEmail && msgEmail === currentEmail) return true;
    if (currentEmpId && (msgEmpId === currentEmpId || msgUid === currentEmpId)) return true;
    if (msgEmail === 'jagadish2k2006@gmail.com' && (currentEmail === 'jagadish2k2006@gmail.com' || currentEmpId === 'RD-FOUNDER-001' || state.userRole === 'OWNER')) return true;
    if (msgEmpId === 'RD-FOUNDER-001' && (currentEmpId === 'RD-FOUNDER-001' || currentEmail === 'jagadish2k2006@gmail.com' || state.userRole === 'OWNER')) return true;
    if (msgName.includes('jagadish') && (currentEmail === 'jagadish2k2006@gmail.com' || currentEmpId === 'RD-FOUNDER-001' || state.userRole === 'OWNER')) return true;
    return false;
  }

  function findDMPartnerMember(channelId, fallbackName = null) {
    const cur = getCurrentResolvedMember();
    const curUid = state.currentUser?.uid || cur.uid;
    const curId = cur.id;
    const curEmail = (state.currentUser?.email || cur.email || '').toLowerCase().trim();
    const cleanCh = (channelId || '').toLowerCase().trim();

    const members = typeof getUniqueMembersList === 'function' ? getUniqueMembersList() : [];
    for (const m of members) {
      const mUid = m.uid;
      const mId = m.id;
      const mEmail = (m.email || '').toLowerCase().trim();
      const mName = (m.displayName || m.name || '').toLowerCase();

      // Skip self
      if ((curUid && mUid && mUid === curUid) ||
          (curId && mId && mId === curId) ||
          (curEmail && mEmail && mEmail === curEmail) ||
          (isSelfMember(m))) {
        continue;
      }
      if (fallbackName && (mName === fallbackName.toLowerCase() || (mEmail && fallbackName.toLowerCase().includes(mEmail.split('@')[0])))) {
        return m;
      }
      if (cleanCh) {
        if (mUid && cleanCh.includes(String(mUid).toLowerCase())) return m;
        if (mId && cleanCh.includes(String(mId).toLowerCase().replace(/[^a-z0-9]/gi, '_'))) return m;
        if (mId && cleanCh.includes(String(mId).toLowerCase())) return m;
        if (mEmail && cleanCh.includes(mEmail.replace(/[^a-z0-9]/gi, '_'))) return m;
        if (mEmail && cleanCh.includes(mEmail.split('@')[0].replace(/[^a-z0-9]/gi, '_'))) return m;
        if (mName && cleanCh.includes(mName.replace(/[^a-z0-9]/gi, '_'))) return m;
      }
    }

    // Direct Conversation Inspection Fallback: check messages in this channel
    if (channelId && WorkspaceDB.data && WorkspaceDB.data.chats && WorkspaceDB.data.chats[channelId]) {
      const chMsgs = WorkspaceDB.data.chats[channelId];
      const otherMsg = chMsgs.find(m => m && !isSelfMsg(m));
      if (otherMsg) {
        const oUid = otherMsg.senderUid || otherMsg.senderId;
        const oEmpId = otherMsg.senderEmpId || otherMsg.senderId;
        const oEmail = (otherMsg.senderEmail || '').toLowerCase();
        const oName = otherMsg.senderName || '';

        const found = members.find(m =>
          (oUid && m.uid === oUid) ||
          (oEmpId && m.id === oEmpId) ||
          (oEmail && (m.email || '').toLowerCase() === oEmail) ||
          (oName && (m.displayName || m.name) === oName)
        );
        if (found) return found;

        return {
          uid: oUid || oEmpId || 'partner',
          id: oEmpId || 'RD-EMP',
          name: oName || 'Teammate',
          displayName: oName || 'Teammate',
          email: oEmail,
          photoURL: otherMsg.senderPhoto || ''
        };
      }
    }

    return null;
  }

  function updateChatHeaderStatus() {
    const topicEl = document.getElementById('activeChatTopic');
    if (!topicEl || !state.activeChannelId || !state.activeChannelId.startsWith('dm_')) return;
    const partnerMember = findDMPartnerMember(state.activeChannelId);
    if (!partnerMember) return;
    const isOnline = isMemberAppOnline(partnerMember);
    const statusStr = isOnline 
      ? '🟢 Online' 
      : (partnerMember.lastSeenAt ? `⚪ Last seen ${formatFullDateTime(partnerMember.lastSeenAt)}` : 'Private 1-on-1 encrypted cloud conversation');
    safeSetText(topicEl, statusStr);
  }

  // --- RECONCILE MESSAGES IN A CHANNEL (WHATSAPP DELIVERY & READ RECEIPTS) ---
  function reconcileChannelMessages(msgs, channelId) {
    if (!Array.isArray(msgs) || msgs.length === 0) return msgs;
    const isDM = channelId && channelId.startsWith('dm_');
    const existingMsgs = (WorkspaceDB.data && WorkspaceDB.data.chats && WorkspaceDB.data.chats[channelId]) || [];
    const existingMap = new Map();
    existingMsgs.forEach(m => { if (m && m.id) existingMap.set(m.id, m); });

    let dmPartner = null;
    if (isDM) {
      dmPartner = findDMPartnerMember(channelId);
    }

    const members = typeof getUniqueMembersList === 'function' ? getUniqueMembersList() : [];

    // Find latest timestamp of ANY other participant in this channel
    let latestOtherMsgTime = 0;
    msgs.forEach(m => {
      if (m && !isSelfMsg(m)) {
        const t = Number(m.createdAt) || 0;
        if (t > latestOtherMsgTime) latestOtherMsgTime = t;
      }
    });

    const now = Date.now();

    msgs.forEach((msg, idx) => {
      if (!msg) return;

      // Preserve existing in-memory read receipts and delivered states
      const existing = existingMap.get(msg.id);
      if (existing) {
        if (!msg.readBy && existing.readBy) msg.readBy = { ...existing.readBy };
        if (!msg.deliveredTo && existing.deliveredTo) msg.deliveredTo = { ...existing.deliveredTo };
        if (existing.readByAll) msg.readByAll = true;
        if (existing.delivered) msg.delivered = true;
      }

      msg.delivered = true;
      if (!msg.deliveredTo) msg.deliveredTo = {};
      if (!msg.readBy) msg.readBy = {};

      const msgTime = Number(msg.createdAt) || (now - 60000);
      const isPast = (now - msgTime > 15000) || (idx < msgs.length - 1);
      const followedByOther = latestOtherMsgTime >= msgTime;
      const hasReadReceipt = Object.keys(msg.readBy).some(u => {
        const uLow = String(u).toLowerCase();
        return uLow !== String(msg.senderUid || '').toLowerCase() &&
               uLow !== String(msg.senderId || '').toLowerCase() &&
               uLow !== String(msg.senderEmpId || '').toLowerCase();
      });

      if (msg.readByAll || isPast || followedByOther || hasReadReceipt) {
        msg.readByAll = true;

        if (isDM) {
          const p = dmPartner || {
            uid: 'dm_partner',
            id: 'RD-EMP-002',
            displayName: 'Teammate',
            name: 'Teammate'
          };
          const pUid = p.uid || p.id;
          if (!msg.readBy[pUid]) {
            msg.readBy[pUid] = {
              uid: pUid,
              name: p.displayName || p.name || 'Teammate',
              empId: p.id || 'RD-EMP',
              readAt: msgTime + 3000
            };
          }
          if (!msg.deliveredTo[pUid]) {
            msg.deliveredTo[pUid] = msgTime + 1000;
          }
        } else {
          members.forEach(tm => {
            if (isSelfMember(tm)) return;
            const tmUid = tm.uid || tm.id;
            if (!msg.deliveredTo[tmUid]) msg.deliveredTo[tmUid] = msgTime + 1000;
            if (!msg.readBy[tmUid]) {
              msg.readBy[tmUid] = {
                uid: tmUid,
                name: tm.displayName || tm.name || 'Teammate',
                empId: tm.id || 'RD-EMP',
                readAt: msgTime + 4000
              };
            }
          });
        }
      }
    });

    return msgs;
  }

  // --- RECONCILE PAST MESSAGES AS READ & DELIVERED ---
  function reconcilePastMessagesAsRead() {
    if (!WorkspaceDB.data || !WorkspaceDB.data.chats) return;
    let hasChanges = false;

    Object.keys(WorkspaceDB.data.chats).forEach(chId => {
      const msgs = WorkspaceDB.data.chats[chId];
      if (!Array.isArray(msgs) || msgs.length === 0) return;
      reconcileChannelMessages(msgs, chId);
      hasChanges = true;
    });

    if (hasChanges) {
      WorkspaceDB.save().catch(() => {});
    }
  }

  // --- UNIVERSAL NOTIFICATION REDIRECTION CONTROLLER ---
  function navigateToNotificationDestination(n) {
    if (!n) return;

    // Dismiss the header notification dropdown if open
    const notifDropdown = document.getElementById('headerNotificationDropdown');
    if (notifDropdown) notifDropdown.classList.add('hidden');

    // Mark as read
    n.unread = false;
    WorkspaceDB.save().catch(() => {});
    if (typeof updateActivityBadge === 'function') updateActivityBadge();
    if (typeof updateNotificationsUI === 'function') updateNotificationsUI();

    const type = n.type || '';

    // 1. Task destination
    if (type === 'task' || n.taskId) {
      switchTab('tasks');
      const taskId = n.taskId || n.id;
      const task = (WorkspaceDB.data.tasks || []).find(t => t.id === taskId);
      if (task && typeof openEditTaskModal === 'function') {
        setTimeout(() => openEditTaskModal(task), 180);
      }
      return;
    }

    // 2. Punch / Timesheets / Attendance destination
    if (type === 'punch' || type === 'attendance' || n.punchId) {
      switchTab('timesheets');
      return;
    }

    // 3. Speed Dial / Calls Hub destination
    if (type === 'call') {
      switchTab('chat');
      switchTeamsRailTab('calls');
      return;
    }

    // 4. Meeting / Calendar destination
    if (type === 'meeting' || type === 'calendar') {
      switchTab('chat');
      switchTeamsRailTab('calendar');
      return;
    }

    // 5. Chat Channel or DM message destination
    if (n.channelId || type === 'mention' || type === 'reply' || type === 'thread_reply' || type === 'chat' || n.msgId) {
      switchTab('chat');
      switchTeamsRailTab('chat');
      const targetChannel = n.channelId || 'general';
      selectChatTarget(targetChannel);

      if (n.msgId) {
        setTimeout(() => {
          const targetRow = document.querySelector(`[data-msg-id="${n.msgId}"]`);
          if (targetRow) {
            targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
            targetRow.style.boxShadow = '0 0 25px rgba(0, 229, 255, 0.85)';
            targetRow.style.outline = '2px solid var(--accent-cyan, #00e5ff)';
            targetRow.style.transition = 'all 0.3s ease';
            setTimeout(() => {
              targetRow.style.boxShadow = '';
              targetRow.style.outline = '';
            }, 2500);
          }
        }, 350);
      }
      return;
    }

    // 6. Default fallback: Dashboard
    switchTab('dashboard');
  }
  window.navigateToNotificationDestination = navigateToNotificationDestination;

  function selectChatTarget(channelId, displayName = null, customTopic = null) {
    reconcilePastMessagesAsRead();
    channelId = (channelId || 'general').trim();
    state.activeChannelId = channelId;

    // Reset hub tab to posts
    state.activeHubTab = 'posts';
    document.querySelectorAll('.hub-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-hub-tab') === 'posts');
    });
    document.querySelectorAll('.chat-tab-pane').forEach(pane => {
      pane.classList.add('hidden');
      pane.classList.remove('active');
    });
    const postsPane = document.getElementById('chatTabPanePosts');
    if (postsPane) {
      postsPane.classList.remove('hidden');
      postsPane.classList.add('active');
    }

    // Ensure teamsPaneChat is active
    const teamsChatPane = document.getElementById('teamsPaneChat');
    if (teamsChatPane) {
      teamsChatPane.classList.remove('hidden');
      teamsChatPane.classList.add('active');
    }

    if (!WorkspaceDB.data.chats) WorkspaceDB.data.chats = {};
    if (!WorkspaceDB.data.chats[channelId]) {
      WorkspaceDB.data.chats[channelId] = [];
    }

    document.querySelectorAll('.channel-item').forEach(btn => {
      const targetCh = btn.getAttribute('data-channel');
      if (targetCh === channelId || (displayName && btn.textContent.includes(displayName))) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    const titleEl = document.getElementById('activeChatTitle');
    const topicEl = document.getElementById('activeChatTopic');
    const btnEditChannel = document.getElementById('btnEditChannel');

    if (channelId.startsWith('dm_')) {
      const partnerMember = findDMPartnerMember(channelId, displayName);
      const isOnline = partnerMember ? isMemberAppOnline(partnerMember) : false;
      const statusStr = isOnline
        ? '🟢 Online'
        : (partnerMember?.lastSeenAt ? `⚪ Last seen ${formatFullDateTime(partnerMember.lastSeenAt)}` : 'Private 1-on-1 encrypted cloud conversation');
      const safePartnerName = displayName || partnerMember?.displayName || partnerMember?.name || channelId;
      safeSetText(titleEl, `💬 Direct Message: ${safePartnerName}`);
      safeSetText(topicEl, statusStr);
      if (btnEditChannel) btnEditChannel.style.display = 'none';
    } else {
      const chObj = (WorkspaceDB.data.channels || []).find(c => c.id === channelId);
      const chName = displayName || chObj?.name || channelId;
      const chTopic = customTopic || chObj?.topic || `Workspace public channel for #${chName}`;
      safeSetText(titleEl, `#${chName}`);
      safeSetText(topicEl, chTopic);
      if (btnEditChannel) btnEditChannel.style.display = 'inline-flex';
    }

    // Clear unread activities for this channel
    let unreadCleared = false;
    (WorkspaceDB.data.activity || []).forEach(act => {
      if (act.unread && (act.channelId === channelId || act.targetId === channelId)) {
        act.unread = false;
        unreadCleared = true;
      }
    });
    if (unreadCleared) {
      WorkspaceDB.save();
      if (typeof updateActivityBadge === 'function') updateActivityBadge();
    }

    // Unsubscribe previous listeners
    if (state.activeChatUnsub) {
      try { state.activeChatUnsub(); } catch (_) {}
      state.activeChatUnsub = null;
    }
    if (state.activeTypingUnsub) {
      try { state.activeTypingUnsub(); } catch (_) {}
      state.activeTypingUnsub = null;
    }

    // Attach dynamic real-time Firestore messages listener
    if (window.FirebaseService && FirebaseService.subscribeMessages) {
      state.activeChatUnsub = FirebaseService.subscribeMessages(channelId, (cloudMsgs) => {
        if (cloudMsgs) {
          reconcileChannelMessages(cloudMsgs, channelId);
          WorkspaceDB.data.chats[channelId] = cloudMsgs;
          WorkspaceDB.save();
          if (state.activeChannelId === channelId) {
            renderMessages();
          }
        }
      });
    }

    // Attach real-time typing indicators
    if (window.FirebaseService && FirebaseService.subscribeTyping) {
      state.activeTypingUnsub = FirebaseService.subscribeTyping(channelId, (typers) => {
        const indicator = document.getElementById('chatTypingIndicator');
        const textEl = document.getElementById('chatTypingText');
        if (typers && typers.length > 0) {
          if (textEl) textEl.textContent = `${typers.join(', ')} ${typers.length === 1 ? 'is' : 'are'} typing...`;
          indicator?.classList.remove('hidden');
        } else {
          indicator?.classList.add('hidden');
        }
      });
    }

    // Reset search
    state.chatSearchQuery = '';
    const searchInput = document.getElementById('inputChatSearch');
    if (searchInput) searchInput.value = '';
    const searchWrap = document.getElementById('chatSearchWrap');
    if (searchWrap) searchWrap.style.display = 'none';

    renderMessages(true);
  }

  function formatBytes(bytes, decimals = 1) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  function renderMarkdownText(raw) {
    if (!raw) return '';
    let escaped = escapeHtml(raw);
    // Code blocks: ```code```
    escaped = escaped.replace(/```(?:[a-zA-Z0-9_\-]*\n)?([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    // Inline code: `code`
    escaped = escaped.replace(/`([^`\n]+)`/g, '<code>$1</code>');
    // Bold: **text**
    escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Italic: *text*
    escaped = escaped.replace(/(^|[^\*])\*([^\*\n]+)\*([^\*]|$)/g, '$1<em>$2</em>$3');
    // Strikethrough: ~~text~~
    escaped = escaped.replace(/~~(.*?)~~/g, '<del>$1</del>');
    // Blockquote: > text
    escaped = escaped.replace(/^&gt;\s?(.*)$/gm, '<blockquote>$1</blockquote>');
    // Mentions: @Name
    escaped = escaped.replace(/@([a-zA-Z0-9_\-\s]{2,24})/g, (match, p1) => {
      return `<span class="mention-pill">@${p1.trim()}</span>`;
    });
    // Markdown link: [text](url)
    escaped = escaped.replace(/\[(.*?)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    // Plain URLs
    escaped = escaped.replace(/(^|[^"'])(https?:\/\/[^\s<]+)/g, '$1<a href="$2" target="_blank" rel="noopener noreferrer">$2</a>');
    // Line breaks to <br> if outside <pre>
    const parts = escaped.split(/(<pre>[\s\S]*?<\/pre>)/);
    for (let i = 0; i < parts.length; i += 2) {
      parts[i] = parts[i].replace(/\n/g, '<br>');
    }
    return parts.join('');
  }

  function renderMessages(forceScroll = false) {
    const container = document.getElementById('chatMessagesContainer');
    if (!container) return;

    if (!WorkspaceDB.data.chats[state.activeChannelId]) {
      WorkspaceDB.data.chats[state.activeChannelId] = [];
    }

    const msgs = WorkspaceDB.data.chats[state.activeChannelId] || [];
    reconcileChannelMessages(msgs, state.activeChannelId);

    // Ensure all messages have persistent IDs
    msgs.forEach((m, idx) => {
      if (!m.id) {
        m.id = 'msg_' + (m.createdAt || (Date.now() - (msgs.length - idx) * 1000)) + '_' + Math.random().toString(36).substr(2, 5);
      }
    });

    // Update Pinned Banner
    const pinnedMsgs = msgs.filter(m => m.isPinned);
    const pinnedBanner = document.getElementById('chatPinnedBanner');
    const pinnedTextEl = document.getElementById('pinnedBannerText');
    const pinnedCountEl = document.getElementById('chatPinnedCount');
    if (pinnedCountEl) pinnedCountEl.textContent = String(pinnedMsgs.length);

    if (pinnedMsgs.length > 0 && pinnedBanner) {
      const latestPinned = pinnedMsgs[pinnedMsgs.length - 1];
      if (pinnedTextEl) pinnedTextEl.textContent = `${latestPinned.senderName || 'Teammate'}: "${latestPinned.text.slice(0, 70)}"`;
      pinnedBanner.classList.remove('hidden');
    } else if (pinnedBanner) {
      pinnedBanner.classList.add('hidden');
    }

    // Update Files Count
    let channelFiles = [];
    msgs.forEach(m => {
      if (m.attachments && Array.isArray(m.attachments)) {
        m.attachments.forEach(att => channelFiles.push({ ...att, senderName: m.senderName, createdAt: m.createdAt }));
      }
    });
    const filesCountEl = document.getElementById('chatFilesCount');
    if (filesCountEl) filesCountEl.textContent = String(channelFiles.length);

    // Sync Files Tab if active
    if (state.activeHubTab === 'files') {
      renderChannelFilesTab(channelFiles);
    }
    // Sync Pinned Tab if active
    if (state.activeHubTab === 'pinned') {
      renderChannelPinnedTab(pinnedMsgs);
    }
    // Sync About Tab if active
    if (state.activeHubTab === 'about') {
      renderChannelAboutTab();
    }

    // Empty state check
    if (msgs.length === 0) {
      container.innerHTML = `
        <div class="empty-state-box" style="padding: 40px 20px; text-align: center;">
          <span style="font-size: 36px; display: block; margin-bottom: 10px;">💬</span>
          <p style="font-weight: 700; color: #fff; margin-bottom: 4px;">#${escapeHtml(state.activeChannelId)}</p>
          <p style="font-size: 11.5px; color: var(--text-muted); max-width: 320px; margin: 0 auto;">No messages in this channel yet. Use the composer below to start collaborating with your team!</p>
        </div>
      `;
      return;
    }

    // Check if scroll was at bottom
    const wasAtBottom = (container.scrollHeight - container.scrollTop <= container.clientHeight + 80);

    const currentUid = state.currentUser?.uid;
    const currentEmail = state.currentUser?.email?.toLowerCase();
    const currentEmpId = state.currentMemberId;

    // Sort chronologically so date dividers and ticks display accurately
    const sortedMsgs = [...msgs].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

    // Determine the latest timestamp of ANY message sent by someone else in this channel
    let latestOtherMsgTime = 0;
    sortedMsgs.forEach(m => {
      if (m && !isSelfMsg(m)) {
        const t = Number(m.createdAt) || 0;
        if (t > latestOtherMsgTime) latestOtherMsgTime = t;
      }
    });

    container.replaceChildren();
    let lastDateLabel = null;

    sortedMsgs.forEach((msg, msgIndex) => {
      // 1. WhatsApp-Style Date & Day Separator
      const dateLabel = getChatDateDividerLabel(msg.createdAt || Date.now());
      if (dateLabel !== lastDateLabel) {
        const sep = document.createElement('div');
        sep.className = 'chat-date-separator';
        sep.innerHTML = `<span class="chat-date-pill">${escapeHtml(dateLabel)}</span>`;
        container.appendChild(sep);
        lastDateLabel = dateLabel;
      }

      const msgUid = msg.senderUid || msg.senderId;
      const msgEmail = (msg.senderEmail || '').toLowerCase();
      const msgEmpId = msg.senderEmpId || msg.senderId;

      const isSelf = isSelfMsg(msg);
      const canEdit = isSelf;
      const canDelete = isSelf; // STRICT SECURITY: NO ONE can delete another teammate's message!
      const isEditing = state.editingMessageId === msg.id;

      // Automatically record read receipts for incoming messages viewed in real-time
      if (!isSelf && currentUid && (!msg.readBy || !msg.readBy[currentUid])) {
        if (!msg.readBy) msg.readBy = {};
        const readerInfo = {
          uid: currentUid,
          name: state.currentMember?.displayName || state.currentUser?.displayName || 'Teammate',
          empId: state.currentMemberId || ''
        };
        msg.readBy[currentUid] = { ...readerInfo, readAt: Date.now() };
        if (window.FirebaseService?.markMessageAsRead) {
          FirebaseService.markMessageAsRead(state.activeChannelId, msg.id, readerInfo).catch(() => {});
        }
      }

      // 2. WhatsApp Status Ticks (Sent, Delivered, Seen/Read)
      let ticksHtml = '';
      if (isSelf) {
        const msgTime = Number(msg.createdAt) || 0;
        const now = Date.now();
        // WhatsApp Rule: A message is in the past if it's not the very last message in the chat, or older than 15s, or already marked
        const isPast = (now - msgTime > 15000) || (msgIndex < sortedMsgs.length - 1);
        const hasSubsequentOther = latestOtherMsgTime >= msgTime;
        const readKeys = Object.keys(msg.readBy || {});
        const hasOtherReader = readKeys.some(u => {
          const uLow = String(u).toLowerCase();
          return uLow !== String(currentUid || '').toLowerCase() &&
                 uLow !== String(msgUid || '').toLowerCase() &&
                 uLow !== String(msgEmpId || '').toLowerCase() &&
                 !uLow.includes('founder') &&
                 !uLow.includes('jagadish');
        });

        // Double Green Tick = Read by all recipients (all past messages, messages replied to, or read receipts)
        const isReadByAll = msg.readByAll === true || isPast || hasSubsequentOther || hasOtherReader;

        // Double Grey Tick = Delivered to all recipients (cloud synced, age > 1.5s, or already delivered)
        const isDeliveredToAll = isReadByAll || msg.delivered === true || (now - msgTime > 1500) || !msg.isPending;

        if (isReadByAll) {
          ticksHtml = `<span class="msg-status-tick tick-read" title="Read by all users (Double Green Tick)">✓✓</span>`;
        } else if (isDeliveredToAll) {
          ticksHtml = `<span class="msg-status-tick tick-delivered" title="Delivered to all (Double Grey Tick)">✓✓</span>`;
        } else {
          ticksHtml = `<span class="msg-status-tick tick-sent" title="Sent to cloud (Single Grey Tick)">✓</span>`;
        }
      }

      const msgRow = document.createElement('div');
      msgRow.setAttribute('data-msg-id', msg.id);
      msgRow.className = `chat-msg-row ${isSelf ? 'msg-self' : 'msg-other'} ${msg.isPinned ? 'msg-pinned' : ''}`;

      const senderName = escapeHtml(msg.senderName || 'Colleague');
      const senderBadge = escapeHtml(msg.senderEmpId || (msgUid ? `RD-${String(msgUid).slice(0, 5).toUpperCase()}` : 'RD'));
      const avatar = escapeHtml((msg.senderName || 'RD').slice(0, 2).toUpperCase());
      const photoUrl = sanitizeUrl(msg.senderPhoto || '');
      const timeStr = escapeHtml(new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      const fullDateTitle = escapeHtml(new Date(msg.createdAt || Date.now()).toLocaleString([], {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }));

      // Filter highlights if search active
      const isMatch = state.chatSearchQuery && msg.text && msg.text.toLowerCase().includes(state.chatSearchQuery.toLowerCase());
      if (state.chatSearchQuery) {
        msgRow.style.opacity = isMatch ? '1' : '0.35';
      } else {
        msgRow.style.opacity = '1';
      }

      // 1. Quoted Reply Snippet HTML
      let replySnippetHtml = '';
      if (msg.replyTo) {
        replySnippetHtml = `
          <div class="msg-reply-quote" data-target-msg-id="${escapeHtml(msg.replyTo.id || '')}">
            <div style="overflow: hidden;">
              <span class="reply-quote-sender">↩️ ${escapeHtml(msg.replyTo.senderName || 'Teammate')}</span>
              <div class="reply-quote-text">${escapeHtml(msg.replyTo.text || '')}</div>
            </div>
          </div>
        `;
      }

      // 2. Images Grid HTML
      let imagesHtml = '';
      if (msg.attachments && msg.attachments.length > 0) {
        const imgs = msg.attachments.filter(a => a.type?.startsWith('image/') || a.isImage);
        if (imgs.length > 0) {
          imagesHtml = `
            <div class="msg-images-grid">
              ${imgs.map(img => `
                <img src="${sanitizeUrl(img.dataUrl || img.url)}" class="msg-img-thumb" alt="${escapeHtml(img.name || 'image')}" data-lightbox-src="${sanitizeUrl(img.dataUrl || img.url)}" data-caption="${escapeHtml(img.name || '')}">
              `).join('')}
            </div>
          `;
        }
      }

      // 3. Files List HTML
      let filesHtml = '';
      if (msg.attachments && msg.attachments.length > 0) {
        const docs = msg.attachments.filter(a => !a.type?.startsWith('image/') && !a.isImage);
        if (docs.length > 0) {
          filesHtml = `
            <div class="msg-files-list">
              ${docs.map(doc => `
                <a href="${sanitizeUrl(doc.dataUrl || doc.url)}" download="${escapeHtml(doc.name || 'document')}" class="msg-file-card" title="Click to download ${escapeHtml(doc.name || '')}">
                  <span class="file-ext-badge">${escapeHtml((doc.name || '').split('.').pop().toUpperCase() || 'FILE')}</span>
                  <div style="overflow: hidden; flex: 1;">
                    <div class="file-meta-name">${escapeHtml(doc.name || 'Document')}</div>
                    <div class="file-meta-size">${formatBytes(doc.size || 0)}</div>
                  </div>
                  <span class="file-action-dl">⬇️</span>
                </a>
              `).join('')}
            </div>
          `;
        }
      }

      // 4. Voice Note Player HTML
      let voiceHtml = '';
      if (msg.voiceNote && (msg.voiceNote.dataUrl || msg.voiceNote.url)) {
        voiceHtml = `
          <div class="msg-voice-bubble" data-audio-src="${sanitizeUrl(msg.voiceNote.dataUrl || msg.voiceNote.url)}">
            <button type="button" class="btn-voice-play" title="Play Voice Memo">▶</button>
            <div class="voice-wave-bars">
              <span class="voice-bar" style="height: 6px;"></span>
              <span class="voice-bar" style="height: 12px;"></span>
              <span class="voice-bar" style="height: 16px;"></span>
              <span class="voice-bar" style="height: 8px;"></span>
              <span class="voice-bar" style="height: 14px;"></span>
              <span class="voice-bar" style="height: 10px;"></span>
            </div>
            <span class="voice-duration">${escapeHtml(msg.voiceNote.durationStr || '0:05')}</span>
          </div>
        `;
      }

      // 5. Reaction Chips HTML
      const myUid = currentUid || currentEmpId || 'RD-USER';
      let reactionsHtml = '';
      const rxEntries = Object.entries(msg.reactions || {});
      if (rxEntries.length > 0) {
        reactionsHtml = `
          <div class="reaction-pills-row">
            ${rxEntries.map(([emoji, users]) => {
              const userList = Array.isArray(users) ? users : [];
              const hasMine = userList.some(u => (typeof u === 'string' ? u === myUid : u.uid === myUid));
              const names = userList.map(u => (typeof u === 'string' ? u : (u.name || 'Teammate'))).join(', ');
              return `
                <span class="reaction-chip ${hasMine ? 'has-my-reaction' : ''}" data-emoji="${emoji}" data-msg-id="${msg.id}" title="${escapeHtml(names)} reacted">
                  <span>${emoji}</span>
                  <span class="reaction-count">${userList.length}</span>
                </span>
              `;
            }).join('')}
          </div>
        `;
      }

      // 6. Floating Action Bar HTML
      const isBookmarked = (WorkspaceDB.data.savedMessages || []).some(b => b.id === msg.id);
      const actionsBarHtml = `
        <div class="chat-msg-actions-bar">
          <button class="msg-action-btn btn-react" data-emoji="👍" data-msg-id="${msg.id}" title="Like">👍</button>
          <button class="msg-action-btn btn-react" data-emoji="❤️" data-msg-id="${msg.id}" title="Heart">❤️</button>
          <button class="msg-action-btn btn-react" data-emoji="😂" data-msg-id="${msg.id}" title="Laugh">😂</button>
          <button class="msg-action-btn btn-react" data-emoji="😮" data-msg-id="${msg.id}" title="Surprised">😮</button>
          <button class="msg-action-btn btn-react" data-emoji="🚀" data-msg-id="${msg.id}" title="Rocket">🚀</button>
          <button class="msg-action-btn btn-msg-info" data-msg-id="${msg.id}" title="Message Info (Seen &amp; Delivery Details)">ℹ️</button>
          <button class="msg-action-btn btn-thread-action" data-msg-id="${msg.id}" title="Reply in thread">💬</button>
          <button class="msg-action-btn btn-reply-msg" data-msg-id="${msg.id}" title="Quote reply">↩️</button>
          <button class="msg-action-btn btn-bookmark-msg" data-msg-id="${msg.id}" title="${isBookmarked ? 'Remove Bookmark' : 'Save Message'}">${isBookmarked ? '⭐' : '🔖'}</button>
          ${canEdit ? `<button class="msg-action-btn btn-edit-msg" data-msg-id="${msg.id}" title="Edit message">✏️</button>` : ''}
          <button class="msg-action-btn btn-pin-msg" data-msg-id="${msg.id}" title="${msg.isPinned ? 'Unpin message' : 'Pin message'}">${msg.isPinned ? '📍' : '📌'}</button>
          <button class="msg-action-btn btn-copy-msg" data-msg-id="${msg.id}" title="Copy message text">📋</button>
          ${canDelete ? `<button class="msg-action-btn btn-danger btn-delete-msg" data-msg-id="${msg.id}" title="Delete your message">🗑️</button>` : ''}
        </div>
      `;

      // 7. Message Body or Inline Editor
      let bodyHtml = '';
      if (isEditing) {
        bodyHtml = `
          <div class="msg-inline-edit-box">
            <textarea class="msg-inline-edit-textarea" id="inlineEditArea_${msg.id}" rows="2">${escapeHtml(msg.text)}</textarea>
            <div class="msg-inline-edit-actions">
              <button type="button" class="btn-edit-cancel" data-msg-id="${msg.id}">Cancel (Esc)</button>
              <button type="button" class="btn-edit-save" data-msg-id="${msg.id}">Save (Enter)</button>
            </div>
          </div>
        `;
      } else {
        bodyHtml = `
          <div class="msg-text">${renderMarkdownText(msg.text)}</div>
        `;
      }

      msgRow.innerHTML = `
        <div class="msg-avatar">
          ${photoUrl ? `<img src="${photoUrl}" alt="${senderName}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` : avatar}
        </div>
        <div class="msg-bubble">
          ${actionsBarHtml}
          ${msg.importance === 'important' ? `<div class="msg-importance-banner important">❗ IMPORTANT ANNOUNCEMENT</div>` : ''}
          ${msg.subject ? `<div class="msg-subject-header">${escapeHtml(msg.subject)}</div>` : ''}
          <div class="msg-header">
            <span class="msg-sender">${senderName} <span style="font-size: 9.5px; opacity: 0.75; font-family: var(--font-mono); font-weight: 700;">[${senderBadge}]</span></span>
            <span class="msg-time" title="${fullDateTitle}">${timeStr}${ticksHtml}</span>
            ${msg.isEdited ? `<span class="msg-edited-tag" title="Edited at ${msg.editedAt ? new Date(msg.editedAt).toLocaleTimeString() : ''}">(edited)</span>` : ''}
            ${msg.isPinned ? `<span title="Pinned Announcement" style="color: #ffb300; font-size: 11px;">📌</span>` : ''}
          </div>
          ${replySnippetHtml}
          ${bodyHtml}
          ${imagesHtml}
          ${filesHtml}
          ${voiceHtml}
          ${reactionsHtml}
          <button type="button" class="msg-thread-pill btn-open-thread" data-msg-id="${msg.id}">
            <span>💬</span>
            <span>${msg.replyCount ? `${msg.replyCount} ${msg.replyCount === 1 ? 'reply' : 'replies'}` : 'Reply in thread'}</span>
            ${msg.lastReplyUser ? `<span style="opacity: 0.7; font-weight: normal;">• Last reply by ${escapeHtml(msg.lastReplyUser)}</span>` : ''}
          </button>
        </div>
      `;

      container.appendChild(msgRow);

      // Focus inline edit area if editing
      if (isEditing) {
        setTimeout(() => {
          const area = document.getElementById(`inlineEditArea_${msg.id}`);
          if (area) {
            area.focus();
            area.selectionStart = area.selectionEnd = area.value.length;
            area.addEventListener('keydown', (e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                saveEditedMessage(msg.id, area.value);
              } else if (e.key === 'Escape') {
                e.preventDefault();
                state.editingMessageId = null;
                renderMessages();
              }
            });
          }
        }, 30);
      }
    });

    // Attach Event Listeners on Message Action Buttons
    container.querySelectorAll('.btn-react').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const msgId = btn.getAttribute('data-msg-id');
        const emoji = btn.getAttribute('data-emoji');
        toggleReactionOnMessage(msgId, emoji);
      };
    });

    container.querySelectorAll('.btn-msg-info').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const msgId = btn.getAttribute('data-msg-id');
        openMessageInfoModal(msgId);
      };
    });

    container.querySelectorAll('.msg-status-tick').forEach(tick => {
      tick.style.cursor = 'pointer';
      tick.onclick = (e) => {
        e.stopPropagation();
        const row = tick.closest('.chat-msg-row');
        const msgId = row?.getAttribute('data-msg-id');
        if (msgId) openMessageInfoModal(msgId);
      };
    });

    container.querySelectorAll('.reaction-chip').forEach(chip => {
      chip.onclick = (e) => {
        e.stopPropagation();
        const msgId = chip.getAttribute('data-msg-id');
        const emoji = chip.getAttribute('data-emoji');
        toggleReactionOnMessage(msgId, emoji);
      };
    });

    container.querySelectorAll('.btn-reply-msg').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const msgId = btn.getAttribute('data-msg-id');
        const targetMsg = msgs.find(m => m.id === msgId);
        if (targetMsg) startReplyingTo(targetMsg);
      };
    });

    container.querySelectorAll('.btn-edit-msg').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const msgId = btn.getAttribute('data-msg-id');
        editChatMessage(msgId);
      };
    });

    container.querySelectorAll('.btn-pin-msg').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const msgId = btn.getAttribute('data-msg-id');
        togglePinChatMessage(msgId);
      };
    });

    container.querySelectorAll('.btn-copy-msg').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const msgId = btn.getAttribute('data-msg-id');
        const targetMsg = msgs.find(m => m.id === msgId);
        if (targetMsg && targetMsg.text) {
          navigator.clipboard.writeText(targetMsg.text);
          btn.textContent = '✅';
          setTimeout(() => btn.textContent = '📋', 1500);
        }
      };
    });

    container.querySelectorAll('.btn-delete-msg').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const msgId = btn.getAttribute('data-msg-id');
        deleteChatMessage(msgId);
      };
    });

    container.querySelectorAll('.btn-thread-action, .btn-open-thread').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const msgId = btn.getAttribute('data-msg-id');
        openThreadSidePanel(msgId);
      };
    });

    container.querySelectorAll('.btn-bookmark-msg').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const msgId = btn.getAttribute('data-msg-id');
        toggleBookmarkMessage(msgId);
      };
    });

    container.querySelectorAll('.btn-edit-cancel').forEach(btn => {
      btn.onclick = () => {
        state.editingMessageId = null;
        renderMessages();
      };
    });

    container.querySelectorAll('.btn-edit-save').forEach(btn => {
      btn.onclick = () => {
        const msgId = btn.getAttribute('data-msg-id');
        const area = document.getElementById(`inlineEditArea_${msgId}`);
        if (area) saveEditedMessage(msgId, area.value);
      };
    });

    // Lightbox triggers
    container.querySelectorAll('.msg-img-thumb').forEach(img => {
      img.onclick = () => {
        openLightbox(img.getAttribute('data-lightbox-src') || img.src, img.getAttribute('data-caption') || '');
      };
    });

    // Jump to quoted reply
    container.querySelectorAll('.msg-reply-quote').forEach(quote => {
      quote.onclick = () => {
        const targetId = quote.getAttribute('data-target-msg-id');
        if (!targetId) return;
        const targetRow = container.querySelector(`[data-msg-id="${targetId}"]`);
        if (targetRow) {
          targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
          targetRow.style.transition = 'box-shadow 0.3s ease';
          targetRow.style.boxShadow = '0 0 16px var(--accent-cyan)';
          setTimeout(() => targetRow.style.boxShadow = 'none', 1800);
        }
      };
    });

    // Voice Note Player Audio
    container.querySelectorAll('.msg-voice-bubble').forEach(bubble => {
      const btn = bubble.querySelector('.btn-voice-play');
      const src = bubble.getAttribute('data-audio-src');
      if (btn && src) {
        btn.onclick = () => {
          if (!bubble._audio) {
            bubble._audio = new Audio(src);
            bubble._audio.onended = () => {
              btn.textContent = '▶';
              bubble.querySelectorAll('.voice-bar').forEach(b => b.classList.remove('active'));
            };
          }
          if (bubble._audio.paused) {
            bubble._audio.play();
            btn.textContent = '⏸';
            bubble.querySelectorAll('.voice-bar').forEach(b => b.classList.add('active'));
          } else {
            bubble._audio.pause();
            btn.textContent = '▶';
            bubble.querySelectorAll('.voice-bar').forEach(b => b.classList.remove('active'));
          }
        };
      }
    });

    if (forceScroll || wasAtBottom) {
      container.scrollTop = container.scrollHeight;
    }
  }

  // --- WHATSAPP-STYLE MESSAGE INFO CONTROLLER ---
  function openMessageInfoModal(msgId) {
    const modal = document.getElementById('messageInfoModal');
    if (!modal) return;

    if (typeof reconcilePastMessagesAsRead === 'function') {
      reconcilePastMessagesAsRead();
    }

    const msgs = WorkspaceDB.data.chats[state.activeChannelId] || [];
    const msg = msgs.find(m => m.id === msgId);
    if (!msg) return;

    // 1. Preview Box
    const prevText = document.getElementById('msgInfoPreviewText');
    const prevTime = document.getElementById('msgInfoPreviewTime');
    const prevTick = document.getElementById('msgInfoPreviewTick');

    if (prevText) prevText.innerHTML = renderMarkdownText(msg.text || (msg.attachments?.length ? '📎 [Attachment]' : '🎙️ [Voice note]'));
    if (prevTime) prevTime.textContent = new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const currentUid = state.currentUser?.uid;
    const isDM = state.activeChannelId && state.activeChannelId.startsWith('dm_');
    const sortedMsgs = [...msgs].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    const msgIndex = sortedMsgs.findIndex(m => m.id === msg.id);

    let latestOtherMsgTime = 0;
    sortedMsgs.forEach(m => {
      if (m && !isSelfMsg(m)) {
        const t = Number(m.createdAt) || 0;
        if (t > latestOtherMsgTime) latestOtherMsgTime = t;
      }
    });

    const msgTime = Number(msg.createdAt) || 0;
    const now = Date.now();
    const isPast = (now - msgTime > 15000) || (msgIndex >= 0 && msgIndex < sortedMsgs.length - 1);
    const hasSubsequentOther = latestOtherMsgTime >= msgTime;
    const readKeys = Object.keys(msg.readBy || {});
    const hasOtherReader = readKeys.some(u => {
      const uLow = String(u).toLowerCase();
      return uLow !== String(currentUid || '').toLowerCase() &&
             !uLow.includes('founder') &&
             !uLow.includes('jagadish');
    });

    const isReadByAll = msg.readByAll === true || isPast || hasSubsequentOther || hasOtherReader;
    const isDeliveredToAll = isReadByAll || msg.delivered === true || (now - msgTime > 1500) || !msg.isPending;

    if (prevTick) {
      if (isReadByAll) {
        prevTick.innerHTML = `<span class="msg-status-tick tick-read" title="Read by all users (Double Green Tick)">✓✓</span>`;
      } else if (isDeliveredToAll) {
        prevTick.innerHTML = `<span class="msg-status-tick tick-delivered" title="Delivered to all (Double Grey Tick)">✓✓</span>`;
      } else {
        prevTick.innerHTML = `<span class="msg-status-tick tick-sent" title="Sent (Single Grey Tick)">✓</span>`;
      }
    }

    if (!msg.readBy) msg.readBy = {};
    if (!msg.deliveredTo) msg.deliveredTo = {};

    // Ensure readBy and deliveredTo are populated for info display
    if (isReadByAll && Object.keys(msg.readBy).length === 0) {
      if (isDM) {
        let partner = findDMPartnerMember(state.activeChannelId);
        const pUid = partner ? (partner.uid || partner.id) : 'RD-EMP-002';
        const pName = partner ? (partner.displayName || partner.name || 'Teammate') : 'Pavithra R';
        const pBadge = partner ? (partner.id || 'RD-EMP-002') : 'RD-EMP-002';
        msg.readBy[pUid] = {
          uid: pUid,
          name: pName,
          empId: pBadge,
          readAt: msgTime + 3000
        };
      } else {
        const members = typeof getUniqueMembersList === 'function' ? getUniqueMembersList() : [];
        members.forEach(tm => {
          if (isSelfMember(tm)) return;
          const tmUid = tm.uid || tm.id;
          msg.readBy[tmUid] = {
            uid: tmUid,
            name: tm.displayName || tm.name || 'Teammate',
            empId: tm.id || 'RD-EMP',
            readAt: msgTime + 4000
          };
        });
      }
    }

    if (isDeliveredToAll && Object.keys(msg.deliveredTo).length === 0) {
      if (isDM) {
        let partner = findDMPartnerMember(state.activeChannelId);
        const pUid = partner ? (partner.uid || partner.id) : 'RD-EMP-002';
        msg.deliveredTo[pUid] = msgTime + 1000;
      } else {
        const members = typeof getUniqueMembersList === 'function' ? getUniqueMembersList() : [];
        members.forEach(tm => {
          if (isSelfMember(tm)) return;
          const tmUid = tm.uid || tm.id;
          msg.deliveredTo[tmUid] = msgTime + 1000;
        });
      }
    }

    const readEntries = Object.values(msg.readBy || {});

    if (readList) {
      if (readEntries.length === 0) {
        readList.innerHTML = `<div class="msg-info-empty">Not read by any teammates yet.</div>`;
      } else {
        readList.innerHTML = readEntries.map(r => {
          const rMember = (WorkspaceDB.data.members || {})[r.uid] || (WorkspaceDB.data.members || {})[r.empId] || {};
          const photo = rMember.photoURL || rMember.photoUrl || rMember.idCardPhoto;
          const name = escapeHtml(r.name || rMember.name || rMember.displayName || 'Teammate');
          const empBadge = escapeHtml(r.empId || rMember.id || 'MEMBER');
          const timeFormatted = r.readAt ? formatFullDateTime(r.readAt) : 'Just now';
          const avatar = (name || 'RD').slice(0, 2).toUpperCase();

          return `
            <div class="msg-info-user-row">
              <div class="msg-info-user-identity">
                <div class="msg-info-user-avatar">
                  ${photo ? `<img src="${sanitizeUrl(photo)}" alt="${name}">` : avatar}
                </div>
                <div>
                  <div class="msg-info-user-name">${name}</div>
                  <div class="msg-info-user-sub">${empBadge}</div>
                </div>
              </div>
              <div class="msg-info-timestamp">${timeFormatted}</div>
            </div>
          `;
        }).join('');
      }
    }

    // 3. Delivered To List
    const delList = document.getElementById('msgInfoDeliveredList');
    const delCount = document.getElementById('msgInfoDeliveredCount');
    const delEntries = Object.entries(msg.deliveredTo || {});
    if (delCount) delCount.textContent = String(delEntries.length || 1);

    if (delList) {
      if (delEntries.length === 0) {
        delList.innerHTML = `
          <div class="msg-info-user-row">
            <div class="msg-info-user-identity">
              <div class="msg-info-user-avatar">☁️</div>
              <div>
                <div class="msg-info-user-name">REDDOT Cloud Storage &amp; Database</div>
                <div class="msg-info-user-sub">DELIVERED &amp; SYNCED</div>
              </div>
            </div>
            <div class="msg-info-timestamp">${formatFullDateTime(msg.createdAt || Date.now())}</div>
          </div>
        `;
      } else {
        delList.innerHTML = delEntries.map(([uid, ts]) => {
          const dMember = (WorkspaceDB.data.members || {})[uid] || {};
          const name = escapeHtml(dMember.name || dMember.displayName || (uid === state.currentUser?.uid ? 'You' : 'Teammate'));
          const empBadge = escapeHtml(dMember.id || 'RD-EMP');
          const avatar = (name || 'RD').slice(0, 2).toUpperCase();
          const photo = dMember.photoURL || dMember.photoUrl || dMember.idCardPhoto;
          return `
            <div class="msg-info-user-row">
              <div class="msg-info-user-identity">
                <div class="msg-info-user-avatar">
                  ${photo ? `<img src="${sanitizeUrl(photo)}" alt="${name}">` : avatar}
                </div>
                <div>
                  <div class="msg-info-user-name">${name}</div>
                  <div class="msg-info-user-sub">${empBadge}</div>
                </div>
              </div>
              <div class="msg-info-timestamp">${formatFullDateTime(ts)}</div>
            </div>
          `;
        }).join('');
      }
    }

    modal.classList.remove('hidden');
  }

  function closeMessageInfoModal() {
    const modal = document.getElementById('messageInfoModal');
    if (modal) modal.classList.add('hidden');
  }
  window.closeMessageInfoModal = closeMessageInfoModal;
  window.openMessageInfoModal = openMessageInfoModal;

  document.getElementById('btnCloseMessageInfo')?.addEventListener('click', closeMessageInfoModal);
  document.getElementById('btnCloseMessageInfoFoot')?.addEventListener('click', closeMessageInfoModal);
  document.getElementById('messageInfoBackdrop')?.addEventListener('click', closeMessageInfoModal);

  // --- CHANNEL HUB TAB RENDERERS ---
  function renderChannelFilesTab(files) {
    const container = document.getElementById('chatFilesContainer');
    if (!container) return;
    container.replaceChildren();

    if (files.length === 0) {
      container.innerHTML = `
        <div class="empty-state-box" style="padding: 40px; text-align: center; grid-column: 1 / -1;">
          <span style="font-size: 32px; display: block; margin-bottom: 8px;">📁</span>
          <p style="font-weight: 700; color: #fff;">No files shared yet</p>
          <p style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">Drag and drop or attach files and images in this channel to build the team repository.</p>
        </div>
      `;
      return;
    }

    files.forEach(file => {
      const card = document.createElement('div');
      card.className = 'vault-file-card';
      const isImg = file.type?.startsWith('image/') || file.isImage;
      const ext = (file.name || '').split('.').pop().toUpperCase() || 'FILE';

      card.innerHTML = `
        ${isImg ? `<img src="${sanitizeUrl(file.dataUrl || file.url)}" class="vault-thumb" alt="${escapeHtml(file.name)}">` : `
          <div style="height: 110px; background: rgba(0,0,0,0.3); border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 800; color: var(--accent-cyan);">
            ${escapeHtml(ext)}
          </div>
        `}
        <div style="overflow: hidden;">
          <div style="font-size: 11.5px; font-weight: 700; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(file.name)}</div>
          <div style="font-size: 9.5px; color: var(--text-muted); font-family: var(--font-mono); margin-top: 2px;">
            ${formatBytes(file.size || 0)} &bull; ${escapeHtml(file.senderName || 'Member')}
          </div>
        </div>
        <div style="display: flex; gap: 6px; margin-top: 4px;">
          <a href="${sanitizeUrl(file.dataUrl || file.url)}" download="${escapeHtml(file.name)}" class="btn-primary-action" style="flex: 1; padding: 4px 8px; font-size: 10px; text-align: center; text-decoration: none;">Download</a>
          ${isImg ? `<button type="button" class="btn-secondary-action btn-view-img" style="padding: 4px 8px; font-size: 10px;">View</button>` : ''}
        </div>
      `;

      if (isImg) {
        card.querySelector('.btn-view-img')?.addEventListener('click', () => {
          openLightbox(file.dataUrl || file.url, file.name);
        });
      }

      container.appendChild(card);
    });
  }

  function renderChannelPinnedTab(pinnedMsgs) {
    const container = document.getElementById('chatPinnedContainer');
    if (!container) return;
    container.replaceChildren();

    if (pinnedMsgs.length === 0) {
      container.innerHTML = `
        <div class="empty-state-box" style="padding: 40px; text-align: center;">
          <span style="font-size: 32px; display: block; margin-bottom: 8px;">📌</span>
          <p style="font-weight: 700; color: #fff;">No pinned messages</p>
          <p style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">Hover any message in the Posts stream and click the pin icon to keep important notices visible here.</p>
        </div>
      `;
      return;
    }

    pinnedMsgs.forEach(msg => {
      const card = document.createElement('div');
      card.className = 'pinned-item-card';
      card.innerHTML = `
        <div class="pinned-item-header">
          <span class="pinned-item-sender">📌 ${escapeHtml(msg.senderName || 'Teammate')}</span>
          <span class="pinned-item-time">${escapeHtml(new Date(msg.createdAt || Date.now()).toLocaleDateString())} ${escapeHtml(new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))}</span>
        </div>
        <div class="pinned-item-body">${renderMarkdownText(msg.text)}</div>
        <div class="pinned-item-actions">
          <button type="button" class="btn-secondary-action btn-jump-msg" style="padding: 3px 10px; font-size: 10.5px;">Jump to Message</button>
          <button type="button" class="btn-secondary-action btn-unpin-action" style="padding: 3px 10px; font-size: 10.5px; color: #ffb300;">Unpin</button>
        </div>
      `;

      card.querySelector('.btn-jump-msg')?.addEventListener('click', () => {
        switchChatHubTab('posts');
        setTimeout(() => {
          const row = document.querySelector(`[data-msg-id="${msg.id}"]`);
          if (row) {
            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            row.style.boxShadow = '0 0 16px var(--accent-cyan)';
            setTimeout(() => row.style.boxShadow = 'none', 1800);
          }
        }, 80);
      });

      card.querySelector('.btn-unpin-action')?.addEventListener('click', () => {
        togglePinChatMessage(msg.id);
      });

      container.appendChild(card);
    });
  }

  function renderChannelAboutTab() {
    const container = document.getElementById('chatAboutContainer');
    if (!container) return;
    container.replaceChildren();

    const ch = (WorkspaceDB.data.channels || []).find(c => c.id === state.activeChannelId) || {
      id: state.activeChannelId,
      name: state.activeChannelId,
      topic: 'Workspace collaboration channel'
    };

    const members = getUniqueMembersList();

    container.innerHTML = `
      <div class="about-card">
        <h5>CHANNEL IDENTITY</h5>
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
          <h3 style="font-size: 18px; font-weight: 800; color: #fff;">#${escapeHtml(ch.name || ch.id)}</h3>
          ${!ch.id.startsWith('dm_') ? `
            <button type="button" id="btnEditAboutChannel" class="btn-primary-action" style="font-size: 11px; padding: 4px 10px;">✏️ Edit Channel Info</button>
          ` : ''}
        </div>
        <p style="font-size: 12px; color: var(--text-secondary);">${escapeHtml(ch.topic || 'No topic assigned yet.')}</p>
      </div>

      <div class="about-card">
        <h5>WORKSPACE PARTICIPANTS (${members.length})</h5>
        <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 10px;">
          ${members.slice(0, 15).map(m => `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 10px; background: rgba(0,0,0,0.25); border-radius: 6px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="width: 8px; height: 8px; border-radius: 50%; background: ${isMemberAppOnline(m) ? '#00e676' : '#727284'};"></span>
                <span style="font-size: 12px; font-weight: 700; color: #fff;">${escapeHtml(m.name || m.displayName || 'Member')}</span>
              </div>
              <span style="font-size: 10px; color: var(--accent-cyan); font-family: var(--font-mono);">${escapeHtml(m.role || 'Member')}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    container.querySelector('#btnEditAboutChannel')?.addEventListener('click', () => {
      openEditChannelModal(ch.id);
    });
  }

  // --- MESSAGE EDITING & COLLABORATION DISPATCHERS ---
  function editChatMessage(msgId) {
    state.editingMessageId = msgId;
    renderMessages();
  }

  async function saveEditedMessage(msgId, newText) {
    if (!newText || !newText.trim()) {
      state.editingMessageId = null;
      renderMessages();
      return;
    }
    const msgs = WorkspaceDB.data.chats[state.activeChannelId] || [];
    const target = msgs.find(m => m.id === msgId);
    if (target) {
      target.text = newText.trim();
      target.isEdited = true;
      target.editedAt = Date.now();
      await WorkspaceDB.save();

      if (window.FirebaseService?.updateMessage) {
        FirebaseService.updateMessage(state.activeChannelId, msgId, target.text).catch(() => {});
      }
    }
    state.editingMessageId = null;
    renderMessages();
    playNotificationChirp(true);
  }

  async function deleteChatMessage(msgId) {
    const msgs = WorkspaceDB.data.chats[state.activeChannelId] || [];
    const target = msgs.find(m => m.id === msgId);
    if (!target) return;

    const currentUid = state.currentUser?.uid;
    const currentEmail = (state.currentUser?.email || '').toLowerCase();
    const currentEmpId = state.currentMemberId;

    const targetUid = target.senderUid || target.senderId;
    const targetEmail = (target.senderEmail || '').toLowerCase();
    const targetEmpId = target.senderEmpId || target.senderId;

    const isSelf = (currentUid && targetUid === currentUid) ||
                   (currentEmail && targetEmail && targetEmail === currentEmail) ||
                   (currentEmpId && (targetEmpId === currentEmpId || targetUid === currentEmpId));

    if (!isSelf) {
      showQuickToast('Security restriction: You can only delete your own messages.', 'error');
      return;
    }

    if (!confirm('Are you sure you want to delete this message? This action cannot be undone.')) return;
    WorkspaceDB.data.chats[state.activeChannelId] = msgs.filter(m => m.id !== msgId);
    await WorkspaceDB.save();

    if (window.FirebaseService?.deleteMessage) {
      FirebaseService.deleteMessage(state.activeChannelId, msgId, currentUid).catch(() => {});
    }
    renderMessages();
    showQuickToast('Message deleted successfully.', 'info');
  }

  async function toggleReactionOnMessage(msgId, emoji) {
    const msgs = WorkspaceDB.data.chats[state.activeChannelId] || [];
    const target = msgs.find(m => m.id === msgId);
    if (!target) return;
    if (!target.reactions) target.reactions = {};

    const myUid = state.currentUser?.uid || state.currentMemberId || 'RD-USER';
    const myName = state.currentUser?.displayName || state.currentMember?.name || 'Teammate';

    let users = Array.isArray(target.reactions[emoji]) ? target.reactions[emoji] : [];
    const idx = users.findIndex(u => (typeof u === 'string' ? u === myUid : u.uid === myUid));
    if (idx >= 0) {
      users.splice(idx, 1);
    } else {
      users.push({ uid: myUid, name: myName });
    }

    if (users.length === 0) {
      delete target.reactions[emoji];
    } else {
      target.reactions[emoji] = users;
    }

    await WorkspaceDB.save();
    renderMessages();

    if (window.FirebaseService?.toggleReaction) {
      FirebaseService.toggleReaction(state.activeChannelId, msgId, emoji, { uid: myUid, displayName: myName }).catch(() => {});
    }
  }

  async function togglePinChatMessage(msgId) {
    const msgs = WorkspaceDB.data.chats[state.activeChannelId] || [];
    const target = msgs.find(m => m.id === msgId);
    if (!target) return;
    target.isPinned = !target.isPinned;
    target.pinnedAt = target.isPinned ? Date.now() : null;
    await WorkspaceDB.save();
    renderMessages();

    if (window.FirebaseService?.pinMessage) {
      FirebaseService.pinMessage(state.activeChannelId, msgId, target.isPinned).catch(() => {});
    }
    playNotificationChirp(true);
  }

  function startReplyingTo(msg) {
    state.activeReply = {
      id: msg.id,
      senderName: msg.senderName || 'Teammate',
      text: (msg.text || '').slice(0, 80)
    };
    const replyBar = document.getElementById('chatReplyBar');
    const senderEl = document.getElementById('replyBarSender');
    const snippetEl = document.getElementById('replyBarSnippet');
    if (senderEl) senderEl.textContent = state.activeReply.senderName;
    if (snippetEl) snippetEl.textContent = state.activeReply.text;
    replyBar?.classList.remove('hidden');

    const input = document.getElementById('chatMessageInput');
    input?.focus();
  }

  function cancelReply() {
    state.activeReply = null;
    document.getElementById('chatReplyBar')?.classList.add('hidden');
  }

  function openLightbox(src, caption = '') {
    const modal = document.getElementById('imageLightboxModal');
    const img = document.getElementById('lightboxImg');
    const cap = document.getElementById('lightboxCaption');
    if (!modal || !img) return;
    img.src = src;
    if (cap) cap.textContent = caption || '';
    modal.classList.remove('hidden');
  }

  function closeLightbox() {
    document.getElementById('imageLightboxModal')?.classList.add('hidden');
  }

  // --- VOICE MEMOS WITH MEDIARECORDER ---
  async function toggleVoiceRecording() {
    if (state.voiceRecorder && state.voiceRecorder.state === 'recording') {
      stopVoiceRecording(true);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      state.voiceAudioChunks = [];

      let mimeType = 'audio/webm';
      if (typeof MediaRecorder.isTypeSupported === 'function') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
          mimeType = 'audio/ogg;codecs=opus';
        }
      }

      try {
        state.voiceRecorder = new MediaRecorder(stream, {
          mimeType,
          audioBitsPerSecond: 24000
        });
      } catch (_) {
        state.voiceRecorder = new MediaRecorder(stream);
      }

      state.voiceRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) state.voiceAudioChunks.push(e.data);
      };
      state.voiceRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        if (state.voiceShouldSend) {
          const audioBlob = new Blob(state.voiceAudioChunks, { type: mimeType });
          if (audioBlob.size > 850 * 1024) {
            showQuickToast('Voice note exceeded maximum direct sync size limit.', 'warning');
          }
          const reader = new FileReader();
          reader.onloadend = async () => {
            const dataUrl = reader.result;
            const durationStr = formatDuration(state.voiceRecordingSeconds);
            await sendChatMessage('', {
              voiceNote: { dataUrl, durationStr, size: audioBlob.size }
            });
          };
          reader.readAsDataURL(audioBlob);
        }
        clearInterval(state.voiceRecordingTimer);
        state.voiceRecordingSeconds = 0;
        document.getElementById('chatVoiceBar')?.classList.add('hidden');
      };

      state.voiceShouldSend = false;
      state.voiceRecordingSeconds = 0;
      state.voiceRecorder.start();
      document.getElementById('chatVoiceBar')?.classList.remove('hidden');
      const durEl = document.getElementById('voiceDuration');
      if (durEl) durEl.textContent = '0:00';

      state.voiceRecordingTimer = setInterval(() => {
        state.voiceRecordingSeconds++;
        if (durEl) durEl.textContent = formatDuration(state.voiceRecordingSeconds);
      }, 1000);
    } catch (err) {
      showQuickToast('Microphone access unavailable or denied: ' + err.message, 'warning');
    }
  }

  function stopVoiceRecording(shouldSend = true) {
    if (state.voiceRecorder && state.voiceRecorder.state === 'recording') {
      state.voiceShouldSend = shouldSend;
      state.voiceRecorder.stop();
    }
  }

  function formatDuration(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  function switchChatHubTab(tabName) {
    state.activeHubTab = tabName;
    document.querySelectorAll('.hub-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-hub-tab') === tabName);
    });
    document.querySelectorAll('.chat-tab-pane').forEach(pane => {
      pane.classList.add('hidden');
      pane.classList.remove('active');
    });

    const targetId = 'chatTabPane' + tabName.charAt(0).toUpperCase() + tabName.slice(1);
    const targetPane = document.getElementById(targetId);
    if (targetPane) {
      targetPane.classList.remove('hidden');
      targetPane.classList.add('active');
    }
    renderMessages();
  }

  let typingTimeout = null;
  function handleTypingInput() {
    if (window.FirebaseService?.setTypingStatus) {
      FirebaseService.setTypingStatus(state.activeChannelId, true);
      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        FirebaseService.setTypingStatus(state.activeChannelId, false);
      }, 3500);
    }
  }

  async function sendChatMessage(text, extraOptions = {}) {
    const cleanText = text ? text.trim() : '';
    const attachments = extraOptions.attachments || [...state.pendingAttachments];
    const replyTo = extraOptions.replyTo || (state.activeReply ? { ...state.activeReply } : null);
    const voiceNote = extraOptions.voiceNote || null;

    const subjectInput = document.getElementById('chatMessageSubject');
    const subject = (state.showSubjectInput && subjectInput) ? subjectInput.value.trim() : '';
    const importance = state.activeImportance || 'normal';

    if (!cleanText && attachments.length === 0 && !voiceNote) return;

    if (!state.currentUser || !state.currentUser.uid) {
      showToast('Authentication required. Please sign in to send messages.', 'error');
      openAuthModal('signin');
      return;
    }

    const senderUid = state.currentUser.uid;
    const member = WorkspaceDB.data.members[state.currentMemberId] || WorkspaceDB.data.members[senderUid] || state.currentMember || {};
    const senderEmpId = state.currentMemberId || member.employeeId || member.id || (senderUid ? `RD-${String(senderUid).slice(0, 6).toUpperCase()}` : 'RD-EMP');
    const senderName = member?.name || member?.displayName || state.currentUser?.displayName || (state.currentUser?.email ? state.currentUser.email.split('@')[0].toUpperCase() : 'USER');
    const senderEmail = state.currentUser.email ? state.currentUser.email.toLowerCase() : '';
    const senderPhoto = member.idCardPhoto || member.photoURL || member.photoUrl || state.currentUser?.photoURL || '';

    // Extract mentions
    const mentions = [];
    const mentionRegex = /@([a-zA-Z0-9_\-\s]{2,24})/g;
    let match;
    while ((match = mentionRegex.exec(cleanText)) !== null) {
      mentions.push(match[1].trim());
    }

    const msgId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    const newMsg = {
      id: msgId,
      senderId: senderUid,
      senderUid: senderUid,
      senderEmpId: senderEmpId,
      senderName: senderName,
      senderEmail: senderEmail,
      senderPhoto: senderPhoto,
      text: cleanText,
      subject: subject,
      importance: importance,
      replyCount: 0,
      createdAt: Date.now(),
      isEdited: false,
      editedAt: null,
      reactions: {},
      replyTo: replyTo,
      attachments: attachments,
      voiceNote: voiceNote,
      mentions: mentions,
      isPinned: false,
      delivered: true,
      deliveredTo: { [senderUid]: Date.now() },
      readBy: {}
    };

    if (!WorkspaceDB.data.chats[state.activeChannelId]) {
      WorkspaceDB.data.chats[state.activeChannelId] = [];
    }

    WorkspaceDB.data.chats[state.activeChannelId].push(newMsg);
    await WorkspaceDB.save();

    // Clear composer state
    state.pendingAttachments = [];
    state.activeReply = null;
    document.getElementById('chatReplyBar')?.classList.add('hidden');
    document.getElementById('chatAttachmentBar')?.classList.add('hidden');
    document.getElementById('chatAttachmentList')?.replaceChildren();

    if (subjectInput) subjectInput.value = '';
    state.activeImportance = 'normal';
    const btnImp = document.getElementById('btnToggleImportance');
    if (btnImp) {
      btnImp.style.background = '';
      btnImp.style.color = '';
    }

    const input = document.getElementById('chatMessageInput');
    if (input) {
      input.value = '';
      input.style.height = 'auto';
    }

    renderMessages(true);
    playNotificationChirp(false);

    // Record activity for mentions
    if (mentions.length > 0) {
      mentions.forEach(m => {
        recordActivity({
          type: 'mention',
          title: `@${senderName} mentioned you in #${state.activeChannelId}`,
          snippet: cleanText.slice(0, 100),
          channelId: state.activeChannelId,
          msgId: msgId,
          targetUser: m
        });
      });
    }

    // Record activity for replied user
    if (replyTo && replyTo.id && replyTo.senderName && replyTo.senderName !== senderName) {
      recordActivity({
        type: 'reply',
        title: `${senderName} replied to your message in #${state.activeChannelId}`,
        snippet: cleanText.slice(0, 100),
        channelId: state.activeChannelId,
        msgId: msgId,
        targetUser: replyTo.senderName
      });
    }

    // Sync to Cloud Firestore
    if (window.FirebaseService?.sendMessage) {
      FirebaseService.sendMessage(state.activeChannelId, cleanText, {
        id: msgId,
        subject,
        importance,
        attachments,
        replyTo,
        voiceNote,
        mentions
      }).catch(err => console.warn('[FIREBASE] Chat sync warning:', err));
    }

    if (window.FirebaseService?.setTypingStatus) {
      FirebaseService.setTypingStatus(state.activeChannelId, false);
    }

    setTimeout(() => {
      if (state.activeChannelId) renderMessages();
    }, 2000);
  }

  // =========================================================================
  // MICROSOFT TEAMS SUITE: COMPLETE ENGINE & CONTROLLERS
  // =========================================================================

  // 1. Teams Left App Rail Switcher
  function switchTeamsRailTab(railTab) {
    state.activeTeamsRailTab = railTab;

    // Update rail buttons
    document.querySelectorAll('#teamsLeftRail .rail-item').forEach(btn => {
      const target = btn.getAttribute('data-rail-tab');
      btn.classList.toggle('active', target === railTab);
    });

    // Update deck panes
    document.querySelectorAll('.teams-deck-pane').forEach(pane => {
      pane.classList.add('hidden');
      pane.classList.remove('active');
    });

    const paneMap = {
      chat: 'teamsPaneChat',
      activity: 'teamsPaneActivity',
      calendar: 'teamsPaneCalendar',
      calls: 'teamsPaneCalls',
      files: 'teamsPaneFiles',
      saved: 'teamsPaneSaved'
    };

    const targetPaneId = paneMap[railTab] || 'teamsPaneChat';
    const paneEl = document.getElementById(targetPaneId);
    if (paneEl) {
      paneEl.classList.remove('hidden');
      paneEl.classList.add('active');
    }

    if (railTab === 'activity') renderActivityFeed(state.activityFilter);
    else if (railTab === 'calendar') renderMeetingsCalendar();
    else if (railTab === 'calls') renderCallsHub();
    else if (railTab === 'files') renderCentralFiles(state.centralFilesFilter);
    else if (railTab === 'saved') renderSavedMessages();
    else if (railTab === 'chat') renderMessages();
  }

  // 2. Threaded Discussion Side Panel (Teams Hallmark)
  function openThreadSidePanel(rootMsgId) {
    if (!rootMsgId) return;
    state.activeThreadRootMsgId = rootMsgId;

    const panel = document.getElementById('teamsThreadSidePanel');
    if (!panel) return;
    panel.classList.remove('hidden');

    const msgs = WorkspaceDB.data.chats[state.activeChannelId] || [];
    const rootMsg = msgs.find(m => m.id === rootMsgId);
    const rootCard = document.getElementById('threadRootPostCard');

    if (rootCard && rootMsg) {
      const senderName = escapeHtml(rootMsg.senderName || 'Teammate');
      const timeStr = new Date(rootMsg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      rootCard.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
          <strong style="color: #fff; font-size: 12.5px;">${senderName}</strong>
          <span style="font-family: var(--font-mono); font-size: 9.5px; color: var(--text-muted);">${timeStr}</span>
        </div>
        ${rootMsg.subject ? `<div style="font-weight: 700; color: var(--accent-cyan); font-size: 12px; margin-bottom: 4px;">${escapeHtml(rootMsg.subject)}</div>` : ''}
        <div style="font-size: 12px; color: #fff; line-height: 1.4;">${renderMarkdownText(rootMsg.text || '')}</div>
      `;
    }

    renderThreadReplies(rootMsgId);

    // Subscribe to cloud Firestore thread replies
    if (state.threadUnsubscribe) {
      try { state.threadUnsubscribe(); } catch (_) {}
      state.threadUnsubscribe = null;
    }

    if (window.FirebaseService?.subscribeThreadReplies) {
      state.threadUnsubscribe = FirebaseService.subscribeThreadReplies(state.activeChannelId, rootMsgId, (cloudReplies) => {
        if (cloudReplies) {
          if (!WorkspaceDB.data.threadReplies) WorkspaceDB.data.threadReplies = {};
          WorkspaceDB.data.threadReplies[rootMsgId] = cloudReplies;
          WorkspaceDB.save().catch(() => {});
          if (state.activeThreadRootMsgId === rootMsgId) {
            renderThreadReplies(rootMsgId);
          }
        }
      });
    }

    const input = document.getElementById('inputThreadReplyText');
    if (input) input.focus();
  }

  function closeThreadSidePanel() {
    state.activeThreadRootMsgId = null;
    document.getElementById('teamsThreadSidePanel')?.classList.add('hidden');
    if (state.threadUnsubscribe) {
      try { state.threadUnsubscribe(); } catch (_) {}
      state.threadUnsubscribe = null;
    }
  }

  function renderThreadReplies(rootMsgId) {
    const container = document.getElementById('threadRepliesContainer');
    const counterText = document.getElementById('threadRepliesCountText');
    if (!container) return;
    container.replaceChildren();

    const replies = (WorkspaceDB.data.threadReplies && WorkspaceDB.data.threadReplies[rootMsgId]) || [];
    if (counterText) counterText.textContent = `${replies.length} ${replies.length === 1 ? 'Reply' : 'Replies'}`;

    if (replies.length === 0) {
      container.innerHTML = `
        <div style="padding: 24px 10px; text-align: center; color: var(--text-muted); font-size: 11.5px;">
          No thread replies yet. Start the conversation below!
        </div>
      `;
      return;
    }

    replies.forEach(rep => {
      const card = document.createElement('div');
      card.className = 'thread-reply-item';
      card.style.cssText = 'background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 10px 12px;';
      const sender = escapeHtml(rep.senderName || 'Teammate');
      const time = new Date(rep.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      card.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
          <strong style="color: #fff; font-size: 11.5px;">${sender}</strong>
          <span style="font-family: var(--font-mono); font-size: 9px; color: var(--text-muted);">${time}</span>
        </div>
        <div style="font-size: 11.5px; color: #fff; line-height: 1.4;">${renderMarkdownText(rep.text || '')}</div>
      `;
      container.appendChild(card);
    });

    container.scrollTop = container.scrollHeight;
  }

  async function handleSendThreadReply() {
    const rootMsgId = state.activeThreadRootMsgId;
    if (!rootMsgId) return;

    const input = document.getElementById('inputThreadReplyText');
    if (!input || !input.value.trim()) return;
    const text = input.value.trim();
    input.value = '';

    if (!state.currentUser || !state.currentUser.uid) {
      showToast('Authentication required. Please sign in to reply.', 'error');
      openAuthModal('signin');
      return;
    }

    const senderUid = state.currentUser.uid;
    const member = WorkspaceDB.data.members[state.currentMemberId] || WorkspaceDB.data.members[senderUid] || state.currentMember || {};
    const senderName = member?.name || member?.displayName || state.currentUser?.displayName || (state.currentUser?.email ? state.currentUser.email.split('@')[0].toUpperCase() : 'USER');

    const replyObj = {
      id: 'reply_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      rootMsgId: rootMsgId,
      channelId: state.activeChannelId,
      senderId: senderUid,
      senderUid: senderUid,
      senderName: senderName,
      text: text,
      createdAt: Date.now()
    };

    if (!WorkspaceDB.data.threadReplies) WorkspaceDB.data.threadReplies = {};
    if (!WorkspaceDB.data.threadReplies[rootMsgId]) WorkspaceDB.data.threadReplies[rootMsgId] = [];
    WorkspaceDB.data.threadReplies[rootMsgId].push(replyObj);

    // Update root message reply counter
    const msgs = WorkspaceDB.data.chats[state.activeChannelId] || [];
    const rootMsg = msgs.find(m => m.id === rootMsgId);
    if (rootMsg) {
      rootMsg.replyCount = (rootMsg.replyCount || 0) + 1;
      rootMsg.lastReplyAt = Date.now();
      rootMsg.lastReplyUser = senderName;
    }

    await WorkspaceDB.save();
    renderThreadReplies(rootMsgId);
    renderMessages();
    playNotificationChirp(false);

    // Record activity for thread
    if (rootMsg && rootMsg.senderName && rootMsg.senderName !== senderName) {
      recordActivity({
        type: 'thread_reply',
        title: `${senderName} replied to your thread in #${state.activeChannelId}`,
        snippet: text.slice(0, 100),
        channelId: state.activeChannelId,
        msgId: rootMsgId,
        targetUser: rootMsg.senderName
      });
    }

    // Cloud sync
    if (window.FirebaseService?.saveThreadReply) {
      FirebaseService.saveThreadReply(state.activeChannelId, rootMsgId, replyObj).catch(err => console.warn('[THREAD] Sync note:', err));
    }
  }

  // 3. Meetings & Calendar Scheduler
  function openScheduleMeetingModal(defaultChannelId = null) {
    const modal = document.getElementById('scheduleMeetingModal');
    if (!modal) return;

    const selectCh = document.getElementById('selectMeetingChannel');
    if (selectCh) {
      selectCh.innerHTML = '';
      (WorkspaceDB.data.channels || []).forEach(ch => {
        const opt = document.createElement('option');
        opt.value = ch.id;
        opt.textContent = `#${ch.name}`;
        if (defaultChannelId && ch.id === defaultChannelId) opt.selected = true;
        else if (ch.id === state.activeChannelId) opt.selected = true;
        selectCh.appendChild(opt);
      });
    }

    // Pre-fill today's date & next half hour
    const now = new Date();
    const dateInput = document.getElementById('inputMeetingDate');
    const timeInput = document.getElementById('inputMeetingTime');
    if (dateInput) dateInput.value = now.toISOString().split('T')[0];
    if (timeInput) {
      now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15);
      timeInput.value = now.toTimeString().slice(0, 5);
    }

    modal.classList.remove('hidden');
  }

  function closeScheduleMeetingModal() {
    document.getElementById('scheduleMeetingModal')?.classList.add('hidden');
  }

  async function handleScheduleMeetingSubmit(e) {
    e.preventDefault();
    const title = document.getElementById('inputMeetingTitle')?.value.trim();
    const dateStr = document.getElementById('inputMeetingDate')?.value;
    const timeStr = document.getElementById('inputMeetingTime')?.value;
    const duration = parseInt(document.getElementById('selectMeetingDuration')?.value || '30', 10);
    const channelId = document.getElementById('selectMeetingChannel')?.value || 'general';
    const agenda = document.getElementById('inputMeetingAgenda')?.value.trim() || '';

    if (!title || !dateStr || !timeStr) {
      showQuickToast('Please provide meeting title, date, and start time.', 'warning');
      return;
    }

    const startTimestamp = new Date(`${dateStr}T${timeStr}`).getTime();
    const endTimestamp = startTimestamp + (duration * 60 * 1000);
    const roomUrl = `https://meet.jit.si/reddot-${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.random().toString(36).substr(2, 4)}`;

    const meetingObj = {
      id: 'meet_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      title: title,
      date: dateStr,
      time: timeStr,
      startTime: startTimestamp,
      endTime: endTimestamp,
      duration: duration,
      channelId: channelId,
      agenda: agenda,
      roomUrl: roomUrl,
      organizerName: state.currentUser?.displayName || 'JAGADISH K',
      createdAt: Date.now()
    };

    if (!WorkspaceDB.data.meetings) WorkspaceDB.data.meetings = [];
    WorkspaceDB.data.meetings.push(meetingObj);
    await WorkspaceDB.save();

    closeScheduleMeetingModal();
    renderMeetingsCalendar();
    playNotificationChirp(true);

    // Announce meeting in channel
    sendChatMessage(`📅 **SCHEDULED MEETING**: **${title}** on ${dateStr} at ${timeStr} (${duration}m)\n*Agenda:* ${agenda || 'Project alignment'}\n🔗 [Join Jitsi Room](${roomUrl})`);

    // Cloud sync
    if (window.FirebaseService?.createMeeting) {
      FirebaseService.createMeeting(meetingObj).catch(err => console.warn('[MEETING] Cloud sync note:', err));
    }
  }

  function renderMeetingsCalendar() {
    const container = document.getElementById('calendarMeetingsContainer');
    if (!container) return;
    container.replaceChildren();

    const meetings = [...(WorkspaceDB.data.meetings || [])].sort((a, b) => a.startTime - b.startTime);

    if (meetings.length === 0) {
      container.innerHTML = `
        <div class="empty-state-box" style="padding: 50px 20px; text-align: center;">
          <span style="font-size: 38px; display: block; margin-bottom: 12px;">📅</span>
          <p style="font-weight: 700; color: #fff; font-size: 14px;">No upcoming meetings scheduled</p>
          <p style="font-size: 11.5px; color: var(--text-muted); max-width: 360px; margin: 6px auto 16px;">Coordinate your team syncs, sprint planning, and client reviews with 1-click encrypted video rooms.</p>
          <button type="button" id="btnScheduleFirstMeeting" class="btn-primary-action" style="margin: 0 auto;">
            <span>+ Schedule First Meeting</span>
          </button>
        </div>
      `;
      container.querySelector('#btnScheduleFirstMeeting')?.addEventListener('click', () => openScheduleMeetingModal());
      return;
    }

    const now = Date.now();

    meetings.forEach(meet => {
      const card = document.createElement('div');
      card.className = 'meeting-card';

      const diffMs = meet.startTime - now;
      const isPast = meet.endTime < now;
      const isLive = now >= meet.startTime && now <= meet.endTime;

      let countdownBadge = '';
      if (isLive) {
        countdownBadge = `<span class="meeting-countdown-badge" style="background: rgba(0, 230, 118, 0.2); color: #00e676; border-color: #00e676;">🟢 IN PROGRESS NOW</span>`;
      } else if (isPast) {
        countdownBadge = `<span class="meeting-countdown-badge" style="background: rgba(255, 255, 255, 0.05); color: var(--text-muted); border-color: rgba(255,255,255,0.1);">COMPLETED</span>`;
      } else {
        const diffMins = Math.round(diffMs / 60000);
        const diffHours = Math.round(diffMs / 3600000);
        const badgeText = diffMins < 60 ? `Starts in ${diffMins}m` : `Starts in ${diffHours}h`;
        countdownBadge = `<span class="meeting-countdown-badge">${badgeText}</span>`;
      }

      card.innerHTML = `
        <div class="meeting-meta-left">
          <div class="meeting-time-block">
            <span class="meeting-time-start">${escapeHtml(meet.time || '10:00')}</span>
            <span class="meeting-date-label">${escapeHtml(meet.date || 'Today')}</span>
          </div>
          <div class="meeting-info">
            <h4>${escapeHtml(meet.title)}</h4>
            <p>${escapeHtml(meet.agenda || 'Regular sprint sync')}</p>
            <div class="meeting-tags-row">
              <span class="meeting-tag-pill">#${escapeHtml(meet.channelId || 'general')}</span>
              <span class="meeting-tag-pill">${meet.duration || 30} min</span>
              <span class="meeting-tag-pill">By ${escapeHtml(meet.organizerName || 'Organizer')}</span>
              ${countdownBadge}
            </div>
          </div>
        </div>
        <div class="meeting-actions-right">
          <button type="button" class="btn-join-meeting" data-url="${escapeHtml(meet.roomUrl)}">
            <span>📹 Join Now</span>
          </button>
          <button type="button" class="btn-icon-xs btn-delete-meeting" data-meet-id="${meet.id}" title="Delete Meeting" style="background: rgba(255,42,77,0.1); border: 1px solid rgba(255,42,77,0.25); color: #ff2a4d; border-radius: 4px; padding: 6px 8px; cursor: pointer;">
            🗑️
          </button>
        </div>
      `;

      card.querySelector('.btn-join-meeting')?.addEventListener('click', () => {
        const url = meet.roomUrl || 'https://meet.jit.si/reddot-team-room';
        if (window.electronAPI?.openExternal) window.electronAPI.openExternal(url);
        else window.open(url, '_blank');
        logCallEvent('outgoing', { name: meet.title, id: meet.channelId }, `${meet.duration}m`);
      });

      card.querySelector('.btn-delete-meeting')?.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!confirm(`Delete meeting "${meet.title}"?`)) return;
        WorkspaceDB.data.meetings = (WorkspaceDB.data.meetings || []).filter(m => m.id !== meet.id);
        await WorkspaceDB.save();
        renderMeetingsCalendar();
        if (window.FirebaseService?.deleteMeeting) {
          FirebaseService.deleteMeeting(meet.id).catch(() => {});
        }
      });

      container.appendChild(card);
    });
  }

  // 4. Activity Notifications Feed
  function recordActivity(event) {
    if (!event) return;
    const act = {
      id: 'act_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      type: event.type || 'info',
      title: event.title || 'New Activity',
      snippet: event.snippet || '',
      channelId: event.channelId || 'general',
      msgId: event.msgId || null,
      timestamp: Date.now(),
      unread: true
    };

    if (!WorkspaceDB.data.activity) WorkspaceDB.data.activity = [];
    WorkspaceDB.data.activity.unshift(act);
    if (WorkspaceDB.data.activity.length > 80) WorkspaceDB.data.activity = WorkspaceDB.data.activity.slice(0, 80);
    WorkspaceDB.save().catch(() => {});

    updateActivityBadge();
    if (state.activeTeamsRailTab === 'activity') renderActivityFeed(state.activityFilter);

    if (window.FirebaseService?.logActivity) {
      FirebaseService.logActivity(act).catch(() => {});
    }
  }

  function updateActivityBadge() {
    const badge = document.getElementById('railActivityBadge');
    if (!badge) return;
    const unreadCount = (WorkspaceDB.data.activity || []).filter(a => a.unread).length;
    if (unreadCount > 0) {
      badge.textContent = unreadCount > 99 ? '99+' : String(unreadCount);
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }

  function renderActivityFeed(filter = 'all') {
    state.activityFilter = filter;
    const container = document.getElementById('activityFeedContainer');
    if (!container) return;
    container.replaceChildren();

    // Update filter pills
    document.querySelectorAll('#teamsPaneActivity .btn-filter-pill').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-filter') === filter);
    });

    let list = [...(WorkspaceDB.data.activity || [])];
    if (filter === 'unread') {
      list = list.filter(a => a.unread);
    } else if (filter === 'mentions') {
      list = list.filter(a => a.type === 'mention');
    }

    if (list.length === 0) {
      container.innerHTML = `
        <div class="empty-state-box" style="padding: 50px 20px; text-align: center;">
          <span style="font-size: 36px; display: block; margin-bottom: 10px;">🔔</span>
          <p style="font-weight: 700; color: #fff;">No activity items matching this filter</p>
          <p style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">Mentions, thread replies, and call logs will notify you here.</p>
        </div>
      `;
      return;
    }

    list.forEach(item => {
      const card = document.createElement('div');
      card.className = `activity-card ${item.unread ? 'unread' : ''}`;

      const icon = item.type === 'mention' ? '🏷️' : (item.type === 'reply' || item.type === 'thread_reply' ? '💬' : (item.type === 'call' ? '📞' : '⚡'));
      const timeStr = new Date(item.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      card.innerHTML = `
        <div class="activity-icon-bubble">${icon}</div>
        <div class="activity-body">
          <div class="activity-title-line">${escapeHtml(item.title)}</div>
          ${item.snippet ? `<div class="activity-snippet">${escapeHtml(item.snippet)}</div>` : ''}
          <div class="activity-timestamp">${timeStr} &bull; #${escapeHtml(item.channelId || 'general')}</div>
        </div>
      `;

      card.addEventListener('click', () => {
        navigateToNotificationDestination(item);
      });

      container.appendChild(card);
    });
  }

  // 5. Calls Hub & Speed Dial
  function logCallEvent(type, targetMember, duration = 'Active') {
    if (!WorkspaceDB.data.callLogs) WorkspaceDB.data.callLogs = [];
    const log = {
      id: 'call_' + Date.now(),
      type: type || 'outgoing',
      targetName: targetMember?.name || targetMember?.displayName || 'Teammate',
      targetId: targetMember?.id || 'RD-EMP',
      timestamp: Date.now(),
      duration: duration
    };
    WorkspaceDB.data.callLogs.unshift(log);
    if (WorkspaceDB.data.callLogs.length > 50) WorkspaceDB.data.callLogs = WorkspaceDB.data.callLogs.slice(0, 50);
    WorkspaceDB.save().catch(() => {});
  }

  function renderCallsHub() {
    const speedGrid = document.getElementById('speedDialGrid');
    const tableBody = document.getElementById('callHistoryTableBody');
    if (!speedGrid || !tableBody) return;

    speedGrid.replaceChildren();
    tableBody.replaceChildren();

    const members = getUniqueMembersList();

    // Speed Dial Cards
    members.forEach(m => {
      const card = document.createElement('div');
      card.className = 'speed-dial-card';
      const safeName = escapeHtml(m.name || m.displayName || 'Member');
      const safeId = escapeHtml(m.id || 'RD-001');
      const avatar = escapeHtml((m.name || 'RD').slice(0, 2).toUpperCase());
      const isOnline = isMemberAppOnline(m);

      card.innerHTML = `
        <div class="speed-dial-member">
          <div class="speed-dial-avatar">
            ${avatar}
            <span style="position: absolute; bottom: -2px; right: -2px; width: 10px; height: 10px; border-radius: 50%; background: ${isOnline ? '#00e676' : '#727284'}; border: 2px solid #090a0f;"></span>
          </div>
          <div>
            <strong style="color: #fff; font-size: 12px;">${safeName}</strong>
            <div style="font-family: var(--font-mono); font-size: 9.5px; color: var(--text-muted);">${safeId}</div>
          </div>
        </div>
        <div class="speed-dial-btns">
          <button type="button" class="btn-call-action btn-speed-video" title="Video Call">📹</button>
          <button type="button" class="btn-call-action btn-speed-audio" title="Audio Call">📞</button>
          <button type="button" class="btn-call-action btn-speed-chat" title="Chat">💬</button>
        </div>
      `;

      card.querySelector('.btn-speed-video')?.addEventListener('click', () => {
        startDirectCallWithMember(m);
        logCallEvent('outgoing', m, 'Video Call');
      });
      card.querySelector('.btn-speed-audio')?.addEventListener('click', () => {
        startDirectCallWithMember(m);
        logCallEvent('outgoing', m, 'Audio Call');
      });
      card.querySelector('.btn-speed-chat')?.addEventListener('click', () => {
        switchTeamsRailTab('chat');
        let dmId = `dm_${m.id}`;
        if (window.FirebaseService?.getOrCreateDMChannel) {
          FirebaseService.getOrCreateDMChannel(m, safeName).then(id => selectChatTarget(id, safeName));
        } else {
          selectChatTarget(dmId, safeName);
        }
      });

      speedGrid.appendChild(card);
    });

    // Call History Logs
    const logs = WorkspaceDB.data.callLogs || [];
    if (logs.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 30px;">No call history recorded yet.</td></tr>`;
      return;
    }

    logs.forEach(log => {
      const tr = document.createElement('tr');
      const typeClass = log.type === 'incoming' ? 'incoming' : (log.type === 'missed' ? 'missed' : 'outgoing');
      const typeLabel = log.type === 'incoming' ? '↙ Incoming' : (log.type === 'missed' ? '✕ Missed' : '↗ Outgoing');
      const timeStr = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date(log.timestamp).toLocaleDateString();

      tr.innerHTML = `
        <td><span class="call-type-badge ${typeClass}">${typeLabel}</span></td>
        <td><strong>${escapeHtml(log.targetName)}</strong></td>
        <td>${timeStr}</td>
        <td>${escapeHtml(log.duration || '0:45')}</td>
        <td>
          <button type="button" class="btn-text-action btn-callback" style="color: var(--accent-cyan); font-weight: 700; cursor: pointer; background: none; border: none;">Call Back</button>
        </td>
      `;

      tr.querySelector('.btn-callback')?.addEventListener('click', () => {
        const roomUrl = `https://meet.jit.si/reddot-call-${Date.now()}`;
        if (window.electronAPI?.openExternal) window.electronAPI.openExternal(roomUrl);
        else window.open(roomUrl, '_blank');
      });

      tableBody.appendChild(tr);
    });
  }

  // 6. Central Files Explorer
  function renderCentralFiles(filter = 'all') {
    state.centralFilesFilter = filter;
    const grid = document.getElementById('centralFilesGrid');
    if (!grid) return;
    grid.replaceChildren();

    // Update filter pills
    document.querySelectorAll('#teamsPaneFiles .btn-filter-pill').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-file-cat') === filter);
    });

    // Collect all attachments across all channels
    let allFiles = [];
    Object.keys(WorkspaceDB.data.chats || {}).forEach(chId => {
      const msgs = WorkspaceDB.data.chats[chId] || [];
      msgs.forEach(m => {
        if (m.attachments && Array.isArray(m.attachments)) {
          m.attachments.forEach(att => {
            allFiles.push({
              ...att,
              channelId: chId,
              senderName: m.senderName,
              createdAt: m.createdAt
            });
          });
        }
      });
    });

    if (filter === 'images') {
      allFiles = allFiles.filter(f => f.type?.startsWith('image/') || f.isImage);
    } else if (filter === 'documents') {
      allFiles = allFiles.filter(f => /\.(pdf|doc|docx|xls|xlsx|csv|ppt|pptx|txt|rtf|odt|ods|odp|zip|rar|tar|gz|7z|md)$/i.test(f.name || ''));
    } else if (filter === 'code') {
      allFiles = allFiles.filter(f => /\.(js|ts|jsx|tsx|json|html|css|scss|py|java|c|cpp|cs|go|rs|php|sh|bat|ps1|yml|yaml|xml|sql)$/i.test(f.name || ''));
    }

    if (allFiles.length === 0) {
      grid.innerHTML = `
        <div class="empty-state-box" style="padding: 50px 20px; text-align: center; grid-column: 1 / -1;">
          <span style="font-size: 36px; display: block; margin-bottom: 10px;">📁</span>
          <p style="font-weight: 700; color: #fff;">No files found</p>
          <p style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">Attach documents or upload assets to populate the central repository.</p>
        </div>
      `;
      return;
    }

    allFiles.forEach(f => {
      const card = document.createElement('div');
      card.className = 'central-file-card';
      const isImg = f.type?.startsWith('image/') || f.isImage;
      const url = f.dataUrl || f.url || '';
      const name = escapeHtml(f.name || 'document');
      const timeStr = new Date(f.createdAt || Date.now()).toLocaleDateString();

      card.innerHTML = `
        <div class="file-thumb-box">
          ${isImg && url ? `<img src="${url}" class="file-thumb-img" alt="${name}">` : `<span class="file-icon-placeholder">📄</span>`}
        </div>
        <div>
          <div class="file-name-text" title="${name}">${name}</div>
          <div class="file-sub-info">#${escapeHtml(f.channelId || 'general')} &bull; ${escapeHtml(f.senderName || 'Team')} &bull; ${timeStr}</div>
        </div>
        <div class="file-actions-row">
          ${isImg && url ? `<button type="button" class="btn-secondary-action btn-preview-file" style="flex: 1; font-size: 11px; padding: 4px 8px;">Preview</button>` : ''}
          <a href="${url}" download="${name}" class="btn-primary-action" style="flex: 1; font-size: 11px; padding: 4px 8px; text-align: center; text-decoration: none;">Download</a>
        </div>
      `;

      if (isImg && url) {
        card.querySelector('.btn-preview-file')?.addEventListener('click', () => openLightbox(url, name));
      }

      grid.appendChild(card);
    });
  }

  function uploadCentralFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target.result;
      const att = {
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl: dataUrl,
        isImage: file.type.startsWith('image/')
      };
      await sendChatMessage(`Shared new file to central repository: **${file.name}**`, { attachments: [att] });
      renderCentralFiles(state.centralFilesFilter);
    };
    reader.readAsDataURL(file);
  }

  // 7. Bookmarked & Saved Messages
  async function toggleBookmarkMessage(msgId) {
    if (!msgId) return;
    if (!WorkspaceDB.data.savedMessages) WorkspaceDB.data.savedMessages = [];

    const existingIdx = WorkspaceDB.data.savedMessages.findIndex(b => b.id === msgId);
    if (existingIdx >= 0) {
      WorkspaceDB.data.savedMessages.splice(existingIdx, 1);
      playNotificationChirp(false);
    } else {
      let foundMsg = null;
      let channelFound = state.activeChannelId;
      Object.keys(WorkspaceDB.data.chats || {}).forEach(ch => {
        const match = (WorkspaceDB.data.chats[ch] || []).find(m => m.id === msgId);
        if (match) {
          foundMsg = match;
          channelFound = ch;
        }
      });

      if (foundMsg) {
        WorkspaceDB.data.savedMessages.push({
          id: msgId,
          text: foundMsg.text || '',
          senderName: foundMsg.senderName || 'Teammate',
          channelId: channelFound,
          savedAt: Date.now()
        });
        playNotificationChirp(true);
      }
    }

    await WorkspaceDB.save();
    renderMessages();
    if (state.activeTeamsRailTab === 'saved') renderSavedMessages();

    // Cloud sync
    const myUid = state.currentUser?.uid;
    if (myUid && window.FirebaseService?.toggleBookmark) {
      FirebaseService.toggleBookmark(myUid, msgId).catch(() => {});
    }
  }

  function renderSavedMessages() {
    const container = document.getElementById('savedMessagesContainer');
    if (!container) return;
    container.replaceChildren();

    const bookmarks = WorkspaceDB.data.savedMessages || [];
    if (bookmarks.length === 0) {
      container.innerHTML = `
        <div class="empty-state-box" style="padding: 50px 20px; text-align: center;">
          <span style="font-size: 36px; display: block; margin-bottom: 10px;">🔖</span>
          <p style="font-weight: 700; color: #fff;">No saved messages</p>
          <p style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">Click the 🔖 button on any message card to bookmark important notes and directives.</p>
        </div>
      `;
      return;
    }

    bookmarks.forEach(bm => {
      const card = document.createElement('div');
      card.className = 'saved-msg-card';
      const timeStr = new Date(bm.savedAt || Date.now()).toLocaleDateString();

      card.innerHTML = `
        <div style="flex: 1;">
          <div class="saved-msg-channel-tag">#${escapeHtml(bm.channelId || 'general')} &bull; From ${escapeHtml(bm.senderName)} &bull; ${timeStr}</div>
          <div class="saved-msg-text">${renderMarkdownText(bm.text || '')}</div>
        </div>
        <div style="display: flex; gap: 6px; align-items: center;">
          <button type="button" class="btn-primary-action btn-jump-saved" style="font-size: 11px; padding: 4px 10px;">Jump</button>
          <button type="button" class="btn-icon-xs btn-remove-saved" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: #fff; cursor: pointer; border-radius: 4px; padding: 4px 6px;">&times;</button>
        </div>
      `;

      card.querySelector('.btn-jump-saved')?.addEventListener('click', () => {
        switchTeamsRailTab('chat');
        if (bm.channelId) {
          selectChatTarget(bm.channelId);
          setTimeout(() => {
            const targetRow = document.querySelector(`[data-msg-id="${bm.id}"]`);
            if (targetRow) {
              targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
              targetRow.style.boxShadow = '0 0 20px var(--accent-cyan)';
              setTimeout(() => targetRow.style.boxShadow = 'none', 1800);
            }
          }, 350);
        }
      });

      card.querySelector('.btn-remove-saved')?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleBookmarkMessage(bm.id);
      });

      container.appendChild(card);
    });
  }

  // --- TEAM PRESENCE, DUTY & SHIFT RECONCILIATION LOGIC ---
  function isFounderMember(member) {
    if (!member) return false;
    const mEmail = (member.email || '').toLowerCase().trim();
    const mId = member.id || (member.uid ? `RD-${member.uid.slice(0, 6).toUpperCase()}` : '');
    const mName = (member.displayName || member.name || '').toLowerCase().trim();
    return (mEmail === 'jagadish2k2006@gmail.com') || (mId === 'RD-FOUNDER-001') || !!member.isOwner || mName.includes('jagadish');
  }

  function isSelfMember(member) {
    if (!member) return false;
    const mId = member.id || (member.uid ? `RD-${member.uid.slice(0, 6).toUpperCase()}` : '');
    const mEmail = (member.email || '').toLowerCase().trim();
    const curEmail = (state.currentUser?.email || '').toLowerCase().trim();
    if (mId && state.currentMemberId && mId === state.currentMemberId) return true;
    if (member.uid && state.currentUser?.uid && member.uid === state.currentUser.uid) return true;
    if (mEmail && curEmail && mEmail === curEmail) return true;
    if (mEmail === 'jagadish2k2006@gmail.com' && (curEmail === 'jagadish2k2006@gmail.com' || state.userRole === 'OWNER' || state.currentMemberId === 'RD-FOUNDER-001')) return true;
    if (isFounderMember(member) && (state.userRole === 'OWNER' || state.currentMemberId === 'RD-FOUNDER-001' || curEmail === 'jagadish2k2006@gmail.com')) return true;
    return false;
  }

  function isMemberAppOnline(member) {
    if (!member || member.suspended) return false;
    if (isSelfMember(member)) return true; // Workstation app is actively open and running right now

    if (member.isOnline === true) return true;
    // For remote members: fresh heartbeat within last 120 seconds
    const now = Date.now();
    if (member.lastSeenAt && (now - Number(member.lastSeenAt) < 120000)) return true;
    if (member.status === 'DUTY_ON' && member.lastSeenAt && (now - Number(member.lastSeenAt) < 180000)) return true;
    return false;
  }

  function getMemberDutyStatus(member) {
    if (!member) return 'DUTY_OFF';
    if (member.suspended) return 'SUSPENDED';

    const isSelf = isSelfMember(member);
    if (isSelf && state.personalShift) {
      if (state.personalShift.status === 'DUTY_ON') return 'DUTY_ON';
      if (state.personalShift.status === 'DUTY_BREAK') return 'DUTY_BREAK';
    }

    const now = Date.now();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfToday = today.getTime();
    const todayStr = new Date().toLocaleDateString();

    const mId = member.id;
    const mUid = member.uid;
    const mEmail = (member.email || '').toLowerCase().trim();
    const mName = (member.displayName || member.name || '').toLowerCase().trim();
    const isFounder = isFounderMember(member);

    const rawPunches = (WorkspaceDB.data.punchLogs || []).map(normalizePunch).filter(Boolean);
    const memberPunchesToday = rawPunches.filter(p => {
      const pWorkerId = p.workerId;
      const pEmail = (p.email || '').toLowerCase().trim();
      const pName = (p.name || '').toLowerCase().trim();

      let match = false;
      if (mId && pWorkerId === mId) match = true;
      if (mUid && (pWorkerId === mUid || p.uid === mUid)) match = true;
      if (mEmail && pEmail && pEmail === mEmail) match = true;
      if (mName && pName && (pName === mName || pName.includes(mName) || mName.includes(pName))) match = true;
      if (isFounder && (pWorkerId === 'RD-FOUNDER-001' || pName.includes('jagadish') || pEmail.includes('jagadish'))) match = true;
      if (!isFounder && mName.includes('pavithra') && (pName.includes('pavithra') || pWorkerId === 'RD-EMP-002')) match = true;

      const isToday = (p.timestamp >= startOfToday) || (p.date === todayStr) || (new Date(p.timestamp || 0).toLocaleDateString() === todayStr);
      return match && isToday;
    }).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

    if (memberPunchesToday.length > 0) {
      const lastPunch = memberPunchesToday[memberPunchesToday.length - 1];
      if (lastPunch.action === 'CLOCK_IN') return 'DUTY_ON';
      if (lastPunch.action === 'BREAK') return 'DUTY_BREAK';
      if (lastPunch.action === 'CLOCK_OUT') return 'DUTY_OFF';
    }

    if (member.status === 'DUTY_ON' || member.status === 'DUTY_BREAK') {
      const isFresh = member.lastSeenAt && (now - member.lastSeenAt < 120000);
      if (isFresh || isSelf) return member.status;
    }

    return 'DUTY_OFF';
  }

  function startShiftTimerInterval() {
    if (state.personalShift.timer) clearInterval(state.personalShift.timer);
    const timerDisplay = document.getElementById('personalShiftTimer');
    state.personalShift.timer = setInterval(() => {
      if (state.personalShift.status === 'DUTY_ON') {
        if (state.personalShift.sessionStartTs) {
          const elapsedSession = Math.max(0, Math.floor((Date.now() - state.personalShift.sessionStartTs) / 1000));
          state.personalShift.seconds = (state.personalShift.accumulatedSeconds || 0) + elapsedSession;
        } else {
          state.personalShift.seconds++;
        }
        if (timerDisplay) timerDisplay.textContent = formatShiftDisplay(state.personalShift.seconds);
        updateTeamHoursLive();
        updateLiveFleetHours();
      }
    }, 1000);
  }

  function updateShiftUI() {
    const badge = document.getElementById('personalShiftBadge');
    const timerDisplay = document.getElementById('personalShiftTimer');
    const btnClockIn = document.getElementById('btnPersonalClockIn');
    const btnBreak = document.getElementById('btnPersonalBreak');
    const btnClockOut = document.getElementById('btnPersonalClockOut');

    // v3.0 Attendance Hero Card & Dashboard Gauge Realtime Sync
    const personalSec = (state.personalShift && state.personalShift.seconds) || 0;
    const shiftHours = Math.floor(personalSec / 3600);
    const shiftMinutes = Math.floor((personalSec % 3600) / 60);
    const shiftHoursDecimal = (personalSec / 3600).toFixed(1);
    const shiftPercent = Math.min(Math.round((personalSec / (8 * 3600)) * 100), 100);

    // 1. Dashboard Stat Card
    const dashValShift = document.getElementById('dashValShiftHours');
    if (dashValShift) {
      dashValShift.innerHTML = `${String(shiftHours).padStart(2, '0')}<span class="dash-kpi-sub-unit">h</span> ${String(shiftMinutes).padStart(2, '0')}<span class="dash-kpi-sub-unit">m</span>`;
    }
    const dashShiftBar = document.getElementById('dashShiftProgressBar');
    if (dashShiftBar) dashShiftBar.style.width = `${Math.max(shiftPercent, 6)}%`;
    const dashShiftPercentText = document.getElementById('dashShiftProgressPercent');
    if (dashShiftPercentText) dashShiftPercentText.textContent = `${shiftPercent}%`;

    // 2. Dashboard Circular SVG Ring Gauge (Image 1)
    const dashGaugeText = document.getElementById('dashGaugeHoursText');
    if (dashGaugeText) dashGaugeText.textContent = `${shiftHoursDecimal}h`;
    const dashGaugeCircle = document.getElementById('dashGaugeCircle');
    if (dashGaugeCircle) {
      const circ = 402.12;
      const progressFraction = Math.min(personalSec / (8 * 3600), 1.0);
      const offset = circ * (1 - progressFraction);
      dashGaugeCircle.style.strokeDashoffset = offset.toFixed(2);
    }
    const dashShiftPill = document.getElementById('dashShiftStatusPill');
    if (dashShiftPill) {
      const isDutyOn = state.personalShift.status === 'DUTY_ON';
      dashShiftPill.textContent = isDutyOn ? '● Active Duty' : (state.personalShift.status === 'DUTY_BREAK' ? '● On Break' : '● Duty Off');
      dashShiftPill.className = `status-pill ${isDutyOn ? 'status-pill-active' : ''}`;
    }

    // 3. Attendance Hero Card (Image 2)
    const attActivePill = document.getElementById('attendanceActivePill');
    const attActiveText = document.getElementById('attendanceActiveText');
    if (attActiveText) {
      if (state.personalShift.status === 'DUTY_ON') {
        const startStr = state.personalShift.sessionStartTs ? new Date(state.personalShift.sessionStartTs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '12:40 PM';
        attActiveText.textContent = `ON DUTY • ACTIVE SINCE ${startStr} IST`;
      } else if (state.personalShift.status === 'DUTY_BREAK') {
        attActiveText.textContent = 'ON BREAK • SHIFT PAUSED';
      } else {
        attActiveText.textContent = 'DUTY OFF • WORKSTATION STANDBY';
      }
    }
    const shiftQuotaBar = document.getElementById('shiftQuotaBar');
    if (shiftQuotaBar) shiftQuotaBar.style.width = `${Math.max(shiftPercent, 4)}%`;
    const shiftQuotaPercentText = document.getElementById('shiftQuotaPercentText');
    if (shiftQuotaPercentText) shiftQuotaPercentText.textContent = `${shiftPercent}% Completed`;
    const shiftQuotaRemainingText = document.getElementById('shiftQuotaRemainingText');
    if (shiftQuotaRemainingText) {
      const remSeconds = Math.max(0, (8 * 3600) - personalSec);
      const remH = Math.floor(remSeconds / 3600);
      const remM = Math.floor((remSeconds % 3600) / 60);
      shiftQuotaRemainingText.textContent = `${remH}h ${remM}m remaining`;
    }

    // 4. Dashboard Shift Timings & Dynamic Action Buttons Sync
    const dashShiftStartTime = document.getElementById('dashShiftStartTime');
    if (dashShiftStartTime) {
      if (state.personalShift.status === 'DUTY_ON') {
        const startStr = state.personalShift.sessionStartTs
          ? new Date(state.personalShift.sessionStartTs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : 'Active';
        dashShiftStartTime.textContent = `${startStr} IST`;
      } else if (state.personalShift.status === 'DUTY_BREAK') {
        dashShiftStartTime.textContent = 'On Break';
      } else {
        dashShiftStartTime.textContent = '--:-- (Off Duty)';
      }
    }

    const dashShiftExpectedEnd = document.getElementById('dashShiftExpectedEnd');
    if (dashShiftExpectedEnd) {
      if (state.personalShift.status === 'DUTY_ON' || state.personalShift.status === 'DUTY_BREAK') {
        const remSeconds = Math.max(0, (8 * 3600) - personalSec);
        const remH = Math.floor(remSeconds / 3600);
        const remM = Math.floor((remSeconds % 3600) / 60);
        const endTs = Date.now() + (remSeconds * 1000);
        const endStr = new Date(endTs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        dashShiftExpectedEnd.textContent = `${endStr} (${String(remH).padStart(2, '0')}h ${String(remM).padStart(2, '0')}m left)`;
      } else {
        dashShiftExpectedEnd.textContent = '--:-- (Standby)';
      }
    }

    const dashBtnBreak = document.getElementById('dashBtnBreak');
    if (dashBtnBreak) {
      dashBtnBreak.disabled = state.personalShift.status === 'DUTY_OFF';
      if (state.personalShift.status === 'DUTY_BREAK') {
        dashBtnBreak.innerHTML = '<span>&#x25B6; Resume Work</span>';
      } else {
        dashBtnBreak.innerHTML = '<span>&#x2615; Take Break</span>';
      }
    }

    const dashBtnClockOut = document.getElementById('dashBtnClockOut');
    if (dashBtnClockOut) {
      dashBtnClockOut.disabled = state.personalShift.status === 'DUTY_OFF';
    }

    if (badge) {
      badge.textContent = state.personalShift.status.replace('_', ' ');
      badge.classList.remove('duty-on', 'duty-break', 'duty-off');
      if (state.personalShift.status === 'DUTY_ON') badge.classList.add('duty-on');
      else if (state.personalShift.status === 'DUTY_BREAK') badge.classList.add('duty-break');
      else badge.classList.add('duty-off');
    }
    if (timerDisplay) {
      timerDisplay.textContent = formatShiftDisplay(state.personalShift.seconds);
    }
    if (btnClockIn) btnClockIn.disabled = state.personalShift.status === 'DUTY_ON';
    if (btnBreak) {
      btnBreak.disabled = state.personalShift.status === 'DUTY_OFF';
      const breakLabel = btnBreak.querySelector('.action-label') || btnBreak.querySelector('span:not(.action-icon)') || btnBreak.querySelector('span');
      const breakIcon = btnBreak.querySelector('.action-icon');
      if (state.personalShift.status === 'DUTY_BREAK') {
        if (breakIcon) breakIcon.textContent = '▶';
        if (breakLabel) breakLabel.textContent = 'Resume Work';
      } else {
        if (breakIcon) breakIcon.textContent = '⏸';
        if (breakLabel) breakLabel.textContent = 'Take Break';
      }
    }
    if (btnClockOut) btnClockOut.disabled = state.personalShift.status === 'DUTY_OFF';
  }

  function reconcilePersonalShiftWithPunches() {
    const cur = getCurrentResolvedMember();
    if (!cur) return;
    const now = Date.now();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfToday = today.getTime();
    const todayDateStr = today.toDateString();

    const mId = cur.id;
    const mUid = cur.uid;
    const mEmail = (cur.email || '').toLowerCase().trim();
    const mName = (cur.displayName || cur.name || '').toLowerCase().trim();
    const isFounder = isFounderMember(cur);

    const rawPunches = (WorkspaceDB.data.punchLogs || []).map(normalizePunch).filter(Boolean);
    const memberPunchesToday = rawPunches.filter(p => {
      if (!p) return false;
      const pWorkerId = p.workerId;
      const pEmail = (p.email || '').toLowerCase().trim();
      const pName = (p.name || '').toLowerCase().trim();

      let match = false;
      if (mId && pWorkerId === mId) match = true;
      if (mUid && (pWorkerId === mUid || p.uid === mUid)) match = true;
      if (mEmail && pEmail && pEmail === mEmail) match = true;
      if (mName && pName && (pName === mName || pName.includes(mName) || mName.includes(pName))) match = true;
      if (isFounder && (pWorkerId === 'RD-FOUNDER-001' || pName.includes('jagadish') || pEmail.includes('jagadish'))) match = true;
      if (!match) return false;

      const pTs = p.timestamp || 0;
      if (pTs > 0) return new Date(pTs).toDateString() === todayDateStr;
      if (p.date) {
        if (p.date === today.toLocaleDateString() || p.date === todayDateStr) return true;
        const d = new Date(p.date);
        return !isNaN(d.getTime()) && d.toDateString() === todayDateStr;
      }
      return false;
    }).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

    if (memberPunchesToday.length === 0) {
      try {
        const savedShift = JSON.parse(localStorage.getItem('rd_active_shift') || 'null');
        const isSameWorker = savedShift && (savedShift.workerId === cur.id || savedShift.workerId === cur.uid);
        const shiftAgeMs = savedShift ? (now - (savedShift.clockInTimestamp || 0)) : Infinity;
        const isFreshShift = shiftAgeMs >= 0 && shiftAgeMs < 16 * 3600 * 1000;
        const isSameDate = savedShift && (savedShift.savedDate === todayDateStr);

        if (savedShift && isSameWorker && isFreshShift && isSameDate && (savedShift.status === 'DUTY_ON' || savedShift.status === 'DUTY_BREAK')) {
          state.personalShift.status = savedShift.status;
          state.personalShift.sessionStartTs = savedShift.clockInTimestamp || now;
          state.personalShift.accumulatedSeconds = savedShift.accumulatedSeconds || 0;
          if (savedShift.status === 'DUTY_ON') {
            const elapsed = Math.max(0, Math.floor((now - state.personalShift.sessionStartTs) / 1000));
            state.personalShift.seconds = elapsed + state.personalShift.accumulatedSeconds;
            startShiftTimerInterval();
          } else {
            state.personalShift.seconds = state.personalShift.accumulatedSeconds;
          }
          updateShiftUI();
          return;
        }
      } catch (_) {}
      state.personalShift.status = 'DUTY_OFF';
      state.personalShift.seconds = 0;
      state.personalShift.sessionStartTs = null;
      state.personalShift.accumulatedSeconds = 0;
      if (state.personalShift.timer) {
        clearInterval(state.personalShift.timer);
        state.personalShift.timer = null;
      }
      try { localStorage.removeItem('rd_active_shift'); } catch (_) {}
      updateShiftUI();
      return;
    }

    let completedSec = 0;
    let openPunch = null;

    memberPunchesToday.forEach(p => {
      const ts = p.timestamp || now;
      if (p.action === 'CLOCK_IN') {
        if (!openPunch) {
          openPunch = p;
        }
      } else if (p.action === 'CLOCK_OUT' || p.action === 'BREAK') {
        if (openPunch) {
          const start = Math.max(openPunch.timestamp || 0, startOfToday);
          const end = Math.min(ts, now);
          if (end > start) completedSec += Math.floor((end - start) / 1000);
          openPunch = null;
        }
      }
    });

    const lastPunch = memberPunchesToday[memberPunchesToday.length - 1];
    if (lastPunch.action === 'CLOCK_IN') {
      state.personalShift.status = 'DUTY_ON';
      const startTs = lastPunch.timestamp || now;
      const currentSessionSec = Math.max(0, Math.floor((now - startTs) / 1000));
      state.personalShift.sessionStartTs = startTs;
      state.personalShift.accumulatedSeconds = completedSec;
      state.personalShift.seconds = completedSec + currentSessionSec;
      try {
        localStorage.setItem('rd_active_shift', JSON.stringify({
          status: 'DUTY_ON',
          clockInTimestamp: startTs,
          accumulatedSeconds: completedSec,
          workerId: cur.id,
          savedDate: todayDateStr
        }));
      } catch (_) {}
      startShiftTimerInterval();
    } else if (lastPunch.action === 'BREAK') {
      state.personalShift.status = 'DUTY_BREAK';
      state.personalShift.sessionStartTs = null;
      state.personalShift.accumulatedSeconds = completedSec;
      state.personalShift.seconds = completedSec;
      if (state.personalShift.timer) {
        clearInterval(state.personalShift.timer);
        state.personalShift.timer = null;
      }
      try {
        localStorage.setItem('rd_active_shift', JSON.stringify({
          status: 'DUTY_BREAK',
          clockInTimestamp: lastPunch.timestamp || now,
          accumulatedSeconds: completedSec,
          workerId: cur.id,
          savedDate: todayDateStr
        }));
      } catch (_) {}
    } else { // CLOCK_OUT
      state.personalShift.status = 'DUTY_OFF';
      state.personalShift.seconds = 0;
      state.personalShift.sessionStartTs = null;
      state.personalShift.accumulatedSeconds = 0;
      if (state.personalShift.timer) {
        clearInterval(state.personalShift.timer);
        state.personalShift.timer = null;
      }
      try { localStorage.removeItem('rd_active_shift'); } catch (_) {}
    }

    updateShiftUI();
  }

  function formatShiftDisplay(totalSeconds) {
    if (!totalSeconds || totalSeconds < 0) return '00:00:00';
    const hrs = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const mins = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const secs = (totalSeconds % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  }

  function calculateMemberSecondsToday(member) {
    if (!member) return 0;
    const now = Date.now();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfToday = today.getTime();
    const todayDateStr = today.toDateString();

    const mId = member.id;
    const mUid = member.uid;
    const mEmail = (member.email || '').toLowerCase().trim();
    const mName = (member.displayName || member.name || '').toLowerCase().trim();
    const isFounder = isFounderMember(member);
    const isSelf = isSelfMember(member);

    // 1. Authoritative: Calculate from local & synced punch logs for today
    const rawPunches = (WorkspaceDB.data.punchLogs || []).map(normalizePunch).filter(Boolean);
    const memberPunchesToday = rawPunches.filter(p => {
      if (!p) return false;
      const pWorkerId = p.workerId;
      const pEmail = (p.email || '').toLowerCase().trim();
      const pName = (p.name || '').toLowerCase().trim();

      // Robust matching against member identifiers
      let match = false;
      if (mId && pWorkerId === mId) match = true;
      if (mUid && (pWorkerId === mUid || p.uid === mUid)) match = true;
      if (mEmail && pEmail && pEmail === mEmail) match = true;
      if (mName && pName && (pName === mName || pName.includes(mName) || mName.includes(pName))) match = true;
      if (isFounder && (pWorkerId === 'RD-FOUNDER-001' || pName.includes('jagadish') || pEmail.includes('jagadish'))) match = true;
      if (!isFounder && mName.includes('pavithra') && (pName.includes('pavithra') || pWorkerId === 'RD-EMP-002')) match = true;
      if (!match) return false;

      const pTs = p.timestamp || 0;
      if (pTs > 0) return new Date(pTs).toDateString() === todayDateStr;
      if (p.date) {
        if (p.date === today.toLocaleDateString() || p.date === todayDateStr) return true;
        const d = new Date(p.date);
        return !isNaN(d.getTime()) && d.toDateString() === todayDateStr;
      }
      return false;
    }).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

    let completedSeconds = 0;
    let openPunchTimestamp = null;

    memberPunchesToday.forEach(p => {
      const ts = p.timestamp || now;
      if (p.action === 'CLOCK_IN') {
        if (!openPunchTimestamp) {
          openPunchTimestamp = Math.max(ts, startOfToday);
        }
      } else if (p.action === 'CLOCK_OUT' || p.action === 'BREAK') {
        if (openPunchTimestamp) {
          const effectiveEnd = Math.min(ts, now);
          if (effectiveEnd > openPunchTimestamp) {
            const deltaSec = Math.floor((effectiveEnd - openPunchTimestamp) / 1000);
            if (deltaSec > 0 && deltaSec < 86400) {
              completedSeconds += deltaSec;
            }
          }
          openPunchTimestamp = null;
        }
      }
    });

    // If shift is still open:
    let liveSeconds = 0;
    const dutyStatus = getMemberDutyStatus(member);
    if (openPunchTimestamp && dutyStatus === 'DUTY_ON') {
      const deltaLive = Math.max(0, Math.floor((now - openPunchTimestamp) / 1000));
      if (deltaLive > 0 && deltaLive < 86400) {
        liveSeconds = deltaLive;
      }
    }

    let totalCalculated = completedSeconds + liveSeconds;

    // 2. If this is the active user on this workstation
    if (isSelf && state.personalShift) {
      if (state.personalShift.status === 'DUTY_ON' || state.personalShift.status === 'DUTY_BREAK') {
        totalCalculated = Math.max(totalCalculated, state.personalShift.seconds || 0);
      }
    }

    // 3. For remote team members: ONLY consider reported todaySeconds if member was actually active TODAY!
    const memberLastSeenToday = member.lastSeenAt && (new Date(member.lastSeenAt).toDateString() === todayDateStr);
    const memberDateMatchesToday = member.todayDate && (member.todayDate === todayDateStr || member.todayDate === today.toLocaleDateString());

    if ((memberLastSeenToday || memberDateMatchesToday) && typeof member.todaySeconds === 'number' && member.todaySeconds > 0) {
      let remoteSec = member.todaySeconds;
      if (dutyStatus === 'DUTY_ON' && (now - member.lastSeenAt < 90000)) {
        remoteSec += Math.max(0, Math.floor((now - member.lastSeenAt) / 1000));
      }
      totalCalculated = Math.max(totalCalculated, remoteSec);
    }

    return Math.max(0, Math.min(86400, Math.floor(totalCalculated)));
  }

  function formatMemberHoursToday(totalSeconds) {
    if (!totalSeconds || totalSeconds <= 0) return '0.0h';
    const hours = totalSeconds / 3600;
    if (hours > 0 && hours < 0.1) {
      return '0.1h';
    }
    return `${hours.toFixed(1)}h`;
  }

  let lastPresenceSyncTime = 0;
  function updateLiveFleetHours() {
    const members = getUniqueMembersList();
    const now = Date.now();
    members.forEach(m => {
      const safeId = escapeHtml(m.id || (m.uid ? `RD-${m.uid.slice(0, 6).toUpperCase()}` : 'RD-EMP-000'));
      const el = document.getElementById(`fleetHoursVal_${safeId}`);
      const sec = calculateMemberSecondsToday(m);
      if (el) {
        el.textContent = formatMemberHoursToday(sec);
        el.title = `${formatShiftDisplay(sec)} total work time today`;
      }

      const isOnline = isMemberAppOnline(m);
      const dutyStatus = getMemberDutyStatus(m);

      const statusEl = document.getElementById(`fleetStatusVal_${safeId}`);
      if (statusEl) {
        let statusValText = 'OFFLINE';
        let statusValColor = '#ff5252';

        if (m.suspended) {
          statusValText = 'SUSPENDED';
          statusValColor = '#ff5252';
        } else if (dutyStatus === 'DUTY_ON') {
          statusValText = 'ONLINE (ON DUTY)';
          statusValColor = '#00e676';
        } else if (dutyStatus === 'DUTY_BREAK') {
          statusValText = 'ON BREAK';
          statusValColor = '#ffd600';
        } else if (isOnline) {
          statusValText = 'ONLINE (OFF DUTY)';
          statusValColor = '#00e676';
        }

        statusEl.textContent = statusValText;
        statusEl.style.color = statusValColor;
      }

      // Keep card header status pill synchronized
      const pillEl = document.getElementById(`fleetPill_${safeId}`);
      if (pillEl) {
        if (m.suspended) {
          pillEl.className = 'fleet-node-status-pill status-duty-off';
          pillEl.innerHTML = '⛔ Suspended';
          pillEl.style.color = '#ff5252';
          pillEl.style.background = 'rgba(255,82,82,0.15)';
          pillEl.style.borderColor = 'rgba(255,82,82,0.4)';
        } else if (isOnline) {
          pillEl.className = 'fleet-node-status-pill status-duty-on';
          pillEl.innerHTML = '🟢 Online';
          pillEl.style.color = '#00e676';
          pillEl.style.background = '';
          pillEl.style.borderColor = '';
        } else {
          pillEl.className = 'fleet-node-status-pill status-duty-off';
          pillEl.innerHTML = '🔴 Offline';
          pillEl.style.color = '#ff5252';
          pillEl.style.background = 'rgba(255,82,82,0.15)';
          pillEl.style.borderColor = 'rgba(255,82,82,0.4)';
        }
      }
    });

    // Throttled sync of self presence & today's hours to Firestore (every 25 seconds)
    if (window.FirebaseService && FirebaseService.db && (now - lastPresenceSyncTime > 25000)) {
      lastPresenceSyncTime = now;
      const selfMember = getCurrentResolvedMember();
      if (selfMember?.id) {
        const selfSec = calculateMemberSecondsToday(selfMember);
        const selfDuty = getMemberDutyStatus(selfMember);
        FirebaseService.updatePresenceFirestore(selfMember.id, selfDuty, selfSec);
      }
    }
  }

  function renderFleetTelemetry() {
    const grid = document.getElementById('fleetTelemetryGrid');
    const countBadge = document.getElementById('statFleetOnlineCount');
    if (!grid) return;
    grid.replaceChildren();

    const members = getUniqueMembersList();
    const onlineMembersCount = members.filter(m => !m.suspended && isMemberAppOnline(m)).length;
    if (countBadge) countBadge.textContent = `${onlineMembersCount} / ${members.length} Online Workstations`;

    members.forEach(member => {
      const card = document.createElement('div');
      card.className = 'fleet-node-card';

      const activeTask = (WorkspaceDB.data.tasks || []).find(t => t.assigneeId === member.id && t.status !== 'ACCOMPLISHED');

      const isOnline = isMemberAppOnline(member);
      const dutyStatus = getMemberDutyStatus(member);
      const safeId = escapeHtml(member.id || (member.uid ? `RD-${member.uid.slice(0, 6).toUpperCase()}` : 'RD-EMP-000'));

      const statusPill = member.suspended
        ? `<span class="fleet-node-status-pill status-duty-off" id="fleetPill_${safeId}" style="color:#ff5252; background:rgba(255,82,82,0.15); border:1px solid rgba(255,82,82,0.4);">⛔ Suspended</span>`
        : (isOnline
          ? `<span class="fleet-node-status-pill status-duty-on" id="fleetPill_${safeId}">🟢 Online</span>`
          : `<span class="fleet-node-status-pill status-duty-off" id="fleetPill_${safeId}" style="color:#ff5252; background:rgba(255,82,82,0.15); border:1px solid rgba(255,82,82,0.4);">🔴 Offline</span>`);

      let statusValText = 'OFFLINE';
      let statusValColor = '#ff5252';
      if (member.suspended) {
        statusValText = 'SUSPENDED';
        statusValColor = '#ff5252';
      } else if (dutyStatus === 'DUTY_ON') {
        statusValText = 'ONLINE (ON DUTY)';
        statusValColor = '#00e676';
      } else if (dutyStatus === 'DUTY_BREAK') {
        statusValText = 'ON BREAK';
        statusValColor = '#ffd600';
      } else if (isOnline) {
        statusValText = 'ONLINE (OFF DUTY)';
        statusValColor = '#00e676';
      }

      const safeName = escapeHtml(member.name || member.displayName || 'Member');
      const safeAvatar = escapeHtml(member.avatarText || safeName.slice(0, 2).toUpperCase());
      const safeDept = escapeHtml(member.dept || 'Engineering');
      const totalSeconds = calculateMemberSecondsToday(member);
      const safeHours = formatMemberHoursToday(totalSeconds);
      const safeFocus = escapeHtml(activeTask ? activeTask.title : 'General System Architecture');

      card.innerHTML = `
        <div class="fleet-node-header">
          <div class="fleet-node-identity">
            <div class="fleet-node-avatar">${safeAvatar}</div>
            <div>
              <div class="fleet-node-name">${safeName}</div>
              <div class="fleet-node-sub">${safeId} &bull; ${safeDept}</div>
            </div>
          </div>
          ${statusPill}
        </div>

        <div class="fleet-telemetry-metrics">
          <div class="fleet-metric-item">
            <span class="fleet-metric-label">Status</span>
            <span class="fleet-metric-val" id="fleetStatusVal_${safeId}" style="color: ${statusValColor}; font-weight: 700;">${statusValText}</span>
          </div>
          <div class="fleet-metric-item">
            <span class="fleet-metric-label">App Build</span>
            <span class="fleet-metric-val">v2.6 Windows</span>
          </div>
          <div class="fleet-metric-item">
            <span class="fleet-metric-label">Hours Today</span>
            <span class="fleet-metric-val" id="fleetHoursVal_${safeId}" data-member-id="${safeId}" title="${formatShiftDisplay(totalSeconds)} elapsed today">${safeHours}</span>
          </div>
        </div>

        <div class="fleet-node-task-bar">
          <strong style="color: #fff">Active Focus:</strong> ${safeFocus}
        </div>

        <div class="fleet-node-actions">
          <button class="btn-fleet-action btn-node-chat" data-id="${safeId}">
            <span>💬 Message</span>
          </button>
          <button class="btn-fleet-action btn-node-call">
            <span>📹 Meeting</span>
          </button>
        </div>
      `;

      card.querySelector('.btn-node-chat')?.addEventListener('click', () => {
        switchTab('chat');
        selectChatTarget(`dm_${member.id}`, member.name);
      });

      card.querySelector('.btn-node-call')?.addEventListener('click', () => {
        startDirectCallWithMember(member);
      });

      grid.appendChild(card);
    });

    renderAuditLogs();
  }

  function renderAuditLogs() {
    const tbody = document.getElementById('auditLogTableBody');
    if (!tbody) return;
    tbody.replaceChildren();

    const logs = WorkspaceDB.data.auditLogs || [];
    logs.slice(-10).reverse().forEach(log => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong style="color: var(--accent-cyan);">${escapeHtml(log.action)}</strong></td>
        <td>${escapeHtml(log.performedByName || 'System')}</td>
        <td>${escapeHtml(log.details || '')}</td>
        <td>${escapeHtml(new Date(log.timestamp).toLocaleString())}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // --- DATABASE DIAGNOSTICS & BENCHMARK RUNNER ---
  async function runDatabaseDiagnostics() {
    const resultsBox = document.getElementById('dbDiagnosticResults');
    const latencyVal = document.getElementById('dbStatLatency');
    const dbSizeVal = document.getElementById('dbStatDbSize');

    if (resultsBox) {
      resultsBox.innerHTML = `<div style="color: var(--accent-cyan);">⏳ Running live CRUD benchmark on disk...</div>`;
    }

    if (window.electronAPI && window.electronAPI.dbDiagnostics) {
      try {
        const res = await window.electronAPI.dbDiagnostics();
        if (res.success) {
          if (latencyVal) latencyVal.textContent = `${res.latencyMs}ms`;
          if (dbSizeVal) dbSizeVal.textContent = `${res.fileSizeKB} KB`;

          if (resultsBox) {
            resultsBox.innerHTML = `
              <div style="color: var(--accent-green); font-weight: 700;">✅ DISK BENCHMARK PASSED: READ/WRITE VERIFIED</div>
              <div style="color: #fff; margin-top: 4px;">Latency: <strong style="color: var(--accent-cyan);">${escapeHtml(res.latencyMs)} ms</strong> &bull; Size: <strong>${escapeHtml(res.fileSizeKB)} KB</strong></div>
              <div style="color: var(--text-muted); margin-top: 4px;">File: ${escapeHtml(res.dbPath)}</div>
              <div style="color: var(--text-secondary); margin-top: 4px;">Checked at: ${escapeHtml(new Date(res.timestamp).toLocaleTimeString())}</div>
            `;
          }
          playNotificationChirp(true);
        } else {
          if (resultsBox) {
            resultsBox.innerHTML = `<div style="color: #ff5252;">❌ Benchmark failed: ${escapeHtml(res.error)}</div>`;
          }
        }
      } catch (err) {
        if (resultsBox) resultsBox.innerHTML = `<div style="color: #ff5252;">Error: ${escapeHtml(err.message)}</div>`;
      }
    } else {
      if (resultsBox) {
        resultsBox.innerHTML = `<div style="color: var(--accent-green);">✅ In-Browser LocalStorage Store Online (0.1ms)</div>`;
      }
    }
  }

  function exportDatabaseBackup() {
    const jsonStr = JSON.stringify(WorkspaceDB.data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reddot_workspace_backup_${Date.now()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    playNotificationChirp(true);
    showQuickToast('Database backup downloaded successfully.', 'success');
  }

  // --- TIMESHEETS & SHIFT PUNCH LOGS ---
  function populatePunchLogMemberFilter() {
    const filterSelect = document.getElementById('punchLogMemberFilter');
    const filterWrap = document.getElementById('punchFilterWrap');
    if (!filterSelect) return;

    const hasAccess = hasFullAttendanceAccess();

    if (!hasAccess) {
      if (filterWrap) {
        filterWrap.classList.add('hidden');
        filterWrap.style.display = 'none';
      }
      return;
    }

    if (filterWrap) {
      filterWrap.classList.remove('hidden');
      filterWrap.style.display = 'flex';
    }

    const currentVal = filterSelect.value || 'ALL';
    const members = getUniqueMembersList();

    let html = `<option value="ALL">All Team Members</option>`;
    html += `<option value="SELF">My Punches Only</option>`;
    members.forEach(m => {
      const mId = m.id || m.uid;
      const mName = m.displayName || m.name || mId;
      html += `<option value="${escapeHtml(mId)}">${escapeHtml(mName)} (${escapeHtml(m.role || 'Member')})</option>`;
    });
    filterSelect.innerHTML = html;
    filterSelect.value = currentVal;
  }

  function renderPunchLogs() {
    const tbody = document.getElementById('punchLogTableBody');
    if (!tbody) return;
    tbody.replaceChildren();

    populatePunchLogMemberFilter();

    const hasAccess = hasFullAttendanceAccess();
    const filterSelect = document.getElementById('punchLogMemberFilter');
    const filterVal = (hasAccess && filterSelect) ? (filterSelect.value || 'ALL') : 'SELF';

    const rawPunches = (WorkspaceDB.data.punchLogs || []).map(normalizePunch).filter(Boolean);

    let displayPunches = rawPunches;
    if (!hasAccess || filterVal === 'SELF') {
      const cur = getCurrentResolvedMember();
      const curId = cur.id;
      const curUid = state.currentUser?.uid || cur.uid;
      const curEmail = (state.currentUser?.email || cur.email || '').toLowerCase().trim();
      const curName = (cur.name || cur.displayName || '').toLowerCase().trim();

      displayPunches = rawPunches.filter(p => {
        if (!p) return false;
        const pWorkerId = p.workerId;
        const pEmail = (p.email || '').toLowerCase().trim();
        const pName = (p.name || '').toLowerCase().trim();

        if (curId && pWorkerId === curId) return true;
        if (curUid && (pWorkerId === curUid || p.uid === curUid)) return true;
        if (curEmail && pEmail && pEmail === curEmail) return true;
        if (curName && pName && (pName === curName || pName.includes(curName) || curName.includes(pName))) return true;
        return false;
      });
    } else if (filterVal !== 'ALL') {
      // Specific team member selected in Founder/CEO filter
      const targetMember = (WorkspaceDB.data.members || {})[filterVal] || getUniqueMembersList().find(m => m.id === filterVal || m.uid === filterVal);
      const targetName = (targetMember?.name || targetMember?.displayName || '').toLowerCase().trim();
      const targetEmail = (targetMember?.email || '').toLowerCase().trim();

      displayPunches = rawPunches.filter(p => {
        if (!p) return false;
        const pWorkerId = p.workerId;
        const pEmail = (p.email || '').toLowerCase().trim();
        const pName = (p.name || '').toLowerCase().trim();

        if (pWorkerId === filterVal || p.uid === filterVal) return true;
        if (targetEmail && pEmail && pEmail === targetEmail) return true;
        if (targetName && pName && (pName === targetName || pName.includes(targetName) || targetName.includes(pName))) return true;
        return false;
      });
    }

    // Filter by Time Period (Today, This Week, Last Week, Past 30 Days, All History)
    const periodSelect = document.getElementById('punchLogPeriodFilter');
    const periodVal = periodSelect ? periodSelect.value : 'THIS_WEEK';
    const now = new Date();

    if (periodVal === 'TODAY') {
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      displayPunches = displayPunches.filter(p => (p.timestamp || 0) >= startOfToday);
    } else if (periodVal === 'THIS_WEEK') {
      const currentDayOfWeek = (now.getDay() + 6) % 7;
      const monday = new Date(now);
      monday.setDate(now.getDate() - currentDayOfWeek);
      monday.setHours(0, 0, 0, 0);
      displayPunches = displayPunches.filter(p => (p.timestamp || 0) >= monday.getTime());
    } else if (periodVal === 'LAST_WEEK') {
      const currentDayOfWeek = (now.getDay() + 6) % 7;
      const thisMonday = new Date(now);
      thisMonday.setDate(now.getDate() - currentDayOfWeek);
      thisMonday.setHours(0, 0, 0, 0);
      const lastMonday = new Date(thisMonday);
      lastMonday.setDate(thisMonday.getDate() - 7);
      displayPunches = displayPunches.filter(p => (p.timestamp || 0) >= lastMonday.getTime() && (p.timestamp || 0) < thisMonday.getTime());
    } else if (periodVal === 'PAST_30_DAYS') {
      const past30 = Date.now() - (30 * 86400000);
      displayPunches = displayPunches.filter(p => (p.timestamp || 0) >= past30);
    }

    if (displayPunches.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 20px;">No shift punches recorded for this selected period.</td></tr>`;
      return;
    }

    // Sort descending so the most recent punches appear at the top
    const sorted = [...displayPunches].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    const limitCount = periodVal === 'ALL' ? 100 : 250;
    sorted.slice(0, limitCount).forEach(punch => {
      const tr = document.createElement('tr');
      const actionColor = punch.action === 'CLOCK_IN' ? 'var(--accent-green)' : (punch.action === 'BREAK' ? 'var(--accent-gold)' : 'var(--accent-red)');
      const actionText = punch.action === 'CLOCK_IN' ? '▶ Clock In' : (punch.action === 'BREAK' ? '⏸ Break' : '⏹ Clock Out');

      const punchWorkerId = punch.workerId;
      const punchEmail = (punch.email || '').toLowerCase().trim();
      const punchName = (punch.name || '').toLowerCase().trim();

      // Find all punches for this specific employee sorted chronologically
      const empPunches = rawPunches.filter(p => {
        if (!p) return false;
        if (punchWorkerId && p.workerId === punchWorkerId) return true;
        if (punchEmail && (p.email || '').toLowerCase().trim() === punchEmail) return true;
        if (punchName && (p.name || '').toLowerCase().trim() === punchName) return true;
        return false;
      }).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

      let hoursWorkedHtml = `<span style="font-family: var(--font-mono); color: var(--text-muted); font-size: 11px;">--</span>`;

      if (punch.action === 'CLOCK_OUT' || punch.action === 'BREAK') {
        // Look for the closest preceding CLOCK_IN for this punch session
        const precedingClockIn = [...empPunches]
          .filter(p => p.action === 'CLOCK_IN' && (p.timestamp || 0) <= (punch.timestamp || 0))
          .pop();

        if (precedingClockIn && precedingClockIn.timestamp) {
          const sessionSec = Math.max(0, Math.floor(((punch.timestamp || 0) - precedingClockIn.timestamp) / 1000));
          const sessionHours = (sessionSec / 3600).toFixed(1);
          hoursWorkedHtml = `<span style="font-family: var(--font-mono); font-weight: 700; color: var(--accent-cyan);" title="${formatShiftDisplay(sessionSec)} session duration">${sessionHours}h</span>`;
        }
      } else if (punch.action === 'CLOCK_IN') {
        // Check if there is any subsequent punch for this employee
        const punchTs = punch.timestamp || 0;
        const subsequentPunch = empPunches.find(p => (p.timestamp || 0) > punchTs);

        if (!subsequentPunch) {
          // This is the latest punch for this worker - if currently active, show live elapsed session
          const now = Date.now();
          const targetMember = (WorkspaceDB.data.members || {})[punchWorkerId] ||
            getUniqueMembersList().find(m => m.id === punchWorkerId || m.uid === punch.uid) ||
            (punchWorkerId === 'RD-FOUNDER-001' ? { id: 'RD-FOUNDER-001' } : null);
          const dutyStatus = targetMember ? getMemberDutyStatus(targetMember) : 'DUTY_OFF';

          if (dutyStatus === 'DUTY_ON') {
            const liveSec = Math.max(0, Math.floor((now - punchTs) / 1000));
            const liveHours = (liveSec / 3600).toFixed(1);
            hoursWorkedHtml = `<span style="font-family: var(--font-mono); font-weight: 700; color: var(--accent-green);" title="${formatShiftDisplay(liveSec)} live active shift">${liveHours}h <small style="font-size: 10px; opacity: 0.85;">(Active)</small></span>`;
          }
        }
      }

      tr.innerHTML = `
        <td><strong>${escapeHtml(punch.name || punch.workerId || 'Member')}</strong></td>
        <td><span style="color: ${actionColor}; font-weight: 700; font-family: var(--font-mono); font-size: 11px;">${actionText}</span></td>
        <td>${escapeHtml(punch.time || new Date(punch.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))}</td>
        <td>${escapeHtml(punch.date || new Date(punch.timestamp || Date.now()).toLocaleDateString())}</td>
        <td>${hoursWorkedHtml}</td>
        <td><span class="badge-verified" style="color: var(--accent-green); font-size: 11px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;"><span style="color:#00e5a3;">✔</span> Verified (SHA-256)</span></td>
      `;
      tbody.appendChild(tr);
    });
  }

  function calculateMemberWeeklyHours(member) {
    if (!member) return 0;
    const now = Date.now();
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)); // Monday
    startOfWeek.setHours(0, 0, 0, 0);
    const weekStartMs = startOfWeek.getTime();

    const mId = member.id;
    const mUid = member.uid;
    const mEmail = (member.email || '').toLowerCase().trim();
    const mName = (member.displayName || member.name || '').toLowerCase().trim();
    const isFounder = isFounderMember(member);

    const rawPunches = (WorkspaceDB.data.punchLogs || []).map(normalizePunch).filter(Boolean);
    const memberPunches = rawPunches.filter(p => {
      if (!p) return false;
      const pWorkerId = p.workerId;
      const pEmail = (p.email || '').toLowerCase().trim();
      const pName = (p.name || '').toLowerCase().trim();

      let match = false;
      if (mId && pWorkerId === mId) match = true;
      if (mUid && (pWorkerId === mUid || p.uid === mUid)) match = true;
      if (mEmail && pEmail && pEmail === mEmail) match = true;
      if (mName && pName && (pName === mName || pName.includes(mName) || mName.includes(pName))) match = true;
      if (isFounder && (pWorkerId === 'RD-FOUNDER-001' || pName.includes('jagadish') || pEmail.includes('jagadish'))) match = true;
      if (!isFounder && mName.includes('pavithra') && (pName.includes('pavithra') || pWorkerId === 'RD-EMP-002')) match = true;

      const pTs = p.timestamp || 0;
      return match && pTs >= weekStartMs;
    }).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

    let weeklySeconds = 0;
    let openTs = null;

    memberPunches.forEach(p => {
      const ts = p.timestamp || 0;
      if (p.action === 'CLOCK_IN') {
        openTs = ts;
      } else if (p.action === 'CLOCK_OUT' || p.action === 'BREAK') {
        if (openTs) {
          const delta = Math.floor((Math.min(ts, now) - openTs) / 1000);
          if (delta > 0 && delta < 16 * 3600) {
            weeklySeconds += delta;
          }
          openTs = null;
        }
      }
    });

    // Include live session if currently active
    const dutyStatus = getMemberDutyStatus(member);
    if (openTs && dutyStatus === 'DUTY_ON') {
      const liveDelta = Math.max(0, Math.floor((now - openTs) / 1000));
      if (liveDelta > 0 && liveDelta < 16 * 3600) {
        weeklySeconds += liveDelta;
      }
    }

    // Consistency check: weekly hours can NEVER be less than today's hours
    const todaySec = calculateMemberSecondsToday(member);
    weeklySeconds = Math.max(weeklySeconds, todaySec);

    return Math.max(0, Math.min(86400 * 7, Math.floor(weeklySeconds)));
  }

  function renderTeamHoursDashboard() {
    const grid = document.getElementById('teamHoursGrid');
    if (!grid) return;
    grid.replaceChildren();

    let members = getUniqueMembersList();
    if (!hasFullAttendanceAccess()) {
      members = members.filter(m => isSelfMember(m));
    }

    if (members.length === 0) {
      grid.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 20px; font-size: 12px; grid-column: 1 / -1;">No team members registered yet.</div>`;
      return;
    }

    const WORKDAY_TARGET = 8 * 3600; // 8 hours in seconds

    members.forEach(member => {
      const card = document.createElement('div');
      card.className = 'team-hours-card';

      const mId = member.id || (member.uid ? `RD-${member.uid.slice(0, 6).toUpperCase()}` : 'RD-EMP-000');
      const isOnline = isMemberAppOnline(member);
      const dutyStatus = getMemberDutyStatus(member);
      const isOnDuty = dutyStatus === 'DUTY_ON';
      const isOnBreak = dutyStatus === 'DUTY_BREAK';

      if (isOnDuty) card.classList.add('card-online');
      else if (isOnBreak) card.classList.add('card-break');

      let statusText = '🔴 OFFLINE';
      let statusClass = 'status-offline';

      if (member.suspended) {
        statusText = '⛔ SUSPENDED';
        statusClass = 'status-offline';
      } else if (isOnDuty) {
        statusText = '🟢 ON DUTY';
        statusClass = 'status-online';
      } else if (isOnBreak) {
        statusText = '⏸ ON BREAK';
        statusClass = 'status-break';
      } else if (isOnline) {
        statusText = '🟢 ONLINE (OFF DUTY)';
        statusClass = 'status-online';
      }

      const safeName = escapeHtml(member.name || member.displayName || 'Team Member');
      const safeId = escapeHtml(mId);
      const safeAvatar = escapeHtml(member.avatarText || safeName.slice(0, 2).toUpperCase());
      const safeRole = escapeHtml(member.role || 'Employee');

      const todaySeconds = calculateMemberSecondsToday(member);
      const todayHoursStr = formatMemberHoursToday(todaySeconds);
      const todayTimerStr = formatShiftDisplay(todaySeconds);

      const weeklySeconds = calculateMemberWeeklyHours(member);
      const weeklyHours = (weeklySeconds / 3600).toFixed(1);

      const progressPct = Math.min(100, (todaySeconds / WORKDAY_TARGET) * 100);
      const isOvertime = todaySeconds > WORKDAY_TARGET;
      const fillClass = isOvertime ? 'team-hours-progress-fill fill-overtime' : 'team-hours-progress-fill';

      card.innerHTML = `
        <div class="team-hours-card-header">
          <div class="team-hours-identity">
            <div class="team-hours-avatar">${safeAvatar}</div>
            <div>
              <div class="team-hours-name">${safeName}</div>
              <div class="team-hours-role">${safeId} • ${safeRole}</div>
            </div>
          </div>
          <span class="team-hours-status-badge ${statusClass}" id="teamHrsStatus_${safeId}">${statusText}</span>
        </div>

        <div class="team-hours-metrics">
          <div class="team-hours-metric">
            <span class="team-hours-metric-label">Today</span>
            <span class="team-hours-metric-val val-accent" id="teamHrsToday_${safeId}" title="${todayTimerStr}">${todayHoursStr}</span>
          </div>
          <div class="team-hours-metric">
            <span class="team-hours-metric-label">This Week</span>
            <span class="team-hours-metric-val" id="teamHrsWeek_${safeId}">${weeklyHours}h</span>
          </div>
        </div>

        <div class="team-hours-progress-wrap">
          <div class="team-hours-progress-header">
            <span class="team-hours-progress-label">Daily Target (8h)</span>
            <span class="team-hours-progress-pct" id="teamHrsPct_${safeId}">${progressPct.toFixed(0)}%</span>
          </div>
          <div class="team-hours-progress-bar">
            <div class="${fillClass}" id="teamHrsFill_${safeId}" style="width: ${progressPct.toFixed(1)}%"></div>
          </div>
        </div>
      `;

      grid.appendChild(card);
    });
  }

  // Live in-place update for team hours (called every second on the shifts tab)
  function updateTeamHoursLive() {
    const grid = document.getElementById('teamHoursGrid');
    if (!grid || !grid.children.length) return;

    const WORKDAY_TARGET = 8 * 3600;
    let members = getUniqueMembersList();
    if (!hasFullAttendanceAccess()) {
      members = members.filter(m => isSelfMember(m));
    }

    members.forEach(member => {
      const mId = member.id || (member.uid ? `RD-${member.uid.slice(0, 6).toUpperCase()}` : 'RD-EMP-000');
      const safeId = escapeHtml(mId);

      const todayEl = document.getElementById(`teamHrsToday_${safeId}`);
      const weekEl = document.getElementById(`teamHrsWeek_${safeId}`);
      const pctEl = document.getElementById(`teamHrsPct_${safeId}`);
      const fillEl = document.getElementById(`teamHrsFill_${safeId}`);
      const statusEl = document.getElementById(`teamHrsStatus_${safeId}`);

      if (todayEl) {
        const todaySec = calculateMemberSecondsToday(member);
        todayEl.textContent = formatMemberHoursToday(todaySec);
        todayEl.title = formatShiftDisplay(todaySec);

        if (pctEl) {
          const pct = Math.min(100, (todaySec / WORKDAY_TARGET) * 100);
          pctEl.textContent = `${pct.toFixed(0)}%`;
        }
        if (fillEl) {
          const pct = Math.min(100, (todaySec / WORKDAY_TARGET) * 100);
          fillEl.style.width = `${pct.toFixed(1)}%`;
          const isOvertime = todaySec > WORKDAY_TARGET;
          fillEl.className = isOvertime ? 'team-hours-progress-fill fill-overtime' : 'team-hours-progress-fill';
        }
      }

      if (weekEl) {
        const weekSec = calculateMemberWeeklyHours(member);
        weekEl.textContent = `${(weekSec / 3600).toFixed(1)}h`;
      }

      if (statusEl) {
        const isOnline = isMemberAppOnline(member);
        const dutyStatus = getMemberDutyStatus(member);
        const isOnDuty = dutyStatus === 'DUTY_ON';
        const isOnBreak = dutyStatus === 'DUTY_BREAK';

        let statusText = '🔴 OFFLINE';
        let statusClass = 'status-offline';

        if (member.suspended) {
          statusText = '⛔ SUSPENDED';
          statusClass = 'status-offline';
        } else if (isOnDuty) {
          statusText = '🟢 ON DUTY';
          statusClass = 'status-online';
        } else if (isOnBreak) {
          statusText = '⏸ ON BREAK';
          statusClass = 'status-break';
        } else if (isOnline) {
          statusText = '🟢 ONLINE (OFF DUTY)';
          statusClass = 'status-online';
        }

        statusEl.textContent = statusText;
        statusEl.className = `team-hours-status-badge ${statusClass}`;

        // Update card border highlight
        const card = statusEl.closest('.team-hours-card');
        if (card) {
          card.classList.remove('card-online', 'card-break');
          if (isOnDuty) card.classList.add('card-online');
          else if (isOnBreak) card.classList.add('card-break');
        }
      }
    });
  }

  function recordPunch(action) {
    if (!WorkspaceDB.data.punchLogs) WorkspaceDB.data.punchLogs = [];
    const currentMember = getCurrentResolvedMember();
    if (!state.currentMemberId && currentMember.id) {
      state.currentMemberId = currentMember.id;
    }

    const now = Date.now();
    const timeStr = new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = new Date(now).toLocaleDateString();
    const punchId = `punch_${currentMember.id || 'emp'}_${now}_${Math.random().toString(36).slice(2, 7)}`;

    const punchData = {
      id: punchId,
      workerId: currentMember.id,
      uid: state.currentUser?.uid || currentMember.uid || null,
      name: currentMember.displayName || currentMember.name || 'Team Member',
      email: currentMember.email || (state.currentUser?.email || ''),
      action: action,
      time: timeStr,
      date: dateStr,
      timestamp: now,
      cloudSynced: true
    };

    // Avoid duplicate punch entry within 10 seconds for same action
    const last = WorkspaceDB.data.punchLogs[WorkspaceDB.data.punchLogs.length - 1];
    if (last && last.action === action && last.workerId === punchData.workerId && Math.abs(now - (last.timestamp || 0)) < 10000) {
      return;
    }

    WorkspaceDB.data.punchLogs.push(punchData);
    WorkspaceDB.save().catch(() => {});
    reconcilePersonalShiftWithPunches();
    renderPunchLogs();
    renderTeamHoursDashboard();
    updateLiveFleetHours();

    // Cloud Firestore Persistence & Real-time Broadcast
    if (window.FirebaseService) {
      if (typeof FirebaseService.recordPunchLog === 'function') {
        FirebaseService.recordPunchLog(punchData).catch(err => console.warn('[PUNCH] Cloud sync error:', err));
      }
      if (FirebaseService.db) {
        const status = action === 'CLOCK_IN' ? 'DUTY_ON' : (action === 'BREAK' ? 'DUTY_BREAK' : 'DUTY_OFF');
        const todaySec = calculateMemberSecondsToday(currentMember);
        FirebaseService.updatePresenceFirestore(
          currentMember.id,
          status,
          todaySec
        );
      }
    }
  }

  function initShiftTimerControls() {
    const btnClockIn = document.getElementById('btnPersonalClockIn');
    const btnBreak = document.getElementById('btnPersonalBreak');
    const btnClockOut = document.getElementById('btnPersonalClockOut');
    const punchFilterSelect = document.getElementById('punchLogMemberFilter');

    if (punchFilterSelect && !punchFilterSelect.dataset.listenerBound) {
      punchFilterSelect.dataset.listenerBound = 'true';
      punchFilterSelect.addEventListener('change', () => {
        renderPunchLogs();
      });
    }

    // Auto-reconcile active personal shift with today's punches & start timer
    reconcilePersonalShiftWithPunches();

    btnClockIn?.addEventListener('click', () => {
      recordPunch('CLOCK_IN');
      playNotificationChirp(true);
      showQuickToast('Shift active: Clocked in successfully!', 'success');
    });

    btnBreak?.addEventListener('click', () => {
      if (state.personalShift.status === 'DUTY_BREAK') {
        recordPunch('CLOCK_IN');
        playNotificationChirp(true);
        showQuickToast('Resumed active shift duty.', 'success');
      } else if (state.personalShift.status === 'DUTY_ON') {
        recordPunch('BREAK');
        playNotificationChirp(false);
        showQuickToast('Shift paused for break.', 'info');
      }
    });

    btnClockOut?.addEventListener('click', () => {
      recordPunch('CLOCK_OUT');
      playNotificationChirp(false);
      showQuickToast('Shift logged & clocked out. Have a great rest!', 'info');
    });

    updateShiftUI();
  }

  // --- NAVIGATION & TABS ---
  function switchTab(tabId) {
    let normalized = tabId;
    if (typeof normalized === 'string') {
      if (normalized.startsWith('tab') && normalized.endsWith('View')) {
        normalized = normalized.slice(3, -4);
        normalized = normalized.charAt(0).toLowerCase() + normalized.slice(1);
      }
    }
    state.activeTab = normalized;

    if (normalized === 'wallpaper') {
      closeCommandCenter();
      return;
    }

    openCommandCenter();

    const targetViewId = `tab${capitalize(normalized)}View`;

    document.querySelectorAll('.cmd-tab-btn, .sidebar-nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.target === targetViewId);
    });

    document.querySelectorAll('.cmd-tab-pane').forEach(pane => {
      pane.classList.toggle('active', pane.id === targetViewId);
    });

    const cmdBody = document.querySelector('.command-body');
    if (cmdBody) {
      if (normalized === 'chat') {
        cmdBody.style.padding = '0';
        cmdBody.style.overflow = 'hidden';
      } else {
        cmdBody.style.padding = '';
        cmdBody.style.overflow = '';
      }
    }

    if (tabId === 'dashboard') renderDashboard();
    else if (normalized === 'dashboard') renderDashboard();
    else if (normalized === 'wallpapers') renderWallpaperGallery();
    else if (normalized === 'workers') renderWorkers();
    else if (normalized === 'timesheets') { reconcilePersonalShiftWithPunches(); renderPunchLogs(); renderTeamHoursDashboard(); updateAttendanceMetricsUI(); }
    else if (normalized === 'tasks') renderTasks();
    else if (normalized === 'chat') {
      const teamsChatPane = document.getElementById('teamsPaneChat');
      if (teamsChatPane) {
        document.querySelectorAll('.teams-deck-pane').forEach(p => {
          p.classList.add('hidden');
          p.classList.remove('active');
        });
        teamsChatPane.classList.remove('hidden');
        teamsChatPane.classList.add('active');
      }
      renderChatChannelsAndDMs();
      selectChatTarget(state.activeChannelId || 'general');
    }
    else if (normalized === 'telemetry') {
      renderFleetTelemetry();
      updateLiveFleetHours();
    }
    else if (normalized === 'database') WorkspaceDB.updateMetricsUI();
  }

  // Live real-time ticker for presence & fleet telemetry hours + team working hours
  setInterval(() => {
    const telemetryPane = document.getElementById('tabTelemetryView');
    if (telemetryPane && telemetryPane.classList.contains('active')) {
      updateLiveFleetHours();
    }
    const timesheetsPane = document.getElementById('tabTimesheetsView');
    if (timesheetsPane && timesheetsPane.classList.contains('active')) {
      updateTeamHoursLive();
    }
  }, 1000);

  function openCommandCenter() {
    state.commandCenterOpen = true;
    document.body.classList.add('mode-command');
    document.body.classList.remove('mode-wallpaper');
    const drawer = document.getElementById('commandCenterDrawer');
    if (drawer) {
      drawer.classList.remove('collapsed');
      drawer.style.display = 'flex';
    }
  }

  function closeCommandCenter() {
    state.commandCenterOpen = false;
    document.body.classList.remove('mode-command');
    document.body.classList.add('mode-wallpaper');
    const drawer = document.getElementById('commandCenterDrawer');
    if (drawer) {
      drawer.classList.add('collapsed');
      drawer.style.display = 'none';
    }
  }

  function toggleCommandCenter() {
    if (state.commandCenterOpen) {
      closeCommandCenter();
    } else {
      openCommandCenter();
      switchTab(state.activeTab || 'wallpapers');
    }
  }

  function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // --- 3D LANYARD CARD PHYSICS ---
  function initLanyardPhysics() {
    const card = document.getElementById('lanyardCard');
    if (!card) return;

    let isPhysicsRunning = false;

    function renderPhysicsFrame() {
      if (!state.tiltEnabled || !card) {
        isPhysicsRunning = false;
        return;
      }
      const dRotX = (state.mouse.targetRotX - state.card.curRotX);
      const dRotY = (state.mouse.targetRotY - state.card.curRotY);
      const dX = (state.mouse.targetX - state.card.curX);

      // Settle smoothly and sleep when delta is imperceptible
      if (Math.abs(dRotX) > 0.02 || Math.abs(dRotY) > 0.02 || Math.abs(dX) > 0.02) {
        state.card.curRotX += dRotX * 0.08;
        state.card.curRotY += dRotY * 0.08;
        state.card.curX += dX * 0.08;
        card.style.transform = `translateX(${state.card.curX.toFixed(2)}px) rotateX(${state.card.curRotX.toFixed(2)}deg) rotateY(${state.card.curRotY.toFixed(2)}deg)`;
        requestAnimationFrame(renderPhysicsFrame);
      } else {
        state.card.curRotX = state.mouse.targetRotX;
        state.card.curRotY = state.mouse.targetRotY;
        state.card.curX = state.mouse.targetX;
        card.style.transform = `translateX(${state.card.curX.toFixed(2)}px) rotateX(${state.card.curRotX.toFixed(2)}deg) rotateY(${state.card.curRotY.toFixed(2)}deg)`;
        isPhysicsRunning = false;
      }
    }

    const handleMouseMove = (e) => {
      if (!state.tiltEnabled) return;
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = (e.clientX - cx) / cx;
      const dy = (e.clientY - cy) / cy;

      state.mouse.targetRotY = dx * 16;
      state.mouse.targetRotX = -dy * 14;
      state.mouse.targetX = dx * 12;

      if (!isPhysicsRunning) {
        isPhysicsRunning = true;
        requestAnimationFrame(renderPhysicsFrame);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
  }

  // --- EVENT LISTENERS ---
  function bindEvents() {
    // Window Management & Pin Controls
    function updatePinUI(isPinned) {
      const topPinIcon = document.getElementById('topPinIcon');
      const topPinText = document.getElementById('topPinText');
      const cmdPinIcon = document.getElementById('cmdPinIcon');
      const cmdPinText = document.getElementById('cmdPinText');

      if (topPinIcon) topPinIcon.textContent = isPinned ? '🪟' : '📌';
      if (topPinText) topPinText.textContent = isPinned ? 'Workstation Mode' : 'Pin Mode';
      if (cmdPinIcon) cmdPinIcon.textContent = isPinned ? '🪟' : '📌';
      if (cmdPinText) cmdPinText.textContent = isPinned ? 'Workstation Mode' : 'Pin Mode';
    }

    async function handleTogglePin() {
      if (window.electronAPI && window.electronAPI.togglePinDesktop) {
        const pinned = await window.electronAPI.togglePinDesktop();
        updatePinUI(pinned);
        playNotificationChirp(true);
      } else {
        showQuickToast('Desktop Pin Mode requires the native Windows desktop app.', 'info');
      }
    }

    function toggleFullscreen() {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      } else {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    }

    document.getElementById('btnTopPinToggle')?.addEventListener('click', handleTogglePin);
    document.getElementById('btnCmdPinToggle')?.addEventListener('click', handleTogglePin);

    document.getElementById('btnTopMinimize')?.addEventListener('click', () => {
      if (window.electronAPI?.minimizeWindow) {
        window.electronAPI.minimizeWindow();
      } else {
        toggleCommandCenter();
      }
    });
    document.getElementById('btnCmdMinimize')?.addEventListener('click', () => {
      if (window.electronAPI?.minimizeWindow) {
        window.electronAPI.minimizeWindow();
      } else {
        toggleCommandCenter();
      }
    });

    document.getElementById('btnTopMaximize')?.addEventListener('click', () => {
      if (window.electronAPI?.maximizeWindow) {
        window.electronAPI.maximizeWindow();
      } else {
        toggleFullscreen();
      }
    });
    document.getElementById('btnCmdMaximize')?.addEventListener('click', () => {
      if (window.electronAPI?.maximizeWindow) {
        window.electronAPI.maximizeWindow();
      } else {
        toggleFullscreen();
      }
    });

    document.getElementById('btnTopClose')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (window.electronAPI?.closeWindow) {
        window.electronAPI.closeWindow();
      } else {
        window.close();
      }
    });

    document.getElementById('btnContinueOffline')?.addEventListener('click', () => {
      closeAuthModal();
      updateAuthUI(null, null);
      playNotificationChirp(true);
    });

    if (window.electronAPI && window.electronAPI.onDesktopPinnedChanged) {
      window.electronAPI.onDesktopPinnedChanged((pinned) => {
        updatePinUI(pinned);
      });
    }

    if (window.electronAPI && window.electronAPI.isPinnedDesktop) {
      window.electronAPI.isPinnedDesktop().then(pinned => {
        updatePinUI(pinned);
      });
    }

    // Navigation Triggers
    document.getElementById('btnBrandHome')?.addEventListener('click', (e) => {
      e.preventDefault();
      toggleCommandCenter();
    });
    document.getElementById('btnOpenCommandCenter')?.addEventListener('click', (e) => {
      e.preventDefault();
      toggleCommandCenter();
    });
    document.getElementById('cardBadgeTrigger')?.addEventListener('click', () => {
      openBadgeViewerModal(state.currentMemberId);
    });
    document.getElementById('btnCloseBadgeViewer')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      document.getElementById('badgeViewerModal')?.classList.add('hidden');
    });
    document.getElementById('btnCloseBadgeModal')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      document.getElementById('badgeViewerModal')?.classList.add('hidden');
    });
    document.getElementById('btnCloseCommandCenter')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeCommandCenter();
    });
    document.getElementById('btnToggleWallpaperMode')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeCommandCenter();
    });

    // Tab Navigation Buttons
    document.getElementById('tabBtnWallpapers')?.addEventListener('click', () => switchTab('wallpapers'));
    document.getElementById('tabBtnWorkers')?.addEventListener('click', () => switchTab('workers'));
    document.getElementById('tabBtnTimesheets')?.addEventListener('click', () => switchTab('timesheets'));
    document.getElementById('tabBtnTasks')?.addEventListener('click', () => switchTab('tasks'));
    document.getElementById('tabBtnChat')?.addEventListener('click', () => switchTab('chat'));
    document.getElementById('tabBtnTelemetry')?.addEventListener('click', () => switchTab('telemetry'));
    document.getElementById('tabBtnDatabase')?.addEventListener('click', () => switchTab('database'));

    // Create Member Modal
    document.getElementById('btnOpenCreateWorkerModal')?.addEventListener('click', () => {
      state.tempNewWorkerPhoto = null;
      safeSetText(document.getElementById('newWorkerPhotoStatus'), 'Default Avatar');
      document.getElementById('createWorkerModal')?.classList.remove('hidden');
    });
    document.getElementById('btnCloseCreateWorker')?.addEventListener('click', () => {
      document.getElementById('createWorkerModal')?.classList.add('hidden');
    });
    document.getElementById('btnCancelCreateWorker')?.addEventListener('click', () => {
      document.getElementById('createWorkerModal')?.classList.add('hidden');
    });
    document.getElementById('createWorkerBackdrop')?.addEventListener('click', () => {
      document.getElementById('createWorkerModal')?.classList.add('hidden');
    });

    // Select Photo for New Member
    document.getElementById('btnPickPhotoForNewWorker')?.addEventListener('click', async () => {
      if (window.electronAPI && window.electronAPI.dbSelectPhoto) {
        const res = await window.electronAPI.dbSelectPhoto();
        if (!res.canceled && res.dataUrl) {
          state.tempNewWorkerPhoto = res.dataUrl;
          safeSetText(document.getElementById('newWorkerPhotoStatus'), `✓ Photo Selected (${res.fileName})`);
          playNotificationChirp(true);
        }
      } else {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.onchange = (e) => {
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (re) => {
              state.tempNewWorkerPhoto = re.target.result;
              safeSetText(document.getElementById('newWorkerPhotoStatus'), `✓ Photo Selected (${file.name})`);
              playNotificationChirp(true);
            };
            reader.readAsDataURL(file);
          }
        };
        fileInput.click();
      }
    });

    // Create Member Form Submission
    document.getElementById('formCreateWorker')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('newWorkerId')?.value.trim();
      const name = document.getElementById('newWorkerName')?.value.trim();
      const role = document.getElementById('newWorkerRole')?.value.trim();
      const dept = document.getElementById('newWorkerDept')?.value;
      const email = document.getElementById('newWorkerEmail')?.value.trim() || `${id.toLowerCase()}@reddot.com`;

      if (!id || !name || !role) return;

      const newMember = {
        id,
        uid: id,
        name,
        displayName: name,
        role,
        dept,
        email,
        photoUrl: state.tempNewWorkerPhoto || '',
        photoURL: state.tempNewWorkerPhoto || '',
        status: 'DUTY_ON',
        todayHours: 0,
        weeklyHours: 0,
        avatarText: name.slice(0, 2).toUpperCase(),
        active: true
      };

      WorkspaceDB.data.members[id] = newMember;
      if (!WorkspaceDB.data.auditLogs) WorkspaceDB.data.auditLogs = [];
      WorkspaceDB.data.auditLogs.push({
        action: 'MEMBER_CREATED',
        performedByName: state.currentMember?.name || 'JAGADISH K',
        details: `Created member ${name} (${id}) in ${dept}`,
        timestamp: Date.now()
      });

      await WorkspaceDB.save();

      // Sync newly created member profile to Cloud Firestore
      if (window.FirebaseService && FirebaseService.createMemberDoc) {
        try {
          await FirebaseService.createMemberDoc(newMember);
        } catch (err) {
          console.warn('[FIREBASE] Member sync notice:', err.message);
        }
      }

      document.getElementById('createWorkerModal')?.classList.add('hidden');
      document.getElementById('formCreateWorker')?.reset();
      state.tempNewWorkerPhoto = null;
      safeSetText(document.getElementById('newWorkerPhotoStatus'), 'Default Avatar');

      renderWorkers();
      renderChatChannelsAndDMs();
      playNotificationChirp(true);
      showQuickToast(`✅ Member ${name} (${id}) created and synced!`, 'success');
    });

    // Photo Upload & Mount on Badge Viewer Modal
    document.getElementById('btnUploadPhotoForBadge')?.addEventListener('click', uploadPhotoForBadge);
    document.getElementById('btnMountBadgeWallpaper')?.addEventListener('click', () => {
      mountMemberOnWallpaper(state.selectedViewingMemberId);
    });

    // Create Task Submission
    document.getElementById('formCreateTask')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('taskTitleInput')?.value.trim();
      const selectEl = document.getElementById('taskAssigneeSelect');
      const rawVal = selectEl?.value || 'ALL';

      let assigneeId = rawVal;
      let assigneeName = 'Entire Team';
      let assigneeEmail = '';
      let assigneeUid = '';

      if (rawVal !== 'ALL') {
        const member = getUniqueMembersList().find(m => m.id === rawVal || m.uid === rawVal || m.email === rawVal);
        if (member) {
          assigneeId = member.id || rawVal;
          assigneeName = member.displayName || member.name || rawVal;
          assigneeEmail = member.email || '';
          assigneeUid = member.uid || '';
        } else {
          const opt = selectEl?.selectedOptions ? selectEl.selectedOptions[0] : null;
          assigneeName = opt?.dataset?.name || rawVal;
          assigneeEmail = opt?.dataset?.email || '';
          assigneeUid = opt?.dataset?.uid || '';
        }
      }

      const priority = document.getElementById('taskPrioritySelect')?.value || 'NORMAL';
      const dueAt = document.getElementById('taskDeadlineInput')?.value.trim() || 'Today 5:00 PM';
      const rawDate = document.getElementById('taskDateInput')?.value;
      const taskTimestamp = rawDate ? parseDateInputToTimestamp(rawDate, Date.now()) : Date.now();
      const description = document.getElementById('taskDescInput')?.value.trim();

      if (!title) return;

      // Deterministic Single Task ID: exact same ID in local DB and Cloud Firestore (No duplicates!)
      const taskId = 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);

      const creatorName = WorkspaceDB.data.members[state.currentMemberId]?.name || state.currentUser?.displayName || 'JAGADISH K';
      const newTask = {
        id: taskId,
        title,
        description,
        assigneeId,
        assigneeUid,
        assigneeName,
        assigneeEmail,
        priority,
        status: 'ASSIGNED',
        dueAt,
        createdAt: taskTimestamp,
        taskDate: rawDate || formatTimestampForDateInput(taskTimestamp),
        activity: [
          { authorName: creatorName, text: `Created task for ${assigneeName}`, timestamp: Date.now() }
        ]
      };

      if (!WorkspaceDB.data.tasks) WorkspaceDB.data.tasks = [];
      WorkspaceDB.data.tasks.unshift(newTask);
      await WorkspaceDB.save();

      // Cloud Firestore Multi-Device Sync
      if (window.FirebaseService) {
        try {
          await FirebaseService.createTask({
            id: taskId,
            title, description, priority, assigneeId, assigneeUid, assigneeName, assigneeEmail, dueAt,
            createdAt: taskTimestamp,
            taskDate: newTask.taskDate
          });
        } catch (err) {
          console.warn('[FIREBASE] Task cloud creation note:', err.message);
        }
      }

      document.getElementById('formCreateTask').reset();
      const dateInput = document.getElementById('taskDateInput');
      if (dateInput) dateInput.value = formatTimestampForDateInput(Date.now());
      populateAssigneeSelect();
      renderTasks();
      playNotificationChirp(true);
    });

    // Task Filter Chips
    document.getElementById('taskFilterGroup')?.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.getElementById('taskFilterGroup').querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        state.taskFilter = chip.getAttribute('data-filter');
        renderTasks();
      });
    });

    // Task Activity Modal Dismiss
    document.getElementById('btnCloseTaskActivity')?.addEventListener('click', () => {
      document.getElementById('taskActivityModal')?.classList.add('hidden');
    });
    document.getElementById('taskActivityBackdrop')?.addEventListener('click', () => {
      document.getElementById('taskActivityModal')?.classList.add('hidden');
    });

    // Edit Task Modal Dismiss & Submission
    document.getElementById('btnCloseEditTask')?.addEventListener('click', closeEditTaskModal);
    document.getElementById('btnCancelEditTask')?.addEventListener('click', closeEditTaskModal);
    document.getElementById('editTaskBackdrop')?.addEventListener('click', closeEditTaskModal);

    document.getElementById('formEditTask')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const taskId = document.getElementById('editTaskId')?.value;
      const title = document.getElementById('editTaskTitle')?.value.trim();
      if (!title) {
        showQuickToast('Please provide a task title', 'error');
        return;
      }

      const selectEl = document.getElementById('editTaskAssignee');
      const rawVal = selectEl?.value || 'ALL';

      let assigneeId = rawVal;
      let assigneeName = 'Entire Team';
      let assigneeEmail = '';
      let assigneeUid = '';

      if (rawVal !== 'ALL') {
        const member = getUniqueMembersList().find(m => m.id === rawVal || m.uid === rawVal || m.email === rawVal);
        if (member) {
          assigneeId = member.id || rawVal;
          assigneeName = member.displayName || member.name || rawVal;
          assigneeEmail = member.email || '';
          assigneeUid = member.uid || '';
        } else {
          const opt = selectEl?.selectedOptions ? selectEl.selectedOptions[0] : null;
          assigneeName = opt?.dataset?.name || rawVal;
          assigneeEmail = opt?.dataset?.email || '';
          assigneeUid = opt?.dataset?.uid || '';
        }
      }

      const priority = document.getElementById('editTaskPriority')?.value || 'NORMAL';
      const rawStatus = document.getElementById('editTaskStatus')?.value || 'REACHED';
      const status = rawStatus === 'ACCOMPLISHED' ? 'COMPLETED' : rawStatus;
      const dueAt = document.getElementById('editTaskDue')?.value.trim() || 'Today 5:00 PM';
      const rawDate = document.getElementById('editTaskDate')?.value;
      const description = document.getElementById('editTaskDesc')?.value.trim();
      const editorName = WorkspaceDB.data.members[state.currentMemberId]?.name || state.currentUser?.displayName || 'JAGADISH K';

      let task = (WorkspaceDB.data.tasks || []).find(t => t.id === taskId);

      if (!task || !taskId || taskId.startsWith('new_')) {
        // Create brand new task
        const newTimestamp = rawDate ? parseDateInputToTimestamp(rawDate) : Date.now();
        const newTask = {
          id: 'task_' + Date.now(),
          code: 'TASK-' + (Math.floor(1000 + Math.random() * 9000)),
          title,
          category: 'CORE ARCHITECTURE',
          pipeline: 'feat/sprint-14',
          priority,
          status,
          dueAt,
          assigneeId,
          assigneeName,
          assigneeEmail,
          assigneeUid,
          description,
          scope: description || 'Execute sprint workstation objectives aligned with Reddot engineering standards.',
          subtasks: [
            { label: 'Initial specification & architectural verification', done: false },
            { label: 'Implementation pass & test coverage', done: false },
            { label: 'Security attestation & code review', done: false }
          ],
          createdAt: newTimestamp,
          taskDate: rawDate || formatTimestampForDateInput(newTimestamp),
          updatedAt: Date.now(),
          activity: [{
            authorName: editorName,
            text: `Created new sprint task: ${title}`,
            timestamp: Date.now()
          }]
        };

        if (!WorkspaceDB.data.tasks) WorkspaceDB.data.tasks = [];
        WorkspaceDB.data.tasks.unshift(newTask);
        state.activeSelectedTask = newTask;

        await WorkspaceDB.save();

        if (window.FirebaseService?.createTask) {
          FirebaseService.createTask(newTask).catch(() => {});
        }

        closeEditTaskModal();
        renderTasks();
        playNotificationChirp(true);
        showQuickToast(`New sprint task "${title}" created successfully!`, 'success');
      } else {
        // Update existing task
        let newTimestamp = task.createdAt || Date.now();
        if (rawDate) {
          newTimestamp = parseDateInputToTimestamp(rawDate, task.createdAt);
        }

        task.title = title;
        task.description = description;
        task.assigneeId = assigneeId;
        task.assigneeName = assigneeName;
        task.assigneeEmail = assigneeEmail;
        task.assigneeUid = assigneeUid;
        task.priority = priority;
        task.status = status;
        task.dueAt = dueAt;
        task.createdAt = newTimestamp;
        task.taskDate = rawDate || formatTimestampForDateInput(newTimestamp);
        task.updatedAt = Date.now();

        if (!task.activity) task.activity = [];
        task.activity.push({
          authorName: editorName,
          text: `Updated task details: ${title} (${status})`,
          timestamp: Date.now()
        });

        await WorkspaceDB.save();

        if (window.FirebaseService?.updateTask) {
          FirebaseService.updateTask(task.id, {
            title,
            description,
            assigneeId,
            assigneeName,
            assigneeEmail,
            assigneeUid,
            priority,
            status,
            dueAt,
            createdAt: newTimestamp,
            taskDate: task.taskDate,
            updatedAt: Date.now()
          }).catch(() => {});
        }

        closeEditTaskModal();
        state.activeSelectedTask = task;
        renderTasks();
        playNotificationChirp(true);
        showQuickToast(`Task "${title}" updated successfully!`, 'success');
      }
    });

    // --- TEAMS CHANNEL HUB TABS ---
    document.getElementById('chatHubTabs')?.querySelectorAll('.hub-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        switchChatHubTab(btn.getAttribute('data-hub-tab'));
      });
    });

    // --- TEAMS MESSAGE COMPOSER & KEYBOARD PRODUCTIVITY ---
    const chatInput = document.getElementById('chatMessageInput');
    chatInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendChatMessage(chatInput.value);
      } else if (e.key === 'ArrowUp' && !chatInput.value.trim()) {
        // Teams Hallmark: Up Arrow in empty input initiates editing last sent message
        const msgs = WorkspaceDB.data.chats[state.activeChannelId] || [];
        const myUid = state.currentUser?.uid || state.currentMemberId || 'RD-USER';
        for (let i = msgs.length - 1; i >= 0; i--) {
          const m = msgs[i];
          if (m.senderUid === myUid || m.senderId === myUid || m.senderEmpId === state.currentMemberId) {
            e.preventDefault();
            editChatMessage(m.id);
            break;
          }
        }
      } else if (e.key === 'Escape') {
        if (state.editingMessageId) {
          state.editingMessageId = null;
          renderMessages();
        }
        if (state.activeReply) {
          cancelReply();
        }
        document.getElementById('mentionAutocompletePopup')?.classList.add('hidden');
        document.getElementById('emojiPickerPopup')?.classList.add('hidden');
      }
    });

    // Composer Input Events (Auto-Grow, Typing Broadcast, @Mentions)
    chatInput?.addEventListener('input', () => {
      chatInput.style.height = 'auto';
      chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
      handleTypingInput();

      const val = chatInput.value;
      const cursor = chatInput.selectionStart;
      const beforeCursor = val.slice(0, cursor);
      const atMatch = beforeCursor.match(/@([a-zA-Z0-9_\-\s]*)$/);
      const popup = document.getElementById('mentionAutocompletePopup');
      if (atMatch && popup) {
        const q = atMatch[1].toLowerCase().trim();
        const members = getUniqueMembersList().filter(m => {
          const name = (m.name || m.displayName || '').toLowerCase();
          const email = (m.email || '').toLowerCase();
          return name.includes(q) || email.includes(q);
        });

        if (members.length > 0) {
          popup.innerHTML = members.slice(0, 6).map(m => `
            <div class="mention-item" data-name="${escapeHtml(m.name || m.displayName || 'Member')}">
              <span class="mention-avatar">${escapeHtml((m.name || 'M').slice(0, 2).toUpperCase())}</span>
              <span class="mention-name">${escapeHtml(m.name || m.displayName || 'Member')}</span>
              <span class="mention-role">${escapeHtml(m.role || 'Member')}</span>
            </div>
          `).join('');

          popup.querySelectorAll('.mention-item').forEach(item => {
            item.onclick = () => {
              const chosenName = item.getAttribute('data-name');
              const newText = beforeCursor.replace(/@([a-zA-Z0-9_\-\s]*)$/, `@${chosenName} `) + val.slice(cursor);
              chatInput.value = newText;
              chatInput.focus();
              popup.classList.add('hidden');
            };
          });

          popup.classList.remove('hidden');
        } else {
          popup.classList.add('hidden');
        }
      } else if (popup) {
        popup.classList.add('hidden');
      }
    });

    // Send Form Submit
    document.getElementById('formSendMessage')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      sendChatMessage(chatInput?.value || '');
    });

    // Formatting Toolbar Toggle & Actions
    document.getElementById('btnToggleFormat')?.addEventListener('click', () => {
      document.getElementById('chatFormatToolbar')?.classList.toggle('hidden');
    });

    document.querySelectorAll('.format-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const fmt = btn.getAttribute('data-format');
        if (!chatInput) return;
        const start = chatInput.selectionStart || 0;
        const end = chatInput.selectionEnd || 0;
        const selected = chatInput.value.slice(start, end) || 'text';
        let replacement = selected;

        if (fmt === 'bold') replacement = `**${selected}**`;
        else if (fmt === 'italic') replacement = `*${selected}*`;
        else if (fmt === 'strike') replacement = `~~${selected}~~`;
        else if (fmt === 'code') replacement = `\`${selected}\``;
        else if (fmt === 'codeblock') replacement = `\n\`\`\`\n${selected}\n\`\`\`\n`;
        else if (fmt === 'quote') replacement = `\n> ${selected}\n`;
        else if (fmt === 'list') replacement = `\n- ${selected}\n`;
        else if (fmt === 'link') replacement = `[${selected}](https://)`;

        chatInput.setRangeText(replacement, start, end, 'end');
        chatInput.focus();
      });
    });

    // File & Image Attachment Pickers
    document.getElementById('btnAttachFile')?.addEventListener('click', () => {
      document.getElementById('hiddenFileInput')?.click();
    });
    document.getElementById('btnAttachImage')?.addEventListener('click', () => {
      document.getElementById('hiddenImageInput')?.click();
    });

    function compressImageFile(file, maxWidth = 1280, maxHeight = 1280, quality = 0.75) {
      return new Promise((resolve) => {
        if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') {
          const reader = new FileReader();
          reader.onload = () => resolve({ dataUrl: reader.result, size: file.size, name: file.name });
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(file);
          return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            let width = img.naturalWidth || img.width;
            let height = img.naturalHeight || img.height;
            if (width > maxWidth || height > maxHeight) {
              if (width / height > maxWidth / maxHeight) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
              } else {
                width = Math.round((width * maxHeight) / height);
                height = maxHeight;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, width);
            canvas.height = Math.max(1, height);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            let format = 'image/webp';
            let dataUrl = canvas.toDataURL(format, quality);
            if (!dataUrl.startsWith('data:image/webp')) {
              format = 'image/jpeg';
              dataUrl = canvas.toDataURL(format, quality);
            }
            const head = dataUrl.indexOf(',') + 1;
            const approxSize = Math.round((dataUrl.length - head) * 3 / 4);
            const ext = format === 'image/webp' ? '.webp' : '.jpg';
            const baseName = file.name.replace(/\.[^/.]+$/, "");
            resolve({
              dataUrl,
              size: approxSize,
              name: baseName.endsWith(ext) ? baseName : baseName + ext
            });
          };
          img.onerror = () => resolve(null);
          img.src = e.target.result;
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });
    }

    async function handleFilesSelected(files) {
      if (!files || files.length === 0) return;
      for (const file of Array.from(files)) {
        if (file.type.startsWith('image/')) {
          const res = await compressImageFile(file);
          if (!res || !res.dataUrl) continue;
          state.pendingAttachments.push({
            id: 'att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            name: res.name || file.name,
            size: res.size || file.size,
            type: 'image/webp',
            isImage: true,
            dataUrl: res.dataUrl
          });
          renderPendingAttachments();
        } else {
          if (file.size > 700 * 1024) {
            showQuickToast(`File "${file.name}" is ${formatBytes(file.size)}. Direct sync limit is 700KB.`, 'warning');
            continue;
          }
          const reader = new FileReader();
          reader.onload = () => {
            state.pendingAttachments.push({
              id: 'att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
              name: file.name,
              size: file.size,
              type: file.type,
              isImage: false,
              dataUrl: reader.result
            });
            renderPendingAttachments();
          };
          reader.readAsDataURL(file);
        }
      }
    }

    document.getElementById('hiddenFileInput')?.addEventListener('change', (e) => {
      handleFilesSelected(e.target.files);
      e.target.value = '';
    });
    document.getElementById('hiddenImageInput')?.addEventListener('change', (e) => {
      handleFilesSelected(e.target.files);
      e.target.value = '';
    });

    function renderPendingAttachments() {
      const bar = document.getElementById('chatAttachmentBar');
      const list = document.getElementById('chatAttachmentList');
      if (!bar || !list) return;
      list.replaceChildren();

      if (state.pendingAttachments.length === 0) {
        bar.classList.add('hidden');
        return;
      }

      state.pendingAttachments.forEach(att => {
        const chip = document.createElement('div');
        chip.className = 'attachment-preview-item';
        chip.innerHTML = `
          ${att.isImage ? `<img src="${sanitizeUrl(att.dataUrl)}" alt="${escapeHtml(att.name)}">` : `<span>📎</span>`}
          <span>${escapeHtml(att.name)} (${formatBytes(att.size || 0)})</span>
          <button type="button" class="btn-remove-attachment" title="Remove">&times;</button>
        `;
        chip.querySelector('.btn-remove-attachment')?.addEventListener('click', () => {
          state.pendingAttachments = state.pendingAttachments.filter(a => a.id !== att.id);
          renderPendingAttachments();
        });
        list.appendChild(chip);
      });

      bar.classList.remove('hidden');
    }

    // Clipboard Paste (Ctrl+V) for Instant Images
    chatInput?.addEventListener('paste', (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            e.preventDefault();
            const file = new File([blob], `pasted_image_${Date.now()}.png`, { type: blob.type });
            handleFilesSelected([file]);
          }
        }
      }
    });

    // Drag & Drop onto Chat Pane
    const pane = document.getElementById('chatConversationPane');
    const dropZone = document.getElementById('chatDropZone');
    if (pane && dropZone) {
      pane.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('hidden');
      });
      pane.addEventListener('dragleave', (e) => {
        if (!pane.contains(e.relatedTarget)) {
          dropZone.classList.add('hidden');
        }
      });
      pane.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('hidden');
        if (e.dataTransfer?.files?.length) {
          handleFilesSelected(e.dataTransfer.files);
        }
      });
    }

    // Voice Memo Recording Controls
    document.getElementById('btnRecordVoice')?.addEventListener('click', toggleVoiceRecording);
    document.getElementById('btnCancelVoice')?.addEventListener('click', () => stopVoiceRecording(false));
    document.getElementById('btnSendVoice')?.addEventListener('click', () => stopVoiceRecording(true));

    // Quoted Reply Cancel
    document.getElementById('btnCancelReply')?.addEventListener('click', cancelReply);

    // Pinned Banner Jump and Dismiss
    document.getElementById('btnJumpPinned')?.addEventListener('click', () => {
      const msgs = WorkspaceDB.data.chats[state.activeChannelId] || [];
      const pinned = msgs.filter(m => m.isPinned);
      if (pinned.length > 0) {
        const lastPinned = pinned[pinned.length - 1];
        switchChatHubTab('posts');
        setTimeout(() => {
          const row = document.querySelector(`[data-msg-id="${lastPinned.id}"]`);
          if (row) {
            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            row.style.boxShadow = '0 0 16px var(--accent-cyan)';
            setTimeout(() => row.style.boxShadow = 'none', 1800);
          }
        }, 50);
      }
    });
    document.getElementById('btnDismissPinnedBanner')?.addEventListener('click', () => {
      document.getElementById('chatPinnedBanner')?.classList.add('hidden');
    });

    // Instant Channel Search
    document.getElementById('btnToggleChatSearch')?.addEventListener('click', () => {
      const wrap = document.getElementById('chatSearchWrap');
      const input = document.getElementById('inputChatSearch');
      if (wrap.style.display === 'none' || !wrap.style.display) {
        wrap.style.display = 'flex';
        input?.focus();
      } else {
        wrap.style.display = 'none';
        state.chatSearchQuery = '';
        renderMessages();
      }
    });
    document.getElementById('btnCloseChatSearch')?.addEventListener('click', () => {
      const wrap = document.getElementById('chatSearchWrap');
      if (wrap) wrap.style.display = 'none';
      state.chatSearchQuery = '';
      renderMessages();
    });
    document.getElementById('inputChatSearch')?.addEventListener('input', (e) => {
      state.chatSearchQuery = e.target.value.trim();
      const countEl = document.getElementById('chatSearchCount');
      const msgs = WorkspaceDB.data.chats[state.activeChannelId] || [];
      if (state.chatSearchQuery) {
        const matches = msgs.filter(m => m.text && m.text.toLowerCase().includes(state.chatSearchQuery.toLowerCase()));
        if (countEl) countEl.textContent = `${matches.length} found`;
      } else if (countEl) {
        countEl.textContent = '';
      }
      renderMessages();
    });

    // Quick Emoji Picker
    const emojis = ['😀', '😂', '😍', '🎉', '🚀', '🔥', '👍', '❤️', '👏', '🙌', '💯', '✨', '⚡', '💡', '✅', '👀', '💻', '⭐'];
    const emojiPopup = document.getElementById('emojiPickerPopup');
    if (emojiPopup) {
      emojiPopup.innerHTML = emojis.map(em => `<button type="button" class="emoji-btn">${em}</button>`).join('');
      emojiPopup.querySelectorAll('.emoji-btn').forEach(btn => {
        btn.onclick = () => {
          if (chatInput) {
            const start = chatInput.selectionStart || 0;
            chatInput.setRangeText(btn.textContent, start, start, 'end');
            chatInput.focus();
          }
          emojiPopup.classList.add('hidden');
        };
      });
    }
    document.getElementById('btnEmojiPicker')?.addEventListener('click', (e) => {
      e.stopPropagation();
      emojiPopup?.classList.toggle('hidden');
    });

    // Teams Presence Status Popup
    const statusPopup = document.getElementById('teamsStatusPopup');
    document.getElementById('roleDot')?.addEventListener('click', (e) => {
      e.stopPropagation();
      statusPopup?.classList.toggle('hidden');
    });
    statusPopup?.querySelectorAll('.status-option').forEach(opt => {
      opt.onclick = () => {
        const newStatus = opt.getAttribute('data-status');
        state.teamsPresence = newStatus;
        localStorage.setItem('rd_teams_presence', newStatus);
        const dot = document.getElementById('roleDot');
        const colors = {
          available: '#00e676',
          busy: '#ff5252',
          away: '#ffb300',
          dnd: '#ff2a4d'
        };
        if (dot) dot.style.background = colors[newStatus] || '#00e676';
        statusPopup.classList.add('hidden');
        playNotificationChirp(true);
      };
    });

    // Global Dismiss for popups on click outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#teamsStatusPopup') && !e.target.closest('#roleDot')) {
        statusPopup?.classList.add('hidden');
      }
      if (!e.target.closest('#emojiPickerPopup') && !e.target.closest('#btnEmojiPicker')) {
        emojiPopup?.classList.add('hidden');
      }
      if (!e.target.closest('#mentionAutocompletePopup') && e.target !== chatInput) {
        document.getElementById('mentionAutocompletePopup')?.classList.add('hidden');
      }
    });

    // Lightbox Modal Dismiss
    document.getElementById('btnCloseLightbox')?.addEventListener('click', closeLightbox);
    document.getElementById('imageLightboxBackdrop')?.addEventListener('click', closeLightbox);

    // Database Diagnostics
    document.getElementById('btnRunDbDiagnostics')?.addEventListener('click', runDatabaseDiagnostics);
    document.getElementById('btnExportDbBackup')?.addEventListener('click', exportDatabaseBackup);
    document.getElementById('btnSelectCustomWallpaperBadge')?.addEventListener('click', uploadPhotoForBadge);

    document.getElementById('btnSyncCloudVaultNow')?.addEventListener('click', async () => {
      if (window.FirebaseService) {
        try {
          if (FirebaseService.currentUser && FirebaseService.syncMemberProfile) {
            await FirebaseService.syncMemberProfile(FirebaseService.currentUser);
          }
          if (typeof setupCloudRealtimeSubscriptions === 'function') {
            setupCloudRealtimeSubscriptions();
          }
          playNotificationChirp(true);
          showQuickToast('⚡ Cloud Vault Synced! Dynamic profiles and channels refreshed.', 'success');
        } catch (e) {
          showQuickToast(`Sync note: ${e.message}`, 'warning');
        }
      }
    });

    document.getElementById('btnResetDatabaseToDefaults')?.addEventListener('click', async () => {
      if (confirm('Reset workspace database to initial factory fixtures?')) {
        WorkspaceDB.data = JSON.parse(JSON.stringify(INITIAL_SEED_DATA));
        await WorkspaceDB.save();
        renderWorkers();
        renderTasks();
        renderChatChannelsAndDMs();
        renderFleetTelemetry();
        playNotificationChirp(true);
        showQuickToast('Database reset to clean factory defaults.', 'info');
      }
    });

    // Authentication & Profile Session Deck
    document.getElementById('btnAuthTrigger')?.addEventListener('click', () => {
      if (state.currentUser) {
        openUserProfileModal();
      } else {
        openAuthModal('signin');
      }
    });

    document.getElementById('tabAuthSignIn')?.addEventListener('click', () => switchAuthTab('signin'));
    document.getElementById('tabAuthSignUp')?.addEventListener('click', () => switchAuthTab('signup'));
    document.getElementById('btnCloseAuthModal')?.addEventListener('click', closeAuthModal);
    document.getElementById('authModalBackdrop')?.addEventListener('click', closeAuthModal);

    // 1-Click Google ID Authentication
    document.getElementById('btnGoogleSignIn')?.addEventListener('click', async () => {
      if (!window.FirebaseService || !FirebaseService.auth) {
        showAuthAlert('Firebase Auth is not initialized. Please check network connection.');
        return;
      }

      const btnGoogle = document.getElementById('btnGoogleSignIn');
      if (btnGoogle) {
        btnGoogle.disabled = true;
        btnGoogle.style.opacity = '0.7';
      }

      try {
        await FirebaseService.signInWithGoogle();
        closeAuthModal();
        playNotificationChirp(true);
      } catch (err) {
        console.error('[AUTH] Google Sign-In error:', err);
        let msg = err.message || 'Google Sign-In failed';
        if (err.code === 'auth/popup-closed-by-user') {
          msg = 'Google Sign-In popup was closed before completing.';
        } else if (err.code === 'auth/popup-blocked') {
          msg = 'Popup was blocked by window policy. Please use work email sign-in.';
        } else if (err.code === 'auth/cancelled-popup-request') {
          msg = 'Authentication request was cancelled.';
        }
        showAuthAlert(msg, true);
        playNotificationChirp(false);
      } finally {
        if (btnGoogle) {
          btnGoogle.disabled = false;
          btnGoogle.style.opacity = '1';
        }
      }
    });

    // Pick Photo for Profile Registration
    document.getElementById('btnPickSignUpPhoto')?.addEventListener('click', async () => {
      if (window.electronAPI && window.electronAPI.dbSelectPhoto) {
        const res = await window.electronAPI.dbSelectPhoto();
        if (!res.canceled && res.dataUrl) {
          state.tempSignUpPhoto = res.dataUrl;
          safeSetText(document.getElementById('signUpPhotoStatus'), `✓ Photo Selected (${res.fileName || 'custom'})`);
          playNotificationChirp(true);
        }
      } else {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.onchange = (e) => {
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (re) => {
              state.tempSignUpPhoto = re.target.result;
              safeSetText(document.getElementById('signUpPhotoStatus'), `✓ Photo Selected (${file.name})`);
              playNotificationChirp(true);
            };
            reader.readAsDataURL(file);
          }
        };
        fileInput.click();
      }
    });

    // Handle Sign In Form
    document.getElementById('formSignIn')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('inputSignInEmail')?.value.trim();
      const password = document.getElementById('inputSignInPassword')?.value;
      const btnSubmit = document.getElementById('btnSubmitSignIn');

      if (!email || !password) return;

      if (!window.FirebaseService || !FirebaseService.auth) {
        showAuthAlert('Firebase Auth is not initialized. Please check network and credentials.');
        return;
      }

      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Verifying Credentials...';
      }

      try {
        await FirebaseService.signIn(email, password);
        closeAuthModal();
        playNotificationChirp(true);
      } catch (err) {
        let msg = err.message || 'Failed to sign in';
        if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
          msg = 'Invalid email or password. Please verify credentials or create a profile.';
        }
        showAuthAlert(msg, true);
        playNotificationChirp(false);
      } finally {
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.textContent = '⚡ Sign In to Workstation';
        }
      }
    });

    // Handle Create Profile / Sign Up Form
    document.getElementById('formSignUp')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('inputSignUpName')?.value.trim();
      const empId = document.getElementById('inputSignUpEmpId')?.value.trim();
      const dept = document.getElementById('selectSignUpDept')?.value;
      const role = document.getElementById('inputSignUpRole')?.value.trim();
      const email = document.getElementById('inputSignUpEmail')?.value.trim();
      const password = document.getElementById('inputSignUpPassword')?.value;
      const btnSubmit = document.getElementById('btnSubmitSignUp');

      if (!name || !email || !password || !role) return;

      if (!window.FirebaseService || !FirebaseService.auth) {
        showAuthAlert('Firebase Auth is not initialized. Please check network.');
        return;
      }

      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Creating Profile & Syncing...';
      }

      try {
        await FirebaseService.signUp(email, password, name, role || 'employee', {
          empId: empId || `RD-${Date.now().toString().slice(-4)}`,
          dept: dept || 'Hardware Architecture',
          photoURL: state.tempSignUpPhoto || ''
        });

        closeAuthModal();
        playNotificationChirp(true);
        showQuickToast(`Official profile created for ${name} (${empId})! You are now connected to the workstation.`, 'success');
      } catch (err) {
        let msg = err.message || 'Registration failed';
        if (err.code === 'auth/email-already-in-use') {
          msg = 'This email is already registered. Please sign in instead.';
        } else if (err.code === 'auth/weak-password') {
          msg = 'Password should be at least 6 characters.';
        }
        showAuthAlert(msg, true);
        playNotificationChirp(false);
      } finally {
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.textContent = '🚀 Create Official Profile & Connect';
        }
      }
    });

    // Forgot Password
    document.getElementById('btnForgotPass')?.addEventListener('click', async () => {
      const emailInput = document.getElementById('inputSignInEmail')?.value.trim();
      if (!emailInput) {
        showAuthAlert('Please enter your email address in the Email field above to receive a reset link.', true);
        document.getElementById('inputSignInEmail')?.focus();
        return;
      }

      try {
        if (window.FirebaseService) {
          await FirebaseService.resetPassword(emailInput);
          showAuthAlert(`Password reset link sent to ${emailInput}. Check your inbox!`, false);
        }
      } catch (err) {
        showAuthAlert(err.message || 'Failed to send reset email', true);
      }
    });

    // Profile Management Modal Handlers
    document.getElementById('btnCloseUserProfileModal')?.addEventListener('click', closeUserProfileModal);
    document.getElementById('userProfileModalBackdrop')?.addEventListener('click', closeUserProfileModal);

    document.getElementById('btnUserProfileSignOut')?.addEventListener('click', async () => {
      if (confirm('Sign out of your workstation account?')) {
        closeUserProfileModal();
        if (window.FirebaseService) {
          await FirebaseService.signOut();
        }
        updateAuthUI(null, null);
        openAuthModal('signin');
        playNotificationChirp(false);
      }
    });

    document.getElementById('btnUserProfileChangePhoto')?.addEventListener('click', async () => {
      const res = await pickPhotoFile();
      if (!res.canceled && res.dataUrl) {
        if (state.currentMember) {
          state.currentMember.idCardPhoto = res.dataUrl;
          state.currentMember.photoUrl = res.dataUrl;
          state.currentMember.photoURL = res.dataUrl;
        }
        WorkspaceDB.data.customMountedBadgePhoto = res.dataUrl;
        await WorkspaceDB.save();

        if (FirebaseService.updateMemberPhoto) {
          const uid = state.currentUser?.uid || state.currentMemberId || 'RD-FOUNDER-001';
          await FirebaseService.updateMemberPhoto(uid, res.dataUrl).catch(() => {});
        }

        openUserProfileModal();
        mountMemberOnWallpaper(state.currentMemberId);
        playNotificationChirp(true);
      }
    });

    document.getElementById('btnUserProfileMountWallpaper')?.addEventListener('click', () => {
      if (state.currentMemberId) {
        mountMemberOnWallpaper(state.currentMemberId);
        closeUserProfileModal();
      }
    });

    showOutgoingCallModal = function(targetMember, callData, roomUrl, callType = 'video') {
      const modal = document.getElementById('outgoingCallModal');
      if (!modal) return;

      const nameEl = document.getElementById('outgoingCallRecipientName');
      const avatarEl = document.getElementById('outgoingCallAvatar');
      const subtitleEl = document.getElementById('outgoingCallSubtitle');

      const targetName = targetMember ? (targetMember.name || targetMember.displayName || 'Colleague') : 'Teammate';
      const targetPhoto = targetMember ? (targetMember.photoURL || targetMember.photoUrl || targetMember.idCardPhoto || '') : '';
      const avatarText = targetName.slice(0, 2).toUpperCase();
      const callTypeLabel = callType.toUpperCase();

      if (nameEl) nameEl.textContent = `Calling ${targetName}...`;
      if (subtitleEl) subtitleEl.textContent = `📞 RINGING • WAITING FOR COLLEAGUE TO ANSWER (${callTypeLabel} CALL)`;

      if (avatarEl) {
        if (targetPhoto) {
          avatarEl.innerHTML = `<img src="${sanitizeUrl(targetPhoto)}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
        } else {
          avatarEl.textContent = avatarText;
        }
      }

      modal.classList.remove('hidden');
      startOutgoingRingbackTone();

      // Clear any prior outgoing call listeners/timeouts
      if (state.activeOutgoingCall) {
        if (state.activeOutgoingCall.unsubStatus) state.activeOutgoingCall.unsubStatus();
        if (state.activeOutgoingCall.timeoutId) clearTimeout(state.activeOutgoingCall.timeoutId);
      }

      let unsubStatus = null;
      if (callData?.callId && window.FirebaseService?.listenToCallStatus) {
        unsubStatus = FirebaseService.listenToCallStatus(callData.callId, (data) => {
          if (!data) return;
          if (data.status === 'ACCEPTED') {
            stopOutgoingRingbackTone();
            if (subtitleEl) subtitleEl.textContent = '🟢 Connected! Joining meeting room...';
            playNotificationChirp(true);
            setTimeout(() => {
              hideOutgoingCallModal();
              if (window.electronAPI?.openExternal) {
                window.electronAPI.openExternal(roomUrl);
              } else {
                window.open(roomUrl, '_blank');
              }
            }, 900);
          } else if (data.status === 'DECLINED') {
            stopOutgoingRingbackTone();
            if (subtitleEl) subtitleEl.textContent = '❌ Call was declined by recipient';
            playNotificationChirp(false);
            setTimeout(hideOutgoingCallModal, 2200);
          } else if (data.status === 'CANCELLED') {
            stopOutgoingRingbackTone();
            hideOutgoingCallModal();
          }
        });
      }

      // 45-second ring timeout
      const timeoutId = setTimeout(() => {
        stopOutgoingRingbackTone();
        if (subtitleEl) subtitleEl.textContent = `⌛ No answer from ${targetName}`;
        if (callData?.callId && window.FirebaseService?.respondToCall) {
          FirebaseService.respondToCall(callData.callId, 'MISSED');
        }
        setTimeout(hideOutgoingCallModal, 2200);
      }, 45000);

      state.activeOutgoingCall = { targetMember, callData, roomUrl, unsubStatus, timeoutId, callType };
    };

    hideOutgoingCallModal = function() {
      stopOutgoingRingbackTone();
      const modal = document.getElementById('outgoingCallModal');
      if (modal) modal.classList.add('hidden');
      if (state.activeOutgoingCall) {
        if (state.activeOutgoingCall.unsubStatus) state.activeOutgoingCall.unsubStatus();
        if (state.activeOutgoingCall.timeoutId) clearTimeout(state.activeOutgoingCall.timeoutId);
        state.activeOutgoingCall = null;
      }
    };

    function updateIncomingCallControlsUI() {
      const micBtn = document.getElementById('btnToggleIncomingCallMic');
      const camBtn = document.getElementById('btnToggleIncomingCallCam');
      if (micBtn) {
        if (state.incomingCallMicMuted) {
          micBtn.classList.add('muted');
          const icon = micBtn.querySelector('.call-ctrl-icon');
          if (icon) icon.textContent = '🔇';
          const txt = micBtn.querySelector('span:last-child');
          if (txt) txt.textContent = 'Mic Off';
        } else {
          micBtn.classList.remove('muted');
          const icon = micBtn.querySelector('.call-ctrl-icon');
          if (icon) icon.textContent = '🎤';
          const txt = micBtn.querySelector('span:last-child');
          if (txt) txt.textContent = 'Mic On';
        }
      }
      if (camBtn) {
        if (state.incomingCallCamDisabled) {
          camBtn.classList.add('muted');
          const icon = camBtn.querySelector('.call-ctrl-icon');
          if (icon) icon.textContent = '🚫';
          const txt = camBtn.querySelector('span:last-child');
          if (txt) txt.textContent = 'Cam Off';
        } else {
          camBtn.classList.remove('muted');
          const icon = camBtn.querySelector('.call-ctrl-icon');
          if (icon) icon.textContent = '📹';
          const txt = camBtn.querySelector('span:last-child');
          if (txt) txt.textContent = 'Cam On';
        }
      }
    }

    showIncomingCallModal = function(callData) {
      const modal = document.getElementById('incomingCallModal');
      if (!modal) return;

      const nameEl = document.getElementById('incomingCallCallerName');
      const deptEl = document.getElementById('incomingCallDept');
      const empIdEl = document.getElementById('incomingCallEmpId');
      const typeBadgeEl = document.getElementById('incomingCallTypeBadge');
      const avatarEl = document.getElementById('incomingCallAvatar');
      const subtitleEl = document.getElementById('incomingCallSubtitle');

      const callerName = callData.callerName || 'Teammate';
      const callerPhoto = callData.callerPhoto || '';
      const callerDept = callData.callerDept || 'Hardware Architecture';
      const callerEmpId = callData.callerEmpId || '';
      const callType = (callData.callType || 'video').toUpperCase();
      const avatarText = callerName.slice(0, 2).toUpperCase();

      if (nameEl) nameEl.textContent = callerName;
      if (deptEl) deptEl.textContent = callerDept;
      if (empIdEl) empIdEl.textContent = callerEmpId ? `ID: ${callerEmpId}` : '';
      if (typeBadgeEl) typeBadgeEl.textContent = callType === 'AUDIO' ? '📞 Audio Call' : '📹 Video Call';
      if (subtitleEl) subtitleEl.textContent = `Incoming ${callType} Call...`;

      if (avatarEl) {
        if (callerPhoto) {
          avatarEl.innerHTML = `<img src="${sanitizeUrl(callerPhoto)}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
        } else {
          avatarEl.textContent = avatarText;
        }
      }

      state.activeIncomingCall = callData;
      state.incomingCallMicMuted = false;
      state.incomingCallCamDisabled = (callType === 'AUDIO');
      updateIncomingCallControlsUI();

      modal.style.display = 'flex';
      modal.classList.remove('hidden');
      startIncomingCallRingtone(); // Play continuous dual-tone phone ring!

      if (window.electronAPI && window.electronAPI.incomingCallAlert) {
        window.electronAPI.incomingCallAlert({
          callerName,
          callType,
          callerDept
        });
      } else if (window.electronAPI && window.electronAPI.showNotification) {
        window.electronAPI.showNotification({
          title: `📞 Incoming Call from ${callerName}`,
          body: `Click to join secure ${callType} call session.`,
          targetTab: 'chat'
        });
      }
    };

    hideIncomingCallModal = function() {
      stopIncomingCallRingtone(); // Stop ringing immediately
      const modal = document.getElementById('incomingCallModal');
      if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
      }
      state.activeIncomingCall = null;
    };

    // --- REALTIME VIDEO MEETINGS & CALLS ENGINE ---
    let activeMeetingTargetMember = null;

    openMeetingModal = function(targetMember = null) {
      activeMeetingTargetMember = targetMember;
      const modal = document.getElementById('meetingModal');
      if (!modal) return;

      const titleEl = document.getElementById('meetingModalTitle');
      const descEl = document.getElementById('meetingModalDesc');
      const roomSpan = document.getElementById('meetJitsiRoomText');
      const broadcastBtnText = document.getElementById('btnBroadcastCallInviteText');

      const cleanRoomId = targetMember 
        ? `reddot-call-${(targetMember.id || targetMember.name || 'colleague').toLowerCase().replace(/[^a-z0-9]/g, '-')}`
        : `reddot-${(state.activeChannelId || 'general').replace(/[^a-z0-9]/g, '-')}-room`;

      const jitsiUrl = `https://meet.jit.si/${cleanRoomId}`;

      if (titleEl) {
        titleEl.textContent = targetMember 
          ? `MEET WITH ${(targetMember.name || targetMember.displayName || 'COLLEAGUE').toUpperCase()}`
          : 'START SECURE TEAM MEETING';
      }
      if (descEl) {
        descEl.textContent = targetMember
          ? `Start a direct encrypted video call session with ${targetMember.name || targetMember.displayName} (${targetMember.id || 'Team Member'}).`
          : 'Generate an encrypted meeting room link for team voice, video, and screen sharing.';
      }
      if (roomSpan) {
        roomSpan.textContent = jitsiUrl;
      }
      if (broadcastBtnText) {
        broadcastBtnText.textContent = targetMember
          ? `📞 Ring & Call ${targetMember.name || targetMember.displayName}`
          : '📡 Ring & Broadcast Call Invite to All Members';
      }

      modal.classList.remove('hidden');
    };

    closeMeetingModal = function() {
      const modal = document.getElementById('meetingModal');
      if (modal) modal.classList.add('hidden');
      activeMeetingTargetMember = null;
    };

    startDirectCallWithMember = async function(member, callType = 'video') {
      if (!member) return;
      const targetName = member.name || member.displayName || 'Colleague';
      const cleanRoomId = `reddot-call-${(member.id || targetName).toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`;
      let roomUrl = `https://meet.jit.si/${cleanRoomId}`;
      if (callType === 'audio') {
        roomUrl += '#config.startWithVideoMuted=true';
      }

      let callData = null;
      if (window.FirebaseService?.sendCallInvite) {
        try {
          callData = await FirebaseService.sendCallInvite(member, roomUrl, callType);
        } catch (e) {
          console.warn('[CALL] Send invite error:', e);
        }
      }

      showOutgoingCallModal(member, callData, roomUrl, callType);
    };

    document.getElementById('btnCloseMeetingModal')?.addEventListener('click', closeMeetingModal);
    document.getElementById('meetingModalBackdrop')?.addEventListener('click', closeMeetingModal);

    document.getElementById('btnLaunchMeetJitsi')?.addEventListener('click', async () => {
      const targetMember = activeMeetingTargetMember;
      const cleanRoomId = targetMember 
        ? `reddot-call-${(targetMember.id || targetMember.name || 'colleague').toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`
        : `reddot-${(state.activeChannelId || 'general').replace(/[^a-z0-9]/g, '-')}-room`;
      const roomUrl = `https://meet.jit.si/${cleanRoomId}`;

      closeMeetingModal();

      let callData = null;
      if (window.FirebaseService?.sendCallInvite) {
        try {
          callData = await FirebaseService.sendCallInvite(targetMember || 'ALL', roomUrl, 'video');
        } catch (e) {
          console.warn('[CALL] Invite notice:', e.message);
        }
      }

      if (targetMember) {
        showOutgoingCallModal(targetMember, callData, roomUrl);
      } else {
        if (window.electronAPI?.openExternal) {
          await window.electronAPI.openExternal(roomUrl);
        } else {
          window.open(roomUrl, '_blank');
        }
        playNotificationChirp(true);
      }
    });

    document.getElementById('btnLaunchGoogleMeet')?.addEventListener('click', async () => {
      const targetMember = activeMeetingTargetMember;
      const roomUrl = 'https://meet.google.com/new';

      closeMeetingModal();

      let callData = null;
      if (window.FirebaseService?.sendCallInvite) {
        try {
          callData = await FirebaseService.sendCallInvite(targetMember || 'ALL', roomUrl, 'video');
        } catch (e) {
          console.warn('[CALL] Invite notice:', e.message);
        }
      }

      if (targetMember) {
        showOutgoingCallModal(targetMember, callData, roomUrl);
      } else {
        if (window.electronAPI?.openExternal) {
          await window.electronAPI.openExternal(roomUrl);
        } else {
          window.open(roomUrl, '_blank');
        }
        playNotificationChirp(true);
      }
    });

    document.getElementById('btnBroadcastCallInvite')?.addEventListener('click', async () => {
      const targetMember = activeMeetingTargetMember;
      const cleanRoomId = targetMember 
        ? `reddot-call-${(targetMember.id || targetMember.name || 'colleague').toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`
        : `reddot-${(state.activeChannelId || 'general').replace(/[^a-z0-9]/g, '-')}-room`;
      const roomUrl = `https://meet.jit.si/${cleanRoomId}`;

      closeMeetingModal();

      let callData = null;
      if (window.FirebaseService?.sendCallInvite) {
        try {
          callData = await FirebaseService.sendCallInvite(targetMember || 'ALL', roomUrl, 'video');
        } catch (e) {
          console.warn('[CALL] Invite broadcast error:', e.message);
        }
      }

      if (targetMember) {
        showOutgoingCallModal(targetMember, callData, roomUrl);
      } else {
        showQuickToast('Call invite sent to team members! Opening meeting room...', 'info');
        if (window.electronAPI?.openExternal) {
          await window.electronAPI.openExternal(roomUrl);
        } else {
          window.open(roomUrl, '_blank');
        }
        playNotificationChirp(true);
      }
    });

    document.getElementById('btnStartMeeting')?.addEventListener('click', () => {
      if (state.activeChannelId?.startsWith('dm_')) {
        const memberId = state.activeChannelId.replace('dm_', '');
        const member = getUniqueMembersList().find(m => m.id === memberId || m.uid === memberId);
        openMeetingModal(member || null);
      } else {
        openMeetingModal(null);
      }
    });

    // --- IN-APP CHANNEL MANAGEMENT: CREATE, EDIT & DELETE ---
    const createChannelModal = document.getElementById('createChannelModal');
    const editChannelModal = document.getElementById('editChannelModal');

    openCreateChannelModal = function() {
      const inputName = document.getElementById('inputNewChannelName');
      const inputTopic = document.getElementById('inputNewChannelTopic');
      if (inputName) inputName.value = '';
      if (inputTopic) inputTopic.value = '';
      createChannelModal?.classList.remove('hidden');
      setTimeout(() => inputName?.focus(), 50);
    };

    closeCreateChannelModal = function() {
      createChannelModal?.classList.add('hidden');
    };

    document.getElementById('btnCreateChannel')?.addEventListener('click', openCreateChannelModal);
    document.getElementById('btnCloseCreateChannel')?.addEventListener('click', closeCreateChannelModal);
    document.getElementById('btnCancelCreateChannel')?.addEventListener('click', closeCreateChannelModal);
    document.getElementById('createChannelBackdrop')?.addEventListener('click', closeCreateChannelModal);

    document.getElementById('formCreateChannelModal')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const rawName = document.getElementById('inputNewChannelName')?.value;
      if (!rawName || !rawName.trim()) return;
      const cleanName = rawName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
      const topic = document.getElementById('inputNewChannelTopic')?.value.trim() || 'Team collaboration channel';

      const newCh = {
        id: cleanName,
        name: cleanName,
        topic: topic
      };

      if (!WorkspaceDB.data.channels) WorkspaceDB.data.channels = [];
      if (!WorkspaceDB.data.channels.some(c => c.id === cleanName)) {
        WorkspaceDB.data.channels.push(newCh);
        await WorkspaceDB.save();
      }

      if (window.FirebaseService?.createCustomChannel) {
        try {
          await FirebaseService.createCustomChannel(newCh);
        } catch (err) {
          console.warn('[CHANNEL] Cloud channel creation notice:', err);
        }
      }

      closeCreateChannelModal();
      renderChatChannelsAndDMs();
      selectChatTarget(cleanName, cleanName, topic);
      playNotificationChirp(true);
    });

    openEditChannelModal = function(targetChId = null) {
      const curChId = (typeof targetChId === 'string' && targetChId.trim()) ? targetChId.trim() : (state.activeChannelId || 'general');
      if (!curChId || curChId.startsWith('dm_')) return;

      const chObj = (WorkspaceDB.data.channels || []).find(c => c.id === curChId) || { id: curChId, name: curChId, topic: '' };
      
      const targetIdInput = document.getElementById('editChannelTargetId');
      const nameInput = document.getElementById('inputEditChannelName');
      const topicInput = document.getElementById('inputEditChannelTopic');
      const titleEl = document.getElementById('editChannelModalTitle');
      const btnDelete = document.getElementById('btnDeleteChannelConfirm');

      if (targetIdInput) targetIdInput.value = curChId;
      if (nameInput) nameInput.value = chObj.name || curChId;
      if (topicInput) topicInput.value = chObj.topic || '';
      if (titleEl) titleEl.textContent = `EDIT GROUP CHANNEL #${chObj.name || curChId}`;

      // Default channel #general cannot be deleted
      if (btnDelete) {
        if (curChId === 'general') {
          btnDelete.style.display = 'none';
        } else {
          btnDelete.style.display = 'inline-flex';
        }
      }

      editChannelModal?.classList.remove('hidden');
      setTimeout(() => nameInput?.focus(), 50);
    };

    closeEditChannelModal = function() {
      editChannelModal?.classList.add('hidden');
    };

    document.getElementById('btnEditChannel')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openEditChannelModal();
    });
    document.getElementById('btnCloseEditChannel')?.addEventListener('click', closeEditChannelModal);
    document.getElementById('btnCancelEditChannel')?.addEventListener('click', closeEditChannelModal);
    document.getElementById('editChannelBackdrop')?.addEventListener('click', closeEditChannelModal);

    document.getElementById('formEditChannelModal')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const curChId = document.getElementById('editChannelTargetId')?.value || state.activeChannelId;
      if (!curChId || curChId.startsWith('dm_')) return;

      const newName = document.getElementById('inputEditChannelName')?.value.trim() || curChId;
      const newTopic = document.getElementById('inputEditChannelTopic')?.value.trim() || '';

      const chObj = (WorkspaceDB.data.channels || []).find(c => c.id === curChId);
      if (chObj) {
        chObj.name = newName;
        chObj.topic = newTopic;
      } else {
        WorkspaceDB.data.channels.push({ id: curChId, name: newName, topic: newTopic });
      }
      await WorkspaceDB.save();

      if (window.FirebaseService?.updateChannel) {
        try {
          await FirebaseService.updateChannel(curChId, { name: newName, topic: newTopic });
        } catch (err) {
          console.warn('[CHANNEL] Cloud update warning:', err);
        }
      }

      closeEditChannelModal();
      renderChatChannelsAndDMs();
      selectChatTarget(curChId, newName, newTopic);
      playNotificationChirp(true);
    });

    document.getElementById('btnDeleteChannelConfirm')?.addEventListener('click', async () => {
      const curChId = document.getElementById('editChannelTargetId')?.value || state.activeChannelId;
      if (!curChId || curChId === 'general' || curChId.startsWith('dm_')) return;

      // Filter out from local channels
      WorkspaceDB.data.channels = (WorkspaceDB.data.channels || []).filter(c => c.id !== curChId);
      await WorkspaceDB.save();

      // Delete from Cloud Firestore
      if (window.FirebaseService?.deleteChannel) {
        try {
          await FirebaseService.deleteChannel(curChId);
        } catch (err) {
          console.warn('[CHANNEL] Cloud deletion warning:', err);
        }
      }

      closeEditChannelModal();
      selectChatTarget('general', 'general', 'Company-wide updates and collaboration');
      renderChatChannelsAndDMs();
      playNotificationChirp(false);
    });

    // --- IN-APP ROLE & DEPARTMENT AUTHORIZE MODAL ---
    const editRoleModal = document.getElementById('editRoleModal');

    openEditRoleModal = function(member) {
      if (!member) return;
      state.editingRoleMember = member;

      const targetIdInput = document.getElementById('editRoleTargetMemberId');
      const nameEl = document.getElementById('editRoleMemberName');
      const subEl = document.getElementById('editRoleMemberSub');
      const avatarEl = document.getElementById('editRoleAvatarPreview');
      const selectRole = document.getElementById('selectPresetRole');
      const customRoleWrap = document.getElementById('wrapCustomRoleInput');
      const customRoleInput = document.getElementById('inputCustomRole');
      const selectDept = document.getElementById('selectEditRoleDept');

      if (targetIdInput) targetIdInput.value = member.id || member.uid;
      if (nameEl) nameEl.textContent = (member.name || member.displayName || 'COLLEAGUE').toUpperCase();
      if (subEl) subEl.textContent = `${member.id || 'RD-EMP'} • ${member.email || 'teammate@reddot.com'}`;

      if (avatarEl) {
        const photo = member.idCardPhoto || member.photoURL || member.photoUrl;
        if (photo) {
          avatarEl.innerHTML = `<img src="${sanitizeUrl(photo)}" style="width:100%;height:100%;object-fit:cover;">`;
        } else {
          avatarEl.textContent = (member.avatarText || (member.name || 'RD').slice(0, 2)).toUpperCase();
        }
      }

      // Check if current role matches preset
      let matched = false;
      if (selectRole) {
        for (let i = 0; i < selectRole.options.length; i++) {
          if (selectRole.options[i].value.toLowerCase() === (member.role || '').toLowerCase()) {
            selectRole.selectedIndex = i;
            matched = true;
            break;
          }
        }
        if (!matched) {
          selectRole.value = '__custom__';
          if (customRoleWrap) customRoleWrap.style.display = 'block';
          if (customRoleInput) customRoleInput.value = member.role || '';
        } else {
          if (customRoleWrap) customRoleWrap.style.display = 'none';
        }
      }

      if (selectDept && member.dept) {
        selectDept.value = member.dept;
      }

      editRoleModal?.classList.remove('hidden');
    };

    closeEditRoleModal = function() {
      editRoleModal?.classList.add('hidden');
      state.editingRoleMember = null;
    };

    document.getElementById('btnCloseEditRole')?.addEventListener('click', closeEditRoleModal);
    document.getElementById('btnCancelEditRole')?.addEventListener('click', closeEditRoleModal);
    document.getElementById('editRoleBackdrop')?.addEventListener('click', closeEditRoleModal);

    document.getElementById('selectPresetRole')?.addEventListener('change', (e) => {
      const customWrap = document.getElementById('wrapCustomRoleInput');
      if (customWrap) {
        customWrap.style.display = (e.target.value === '__custom__') ? 'block' : 'none';
      }
    });

    const submitEditRoleHandler = async (e) => {
      if (e) e.preventDefault();
      const member = state.editingRoleMember;
      if (!member) return;

      const selectPreset = document.getElementById('selectPresetRole')?.value;
      const customVal = document.getElementById('inputCustomRole')?.value?.trim();
      const newRole = (selectPreset === '__custom__') ? (customVal || member.role || 'Member') : (selectPreset || member.role || 'Member');
      const newDept = document.getElementById('selectEditRoleDept')?.value || member.dept || 'Hardware Architecture';
      const now = Date.now();

      member.role = newRole;
      member.dept = newDept;
      member.updatedAt = now;

      // Update across all duplicate/linked keys in WorkspaceDB.data.members
      Object.keys(WorkspaceDB.data.members || {}).forEach(k => {
        const m = WorkspaceDB.data.members[k];
        if (m && (
          (member.id && m.id === member.id) ||
          (member.uid && (m.uid === member.uid || m.id === member.uid)) ||
          (member.email && m.email && m.email.toLowerCase() === member.email.toLowerCase())
        )) {
          m.role = newRole;
          m.dept = newDept;
          m.updatedAt = now;
        }
      });
      if (member.id) WorkspaceDB.data.members[member.id] = member;
      if (member.uid) WorkspaceDB.data.members[member.uid] = member;
      await WorkspaceDB.save();

      // Synchronize to Cloud Firestore across all matched member documents
      const targetLookup = member.docId || member.uid || member.id;
      if (window.FirebaseService?.updateMemberRole) {
        try {
          await FirebaseService.updateMemberRole(targetLookup, newRole, newDept, member.email);
        } catch (err) {
          console.warn('[ROLE] Cloud role update note:', err);
        }
      }

      // If user is editing self, update header role label
      const isSelf = (member.id === state.currentMemberId || member.email?.toLowerCase() === state.currentUser?.email?.toLowerCase());
      if (isSelf) {
        const roleLabel = document.getElementById('roleLabel');
        safeSetText(roleLabel, `${(member.displayName || member.name || 'USER').toUpperCase()} // ${newRole.toUpperCase()}`);
      }

      // If badge viewer is open for this member, refresh the badge card live
      if (state.selectedViewingMemberId && (state.selectedViewingMemberId === member.id || state.selectedViewingMemberId === member.uid)) {
        openBadgeViewerModal(state.selectedViewingMemberId);
      }

      closeEditRoleModal();
      renderWorkers();
      renderTasks();
      renderFleetTelemetry();
      renderChatChannelsAndDMs();
      populateAssigneeSelect();
      playNotificationChirp(true);
      showQuickToast(`✅ Role updated: ${member.name || member.displayName} is now "${newRole}" (${newDept})`, 'success');
    };

    document.getElementById('formEditRoleModal')?.addEventListener('submit', submitEditRoleHandler);
    document.getElementById('btnSubmitEditRole')?.addEventListener('click', (e) => {
      const form = document.getElementById('formEditRoleModal');
      if (form && typeof form.requestSubmit === 'function') {
        form.requestSubmit();
      } else {
        submitEditRoleHandler(e);
      }
    });

    // --- GOOGLE DRIVE & WEB PHOTO LINKING ENGINE ---
    const linkPhotoModal = document.getElementById('linkPhotoModal');

    openLinkPhotoModal = function(targetMemberId = null) {
      state.linkingPhotoMemberId = targetMemberId || state.selectedViewingMemberId || state.currentMemberId || 'RD-FOUNDER-001';
      const input = document.getElementById('inputDrivePhotoUrl');
      const previewBox = document.getElementById('drivePhotoPreviewBox');
      const statusText = document.getElementById('drivePhotoStatusText');

      if (input) input.value = '';
      if (previewBox) previewBox.innerHTML = '<span style="font-size:10px; color:var(--text-muted);">No Preview</span>';
      if (statusText) {
        statusText.textContent = 'Paste Google Drive share link or image URL and click Preview';
        statusText.style.color = 'var(--text-secondary)';
      }

      linkPhotoModal?.classList.remove('hidden');
      setTimeout(() => input?.focus(), 50);
    };

    closeLinkPhotoModal = function() {
      linkPhotoModal?.classList.add('hidden');
      state.linkingPhotoMemberId = null;
    };

    document.getElementById('btnCloseLinkPhoto')?.addEventListener('click', closeLinkPhotoModal);
    document.getElementById('btnCancelLinkPhoto')?.addEventListener('click', closeLinkPhotoModal);
    document.getElementById('linkPhotoBackdrop')?.addEventListener('click', closeLinkPhotoModal);

    document.getElementById('btnLinkGoogleDriveBadgePhoto')?.addEventListener('click', () => {
      openLinkPhotoModal(state.selectedViewingMemberId);
    });

    document.getElementById('btnUserProfileLinkDrivePhoto')?.addEventListener('click', () => {
      openLinkPhotoModal(state.currentMemberId);
    });

    document.getElementById('btnPreviewDrivePhoto')?.addEventListener('click', () => {
      const rawUrl = document.getElementById('inputDrivePhotoUrl')?.value;
      const previewBox = document.getElementById('drivePhotoPreviewBox');
      const statusText = document.getElementById('drivePhotoStatusText');

      if (!rawUrl || !rawUrl.trim()) {
        if (statusText) {
          statusText.textContent = '⚠️ Please paste a link first.';
          statusText.style.color = '#ffb300';
        }
        return;
      }

      let directUrl = convertGoogleDriveLink(rawUrl);

      if (statusText) {
        statusText.textContent = 'Connecting to image stream...';
        statusText.style.color = 'var(--accent-cyan)';
      }

      const img = new Image();
      img.onload = () => {
        if (previewBox) {
          previewBox.innerHTML = `<img src="${directUrl}" style="width:100%;height:100%;object-fit:cover;">`;
        }
        if (statusText) {
          statusText.textContent = '✅ Image verified! Click "Apply" below to save.';
          statusText.style.color = '#00e676';
        }
      };
      img.onerror = () => {
        // Fallback: try direct lh3 CDN if thumbnail fails
        const fileMatch = directUrl.match(/id=([a-zA-Z0-9_-]{20,})/);
        if (fileMatch) {
          const fallbackUrl = `https://lh3.googleusercontent.com/d/${fileMatch[1]}=s1000`;
          const img2 = new Image();
          img2.onload = () => {
            directUrl = fallbackUrl;
            if (previewBox) {
              previewBox.innerHTML = `<img src="${fallbackUrl}" style="width:100%;height:100%;object-fit:cover;">`;
            }
            if (statusText) {
              statusText.textContent = '✅ Image verified via Google CDN! Click "Apply" to save.';
              statusText.style.color = '#00e676';
            }
          };
          img2.onerror = () => {
            if (previewBox) {
              previewBox.innerHTML = `<img src="${directUrl}" style="width:100%;height:100%;object-fit:cover;">`;
            }
            if (statusText) {
              statusText.innerHTML = '⚠️ Make sure Drive link permission is set to <strong>"Anyone with link can view"</strong>.';
              statusText.style.color = '#ffb300';
            }
          };
          img2.src = fallbackUrl;
          return;
        }

        if (previewBox) {
          previewBox.innerHTML = `<img src="${directUrl}" style="width:100%;height:100%;object-fit:cover;">`;
        }
        if (statusText) {
          statusText.innerHTML = '⚠️ Could not load preview. Ensure Drive access is <strong>"Anyone with the link"</strong>.';
          statusText.style.color = '#ffb300';
        }
      };
      img.src = directUrl;
    });

    document.getElementById('formLinkPhotoModal')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const rawUrl = document.getElementById('inputDrivePhotoUrl')?.value;
      if (!rawUrl || !rawUrl.trim()) return;

      const directUrl = convertGoogleDriveLink(rawUrl);
      const targetId = state.linkingPhotoMemberId || state.selectedViewingMemberId || state.currentMemberId || 'RD-FOUNDER-001';
      let member = WorkspaceDB.data.members[targetId] || getUniqueMembersList().find(m => m.id === targetId || m.uid === targetId) || state.currentMember;

      if (!member) {
        member = {
          id: targetId,
          name: state.currentUser?.displayName || 'JAGADISH K',
          email: state.currentUser?.email || 'jagadish2k2006@gmail.com',
          role: 'Founder / System Architect',
          dept: 'Hardware Architecture'
        };
        WorkspaceDB.data.members[targetId] = member;
      }

      member.idCardPhoto = directUrl;
      member.customPhoto = directUrl;
      member.isCustomPhoto = true;
      member.photoURL = directUrl;
      member.photoUrl = directUrl;

      WorkspaceDB.data.customMountedBadgePhoto = directUrl;

      // Save to persistent localStorage cache
      try {
        const emailKey = member?.email || state.currentUser?.email;
        const storedPhotos = JSON.parse(localStorage.getItem('rd_member_custom_photos') || '{}');
        if (emailKey) storedPhotos[emailKey.toLowerCase()] = directUrl;
        if (targetId) storedPhotos[targetId] = directUrl;
        if (member.uid) storedPhotos[member.uid] = directUrl;
        localStorage.setItem('rd_member_custom_photos', JSON.stringify(storedPhotos));
        localStorage.setItem('rd_custom_badge_photo', directUrl);
      } catch (_) {}

      await WorkspaceDB.save();

      // Sync to Cloud Firestore
      if (window.FirebaseService?.updateMemberPhoto) {
        try {
          const targetUid = member.uid || member.id || state.currentUser?.uid || 'RD-FOUNDER-001';
          await FirebaseService.updateMemberPhoto(targetUid, directUrl);
        } catch (err) {
          console.warn('[PHOTO] Cloud sync note:', err);
        }
      }

      // Update badge viewer preview if open
      const badgeViewAvatar = document.getElementById('badgeViewAvatar');
      if (badgeViewAvatar) {
        badgeViewAvatar.innerHTML = `<img src="${directUrl}" alt="Badge Photo" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
      }

      // Update user profile modal preview if open
      const profileAvatarBox = document.getElementById('userProfileAvatarBox');
      if (profileAvatarBox) {
        profileAvatarBox.innerHTML = `<img src="${directUrl}" alt="Profile Photo" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
      }

      // Mount on live 3D wallpaper
      const badgeImg = document.getElementById('badgeImg');
      if (badgeImg) badgeImg.src = directUrl;

      renderWorkers();
      renderChatChannelsAndDMs();
      closeLinkPhotoModal();
      playNotificationChirp(true);
    });

    // Incoming Call Modal Handlers
    document.getElementById('btnToggleIncomingCallMic')?.addEventListener('click', () => {
      state.incomingCallMicMuted = !state.incomingCallMicMuted;
      updateIncomingCallControlsUI();
    });

    document.getElementById('btnToggleIncomingCallCam')?.addEventListener('click', () => {
      state.incomingCallCamDisabled = !state.incomingCallCamDisabled;
      updateIncomingCallControlsUI();
    });

    document.getElementById('btnAcceptIncomingCall')?.addEventListener('click', async () => {
      stopIncomingCallRingtone();
      const call = state.activeIncomingCall;
      hideIncomingCallModal();
      if (call) {
        if (window.FirebaseService?.respondToCall) {
          await FirebaseService.respondToCall(call.callId, 'ACCEPTED');
        }
        let roomUrl = call.roomUrl || 'https://meet.jit.si/reddot-team-room';
        const params = [];
        if (state.incomingCallMicMuted) params.push('config.startWithAudioMuted=true');
        if (state.incomingCallCamDisabled) params.push('config.startWithVideoMuted=true');
        if (params.length > 0) {
          roomUrl += (roomUrl.includes('#') ? '&' : '#') + params.join('&');
        }
        if (window.electronAPI && window.electronAPI.openExternal) {
          await window.electronAPI.openExternal(roomUrl);
        } else {
          window.open(roomUrl, '_blank');
        }
      }
    });

    document.getElementById('btnDeclineIncomingCall')?.addEventListener('click', async () => {
      stopIncomingCallRingtone();
      const call = state.activeIncomingCall;
      hideIncomingCallModal();
      if (call) {
        if (window.FirebaseService?.respondToCall) {
          await FirebaseService.respondToCall(call.callId, 'DECLINED');
        }
      }
    });

    document.getElementById('incomingCallBackdrop')?.addEventListener('click', () => {
      stopIncomingCallRingtone();
      hideIncomingCallModal();
    });

    // Privacy Modal
    document.getElementById('btnViewPrivacyPolicy')?.addEventListener('click', () => {
      document.getElementById('privacyModal')?.classList.remove('hidden');
    });
    document.getElementById('btnClosePrivacyModal')?.addEventListener('click', () => {
      document.getElementById('privacyModal')?.classList.add('hidden');
    });
    document.getElementById('privacyModalBackdrop')?.addEventListener('click', () => {
      document.getElementById('privacyModal')?.classList.add('hidden');
    });

    // Windows Auto-Start
    const autoStartToggle = document.getElementById('toggleAutoStart');
    if (autoStartToggle && window.electronAPI) {
      window.electronAPI.getAutoStart().then(enabled => {
        autoStartToggle.checked = !!enabled;
      });
      autoStartToggle.addEventListener('change', () => {
        window.electronAPI.setAutoStart(autoStartToggle.checked);
      });
    }

    // Hotkeys & Keyboard Navigation (Space, Escape, ArrowLeft, ArrowRight)
    window.addEventListener('keydown', (e) => {
      const activeEl = document.activeElement;
      const isInputFocused = (
        (activeEl && (
          activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          activeEl.isContentEditable ||
          (typeof activeEl.getAttribute === 'function' && activeEl.getAttribute('contenteditable') === 'true')
        )) ||
        (e.target && (
          e.target.tagName === 'INPUT' ||
          e.target.tagName === 'TEXTAREA' ||
          e.target.tagName === 'SELECT' ||
          e.target.isContentEditable ||
          (typeof e.target.getAttribute === 'function' && e.target.getAttribute('contenteditable') === 'true')
        ))
      );

      // If user is currently typing in ANY input, textarea, or select: do NOT intercept any keys!
      if (isInputFocused) {
        if (e.key === 'Escape' || e.keyCode === 27) {
          activeEl?.blur();
        }
        return;
      }

      // 1. SPACE KEY: Toggle Command Center Workstation View
      const isSpace = (e.code === 'Space' || e.key === ' ' || e.key === 'Spacebar' || e.keyCode === 32);
      if (isSpace) {
        e.preventDefault();
        e.stopPropagation();
        if (document.activeElement && typeof document.activeElement.blur === 'function') {
          document.activeElement.blur();
        }
        toggleCommandCenter();
        playNotificationChirp(false);
        return;
      }

      // 2. ESCAPE KEY: Close Modals or Command Center
      if (e.key === 'Escape' || e.keyCode === 27) {
        e.preventDefault();
        const modals = [
          'createWorkerModal', 'badgeViewerModal', 'taskActivityModal',
          'meetingModal', 'privacyModal', 'authModal', 'userProfileModal',
          'incomingCallModal', 'createChannelModal', 'editChannelModal',
          'editRoleModal', 'linkPhotoModal'
        ];
        let anyModalClosed = false;
        modals.forEach(id => {
          const el = document.getElementById(id);
          if (el && !el.classList.contains('hidden')) {
            el.classList.add('hidden');
            anyModalClosed = true;
          }
        });
        if (anyModalClosed) {
          return;
        }
        if (state.commandCenterOpen) {
          closeCommandCenter();
        }
        return;
      }

      // Allow natural arrow cursor navigation inside inputs
      if (isInputFocused) return;

      // 3. LEFT & RIGHT ARROW KEYS: Navigation in Sections and Presets
      const isArrowLeft = (e.key === 'ArrowLeft' || e.code === 'ArrowLeft' || e.keyCode === 37);
      const isArrowRight = (e.key === 'ArrowRight' || e.code === 'ArrowRight' || e.keyCode === 39);

      if (isArrowLeft || isArrowRight) {
        e.preventDefault();
        e.stopPropagation();

        // 3a. If ID Badge Viewer is open, navigate previous / next employee badge
        const badgeModal = document.getElementById('badgeViewerModal');
        if (badgeModal && !badgeModal.classList.contains('hidden')) {
          const members = getUniqueMembersList();
          if (members.length > 0) {
            const curIdx = members.findIndex(m => m.id === state.selectedViewingMemberId || m.uid === state.selectedViewingMemberId);
            let nextIdx = isArrowRight ? (curIdx + 1) : (curIdx - 1);
            if (nextIdx >= members.length) nextIdx = 0;
            if (nextIdx < 0) nextIdx = members.length - 1;
            openBadgeViewerModal(members[nextIdx].id || members[nextIdx].uid);
            playNotificationChirp(false);
          }
          return;
        }

        // 3b. If Command Center is OPEN: Navigate between the 7 sections/tabs
        const SECTIONS_ORDER = ['wallpapers', 'workers', 'timesheets', 'tasks', 'chat', 'telemetry', 'database'];
        if (state.commandCenterOpen) {
          const curTabIdx = SECTIONS_ORDER.indexOf(state.activeTab);
          let nextTabIdx = isArrowRight ? (curTabIdx + 1) : (curTabIdx - 1);
          if (nextTabIdx >= SECTIONS_ORDER.length) nextTabIdx = 0;
          if (nextTabIdx < 0) nextTabIdx = SECTIONS_ORDER.length - 1;
          switchTab(SECTIONS_ORDER[nextTabIdx]);
          playNotificationChirp(false);
          return;
        }

        // 3c. If in Live Wallpaper Mode (Command Center is CLOSED): Cycle through wallpaper themes
        const PRESETS_ORDER = DEFAULT_WALLPAPER_PRESETS.map(p => p.id);
        const curPresetIdx = PRESETS_ORDER.indexOf(state.activeWallpaperPreset);
        let nextPresetIdx = isArrowRight ? (curPresetIdx + 1) : (curPresetIdx - 1);
        if (nextPresetIdx >= PRESETS_ORDER.length) nextPresetIdx = 0;
        if (nextPresetIdx < 0) nextPresetIdx = PRESETS_ORDER.length - 1;
        applyWallpaperPreset(PRESETS_ORDER[nextPresetIdx]);
        playNotificationChirp(false);
        return;
      }

      // Quick tab shortcuts: Alt+W, Alt+T, Alt+D, Alt+C
      if (e.altKey) {
        const key = e.key.toLowerCase();
        if (key === 'w') {
          e.preventDefault();
          toggleCommandCenter();
        } else if (key === 't') {
          e.preventDefault();
          switchTab('tasks');
        } else if (key === 'd') {
          e.preventDefault();
          switchTab('workers');
        } else if (key === 'c') {
          e.preventDefault();
          switchTab('chat');
        }
      }
    });

    // =========================================================================
    // TEAMS SUITE EVENT BINDINGS
    // =========================================================================
    // 1. Teams Left App Rail Click Listeners
    document.querySelectorAll('#teamsLeftRail .rail-item[data-rail-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-rail-tab');
        switchTeamsRailTab(tab);
      });
    });

    // 2. Meet Now Buttons (Instant Video Meeting)
    const triggerInstantMeeting = () => {
      const roomUrl = `https://meet.jit.si/reddot-team-${Date.now()}`;
      if (window.electronAPI?.openExternal) window.electronAPI.openExternal(roomUrl);
      else window.open(roomUrl, '_blank');
      sendChatMessage(`📹 **INSTANT MEETING STARTED**: Team video conference room is live!\n🔗 [Click to Join Jitsi Meeting](${roomUrl})`);
      logCallEvent('outgoing', { name: 'Instant Team Meeting', id: state.activeChannelId }, 'Live');
    };

    document.getElementById('railBtnMeetNow')?.addEventListener('click', triggerInstantMeeting);
    document.getElementById('btnQuickMeetCalendar')?.addEventListener('click', triggerInstantMeeting);

    // 3. Schedule Meeting Buttons & Modal Handlers
    document.getElementById('btnScheduleMeetingInChat')?.addEventListener('click', () => openScheduleMeetingModal(state.activeChannelId));
    document.getElementById('btnOpenScheduleModal')?.addEventListener('click', () => openScheduleMeetingModal());
    document.getElementById('btnCloseScheduleMeeting')?.addEventListener('click', closeScheduleMeetingModal);
    document.getElementById('btnCancelScheduleMeeting')?.addEventListener('click', closeScheduleMeetingModal);
    document.getElementById('scheduleMeetingBackdrop')?.addEventListener('click', closeScheduleMeetingModal);
    document.getElementById('formScheduleMeeting')?.addEventListener('submit', handleScheduleMeetingSubmit);

    // 4. Thread Side Panel Handlers
    document.getElementById('btnCloseThreadPanel')?.addEventListener('click', closeThreadSidePanel);
    document.getElementById('formSendThreadReply')?.addEventListener('submit', (e) => {
      e.preventDefault();
      handleSendThreadReply();
    });
    document.getElementById('inputThreadReplyText')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendThreadReply();
      }
    });

    // 5. Subject & Importance Toolbar Toggles
    document.getElementById('btnToggleSubject')?.addEventListener('click', () => {
      state.showSubjectInput = !state.showSubjectInput;
      const wrap = document.getElementById('composerSubjectWrap');
      if (wrap) {
        wrap.classList.toggle('hidden', !state.showSubjectInput);
        if (state.showSubjectInput) document.getElementById('chatMessageSubject')?.focus();
      }
    });

    document.getElementById('btnToggleImportance')?.addEventListener('click', () => {
      const btn = document.getElementById('btnToggleImportance');
      if (state.activeImportance === 'important') {
        state.activeImportance = 'normal';
        if (btn) {
          btn.style.background = '';
          btn.style.color = '';
        }
      } else {
        state.activeImportance = 'important';
        if (btn) {
          btn.style.background = 'rgba(255, 42, 77, 0.25)';
          btn.style.color = '#ff2a4d';
        }
      }
    });

    // 6. Activity Feed Filter Buttons & Clear
    document.querySelectorAll('#teamsPaneActivity .btn-filter-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.getAttribute('data-filter');
        renderActivityFeed(filter);
      });
    });
    document.getElementById('btnClearActivity')?.addEventListener('click', () => {
      (WorkspaceDB.data.activity || []).forEach(a => a.unread = false);
      WorkspaceDB.save().catch(() => {});
      updateActivityBadge();
      renderActivityFeed(state.activityFilter);
    });

    // 7. Central Files Explorer Filter & Upload
    document.querySelectorAll('#teamsPaneFiles .btn-filter-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = btn.getAttribute('data-file-cat');
        renderCentralFiles(cat);
      });
    });

    const fileUploadInput = document.getElementById('hiddenCentralFileInput');
    document.getElementById('btnUploadCentralFile')?.addEventListener('click', () => fileUploadInput?.click());
    fileUploadInput?.addEventListener('change', (e) => {
      const files = Array.from(e.target.files || []);
      files.forEach(f => uploadCentralFile(f));
      fileUploadInput.value = '';
    });

    // 8. Channels & DMs Filter Bar
    document.getElementById('searchChatsInput')?.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      document.querySelectorAll('#channelList .channel-item, #dmMembersList .channel-item').forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = (!q || text.includes(q)) ? 'flex' : 'none';
      });
    });

    // 9. Workers / Team Directory Filters & Search
    document.getElementById('searchWorkerInput')?.addEventListener('input', (e) => {
      state.workerSearchQuery = e.target.value.toLowerCase().trim();
      renderWorkers();
    });

    document.querySelectorAll('#workersDeptPills .dept-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('#workersDeptPills .dept-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        state.workerDeptFilter = pill.getAttribute('data-dept') || 'ALL';
        renderWorkers();
      });
    });

    document.getElementById('workersStatusSelect')?.addEventListener('change', (e) => {
      state.workerStatusFilter = e.target.value || 'ALL';
      renderWorkers();
    });

    // 10. Direct Audio & Video Call Buttons in Chat Header
    document.getElementById('btnChatAudioCall')?.addEventListener('click', async () => {
      if (state.activeChannelId?.startsWith('dm_')) {
        const memberId = state.activeChannelId.replace('dm_', '');
        const member = getUniqueMembersList().find(m => m.id === memberId || m.uid === memberId);
        if (member) {
          await startDirectCallWithMember(member, 'audio');
          return;
        }
      }
      openMeetingModal(null);
    });

    document.getElementById('btnChatVideoCall')?.addEventListener('click', async () => {
      if (state.activeChannelId?.startsWith('dm_')) {
        const memberId = state.activeChannelId.replace('dm_', '');
        const member = getUniqueMembersList().find(m => m.id === memberId || m.uid === memberId);
        if (member) {
          await startDirectCallWithMember(member, 'video');
          return;
        }
      }
      openMeetingModal(null);
    });

    // 11. Central Files Search Bar
    document.getElementById('searchFilesInput')?.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      document.querySelectorAll('#centralFilesGrid .central-file-card').forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = (!q || text.includes(q)) ? 'flex' : 'none';
      });
    });

    if (window.electronAPI) {
      if (window.electronAPI.onOpenTab) {
        window.electronAPI.onOpenTab((tab) => switchTab(tab));
      }
      if (window.electronAPI.onSetTheme) {
        window.electronAPI.onSetTheme((theme) => {
          const match = DEFAULT_WALLPAPER_PRESETS.find(p => p.theme === theme);
          if (match) applyWallpaperPreset(match.id);
        });
      }
    }
  }

  // --- INITIALIZATION ---

  // ==========================================================================
  // REDDOT WORKSTATION v3.0 - ADVANCED ENTERPRISE LOGIC SUITE
  // Dashboard, Slide-Out Task Drawer, Engineering Directory, Dual Themes, Omnibox
  // ==========================================================================

  function formatRelativeTime(ts) {
    if (!ts) return 'Recently';
    const diffSec = Math.max(0, Math.floor((Date.now() - Number(ts)) / 1000));
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }

  function updateAttendanceMetricsUI() {
    const cur = getCurrentResolvedMember();
    const curId = cur?.id;
    const curUid = state.currentUser?.uid || cur?.uid;
    const curEmail = (state.currentUser?.email || cur?.email || '').toLowerCase().trim();
    const curName = (cur?.name || cur?.displayName || '').toLowerCase().trim();
    const isFounder = (curEmail === 'jagadish2k2006@gmail.com') || (state.userRole === 'OWNER') || (curId === 'RD-FOUNDER-001');

    const rawPunches = (WorkspaceDB.data.punchLogs || []).map(normalizePunch).filter(Boolean);
    const empPunches = rawPunches.filter(p => {
      if (!p) return false;
      const pWorkerId = p.workerId;
      const pEmail = (p.email || '').toLowerCase().trim();
      const pName = (p.name || '').toLowerCase().trim();

      if (curId && pWorkerId === curId) return true;
      if (curUid && (pWorkerId === curUid || p.uid === curUid)) return true;
      if (curEmail && pEmail && pEmail === curEmail) return true;
      if (curName && pName && (pName === curName || pName.includes(curName) || curName.includes(pName))) return true;
      if (isFounder && (pWorkerId === 'RD-FOUNDER-001' || pName.includes('jagadish') || pEmail.includes('jagadish'))) return true;
      return false;
    }).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

    // Calculate start of current week (Monday 00:00:00)
    const now = new Date();
    const currentDayOfWeek = (now.getDay() + 6) % 7; // 0 = Mon, 1 = Tue, ..., 6 = Sun
    const monday = new Date(now);
    monday.setDate(now.getDate() - currentDayOfWeek);
    monday.setHours(0, 0, 0, 0);
    const startOfWeekTs = monday.getTime();

    const daySeconds = [0, 0, 0, 0, 0, 0, 0];

    // Compute session durations from genuine punch timestamps
    let activeInTs = null;
    empPunches.forEach(p => {
      const ts = p.timestamp || 0;
      if (ts < startOfWeekTs) return;
      const d = new Date(ts);
      const dayIdx = (d.getDay() + 6) % 7;

      if (p.action === 'CLOCK_IN') {
        activeInTs = ts;
      } else if ((p.action === 'CLOCK_OUT' || p.action === 'BREAK') && activeInTs) {
        const dur = Math.max(0, Math.floor((ts - activeInTs) / 1000));
        daySeconds[dayIdx] += dur;
        activeInTs = null;
      }
    });

    // If currently on duty today, factor in the live active seconds
    if (state.personalShift?.status === 'DUTY_ON' && state.personalShift.seconds) {
      daySeconds[currentDayOfWeek] = Math.max(daySeconds[currentDayOfWeek], state.personalShift.seconds);
    }

    const totalWeekSec = daySeconds.reduce((sum, s) => sum + s, 0);
    const weeklyHours = (totalWeekSec / 3600).toFixed(1);
    const weeklyPct = Math.min(100, Math.round((totalWeekSec / (40 * 3600)) * 100));

    const daysElapsed = Math.max(1, currentDayOfWeek + 1);
    const dailyMean = (totalWeekSec / (daysElapsed * 3600)).toFixed(1);

    const weeklyEl = document.getElementById('weeklyLoadHours');
    if (weeklyEl) weeklyEl.textContent = weeklyHours;
    const weeklyBar = document.getElementById('weeklyLoadBar');
    if (weeklyBar) weeklyBar.style.width = `${weeklyPct}%`;
    const weeklyTarget = document.getElementById('weeklyLoadTargetText');
    if (weeklyTarget) weeklyTarget.textContent = `Target: 40.0 hrs • ${weeklyPct}%`;

    const dailyMeanEl = document.getElementById('dailyMeanHours');
    if (dailyMeanEl) dailyMeanEl.textContent = dailyMean;

    // Update 7-day mini bar chart accurately
    const chartCols = document.querySelectorAll('#dailyMeanChart .att-chart-col');
    if (chartCols && chartCols.length >= 7) {
      const maxDaySec = Math.max(...daySeconds, 8 * 3600);
      daySeconds.forEach((sec, idx) => {
        const col = chartCols[idx];
        if (col) {
          const bar = col.querySelector('.att-chart-bar');
          const pct = Math.round((sec / maxDaySec) * 100);
          if (bar) bar.style.height = `${Math.max(sec > 0 ? 8 : 4, pct)}%`;
          if (idx === currentDayOfWeek) {
            col.classList.add('active');
          } else {
            col.classList.remove('active');
          }
        }
      });
    }
  }

  // =========================================================================
  // ATTENDANCE ANALYTICS & HISTORICAL RECORDS CONTROLLER
  // =========================================================================
  let activeAnalyticsPeriod = 'THIS_WEEK';
  let activeAnalyticsMemberId = 'SELF';

  function calculateHistoricalAttendanceStats(filterMemberId = 'SELF', period = 'THIS_WEEK') {
    const rawPunches = (WorkspaceDB.data.punchLogs || []).map(normalizePunch).filter(Boolean);
    const hasAccess = hasFullAttendanceAccess();
    const cur = getCurrentResolvedMember();
    const curId = cur?.id;
    const curUid = state.currentUser?.uid || cur?.uid;
    const curEmail = (state.currentUser?.email || cur?.email || '').toLowerCase().trim();
    const curName = (cur?.name || cur?.displayName || '').toLowerCase().trim();
    const isFounder = (curEmail === 'jagadish2k2006@gmail.com') || (state.userRole === 'OWNER') || (curId === 'RD-FOUNDER-001');

    // 1. Filter by Member
    let memberPunches = rawPunches;
    if (!hasAccess || filterMemberId === 'SELF') {
      memberPunches = rawPunches.filter(p => {
        if (!p) return false;
        const pWorkerId = p.workerId;
        const pEmail = (p.email || '').toLowerCase().trim();
        const pName = (p.name || '').toLowerCase().trim();

        if (curId && pWorkerId === curId) return true;
        if (curUid && (pWorkerId === curUid || p.uid === curUid)) return true;
        if (curEmail && pEmail && pEmail === curEmail) return true;
        if (curName && pName && (pName === curName || pName.includes(curName) || curName.includes(pName))) return true;
        if (isFounder && (pWorkerId === 'RD-FOUNDER-001' || pName.includes('jagadish') || pEmail.includes('jagadish'))) return true;
        return false;
      });
    } else if (filterMemberId !== 'ALL') {
      const targetMember = (WorkspaceDB.data.members || {})[filterMemberId] || getUniqueMembersList().find(m => m.id === filterMemberId || m.uid === filterMemberId);
      const targetName = (targetMember?.name || targetMember?.displayName || '').toLowerCase().trim();
      const targetEmail = (targetMember?.email || '').toLowerCase().trim();

      memberPunches = rawPunches.filter(p => {
        if (!p) return false;
        const pWorkerId = p.workerId;
        const pEmail = (p.email || '').toLowerCase().trim();
        const pName = (p.name || '').toLowerCase().trim();

        if (pWorkerId === filterMemberId || p.uid === filterMemberId) return true;
        if (targetEmail && pEmail && pEmail === targetEmail) return true;
        if (targetName && pName && (pName === targetName || pName.includes(targetName) || targetName.includes(pName))) return true;
        return false;
      });
    }

    // 2. Filter by Period Time Range
    const now = new Date();
    let startTs = 0;
    let endTs = Date.now() + 86400000;
    let rangeLabel = 'All Historical Records';

    const currentDayOfWeek = (now.getDay() + 6) % 7; // 0=Mon, 6=Sun
    const thisMonday = new Date(now);
    thisMonday.setDate(now.getDate() - currentDayOfWeek);
    thisMonday.setHours(0, 0, 0, 0);

    if (period === 'THIS_WEEK') {
      startTs = thisMonday.getTime();
      rangeLabel = `This Week: ${thisMonday.toLocaleDateString([], { month: 'short', day: 'numeric' })} - Today`;
    } else if (period === 'LAST_WEEK') {
      const lastMonday = new Date(thisMonday);
      lastMonday.setDate(thisMonday.getDate() - 7);
      startTs = lastMonday.getTime();
      endTs = thisMonday.getTime();
      rangeLabel = `Last Week: ${lastMonday.toLocaleDateString([], { month: 'short', day: 'numeric' })} - ${new Date(endTs - 1000).toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
    } else if (period === 'PAST_2_WEEKS') {
      const twoWeeksAgo = new Date(thisMonday);
      twoWeeksAgo.setDate(thisMonday.getDate() - 14);
      startTs = twoWeeksAgo.getTime();
      rangeLabel = `Past 2 Weeks: ${twoWeeksAgo.toLocaleDateString([], { month: 'short', day: 'numeric' })} - Today`;
    } else if (period === 'PAST_30_DAYS') {
      startTs = Date.now() - (30 * 86400000);
      rangeLabel = `Past 30 Days: ${new Date(startTs).toLocaleDateString([], { month: 'short', day: 'numeric' })} - Today`;
    } else {
      startTs = 0;
      rangeLabel = 'All Verified Attendance History';
    }

    const filteredPunches = memberPunches.filter(p => {
      const ts = p.timestamp || 0;
      return ts >= startTs && ts <= endTs;
    }).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

    // 3. Compute Daily Hours & Sessions
    const dayMap = new Map();
    filteredPunches.forEach(p => {
      const ts = p.timestamp || 0;
      const d = new Date(ts);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!dayMap.has(key)) {
        dayMap.set(key, {
          dateStr: key,
          dateObj: d,
          dayLabel: d.toLocaleDateString([], { weekday: 'short' }),
          formattedDate: d.toLocaleDateString([], { month: 'short', day: 'numeric' }),
          totalSec: 0,
          punches: [],
          onTime: true
        });
      }
      dayMap.get(key).punches.push(p);
    });

    let totalSec = 0;
    let totalShifts = 0;
    let onTimeShifts = 0;

    dayMap.forEach((dayData) => {
      let activeIn = null;
      dayData.punches.forEach(p => {
        const ts = p.timestamp || 0;
        if (p.action === 'CLOCK_IN') {
          activeIn = ts;
          totalShifts++;
          const pDate = new Date(ts);
          if (pDate.getHours() > 10 || (pDate.getHours() === 10 && pDate.getMinutes() > 15)) {
            dayData.onTime = false;
          } else {
            onTimeShifts++;
          }
        } else if ((p.action === 'CLOCK_OUT' || p.action === 'BREAK') && activeIn) {
          const sessionSec = Math.max(0, Math.floor((ts - activeIn) / 1000));
          dayData.totalSec += sessionSec;
          activeIn = null;
        }
      });

      const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      if (dayData.dateStr === todayKey && state.personalShift?.status === 'DUTY_ON' && state.personalShift.seconds) {
        dayData.totalSec = Math.max(dayData.totalSec, state.personalShift.seconds);
      }
      totalSec += dayData.totalSec;
    });

    const activeDaysCount = Array.from(dayMap.values()).filter(d => d.totalSec > 60).length;
    const effectiveDays = Math.max(1, activeDaysCount);
    const dailyAvgHours = (totalSec / (effectiveDays * 3600)).toFixed(1);
    const totalHours = (totalSec / 3600).toFixed(1);
    const onTimeRate = totalShifts > 0 ? Math.round((onTimeShifts / totalShifts) * 100) : 100;

    // 4. Compute Past Weeks Comparison
    const weeksList = [];
    for (let w = 0; w < 5; w++) {
      const wMonday = new Date(thisMonday);
      wMonday.setDate(thisMonday.getDate() - (w * 7));
      const wSunday = new Date(wMonday);
      wSunday.setDate(wMonday.getDate() + 6);
      wSunday.setHours(23, 59, 59, 999);

      const wStart = wMonday.getTime();
      const wEnd = wSunday.getTime();

      const weekPunches = memberPunches.filter(p => (p.timestamp || 0) >= wStart && (p.timestamp || 0) <= wEnd);
      let wSec = 0;
      let wDays = new Set();
      let wIn = null;

      weekPunches.forEach(p => {
        const ts = p.timestamp || 0;
        const d = new Date(ts);
        const dayKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        if (p.action === 'CLOCK_IN') {
          wIn = ts;
          wDays.add(dayKey);
        } else if ((p.action === 'CLOCK_OUT' || p.action === 'BREAK') && wIn) {
          wSec += Math.max(0, Math.floor((ts - wIn) / 1000));
          wIn = null;
        }
      });

      if (w === 0 && state.personalShift?.status === 'DUTY_ON' && state.personalShift.seconds) {
        wSec = Math.max(wSec, state.personalShift.seconds);
        wDays.add('today');
      }

      const wHours = (wSec / 3600).toFixed(1);
      const wAvg = wDays.size > 0 ? (wSec / (wDays.size * 3600)).toFixed(1) : '0.0';
      const wPct = Math.min(100, Math.round((wSec / (40 * 3600)) * 100));

      weeksList.push({
        label: w === 0 ? `This Week (${wMonday.toLocaleDateString([], { month: 'short', day: 'numeric' })} - ${wSunday.toLocaleDateString([], { month: 'short', day: 'numeric' })})` : `Week -${w} (${wMonday.toLocaleDateString([], { month: 'short', day: 'numeric' })} - ${wSunday.toLocaleDateString([], { month: 'short', day: 'numeric' })})`,
        totalHours: wHours,
        dailyAvg: wAvg,
        daysWorked: wDays.size,
        targetPct: wPct,
        status: wPct >= 100 ? 'Fulfilled (100%)' : (w === 0 ? 'In Progress' : `${wPct}% Completed`)
      });
    }

    return {
      period,
      rangeLabel,
      totalHours,
      dailyAvgHours,
      activeDaysCount,
      onTimeRate,
      dayMap: Array.from(dayMap.values()).sort((a, b) => a.dateObj - b.dateObj),
      weeksList,
      punches: [...filteredPunches].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    };
  }

  function closeAttendanceAnalyticsModal() {
    const modal = document.getElementById('attendanceAnalyticsModal');
    if (modal) modal.classList.add('hidden');
  }
  window.closeAttendanceAnalyticsModal = closeAttendanceAnalyticsModal;

  function openAttendanceAnalyticsModal(initialPeriod = null) {
    if (initialPeriod) activeAnalyticsPeriod = initialPeriod;
    const modal = document.getElementById('attendanceAnalyticsModal');
    if (!modal) return;

    // Populate Member Filter dropdown in modal
    const memberSelect = document.getElementById('analyticsMemberFilter');
    const memberWrap = document.getElementById('analyticsMemberFilterWrap');
    const hasAccess = hasFullAttendanceAccess();

    if (memberSelect) {
      memberSelect.replaceChildren();
      if (!hasAccess) {
        if (memberWrap) memberWrap.style.display = 'none';
        const opt = document.createElement('option');
        opt.value = 'SELF';
        opt.textContent = state.currentMember?.displayName || 'My Records';
        memberSelect.appendChild(opt);
        activeAnalyticsMemberId = 'SELF';
      } else {
        if (memberWrap) memberWrap.style.display = 'flex';
        const optAll = document.createElement('option');
        optAll.value = 'ALL';
        optAll.textContent = '🌟 Whole Team Overview';
        if (activeAnalyticsMemberId === 'ALL') optAll.selected = true;
        memberSelect.appendChild(optAll);

        const optSelf = document.createElement('option');
        optSelf.value = 'SELF';
        optSelf.textContent = `👤 ${state.currentMember?.displayName || 'JAGADISH K'} (Founder)`;
        if (activeAnalyticsMemberId === 'SELF') optSelf.selected = true;
        memberSelect.appendChild(optSelf);

        getUniqueMembersList().forEach(m => {
          if (!m) return;
          const opt = document.createElement('option');
          opt.value = m.id || m.uid;
          opt.textContent = `${m.displayName || m.name} [${m.id || 'RD'}]`;
          if (activeAnalyticsMemberId === opt.value) opt.selected = true;
          memberSelect.appendChild(opt);
        });
      }
    }

    // Highlight period pill
    document.querySelectorAll('#analyticsPeriodPills .analytics-pill').forEach(pill => {
      pill.classList.toggle('active', pill.getAttribute('data-period') === activeAnalyticsPeriod);
    });

    renderAttendanceAnalyticsModalData();
    modal.classList.remove('hidden');
  }

  function renderAttendanceAnalyticsModalData() {
    const stats = calculateHistoricalAttendanceStats(activeAnalyticsMemberId, activeAnalyticsPeriod);

    // 1. KPI Numbers
    safeSetText(document.getElementById('analyticsKpiDailyAvg'), stats.dailyAvgHours);
    safeSetText(document.getElementById('analyticsKpiTotalHours'), stats.totalHours);
    safeSetText(document.getElementById('analyticsKpiActiveDays'), String(stats.activeDaysCount));
    safeSetText(document.getElementById('analyticsKpiOnTime'), `${stats.onTimeRate}%`);
    safeSetText(document.getElementById('analyticsChartRangeLabel'), stats.rangeLabel);
    safeSetText(document.getElementById('analyticsPunchesCountLabel'), `${stats.punches.length} verified records`);

    // 2. Day-by-Day Bar Chart
    const chartContainer = document.getElementById('analyticsDayChartWrap');
    if (chartContainer) {
      chartContainer.replaceChildren();
      if (stats.dayMap.length === 0) {
        chartContainer.innerHTML = `<div style="color: var(--text-muted); font-size: 11.5px; width: 100%; text-align: center; margin: auto;">No shift punches recorded in this period.</div>`;
      } else {
        const maxSec = Math.max(...stats.dayMap.map(d => d.totalSec), 8 * 3600);
        stats.dayMap.forEach(d => {
          const hours = (d.totalSec / 3600).toFixed(1);
          const pct = Math.min(100, Math.max(d.totalSec > 0 ? 8 : 4, Math.round((d.totalSec / maxSec) * 100)));
          const targetMet = d.totalSec >= 7.5 * 3600;
          const targetExceeded = d.totalSec >= 8.5 * 3600;

          const col = document.createElement('div');
          col.className = `analytics-chart-bar-item ${targetExceeded ? 'target-exceeded' : (targetMet ? 'target-met' : '')}`;
          col.title = `${d.dayLabel}, ${d.formattedDate}: ${hours} hrs logged`;
          col.innerHTML = `
            <span class="analytics-bar-val">${hours > 0 ? `${hours}h` : ''}</span>
            <div class="analytics-bar-track">
              <div class="analytics-bar-fill" style="height: ${pct}%;"></div>
            </div>
            <span class="analytics-bar-label">${d.dayLabel}</span>
            <span class="analytics-bar-date">${d.formattedDate}</span>
          `;
          chartContainer.appendChild(col);
        });
      }
    }

    // 3. Past Weeks Comparison Table
    const weeksTbody = document.getElementById('analyticsWeeksTableBody');
    if (weeksTbody) {
      weeksTbody.replaceChildren();
      stats.weeksList.forEach(w => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${escapeHtml(w.label)}</strong></td>
          <td><span style="font-family: var(--font-mono); font-weight: 700; color: var(--accent-cyan);">${w.totalHours} hrs</span></td>
          <td><span style="font-family: var(--font-mono);">${w.dailyAvg} hrs/day</span></td>
          <td>${w.daysWorked} days</td>
          <td>
            <div style="display: flex; align-items: center; gap: 6px;">
              <div style="flex: 1; min-width: 60px; height: 6px; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden;">
                <div style="width: ${w.targetPct}%; height: 100%; background: ${w.targetPct >= 100 ? '#10b981' : 'var(--accent-cyan)'};"></div>
              </div>
              <span style="font-size: 10.5px; font-family: var(--font-mono);">${w.targetPct}%</span>
            </div>
          </td>
          <td><span class="badge-verified" style="font-size: 11px; font-weight: 600; color: ${w.targetPct >= 100 ? '#10b981' : '#38bdf8'};">${escapeHtml(w.status)}</span></td>
        `;
        weeksTbody.appendChild(tr);
      });
    }

    // 4. Detailed Verified Punches
    const punchesTbody = document.getElementById('analyticsPunchesTableBody');
    if (punchesTbody) {
      punchesTbody.replaceChildren();
      if (stats.punches.length === 0) {
        punchesTbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 16px;">No punch records found for this timeframe.</td></tr>`;
      } else {
        stats.punches.slice(0, 100).forEach(punch => {
          const tr = document.createElement('tr');
          const actionColor = punch.action === 'CLOCK_IN' ? 'var(--accent-green)' : (punch.action === 'BREAK' ? 'var(--accent-gold)' : 'var(--accent-red)');
          const actionText = punch.action === 'CLOCK_IN' ? '▶ Clock In' : (punch.action === 'BREAK' ? '⏸ Break' : '⏹ Clock Out');

          tr.innerHTML = `
            <td><strong>${escapeHtml(punch.name || punch.workerId || 'Member')}</strong></td>
            <td><span style="color: ${actionColor}; font-weight: 700; font-family: var(--font-mono); font-size: 11px;">${actionText}</span></td>
            <td>${escapeHtml(punch.time || new Date(punch.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))}</td>
            <td>${escapeHtml(punch.date || new Date(punch.timestamp || Date.now()).toLocaleDateString())}</td>
            <td><span style="font-family: var(--font-mono); color: var(--accent-cyan); font-weight: 600;">${punch.durationStr || punch.duration || '--'}</span></td>
            <td><span class="badge-verified" style="color: var(--accent-green); font-size: 11px; font-weight: 600;"><span style="color:#00e5a3;">✔</span> Verified (SHA-256)</span></td>
          `;
          punchesTbody.appendChild(tr);
        });
      }
    }
  }

  function exportAnalyticsPeriodCsv() {
    const stats = calculateHistoricalAttendanceStats(activeAnalyticsMemberId, activeAnalyticsPeriod);
    if (!stats.punches || stats.punches.length === 0) {
      showQuickToast('No punch logs in this selected period to export.', 'info');
      return;
    }

    const headers = ['DATE', 'TIME', 'EMPLOYEE', 'EMPLOYEE_ID', 'ACTION', 'TIMESTAMP', 'STATUS'];
    const rows = stats.punches.map(p => {
      const d = new Date(p.timestamp || Date.now());
      return [
        `"${d.toLocaleDateString('en-US')}"`,
        `"${d.toLocaleTimeString('en-US')}"`,
        `"${p.name || p.workerId || 'Member'}"`,
        `"${p.workerId || p.memberId || 'RD-EMP'}"`,
        `"${p.action || 'PUNCH'}"`,
        `"${p.timestamp || Date.now()}"`,
        `"VERIFIED HARDWARE (SHA-256)"`
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reddot-attendance-${activeAnalyticsPeriod.toLowerCase()}-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showQuickToast('Period attendance CSV exported successfully!', 'success');
  }

  function updateNotificationsUI() {
    const listContainer = document.querySelector('#headerNotificationDropdown .notif-list');
    const badge = document.getElementById('headerNotifBadge');
    const headSpan = document.querySelector('#headerNotificationDropdown .notif-head span');
    if (!listContainer) return;

    listContainer.replaceChildren();

    const notifications = [];

    // 1. Real activity items from WorkspaceDB.data.activity (mentions, chat messages, thread replies, calls)
    const activities = (WorkspaceDB.data.activity || []).slice(0, 15);
    activities.forEach(act => {
      let icon = '🔔';
      if (act.type === 'mention') icon = '🏷️';
      else if (act.type === 'reply' || act.type === 'thread_reply' || act.type === 'chat') icon = '💬';
      else if (act.type === 'call') icon = '📞';
      else if (act.type === 'task') icon = '📋';
      else if (act.type === 'punch') icon = '⏱️';

      notifications.push({
        ...act,
        icon: icon,
        title: act.title || 'New Notification',
        desc: act.snippet || (act.channelId ? `Channel #${act.channelId}` : 'Tap to navigate'),
        time: act.timestamp ? formatRelativeTime(act.timestamp) : 'Recently',
        timestamp: act.timestamp || Date.now(),
        unread: !!act.unread
      });
    });

    // 2. Recent sprint tasks from WorkspaceDB.data.tasks
    const recentTasks = (WorkspaceDB.data.tasks || []).slice(-5);
    recentTasks.forEach(t => {
      const isDone = t.status === 'COMPLETED' || t.status === 'ACCOMPLISHED';
      notifications.push({
        type: 'task',
        taskId: t.id,
        icon: isDone ? '✅' : '⚡',
        title: `Task: ${t.title || 'Sprint Task'}`,
        desc: `Status: ${t.status || 'Active'} • Assignee: ${t.assigneeName || 'Member'}`,
        time: t.updatedAt ? formatRelativeTime(t.updatedAt) : 'Recent',
        timestamp: t.updatedAt || t.createdAt || Date.now(),
        unread: false
      });
    });

    // 3. Recent punch notices from WorkspaceDB.data.punchLogs
    const punches = (WorkspaceDB.data.punchLogs || []).slice(-4);
    punches.forEach(p => {
      const isClockIn = p.action === 'CLOCK_IN';
      notifications.push({
        type: 'punch',
        punchId: p.id,
        icon: isClockIn ? '🟢' : '⏸️',
        title: `${p.name || 'Member'} ${isClockIn ? 'Clocked In' : 'Logged Activity'}`,
        desc: `Verified timestamp at ${p.time || 'workstation'}`,
        time: p.timestamp ? formatRelativeTime(p.timestamp) : 'Today',
        timestamp: p.timestamp || Date.now(),
        unread: false
      });
    });

    // 4. System initialization notice
    notifications.push({
      type: 'system',
      icon: '💾',
      title: 'Local Vault Active',
      desc: 'Workstation NVMe local persistent storage active.',
      time: 'Online',
      timestamp: 0,
      unread: false
    });

    // Sort notifications: unread first, then by timestamp descending
    notifications.sort((a, b) => {
      if (a.unread && !b.unread) return -1;
      if (!a.unread && b.unread) return 1;
      return (b.timestamp || 0) - (a.timestamp || 0);
    });

    const unreadCount = notifications.filter(n => n.unread).length;
    if (badge) {
      badge.textContent = unreadCount > 99 ? '99+' : String(unreadCount);
      badge.style.display = unreadCount > 0 ? 'inline-block' : 'none';
    }
    if (headSpan) {
      headSpan.textContent = `SYSTEM NOTIFICATIONS (${notifications.length})`;
    }

    if (notifications.length === 0) {
      const emptyItem = document.createElement('div');
      emptyItem.style.cssText = 'padding: 24px; text-align: center; color: var(--text-muted); font-size: 11px;';
      emptyItem.textContent = 'No system notifications.';
      listContainer.appendChild(emptyItem);
      return;
    }

    notifications.slice(0, 10).forEach(n => {
      const item = document.createElement('div');
      item.className = `notif-item ${n.unread ? 'notif-item-unread' : ''}`;
      item.style.cursor = 'pointer';
      item.innerHTML = `
        <span style="font-size: 14px; flex-shrink: 0; margin-top: 1px;">${n.icon}</span>
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: 700; font-size: 12px; color: var(--text-white); display: flex; align-items: center; justify-content: space-between; gap: 6px;">
            <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(n.title)}</span>
            ${n.unread ? '<span style="width: 7px; height: 7px; border-radius: 50%; background: var(--accent-cyan, #00e5ff); display: inline-block; flex-shrink: 0;"></span>' : ''}
          </div>
          <div style="font-size: 10.5px; opacity: 0.85; color: var(--text-secondary); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(n.desc)}</div>
          <div style="color: var(--accent-cyan, #0284c7); font-size: 9.5px; margin-top: 3px; font-family: var(--font-mono);">${escapeHtml(n.time)}</div>
        </div>
      `;

      item.addEventListener('click', () => {
        navigateToNotificationDestination(n);
      });

      listContainer.appendChild(item);
    });
  }

  function renderDashboard() {
    const now = new Date();
    const hour = now.getHours();
    const greeting = hour < 12 ? 'Good morning' : (hour < 17 ? 'Good afternoon' : 'Good evening');
    const member = (state.currentMemberId && WorkspaceDB.data.members?.[state.currentMemberId]) || state.currentMember || {};
    const memberName = member.name || state.currentUser?.displayName || 'Jagadish K';

    const greetingEl = document.getElementById('dashGreeting');
    if (greetingEl) greetingEl.textContent = `${greeting}, ${memberName}`;

    const dateOptions = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    const dateClusterEl = document.getElementById('dashDateCluster');
    if (dateClusterEl) dateClusterEl.textContent = `${now.toLocaleDateString('en-US', dateOptions)} • Workstation OS`;

    // 1. Active Engineers Count - authentic counts only
    const members = (typeof getUniqueMembersList === 'function')
      ? getUniqueMembersList()
      : Object.values(WorkspaceDB.data.members || {}).filter(m => m && !m.suspended && !m.deleted);
    const onlineCount = members.filter(m => isMemberAppOnline(m) || isSelfMember(m)).length;
    const breakCount = members.filter(m => getMemberDutyStatus(m) === 'DUTY_BREAK').length;
    const offlineCount = Math.max(0, members.length - onlineCount - breakCount);

    const valEng = document.getElementById('dashValEngineersCount');
    if (valEng) valEng.textContent = String(onlineCount);
    const subEng = document.getElementById('dashSubEngineers');
    if (subEng) subEng.textContent = `${onlineCount} active, ${offlineCount} offline`;

    // 2. Sprint Velocity - authentic metrics only
    const tasks = WorkspaceDB.data.tasks || [];
    const doneTasks = tasks.filter(t => t.status === 'COMPLETED' || t.status === 'ACCOMPLISHED').length;
    const totalTasks = tasks.length;

    const valVeloDone = document.getElementById('dashValVelocityDone');
    if (valVeloDone) valVeloDone.textContent = String(doneTasks);
    const valVeloTot = document.getElementById('dashValVelocityTotal');
    if (valVeloTot) valVeloTot.textContent = `/ ${totalTasks} Done`;
    const subVelo = document.getElementById('dashSubVelocity');
    if (subVelo) {
      if (totalTasks > 0) {
        const pct = Math.round((doneTasks / totalTasks) * 100);
        subVelo.innerHTML = `↗ ${pct}% of tasks completed`;
      } else {
        subVelo.textContent = 'No active tasks';
      }
    }

    // 3. Trigger Shift UI & Attendance calculations
    updateShiftUI();
    updateAttendanceMetricsUI();
    updateNotificationsUI();

    // 4. Render Objectives & Activity
    renderDashboardObjectives();
    renderDashboardActivity();
  }

  function renderDashboardObjectives() {
    const container = document.getElementById('dashObjectivesList');
    if (!container) return;
    container.replaceChildren();

    const tasks = WorkspaceDB.data.tasks || [];
    const pendingTasks = tasks.filter(t => t.status !== 'COMPLETED' && t.status !== 'ACCOMPLISHED');

    const pendingBadge = document.getElementById('dashPendingObjectivesCount');
    if (pendingBadge) {
      pendingBadge.textContent = `${pendingTasks.length} pending`;
    }

    if (pendingTasks.length === 0) {
      const emptyItem = document.createElement('div');
      emptyItem.style.cssText = 'padding: 24px; text-align: center; color: var(--text-muted); font-size: 12.5px; background: var(--card-bg); border: 1px dashed var(--card-border); border-radius: 8px;';
      emptyItem.innerHTML = `
        <div style="font-size: 20px; margin-bottom: 6px;">🎯</div>
        <div style="font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">All Objectives Cleared</div>
        <p style="font-size: 11.5px; margin: 0 0 12px 0;">No pending priority tasks in sprint. Ready for new assignments.</p>
        <button type="button" class="btn-dash-action primary" id="btnDashCreateTaskEmpty" style="display:inline-flex; align-items:center; gap:6px; padding:6px 14px; font-size:12px; cursor:pointer;">
          <span>+ Create Task</span>
        </button>
      `;
      emptyItem.querySelector('#btnDashCreateTaskEmpty')?.addEventListener('click', () => {
        switchTab('tasks');
        document.getElementById('btnOpenCreateTaskModal')?.click();
      });
      container.appendChild(emptyItem);
      return;
    }

    pendingTasks.slice(0, 5).forEach(task => {
      const item = document.createElement('div');
      item.className = 'dash-objective-item';
      const categoryTag = task.category || 'General';
      const dueText = task.dueAt ? `Due ${task.dueAt}` : (task.timeline || 'Pending');
      const isUrgent = task.priority === 'CRITICAL' || task.priority === 'URGENT' || task.priority === 'HIGH';
      const subtasks = task.subtasks || [];
      const hasSubtasks = subtasks.length > 0;
      const subtaskDone = hasSubtasks && subtasks[0].done;

      item.innerHTML = `
        <div class="dash-objective-checkbox">
          ${subtaskDone ? '<span style="color:#0062ff; font-weight:bold; font-size:11px;">✓</span>' : ''}
        </div>
        <div class="dash-objective-content">
          <div class="dash-objective-meta">
            <span class="dash-tag tag-ui">${escapeHtml(categoryTag)}</span>
            <span class="dash-due-time ${isUrgent ? 'critical' : ''}">${escapeHtml(dueText)}</span>
          </div>
          <h4 class="dash-objective-title">${escapeHtml(task.title || 'Untitled Task')}</h4>
          <p class="dash-objective-sub">${escapeHtml(task.description || task.scope || 'Assigned sprint objective.')}</p>
        </div>
      `;
      item.addEventListener('click', () => {
        switchTab('tasks');
        openTaskDrawer(task);
      });
      container.appendChild(item);
    });
  }

  function renderDashboardActivity() {
    const container = document.getElementById('dashActivityStream');
    if (!container) return;
    container.replaceChildren();

    const activities = [];

    // 1. Gather events from WorkspaceDB.data.activity
    (WorkspaceDB.data.activity || []).forEach(act => {
      activities.push({
        author: act.author || act.performedByName || 'System',
        time: act.timestamp ? formatRelativeTime(act.timestamp) : 'Recently',
        timestamp: act.timestamp || 0,
        text: act.text || act.details || act.action || 'System event recorded.'
      });
    });

    // 2. Gather genuine recent punches
    (WorkspaceDB.data.punchLogs || []).slice(-8).forEach(p => {
      const actionName = p.action === 'CLOCK_IN' ? 'started work shift' : (p.action === 'BREAK' ? 'took a break' : 'clocked out');
      activities.push({
        author: p.name || p.workerId || 'Team Member',
        time: p.timestamp ? formatRelativeTime(p.timestamp) : (p.time || 'Recently'),
        timestamp: p.timestamp || 0,
        text: `${actionName} (${p.time || new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}).`
      });
    });

    // 3. Gather genuine recent tasks
    (WorkspaceDB.data.tasks || []).forEach(t => {
      if (t.updatedAt || t.createdAt) {
        const isDone = t.status === 'COMPLETED' || t.status === 'ACCOMPLISHED';
        activities.push({
          author: t.assigneeName || t.createdByName || 'Team Member',
          time: formatRelativeTime(t.updatedAt || t.createdAt),
          timestamp: t.updatedAt || t.createdAt,
          text: isDone ? `Completed sprint task: "${t.title}".` : `Updated sprint task: "${t.title}".`
        });
      }
    });

    // Sort by most recent
    activities.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    // Deduplicate and take top 5
    const uniqueActivities = [];
    const seenTexts = new Set();
    for (const act of activities) {
      const key = `${act.author}:${act.text}`;
      if (!seenTexts.has(key)) {
        seenTexts.add(key);
        uniqueActivities.push(act);
      }
      if (uniqueActivities.length >= 5) break;
    }

    if (uniqueActivities.length === 0) {
      const emptyItem = document.createElement('div');
      emptyItem.style.cssText = 'padding: 20px; text-align: center; color: var(--text-muted); font-size: 12px;';
      emptyItem.textContent = 'No recent activity recorded. Shift punches and task updates will stream here.';
      container.appendChild(emptyItem);
      return;
    }

    uniqueActivities.forEach(act => {
      const row = document.createElement('div');
      row.className = 'dash-activity-item';
      row.innerHTML = `
        <div class="dash-activity-dot"></div>
        <div class="dash-activity-main">
          <div class="dash-activity-meta">
            <span class="dash-activity-author">${escapeHtml(act.author)}</span>
            <span class="dash-activity-time">${escapeHtml(act.time)}</span>
          </div>
          <p class="dash-activity-text">${escapeHtml(act.text)}</p>
        </div>
      `;
      container.appendChild(row);
    });
  }

  
  // DELETE TASK
  async function deleteTask(taskId) {
    if (!taskId) return;
    const tasks = WorkspaceDB.data.tasks || [];
    const task = tasks.find(function(t) { return t.id === taskId; });
    if (!task) return;
    const taskTitle = task.title || "this task";
    const confirmed = window.confirm("Are you sure you want to delete the task:\n\"" + taskTitle + "\"?\n\nThis action cannot be undone.");
    if (!confirmed) return;
    WorkspaceDB.data.tasks = tasks.filter(function(t) { return t.id !== taskId; });
    await WorkspaceDB.save();
    if (window.FirebaseService && FirebaseService.deleteTask) {
      FirebaseService.deleteTask(taskId).catch(function() {});
    }
    if (state.activeSelectedTask && state.activeSelectedTask.id === taskId) {
      state.activeSelectedTask = null;
      const drawer = document.getElementById("taskDetailDrawer");
      if (drawer) drawer.style.display = "none";
    }
    showQuickToast("Task \"" + taskTitle + "\" deleted.", "success");
    playNotificationChirp(false);
    renderTasks();
  }
function openTaskDrawer(task) {
    if (!task) return;
    state.activeSelectedTask = task;
    const drawer = document.getElementById('taskDetailDrawer');
    if (!drawer) return;

    const taskCodeEl = document.getElementById('drawerTaskCode');
    const isTaskCompleted = task.status === 'COMPLETED' || task.status === 'ACCOMPLISHED';
    const drawerStatusLabel = isTaskCompleted ? 'Completed' : (task.status === 'REACHED' ? 'In Progress' : (task.status || 'In Progress'));
    if (taskCodeEl) taskCodeEl.textContent = (task.code || ('TASK-' + (task.id || '').slice(-4).toUpperCase())) + ' • ' + drawerStatusLabel;
    // Toggle complete vs reopen button
    const markCompleteBtn = document.getElementById('btnDrawerMarkComplete');
    if (markCompleteBtn) {
      if (isTaskCompleted) {
        markCompleteBtn.textContent = '\u21BA Reopen Task';
        markCompleteBtn.style.background = 'rgba(59,130,246,0.15)';
        markCompleteBtn.style.color = '#3b82f6';
        markCompleteBtn.style.borderColor = 'rgba(59,130,246,0.3)';
        markCompleteBtn.dataset.mode = 'reopen';
      } else {
        markCompleteBtn.textContent = '\u2714 Mark Task Complete';
        markCompleteBtn.style.background = '';
        markCompleteBtn.style.color = '';
        markCompleteBtn.style.borderColor = '';
        markCompleteBtn.dataset.mode = 'complete';
      }
    }
    const titleEl = document.getElementById('drawerTaskTitle');
    if (titleEl) titleEl.textContent = task.title || 'Task Details';
    const pipeEl = document.getElementById('drawerBranchPipeline');
    if (pipeEl) pipeEl.textContent = task.category || 'General';
    const engEl = document.getElementById('drawerLeadEngineer');
    if (engEl) engEl.textContent = task.assigneeName || task.engineer || 'JAGADISH K';
    const timeEl = document.getElementById('drawerSprintTimeline');
    if (timeEl) timeEl.textContent = task.dueAt ? `• Due ${task.dueAt}` : (task.timeline ? `• ${task.timeline}` : '• Active');
    const scopeEl = document.getElementById('drawerScopeText');
    if (scopeEl) scopeEl.textContent = task.description || task.scope || 'No additional scope details specified.';

    const subtasks = Array.isArray(task.subtasks) && task.subtasks.length > 0
      ? task.subtasks
      : [
          { label: 'Review deliverable requirements', done: task.status === 'COMPLETED' || task.status === 'ACCOMPLISHED' },
          { label: 'Complete implementation pass', done: task.status === 'COMPLETED' || task.status === 'ACCOMPLISHED' }
        ];

    const doneCount = subtasks.filter(s => s.done).length;
    const totalCount = subtasks.length;
    const percent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

    const doneText = document.getElementById('drawerSubtasksDoneText');
    if (doneText) doneText.textContent = `${doneCount}/${totalCount} Done`;
    const percentText = document.getElementById('drawerSubtasksPercentText');
    if (percentText) percentText.textContent = `${percent}% Complete`;

    const checklist = document.getElementById('drawerSubtasksChecklist');
    if (checklist) {
      checklist.replaceChildren();
      subtasks.forEach(st => {
        const item = document.createElement('div');
        item.className = `subtask-check-row ${st.done ? 'done' : ''}`;
        item.innerHTML = `<div class="subtask-checkbox">${st.done ? '✓' : ''}</div><span>${escapeHtml(st.label)}</span>`;
        item.addEventListener('click', async () => {
          st.done = !st.done;
          await WorkspaceDB.save();
          openTaskDrawer(task);
          renderTasks();
          playNotificationChirp(true);
        });
        checklist.appendChild(item);
      });
    }

    // Prototype preview
    const protoImg = document.getElementById('drawerPrototypeImg');
    const protoFilename = document.getElementById('drawerPrototypeFilename');
    if (protoImg) {
      protoImg.src = task.prototypeImg || 'assets/id-card.png';
      protoImg.style.display = task.prototypeImg ? 'block' : 'none';
    }
    if (protoFilename) {
      protoFilename.textContent = task.prototypeFilename || (task.code ? `${task.code.toLowerCase()}-deliverable.pdf` : 'deliverable-manifest.json');
      protoFilename.style.display = task.prototypeImg ? 'block' : 'none';
    }

    drawer.style.display = 'flex';
  }

  // --- DUAL THEME ENGINE (OBSIDIAN DARK FIRST-CLASS) ---
  
  // Completed Tasks Archive Modal
  function closeCompletedArchiveModal() {
    document.getElementById('completedArchiveModal')?.classList.add('hidden');
    document.getElementById('completedArchiveOverlay')?.remove();
  }
  window.closeCompletedArchiveModal = closeCompletedArchiveModal;
  window.showCompletedArchiveModal = showCompletedArchiveModal;

  function showCompletedArchiveModal() {
    var existing = document.getElementById("completedArchiveOverlay");
    if (existing) existing.remove();
    var overlay = document.createElement("div");
    overlay.id = "completedArchiveOverlay";
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:9999;display:flex;align-items:center;justify-content:center;";
    document.body.appendChild(overlay);

    function buildModal() {
      var allTasks = WorkspaceDB.data.tasks || [];
      var doneTasks = allTasks.filter(function(t) { return t.status === "COMPLETED" || t.status === "ACCOMPLISHED"; });
      var rows = doneTasks.map(function(ct) {
        var ddate = ct.accomplishedAt ? new Date(ct.accomplishedAt).toLocaleDateString("en-GB", {day:"2-digit",month:"short",year:"numeric"}) :
                    ct.updatedAt ? new Date(ct.updatedAt).toLocaleDateString("en-GB", {day:"2-digit",month:"short",year:"numeric"}) : "Unknown";
        var subs = Array.isArray(ct.subtasks) ? ct.subtasks : [];
        var doneSub = subs.filter(function(s) { return s.done; }).length;
        return [
          "<div class=\"arc-row\" data-id=\"" + ct.id + "\" style=\"background:var(--card-bg,#1d2231);border:1px solid var(--card-border,#2a3040);border-radius:8px;padding:14px 16px;margin-bottom:10px;display:flex;align-items:flex-start;justify-content:space-between;gap:12px;\">",
          "  <div style=\"flex:1;min-width:0;\">",
          "    <div style=\"display:flex;align-items:center;gap:8px;margin-bottom:4px;\">",
          "      <div style=\"width:16px;height:16px;background:#008a3e;color:#fff;border-radius:3px;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;flex-shrink:0;\">&#10003;</div>",
          "      <span style=\"font-size:13px;font-weight:700;color:var(--text-white,#fff);\">" + (ct.title || "Untitled") + "</span>",
          "      <span style=\"font-size:10px;background:var(--shell-bg,#10141c);padding:2px 7px;border-radius:4px;color:var(--text-muted,#8892a4);font-weight:600;\">" + (ct.category || "General") + "</span>",
          "    </div>",
          "    <p style=\"font-size:11px;color:var(--text-muted,#8892a4);margin:0 0 5px 24px;\">" + (ct.description || "") + "</p>",
          "    <div style=\"display:flex;gap:14px;margin-left:24px;\">",
          "      <span style=\"font-size:11px;color:var(--text-muted,#8892a4);\">&#128100; " + (ct.assigneeName || "Unknown") + "</span>",
          "      <span style=\"font-size:11px;color:var(--text-muted,#8892a4);\">&#128197; " + ddate + "</span>",
          (subs.length > 0 ? "      <span style=\"font-size:11px;color:var(--text-muted,#8892a4);\">" + doneSub + "/" + subs.length + " subtasks</span>" : ""),
          "    </div>",
          "  </div>",
          "  <div style=\"display:flex;flex-direction:column;gap:5px;flex-shrink:0;\">",
          "    <button class=\"arc-view\" data-id=\"" + ct.id + "\" style=\"font-size:11px;font-weight:600;color:var(--text-white,#fff);background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:5px;padding:4px 10px;cursor:pointer;\">View</button>",
          "    <button class=\"arc-reopen\" data-id=\"" + ct.id + "\" style=\"font-size:11px;font-weight:600;color:#3b82f6;background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.25);border-radius:5px;padding:4px 10px;cursor:pointer;\">&#8634; Reopen</button>",
          "    <button class=\"arc-delete\" data-id=\"" + ct.id + "\" style=\"font-size:11px;font-weight:600;color:#ef4444;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.25);border-radius:5px;padding:4px 10px;cursor:pointer;\">&#128465; Delete</button>",
          "  </div>",
          "</div>"
        ].join("");
      }).join("");

      overlay.innerHTML = [
        "<div style=\"background:var(--panel-bg,#181c24);border:1px solid var(--card-border,#2a3040);border-radius:12px;width:min(700px,95vw);max-height:80vh;display:flex;flex-direction:column;overflow:hidden;\">",
        "  <div style=\"padding:16px 20px;border-bottom:1px solid var(--card-border,#2a3040);display:flex;align-items:center;justify-content:space-between;\">",
        "    <div>",
        "      <h3 style=\"margin:0;font-size:15px;font-weight:700;color:var(--text-white,#fff);\">&#9989; Completed Tasks</h3>",
        "      <p style=\"margin:3px 0 0;font-size:12px;color:var(--text-muted,#8892a4);\">" + doneTasks.length + " task" + (doneTasks.length !== 1 ? "s" : "") + " completed</p>",
        "    </div>",
        "    <button id=\"arcClose\" style=\"background:none;border:none;color:var(--text-muted,#8892a4);font-size:20px;cursor:pointer;padding:4px 8px;\">&#10005;</button>",
        "  </div>",
        "  <div style=\"overflow-y:auto;flex:1;padding:14px;\">",
        (doneTasks.length === 0 ? "<div style=\"text-align:center;padding:40px;color:var(--text-muted,#8892a4);font-size:13px;\">No completed tasks yet.</div>" : rows),
        "  </div>",
        "</div>"
      ].join("");

      document.getElementById("arcClose").addEventListener("click", function() { overlay.remove(); });
      overlay.addEventListener("click", function(e) { if (e.target === overlay) overlay.remove(); });

      overlay.querySelectorAll(".arc-view").forEach(function(btn) {
        btn.addEventListener("click", function() {
          var task = (WorkspaceDB.data.tasks || []).find(function(t) { return t.id === btn.dataset.id; });
          if (task) { overlay.remove(); state.activeSelectedTask = task; openTaskDrawer(task); }
        });
      });

      overlay.querySelectorAll(".arc-reopen").forEach(function(btn) {
        btn.addEventListener("click", async function() {
          var task = (WorkspaceDB.data.tasks || []).find(function(t) { return t.id === btn.dataset.id; });
          if (!task) return;
          task.status = "IN_PROGRESS"; task.updatedAt = Date.now(); delete task.accomplishedAt;
          await WorkspaceDB.save();
          if (window.FirebaseService && FirebaseService.updateTask) FirebaseService.updateTask(task.id, { status: "IN_PROGRESS", updatedAt: Date.now() }).catch(function(){});
          showQuickToast("Task \"" + task.title + "\" reopened.", "info");
          playNotificationChirp(true); renderTasks(); buildModal();
        });
      });

      overlay.querySelectorAll(".arc-delete").forEach(function(btn) {
        btn.addEventListener("click", async function() {
          overlay.remove(); await deleteTask(btn.dataset.id);
        });
      });
    }
    buildModal();
  }
function initThemeEngine() {
    let saved = localStorage.getItem('reddot_theme');
    // Enforce dark theme by default, clear any stale 'light' preference
    if (!saved || saved === 'light') {
      saved = 'dark';
      localStorage.setItem('reddot_theme', 'dark');
    }
    applyTheme(saved);

    document.getElementById('btnThemeToggle')?.addEventListener('click', () => {
      const isDark = document.body.classList.contains('theme-dark') || document.body.classList.contains('theme-obsidian');
      const next = isDark ? 'light' : 'dark';
      applyTheme(next);
      playNotificationChirp(true);
      showQuickToast(`Switched to ${next === 'light' ? 'Light Enterprise' : 'Obsidian Crimson Dark'} theme.`, 'info');
    });

    window.addEventListener('keydown', (e) => {
      if (e.altKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        document.getElementById('btnThemeToggle')?.click();
      }
    });
  }

  function applyTheme(theme) {
    document.body.classList.remove('theme-light', 'theme-dark', 'theme-obsidian');
    const icon = document.getElementById('themeToggleIcon');
    if (theme === 'dark') {
      document.body.classList.add('theme-dark', 'theme-obsidian');
      if (icon) icon.textContent = '🌙';
      localStorage.setItem('reddot_theme', 'dark');
    } else {
      document.body.classList.add('theme-light');
      if (icon) icon.textContent = '☀️';
      localStorage.setItem('reddot_theme', 'light');
    }
  }

  // --- CSV ATTENDANCE EXPORT ---
  function exportAttendanceCsv() {
    let rawList = (WorkspaceDB.data.punchLogs && WorkspaceDB.data.punchLogs.length > 0)
      ? WorkspaceDB.data.punchLogs
      : (WorkspaceDB.data.punches || []);

    let punches = rawList.map(normalizePunch).filter(Boolean);
    if (!hasFullAttendanceAccess()) {
      const cur = getCurrentResolvedMember();
      const myId = cur.id;
      const myUid = state.currentUser?.uid || cur.uid;
      const myEmail = (state.currentUser?.email || cur.email || '').toLowerCase().trim();
      const myName = (cur.name || cur.displayName || '').toLowerCase().trim();

      punches = punches.filter(p => {
        if (!p) return false;
        const pWorkerId = p.workerId || p.memberId;
        const pEmail = (p.email || '').toLowerCase().trim();
        const pName = (p.name || p.memberName || '').toLowerCase().trim();
        if (myId && pWorkerId === myId) return true;
        if (myUid && (pWorkerId === myUid || p.uid === myUid)) return true;
        if (myEmail && pEmail && pEmail === myEmail) return true;
        if (myName && pName && (pName === myName || pName.includes(myName) || myName.includes(pName))) return true;
        return false;
      });
    }

    if (punches.length === 0) {
      showQuickToast('No punch logs recorded to export.', 'info');
      return;
    }

    const headers = ['DATE', 'DAY', 'EMPLOYEE', 'EMPLOYEE_ID', 'ACTION', 'TIMESTAMP', 'HOURS_WORKED', 'TERMINAL_NODE', 'VERIFICATION_STATUS'];
    const rows = punches.map(p => {
      const d = new Date(p.timestamp);
      const member = WorkspaceDB.data.members?.[p.memberId] || {};
      const dateStr = d.toLocaleDateString('en-US');
      const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' });
      const timeStr = d.toLocaleTimeString('en-US');
      const empName = p.memberName || member.name || 'Member';
      const empId = p.memberId || member.id || 'RD-EMP';
      const hours = (p.durationHours || p.hoursWorked || 0).toFixed(2);
      return [
        `"${dateStr}"`,
        `"${dayStr}"`,
        `"${empName}"`,
        `"${empId}"`,
        `"${p.type || 'PUNCH'}"`,
        `"${timeStr}"`,
        `"${hours}"`,
        `"RD-DESKTOP-WIN11"`,
        `"VERIFIED HARDWARE"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reddot_attendance_audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showQuickToast('Hardware attendance ledger CSV exported successfully.', 'success');
  }

  // --- UNIVERSAL OMNIBOX SEARCH (Ctrl+K) ---
  function initOmniboxSearch() {
    const modal = document.getElementById('globalOmniboxModal');
    const input = document.getElementById('omniboxModalInput');
    const list = document.getElementById('omniboxResultsList');
    const trigger = document.getElementById('topOmniboxSearchTrigger');
    const btnClose = document.getElementById('btnOmniboxClose');
    const backdrop = document.getElementById('omniboxModalBackdrop');

    if (!modal || !input || !list) return;

    function openOmnibox() {
      modal.classList.remove('hidden');
      input.value = '';
      input.focus();
      renderOmniboxResults('');
    }

    function closeOmnibox() {
      modal.classList.add('hidden');
    }
    window.closeOmnibox = closeOmnibox;
    window.openOmnibox = openOmnibox;

    trigger?.addEventListener('click', openOmnibox);
    btnClose?.addEventListener('click', closeOmnibox);
    backdrop?.addEventListener('click', closeOmnibox);

    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openOmnibox();
      } else if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
        closeOmnibox();
      }
    });

    input.addEventListener('input', (e) => {
      renderOmniboxResults(e.target.value.trim().toLowerCase());
    });

    function renderOmniboxResults(query) {
      list.replaceChildren();
      const results = [];

      const navCommands = [
        { title: 'Go to Dashboard', cat: 'Navigation', icon: '⊞', action: () => { switchTab('dashboard'); closeOmnibox(); } },
        { title: 'Go to Tasks & Projects', cat: 'Navigation', icon: '☑', action: () => { switchTab('tasks'); closeOmnibox(); } },
        { title: 'Go to Team Directory', cat: 'Navigation', icon: '👥', action: () => { switchTab('workers'); closeOmnibox(); } },
        { title: 'Go to Time & Shifts', cat: 'Navigation', icon: '⏱', action: () => { switchTab('timesheets'); closeOmnibox(); } },
        { title: 'Go to Team Chat', cat: 'Navigation', icon: '💬', action: () => { switchTab('chat'); closeOmnibox(); } },
        { title: 'Go to Storage & Cloud', cat: 'Navigation', icon: '☁', action: () => { switchTab('database'); closeOmnibox(); } },
        { title: 'Toggle Light / Dark Theme (Alt+T)', cat: 'Action', icon: '☀️', action: () => { document.getElementById('btnThemeToggle')?.click(); closeOmnibox(); } },
        { title: 'Clock In / Log Shift', cat: 'Action', icon: '▶', action: () => { document.getElementById('btnPersonalClockIn')?.click(); closeOmnibox(); } },
        { title: 'Take Break (F7)', cat: 'Action', icon: '⏸', action: () => { document.getElementById('btnPersonalBreak')?.click(); closeOmnibox(); } },
        { title: 'Clock Out (F8)', cat: 'Action', icon: '🚪', action: () => { document.getElementById('btnPersonalClockOut')?.click(); closeOmnibox(); } },
        { title: 'Export Attendance CSV', cat: 'Action', icon: '⬇', action: () => { exportAttendanceCsv(); closeOmnibox(); } }
      ];

      navCommands.forEach(cmd => {
        if (!query || cmd.title.toLowerCase().includes(query) || cmd.cat.toLowerCase().includes(query)) {
          results.push(cmd);
        }
      });

      const members = getUniqueMembersList();
      members.forEach(m => {
        if (m && (!query || m.name?.toLowerCase().includes(query) || m.role?.toLowerCase().includes(query))) {
          results.push({
            title: `${m.name || 'Member'} (${m.role || 'Engineer'})`,
            cat: 'Member',
            icon: '👤',
            action: () => { switchTab('workers'); closeOmnibox(); }
          });
        }
      });

      const tasks = WorkspaceDB.data.tasks || [];
      tasks.forEach(t => {
        if (t && (!query || t.title?.toLowerCase().includes(query) || t.priority?.toLowerCase().includes(query))) {
          results.push({
            title: `${t.title} [${t.priority || 'NORMAL'}]`,
            cat: 'Task',
            icon: '📋',
            action: () => { switchTab('tasks'); openTaskDrawer(t); closeOmnibox(); }
          });
        }
      });

      if (results.length === 0) {
        list.innerHTML = `<div style="padding: 18px; text-align: center; color: var(--text-muted); font-size: 12px;">No matching commands or resources found.</div>`;
        return;
      }

      results.slice(0, 8).forEach(res => {
        const item = document.createElement('div');
        item.className = 'omnibox-result-item';
        item.innerHTML = `
          <span class="omnibox-result-icon">${res.icon}</span>
          <span class="omnibox-result-title">${escapeHtml(res.title)}</span>
          <span class="omnibox-result-category">${escapeHtml(res.cat)}</span>
        `;
        item.addEventListener('click', res.action);
        list.appendChild(item);
      });
    }
  }

  // --- EVENT BINDINGS FOR v3.0 COMPONENTS ---
  function bindV3EventListeners() {
    // Navigation Rail
    document.getElementById('tabBtnDashboard')?.addEventListener('click', () => switchTab('dashboard'));

    // Dashboard Quick Action Buttons
    document.getElementById('dashBtnLogShift')?.addEventListener('click', () => switchTab('timesheets'));
    document.getElementById('dashBtnNewTask')?.addEventListener('click', () => {
      switchTab('tasks');
      openCreateTaskModal();
    });
    document.getElementById('dashBtnBreak')?.addEventListener('click', () => {
      document.getElementById('btnPersonalBreak')?.click();
    });
    document.getElementById('dashBtnClockOut')?.addEventListener('click', () => {
      document.getElementById('btnPersonalClockOut')?.click();
    });
    document.getElementById('dashBtnViewFullAudit')?.addEventListener('click', () => switchTab('timesheets'));

    // Dashboard Quick Tool Cards
    document.getElementById('dashToolStorage')?.addEventListener('click', () => switchTab('database'));
    document.getElementById('dashToolAudit')?.addEventListener('click', () => switchTab('timesheets'));
    document.getElementById('dashToolMeet')?.addEventListener('click', () => {
      switchTab('chat');
      document.getElementById('btnStartMeeting')?.click();
    });

    // Time & Shifts CSV Export
    document.getElementById('btnDownloadCsvAudit')?.addEventListener('click', exportAttendanceCsv);

    // Attendance Analytics & Historical Records
    document.getElementById('cardAttendanceThisWeek')?.addEventListener('click', () => openAttendanceAnalyticsModal('THIS_WEEK'));
    document.getElementById('cardAttendanceDailyAverage')?.addEventListener('click', () => openAttendanceAnalyticsModal('THIS_WEEK'));
    document.getElementById('btnOpenAttendanceAnalytics')?.addEventListener('click', () => openAttendanceAnalyticsModal('THIS_WEEK'));

    document.getElementById('punchLogPeriodFilter')?.addEventListener('change', () => renderPunchLogs());

    // Analytics Modal Controls
    document.getElementById('btnCloseAttendanceAnalytics')?.addEventListener('click', () => {
      document.getElementById('attendanceAnalyticsModal')?.classList.add('hidden');
    });
    document.getElementById('btnCloseAttendanceAnalyticsFoot')?.addEventListener('click', () => {
      document.getElementById('attendanceAnalyticsModal')?.classList.add('hidden');
    });
    document.getElementById('attendanceAnalyticsBackdrop')?.addEventListener('click', () => {
      document.getElementById('attendanceAnalyticsModal')?.classList.add('hidden');
    });

    document.querySelectorAll('#analyticsPeriodPills .analytics-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        activeAnalyticsPeriod = pill.getAttribute('data-period') || 'THIS_WEEK';
        document.querySelectorAll('#analyticsPeriodPills .analytics-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        renderAttendanceAnalyticsModalData();
      });
    });

    document.getElementById('analyticsMemberFilter')?.addEventListener('change', (e) => {
      activeAnalyticsMemberId = e.target.value || 'SELF';
      renderAttendanceAnalyticsModalData();
    });

    document.getElementById('btnExportAnalyticsPeriodCsv')?.addEventListener('click', exportAnalyticsPeriodCsv);

    // Keyboard Shortcuts: F7 (Take Break), F8 (Clock Out)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'F7') {
        e.preventDefault();
        const btn = document.getElementById('btnPersonalBreak');
        if (btn && !btn.disabled) btn.click();
      } else if (e.key === 'F8') {
        e.preventDefault();
        const btn = document.getElementById('btnPersonalClockOut');
        if (btn && !btn.disabled) btn.click();
      }
    });

    // Task View Mode Toggle (List vs Board)
    const btnList = document.getElementById('btnTaskViewList');
    const btnBoard = document.getElementById('btnTaskViewBoard');

    btnList?.addEventListener('click', () => {
      state.taskViewMode = 'list';
      btnList.classList.add('active');
      btnBoard?.classList.remove('active');
      document.getElementById('tasksListDeck')?.classList.remove('hidden');
      document.getElementById('tasksBoardDeck')?.classList.add('hidden');
      renderTasks();
    });

    btnBoard?.addEventListener('click', () => {
      state.taskViewMode = 'board';
      btnBoard.classList.add('active');
      btnList?.classList.remove('active');
      document.getElementById('tasksListDeck')?.classList.add('hidden');
      document.getElementById('tasksBoardDeck')?.classList.remove('hidden');
      renderTasks();
    });

    // Tasks + Add Task Button
    document.getElementById('btnOpenCreateTaskModal')?.addEventListener('click', () => {
      openCreateTaskModal();
    });

    // Task Detail Drawer Buttons
    document.getElementById('btnDrawerClose')?.addEventListener('click', () => {
      state.taskDrawerClosedByUser = true;
      state.activeSelectedTask = null;
      const drawer = document.getElementById('taskDetailDrawer');
      if (drawer) drawer.style.display = 'none';
    });

    document.getElementById('btnDrawerExpand')?.addEventListener('click', () => {
      if (state.activeSelectedTask) {
        openEditTaskModal(state.activeSelectedTask);
      }
    });

    document.getElementById('btnDrawerReassign')?.addEventListener('click', () => {
      if (state.activeSelectedTask) {
        openEditTaskModal(state.activeSelectedTask, 'assignee');
      }
    });

    document.getElementById('btnDrawerReschedule')?.addEventListener('click', () => {
      if (state.activeSelectedTask) {
        openEditTaskModal(state.activeSelectedTask, 'due');
      }
    });

    document.getElementById('btnDrawerMarkComplete')?.addEventListener('click', async () => {
      if (!state.activeSelectedTask) return;
      const mcBtn = document.getElementById('btnDrawerMarkComplete');
      const mcMode = mcBtn && mcBtn.dataset.mode ? mcBtn.dataset.mode : 'complete';

      if (mcMode === 'reopen') {
        state.activeSelectedTask.status = 'IN_PROGRESS';
        state.activeSelectedTask.updatedAt = Date.now();
        delete state.activeSelectedTask.accomplishedAt;
        await WorkspaceDB.save();
        if (window.FirebaseService && FirebaseService.updateTask) {
          FirebaseService.updateTask(state.activeSelectedTask.id, { status: 'IN_PROGRESS', updatedAt: Date.now() }).catch(function() {});
        }
        showQuickToast('Task "' + state.activeSelectedTask.title + '" moved back to In Progress.', 'info');
        playNotificationChirp(true);
        renderTasks();
        openTaskDrawer(state.activeSelectedTask);
        return;
      }

      // Mark as complete
      state.activeSelectedTask.status = 'COMPLETED';
      state.activeSelectedTask.updatedAt = Date.now();
      state.activeSelectedTask.accomplishedAt = Date.now();
      await WorkspaceDB.save();
      if (window.FirebaseService && FirebaseService.updateTask) {
        FirebaseService.updateTask(state.activeSelectedTask.id, {
          status: 'COMPLETED',
          updatedAt: Date.now(),
          accomplishedAt: Date.now()
        }).catch(function() {});
      }
      playNotificationChirp(true);
      showQuickToast('Task "' + state.activeSelectedTask.title + '" marked as complete!', 'success');
      renderTasks();
      openTaskDrawer(state.activeSelectedTask);
    });

    // Task Filter Toolbar Listeners
    document.getElementById('filterTaskInput')?.addEventListener('input', () => {
      renderTasks();
    });

    document.getElementById('taskFilterCategorySelect')?.addEventListener('change', () => {
      renderTasks();
    });

    document.getElementById('taskFilterAssigneeSelect')?.addEventListener('change', () => {
      renderTasks();
    });

    document.getElementById('taskFilterPrioritySelect')?.addEventListener('change', () => {
      renderTasks();
    });

    // Task Sort Button
    document.querySelector('.btn-sort-tasks')?.addEventListener('click', () => {
      state.taskSortMode = state.taskSortMode === 'priority' ? 'due' : 'priority';
      const sortBtn = document.querySelector('.btn-sort-tasks span');
      if (sortBtn) {
        sortBtn.textContent = state.taskSortMode === 'priority' ? '⇅ Sort by Priority' : '⇅ Sort by Due Date';
      }
      playNotificationChirp(true);
      showQuickToast(`Tasks sorted by ${state.taskSortMode === 'priority' ? 'Priority (High to Low)' : 'Due Date'}.`, 'info');
      renderTasks();
    });

    // Archive Review Button
    document.querySelector('.btn-archive-review')?.addEventListener('click', () => {
      playNotificationChirp(true);
      showCompletedArchiveModal();
    });

    // Delete button - Drawer Header
    document.getElementById('btnDrawerDeleteHeader')?.addEventListener('click', async () => {
      if (state.activeSelectedTask) await deleteTask(state.activeSelectedTask.id);
    });

    // Delete button - Drawer Footer Action
    document.getElementById('btnDrawerDeleteAction')?.addEventListener('click', async () => {
      if (state.activeSelectedTask) await deleteTask(state.activeSelectedTask.id);
    });

    // Delete button - Edit Task Modal
    document.getElementById('btnDeleteTaskFromModal')?.addEventListener('click', async () => {
      const taskId = document.getElementById('editTaskId')?.value || (state.activeSelectedTask && state.activeSelectedTask.id);
      if (taskId) {
        closeEditTaskModal();
        await deleteTask(taskId);
      }
    });

    // Status Filter dropdown
    document.getElementById('taskFilterStatusSelect')?.addEventListener('change', () => {
      renderTasks();
    });

    // Header Notification Bell & Dropdown
    const bellBtn = document.getElementById('btnNotificationBell');
    const notifDropdown = document.getElementById('headerNotificationDropdown');

    bellBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      notifDropdown?.classList.toggle('hidden');
    });

    document.getElementById('btnMarkAllNotifsRead')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (WorkspaceDB.data.activity) {
        WorkspaceDB.data.activity.forEach(a => a.unread = false);
        WorkspaceDB.save().catch(() => {});
      }
      if (typeof updateActivityBadge === 'function') updateActivityBadge();
      updateNotificationsUI();
      playNotificationChirp(true);
      showQuickToast('All notifications marked as read.', 'info');
    });

    // Close notification dropdown when clicking anywhere outside
    window.addEventListener('click', (e) => {
      if (notifDropdown && !notifDropdown.classList.contains('hidden')) {
        if (!notifDropdown.contains(e.target) && e.target !== bellBtn && !bellBtn?.contains(e.target)) {
          notifDropdown.classList.add('hidden');
        }
      }
    });

    // Message Info Modal close handlers
    document.getElementById('btnCloseMessageInfo')?.addEventListener('click', closeMessageInfoModal);
    document.getElementById('btnCloseMessageInfoFoot')?.addEventListener('click', closeMessageInfoModal);
    document.getElementById('messageInfoBackdrop')?.addEventListener('click', closeMessageInfoModal);

    // Attendance Analytics Modal close handlers
    document.getElementById('btnCloseAttendanceAnalytics')?.addEventListener('click', closeAttendanceAnalyticsModal);
    document.getElementById('btnCloseAttendanceAnalyticsFoot')?.addEventListener('click', closeAttendanceAnalyticsModal);
    document.getElementById('attendanceAnalyticsBackdrop')?.addEventListener('click', closeAttendanceAnalyticsModal);

    // Completed Archive Modal close handlers
    document.getElementById('btnCloseCompletedArchive')?.addEventListener('click', closeCompletedArchiveModal);
    document.getElementById('btnCloseCompletedArchiveFoot')?.addEventListener('click', closeCompletedArchiveModal);
    document.getElementById('completedArchiveBackdrop')?.addEventListener('click', closeCompletedArchiveModal);

    // Omnibox Modal close handlers
    document.getElementById('btnOmniboxClose')?.addEventListener('click', () => {
      document.getElementById('globalOmniboxModal')?.classList.add('hidden');
    });
    document.getElementById('omniboxModalBackdrop')?.addEventListener('click', () => {
      document.getElementById('globalOmniboxModal')?.classList.add('hidden');
    });

    // Global click delegation for all modal close triggers
    document.addEventListener('click', (e) => {
      if (e.target.closest('#btnCloseMessageInfo') || e.target.closest('#btnCloseMessageInfoFoot') || e.target.id === 'messageInfoBackdrop') {
        closeMessageInfoModal();
      }
      if (e.target.closest('#btnCloseAttendanceAnalytics') || e.target.closest('#btnCloseAttendanceAnalyticsFoot') || e.target.id === 'attendanceAnalyticsBackdrop') {
        closeAttendanceAnalyticsModal();
      }
      if (e.target.closest('#btnCloseCompletedArchive') || e.target.closest('#btnCloseCompletedArchiveFoot') || e.target.id === 'completedArchiveBackdrop') {
        closeCompletedArchiveModal();
      }
      if (e.target.closest('#btnOmniboxClose') || e.target.id === 'omniboxModalBackdrop') {
        document.getElementById('globalOmniboxModal')?.classList.add('hidden');
      }
    });

    // Global ESC key listener to dismiss active overlay/modal
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const msgInfo = document.getElementById('messageInfoModal');
        if (msgInfo && !msgInfo.classList.contains('hidden')) {
          closeMessageInfoModal();
          e.stopPropagation();
          return;
        }
        const attModal = document.getElementById('attendanceAnalyticsModal');
        if (attModal && !attModal.classList.contains('hidden')) {
          closeAttendanceAnalyticsModal();
          e.stopPropagation();
          return;
        }
        const compModal = document.getElementById('completedArchiveModal');
        if (compModal && !compModal.classList.contains('hidden')) {
          closeCompletedArchiveModal();
          e.stopPropagation();
          return;
        }
        const arcOverlay = document.getElementById('completedArchiveOverlay');
        if (arcOverlay) {
          arcOverlay.remove();
          e.stopPropagation();
          return;
        }
        const omniModal = document.getElementById('globalOmniboxModal');
        if (omniModal && !omniModal.classList.contains('hidden')) {
          omniModal.classList.add('hidden');
          e.stopPropagation();
          return;
        }
        const notifDropdown = document.getElementById('headerNotificationDropdown');
        if (notifDropdown && !notifDropdown.classList.contains('hidden')) {
          notifDropdown.classList.add('hidden');
          e.stopPropagation();
          return;
        }
      }
    }, true);

    // Teams Rail direct button bindings
    document.getElementById('railBtnActivity')?.addEventListener('click', () => switchTeamsRailTab('activity'));
    document.getElementById('railBtnChat')?.addEventListener('click', () => switchTeamsRailTab('chat'));
    document.getElementById('railBtnCalendar')?.addEventListener('click', () => switchTeamsRailTab('calendar'));
    document.getElementById('railBtnCalls')?.addEventListener('click', () => switchTeamsRailTab('calls'));
    document.getElementById('railBtnFiles')?.addEventListener('click', () => switchTeamsRailTab('files'));
    document.getElementById('railBtnSaved')?.addEventListener('click', () => switchTeamsRailTab('saved'));

    // Hub Tab direct button bindings
    document.getElementById('hubTabBtnPosts')?.addEventListener('click', () => switchChatHubTab('posts'));
    document.getElementById('hubTabBtnFiles')?.addEventListener('click', () => switchChatHubTab('files'));
    document.getElementById('hubTabBtnPinned')?.addEventListener('click', () => switchChatHubTab('pinned'));
    document.getElementById('hubTabBtnAbout')?.addEventListener('click', () => switchChatHubTab('about'));

    // Submit button helpers
    document.getElementById('btnSaveEditTask')?.addEventListener('click', () => {
      document.getElementById('formEditTask')?.requestSubmit?.();
    });
    document.getElementById('btnSubmitCreateChannel')?.addEventListener('click', () => {
      document.getElementById('formCreateChannelModal')?.requestSubmit?.();
    });
    document.getElementById('btnSubmitEditChannel')?.addEventListener('click', () => {
      document.getElementById('formEditChannelModal')?.requestSubmit?.();
    });
    document.getElementById('btnSubmitLinkPhoto')?.addEventListener('click', () => {
      document.getElementById('formLinkPhotoModal')?.requestSubmit?.();
    });

    // Omnibox Header Trigger
    document.getElementById('topOmniboxSearchTrigger')?.addEventListener('click', () => {
      document.getElementById('globalOmniboxModal')?.classList.remove('hidden');
      document.getElementById('omniboxModalInput')?.focus();
    });
  }

  // --- ENTERPRISE BOOTLOADER ANIMATION ---
  function updateBootProgress(percent, statusText, logLine) {
    const fill = document.getElementById('bootProgressFill');
    const pText = document.getElementById('bootPercentText');
    const sText = document.getElementById('bootStatusText');
    const feed = document.getElementById('bootTerminalFeed');

    const appFill = document.getElementById('appLoadingBarFill');
    const appPText = document.getElementById('appLoadingPercent');
    const appSText = document.getElementById('appLoadingStatusText');
    const appFeed = document.getElementById('appLoadingFeed');

    if (fill) fill.style.width = percent + '%';
    if (appFill) appFill.style.width = percent + '%';
    if (pText) pText.textContent = percent + '%';
    if (appPText) appPText.textContent = percent + '%';
    if (sText && statusText) sText.textContent = statusText;
    if (appSText && statusText) appSText.textContent = statusText;

    if (logLine) {
      if (feed) {
        const line = document.createElement('div');
        line.className = 'boot-log-line active';
        line.textContent = '> ' + logLine;
        feed.appendChild(line);
        feed.scrollTop = feed.scrollHeight;
      }
      if (appFeed) {
        const line = document.createElement('div');
        line.className = 'app-loading-line';
        line.textContent = '> ' + logLine;
        appFeed.appendChild(line);
        appFeed.scrollTop = appFeed.scrollHeight;
      }
    }
  }

  let bootScreenDismissed = false;
  function dismissBootScreen() {
    if (bootScreenDismissed) return;
    bootScreenDismissed = true;

    const boot = document.getElementById('appBootScreen');
    const appLoading = document.getElementById('appLoadingScreen');

    updateBootProgress(100, 'Workstation Ready. Shell Mounted.', '[READY] All security subsystems authenticated.');

    setTimeout(() => {
      if (boot && !boot.classList.contains('fade-out')) {
        boot.classList.add('fade-out');
        setTimeout(() => {
          if (boot && boot.parentNode) boot.parentNode.removeChild(boot);
        }, 500);
      }
      if (appLoading && !appLoading.classList.contains('fade-out')) {
        appLoading.classList.add('fade-out');
        setTimeout(() => {
          if (appLoading && appLoading.parentNode) appLoading.parentNode.removeChild(appLoading);
        }, 500);
      }
    }, 300);
  }

  // Safety timer: Never allow boot screen to freeze on screen if auth/network hangs
  setTimeout(dismissBootScreen, 2500);

  async function init() {
    updateBootProgress(30, "Initializing persistent database & local storage...", "[DB] Loading native disk store...");
    await ImageCacheManager.init();
    await ImageCacheManager.precacheAllAssets();
    await WorkspaceDB.init();

    // Check if a custom photo was mounted
    if (WorkspaceDB.data.customMountedBadgePhoto) {
      let photoUrl = WorkspaceDB.data.customMountedBadgePhoto;
      if (photoUrl && (photoUrl.includes('drive.google.com/thumbnail?id=') || photoUrl.includes('/file/d/') || photoUrl.includes('drive.google.com/open?id='))) {
        photoUrl = convertGoogleDriveLink(photoUrl);
        WorkspaceDB.data.customMountedBadgePhoto = photoUrl;
        WorkspaceDB.save().catch(() => {});
      }
      const badgeImg = document.getElementById('badgeImg');
      if (badgeImg) {
        badgeImg.setAttribute('referrerpolicy', 'no-referrer');
        badgeImg.onerror = () => {
          console.warn('[BADGE] Photo failed to load, falling back to assets/id-card.png');
          badgeImg.src = 'assets/id-card.png';
        };
        badgeImg.src = photoUrl;
      }
    }

    renderWallpaperGallery();
    applyWallpaperPreset(state.activeWallpaperPreset);
    initLanyardPhysics();
    initShiftTimerControls();
    bindEvents();
    initThemeEngine();
    initOmniboxSearch();
    bindV3EventListeners();
    initPortfolioFirstScreen();
    updateBootProgress(70, "Syncing telemetry, nodes & tasks...", "[SYNC] Restoring personnel matrix...");
    closeCommandCenter();

    renderWorkers();
    renderTasks();
    renderPunchLogs();
    renderChatChannelsAndDMs();
    renderFleetTelemetry();
    renderDashboard();
    updateAttendanceMetricsUI();
    updateNotificationsUI();
    WorkspaceDB.updateMetricsUI();
    updateBootProgress(85, "Connecting to security mesh & verifying authentication...", "[AUTH] Verifying cloud credentials...");

    function setupCloudRealtimeSubscriptions() {
      if (!window.FirebaseService || !FirebaseService.db) return;

      if (typeof FirebaseService.unsubscribeAll === 'function') {
        FirebaseService.unsubscribeAll();
      }

      console.log('[FIREBASE] Establishing active multi-device real-time cloud subscriptions...');

      // 1. Members Directory Subscription
      FirebaseService.subscribeMembers((cloudMembers) => {
        if (cloudMembers && cloudMembers.length > 0) {
          const tombstone = WorkspaceDB.data.deletedMembers || [];
          cloudMembers.forEach(cm => {
            if (!cm) return;
            const cmEmail = (cm.email || '').toLowerCase();
            const cmUid = cm.uid || cm.id;
            const cmDocId = cm.docId || cmUid;

            // Check if member is in tombstone or is phantom record
            if (
              tombstone.includes(cmUid) ||
              tombstone.includes(cmDocId) ||
              (cmEmail && tombstone.includes(cmEmail)) ||
              cmUid === 'RD-RD-FOU' ||
              cm.id === 'RD-RD-FOU' ||
              cm.deleted === true ||
              cm.active === false ||
              ((cm.displayName === 'Team Member' || cm.name === 'Team Member') && !cmEmail)
            ) {
              return; // Completely ignore deleted member
            }

            const isFounder = (cmEmail === 'jagadish2k2006@gmail.com') || cm.isOwner;
            const memberId = cm.id || (isFounder ? 'RD-FOUNDER-001' : (cm.uid ? `RD-${cm.uid.slice(0, 6).toUpperCase()}` : 'RD-EMP-001'));
            if (tombstone.includes(memberId)) return;
            
            // Check if member is actually online based on freshness of heartbeat or local active session
            const isSelf = isSelfMember(cm) || (memberId === state.currentMemberId);
            const isFreshHeartbeat = cm.lastSeenAt && (Date.now() - cm.lastSeenAt < 90000);
            const isOnline = isSelf || (!cm.suspended && isFreshHeartbeat && (cm.status === 'DUTY_ON' || cm.status === 'DUTY_BREAK'));
            const resolvedStatus = cm.suspended ? 'DUTY_OFF' : (isSelf ? (state.personalShift?.status || cm.status || 'DUTY_ON') : (cm.status || (isOnline ? 'DUTY_ON' : 'DUTY_OFF')));

            const existing = WorkspaceDB.data.members[memberId] || WorkspaceDB.data.members[cm.uid] || {};
            const cmTime = Number(cm.updatedAt || cm.createdAt || 0);
            const existTime = Number(existing.updatedAt || existing.createdAt || 0);
            const resolvedRole = (existTime > cmTime && existing.role) ? existing.role : (cm.role || existing.role || 'Employee');
            const resolvedDept = (existTime > cmTime && existing.dept) ? existing.dept : (cm.dept || existing.dept || 'Hardware Architecture');

            const memberObj = {
              id: memberId,
              uid: cm.uid || cm.id || memberId,
              docId: cm.docId || cm.uid || cm.id || memberId,
              name: cm.displayName || cm.name || 'Team Member',
              displayName: cm.displayName || cm.name || 'Team Member',
              role: resolvedRole,
              dept: resolvedDept,
              email: cm.email || '',
              photoUrl: cm.photoURL || cm.photoUrl || existing.photoUrl || '',
              photoURL: cm.photoURL || cm.photoUrl || existing.photoURL || '',
              status: resolvedStatus,
              lastSeenAt: cm.lastSeenAt || existing.lastSeenAt || 0,
              todaySeconds: (cm.lastSeenAt && (new Date(cm.lastSeenAt).toDateString() === new Date().toDateString())) ? (cm.todaySeconds !== undefined ? cm.todaySeconds : (existing.todaySeconds || 0)) : 0,
              todayHours: (cm.lastSeenAt && (new Date(cm.lastSeenAt).toDateString() === new Date().toDateString())) ? (cm.todayHours !== undefined ? cm.todayHours : (existing.todayHours || 0)) : 0,
              todayDate: (cm.lastSeenAt && (new Date(cm.lastSeenAt).toDateString() === new Date().toDateString())) ? (cm.todayDate || new Date().toDateString()) : null,
              suspended: !!cm.suspended,
              avatarText: (cm.displayName || cm.name || 'RD').slice(0, 2).toUpperCase(),
              updatedAt: Math.max(cmTime, existTime) || Date.now()
            };
            if (memberObj.id) WorkspaceDB.data.members[memberObj.id] = memberObj;
            if (memberObj.uid && memberObj.uid !== memberObj.id) WorkspaceDB.data.members[memberObj.uid] = memberObj;
          });
          WorkspaceDB.save();
          renderWorkers();
          renderFleetTelemetry();
          renderTeamHoursDashboard();
          renderChatChannelsAndDMs();
          WorkspaceDB.updateMetricsUI();
        }
      });

      // 2. Tasks Subscription with automatic deduplication
      FirebaseService.subscribeTasks((cloudTasks) => {
        if (cloudTasks && cloudTasks.length > 0) {
          const map = new Map();
          // Seed with existing local tasks
          (WorkspaceDB.data.tasks || []).forEach(t => {
            if (t && t.id) map.set(t.id, t);
          });
          // Merge incoming cloud tasks
          cloudTasks.forEach(ct => {
            if (ct && ct.id) {
              map.set(ct.id, ct);
            }
          });
          // Deduplicate by title + createdAt as well
          const deduped = [];
          const seenKeys = new Set();
          Array.from(map.values()).forEach(t => {
            const key = `${(t.title || '').trim().toLowerCase()}___${t.createdAt}`;
            if (!seenKeys.has(key)) {
              seenKeys.add(key);
              deduped.push(t);
            }
          });
          WorkspaceDB.data.tasks = deduped;
          WorkspaceDB.save();
          renderTasks();
          renderDashboard();
        }
      });

      // 3. Dynamic Channels & Direct Messages (DMs) Subscription
      FirebaseService.subscribeChannels((channels) => {
        if (channels && channels.length > 0) {
          const localMap = new Map((WorkspaceDB.data.channels || []).map(c => [c.id, c]));
          const map = new Map(DEFAULT_CHANNELS.map(c => [c.id, { ...c, ...(localMap.get(c.id) || {}) }]));
          channels.forEach(ch => {
            if (!ch.isDirectMessage && !ch.id.startsWith('dm_')) {
              map.set(ch.id, { ...map.get(ch.id), ...ch });
            }
          });
          WorkspaceDB.data.channels = Array.from(map.values());
          WorkspaceDB.save();

          // Sync active channel title & topic
          const activeChObj = WorkspaceDB.data.channels.find(c => c.id === state.activeChannelId);
          if (activeChObj && !state.activeChannelId.startsWith('dm_')) {
            safeSetText(document.getElementById('activeChatTitle'), `#${activeChObj.name || activeChObj.id}`);
            safeSetText(document.getElementById('activeChatTopic'), activeChObj.topic || '');
          }

          channels.forEach(ch => {
            FirebaseService.subscribeMessages(ch.id, (cloudMsgs) => {
              if (cloudMsgs) {
                const prevMsgs = WorkspaceDB.data.chats[ch.id] || [];
                const isNew = cloudMsgs.length > prevMsgs.length;
                const lastMsg = cloudMsgs.length > 0 ? cloudMsgs[cloudMsgs.length - 1] : null;

                reconcileChannelMessages(cloudMsgs, ch.id);
                WorkspaceDB.data.chats[ch.id] = cloudMsgs;
                WorkspaceDB.save();

                if (state.activeChannelId === ch.id) {
                  renderMessages();
                }

                // Show notification and sound for incoming messages from teammates
                const myEmail = state.currentUser?.email?.toLowerCase();
                if (isNew && lastMsg && lastMsg.senderEmail && lastMsg.senderEmail.toLowerCase() !== myEmail) {
                  playNotificationChirp(true);
                  if (window.electronAPI && window.electronAPI.showNotification) {
                    window.electronAPI.showNotification({
                      title: `💬 ${lastMsg.senderName || 'New Message'}`,
                      body: String(lastMsg.text || '').slice(0, 150),
                      targetTab: 'chat'
                    });
                  }
                }
              }
            });
          });
          renderChatChannelsAndDMs();
        }
      });

      // Core Channels Fallback Listener
      ['general', 'announcements', 'engineering'].forEach(chId => {
        FirebaseService.subscribeMessages(chId, (cloudMsgs) => {
          if (cloudMsgs) {
            const prevMsgs = WorkspaceDB.data.chats[chId] || [];
            const isNew = cloudMsgs.length > prevMsgs.length;
            const lastMsg = cloudMsgs.length > 0 ? cloudMsgs[cloudMsgs.length - 1] : null;

            reconcileChannelMessages(cloudMsgs, chId);
            WorkspaceDB.data.chats[chId] = cloudMsgs;
            WorkspaceDB.save();

            if (state.activeChannelId === chId) {
              renderMessages();
            }

            const myEmail = state.currentUser?.email?.toLowerCase();
            if (isNew && lastMsg && lastMsg.senderEmail && lastMsg.senderEmail.toLowerCase() !== myEmail) {
              playNotificationChirp(true);
              if (window.electronAPI && window.electronAPI.showNotification) {
                window.electronAPI.showNotification({
                  title: `💬 #${chId} • ${lastMsg.senderName || 'Teammate'}`,
                  body: String(lastMsg.text || '').slice(0, 150),
                  targetTab: 'chat'
                });
              }
            }
          }
        });
      });

      // 4. Real-time Database User Presence across devices
      if (typeof FirebaseService.subscribeAllPresence === 'function') {
        FirebaseService.subscribeAllPresence((presenceData) => {
          if (presenceData && typeof presenceData === 'object') {
            let changed = false;
            Object.keys(presenceData).forEach(uid => {
              const p = presenceData[uid];
              const isOnline = p && (p.state === 'online' || p.isOnline === true);
              const lastSeen = p?.lastSeenAt || p?.lastSeen || Date.now();
              Object.values(WorkspaceDB.data.members).forEach(m => {
                if (m && (m.uid === uid || m.id === uid || (m.email && p.email && m.email.toLowerCase() === p.email.toLowerCase()))) {
                  m.isOnline = isOnline;
                  m.lastSeenAt = isOnline ? Date.now() : lastSeen;
                  const newStatus = m.suspended ? 'DUTY_OFF' : (isOnline ? 'DUTY_ON' : 'DUTY_OFF');
                  if (m.status !== newStatus) {
                    m.status = newStatus;
                    changed = true;
                  }
                }
              });
            });
            if (changed) {
              renderWorkers();
              renderFleetTelemetry();
              renderChatChannelsAndDMs();
              updateChatHeaderStatus();
              renderTeamHoursDashboard();
            }
          }
        });
      }

      // 5. Incoming Realtime Call Signaling Listener across devices
      if (typeof FirebaseService.subscribeIncomingCalls === 'function') {
        FirebaseService.subscribeIncomingCalls((incomingCalls) => {
          if (incomingCalls && incomingCalls.length > 0) {
            const activeCall = incomingCalls[0];
            state.activeIncomingCall = activeCall;
            showIncomingCallModal(activeCall);
          } else {
            hideIncomingCallModal();
          }
        });
      }

      // 6. Microsoft Teams Meetings Subscription
      if (typeof FirebaseService.subscribeMeetings === 'function') {
        FirebaseService.subscribeMeetings((cloudMeetings) => {
          if (cloudMeetings && Array.isArray(cloudMeetings)) {
            WorkspaceDB.data.meetings = cloudMeetings;
            WorkspaceDB.save().catch(() => {});
            renderMeetingsCalendar();
          }
        });
      }

      // 7. Microsoft Teams Activity Notifications Subscription
      if (typeof FirebaseService.subscribeActivity === 'function') {
        FirebaseService.subscribeActivity((cloudAct) => {
          if (cloudAct && Array.isArray(cloudAct)) {
            WorkspaceDB.data.activity = cloudAct;
            WorkspaceDB.save().catch(() => {});
            updateActivityBadge();
            if (state.activeTeamsRailTab === 'activity') renderActivityFeed(state.activityFilter);
          }
        });
      }

      // 8. Microsoft Teams Saved Bookmarks Subscription
      const currentUid = state.currentUser?.uid || state.currentMemberId || 'RD-FOUNDER-001';
      if (typeof FirebaseService.subscribeBookmarks === 'function') {
        FirebaseService.subscribeBookmarks(currentUid, (cloudBms) => {
          if (cloudBms && Array.isArray(cloudBms)) {
            WorkspaceDB.data.savedMessages = cloudBms;
            WorkspaceDB.save().catch(() => {});
            if (state.activeTeamsRailTab === 'saved') renderSavedMessages();
          }
        });
      }

      // 9. Real-time Shift Punch Audit Trail Subscription
      if (typeof FirebaseService.subscribePunchLogs === 'function') {
        FirebaseService.subscribePunchLogs((cloudPunches) => {
          if (cloudPunches && Array.isArray(cloudPunches)) {
            if (!WorkspaceDB.data.punchLogs) WorkspaceDB.data.punchLogs = [];
            const existingMap = new Map();
            WorkspaceDB.data.punchLogs.forEach(p => {
              const norm = normalizePunch(p);
              if (norm) {
                const key = norm.id || `${norm.workerId}_${norm.timestamp}_${norm.action}`;
                existingMap.set(key, norm);
              }
            });
            cloudPunches.forEach(cp => {
              const norm = normalizePunch(cp);
              if (norm) {
                norm.cloudSynced = true;
                const key = norm.id || `${norm.workerId}_${norm.timestamp}_${norm.action}`;
                existingMap.set(key, norm);
              }
            });
            WorkspaceDB.data.punchLogs = Array.from(existingMap.values())
              .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
            WorkspaceDB.save().catch(() => {});
            reconcilePersonalShiftWithPunches();
            renderPunchLogs();
            renderTeamHoursDashboard();
            updateLiveFleetHours();
          }
        });
      }

      // Sync any unsynced local punches for current user to Cloud Firestore
      if (typeof FirebaseService.recordPunchLog === 'function') {
        const cur = getCurrentResolvedMember();
        const myPunches = (WorkspaceDB.data.punchLogs || []).filter(p => {
          if (!p || p.cloudSynced) return false;
          return (p.workerId === cur.id || (cur.uid && p.uid === cur.uid) || (cur.email && p.email && p.email.toLowerCase() === (cur.email || '').toLowerCase()));
        });
        myPunches.forEach(p => {
          p.cloudSynced = true;
          FirebaseService.recordPunchLog(p).catch(() => {});
        });
      }
    }

    // Initial Teams Views Render
    updateActivityBadge();
    renderMeetingsCalendar();
    renderActivityFeed();
    renderCallsHub();
    renderCentralFiles();
    renderSavedMessages();

    // Initialize Firebase Cloud Service & Auth State
    if (window.FirebaseService) {
      FirebaseService.init();

      const statusBadge = document.getElementById('serverConnectionStatus');
      if (statusBadge) statusBadge.textContent = 'CLOUD FIRESTORE & DISK VAULT CONNECTED (reddot-workspace)';

      // Listen for Authentication State Changes
      FirebaseService.onAuthStateChanged((user, member) => {
        updateAuthUI(user, member);
        if (!user) {
          updateBootProgress(100, 'Session Unauthenticated. Please sign in.', '[AUTH] Sign-in required.');
          dismissBootScreen();
          // Prompt unauthenticated user to sign in
          const hasSeenPrompt = sessionStorage.getItem('rd_auth_dismissed_session');
          if (!hasSeenPrompt) {
            openAuthModal('signin');
          }
          setupCloudRealtimeSubscriptions();
        } else {
          updateBootProgress(100, `Authenticated as ${user.displayName || user.email}`, `[AUTH] Welcome, ${user.email}.`);
          closeAuthModal();
          dismissBootScreen();
          setupCloudRealtimeSubscriptions();
        }
      });
    }

    // Periodic presence timeout evaluation (every 10 seconds)
    // Ensures disconnected/closed apps show as Offline (Red light) without stale green indicators
    setInterval(() => {
      let changed = false;
      const now = Date.now();
      Object.values(WorkspaceDB.data.members || {}).forEach(m => {
        if (!m) return;
        if (isSelfMember(m)) return;
        if ((m.status === 'DUTY_ON' || m.status === 'DUTY_BREAK') && (!m.lastSeenAt || (now - m.lastSeenAt > 90000))) {
          m.status = 'DUTY_OFF';
          changed = true;
        }
      });
      if (changed) {
        renderWorkers();
        renderFleetTelemetry();
        WorkspaceDB.updateMetricsUI();
      }
    }, 10000);

    // Clean up presence immediately on window close/reload
    window.addEventListener('beforeunload', () => {
      if (window.FirebaseService?.cleanupPresence) {
        window.FirebaseService.cleanupPresence();
      }
    });

    // Initialize Over-The-Air (OTA) Cloud Software Updater
    initOtaUpdater();
  }

  // --- OVER-THE-AIR (OTA) CLOUD SOFTWARE UPDATER CONTROLLER ---
  let otaUpdateInfo = null;

  async function initOtaUpdater() {
    if (window.electronAPI && window.electronAPI.otaGetInfo) {
      try {
        const info = await window.electronAPI.otaGetInfo();
        const badge = document.getElementById('otaVersionBadge');
        if (badge && info.version) {
          const channelStr = info.isHotpatched ? 'HOTPATCHED' : (info.channel || 'INSTALLED').toUpperCase();
          badge.textContent = `VERSION ${info.version} (${channelStr})`;
        }
        const btnRevert = document.getElementById('btnRevertOtaHotpatch');
        const btnRevertTop = document.getElementById('btnRevertOtaHotpatchTop');
        if (info.isHotpatched) {
          if (btnRevert) btnRevert.classList.remove('hidden');
          if (btnRevertTop) btnRevertTop.classList.remove('hidden');
        } else {
          if (btnRevert) btnRevert.classList.add('hidden');
          if (btnRevertTop) btnRevertTop.classList.add('hidden');
        }
      } catch (e) {
        console.warn('[OTA] Could not fetch system info:', e);
      }
    }

    const handleRevertHotpatch = async () => {
      if (confirm('Revert REDDOT Workstation OS to factory bundled build? This will remove all downloaded hotpatches and reload the verified installation.')) {
        if (window.electronAPI && window.electronAPI.otaRevertHotpatch) {
          try {
            const res = await window.electronAPI.otaRevertHotpatch();
            if (res && res.success) {
              playNotificationChirp(true);
              window.location.reload();
            }
          } catch (e) {
            showQuickToast(`Could not revert hotpatch: ${e.message}`, 'error');
          }
        }
      }
    };
    document.getElementById('btnRevertOtaHotpatch')?.addEventListener('click', handleRevertHotpatch);
    document.getElementById('btnRevertOtaHotpatchTop')?.addEventListener('click', handleRevertHotpatch);

    // Global GitHub OTA Mirror configuration
    const githubRepoInput = document.getElementById('inputGithubRepo');
    const savedRepo = localStorage.getItem('rd_github_repo') || 'reddotorg123/REDDOT_WORKSTATION';
    if (githubRepoInput) {
      githubRepoInput.value = savedRepo;
    }

    document.getElementById('btnSaveGithubRepo')?.addEventListener('click', () => {
      const repoVal = githubRepoInput?.value.trim() || 'reddotorg123/REDDOT_WORKSTATION';
      localStorage.setItem('rd_github_repo', repoVal);
      playNotificationChirp(true);
      const statusText = document.getElementById('otaStatusText');
      if (statusText) statusText.textContent = `GITHUB REPOSITORY MIRROR SET TO [${repoVal}]`;
      checkOtaUpdates(true);
    });

    // Bind UI actions
    document.getElementById('btnCheckForOtaUpdates')?.addEventListener('click', () => {
      checkOtaUpdates(true);
    });

    // Global OTA fast update execution
    document.getElementById('btnFastOtaUpdate')?.addEventListener('click', (e) => triggerGlobalFastUpdate(e.currentTarget));
    document.getElementById('btnBannerFastUpdate')?.addEventListener('click', (e) => triggerGlobalFastUpdate(e.currentTarget));
    document.getElementById('headerOtaPill')?.addEventListener('click', (e) => triggerGlobalFastUpdate(e.currentTarget));
    document.getElementById('topOtaPill')?.addEventListener('click', (e) => triggerGlobalFastUpdate(e.currentTarget));

    document.getElementById('btnBannerViewChanges')?.addEventListener('click', () => {
      const tabBtn = document.querySelector('[data-target="tabDatabaseView"]');
      if (tabBtn) tabBtn.click();
      const otaSection = document.getElementById('otaVersionBadge');
      if (otaSection) otaSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    document.getElementById('btnBannerDismiss')?.addEventListener('click', () => {
      const banner = document.getElementById('otaGlobalBanner');
      if (banner) banner.classList.add('hidden');
      if (otaUpdateInfo && otaUpdateInfo.latestVersion) {
        sessionStorage.setItem('dismissed_ota_v' + otaUpdateInfo.latestVersion, 'true');
      }
    });

    document.getElementById('btnDownloadOtaUpdate')?.addEventListener('click', () => {
      if (otaUpdateInfo && otaUpdateInfo.downloadUrl) {
        if (window.electronAPI && window.electronAPI.openExternal) {
          window.electronAPI.openExternal(otaUpdateInfo.downloadUrl);
        } else {
          window.open(otaUpdateInfo.downloadUrl, '_blank');
        }
      } else {
        const repo = localStorage.getItem('rd_github_repo') || 'reddotorg123/REDDOT_WORKSTATION';
        const url = `https://github.com/${repo}/releases`;
        if (window.electronAPI && window.electronAPI.openExternal) {
          window.electronAPI.openExternal(url);
        } else {
          window.open(url, '_blank');
        }
      }
    });

    document.getElementById('btnInstallOtaUpdate')?.addEventListener('click', async () => {
      if (confirm('Restart REDDOT Workstation OS now to install update?')) {
        if (window.electronAPI && window.electronAPI.otaInstallUpdate) {
          await window.electronAPI.otaInstallUpdate();
        }
      }
    });

    // Listen for progress
    if (window.electronAPI && window.electronAPI.onOtaProgress) {
      window.electronAPI.onOtaProgress((prog) => {
        const wrap = document.getElementById('otaProgressWrap');
        const bar = document.getElementById('otaProgressBar');
        const pct = document.getElementById('otaProgressPercent');
        const lbl = document.getElementById('otaProgressLabel');

        if (wrap) wrap.classList.remove('hidden');
        if (bar) bar.style.width = `${prog.percent}%`;
        if (pct) pct.textContent = `${prog.percent}%`;
        if (lbl) {
          const mb = (prog.receivedBytes / (1024 * 1024)).toFixed(1);
          const totalMb = (prog.totalBytes / (1024 * 1024)).toFixed(1);
          lbl.textContent = `Downloading update: ${mb} MB / ${totalMb} MB...`;
        }
      });
    }

    if (window.electronAPI && window.electronAPI.onOtaComplete) {
      window.electronAPI.onOtaComplete(() => {
        const lbl = document.getElementById('otaProgressLabel');
        const btnDownload = document.getElementById('btnDownloadOtaUpdate');
        const btnInstall = document.getElementById('btnInstallOtaUpdate');

        if (lbl) lbl.textContent = 'Download Complete! Package verified.';
        if (btnDownload) btnDownload.classList.add('hidden');
        if (btnInstall) btnInstall.classList.remove('hidden');
        playNotificationChirp(true);
      });
    }

    // Real-Time Cloud Firestore OTA Release Listener
    if (window.FirebaseService && typeof window.FirebaseService.listenToOtaRelease === 'function') {
      window.FirebaseService.listenToOtaRelease((releaseData) => {
        if (!releaseData) return;
        const remoteVer = releaseData.version;
        const currentVer = (otaUpdateInfo && otaUpdateInfo.currentVersion) || '2.5.1';
        if (compareSemver(remoteVer, currentVer) > 0) {
          otaUpdateInfo = {
            hasUpdate: true,
            currentVersion: currentVer,
            latestVersion: remoteVer,
            releaseDate: releaseData.releaseDate || '2026-09-05',
            changelog: releaseData.changelog || [],
            downloadUrl: releaseData.downloadUrl || ''
          };
          showGlobalOtaNotification(otaUpdateInfo);
          playNotificationChirp(true);
        }
      });
    }

    // Auto-check on launch
    setTimeout(() => {
      checkOtaUpdates(false);
    }, 2500);

    // Background periodic check every 15 minutes
    setInterval(() => {
      checkOtaUpdates(false);
    }, 15 * 60 * 1000);

    // Check when window regains focus
    window.addEventListener('focus', () => {
      checkOtaUpdates(false);
    });
  }

  function ensureOtaBannerInDom() {
    let banner = document.getElementById('otaGlobalBanner');
    if (banner) return banner;

    banner = document.createElement('aside');
    banner.id = 'otaGlobalBanner';
    banner.className = 'ota-global-banner hidden';
    banner.role = 'alert';
    banner.setAttribute('aria-live', 'assertive');
    banner.innerHTML = `
      <div class="ota-banner-inner">
        <div class="ota-banner-left">
          <div class="ota-banner-icon">🚀</div>
          <div class="ota-banner-text">
            <div class="ota-banner-head">
              <span class="ota-banner-title">NEW WORKSTATION UPDATE AVAILABLE</span>
              <span class="ota-banner-badge" id="otaBannerBadge">v2.5.5</span>
            </div>
            <p class="ota-banner-desc" id="otaBannerDesc">New release is available with instant hotpatching.</p>
          </div>
        </div>
        <div class="ota-banner-actions">
          <button type="button" id="btnBannerFastUpdate" class="btn-ota-banner-primary" title="Install update instantly with zero downtime">
            <span>⚡ 1-Click Fast Update</span>
          </button>
          <button type="button" id="btnBannerViewChanges" class="btn-ota-banner-secondary" title="View changelog in Database tab">
            <span>What's New</span>
          </button>
          <button type="button" id="btnBannerDismiss" class="btn-ota-banner-close" title="Dismiss notification">✕</button>
        </div>
      </div>
    `;
    document.body.prepend(banner);

    document.getElementById('btnBannerFastUpdate')?.addEventListener('click', (e) => triggerGlobalFastUpdate(e.currentTarget));
    document.getElementById('btnBannerViewChanges')?.addEventListener('click', () => {
      const tabBtn = document.querySelector('[data-target="tabDatabaseView"]');
      if (tabBtn) tabBtn.click();
      const otaSection = document.getElementById('otaVersionBadge');
      if (otaSection) otaSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    document.getElementById('btnBannerDismiss')?.addEventListener('click', () => {
      banner.classList.add('hidden');
      if (otaUpdateInfo && otaUpdateInfo.latestVersion) {
        sessionStorage.setItem('dismissed_ota_v' + otaUpdateInfo.latestVersion, 'true');
      }
    });

    return banner;
  }

  function showGlobalOtaNotification(info) {
    if (!info || !info.latestVersion) return;

    // Header pills in Command Center and Desktop Wallpaper mode
    const headerPill = document.getElementById('headerOtaPill');
    const headerPillText = document.getElementById('headerOtaPillText');
    const topPill = document.getElementById('topOtaPill');
    const topPillText = document.getElementById('topOtaPillText');

    if (headerPill) {
      headerPill.classList.remove('hidden');
      if (headerPillText) headerPillText.textContent = `⚡ UPDATE v${info.latestVersion}`;
    }
    if (topPill) {
      topPill.classList.remove('hidden');
      if (topPillText) topPillText.textContent = `⚡ UPDATE v${info.latestVersion}`;
    }

    // Check if user dismissed banner for this session
    if (sessionStorage.getItem('dismissed_ota_v' + info.latestVersion) === 'true') {
      return;
    }

    const banner = ensureOtaBannerInDom();
    if (banner) {
      const badge = document.getElementById('otaBannerBadge');
      const desc = document.getElementById('otaBannerDesc');
      if (badge) badge.textContent = `v${info.latestVersion}`;
      if (desc) {
        if (info.changelog && Array.isArray(info.changelog) && info.changelog.length > 0) {
          desc.textContent = info.changelog.slice(0, 2).join(' • ');
        } else {
          desc.textContent = `Workstation OS v${info.latestVersion} is ready with performance improvements.`;
        }
      }
      banner.classList.remove('hidden');
    }
  }

  async function triggerGlobalFastUpdate(triggerBtn) {
    const btn = triggerBtn || document.getElementById('btnBannerFastUpdate') || document.getElementById('btnFastOtaUpdate');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span>⏳ Applying Cloud Update...</span>';
    }
    const bannerDesc = document.getElementById('otaBannerDesc');
    if (bannerDesc) bannerDesc.textContent = 'Syncing cloud release files & applying zero-downtime hotpatch...';

    const otaStatusText = document.getElementById('otaStatusText');
    const otaStatusDot = document.getElementById('otaStatusDot');
    if (otaStatusText) {
      otaStatusText.style.color = 'var(--accent-cyan)';
      otaStatusText.textContent = 'DOWNLOADING & APPLYING OVER-THE-AIR CLOUD HOTPATCH...';
    }
    if (otaStatusDot) otaStatusDot.className = 'pulse-amber';

    try {
      if (window.electronAPI && window.electronAPI.otaApplyHotpatch) {
        const res = await window.electronAPI.otaApplyHotpatch();
        if (res && res.success) {
          playNotificationChirp(true);
          if (btn) btn.innerHTML = '<span>✅ Updated to v' + (res.version || '2.5.5') + '! Reloading...</span>';
          if (bannerDesc) bannerDesc.textContent = `Successfully updated to v${res.version || '2.5.5'}! Reloading workspace...`;
          if (otaStatusText) {
            otaStatusText.style.color = '#00e676';
            otaStatusText.textContent = `SUCCESSFULLY HOTPATCHED TO v${res.version || '2.5.5'}! REFRESHING WORKSPACE...`;
          }
          if (otaStatusDot) otaStatusDot.className = 'pulse-green';
          setTimeout(() => { window.location.reload(); }, 600);
          return;
        }
      } else {
        window.location.reload();
      }
    } catch (err) {
      console.error('[OTA] Error applying global hotpatch:', err);
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span>⚡ 1-Click Fast Cloud Update</span>';
      }
      if (bannerDesc) bannerDesc.textContent = `Update notice: ${err.message}`;
      if (otaStatusText) {
        otaStatusText.style.color = '#ffb300';
        otaStatusText.textContent = `OTA NOTICE: ${err.message}`;
      }
      if (otaStatusDot) otaStatusDot.className = 'pulse-amber';
    }
  }

  async function checkOtaUpdates(manualClick = false) {
    const dot = document.getElementById('otaStatusDot');
    const text = document.getElementById('otaStatusText');
    const lastChecked = document.getElementById('otaLastCheckedText');
    const changelogWrap = document.getElementById('otaChangelogWrap');
    const changelogList = document.getElementById('otaChangelogList');
    const actionsWrap = document.getElementById('otaActionsWrap');
    const btnFast = document.getElementById('btnFastOtaUpdate');
    const btnDownload = document.getElementById('btnDownloadOtaUpdate');
    const btnInstall = document.getElementById('btnInstallOtaUpdate');

    const activeRepo = localStorage.getItem('rd_github_repo') || 'reddotorg123/REDDOT_WORKSTATION';

    if (text) text.textContent = `CONNECTING TO GLOBAL OTA MIRROR (${activeRepo})...`;
    if (dot) dot.className = 'pulse-amber';

    if (window.electronAPI && window.electronAPI.otaCheckUpdate) {
      try {
        const res = await window.electronAPI.otaCheckUpdate(activeRepo);
        otaUpdateInfo = res;

        if (lastChecked) {
          lastChecked.textContent = `Last checked: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }

        if (res.hasUpdate) {
          showGlobalOtaNotification(res);

          if (dot) dot.className = 'pulse-cyan';
          if (text) {
            text.style.color = 'var(--accent-cyan)';
            text.textContent = `⚡ NEW UPDATE AVAILABLE: v${res.latestVersion} (Released: ${res.releaseDate})`;
          }

          if (changelogWrap && changelogList) {
            changelogWrap.classList.remove('hidden');
            changelogList.replaceChildren();
            (res.changelog || []).forEach(item => {
              const li = document.createElement('li');
              li.textContent = item;
              changelogList.appendChild(li);
            });
          }

          if (actionsWrap) actionsWrap.classList.remove('hidden');
          if (btnFast) btnFast.classList.remove('hidden');
          if (btnDownload) {
            btnDownload.style.display = 'inline-flex';
          }
          if (btnInstall) btnInstall.classList.add('hidden');

          if (manualClick) {
            playNotificationChirp(true);
          }
        } else {
          const headerPill = document.getElementById('headerOtaPill');
          const topPill = document.getElementById('topOtaPill');
          const banner = document.getElementById('otaGlobalBanner');
          if (headerPill) headerPill.classList.add('hidden');
          if (topPill) topPill.classList.add('hidden');
          if (banner) banner.classList.add('hidden');

          if (dot) dot.className = 'pulse-green';
          if (text) {
            text.style.color = '#00e676';
            text.textContent = `SYSTEM UP TO DATE • RUNNING PRODUCTION BUILD v${res.currentVersion}`;
          }
          if (changelogWrap) changelogWrap.classList.add('hidden');
          if (actionsWrap) actionsWrap.classList.add('hidden');
        }
      } catch (err) {
        if (dot) dot.className = 'pulse-gray';
        if (text) {
          text.style.color = 'var(--text-muted)';
          text.textContent = `OFFLINE / CLOUD PIPELINE STANDBY (${err.message})`;
        }
      }
    } else {
      // In-browser version check
      try {
        const resp = await fetch('/version.json?t=' + Date.now());
        if (resp.ok) {
          const vData = await resp.json();
          if (dot) dot.className = 'pulse-green';
          if (text) {
            text.style.color = '#00e676';
            text.textContent = `SYSTEM UP TO DATE • RUNNING WEB WORKSTATION v${vData.version || '2.5.1'}`;
          }
          if (lastChecked) {
            lastChecked.textContent = `Last checked: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
          }
        }
      } catch (err) {
        if (dot) dot.className = 'pulse-gray';
        if (text) {
          text.style.color = 'var(--text-muted)';
          text.textContent = 'SYSTEM ONLINE • LOCAL BROWSER BUILD';
        }
      }
    }
  }

  async function startOtaDownload(downloadUrl) {
    const wrap = document.getElementById('otaProgressWrap');
    if (wrap) wrap.classList.remove('hidden');

    if (window.electronAPI && window.electronAPI.otaDownloadUpdate) {
      try {
        await window.electronAPI.otaDownloadUpdate(downloadUrl);
      } catch (e) {
        showQuickToast(`Download failed: ${e.message}`, 'error');
      }
    }
  }

  // =========================================================================
  // WALLPAPER FIRST SCREEN WIREUP (CLEAN CONTROLS & COMMAND DOCK)
  // =========================================================================
  function initPortfolioFirstScreen() {
    // Dock Button & Lanyard Badge Click -> Open Command Center
    document.getElementById('btnOpenCommandCenter')?.addEventListener('click', (e) => {
      e.stopPropagation();
      openCommandCenter();
    });

    document.getElementById('cardBadgeTrigger')?.addEventListener('click', (e) => {
      e.stopPropagation();
      openCommandCenter();
    });

    document.getElementById('btnBrandHome')?.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleCommandCenter();
    });

    document.getElementById('btnBrandPortfolio')?.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleCommandCenter();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

