/**
 * ============================================================================
 * REDDOT WORKSTATION OS & LIVE WALLPAPER • ELECTRON MAIN PROCESS
 * Persistent Native Database Engine • Photo Picker Dialog • Sandboxed Security
 * ============================================================================
 */

const { app, BrowserWindow, screen, Tray, Menu, nativeImage, ipcMain, powerMonitor, session, Notification, dialog, shell } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs');
const http = require('http');
const https = require('https');
const { spawn } = require('child_process');

// V8 and Chromium performance & memory optimization switches
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=1024 --expose-gc');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('enable-features', 'CanvasOopRasterization,SmoothScrolling');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-accelerated-2d-canvas');
app.commandLine.appendSwitch('enable-accelerated-video-decode');

// Standard desktop Chrome User-Agent to ensure Google OAuth & Firebase SSO are never blocked
const CHROME_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
app.userAgentFallback = CHROME_USER_AGENT;

let mainWindow = null;
let tray = null;
let isTrayActive = false;
let metricsInterval = null;
let localServer = null;
let localServerPort = 0;

// Semantic version comparator: returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal
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

// User-writable hotpatch paths (lives in %APPDATA%\reddot-workstation-os\hotpatch - 100% writable, no UAC, outside read-only app.asar)
function getHotpatchDir() {
  return path.join(app.getPath('userData'), 'hotpatch');
}

function getHotpatchUiDir() {
  return path.join(getHotpatchDir(), 'wallpaper-ui');
}

function getInstalledVersion() {
  try {
    const vJsonPath = path.join(__dirname, 'version.json');
    if (fs.existsSync(vJsonPath)) {
      const vData = JSON.parse(fs.readFileSync(vJsonPath, 'utf8'));
      if (vData && vData.version) return vData.version;
    }
  } catch (_) {}
  return app.getVersion() || '2.5.1';
}

function getActiveVersionInfo() {
  const baseVersion = getInstalledVersion();
  const hotpatchVJson = path.join(getHotpatchDir(), 'version.json');
  if (fs.existsSync(hotpatchVJson)) {
    try {
      const vData = JSON.parse(fs.readFileSync(hotpatchVJson, 'utf8'));
      if (vData && vData.version) {
        // Hotpatch must be strictly newer than the base installed version
        if (compareSemver(vData.version, baseVersion) > 0) {
          return {
            version: vData.version,
            isHotpatched: true,
            baseVersion: baseVersion,
            releaseDate: vData.releaseDate || '2026-09-05',
            appliedAt: vData.appliedAt || null
          };
        } else {
          // Installed version is equal or newer! Stale hotpatch must be purged to prevent stuck/corrupt loading.
          try {
            fs.rmSync(getHotpatchDir(), { recursive: true, force: true });
            console.log(`[HOTPATCH] Cleaned up obsolete hotpatch directory (installed: ${baseVersion}, hotpatch: ${vData.version})`);
          } catch (_) {}
        }
      }
    } catch (_) {}
  }
  return {
    version: baseVersion,
    isHotpatched: false,
    baseVersion: baseVersion,
    releaseDate: '2026-09-05',
    appliedAt: null
  };
}

// Local loopback server to serve UI with http:// protocol for full Firebase Web Auth compliance
// Automatically checks user-writable hotpatch directory first (if active & newer), falling back to bundled assets in app.asar
function startLocalServer() {
  return new Promise((resolve, reject) => {
    localServer = http.createServer((req, res) => {
      let reqPath = req.url.split('?')[0];
      if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
      const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');

      const activeInfo = getActiveVersionInfo();
      let filePath = null;

      // Special case: version manifest
      if (safePath === '\\version.json' || safePath === '/version.json' || safePath === 'version.json') {
        const hotpatchVJson = path.join(getHotpatchDir(), 'version.json');
        filePath = (activeInfo.isHotpatched && fs.existsSync(hotpatchVJson)) ? hotpatchVJson : path.join(__dirname, 'version.json');
      } else {
        // Priority 1: Check hotpatch folder in user data ONLY IF active and strictly newer
        if (activeInfo.isHotpatched) {
          const hotpatchFilePath = path.join(getHotpatchUiDir(), safePath);
          if (fs.existsSync(hotpatchFilePath) && !fs.statSync(hotpatchFilePath).isDirectory()) {
            filePath = hotpatchFilePath;
          }
        }
        // Priority 2: Bundled UI folder in app package
        if (!filePath) {
          filePath = path.join(__dirname, 'wallpaper-ui', safePath);
        }
      }

      if (!fs.existsSync(filePath) && (safePath.toLowerCase().endsWith('favicon.ico') || safePath === '/favicon.ico' || safePath === 'favicon.ico')) {
        filePath = path.join(__dirname, 'wallpaper-ui', 'assets', 'id-card.png');
      }

      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'text/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.woff2': 'font/woff2',
        '.woff': 'font/woff',
        '.ttf': 'font/ttf',
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav'
      };

      const contentType = mimeTypes[ext] || 'application/octet-stream';
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Cross-Origin-Opener-Policy': 'same-origin-allow-popups'
      });
      fs.createReadStream(filePath).pipe(res);
    });

    localServer.listen(0, '127.0.0.1', () => {
      localServerPort = localServer.address().port;
      console.log(`[SERVER] Workstation UI loopback running on http://127.0.0.1:${localServerPort}`);
      resolve(localServerPort);
    });

    localServer.on('error', (err) => {
      console.error('[SERVER] Local loopback server error:', err);
      reject(err);
    });
  });
}

// =============================================================================
// REDDOT ATTACHMENT GATEWAY & GOOGLE DRIVE BACKEND CONTROLLER (Port 5050)
// =============================================================================
let backendProcess = null;

function checkBackendHealth(timeoutMs = 800) {
  return new Promise((resolve) => {
    const req = http.get('http://127.0.0.1:5050/api/health', (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ online: res.statusCode === 200, ...json });
        } catch (_) {
          resolve({ online: res.statusCode === 200 });
        }
      });
    });
    req.on('error', () => resolve({ online: false }));
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      resolve({ online: false });
    });
  });
}

async function startBackendService() {
  const health = await checkBackendHealth(500);
  if (health.online) {
    console.log('[BACKEND] Attachment backend already running on port 5050.');
    return true;
  }

  const backendCandidates = [
    path.resolve(__dirname, '..', 'backend', 'server.js'),
    path.resolve(__dirname, 'backend', 'server.js'),
    path.resolve(process.resourcesPath || '', 'backend', 'server.js'),
    path.resolve(__dirname, '..', 'attachment-service', 'server.js')
  ];

  const backendScript = backendCandidates.find(p => fs.existsSync(p));
  if (!backendScript) {
    console.warn('[BACKEND] No backend server script found in paths.');
    return false;
  }

  console.log('[BACKEND] Auto-spawning REDDOT Attachment Gateway:', backendScript);
  try {
    const nodeBin = process.execPath;
    backendProcess = spawn(nodeBin, [backendScript], {
      cwd: path.dirname(backendScript),
      env: { ...process.env, ELECTRON_RUN_AS_NODE: '1', PORT: '5050' },
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true
    });

    backendProcess.stdout?.on('data', (d) => {
      const msg = d.toString().trim();
      if (msg) console.log('[BACKEND]', msg);
    });
    backendProcess.stderr?.on('data', (d) => {
      const msg = d.toString().trim();
      if (msg) console.warn('[BACKEND ERR]', msg);
    });
    backendProcess.on('exit', (code) => {
      console.log(`[BACKEND] Process exited with code ${code}`);
      backendProcess = null;
    });

    const start = Date.now();
    while (Date.now() - start < 3500) {
      await new Promise(r => setTimeout(r, 200));
      const check = await checkBackendHealth(300);
      if (check.online) {
        console.log('[BACKEND] Attachment gateway online on http://127.0.0.1:5050');
        return true;
      }
    }
  } catch (err) {
    console.warn('[BACKEND] Error starting gateway process:', err.message);
  }
  return false;
}

// App settings
const config = {
  theme: 'light',
  powerProfile: 'balanced',
  cleanView: false,
  autoStart: false
};

// --- Persistent Native Database Storage Paths ---
function getDbDir() {
  const dir = path.join(app.getPath('userData'), 'reddot_storage');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function getDbPath() {
  return path.join(getDbDir(), 'reddot_database.json');
}

function getBadgesDir() {
  const dir = path.join(getDbDir(), 'badges');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function loadDatabaseFromDisk() {
  const filePath = getDbPath();
  if (fs.existsSync(filePath)) {
    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      if (raw && raw.trim().length > 0) {
        return JSON.parse(raw.trim());
      }
    } catch (e) {
      console.warn('[DB] Could not parse disk database, attempting recovery:', e.message);
    }
  }
  
  // Safe Recovery: find the most recent valid .tmp or .bak file in storage directory
  try {
    const dir = getDbDir();
    const files = fs.readdirSync(dir).filter(f => (f.startsWith('reddot_database.json.') && (f.endsWith('.tmp') || f.endsWith('.bak'))) || f === 'reddot_database.json.bak');
    for (const f of files.reverse()) {
      try {
        const candidate = fs.readFileSync(path.join(dir, f), 'utf8');
        if (candidate && candidate.trim().length > 10) {
          const parsed = JSON.parse(candidate.trim());
          if (parsed && typeof parsed === 'object' && (parsed.members || parsed.tasks || parsed.chats)) {
            console.log('[DB] Recovered valid database from backup:', f);
            fs.writeFileSync(filePath, JSON.stringify(parsed, null, 2), 'utf8');
            return parsed;
          }
        }
      } catch (_) {}
    }
  } catch (err) {
    console.warn('[DB] Recovery scan error:', err);
  }
  return null;
}

let isDbSaving = false;
let pendingDbPayload = null;

function saveDatabaseToDisk(data) {
  if (!data || typeof data !== 'object') return false;
  pendingDbPayload = data;
  drainDbSaveQueue();
  return true;
}

function drainDbSaveQueue() {
  if (isDbSaving || !pendingDbPayload) return;
  isDbSaving = true;
  const dataToWrite = pendingDbPayload;
  pendingDbPayload = null;

  try {
    const filePath = getDbPath();
    const payload = JSON.stringify(dataToWrite);
    if (!payload || payload.length < 10) {
      isDbSaving = false;
      return;
    }
    const tmpPath = `${filePath}.${Date.now()}_${Math.random().toString(36).slice(2, 6)}.tmp`;
    const bakPath = `${filePath}.bak`;

    fs.writeFile(tmpPath, payload, 'utf8', (err) => {
      if (err) {
        console.error('[DB] Write error:', err);
        isDbSaving = false;
        if (pendingDbPayload) drainDbSaveQueue();
        return;
      }
      fs.rename(tmpPath, filePath, (rErr) => {
        if (rErr) {
          // Fallback if rename fails due to transient Windows file handle lock
          fs.writeFile(filePath, payload, 'utf8', () => {
            try { if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath); } catch (_) {}
            try { fs.writeFileSync(bakPath, payload, 'utf8'); } catch (_) {}
            isDbSaving = false;
            if (pendingDbPayload) drainDbSaveQueue();
          });
          return;
        }
        try { fs.writeFileSync(bakPath, payload, 'utf8'); } catch (_) {}
        isDbSaving = false;
        if (pendingDbPayload) drainDbSaveQueue();
      });
    });
  } catch (e) {
    console.error('[DB] Save error:', e);
    isDbSaving = false;
    if (pendingDbPayload) drainDbSaveQueue();
  }
}

// --- Windows Auto-Start Helper ---
function getAutoStartStatus() {
  try {
    const settings = app.getLoginItemSettings();
    return settings.openAtLogin;
  } catch (_) {
    return config.autoStart;
  }
}

function setAutoStartStatus(enable) {
  try {
    config.autoStart = !!enable;
    app.setLoginItemSettings({
      openAtLogin: !!enable,
      path: process.execPath,
      args: ['--autostart']
    });
    updateTrayMenu();
    return true;
  } catch (e) {
    console.warn('Failed to set login item settings:', e);
    return false;
  }
}

// --- CPU Usage Sampler (Delta Calculation) ---
let prevCpus = os.cpus();

function getCpuUsage() {
  const currentCpus = os.cpus();
  let idleDiff = 0;
  let totalDiff = 0;

  for (let i = 0; i < currentCpus.length; i++) {
    const prev = prevCpus[i].times;
    const curr = currentCpus[i].times;

    const prevTotal = prev.user + prev.nice + prev.sys + prev.idle + prev.irq;
    const currTotal = curr.user + curr.nice + curr.sys + curr.idle + curr.irq;

    idleDiff += curr.idle - prev.idle;
    totalDiff += currTotal - prevTotal;
  }

  prevCpus = currentCpus;
  if (totalDiff === 0) return 5;
  const usage = Math.round((1 - idleDiff / totalDiff) * 100);
  return Math.min(100, Math.max(1, usage));
}

function sampleSystemMetrics() {
  const cpuLoad = getCpuUsage();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memUsagePercent = Math.round((usedMem / totalMem) * 100);
  const usedMemGB = (usedMem / (1024 * 1024 * 1024)).toFixed(1);
  const totalMemGB = (totalMem / (1024 * 1024 * 1024)).toFixed(0);

  const procMem = process.memoryUsage();
  const appMemMB = Math.round(procMem.heapUsed / (1024 * 1024));

  const healthScore = Math.max(50, Math.min(100, 100 - Math.round(cpuLoad * 0.4) - Math.round((memUsagePercent - 40) * 0.3)));

  const metrics = {
    cpuLoad,
    cpuModel: os.cpus()[0]?.model || 'Multi-Core Processor',
    cpuCores: os.cpus().length,
    usedMemGB,
    totalMemGB,
    memUsagePercent,
    appMemMB,
    healthScore,
    uptimeSec: Math.floor(os.uptime()),
    platform: `${os.type()} ${os.arch()}`,
    appVersion: app.getVersion() || '2.4.0',
    autoStart: getAutoStartStatus(),
    runningApps: Array.isArray(cachedRunningApps) ? cachedRunningApps : []
  };

  // Keep running apps cache fresh
  if (typeof scanRunningApplications === 'function') {
    scanRunningApplications().catch(() => {});
  }



  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('system-metrics-update', metrics);
  }
}

let isDesktopPinned = false;

function setDesktopPinned(pinned) {
  isDesktopPinned = !!pinned;
  if (!mainWindow || mainWindow.isDestroyed()) return isDesktopPinned;

  if (isDesktopPinned) {
    mainWindow.setAlwaysOnTop(false);
    mainWindow.setSkipTaskbar(false);
  } else {
    mainWindow.setAlwaysOnTop(false);
    mainWindow.setSkipTaskbar(false);
    mainWindow.show();
    mainWindow.focus();
  }
  updateTrayMenu();
  mainWindow.webContents.send('desktop-pinned-changed', isDesktopPinned);
  return isDesktopPinned;
}

function createWallpaperWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize || primaryDisplay.bounds;

  mainWindow = new BrowserWindow({
    title: 'REDDOT Workstation OS',
    width: Math.min(width, 1536),
    height: Math.min(height, 864),
    x: 0,
    y: 0,
    frame: false,
    show: true,
    resizable: true,
    movable: true,
    minimizable: true,
    maximizable: true,
    fullscreenable: true,
    skipTaskbar: false,
    focusable: true,
    backgroundColor: '#060609',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      backgroundThrottling: false
    }
  });

  // Completely eliminate the default window menu bar (File, Edit, View, Window, Help)
  mainWindow.setMenu(null);
  mainWindow.setMenuBarVisibility(false);

  // Allow Google OAuth / Firebase Auth popups safely & give meetings optimal widescreen bounds
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    const isMeeting = url.startsWith('https://meet.jit.si') || url.startsWith('https://meet.google.com') || url.includes('jit.si');
    const isAuth = url.startsWith('https://accounts.google.com') ||
                   url.includes('.firebaseapp.com/__/auth/handler') ||
                   url.includes('firebaseapp.com');

    if (isMeeting || isAuth) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: isMeeting ? 1024 : 540,
          height: isMeeting ? 720 : 700,
          resizable: true,
          autoHideMenuBar: true,
          alwaysOnTop: true,
          center: true,
          userAgent: CHROME_USER_AGENT,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true
          }
        }
      };
    }
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (
      !url.startsWith(`http://127.0.0.1:${localServerPort}`) &&
      !url.startsWith(`http://localhost:${localServerPort}`) &&
      !url.startsWith('file://')
    ) {
      event.preventDefault();
    }
  });

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[RENDERER ${level}] ${message} (${sourceId}:${line})`);
  });

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if ((input.control && input.key.toLowerCase() === 'r') || input.key === 'F5') {
      mainWindow.webContents.session.clearCache().then(() => {
        mainWindow.webContents.reloadIgnoringCache();
      });
      event.preventDefault();
    }
  });

  // Ensure no stale scripts or styles remain cached
  try {
    mainWindow.webContents.session.clearCache();
  } catch (_) {}

  if (localServerPort > 0) {
    mainWindow.loadURL(`http://localhost:${localServerPort}/index.html?t=${Date.now()}`);
  } else {
    const hotpatchIndex = path.join(getHotpatchUiDir(), 'index.html');
    if (fs.existsSync(hotpatchIndex)) {
      mainWindow.loadFile(hotpatchIndex);
    } else {
      mainWindow.loadFile(path.join(__dirname, 'wallpaper-ui', 'index.html'));
    }
  }

  const showAndActivate = () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setSkipTaskbar(false);
      if (!mainWindow.isVisible()) mainWindow.show();
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.maximize();
      mainWindow.show();
      mainWindow.focus();
      mainWindow.moveTop();
    }
  };

  mainWindow.once('ready-to-show', () => {
    showAndActivate();
    config.autoStart = getAutoStartStatus();
    sampleSystemMetrics();
    if (!metricsInterval) metricsInterval = setInterval(sampleSystemMetrics, 8000);
  });

  mainWindow.webContents.once('did-finish-load', () => {
    showAndActivate();
  });

  setTimeout(showAndActivate, 800);

  mainWindow.on('close', async (e) => {
    if (!mainWindow._clockedOutOnClose) {
      e.preventDefault();
      mainWindow._clockedOutOnClose = true;
      try {
        await mainWindow.webContents.executeJavaScript(`
          if (typeof autoPerformExitClockOut === 'function') {
            autoPerformExitClockOut();
          }
        `);
      } catch (err) {
        console.warn('[EXIT] Auto clock-out on window close error:', err);
      }
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.destroy();
        }
      }, 350);
    }
  });

  mainWindow.on('closed', () => {
    if (metricsInterval) clearInterval(metricsInterval);
    mainWindow = null;
  });
}

function createTrayIcon() {
  try {
    const icoPath = path.join(__dirname, 'wallpaper-ui', 'assets', 'icon.ico');
    const pngPath = path.join(__dirname, 'wallpaper-ui', 'assets', 'id-card.png');
    let icon = null;
    if (fs.existsSync(icoPath)) {
      icon = nativeImage.createFromPath(icoPath);
    } else if (fs.existsSync(pngPath)) {
      try {
        const buf = fs.readFileSync(pngPath);
        icon = nativeImage.createFromBuffer(buf).resize({ width: 16, height: 16 });
      } catch (_) {
        icon = nativeImage.createFromPath(pngPath).resize({ width: 16, height: 16 });
      }
    }
    if (!icon || icon.isEmpty()) {
      return;
    }

    try {
      tray = new Tray(icon);
      tray.setToolTip('REDDOT Workstation OS');
      isTrayActive = true;
    } catch (e) {
      isTrayActive = false;
      tray = null;
      return;
    }

    tray.on('double-click', () => {
      if (mainWindow) {
        if (!mainWindow.isVisible()) mainWindow.show();
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
      }
    });

    tray.on('click', () => {
      if (mainWindow) {
        if (!mainWindow.isVisible()) mainWindow.show();
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
      }
    });

    updateTrayMenu();
  } catch (err) {
    console.warn('[TRAY] Tray icon creation skipped:', err.message);
    tray = null;
  }
}

function updateTrayMenu() {
  const isAutoStart = getAutoStartStatus();
  const themes = [
    { label: 'Obsidian Cyber (Cyan)', id: 'obsidian' },
    { label: 'Nordic Slate (Silver)', id: 'nordic' },
    { label: 'Soft Emerald (Green)', id: 'emerald' },
    { label: 'Crimson REDDOT (Red)', id: 'crimson' },
    { label: 'Sunset Amber (Gold)', id: 'amber' },
    { label: 'Deep Nebula (Violet)', id: 'nebula' }
  ];

  function showAndSend(tab) {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
      mainWindow.webContents.send('open-tab', tab);
    }
  }

  const contextMenu = Menu.buildFromTemplate([
    { label: '◆ REDDOT Enterprise Workspace', enabled: false },
    { type: 'separator' },
    {
      label: '🖥️ Show Workstation Window',
      click: () => {
        if (mainWindow) {
          if (mainWindow.isMinimized()) mainWindow.restore();
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: '🎨 Wallpapers & Themes Studio',
      click: () => showAndSend('wallpapers')
    },
    {
      label: '👥 Employee Directory & Roles',
      click: () => showAndSend('workers')
    },
    {
      label: '⏱️ Work Hours & Shift History',
      click: () => showAndSend('timesheets')
    },
    {
      label: '📋 Task Management Center',
      click: () => showAndSend('tasks')
    },
    {
      label: '💬 Team Channels & Private DMs',
      click: () => showAndSend('chat')
    },
    {
      label: '🌐 Team Presence & Admin Overview',
      click: () => showAndSend('telemetry')
    },
    {
      label: '🛡️ Database & Storage Hub',
      click: () => showAndSend('database')
    },
    { type: 'separator' },
    {
      label: isDesktopPinned ? '🪟 Switch to Interactive Workstation Mode' : '📌 Pin as Desktop Background Wallpaper',
      click: () => {
        setDesktopPinned(!isDesktopPinned);
      }
    },
    {
      label: '🎨 Quick Theme Swatch',
      submenu: themes.map(t => ({
        label: t.label,
        type: 'radio',
        checked: config.theme === t.id,
        click: () => {
          config.theme = t.id;
          mainWindow?.webContents.send('set-theme', t.id);
        }
      }))
    },
    {
      label: `⚡ Auto-Start on Windows Boot: ${isAutoStart ? '[ENABLED ✓]' : '[DISABLED]'}`,
      type: 'checkbox',
      checked: isAutoStart,
      click: (menuItem) => {
        setAutoStartStatus(menuItem.checked);
        mainWindow?.webContents.send('auto-start-changed', menuItem.checked);
      }
    },
    {
      label: '🧹 1-Click RAM Turbo Clean',
      click: () => {
        if (global.gc) global.gc();
        mainWindow?.webContents.send('trigger-memory-clean');
        sampleSystemMetrics();
      }
    },
    {
      label: '🖥️ Minimal Wallpaper View',
      click: () => {
        mainWindow?.webContents.send('toggle-clean');
      }
    },
    {
      label: '🔄 Reload Workstation Window',
      click: () => {
        mainWindow?.webContents.reload();
      }
    },
    { type: 'separator' },
    {
      label: '🚪 Exit Workstation',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
}

// --- IPC Validation Helper ---
function isTrustedSender(event) {
  if (!mainWindow || !event) return false;
  if (mainWindow.webContents && event.sender === mainWindow.webContents) return true;
  if (event.senderFrame && mainWindow.webContents && event.senderFrame === mainWindow.webContents.mainFrame) return true;
  return false;
}

// Window Management IPC Handlers
ipcMain.on('window-minimize', (event) => {
  if (!isTrustedSender(event)) return;
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.minimize();
  }
});

ipcMain.on('window-maximize', (event) => {
  if (!isTrustedSender(event)) return;
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window-close', (event) => {
  if (!isTrustedSender(event)) return;
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.close();
  }
});

ipcMain.handle('window-toggle-pin', (event) => {
  if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
  return setDesktopPinned(!isDesktopPinned);
});

ipcMain.handle('window-is-pinned', (event) => {
  if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
  return isDesktopPinned;
});

// IPC Handlers with Strict Validation
// --- Backend Attachment Service & Google Drive Gateway IPC ---
ipcMain.handle('get-backend-status', async (event) => {
  if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
  try {
    return await checkBackendHealth(1200);
  } catch (err) {
    return { online: false, error: err.message };
  }
});

ipcMain.handle('fetch-backend-attachments', async (event) => {
  if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
  return new Promise((resolve) => {
    http.get('http://127.0.0.1:5050/api/attachments', (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ success: false, error: 'Parse error', raw: data });
        }
      });
    }).on('error', (err) => {
      resolve({ success: false, error: err.message, attachments: [] });
    });
  });
});

ipcMain.handle('delete-backend-attachment', async (event, attachmentId) => {
  if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
  return new Promise((resolve) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: 5050,
      path: '/api/attachments/' + encodeURIComponent(attachmentId),
      method: 'DELETE'
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (_) { resolve({ success: res.statusCode === 200 }); }
      });
    });
    req.on('error', (err) => resolve({ success: false, error: err.message }));
    req.end();
  });
});

ipcMain.handle('select-and-upload-file', async (event, options = {}) => {
  if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
  const result = await dialog.showOpenDialog(mainWindow, {
    title: options.title || 'Select File to Upload to REDDOT Cloud',
    filters: options.filters || [
      { name: 'All Files', extensions: ['*'] }
    ],
    properties: ['openFile']
  });

  if (result.canceled || !result.filePaths.length) {
    return { canceled: true };
  }

  const selectedPath = result.filePaths[0];
  try {
    const stats = fs.statSync(selectedPath);
    if (stats.size > 25 * 1024 * 1024) {
      return { canceled: false, error: 'File exceeds 25MB maximum limit.' };
    }

    const fileName = path.basename(selectedPath);
    const channelId = options.channelId || 'general';
    const uploaderId = options.uploaderId || 'RD-EMP';

    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const fileBuf = fs.readFileSync(selectedPath);
    const ext = path.extname(selectedPath).toLowerCase();
    const mimeTypes = {
      '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
      '.pdf': 'application/pdf', '.txt': 'text/plain', '.json': 'application/json', '.zip': 'application/zip'
    };
    const mimeType = mimeTypes[ext] || 'application/octet-stream';

    const header = Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: ${mimeType}\r\n\r\n`,
      'utf8'
    );
    const footer = Buffer.from(
      `\r\n--${boundary}\r\nContent-Disposition: form-data; name="channelId"\r\n\r\n${channelId}\r\n--${boundary}\r\nContent-Disposition: form-data; name="uploaderId"\r\n\r\n${uploaderId}\r\n--${boundary}--\r\n`,
      'utf8'
    );

    const fullPayload = Buffer.concat([header, fileBuf, footer]);

    return new Promise((resolve) => {
      const postReq = http.request({
        hostname: '127.0.0.1',
        port: 5050,
        path: '/api/attachments/upload',
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': fullPayload.length,
          'x-reddot-user-id': uploaderId,
          'x-reddot-channel-id': channelId
        }
      }, (res) => {
        let respData = '';
        res.on('data', chunk => { respData += chunk; });
        res.on('end', () => {
          try {
            resolve({ canceled: false, success: res.statusCode >= 200 && res.statusCode < 300, ...JSON.parse(respData) });
          } catch (_) {
            resolve({ canceled: false, success: res.statusCode === 201, raw: respData });
          }
        });
      });

      postReq.on('error', (err) => {
        resolve({ canceled: false, error: 'Backend error: ' + err.message });
      });

      postReq.write(fullPayload);
      postReq.end();
    });
  } catch (err) {
    return { canceled: false, error: err.message };
  }
});

ipcMain.handle('get-auto-start', (event) => {
  if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
  return getAutoStartStatus();
});

ipcMain.handle('set-auto-start', (event, enable) => {
  if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
  if (typeof enable !== 'boolean') throw new Error('Invalid parameter type: expected boolean');
  return setAutoStartStatus(enable);
});

ipcMain.on('request-memory-clean', (event) => {
  if (!isTrustedSender(event)) return;
  if (global.gc) global.gc();
  sampleSystemMetrics();
});

// Native Persistent Database Handlers
ipcMain.handle('db-load', (event) => {
  if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
  return loadDatabaseFromDisk();
});

ipcMain.handle('db-save', (event, data) => {
  if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
  if (!data || typeof data !== 'object') throw new Error('Invalid database payload');
  return saveDatabaseToDisk(data);
});

// Select & Upload Photo from Windows File Explorer
ipcMain.handle('db-select-photo', async (event) => {
  if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select ID Card Photo for Wallpaper & Badge',
    filters: [
      { name: 'Image Files', extensions: ['jpg', 'jpeg', 'png', 'webp', 'bmp'] }
    ],
    properties: ['openFile']
  });

  if (result.canceled || !result.filePaths.length) {
    return { canceled: true };
  }

  const selectedPath = result.filePaths[0];
  try {
    const stats = fs.statSync(selectedPath);
    if (stats.size > 5 * 1024 * 1024) {
      return { canceled: false, error: 'Selected image exceeds maximum allowed limit of 5MB.' };
    }

    const ext = path.extname(selectedPath).toLowerCase().replace('.', '') || 'png';
    const allowed = ['jpg', 'jpeg', 'png', 'webp', 'bmp'];
    if (!allowed.includes(ext)) {
      return { canceled: false, error: 'Invalid file extension: only JPG, PNG, WEBP, and BMP images are allowed.' };
    }

    const fileBuf = fs.readFileSync(selectedPath);
    const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : (ext === 'webp' ? 'image/webp' : 'image/png');
    const base64Data = `data:${mime};base64,${fileBuf.toString('base64')}`;

    // Save copy to local badges folder
    const fileName = `badge_photo_${Date.now()}.${ext}`;
    const destPath = path.join(getBadgesDir(), fileName);
    fs.writeFileSync(destPath, fileBuf);

    return {
      canceled: false,
      dataUrl: base64Data,
      fileName: fileName,
      filePath: destPath
    };
  } catch (err) {
    console.error('[PHOTO] Error loading photo:', err);
    return { canceled: false, error: err.message };
  }
});

// Native System Command Execution for Workstation Terminal
ipcMain.handle('execute-terminal-command', async (event, cmdStr) => {
  if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
  if (!cmdStr || typeof cmdStr !== 'string') return { stdout: '', stderr: 'No command provided', exitCode: 1 };

  return new Promise((resolve) => {
    const { exec } = require('child_process');
    const userWorkspace = path.resolve(__dirname, '..');
    exec(cmdStr, {
      cwd: userWorkspace,
      timeout: 20000,
      maxBuffer: 1024 * 1024 * 4,
      env: { ...process.env }
    }, (error, stdout, stderr) => {
      resolve({
        success: !error,
        stdout: stdout || '',
        stderr: stderr || (error ? error.message : ''),
        exitCode: error ? (error.code || 1) : 0
      });
    });
  });
});



ipcMain.handle('db-diagnostics', async (event) => {
  if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
  const start = performance.now();
  const testId = 'diag_' + Date.now();
  const dbPath = getDbPath();

  try {
    let db = loadDatabaseFromDisk() || { members: {}, tasks: [], chats: {}, punchLogs: [] };
    
    // Write test
    db._diagnostic_test = { testId, timestamp: Date.now() };
    saveDatabaseToDisk(db);

    // Read test
    const reloaded = loadDatabaseFromDisk();
    const writeOk = reloaded && reloaded._diagnostic_test && reloaded._diagnostic_test.testId === testId;

    // Clean test key
    delete db._diagnostic_test;
    saveDatabaseToDisk(db);

    const elapsed = (performance.now() - start).toFixed(2);
    return {
      success: writeOk,
      latencyMs: elapsed,
      dbPath: dbPath,
      fileSizeKB: fs.existsSync(dbPath) ? (fs.statSync(dbPath).size / 1024).toFixed(1) : 0,
      timestamp: Date.now()
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Open External Links (Calls & Meetings) in Default Browser

// --- DEDICATED HIGH-PERFORMANCE CALLING & MEETING WINDOW ENGINE ---
let activeCallWindow = null;
ipcMain.handle('open-call-window', async (event, payload) => {
  if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
  const { url, title = 'REDDOT Workstation - Meeting' } = payload || {};
  if (!url || typeof url !== 'string') {
    return { success: false, error: 'Invalid call URL' };
  }

  if (activeCallWindow && !activeCallWindow.isDestroyed()) {
    activeCallWindow.loadURL(url);
    activeCallWindow.show();
    activeCallWindow.focus();
    return { success: true };
  }

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize || primaryDisplay.bounds;

  activeCallWindow = new BrowserWindow({
    title: title,
    width: Math.min(1280, Math.round(screenWidth * 0.85)),
    height: Math.min(800, Math.round(screenHeight * 0.85)),
    center: true,
    backgroundColor: '#0b0f19',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      backgroundThrottling: false
    }
  });

  activeCallWindow.setMenu(null);
  activeCallWindow.setMenuBarVisibility(false);

  // Auto-grant camera, microphone, screen capture for crystal clear calling
  activeCallWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(true);
  });
  activeCallWindow.webContents.session.setPermissionCheckHandler(() => true);

  // Modern desktop Chrome User-Agent
  activeCallWindow.webContents.setUserAgent(CHROME_USER_AGENT);

  activeCallWindow.once('ready-to-show', () => {
    activeCallWindow.show();
    activeCallWindow.focus();
  });

  activeCallWindow.on('closed', () => {
    activeCallWindow = null;
  });

  activeCallWindow.loadURL(url);
  return { success: true };
});

ipcMain.handle('open-external', async (event, url) => {
  if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
  if (typeof url === 'string' && (url.startsWith('https://') || url.startsWith('http://'))) {
    shell.openExternal(url);
    return true;
  }
  return false;
});

// Native File Download & Save Dialog Engine
ipcMain.handle('save-file-dialog', async (event, payload) => {
  if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
  try {
    const { defaultName = 'download', dataUrl = '', bufferBase64 = '' } = payload || {};
    const win = mainWindow && !mainWindow.isDestroyed() ? mainWindow : null;
    
    // Default to user's Downloads folder
    const downloadsFolder = app.getPath('downloads');
    const defaultPath = path.join(downloadsFolder, path.basename(defaultName));

    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      title: 'Download & Save Attachment - REDDOT Workstation',
      defaultPath: defaultPath,
      properties: ['showOverwriteConfirmation', 'createDirectory']
    });

    if (canceled || !filePath) {
      return { success: false, canceled: true };
    }

    let fileBuffer = null;
    if (bufferBase64) {
      fileBuffer = Buffer.from(bufferBase64, 'base64');
    } else if (dataUrl && dataUrl.startsWith('data:')) {
      const commaIdx = dataUrl.indexOf(',');
      if (commaIdx !== -1) {
        fileBuffer = Buffer.from(dataUrl.slice(commaIdx + 1), 'base64');
      }
    } else if (dataUrl && (dataUrl.startsWith('http://') || dataUrl.startsWith('https://'))) {
      const client = dataUrl.startsWith('https:') ? https : http;
      await new Promise((resolve, reject) => {
        client.get(dataUrl, (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            return client.get(res.headers.location, (r2) => {
              const fileStream = fs.createWriteStream(filePath);
              r2.pipe(fileStream);
              fileStream.on('finish', () => { fileStream.close(); resolve(); });
              fileStream.on('error', reject);
            });
          }
          const fileStream = fs.createWriteStream(filePath);
          res.pipe(fileStream);
          fileStream.on('finish', () => { fileStream.close(); resolve(); });
          fileStream.on('error', reject);
        }).on('error', reject);
      });
      return { success: true, filePath };
    }

    if (fileBuffer) {
      fs.writeFileSync(filePath, fileBuffer);
      return { success: true, filePath };
    }

    return { success: false, error: 'No data payload found' };
  } catch (err) {
    console.error('[DOWNLOAD] Save file dialog error:', err);
    return { success: false, error: err.message };
  }
});

// --- OVER-THE-AIR (OTA) CLOUD UPDATER ENGINE ---
const DEFAULT_OTA_MANIFEST_URL = 'https://firestore.googleapis.com/v1/projects/reddot-workspace/databases/(default)/documents/organizations/reddot/system/otaRelease?key=AIzaSyBpjenDcXDREseIDv5NfgpDo2fAk_gUhdk';
const CLOUD_BUNDLE_URL = 'https://firestore.googleapis.com/v1/projects/reddot-workspace/databases/(default)/documents/organizations/reddot/ota/bundle?key=AIzaSyBpjenDcXDREseIDv5NfgpDo2fAk_gUhdk';
let downloadedUpdatePath = null;

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    const req = client.get(url, { headers: { 'User-Agent': 'REDDOT-Workstation-OS' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchJson(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Server returned HTTP status ${res.statusCode}`));
      }
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(rawData));
        } catch (e) {
          reject(new Error('Invalid JSON manifest response'));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(8000, () => {
      req.destroy();
      reject(new Error('OTA Update server connection timed out'));
    });
  });
}

// Robust binary file downloader with HTTP redirect (301/302) support for GitHub / S3 CDN releases
function downloadBinaryFile(fileUrl, targetPath, onProgress, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) {
      return reject(new Error('Too many redirects while downloading update package'));
    }

    const client = fileUrl.startsWith('https:') ? https : http;
    const req = client.get(fileUrl, {
      headers: {
        'User-Agent': 'REDDOT-Workstation-OS',
        'Accept': 'application/octet-stream, application/vnd.microsoft.portable-executable, application/zip, */*'
      }
    }, (res) => {
      // Handle HTTP redirects cleanly without attempting to parse binary as JSON
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        const redirectUrl = new URL(res.headers.location, fileUrl).href;
        return downloadBinaryFile(redirectUrl, targetPath, onProgress, maxRedirects - 1)
          .then(resolve)
          .catch(reject);
      }

      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`Server returned HTTP status ${res.statusCode} while downloading update`));
      }

      const totalBytes = parseInt(res.headers['content-length'] || '0', 10);
      let receivedBytes = 0;
      let lastProgressTime = 0;

      const fileStream = fs.createWriteStream(targetPath);

      res.on('data', (chunk) => {
        receivedBytes += chunk.length;
        fileStream.write(chunk);

        const now = Date.now();
        if (now - lastProgressTime > 150 || receivedBytes === totalBytes) {
          lastProgressTime = now;
          const percent = totalBytes > 0 ? Math.round((receivedBytes / totalBytes) * 100) : 0;
          if (onProgress) {
            onProgress({ percent, receivedBytes, totalBytes });
          }
        }
      });

      res.on('end', () => {
        fileStream.end(() => {
          resolve({ targetPath, totalBytes: receivedBytes });
        });
      });

      res.on('error', (err) => {
        fileStream.close();
        if (fs.existsSync(targetPath)) try { fs.unlinkSync(targetPath); } catch (_) {}
        reject(err);
      });
    });

    req.on('error', (err) => {
      if (fs.existsSync(targetPath)) try { fs.unlinkSync(targetPath); } catch (_) {}
      reject(err);
    });

    req.setTimeout(90000, () => {
      req.destroy();
      if (fs.existsSync(targetPath)) try { fs.unlinkSync(targetPath); } catch (_) {}
      reject(new Error('Update download connection timed out'));
    });
  });
}

ipcMain.handle('ota-get-info', async (event) => {
  if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
  const activeInfo = getActiveVersionInfo();
  return {
    version: activeInfo.version,
    baseVersion: activeInfo.baseVersion,
    isHotpatched: activeInfo.isHotpatched,
    appliedAt: activeInfo.appliedAt,
    platform: process.platform,
    arch: process.arch,
    isPackaged: app.isPackaged,
    channel: activeInfo.isHotpatched ? 'hotpatched' : (app.isPackaged ? 'installed' : 'development'),
    buildDate: activeInfo.releaseDate || '2026-09-05'
  };
});

ipcMain.handle('ota-check-update', async (event, customParam) => {
  if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
  const activeInfo = getActiveVersionInfo();
  const currentVersion = activeInfo.version;

  let candidates = [];

  // Check if customParam is a GitHub repository slug (e.g. "owner/repo")
  let githubRepo = 'reddotorg123/REDDOT_WORKSTATION';
  if (typeof customParam === 'string' && customParam.includes('/') && !customParam.startsWith('http')) {
    githubRepo = customParam.trim();
  }

  // 1. Query Cloud Firestore REST API for latest release manifest
  const primaryUrl = (typeof customParam === 'string' && customParam.startsWith('http')) ? customParam : DEFAULT_OTA_MANIFEST_URL;
  try {
    const raw = await fetchJson(primaryUrl);
    if (raw && raw.fields) {
      candidates.push({
        version: raw.fields.version?.stringValue || '0.0.0',
        releaseDate: raw.fields.releaseDate?.stringValue || '2026-09-05',
        minRequiredVersion: raw.fields.minRequiredVersion?.stringValue || '2.0.0',
        mandatory: !!raw.fields.mandatory?.booleanValue,
        downloadUrl: raw.fields.downloadUrl?.stringValue || '',
        changelog: raw.fields.changelog?.arrayValue?.values?.map(v => v.stringValue) || []
      });
    } else if (raw && raw.version) {
      candidates.push(raw);
    }
  } catch (err) {
    console.warn('[OTA] Cloud manifest fetch notice:', err.message);
  }

  // 2. Query GitHub Raw and GitHub Releases CDN
  if (githubRepo) {
    try {
      const ghRawUrl = `https://raw.githubusercontent.com/${githubRepo}/main/version.json?_t=${Date.now()}`;
      const raw = await fetchJson(ghRawUrl);
      if (raw && raw.version) {
        candidates.push(raw);
      }
    } catch (ghRawErr) {
      try {
        const ghApiUrl = `https://api.github.com/repos/${githubRepo}/releases/latest`;
        const ghRelease = await fetchJson(ghApiUrl);
        if (ghRelease && ghRelease.tag_name) {
          const zipAsset = (ghRelease.assets || []).find(a => a.name.endsWith('.zip') || a.name.endsWith('.exe')) || ghRelease.assets?.[0];
          candidates.push({
            version: ghRelease.tag_name.replace(/^v/, ''),
            releaseDate: ghRelease.published_at ? ghRelease.published_at.slice(0, 10) : '2026-09-05',
            downloadUrl: zipAsset ? zipAsset.browser_download_url : ghRelease.html_url,
            changelog: ghRelease.body ? ghRelease.body.split('\n').map(l => l.trim()).filter(Boolean) : ['Global GitHub Release update']
          });
        }
      } catch (_) {}
    }
  }

  // 3. Fallback to Local Workstation
  if (candidates.length === 0 && localServerPort > 0) {
    try {
      const localManifest = await fetchJson(`http://127.0.0.1:${localServerPort}/version.json`);
      if (localManifest && localManifest.version) {
        candidates.push(localManifest);
      }
    } catch (_) {}
  }

  // Pick candidate with highest semantic version
  let manifest = null;
  for (const c of candidates) {
    if (!manifest || compareSemver(c.version, manifest.version) > 0) {
      manifest = c;
    }
  }

  if (manifest) {
    const remoteVersion = manifest.version || currentVersion;
    const hasUpdate = compareSemver(remoteVersion, currentVersion) > 0;

    return {
      success: true,
      hasUpdate: hasUpdate,
      currentVersion: currentVersion,
      latestVersion: remoteVersion,
      releaseDate: manifest.releaseDate || '2026-09-05',
      minRequiredVersion: manifest.minRequiredVersion || '2.0.0',
      changelog: manifest.changelog || [
        'Borderless Workspace: Removed top menu bar for distraction-free immersion',
        'Interactive Task Editor: Edit tasks with assignee, priority, status, and cloud sync',
        'Real-Time Fleet Hours Today: Live aggregate punch log calculations and presence ticker',
        'Over-The-Air (OTA) Cloud Pipeline: Instant hotpatching with zero downtime'
      ],
      downloadUrl: manifest.downloadUrl || '',
      canHotpatch: true,
      mandatory: !!manifest.mandatory
    };
  }

  return {
    success: true,
    hasUpdate: false,
    currentVersion: currentVersion,
    latestVersion: currentVersion,
    releaseDate: '2026-09-05',
    changelog: ['You are running the verified production build of REDDOT Workstation OS.'],
    offlineNotice: 'Cloud release server currently standby'
  };
});

ipcMain.handle('ota-apply-hotpatch', async (event) => {
  if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');

  try {
    const bundleDoc = await fetchJson(CLOUD_BUNDLE_URL);
    if (!bundleDoc || !bundleDoc.fields) {
      throw new Error('Cloud OTA bundle is not available or could not be fetched');
    }

    const fields = bundleDoc.fields;
    const remoteVersion = fields.version?.stringValue || '2.5.3';
    const wallpaperJs = fields.wallpaperJs?.stringValue;
    const firebaseServiceJs = fields.firebaseServiceJs?.stringValue;
    const styleCss = fields.styleCss?.stringValue;
    const indexHtml = fields.indexHtml?.stringValue;

    // Use safe, user-writable userData directory (works inside Program Files, asar, portable, dev)
    const hotpatchDir = getHotpatchDir();
    const hotpatchUiDir = getHotpatchUiDir();

    if (!fs.existsSync(hotpatchUiDir)) {
      fs.mkdirSync(hotpatchUiDir, { recursive: true });
    }

    const filesUpdated = [];
    if (wallpaperJs) {
      fs.writeFileSync(path.join(hotpatchUiDir, 'wallpaper.js'), wallpaperJs, 'utf8');
      filesUpdated.push('wallpaper.js');
    }
    if (firebaseServiceJs) {
      fs.writeFileSync(path.join(hotpatchUiDir, 'firebase-service.js'), firebaseServiceJs, 'utf8');
      filesUpdated.push('firebase-service.js');
    }
    if (styleCss) {
      fs.writeFileSync(path.join(hotpatchUiDir, 'style.css'), styleCss, 'utf8');
      filesUpdated.push('style.css');
    }
    if (indexHtml) {
      fs.writeFileSync(path.join(hotpatchUiDir, 'index.html'), indexHtml, 'utf8');
      filesUpdated.push('index.html');
    }

    // Update hotpatch version manifest in userData
    const hotpatchVJsonPath = path.join(hotpatchDir, 'version.json');
    const vData = {
      version: remoteVersion,
      releaseDate: fields.releaseDate?.stringValue || new Date().toISOString().slice(0, 10),
      appliedAt: new Date().toISOString(),
      changelog: fields.changelog?.arrayValue?.values ? fields.changelog.arrayValue.values.map(v => v.stringValue) : []
    };
    fs.writeFileSync(hotpatchVJsonPath, JSON.stringify(vData, null, 2), 'utf8');
    filesUpdated.push('version.json');

    // Also update dev workspace if not packaged (for easy dev sync)
    if (!app.isPackaged) {
      try {
        const localUiDir = path.join(__dirname, 'wallpaper-ui');
        if (wallpaperJs) fs.writeFileSync(path.join(localUiDir, 'wallpaper.js'), wallpaperJs, 'utf8');
        if (firebaseServiceJs) fs.writeFileSync(path.join(localUiDir, 'firebase-service.js'), firebaseServiceJs, 'utf8');
        if (styleCss) fs.writeFileSync(path.join(localUiDir, 'style.css'), styleCss, 'utf8');
        if (indexHtml) fs.writeFileSync(path.join(localUiDir, 'index.html'), indexHtml, 'utf8');
        const vJsonPath = path.join(__dirname, 'version.json');
        if (fs.existsSync(vJsonPath)) {
          const devVData = JSON.parse(fs.readFileSync(vJsonPath, 'utf8'));
          devVData.version = remoteVersion;
          fs.writeFileSync(vJsonPath, JSON.stringify(devVData, null, 2), 'utf8');
        }
      } catch (_) {}
    }

    // Clear session cache so Chromium picks up hotpatch instantly
    if (mainWindow && !mainWindow.isDestroyed()) {
      try {
        await mainWindow.webContents.session.clearCache();
      } catch (_) {}

      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.reloadIgnoringCache();
        }
      }, 500);
    }

    return { success: true, version: remoteVersion, filesUpdated };
  } catch (err) {
    console.error('[OTA] Hotpatch installation error:', err);
    throw err;
  }
});

// Revert to factory bundled build (clears hotpatches from userData and restores pristine app.asar code)
ipcMain.handle('ota-revert-hotpatch', async (event) => {
  if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
  try {
    const hotpatchDir = getHotpatchDir();
    if (fs.existsSync(hotpatchDir)) {
      fs.rmSync(hotpatchDir, { recursive: true, force: true });
    }
    if (mainWindow && !mainWindow.isDestroyed()) {
      try {
        await mainWindow.webContents.session.clearCache();
      } catch (_) {}
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.reloadIgnoringCache();
        }
      }, 300);
    }
    return { success: true, restoredVersion: getInstalledVersion() };
  } catch (err) {
    console.error('[OTA] Revert hotpatch error:', err);
    throw err;
  }
});

ipcMain.handle('ota-download-update', async (event, downloadUrl) => {
  if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
  if (!downloadUrl || (!downloadUrl.startsWith('http://') && !downloadUrl.startsWith('https://'))) {
    throw new Error('Invalid download URL');
  }

  // If download URL is a GitHub web release page rather than a direct binary asset, open in browser
  if (downloadUrl.includes('/releases/tag/') || downloadUrl.endsWith('/releases/latest') || downloadUrl.endsWith('/releases')) {
    shell.openExternal(downloadUrl);
    return { success: true, openedBrowser: true };
  }

  const updatesDir = path.join(app.getPath('temp'), 'reddot_updates');
  if (!fs.existsSync(updatesDir)) fs.mkdirSync(updatesDir, { recursive: true });

  let fileExt = '.exe';
  try {
    const parsedUrl = new URL(downloadUrl);
    const pathname = parsedUrl.pathname.toLowerCase();
    if (pathname.endsWith('.zip')) fileExt = '.zip';
    else if (pathname.endsWith('.exe')) fileExt = '.exe';
  } catch (_) {}

  const targetFile = path.join(updatesDir, `REDDOT-Workstation-OS-Update-${Date.now()}${fileExt}`);

  try {
    await downloadBinaryFile(downloadUrl, targetFile, (progress) => {
      mainWindow?.webContents.send('ota-download-progress', progress);
    });

    downloadedUpdatePath = targetFile;
    mainWindow?.webContents.send('ota-download-complete', { filePath: targetFile });
    return { success: true, filePath: targetFile };
  } catch (err) {
    console.error('[OTA] Update package download error:', err);
    throw err;
  }
});

ipcMain.handle('ota-install-update', async (event) => {
  if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
  if (!downloadedUpdatePath || !fs.existsSync(downloadedUpdatePath)) {
    throw new Error('No downloaded update package ready for installation');
  }

  try {
    if (downloadedUpdatePath.toLowerCase().endsWith('.exe')) {
      const child = spawn(downloadedUpdatePath, ['/S'], {
        detached: true,
        stdio: 'ignore'
      });
      child.on('error', () => {
        shell.openPath(downloadedUpdatePath);
      });
      child.unref();

      setTimeout(() => {
        app.quit();
      }, 1000);

      return { success: true };
    } else {
      shell.showItemInFolder(downloadedUpdatePath);
      return { success: true, openedFolder: true };
    }
  } catch (err) {
    shell.openPath(downloadedUpdatePath);
    setTimeout(() => {
      app.quit();
    }, 1500);
    return { success: true };
  }
});

// Cached running apps detector (10-second TTL to keep CPU at near-zero)
let cachedRunningApps = [];
let lastRunningAppsScan = 0;
let isScanningApps = false;

function scanRunningApplications() {
  return new Promise((resolve) => {
    const now = Date.now();
    if (cachedRunningApps.length > 0 && (now - lastRunningAppsScan) < 4000) {
      return resolve(cachedRunningApps);
    }
    if (isScanningApps) {
      return resolve(cachedRunningApps);
    }
    isScanningApps = true;

    const { exec } = require('child_process');

    // ONLY true interactive desktop applications that live in the Windows taskbar
    const TASKBAR_DESKTOP_APPS = {
      'antigravity ide.exe': { name: 'Antigravity IDE', icon: 'antigravity', category: 'Development' },
      'antigravity.exe': { name: 'Antigravity IDE', icon: 'antigravity', category: 'Development' },
      'cursor.exe': { name: 'Cursor Editor', icon: 'vscode', category: 'Development' },
      'sublime_text.exe': { name: 'Sublime Text', icon: 'default', category: 'Development' },
      'windowsterminal.exe': { name: 'Windows Terminal', icon: 'terminal', category: 'Development' },
      'wt.exe': { name: 'Windows Terminal', icon: 'terminal', category: 'Development' },
      'powershell.exe': { name: 'PowerShell', icon: 'terminal', category: 'Development' },
      'pwsh.exe': { name: 'PowerShell Core', icon: 'terminal', category: 'Development' },
      'cmd.exe': { name: 'Command Prompt', icon: 'terminal', category: 'Development' },
      'alacritty.exe': { name: 'Alacritty Terminal', icon: 'terminal', category: 'Development' },
      'wezterm-gui.exe': { name: 'WezTerm', icon: 'terminal', category: 'Development' },
      'git-bash.exe': { name: 'Git Bash', icon: 'terminal', category: 'Development' },
      'canva.exe': { name: 'Canva', icon: 'figma', category: 'Design' },
      'opera.exe': { name: 'Opera Browser', icon: 'chrome', category: 'Research & Tools' },
      'vivaldi.exe': { name: 'Vivaldi Browser', icon: 'chrome', category: 'Research & Tools' },
      'arc.exe': { name: 'Arc Browser', icon: 'brave', category: 'Research & Tools' },
      'outlook.exe': { name: 'Microsoft Outlook', icon: 'word', category: 'Communication' },
      'thunderbird.exe': { name: 'Mozilla Thunderbird', icon: 'default', category: 'Communication' },
      'skype.exe': { name: 'Skype', icon: 'teams', category: 'Communication' },
      'anydesk.exe': { name: 'AnyDesk Remote', icon: 'deskflow', category: 'Tools & Utilities' },
      'teamviewer.exe': { name: 'TeamViewer', icon: 'deskflow', category: 'Tools & Utilities' },
      'vlc.exe': { name: 'VLC Media Player', icon: 'spotify', category: 'Media & Audio' },
      'insomnia.exe': { name: 'Insomnia REST', icon: 'postman', category: 'Testing & API' },
      'python.exe': { name: 'Python Workload', icon: 'default', category: 'Development' },
      'py.exe': { name: 'Python Workload', icon: 'default', category: 'Development' },
      'node.exe': { name: 'Node.js Engine', icon: 'default', category: 'Development' },
      'deskflow.exe': { name: 'Deskflow', icon: 'deskflow', category: 'Tools & Utilities' },
      'deskflow-core.exe': { name: 'Deskflow', icon: 'deskflow', category: 'Tools & Utilities' },
      'brave.exe': { name: 'Brave Browser', icon: 'brave', category: 'Research & Tools' },
      'whatsapp.exe': { name: 'WhatsApp', icon: 'whatsapp', category: 'Communication' },
      'whatsapp.root.exe': { name: 'WhatsApp', icon: 'whatsapp', category: 'Communication' },
      'spotifylauncher.exe': { name: 'Spotify', icon: 'spotify', category: 'Media & Audio' },
      'spotify.exe': { name: 'Spotify', icon: 'spotify', category: 'Media & Audio' },
      'arduino ide.exe': { name: 'Arduino IDE', icon: 'arduino', category: 'Development' },
      'shotcut.exe': { name: 'Shotcut', icon: 'shotcut', category: 'Design & Media' },
      'code.exe': { name: 'VS Code', icon: 'vscode', category: 'Development' },
      'devenv.exe': { name: 'Visual Studio', icon: 'vstudio', category: 'Development' },
      'studio64.exe': { name: 'Android Studio', icon: 'android', category: 'Development' },
      'idea64.exe': { name: 'IntelliJ IDEA', icon: 'intellij', category: 'Development' },
      'pycharm64.exe': { name: 'PyCharm', icon: 'pycharm', category: 'Development' },
      'webstorm64.exe': { name: 'WebStorm', icon: 'webstorm', category: 'Development' },
      'chrome.exe': { name: 'Google Chrome', icon: 'chrome', category: 'Research & Tools' },
      'firefox.exe': { name: 'Mozilla Firefox', icon: 'firefox', category: 'Research & Tools' },
      'msedge.exe': { name: 'Microsoft Edge', icon: 'edge', category: 'Research & Tools' },
      'figma.exe': { name: 'Figma', icon: 'figma', category: 'Design' },
      'photoshop.exe': { name: 'Adobe Photoshop', icon: 'photoshop', category: 'Design' },
      'illustrator.exe': { name: 'Adobe Illustrator', icon: 'illustrator', category: 'Design' },
      'blender.exe': { name: 'Blender 3D', icon: 'blender', category: '3D & Engineering' },
      'notepad++.exe': { name: 'Notepad++', icon: 'notepadpp', category: 'Development' },
      'postman.exe': { name: 'Postman', icon: 'postman', category: 'Testing & API' },
      'docker desktop.exe': { name: 'Docker Desktop', icon: 'docker', category: 'DevOps & Containers' },
      'teams.exe': { name: 'Microsoft Teams', icon: 'teams', category: 'Communication' },
      'ms-teams.exe': { name: 'Microsoft Teams', icon: 'teams', category: 'Communication' },
      'slack.exe': { name: 'Slack', icon: 'slack', category: 'Communication' },
      'discord.exe': { name: 'Discord', icon: 'discord', category: 'Communication' },
      'telegram.exe': { name: 'Telegram', icon: 'telegram', category: 'Communication' },
      'zoom.exe': { name: 'Zoom', icon: 'zoom', category: 'Communication' },
      'winword.exe': { name: 'Microsoft Word', icon: 'word', category: 'Documentation' },
      'excel.exe': { name: 'Microsoft Excel', icon: 'excel', category: 'Documentation' },
      'powerpnt.exe': { name: 'PowerPoint', icon: 'powerpoint', category: 'Documentation' },
      'notion.exe': { name: 'Notion', icon: 'notion', category: 'Documentation' },
      'obsidian.exe': { name: 'Obsidian', icon: 'obsidian', category: 'Documentation' },
      'tableplus.exe': { name: 'TablePlus', icon: 'default', category: 'Database' },
      'dbeaver.exe': { name: 'DBeaver', icon: 'default', category: 'Database' }
    };

    exec('tasklist /fo csv /nh', { windowsHide: true }, (err, stdout) => {
      isScanningApps = false;
      if (err || !stdout) return resolve(cachedRunningApps);

      const lines = stdout.split('\r\n').filter(Boolean);
      const appMap = new Map();

      for (const line of lines) {
        const parts = line.split(',');
        if (!parts || parts.length < 2) continue;
        const rawExe = parts[0].replace(/^"|"$/g, '').toLowerCase().trim();

        if (TASKBAR_DESKTOP_APPS[rawExe]) {
          const meta = TASKBAR_DESKTOP_APPS[rawExe];
          if (!appMap.has(meta.name)) {
            appMap.set(meta.name, {
              appName: meta.name,
              exe: rawExe,
              icon: meta.icon,
              category: meta.category,
              title: meta.name
            });
          }
        }
      }

      cachedRunningApps = Array.from(appMap.values());
      lastRunningAppsScan = Date.now();
      resolve(cachedRunningApps);
    });
  });
}

ipcMain.handle('get-running-work-apps', async (event) => {
  if (!isTrustedSender(event)) return [];
  try {
    return await scanRunningApplications();
  } catch (_) {
    return [];
  }
});

ipcMain.handle('get-shift-integrity-status', async (event) => {
  if (!isTrustedSender(event)) return { monotonicUptime: 0, systemIdleSec: 0, timestamp: Date.now() };
  try {
    return {
      monotonicUptime: Math.floor(process.uptime()),
      systemIdleSec: powerMonitor.getSystemIdleTime(),
      timestamp: Date.now()
    };
  } catch (_) {
    return { monotonicUptime: 0, systemIdleSec: 0, timestamp: Date.now() };
  }
});

ipcMain.handle('get-system-idle-time', async (event) => {
  if (!isTrustedSender(event)) return 0;
  try {
    return powerMonitor.getSystemIdleTime();
  } catch (_) {
    return 0;
  }
});

// Native Desktop Notifications
ipcMain.on('show-native-notification', (event, payload) => {
  if (!isTrustedSender(event) || !payload || typeof payload !== 'object') return;
  const title = String(payload.title || 'REDDOT Workspace').slice(0, 120);
  const body = String(payload.body || '').slice(0, 300);

  if (Notification.isSupported()) {
    const iconPath = path.join(__dirname, 'wallpaper-ui', 'assets', 'id-card.png');
    const notification = new Notification({
      title: title,
      body: body,
      icon: iconPath,
      silent: false
    });
    notification.on('click', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.setSkipTaskbar(false);
        if (mainWindow.isMinimized()) mainWindow.restore();
        if (!mainWindow.isVisible()) mainWindow.show();
        mainWindow.show();
        mainWindow.focus();
        mainWindow.moveTop();
        mainWindow.setAlwaysOnTop(true);
        setTimeout(() => {
          if (mainWindow && !mainWindow.isDestroyed()) mainWindow.setAlwaysOnTop(false);
        }, 800);
        mainWindow.webContents.send('navigate-notification', payload);
      }
    });
    notification.show();
  }
});

// Incoming Call Native Alert & Window Focus
ipcMain.on('incoming-call-alert', (event, payload) => {
  if (!isTrustedSender(event) || !payload || typeof payload !== 'object') return;
  const callerName = String(payload.callerName || 'Teammate').slice(0, 100);
  const callType = String(payload.callType || 'Video').toUpperCase();

  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    if (!mainWindow.isVisible()) mainWindow.show();
    mainWindow.focus();
    mainWindow.moveTop();
    mainWindow.flashFrame(true);
  }

  if (Notification.isSupported()) {
    const iconPath = path.join(__dirname, 'wallpaper-ui', 'assets', 'id-card.png');
    const notification = new Notification({
      title: `📞 Incoming ${callType} Call`,
      body: `${callerName} is calling you on REDDOT Workstation. Click to answer.`,
      icon: iconPath,
      silent: false
    });
    notification.on('click', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.setSkipTaskbar(false);
        if (mainWindow.isMinimized()) mainWindow.restore();
        if (!mainWindow.isVisible()) mainWindow.show();
        mainWindow.focus();
        mainWindow.moveTop();
        mainWindow.flashFrame(false);
        mainWindow.setAlwaysOnTop(true);
        setTimeout(() => {
          if (mainWindow && !mainWindow.isDestroyed()) mainWindow.setAlwaysOnTop(false);
        }, 800);
        mainWindow.webContents.send('open-tab', 'chat');
        mainWindow.webContents.send('navigate-notification', { type: 'call', targetTab: 'chat', callerName });
      }
    });
    notification.show();
  }
});

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (!mainWindow.isVisible()) mainWindow.show();
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.maximize();
      mainWindow.show();
      mainWindow.focus();
      mainWindow.moveTop();
      mainWindow.setAlwaysOnTop(true);
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.setAlwaysOnTop(false);
        }
      }, 1000);
    }
  });

  app.whenReady().then(async () => {
    // Completely remove default application top menu bar (File, Edit, View, Window, Help)
    try {
      Menu.setApplicationMenu(null);
    } catch (_) {}

    // Allow WebRTC audio/video call media permissions automatically (including microphone for voice messages)
    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
      // Grant all permissions including microphone, camera, and media capture
      callback(true);
    });

    // Explicitly allow all permission checks (required for getUserMedia in Electron)
    session.defaultSession.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
      // Allow microphone and all media permissions
      return true;
    });

    // Strip Referer and Origin on Google user content / Drive requests to bypass 429/403 anti-hotlink blocks
    // Ensure Google OAuth never sees Electron user-agent header
    session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
      const url = details.url || '';
      if (url.includes('googleusercontent.com') || url.includes('drive.google.com')) {
        delete details.requestHeaders['Referer'];
        delete details.requestHeaders['Origin'];
      }
      if (details.requestHeaders['User-Agent'] && details.requestHeaders['User-Agent'].includes('Electron')) {
        details.requestHeaders['User-Agent'] = CHROME_USER_AGENT;
      }
      callback({ cancel: false, requestHeaders: details.requestHeaders });
    });

    // Restrictive Content Security Policy for Firebase, Google Auth, & Local loopback
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            "default-src 'self' http://127.0.0.1:* http://localhost:*; script-src 'self' 'unsafe-inline' http://127.0.0.1:* http://localhost:* https://www.gstatic.com https://apis.google.com https://accounts.google.com https://meet.jit.si https://*.8x8.vc; style-src 'self' 'unsafe-inline' http://127.0.0.1:* http://localhost:* https://fonts.googleapis.com; font-src 'self' http://127.0.0.1:* http://localhost:* https://fonts.gstatic.com data:; img-src 'self' http://127.0.0.1:* http://localhost:* data: blob: https:; media-src 'self' http://127.0.0.1:* http://localhost:* data: blob: https:; connect-src 'self' http://127.0.0.1:* http://localhost:* https://*.firebaseio.com wss://*.firebaseio.com https://*.googleapis.com https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://accounts.google.com https://*.google.com https://meet.jit.si https://*.jit.si https://*.8x8.vc wss://*.jit.si; object-src 'none'; base-uri 'none'; frame-src 'self' http://127.0.0.1:* http://localhost:* https://*.firebaseapp.com https://accounts.google.com https://*.google.com https://meet.jit.si https://*.jit.si https://*.8x8.vc;"
          ]
        }
      });
    });

    try {
      await startBackendService();
    } catch (e) {
      console.warn('[BACKEND] Startup note:', e);
    }

    try {
      await startLocalServer();
    } catch (e) {
      console.warn('[SERVER] Local server fallback to file protocol:', e);
    }

    createWallpaperWindow();
    createTrayIcon();

    // Power and Presence Monitoring
    powerMonitor.on('lock-screen', () => {
      mainWindow?.webContents.send('power-state-changed', 'locked');
      mainWindow?.webContents.send('set-power-profile', 'eco');
    });

    powerMonitor.on('unlock-screen', () => {
      mainWindow?.webContents.send('power-state-changed', 'unlocked');
      mainWindow?.webContents.send('set-power-profile', 'balanced');
    });

    powerMonitor.on('suspend', () => {
      mainWindow?.webContents.send('power-state-changed', 'suspend');
      mainWindow?.webContents.send('set-power-profile', 'eco');
    });

    powerMonitor.on('resume', () => {
      mainWindow?.webContents.send('power-state-changed', 'resume');
      mainWindow?.webContents.send('set-power-profile', 'balanced');
    });
  });

  app.on('before-quit', () => {
    if (backendProcess) {
      try { backendProcess.kill(); } catch (_) {}
      backendProcess = null;
    }

    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow._clockedOutOnClose) {
      mainWindow._clockedOutOnClose = true;
      try {
        mainWindow.webContents.executeJavaScript(`
          if (typeof autoPerformExitClockOut === 'function') {
            autoPerformExitClockOut();
          }
        `);
      } catch (_) {}
    }
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}
