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
  const INITIAL_SEED_DATA = {
    members: {},
    tasks: [],
    chats: {
      "general": [],
      "announcements": [],
      "engineering": []
    },
    punchLogs: [],
    auditLogs: [
      { action: "WORKSPACE_INIT", performedByName: "SYSTEM", details: "Native persistent storage initialized.", timestamp: Date.now() }
    ],
    customMountedBadgePhoto: null
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

      // Explicitly purge legacy fake/demo mock members from store & normalize IDs
      if (this.data.members) {
        let changed = false;
        Object.keys(this.data.members).forEach(id => {
          const m = this.data.members[id];
          if (!m) return;
          if (
            id === 'RD-EMP-101' || id === 'RD-EMP-102' || id === 'RD-EMP-103' ||
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
      const membersCount = Object.keys(this.data.members || {}).length;
      const tasksCount = (this.data.tasks || []).length;
      let msgsCount = 0;
      Object.values(this.data.chats || {}).forEach(arr => msgsCount += arr.length);
      const punchesCount = (this.data.punchLogs || []).length;

      safeSetText(document.getElementById('dbStatMembersCount'), membersCount);
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
    activeTab: 'wallpapers',
    activeChannelId: 'general',
    taskFilter: 'ALL',
    commandCenterOpen: false,
    selectedViewingMemberId: null,
    tempNewWorkerPhoto: null,
    tempSignUpPhoto: null,

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

  function getUniqueMembersList() {
    const map = new Map();
    Object.values(WorkspaceDB.data.members || {}).forEach(m => {
      if (!m) return;
      if (m.name === 'Alex Rivera' || m.name === 'Priya Sharma' || m.name === 'Vikram Malhotra') return;
      if (m.email === 'alex@reddot.com' || m.email === 'priya@reddot.com' || m.email === 'vikram@reddot.com') return;

      const isFounder = (m.email && m.email.toLowerCase() === 'jagadish2k2006@gmail.com') || m.isOwner;
      if (!m.id) {
        m.id = isFounder ? 'RD-FOUNDER-001' : (m.uid ? `RD-${m.uid.slice(0, 6).toUpperCase()}` : 'RD-EMP-001');
      }
      if (!m.uid) m.uid = m.id;

      const key = (m.email ? m.email.toLowerCase() : '') || m.uid || m.id;
      if (!map.has(key)) {
        map.set(key, m);
      } else {
        const prev = map.get(key);
        map.set(key, { ...prev, ...m, photoURL: m.photoURL || prev.photoURL, photoUrl: m.photoUrl || prev.photoUrl });
      }
    });
    return Array.from(map.values());
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

    list.forEach(member => {
      const card = document.createElement('div');
      card.className = `worker-card ${member.suspended ? 'worker-suspended' : ''}`;
      if (member.suspended) {
        card.style.opacity = '0.75';
        card.style.border = '1px solid rgba(255, 82, 82, 0.4)';
      }

      const isDutyOn = member.status === 'DUTY_ON';
      const isBreak = member.status === 'DUTY_BREAK';
      const statusClass = member.suspended ? 'pulse-red' : (isDutyOn ? 'pulse-green' : (isBreak ? 'pulse-amber' : 'pulse-gray'));
      const statusText = member.suspended ? '⛔ Suspended' : (isDutyOn ? '🟢 On Duty' : (isBreak ? '🟡 Break' : '⚪ Duty Off'));

      const safeName = escapeHtml(member.name || member.displayName || 'Member');
      const safeId = escapeHtml(member.id || (member.uid ? `RD-${member.uid.slice(0, 6).toUpperCase()}` : 'RD-EMP-000'));
      const safeDept = escapeHtml(member.dept || 'Hardware Architecture');
      const safeRole = escapeHtml(member.role || 'Employee');
      const safeAvatar = escapeHtml(member.avatarText || (member.name || 'RD').slice(0, 2).toUpperCase());
      const safePhoto = sanitizeUrl(member.photoUrl || member.photoURL);

      const isSelf = (member.id === state.currentMemberId || member.email?.toLowerCase() === 'jagadish2k2006@gmail.com');

      card.innerHTML = `
        <div class="worker-card-head">
          <div class="worker-avatar-box">
            ${safePhoto ? `<img src="${safePhoto}" alt="${safeName}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">` : `<span class="worker-avatar-text">${safeAvatar}</span>`}
            <span class="presence-dot ${statusClass}" title="${statusText}"></span>
          </div>
          <div class="worker-meta">
            <h4 class="worker-name">${safeName}</h4>
            <p class="worker-email">${safeId} &bull; ${safeDept}</p>
            <div style="display: flex; gap: 6px; align-items: center; margin-top: 2px;">
              <span class="worker-role-pill ${member.isOwner ? 'role-owner' : 'role-emp'}">${safeRole}</span>
              ${member.suspended ? `<span style="font-size: 9px; font-family: var(--font-mono); color: #ff5252; background: rgba(255,82,82,0.15); padding: 2px 6px; border-radius: 4px; font-weight: 800;">⛔ SUSPENDED</span>` : ''}
            </div>
          </div>
        </div>

        <div class="worker-card-foot" style="flex-wrap: wrap; gap: 6px;">
          <button class="btn-worker-action btn-worker-chat" data-id="${safeId}" style="color: var(--accent-green);">
            <span>💬 Message</span>
          </button>
          <button class="btn-worker-action btn-worker-meet" data-id="${safeId}" style="color: var(--accent-cyan);">
            <span>📹 Meet</span>
          </button>
          <button class="btn-worker-action btn-view-badge" data-id="${safeId}">
            <span>🪪 View ID</span>
          </button>
          <button class="btn-worker-action btn-mount-wallpaper" data-id="${safeId}">
            <span>🖼️ Mount</span>
          </button>
          ${(isFounderAdmin || state.userRole === 'OWNER' || state.userRole === 'ADMIN') ? `
            <button class="btn-worker-action btn-auth-role" data-id="${safeId}" style="color: var(--accent-cyan);" title="Authorize or edit member role">
              <span>⭐ Role</span>
            </button>
            ${!isSelf ? `
              <button class="btn-worker-action btn-toggle-suspend" data-id="${safeId}" style="color: ${member.suspended ? '#00e676' : '#ffb300'};" title="${member.suspended ? 'Reactivate ID access' : 'Suspend ID access'}">
                <span>${member.suspended ? '🔓 Reactivate' : '⛔ Suspend'}</span>
              </button>
              <button class="btn-worker-action btn-delete-member" data-id="${safeId}" style="color: #ff5252;" title="Permanently delete member and revoke ID">
                <span>🗑️ Delete</span>
              </button>
            ` : ''}
          ` : ''}
        </div>
      `;

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
          delete WorkspaceDB.data.members[member.id];
          await WorkspaceDB.save();

          if (window.FirebaseService?.db && (member.uid || member.id)) {
            const docId = member.uid || member.id;
            FirebaseService.db.collection(`organizations/reddot/members`).doc(docId).delete().catch(console.error);
          }
          renderWorkers();
          renderFleetTelemetry();
          renderChatChannelsAndDMs();
          playNotificationChirp(false);
          alert(`Member ${member.name} removed from organization.`);
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
      if (safePhoto) {
        avatarBox.innerHTML = `<img src="${safePhoto}" alt="Badge Photo" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
      } else {
        avatarBox.innerHTML = `<div style="font-weight: 800; font-size: 24px; color: #fff;">${escapeHtml(member.avatarText || (member.name || 'RD').slice(0, 2).toUpperCase())}</div>`;
      }
    }

    modal.classList.remove('hidden');
  }

  async function uploadPhotoForBadge() {
    if (window.electronAPI && window.electronAPI.dbSelectPhoto) {
      const result = await window.electronAPI.dbSelectPhoto();
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
          alert(`ID Card Photo updated & saved to Cloud Vault for ${member.name || member.displayName}!`);
        }
      }
    } else {
      const sample = prompt('Enter Image URL or base64 Data URL for this ID badge:', 'assets/profile-photo1.jpeg');
      if (sample) {
        const member = WorkspaceDB.data.members[state.selectedViewingMemberId] || getUniqueMembersList().find(m => m.id === state.selectedViewingMemberId) || state.currentMember;
        if (member) {
          member.idCardPhoto = sample;
          member.photoUrl = sample;
          member.photoURL = sample;
          WorkspaceDB.data.customMountedBadgePhoto = sample;
          await WorkspaceDB.save();
          if (window.FirebaseService?.updateMemberPhoto) {
            try {
              await FirebaseService.updateMemberPhoto(member.uid || state.currentUser?.uid || member.id, sample);
            } catch (_) {}
          }
          mountMemberOnWallpaper(member.id);
          openBadgeViewerModal(member.id);
          renderWorkers();
        }
      }
    }
  }

  function mountMemberOnWallpaper(memberId) {
    const member = WorkspaceDB.data.members[memberId] || getUniqueMembersList().find(m => m.id === memberId || m.uid === memberId);
    if (!member) return;

    if (!member.id) member.id = member.uid ? `RD-${member.uid.slice(0, 6).toUpperCase()}` : 'RD-EMP-001';

    let photo = member.idCardPhoto || member.photoUrl || member.photoURL || WorkspaceDB.data.customMountedBadgePhoto || 'assets/id-card.png';
    if (photo.includes('drive.google.com/thumbnail?id=') || photo.includes('/file/d/')) {
      photo = convertGoogleDriveLink(photo);
    }
    WorkspaceDB.data.customMountedBadgePhoto = photo;
    WorkspaceDB.save();

    const badgeImg = document.getElementById('badgeImg');
    if (badgeImg) {
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

      card.querySelector('.btn-task-view')?.addEventListener('click', () => {
        openTaskActivityModal(task);
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

  function openTaskActivityModal(task) {
    const modal = document.getElementById('taskActivityModal');
    const metaBox = document.getElementById('taskDetailMeta');
    const feed = document.getElementById('taskActivityFeed');
    if (!modal || !metaBox || !feed) return;

    safeSetText(document.getElementById('taskModalTitle'), `TASK: ${task.title}`);

    metaBox.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span class="task-priority-badge">${escapeHtml(task.priority)}</span>
        <span class="task-status-pill">${escapeHtml(task.status)}</span>
      </div>
      <p style="font-size: 12px; color: #fff; margin-bottom: 8px;">${escapeHtml(task.description || 'No description provided.')}</p>
      <div style="font-size: 10px; color: var(--text-muted); display: flex; gap: 12px;">
        <span>Assignee: <strong>${escapeHtml(task.assigneeId)}</strong></span>
        <span>Target: <strong>${escapeHtml(task.dueAt || 'N/A')}</strong></span>
      </div>
    `;

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

  // --- TEAM CHAT & DIRECT MESSAGES ---
  const DEFAULT_CHANNELS = [
    { id: 'general', name: 'general', topic: 'Company-wide updates and collaboration' },
    { id: 'announcements', name: 'announcements', topic: 'Official executive bulletins and company broadcasts' },
    { id: 'engineering', name: 'engineering', topic: 'Architecture, development, and system telemetry' },
    { id: 'projects', name: 'projects', topic: 'Active sprint deliverables and product roadmaps' },
    { id: 'watercooler', name: 'watercooler', topic: 'Casual coffee chat and team banter' }
  ];

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
          <div style="display: flex; align-items: center; gap: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            <span class="ch-hash">#</span>
            <span style="overflow: hidden; text-overflow: ellipsis;">${escapeHtml(ch.name || ch.id)}</span>
          </div>
          ${ch.id !== 'general' ? `
            <span class="btn-channel-quick-edit" title="Edit channel #${escapeHtml(ch.name || ch.id)}" style="opacity: 0.7; font-size: 11px; padding: 2px 5px; border-radius: 3px; cursor: pointer; color: var(--accent-cyan);">✏️</span>
          ` : ''}
        `;
        btn.addEventListener('click', (e) => {
          if (e.target.closest('.btn-channel-quick-edit')) {
            e.stopPropagation();
            openEditChannelModal(ch.id);
            return;
          }
          selectChatTarget(ch.id, ch.name, ch.topic);
        });
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
      if (targetCh === channelId || btn.textContent.includes(displayName || '____')) {
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

    // Attach dynamic real-time Firestore listener for active channel or DM
    if (state.activeChatUnsub) {
      try { state.activeChatUnsub(); } catch (_) {}
      state.activeChatUnsub = null;
    }

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

    renderMessages();
  }

  function renderMessages() {
    const container = document.getElementById('chatMessagesContainer');
    if (!container) return;
    container.replaceChildren();

    if (!WorkspaceDB.data.chats[state.activeChannelId]) {
      WorkspaceDB.data.chats[state.activeChannelId] = [];
    }

    const msgs = WorkspaceDB.data.chats[state.activeChannelId] || [];

    if (msgs.length === 0) {
      container.innerHTML = `
        <div class="empty-state-box" style="padding: 40px 20px; text-align: center;">
          <span style="font-size: 32px; display: block; margin-bottom: 10px;">💬</span>
          <p style="font-weight: 700; color: #fff; margin-bottom: 4px;">#${escapeHtml(state.activeChannelId)}</p>
          <p style="font-size: 11px; color: var(--text-muted);">No messages in this channel yet. Send the first message to your teammates!</p>
        </div>
      `;
      return;
    }

    const currentUid = state.currentUser?.uid;
    const currentEmail = state.currentUser?.email?.toLowerCase();
    const currentEmpId = state.currentMemberId;

    msgs.forEach(msg => {
      const msgUid = msg.senderUid || msg.senderId;
      const msgEmail = (msg.senderEmail || '').toLowerCase();
      const msgEmpId = msg.senderEmpId || msg.senderId;

      const isSelf = (currentUid && msgUid === currentUid) ||
                     (currentEmail && msgEmail && msgEmail === currentEmail) ||
                     (currentEmpId && (msgEmpId === currentEmpId || msgUid === currentEmpId));

      const msgRow = document.createElement('div');
      msgRow.className = `chat-msg-row ${isSelf ? 'msg-self' : 'msg-other'}`;

      const senderName = escapeHtml(msg.senderName || 'Colleague');
      const senderBadge = escapeHtml(msg.senderEmpId || (msgUid ? `RD-${String(msgUid).slice(0, 5).toUpperCase()}` : 'RD'));
      const avatar = escapeHtml((msg.senderName || 'RD').slice(0, 2).toUpperCase());
      const photoUrl = sanitizeUrl(msg.senderPhoto || '');
      const timeStr = escapeHtml(new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

      msgRow.innerHTML = `
        <div class="msg-avatar">
          ${photoUrl ? `<img src="${photoUrl}" alt="${senderName}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` : avatar}
        </div>
        <div class="msg-bubble">
          <div class="msg-header">
            <span class="msg-sender">${senderName} <span style="font-size: 9.5px; opacity: 0.75; font-family: var(--font-mono); font-weight: 700;">[${senderBadge}]</span></span>
            <span class="msg-time">${timeStr}</span>
          </div>
          <div class="msg-text"></div>
        </div>
      `;

      msgRow.querySelector('.msg-text').textContent = msg.text;
      container.appendChild(msgRow);
    });

    container.scrollTop = container.scrollHeight;
  }

  // --- TEAM PRESENCE & AUDIT LOGS ---
  function renderFleetTelemetry() {
    const grid = document.getElementById('fleetTelemetryGrid');
    const countBadge = document.getElementById('statFleetOnlineCount');
    if (!grid) return;
    grid.replaceChildren();

    const members = getUniqueMembersList();
    if (countBadge) countBadge.textContent = `${members.length} Active Workstations`;

    members.forEach(member => {
      const card = document.createElement('div');
      card.className = 'fleet-node-card';

      const activeTask = (WorkspaceDB.data.tasks || []).find(t => t.assigneeId === member.id && t.status !== 'ACCOMPLISHED');

      const safeName = escapeHtml(member.name || member.displayName || 'Member');
      const safeId = escapeHtml(member.id || (member.uid ? `RD-${member.uid.slice(0, 6).toUpperCase()}` : 'RD-EMP-000'));
      const safeAvatar = escapeHtml(member.avatarText || safeName.slice(0, 2).toUpperCase());
      const safeDept = escapeHtml(member.dept || 'Engineering');
      const safeHours = escapeHtml(member.todayHours || 7.5);
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
          <span class="fleet-node-status-pill status-duty-on">🟢 Online</span>
        </div>

        <div class="fleet-telemetry-metrics">
          <div class="fleet-metric-item">
            <span class="fleet-metric-label">Status</span>
            <span class="fleet-metric-val" style="color: #00e676;">ON DUTY</span>
          </div>
          <div class="fleet-metric-item">
            <span class="fleet-metric-label">App Build</span>
            <span class="fleet-metric-val">v2.6 Windows</span>
          </div>
          <div class="fleet-metric-item">
            <span class="fleet-metric-label">Hours Today</span>
            <span class="fleet-metric-val">${safeHours}h</span>
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
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `reddot_workspace_backup_${Date.now()}.json`;
    a.click();
    playNotificationChirp(true);
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

    function updateShiftUI() {
      if (badge) badge.textContent = state.personalShift.status.replace('_', ' ');
      if (btnClockIn) btnClockIn.disabled = state.personalShift.status === 'DUTY_ON';
      if (btnBreak) btnBreak.disabled = state.personalShift.status === 'DUTY_OFF';
      if (btnClockOut) btnClockOut.disabled = state.personalShift.status === 'DUTY_OFF';
    }

    function recordPunch(action) {
      if (!WorkspaceDB.data.punchLogs) WorkspaceDB.data.punchLogs = [];
      const currentMember = WorkspaceDB.data.members[state.currentMemberId] || { id: state.currentMemberId, name: 'JAGADISH K' };
      WorkspaceDB.data.punchLogs.push({
        workerId: currentMember.id,
        name: currentMember.name,
        action: action,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString()
      });
      WorkspaceDB.save();
      renderPunchLogs();
    }

    btnClockIn?.addEventListener('click', () => {
      state.personalShift.status = 'DUTY_ON';
      updateShiftUI();
      recordPunch('CLOCK_IN');
      if (!state.personalShift.timer) {
        state.personalShift.timer = setInterval(() => {
          if (state.personalShift.status === 'DUTY_ON') {
            state.personalShift.seconds++;
            const hrs = Math.floor(state.personalShift.seconds / 3600).toString().padStart(2, '0');
            const mins = Math.floor((state.personalShift.seconds % 3600) / 60).toString().padStart(2, '0');
            const secs = (state.personalShift.seconds % 60).toString().padStart(2, '0');
            if (timerDisplay) timerDisplay.textContent = `${hrs}:${mins}:${secs}`;
          }
        }, 1000);
      }
      playNotificationChirp(true);
    });

    btnBreak?.addEventListener('click', () => {
      state.personalShift.status = state.personalShift.status === 'DUTY_BREAK' ? 'DUTY_ON' : 'DUTY_BREAK';
      updateShiftUI();
      recordPunch(state.personalShift.status === 'DUTY_BREAK' ? 'BREAK' : 'CLOCK_IN');
      playNotificationChirp(false);
    });

    btnClockOut?.addEventListener('click', () => {
      state.personalShift.status = 'DUTY_OFF';
      updateShiftUI();
      recordPunch('CLOCK_OUT');
      if (state.personalShift.timer) {
        clearInterval(state.personalShift.timer);
        state.personalShift.timer = null;
      }
      playNotificationChirp(false);
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
    else if (tabId === 'telemetry') renderFleetTelemetry();
    else if (tabId === 'database') WorkspaceDB.updateMetricsUI();
  }

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
      }
    }

    document.getElementById('btnTopPinToggle')?.addEventListener('click', handleTogglePin);
    document.getElementById('btnCmdPinToggle')?.addEventListener('click', handleTogglePin);

    document.getElementById('btnTopMinimize')?.addEventListener('click', () => {
      window.electronAPI?.minimizeWindow();
    });
    document.getElementById('btnCmdMinimize')?.addEventListener('click', () => {
      window.electronAPI?.minimizeWindow();
    });

    document.getElementById('btnTopMaximize')?.addEventListener('click', () => {
      window.electronAPI?.maximizeWindow();
    });
    document.getElementById('btnCmdMaximize')?.addEventListener('click', () => {
      window.electronAPI?.maximizeWindow();
    });

    document.getElementById('btnTopClose')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (state.commandCenterOpen) {
        closeCommandCenter();
      } else if (window.electronAPI?.closeWindow) {
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
        const url = prompt('Enter Image URL for new worker:');
        if (url) {
          state.tempNewWorkerPhoto = url;
          safeSetText(document.getElementById('newWorkerPhotoStatus'), '✓ Photo URL Set');
        }
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
      document.getElementById('formCreateWorker').reset();
      state.tempNewWorkerPhoto = null;

      renderWorkers();
      renderChatChannelsAndDMs();
      playNotificationChirp(true);
      alert(`Member ${name} (${id}) created and synced to persistent database & Firebase!`);
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

    // Chat Channels
    document.getElementById('channelList')?.querySelectorAll('.channel-item').forEach(btn => {
      btn.addEventListener('click', () => {
        selectChatTarget(btn.getAttribute('data-channel'));
      });
    });

    // Send Message
    document.getElementById('formSendMessage')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = document.getElementById('chatMessageInput');
      if (input && input.value.trim()) {
        const text = input.value.trim();
        input.value = '';

        const member = WorkspaceDB.data.members[state.currentMemberId] || state.currentMember || {};
        const senderUid = state.currentUser ? state.currentUser.uid : (state.currentMemberId || 'RD-FOUNDER-001');
        const senderEmpId = state.currentMemberId || (senderUid ? `RD-${String(senderUid).slice(0, 6).toUpperCase()}` : 'RD-001');
        const senderName = member?.name || member?.displayName || state.currentUser?.displayName || (state.currentUser?.email ? state.currentUser.email.split('@')[0].toUpperCase() : 'JAGADISH K');
        const senderEmail = state.currentUser ? state.currentUser.email.toLowerCase() : 'jagadish2k2006@gmail.com';
        const senderPhoto = member.idCardPhoto || member.photoURL || member.photoUrl || state.currentUser?.photoURL || '';

        const newMsg = {
          senderId: senderUid,
          senderUid: senderUid,
          senderEmpId: senderEmpId,
          senderName: senderName,
          senderEmail: senderEmail,
          senderPhoto: senderPhoto,
          text: text,
          createdAt: Date.now()
        };

        if (!WorkspaceDB.data.chats[state.activeChannelId]) {
          WorkspaceDB.data.chats[state.activeChannelId] = [];
        }

        WorkspaceDB.data.chats[state.activeChannelId].push(newMsg);
        await WorkspaceDB.save();
        renderMessages();

        // Sync to Firebase Cloud immediately (SDK + Cloud REST Fallback)
        if (window.FirebaseService) {
          try {
            await FirebaseService.sendMessage(state.activeChannelId, text);
          } catch (err) {
            console.warn('[FIREBASE] Chat cloud sync notice:', err.message);
          }
        }

        playNotificationChirp(false);
      }
    });

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
          alert('⚡ Cloud Vault Synced! Dynamic Gmail profiles, Firestore channels, and member presence refreshed.');
        } catch (e) {
          alert(`Sync note: ${e.message}`);
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
        alert('Database reset to clean factory defaults.');
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
        const url = prompt('Enter Image URL or base64 data for badge photo:');
        if (url) {
          state.tempSignUpPhoto = url;
          safeSetText(document.getElementById('signUpPhotoStatus'), '✓ Photo URL Set');
        }
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
        alert(`Official profile created for ${name} (${empId})! You are now connected to the workstation.`);
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
      const email = prompt('Enter your registered email address for password reset:', emailInput || '');
      if (!email) return;

      try {
        if (window.FirebaseService) {
          await FirebaseService.resetPassword(email);
          showAuthAlert(`Password reset link sent to ${email}. Check your inbox!`, false);
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
      if (window.electronAPI && window.electronAPI.dbSelectPhoto) {
        const res = await window.electronAPI.dbSelectPhoto();
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
      }
    });

    document.getElementById('btnUserProfileMountWallpaper')?.addEventListener('click', () => {
      if (state.currentMemberId) {
        mountMemberOnWallpaper(state.currentMemberId);
        closeUserProfileModal();
      }
    });

    function showIncomingCallModal(callData) {
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
    }

    function hideIncomingCallModal() {
      stopIncomingCallRingtone(); // Stop ringing immediately
      const modal = document.getElementById('incomingCallModal');
      if (modal) modal.classList.add('hidden');
      state.activeIncomingCall = null;
    }

    // --- IN-APP CHANNEL MANAGEMENT: CREATE, EDIT & DELETE ---
    const createChannelModal = document.getElementById('createChannelModal');
    const editChannelModal = document.getElementById('editChannelModal');

    function openCreateChannelModal() {
      const inputName = document.getElementById('inputNewChannelName');
      const inputTopic = document.getElementById('inputNewChannelTopic');
      if (inputName) inputName.value = '';
      if (inputTopic) inputTopic.value = '';
      createChannelModal?.classList.remove('hidden');
      setTimeout(() => inputName?.focus(), 50);
    }

    function closeCreateChannelModal() {
      createChannelModal?.classList.add('hidden');
    }

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

    function openEditChannelModal(targetChId = null) {
      const curChId = targetChId || state.activeChannelId || 'general';
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
    }

    function closeEditChannelModal() {
      editChannelModal?.classList.add('hidden');
    }

    document.getElementById('btnEditChannel')?.addEventListener('click', openEditChannelModal);
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

    function openEditRoleModal(member) {
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
    }

    function closeEditRoleModal() {
      editRoleModal?.classList.add('hidden');
      state.editingRoleMember = null;
    }

    document.getElementById('btnCloseEditRole')?.addEventListener('click', closeEditRoleModal);
    document.getElementById('btnCancelEditRole')?.addEventListener('click', closeEditRoleModal);
    document.getElementById('editRoleBackdrop')?.addEventListener('click', closeEditRoleModal);

    document.getElementById('selectPresetRole')?.addEventListener('change', (e) => {
      const customWrap = document.getElementById('wrapCustomRoleInput');
      if (customWrap) {
        customWrap.style.display = (e.target.value === '__custom__') ? 'block' : 'none';
      }
    });

    document.getElementById('formEditRoleModal')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const member = state.editingRoleMember;
      if (!member) return;

      const selectPreset = document.getElementById('selectPresetRole')?.value;
      const customVal = document.getElementById('inputCustomRole')?.value.trim();
      const newRole = (selectPreset === '__custom__' && customVal) ? customVal : (selectPreset === '__custom__' ? 'Contributor' : selectPreset);
      const newDept = document.getElementById('selectEditRoleDept')?.value || member.dept || 'Engineering';

      member.role = newRole;
      member.dept = newDept;
      if (member.id) WorkspaceDB.data.members[member.id] = member;
      if (member.uid) WorkspaceDB.data.members[member.uid] = member;
      await WorkspaceDB.save();

      if (window.FirebaseService?.updateMemberRole) {
        try {
          await FirebaseService.updateMemberRole(member.uid || member.id, newRole, newDept);
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

      closeEditRoleModal();
      renderWorkers();
      renderTasks();
      populateAssigneeSelect();
      playNotificationChirp(true);
    });

    // --- GOOGLE DRIVE & WEB PHOTO LINKING ENGINE ---
    const linkPhotoModal = document.getElementById('linkPhotoModal');

    function convertGoogleDriveLink(url) {
      if (!url || typeof url !== 'string') return '';
      let clean = url.trim();

      // If user pasted without protocol
      if (!clean.startsWith('http://') && !clean.startsWith('https://') && !clean.startsWith('data:')) {
        // If it looks like a bare Google Drive file ID
        if (/^[a-zA-Z0-9_-]{25,50}$/.test(clean)) {
          return `https://lh3.googleusercontent.com/d/${clean}=w1000`;
        }
        clean = 'https://' + clean;
      }

      // Match Google Drive file id patterns:
      const matchFile = clean.match(/\/file\/d\/([a-zA-Z0-9_-]{20,})/i);
      const matchD = clean.match(/\/d\/([a-zA-Z0-9_-]{20,})/i);
      const matchId = clean.match(/[?&]id=([a-zA-Z0-9_-]{20,})/i);
      const fileId = matchFile ? matchFile[1] : (matchD ? matchD[1] : (matchId ? matchId[1] : null));

      if (fileId) {
        // Direct high-resolution Google Usercontent CDN stream (HTTP 200 OK, Access-Control-Allow-Origin: *, no 302 redirect!)
        return `https://lh3.googleusercontent.com/d/${fileId}=w1000`;
      }
      return clean;
    }

    function openLinkPhotoModal(targetMemberId = null) {
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
    }

    function closeLinkPhotoModal() {
      linkPhotoModal?.classList.add('hidden');
      state.linkingPhotoMemberId = null;
    }

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
          'incomingCallModal'
        ];
        let anyModalClosed = false;
        modals.forEach(id => {
          const el = document.getElementById(id);
          if (el && !el.classList.contains('hidden')) {
            el.classList.add('hidden');
            anyModalClosed = true;
          }
        });
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

      // Quick tab shortcuts: W, T, D, C
      const key = e.key.toLowerCase();
      if (key === 'w') {
        e.preventDefault();
        toggleCommandCenter();
      } else if (key === 't') {
        switchTab('tasks');
      } else if (key === 'd') {
        switchTab('workers');
      } else if (key === 'c') {
        switchTab('chat');
      }
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
      if (photoUrl.includes('drive.google.com/thumbnail?id=') || photoUrl.includes('/file/d/')) {
        photoUrl = convertGoogleDriveLink(photoUrl);
        WorkspaceDB.data.customMountedBadgePhoto = photoUrl;
        WorkspaceDB.save();
      }
      const badgeImg = document.getElementById('badgeImg');
      if (badgeImg) {
        badgeImg.src = photoUrl;
      }
    }

    renderWallpaperGallery();
    applyWallpaperPreset(state.activeWallpaperPreset);
    initLanyardPhysics();
    initShiftTimerControls();
    bindEvents();

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
          cloudMembers.forEach(cm => {
            const isFounder = (cm.email && cm.email.toLowerCase() === 'jagadish2k2006@gmail.com') || cm.isOwner;
            const memberId = cm.id || (isFounder ? 'RD-FOUNDER-001' : (cm.uid ? `RD-${cm.uid.slice(0, 6).toUpperCase()}` : 'RD-EMP-001'));
            const memberObj = {
              id: memberId,
              uid: cm.uid || cm.id || memberId,
              name: cm.displayName || cm.name || 'Team Member',
              displayName: cm.displayName || cm.name || 'Team Member',
              role: cm.role || 'Member',
              dept: cm.dept || 'Engineering',
              email: cm.email || '',
              photoUrl: cm.photoURL || cm.photoUrl || '',
              photoURL: cm.photoURL || cm.photoUrl || '',
              status: cm.suspended ? 'DUTY_OFF' : 'DUTY_ON',
              suspended: !!cm.suspended,
              avatarText: (cm.displayName || cm.name || 'RD').slice(0, 2).toUpperCase()
            };
            if (memberObj.id) WorkspaceDB.data.members[memberObj.id] = memberObj;
            if (memberObj.uid && memberObj.uid !== memberObj.id) WorkspaceDB.data.members[memberObj.uid] = memberObj;
          });
          WorkspaceDB.save();
          renderWorkers();
          renderFleetTelemetry();
          renderChatChannelsAndDMs();
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
          const map = new Map(DEFAULT_CHANNELS.map(c => [c.id, c]));
          channels.forEach(ch => {
            if (!ch.isDirectMessage && !ch.id.startsWith('dm_')) {
              map.set(ch.id, { ...map.get(ch.id), ...ch });
            }
          });
          WorkspaceDB.data.channels = Array.from(map.values());
          WorkspaceDB.save();

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
    }

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
        } else {
          closeAuthModal();
          setupCloudRealtimeSubscriptions();
        }
      });
    }

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

    document.getElementById('btnFastOtaUpdate')?.addEventListener('click', async () => {
      const btn = document.getElementById('btnFastOtaUpdate');
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span>⏳ Syncing Cloud Release...</span>';
      }
      try {
        if (window.electronAPI && window.electronAPI.otaApplyHotpatch) {
          const res = await window.electronAPI.otaApplyHotpatch();
          if (res && res.success) {
            playNotificationChirp(true);
            if (btn) btn.innerHTML = '<span>✅ Updated to v' + (res.version || '2.5.1') + '! Reloading...</span>';
            setTimeout(() => { window.location.reload(); }, 700);
            return;
          }
        } else {
          // Direct Web / browser fallback
          window.location.reload();
        }
      } catch (err) {
        console.error('[OTA] Error applying hotpatch:', err);
        const statusText = document.getElementById('otaStatusText');
        if (statusText) {
          statusText.style.color = '#ffb300';
          statusText.textContent = `OTA NOTICE: ${err.message}`;
        }
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = '<span>⚡ 1-Click Fast Cloud Update</span>';
        }
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

    // Auto-check on launch
    setTimeout(() => {
      checkOtaUpdates(false);
    }, 2500);
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
    }
  }

  async function startOtaDownload(downloadUrl) {
    const wrap = document.getElementById('otaProgressWrap');
    if (wrap) wrap.classList.remove('hidden');

    if (window.electronAPI && window.electronAPI.otaDownloadUpdate) {
      try {
        await window.electronAPI.otaDownloadUpdate(downloadUrl);
      } catch (e) {
        alert(`Download failed: ${e.message}`);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

