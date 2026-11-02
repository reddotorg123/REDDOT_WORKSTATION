/**
 * REDDOT WORKSTATION • ELECTRON IPC & NATIVE WORKSTATION BRIDGE
 * Full bidirectional integration connecting React UI with native Electron runtime,
 * Windows OS telemetry, taskbar scanner, database vault, and system tray.
 */

const STORAGE_KEY = 'reddot_workstation_data_v3';

export const electronBridge = {
  isElectron: () => typeof window !== 'undefined' && !!window.electronAPI,

  // ==========================================
  // Window Management Controls
  // ==========================================
  minimize: () => {
    if (window.electronAPI?.minimizeWindow) {
      window.electronAPI.minimizeWindow();
    } else {
      console.log('[BRIDGE] Minimize window');
    }
  },

  maximize: () => {
    if (window.electronAPI?.maximizeWindow) {
      window.electronAPI.maximizeWindow();
    } else {
      console.log('[BRIDGE] Maximize / Restore window');
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      } else {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    }
  },

  close: () => {
    if (window.electronAPI?.closeWindow) {
      window.electronAPI.closeWindow();
    } else {
      console.log('[BRIDGE] Close window');
      if (window.confirm('Close REDDOT WS?')) {
        window.close();
      }
    }
  },

  togglePinDesktop: async () => {
    if (window.electronAPI?.togglePinDesktop) {
      return await window.electronAPI.togglePinDesktop();
    }
    return false;
  },

  isPinnedDesktop: async () => {
    if (window.electronAPI?.isPinnedDesktop) {
      return await window.electronAPI.isPinnedDesktop();
    }
    return false;
  },

  onDesktopPinnedChanged: (callback) => {
    if (window.electronAPI?.onDesktopPinnedChanged) {
      return window.electronAPI.onDesktopPinnedChanged(callback);
    }
    return () => {};
  },

  // ==========================================
  // Native Database Vault & File Dialogs
  // ==========================================
  saveState: async (state) => {
    try {
      if (window.electronAPI?.dbSave) {
        await window.electronAPI.dbSave(state);
      }
      try {
        const serialized = JSON.stringify(state);
        // Only store in localStorage if smaller than 3.5MB to prevent QuotaExceededError
        if (serialized.length < 3.5 * 1024 * 1024) {
          localStorage.setItem(STORAGE_KEY, serialized);
        }
      } catch (error) {
        if (!window.electronAPI?.dbSave) throw error;
        console.warn('[STORAGE] Browser cache save failed; native database save completed:', error);
      }
      return true;
    } catch (error) {
      console.error('[STORAGE] Save state failed:', error);
      throw error;
    }
  },

  loadState: async () => {
    try {
      if (window.electronAPI?.dbLoad) {
        const nativeDb = await window.electronAPI.dbLoad();
        if (nativeDb && typeof nativeDb === 'object' && Object.keys(nativeDb).length > 0) {
          return nativeDb;
        }
      }
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (error) {
      console.warn('[STORAGE] Load state failed:', error);
    }
    return null;
  },

  selectPhoto: async () => {
    if (window.electronAPI?.dbSelectPhoto) {
      return await window.electronAPI.dbSelectPhoto();
    }
    return { canceled: true };
  },

  diagnostics: async () => {
    if (window.electronAPI?.dbDiagnostics) {
      return await window.electronAPI.dbDiagnostics();
    }
    return { ok: true, memory: 'browser-fallback' };
  },

  executeCommand: async (cmdStr) => {
    if (window.electronAPI?.executeTerminalCommand) {
      return await window.electronAPI.executeTerminalCommand(cmdStr);
    }
    return { success: true, stdout: `Simulated: ${cmdStr}`, stderr: '', exitCode: 0 };
  },

  // ==========================================
  // System Metrics & Native Telemetry
  // ==========================================
  onMetricsUpdate: (callback) => {
    if (window.electronAPI?.onMetricsUpdate) {
      return window.electronAPI.onMetricsUpdate(callback);
    }
    return () => {};
  },

  onPowerStateChanged: (callback) => {
    if (window.electronAPI?.onPowerStateChanged) {
      return window.electronAPI.onPowerStateChanged(callback);
    }
    return () => {};
  },

  cleanMemory: () => {
    if (window.electronAPI?.requestMemoryClean) {
      window.electronAPI.requestMemoryClean();
    } else {
      console.log('[BRIDGE] Memory clean requested');
    }
  },

  // ==========================================
  // System Tray Navigation & Commands
  // ==========================================
  onOpenTab: (callback) => {
    if (window.electronAPI?.onOpenTab) {
      return window.electronAPI.onOpenTab(callback);
    }
    return () => {};
  },

  onSetTheme: (callback) => {
    if (window.electronAPI?.onSetTheme) {
      return window.electronAPI.onSetTheme(callback);
    }
    return () => {};
  },

  onToggleClean: (callback) => {
    if (window.electronAPI?.onToggleClean) {
      return window.electronAPI.onToggleClean(callback);
    }
    return () => {};
  },

  // ==========================================
  // Auto-Start (Windows Open-at-Login)
  // ==========================================
  getAutoStart: async () => {
    if (window.electronAPI?.getAutoStart) {
      return await window.electronAPI.getAutoStart();
    }
    return false;
  },

  setAutoStart: async (enable) => {
    if (window.electronAPI?.setAutoStart) {
      return await window.electronAPI.setAutoStart(enable);
    }
    return false;
  },

  onAutoStartChanged: (callback) => {
    if (window.electronAPI?.onAutoStartChanged) {
      return window.electronAPI.onAutoStartChanged(callback);
    }
    return () => {};
  },

  // ==========================================
  // External URLs & File Operations
  // ==========================================
  openExternal: (url) => {
    if (window.electronAPI?.openExternal) {
      window.electronAPI.openExternal(url);
    } else if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  },

  saveFileDialog: async (payload) => {
    if (window.electronAPI?.saveFileDialog) {
      return await window.electronAPI.saveFileDialog(payload);
    }
    return { canceled: true };
  },

  // ==========================================
  // Running Desktop Applications & Telemetry
  // ==========================================
  getRunningWorkApps: async () => {
    if (window.electronAPI?.getRunningWorkApps) {
      return await window.electronAPI.getRunningWorkApps();
    }
    return [];
  },

  getShiftIntegrityStatus: async () => {
    if (window.electronAPI?.getShiftIntegrityStatus) {
      return await window.electronAPI.getShiftIntegrityStatus();
    }
    return { monotonicUptime: 0, systemIdleSec: 0, timestamp: Date.now() };
  },

  getSystemIdleTime: async () => {
    if (window.electronAPI?.getSystemIdleTime) {
      return await window.electronAPI.getSystemIdleTime();
    }
    return 0;
  },

  // ==========================================
  // Over-The-Air (OTA) Updates
  // ==========================================
  otaGetInfo: async () => {
    if (window.electronAPI?.otaGetInfo) {
      return await window.electronAPI.otaGetInfo();
    }
    return { version: '3.12.0', releaseDate: '2026-10-25' };
  },

  otaCheckUpdate: async (customUrl) => {
    if (window.electronAPI?.otaCheckUpdate) {
      return await window.electronAPI.otaCheckUpdate(customUrl);
    }
    return { updateAvailable: false, version: '3.12.0' };
  },

  // ==========================================
  // Notifications & Calls
  // ==========================================
  showNotification: (title, body) => {
    if (!title) return;
    
    // Silence routine UI button clicks completely
    const IGNORED_TITLES = new Set([
      'Member Profile',
      'Direct Chat',
      'Create Department',
      'Manage Roles',
      'Skills Library',
      'Email Client Opened',
      'Email Copied',
      'Copied',
      'Meeting',
      'Workshop',
      'Call Ended',
      'Floorplan Zoom',
      'Floorplan View',
      'Occupancy Layer',
      'Floor Switch',
      'Task Updated',
      'Schedule Event',
      'Department Selected',
      'Department Cleared',
      'Quick Action',
      'Memory Cleaned',
      'Task Assigned',
      'Member Added',
      'Profile Updated'
    ]);
    if (IGNORED_TITLES.has(title)) {
      return;
    }

    // Cooldown and deduplication
    const now = Date.now();
    const key = `${title}::${body || ''}`;
    if (!electronBridge._notifHistory) {
      electronBridge._notifHistory = { lastTime: 0, lastKey: '' };
    }
    if (electronBridge._notifHistory.lastKey === key && now - electronBridge._notifHistory.lastTime < 10000) {
      return;
    }
    if (now - electronBridge._notifHistory.lastTime < 3500) {
      return;
    }
    electronBridge._notifHistory.lastTime = now;
    electronBridge._notifHistory.lastKey = key;

    if (window.electronAPI?.showNotification) {
      window.electronAPI.showNotification({ title, body, silent: false });
    } else if (typeof Notification !== 'undefined') {
      try {
        if (Notification.permission === 'granted') {
          new Notification(title, { body, silent: false });
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              new Notification(title, { body, silent: false });
            }
          });
        }
      } catch {}
    }
  },

  openCallWindow: async (payload) => {
    if (window.electronAPI?.openCallWindow) {
      return await window.electronAPI.openCallWindow(payload);
    }
    if (payload?.url) {
      window.open(payload.url, '_blank');
    }
  },

  // ==========================================
  // Over-The-Air (OTA) Cloud Updates
  // ==========================================
  otaGetInfo: async () => {
    if (window.electronAPI?.otaGetInfo) {
      return await window.electronAPI.otaGetInfo();
    }
    return { version: '3.12.0', isHotpatched: false, isPackaged: false };
  },

  otaCheckUpdate: async (customUrl) => {
    if (window.electronAPI?.otaCheckUpdate) {
      return await window.electronAPI.otaCheckUpdate(customUrl);
    }
    return { success: true, hasUpdate: false, currentVersion: '3.12.0', latestVersion: '3.12.0' };
  },

  otaApplyHotpatch: async (bundleUrl) => {
    if (window.electronAPI?.otaApplyHotpatch) {
      return await window.electronAPI.otaApplyHotpatch(bundleUrl);
    }
    return { success: false, error: 'OTA unavailable in browser environment' };
  },

  otaRevertHotpatch: async () => {
    if (window.electronAPI?.otaRevertHotpatch) {
      return await window.electronAPI.otaRevertHotpatch();
    }
    return { success: false, error: 'OTA unavailable in browser environment' };
  },

  onOtaProgress: (callback) => {
    if (window.electronAPI?.onOtaProgress) {
      return window.electronAPI.onOtaProgress(callback);
    }
    return () => {};
  },

  // ==========================================
  // Screen Sharing & Desktop Capture
  // ==========================================
  getDesktopSources: async (options) => {
    if (window.electronAPI?.getDesktopSources) {
      return await window.electronAPI.getDesktopSources(options);
    }
    return [];
  }
};
