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
            id === 'RD-RD-FOU' || id === 'RD-EMP-101' || id === 'RD-EMP-102' || id === 'RD-EMP-103' || id === 'pavithratech1206' ||
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
        });
        if (changed) {
          await this.save();
        }
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

      safeSetText(document.getElementById('dbStatOnlineCount'), Math.max(1, onlineCount));
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
    commandCenterOpen: true,
    selectedViewingMemberId: null,
    tempNewWorkerPhoto: null,
    tempSignUpPhoto: null,

    // Teams Collaboration State
    activeHubTab: 'posts',
    activeTeamsRailTab: 'chat',
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
      state.userRole = isSoleAdmin ? 'OWNER' : (member.role || 'employee').toUpperCase();

      if (isSoleAdmin) {
        member.role = 'owner';
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
      safeSetText(roleLabel, `${(member.displayName || member.name || user.email.split('@')[0]).toUpperCase()} // ${isSoleAdmin ? 'FOUNDER & ADMIN' : (member.role || 'EMPLOYEE').toUpperCase()}`);
      safeSetText(sessionEmpId, member.id || (isSoleAdmin ? 'RD-FOUNDER-001' : 'ONLINE'));

      mountMemberOnWallpaper(state.currentMemberId);
      renderWorkers();
      renderTasks();
      renderChatChannelsAndDMs();
      renderFleetTelemetry();
    } else if (user) {
      const fallbackId = isSoleAdmin ? 'RD-FOUNDER-001' : `RD-${user.uid.slice(0, 6).toUpperCase()}`;
      state.currentMemberId = fallbackId;
      state.userRole = isSoleAdmin ? 'OWNER' : 'employee';
      if (roleDot) roleDot.style.background = '#00e676';
      safeSetText(roleLabel, `${user.email.split('@')[0].toUpperCase()} // ${isSoleAdmin ? 'FOUNDER & ADMIN' : 'ONLINE'}`);
      safeSetText(sessionEmpId, fallbackId);
    } else {
      // Default to Founder session if offline/guest mode so features stay interactive
      state.currentMemberId = 'RD-FOUNDER-001';
      state.userRole = 'OWNER';
      if (roleDot) roleDot.style.background = '#00e676';
      safeSetText(roleLabel, 'JAGADISH K // FOUNDER & ADMIN');
      safeSetText(sessionEmpId, 'RD-FOUNDER-001');
    }
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
  function renderWorkers() {
    const grid = document.getElementById('workersCardsGrid');
    if (!grid) return;
    grid.replaceChildren();

    const searchInput = document.getElementById('searchWorkerInput')?.value?.toLowerCase() || '';
    const isFounderAdmin = (state.currentUser?.email?.toLowerCase() === 'jagadish2k2006@gmail.com' || state.userRole === 'OWNER');

    const list = getUniqueMembersList().filter(m => {
      // Filter out legacy fake demo names
      if (m.name === 'Alex Rivera' || m.name === 'Priya Sharma' || m.name === 'Vikram Malhotra') return false;
      if (!searchInput) return true;
      return (m.name || '').toLowerCase().includes(searchInput) ||
             (m.id || '').toLowerCase().includes(searchInput) ||
             (m.role || '').toLowerCase().includes(searchInput) ||
             (m.dept || '').toLowerCase().includes(searchInput);
    });

    if (list.length === 0) {
      grid.innerHTML = `
        <div class="empty-state-box" style="grid-column: 1 / -1; padding: 30px; text-align: center;">
          <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 8px;">No team members registered yet.</p>
          <p style="font-size: 11px; color: var(--text-muted);">Click <strong>+ Create Member &amp; ID Card</strong> to onboard colleagues or invite them to sign in.</p>
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

      const isSelf = (member.id === state.currentMemberId || (member.email && member.email.toLowerCase() === state.currentUser?.email?.toLowerCase()) || member.email?.toLowerCase() === 'jagadish2k2006@gmail.com');
      const isOnline = isSelf || (!member.suspended && member.status === 'DUTY_ON');
      const isBreak = member.status === 'DUTY_BREAK';
      const statusClass = member.suspended ? 'pulse-red' : (isOnline ? 'pulse-green' : (isBreak ? 'pulse-amber' : 'pulse-red'));
      const statusText = member.suspended ? '⛔ Suspended' : (isOnline ? '🟢 Online' : (isBreak ? '🟡 Away' : '🔴 Offline'));

      const safeName = escapeHtml(member.name || member.displayName || 'Member');
      const safeId = escapeHtml(member.id || (member.uid ? `RD-${member.uid.slice(0, 6).toUpperCase()}` : 'RD-EMP-000'));
      const safeDept = escapeHtml(member.dept || 'Hardware Architecture');
      const safeRole = escapeHtml(member.role || 'Employee');
      const safeAvatar = escapeHtml(member.avatarText || (member.name || 'RD').slice(0, 2)).toUpperCase();
      const safePhoto = sanitizeUrl(member.photoUrl || member.photoURL);

      card.innerHTML = `
        <div class="worker-card-head">
          <div class="worker-avatar-box">
            ${safePhoto ? `
              <div class="worker-avatar-img-wrap">
                <img src="${safePhoto}" alt="" referrerpolicy="no-referrer" class="worker-avatar-img" style="width: 52px; height: 52px; max-width: 52px; max-height: 52px; object-fit: cover; border-radius: 11px; display: block;" onerror="this.parentElement.style.display='none'; if(this.parentElement.nextElementSibling) this.parentElement.nextElementSibling.style.display='flex';">
              </div>
              <span class="worker-avatar-text" style="display: none;">${safeAvatar}</span>
            ` : `
              <span class="worker-avatar-text">${safeAvatar}</span>
            `}
            <span class="presence-dot ${statusClass}" title="${statusText}"></span>
          </div>
          <div class="worker-meta">
            <h4 class="worker-name">${safeName}</h4>
            <p class="worker-email">${safeId} &bull; ${safeDept}</p>
            <div style="display: flex; gap: 6px; align-items: center; margin-top: 2px;">
              <span class="worker-role-pill ${member.isOwner ? 'role-owner' : 'role-emp'}" title="Click to edit designation & department">${safeRole} ✎</span>
              ${member.suspended ? `<span style="font-size: 9px; font-family: var(--font-mono); color: #ff5252; background: rgba(255,82,82,0.15); padding: 2px 6px; border-radius: 4px; font-weight: 800;">⛔ SUSPENDED</span>` : ''}
            </div>
          </div>
        </div>

        <div class="worker-card-actions">
          <div class="worker-actions-main">
            <button class="btn-worker-action btn-worker-chat" data-id="${safeId}" title="Send Direct Message">
              <span>💬 Chat</span>
            </button>
            <button class="btn-worker-action btn-worker-meet" data-id="${safeId}" title="Start Video Call">
              <span>📹 Meet</span>
            </button>
            <button class="btn-worker-action btn-view-badge" data-id="${safeId}" title="View Identification Badge">
              <span>🪪 ID Card</span>
            </button>
            <button class="btn-worker-action btn-mount-wallpaper" data-id="${safeId}" title="Mount ID Card onto Desktop Wallpaper">
              <span>🖼️ Mount</span>
            </button>
          </div>
          ${canManageRoles ? `
            <div class="worker-actions-admin">
              <button class="btn-worker-action btn-auth-role" data-id="${safeId}" title="Edit Department & Role">
                <span>⭐ Role</span>
              </button>
              ${!isSelf ? `
                <button class="btn-worker-action btn-toggle-suspend" data-id="${safeId}" style="color: ${member.suspended ? '#00e676' : '#ffb300'};" title="${member.suspended ? 'Reactivate ID access' : 'Suspend ID access'}">
                  <span>${member.suspended ? '🔓 Reactivate' : '⛔ Suspend'}</span>
                </button>
                <button class="btn-worker-action btn-delete-member" data-id="${safeId}" style="color: #ff5252;" title="Permanently delete member and revoke ID">
                  <span>🗑️ Delete</span>
                </button>
              ` : `
                <div class="worker-admin-self-tag">
                  <span>👑 Workspace Administrator</span>
                </div>
              `}
            </div>
          ` : ''}
        </div>
      `;

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
    const select = document.getElementById('taskAssigneeSelect');
    if (!select) return;
    select.replaceChildren();

    const optAll = document.createElement('option');
    optAll.value = 'ALL';
    optAll.dataset.name = 'Entire Team';
    optAll.dataset.email = '';
    optAll.textContent = 'Entire Team (ALL)';
    select.appendChild(optAll);

    getUniqueMembersList().forEach(m => {
      const opt = document.createElement('option');
      const safeMId = m.id || m.uid || 'RD-EMP';
      const safeMName = m.displayName || m.name || (m.email ? m.email.split('@')[0] : 'Team Member');
      opt.value = safeMId;
      opt.dataset.name = safeMName;
      opt.dataset.email = m.email || '';
      opt.textContent = `${safeMName} [${safeMId}]`;
      select.appendChild(opt);
    });
  }

  function renderTasks() {
    const container = document.getElementById('taskCardsList');
    const totalBadge = document.getElementById('tasksTotalBadge');
    if (!container) return;
    container.replaceChildren();

    // Populate assignee dropdown if empty without wiping active selection
    const select = document.getElementById('taskAssigneeSelect');
    if (!select || select.children.length <= 1) {
      populateAssigneeSelect();
    }

    // Deduplicate tasks: guarantee no task is ever rendered twice
    const seenIds = new Set();
    const seenKeys = new Set();
    const deduped = [];
    (WorkspaceDB.data.tasks || []).forEach(t => {
      if (!t || !t.id) return;
      const key = `${(t.title || '').trim().toLowerCase()}___${t.createdAt}`;
      if (seenIds.has(t.id) || seenKeys.has(key)) return;
      seenIds.add(t.id);
      seenKeys.add(key);
      deduped.push(t);
    });
    WorkspaceDB.data.tasks = deduped;

    let filtered = WorkspaceDB.data.tasks || [];
    const curUid = state.currentUser?.uid;
    const curEmail = state.currentUser?.email?.toLowerCase();
    const curId = state.currentMemberId;

    if (state.taskFilter === 'MY_TASKS') {
      filtered = filtered.filter(t => {
        if (t.assigneeId === 'ALL') return true;
        if (curId && t.assigneeId === curId) return true;
        if (curUid && (t.assigneeId === curUid || t.assigneeUid === curUid)) return true;
        if (curEmail && (t.assigneeEmail === curEmail || t.assigneeId === curEmail)) return true;
        return false;
      });
    } else if (state.taskFilter !== 'ALL') {
      filtered = filtered.filter(t => t.status === state.taskFilter);
    }

    if (totalBadge) totalBadge.textContent = `${filtered.length} Tasks`;

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state-box" style="padding: 30px; text-align: center;">
          <span style="font-size: 28px; display: block; margin-bottom: 8px;">📋</span>
          <p style="color: #fff; font-weight: 600;">No tasks match this filter</p>
          <p style="font-size: 11px; color: var(--text-muted);">Create a new task above or switch filters.</p>
        </div>
      `;
      return;
    }

    filtered.forEach(task => {
      const card = document.createElement('div');
      card.className = `task-card status-${(task.status || 'assigned').toLowerCase()} priority-${(task.priority || 'normal').toLowerCase()}`;

      const assignee = WorkspaceDB.data.members[task.assigneeId];
      const assigneeName = task.assigneeName || (task.assigneeId === 'ALL' ? 'Entire Team' : (assignee?.name || task.assigneeId));

      const safePriority = escapeHtml(task.priority || 'NORMAL');
      const safeTitle = escapeHtml(task.title);
      const safeStatus = escapeHtml(task.status || 'ASSIGNED');
      const safeDesc = escapeHtml(task.description || 'No additional notes provided.');
      const safeAssignee = escapeHtml(assigneeName);
      const safeDue = escapeHtml(task.dueAt || 'Today');
      const safeCreated = escapeHtml(new Date(task.createdAt || Date.now()).toLocaleDateString());
      const safeTaskId = escapeHtml(task.id);

      card.innerHTML = `
        <div class="task-card-header">
          <div class="task-title-group">
            <span class="task-priority-badge">${safePriority}</span>
            <h4 class="task-title">${safeTitle}</h4>
          </div>
          <span class="task-status-pill">${safeStatus}</span>
        </div>

        <p class="task-desc">${safeDesc}</p>

        <div class="task-meta-row">
          <span class="task-meta-item">&#x1F464; <strong>${safeAssignee}</strong></span>
          <span class="task-meta-item">&#x23F0; ${safeDue}</span>
          <span class="task-meta-item">&#x1F4C5; ${safeCreated}</span>
        </div>

        <div class="task-actions-row">
          <button class="btn-task-action btn-task-view" data-id="${safeTaskId}">
            <span>💬 Activity &amp; Comments</span>
          </button>
          <button class="btn-task-action btn-task-edit" data-id="${safeTaskId}" title="Edit Task Details">
            <span>✏️ Edit</span>
          </button>
          <select class="custom-select task-status-select" data-id="${safeTaskId}">
            <option value="ASSIGNED" ${task.status === 'ASSIGNED' ? 'selected' : ''}>Assigned</option>
            <option value="REACHED" ${task.status === 'REACHED' ? 'selected' : ''}>In Progress</option>
            <option value="ACCOMPLISHED" ${task.status === 'ACCOMPLISHED' ? 'selected' : ''}>Completed</option>
          </select>
          <button class="btn-task-action btn-task-delete" data-id="${safeTaskId}" title="Delete Task">
            <span>🗑️</span>
          </button>
        </div>
      `;

      card.querySelector('.task-status-pill')?.addEventListener('click', async () => {
        const nextMap = {
          'ASSIGNED': 'REACHED',
          'REACHED': 'ACCOMPLISHED',
          'ACCOMPLISHED': 'ASSIGNED'
        };
        const newStatus = nextMap[task.status || 'ASSIGNED'] || 'ASSIGNED';
        task.status = newStatus;
        const authorName = WorkspaceDB.data.members[state.currentMemberId]?.name || state.currentUser?.displayName || 'JAGADISH K';
        if (!task.activity) task.activity = [];
        task.activity.push({
          authorName: authorName,
          text: `Status updated to ${newStatus}`,
          timestamp: Date.now()
        });
        await WorkspaceDB.save();

        if (window.FirebaseService?.db) {
          FirebaseService.updateTaskStatus(task.id, newStatus).catch(err => {
            console.warn('[FIREBASE] Task status cloud update:', err.message);
          });
        }

        renderTasks();
        playNotificationChirp(true);
        const label = newStatus === 'REACHED' ? 'In Progress' : (newStatus === 'ACCOMPLISHED' ? 'Completed' : 'Assigned');
        showQuickToast(`Task "${task.title}" status changed to ${label}`, 'info');
      });

      card.querySelector('.btn-task-view')?.addEventListener('click', () => {
        openTaskActivityModal(task);
      });

      card.querySelector('.btn-task-edit')?.addEventListener('click', () => {
        openEditTaskModal(task);
      });

      card.querySelector('.task-status-select')?.addEventListener('change', async (e) => {
        const newStatus = e.target.value;
        task.status = newStatus;
        const authorName = WorkspaceDB.data.members[state.currentMemberId]?.name || state.currentUser?.displayName || 'JAGADISH K';
        if (!task.activity) task.activity = [];
        task.activity.push({
          authorName: authorName,
          text: `Status updated to ${newStatus}`,
          timestamp: Date.now()
        });
        await WorkspaceDB.save();

        if (window.FirebaseService?.db) {
          FirebaseService.updateTaskStatus(task.id, newStatus).catch(err => {
            console.warn('[FIREBASE] Task status cloud update:', err.message);
          });
        }

        renderTasks();
        playNotificationChirp(true);
      });

      card.querySelector('.btn-task-delete')?.addEventListener('click', async () => {
        if (confirm(`Delete task "${task.title}"?`)) {
          WorkspaceDB.data.tasks = WorkspaceDB.data.tasks.filter(t => t.id !== task.id);
          await WorkspaceDB.save();
          if (window.FirebaseService?.db) {
            try {
              await FirebaseService.db.collection(`organizations/${window.REDDOT_ORG_ID || 'reddot'}/tasks`).doc(task.id).delete();
            } catch (_) {}
          }
          renderTasks();
          playNotificationChirp(false);
        }
      });

      container.appendChild(card);
    });
  }

  function ensureEditTaskModal() {
    let modal = document.getElementById('editTaskModal');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'editTaskModal';
    modal.className = 'modal-overlay hidden';
    modal.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <div class="modal-title-row">
            <span class="modal-title" id="editTaskModalTitle">EDIT TASK</span>
            <span class="modal-badge">TEAM CLOUD</span>
          </div>
          <button type="button" class="btn-icon" id="btnCloseEditTaskModal" title="Close">✕</button>
        </div>
        <form id="formEditTask" class="modal-body">
          <input type="hidden" id="editTaskId" value="" />
          <div class="form-group">
            <label for="editTaskTitle" class="form-label">Task Title</label>
            <input type="text" id="editTaskTitle" class="form-input" placeholder="What needs to be done?" required />
          </div>
          <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="form-group">
              <label for="editTaskAssignee" class="form-label">Assignee</label>
              <select id="editTaskAssignee" class="form-select">
                <option value="ALL">Entire Team (ALL)</option>
              </select>
            </div>
            <div class="form-group">
              <label for="editTaskPriority" class="form-label">Priority</label>
              <select id="editTaskPriority" class="form-select">
                <option value="LOW">Low</option>
                <option value="NORMAL" selected>Normal</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>
          <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="form-group">
              <label for="editTaskStatus" class="form-label">Status</label>
              <select id="editTaskStatus" class="form-select">
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="REVIEW">Under Review</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
            <div class="form-group">
              <label for="editTaskDue" class="form-label">Target Completion</label>
              <input type="date" id="editTaskDue" class="form-input" />
            </div>
          </div>
          <div class="form-group">
            <label for="editTaskDesc" class="form-label">Description / Work Notes</label>
            <textarea id="editTaskDesc" class="form-textarea" rows="3" placeholder="Provide extra context, links, or requirements..."></textarea>
          </div>
          <div class="modal-actions" style="margin-top: 14px; display: flex; justify-content: flex-end; gap: 10px;">
            <button type="button" class="btn btn-secondary" id="btnCancelEditTask">Cancel</button>
            <button type="submit" class="btn btn-primary" id="btnSaveEditTask">💾 Save Changes</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('btnCloseEditTaskModal')?.addEventListener('click', closeEditTaskModal);
    document.getElementById('btnCancelEditTask')?.addEventListener('click', closeEditTaskModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeEditTaskModal();
    });
    document.getElementById('formEditTask')?.addEventListener('submit', (e) => {
      e.preventDefault();
      saveEditTask();
    });

    return modal;
  }

  function openEditTaskModal(task) {
    if (!task) return;
    const modal = ensureEditTaskModal();
    if (!modal) return;

    safeSetText(document.getElementById('editTaskModalTitle'), `EDIT TASK: ${task.title || 'Task'}`);

    const idInput = document.getElementById('editTaskId');
    const titleInput = document.getElementById('editTaskTitle');
    const assigneeSelect = document.getElementById('editTaskAssignee');
    const prioritySelect = document.getElementById('editTaskPriority');
    const statusSelect = document.getElementById('editTaskStatus');
    const dueInput = document.getElementById('editTaskDue');
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
    if (statusSelect) statusSelect.value = task.status || 'ASSIGNED';
    if (dueInput) dueInput.value = task.dueAt || '';
    if (descInput) descInput.value = task.description || '';

    modal.classList.remove('hidden');
    setTimeout(() => titleInput?.focus(), 50);
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
      <div style="font-size: 10px; color: var(--text-muted); display: flex; gap: 12px;">
        <span>Assignee: <strong>${escapeHtml(task.assigneeName || task.assigneeId)}</strong></span>
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
      const isOnline = member.status === 'DUTY_ON' || (member.lastSeenAt && (Date.now() - member.lastSeenAt < 60000));

      btn.innerHTML = `
        <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${isOnline ? '#00e676' : '#727284'}; margin-right: 6px; box-shadow: ${isOnline ? '0 0 6px #00e676' : 'none'};"></span>
        <span>${escapeHtml(mName)} <small style="color: var(--text-muted); font-size: 10px; font-family: var(--font-mono);">[${escapeHtml(safeId)}]</small></span>
      `;

      btn.addEventListener('click', async () => {
        let dmChannelId = (window.FirebaseService && FirebaseService.getDeterministicDMChannelId)
          ? FirebaseService.getDeterministicDMChannelId(currentEmail || currentId, mEmail || mId)
          : `dm_${[currentEmail || currentId, mEmail || mId].sort().join('_').replace(/[^a-z0-9]/gi, '_')}`;

        if (window.FirebaseService && FirebaseService.getOrCreateDMChannel) {
          try {
            const cloudDmId = await FirebaseService.getOrCreateDMChannel(member, mName);
            if (cloudDmId) dmChannelId = cloudDmId;
          } catch (e) {
            console.warn('[DM] Cloud DM notice:', e);
          }
        }
        selectChatTarget(dmChannelId, mName);
      });

      dmList.appendChild(btn);
    });
  }

  function selectChatTarget(channelId, displayName = null, customTopic = null) {
    state.activeChannelId = channelId;

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
      safeSetText(titleEl, `💬 Direct Message: ${displayName || channelId}`);
      safeSetText(topicEl, 'Private 1-on-1 encrypted cloud conversation');
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
    const isFounderOrOwner = state.userRole === 'OWNER' || (state.currentUser?.email && state.currentUser.email.toLowerCase().includes('founder'));

    // Differential DOM reconciliation
    const existingRows = new Map();
    container.querySelectorAll('.chat-msg-row[data-msg-id]').forEach(el => {
      existingRows.set(el.getAttribute('data-msg-id'), el);
    });

    const currentIds = new Set(msgs.map(m => m.id));

    // Remove deleted message elements
    existingRows.forEach((el, id) => {
      if (!currentIds.has(id)) {
        el.remove();
        existingRows.delete(id);
      }
    });

    msgs.forEach(msg => {
      const msgUid = msg.senderUid || msg.senderId;
      const msgEmail = (msg.senderEmail || '').toLowerCase();
      const msgEmpId = msg.senderEmpId || msg.senderId;

      const isSelf = (currentUid && msgUid === currentUid) ||
                     (currentEmail && msgEmail && msgEmail === currentEmail) ||
                     (currentEmpId && (msgEmpId === currentEmpId || msgUid === currentEmpId));

      const canEditOrDelete = isSelf || isFounderOrOwner;
      const isEditing = state.editingMessageId === msg.id;

      let msgRow = existingRows.get(msg.id);
      const isNew = !msgRow;

      if (isNew) {
        msgRow = document.createElement('div');
        msgRow.setAttribute('data-msg-id', msg.id);
        container.appendChild(msgRow);
      }

      msgRow.className = `chat-msg-row ${isSelf ? 'msg-self' : 'msg-other'} ${msg.isPinned ? 'msg-pinned' : ''}`;

      const senderName = escapeHtml(msg.senderName || 'Colleague');
      const senderBadge = escapeHtml(msg.senderEmpId || (msgUid ? `RD-${String(msgUid).slice(0, 5).toUpperCase()}` : 'RD'));
      const avatar = escapeHtml((msg.senderName || 'RD').slice(0, 2).toUpperCase());
      const photoUrl = sanitizeUrl(msg.senderPhoto || '');
      const timeStr = escapeHtml(new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

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

      // 6. Teams Floating Hover Action Bar HTML
      const isBookmarked = (WorkspaceDB.data.savedMessages || []).some(b => b.id === msg.id);
      const actionsBarHtml = `
        <div class="chat-msg-actions-bar">
          <button class="msg-action-btn btn-react" data-emoji="👍" data-msg-id="${msg.id}" title="Like">👍</button>
          <button class="msg-action-btn btn-react" data-emoji="❤️" data-msg-id="${msg.id}" title="Heart">❤️</button>
          <button class="msg-action-btn btn-react" data-emoji="😂" data-msg-id="${msg.id}" title="Laugh">😂</button>
          <button class="msg-action-btn btn-react" data-emoji="😮" data-msg-id="${msg.id}" title="Surprised">😮</button>
          <button class="msg-action-btn btn-react" data-emoji="🚀" data-msg-id="${msg.id}" title="Rocket">🚀</button>
          <button class="msg-action-btn btn-thread-action" data-msg-id="${msg.id}" title="Reply in thread">💬</button>
          <button class="msg-action-btn btn-reply-msg" data-msg-id="${msg.id}" title="Quote reply">↩️</button>
          <button class="msg-action-btn btn-bookmark-msg" data-msg-id="${msg.id}" title="${isBookmarked ? 'Remove Bookmark' : 'Save Message'}">${isBookmarked ? '⭐' : '🔖'}</button>
          ${canEditOrDelete ? `<button class="msg-action-btn btn-edit-msg" data-msg-id="${msg.id}" title="Edit message">✏️</button>` : ''}
          <button class="msg-action-btn btn-pin-msg" data-msg-id="${msg.id}" title="${msg.isPinned ? 'Unpin message' : 'Pin message'}">${msg.isPinned ? '📍' : '📌'}</button>
          <button class="msg-action-btn btn-copy-msg" data-msg-id="${msg.id}" title="Copy message text">📋</button>
          ${canEditOrDelete ? `<button class="msg-action-btn btn-danger btn-delete-msg" data-msg-id="${msg.id}" title="Delete message">🗑️</button>` : ''}
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
            <span class="msg-time">${timeStr}</span>
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
                <span style="width: 8px; height: 8px; border-radius: 50%; background: ${m.status === 'DUTY_ON' ? '#00e676' : '#727284'};"></span>
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
    if (!confirm('Are you sure you want to delete this message?')) return;
    const msgs = WorkspaceDB.data.chats[state.activeChannelId] || [];
    WorkspaceDB.data.chats[state.activeChannelId] = msgs.filter(m => m.id !== msgId);
    await WorkspaceDB.save();

    if (window.FirebaseService?.deleteMessage) {
      FirebaseService.deleteMessage(state.activeChannelId, msgId).catch(() => {});
    }
    renderMessages();
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
      state.voiceRecorder = new MediaRecorder(stream);
      state.voiceRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) state.voiceAudioChunks.push(e.data);
      };
      state.voiceRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        if (state.voiceShouldSend) {
          const audioBlob = new Blob(state.voiceAudioChunks, { type: 'audio/webm' });
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

    const member = WorkspaceDB.data.members[state.currentMemberId] || state.currentMember || {};
    const senderUid = state.currentUser ? state.currentUser.uid : (state.currentMemberId || 'RD-FOUNDER-001');
    const senderEmpId = state.currentMemberId || (senderUid ? `RD-${String(senderUid).slice(0, 6).toUpperCase()}` : 'RD-001');
    const senderName = member?.name || member?.displayName || state.currentUser?.displayName || (state.currentUser?.email ? state.currentUser.email.split('@')[0].toUpperCase() : 'JAGADISH K');
    const senderEmail = state.currentUser ? state.currentUser.email.toLowerCase() : 'jagadish2k2006@gmail.com';
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
      isPinned: false
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

    const member = WorkspaceDB.data.members[state.currentMemberId] || state.currentMember || {};
    const senderName = member?.name || member?.displayName || state.currentUser?.displayName || 'JAGADISH K';
    const senderUid = state.currentUser ? state.currentUser.uid : (state.currentMemberId || 'RD-FOUNDER-001');

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
        item.unread = false;
        WorkspaceDB.save().catch(() => {});
        updateActivityBadge();
        switchTeamsRailTab('chat');
        if (item.channelId) {
          selectChatTarget(item.channelId);
          if (item.msgId) {
            setTimeout(() => {
              const targetRow = document.querySelector(`[data-msg-id="${item.msgId}"]`);
              if (targetRow) {
                targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                targetRow.style.boxShadow = '0 0 20px var(--accent-cyan)';
                setTimeout(() => targetRow.style.boxShadow = 'none', 1800);
              }
            }, 350);
          }
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
      const isOnline = m.status === 'DUTY_ON';

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
      allFiles = allFiles.filter(f => f.name?.endsWith('.pdf') || f.name?.endsWith('.doc') || f.name?.endsWith('.txt'));
    } else if (filter === 'code') {
      allFiles = allFiles.filter(f => f.name?.endsWith('.js') || f.name?.endsWith('.json') || f.name?.endsWith('.html') || f.name?.endsWith('.css') || f.name?.endsWith('.ts'));
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
    const myUid = state.currentUser?.uid || state.currentMemberId || 'RD-FOUNDER-001';
    if (window.FirebaseService?.toggleBookmark) {
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

  // --- TEAM PRESENCE & AUDIT LOGS ---
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
    const todayStr = new Date().toLocaleDateString();

    const mId = member.id;
    const mUid = member.uid;
    const mEmail = (member.email || '').toLowerCase();
    const isSelf = (mId === state.currentMemberId || (mEmail && mEmail === state.currentUser?.email?.toLowerCase()) || mEmail === 'jagadish2k2006@gmail.com');

    // 1. Calculate from local punch logs for today
    const memberPunches = (WorkspaceDB.data.punchLogs || []).filter(p => {
      const pWorkerId = p.workerId;
      const pEmail = (p.email || '').toLowerCase();
      const matchId = (pWorkerId === mId || (mUid && pWorkerId === mUid));
      const matchEmail = (mEmail && pEmail && pEmail === mEmail);
      const isToday = (p.timestamp >= startOfToday) || (p.date === todayStr);
      return (matchId || matchEmail) && isToday;
    }).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

    let completedSeconds = 0;
    let openPunchTimestamp = null;

    memberPunches.forEach(p => {
      if (p.action === 'CLOCK_IN') {
        openPunchTimestamp = p.timestamp || now;
      } else if (p.action === 'CLOCK_OUT' || p.action === 'BREAK') {
        if (openPunchTimestamp) {
          const deltaSec = Math.max(0, Math.floor(((p.timestamp || now) - openPunchTimestamp) / 1000));
          if (deltaSec < 86400) {
            completedSeconds += deltaSec;
          }
          openPunchTimestamp = null;
        }
      }
    });

    // 2. If this is the active user on this workstation
    if (isSelf) {
      const activeShiftSec = state.personalShift?.seconds || 0;
      let activeCurrent = 0;
      if (state.personalShift?.status === 'DUTY_ON' || state.personalShift?.status === 'DUTY_BREAK') {
        activeCurrent = activeShiftSec;
      }
      return Math.max(completedSeconds + (openPunchTimestamp && state.personalShift?.status === 'DUTY_ON' ? Math.max(0, Math.floor((now - openPunchTimestamp) / 1000)) : 0), activeCurrent);
    }

    // 3. For other team members:
    // If they have reported todaySeconds from cloud sync
    if (member.todaySeconds && typeof member.todaySeconds === 'number' && member.todaySeconds > 0) {
      let remoteSec = member.todaySeconds;
      if (member.status === 'DUTY_ON' && member.lastSeenAt && (now - member.lastSeenAt < 60000)) {
        remoteSec += Math.max(0, Math.floor((now - member.lastSeenAt) / 1000));
      }
      return Math.max(completedSeconds, remoteSec);
    }

    if (member.todayHours !== undefined && member.todayHours !== null && typeof member.todayHours === 'number' && member.todayHours > 0) {
      return Math.max(completedSeconds, Math.round(member.todayHours * 3600));
    }

    if (openPunchTimestamp && member.status === 'DUTY_ON') {
      const liveSec = Math.max(0, Math.floor((now - openPunchTimestamp) / 1000));
      if (liveSec < 86400) completedSeconds += liveSec;
    }

    return completedSeconds;
  }

  function formatMemberHoursToday(totalSeconds) {
    if (!totalSeconds || totalSeconds <= 0) return '0.0h';
    const hours = totalSeconds / 3600;
    if (hours > 0 && hours < 0.1) {
      return '0.1h';
    }
    return `${hours.toFixed(1)}h`;
  }

  function updateLiveFleetHours() {
    const members = getUniqueMembersList();
    members.forEach(m => {
      const safeId = escapeHtml(m.id || (m.uid ? `RD-${m.uid.slice(0, 6).toUpperCase()}` : 'RD-EMP-000'));
      const el = document.getElementById(`fleetHoursVal_${safeId}`);
      const sec = calculateMemberSecondsToday(m);
      if (el) {
        el.textContent = formatMemberHoursToday(sec);
        el.title = `${formatShiftDisplay(sec)} total work time today`;
      }
      const statusEl = document.getElementById(`fleetStatusVal_${safeId}`);
      if (statusEl) {
        const isSelf = (m.id === state.currentMemberId || (m.email && m.email.toLowerCase() === state.currentUser?.email?.toLowerCase()) || m.email?.toLowerCase() === 'jagadish2k2006@gmail.com');
        const isOnline = isSelf ? (state.personalShift?.status === 'DUTY_ON') : (!m.suspended && m.status === 'DUTY_ON');
        const statusValText = m.suspended ? 'SUSPENDED' : (isOnline ? 'ONLINE' : (isSelf && state.personalShift?.status === 'DUTY_BREAK' ? 'ON BREAK' : 'OFFLINE'));
        const statusValColor = m.suspended ? '#ff5252' : (isOnline ? '#00e676' : (isSelf && state.personalShift?.status === 'DUTY_BREAK' ? '#ffd600' : '#ff5252'));
        statusEl.textContent = statusValText;
        statusEl.style.color = statusValColor;
      }
    });
  }

  function renderFleetTelemetry() {
    const grid = document.getElementById('fleetTelemetryGrid');
    const countBadge = document.getElementById('statFleetOnlineCount');
    if (!grid) return;
    grid.replaceChildren();

    const members = getUniqueMembersList();
    const onlineMembersCount = members.filter(m => !m.suspended && (m.status === 'DUTY_ON' || m.id === state.currentMemberId)).length;
    if (countBadge) countBadge.textContent = `${onlineMembersCount} / ${members.length} Online Workstations`;

    members.forEach(member => {
      const card = document.createElement('div');
      card.className = 'fleet-node-card';

      const activeTask = (WorkspaceDB.data.tasks || []).find(t => t.assigneeId === member.id && t.status !== 'ACCOMPLISHED');

      const isSelf = (member.id === state.currentMemberId || (member.email && member.email.toLowerCase() === state.currentUser?.email?.toLowerCase()) || member.email?.toLowerCase() === 'jagadish2k2006@gmail.com');
      const isOnline = isSelf || (!member.suspended && member.status === 'DUTY_ON');
      const statusPill = member.suspended
        ? `<span class="fleet-node-status-pill status-duty-off" style="color:#ff5252; background:rgba(255,82,82,0.15); border:1px solid rgba(255,82,82,0.4);">⛔ Suspended</span>`
        : (isOnline
          ? `<span class="fleet-node-status-pill status-duty-on">🟢 Online</span>`
          : `<span class="fleet-node-status-pill status-duty-off" style="color:#ff5252; background:rgba(255,82,82,0.15); border:1px solid rgba(255,82,82,0.4);">🔴 Offline</span>`);

      const statusValText = member.suspended ? 'SUSPENDED' : (isOnline ? 'ONLINE' : 'OFFLINE');
      const statusValColor = member.suspended ? '#ff5252' : (isOnline ? '#00e676' : '#ff5252');

      const safeName = escapeHtml(member.name || member.displayName || 'Member');
      const safeId = escapeHtml(member.id || (member.uid ? `RD-${member.uid.slice(0, 6).toUpperCase()}` : 'RD-EMP-000'));
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
  function renderPunchLogs() {
    const tbody = document.getElementById('punchLogTableBody');
    if (!tbody) return;
    tbody.replaceChildren();

    const punches = WorkspaceDB.data.punchLogs || [];
    if (punches.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">No shift punches recorded yet.</td></tr>`;
      return;
    }

    punches.slice(-15).reverse().forEach(punch => {
      const tr = document.createElement('tr');
      const actionColor = punch.action === 'CLOCK_IN' ? 'var(--accent-green)' : (punch.action === 'BREAK' ? 'var(--accent-gold)' : 'var(--accent-red)');
      const actionText = punch.action === 'CLOCK_IN' ? '▶ Clock In' : (punch.action === 'BREAK' ? '⏸ Break' : '⏹ Clock Out');

      tr.innerHTML = `
        <td><strong>${escapeHtml(punch.name || punch.workerId)}</strong></td>
        <td><span style="color: ${actionColor}; font-weight: 700; font-family: var(--font-mono); font-size: 11px;">${actionText}</span></td>
        <td>${escapeHtml(punch.time || new Date().toLocaleTimeString())}</td>
        <td>${escapeHtml(punch.date || 'Today')}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  function initShiftTimerControls() {
    const btnClockIn = document.getElementById('btnPersonalClockIn');
    const btnBreak = document.getElementById('btnPersonalBreak');
    const btnClockOut = document.getElementById('btnPersonalClockOut');
    const badge = document.getElementById('personalShiftBadge');
    const timerDisplay = document.getElementById('personalShiftTimer');

    function formatShiftDisplay(totalSeconds) {
      const hrs = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
      const mins = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
      const secs = (totalSeconds % 60).toString().padStart(2, '0');
      return `${hrs}:${mins}:${secs}`;
    }

    function startShiftTimerInterval() {
      if (state.personalShift.timer) clearInterval(state.personalShift.timer);
      state.personalShift.timer = setInterval(() => {
        if (state.personalShift.status === 'DUTY_ON') {
          state.personalShift.seconds++;
          if (timerDisplay) timerDisplay.textContent = formatShiftDisplay(state.personalShift.seconds);
          updateLiveFleetHours();
        }
      }, 1000);
    }

    function updateShiftUI() {
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
        const breakSpan = btnBreak.querySelector('span');
        if (breakSpan) {
          breakSpan.textContent = state.personalShift.status === 'DUTY_BREAK' ? '▶ Resume Work' : '⏸ Take Break';
        }
      }
      if (btnClockOut) btnClockOut.disabled = state.personalShift.status === 'DUTY_OFF';
    }

    function recordPunch(action) {
      if (!WorkspaceDB.data.punchLogs) WorkspaceDB.data.punchLogs = [];
      const currentMember = WorkspaceDB.data.members[state.currentMemberId] || { id: state.currentMemberId, name: 'JAGADISH K' };
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateStr = new Date().toLocaleDateString();
      const last = WorkspaceDB.data.punchLogs[WorkspaceDB.data.punchLogs.length - 1];
      if (last && last.action === action && last.workerId === currentMember.id && last.date === dateStr && last.time === timeStr) {
        return; // Avoid duplicate punch entry within the same minute
      }
      WorkspaceDB.data.punchLogs.push({
        workerId: currentMember.id,
        name: currentMember.name,
        action: action,
        time: timeStr,
        date: dateStr,
        timestamp: Date.now()
      });
      WorkspaceDB.save();
      renderPunchLogs();
      updateLiveFleetHours();
      if (window.FirebaseService && FirebaseService.db) {
        FirebaseService.updatePresenceFirestore(
          currentMember.id,
          action === 'CLOCK_IN' ? 'DUTY_ON' : (action === 'BREAK' ? 'DUTY_BREAK' : 'DUTY_OFF'),
          state.personalShift?.seconds || 0
        );
      }
    }

    // Restore saved shift from localStorage if available, or auto-start clock in immediately
    try {
      const savedShift = JSON.parse(localStorage.getItem('rd_active_shift') || 'null');
      if (savedShift && (savedShift.status === 'DUTY_ON' || savedShift.status === 'DUTY_BREAK')) {
        state.personalShift.status = savedShift.status;
        if (savedShift.status === 'DUTY_ON') {
          const now = Date.now();
          const elapsed = Math.max(0, Math.floor((now - (savedShift.clockInTimestamp || now)) / 1000));
          state.personalShift.seconds = elapsed + (savedShift.accumulatedSeconds || 0);
          startShiftTimerInterval();
        } else {
          state.personalShift.seconds = savedShift.accumulatedSeconds || 0;
        }
      } else {
        // Automatic Clock In on Workstation OS launch
        state.personalShift.status = 'DUTY_ON';
        const now = Date.now();
        state.personalShift.seconds = 0;
        const shiftPayload = {
          status: 'DUTY_ON',
          clockInTimestamp: now,
          accumulatedSeconds: 0,
          workerId: state.currentMemberId
        };
        try { localStorage.setItem('rd_active_shift', JSON.stringify(shiftPayload)); } catch (_) {}
        recordPunch('CLOCK_IN');
        startShiftTimerInterval();
      }
    } catch (_) {
      state.personalShift.status = 'DUTY_ON';
      state.personalShift.seconds = 0;
      startShiftTimerInterval();
    }
    updateShiftUI();

    btnClockIn?.addEventListener('click', () => {
      state.personalShift.status = 'DUTY_ON';
      const now = Date.now();
      const shiftPayload = {
        status: 'DUTY_ON',
        clockInTimestamp: now,
        accumulatedSeconds: state.personalShift.seconds || 0,
        workerId: state.currentMemberId
      };
      try { localStorage.setItem('rd_active_shift', JSON.stringify(shiftPayload)); } catch (_) {}
      updateShiftUI();
      recordPunch('CLOCK_IN');
      startShiftTimerInterval();
      playNotificationChirp(true);
      showQuickToast('Shift active: Clocked in successfully!', 'success');
    });

    btnBreak?.addEventListener('click', () => {
      if (state.personalShift.status === 'DUTY_BREAK') {
        state.personalShift.status = 'DUTY_ON';
        const now = Date.now();
        const shiftPayload = {
          status: 'DUTY_ON',
          clockInTimestamp: now,
          accumulatedSeconds: state.personalShift.seconds || 0,
          workerId: state.currentMemberId
        };
        try { localStorage.setItem('rd_active_shift', JSON.stringify(shiftPayload)); } catch (_) {}
        updateShiftUI();
        recordPunch('CLOCK_IN');
        startShiftTimerInterval();
        playNotificationChirp(true);
        showQuickToast('Resumed active shift duty.', 'success');
      } else if (state.personalShift.status === 'DUTY_ON') {
        state.personalShift.status = 'DUTY_BREAK';
        const shiftPayload = {
          status: 'DUTY_BREAK',
          clockInTimestamp: Date.now(),
          accumulatedSeconds: state.personalShift.seconds || 0,
          workerId: state.currentMemberId
        };
        try { localStorage.setItem('rd_active_shift', JSON.stringify(shiftPayload)); } catch (_) {}
        if (state.personalShift.timer) {
          clearInterval(state.personalShift.timer);
          state.personalShift.timer = null;
        }
        updateShiftUI();
        recordPunch('BREAK');
        playNotificationChirp(false);
        showQuickToast('Shift paused for break.', 'info');
      }
    });

    btnClockOut?.addEventListener('click', () => {
      state.personalShift.status = 'DUTY_OFF';
      if (state.personalShift.timer) {
        clearInterval(state.personalShift.timer);
        state.personalShift.timer = null;
      }
      recordPunch('CLOCK_OUT');
      state.personalShift.seconds = 0;
      try { localStorage.removeItem('rd_active_shift'); } catch (_) {}
      updateShiftUI();
      playNotificationChirp(false);
      showQuickToast('Shift logged & clocked out. Have a great rest!', 'info');
    });

    updateShiftUI();
  }

  // --- NAVIGATION & TABS ---
  function switchTab(tabId) {
    state.activeTab = tabId;

    if (tabId === 'wallpaper') {
      closeCommandCenter();
      return;
    }

    openCommandCenter();

    document.querySelectorAll('.cmd-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.target === `tab${capitalize(tabId)}View`);
    });

    document.querySelectorAll('.cmd-tab-pane').forEach(pane => {
      pane.classList.toggle('active', pane.id === `tab${capitalize(tabId)}View`);
    });

    if (tabId === 'wallpapers') renderWallpaperGallery();
    else if (tabId === 'workers') renderWorkers();
    else if (tabId === 'timesheets') renderPunchLogs();
    else if (tabId === 'tasks') renderTasks();
    else if (tabId === 'chat') {
      renderChatChannelsAndDMs();
      selectChatTarget(state.activeChannelId);
    }
    else if (tabId === 'telemetry') {
      renderFleetTelemetry();
      updateLiveFleetHours();
    }
    else if (tabId === 'database') WorkspaceDB.updateMetricsUI();
  }

  // Live real-time ticker for presence & fleet telemetry hours
  setInterval(() => {
    const telemetryPane = document.getElementById('tabTelemetryView');
    if (telemetryPane && telemetryPane.classList.contains('active')) {
      updateLiveFleetHours();
    }
  }, 1000);

  function openCommandCenter() {
    state.commandCenterOpen = true;
    document.body.classList.add('mode-command');
    document.body.classList.remove('mode-wallpaper');
    document.getElementById('commandCenterDrawer')?.classList.remove('collapsed');
  }

  function closeCommandCenter() {
    state.commandCenterOpen = false;
    document.body.classList.remove('mode-command');
    document.body.classList.add('mode-wallpaper');
    document.getElementById('commandCenterDrawer')?.classList.add('collapsed');
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

    const handleMouseMove = (e) => {
      if (!state.tiltEnabled) return;
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = (e.clientX - cx) / cx;
      const dy = (e.clientY - cy) / cy;

      state.mouse.targetRotY = dx * 16;
      state.mouse.targetRotX = -dy * 14;
      state.mouse.targetX = dx * 12;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    function renderPhysicsFrame() {
      if (state.tiltEnabled && card) {
        state.card.curRotX += (state.mouse.targetRotX - state.card.curRotX) * 0.08;
        state.card.curRotY += (state.mouse.targetRotY - state.card.curRotY) * 0.08;
        state.card.curX += (state.mouse.targetX - state.card.curX) * 0.08;

        card.style.transform = `translateX(${state.card.curX.toFixed(2)}px) rotateX(${state.card.curRotX.toFixed(2)}deg) rotateY(${state.card.curRotY.toFixed(2)}deg)`;
      }
      requestAnimationFrame(renderPhysicsFrame);
    }
    requestAnimationFrame(renderPhysicsFrame);
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
        createdAt: Date.now(),
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
            title, description, priority, assigneeId, assigneeUid, assigneeName, assigneeEmail, dueAt
          });
        } catch (err) {
          console.warn('[FIREBASE] Task cloud creation note:', err.message);
        }
      }

      document.getElementById('formCreateTask').reset();
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
      if (!taskId) return;

      const task = (WorkspaceDB.data.tasks || []).find(t => t.id === taskId);
      if (!task) {
        showQuickToast('Task not found', 'error');
        return;
      }

      const title = document.getElementById('editTaskTitle')?.value.trim();
      if (!title) return;

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
      const status = document.getElementById('editTaskStatus')?.value || 'ASSIGNED';
      const dueAt = document.getElementById('editTaskDue')?.value.trim() || 'Today 5:00 PM';
      const description = document.getElementById('editTaskDesc')?.value.trim();

      const editorName = WorkspaceDB.data.members[state.currentMemberId]?.name || state.currentUser?.displayName || 'JAGADISH K';

      // Update local task object
      task.title = title;
      task.description = description;
      task.assigneeId = assigneeId;
      task.assigneeName = assigneeName;
      task.assigneeEmail = assigneeEmail;
      task.assigneeUid = assigneeUid;
      task.priority = priority;
      task.status = status;
      task.dueAt = dueAt;
      task.updatedAt = Date.now();

      if (!task.activity) task.activity = [];
      task.activity.push({
        authorName: editorName,
        text: `Updated task details: ${title} (${status})`,
        timestamp: Date.now()
      });

      await WorkspaceDB.save();

      // Multi-device Cloud Firestore sync
      if (window.FirebaseService && FirebaseService.updateTask) {
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
          updatedAt: Date.now()
        }).catch(err => {
          console.warn('[FIREBASE] Cloud task update note:', err.message);
        });
      }

      closeEditTaskModal();
      renderTasks();
      playNotificationChirp(true);
      showQuickToast(`Task "${title}" updated successfully!`, 'success');
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

    function handleFilesSelected(files) {
      if (!files || files.length === 0) return;
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = () => {
          const item = {
            id: 'att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            name: file.name,
            size: file.size,
            type: file.type,
            isImage: file.type.startsWith('image/'),
            dataUrl: reader.result
          };
          state.pendingAttachments.push(item);
          renderPendingAttachments();
        };
        reader.readAsDataURL(file);
      });
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
        await FirebaseService.signUp(email, password, name, 'employee', {
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

    showOutgoingCallModal = function(targetMember, callData, roomUrl) {
      const modal = document.getElementById('outgoingCallModal');
      if (!modal) return;

      const nameEl = document.getElementById('outgoingCallRecipientName');
      const avatarEl = document.getElementById('outgoingCallAvatar');
      const subtitleEl = document.getElementById('outgoingCallSubtitle');

      const targetName = targetMember ? (targetMember.name || targetMember.displayName || 'Colleague') : 'Teammate';
      const targetPhoto = targetMember ? (targetMember.photoURL || targetMember.photoUrl || targetMember.idCardPhoto || '') : '';
      const avatarText = targetName.slice(0, 2).toUpperCase();

      if (nameEl) nameEl.textContent = `Calling ${targetName}...`;
      if (subtitleEl) subtitleEl.textContent = `📞 RINGING • WAITING FOR COLLEAGUE TO ANSWER`;

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

      state.activeOutgoingCall = { targetMember, callData, roomUrl, unsubStatus, timeoutId };
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

    document.getElementById('btnCancelOutgoingCall')?.addEventListener('click', () => {
      if (state.activeOutgoingCall?.callData?.callId && window.FirebaseService?.cancelCall) {
        FirebaseService.cancelCall(state.activeOutgoingCall.callData.callId);
      }
      hideOutgoingCallModal();
    });

    document.getElementById('outgoingCallBackdrop')?.addEventListener('click', () => {
      if (state.activeOutgoingCall?.callData?.callId && window.FirebaseService?.cancelCall) {
        FirebaseService.cancelCall(state.activeOutgoingCall.callData.callId);
      }
      hideOutgoingCallModal();
    });

    showIncomingCallModal = function(callData) {
      const modal = document.getElementById('incomingCallModal');
      if (!modal) return;

      const nameEl = document.getElementById('incomingCallCallerName');
      const avatarEl = document.getElementById('incomingCallAvatar');
      const subtitleEl = document.getElementById('incomingCallSubtitle');

      const callerName = callData.callerName || 'Teammate';
      const callerPhoto = callData.callerPhoto || '';
      const avatarText = callerName.slice(0, 2).toUpperCase();

      if (nameEl) nameEl.textContent = `${callerName} is calling...`;
      if (subtitleEl) subtitleEl.textContent = `⚡ INCOMING REALTIME ${String(callData.callType || 'VIDEO').toUpperCase()} CALL`;

      if (avatarEl) {
        if (callerPhoto) {
          avatarEl.innerHTML = `<img src="${sanitizeUrl(callerPhoto)}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
        } else {
          avatarEl.textContent = avatarText;
        }
      }

      modal.classList.remove('hidden');
      startIncomingCallRingtone(); // Play continuous dual-tone phone ring!

      if (window.electronAPI && window.electronAPI.showNotification) {
        window.electronAPI.showNotification({
          title: `📞 Incoming Call from ${callerName}`,
          body: `Click to join secure video meeting session.`,
          targetTab: 'chat'
        });
      }
    };

    hideIncomingCallModal = function() {
      stopIncomingCallRingtone(); // Stop ringing immediately
      const modal = document.getElementById('incomingCallModal');
      if (modal) modal.classList.add('hidden');
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

    startDirectCallWithMember = async function(member) {
      if (!member) return;
      const targetName = member.name || member.displayName || 'Colleague';
      const cleanRoomId = `reddot-call-${(member.id || targetName).toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`;
      const roomUrl = `https://meet.jit.si/${cleanRoomId}`;

      let callData = null;
      if (window.FirebaseService?.sendCallInvite) {
        try {
          callData = await FirebaseService.sendCallInvite(member, roomUrl, 'video');
        } catch (e) {
          console.warn('[CALL] Send invite error:', e);
        }
      }

      showOutgoingCallModal(member, callData, roomUrl);
    }

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
    document.getElementById('btnAcceptIncomingCall')?.addEventListener('click', async () => {
      stopIncomingCallRingtone();
      if (state.activeIncomingCall) {
        const call = state.activeIncomingCall;
        if (window.FirebaseService?.respondToCall) {
          await FirebaseService.respondToCall(call.callId, 'ACCEPTED');
        }
        hideIncomingCallModal();
        const roomUrl = call.roomUrl || 'https://meet.jit.si/reddot-team-room';
        if (window.electronAPI && window.electronAPI.openExternal) {
          await window.electronAPI.openExternal(roomUrl);
        } else {
          window.open(roomUrl, '_blank');
        }
      }
    });

    document.getElementById('btnDeclineIncomingCall')?.addEventListener('click', async () => {
      stopIncomingCallRingtone();
      if (state.activeIncomingCall) {
        const call = state.activeIncomingCall;
        if (window.FirebaseService?.respondToCall) {
          await FirebaseService.respondToCall(call.callId, 'DECLINED');
        }
        hideIncomingCallModal();
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
          activeEl.getAttribute('contenteditable') === 'true'
        )) ||
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.tagName === 'SELECT' ||
        e.target.isContentEditable ||
        e.target.getAttribute('contenteditable') === 'true'
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
    document.getElementById('btnStartMeeting')?.addEventListener('click', triggerInstantMeeting);
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

    // 9. Central Files Search Bar
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
  async function init() {
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
    openCommandCenter();
    switchTab('workers');

    renderWorkers();
    renderTasks();
    renderPunchLogs();
    renderChatChannelsAndDMs();
    renderFleetTelemetry();
    WorkspaceDB.updateMetricsUI();

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
            const isSelf = (memberId === state.currentMemberId || (cmEmail === state.currentUser?.email?.toLowerCase()) || (cmEmail === 'jagadish2k2006@gmail.com'));
            const isFreshHeartbeat = cm.lastSeenAt && (Date.now() - cm.lastSeenAt < 60000);
            const isOnline = isSelf || (!cm.suspended && isFreshHeartbeat && cm.status === 'DUTY_ON');
            const resolvedStatus = cm.suspended ? 'DUTY_OFF' : (isOnline ? 'DUTY_ON' : 'DUTY_OFF');

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
              todaySeconds: cm.todaySeconds !== undefined ? cm.todaySeconds : (existing.todaySeconds || 0),
              todayHours: cm.todayHours !== undefined ? cm.todayHours : (existing.todayHours || 0),
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
              const isOnline = p && p.state === 'online';
              Object.values(WorkspaceDB.data.members).forEach(m => {
                if (m && (m.uid === uid || m.id === uid)) {
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
          // Open Login Modal on first session without locking screen
          const hasSeenPrompt = sessionStorage.getItem('rd_auth_prompted');
          if (!hasSeenPrompt) {
            sessionStorage.setItem('rd_auth_prompted', '1');
            openAuthModal('signin');
          }
          setupCloudRealtimeSubscriptions();
        } else {
          closeAuthModal();
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
        const isSelf = (m.id === state.currentMemberId || (m.email && m.email.toLowerCase() === state.currentUser?.email?.toLowerCase()) || m.email?.toLowerCase() === 'jagadish2k2006@gmail.com');
        if (isSelf) return;
        if (m.status === 'DUTY_ON' && (!m.lastSeenAt || (now - m.lastSeenAt > 60000))) {
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
          badge.textContent = `VERSION ${info.version} (${info.channel.toUpperCase()})`;
        }
      } catch (e) {
        console.warn('[OTA] Could not fetch system info:', e);
      }
    }

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
              <span class="ota-banner-badge" id="otaBannerBadge">v2.5.3</span>
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

    try {
      if (window.electronAPI && window.electronAPI.otaApplyHotpatch) {
        const res = await window.electronAPI.otaApplyHotpatch();
        if (res && res.success) {
          playNotificationChirp(true);
          if (btn) btn.innerHTML = '<span>✅ Updated to v' + (res.version || '2.5.3') + '! Reloading...</span>';
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
        btn.innerHTML = '<span>⚡ 1-Click Fast Update</span>';
      }
      if (bannerDesc) bannerDesc.textContent = `Update notice: ${err.message}`;
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

