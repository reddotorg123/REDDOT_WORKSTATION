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

let mainWindow = null;
let tray = null;
let metricsInterval = null;
let localServer = null;
let localServerPort = 0;

// Local loopback server to serve UI with http:// protocol for full Firebase Web Auth compliance
function startLocalServer() {
  return new Promise((resolve, reject) => {
    localServer = http.createServer((req, res) => {
      let reqPath = req.url.split('?')[0];
      if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
      const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
      let filePath = path.join(__dirname, 'wallpaper-ui', safePath);

      if (!fs.existsSync(filePath) && (safePath === '\\version.json' || safePath === '/version.json' || safePath === 'version.json')) {
        filePath = path.join(__dirname, 'version.json');
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
        '.ttf': 'font/ttf'
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

// App settings
const config = {
  theme: 'obsidian',
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
      return JSON.parse(raw);
    } catch (e) {
      console.warn('[DB] Could not parse disk database, starting fresh:', e);
    }
  }
  return null;
}

function saveDatabaseToDisk(data) {
  try {
    const filePath = getDbPath();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('[DB] Write error:', e);
    return false;
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
    autoStart: getAutoStartStatus()
  };

  if (tray) {
    try {
      tray.setToolTip(`REDDOT OS • CPU: ${cpuLoad}% RAM: ${usedMemGB}GB`);
    } catch (_) {}
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
    frame: true,
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
      sandbox: true,
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
    mainWindow.loadFile(path.join(__dirname, 'wallpaper-ui', 'index.html'));
  }

  const showAndActivate = () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
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
  };

  mainWindow.once('ready-to-show', () => {
    showAndActivate();
    config.autoStart = getAutoStartStatus();
    sampleSystemMetrics();
    if (!metricsInterval) metricsInterval = setInterval(sampleSystemMetrics, 1500);
  });

  mainWindow.webContents.once('did-finish-load', () => {
    showAndActivate();
  });

  setTimeout(showAndActivate, 800);

  mainWindow.on('closed', () => {
    if (metricsInterval) clearInterval(metricsInterval);
    mainWindow = null;
  });
}

function createTrayIcon() {
  try {
    const iconPath = path.join(__dirname, 'wallpaper-ui', 'assets', 'id-card.png');
    let icon = nativeImage.createFromPath(iconPath);
    if (icon.isEmpty()) {
      icon = nativeImage.createEmpty();
    }
    icon = icon.resize({ width: 16, height: 16 });

    tray = new Tray(icon);
    tray.setToolTip('REDDOT Workstation OS');

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

// Database Diagnostics Runner
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
ipcMain.handle('open-external', async (event, url) => {
  if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
  if (typeof url === 'string' && (url.startsWith('https://') || url.startsWith('http://'))) {
    shell.openExternal(url);
    return true;
  }
  return false;
});

// --- OVER-THE-AIR (OTA) CLOUD UPDATER ENGINE ---
const DEFAULT_OTA_MANIFEST_URL = 'https://firestore.googleapis.com/v1/projects/reddot-workspace/databases/(default)/documents/organizations/reddot/system/otaRelease?key=AIzaSyBpjenDcXDREseIDv5NfgpDo2fAk_gUhdk';
const CLOUD_BUNDLE_URL = 'https://firestore.googleapis.com/v1/projects/reddot-workspace/databases/(default)/documents/organizations/reddot/ota/bundle?key=AIzaSyBpjenDcXDREseIDv5NfgpDo2fAk_gUhdk';
let downloadedUpdatePath = null;

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

ipcMain.handle('ota-get-info', async (event) => {
  if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
  let ver = '2.5.3';
  try {
    const vJsonPath = path.join(__dirname, 'version.json');
    if (fs.existsSync(vJsonPath)) {
      const vData = JSON.parse(fs.readFileSync(vJsonPath, 'utf8'));
      if (vData.version) ver = vData.version;
    } else {
      ver = app.getVersion() || '2.5.3';
    }
  } catch (_) {
    ver = app.getVersion() || '2.5.3';
  }
  return {
    version: ver,
    platform: process.platform,
    arch: process.arch,
    isPackaged: app.isPackaged,
    channel: 'portable',
    buildDate: '2026-09-05'
  };
});

ipcMain.handle('ota-check-update', async (event, customParam) => {
  if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
  let currentVersion = '2.5.3';
  try {
    const vJsonPath = path.join(__dirname, 'version.json');
    if (fs.existsSync(vJsonPath)) {
      const vData = JSON.parse(fs.readFileSync(vJsonPath, 'utf8'));
      if (vData.version) currentVersion = vData.version;
    } else {
      currentVersion = app.getVersion() || '2.5.3';
    }
  } catch (_) {
    currentVersion = app.getVersion() || '2.5.3';
  }

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
      throw new Error('Cloud OTA bundle is not available');
    }

    const fields = bundleDoc.fields;
    const remoteVersion = fields.version?.stringValue || '2.5.3';
    const wallpaperJs = fields.wallpaperJs?.stringValue;
    const firebaseServiceJs = fields.firebaseServiceJs?.stringValue;
    const styleCss = fields.styleCss?.stringValue;
    const indexHtml = fields.indexHtml?.stringValue;

    const uiDir = path.join(__dirname, 'wallpaper-ui');
    if (!fs.existsSync(uiDir)) fs.mkdirSync(uiDir, { recursive: true });

    const filesUpdated = [];
    if (wallpaperJs) {
      fs.writeFileSync(path.join(uiDir, 'wallpaper.js'), wallpaperJs, 'utf8');
      filesUpdated.push('wallpaper.js');
    }
    if (firebaseServiceJs) {
      fs.writeFileSync(path.join(uiDir, 'firebase-service.js'), firebaseServiceJs, 'utf8');
      filesUpdated.push('firebase-service.js');
    }
    if (styleCss) {
      fs.writeFileSync(path.join(uiDir, 'style.css'), styleCss, 'utf8');
      filesUpdated.push('style.css');
    }
    if (indexHtml) {
      fs.writeFileSync(path.join(uiDir, 'index.html'), indexHtml, 'utf8');
      filesUpdated.push('index.html');
    }

    // Update local version manifest
    const vJsonPath = path.join(__dirname, 'version.json');
    if (fs.existsSync(vJsonPath)) {
      try {
        const vData = JSON.parse(fs.readFileSync(vJsonPath, 'utf8'));
        vData.version = remoteVersion;
        if (fields.releaseDate?.stringValue) {
          vData.releaseDate = fields.releaseDate.stringValue;
        }
        if (fields.changelog?.arrayValue?.values) {
          vData.changelog = fields.changelog.arrayValue.values.map(v => v.stringValue);
        }
        fs.writeFileSync(vJsonPath, JSON.stringify(vData, null, 2), 'utf8');
        filesUpdated.push('version.json');
      } catch (_) {}
    }

    // Automatically reload the renderer window to mount updated code
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.reload();
      }
    }, 600);

    return { success: true, version: remoteVersion, filesUpdated };
  } catch (err) {
    console.error('[OTA] Hotpatch installation error:', err);
    throw err;
  }
});

ipcMain.handle('ota-download-update', async (event, downloadUrl) => {
  if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
  if (!downloadUrl || (!downloadUrl.startsWith('http://') && !downloadUrl.startsWith('https://'))) {
    throw new Error('Invalid download URL');
  }

  const updatesDir = path.join(app.getPath('temp'), 'reddot_updates');
  if (!fs.existsSync(updatesDir)) fs.mkdirSync(updatesDir, { recursive: true });

  const targetFile = path.join(updatesDir, `REDDOT-Workstation-OS-Update-${Date.now()}.exe`);
  const fileStream = fs.createWriteStream(targetFile);

  return new Promise((resolve, reject) => {
    const client = downloadUrl.startsWith('https:') ? https : http;
    const req = client.get(downloadUrl, { headers: { 'User-Agent': 'REDDOT-Workstation-OS' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchJson(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        fileStream.close();
        fs.unlinkSync(targetFile);
        return reject(new Error(`Download failed with HTTP status ${res.statusCode}`));
      }

      const totalBytes = parseInt(res.headers['content-length'] || '0', 10);
      let receivedBytes = 0;
      let lastProgressEmit = 0;

      res.on('data', (chunk) => {
        receivedBytes += chunk.length;
        fileStream.write(chunk);

        const now = Date.now();
        if (now - lastProgressEmit > 200 || receivedBytes === totalBytes) {
          lastProgressEmit = now;
          const percent = totalBytes > 0 ? Math.round((receivedBytes / totalBytes) * 100) : 0;
          mainWindow?.webContents.send('ota-download-progress', {
            percent,
            receivedBytes,
            totalBytes
          });
        }
      });

      res.on('end', () => {
        fileStream.end(() => {
          downloadedUpdatePath = targetFile;
          mainWindow?.webContents.send('ota-download-complete', {
            filePath: targetFile
          });
          resolve({ success: true, filePath: targetFile });
        });
      });
    });

    req.on('error', (err) => {
      fileStream.close();
      if (fs.existsSync(targetFile)) fs.unlinkSync(targetFile);
      reject(err);
    });
  });
});

ipcMain.handle('ota-install-update', async (event) => {
  if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
  if (!downloadedUpdatePath || !fs.existsSync(downloadedUpdatePath)) {
    throw new Error('No downloaded update package ready for installation');
  }

  try {
    const child = spawn(downloadedUpdatePath, ['/S'], {
      detached: true,
      stdio: 'ignore'
    });
    child.unref();

    setTimeout(() => {
      app.quit();
    }, 1000);

    return { success: true };
  } catch (err) {
    shell.openPath(downloadedUpdatePath);
    setTimeout(() => {
      app.quit();
    }, 1500);
    return { success: true };
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
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
        if (payload.targetTab) {
          mainWindow.webContents.send('open-tab', payload.targetTab);
        }
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

    // Allow WebRTC audio/video call media permissions automatically
    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
      if (['media', 'notifications', 'pointerLock', 'fullscreen', 'display-capture'].includes(permission)) {
        callback(true);
      } else {
        callback(true);
      }
    });

    // Strip Referer and Origin on Google user content / Drive requests to bypass 429/403 anti-hotlink blocks
    session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
      const url = details.url || '';
      if (url.includes('googleusercontent.com') || url.includes('drive.google.com')) {
        delete details.requestHeaders['Referer'];
        delete details.requestHeaders['Origin'];
      }
      callback({ cancel: false, requestHeaders: details.requestHeaders });
    });

    // Restrictive Content Security Policy for Firebase, Google Auth, & Local loopback
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            "default-src 'self' http://127.0.0.1:* http://localhost:*; script-src 'self' 'unsafe-inline' http://127.0.0.1:* http://localhost:* https://www.gstatic.com https://apis.google.com https://accounts.google.com https://meet.jit.si https://*.8x8.vc; style-src 'self' 'unsafe-inline' http://127.0.0.1:* http://localhost:* https://fonts.googleapis.com; font-src 'self' http://127.0.0.1:* http://localhost:* https://fonts.gstatic.com data:; img-src 'self' http://127.0.0.1:* http://localhost:* data: blob: https:; connect-src 'self' http://127.0.0.1:* http://localhost:* https://*.firebaseio.com wss://*.firebaseio.com https://*.googleapis.com https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://accounts.google.com https://*.google.com https://meet.jit.si https://*.jit.si https://*.8x8.vc wss://*.jit.si; object-src 'none'; base-uri 'none'; frame-src 'self' http://127.0.0.1:* http://localhost:* https://*.firebaseapp.com https://accounts.google.com https://*.google.com https://meet.jit.si https://*.jit.si https://*.8x8.vc;"
          ]
        }
      });
    });

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
      mainWindow?.webContents.send('power-state-changed', 'active');
      mainWindow?.webContents.send('set-power-profile', 'balanced');
    });

    powerMonitor.on('suspend', () => {
      mainWindow?.webContents.send('power-state-changed', 'away');
      mainWindow?.webContents.send('set-power-profile', 'eco');
    });

    powerMonitor.on('resume', () => {
      mainWindow?.webContents.send('power-state-changed', 'active');
      mainWindow?.webContents.send('set-power-profile', 'balanced');
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}
