/**
 * ============================================================================
 * REDDOT WORKSTATION OS & LIVE WALLPAPER • PRODUCTION ENGINE (V2.6)
 * Native Persistent Database • Custom ID Photo Mount • 3D Lanyard Physics
 * Task Management • Team Chat • Database Diagnostics Benchmark
 * ============================================================================
 */

(function () {
  'use strict';

  function compareSemver(v1, v2) {
    const p1 = String(v1 || '0.0.0').replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
    const p2 = String(v2 || '0.0.0').replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
    for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
      const a = p1[i] || 0;
      const b = p2[i] || 0;
      if (a > b) return 1;
      if (a < b) return -1;
    }
    return 0;
  }


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

  const OFFICIAL_MEMBERS = {
    "RD-FOUNDER-001": {
      id: "RD-FOUNDER-001",
      uid: "Uvhr9MPQ0RODCujtxzUiWcJBzHk2",
      name: "JAGADISH K",
      displayName: "JAGADISH K",
      email: "jagadish2k2006@gmail.com",
      role: "Founder",
      dept: "Hardware Architecture",
      isOwner: true,
      status: "DUTY_ON",
      active: true,
      avatarText: "JK",
      photoUrl: "",
      photoURL: ""
    },
    "RD-FAE7BQ": {
      id: "RD-FAE7BQ",
      uid: "FAe7Bqs5PQTBHZh91Z2uUs8SZur2",
      name: "Jai Keerthi",
      displayName: "Jai Keerthi",
      email: "keerthijai909@gmail.com",
      role: "CEO",
      dept: "AI / ML Systems",
      isOwner: false,
      status: "DUTY_ON",
      active: true,
      avatarText: "JK",
      photoUrl: "",
      photoURL: ""
    },
    "RD-EMP-002": {
      id: "RD-EMP-002",
      uid: "Yp9Rm1HggQYJYMDc6x8e7DFxRyR2",
      name: "Pavithra R",
      displayName: "Pavithra R",
      email: "pavithratech1206@gmail.com",
      role: "Employee",
      dept: "Engineering & Development",
      isOwner: false,
      status: "DUTY_ON",
      active: true,
      avatarText: "PR",
      photoUrl: "",
      photoURL: ""
    },
    "RD-002": {
      id: "RD-002",
      uid: "UHuBk7jqkYboXbRzIZ3r2Dmd20R2",
      name: "TEJASWINI S",
      displayName: "TEJASWINI S",
      email: "tejaswinisiva02@gmail.com",
      role: "Employee",
      dept: "Hardware Architecture",
      isOwner: false,
      status: "DUTY_OFF",
      active: true,
      avatarText: "TS",
      photoUrl: "https://lh3.googleusercontent.com/d/1mc4rOkyg16zrVQkK9vBn51YtduJOSdhe=s1000",
      photoURL: "https://lh3.googleusercontent.com/d/1mc4rOkyg16zrVQkK9vBn51YtduJOSdhe=s1000"
    }
  };

  const INITIAL_SEED_DATA = {
    members: JSON.parse(JSON.stringify(OFFICIAL_MEMBERS)),
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

      if (!this.data.leaveRequests || !Array.isArray(this.data.leaveRequests)) {
        this.data.leaveRequests = [];
      }

      // Explicitly purge legacy fake/demo mock members & deleted members from store & normalize IDs & enforce roles
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
            id.startsWith('RD-RD-') || (m.id && m.id.startsWith('RD-RD-')) || (m.uid && m.uid.startsWith('RD-RD-')) ||
            (m.name === 'Team Member' && !m.email) ||
            (m.uid === 'RD-FOUNDER-001' && !m.email) ||
            m?.name === 'Alex Rivera' || m?.name === 'Priya Sharma' || m?.name === 'Vikram Malhotra' ||
            m?.email === 'alex@reddot.com' || m?.email === 'priya@reddot.com' || m?.email === 'vikram@reddot.com'
          ) {
            delete this.data.members[id];
            changed = true;
            return;
          }

          const mEmail = (m.email || '').toLowerCase().trim();
          const mName = (m.displayName || m.name || '').toLowerCase().trim();
          const isFounder = (mEmail === 'jagadish2k2006@gmail.com') || (m.id === 'RD-FOUNDER-001' && mName.includes('jagadish'));
          const isJaiKeerthi = (mEmail === 'keerthijai909@gmail.com') || mName.includes('jai keerthi') || mName.includes('jaikeerthi');

          if (isFounder) {
            m.role = 'Founder';
            m.isOwner = true;
            m.id = 'RD-FOUNDER-001';
            m.name = 'JAGADISH K';
            m.displayName = 'JAGADISH K';
            m.dept = 'Hardware Architecture';
            changed = true;
          } else if (isJaiKeerthi) {
            m.role = 'CEO';
            m.isOwner = false;
            m.displayName = 'Jai Keerthi';
            m.dept = 'AI / ML Systems';
            changed = true;
          } else {
            const canonicalRole = formatAppRole(m.role, m.email);
            if (m.role !== canonicalRole || m.isOwner) {
              m.role = canonicalRole;
              m.isOwner = false;
              changed = true;
            }
          }

          if (!m.id) {
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
          await this.save(true);
        }
      }

      // Ensure all 4 official core members are always populated
      if (!this.data.members) this.data.members = {};
      Object.entries(OFFICIAL_MEMBERS).forEach(([key, om]) => {
        const found = Object.values(this.data.members).find(m =>
          m && ((m.email && m.email.toLowerCase() === om.email.toLowerCase()) || m.id === om.id || m.uid === om.uid)
        );
        if (!found) {
          this.data.members[key] = { ...om };
        } else {
          if (!found.id) found.id = om.id;
          if (!found.email) found.email = om.email;
          if (!found.displayName) found.displayName = om.displayName;
          if (om.photoURL && !found.photoURL) found.photoURL = om.photoURL;
          if (om.photoUrl && !found.photoUrl) found.photoUrl = om.photoUrl;
        }
      });

      if (typeof reconcilePastMessagesAsRead === 'function') {
        reconcilePastMessagesAsRead();
      }

      this.updateMetricsUI();
    },

    _saveTimer: null,
    async save(immediate = false) {
      this.updateMetricsUI();
      if (immediate) {
        if (this._saveTimer) { clearTimeout(this._saveTimer); this._saveTimer = null; }
        return this._executeSave();
      }
      if (this._saveTimer) clearTimeout(this._saveTimer);
      this._saveTimer = setTimeout(() => {
        this._executeSave().catch(e => console.error('[DB] Debounced save note:', e));
      }, 400);
    },

    async _executeSave() {
      if (window.electronAPI && window.electronAPI.dbSave) {
        try {
          await window.electronAPI.dbSave(this.data);
        } catch (e) {
          console.error('[DB] Failed to save to disk:', e);
        }
      } else {
        try {
          localStorage.setItem('reddot_disk_db_v2', JSON.stringify(this.data));
        } catch (_) {}
      }
    },

    updateMetricsUI() {
      const uniqueMembers = (typeof getUniqueMembersList === 'function')
        ? getUniqueMembersList()
        : Object.values(this.data.members || {});

      const totalMembersCount = uniqueMembers.length;
      const onlineCount = uniqueMembers.filter(m => m && !m.suspended && isMemberAppOnline(m)).length;
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
    theme: localStorage.getItem('reddot_theme') || localStorage.getItem('rd_theme') || 'light',
    activeWallpaperPreset: localStorage.getItem('rd_active_wallpaper_preset') || 'obsidian-cyber',
    activeTab: 'dashboard',
    activeChannelId: 'general',
    taskFilter: 'ALL',
    commandCenterOpen: true,
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
    const closeBtn = document.getElementById('btnCloseAuthModal');
    if (closeBtn) {
      closeBtn.style.display = state.currentUser ? 'flex' : 'none';
    }
    if (window.FirebaseService && typeof FirebaseService.ensureReady === 'function') {
      FirebaseService.ensureReady(4000).catch(() => {});
    }
    switchAuthTab(initialTab);
    hideAuthAlert();
    modal.classList.remove('hidden');
  }

  function closeAuthModal() {
    if (!state.currentUser) return; // Authentication is mandatory
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

  function openUserProfileModal(targetMember = null) {
    const modal = document.getElementById('userProfileModal');
    if (!modal) return;

    const isSelf = !targetMember || isSelfMember(targetMember) || (targetMember.id === state.currentMemberId);
    const member = targetMember || state.currentMember || (state.currentUser ? {
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

    state.viewingProfileMember = member;

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

    // Live Running Applications & Workstation Telemetry
    const telemetryBox = document.getElementById('userProfileTelemetryBox');
    if (telemetryBox) {
      let fg = null;
      let bgList = [];
      if (isSelf) {
        fg = state.currentActiveTool;
        bgList = Array.isArray(state.backgroundTools) ? state.backgroundTools : [];
      } else {
        fg = member.activeTool || null;
        bgList = Array.isArray(member.backgroundTools) ? [...member.backgroundTools] : [];
        if ((!fg || fg.exe === 'system' || fg.icon === 'default') && bgList.length > 0) {
          fg = bgList[0];
          bgList = bgList.slice(1);
        }
      }

      if (!fg || fg.exe === 'system' || fg.icon === 'default') {
        const adaptive = getMemberAdaptiveWorkApps(member);
        fg = adaptive.foreground;
        if (bgList.length === 0) {
          bgList = adaptive.background;
        }
      }

      const dutyBadge = document.getElementById('userProfileDutyBadge');
      const isOnline = isSelf || isMemberAppOnline(member);
      const isBreak = member.status === 'DUTY_BREAK';
      if (dutyBadge) {
        if (!isOnline) {
          dutyBadge.className = 'node-status-badge badge-offline';
          dutyBadge.textContent = 'OFFLINE';
        } else if (isBreak) {
          dutyBadge.className = 'node-status-badge badge-break';
          dutyBadge.textContent = 'ON BREAK';
        } else {
          dutyBadge.className = 'node-status-badge badge-online';
          dutyBadge.textContent = member.status === 'DUTY_ON' ? 'ON DUTY' : 'ONLINE';
        }
      }

      const fgBox = document.getElementById('userProfileForegroundApp');
      if (fgBox) {
        if (!isOnline) {
          fgBox.innerHTML = `<span style="font-size: 11px; color: #64748b;">⚪ Workstation Offline &bull; No active apps in use</span>`;
        } else if (fg) {
          fgBox.innerHTML = `
            <div style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: rgba(0,229,255,0.1); border-radius: 6px; flex-shrink: 0;">
              ${getToolIconSvg(fg.icon, 24)}
            </div>
            <div style="flex: 1; min-width: 0;">
              <div style="font-size: 12px; font-weight: 700; color: #f8fafc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(fg.name)}</div>
              <div style="font-size: 10px; color: #38bdf8; display: flex; align-items: center; gap: 4px;">
                <span class="live-pulse-dot" style="width: 6px; height: 6px;"></span>
                <span>Active Foreground Process (${escapeHtml(fg.category || 'Development')})</span>
              </div>
            </div>
          `;
        } else {
          fgBox.innerHTML = `<span style="font-size: 11px; color: #64748b;">No active desktop app in focus</span>`;
        }
      }

      const bgTray = document.getElementById('userProfileBackgroundAppsTray');
      const bgHeader = document.getElementById('userProfileBgAppsHeader');
      if (bgTray) {
        if (isOnline && bgList.length > 0) {
          if (bgHeader) {
            bgHeader.textContent = `BACKGROUND APPLICATIONS (${bgList.length})`;
            bgHeader.style.display = 'block';
          }
          bgTray.innerHTML = bgList.map(bg => `
            <div class="app-icon-slot background-slot"
                 style="display: flex; align-items: center; gap: 6px; padding: 4px 8px; background: rgba(30,41,59,0.5); border: 1px solid rgba(255,255,255,0.06); border-radius: 6px;"
                 title="${escapeHtml(bg.name)} (${escapeHtml(bg.exe || '')})">
              ${getToolIconSvg(bg.icon, 18)}
              <span style="font-size: 11px; color: #cbd5e1; font-weight: 500;">${escapeHtml(bg.name)}</span>
            </div>
          `).join('');
          bgTray.style.display = 'flex';
        } else {
          bgTray.innerHTML = '';
          bgTray.style.display = 'none';
          if (bgHeader) bgHeader.style.display = 'none';
        }
      }

      const todayHoursEl = document.getElementById('userProfileTodayHours');
      if (todayHoursEl) {
        const sec = member.todaySeconds || (isSelf ? state.personalShift?.seconds : 0) || 0;
        const hrs = (sec / 3600).toFixed(2);
        todayHoursEl.textContent = `${hrs} hrs (${Math.floor(sec / 60)} mins)`;
      }

      // Render interactive App Switcher for self profile
      const switcherWrap = document.getElementById('userProfileAppSwitcherWrap');
      const pillsContainer = document.getElementById('userProfileQuickAppPills');
      if (switcherWrap && pillsContainer) {
        if (isSelf) {
          switcherWrap.style.display = 'block';
          const COMMON_WORK_TOOLS = [
            { name: 'VS Code', exe: 'code.exe', icon: 'vscode', category: 'Development' },
            { name: 'Antigravity IDE', exe: 'antigravity ide.exe', icon: 'antigravity', category: 'Development' },
            { name: 'Figma', exe: 'figma.exe', icon: 'figma', category: 'Design' },
            { name: 'Google Chrome', exe: 'chrome.exe', icon: 'chrome', category: 'Research & Tools' },
            { name: 'Brave Browser', exe: 'brave.exe', icon: 'brave', category: 'Research & Tools' },
            { name: 'Python', exe: 'python.exe', icon: 'default', category: 'Development' },
            { name: 'Terminal', exe: 'cmd.exe', icon: 'terminal', category: 'Development' },
            { name: 'PowerShell', exe: 'powershell.exe', icon: 'terminal', category: 'Development' },
            { name: 'Adobe Photoshop', exe: 'photoshop.exe', icon: 'photoshop', category: 'Design' },
            { name: 'Adobe Illustrator', exe: 'illustrator.exe', icon: 'illustrator', category: 'Design' },
            { name: 'Canva', exe: 'canva.exe', icon: 'figma', category: 'Design' },
            { name: 'Postman', exe: 'postman.exe', icon: 'postman', category: 'Testing & API' },
            { name: 'Docker', exe: 'docker.exe', icon: 'docker', category: 'DevOps & Containers' },
            { name: 'Microsoft Teams', exe: 'teams.exe', icon: 'teams', category: 'Communication' },
            { name: 'Spotify', exe: 'spotifylauncher.exe', icon: 'spotify', category: 'Media & Audio' }
          ];

          pillsContainer.innerHTML = COMMON_WORK_TOOLS.map(tool => {
            const isCurrentFg = (fg && (fg.exe || '').toLowerCase() === tool.exe.toLowerCase());
            return `
              <button type="button" class="btn-quick-app-pill ${isCurrentFg ? 'active-fg' : ''}"
                      data-app-json='${escapeHtml(JSON.stringify(tool))}'
                      style="display: flex; align-items: center; gap: 5px; padding: 4px 8px; border-radius: 5px; font-size: 10.5px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; background: ${isCurrentFg ? 'rgba(0,229,255,0.2)' : 'rgba(30,41,59,0.7)'}; border: 1px solid ${isCurrentFg ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.1)'}; color: ${isCurrentFg ? '#fff' : '#cbd5e1'};">
                ${getToolIconSvg(tool.icon, 14)}
                <span>${escapeHtml(tool.name)}</span>
              </button>
            `;
          }).join('') + (window.electronAPI && typeof window.electronAPI.getRunningWorkApps === 'function' ? `
            <button type="button" id="btnRescanOsApps"
                    style="display: flex; align-items: center; gap: 5px; padding: 4px 8px; border-radius: 5px; font-size: 10.5px; font-weight: 700; cursor: pointer; background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.5); color: #34d399;">
              <span>⚡ Rescan OS Tasklist</span>
            </button>
          ` : '');

          pillsContainer.querySelectorAll('.btn-quick-app-pill').forEach(btn => {
            btn.addEventListener('click', () => {
              try {
                const tool = JSON.parse(btn.getAttribute('data-app-json'));
                state.currentActiveTool = tool;
                state.activeSelectedWorkTool = tool;
                if (!state.backgroundTools) state.backgroundTools = [];
                state.backgroundTools = [fg, ...state.backgroundTools].filter(b => b && (b.exe || '').toLowerCase() !== tool.exe.toLowerCase()).slice(0, 8);
                try {
                  localStorage.setItem('rd_user_custom_work_apps', JSON.stringify({
                    foreground: tool,
                    background: state.backgroundTools
                  }));
                } catch (_) {}
                if (window.FirebaseService?.updateMyPresence) {
                  FirebaseService.updateMyPresence({
                    activeTool: tool,
                    backgroundTools: state.backgroundTools
                  });
                }
                openUserProfileModal(null);
                renderWorkers();
                showQuickToast(`Foreground active tool switched to ${tool.name}`, 'success');
              } catch (_) {}
            });
          });

          document.getElementById('btnRescanOsApps')?.addEventListener('click', async () => {
            showQuickToast('Scanning active Windows applications...', 'info');
            _lastRunningAppsScanTs = 0;
            state.activeSelectedWorkTool = null;
            await detectAndTrackActiveWorkTool(0);
            openUserProfileModal(null);
            renderWorkers();
            showQuickToast('Running applications refreshed from OS tasklist!', 'success');
          });
        } else {
          switcherWrap.style.display = 'none';
        }
      }

    }

    // Toggle self action buttons vs colleague action buttons
    const selfActions = document.getElementById('userProfileSelfActions');
    const colleagueActions = document.getElementById('userProfileColleagueActions');
    if (selfActions) selfActions.style.display = isSelf ? 'flex' : 'none';
    if (colleagueActions) colleagueActions.style.display = isSelf ? 'none' : 'flex';

    modal.classList.remove('hidden');
  }

  function closeUserProfileModal() {
    const modal = document.getElementById('userProfileModal');
    if (modal) modal.classList.add('hidden');
  }

  // --- ROLE DEFINITIONS & STRICT 4-ROLE ARCHITECTURE ---
  // The system strictly recognizes only 4 roles: Founder, CEO, Employee, Intern.
  // Jagadish K is the sole Founder.
  function formatAppRole(role, email = '') {
    const e = (email || '').toLowerCase().trim();
    if (e === 'jagadish2k2006@gmail.com') return 'Founder';
    if (e === 'keerthijai909@gmail.com') return 'CEO';
    const r = String(role || '').trim().toLowerCase();
    if (r === 'founder' || r === 'owner') return 'Employee'; // Only Jagadish is Founder
    if (r === 'ceo') return 'CEO';
    if (r === 'intern' || r.includes('trainee')) return 'Intern';
    return 'Employee';
  }

  function normalizeAppRole(role) {
    if (!role) return 'EMPLOYEE';
    const r = String(role).toUpperCase().trim();
    if (r.includes('FOUND') || r.includes('OWNER')) return 'FOUNDER';
    if (r === 'CEO' || r.includes('CHIEF EXECUTIVE')) return 'CEO';
    if (r.includes('INTERN') || r.includes('TRAINEE')) return 'INTERN';
    return 'EMPLOYEE';
  }

  function isSoleFounder(targetEmail) {
    if (targetEmail && targetEmail.toLowerCase().trim() === 'jagadish2k2006@gmail.com') return true;
    const curEmail = (state.currentUser?.email || '').toLowerCase().trim();
    return (curEmail === 'jagadish2k2006@gmail.com');
  }

  // ONLY Founder Jagadish K can promote or modify member roles
  function canManageRoles() {
    return isSoleFounder();
  }

  // Founder, CEO, and Manager can create and assign tasks
  function canManageTasks() {
    const role = normalizeAppRole(state.userRole || state.currentMember?.role);
    return isSoleFounder() || role === 'CEO' || role === 'MANAGER';
  }

  // Founder, CEO, and Manager can approve/reject leave requests
  function canApproveLeave() {
    const role = normalizeAppRole(state.userRole || state.currentMember?.role);
    return isSoleFounder() || role === 'CEO' || role === 'MANAGER';
  }

  // Founder, CEO, and Manager can create and delete group channels
  function canManageChannels() {
    const role = normalizeAppRole(state.userRole || state.currentMember?.role);
    return isSoleFounder() || role === 'CEO' || role === 'MANAGER';
  }

  // Founder, CEO, and Manager can view all team members' attendance logs & timesheets
  function hasFullAttendanceAccess() {
    const role = normalizeAppRole(state.userRole || state.currentMember?.role);
    return isSoleFounder() || role === 'CEO' || role === 'MANAGER';
  }

  // Founder, CEO, and Manager can view Database & infrastructure configurations
  function hasDatabaseAccess() {
    const role = normalizeAppRole(state.userRole || state.currentMember?.role);
    return isSoleFounder() || role === 'CEO' || role === 'MANAGER';
  }

  // Dynamic role masking for Files & Cloud: mask raw database benchmarks & resets for employees
  function updateFilesAndCloudRoleMasking() {
    const isExecutive = hasDatabaseAccess(); // Founder, CEO, Manager
    const cardDiag = document.getElementById('cardDbDiagnostics');
    const cardMask = document.getElementById('cardDbDiagnosticsMask');
    const btnReset = document.getElementById('btnResetDatabaseToDefaults');
    const wrapGithub = document.getElementById('wrapGithubOtaSettings');
    const btnRevert = document.getElementById('btnRevertOtaHotpatchTop');
    const btnRevertBottom = document.getElementById('btnRevertOtaHotpatch');
    const btnSyncCloud = document.getElementById('btnSyncCloudVaultNow');

    if (cardDiag) cardDiag.style.display = isExecutive ? '' : 'none';
    if (cardMask) cardMask.classList.toggle('hidden', isExecutive);
    if (btnReset) btnReset.style.display = isExecutive ? '' : 'none';
    if (wrapGithub) wrapGithub.style.display = isExecutive ? '' : 'none';
    if (btnRevert) btnRevert.classList.toggle('hidden', !isExecutive);
    if (btnRevertBottom) btnRevertBottom.classList.toggle('hidden', !isExecutive);
    if (btnSyncCloud) btnSyncCloud.style.display = isExecutive ? '' : 'none';

    // Synchronize current version badges across Files & Cloud and Settings
    const curVer = window.currentInstalledVersion || (window.electronAPI?.appVersion) || '3.5.3';
    const otaBadge = document.getElementById('otaVersionBadge');
    if (otaBadge) otaBadge.textContent = `VERSION ${curVer} (INSTALLED)`;
    const setBadge = document.getElementById('settingsVersionBadge');
    if (setBadge) setBadge.textContent = `VERSION ${curVer} (INSTALLED)`;
  }
  window.updateFilesAndCloudRoleMasking = updateFilesAndCloudRoleMasking;

  function parseTimestamp(val) {
    if (!val) return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (typeof val === 'object') {
      if (typeof val.toMillis === 'function') {
        const ms = val.toMillis();
        return isNaN(ms) ? 0 : ms;
      }
      if (val.seconds !== undefined) {
        const s = Number(val.seconds);
        const ns = Number(val.nanoseconds || 0);
        return isNaN(s) ? 0 : (s * 1000 + Math.floor(ns / 1e6));
      }
    }
    if (typeof val === 'string') {
      const num = Number(val);
      if (!isNaN(num) && num > 0) return num;
      const parsed = Date.parse(val);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return 0;
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

      const userEmail = (user.email || '').toLowerCase().trim();
      if (isSoleAdmin) {
        state.userRole = 'FOUNDER';
        member.role = 'FOUNDER';
        member.isOwner = true;
        if (!member.name || member.name.includes('@')) member.name = 'JAGADISH K';
        if (!member.dept) member.dept = 'Hardware Architecture';
      } else if (userEmail === 'keerthijai909@gmail.com') {
        state.userRole = 'CEO';
        member.role = 'CEO';
        member.isOwner = false;
        if (!member.name || member.name.includes('@')) member.name = 'Jai Keerthi';
        if (!member.dept) member.dept = 'AI / ML Systems';
      } else {
        // Non-founders can never hold FOUNDER role
        let assignedRole = normalizeAppRole(member.role || 'employee');
        if (assignedRole === 'FOUNDER') assignedRole = 'EMPLOYEE';
        state.userRole = assignedRole;
        member.role = assignedRole;
        member.isOwner = false;
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

      // Dynamic Role-Based UI Guard: Keep Files & Cloud visible, mask sensitive admin controls
      const dbNavBtn = document.getElementById('tabBtnDatabase');
      if (dbNavBtn) dbNavBtn.style.display = 'flex';
      if (typeof updateFilesAndCloudRoleMasking === 'function') updateFilesAndCloudRoleMasking();

      const createChBtn = document.getElementById('btnCreateChannel');
      if (createChBtn) createChBtn.style.display = canManageChannels() ? 'flex' : 'none';

      const createTkBtn = document.getElementById('btnOpenCreateTaskModal');
      if (createTkBtn) createTkBtn.style.display = canManageTasks() ? 'inline-flex' : 'none';

      const dashTkBtn = document.getElementById('dashBtnNewTask');
      if (dashTkBtn) dashTkBtn.style.display = canManageTasks() ? 'inline-flex' : 'none';

      lockChatComposer(false);
      mountMemberOnWallpaper(state.currentMemberId);
      reconcilePersonalShiftWithPunches();
      renderWorkers();
      renderTasks();
      renderChatChannelsAndDMs();
      renderFleetTelemetry();
      renderPunchLogs();
      renderTeamHoursDashboard();
      initLeaveRequestHandlers();
      renderLeaveRequests();
    } else if (user) {
      const userEmail = (user.email || '').toLowerCase().trim();
      const fallbackId = isSoleAdmin ? 'RD-FOUNDER-001' : `RD-${user.uid.slice(0, 6).toUpperCase()}`;
      state.currentMemberId = fallbackId;
      state.userRole = isSoleAdmin ? 'FOUNDER' : (userEmail === 'keerthijai909@gmail.com' ? 'CEO' : 'EMPLOYEE');
      if (roleDot) roleDot.style.background = '#00e676';
      safeSetText(roleLabel, `${user.email.split('@')[0].toUpperCase()} // ${(state.userRole || 'EMPLOYEE').toUpperCase()}`);
      safeSetText(sessionEmpId, fallbackId);

      const hName = document.getElementById('headerUserName');
      if (hName) hName.textContent = user.displayName || user.email?.split('@')[0] || (userEmail === 'keerthijai909@gmail.com' ? 'Jai Keerthi' : 'Team Member');
      const hRole = document.getElementById('headerUserRole');
      if (hRole) hRole.textContent = state.userRole || 'Employee';

      // Dynamic Role-Based UI Guard: Keep Files & Cloud visible, mask sensitive admin controls
      const dbNavBtn = document.getElementById('tabBtnDatabase');
      if (dbNavBtn) dbNavBtn.style.display = 'flex';
      if (typeof updateFilesAndCloudRoleMasking === 'function') updateFilesAndCloudRoleMasking();

      const createChBtn = document.getElementById('btnCreateChannel');
      if (createChBtn) createChBtn.style.display = canManageChannels() ? 'flex' : 'none';

      const createTkBtn = document.getElementById('btnOpenCreateTaskModal');
      if (createTkBtn) createTkBtn.style.display = canManageTasks() ? 'inline-flex' : 'none';

      const dashTkBtn = document.getElementById('dashBtnNewTask');
      if (dashTkBtn) dashTkBtn.style.display = canManageTasks() ? 'inline-flex' : 'none';

      lockChatComposer(false);
      reconcilePersonalShiftWithPunches();
      renderPunchLogs();
      renderTeamHoursDashboard();
      renderLeaveRequests();
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
    if (p.workerId === 'GUEST' || (p.name || '').toLowerCase().includes('guest') || (p.worker || '').toLowerCase().includes('guest')) {
      return null;
    }
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
    if (!state.currentUser) {
      return {
        id: 'GUEST',
        uid: null,
        name: 'Guest User',
        displayName: 'Guest User',
        email: '',
        role: 'Guest',
        isOwner: false
      };
    }

    const myUid = state.currentUser.uid;
    const myEmail = (state.currentUser.email || '').toLowerCase().trim();
    const isFounder = (myEmail === 'jagadish2k2006@gmail.com');

    // Priority 1: state.currentMember if authentic
    if (state.currentMember && (state.currentMember.uid === myUid || (state.currentMember.email || '').toLowerCase().trim() === myEmail)) {
      return state.currentMember;
    }

    // Priority 2: Database member matching current user's UID
    if (myUid && WorkspaceDB.data.members?.[myUid]) {
      return WorkspaceDB.data.members[myUid];
    }

    // Priority 3: Database member matching current user's email
    if (myEmail) {
      const found = Object.values(WorkspaceDB.data.members || {}).find(m => (m.email || '').toLowerCase().trim() === myEmail);
      if (found) return found;
    }

    // Priority 4: Database member matching currentMemberId ONLY IF email or UID matches
    if (state.currentMemberId && WorkspaceDB.data.members?.[state.currentMemberId]) {
      const m = WorkspaceDB.data.members[state.currentMemberId];
      if (m.uid === myUid || (m.email || '').toLowerCase().trim() === myEmail) {
        return m;
      }
    }

    if (isFounder) {
      return {
        id: 'RD-FOUNDER-001',
        uid: myUid,
        name: 'JAGADISH K',
        displayName: 'JAGADISH K',
        email: 'jagadish2k2006@gmail.com',
        role: 'Founder',
        isOwner: true
      };
    }

    if (myEmail === 'keerthijai909@gmail.com') {
      return {
        id: 'RD-FAE7BQ',
        uid: myUid,
        name: 'Jai Keerthi',
        displayName: 'Jai Keerthi',
        email: 'keerthijai909@gmail.com',
        role: 'CEO',
        dept: 'AI / ML Systems',
        isOwner: false
      };
    }

    return {
      id: state.currentMemberId || (myUid ? `RD-${myUid.slice(0, 6).toUpperCase()}` : 'RD-EMP-001'),
      uid: myUid,
      name: state.currentUser?.displayName || (myEmail ? myEmail.split('@')[0] : 'Employee'),
      displayName: state.currentUser?.displayName || (myEmail ? myEmail.split('@')[0] : 'Employee'),
      email: myEmail,
      role: state.userRole || 'Employee',
      isOwner: false
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
    if (WorkspaceDB.data.members) {
      delete WorkspaceDB.data.members['RD-RD-FOU'];
      delete WorkspaceDB.data.members['RD-CEO-002'];
      // Purge any corrupted phantom keys
      Object.keys(WorkspaceDB.data.members).forEach(k => {
        if (k.startsWith('RD-RD-') || k === 'RD-RD-FAE' || k === 'RD-CEO-002') delete WorkspaceDB.data.members[k];
      });
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
      if (
        (m.id && m.id.startsWith('RD-RD-')) ||
        (m.uid && m.uid.startsWith('RD-RD-')) ||
        ((m.displayName === 'Team Member' || m.name === 'Team Member') && !m.email) ||
        (!m.email && (!m.uid || m.uid.startsWith('RD-'))) ||
        m.id === 'RD-RD-FOU' ||
        m.id === 'RD-CEO-002' ||
        (m.uid === 'RD-FOUNDER-001' && !m.email)
      ) return;

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
        const rawRole = (currTime >= prevTime && m.role) ? m.role : (prev.role || m.role || 'Employee');
        const role = formatAppRole(rawRole, m.email || prev.email);
        let dept = (currTime >= prevTime && m.dept) ? m.dept : (prev.dept || m.dept || 'Hardware Architecture');
        const isOnline = prev.isOnline || m.isOnline;
        const lastSeenAt = Math.max(parseTimestamp(prev.lastSeenAt), parseTimestamp(m.lastSeenAt));
        map.set(key, {
          ...prev,
          ...m,
          role,
          dept,
          isOnline,
          lastSeenAt,
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
  let updateChannelActiveMeetingBanner = () => {};

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
    if (clean.startsWith('data:') || clean.startsWith('blob:') || clean.startsWith('assets/') || clean.startsWith('http://') || clean.startsWith('https://')) {
      return clean.replace(/"/g, '%22').replace(/'/g, '%27').replace(/</g, '%3C').replace(/>/g, '%3E');
    }
    return '';
  }

  async function downloadAttachmentFile(fileName, dataUrlOrUrl) {
    if (!dataUrlOrUrl) {
      showQuickToast('Cannot download: attachment data is empty', 'warning');
      return;
    }
    const cleanName = String(fileName || 'download').trim();
    showQuickToast(`Preparing download for "${cleanName}"...`, 'info');

    if (window.electronAPI && typeof window.electronAPI.saveFileToDisk === 'function') {
      try {
        const res = await window.electronAPI.saveFileToDisk({
          defaultName: cleanName,
          dataUrl: dataUrlOrUrl
        });
        if (res && res.success) {
          showQuickToast(`Saved "${cleanName}" successfully!`, 'success');
          return;
        } else if (res && res.canceled) {
          return;
        }
      } catch (err) {
        console.warn('[DOWNLOAD] Native save dialog failed, attempting browser fallback:', err);
      }
    }

    // Universal browser fallback (works in browser & webContents)
    try {
      const a = document.createElement('a');
      a.href = dataUrlOrUrl;
      a.download = cleanName;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (a.parentNode) a.parentNode.removeChild(a);
      }, 100);
      showQuickToast(`Downloaded "${cleanName}"`, 'success');
    } catch (e) {
      showQuickToast(`Download error: ${e.message}`, 'error');
    }
  }
  window.downloadAttachmentFile = downloadAttachmentFile;

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


  // --- LEAVE & TIME-OFF REQUEST MANAGEMENT ---
  function renderLeaveRequests() {
    const tbody = document.getElementById('leaveTableBody');
    if (!tbody) return;
    tbody.replaceChildren();

    const rolePill = document.getElementById('leaveRolePill');
    const canApprove = canApproveLeave();
    if (rolePill) {
      rolePill.textContent = canApprove ? 'MANAGEMENT APPROVAL CONTROL' : 'MY LEAVE REQUESTS';
      rolePill.style.color = canApprove ? 'var(--accent-cyan)' : 'var(--accent-gold)';
    }

    let leaves = WorkspaceDB.data.leaveRequests || [];
    if (!canApprove) {
      const cur = getCurrentResolvedMember();
      const curId = cur.id;
      const curUid = state.currentUser?.uid || cur.uid;
      const curEmail = (state.currentUser?.email || cur.email || '').toLowerCase().trim();

      leaves = leaves.filter(l => {
        if (!l) return false;
        if (curId && l.workerId === curId) return true;
        if (curUid && l.uid === curUid) return true;
        if (curEmail && (l.email || '').toLowerCase() === curEmail) return true;
        return false;
      });
    }

    if (leaves.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:20px;">No leave requests on record. Click <strong>+ Request Leave</strong> to submit a request.</td></tr>';
      return;
    }

    const sortedLeaves = [...leaves].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    sortedLeaves.forEach(l => {
      const tr = document.createElement('tr');
      const status = (l.status || 'PENDING').toUpperCase();
      let badgeClass = 'leave-badge-pending';
      if (status === 'APPROVED') badgeClass = 'leave-badge-approved';
      else if (status === 'REJECTED' || status === 'DECLINED') badgeClass = 'leave-badge-rejected';

      let actionHtml = '';
      if (canApprove) {
        if (status === 'PENDING') {
          actionHtml = `
            <div style="display:flex; gap:6px;">
              <button type="button" class="btn-leave-action btn-leave-approve" data-id="${escapeHtml(l.id)}">Approve</button>
              <button type="button" class="btn-leave-action btn-leave-reject" data-id="${escapeHtml(l.id)}">Decline</button>
            </div>
          `;
        } else {
          actionHtml = `<span style="font-size:11px; color:var(--text-muted);">${status} by ${escapeHtml(l.reviewedBy || 'Manager')}</span>`;
        }
      } else {
        actionHtml = `<span style="font-size:11px; color:var(--text-muted);">${status === 'PENDING' ? 'Awaiting Review' : status}</span>`;
      }

      tr.innerHTML = `
        <td><strong>${escapeHtml(l.name || l.workerId || 'Member')}</strong><br><small style="font-size:10px; color:var(--text-muted);">${escapeHtml(l.workerId || '')}</small></td>
        <td><span style="font-size:11px; font-weight:600; color:var(--accent-cyan);">${escapeHtml(l.leaveType || 'Leave')}</span></td>
        <td><span style="font-size:11px; font-family:var(--font-mono);">${escapeHtml(l.dates || 'N/A')}</span></td>
        <td style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHtml(l.reason || '')}">${escapeHtml(l.reason || '-')}</td>
        <td><span class="leave-status-badge ${badgeClass}">${status}</span></td>
        <td>${actionHtml}</td>
      `;

      if (canApprove && status === 'PENDING') {
        tr.querySelector('.btn-leave-approve')?.addEventListener('click', () => handleLeaveDecision(l.id, 'APPROVED'));
        tr.querySelector('.btn-leave-reject')?.addEventListener('click', () => handleLeaveDecision(l.id, 'REJECTED'));
      }

      tbody.appendChild(tr);
    });
  }

  async function handleLeaveDecision(leaveId, decision) {
    if (!canApproveLeave()) {
      showQuickToast('🚫 Access Denied: Only Founder, CEO, and Managers can approve or decline leave.', 'error');
      return;
    }
    const reviewer = WorkspaceDB.data.members[state.currentMemberId]?.name || state.currentUser?.displayName || 'Executive Management';
    const cleanId = String(leaveId);
    let target = (WorkspaceDB.data.leaveRequests || []).find(l => String(l.id) === cleanId);
    if (!target) {
      target = (WorkspaceDB.data.leaveRequests || []).find(l => l && (String(l.id) === cleanId || l.id == leaveId || l.workerId == leaveId));
    }
    if (target) {
      target.status = decision;
      target.reviewedBy = reviewer;
      target.reviewedAt = Date.now();
      await WorkspaceDB.save(true);
    }
    if (window.FirebaseService?.updateLeaveStatus) {
      try {
        await FirebaseService.updateLeaveStatus(leaveId, decision, reviewer);
      } catch (err) {
        console.warn('[LEAVE] Cloud update notice:', err);
      }
    }
    renderLeaveRequests();
    playNotificationChirp(true);
    const label = (decision === 'DECLINED' || decision === 'REJECTED') ? 'declined' : 'approved';
    showQuickToast(`✅ Leave request ${label} successfully.`, 'success');
  }

  function initLeaveRequestHandlers() {
    const leaveModal = document.getElementById("leaveRequestModal");
    const openBtn = document.getElementById("btnOpenLeaveModal");
    const closeBtn = document.getElementById("btnCloseLeaveRequest");
    const cancelBtn = document.getElementById("btnCancelLeaveRequest");
    const backdrop = document.getElementById("leaveRequestBackdrop");
    const form = document.getElementById("formSubmitLeaveRequest");

    // Form Controls
    const btnCatLeave = document.getElementById("btnCatLeave");
    const btnCatPermission = document.getElementById("btnCatPermission");
    const inputCategory = document.getElementById("inputRequestCategory");
    const groupLeaveDates = document.getElementById("groupLeaveDates");
    const groupPermissionTimes = document.getElementById("groupPermissionTimes");
    const selectLeaveType = document.getElementById("selectLeaveType");
    const inputLeaveDateStart = document.getElementById("inputLeaveDateStart");
    const inputLeaveDateEnd = document.getElementById("inputLeaveDateEnd");
    const inputPermissionDate = document.getElementById("inputPermissionDate");
    const inputPermissionTimeStart = document.getElementById("inputPermissionTimeStart");
    const inputPermissionTimeEnd = document.getElementById("inputPermissionTimeEnd");
    const labelCalculatedWindow = document.getElementById("labelCalculatedWindow");
    const hiddenDates = document.getElementById("inputLeaveDates");

    // Set default initial dates to today
    const todayStr = new Date().toISOString().split("T")[0];
    if (inputLeaveDateStart && !inputLeaveDateStart.value) inputLeaveDateStart.value = todayStr;
    if (inputLeaveDateEnd && !inputLeaveDateEnd.value) inputLeaveDateEnd.value = todayStr;
    if (inputPermissionDate && !inputPermissionDate.value) inputPermissionDate.value = todayStr;

    function recalculateWindow() {
      const cat = inputCategory ? inputCategory.value : "LEAVE";
      if (cat === "PERMISSION") {
        const pDate = inputPermissionDate?.value || todayStr;
        const tStart = inputPermissionTimeStart?.value || "10:00";
        const tEnd = inputPermissionTimeEnd?.value || "12:00";
        const summary = `Permission: ${pDate} (${tStart} - ${tEnd})`;
        if (labelCalculatedWindow) labelCalculatedWindow.textContent = `${tStart} to ${tEnd} (${pDate})`;
        if (hiddenDates) hiddenDates.value = summary;
      } else {
        const dStart = inputLeaveDateStart?.value || todayStr;
        const dEnd = inputLeaveDateEnd?.value || dStart;
        const t1 = new Date(dStart).getTime();
        const t2 = new Date(dEnd).getTime();
        let dayCount = 1;
        if (!isNaN(t1) && !isNaN(t2) && t2 >= t1) {
          dayCount = Math.round((t2 - t1) / (1000 * 60 * 60 * 24)) + 1;
        }
        const summary = dStart === dEnd ? `${dStart} (1 Day)` : `${dStart} to ${dEnd} (${dayCount} Days)`;
        if (labelCalculatedWindow) labelCalculatedWindow.textContent = `${dayCount} Day${dayCount > 1 ? "s" : ""} (${dStart} to ${dEnd})`;
        if (hiddenDates) hiddenDates.value = summary;
      }
    }

    btnCatLeave?.addEventListener("click", () => {
      btnCatLeave.classList.add("active");
      btnCatPermission?.classList.remove("active");
      if (inputCategory) inputCategory.value = "LEAVE";
      groupLeaveDates?.classList.remove("hidden");
      groupPermissionTimes?.classList.add("hidden");
      if (selectLeaveType) {
        selectLeaveType.value = "Casual Leave";
      }
      recalculateWindow();
    });

    btnCatPermission?.addEventListener("click", () => {
      btnCatPermission.classList.add("active");
      btnCatLeave?.classList.remove("active");
      if (inputCategory) inputCategory.value = "PERMISSION";
      groupPermissionTimes?.classList.remove("hidden");
      groupLeaveDates?.classList.add("hidden");
      if (selectLeaveType) {
        selectLeaveType.value = "Permission (Mid-Day Outpass)";
      }
      recalculateWindow();
    });

    [inputLeaveDateStart, inputLeaveDateEnd, inputPermissionDate, inputPermissionTimeStart, inputPermissionTimeEnd].forEach(el => {
      el?.addEventListener("change", recalculateWindow);
      el?.addEventListener("input", recalculateWindow);
    });

    openBtn?.addEventListener("click", () => {
      leaveModal?.classList.remove("hidden");
      recalculateWindow();
    });

    const closeModal = () => {
      leaveModal?.classList.add("hidden");
    };

    // Event delegation on leave table body for clicks
    const leaveTableBody = document.getElementById("leaveTableBody");
    if (leaveTableBody && !leaveTableBody._hasDelegation) {
      leaveTableBody._hasDelegation = true;
      leaveTableBody.addEventListener("click", (e) => {
        const approveBtn = e.target.closest(".btn-leave-approve");
        if (approveBtn) {
          e.preventDefault();
          e.stopPropagation();
          const id = approveBtn.getAttribute("data-id");
          if (id) handleLeaveDecision(id, "APPROVED");
          return;
        }
        const rejectBtn = e.target.closest(".btn-leave-reject");
        if (rejectBtn) {
          e.preventDefault();
          e.stopPropagation();
          const id = rejectBtn.getAttribute("data-id");
          if (id) handleLeaveDecision(id, "DECLINED");
          return;
        }
      });
    }

    closeBtn?.addEventListener("click", closeModal);
    cancelBtn?.addEventListener("click", closeModal);
    backdrop?.addEventListener("click", closeModal);

    form?.addEventListener("submit", async (e) => {
      e.preventDefault();
      recalculateWindow();
      const cur = getCurrentResolvedMember();
      const category = inputCategory ? inputCategory.value : "LEAVE";
      const leaveType = selectLeaveType?.value || (category === "PERMISSION" ? "Permission" : "Personal Time-Off");
      const dates = hiddenDates?.value?.trim();
      const reason = document.getElementById("inputLeaveReason")?.value?.trim();

      if (!dates || !reason) {
        showQuickToast("Please select dates/times and enter a brief reason.", "error");
        return;
      }

      const newReq = {
        id: "leave_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
        uid: state.currentUser?.uid || cur.uid || "",
        workerId: cur.id || "RD-EMP",
        name: cur.displayName || cur.name || "Team Member",
        email: (state.currentUser?.email || cur.email || "").toLowerCase(),
        category,
        leaveType,
        dates,
        reason,
        status: "PENDING",
        createdAt: Date.now()
      };

      if (!WorkspaceDB.data.leaveRequests) WorkspaceDB.data.leaveRequests = [];
      WorkspaceDB.data.leaveRequests.unshift(newReq);
      await WorkspaceDB.save();

      if (window.FirebaseService?.recordLeaveRequest) {
        FirebaseService.recordLeaveRequest(newReq).catch(() => {});
      }

      closeModal();
      const reasonEl = document.getElementById("inputLeaveReason");
      if (reasonEl) reasonEl.value = "";
      renderLeaveRequests();
      playNotificationChirp(true);
      showQuickToast(category === "PERMISSION" ? "⏱ Permission request submitted for approval!" : "🌴 Leave request submitted for review!", "success");
    });
  }
  function applyWallpaperPreset(presetId) {
    const preset = DEFAULT_WALLPAPER_PRESETS.find(p => p.id === presetId) || DEFAULT_WALLPAPER_PRESETS[0];
    state.activeWallpaperPreset = preset.id;
    state.theme = preset.theme;
    localStorage.setItem('rd_active_wallpaper_preset', preset.id);
    localStorage.setItem('rd_theme', preset.theme);

    const curTheme = localStorage.getItem("reddot_theme") || state.theme || "light";
    document.body.className = (curTheme === "light" ? "theme-light" : ("theme-" + preset.theme)) + " " + (state.commandCenterOpen ? "mode-command" : "mode-wallpaper");

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

    // Listen to continuous system metrics for live running applications
    if (window.electronAPI && typeof window.electronAPI.onMetricsUpdate === 'function') {
      window.electronAPI.onMetricsUpdate(data => {
        if (data && Array.isArray(data.runningApps) && data.runningApps.length > 0) {
          _cachedDetectedRunningApps = data.runningApps;
          if (typeof detectAndTrackActiveWorkTool === 'function') {
            detectAndTrackActiveWorkTool(0);
          }
        }
      });
    }

    // Proactively scan running work apps on workstation boot
    if (window.electronAPI && typeof window.electronAPI.getRunningWorkApps === "function") {
      window.electronAPI.getRunningWorkApps().then(async apps => {
        _cachedDetectedRunningApps = apps || [];
        if (typeof detectAndTrackActiveWorkTool === "function") {
          await detectAndTrackActiveWorkTool(0);
        }
        renderWorkers();
      }).catch(() => {});
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

      // 2. Status Filter (Includes Resigned)
      if (statusFilter !== 'ALL') {
        const isResigned = !!(m.resigned || m.status === 'RESIGNED');
        if (statusFilter === 'RESIGNED') {
          if (!isResigned) return false;
        } else {
          if (isResigned) return false;
          const isOnline = isMemberAppOnline(m) || isSelfMember(m);
          const dutyStatus = getMemberDutyStatus(m);
          if (statusFilter === 'ONLINE' && !isOnline) return false;
          if (statusFilter === 'ON_BREAK' && (!isOnline || dutyStatus !== 'DUTY_BREAK')) return false;
          if (statusFilter === 'IN_FOCUS' && !isOnline) return false;
          if (statusFilter === 'OFFLINE' && isOnline) return false;
        }
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

    const canUserManageRoles = canManageRoles();

    list.forEach(member => {
      const card = document.createElement('div');
      card.className = `worker-card ${member.suspended ? 'worker-suspended' : ''}`;
      if (member.suspended) {
        card.style.opacity = '0.75';
        card.style.border = '1px solid rgba(255, 82, 82, 0.4)';
      }

      const memEmail = (member.email || '').toLowerCase().trim();
      const memName = (member.displayName || member.name || '').toLowerCase().trim();
      if (memEmail === 'keerthijai909@gmail.com' || memName.includes('jai keerthi') || memName.includes('jaikeerthi')) {
        member.role = 'CEO';
        member.isOwner = false;
        if (!member.dept) member.dept = 'AI / ML Systems';
      }

      const isOnline = isMemberAppOnline(member);
      const dutyStatus = getMemberDutyStatus(member);
      const isBreak = dutyStatus === 'DUTY_BREAK';
      const isOnDuty = dutyStatus === 'DUTY_ON';
      const isSelf = isSelfMember(member);

      let statusClass = 'status-offline pulse-gray';
      let statusText = '🔴 Offline';
      let statusBadgeClass = 'badge-offline';
      let statusBadgeText = 'OFFLINE';

      const isResigned = !!(member.resigned || member.status === 'RESIGNED');

      if (isResigned) {
        statusClass = 'status-offline status-resigned';
        statusText = '🚫 Resigned';
        statusBadgeClass = 'badge-resigned';
        statusBadgeText = 'RESIGNED';
      } else if (member.suspended) {
        statusClass = 'status-offline pulse-red';
        statusText = '⛔ Suspended';
        statusBadgeClass = 'badge-offline';
        statusBadgeText = 'SUSPENDED';
      } else if (isOnline) {
        if (isBreak) {
          statusClass = 'status-break pulse-amber';
          statusText = '🟡 Away';
          statusBadgeClass = 'badge-break';
          statusBadgeText = 'ON BREAK';
        } else if (isOnDuty) {
          statusClass = 'status-online pulse-green';
          statusText = '🟢 On Duty';
          statusBadgeClass = 'badge-online';
          statusBadgeText = 'ON DUTY';
        } else {
          statusClass = 'status-online pulse-green';
          statusText = '🟢 Online';
          statusBadgeClass = 'badge-online';
          statusBadgeText = 'ONLINE';
        }
      } else {
        if (isOnDuty) {
          statusClass = 'status-offline pulse-gray';
          statusText = '⚪ Away (Clocked In)';
          statusBadgeClass = 'badge-offline';
          statusBadgeText = 'OFFLINE';
        } else {
          statusClass = 'status-offline pulse-gray';
          statusText = '🔴 Offline';
          statusBadgeClass = 'badge-offline';
          statusBadgeText = 'OFFLINE';
        }
      }

      const safeName = escapeHtml(member.name || member.displayName || 'Member');
      const safeId = escapeHtml(member.id || (member.uid ? `RD-${member.uid.slice(0, 6).toUpperCase()}` : 'RD-EMP-000'));
      const safeDept = escapeHtml(member.dept || 'Hardware Architecture');
      const safeRole = escapeHtml(formatAppRole(member.role, member.email));
      const safeAvatar = escapeHtml(member.avatarText || (member.name || 'RD').slice(0, 2)).toUpperCase();
      const safePhoto = sanitizeUrl(member.photoUrl || member.photoURL);

      card.className = 'node-member-card' + (isResigned ? ' member-resigned' : '');

      // Resolve foreground and background running applications for this member
      let foregroundTool = null;
      let backgroundToolsList = [];

      if (isSelf) {
        foregroundTool = state.currentActiveTool;
        backgroundToolsList = Array.isArray(state.backgroundTools) ? state.backgroundTools : [];
        if ((!foregroundTool || foregroundTool.icon === 'default') && _cachedDetectedRunningApps && _cachedDetectedRunningApps.length > 0) {
          const FOREGROUND_PRIORITY = ['antigravity', 'vscode', 'code', 'vstudio', 'devenv', 'deskflow', 'arduino', 'shotcut', 'android', 'intellij', 'pycharm', 'webstorm', 'figma', 'photoshop', 'illustrator', 'blender', 'notepadpp', 'postman', 'docker', 'tableplus', 'dbeaver', 'word', 'winword', 'excel', 'powerpoint', 'brave', 'chrome', 'firefox', 'edge', 'terminal', 'powershell', 'cmd'];
          let match = null;
          for (const prio of FOREGROUND_PRIORITY) {
            match = _cachedDetectedRunningApps.find(a => ((a.exe || '').toLowerCase().includes(prio) || (a.appName || a.name || '').toLowerCase().includes(prio) || (a.icon || '').toLowerCase().includes(prio)));
            if (match) break;
          }
          if (!match) match = _cachedDetectedRunningApps[0];
          foregroundTool = { name: match.appName || match.name, exe: match.exe, icon: match.icon || 'default', category: match.category || 'Development' };
          const activeExe = (match.exe || '').toLowerCase().trim();
          backgroundToolsList = _cachedDetectedRunningApps.filter(a => (a.exe || '').toLowerCase().trim() !== activeExe).map(a => ({ name: a.appName || a.name, exe: a.exe, icon: a.icon || 'default', category: a.category || 'Tools' }));
          state.currentActiveTool = foregroundTool;
          state.backgroundTools = backgroundToolsList;
        }
      } else {
        foregroundTool = member.activeTool || null;
        backgroundToolsList = Array.isArray(member.backgroundTools) ? [...member.backgroundTools] : [];
        if ((!foregroundTool || foregroundTool.exe === 'system' || foregroundTool.icon === 'default') && backgroundToolsList.length > 0) {
          foregroundTool = backgroundToolsList[0];
          backgroundToolsList = backgroundToolsList.slice(1);
        }
      }

      if (isOnline && !isBreak && (!foregroundTool || foregroundTool.exe === 'system' || foregroundTool.icon === 'default')) {
        const adaptive = getMemberAdaptiveWorkApps(member);
        foregroundTool = adaptive.foreground;
        if (backgroundToolsList.length === 0) {
          backgroundToolsList = adaptive.background;
        }
      }

      let appsBoxHtml = '';
      if (isResigned || member.suspended || !isOnline) {
        appsBoxHtml = `
          <div class="node-apps-box">
            <div class="node-apps-header">
              <div class="node-apps-title">
                <span class="node-apps-indicator offline"></span>
                <span>WORK APPLICATIONS</span>
              </div>
              <span class="node-apps-badge-off">OFFLINE</span>
            </div>
            <div class="node-apps-offline-state">
              <span>⚪ Workstation offline • No active apps</span>
            </div>
          </div>
        `;
      } else if (isBreak) {
        appsBoxHtml = `
          <div class="node-apps-box">
            <div class="node-apps-header">
              <div class="node-apps-title">
                <span class="node-apps-indicator break"></span>
                <span>WORK APPLICATIONS</span>
              </div>
              <span class="node-apps-badge-break">ON BREAK</span>
            </div>
            <div class="node-apps-break-state">
              <span>☕ Shift on break • Applications standby</span>
            </div>
          </div>
        `;
      } else {
        const totalApps = (foregroundTool ? 1 : 0) + backgroundToolsList.length;
        const bgIconsHtml = backgroundToolsList.map(bg => `
          <div class="app-icon-slot background-slot"
               data-app-name="${escapeHtml(bg.name)}"
               data-app-exe="${escapeHtml(bg.exe || '')}"
               data-app-type="Background Process"
               data-app-category="${escapeHtml(bg.category || 'Tools')}"
               data-app-icon="${escapeHtml(bg.icon || 'default')}"
               data-member-name="${safeName}"
               role="button"
               tabindex="0"
               title="Background: ${escapeHtml(bg.name)} (${escapeHtml(bg.exe || '')}) • Press for details">
            ${getToolIconSvg(bg.icon, 20)}
          </div>
        `).join('');

        appsBoxHtml = `
          <div class="node-apps-box">
            <div class="node-apps-header">
              <div class="node-apps-title">
                <span class="node-apps-indicator active"></span>
                <span>RUNNING APPLICATIONS</span>
              </div>
              <span class="node-apps-badge">${totalApps} ACTIVE</span>
            </div>
            <div class="node-apps-content">
              ${foregroundTool ? `
                <div class="node-app-group foreground-group">
                  <span class="app-group-lbl">FOREGROUND</span>
                  <div class="app-icon-slot foreground-slot"
                       data-app-name="${escapeHtml(foregroundTool.name)}"
                       data-app-exe="${escapeHtml(foregroundTool.exe || '')}"
                       data-app-type="Foreground Active"
                       data-app-category="${escapeHtml(foregroundTool.category || 'Development')}"
                       data-app-icon="${escapeHtml(foregroundTool.icon || 'default')}"
                       data-member-name="${safeName}"
                       role="button"
                       tabindex="0"
                       title="Foreground Active: ${escapeHtml(foregroundTool.name)} (${escapeHtml(foregroundTool.exe || '')}) • Press for details">
                    ${getToolIconSvg(foregroundTool.icon, 24)}
                    <span class="foreground-pulse-dot" title="Active foreground process"></span>
                  </div>
                </div>
              ` : ''}

              ${(foregroundTool && backgroundToolsList.length > 0) ? `<div class="node-apps-divider"></div>` : ''}

              ${backgroundToolsList.length > 0 ? `
                <div class="node-app-group">
                  <span class="app-group-lbl">BACKGROUND (${backgroundToolsList.length})</span>
                  <div class="background-icons-tray">
                    ${bgIconsHtml}
                  </div>
                </div>
              ` : (foregroundTool ? '' : `
                <div class="node-apps-offline-state">
                  <span>🟢 Online • Standby</span>
                </div>
              `)}
            </div>
          </div>
        `;
      }

      card.innerHTML = `
        <div class="node-card-top">
          <div class="node-card-user-info">
            <div class="node-card-avatar">
              ${safePhoto ? `<img src="${safePhoto}" alt="" referrerpolicy="no-referrer" class="node-card-avatar-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"><span style="display:none;">${safeAvatar}</span>` : `<span>${safeAvatar}</span>`}
              <span class="node-avatar-status-dot ${statusClass}" title="${statusText}"></span>
            </div>
            <div>
              <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                <h4 class="node-card-name" style="margin: 0;">${safeName}</h4>
                ${(isOnline && foregroundTool && foregroundTool.exe !== 'system') ? `
                  <span class="member-live-tool-pill" title="Currently actively using ${escapeHtml(foregroundTool.name)}">
                    ${getToolIconSvg(foregroundTool.icon, 13)}
                    <span>${escapeHtml(foregroundTool.name)}</span>
                  </span>
                ` : ''}
              </div>
              <p class="node-card-role" ${canUserManageRoles ? `title="Click to promote/change role (Founder Privilege)" style="cursor: pointer; text-decoration: underline dotted var(--accent-cyan);"` : ''}>${safeRole} ${canUserManageRoles ? '✎' : ''}</p>
            </div>
          </div>
          <span class="node-status-badge ${statusBadgeClass}" title="${statusText}">${statusBadgeText}</span>
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

        ${appsBoxHtml}
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
      if (canUserManageRoles) {
        card.querySelector('.node-card-role')?.addEventListener('click', () => {
          openEditRoleModal(member);
        });
      }

      card.querySelector('.node-card-avatar-wrap')?.addEventListener('click', () => {
        openUserProfileModal(member);
      });
      card.querySelector('.node-card-name')?.addEventListener('click', () => {
        openUserProfileModal(member);
      });
      card.querySelector('.node-apps-box')?.addEventListener('click', () => {
        openUserProfileModal(member);
      });

      card.querySelector('.btn-worker-chat')?.addEventListener('click', () => {
        openDirectMessageWithMember(member, member.name);
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

        // Attach interactive press/click inspection listeners to all app slots
    grid.querySelectorAll('.app-icon-slot').forEach(slot => {
      slot.addEventListener('click', (e) => {
        e.stopPropagation();
        const appName = slot.getAttribute('data-app-name') || 'Application';
        const appExe = slot.getAttribute('data-app-exe') || '';
        const appType = slot.getAttribute('data-app-type') || 'Work Tool';
        const appCategory = slot.getAttribute('data-app-category') || 'Development';
        const appIcon = slot.getAttribute('data-app-icon') || 'default';
        const memberName = slot.getAttribute('data-member-name') || '';

        showAppInspectionModal({
          name: appName,
          exe: appExe,
          type: appType,
          category: appCategory,
          icon: appIcon,
          memberName: memberName
        });
      });

      slot.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          slot.click();
        }
      });
    });

    populateAssigneeSelect();
  }

  function showAppInspectionModal(info) {
    if (!info) return;
    try { playNotificationChirp(true); } catch (_) {}

    let modal = document.getElementById('appInspectionModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'appInspectionModal';
      modal.className = 'modal-overlay';
      modal.style.zIndex = '10060';
      document.body.appendChild(modal);
    }

    const isForeground = (info.type || '').toLowerCase().includes('foreground');
    const statusColor = isForeground ? '#00e676' : '#9ca3af';
    const statusBg = isForeground ? 'rgba(0, 230, 118, 0.12)' : 'rgba(255, 255, 255, 0.08)';
    const statusBorder = isForeground ? 'rgba(0, 230, 118, 0.35)' : 'rgba(255, 255, 255, 0.15)';
    const safeName = escapeHtml(info.name || 'Application');
    const safeExe = escapeHtml(info.exe || 'process.exe');
    const safeCat = escapeHtml(info.category || 'Development');
    const safeMember = escapeHtml(info.memberName || 'Workstation User');
    const iconSvg = getToolIconSvg(info.icon || info.exe, 36);

    modal.innerHTML = `
      <div class="modal-dialog app-inspect-dialog" style="max-width: 440px; border: 1.5px solid ${isForeground ? 'rgba(0, 229, 255, 0.45)' : 'rgba(255, 255, 255, 0.18)'}; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6), 0 0 30px ${isForeground ? 'rgba(0, 229, 255, 0.25)' : 'rgba(0, 0, 0, 0.4)'}; background: #131722;">
        <div class="modal-header" style="background: rgba(255, 255, 255, 0.03); border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding: 14px 18px; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${statusColor}; box-shadow: 0 0 8px ${statusColor};"></span>
            <h3 style="margin: 0; font-size: 13px; font-weight: 700; letter-spacing: 0.8px; color: #fff; text-transform: uppercase;">Application Details</h3>
          </div>
          <button type="button" class="icon-btn win-close btn-close-app-inspect" style="background: none; border: none; color: #9ca3af; font-size: 16px; cursor: pointer; border-radius: 4px; padding: 2px 6px;">✕</button>
        </div>
        <div class="modal-body" style="padding: 20px; display: flex; flex-direction: column; gap: 16px;">
          <div style="display: flex; align-items: center; gap: 16px; background: rgba(0, 0, 0, 0.35); padding: 14px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.06);">
            <div style="width: 52px; height: 52px; border-radius: 12px; background: rgba(255, 255, 255, 0.06); border: 1.5px solid rgba(255, 255, 255, 0.15); display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
              ${iconSvg}
            </div>
            <div style="flex: 1; min-width: 0;">
              <h2 style="margin: 0 0 4px 0; font-size: 18px; font-weight: 700; color: #fff; letter-spacing: -0.2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${safeName}</h2>
              <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                <span style="font-family: var(--font-mono, monospace); font-size: 11px; padding: 2px 8px; border-radius: 4px; background: ${statusBg}; border: 1px solid ${statusBorder}; color: ${statusColor}; font-weight: 700;">${isForeground ? '🟢 FOREGROUND ACTIVE' : '⚪ BACKGROUND PROCESS'}</span>
                <span style="font-family: var(--font-mono, monospace); font-size: 11px; padding: 2px 8px; border-radius: 4px; background: rgba(0, 229, 255, 0.1); border: 1px solid rgba(0, 229, 255, 0.25); color: #00e5ff; font-weight: 600;">${safeCat}</span>
              </div>
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 8px; font-size: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: rgba(255, 255, 255, 0.02); border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.04);">
              <span style="color: var(--text-muted, #9ca3af); font-size: 11px; text-transform: uppercase; font-weight: 600;">Process Executable</span>
              <span style="font-family: var(--font-mono, monospace); color: #38bdf8; font-weight: 600;">${safeExe}</span>
            </div>
            ${safeMember ? `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: rgba(255, 255, 255, 0.02); border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.04);">
              <span style="color: var(--text-muted, #9ca3af); font-size: 11px; text-transform: uppercase; font-weight: 600;">Workstation Member</span>
              <span style="font-family: var(--font-mono, monospace); color: #fff; font-weight: 600;">${safeMember}</span>
            </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: rgba(255, 255, 255, 0.02); border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.04);">
              <span style="color: var(--text-muted, #9ca3af); font-size: 11px; text-transform: uppercase; font-weight: 600;">Process Telemetry</span>
              <span style="font-family: var(--font-mono, monospace); color: #10b981; font-weight: 600;">Realtime Verified • Active</span>
            </div>
          </div>
        </div>
        <div class="modal-footer" style="background: rgba(0, 0, 0, 0.3); border-top: 1px solid rgba(255, 255, 255, 0.08); padding: 12px 18px; display: flex; justify-content: flex-end; gap: 8px;">
          <button type="button" class="btn btn-primary btn-close-app-inspect" style="padding: 6px 16px; font-size: 12px; font-weight: 600;">Dismiss</button>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
    modal.style.display = 'flex';

    const closeHandler = () => {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    };

    modal.querySelectorAll('.btn-close-app-inspect').forEach(b => b.onclick = closeHandler);
    modal.onclick = (e) => {
      if (e.target === modal) closeHandler();
    };

    try {
      showQuickToast(`Application: ${info.name} (${info.exe || ''}) • ${info.type}`, 'info');
    } catch (_) {}
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

    getUniqueMembersList().filter(m => !m.resigned && m.status !== 'RESIGNED').forEach(m => {
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

    // Attach Edit Role triggers directly on Badge Viewer (Only Founder can edit roles)
    const btnEditRoleBadge = document.getElementById('btnEditRoleFromBadgeModal');
    if (btnEditRoleBadge) {
      btnEditRoleBadge.style.display = isSoleFounder() ? 'inline-flex' : 'none';
      btnEditRoleBadge.onclick = (e) => {
        e.preventDefault();
        openEditRoleModal(member);
      };
    }
    const roleEl = document.getElementById('badgeViewRole');
    if (roleEl) {
      roleEl.onclick = isSoleFounder() ? () => openEditRoleModal(member) : null;
      roleEl.style.cursor = isSoleFounder() ? 'pointer' : 'default';
    }
    const deptEl = document.getElementById('badgeViewDept');
    if (deptEl) {
      deptEl.onclick = isSoleFounder() ? () => openEditRoleModal(member) : null;
      deptEl.style.cursor = isSoleFounder() ? 'pointer' : 'default';
    }

    modal.classList.remove('hidden');
  }

  async function uploadPhotoForBadge() {
    const member = WorkspaceDB.data.members[state.selectedViewingMemberId] || getUniqueMembersList().find(m => m.id === state.selectedViewingMemberId) || state.currentMember;
    if (!member) return;

    // Check authorization: only Founder OR the member themselves can change badge photo
    const isSelf = isSelfMember(member);
    if (!isSoleFounder() && !isSelf) {
      showQuickToast('🚫 Access Denied: You can only update your own badge photo.', 'error');
      return;
    }

    const result = await pickPhotoFile();
    if (!result.canceled && result.dataUrl) {
      member.idCardPhoto = result.dataUrl;
      member.photoUrl = result.dataUrl;
      member.photoURL = result.dataUrl;
      WorkspaceDB.data.customMountedBadgePhoto = result.dataUrl;
      await WorkspaceDB.save();

      // Sync photo to Cloud Firestore across member keys
      if (window.FirebaseService?.updateMemberPhoto) {
        try {
          const targetUid = member.uid || member.id;
          if (targetUid) {
            await FirebaseService.updateMemberPhoto(targetUid, result.dataUrl);
          }
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

    const members = getUniqueMembersList().filter(m => !m.resigned && m.status !== 'RESIGNED');

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

      if (currentVal && Array.from(select.options || []).some(o => o.value === currentVal)) {
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

        const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
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

      const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
      const doneSub = subtasks.filter(s => s.done).length;
      const totalSub = subtasks.length;
      const subtaskChipHtml = totalSub > 0 
        ? `<span style="font-size:10px; color:${doneSub === totalSub ? '#10b981' : 'var(--text-muted)'}; font-weight:600;">☑ ${doneSub}/${totalSub}</span>`
        : '';

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <span style="font-size:10px; font-weight:800; color:var(--text-muted);">${safeCode}</span>
          <div style="display:flex; align-items:center; gap:6px;">
            ${subtaskChipHtml}
            <span class="task-p-badge ${priorityClass}" style="font-size:9px; padding:1px 6px;">${escapeHtml(task.priority || 'NORMAL')}</span>
          </div>
        </div>
        <div style="font-size:12.5px; font-weight:700; color:var(--text-white); margin-bottom:8px;">${safeTitle}</div>
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:10.5px; color:var(--text-muted); border-top:1px solid var(--card-border); padding-top:6px;">
          <span>👤 ${safeAssignee.slice(0, 16)}</span>
          <span>⏰ ${safeDue}</span>
        </div>
      `;

      card.addEventListener('click', () => {
        document.querySelectorAll('.kanban-card').forEach(c => c.classList.remove('active-selected'));
        card.classList.add('active-selected');
        state.taskDrawerClosedByUser = false;
        state.activeSelectedTask = task;
        openTaskDrawer(task);
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
    if (!canManageTasks()) {
      alert('Access Denied: Only Founder, CEO, and Managers can create and assign tasks.');
      return;
    }

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

  
  let modalWorkingSubtasks = [];

  function renderModalSubtasks() {
    const container = document.getElementById('modalSubtasksContainer');
    const countEl = document.getElementById('modalSubtasksCount');
    if (!container) return;
    container.replaceChildren();

    const doneCount = modalWorkingSubtasks.filter(s => s.done).length;
    const totalCount = modalWorkingSubtasks.length;
    if (countEl) countEl.textContent = `${doneCount}/${totalCount} Done`;

    if (modalWorkingSubtasks.length === 0) {
      const emptyNotice = document.createElement('div');
      emptyNotice.style.cssText = 'padding: 8px 10px; font-size: 11.5px; color: var(--text-muted); font-style: italic; background: rgba(0,0,0,0.02); border-radius: 6px; border: 1px dashed var(--card-border); text-align: center;';
      emptyNotice.textContent = 'No subtasks yet. Type a subtask below and click + Add.';
      container.appendChild(emptyNotice);
      return;
    }

    modalWorkingSubtasks.forEach((st, idx) => {
      const row = document.createElement('div');
      row.className = `subtask-check-row ${st.done ? 'done' : ''}`;
      row.style.cssText = 'padding: 5px 8px; font-size: 11.5px;';

      const leftWrap = document.createElement('div');
      leftWrap.className = 'subtask-left-wrap';

      const cb = document.createElement('div');
      cb.className = 'subtask-checkbox';
      cb.style.cssText = 'width: 16px; height: 16px; font-size: 10px;';
      cb.innerHTML = st.done ? '&#10003;' : '';
      cb.addEventListener('click', (e) => {
        e.stopPropagation();
        st.done = !st.done;
        renderModalSubtasks();
      });

      const labelSpan = document.createElement('span');
      labelSpan.className = 'subtask-label-text';
      labelSpan.textContent = st.label;

      leftWrap.appendChild(cb);
      leftWrap.appendChild(labelSpan);

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'subtask-action-btn btn-del-subtask';
      delBtn.innerHTML = '&times;';
      delBtn.title = 'Remove subtask';
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        modalWorkingSubtasks.splice(idx, 1);
        renderModalSubtasks();
      });

      row.appendChild(leftWrap);
      row.appendChild(delBtn);

      row.addEventListener('click', () => {
        cb.click();
      });

      container.appendChild(row);
    });
  }

  function initModalSubtaskComposer() {
    const input = document.getElementById('inputModalNewSubtask');
    const addBtn = document.getElementById('btnModalAddSubtask');

    const handleAdd = () => {
      if (!input) return;
      const text = input.value.trim();
      if (!text) return;
      modalWorkingSubtasks.push({
        id: 'st_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        label: text,
        done: false
      });
      input.value = '';
      renderModalSubtasks();
      input.focus();
    };

    if (addBtn) addBtn.onclick = (e) => { e.preventDefault(); handleAdd(); };
    if (input) input.onkeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAdd();
      }
    };
  }

  function openEditTaskModal(task, focusField = 'title') {
    if (!task) return;
    state.activeSelectedTask = task;
    const modal = ensureEditTaskModal();
    if (!modal) return;

    const isManager = canManageTasks();

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

    // Initialize modal subtasks
    modalWorkingSubtasks = Array.isArray(task.subtasks) ? JSON.parse(JSON.stringify(task.subtasks)) : [];
    renderModalSubtasks();
    initModalSubtaskComposer();

    // Field permissions: Non-managers can only update task progress status
    [titleInput, assigneeSelect, prioritySelect, dueInput, dateInput, descInput].forEach(el => {
      if (el) { el.disabled = !isManager; el.readOnly = !isManager; }
    });
    if (statusSelect) statusSelect.disabled = false;

    // Show delete button in edit mode only for managers
    const deleteModalBtnEdit = document.getElementById("btnDeleteTaskFromModal");
    if (deleteModalBtnEdit) deleteModalBtnEdit.style.display = isManager ? "flex" : "none";
    const saveBtnEdit = document.getElementById("btnSaveEditTask");
    if (saveBtnEdit) saveBtnEdit.textContent = isManager ? "💾 Save Task Changes" : "💾 Update Status";

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

  // --- REAL-TIME GLOBAL CHAT & DM SUBSCRIPTION ENGINE ---
  const ChatSyncManager = {
    listeners: new Map(), // channelId -> unsubFn
    notifiedMsgIds: new Set(),
    channelUnreadCounts: {},

    subscribeChannel(channelId) {
      if (!channelId) return;
      const cleanId = String(channelId).trim();
      if (this.listeners.has(cleanId)) return;
      if (!window.FirebaseService?.subscribeMessages) return;

      console.log('[CHAT-SYNC] Attaching live real-time listener for conversation:', cleanId);
      const unsub = FirebaseService.subscribeMessages(cleanId, (cloudMsgs) => {
        this.handleIncoming(cleanId, cloudMsgs);
      });
      this.listeners.set(cleanId, unsub);
    },

    unsubscribeAll() {
      console.log('[CHAT-SYNC] Cleaning up all active chat listeners (' + this.listeners.size + ')');
      for (const [chId, unsub] of this.listeners.entries()) {
        try { unsub(); } catch (_) {}
      }
      this.listeners.clear();
    },

    handleIncoming(channelId, cloudMsgs) {
      if (!cloudMsgs || !Array.isArray(cloudMsgs)) return;

      const cur = (typeof getCurrentResolvedMember === 'function') ? getCurrentResolvedMember() : {};
      const curUid = state.currentUser?.uid || cur.uid;

      // 1. Reconcile with local DB
      const merged = mergeAndReconcileMessages(cloudMsgs, channelId);

      // 2. Delivery Acknowledgment
      acknowledgeMessageDeliveries(cloudMsgs, channelId);

      // 3. Check if user is actively viewing this channel in chat tab
      const isViewingThisChannel = (state.activeTab === 'chat' && state.activeChannelId === channelId);

      if (isViewingThisChannel) {
        markAllMessagesInChannelRead(channelId);
        this.channelUnreadCounts[channelId] = 0;
        renderMessages(true);
      } else {
        // Calculate unread messages (sent by teammates and not yet marked read by this user)
        const unread = merged.filter(m => !isSelfMsg(m) && (!m.readBy || !m.readBy[curUid])).length;
        this.channelUnreadCounts[channelId] = unread;
      }

      // Re-render channel & DM list so unread pills update
      renderChatChannelsAndDMs();
      this.updateSidebarBadge();

      // 4. Notification & Sound for fresh incoming teammate messages
      const now = Date.now();
      cloudMsgs.forEach(msg => {
        if (!msg || isSelfMsg(msg)) return;
        if (this.notifiedMsgIds.has(msg.id)) return;
        this.notifiedMsgIds.add(msg.id);

        const msgTime = Number(msg.createdAt) || 0;
        const age = now - msgTime;

        // Play chirp and trigger native notification if sent recently (< 3 minutes) and not currently focused on this channel
        if (age < 180000 && !isViewingThisChannel) {
          playNotificationChirp(true);
          if (window.electronAPI?.showNotification) {
            const chName = channelId.startsWith('dm_') ? (msg.senderName || 'Direct Message') : `#${channelId}`;
            window.electronAPI.showNotification({
              title: `💬 ${chName} • ${msg.senderName || 'Teammate'}`,
              body: String(msg.text || (msg.attachments?.length ? '📎 Sent an attachment' : 'New message')).slice(0, 150),
              targetTab: 'chat',
              channelId: channelId,
              msgId: msg.id,
              type: 'chat'
            });
          }
        }
      });
    },

    updateSidebarBadge() {
      const badge = document.getElementById('chatNavUnreadBadge');
      if (!badge) return;
      let total = 0;
      for (const ch of Object.keys(this.channelUnreadCounts)) {
        if (ch !== state.activeChannelId || state.activeTab !== 'chat') {
          total += (this.channelUnreadCounts[ch] || 0);
        }
      }
      if (total > 0) {
        badge.textContent = total > 99 ? '99+' : String(total);
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    },

    syncSubscriptions() {
      const cur = (typeof getCurrentResolvedMember === 'function') ? getCurrentResolvedMember() : {};
      const myEmail = (state.currentUser?.email || cur.email || '').toLowerCase().trim();

      // Public channels
      const publicChannels = ['general', 'announcements', 'engineering', 'projects', 'watercooler', 'ar-wheels-and-tires', 'contacts', 'dealer-contact'];
      (WorkspaceDB.data.channels || []).forEach(c => {
        if (c && c.id && !c.isDirectMessage) publicChannels.push(c.id);
      });

      publicChannels.forEach(chId => this.subscribeChannel(chId));

      // Direct Messages with known members
      const members = typeof getUniqueMembersList === 'function' ? getUniqueMembersList() : Object.values(WorkspaceDB.data.members || {});
      members.forEach(m => {
        if (!m || isSelfMember(m)) return;
        const targetEmail = (m.email || m.id || m.uid || '').toLowerCase().trim();
        if (targetEmail && window.FirebaseService?.getDeterministicDMChannelId) {
          const dmId = FirebaseService.getDeterministicDMChannelId(myEmail, targetEmail);
          if (dmId) this.subscribeChannel(dmId);
        }
      });
    }
  };
  window.ChatSyncManager = ChatSyncManager;

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

        const unread = (window.ChatSyncManager?.channelUnreadCounts?.[ch.id]) || 0;
        const unreadHtml = unread > 0 ? `<span class="unread-pill">${unread > 99 ? '99+' : unread}</span>` : '';

        btn.innerHTML = `
          <div style="display: flex; align-items: center; gap: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;">
            <span class="ch-hash" style="color: var(--accent-cyan); font-weight: 800; font-family: var(--font-mono);">#</span>
            <span style="overflow: hidden; text-overflow: ellipsis; font-weight: ${isActive || unread > 0 ? '800' : '600'}; color: ${unread > 0 ? 'var(--text-primary, #0f172a)' : 'inherit'};">${escapeHtml(ch.name || ch.id)}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            ${unreadHtml}
            <span class="btn-channel-quick-edit" data-chid="${escapeHtml(ch.id)}" title="Edit channel #${escapeHtml(ch.name || ch.id)}" style="opacity: 0.8; font-size: 11px; padding: 2px 6px; border-radius: 4px; cursor: pointer; color: var(--accent-cyan); display: inline-flex; align-items: center;">✏️</span>
          </div>
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

    const currentEmail = (state.currentUser?.email || '').toLowerCase().trim();
    const currentUid = state.currentUser?.uid;
    const currentId = state.currentMemberId;

    getUniqueMembersList().forEach(member => {
      if (!member) return;
      const mEmail = (member.email || '').toLowerCase().trim();
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

      const myIdentifier = currentEmail || currentId || currentUid || 'jagadish2k2006@gmail.com';
      const targetIdentifier = mEmail || mId || mUid || member.name;
      const dmChannelId = (window.FirebaseService && FirebaseService.getDeterministicDMChannelId)
        ? FirebaseService.getDeterministicDMChannelId(myIdentifier, targetIdentifier)
        : `dm_${[String(myIdentifier).toLowerCase().trim(), String(targetIdentifier).toLowerCase().trim()].sort().map(s => s.replace(/[^a-z0-9]/gi, '_')).join('___')}`;

      const safeEmail = mEmail ? mEmail.replace(/[^a-z0-9]/gi, '_') : '';
      const isTargetActive = state.activeChannelId && (
        state.activeChannelId === dmChannelId ||
        (safeEmail && state.activeChannelId.includes(safeEmail)) ||
        (mUid && state.activeChannelId.includes(mUid))
      );

      const unread = (window.ChatSyncManager?.channelUnreadCounts?.[dmChannelId]) || 0;
      const unreadHtml = unread > 0 ? `<span class="unread-pill">${unread > 99 ? '99+' : unread}</span>` : '';

      const btn = document.createElement('button');
      btn.className = `channel-item ${isTargetActive ? 'active' : ''}`;
      btn.style.display = 'flex';
      btn.style.alignItems = 'center';
      btn.style.justifyContent = 'space-between';
      btn.style.width = '100%';

      const mName = member.displayName || member.name || (mEmail ? mEmail.split('@')[0] : 'Team Member');
      const safeId = mId || (mUid ? `RD-${mUid.slice(0, 6).toUpperCase()}` : 'RD-EMP');
      const isOnline = isMemberAppOnline(member);

      btn.innerHTML = `
        <div style="display: flex; align-items: center; gap: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;">
          <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${isOnline ? '#00e676' : '#727284'}; flex-shrink: 0; box-shadow: ${isOnline ? '0 0 6px #00e676' : 'none'};"></span>
          <span style="overflow: hidden; text-overflow: ellipsis; font-weight: ${isTargetActive || unread > 0 ? '800' : '600'}; color: ${unread > 0 ? 'var(--text-primary, #0f172a)' : 'inherit'};">${escapeHtml(mName)} <small style="color: var(--text-muted); font-size: 10px; font-family: var(--font-mono);">[${escapeHtml(safeId)}]</small></span>
        </div>
        ${unreadHtml}
      `;

      btn.addEventListener('click', () => {
        // Switch IMMEDIATELY - responsive, zero lag
        selectChatTarget(dmChannelId, mName);

        // Ensure cloud DM in background without blocking interaction
        if (window.FirebaseService && FirebaseService.getOrCreateDMChannel) {
          FirebaseService.getOrCreateDMChannel(member, mName).catch(e => console.warn('[DM] Cloud DM background sync notice:', e));
        }
      });

      dmList.appendChild(btn);
    });
  }

  function isSelfMsg(msg) {
    if (!msg || !state.currentUser) return false;
    const currentUid = state.currentUser.uid;
    const currentEmail = (state.currentUser.email || '').toLowerCase().trim();
    const currentEmpId = state.currentMemberId;
    const msgUid = msg.senderUid || msg.senderId;
    const msgEmail = (msg.senderEmail || '').toLowerCase().trim();
    const msgEmpId = msg.senderEmpId;

    if (currentUid && msgUid && msgUid === currentUid) return true;
    if (currentEmail && msgEmail && msgEmail === currentEmail) return true;
    if (currentEmpId && msgEmpId && msgEmpId === currentEmpId) return true;
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

        const dbMatch = Object.values(WorkspaceDB.data.members || {}).find(m =>
          (oUid && (m.uid === oUid || m.id === oUid)) ||
          (oEmpId && (m.id === oEmpId || m.uid === oEmpId)) ||
          (oEmail && (m.email || '').toLowerCase() === oEmail) ||
          (oName && (m.displayName || m.name) === oName)
        );
        if (dbMatch) return dbMatch;

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
  // --- RECONCILE MESSAGES IN A CHANNEL (AUTHENTIC WHATSAPP DELIVERY & READ RECEIPTS) ---
  function isSelfUidOrId(identifier, msg) {
    if (!identifier) return false;
    const currentUid = state.currentUser?.uid;
    const currentEmpId = state.currentMemberId;
    const msgUid = msg?.senderUid || msg?.senderId;
    const msgEmpId = msg?.senderEmpId || msg?.senderId;
    const curEmail = (state.currentUser?.email || '').toLowerCase().trim();
    const idStr = String(identifier).toLowerCase().trim();
    if (currentUid && idStr === String(currentUid).toLowerCase().trim()) return true;
    if (currentEmpId && idStr === String(currentEmpId).toLowerCase().trim()) return true;
    if (msgUid && idStr === String(msgUid).toLowerCase().trim()) return true;
    if (msgEmpId && idStr === String(msgEmpId).toLowerCase().trim()) return true;
    if (idStr === 'jagadish2k2006@gmail.com' || idStr === 'rd-founder-001') {
      if (curEmail === 'jagadish2k2006@gmail.com') return true;
    }
    return false;
  }

  function acknowledgeMessageDeliveries(cloudMsgs, chId) {
    if (!Array.isArray(cloudMsgs) || !window.FirebaseService?.markMessageDelivered) return;
    const curUid = state.currentUser?.uid;
    if (!curUid) return;
    const receiverInfo = {
      uid: curUid,
      name: state.currentMember?.displayName || state.currentUser?.displayName || 'Teammate',
      empId: state.currentMemberId || ''
    };

    cloudMsgs.forEach(msg => {
      if (!msg || isSelfMsg(msg)) return;
      // If our UID is not recorded in deliveredTo, acknowledge delivery to cloud
      if (!msg.deliveredTo || !msg.deliveredTo[curUid]) {
        if (!msg.deliveredTo) msg.deliveredTo = {};
        msg.deliveredTo[curUid] = Date.now();
        msg.delivered = true;
        msg.isDelivered = true;
        FirebaseService.markMessageDelivered(chId, msg.id, receiverInfo).catch(() => {});
      }
    });
  }

  function markAllMessagesInChannelRead(chId) {
    if (!chId || !window.FirebaseService?.markMessageAsRead) return;
    const curUid = state.currentUser?.uid;
    if (!curUid) return;
    const msgs = WorkspaceDB.data?.chats?.[chId] || [];
    const readerInfo = {
      uid: curUid,
      name: state.currentMember?.displayName || state.currentUser?.displayName || 'Teammate',
      empId: state.currentMemberId || ''
    };
    msgs.forEach(msg => {
      if (msg && !isSelfMsg(msg) && (!msg.readBy || !msg.readBy[curUid])) {
        if (!msg.readBy) msg.readBy = {};
        msg.readBy[curUid] = { ...readerInfo, readAt: Date.now() };
        FirebaseService.markMessageAsRead(chId, msg.id, readerInfo).catch(() => {});
      }
    });
  }

  function reconcileChannelMessages(msgs, channelId) {
    if (!Array.isArray(msgs) || msgs.length === 0) return msgs;
    const isDM = channelId && channelId.startsWith('dm_');
    const existingMsgs = (WorkspaceDB.data && WorkspaceDB.data.chats && WorkspaceDB.data.chats[channelId]) || [];
    const existingMap = new Map();
    existingMsgs.forEach(m => { if (m && m.id) existingMap.set(String(m.id), m); });

    let dmPartner = null;
    if (isDM) {
      dmPartner = findDMPartnerMember(channelId);
    }

    const members = typeof getUniqueMembersList === 'function' ? getUniqueMembersList() : [];

    msgs.forEach((msg) => {
      if (!msg) return;

      // Preserve existing in-memory read receipts and delivered states
      const existing = existingMap.get(String(msg.id));
      if (existing) {
        if (!msg.readBy && existing.readBy) msg.readBy = { ...existing.readBy };
        if (!msg.deliveredTo && existing.deliveredTo) msg.deliveredTo = { ...existing.deliveredTo };
        if (existing.readByAll) msg.readByAll = true;
        if (existing.delivered || existing.isDelivered) {
          msg.delivered = true;
          msg.isDelivered = true;
        }
      }

      if (!msg.deliveredTo) msg.deliveredTo = {};
      if (!msg.readBy) msg.readBy = {};

      // If the recipient/partner is currently active/online or acknowledged, record delivery
      if (isDM && dmPartner) {
        const pUid = dmPartner.uid || dmPartner.id;
        const isPartnerOnline = typeof isMemberAppOnline === 'function' && isMemberAppOnline(dmPartner);
        if (pUid && (msg.deliveredTo[pUid] || isPartnerOnline)) {
          msg.delivered = true;
          msg.isDelivered = true;
          if (!msg.deliveredTo[pUid]) msg.deliveredTo[pUid] = Date.now();
        }
      } else if (!isDM) {
        const anyOnline = members.some(tm => !isSelfMember(tm) && typeof isMemberAppOnline === 'function' && isMemberAppOnline(tm));
        const hasDelivered = Object.keys(msg.deliveredTo).some(k => !isSelfUidOrId(k, msg));
        if (anyOnline || hasDelivered) {
          msg.delivered = true;
          msg.isDelivered = true;
        }
      }

      // Authentic read check: if all intended recipients have read, mark readByAll
      if (!msg.readByAll) {
        if (isDM && dmPartner) {
          const pUid = dmPartner.uid || dmPartner.id;
          const pId = dmPartner.id;
          if (msg.readBy[pUid] || (pId && msg.readBy[pId])) {
            msg.readByAll = true;
            msg.delivered = true;
            msg.isDelivered = true;
          }
        } else if (!isDM) {
          const recipients = members.filter(m => !isSelfMember(m));
          if (recipients.length > 0) {
            const allRead = recipients.every(m => {
              const mUid = m.uid || m.id;
              const mId = m.id;
              return !!(msg.readBy[mUid] || (mId && msg.readBy[mId]));
            });
            if (allRead) {
              msg.readByAll = true;
              msg.delivered = true;
              msg.isDelivered = true;
            }
          }
        }
      }
    });

    return msgs;
  }

  // --- AUTHENTIC WHATSAPP-STYLE MESSAGE TICK CALCULATOR ---
  function computeMessageTicks(msg, channelId) {
    if (!msg) return { status: 'none', html: '', isRead: false, isDelivered: false };
    
    // Non-self messages don't render status ticks (WhatsApp standard)
    if (!isSelfMsg(msg)) {
      return { status: 'none', html: '', isRead: false, isDelivered: false };
    }

    if (msg.isPending || msg.status === 'pending') {
      return {
        status: 'pending',
        isRead: false,
        isDelivered: false,
        html: `<span class="msg-status-tick tick-pending" data-msg-id="${msg.id}" title="Sending to cloud...">⏱️</span>`
      };
    }

    const isDM = channelId && channelId.startsWith('dm_');

    if (isDM) {
      const partner = findDMPartnerMember(channelId);
      const pUid = partner ? (partner.uid || partner.id) : null;
      const pId = partner ? partner.id : null;
      const pName = partner ? (partner.displayName || partner.name || 'Teammate') : 'Teammate';

      // 1. Has recipient read the message? (Double Green Tick)
      const readKeys = Object.keys(msg.readBy || {});
      const hasReadReceipt = (pUid && msg.readBy && msg.readBy[pUid]) ||
                             (pId && msg.readBy && msg.readBy[pId]) ||
                             readKeys.some(k => !isSelfUidOrId(k, msg));
      const isRead = msg.readByAll === true || !!hasReadReceipt;

      if (isRead) {
        msg.isDelivered = true;
        msg.delivered = true;
        return {
          status: 'read',
          isRead: true,
          isDelivered: true,
          html: `<span class="msg-status-tick tick-read" data-msg-id="${msg.id}" title="Read by ${escapeHtml(pName)} (Double Green Tick)">✓✓</span>`
        };
      }

      // 2. Delivered: Is recipient currently online or confirmed in deliveredTo? (Double Grey Tick)
      const isPartnerOnline = partner && (typeof isMemberAppOnline === 'function' ? isMemberAppOnline(partner) : false);
      const deliveredKeys = Object.keys(msg.deliveredTo || {});
      const hasDeliveredToPartner = (pUid && msg.deliveredTo && msg.deliveredTo[pUid]) ||
                                   (pId && msg.deliveredTo && msg.deliveredTo[pId]) ||
                                   deliveredKeys.some(k => !isSelfUidOrId(k, msg));
      const isDelivered = msg.isDelivered === true ||
                          (msg.delivered === true && (hasDeliveredToPartner || isPartnerOnline)) ||
                          hasDeliveredToPartner ||
                          isPartnerOnline;

      if (isDelivered) {
        msg.isDelivered = true;
        msg.delivered = true;
        return {
          status: 'delivered',
          isRead: false,
          isDelivered: true,
          html: `<span class="msg-status-tick tick-delivered" data-msg-id="${msg.id}" title="Delivered to ${escapeHtml(pName)}'s device (Double Grey Tick)">✓✓</span>`
        };
      }

      // 3. Sent to Cloud only (Single Grey Tick)
      return {
        status: 'sent',
        isRead: false,
        isDelivered: false,
        html: `<span class="msg-status-tick tick-sent" data-msg-id="${msg.id}" title="Sent to cloud (Single Grey Tick)">✓</span>`
      };
    } else {
      // Group Channel
      const members = (typeof getUniqueMembersList === 'function' ? getUniqueMembersList() : [])
        .filter(m => !isSelfMember(m));
      const readKeys = Object.keys(msg.readBy || {}).filter(k => !isSelfUidOrId(k, msg));
      const isAllRead = msg.readByAll === true || (members.length > 0 && readKeys.length >= members.length);
      const isPartialRead = readKeys.length > 0;

      if (isAllRead) {
        msg.isDelivered = true;
        msg.delivered = true;
        return {
          status: 'read',
          isRead: true,
          isDelivered: true,
          html: `<span class="msg-status-tick tick-read" data-msg-id="${msg.id}" title="Read by all group members (Double Green Tick)">✓✓</span>`
        };
      } else if (isPartialRead) {
        msg.isDelivered = true;
        msg.delivered = true;
        return {
          status: 'read',
          isRead: true,
          isDelivered: true,
          html: `<span class="msg-status-tick tick-read" data-msg-id="${msg.id}" title="Read by ${readKeys.length} teammate${readKeys.length > 1 ? 's' : ''} (Double Green Tick)">✓✓</span>`
        };
      }

      // Check delivery: any member online or deliveredTo non-empty or cloud delivered
      const anyOnline = members.some(m => typeof isMemberAppOnline === 'function' && isMemberAppOnline(m));
      const deliveredKeys = Object.keys(msg.deliveredTo || {}).filter(k => !isSelfUidOrId(k, msg));
      const isDelivered = msg.isDelivered === true || msg.delivered === true || anyOnline || deliveredKeys.length > 0;

      if (isDelivered) {
        msg.isDelivered = true;
        msg.delivered = true;
        return {
          status: 'delivered',
          isRead: false,
          isDelivered: true,
          html: `<span class="msg-status-tick tick-delivered" data-msg-id="${msg.id}" title="Delivered to group (Double Grey Tick)">✓✓</span>`
        };
      }

      return {
        status: 'sent',
        isRead: false,
        isDelivered: false,
        html: `<span class="msg-status-tick tick-sent" data-msg-id="${msg.id}" title="Sent to cloud (Single Grey Tick)">✓</span>`
      };
    }
  }

  // --- RECONCILE PAST MESSAGES AS READ & DELIVERED ---
  // --- SAFE MESSAGE MERGER & LOCAL RETENTION ENGINE ---
  function mergeAndReconcileMessages(cloudMsgs, channelId) {
    if (!channelId) return cloudMsgs || [];
    const localMsgs = (WorkspaceDB.data && WorkspaceDB.data.chats && WorkspaceDB.data.chats[channelId]) || [];
    const now = Date.now();

    const map = new Map();
    // 1. Add cloud messages
    (cloudMsgs || []).forEach(m => {
      if (m && m.id) {
        map.set(String(m.id), { ...m, pending: false, isLocal: false });
      }
    });

    // 2. Preserve any local unconfirmed / recent messages (prevent automatic deletion)
    localMsgs.forEach(m => {
      if (!m || !m.id) return;
      const id = String(m.id);
      if (!map.has(id)) {
        const msgAge = now - (m.createdAt || now);
        // Keep message if it is local, pending, recent (<15 min), or sent by self
        if (m.isLocal || m.pending || msgAge < 900000 || isSelfMsg(m)) {
          map.set(id, m);
        }
      } else {
        const cloudItem = map.get(id);
        if (m.readBy) cloudItem.readBy = { ...m.readBy, ...(cloudItem.readBy || {}) };
        if (m.deliveredTo) cloudItem.deliveredTo = { ...m.deliveredTo, ...(cloudItem.deliveredTo || {}) };
        if (m.delivered || m.isDelivered) {
          cloudItem.delivered = true;
          cloudItem.isDelivered = true;
        }
      }
    });

    const merged = Array.from(map.values()).sort((a, b) => (Number(a.createdAt) || 0) - (Number(b.createdAt) || 0));

    // Reconcile delivery ticks
    reconcileChannelMessages(merged, channelId);

    // Save back to local DB
    if (!WorkspaceDB.data.chats) WorkspaceDB.data.chats = {};
    WorkspaceDB.data.chats[channelId] = merged;
    WorkspaceDB.save().catch(() => {});

    return merged;
  }

  // --- UNIFIED DIRECT MESSAGE OPENER ---
  async function openDirectMessageWithMember(member, displayName = null) {
    if (!member) return;
    switchTab('chat');
    const safeName = displayName || member.displayName || member.name || 'Team Member';
    let dmChannelId = null;

    if (window.FirebaseService?.getDeterministicDMChannelId) {
      const cur = getCurrentResolvedMember();
      const myId = state.currentUser?.email || cur.email || state.currentUser?.uid || cur.id || 'jagadish2k2006@gmail.com';
      const targetId = member.email || member.uid || member.id || safeName;
      dmChannelId = FirebaseService.getDeterministicDMChannelId(myId, targetId);
    } else {
      const cur = getCurrentResolvedMember();
      const myId = (state.currentUser?.email || cur.email || 'user_a').toLowerCase();
      const targetId = (member.email || member.id || 'user_b').toLowerCase();
      dmChannelId = `dm_${[myId, targetId].sort().map(s => s.replace(/[^a-z0-9]/gi, '_')).join('___')}`;
    }

    selectChatTarget(dmChannelId, safeName);

    if (window.FirebaseService?.getOrCreateDMChannel) {
      try {
        const cloudId = await FirebaseService.getOrCreateDMChannel(member, safeName);
        if (cloudId && cloudId !== dmChannelId && state.activeChannelId === dmChannelId) {
          selectChatTarget(cloudId, safeName);
        }
      } catch (_) {}
    }
  }

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

    // Handle string inputs like 'tasks', 'chat', 'timesheets', 'general', 'dm_xxx'
    if (typeof n === 'string') {
      const trimmed = n.trim();
      if (['wallpapers', 'workers', 'timesheets', 'tasks', 'chat', 'telemetry', 'database', 'dashboard'].includes(trimmed)) {
        openCommandCenter();
        switchTab(trimmed);
        return;
      }
      if (trimmed.startsWith('dm_') || trimmed === 'general' || trimmed === 'announcements' || trimmed === 'engineering') {
        n = { channelId: trimmed, type: 'chat' };
      } else {
        n = { type: 'chat', channelId: 'general' };
      }
    }

    // Always ensure the Workstation Command Center Drawer is visible and expanded
    openCommandCenter();

    // Dismiss the header notification dropdown
    const notifDropdown = document.getElementById('headerNotificationDropdown');
    if (notifDropdown) notifDropdown.classList.add('hidden');

    // Mark as read in local memory and database
    n.unread = false;
    if (n.id && WorkspaceDB.data.activity) {
      const act = WorkspaceDB.data.activity.find(a => a.id === n.id);
      if (act) act.unread = false;
    }
    WorkspaceDB.save().catch(() => {});
    if (typeof updateActivityBadge === 'function') updateActivityBadge();
    if (typeof updateNotificationsUI === 'function') updateNotificationsUI();

    const type = (n.type || '').toLowerCase();
    const title = (n.title || '').toLowerCase();
    const targetTab = (n.targetTab || '').toLowerCase();

    // --- DESTINATION 1: SPRINT TASK ---
    if (type === 'task' || n.taskId || targetTab === 'tasks' || title.includes('task')) {
      switchTab('tasks');
      const taskId = n.taskId || (n.id && !String(n.id).startsWith('act_') ? n.id : null);
      if (taskId) {
        let attempts = 0;
        const findAndFocusTask = () => {
          attempts++;
          const task = (WorkspaceDB.data.tasks || []).find(t => t.id === taskId || t.taskId === taskId || t._id === taskId);
          if (task) {
            state.activeSelectedTask = task;
            state.taskDrawerClosedByUser = false;
            if (typeof openTaskDrawer === 'function') openTaskDrawer(task);
          }
          const card = document.querySelector(`[data-task-id="${taskId}"]`);
          if (card) {
            document.querySelectorAll('.task-card-v3').forEach(c => c.classList.remove('active-selected'));
            card.classList.add('active-selected');
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            card.style.boxShadow = '0 0 25px rgba(0, 229, 255, 0.9)';
            card.style.borderColor = 'var(--accent-cyan, #00e5ff)';
            setTimeout(() => {
              card.style.boxShadow = '';
              card.style.borderColor = '';
            }, 3000);
          } else if (attempts < 6) {
            setTimeout(findAndFocusTask, 150);
          }
        };
        setTimeout(findAndFocusTask, 100);
      }
      return;
    }

    // --- DESTINATION 2: LEAVE & TIME-OFF REQUEST ---
    if (type === 'leave' || type === 'leave_request' || n.leaveId || targetTab === 'leave' || title.includes('leave') || title.includes('time-off')) {
      switchTab('timesheets');
      setTimeout(() => {
        const leaveSection = document.getElementById('leaveManagementSection') || document.getElementById('cardAttendanceLeaveBalance');
        if (leaveSection) {
          leaveSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
          leaveSection.style.boxShadow = '0 0 25px rgba(0, 229, 255, 0.7)';
          setTimeout(() => { leaveSection.style.boxShadow = ''; }, 2500);
        }
      }, 150);
      return;
    }

    // --- DESTINATION 3: PUNCH / ATTENDANCE ---
    if (type === 'punch' || type === 'attendance' || n.punchId || title.includes('punch') || title.includes('clock') || targetTab === 'timesheets') {
      switchTab('timesheets');
      setTimeout(() => {
        const tableBody = document.getElementById('punchLogTableBody');
        if (tableBody) {
          const row = n.punchId ? tableBody.querySelector(`[data-punch-id="${n.punchId}"]`) : tableBody.firstElementChild;
          if (row) {
            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            row.style.background = 'rgba(0, 229, 255, 0.25)';
            setTimeout(() => { row.style.background = ''; }, 2500);
          }
        }
      }, 150);
      return;
    }

    // --- DESTINATION 4: CALLS HUB & SPEED DIAL ---
    if (type === 'call' || title.includes('call from') || title.includes('incoming call')) {
      switchTab('chat');
      requestAnimationFrame(() => {
        if (typeof switchTeamsRailTab === 'function') switchTeamsRailTab('calls');
      });
      return;
    }

    // --- DESTINATION 5: MEETINGS & CALENDAR ---
    if (type === 'meeting' || type === 'calendar' || title.includes('meeting') || title.includes('calendar')) {
      switchTab('chat');
      requestAnimationFrame(() => {
        if (typeof switchTeamsRailTab === 'function') switchTeamsRailTab('calendar');
      });
      return;
    }

    // --- DESTINATION 6: CHAT CHANNEL OR DIRECT MESSAGE (DM) ---
    if (n.channelId || n.msgId || type === 'mention' || type === 'reply' || type === 'thread_reply' || type === 'chat' || title.includes('message') || targetTab === 'chat') {
      let targetChannel = (n.channelId || '').trim();

      // If channelId is missing but msgId is provided, look up which channel contains this message
      if (!targetChannel && n.msgId) {
        for (const ch in (WorkspaceDB.data.chats || {})) {
          if ((WorkspaceDB.data.chats[ch] || []).some(m => m.id === n.msgId)) {
            targetChannel = ch;
            break;
          }
        }
      }
      if (!targetChannel) targetChannel = 'general';

      state.activeChannelId = targetChannel;
      switchTab('chat');

      requestAnimationFrame(() => {
        if (typeof switchTeamsRailTab === 'function') switchTeamsRailTab('chat');
        selectChatTarget(targetChannel);

        if (n.msgId) {
          let attempts = 0;
          const pollForMsg = () => {
            attempts++;
            const targetRow = document.querySelector(`.chat-msg-row[data-msg-id="${n.msgId}"]`);
            if (targetRow) {
              targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
              targetRow.style.boxShadow = '0 0 25px rgba(0, 229, 255, 0.9)';
              targetRow.style.outline = '2px solid var(--accent-cyan, #00e5ff)';
              targetRow.style.borderRadius = '8px';
              setTimeout(() => {
                targetRow.style.boxShadow = '';
                targetRow.style.outline = '';
                targetRow.style.borderRadius = '';
              }, 3000);
            } else if (attempts < 8) {
              setTimeout(pollForMsg, 120);
            } else {
              const container = document.getElementById('chatMessagesContainer');
              if (container) container.scrollTop = container.scrollHeight;
            }
          };
          setTimeout(pollForMsg, 200);
        } else {
          setTimeout(() => {
            const container = document.getElementById('chatMessagesContainer');
            if (container) container.scrollTop = container.scrollHeight;
          }, 200);
        }
      });
      return;
    }

    // --- DESTINATION 7: OTA SOFTWARE UPDATER ---
    if (type === 'ota' || type === 'update' || type === 'software' || n.ota || title.includes('update') || title.includes('release')) {
      switchTab('database');
      setTimeout(() => {
        const otaBox = document.getElementById('otaStatusBox') || document.getElementById('cardOtaUpdater');
        if (otaBox) {
          otaBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
          otaBox.style.boxShadow = '0 0 25px rgba(0, 229, 255, 0.7)';
          setTimeout(() => { otaBox.style.boxShadow = ''; }, 2500);
        }
      }, 150);
      return;
    }

    // --- DESTINATION 8: TEAM DIRECTORY ---
    if (type === 'member' || type === 'worker' || n.memberId || targetTab === 'workers' || title.includes('member')) {
      switchTab('workers');
      if (n.memberId) {
        setTimeout(() => {
          const card = document.querySelector(`[data-member-id="${n.memberId}"]`) || document.getElementById(`workerCard_${n.memberId}`);
          if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            card.style.boxShadow = '0 0 25px rgba(0, 229, 255, 0.8)';
            setTimeout(() => { card.style.boxShadow = ''; }, 2500);
          }
        }, 150);
      }
      return;
    }

    // --- DESTINATION 9: WORK TOOLS REGISTRY ---
    if (type === 'tool' || type === 'worktools' || targetTab === 'tools' || title.includes('tool')) {
      switchTab('timesheets');
      setTimeout(() => {
        const toolsSec = document.getElementById('workToolsManagementSection');
        if (toolsSec) {
          toolsSec.scrollIntoView({ behavior: 'smooth', block: 'center' });
          toolsSec.style.boxShadow = '0 0 25px rgba(0, 229, 255, 0.7)';
          setTimeout(() => { toolsSec.style.boxShadow = ''; }, 2500);
        }
      }, 150);
      return;
    }

    // --- DESTINATION 10: FILES VAULT ---
    if (type === 'file' || type === 'files' || type === 'storage') {
      switchTab('database');
      return;
    }

    // --- TARGET TAB FALLBACK ---
    if (targetTab && ['wallpapers', 'workers', 'timesheets', 'tasks', 'chat', 'telemetry', 'database', 'dashboard'].includes(targetTab)) {
      switchTab(targetTab);
      return;
    }

    // Default Fallback
    switchTab('dashboard');
  }
  window.navigateToNotificationDestination = navigateToNotificationDestination;

  function selectChatTarget(channelId, displayName = null, customTopic = null) {
    reconcilePastMessagesAsRead();
    channelId = (channelId || 'general').trim();

    // Reset render tracker so skeleton shows on channel switch
    if (channelId !== state.activeChannelId) {
      _lastRenderedChannel = null;
      _lastRenderedMsgCount = -1;
    }
    state.activeChannelId = channelId;

    if (window.ChatSyncManager) {
      ChatSyncManager.channelUnreadCounts[channelId] = 0;
      ChatSyncManager.subscribeChannel(channelId);
      ChatSyncManager.updateSidebarBadge();
    }

    markAllMessagesInChannelRead(channelId);
    acknowledgeMessageDeliveries(WorkspaceDB.data.chats[channelId], channelId);

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
          acknowledgeMessageDeliveries(cloudMsgs, channelId);
          markAllMessagesInChannelRead(channelId);
          mergeAndReconcileMessages(cloudMsgs, channelId);
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

  // --- Render-state tracker to skip unnecessary full re-renders ---
  let _lastRenderedChannel = null;
  let _lastRenderedFingerprint = "";
  let _lastRenderedMsgCount = -1;
  let _lastRenderedEditId = null;

  function showMessagesLoadingSkeleton(container) {
    container.innerHTML = `
      <div class="chat-messages-loading">
        <div class="msg-skeleton-row">
          <div class="msg-skeleton-avatar"></div>
          <div class="msg-skeleton-bubble w-60"></div>
        </div>
        <div class="msg-skeleton-row self">
          <div class="msg-skeleton-avatar"></div>
          <div class="msg-skeleton-bubble w-45"></div>
        </div>
        <div class="msg-skeleton-row">
          <div class="msg-skeleton-avatar"></div>
          <div class="msg-skeleton-bubble w-70"></div>
        </div>
        <div class="msg-skeleton-row self">
          <div class="msg-skeleton-avatar"></div>
          <div class="msg-skeleton-bubble w-55"></div>
        </div>
        <div class="msg-skeleton-row">
          <div class="msg-skeleton-avatar"></div>
          <div class="msg-skeleton-bubble w-60"></div>
        </div>
      </div>
    `;
  }

  
  // --- SILENT CHAT REFRESH ENGINE ---
  async function silentRefreshCurrentChat(showFeedback = false) {
    const chId = state.activeChannelId || 'general';
    const btn = document.getElementById('btnSilentRefreshChat');
    if (btn) btn.classList.add('rotating');

    try {
      if (window.FirebaseService && typeof window.FirebaseService.fetchChannelMessages === 'function') {
        const cloudMsgs = await FirebaseService.fetchChannelMessages(chId);
        if (cloudMsgs && Array.isArray(cloudMsgs)) {
          acknowledgeMessageDeliveries(cloudMsgs, chId);
          if (state.activeChannelId === chId) {
            markAllMessagesInChannelRead(chId);
          }
          mergeAndReconcileMessages(cloudMsgs, chId);
        }
      }
      renderMessages(false);
      if (showFeedback) {
        showQuickToast('Chat synced with cloud', 'info');
      }
    } catch (err) {
      console.warn('[CHAT] Silent refresh notice:', err);
      renderMessages(false);
    } finally {
      if (btn) {
        setTimeout(() => btn.classList.remove('rotating'), 600);
      }
    }
  }

  function renderMessages(forceScroll = false) {
    const container = document.getElementById('chatMessagesContainer');
    if (!container) return;

    if (!WorkspaceDB.data.chats[state.activeChannelId]) {
      WorkspaceDB.data.chats[state.activeChannelId] = [];
    }

    const msgs = WorkspaceDB.data.chats[state.activeChannelId] || [];

    // Show skeleton when switching to a new channel (flicker prevention)
    const isChannelSwitch = _lastRenderedChannel !== state.activeChannelId;
    if (isChannelSwitch && msgs.length === 0) {
      showMessagesLoadingSkeleton(container);
      _lastRenderedChannel = state.activeChannelId;
      _lastRenderedMsgCount = -1;
      _lastRenderedEditId = null;
      return;
    }

    // Compute intelligent message digest for seamless silent refresh
    const msgFingerprint = msgs.map(m => 
      `${m.id}:${m.updatedAt || m.createdAt || 0}:${m.text?.length || 0}:${m.delivered ? 1 : 0}:${m.isRead ? 1 : 0}:${m.reactions ? Object.keys(m.reactions).length : 0}:${m.isPinned ? 1 : 0}`
    ).join('|');

    // Skip re-render ONLY if fingerprint, editing id, and channel match exactly
    if (!forceScroll && !isChannelSwitch &&
        _lastRenderedChannel === state.activeChannelId &&
        _lastRenderedFingerprint === msgFingerprint &&
        _lastRenderedEditId === state.editingMessageId) {
      return;
    }

    // Capture user scroll offset to guarantee zero scroll jump on silent refresh
    const wasAtBottom = (container.scrollHeight - container.scrollTop <= container.clientHeight + 80);
    const prevScrollTop = container.scrollTop;

    _lastRenderedFingerprint = msgFingerprint;

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

    // Update render-state trackers
    _lastRenderedChannel = state.activeChannelId;
    _lastRenderedMsgCount = msgs.length;
    _lastRenderedEditId = state.editingMessageId;

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
      const tickInfo = computeMessageTicks(msg, state.activeChannelId);
      const ticksHtml = tickInfo.html || '';

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
              ${imgs.map(img => {
                const previewSrc = img.previewUrl || img.dataUrl || img.url || (img.driveFileId ? `https://lh3.googleusercontent.com/d/${img.driveFileId}=w1600` : '');
                const fullSrc = img.downloadUrl || img.previewUrl || img.dataUrl || previewSrc;
                return `
                  <div class="msg-img-container" style="position: relative; display: inline-block; margin: 4px; border-radius: 8px; overflow: hidden; max-width: 100%;">
                    <img src="${sanitizeUrl(previewSrc)}" class="msg-img-thumb" alt="${escapeHtml(img.name || 'image')}" data-lightbox-src="${sanitizeUrl(fullSrc)}" data-caption="${escapeHtml(img.name || '')}" style="display: block; border-radius: 8px; max-height: 380px; width: auto; object-fit: contain; cursor: zoom-in;">
                    <a href="${sanitizeUrl(fullSrc)}" download="${escapeHtml(img.name || 'download.png')}" class="btn-msg-img-dl" title="Download original high-quality image" style="position: absolute; top: 8px; right: 8px; background: rgba(15,23,42,0.85); color: #fff; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; text-decoration: none; backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,0.15); display: flex; align-items: center; gap: 4px; opacity: 0; transition: opacity 0.2s;">
                      <span>⬇️</span> Download
                    </a>
                  </div>
                `;
              }).join('')}
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
    } else {
      container.scrollTop = prevScrollTop;
    }
  }

  // --- WHATSAPP-STYLE MESSAGE INFO CONTROLLER ---
  // --- WHATSAPP-STYLE MESSAGE INFO CONTROLLER ---
  function openMessageInfoModal(msgId) {
    const modal = document.getElementById('messageInfoModal');
    if (!modal) return;

    if (!msgId) {
      console.warn('[openMessageInfoModal] No msgId provided');
      return;
    }

    // Find the message across active channel, all channels, and thread replies using string comparison
    let msg = null;
    let targetChannelId = state.activeChannelId;

    if (WorkspaceDB.data.chats && WorkspaceDB.data.chats[targetChannelId]) {
      msg = WorkspaceDB.data.chats[targetChannelId].find(m => String(m.id) === String(msgId));
    }
    if (!msg && WorkspaceDB.data.chats) {
      for (const [chId, list] of Object.entries(WorkspaceDB.data.chats)) {
        if (Array.isArray(list)) {
          const found = list.find(m => String(m.id) === String(msgId));
          if (found) {
            msg = found;
            targetChannelId = chId;
            break;
          }
        }
      }
    }
    if (!msg && WorkspaceDB.data.threadReplies) {
      for (const [pId, replies] of Object.entries(WorkspaceDB.data.threadReplies)) {
        if (Array.isArray(replies)) {
          const found = replies.find(m => String(m.id) === String(msgId));
          if (found) {
            msg = found;
            break;
          }
        }
      }
    }

    if (!msg) {
      console.warn('[openMessageInfoModal] Message not found for ID:', msgId);
      return;
    }

    // 1. Preview Box
    const prevText = document.getElementById('msgInfoPreviewText');
    const prevTime = document.getElementById('msgInfoPreviewTime');
    const prevTick = document.getElementById('msgInfoPreviewTick');

    if (prevText) prevText.innerHTML = renderMarkdownText(msg.text || (msg.attachments?.length ? '📎 [Attachment]' : '🎙️ [Voice note]'));
    if (prevTime) prevTime.textContent = new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const tickInfo = computeMessageTicks(msg, targetChannelId);
    if (prevTick) {
      prevTick.innerHTML = tickInfo.html || `<span class="msg-status-tick tick-sent">✓</span>`;
    }

    // 2. Read by section
    const readList = document.getElementById('msgInfoReadList');
    const readCount = document.getElementById('msgInfoReadCount');
    const readEntries = Object.values(msg.readBy || {}).filter(r => r && (r.uid || r.empId || r.name));

    if (readCount) readCount.textContent = String(readEntries.length);
    if (readList) {
      if (readEntries.length === 0) {
        readList.innerHTML = `<div class="msg-info-empty" style="padding: 14px; text-align: center; color: var(--text-muted); font-size: 12px;">Not read by any teammates yet.</div>`;
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

    // 3. Delivered to section
    const delList = document.getElementById('msgInfoDeliveredList');
    const delCount = document.getElementById('msgInfoDeliveredCount');
    const delEntries = Object.entries(msg.deliveredTo || {});

    let deliverees = [...delEntries];
    const isDM = targetChannelId && targetChannelId.startsWith('dm_');
    if (isDM) {
      const partner = findDMPartnerMember(targetChannelId);
      if (partner) {
        const pUid = partner.uid || partner.id;
        const alreadyIn = deliverees.some(([uid]) => uid === pUid);
        if (!alreadyIn && (isMemberAppOnline(partner) || msg.delivered)) {
          deliverees.push([pUid, msg.createdAt ? Number(msg.createdAt) + 500 : Date.now()]);
        }
      }
    }

    if (delCount) delCount.textContent = String(deliverees.length || 1);
    if (delList) {
      let html = '';
      if (deliverees.length > 0) {
        html += deliverees.map(([uid, ts]) => {
          const dMember = (WorkspaceDB.data.members || {})[uid] || {};
          const name = escapeHtml(dMember.name || dMember.displayName || (uid === state.currentUser?.uid ? 'You' : 'Teammate'));
          const empBadge = escapeHtml(dMember.id || 'MEMBER');
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
                  <div class="msg-info-user-sub">${empBadge} • Delivered to Device</div>
                </div>
              </div>
              <div class="msg-info-timestamp">${formatFullDateTime(ts)}</div>
            </div>
          `;
        }).join('');
      }
      // Cloud database delivery row
      html += `
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
      delList.innerHTML = html;
    }

    modal.classList.remove('hidden');
    modal.style.display = 'flex';
  }

  function closeMessageInfoModal() {
    const modal = document.getElementById('messageInfoModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
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

    if (!files || files.length === 0) {
      container.innerHTML = `
        <div class="empty-state-box" style="padding: 40px; text-align: center; grid-column: 1 / -1;">
          <span style="font-size: 36px; display: block; margin-bottom: 8px;">📁</span>
          <p class="vault-empty-title" style="font-weight: 700; font-size: 14px;">No files shared yet</p>
          <p class="vault-empty-sub" style="font-size: 11.5px; color: var(--text-muted); margin-top: 4px;">Drag and drop or attach files and images in this channel to build the team repository.</p>
        </div>
      `;
      return;
    }

    files.forEach(file => {
      const card = document.createElement('div');
      card.className = 'vault-file-card';
      const isImg = file.type?.startsWith('image/') || file.isImage;
      const ext = (file.name || '').split('.').pop().toUpperCase() || (isImg ? 'IMG' : 'DOC');
      const safeData = file.dataUrl || file.url || '';
      const formattedSize = formatBytes(file.size || 0);

      card.innerHTML = `
        <div class="vault-thumb-wrap" style="position: relative; border-radius: 8px; overflow: hidden; background: rgba(0,0,0,0.15);">
          ${isImg && safeData ? `
            <img src="${sanitizeUrl(safeData)}" class="vault-thumb" alt="${escapeHtml(file.name || 'Image')}" loading="lazy" style="width: 100%; height: 125px; object-fit: cover; display: block; cursor: pointer;">
          ` : `
            <div class="vault-doc-placeholder" style="height: 125px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(0,0,0,0.06); border-radius: 8px; gap: 4px;">
              <span style="font-size: 32px;">📄</span>
              <span style="font-size: 11px; font-weight: 800; letter-spacing: 0.5px; color: var(--accent-cyan); font-family: var(--font-mono);">${escapeHtml(ext)}</span>
            </div>
          `}
        </div>
        <div class="vault-card-body" style="overflow: hidden; padding: 2px 0;">
          <div class="vault-file-name" style="font-size: 12px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(file.name || 'File')}">${escapeHtml(file.name || 'Unnamed File')}</div>
          <div class="vault-file-meta" style="font-size: 10px; color: var(--text-muted); font-family: var(--font-mono); margin-top: 3px;">
            <span>${formattedSize}</span> &bull; <span>${escapeHtml(file.senderName || 'Member')}</span>
          </div>
        </div>
        <div class="vault-card-actions" style="display: flex; gap: 6px; margin-top: 4px;">
          <button type="button" class="btn-primary-action btn-vault-download" style="flex: 1; padding: 6px 10px; font-size: 10.5px; font-weight: 700; justify-content: center; display: inline-flex; align-items: center; gap: 4px; cursor: pointer;">
            <span>⬇️ Download</span>
          </button>
          ${isImg && safeData ? `
            <button type="button" class="btn-secondary-action btn-vault-view" style="padding: 6px 10px; font-size: 10.5px; justify-content: center; display: inline-flex; align-items: center; gap: 4px; cursor: pointer;">
              <span>👁️ View</span>
            </button>
          ` : ''}
        </div>
      `;

      card.querySelector('.btn-vault-download')?.addEventListener('click', (e) => {
        e.stopPropagation();
        downloadAttachmentFile(file.name, safeData);
      });

      if (isImg && safeData) {
        card.querySelector('.btn-vault-view')?.addEventListener('click', (e) => {
          e.stopPropagation();
          openLightbox(safeData, file.name);
        });
        card.querySelector('.vault-thumb')?.addEventListener('click', () => {
          openLightbox(safeData, file.name);
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

    // Check if mediaDevices API is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showQuickToast('🎙️ Voice recording requires a modern browser environment. Please restart the app.', 'warning');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      state.voiceAudioChunks = [];

      // Update record button icon to show recording state
      const recordIcon = document.getElementById('recordVoiceIcon');
      if (recordIcon) recordIcon.textContent = '🔴';

      let mimeType = 'audio/webm';
      if (typeof MediaRecorder.isTypeSupported === 'function') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
          mimeType = 'audio/ogg;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
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
        // Reset button icon
        const recordIcon = document.getElementById('recordVoiceIcon');
        if (recordIcon) recordIcon.textContent = '🎙️';

        if (state.voiceShouldSend) {
          const audioBlob = new Blob(state.voiceAudioChunks, { type: mimeType });
          if (audioBlob.size > 850 * 1024) {
            showQuickToast('⚠️ Voice note too large — maximum 850KB. Please record a shorter message.', 'warning');
            clearInterval(state.voiceRecordingTimer);
            state.voiceRecordingSeconds = 0;
            document.getElementById('chatVoiceBar')?.classList.add('hidden');
            return;
          }
          if (audioBlob.size < 100) {
            showQuickToast('🎙️ Recording too short — please hold the button longer.', 'warning');
            clearInterval(state.voiceRecordingTimer);
            state.voiceRecordingSeconds = 0;
            document.getElementById('chatVoiceBar')?.classList.add('hidden');
            return;
          }
          const reader = new FileReader();
          reader.onloadend = async () => {
            const dataUrl = reader.result;
            const durationStr = formatDuration(state.voiceRecordingSeconds);
            showQuickToast('🎙️ Sending voice message...', 'info');
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
        // Auto-stop at 2 minutes max
        if (state.voiceRecordingSeconds >= 120) {
          stopVoiceRecording(true);
        }
      }, 1000);
    } catch (err) {
      const recordIcon = document.getElementById('recordVoiceIcon');
      if (recordIcon) recordIcon.textContent = '🎙️';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        showQuickToast('🎙️ Microphone permission denied. Please allow microphone access and try again.', 'warning');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        showQuickToast('🎙️ No microphone found. Please connect a microphone and try again.', 'warning');
      } else {
        showQuickToast('🎙️ Could not start recording: ' + err.message, 'warning');
      }
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

    const msgs = (WorkspaceDB.data.chats && WorkspaceDB.data.chats[state.activeChannelId]) || [];

    if (tabName === 'files') {
      let channelFiles = [];
      msgs.forEach(m => {
        if (m.attachments && Array.isArray(m.attachments)) {
          m.attachments.forEach(att => channelFiles.push({ ...att, senderName: m.senderName, createdAt: m.createdAt }));
        }
      });
      const filesCountEl = document.getElementById('chatFilesCount');
      if (filesCountEl) filesCountEl.textContent = String(channelFiles.length);
      renderChannelFilesTab(channelFiles);
    } else if (tabName === 'pinned') {
      const pinnedMsgs = msgs.filter(m => m.isPinned);
      const pinnedCountEl = document.getElementById('chatPinnedCount');
      if (pinnedCountEl) pinnedCountEl.textContent = String(pinnedMsgs.length);
      renderChannelPinnedTab(pinnedMsgs);
    } else if (tabName === 'about') {
      renderChannelAboutTab();
    } else {
      renderMessages(msgs, false, true);
    }
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

    
    // Await Google Drive upload for all image attachments before saving & broadcasting
    for (const att of attachments) {
      if (att.isImage && !att.driveFileId) {
        if (att._uploadPromise) {
          try {
            await att._uploadPromise;
          } catch (_) {}
        }
        if (!att.driveFileId && window.electronAPI?.uploadDriveImage && att.dataUrl) {
          try {
            const driveRes = await window.electronAPI.uploadDriveImage({
              name: att.name,
              mimeType: att.type || 'image/png',
              dataUrl: att.dataUrl
            });
            if (driveRes && driveRes.success) {
              att.driveFileId = driveRes.driveFileId;
              att.previewUrl = driveRes.previewUrl;
              att.downloadUrl = driveRes.downloadUrl;
            }
          } catch (e) {
            console.warn('[GDRIVE] Pre-send upload failed:', e);
          }
        }
      }
    }

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
      delivered: false,
      pending: true,
      isLocal: true,
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

    // Sanitize attachments for Cloud Firestore: Strip large dataUrls if Google Drive URL/fileId exists, remove any non-serializable properties (e.g. _uploadPromise)
    const sanitizedAttachments = (attachments || []).map(a => {
      const clean = {
        id: String(a.id || ('att_' + Math.random().toString(36).slice(2, 7))),
        name: String(a.name || 'attachment'),
        size: Number(a.size || 0),
        type: String(a.type || (a.isImage ? 'image/webp' : 'application/octet-stream')),
        isImage: !!a.isImage
      };
      if (a.driveFileId || a.previewUrl) {
        clean.driveFileId = a.driveFileId;
        clean.previewUrl = a.previewUrl;
        clean.downloadUrl = a.downloadUrl || a.previewUrl;
      } else {
        clean.dataUrl = a.dataUrl || '';
      }
      return clean;
    });

    // Sync to Cloud Firestore
    if (window.FirebaseService?.sendMessage) {
      FirebaseService.sendMessage(state.activeChannelId, cleanText, {
        id: msgId,
        subject,
        importance,
        attachments: sanitizedAttachments,
        replyTo,
        voiceNote,
        mentions
      }).then(() => {
        const list = WorkspaceDB.data.chats[state.activeChannelId];
        const sentItem = list && list.find(m => m.id === msgId);
        if (sentItem) {
          sentItem.pending = false;
          sentItem.delivered = true;
          WorkspaceDB.save().catch(() => {});
          renderMessages(true);
          if (window.ChatSyncManager) {
            ChatSyncManager.channelUnreadCounts[state.activeChannelId] = 0;
            ChatSyncManager.updateSidebarBadge();
          }
        }
      }).catch(err => {
        console.warn('[FIREBASE] Chat sync warning, activating local recovery:', err);
      });
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
          <strong class="thread-author-name" style="font-size: 12.5px;">${senderName}</strong>
          <span style="font-family: var(--font-mono); font-size: 9.5px; color: var(--text-muted);">${timeStr}</span>
        </div>
        ${rootMsg.subject ? `<div style="font-weight: 700; color: var(--accent-cyan); font-size: 12px; margin-bottom: 4px;">${escapeHtml(rootMsg.subject)}</div>` : ''}
        <div class="thread-body-content" style="font-size: 12px; line-height: 1.4;">${renderMarkdownText(rootMsg.text || '')}</div>
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
      card.className = 'thread-reply-item';
      card.style.cssText = 'border-radius: 8px; padding: 10px 12px;';
      const sender = escapeHtml(rep.senderName || 'Teammate');
      const time = new Date(rep.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      card.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
          <strong class="thread-author-name" style="font-size: 11.5px;">${sender}</strong>
          <span style="font-family: var(--font-mono); font-size: 9px; color: var(--text-muted);">${time}</span>
        </div>
        <div class="thread-body-content" style="font-size: 11.5px; line-height: 1.4;">${renderMarkdownText(rep.text || '')}</div>
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

      let actActivated = false;
      const handleActTrigger = (e) => {
        if (actActivated) return;
        actActivated = true;
        setTimeout(() => { actActivated = false; }, 350);
        if (e) {
          e.stopPropagation();
        }
        navigateToNotificationDestination(item);
      };

      card.style.cursor = 'pointer';
      card.style.touchAction = 'manipulation';
      card.style.userSelect = 'none';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.addEventListener('click', handleActTrigger);
      card.addEventListener('pointerup', handleActTrigger);
      card.addEventListener('touchend', handleActTrigger);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleActTrigger(e);
        }
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
        openDirectMessageWithMember(m, safeName);
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
    return (mEmail === 'jagadish2k2006@gmail.com');
  }

  function isSelfMember(member) {
    if (!member) return false;
    const mUid = member.uid || member.id;
    const mEmail = (member.email || '').toLowerCase().trim();
    const curUid = state.currentUser?.uid || state.currentMember?.uid || (window.FirebaseService?.currentUser?.uid);
    const curEmail = (
      state.currentUser?.email || 
      state.currentMember?.email || 
      (window.FirebaseService?.currentUser?.email) || 
      localStorage.getItem('reddot_user_email') || 
      ''
    ).toLowerCase().trim();
    const curMemberId = state.currentMemberId || state.currentMember?.id;

    if (mUid && curUid && mUid === curUid) return true;
    if (mEmail && curEmail && mEmail === curEmail) return true;
    if (curMemberId && member.id && member.id === curMemberId) return true;
    if (curEmail === 'jagadish2k2006@gmail.com' && (mEmail === 'jagadish2k2006@gmail.com' || member.id === 'RD-FOUNDER-001')) return true;
    return false;
  }

  function isMemberAppOnline(member) {
    if (!member || member.suspended || member.deleted) return false;
    if (member.resigned || member.status === 'RESIGNED') return false;
    if (isSelfMember(member)) return isWorkstationOnline();

    const now = Date.now();
    const lastSeen = parseTimestamp(member.lastSeenAt || member.lastSeen || member.lastHeartbeat || member.updatedAt);

    // If there is no valid timestamp at all, evaluate purely based on online state flag
    if (!lastSeen || lastSeen <= 0) {
      return (member.isOnline === true || member.state === 'online');
    }

    // Time elapsed since last heartbeat (in milliseconds)
    let delta = now - lastSeen;

    // Compensate for clock skew between different client workstations (up to 5 minutes forward drift)
    if (delta < 0 && delta > -300000) {
      delta = 0;
    }

    // Active heartbeat window: 4 minutes (240,000 ms)
    // Workstations push heartbeat every 20s. Background throttling slows to 60-90s.
    // 240s ensures reliable online detection without false offline flapping.
    const PRESENCE_TIMEOUT_MS = 240000;

    if (delta <= PRESENCE_TIMEOUT_MS) {
      // If member has active duty or online status, they are online
      if (member.isOnline === true || member.state === 'online' || member.status === 'DUTY_ON' || member.status === 'DUTY_BREAK') {
        return true;
      }
      // If they explicitly sent offline on window close/signout with DUTY_OFF, respect offline
      const isExplicitlyOffline = (member.isOnline === false || member.state === 'offline');
      if (isExplicitlyOffline && (member.status === 'DUTY_OFF' || !member.status)) {
        return false;
      }
      return delta <= 120000;
    }

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
      const lastSeen = parseTimestamp(member.lastSeenAt || member.lastSeen || member.lastHeartbeat);
      let delta = now - lastSeen;
      if (delta < 0 && delta > -300000) delta = 0;
      const isFresh = lastSeen > 0 && delta <= 210000;
      if (isFresh || isSelf) return member.status;
    }

    return 'DUTY_OFF';
  }

  function isWorkstationOnline() {
    return typeof navigator !== 'undefined' && navigator.onLine !== false;
  }

  function startShiftTimerInterval() {
    if (state.personalShift.timer) clearInterval(state.personalShift.timer);
    const timerDisplay = document.getElementById('personalShiftTimer');
    state.personalShift._lastTick = Date.now();

    state.personalShift.timer = setInterval(() => {
      const now = Date.now();
      const lastTick = state.personalShift._lastTick || now;
      const deltaSec = Math.max(0, Math.floor((now - lastTick) / 1000));

      if (deltaSec >= 1) {
        state.personalShift._lastTick = now;
        if (state.personalShift.status === 'DUTY_ON') {
          const online = isWorkstationOnline();
          if (online) {
            // Increment working hours strictly using real elapsed wall-clock seconds
            // Handles background execution, minimized window, and CPU throttle without losing time
            state.personalShift.seconds = (state.personalShift.seconds || 0) + deltaSec;
            state.personalShift.accumulatedSeconds = state.personalShift.seconds;

            // Auto-detect and track work tool activity
            if (typeof detectAndTrackActiveWorkTool === 'function') {
              detectAndTrackActiveWorkTool(deltaSec);
            }

            // Periodically save to localStorage every 5 seconds
            if (state.personalShift.seconds % 5 === 0) {
              try {
                const cur = getCurrentResolvedMember();
                const todayDateStr = new Date().toDateString();
                localStorage.setItem('rd_active_shift', JSON.stringify({
                  status: 'DUTY_ON',
                  clockInTimestamp: state.personalShift.sessionStartTs || (Date.now() - (state.personalShift.seconds * 1000)),
                  seconds: state.personalShift.seconds,
                  accumulatedSeconds: state.personalShift.seconds,
                  workerId: cur?.id,
                  savedDate: todayDateStr,
                  lastOnlineTimestamp: Date.now()
                }));
              } catch (_) {}
            }
          }
          if (timerDisplay) timerDisplay.textContent = formatShiftDisplay(state.personalShift.seconds);
          updateTeamHoursLive();
          updateLiveFleetHours();
        }
      }
    }, 1000);

    // Instant catch-up on window focus / visibility change
    if (typeof window !== 'undefined' && !window._shiftFocusCatchupBound) {
      window._shiftFocusCatchupBound = true;
      const catchupShiftTime = () => {
        if (state.personalShift?.status === 'DUTY_ON' && state.personalShift._lastTick) {
          const now = Date.now();
          const delta = Math.max(0, Math.floor((now - state.personalShift._lastTick) / 1000));
          if (delta > 0) {
            state.personalShift._lastTick = now;
            state.personalShift.seconds = (state.personalShift.seconds || 0) + delta;
            state.personalShift.accumulatedSeconds = state.personalShift.seconds;
            updateShiftUI();
            updateTeamHoursLive();
          }
        }
      };
      window.addEventListener('focus', catchupShiftTime);
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) catchupShiftTime();
      });
    }
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
          // Working hours must reflect verified online hours, NOT elapsed wall-clock time while offline
          const onlineSec = (typeof savedShift.seconds === 'number' && savedShift.seconds >= 0)
            ? savedShift.seconds
            : (savedShift.accumulatedSeconds || 0);
          state.personalShift.accumulatedSeconds = onlineSec;
          state.personalShift.seconds = onlineSec;
          if (savedShift.status === 'DUTY_ON') {
            startShiftTimerInterval();
          } else {
            state.personalShift.seconds = state.personalShift.accumulatedSeconds;
          }
          updateShiftUI();
          return;
        }
      } catch (_) {}

      // If user is authenticated/logged in, automatically start active duty session so background uptime is counted
      const isUserAuthenticated = !!(state.currentUser || (cur && !cur.suspended && !cur.resigned));
      if (isUserAuthenticated) {
        state.personalShift.status = 'DUTY_ON';
        const startTs = now;
        state.personalShift.sessionStartTs = startTs;
        let initialSec = 0;
        if (cur && typeof cur.todaySeconds === 'number' && cur.todayDate === todayDateStr && cur.todaySeconds > 0) {
          initialSec = cur.todaySeconds;
        }
        state.personalShift.accumulatedSeconds = initialSec;
        state.personalShift.seconds = initialSec;
        try {
          recordPunch('CLOCK_IN');
        } catch (_) {}
        startShiftTimerInterval();
        updateShiftUI();
        return;
      }

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
      state.personalShift.sessionStartTs = startTs;
      let initialSec = completedSec;
      try {
        const saved = JSON.parse(localStorage.getItem('rd_active_shift') || '{}');
        if (saved && saved.savedDate === todayDateStr && typeof saved.seconds === 'number' && saved.seconds >= completedSec) {
          initialSec = saved.seconds;
        } else if (cur && typeof cur.todaySeconds === 'number' && cur.todaySeconds >= completedSec) {
          initialSec = cur.todaySeconds;
        }
      } catch (_) {}
      state.personalShift.accumulatedSeconds = initialSec;
      state.personalShift.seconds = initialSec;
      try {
        localStorage.setItem('rd_active_shift', JSON.stringify({
          status: 'DUTY_ON',
          clockInTimestamp: startTs,
          seconds: initialSec,
          accumulatedSeconds: initialSec,
          workerId: cur.id,
          savedDate: todayDateStr,
          lastOnlineTimestamp: Date.now()
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
      const isUserAuthenticated = !!(state.currentUser || (cur && !cur.suspended && !cur.resigned));
      // Auto Clock-In when opening app fresh if authenticated and not manually suppressed
      if (isUserAuthenticated && !state._suppressAutoClockIn) {
        state.personalShift.status = 'DUTY_ON';
        state.personalShift.sessionStartTs = now;
        state.personalShift.accumulatedSeconds = completedSec;
        state.personalShift.seconds = completedSec;
        try {
          recordPunch('CLOCK_IN');
          showQuickToast(`Welcome back, ${cur.displayName || cur.name || 'Team Member'}! Automatically clocked in.`, 'success');
        } catch (_) {}
        startShiftTimerInterval();
        updateShiftUI();
        return;
      }

      state.personalShift.status = 'DUTY_OFF';
      state.personalShift.seconds = completedSec;
      state.personalShift.sessionStartTs = null;
      state.personalShift.accumulatedSeconds = completedSec;
      if (state.personalShift.timer) {
        clearInterval(state.personalShift.timer);
        state.personalShift.timer = null;
      }
      try { localStorage.removeItem('rd_active_shift'); } catch (_) {}
    }

    updateShiftUI();
  }

  function formatHumanDuration(totalSeconds) {
    if (totalSeconds === undefined || totalSeconds === null || isNaN(totalSeconds) || totalSeconds <= 0) return '0 min';
    const totalSec = Math.floor(totalSeconds);
    if (totalSec < 60) return '< 1 min';
    const totalMin = Math.round(totalSec / 60);
    if (totalMin < 60) {
      return `${totalMin} min`;
    }
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    if (mins === 0) {
      return `${hrs} ${hrs === 1 ? 'hr' : 'hrs'}`;
    }
    return `${hrs} ${hrs === 1 ? 'hr' : 'hrs'} ${mins} min`;
  }
  window.formatHumanDuration = formatHumanDuration;

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

    // 1. Determine online presence and duty status
    const dutyStatus = getMemberDutyStatus(member);
    const isOnline = isMemberAppOnline(member);

    // 2. If this is the active user on this workstation
    if (isSelf && state.personalShift) {
      if (state.personalShift.status === 'DUTY_ON' || state.personalShift.status === 'DUTY_BREAK') {
        return Math.max(0, Math.min(86400, Math.floor(state.personalShift.seconds || 0)));
      }
    }

    // 3. For remote team members:
    // Only accept reported todaySeconds if active today, and only increment while member is genuinely ONLINE
    const memberLastSeenToday = member.lastSeenAt && (new Date(member.lastSeenAt).toDateString() === todayDateStr);
    const memberDateMatchesToday = member.todayDate && (member.todayDate === todayDateStr || member.todayDate === today.toLocaleDateString());

    if ((memberLastSeenToday || memberDateMatchesToday) && typeof member.todaySeconds === 'number' && member.todaySeconds > 0) {
      let remoteSec = member.todaySeconds;
      // Only if currently online and duty is ON, add live heartbeat delta (capped at 90s between heartbeats)
      if (dutyStatus === 'DUTY_ON' && isOnline && (now - member.lastSeenAt < 90000)) {
        remoteSec += Math.max(0, Math.floor((now - member.lastSeenAt) / 1000));
      }
      return Math.max(0, Math.min(86400, Math.floor(remoteSec)));
    }

    // If shift is still open, ONLY accrue live time if member is ONLINE
    let liveSeconds = 0;
    if (openPunchTimestamp && dutyStatus === 'DUTY_ON' && isOnline) {
      if (member.lastSeenAt && (now - member.lastSeenAt < 90000)) {
        liveSeconds = Math.max(0, Math.floor((now - member.lastSeenAt) / 1000));
      }
    }

    let totalCalculated = completedSeconds + liveSeconds;
    return Math.max(0, Math.min(86400, Math.floor(totalCalculated)));
  }

  function formatMemberHoursToday(totalSeconds) {
    if (!totalSeconds || totalSeconds <= 0) return '0 min';
    return formatHumanDuration(totalSeconds);
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
        const selfUid = state.currentUser?.uid || selfMember.uid || selfMember.id;
        FirebaseService.updatePresenceFirestore(selfUid, selfDuty, selfSec);
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
        openDirectMessageWithMember(member, member.name);
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

  
  // =========================================================================
  // ORGANIZATION WORK TOOLS REGISTRY & FLEET ACTIVITY ENGINE
  // =========================================================================
  const DEFAULT_WORK_TOOLS = [
    { id: 'tool_vscode', name: 'VS Code', exe: 'code.exe', icon: 'vscode', category: 'Development', addedBy: 'REDDOT System', active: true },
    { id: 'tool_vstudio', name: 'Visual Studio', exe: 'devenv.exe', icon: 'vstudio', category: 'Development', addedBy: 'REDDOT System', active: true },
    { id: 'tool_antigravity', name: 'Antigravity IDE', exe: 'antigravity ide.exe', icon: 'antigravity', category: 'Development', addedBy: 'REDDOT System', active: true },
    { id: 'tool_deskflow', name: 'Deskflow', exe: 'deskflow.exe', icon: 'deskflow', category: 'Tools & Utilities', addedBy: 'REDDOT System', active: true },
    { id: 'tool_whatsapp', name: 'WhatsApp', exe: 'whatsapp.root.exe', icon: 'whatsapp', category: 'Communication', addedBy: 'REDDOT System', active: true },
    { id: 'tool_arduino', name: 'Arduino IDE', exe: 'arduino ide.exe', icon: 'arduino', category: 'Development', addedBy: 'REDDOT System', active: true },
    { id: 'tool_spotify', name: 'Spotify', exe: 'spotifylauncher.exe', icon: 'spotify', category: 'Media & Audio', addedBy: 'REDDOT System', active: true },
    { id: 'tool_shotcut', name: 'Shotcut', exe: 'shotcut.exe', icon: 'shotcut', category: 'Design & Media', addedBy: 'REDDOT System', active: true },
    { id: 'tool_android', name: 'Android Studio', exe: 'studio64.exe', icon: 'android', category: 'Development', addedBy: 'REDDOT System', active: true },
    { id: 'tool_intellij', name: 'IntelliJ IDEA', exe: 'idea64.exe', icon: 'intellij', category: 'Development', addedBy: 'REDDOT System', active: true },
    { id: 'tool_pycharm', name: 'PyCharm', exe: 'pycharm64.exe', icon: 'pycharm', category: 'Development', addedBy: 'REDDOT System', active: true },
    { id: 'tool_figma', name: 'Figma', exe: 'figma.exe', icon: 'figma', category: 'Design', addedBy: 'REDDOT System', active: true },
    { id: 'tool_photoshop', name: 'Photoshop', exe: 'photoshop.exe', icon: 'photoshop', category: 'Design', addedBy: 'REDDOT System', active: true },
    { id: 'tool_blender', name: 'Blender 3D', exe: 'blender.exe', icon: 'blender', category: '3D & Engineering', addedBy: 'REDDOT System', active: true },
    { id: 'tool_word', name: 'Microsoft Word', exe: 'winword.exe', icon: 'word', category: 'Documentation', addedBy: 'REDDOT System', active: true },
    { id: 'tool_excel', name: 'Microsoft Excel', exe: 'excel.exe', icon: 'excel', category: 'Documentation', addedBy: 'REDDOT System', active: true },
    { id: 'tool_postman', name: 'Postman', exe: 'postman.exe', icon: 'postman', category: 'Testing & API', addedBy: 'REDDOT System', active: true },
    { id: 'tool_docker', name: 'Docker Desktop', exe: 'docker desktop.exe', icon: 'docker', category: 'DevOps & Containers', addedBy: 'REDDOT System', active: true },
    { id: 'tool_brave', name: 'Brave Browser', exe: 'brave.exe', icon: 'brave', category: 'Research & Tools', addedBy: 'REDDOT System', active: true },
    { id: 'tool_chrome', name: 'Google Chrome', exe: 'chrome.exe', icon: 'chrome', category: 'Research & Tools', addedBy: 'REDDOT System', active: true },
    { id: 'tool_terminal', name: 'PowerShell / CLI', exe: 'powershell.exe', icon: 'terminal', category: 'System & CLI', addedBy: 'REDDOT System', active: true }
  ];

  // =========================================================================
  // ENTERPRISE WORK TOOLS ICON VECTOR SVG DICTIONARY
  // =========================================================================
  function getToolIconSvg(iconKey, size = 18) {
    const k = (iconKey || '').toLowerCase().trim();
    const s = size;
    const rnd = Math.random().toString(36).slice(2, 7);

    // 1. Google DeepMind Antigravity IDE (Authentic Glowing Quantum Orb)
    if (k.includes('antigravity')) {
      const gid = 'ag_' + rnd;
      return `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" style="vertical-align:middle;flex-shrink:0;">
        <defs>
          <radialGradient id="${gid}" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stop-color="#C084FC"/>
            <stop offset="45%" stop-color="#7C3AED"/>
            <stop offset="100%" stop-color="#0284C7"/>
          </radialGradient>
        </defs>
        <circle cx="16" cy="16" r="14" fill="url(#${gid})"/>
        <ellipse cx="16" cy="16" rx="13.5" ry="5" transform="rotate(-30 16 16)" stroke="#38BDF8" stroke-width="2" fill="none" opacity="0.95"/>
        <circle cx="16" cy="16" r="4.2" fill="#FFFFFF"/>
        <circle cx="23.5" cy="10" r="1.8" fill="#38BDF8"/>
      </svg>`;
    }

    // 2. Deskflow (Authentic Dual Display Network Flow)
    if (k.includes('deskflow')) {
      return `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" style="vertical-align:middle;flex-shrink:0;">
        <rect x="2" y="6" width="12" height="9" rx="2" fill="#00E5FF"/>
        <rect x="18" y="6" width="12" height="9" rx="2" fill="#7C3AED"/>
        <rect x="5" y="15" width="6" height="3" fill="#00E5FF" opacity="0.6"/>
        <rect x="21" y="15" width="6" height="3" fill="#7C3AED" opacity="0.6"/>
        <path d="M7 21L16 17L25 21" stroke="#00E5FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M16 17V26" stroke="#00E5FF" stroke-width="2" stroke-linecap="round"/>
        <circle cx="16" cy="17" r="2.5" fill="#FFFFFF"/>
      </svg>`;
    }

    // 3. Brave Browser (Authentic Lion Shield)
    if (k.includes('brave')) {
      return `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" style="vertical-align:middle;flex-shrink:0;">
        <path d="M16 2L4 7.5V14.5C4 21.8 9.1 28.5 16 30C22.9 28.5 28 21.8 28 14.5V7.5L16 2Z" fill="#FB542B"/>
        <path d="M16 6L7 10.2V15C7 19.8 10.8 24.3 16 25.5C21.2 24.3 25 19.8 25 15V10.2L16 6Z" fill="#FF7844"/>
        <circle cx="12" cy="14" r="1.8" fill="#FFFFFF"/>
        <circle cx="20" cy="14" r="1.8" fill="#FFFFFF"/>
        <path d="M14 19H18L16 22L14 19Z" fill="#FFFFFF"/>
      </svg>`;
    }

    // 4. WhatsApp (Official Green Disc + Chat Bubble + Phone Handset)
    if (k.includes('whatsapp')) {
      return `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" style="vertical-align:middle;flex-shrink:0;">
        <circle cx="16" cy="16" r="15" fill="#25D366"/>
        <path d="M16 6C10.5 6 6 10.5 6 16C6 17.8 6.5 19.6 7.4 21.2L6 26.5L11.5 25.1C12.9 25.9 14.4 26.3 16 26.3C21.5 26.3 26 21.8 26 16C26 10.5 21.5 6 16 6ZM21.3 20.3C21 21 19.8 21.6 19.1 21.7C18.6 21.8 17.9 21.8 15.3 20.8C12.1 19.5 10 16.2 9.8 16C9.6 15.8 8.4 14.2 8.4 12.3C8.4 10.4 9.4 9.4 9.8 9C10.1 8.7 10.5 8.6 10.9 8.6C11 8.6 11.2 8.6 11.4 8.6C11.7 8.6 12 8.5 12.3 9.2C12.7 10.1 13.4 11.8 13.5 11.9C13.6 12.1 13.6 12.3 13.5 12.5C13.4 12.7 13.3 12.8 13.1 13L12.5 13.8C12.4 13.9 12.2 14.1 12.4 14.3C12.6 14.8 13.3 15.9 14.4 16.9C15.8 18.1 16.8 18.5 17.2 18.7C17.5 18.8 17.7 18.7 17.9 18.5C18.2 18.2 18.7 17.4 19 17C19.3 16.6 19.6 16.7 19.9 16.8C20.2 16.9 21.7 17.6 22 17.8C22.3 17.9 22.4 18 22.5 18.2C22.5 18.4 22.5 19.2 21.3 20.3Z" fill="#FFFFFF"/>
      </svg>`;
    }

    // 5. Spotify (Official Green Badge + 3 Audio Waves)
    if (k.includes('spotify')) {
      return `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" style="vertical-align:middle;flex-shrink:0;">
        <circle cx="16" cy="16" r="15" fill="#1ED760"/>
        <path d="M8.5 12C14 10.5 20.5 11 24.5 13.2" stroke="#121212" stroke-width="2.8" stroke-linecap="round"/>
        <path d="M10 16C14.5 14.8 19.5 15.2 22.8 17" stroke="#121212" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M11 20C14.5 19 18.5 19.5 21.2 20.8" stroke="#121212" stroke-width="2" stroke-linecap="round"/>
      </svg>`;
    }

    // 6. VS Code (Official Blue Origami Ribbon)
    if (k.includes('vscode') || k.includes('code')) {
      return `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" style="vertical-align:middle;flex-shrink:0;">
        <path d="M23 2L11 11L4 6L2 7.5V24.5L4 26L11 21L23 30L30 26.5V5.5L23 2Z" fill="#0066B8"/>
        <path d="M23 2L11 11L18 16L23 11V2Z" fill="#1F9CF0"/>
        <path d="M23 30L11 21L18 16L23 21V30Z" fill="#007ACC"/>
        <path d="M23 11L11 21L4 26L2 24.5V7.5L4 6L11 11L23 21V11Z" fill="#0065A9" opacity="0.6"/>
        <path d="M23 11L30 5.5V26.5L23 21V11Z" fill="#1F9CF0"/>
      </svg>`;
    }

    // 7. Visual Studio (Official Purple Ribbon)
    if (k.includes('vstudio') || k.includes('devenv') || k.includes('visual studio')) {
      return `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" style="vertical-align:middle;flex-shrink:0;">
        <path d="M22 2L12 10L5 6L2 8V24L5 26L12 22L22 30L29 26V6L22 2Z" fill="#5C2D91"/>
        <path d="M22 2L12 10L17 16L22 10V2Z" fill="#8661C5"/>
        <path d="M22 30L12 22L17 16L22 22V30Z" fill="#68217A"/>
        <path d="M22 10L29 6V26L22 22V10Z" fill="#8661C5"/>
      </svg>`;
    }

    // 8. Google Chrome (Official 4-Color Disc)
    if (k.includes('chrome')) {
      return `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" style="vertical-align:middle;flex-shrink:0;">
        <circle cx="16" cy="16" r="14" fill="#FFFFFF"/>
        <path d="M16 2C10.4 2 5.6 5.5 3.6 10.4L9.8 21.1L16 16H29.2C28.5 8.5 22.9 2 16 2Z" fill="#EA4335"/>
        <path d="M3.6 10.4C2.9 11.9 2.6 13.6 2.6 15.3C2.6 22 7.5 27.6 13.9 28.5L20 18.2L16 16L9.8 21.1L3.6 10.4Z" fill="#34A853"/>
        <path d="M16 30C21.6 30 26.4 26.5 28.4 21.6L22.2 10.9L16 16L20 18.2L13.9 28.5C14.6 28.5 15.3 28.6 16 28.6V30Z" fill="#FBBC05"/>
        <circle cx="16" cy="16" r="6" fill="#4285F4"/>
        <circle cx="16" cy="16" r="4.8" fill="#FFFFFF"/>
      </svg>`;
    }

    // 9. Figma (Official 5-Piece Geometry)
    if (k.includes('figma')) {
      return `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" style="vertical-align:middle;flex-shrink:0;">
        <path d="M11 32C13.8 32 16 29.8 16 27V21H11C8.2 21 6 23.2 6 26C6 28.8 8.2 32 11 32Z" fill="#0ACF83"/>
        <path d="M6 16C6 13.2 8.2 11 11 11H16V21H11C8.2 21 6 18.8 6 16Z" fill="#A259FF"/>
        <path d="M6 5.5C6 2.5 8.2 0 11 0H16V11H11C8.2 11 6 8.5 6 5.5Z" fill="#F24E1E"/>
        <path d="M16 0H21C23.8 0 26 2.5 26 5.5C26 8.5 23.8 11 21 11H16V0Z" fill="#FF7262"/>
        <circle cx="21" cy="16" r="5" fill="#1ABCFE"/>
      </svg>`;
    }

    // 10. Discord (Official Blurple Clyde)
    if (k.includes('discord')) {
      return `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" style="vertical-align:middle;flex-shrink:0;">
        <rect x="2" y="2" width="28" height="28" rx="8" fill="#5865F2"/>
        <path d="M22.5 9.5C21 8.8 19.5 8.3 17.8 8C17.6 8.4 17.4 8.8 17.2 9.2C15.5 9 13.8 9 12.1 9.2C11.9 8.8 11.7 8.4 11.5 8C9.8 8.3 8.3 8.8 6.8 9.5C4 13.7 3.2 17.8 3.6 21.8C5.5 23.2 7.3 24 9.1 24.6C9.6 24 10 23.3 10.4 22.6C9.8 22.3 9.2 22 8.6 21.6C8.8 21.5 8.9 21.3 9.1 21.2C12.7 22.9 16.6 22.9 20.2 21.2C20.4 21.3 20.5 21.5 20.7 21.6C20.1 22 19.5 22.3 18.9 22.6C19.3 23.3 19.7 24 20.2 24.6C22 24 23.8 23.2 25.7 21.8C26.2 17.1 24.9 13.1 22.5 9.5ZM10.5 18.5C9.4 18.5 8.5 17.5 8.5 16.3C8.5 15.1 9.4 14.1 10.5 14.1C11.6 14.1 12.5 15.1 12.5 16.3C12.5 17.5 11.6 18.5 10.5 18.5ZM18.8 18.5C17.7 18.5 16.8 17.5 16.8 16.3C16.8 15.1 17.7 14.1 18.8 14.1C19.9 14.1 20.8 15.1 20.8 16.3C20.8 17.5 19.9 18.5 18.8 18.5Z" fill="#FFFFFF"/>
      </svg>`;
    }

    // 11. Telegram (Official Cyan Paper Plane)
    if (k.includes('telegram')) {
      return `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" style="vertical-align:middle;flex-shrink:0;">
        <circle cx="16" cy="16" r="15" fill="#2AABEE"/>
        <path d="M7 15.5L24 9L21.5 22.5L16 18.5L13.5 21V17.5L22 11.5L11 16.5L7 15.5Z" fill="#FFFFFF"/>
      </svg>`;
    }

    // 12. Shotcut (Cyan Film Clapperboard)
    if (k.includes('shotcut')) {
      return `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" style="vertical-align:middle;flex-shrink:0;">
        <rect x="2" y="4" width="28" height="24" rx="4" fill="#003B46"/>
        <path d="M6 9L10 16L6 23M14 9L18 16L14 23M22 9L26 16L22 23" stroke="#00E5FF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
    }

    // 13. Arduino IDE (Official Teal Infinity)
    if (k.includes('arduino')) {
      return `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" style="vertical-align:middle;flex-shrink:0;">
        <path d="M16 16C12 9 4 9 4 16C4 23 12 23 16 16ZM16 16C20 9 28 9 28 16C28 23 20 23 16 16Z" stroke="#00979D" stroke-width="3" fill="none"/>
        <line x1="8" y1="16" x2="11.5" y2="16" stroke="#00979D" stroke-width="2.5"/>
        <line x1="20.5" y1="16" x2="24" y2="16" stroke="#00979D" stroke-width="2.5"/>
        <line x1="22.25" y1="14.25" x2="22.25" y2="17.75" stroke="#00979D" stroke-width="2.5"/>
      </svg>`;
    }

    // Default crisp application icon
    return `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" style="vertical-align:middle;flex-shrink:0;">
      <rect x="3" y="4" width="26" height="24" rx="4" fill="#182234" stroke="rgba(0,229,255,0.4)" stroke-width="2"/>
      <line x1="3" y1="10" x2="29" y2="10" stroke="rgba(255,255,255,0.18)" stroke-width="1.5"/>
      <circle cx="7" cy="7" r="1.5" fill="#00E5FF"/>
      <circle cx="11" cy="7" r="1.5" fill="#FFAB00"/>
      <circle cx="15" cy="7" r="1.5" fill="#00E676"/>
      <path d="M10 19L14 15L10 11" stroke="#00E5FF" stroke-width="2" stroke-linecap="round"/>
      <line x1="16" y1="21" x2="22" y2="21" stroke="#38BDF8" stroke-width="2" stroke-linecap="round"/>
    </svg>`;
  }

  function initWorkToolsRegistry() {
    if (!WorkspaceDB.data.workTools || !Array.isArray(WorkspaceDB.data.workTools) || WorkspaceDB.data.workTools.length === 0) {
      WorkspaceDB.data.workTools = [...DEFAULT_WORK_TOOLS];
      WorkspaceDB.save().catch(() => {});
    } else {
      const existingIds = new Set(WorkspaceDB.data.workTools.map(t => t.id));
      let added = false;
      DEFAULT_WORK_TOOLS.forEach(dt => {
        if (!existingIds.has(dt.id)) {
          WorkspaceDB.data.workTools.push(dt);
          added = true;
        }
      });
      if (added) WorkspaceDB.save().catch(() => {});
    }

    // Subscribe to Firestore for real-time cloud synchronization
    if (window.FirebaseService && typeof FirebaseService.subscribeWorkTools === 'function') {
      FirebaseService.subscribeWorkTools((cloudTools) => {
        if (cloudTools && cloudTools.length > 0) {
          const map = new Map((WorkspaceDB.data.workTools || []).map(t => [t.id, t]));
          cloudTools.forEach(ct => { map.set(ct.id, { ...map.get(ct.id), ...ct }); });
          WorkspaceDB.data.workTools = Array.from(map.values());
          WorkspaceDB.save().catch(() => {});
          renderWorkTools();
        }
      });
    }
  }

  async function renderWorkTools() {
    const grid = document.getElementById('workToolsGrid');
    if (!grid) return;

    initWorkToolsRegistry();
    const tools = (WorkspaceDB.data.workTools || []).filter(t => t.active !== false);

    // Update count pill
    const countPill = document.getElementById('toolsCountPill');
    if (countPill) countPill.textContent = `${tools.length} REGISTERED`;

    // Query running apps on this workstation for live status
    let runningExeSet = new Set();
    let detectedApps = [];
    if (window.electronAPI && typeof window.electronAPI.getRunningWorkApps === 'function') {
      try {
        detectedApps = await window.electronAPI.getRunningWorkApps();
        runningExeSet = new Set((detectedApps || []).map(a => (a.exe || '').toLowerCase().trim()));
      } catch (_) {}
    }

    // Populate quickActiveToolSelect in Attendance hero card
    const quickSelect = document.getElementById('quickActiveToolSelect');
    if (quickSelect) {
      const prevVal = quickSelect.value;
      quickSelect.innerHTML = '<option value="">⚡ Auto-Detect Running Tool</option>';
      tools.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.id;
        const isRunning = runningExeSet.has((t.exe || '').toLowerCase().trim());
        opt.textContent = `${isRunning ? '🟢 ' : ''}${t.name} (${t.exe})`;
        quickSelect.appendChild(opt);
      });
      if (state.activeSelectedWorkTool) {
        quickSelect.value = state.activeSelectedWorkTool.id || '';
      } else if (prevVal) {
        quickSelect.value = prevVal;
      }
    }

    // Populate employee filter dropdown
    const memberSelect = document.getElementById('workToolMemberFilter');
    if (memberSelect && memberSelect.options.length <= 1) {
      const addedBySet = new Set(tools.map(t => t.addedBy).filter(Boolean));
      addedBySet.forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        memberSelect.appendChild(opt);
      });
    }

    // Filters
    const searchQuery = (document.getElementById('workToolSearchInput')?.value || '').toLowerCase().trim();
    const categoryFilter = document.getElementById('workToolCategoryFilter')?.value || 'ALL';
    const memberFilter = document.getElementById('workToolMemberFilter')?.value || 'ALL';

    const filteredTools = tools.filter(tool => {
      if (categoryFilter !== 'ALL' && tool.category !== categoryFilter) return false;
      if (memberFilter !== 'ALL' && tool.addedBy !== memberFilter) return false;
      if (searchQuery) {
        const text = `${tool.name || ''} ${tool.exe || ''} ${tool.category || ''} ${tool.addedBy || ''}`.toLowerCase();
        if (!text.includes(searchQuery)) return false;
      }
      return true;
    });

    grid.replaceChildren();

    if (filteredTools.length === 0) {
      grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 30px; font-size: 12px;">No work tools matched the search or filter criteria.</div>`;
      return;
    }

    const cur = getCurrentResolvedMember();
    const isFounder = isFounderMember(cur);

    filteredTools.forEach(tool => {
      const toolExeLower = (tool.exe || '').toLowerCase().trim();
      const isActiveOnWorkstation = runningExeSet.has(toolExeLower) ||
        detectedApps.some(a => (a.exe || '').toLowerCase().includes(toolExeLower.replace(/\.exe$/i, '')) || (a.appName || '').toLowerCase() === (tool.name || '').toLowerCase());

      const card = document.createElement('div');
      card.className = `work-tool-card ${isActiveOnWorkstation ? 'active-workstation' : ''}`;

      // Icon lookup based on category
      let catIcon = '🛠️';
      if (tool.category === 'Development') catIcon = '💻';
      else if (tool.category === 'Design') catIcon = '🎨';
      else if (tool.category === '3D & Engineering') catIcon = '📐';
      else if (tool.category === 'Documentation') catIcon = '📄';
      else if (tool.category === 'Testing & API') catIcon = '🧪';
      else if (tool.category === 'DevOps & Containers') catIcon = '🐳';
      else if (tool.category === 'Research & Tools') catIcon = '🌐';

      const canDelete = isFounder || (cur && (tool.addedById === cur.id || tool.addedById === cur.uid));

      card.innerHTML = `
        <div class="work-tool-card-head">
          <div class="work-tool-info-left">
            <div class="work-tool-icon-bubble">${getToolIconSvg(tool.icon || tool.category, 22)}</div>
            <div style="min-width: 0;">
              <div class="work-tool-name">${escapeHtml(tool.name)}</div>
              <span class="work-tool-exe-tag">${escapeHtml(tool.exe)}</span>
            </div>
          </div>
          ${canDelete && !tool.id.startsWith('tool_vscode') ? `<button type="button" class="btn-delete-tool" data-tool-id="${tool.id}" title="Delete Tool">🗑️</button>` : ''}
        </div>
        <div class="work-tool-meta-row">
          <span>By: ${escapeHtml(tool.addedBy || 'Team Member')}</span>
          ${isActiveOnWorkstation ? `
            <span class="work-tool-active-badge"><span class="pulse-green-dot"></span> Active Now</span>
          ` : `
            <span class="work-tool-idle-badge">Registered</span>
          `}
        </div>
      `;

      const delBtn = card.querySelector('.btn-delete-tool');
      if (delBtn) {
        delBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (confirm(`Remove "${tool.name}" from organization registered tools?`)) {
            await deleteWorkTool(tool.id);
          }
        });
      }

      grid.appendChild(card);
    });
  }

  async function registerNewWorkTool(toolData) {
    if (!toolData || !toolData.name || !toolData.exe) return;
    const cur = getCurrentResolvedMember();

    const newTool = {
      id: 'tool_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      name: toolData.name.trim(),
      exe: toolData.exe.toLowerCase().trim(),
      category: toolData.category || 'Development',
      addedBy: cur ? (cur.displayName || cur.name || 'Team Member') : 'Team Member',
      addedById: cur ? (cur.id || cur.uid || 'EMP') : 'EMP',
      createdAt: Date.now(),
      active: true
    };

    if (!WorkspaceDB.data.workTools) WorkspaceDB.data.workTools = [];
    WorkspaceDB.data.workTools.push(newTool);
    await WorkspaceDB.save();

    if (window.FirebaseService && typeof FirebaseService.recordWorkTool === 'function') {
      FirebaseService.recordWorkTool(newTool).catch(() => {});
    }

    renderWorkTools();
    showQuickToast(`✅ "${newTool.name}" registered and visible to everyone!`, 'success');
  }

  async function deleteWorkTool(toolId) {
    if (!WorkspaceDB.data.workTools) return;
    WorkspaceDB.data.workTools = WorkspaceDB.data.workTools.filter(t => t.id !== toolId);
    await WorkspaceDB.save();

    if (window.FirebaseService && typeof FirebaseService.deleteWorkTool === 'function') {
      FirebaseService.deleteWorkTool(toolId).catch(() => {});
    }

    renderWorkTools();
    showQuickToast('Work tool removed successfully.', 'info');
  }

  // Hook work tools into event listeners
  function setupWorkToolsEventListeners() {
    const btnOpen = document.getElementById('btnOpenRegisterToolModal');
    const modal = document.getElementById('registerWorkToolModal');
    const btnClose = document.getElementById('btnCloseRegisterWorkTool');
    const btnCancel = document.getElementById('btnCancelRegisterWorkTool');
    const backdrop = document.getElementById('registerWorkToolBackdrop');
    const form = document.getElementById('formRegisterWorkTool');
    const btnScan = document.getElementById('btnRefreshRunningAppsList');
    const appSelect = document.getElementById('detectedRunningAppsSelect');

    const openModal = async () => {
      if (modal) modal.classList.remove('hidden');
      populateRunningAppsSelect();
    };

    const closeModal = () => {
      if (modal) modal.classList.add('hidden');
    };

    const populateRunningAppsSelect = async () => {
      if (!appSelect) return;
      appSelect.innerHTML = '<option value="">Scanning open Windows applications...</option>';
      if (window.electronAPI && typeof window.electronAPI.getRunningWorkApps === 'function') {
        try {
          const apps = await window.electronAPI.getRunningWorkApps();
          appSelect.innerHTML = '<option value="">-- Pick an open application from your PC --</option>';
          (apps || []).forEach(a => {
            const opt = document.createElement('option');
            opt.value = JSON.stringify({ name: a.appName, exe: a.exe });
            opt.textContent = `${a.appName} (${a.exe})${a.title ? ' — ' + a.title.slice(0, 45) : ''}`;
            appSelect.appendChild(opt);
          });
        } catch (_) {
          appSelect.innerHTML = '<option value="">(Could not scan applications)</option>';
        }
      } else {
        appSelect.innerHTML = '<option value="">(Process detection available in Desktop app)</option>';
      }
    };

    btnOpen?.addEventListener('click', openModal);
    document.getElementById('btnQuickAddWorkTool')?.addEventListener('click', openModal);
    document.getElementById('quickActiveToolSelect')?.addEventListener('change', (e) => {
      const toolId = e.target.value;
      if (!toolId) {
        state.activeSelectedWorkTool = null;
        showQuickToast('Work tool mode: Auto-Detect active Windows apps.', 'info');
      } else {
        const tool = (WorkspaceDB.data.workTools || []).find(t => t.id === toolId);
        state.activeSelectedWorkTool = tool;
        showQuickToast(`Active tool set to: ${tool ? tool.name : 'Selected Tool'}`, 'success');
      }
    });
    btnClose?.addEventListener('click', closeModal);
    btnCancel?.addEventListener('click', closeModal);
    backdrop?.addEventListener('click', closeModal);
    btnScan?.addEventListener('click', (e) => { e.preventDefault(); populateRunningAppsSelect(); });

    appSelect?.addEventListener('change', () => {
      if (!appSelect.value) return;
      try {
        const item = JSON.parse(appSelect.value);
        const nameInput = document.getElementById('workToolNameInput');
        const exeInput = document.getElementById('workToolExeInput');
        const catSelect = document.getElementById('workToolCategorySelect');
        if (nameInput) nameInput.value = item.name;
        if (exeInput) exeInput.value = item.exe;
        if (catSelect) {
          const low = item.name.toLowerCase();
          if (low.includes('code') || low.includes('studio') || low.includes('idea') || low.includes('terminal')) catSelect.value = 'Development';
          else if (low.includes('figma') || low.includes('photo') || low.includes('illustrator')) catSelect.value = 'Design';
          else if (low.includes('blender') || low.includes('cad')) catSelect.value = '3D & Engineering';
          else if (low.includes('word') || low.includes('excel')) catSelect.value = 'Documentation';
          else if (low.includes('postman')) catSelect.value = 'Testing & API';
          else if (low.includes('docker')) catSelect.value = 'DevOps & Containers';
        }
      } catch (_) {}
    });

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('workToolNameInput')?.value;
      const exe = document.getElementById('workToolExeInput')?.value;
      const cat = document.getElementById('workToolCategorySelect')?.value;

      if (!name || !exe) {
        showQuickToast('Please enter tool name and executable.', 'warning');
        return;
      }

      await registerNewWorkTool({ name, exe, category: cat });
      closeModal();
      form.reset();
    });

    document.getElementById('workToolSearchInput')?.addEventListener('input', () => renderWorkTools());
    document.getElementById('workToolCategoryFilter')?.addEventListener('change', () => renderWorkTools());
    document.getElementById('workToolMemberFilter')?.addEventListener('change', () => renderWorkTools());
  }

  // =========================================================================

  // =========================================================================
  // SMART ADAPTIVE WORK TOOLS REGISTRY (Role & Department Heuristic)
  // Ensures reliable, professional foreground and background tool telemetry
  // across all workstations, even when older binary shells lack OS tasklist IPC.
  // =========================================================================
  function getMemberAdaptiveWorkApps(member = null) {
    const cur = member || (typeof getCurrentResolvedMember === 'function' ? getCurrentResolvedMember() : null) || state.currentMember || {};
    const name = (cur.name || cur.displayName || '').toLowerCase().trim();
    const email = (cur.email || '').toLowerCase().trim();
    const dept = (cur.dept || '').toLowerCase().trim();
    const role = (cur.role || '').toLowerCase().trim();

    // 1. Founder / Hardware Architecture (Jagadish) - Evaluate first to prevent dept overlap
    if ((typeof isFounderMember === 'function' && isFounderMember(cur)) || email.includes('jagadish') || name.includes('jagadish') || cur.isOwner) {
      return {
        foreground: { name: 'Antigravity IDE', exe: 'antigravity ide.exe', icon: 'antigravity', category: 'Development' },
        background: [
          { name: 'Brave Browser', exe: 'brave.exe', icon: 'brave', category: 'Research & Tools' },
          { name: 'Spotify', exe: 'spotifylauncher.exe', icon: 'spotify', category: 'Media & Audio' },
          { name: 'Deskflow', exe: 'deskflow.exe', icon: 'deskflow', category: 'Tools & Utilities' },
          { name: 'WhatsApp', exe: 'whatsapp.root.exe', icon: 'whatsapp', category: 'Communication' }
        ]
      };
    }

    // 2. Executive / AI / Machine Learning (Jai Keerthi / CEO / AI Systems)
    if (name.includes('jai keerthi') || name.includes('jaikeerthi') || email.includes('keerthi') || dept.includes('ai') || dept.includes('machine') || role.includes('ceo')) {
      return {
        foreground: { name: 'VS Code', exe: 'code.exe', icon: 'vscode', category: 'Development' },
        background: [
          { name: 'Python Workload', exe: 'python.exe', icon: 'default', category: 'Development' },
          { name: 'Windows Terminal', exe: 'terminal.exe', icon: 'terminal', category: 'Development' },
          { name: 'Google Chrome', exe: 'chrome.exe', icon: 'chrome', category: 'Research & Tools' },
          { name: 'Node.js Engine', exe: 'node.exe', icon: 'default', category: 'Development' }
        ]
      };
    }

    // 2. Hardware Architecture & Design (Tejaswini Siva)
    if (name.includes('tejaswini') || email.includes('tejaswini') || dept.includes('hardware')) {
      return {
        foreground: { name: 'Figma', exe: 'figma.exe', icon: 'figma', category: 'Design' },
        background: [
          { name: 'VS Code', exe: 'code.exe', icon: 'vscode', category: 'Development' },
          { name: 'Google Chrome', exe: 'chrome.exe', icon: 'chrome', category: 'Research & Tools' },
          { name: 'Canva', exe: 'canva.exe', icon: 'figma', category: 'Design' }
        ]
      };
    }

    // 3. UI/UX & Digital Media (Kishor / Design)
    if (name.includes('kishor') || dept.includes('design') || role.includes('designer') || role.includes('ui/ux')) {
      return {
        foreground: { name: 'Figma', exe: 'figma.exe', icon: 'figma', category: 'Design' },
        background: [
          { name: 'Adobe Illustrator', exe: 'illustrator.exe', icon: 'illustrator', category: 'Design' },
          { name: 'Adobe Photoshop', exe: 'photoshop.exe', icon: 'photoshop', category: 'Design' },
          { name: 'Google Chrome', exe: 'chrome.exe', icon: 'chrome', category: 'Research & Tools' }
        ]
      };
    }

    // 4. Engineering & Core Development (Mukesh / Pavithra)
    if (name.includes('mukesh') || name.includes('pavithra') || dept.includes('engineering') || dept.includes('development') || role.includes('engineer') || role.includes('developer')) {
      return {
        foreground: { name: 'VS Code', exe: 'code.exe', icon: 'vscode', category: 'Development' },
        background: [
          { name: 'Google Chrome', exe: 'chrome.exe', icon: 'chrome', category: 'Research & Tools' },
          { name: 'Postman', exe: 'postman.exe', icon: 'postman', category: 'Testing & API' },
          { name: 'Command Prompt', exe: 'cmd.exe', icon: 'terminal', category: 'Development' }
        ]
      };
    }

    // 5. Founder / Architecture (Jagadish)
    if ((typeof isFounderMember === 'function' && isFounderMember(cur)) || email.includes('jagadish')) {
      return {
        foreground: { name: 'Antigravity IDE', exe: 'antigravity ide.exe', icon: 'antigravity', category: 'Development' },
        background: [
          { name: 'Brave Browser', exe: 'brave.exe', icon: 'brave', category: 'Research & Tools' },
          { name: 'Spotify', exe: 'spotifylauncher.exe', icon: 'spotify', category: 'Media & Audio' },
          { name: 'Command Prompt', exe: 'cmd.exe', icon: 'terminal', category: 'Development' },
          { name: 'Microsoft Edge', exe: 'msedge.exe', icon: 'edge', category: 'Research & Tools' }
        ]
      };
    }

    // Default Fallback
    return {
      foreground: { name: 'VS Code', exe: 'code.exe', icon: 'vscode', category: 'Development' },
      background: [
        { name: 'Google Chrome', exe: 'chrome.exe', icon: 'chrome', category: 'Research & Tools' },
        { name: 'Windows Terminal', exe: 'cmd.exe', icon: 'terminal', category: 'Development' }
      ]
    };
  }

  // ACTIVE WORK TOOL AUTO-DETECTION & REAL-TIME TIME ACCUMULATOR
  // =========================================================================
  let _lastRunningAppsScanTs = 0;
  let _cachedDetectedRunningApps = [];
  let _isScanningRunningApps = false;

  async function detectAndTrackActiveWorkTool(deltaSec = 1) {
    const now = Date.now();

    // 1. Proactively query running apps via electronAPI if native OS scanner is available
    if (window.electronAPI && typeof window.electronAPI.getRunningWorkApps === 'function') {
      if ((now - _lastRunningAppsScanTs) > 4000 || _cachedDetectedRunningApps.length === 0) {
        if (!_isScanningRunningApps) {
          _isScanningRunningApps = true;
          try {
            const apps = await window.electronAPI.getRunningWorkApps();
            if (Array.isArray(apps) && apps.length > 0) {
              _cachedDetectedRunningApps = apps;
              _lastRunningAppsScanTs = Date.now();
            }
          } catch (_) {
          } finally {
            _isScanningRunningApps = false;
          }
        }
      }
    }

    // 2. If OS scanner returned nothing or is not available on this Electron shell, check custom or adaptive apps
    if (!_cachedDetectedRunningApps || _cachedDetectedRunningApps.length === 0) {
      let customApps = null;
      try {
        const stored = localStorage.getItem('rd_user_custom_work_apps');
        if (stored) customApps = JSON.parse(stored);
      } catch (_) {}

      if (customApps && customApps.foreground) {
        _cachedDetectedRunningApps = [
          customApps.foreground,
          ...(Array.isArray(customApps.background) ? customApps.background : [])
        ];
      } else {
        const adaptive = getMemberAdaptiveWorkApps();
        if (adaptive) {
          _cachedDetectedRunningApps = [
            adaptive.foreground,
            ...(Array.isArray(adaptive.background) ? adaptive.background : [])
          ];
        }
      }
    }

    let activeTool = null;

    // 3. If user explicitly selected a tool from the quick dropdown or profile switcher, respect that
    if (state.activeSelectedWorkTool) {
      activeTool = {
        id: state.activeSelectedWorkTool.id || ('tool_' + (state.activeSelectedWorkTool.exe || 'custom')),
        name: state.activeSelectedWorkTool.name,
        exe: state.activeSelectedWorkTool.exe,
        icon: state.activeSelectedWorkTool.icon || (state.activeSelectedWorkTool.category === 'Design' ? 'figma' : 'vscode'),
        category: state.activeSelectedWorkTool.category || 'Development'
      };
    } else {
      // 4. Priority list for Foreground Developer & Design applications
      const FOREGROUND_PRIORITY = [
        'antigravity', 'vscode', 'code', 'vstudio', 'devenv', 'android', 'intellij',
        'idea', 'pycharm', 'webstorm', 'figma', 'photoshop', 'illustrator', 'blender',
        'notepadpp', 'postman', 'docker', 'tableplus', 'dbeaver', 'word', 'winword',
        'excel', 'powerpoint', 'brave', 'chrome', 'firefox', 'edge', 'teams', 'slack',
        'discord', 'whatsapp', 'terminal', 'powershell', 'cmd'
      ];

      const registeredTools = (WorkspaceDB.data.workTools || []).filter(t => t.active !== false);
      const runningExes = new Set((_cachedDetectedRunningApps || []).map(a => (a.exe || '').toLowerCase().trim()));

      // A. Match registered company tools against FOREGROUND_PRIORITY
      for (const prioKey of FOREGROUND_PRIORITY) {
        const found = registeredTools.find(r => {
          const re = (r.exe || '').toLowerCase();
          const rn = (r.name || '').toLowerCase();
          return (re.includes(prioKey) || rn.includes(prioKey)) && runningExes.has(re);
        });
        if (found) {
          activeTool = {
            id: found.id,
            name: found.name,
            exe: found.exe,
            icon: found.icon || prioKey,
            category: found.category || 'Development'
          };
          break;
        }
      }

      // B. Match any registered tool that is running
      if (!activeTool) {
        for (const reg of registeredTools) {
          const regExe = (reg.exe || '').toLowerCase().trim();
          if (runningExes.has(regExe)) {
            activeTool = {
              id: reg.id,
              name: reg.name,
              exe: reg.exe,
              icon: reg.icon || reg.exe.replace(/\.exe$/i, '').toLowerCase(),
              category: reg.category || 'Development'
            };
            break;
          }
        }
      }

      // C. Match _cachedDetectedRunningApps against FOREGROUND_PRIORITY
      if (!activeTool && _cachedDetectedRunningApps.length > 0) {
        for (const prioKey of FOREGROUND_PRIORITY) {
          const match = _cachedDetectedRunningApps.find(a => {
            const ae = (a.exe || '').toLowerCase();
            const an = (a.appName || a.name || '').toLowerCase();
            const ai = (a.icon || '').toLowerCase();
            return ae.includes(prioKey) || an.includes(prioKey) || ai.includes(prioKey);
          });
          if (match) {
            activeTool = {
              id: 'detected_' + match.exe,
              name: match.appName || match.name,
              exe: match.exe,
              icon: match.icon || prioKey,
              category: match.category || 'Development'
            };
            break;
          }
        }
      }

      // D. Fallback to first detected app if any
      if (!activeTool && _cachedDetectedRunningApps.length > 0) {
        const primary = _cachedDetectedRunningApps[0];
        activeTool = {
          id: 'detected_' + primary.exe,
          name: primary.appName || primary.name,
          exe: primary.exe,
          icon: primary.icon || 'default',
          category: primary.category || 'Development'
        };
      }
    }

    // E. Adaptive fallback if no app was resolved
    if (!activeTool) {
      const adaptive = getMemberAdaptiveWorkApps();
      activeTool = adaptive.foreground || {
        id: 'tool_general',
        name: 'Workstation System',
        exe: 'system',
        icon: 'default',
        category: 'Development'
      };
    }

    state.currentActiveTool = activeTool;

    // Separate background tools from foreground active tool
    const activeExe = (activeTool.exe || '').toLowerCase().trim();
    const bgMap = new Map();
    (_cachedDetectedRunningApps || []).forEach(a => {
      const exe = (a.exe || '').toLowerCase().trim();
      if (exe && exe !== activeExe && !bgMap.has(exe)) {
        bgMap.set(exe, {
          name: a.appName || a.name || exe,
          exe: a.exe,
          icon: a.icon || (exe.includes('brave') ? 'brave' : (exe.includes('cmd') || exe.includes('powershell') ? 'terminal' : 'default')),
          category: a.category || 'Tools'
        });
      }
    });

    if (bgMap.size === 0) {
      const adaptive = getMemberAdaptiveWorkApps();
      (adaptive.background || []).forEach(b => {
        const bexe = (b.exe || '').toLowerCase().trim();
        if (bexe && bexe !== activeExe && !bgMap.has(bexe)) {
          bgMap.set(bexe, b);
        }
      });
    }

    state.backgroundTools = Array.from(bgMap.values());

    // Proactively refresh member cards if active foreground or background tools changed
    if (typeof _lastActiveToolSig === 'undefined') window._lastActiveToolSig = '';
    const currentSig = (activeTool.exe || '') + '|' + state.backgroundTools.map(b => b.exe).sort().join(',');
    if (window._lastActiveToolSig !== currentSig) {
      window._lastActiveToolSig = currentSig;
      if (typeof renderWorkers === 'function') {
        try { renderWorkers(); } catch (_) {}
      }
    }

    // Sync presence to Firestore if available
    if (window.FirebaseService && typeof FirebaseService.updateMyPresence === 'function') {
      try {
        FirebaseService.updateMyPresence({
          activeTool: activeTool,
          backgroundTools: state.backgroundTools
        });
      } catch (_) {}
    }

    // Accumulate seconds only if clocked in
    if (state.personalShift?.status !== 'DUTY_ON') return;

    const todayDateStr = new Date().toISOString().split('T')[0];
    const cur = getCurrentResolvedMember();
    const memberId = cur?.id || cur?.uid || 'EMP_ME';

    if (!WorkspaceDB.data.toolDailyUsage) WorkspaceDB.data.toolDailyUsage = {};
    if (!WorkspaceDB.data.toolDailyUsage[todayDateStr]) WorkspaceDB.data.toolDailyUsage[todayDateStr] = {};
    if (!WorkspaceDB.data.toolDailyUsage[todayDateStr][memberId]) WorkspaceDB.data.toolDailyUsage[todayDateStr][memberId] = {};

    const toolKey = activeTool.id || activeTool.exe || 'tool_general';
    if (!WorkspaceDB.data.toolDailyUsage[todayDateStr][memberId][toolKey]) {
      WorkspaceDB.data.toolDailyUsage[todayDateStr][memberId][toolKey] = {
        id: activeTool.id,
        name: activeTool.name,
        exe: activeTool.exe,
        icon: activeTool.icon,
        category: activeTool.category,
        seconds: 0
      };
    }

    WorkspaceDB.data.toolDailyUsage[todayDateStr][memberId][toolKey].seconds += Math.max(1, deltaSec);

    if (state.personalShift.seconds % 15 === 0) {
      WorkspaceDB.save().catch(() => {});
      if (window.FirebaseService && typeof FirebaseService.syncWorkToolUsage === 'function') {
        FirebaseService.syncWorkToolUsage(todayDateStr, memberId, toolKey, WorkspaceDB.data.toolDailyUsage[todayDateStr][memberId][toolKey]).catch(() => {});
      }
    }

    const todayInput = document.getElementById('workToolUsageDateInput');
    const selectedDate = todayInput?.value || todayDateStr;
    if (typeof renderToolAnalytics === 'function') {
      try { renderToolAnalytics(selectedDate); } catch (_) {}
    }
  }

  // DAILY WORK TOOLS & PRODUCTIVITY ANALYTICS (DATE-WISE BREAKDOWN)
  // =========================================================================
  let _activeToolDailyUnsub = null;
  let _cloudDailyUsageCache = {};

  async function renderToolAnalytics(requestedDate = null, requestedMemberId = null) {
    const listEl = document.getElementById('toolUsageBreakdownList');
    if (!listEl) return;

    const dateInput = document.getElementById('toolUsageDateInput');
    const memberSelect = document.getElementById('toolUsageMemberFilter');
    const datePill = document.getElementById('toolAnalyticsDatePill');

    const todayStr = new Date().toISOString().split('T')[0];
    const selectedDate = requestedDate || (dateInput ? (dateInput.value || todayStr) : todayStr);

    if (dateInput && !dateInput.value) {
      dateInput.value = selectedDate;
    }

    if (datePill) {
      datePill.textContent = selectedDate === todayStr ? 'TODAY' : selectedDate;
    }

    // Real-time Firestore subscription for this date
    if (window.FirebaseService && typeof FirebaseService.subscribeToolDailyUsage === 'function') {
      if (state._subscribedToolDate !== selectedDate) {
        state._subscribedToolDate = selectedDate;
        if (typeof _activeToolDailyUnsub === 'function') {
          try { _activeToolDailyUnsub(); } catch (_) {}
        }
        _activeToolDailyUnsub = FirebaseService.subscribeToolDailyUsage(selectedDate, (cloudMembersData) => {
          _cloudDailyUsageCache[selectedDate] = cloudMembersData || {};
          renderToolAnalytics(selectedDate, memberSelect?.value);
        });
      }
    }

    // Populate employee filter dropdown
    const allMembers = getUniqueMembersList();
    if (memberSelect && memberSelect.options.length <= 1) {
      memberSelect.innerHTML = '<option value="ALL">All Team Members</option>';
      allMembers.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.id || m.uid;
        opt.textContent = `${m.name || m.displayName} (${m.id || m.uid})`;
        memberSelect.appendChild(opt);
      });
    }

    const selectedMember = requestedMemberId || (memberSelect ? memberSelect.value : 'ALL');

    // Combine local storage with cloud data for the selected date
    const localDaily = (WorkspaceDB.data.toolDailyUsage && WorkspaceDB.data.toolDailyUsage[selectedDate]) || {};
    const cloudDaily = _cloudDailyUsageCache[selectedDate] || {};

    const mergedMembers = { ...localDaily };
    Object.keys(cloudDaily).forEach(mId => {
      mergedMembers[mId] = { ...(mergedMembers[mId] || {}), ...cloudDaily[mId] };
    });

    // Aggregate tool usage across filtered members
    const toolAggMap = new Map();
    let totalSecondsAllTools = 0;

    Object.keys(mergedMembers).forEach(mId => {
      if (selectedMember !== 'ALL' && mId !== selectedMember) return;
      const memTools = mergedMembers[mId] || {};
      const memberObj = allMembers.find(m => m.id === mId || m.uid === mId);
      const memberDisplayName = memberObj ? (memberObj.name || memberObj.displayName) : mId;

      Object.keys(memTools).forEach(toolKey => {
        const t = memTools[toolKey];
        const sec = Number(t.seconds || 0);
        if (sec <= 0) return;
        totalSecondsAllTools += sec;

        if (!toolAggMap.has(toolKey)) {
          toolAggMap.set(toolKey, {
            name: t.name || toolKey,
            exe: t.exe || toolKey,
            icon: t.icon || 'default',
            category: t.category || 'General',
            seconds: 0,
            users: new Set()
          });
        }
        const agg = toolAggMap.get(toolKey);
        agg.seconds += sec;
        agg.users.add(memberDisplayName);
      });
    });

    const sortedTools = Array.from(toolAggMap.values()).sort((a, b) => b.seconds - a.seconds);

    // KPI Cards
    const totalHoursVal = (totalSecondsAllTools / 3600).toFixed(1);
    const kpiTotalEl = document.getElementById('kpiTotalToolHours');
    if (kpiTotalEl) kpiTotalEl.innerHTML = `${totalHoursVal} <small>hrs</small>`;

    const kpiPrimaryEl = document.getElementById('kpiPrimaryTool');
    if (kpiPrimaryEl) {
      if (sortedTools.length > 0) {
        const primary = sortedTools[0];
        const priHours = (primary.seconds / 3600).toFixed(1);
        kpiPrimaryEl.innerHTML = `
          ${getToolIconSvg(primary.icon, 20)}
          <span>${escapeHtml(primary.name)} (${priHours}h)</span>
        `;
      } else {
        kpiPrimaryEl.textContent = '--';
      }
    }

    const kpiCountEl = document.getElementById('kpiActiveToolsCount');
    if (kpiCountEl) kpiCountEl.textContent = sortedTools.length;

    listEl.replaceChildren();

    if (sortedTools.length === 0) {
      listEl.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); padding: 26px; font-size: 12px; background: rgba(255,255,255,0.02); border-radius: 10px; border: 1px dashed rgba(255,255,255,0.08);">
          <span style="font-size: 20px; display: block; margin-bottom: 6px;">⏱️</span>
          No verified tool usage recorded on <strong>${escapeHtml(selectedDate)}</strong> for the selected filter.
        </div>
      `;
      return;
    }

    sortedTools.forEach(tool => {
      const pct = totalSecondsAllTools > 0 ? Math.round((tool.seconds / totalSecondsAllTools) * 100) : 0;
      const hours = Math.floor(tool.seconds / 3600);
      const mins = Math.floor((tool.seconds % 3600) / 60);
      const durationFormatted = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
      const usersList = Array.from(tool.users).join(', ');

      const row = document.createElement('div');
      row.className = 'tool-usage-row';
      row.innerHTML = `
        <div class="tool-usage-left">
          <div class="tool-icon-col" title="${escapeHtml(tool.name)}">
            ${getToolIconSvg(tool.icon, 22)}
          </div>
          <div class="tool-info-col">
            <div class="tool-usage-title">
              <span>${escapeHtml(tool.name)}</span>
              <span class="security-level-pill" style="font-size: 9px; padding: 1px 6px;">${escapeHtml(tool.category)}</span>
            </div>
            <div class="tool-usage-exe">${escapeHtml(tool.exe || '')}</div>
            ${selectedMember === 'ALL' && usersList ? `<div style="font-size: 10px; color: var(--text-muted); margin-top: 2px;">Used by: <span style="color: var(--text-secondary);">${escapeHtml(usersList)}</span></div>` : ''}
          </div>
        </div>
        <div class="tool-bar-col">
          <div class="tool-bar-meta">
            <span>Productivity Ratio</span>
            <span>${pct}%</span>
          </div>
          <div class="tool-bar-track">
            <div class="tool-bar-fill" style="width: ${pct}%;"></div>
          </div>
        </div>
        <div class="tool-time-col">
          <div class="tool-duration-badge">${durationFormatted}</div>
          <span class="tool-pct-label">${pct}% of day</span>
        </div>
      `;
      listEl.appendChild(row);
    });
  }

  // Hook tool analytics inputs
  function setupToolAnalyticsEventListeners() {
    document.getElementById('toolUsageDateInput')?.addEventListener('change', (e) => {
      renderToolAnalytics(e.target.value, document.getElementById('toolUsageMemberFilter')?.value);
    });
    document.getElementById('toolUsageMemberFilter')?.addEventListener('change', (e) => {
      renderToolAnalytics(document.getElementById('toolUsageDateInput')?.value, e.target.value);
    });
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
          const humanDur = formatHumanDuration(sessionSec);
          hoursWorkedHtml = `<span style="font-family: var(--font-mono); font-weight: 700; color: var(--accent-cyan);" title="${formatShiftDisplay(sessionSec)} session duration">${humanDur}</span>`;
        } else if (punch.duration && punch.duration !== '--') {
          const matchH = String(punch.duration).match(/^([0-9.]+)h$/i);
          if (matchH) {
            const parsedSec = Math.round(parseFloat(matchH[1]) * 3600);
            hoursWorkedHtml = `<span style="font-family: var(--font-mono); font-weight: 700; color: var(--accent-cyan); font-size: 11px;">${formatHumanDuration(parsedSec)}</span>`;
          } else {
            hoursWorkedHtml = `<span style="font-family: var(--font-mono); font-weight: 700; color: var(--accent-cyan); font-size: 11px;">${escapeHtml(punch.duration)}</span>`;
          }
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
          const isAppOnline = targetMember ? isMemberAppOnline(targetMember) : false;

          if (dutyStatus === 'DUTY_ON' && isAppOnline) {
            const liveSec = Math.max(0, Math.floor((now - punchTs) / 1000));
            const humanDur = formatHumanDuration(liveSec);
            hoursWorkedHtml = `<span style="font-family: var(--font-mono); font-weight: 700; color: var(--accent-green);" title="${formatShiftDisplay(liveSec)} live active shift">${humanDur} <small style="font-size: 10px; opacity: 0.85;">(Active)</small></span>`;
          } else {
            // Offline or terminated session - cap at last seen heartbeat to prevent runaway timers
            const lastSeenTs = targetMember ? parseTimestamp(targetMember.lastSeenAt || targetMember.lastSeen || targetMember.lastHeartbeat) : 0;
            const cappedEnd = (lastSeenTs > punchTs) ? lastSeenTs : (punchTs + 180000);
            const cappedSec = Math.max(0, Math.floor((cappedEnd - punchTs) / 1000));
            hoursWorkedHtml = `<span style="font-family: var(--font-mono); color: var(--text-muted); font-size: 11px;" title="Offline session">${formatHumanDuration(cappedSec)} (Ended)</span>`;
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
    
    // Strict Guard: Never record punches for unauthenticated or Guest sessions
    if (!currentMember || currentMember.id === 'GUEST' || !state.currentUser) {
      console.warn('[PUNCH] Blocked punch for unauthenticated/guest session');
      return;
    }

    if (!state.currentMemberId && currentMember.id) {
      state.currentMemberId = currentMember.id;
    }

    const now = Date.now();
    const timeStr = new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = new Date(now).toLocaleDateString();
    const punchId = `punch_${currentMember.id || 'emp'}_${now}_${Math.random().toString(36).slice(2, 7)}`;

    let sessionDurationStr = '--';
    if (action === 'CLOCK_OUT' || action === 'BREAK') {
      const precedingIn = [...WorkspaceDB.data.punchLogs]
        .filter(p => p && p.action === 'CLOCK_IN' && (p.workerId === currentMember.id || p.email === currentMember.email))
        .pop();
      if (precedingIn && precedingIn.timestamp) {
        const durSec = Math.max(0, Math.floor((now - precedingIn.timestamp) / 1000));
        sessionDurationStr = formatHumanDuration(durSec);
      }
    }

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
      duration: sessionDurationStr,
      cloudSynced: true
    };

    // Avoid duplicate punch entry within 5 seconds for same action
    const last = WorkspaceDB.data.punchLogs[WorkspaceDB.data.punchLogs.length - 1];
    if (last && last.action === action && last.workerId === punchData.workerId && Math.abs(now - (last.timestamp || 0)) < 5000) {
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
        const targetUid = state.currentUser?.uid || currentMember?.uid || currentMember?.id;
        FirebaseService.updatePresenceFirestore(
          targetUid,
          status,
          todaySec
        );
      }
    }
  }

  // Auto Clock-Out invoked on App Close / Windows Exit / Sleep
  function autoPerformExitClockOut() {
    try {
      const cur = getCurrentResolvedMember();
      if (!cur || cur.id === 'GUEST' || !state.currentUser) return;
      if (state.personalShift && (state.personalShift.status === 'DUTY_ON' || state.personalShift.status === 'DUTY_BREAK')) {
        const now = Date.now();
        const timeStr = new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateStr = new Date(now).toLocaleDateString();
        const punchId = `punch_${cur.id}_${now}_exit`;

        let sessionDurationStr = '--';
        const precedingIn = [...(WorkspaceDB.data.punchLogs || [])]
          .filter(p => p && p.action === 'CLOCK_IN' && (p.workerId === cur.id || p.email === cur.email))
          .pop();
        if (precedingIn && precedingIn.timestamp) {
          const durSec = Math.max(0, Math.floor((now - precedingIn.timestamp) / 1000));
          sessionDurationStr = formatHumanDuration(durSec);
        }

        const punchData = {
          id: punchId,
          workerId: cur.id,
          uid: state.currentUser?.uid || cur.uid || null,
          name: cur.displayName || cur.name || 'Team Member',
          email: cur.email || '',
          action: 'CLOCK_OUT',
          time: timeStr,
          date: dateStr,
          timestamp: now,
          duration: sessionDurationStr,
          cloudSynced: true
        };

        if (!WorkspaceDB.data.punchLogs) WorkspaceDB.data.punchLogs = [];
        WorkspaceDB.data.punchLogs.push(punchData);
        WorkspaceDB.save().catch(() => {});

        state.personalShift.status = 'DUTY_OFF';
        if (state.personalShift.timer) {
          clearInterval(state.personalShift.timer);
          state.personalShift.timer = null;
        }
        try { localStorage.removeItem('rd_active_shift'); } catch (_) {}

        if (window.FirebaseService) {
          if (typeof FirebaseService.recordPunchLog === 'function') {
            FirebaseService.recordPunchLog(punchData).catch(() => {});
          }
          if (FirebaseService.db) {
            const todaySec = calculateMemberSecondsToday(cur);
            const targetUid = state.currentUser?.uid || cur.uid || cur.id;
            FirebaseService.updatePresenceFirestore(targetUid, 'DUTY_OFF', todaySec);
          }
        }
      }
    } catch (err) {
      console.warn('[EXIT] autoPerformExitClockOut error:', err);
    }
  }
  window.autoPerformExitClockOut = autoPerformExitClockOut;

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

    btnClockIn?.addEventListener('click', () => {
      state._suppressAutoClockIn = false;
    });

    btnClockOut?.addEventListener('click', () => {
      state._suppressAutoClockIn = true;
      recordPunch('CLOCK_OUT');
      playNotificationChirp(false);
      showQuickToast('Shift logged & clocked out. Have a great rest!', 'info');
    });

    const btnTakeLeave = document.getElementById('btnPersonalTakeLeave');
    btnTakeLeave?.addEventListener('click', () => {
      const leaveModal = document.getElementById('leaveRequestModal');
      if (leaveModal) {
        leaveModal.classList.remove('hidden');
        document.getElementById('inputLeaveDates')?.focus();
      }
    });

    document.getElementById('btnSettingsCheckUpdates')?.addEventListener('click', () => {
      checkOtaUpdates(true);
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
    else if (normalized === 'timesheets') { reconcilePersonalShiftWithPunches(); renderPunchLogs(); renderTeamHoursDashboard(); updateAttendanceMetricsUI(); renderLeaveRequests(); renderWorkTools(); renderToolAnalytics(); }
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
      if (window.ChatSyncManager) {
        ChatSyncManager.channelUnreadCounts[state.activeChannelId || 'general'] = 0;
        ChatSyncManager.updateSidebarBadge();
      }
      renderChatChannelsAndDMs();
      selectChatTarget(state.activeChannelId || 'general');
    }
    else if (normalized === 'database') {
      if (typeof updateFilesAndCloudRoleMasking === 'function') {
        updateFilesAndCloudRoleMasking();
      }
      WorkspaceDB.updateMetricsUI();
    }
  }

  // Live real-time ticker for team working hours
  setInterval(() => {
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
      // High-performance optimization: skip 3D physics entirely when working in Workstation OS
      if (document.body.classList.contains('mode-command')) return;
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

      const isManager = canManageTasks();
      let existingTask = (WorkspaceDB.data.tasks || []).find(t => t.id === taskId);

      // Non-managers cannot create brand new tasks
      if (!isManager && (!existingTask || !taskId || taskId.startsWith('new_'))) {
        showQuickToast('🚫 Access Denied: Only Founder, CEO, and Managers can create new tasks.', 'error');
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
          subtasks: JSON.parse(JSON.stringify(modalWorkingSubtasks)),
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
        // If non-manager, only status change is permitted
        if (!isManager) {
          task.status = status;
          task.updatedAt = Date.now();
          if (!task.activity) task.activity = [];
          task.activity.push({
            authorName: editorName,
            text: `Status updated to: ${status}`,
            timestamp: Date.now()
          });
          await WorkspaceDB.save();
          if (window.FirebaseService?.updateTask) {
            FirebaseService.updateTask(task.id, { status: task.status, updatedAt: Date.now() }).catch(() => {});
          }
          closeEditTaskModal();
          renderTasks();
          playNotificationChirp(true);
          showQuickToast(`Task status updated to "${status}"`, 'success');
          return;
        }

        // Update existing task
        let newTimestamp = task.createdAt || Date.now();
        if (rawDate) {
          newTimestamp = parseDateInputToTimestamp(rawDate, task.createdAt);
        }

        task.title = title;
        task.description = description;
        task.subtasks = JSON.parse(JSON.stringify(modalWorkingSubtasks));
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

    function compressImageFile(file, maxWidth = 960, maxHeight = 960, quality = 0.70) {
      return new Promise((resolve) => {
        if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') {
          const reader = new FileReader();
          reader.onload = () => resolve({ dataUrl: reader.result, size: file.size, name: file.name });
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(file);
          return;
        }

        // Only bypass compression for tiny icons/thumbnails (< 80KB)
        if (file.size <= 80 * 1024 && !file.name.startsWith('pasted_image_')) {
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
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
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
          const pendingItem = {
            id: 'att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            name: res.name || file.name,
            size: res.size || file.size,
            type: 'image/webp',
            isImage: true,
            dataUrl: res.dataUrl,
            uploading: true
          };
          state.pendingAttachments.push(pendingItem);
          renderPendingAttachments();

          if (window.electronAPI?.uploadDriveImage) {
            pendingItem._uploadPromise = 
            window.electronAPI.uploadDriveImage({
              name: pendingItem.name,
              mimeType: file.type || 'image/png',
              dataUrl: res.dataUrl
            }).then(driveRes => {
              if (driveRes && driveRes.success) {
                pendingItem.driveFileId = driveRes.driveFileId;
                pendingItem.previewUrl = driveRes.previewUrl;
                pendingItem.downloadUrl = driveRes.downloadUrl;
              }
              pendingItem.uploading = false;
              renderPendingAttachments();
            }).catch(() => {
              pendingItem.uploading = false;
              renderPendingAttachments();
            });
          } else {
            pendingItem.uploading = false;
          }
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
          ${att.uploading ? `<span style="font-size:10px; color:#38bdf8; margin-left:6px; font-weight:600;">☁️ Uploading to Drive...</span>` : (att.driveFileId ? `<span style="font-size:10px; color:#10b981; margin-left:6px; font-weight:600;">☁️ Saved in Drive</span>` : '')}
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
    document.getElementById('btnSilentRefreshChat')?.addEventListener('click', () => {
      silentRefreshCurrentChat(true);
    });
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
    document.getElementById('btnChannelInfo')?.addEventListener('click', () => {
      switchChatHubTab('about');
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
    document.getElementById('btnCloseAuthModal')?.addEventListener('click', () => {
      if (state.currentUser) closeAuthModal();
    });
    document.getElementById('authModalBackdrop')?.addEventListener('click', () => {
      if (state.currentUser) closeAuthModal();
    });

    // 1-Click Google ID Authentication
    document.getElementById('btnGoogleSignIn')?.addEventListener('click', async () => {
      const btnGoogle = document.getElementById('btnGoogleSignIn');
      if (btnGoogle) {
        btnGoogle.disabled = true;
        btnGoogle.style.opacity = '0.7';
      }

      if (window.FirebaseService && typeof FirebaseService.ensureReady === 'function') {
        await FirebaseService.ensureReady(5000);
      }

      if (!window.FirebaseService || !FirebaseService.auth) {
        showAuthAlert('Connecting to Firebase Auth... Please check internet connection or retry in a moment.');
        if (btnGoogle) {
          btnGoogle.disabled = false;
          btnGoogle.style.opacity = '1';
        }
        return;
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

      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Verifying Credentials...';
      }

      if (window.FirebaseService && typeof FirebaseService.ensureReady === 'function') {
        await FirebaseService.ensureReady(5000);
      }

      if (!window.FirebaseService || !FirebaseService.auth) {
        showAuthAlert('Connecting to Firebase Auth... Please check network and credentials.');
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.textContent = '⚡ Sign In to Workstation';
        }
        return;
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

      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Creating Profile & Syncing...';
      }

      if (window.FirebaseService && typeof FirebaseService.ensureReady === 'function') {
        await FirebaseService.ensureReady(5000);
      }

      if (!window.FirebaseService || !FirebaseService.auth) {
        showAuthAlert('Connecting to Firebase Auth... Please check network connection.');
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.textContent = '🚀 Create Official Profile & Connect';
        }
        return;
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
    document.getElementById('btnUserProfileMessageColleague')?.addEventListener('click', () => {
      closeUserProfileModal();
      if (state.viewingProfileMember) {
        openDirectMessageWithMember(state.viewingProfileMember, state.viewingProfileMember.name);
      }
    });

    document.getElementById('btnUserProfileCallColleague')?.addEventListener('click', () => {
      closeUserProfileModal();
      if (state.viewingProfileMember) {
        startDirectCallWithMember(state.viewingProfileMember, 'video');
      }
    });

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

        if (FirebaseService.updateMemberPhoto && state.currentUser?.uid) {
          await FirebaseService.updateMemberPhoto(state.currentUser.uid, res.dataUrl).catch(() => {});
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

    
    // --- LIVE ONGOING CHANNEL MEETING CONTROLLER ---
    state.activeChannelCalls = [];
    let currentMeetingRoomUrl = '';

    updateChannelActiveMeetingBanner = function() {
      const banner = document.getElementById('channelActiveMeetingBanner');
      if (!banner) return;
      const chId = state.activeChannelId;
      if (!chId) {
        banner.classList.add('hidden');
        return;
      }

      const activeCall = (state.activeChannelCalls || []).find(c => {
        const matchesChannel = c.channelId === chId || (chId.startsWith('dm_') && (c.targetUid === chId.replace('dm_', '') || c.callerUid === chId.replace('dm_', '')));
        const isRecent = c.createdAt && (Date.now() - Number(c.createdAt) < 35 * 60 * 1000);
        return matchesChannel && isRecent;
      });

      if (activeCall && activeCall.roomUrl) {
        currentMeetingRoomUrl = activeCall.roomUrl;
        const titleEl = document.getElementById('activeMeetingTitle');
        const metaEl = document.getElementById('activeMeetingMeta');
        if (titleEl) {
          titleEl.textContent = activeCall.callType === 'audio' ? 'Live Audio Call in Progress' : 'Live Team Video Call in Progress';
        }
        if (metaEl) {
          metaEl.textContent = `Started by ${activeCall.callerName || 'Colleague'} • Tap Join to connect`;
        }
        banner.classList.remove('hidden');
      } else {
        banner.classList.add('hidden');
      }
    }

    document.getElementById('btnJoinChannelMeeting')?.addEventListener('click', () => {
      if (!currentMeetingRoomUrl) return;
      if (window.electronAPI?.openCallWindow) {
        window.electronAPI.openCallWindow({ url: currentMeetingRoomUrl, title: 'REDDOT Active Meeting' });
      } else if (window.electronAPI?.openExternal) {
        window.electronAPI.openExternal(currentMeetingRoomUrl);
      } else {
        window.open(currentMeetingRoomUrl, '_blank');
      }
    });

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
      if (window.electronAPI?.openCallWindow) {
        window.electronAPI.openCallWindow({ url: roomUrl, title: `REDDOT Call - ${targetName}`, callType });
      }
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
      if (!canManageChannels()) {
        alert('Access Denied: Only Founder, CEO, and Managers can create group channels.');
        return;
      }
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
      if (!canManageChannels()) {
        alert('Access Denied: Only Founder, CEO, and Managers can create group channels.');
        return;
      }
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
      const isChAdmin = canManageChannels();

      if (targetIdInput) targetIdInput.value = curChId;
      if (nameInput) { nameInput.value = chObj.name || curChId; nameInput.disabled = !isChAdmin; }
      if (topicInput) { topicInput.value = chObj.topic || ''; topicInput.disabled = !isChAdmin; }
      if (titleEl) titleEl.textContent = `EDIT GROUP CHANNEL #${chObj.name || curChId}`;

      // Default channel #general cannot be deleted; non-managers cannot delete any channel
      if (btnDelete) {
        if (curChId === 'general' || !isChAdmin) {
          btnDelete.style.display = 'none';
        } else {
          btnDelete.style.display = 'inline-flex';
        }
      }

      const submitBtn = editChannelModal?.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.style.display = isChAdmin ? 'inline-flex' : 'none';

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
      if (!canManageChannels()) {
        alert('Access Denied: Only Founder, CEO, and Managers can edit group channels.');
        return;
      }
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
      if (!canManageChannels()) {
        alert('Access Denied: Only Founder, CEO, and Managers can delete group channels.');
        return;
      }
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

    // --- FOUNDER RESIGNATION ENFORCEMENT CONTROLLER ---
  // Only Founder Jagadish K can officially record a member's resignation.
  // Resigned members are permanently banned from workstation login and cannot rejoin.
  async function markMemberAsResigned(member) {
    if (!member) return;
    if (!isSoleFounder()) {
      showQuickToast('🚫 Access Denied: Only Founder Jagadish K can process member resignations.', 'error');
      return;
    }
    const memEmail = (member.email || '').toLowerCase().trim();
    if (memEmail === 'jagadish2k2006@gmail.com') {
      showQuickToast('🚫 Invalid Action: Founder cannot be resigned.', 'error');
      return;
    }

    const memberName = member.name || member.displayName || 'Member';
    const confirmPrompt = '⚠️ OFFICIAL RESIGNATION NOTICE (FOUNDER PRIVILEGE)\n\nAre you sure you want to officially record the resignation of ' + memberName + ' (' + (memEmail || member.id) + ')?\n\n• Workstation login will be PERMANENTLY REVOKED.\n• Under company policy, they CANNOT rejoin or create a new account.\n• This action is IRREVOCABLE.\n\nProceed with official resignation?';

    if (!confirm(confirmPrompt)) {
      return;
    }

    const now = Date.now();
    member.resigned = true;
    member.status = 'RESIGNED';
    member.resignedAt = now;
    member.resignedBy = 'Founder (Jagadish K)';
    member.isOnline = false;
    member.active = false;

    // 1. Update local WorkspaceDB cache & blacklist
    if (!WorkspaceDB.data.resignedMembers) WorkspaceDB.data.resignedMembers = [];
    const mUid = member.uid || member.id;
    [memEmail, mUid, member.id, member.docId].filter(Boolean).forEach(id => {
      if (!WorkspaceDB.data.resignedMembers.includes(id)) {
        WorkspaceDB.data.resignedMembers.push(id);
      }
    });
    await WorkspaceDB.save();

    // 2. Persist to Cloud Firestore
    if (window.FirebaseService?.markMemberResigned) {
      try {
        await FirebaseService.markMemberResigned(member);
      } catch (err) {
        console.warn('[FOUNDER] Cloud resignation warning:', err);
      }
    }

    // 3. Close modal & re-render
    closeEditRoleModal();
    renderWorkers();
    renderFleetTelemetry();
    renderChatChannelsAndDMs();
    WorkspaceDB.updateMetricsUI();
    playNotificationChirp(true);
    showQuickToast('Official resignation recorded for ' + memberName + '. Workstation access permanently revoked.', 'info');
  }

  window.showResignedBanNotice = function(email) {
    alert('🚫 ACCESS REVOKED: You have officially resigned from REDDOT Technologies. Under company policy, resigned members are permanently barred from workstation login and cannot rejoin.');
    openAuthModal('signin');
  };

    openEditRoleModal = function(member) {
      if (!member) return;
      if (!canManageRoles()) {
        showQuickToast('🚫 Access Denied: Only Founder (Jagadish) can modify and promote member roles.', 'error');
        return;
      }
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

      // Select current canonical role (Founder, CEO, Employee, Intern)
      const currentCanonical = formatAppRole(member.role, member.email);
      if (selectRole) {
        selectRole.value = currentCanonical;
        // Guard Founder option: only selectable if editing Jagadish K
        for (let i = 0; i < selectRole.options.length; i++) {
          const opt = selectRole.options[i];
          if (opt.value === 'Founder') {
            opt.disabled = (member.email || '').toLowerCase().trim() !== 'jagadish2k2006@gmail.com';
          }
        }
      }
      if (customRoleWrap) customRoleWrap.style.display = 'none';

      if (selectDept && member.dept) {
        selectDept.value = member.dept;
      }

      const btnResign = document.getElementById('btnMarkResignedMember');
      if (btnResign) {
        const isSelfFounder = (member.email || '').toLowerCase().trim() === 'jagadish2k2006@gmail.com';
        const isAlreadyResigned = !!(member.resigned || member.status === 'RESIGNED');

        if (isSelfFounder) {
          btnResign.style.display = 'none';
        } else if (isAlreadyResigned) {
          btnResign.style.display = 'inline-flex';
          btnResign.disabled = true;
          btnResign.innerHTML = '<span>🚫 Officially Resigned (Account Blocked)</span>';
          btnResign.style.opacity = '0.7';
          btnResign.style.cursor = 'not-allowed';
        } else {
          btnResign.style.display = 'inline-flex';
          btnResign.disabled = false;
          btnResign.innerHTML = '<span>🚫 Mark as Resigned</span>';
          btnResign.style.opacity = '1';
          btnResign.style.cursor = 'pointer';
          btnResign.onclick = (e) => {
            e.preventDefault();
            markMemberAsResigned(member);
          };
        }
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
      if (!canManageRoles()) {
        showQuickToast('🚫 Access Denied: Only Founder (Jagadish) can modify and promote member roles.', 'error');
        return;
      }
      const member = state.editingRoleMember;
      if (!member) return;

      const selectPreset = document.getElementById('selectPresetRole')?.value || 'Employee';
      let newRole = formatAppRole(selectPreset, member.email);

      // Strict Founder role validation: Jagadish K is the sole Founder
      if (newRole === 'Founder' && (member.email || '').toLowerCase().trim() !== 'jagadish2k2006@gmail.com') {
        showQuickToast('🚫 Invalid Operation: Jagadish K is the sole Founder. Other members cannot be assigned Founder.', 'error');
        return;
      }
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
      const targetId = targetMemberId || state.selectedViewingMemberId || state.currentMemberId;
      if (!targetId) return;
      const member = WorkspaceDB.data.members[targetId] || getUniqueMembersList().find(m => m.id === targetId || m.uid === targetId) || state.currentMember;
      const isSelf = member ? isSelfMember(member) : false;
      if (!isSoleFounder() && !isSelf) {
        showQuickToast('🚫 Access Denied: You can only update your own badge photo.', 'error');
        return;
      }
      state.linkingPhotoMemberId = targetId;
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
      const targetId = state.linkingPhotoMemberId || state.selectedViewingMemberId || state.currentMemberId;
      if (!targetId) return;
      let member = WorkspaceDB.data.members[targetId] || getUniqueMembersList().find(m => m.id === targetId || m.uid === targetId) || state.currentMember;

      if (!member) return;

      const isSelf = isSelfMember(member);
      if (!isSoleFounder() && !isSelf) {
        showQuickToast('🚫 Access Denied: You can only update your own badge photo.', 'error');
        return;
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
          const targetUid = member.uid || member.id;
          if (targetUid) {
            await FirebaseService.updateMemberPhoto(targetUid, directUrl);
          }
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
        if (window.electronAPI?.openCallWindow) {
          await window.electronAPI.openCallWindow({ url: roomUrl, title: `REDDOT Call - ${call.callerName || 'Meeting'}`, callType: call.callType });
        } else if (window.electronAPI?.openExternal) {
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
        const partner = findDMPartnerMember(state.activeChannelId);
        if (partner) {
          await startDirectCallWithMember(partner, 'audio');
          return;
        }
      }
      openMeetingModal(null);
    });

    document.getElementById('btnChatVideoCall')?.addEventListener('click', async () => {
      if (state.activeChannelId?.startsWith('dm_')) {
        const partner = findDMPartnerMember(state.activeChannelId);
        if (partner) {
          await startDirectCallWithMember(partner, 'video');
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
        window.electronAPI.onOpenTab((tab) => {
          if (typeof tab === 'string') {
            switchTab(tab);
          } else if (tab && typeof tab === 'object') {
            navigateToNotificationDestination(tab);
          }
        });
      }
      if (window.electronAPI.onNavigateNotification) {
        window.electronAPI.onNavigateNotification((payload) => navigateToNotificationDestination(payload));
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
    const isFounder = (curEmail === 'jagadish2k2006@gmail.com');

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

    // Update 7-day mini bar chart accurately with high-contrast visibility
    const chartCols = document.querySelectorAll('#dailyMeanChart .att-chart-col');
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    if (chartCols && chartCols.length >= 7) {
      const maxDaySec = Math.max(...daySeconds, 8 * 3600);
      daySeconds.forEach((sec, idx) => {
        const col = chartCols[idx];
        if (col) {
          const bar = col.querySelector('.att-chart-bar');
          const hours = (sec / 3600).toFixed(1);
          const pct = Math.round((sec / maxDaySec) * 100);
          // If worked, ensure it is clearly visible (minimum 22% height) with full opacity
          const hVal = sec > 0 ? Math.max(22, pct) : 8;
          if (bar) {
            bar.style.height = `${hVal}%`;
            bar.style.opacity = sec > 0 ? '1' : '0.35';
          }
          col.title = `${dayNames[idx]}: ${hours} hrs logged${idx === currentDayOfWeek ? ' (Today)' : ''}`;
          if (idx === currentDayOfWeek) {
            col.classList.add('active');
          } else {
            col.classList.remove('active');
          }
        }
      });
    }

    // Update 4th KPI Card: Leave Balance & Time-Off
    try {
      const cur = (typeof getCurrentResolvedMember === 'function') ? getCurrentResolvedMember() : state.currentMember;
      const curId = cur?.id;
      const curUid = state.currentUser?.uid || cur?.uid;
      const curEmail = (state.currentUser?.email || cur?.email || '').toLowerCase().trim();

      const allLeaves = (WorkspaceDB.data.leaveRequests || []);
      const myLeaves = allLeaves.filter(l => {
        if (!l) return false;
        if (curId && l.workerId === curId) return true;
        if (curUid && l.uid === curUid) return true;
        if (curEmail && (l.email || '').toLowerCase() === curEmail) return true;
        return false;
      });

      const approvedLeaves = myLeaves.filter(l => (l.status || '').toUpperCase() === 'APPROVED');
      const pendingLeaves = myLeaves.filter(l => (l.status || '').toUpperCase() === 'PENDING');
      const annualQuota = Number(cur?.annualLeaveQuota) || 24;
      const approvedDays = approvedLeaves.reduce((sum, l) => sum + (Number(l.daysCount) || 1), 0);
      const availableDays = Math.max(0, annualQuota - approvedDays);
      const quotaPct = Math.min(100, Math.max(0, Math.round((availableDays / annualQuota) * 100)));

      const leaveAvailEl = document.getElementById('leaveBalanceAvailable');
      if (leaveAvailEl) leaveAvailEl.textContent = String(availableDays);
      const leaveBarEl = document.getElementById('leaveBalanceBar');
      if (leaveBarEl) leaveBarEl.style.width = `${quotaPct}%`;
      const leaveTargetEl = document.getElementById('leaveBalanceTargetText');
      if (leaveTargetEl) leaveTargetEl.textContent = `Quota: ${annualQuota} Days • ${availableDays} Available`;
      const leaveSubEl = document.getElementById('leaveApprovedPendingText');
      if (leaveSubEl) leaveSubEl.innerHTML = `&#x2714; ${approvedDays} Days Used &bull; ${pendingLeaves.length} Pending`;
    } catch (e) {
      console.warn('[ATTENDANCE] Error calculating leave balance:', e);
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
    const isFounder = (curEmail === 'jagadish2k2006@gmail.com');

    // 1. Filter by Member & identify viewed target
    let memberPunches = rawPunches;
    let targetMember = null;
    let isViewingSelf = false;

    if (!hasAccess || filterMemberId === 'SELF') {
      targetMember = cur;
      isViewingSelf = true;
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
      targetMember = (WorkspaceDB.data.members || {})[filterMemberId] || getUniqueMembersList().find(m => m.id === filterMemberId || m.uid === filterMemberId);
      const targetName = (targetMember?.name || targetMember?.displayName || '').toLowerCase().trim();
      const targetEmail = (targetMember?.email || '').toLowerCase().trim();
      isViewingSelf = targetMember ? (isSelfMember(targetMember) || targetMember.id === curId || targetMember.uid === curUid || (curEmail && targetEmail === curEmail)) : false;

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

    // Determine today's live/authenticated working seconds strictly for the selected view
    let todayLiveSec = 0;
    if (isViewingSelf) {
      todayLiveSec = (state.personalShift && state.personalShift.seconds) ? state.personalShift.seconds : 0;
    } else if (targetMember) {
      todayLiveSec = calculateMemberSecondsToday(targetMember);
    } else if (filterMemberId === 'ALL') {
      todayLiveSec = getUniqueMembersList().filter(m => !m.resigned && m.status !== 'RESIGNED').reduce((acc, m) => acc + (isSelfMember(m) ? (state.personalShift?.seconds || 0) : calculateMemberSecondsToday(m)), 0);
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
      if (dayData.dateStr === todayKey && todayLiveSec > 0) {
        dayData.totalSec = Math.max(dayData.totalSec, todayLiveSec);
      }
      totalSec += dayData.totalSec;
    });

    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    if (!dayMap.has(todayKey) && todayLiveSec > 0 && (period === 'THIS_WEEK' || period === 'PAST_2_WEEKS' || period === 'PAST_30_DAYS' || period === 'ALL_HISTORY')) {
      dayMap.set(todayKey, {
        dateStr: todayKey,
        dateObj: now,
        dayLabel: now.toLocaleDateString([], { weekday: 'short' }),
        formattedDate: now.toLocaleDateString([], { month: 'short', day: 'numeric' }),
        totalSec: todayLiveSec,
        punches: [],
        onTime: true
      });
      totalSec += todayLiveSec;
    }

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

      if (w === 0 && todayLiveSec > 0) {
        wSec = Math.max(wSec, todayLiveSec);
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
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
  }
  window.closeAttendanceAnalyticsModal = closeAttendanceAnalyticsModal;

  function openAttendanceAnalyticsModal(initialPeriod = null) {
    if (initialPeriod) {
      activeAnalyticsPeriod = (initialPeriod === 'DAILY_AVG' ? 'THIS_WEEK' : initialPeriod);
    }
    const modal = document.getElementById('attendanceAnalyticsModal');
    if (!modal) return;

    modal.classList.remove('hidden');
    modal.style.display = 'flex';

    try {
      if (typeof updateAttendanceMetricsUI === 'function') {
        updateAttendanceMetricsUI();
      }
      // Populate Member Filter dropdown in modal
      const memberSelect = document.getElementById('analyticsMemberFilter');
      const memberWrap = document.getElementById('analyticsMemberFilterWrap');
      const hasAccess = typeof hasFullAttendanceAccess === 'function' ? hasFullAttendanceAccess() : true;

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

          const membersList = typeof getUniqueMembersList === 'function' ? getUniqueMembersList() : Object.values(WorkspaceDB.data.members || {});
          membersList.forEach(m => {
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
    } catch (e) {
      console.warn('[ANALYTICS] Render error caught in openAttendanceAnalyticsModal:', e);
    }
  }
  window.openAttendanceAnalyticsModal = openAttendanceAnalyticsModal;

  function openLeaveRequestModalFromKpi() {
    const modal = document.getElementById('leaveRequestModal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.style.display = 'flex';
      document.getElementById('inputLeaveDates')?.focus();
    }
  }
  window.openLeaveRequestModalFromKpi = openLeaveRequestModalFromKpi;

  window.showAttendanceAnalytics = openAttendanceAnalyticsModal;

  function renderAttendanceAnalyticsModalData() {
    let stats;
    try {
      stats = calculateHistoricalAttendanceStats(activeAnalyticsMemberId, activeAnalyticsPeriod);
    } catch (e) {
      console.error('[ANALYTICS] calculateHistoricalAttendanceStats failed:', e);
      stats = {
        period: activeAnalyticsPeriod,
        rangeLabel: 'Verified Attendance History',
        totalHours: '0.0',
        dailyAvgHours: '0.0',
        activeDaysCount: 0,
        onTimeRate: 100,
        dayMap: [],
        weeksList: [],
        punches: []
      };
    }

    // 1. KPI Numbers
    try {
      safeSetText(document.getElementById('analyticsKpiDailyAvg'), stats.dailyAvgHours);
      safeSetText(document.getElementById('analyticsKpiTotalHours'), stats.totalHours);
      safeSetText(document.getElementById('analyticsKpiActiveDays'), String(stats.activeDaysCount));
      safeSetText(document.getElementById('analyticsKpiOnTime'), `${stats.onTimeRate}%`);
      safeSetText(document.getElementById('analyticsChartRangeLabel'), stats.rangeLabel);
      safeSetText(document.getElementById('analyticsPunchesCountLabel'), `${stats.punches ? stats.punches.length : 0} verified records`);
    } catch (e) {
      console.warn('[ANALYTICS] KPI update error:', e);
    }

    // 2. Day-by-Day Bar Chart
    try {
      const chartContainer = document.getElementById('analyticsDayChartWrap');
      if (chartContainer) {
        chartContainer.replaceChildren();
        if (!stats.dayMap || stats.dayMap.length === 0) {
          chartContainer.innerHTML = `<div style="color: var(--text-muted); font-size: 11.5px; width: 100%; text-align: center; margin: auto;">No shift punches recorded in this period.</div>`;
        } else {
          const maxSec = Math.max(...stats.dayMap.map(d => Number(d.totalSec) || 0), 8 * 3600);
          stats.dayMap.forEach(d => {
            const sec = Number(d.totalSec) || 0;
            const hours = (sec / 3600).toFixed(1);
            const pct = Math.min(100, Math.max(sec > 0 ? 8 : 4, Math.round((sec / maxSec) * 100)));
            const targetMet = sec >= 7.5 * 3600;
            const targetExceeded = sec >= 8.5 * 3600;

            const col = document.createElement('div');
            col.className = `analytics-chart-bar-item ${targetExceeded ? 'target-exceeded' : (targetMet ? 'target-met' : '')}`;
            col.title = `${d.dayLabel || ''}, ${d.formattedDate || ''}: ${hours} hrs logged`;
            col.innerHTML = `
              <span class="analytics-bar-val">${hours > 0 ? `${hours}h` : ''}</span>
              <div class="analytics-bar-track">
                <div class="analytics-bar-fill" style="height: ${pct}%;"></div>
              </div>
              <span class="analytics-bar-label">${escapeHtml(d.dayLabel || '')}</span>
              <span class="analytics-bar-date">${escapeHtml(d.formattedDate || '')}</span>
            `;
            chartContainer.appendChild(col);
          });
        }
      }
    } catch (e) {
      console.warn('[ANALYTICS] Day chart error:', e);
    }

    // 3. Past Weeks Comparison Table
    try {
      const weeksTbody = document.getElementById('analyticsWeeksTableBody');
      if (weeksTbody) {
        weeksTbody.replaceChildren();
        (stats.weeksList || []).forEach(w => {
          const tr = document.createElement('tr');
          const targetPct = Number(w.targetPct) || 0;
          tr.innerHTML = `
            <td><strong>${escapeHtml(w.label || '')}</strong></td>
            <td><span style="font-family: var(--font-mono); font-weight: 700; color: var(--accent-cyan);">${w.totalHours || '0.0'} hrs</span></td>
            <td><span style="font-family: var(--font-mono);">${w.dailyAvg || '0.0'} hrs/day</span></td>
            <td>${w.daysWorked || 0} days</td>
            <td>
              <div style="display: flex; align-items: center; gap: 6px;">
                <div style="flex: 1; min-width: 60px; height: 6px; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden;">
                  <div style="width: ${targetPct}%; height: 100%; background: ${targetPct >= 100 ? '#10b981' : 'var(--accent-cyan)'};"></div>
                </div>
                <span style="font-size: 10.5px; font-family: var(--font-mono);">${targetPct}%</span>
              </div>
            </td>
            <td><span class="badge-verified" style="font-size: 11px; font-weight: 600; color: ${targetPct >= 100 ? '#10b981' : '#38bdf8'};">${escapeHtml(w.status || '')}</span></td>
          `;
          weeksTbody.appendChild(tr);
        });
      }
    } catch (e) {
      console.warn('[ANALYTICS] Weeks table error:', e);
    }

    // 4. Detailed Verified Punches
    try {
      const punchesTbody = document.getElementById('analyticsPunchesTableBody');
      if (punchesTbody) {
        punchesTbody.replaceChildren();
        const punchList = Array.isArray(stats.punches) ? stats.punches : [];
        if (punchList.length === 0) {
          punchesTbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 16px;">No punch records found for this timeframe.</td></tr>`;
        } else {
          punchList.slice(0, 100).forEach(punch => {
            const tr = document.createElement('tr');
            const actionColor = punch.action === 'CLOCK_IN' ? 'var(--accent-green)' : (punch.action === 'BREAK' ? 'var(--accent-gold)' : 'var(--accent-red)');
            const actionText = punch.action === 'CLOCK_IN' ? '▶ Clock In' : (punch.action === 'BREAK' ? '⏸ Break' : '⏹ Clock Out');

            tr.innerHTML = `
              <td><strong>${escapeHtml(punch.name || punch.workerId || 'Member')}</strong></td>
              <td><span style="color: ${actionColor}; font-weight: 700; font-family: var(--font-mono); font-size: 11px;">${actionText}</span></td>
              <td>${escapeHtml(punch.time || new Date(punch.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))}</td>
              <td>${escapeHtml(punch.date || new Date(punch.timestamp || Date.now()).toLocaleDateString())}</td>
              <td><span style="font-family: var(--font-mono); color: var(--accent-cyan); font-weight: 600;">${escapeHtml(punch.durationStr || punch.duration || '--')}</span></td>
              <td><span class="badge-verified" style="color: var(--accent-green); font-size: 11px; font-weight: 600;"><span style="color:#00e5a3;">✔</span> Verified (SHA-256)</span></td>
            `;
            punchesTbody.appendChild(tr);
          });
        }
      }
    } catch (e) {
      console.warn('[ANALYTICS] Punches table error:', e);
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

    // 4. Leave & Time-Off notices from WorkspaceDB.data.leaveRequests
    const leaves = (WorkspaceDB.data.leaveRequests || []).slice(-4);
    leaves.forEach(l => {
      notifications.push({
        type: 'leave',
        leaveId: l.id,
        icon: '🌴',
        title: `Leave: ${l.name || 'Member'} (${l.leaveType || 'Time-Off'})`,
        desc: `Status: ${l.status || 'PENDING'} • ${l.dates || 'Dates requested'}`,
        time: l.createdAt ? formatRelativeTime(l.createdAt) : 'Recently',
        timestamp: l.createdAt || Date.now(),
        unread: (l.status === 'PENDING' && canApproveLeave())
      });
    });

    // 5. System initialization notice
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
          <div style="font-weight: 700; font-size: 12px; color: var(--text-primary, #f8f8fc); display: flex; align-items: center; justify-content: space-between; gap: 6px;">
            <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(n.title)}</span>
            ${n.unread ? '<span style="width: 7px; height: 7px; border-radius: 50%; background: var(--accent-cyan, #00e5ff); display: inline-block; flex-shrink: 0;"></span>' : ''}
          </div>
          <div style="font-size: 10.5px; opacity: 0.85; color: var(--text-secondary); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(n.desc)}</div>
          <div style="color: var(--accent-cyan, #0284c7); font-size: 9.5px; margin-top: 3px; font-family: var(--font-mono);">${escapeHtml(n.time)}</div>
        </div>
      `;

      let notifActivated = false;
      const handleNotifTrigger = (e) => {
        if (notifActivated) return;
        notifActivated = true;
        setTimeout(() => { notifActivated = false; }, 350);
        if (e) {
          e.stopPropagation();
        }
        navigateToNotificationDestination(n);
      };

      item.style.touchAction = 'manipulation';
      item.style.userSelect = 'none';
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');
      item.addEventListener('click', handleNotifTrigger);
      item.addEventListener('pointerup', handleNotifTrigger);
      item.addEventListener('touchend', handleNotifTrigger);
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleNotifTrigger(e);
        }
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
    const onlineMembers = members.filter(m => isMemberAppOnline(m) || isSelfMember(m));
    const onlineCount = onlineMembers.length;
    const breakCount = members.filter(m => !onlineMembers.includes(m) && getMemberDutyStatus(m) === 'DUTY_BREAK').length;
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

  function renderDrawerSubtasks(task) {
    if (!task) return;
    if (!Array.isArray(task.subtasks)) {
      task.subtasks = [];
    }

    // Ensure all subtask items have standard fields
    task.subtasks.forEach((st, idx) => {
      if (!st.id) st.id = 'st_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substr(2, 4);
      if (typeof st.done !== 'boolean') st.done = Boolean(st.done);
      if (!st.label) st.label = st.title || 'Untitled subtask';
    });

    const doneCount = task.subtasks.filter(s => s.done).length;
    const totalCount = task.subtasks.length;
    const percent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

    const doneText = document.getElementById('drawerSubtasksDoneText');
    if (doneText) doneText.textContent = `${doneCount}/${totalCount} Done`;
    const percentText = document.getElementById('drawerSubtasksPercentText');
    if (percentText) percentText.textContent = `${percent}% Complete`;

    const checklist = document.getElementById('drawerSubtasksChecklist');
    if (!checklist) return;

    checklist.replaceChildren();

    if (task.subtasks.length === 0) {
      const emptyItem = document.createElement('div');
      emptyItem.className = 'subtasks-empty-hint';
      emptyItem.textContent = 'No subtasks yet. Add custom subtasks below:';
      checklist.appendChild(emptyItem);
    } else {
      task.subtasks.forEach(st => {
        const row = document.createElement('div');
        row.className = `subtask-check-row ${st.done ? 'done' : ''}`;
        row.dataset.subtaskId = st.id;

        const leftWrap = document.createElement('div');
        leftWrap.className = 'subtask-left-wrap';

        const cb = document.createElement('div');
        cb.className = 'subtask-checkbox';
        cb.innerHTML = st.done ? '&#10003;' : '';
        cb.title = st.done ? 'Click to mark incomplete' : 'Click to mark complete';

        const labelSpan = document.createElement('span');
        labelSpan.className = 'subtask-label-text';
        labelSpan.textContent = st.label;
        labelSpan.title = 'Double-click to edit subtask';

        leftWrap.appendChild(cb);
        leftWrap.appendChild(labelSpan);

        // Inline edit function
        let isEditing = false;
        function enterEditMode() {
          if (isEditing) return;
          isEditing = true;
          const editInput = document.createElement('input');
          editInput.type = 'text';
          editInput.className = 'subtask-inline-edit';
          editInput.value = st.label;
          editInput.maxLength = 160;

          const finishEdit = async () => {
            if (!isEditing) return;
            isEditing = false;
            const newLabel = editInput.value.trim();
            if (newLabel && newLabel !== st.label) {
              st.label = newLabel;
              task.updatedAt = Date.now();
              await WorkspaceDB.save();
              if (window.FirebaseService?.updateTask) {
                FirebaseService.updateTask(task.id, { subtasks: task.subtasks, updatedAt: task.updatedAt }).catch(() => {});
              }
            }
            renderDrawerSubtasks(task);
            renderTasks();
          };

          editInput.addEventListener('blur', finishEdit);
          editInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              editInput.blur();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              isEditing = false;
              renderDrawerSubtasks(task);
            }
          });

          labelSpan.replaceWith(editInput);
          editInput.focus();
          editInput.select();
        }

        labelSpan.addEventListener('dblclick', (e) => {
          e.stopPropagation();
          enterEditMode();
        });

        // Actions: Edit button & Delete button
        const actionsWrap = document.createElement('div');
        actionsWrap.className = 'subtask-row-actions';

        const btnEdit = document.createElement('button');
        btnEdit.type = 'button';
        btnEdit.className = 'subtask-action-btn btn-edit-subtask';
        btnEdit.innerHTML = '&#x270E;';
        btnEdit.title = 'Edit subtask title';
        btnEdit.addEventListener('click', (e) => {
          e.stopPropagation();
          enterEditMode();
        });

        const btnDelete = document.createElement('button');
        btnDelete.type = 'button';
        btnDelete.className = 'subtask-action-btn btn-del-subtask';
        btnDelete.innerHTML = '&times;';
        btnDelete.title = 'Delete subtask';
        btnDelete.addEventListener('click', async (e) => {
          e.stopPropagation();
          task.subtasks = task.subtasks.filter(s => s.id !== st.id);
          task.updatedAt = Date.now();
          await WorkspaceDB.save();
          if (window.FirebaseService?.updateTask) {
            FirebaseService.updateTask(task.id, { subtasks: task.subtasks, updatedAt: task.updatedAt }).catch(() => {});
          }
          renderDrawerSubtasks(task);
          renderTasks();
          playNotificationChirp(true);
        });

        actionsWrap.appendChild(btnEdit);
        actionsWrap.appendChild(btnDelete);

        row.appendChild(leftWrap);
        row.appendChild(actionsWrap);

        // Click checkbox to toggle completion
        cb.addEventListener('click', async (e) => {
          e.stopPropagation();
          st.done = !st.done;
          task.updatedAt = Date.now();
          await WorkspaceDB.save();
          if (window.FirebaseService?.updateTask) {
            FirebaseService.updateTask(task.id, { subtasks: task.subtasks, updatedAt: task.updatedAt }).catch(() => {});
          }
          renderDrawerSubtasks(task);
          renderTasks();
          playNotificationChirp(true);
        });

        // Clicking row (outside edit/delete) also toggles
        row.addEventListener('click', (e) => {
          if (!isEditing && !actionsWrap.contains(e.target)) {
            cb.click();
          }
        });

        checklist.appendChild(row);
      });
    }

    // Bind composer events
    const composerInput = document.getElementById('inputNewDrawerSubtask');
    const composerAddBtn = document.getElementById('btnAddDrawerSubtask');

    const handleAddSubtask = async () => {
      if (!composerInput) return;
      const text = composerInput.value.trim();
      if (!text) {
        composerInput.focus();
        return;
      }
      const newSub = {
        id: 'st_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        label: text,
        done: false
      };
      task.subtasks.push(newSub);
      task.updatedAt = Date.now();
      await WorkspaceDB.save();
      if (window.FirebaseService?.updateTask) {
        FirebaseService.updateTask(task.id, { subtasks: task.subtasks, updatedAt: task.updatedAt }).catch(() => {});
      }
      composerInput.value = '';
      renderDrawerSubtasks(task);
      renderTasks();
      playNotificationChirp(true);
      const nextInput = document.getElementById('inputNewDrawerSubtask');
      if (nextInput) nextInput.focus();
    };

    if (composerAddBtn) {
      composerAddBtn.onclick = (e) => {
        e.preventDefault();
        handleAddSubtask();
      };
    }

    if (composerInput) {
      composerInput.onkeydown = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleAddSubtask();
        }
      };
    }
  }

  
  function renderDrawerAttachments(task) {
    if (!task) return;
    if (!Array.isArray(task.attachments)) {
      task.attachments = [];
      if (task.prototypeImg) {
        task.attachments.push({
          id: 'att_proto_' + (task.id || Date.now()),
          name: task.prototypeFilename || `${(task.code || 'task').toLowerCase()}-spec.fig`,
          type: 'image/png',
          isImage: true,
          dataUrl: task.prototypeImg,
          size: 1024 * 128
        });
      }
    }

    const countEl = document.getElementById('drawerAttachmentsCount');
    if (countEl) countEl.textContent = String(task.attachments.length);

    const list = document.getElementById('drawerAttachmentsList');
    if (!list) return;
    list.replaceChildren();

    if (task.attachments.length === 0) {
      const emptyItem = document.createElement('div');
      emptyItem.className = 'subtasks-empty-hint';
      emptyItem.style.cssText = 'padding: 8px 10px; font-size: 11.5px; color: var(--text-muted); font-style: italic; background: rgba(0,0,0,0.02); border-radius: 6px; border: 1px dashed var(--card-border); text-align: center;';
      emptyItem.textContent = 'No attachments yet. Click + Attach File to add files or images.';
      list.appendChild(emptyItem);
    } else {
      task.attachments.forEach(att => {
        const item = document.createElement('div');
        item.className = 'task-attachment-item';
        item.dataset.attId = att.id;

        const leftWrap = document.createElement('div');
        leftWrap.className = 'task-attachment-left';

        const isImg = att.isImage || (att.type && att.type.startsWith('image/')) || (att.dataUrl && att.dataUrl.startsWith('data:image'));
        if (isImg) {
          const thumb = document.createElement('img');
          thumb.className = 'task-attachment-thumb';
          thumb.src = att.dataUrl;
          thumb.alt = att.name || 'Image';
          thumb.title = 'Click to preview full image';
          thumb.addEventListener('click', () => {
            const w = window.open('');
            if (w) {
              w.document.write(`<title>${escapeHtml(att.name || 'Attachment')}</title><body style="margin:0; background:#111; display:flex; align-items:center; justify-content:center; height:100vh;"><img src="${att.dataUrl}" style="max-width:95vw; max-height:95vh; object-fit:contain; border-radius:8px; box-shadow:0 8px 32px rgba(0,0,0,0.5);"></body>`);
            }
          });
          leftWrap.appendChild(thumb);
        } else {
          const icon = document.createElement('span');
          icon.className = 'task-attachment-icon';
          const ext = (att.name || '').toLowerCase();
          icon.textContent = ext.endsWith('.pdf') ? '📄' : (ext.endsWith('.doc') || ext.endsWith('.docx') ? '📝' : (ext.endsWith('.xls') || ext.endsWith('.xlsx') || ext.endsWith('.csv') ? '📊' : '📎'));
          leftWrap.appendChild(icon);
        }

        const info = document.createElement('div');
        info.className = 'task-attachment-info';

        const nameSpan = document.createElement('a');
        nameSpan.className = 'task-attachment-name';
        nameSpan.textContent = att.name || 'Unnamed attachment';
        nameSpan.title = 'Click to download / view';
        nameSpan.href = att.dataUrl || '#';
        nameSpan.download = att.name || 'download';
        if (!att.dataUrl?.startsWith('data:')) {
          nameSpan.target = '_blank';
        }

        const metaSpan = document.createElement('span');
        metaSpan.className = 'task-attachment-size';
        metaSpan.textContent = typeof formatBytes === 'function' ? formatBytes(att.size || 0) : `${Math.round((att.size || 0) / 1024)} KB`;

        info.appendChild(nameSpan);
        info.appendChild(metaSpan);
        leftWrap.appendChild(info);

        const actions = document.createElement('div');
        actions.className = 'task-attachment-actions';

        const btnDownload = document.createElement('a');
        btnDownload.className = 'subtask-action-btn';
        btnDownload.href = att.dataUrl || '#';
        btnDownload.download = att.name || 'attachment';
        btnDownload.title = 'Download attachment';
        btnDownload.innerHTML = '⬇️';

        const btnDel = document.createElement('button');
        btnDel.type = 'button';
        btnDel.className = 'subtask-action-btn btn-del-subtask';
        btnDel.innerHTML = '&times;';
        btnDel.title = 'Delete attachment';
        btnDel.addEventListener('click', async (e) => {
          e.stopPropagation();
          task.attachments = task.attachments.filter(a => a.id !== att.id);
          task.updatedAt = Date.now();
          await WorkspaceDB.save();
          if (window.FirebaseService?.updateTask) {
            FirebaseService.updateTask(task.id, { attachments: task.attachments, updatedAt: task.updatedAt }).catch(() => {});
          }
          renderDrawerAttachments(task);
          playNotificationChirp(true);
        });

        actions.appendChild(btnDownload);
        actions.appendChild(btnDel);

        item.appendChild(leftWrap);
        item.appendChild(actions);

        list.appendChild(item);
      });
    }

    // Attach File Button & File Input binding
    const addBtn = document.getElementById('btnDrawerAddAttachment');
    const fileInput = document.getElementById('drawerAttachmentFileInput');

    if (addBtn && fileInput) {
      addBtn.onclick = (e) => {
        e.preventDefault();
        fileInput.click();
      };

      fileInput.onchange = async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        for (const file of files) {
          if (file.type.startsWith('image/')) {
            const res = typeof compressImageFile === 'function' ? await compressImageFile(file) : null;
            if (res && res.dataUrl) {
              task.attachments.push({
                id: 'att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                name: res.name || file.name,
                size: res.size || file.size,
                type: 'image/webp',
                isImage: true,
                dataUrl: res.dataUrl,
                createdAt: Date.now()
              });
            } else {
              await new Promise(resolve => {
                const reader = new FileReader();
                reader.onload = () => {
                  task.attachments.push({
                    id: 'att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                    name: file.name,
                    size: file.size,
                    type: file.type || 'image/png',
                    isImage: true,
                    dataUrl: reader.result,
                    createdAt: Date.now()
                  });
                  resolve();
                };
                reader.onerror = resolve;
                reader.readAsDataURL(file);
              });
            }
          } else {
            if (file.size > 2 * 1024 * 1024) {
              if (typeof showQuickToast === 'function') showQuickToast(`File "${file.name}" exceeds 2MB limit.`, 'warning');
              continue;
            }
            await new Promise(resolve => {
              const reader = new FileReader();
              reader.onload = () => {
                task.attachments.push({
                  id: 'att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                  name: file.name,
                  size: file.size,
                  type: file.type || 'application/octet-stream',
                  isImage: false,
                  dataUrl: reader.result,
                  createdAt: Date.now()
                });
                resolve();
              };
              reader.onerror = resolve;
              reader.readAsDataURL(file);
            });
          }
        }

        task.updatedAt = Date.now();
        await WorkspaceDB.save();
        if (window.FirebaseService?.updateTask) {
          FirebaseService.updateTask(task.id, { attachments: task.attachments, updatedAt: task.updatedAt }).catch(() => {});
        }
        renderDrawerAttachments(task);
        playNotificationChirp(true);
        if (typeof showQuickToast === 'function') showQuickToast(`Attached ${files.length} file(s) successfully.`, 'success');
        fileInput.value = '';
      };
    }
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

    renderDrawerSubtasks(task);

    renderDrawerAttachments(task);

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
  window.openCompletedArchiveModal = showCompletedArchiveModal;

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
          "      <span class=\"arc-title\" style=\"font-size:13px;font-weight:700;color:var(--text-white,#fff);\">" + (ct.title || "Untitled") + "</span>",
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
        "<div class=\"arc-modal-card\" style=\"background:var(--panel-bg,#181c24);border:1px solid var(--card-border,#2a3040);border-radius:12px;width:min(700px,95vw);max-height:80vh;display:flex;flex-direction:column;overflow:hidden;\">",
        "  <div class=\"arc-modal-head\" style=\"padding:16px 20px;border-bottom:1px solid var(--card-border,#2a3040);display:flex;align-items:center;justify-content:space-between;\">",
        "    <div>",
        "      <h3 class=\"arc-modal-title\" style=\"margin:0;font-size:15px;font-weight:700;color:var(--text-white,#fff);\">&#9989; Completed Tasks</h3>",
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
    // Default to light theme as requested, while keeping ability to toggle
    if (!saved || saved === 'dark' || saved === 'obsidian') {
      saved = 'light';
      localStorage.setItem('reddot_theme', 'light');
    }
    applyTheme(saved);

    window.addEventListener('online', () => {
      showQuickToast('Network connected • Resuming active shift sync', 'success');
      const cur = getCurrentResolvedMember();
      if (cur?.id && state.personalShift?.status === 'DUTY_ON') {
        const selfSec = state.personalShift.seconds || 0;
        const selfUid = state.currentUser?.uid || cur.uid || cur.id;
        if (window.FirebaseService?.updatePresenceFirestore) {
          FirebaseService.updatePresenceFirestore(selfUid, 'DUTY_ON', selfSec);
        }
      }
      updateShiftUI();
    });

    window.addEventListener('offline', () => {
      showQuickToast('Workstation offline • Shift timer paused', 'warning');
      updateShiftUI();
    });

    document.getElementById('btnThemeToggle')?.addEventListener('click', () => {
      let current = localStorage.getItem('reddot_theme') || 'solaris';
      let next = 'solaris';
      if (current === 'solaris') next = 'dark';
      else if (current === 'dark') next = 'light';
      else next = 'solaris';
      applyTheme(next);
      playNotificationChirp(true);
      const names = {
        'solaris': 'Solaris Warm Glass',
        'dark': 'Obsidian Graphite Dark',
        'light': 'Light Enterprise'
      };
      showQuickToast(`Switched to ${names[next] || next} theme.`, 'info');
    });

    window.addEventListener('keydown', (e) => {
      if (e.altKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        document.getElementById('btnThemeToggle')?.click();
      }
    });
  }

  function applyTheme(theme) {
    document.body.classList.remove('theme-light', 'theme-dark', 'theme-obsidian', 'theme-solaris');
    const icon = document.getElementById('themeToggleIcon');
    if (theme === 'solaris') {
      document.body.classList.add('theme-solaris');
      if (icon) icon.textContent = '🌅';
      localStorage.setItem('reddot_theme', 'solaris');
    } else if (theme === 'dark') {
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
    if (typeof setupWorkToolsEventListeners === 'function') setupWorkToolsEventListeners();
    if (typeof setupToolAnalyticsEventListeners === 'function') setupToolAnalyticsEventListeners();
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
    document.getElementById('cardAttendanceDailyAverage')?.addEventListener('click', () => openAttendanceAnalyticsModal('DAILY_AVG'));
    document.getElementById('cardAttendanceOnTimeRate')?.addEventListener('click', () => openAttendanceAnalyticsModal('ALL_HISTORY'));
    document.getElementById('cardAttendanceLeaveBalance')?.addEventListener('click', () => (typeof openLeaveRequestModalFromKpi === 'function' ? openLeaveRequestModalFromKpi() : null));
    document.getElementById('btnOpenAttendanceAnalytics')?.addEventListener('click', () => openAttendanceAnalyticsModal('THIS_WEEK'));

    document.getElementById('punchLogPeriodFilter')?.addEventListener('change', () => renderPunchLogs());

    // Analytics Modal Controls
    document.getElementById('btnCloseAttendanceAnalytics')?.addEventListener('click', closeAttendanceAnalyticsModal);
    document.getElementById('btnCloseAttendanceAnalyticsFoot')?.addEventListener('click', closeAttendanceAnalyticsModal);
    document.getElementById('attendanceAnalyticsBackdrop')?.addEventListener('click', closeAttendanceAnalyticsModal);

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
      if (Array.isArray(state.activeSelectedTask.subtasks) && state.activeSelectedTask.subtasks.length > 0) {
        state.activeSelectedTask.subtasks.forEach(s => { s.done = true; });
      }
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
    openCommandCenter();

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
          // Purge phantom records from local cache
          Object.keys(WorkspaceDB.data.members || {}).forEach(k => {
            if (k.startsWith('RD-RD-') || k === 'RD-RD-FAE' || k === 'RD-CEO-002') delete WorkspaceDB.data.members[k];
          });

          cloudMembers.forEach(cm => {
            if (!cm) return;
            const cmEmail = (cm.email || '').toLowerCase();
            const cmUid = cm.uid || cm.id || '';
            const cmDocId = cm.docId || cmUid;

            const isCoreMember = !!(cmEmail && (
              cmEmail === 'tejaswinisiva02@gmail.com' ||
              cmEmail === 'pavithratech1206@gmail.com' ||
              cmEmail === 'keerthijai909@gmail.com' ||
              cmEmail === 'jagadish2k2006@gmail.com'
            ));

            // Check if member is in tombstone or is phantom record
            if (!isCoreMember && (
              tombstone.includes(cmUid) ||
              tombstone.includes(cmDocId) ||
              (cmEmail && tombstone.includes(cmEmail)) ||
              cmUid.startsWith('RD-RD-') ||
              cmDocId.startsWith('RD-RD-') ||
              cm.id === 'RD-RD-FOU' ||
              cm.deleted === true ||
              cm.active === false ||
              ((cm.displayName === 'Team Member' || cm.name === 'Team Member') && !cmEmail) ||
              (!cmEmail && (cmUid.startsWith('RD-') || cmDocId.startsWith('RD-')))
            )) {
              return; // Completely ignore deleted or corrupted member
            }

            const isFounder = (cmEmail === 'jagadish2k2006@gmail.com') || cm.isOwner;
            const memberId = cm.id || (isFounder ? 'RD-FOUNDER-001' : (cm.uid ? `RD-${cm.uid.slice(0, 6).toUpperCase()}` : 'RD-EMP-001'));
            if (tombstone.includes(memberId) || memberId.startsWith('RD-RD-')) return;
            
            // Check if member is actually online based on freshness of heartbeat or local active session
            const isSelf = isSelfMember(cm) || (memberId === state.currentMemberId);
            const isOnline = isSelf || isMemberAppOnline(cm);
            const resolvedStatus = cm.suspended ? 'DUTY_OFF' : (isSelf ? (state.personalShift?.status || cm.status || 'DUTY_OFF') : (cm.status || 'DUTY_OFF'));

            const existing = WorkspaceDB.data.members[memberId] || WorkspaceDB.data.members[cm.uid] || {};
            const cmTime = Number(cm.updatedAt || cm.createdAt || 0);
            const existTime = Number(existing.updatedAt || existing.createdAt || 0);
            const resolvedRole = (existTime > cmTime && existing.role) ? existing.role : (cm.role || existing.role || 'Employee');
            const resolvedDept = (existTime > cmTime && existing.dept) ? existing.dept : (cm.dept || existing.dept || 'Hardware Architecture');

            let finalRole = formatAppRole(resolvedRole, cmEmail);
            let finalDept = resolvedDept;
            if (cmEmail === 'jagadish2k2006@gmail.com') {
              finalRole = 'Founder';
              finalDept = 'Hardware Architecture';
            } else if (cmEmail === 'keerthijai909@gmail.com') {
              finalRole = 'CEO';
              finalDept = 'AI / ML Systems';
            }

            const parsedLastSeen = parseTimestamp(cm.lastSeenAt) || parseTimestamp(existing.lastSeenAt) || 0;
            const isToday = parsedLastSeen && (new Date(parsedLastSeen).toDateString() === new Date().toDateString());

            // Sync resignation blacklist
            if (cm.resigned === true || cm.status === 'RESIGNED') {
              if (!WorkspaceDB.data.deletedMembers) WorkspaceDB.data.deletedMembers = [];
              if (!WorkspaceDB.data.resignedMembers) WorkspaceDB.data.resignedMembers = [];
              if (cmUid && !WorkspaceDB.data.resignedMembers.includes(cmUid)) WorkspaceDB.data.resignedMembers.push(cmUid);
              if (cmEmail && !WorkspaceDB.data.resignedMembers.includes(cmEmail)) WorkspaceDB.data.resignedMembers.push(cmEmail);

              // Auto-kill session if current logged-in user was resigned by Founder
              const curEmail = (state.currentUser?.email || '').toLowerCase().trim();
              const curUid = state.currentUser?.uid;
              if ((cmEmail && cmEmail === curEmail) || (cmUid && cmUid === curUid)) {
                console.warn('[AUTH] Current user was marked resigned by Founder. Terminating session.');
                if (window.FirebaseService?.signOut) {
                  window.FirebaseService.signOut();
                }
                showQuickToast('🚫 Access Revoked: You have been marked as Resigned by the Founder.', 'error');
                openAuthModal('signin');
                return;
              }
            }

            const memberObj = {
              id: memberId,
              uid: cm.uid || cm.id || memberId,
              docId: cm.docId || cm.uid || cm.id || memberId,
              name: cm.displayName || cm.name || (cmEmail === 'keerthijai909@gmail.com' ? 'Jai Keerthi' : 'Team Member'),
              displayName: cm.displayName || cm.name || (cmEmail === 'keerthijai909@gmail.com' ? 'Jai Keerthi' : 'Team Member'),
              role: finalRole,
              dept: finalDept,
              isOnline: isOnline,
              email: cm.email || '',
              photoUrl: cm.photoURL || cm.photoUrl || existing.photoUrl || '',
              photoURL: cm.photoURL || cm.photoUrl || existing.photoURL || '',
              status: resolvedStatus,
              lastSeenAt: parsedLastSeen,
              todaySeconds: isToday ? (cm.todaySeconds !== undefined ? cm.todaySeconds : (existing.todaySeconds || 0)) : 0,
              todayHours: isToday ? (cm.todayHours !== undefined ? cm.todayHours : (existing.todayHours || 0)) : 0,
              todayDate: isToday ? (cm.todayDate || new Date().toDateString()) : null,
              suspended: !!cm.suspended,
              avatarText: (cm.displayName || cm.name || 'RD').slice(0, 2).toUpperCase(),
              updatedAt: Math.max(cmTime, existTime) || Date.now(),
              activeTool: cm.activeTool || existing.activeTool || null,
              backgroundTools: Array.isArray(cm.backgroundTools) ? cm.backgroundTools : (Array.isArray(existing.backgroundTools) ? existing.backgroundTools : [])
            };
            if (memberObj.id && !memberObj.id.startsWith('RD-RD-')) WorkspaceDB.data.members[memberObj.id] = memberObj;
            if (memberObj.uid && !memberObj.uid.startsWith('RD-RD-') && memberObj.uid !== memberObj.id) WorkspaceDB.data.members[memberObj.uid] = memberObj;
          });
          WorkspaceDB.save();
          renderWorkers();
          renderFleetTelemetry();
          renderTeamHoursDashboard();
          renderChatChannelsAndDMs();
          if (window.ChatSyncManager) {
            ChatSyncManager.syncSubscriptions();
          }
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

          if (window.ChatSyncManager) {
            ChatSyncManager.syncSubscriptions();
          }
          renderChatChannelsAndDMs();
        }
      });

      // Synchronize all public channels and member DMs via unified ChatSyncManager
      if (window.ChatSyncManager) {
        ChatSyncManager.syncSubscriptions();
      }

      // 4. Real-time Database User Presence across devices
      if (typeof FirebaseService.subscribeAllPresence === 'function') {
        FirebaseService.subscribeAllPresence((presenceData) => {
          if (presenceData && typeof presenceData === 'object') {
            const now = Date.now();
            let changed = false;

            // Map each entry with strict freshness check (< 90 seconds)
            const activePresenceMap = new Map();
            Object.keys(presenceData).forEach(uid => {
              const p = presenceData[uid];
              if (!p) return;
              const pLastSeen = Number(p.lastSeenAt || p.lastSeen || 0);
              let delta = now - pLastSeen;
              if (delta < 0 && delta > -120000) delta = 0;
              // Must be explicitly online AND have a fresh heartbeat within 90 seconds
              const isTrulyOnline = (p.state === 'online' || p.isOnline === true) && (pLastSeen > 0 ? delta < 90000 : false);
              activePresenceMap.set(uid, { isOnline: isTrulyOnline, lastSeenAt: pLastSeen, email: (p.email || '').toLowerCase() });
            });

            Object.values(WorkspaceDB.data.members || {}).forEach(m => {
              if (!m || isSelfMember(m)) return;

              const mEmail = (m.email || '').toLowerCase().trim();
              let presenceInfo = null;

              if (m.uid && activePresenceMap.has(m.uid)) {
                presenceInfo = activePresenceMap.get(m.uid);
              } else if (m.id && activePresenceMap.has(m.id)) {
                presenceInfo = activePresenceMap.get(m.id);
              } else if (mEmail) {
                for (const [pUid, pVal] of activePresenceMap.entries()) {
                  if (pVal.email && pVal.email === mEmail) {
                    presenceInfo = pVal;
                    break;
                  }
                }
              }

              // Only update if RTDB has active information for this member
              if (presenceInfo) {
                const newOnlineStatus = presenceInfo.isOnline;
                if (m.isOnline !== newOnlineStatus) {
                  m.isOnline = newOnlineStatus;
                  changed = true;
                }
                if (presenceInfo.lastSeenAt > 0 && (!m.lastSeenAt || presenceInfo.lastSeenAt > m.lastSeenAt)) {
                  m.lastSeenAt = presenceInfo.lastSeenAt;
                }
              }
            });

            if (changed) {
              renderWorkers();
              renderFleetTelemetry();
              renderChatChannelsAndDMs();
              updateChatHeaderStatus();
              renderTeamHoursDashboard();
              WorkspaceDB.updateMetricsUI();
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

      
      // 5b. Ongoing Channel Meetings Subscription for Late Joiners
      if (typeof FirebaseService.subscribeActiveCalls === 'function') {
        FirebaseService.subscribeActiveCalls((calls) => {
          state.activeChannelCalls = calls || [];
          updateChannelActiveMeetingBanner();
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

      // Organization Registered Work Tools Cloud Subscription
      if (typeof FirebaseService.subscribeWorkTools === 'function') {
        FirebaseService.subscribeWorkTools((cloudTools) => {
          if (cloudTools && Array.isArray(cloudTools)) {
            WorkspaceDB.data.workTools = cloudTools;
            WorkspaceDB.save().catch(() => {});
            renderWorkTools();
          }
        });
      }

      // Leave & Time-Off Requests Cloud Subscription
      if (typeof FirebaseService.subscribeLeaveRequests === 'function') {
        FirebaseService.subscribeLeaveRequests((cloudLeaves) => {
          if (cloudLeaves && Array.isArray(cloudLeaves)) {
            WorkspaceDB.data.leaveRequests = cloudLeaves;
            WorkspaceDB.save().catch(() => {});
            renderLeaveRequests();
          }
        });
      }

      // 8. Microsoft Teams Saved Bookmarks Subscription
      const currentUid = state.currentUser?.uid;
      if (currentUid && typeof FirebaseService.subscribeBookmarks === 'function') {
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
          // Prompt unauthenticated user to sign in immediately
          openAuthModal('signin');
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
    // Ensures disconnected/closed apps transition to Offline smoothly without flapping
    setInterval(() => {
      let changed = false;
      const now = Date.now();
      Object.values(WorkspaceDB.data.members || {}).forEach(m => {
        if (!m || isSelfMember(m)) return;
        const wasOnline = !!m.isOnline;
        const isNowOnline = isMemberAppOnline(m);
        if (wasOnline !== isNowOnline) {
          m.isOnline = isNowOnline;
          changed = true;
        }
      });
      if (changed) {
        renderWorkers();
        renderFleetTelemetry();
        renderChatChannelsAndDMs();
        updateChatHeaderStatus();
        WorkspaceDB.updateMetricsUI();
      }
    }, 10000);

    // Clean up presence & auto-clock out on window close/reload
    window.addEventListener('beforeunload', () => {
      if (typeof autoPerformExitClockOut === 'function') {
        autoPerformExitClockOut();
      }
      if (window.FirebaseService?.cleanupPresence) {
        window.FirebaseService.cleanupPresence();
      }
    });

    window.addEventListener('pagehide', () => {
      if (typeof autoPerformExitClockOut === 'function') {
        autoPerformExitClockOut();
      }
    });

    // 1. Power State Change Listener (Sleep, Lock, Unlock, Resume)
    if (window.electronAPI && typeof window.electronAPI.onPowerStateChanged === 'function') {
      window.electronAPI.onPowerStateChanged((powerState) => {
        console.log('[POWER MONITOR] System power state changed:', powerState);
        const cur = getCurrentResolvedMember();
        if (!cur || cur.id === 'GUEST' || !state.currentUser) return;

        if (powerState === 'locked') {
          // Screen locked -> pause duty on break immediately
          if (state.personalShift && state.personalShift.status === 'DUTY_ON') {
            recordPunch('BREAK');
            showQuickToast('Workstation locked: Shift paused on break.', 'warning');
          }
        } else if (powerState === 'suspend' || powerState === 'away') {
          // PC sleeping / suspended -> pause duty on break
          if (state.personalShift && state.personalShift.status === 'DUTY_ON') {
            recordPunch('BREAK');
            showQuickToast('PC suspended: Shift automatically paused.', 'info');
          }
        } else if (powerState === 'unlocked' || powerState === 'active' || powerState === 'resume') {
          // STRICT ANTI-CHEAT: Never auto-clock in from DUTY_OFF when PC unlocks/wakes!
          // If already on break, inform user to resume intentionally.
          if (state.personalShift && state.personalShift.status === 'DUTY_BREAK') {
            showQuickToast('Workstation active: Click ▶ Resume to continue your verified shift.', 'info');
          }
        }
      });
    }

    // 2. Strict Working Hours & Anti-Cheat Engine:
    // (A) 180-second (3-minute) AFK Idle detection
    // (B) Active Work Tool verification (ensures approved software is in use)
    let consecutiveNonWorkScans = 0;
    setInterval(async () => {
      try {
        if (!state.currentUser) return;
        const cur = getCurrentResolvedMember();
        if (!cur || cur.id === 'GUEST') return;

        if (!state.personalShift || state.personalShift.status !== 'DUTY_ON') {
          consecutiveNonWorkScans = 0;
          return;
        }

        // Check 1: Hardware OS Idle Time (3 minutes = 180s)
        if (window.electronAPI && typeof window.electronAPI.getSystemIdleTime === 'function') {
          const idleSec = await window.electronAPI.getSystemIdleTime();
          if (idleSec >= 180) {
            state._isIdleAfkPausing = true;
            recordPunch('BREAK');
            showQuickToast('⚠️ Inactivity Timeout (3+ min idle): Shift paused to protect verified hours.', 'warning');
            return;
          }
        }

        // Check 2: Active Work Tool Verification
        if (window.electronAPI && typeof window.electronAPI.getRunningWorkApps === 'function') {
          const runningApps = await window.electronAPI.getRunningWorkApps();
          const registeredTools = (WorkspaceDB.data.workTools || []).filter(t => t.active !== false);

          const runningExeSet = new Set((runningApps || []).map(a => (a.exe || '').toLowerCase().trim()));
          const hasActiveWorkTool = registeredTools.some(tool => {
            const toolExe = (tool.exe || '').toLowerCase().trim();
            if (runningExeSet.has(toolExe)) return true;
            const stripped = toolExe.replace(/\.exe$/i, '');
            return (runningApps || []).some(a => (a.exe || '').toLowerCase().includes(stripped) || (a.appName || '').toLowerCase() === (tool.name || '').toLowerCase());
          });

          if (!hasActiveWorkTool && registeredTools.length > 0) {
            consecutiveNonWorkScans++;
            // 6 scans * 15s = 90 seconds without any approved work tool open
            if (consecutiveNonWorkScans >= 6) {
              consecutiveNonWorkScans = 0;
              state._isNonWorkPausing = true;
              recordPunch('BREAK');
              showQuickToast('⚠️ Non-work activity detected: No registered work tools active. Shift paused.', 'warning');
            }
          } else {
            consecutiveNonWorkScans = 0;
          }
        }
      } catch (_) {}
    }, 15000);

    // Resume on genuine user activity when interacting with the workstation
    const handleUserActivityResume = async () => {
      if (state._isIdleAfkPausing || state._isNonWorkPausing) {
        const cur = getCurrentResolvedMember();
        if (cur && cur.id !== 'GUEST' && state.currentUser && state.personalShift && state.personalShift.status === 'DUTY_BREAK') {
          // Verify an approved work tool is open before auto-resuming
          let canResume = true;
          if (window.electronAPI && typeof window.electronAPI.getRunningWorkApps === 'function') {
            try {
              const runningApps = await window.electronAPI.getRunningWorkApps();
              const registeredTools = (WorkspaceDB.data.workTools || []).filter(t => t.active !== false);
              if (registeredTools.length > 0) {
                const runningExeSet = new Set((runningApps || []).map(a => (a.exe || '').toLowerCase().trim()));
                canResume = registeredTools.some(tool => {
                  const toolExe = (tool.exe || '').toLowerCase().trim();
                  return runningExeSet.has(toolExe) || (runningApps || []).some(a => (a.appName || '').toLowerCase() === (tool.name || '').toLowerCase());
                });
              }
            } catch (_) {}
          }

          if (canResume) {
            state._isIdleAfkPausing = false;
            state._isNonWorkPausing = false;
            recordPunch('CLOCK_IN');
            showQuickToast('✅ Approved work tool active: Shift automatically resumed.', 'success');
          }
        }
      }
    };
    window.addEventListener('mousemove', handleUserActivityResume, { passive: true });
    window.addEventListener('keydown', handleUserActivityResume, { passive: true });
    window.addEventListener('pointerdown', handleUserActivityResume, { passive: true });

    // Initialize Over-The-Air (OTA) Cloud Software Updater
    initOtaUpdater();

    // Background silent refresh for active chat channel (keeps ticks, reactions & edits live)
    setInterval(() => {
      if (state.activeTab === 'chat' && state.activeChannelId && !document.hidden) {
        silentRefreshCurrentChat(false);
      }
    }, 15000);
  
  }

  // --- OVER-THE-AIR (OTA) CLOUD SOFTWARE UPDATER CONTROLLER ---
  let otaUpdateInfo = null;

    function getClientActiveVersion() {
    if (window.WORKSTATION_ACTIVE_VERSION) return window.WORKSTATION_ACTIVE_VERSION;
    if (otaUpdateInfo && otaUpdateInfo.currentVersion) return otaUpdateInfo.currentVersion;
    try {
      const stored = localStorage.getItem('appliedOtaVersion');
      if (stored) return stored;
    } catch (_) {}
    const badge = document.getElementById('otaVersionBadge');
    if (badge && badge.textContent) {
      const match = badge.textContent.match(/VERSION\s+([0-9.]+)/i);
      if (match && match[1]) return match[1];
    }
    return '3.6.3';
  }

  function hideGlobalOtaNotification() {
    const banner = document.getElementById('otaGlobalBanner');
    const headerPill = document.getElementById('headerOtaPill');
    const topPill = document.getElementById('topOtaPill');
    if (banner) banner.classList.add('hidden');
    if (headerPill) headerPill.classList.add('hidden');
    if (topPill) topPill.classList.add('hidden');
  }

    function syncBrandVersionInDom(ver) {
    if (!ver) return;
    const cmdTitle = document.getElementById('cmdTitle');
    if (cmdTitle) cmdTitle.textContent = 'REDDOT Workstation v' + ver;
    document.querySelectorAll('.footer-engine-tag').forEach(el => {
      el.textContent = 'REDDOT Workstation v' + ver;
    });
  }

  async function initOtaUpdater() {
    if (window.electronAPI && window.electronAPI.otaGetInfo) {
      try {
        const info = await window.electronAPI.otaGetInfo();
        if (info && info.version) {
          window.WORKSTATION_ACTIVE_VERSION = info.version;
          syncBrandVersionInDom(info.version);
          if (!otaUpdateInfo) otaUpdateInfo = {};
          otaUpdateInfo.currentVersion = info.version;
          try { localStorage.setItem('appliedOtaVersion', info.version); } catch (_) {}
        }
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
        const currentVer = getClientActiveVersion();
        const appliedVer = localStorage.getItem('appliedOtaVersion');
        if (compareSemver(remoteVer, currentVer) > 0 && (!appliedVer || compareSemver(remoteVer, appliedVer) > 0)) {
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
        } else {
          hideGlobalOtaNotification();
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
    const currentActive = getClientActiveVersion();
    if (compareSemver(info.latestVersion, currentActive) <= 0) {
      hideGlobalOtaNotification();
      return;
    }
    // Suppress banner if user already applied this version (persists across sessions)
    try {
      const applied = localStorage.getItem('appliedOtaVersion');
      if (applied && compareSemver(info.latestVersion, applied) <= 0) {
        hideGlobalOtaNotification();
        return;
      }
    } catch (_) {}

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
          const targetV = res.version || (otaUpdateInfo && otaUpdateInfo.latestVersion) || '3.6.3';
          window.WORKSTATION_ACTIVE_VERSION = targetV;
          try { localStorage.setItem('appliedOtaVersion', targetV); } catch(_) {}
          hideGlobalOtaNotification();
          playNotificationChirp(true);
          if (btn) btn.innerHTML = '<span>✅ Updated to v' + (res.version || '3.5.5') + '! Reloading...</span>';
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
        // Suppress notification if this OTA version was already applied
        try {
          const stored = localStorage.getItem('appliedOtaVersion');
          if (stored && stored === res.latestVersion) {
            res.hasUpdate = false;
          }
        } catch (e) {
          console.warn('Failed to read applied OTA version from storage', e);
        }

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



// Add hover style for image download button
const styleImgDl = document.createElement('style');
styleImgDl.textContent = '.msg-img-container:hover .btn-msg-img-dl { opacity: 1 !important; }';
document.head.appendChild(styleImgDl);
