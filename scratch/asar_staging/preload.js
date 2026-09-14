/**
 * ============================================================================
 * REDDOT WORKSTATION OS & LIVE WALLPAPER • ELECTRON PRELOAD SCRIPT
 * Minimal, sandboxed, allow-listed context bridge with native database IPC
 * ============================================================================
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Database IPC Bridge
  dbLoad: () => {
    return ipcRenderer.invoke('db-load');
  },
  dbSave: (data) => {
    return ipcRenderer.invoke('db-save', data);
  },
  dbSelectPhoto: () => {
    return ipcRenderer.invoke('db-select-photo');
  },
  dbDiagnostics: () => {
    return ipcRenderer.invoke('db-diagnostics');
  },

  // System Metrics & State
  onMetricsUpdate: (callback) => {
    if (typeof callback === 'function') {
      const listener = (_event, data) => {
        if (data && typeof data === 'object') callback(data);
      };
      ipcRenderer.on('system-metrics-update', listener);
      return () => ipcRenderer.removeListener('system-metrics-update', listener);
    }
  },
  onPowerStateChanged: (callback) => {
    if (typeof callback === 'function') {
      const listener = (_event, state) => {
        if (typeof state === 'string') callback(state);
      };
      ipcRenderer.on('power-state-changed', listener);
      return () => ipcRenderer.removeListener('power-state-changed', listener);
    }
  },
  onOpenTab: (callback) => {
    if (typeof callback === 'function') {
      const listener = (_event, tab) => {
        if (typeof tab === 'string') callback(tab);
      };
      ipcRenderer.on('open-tab', listener);
      return () => ipcRenderer.removeListener('open-tab', listener);
    }
  },
  onSetTheme: (callback) => {
    if (typeof callback === 'function') {
      const listener = (_event, theme) => {
        if (typeof theme === 'string') callback(theme);
      };
      ipcRenderer.on('set-theme', listener);
      return () => ipcRenderer.removeListener('set-theme', listener);
    }
  },
  onToggleClean: (callback) => {
    if (typeof callback === 'function') {
      const listener = () => callback();
      ipcRenderer.on('toggle-clean', listener);
      return () => ipcRenderer.removeListener('toggle-clean', listener);
    }
  },
  onAutoStartChanged: (callback) => {
    if (typeof callback === 'function') {
      const listener = (_event, status) => {
        if (typeof status === 'boolean') callback(status);
      };
      ipcRenderer.on('auto-start-changed', listener);
      return () => ipcRenderer.removeListener('auto-start-changed', listener);
    }
  },
  showNotification: (payload) => {
    if (payload && typeof payload === 'object') {
      ipcRenderer.send('show-native-notification', payload);
    }
  },
  requestMemoryClean: () => {
    ipcRenderer.send('request-memory-clean');
  },
  getAutoStart: () => {
    return ipcRenderer.invoke('get-auto-start');
  },
  setAutoStart: (enable) => {
    if (typeof enable !== 'boolean') return Promise.reject(new Error('Invalid argument type'));
    return ipcRenderer.invoke('set-auto-start', enable);
  },
  openExternal: (url) => {
    return ipcRenderer.invoke('open-external', url);
  },

  // Window Management Controls
  minimizeWindow: () => {
    ipcRenderer.send('window-minimize');
  },
  maximizeWindow: () => {
    ipcRenderer.send('window-maximize');
  },
  closeWindow: () => {
    ipcRenderer.send('window-close');
  },
  togglePinDesktop: () => {
    return ipcRenderer.invoke('window-toggle-pin');
  },
  isPinnedDesktop: () => {
    return ipcRenderer.invoke('window-is-pinned');
  },
  onDesktopPinnedChanged: (callback) => {
    if (typeof callback === 'function') {
      const listener = (_event, pinned) => callback(pinned);
      ipcRenderer.on('desktop-pinned-changed', listener);
      return () => ipcRenderer.removeListener('desktop-pinned-changed', listener);
    }
  },

  // Over-The-Air (OTA) Updating APIs
  otaGetInfo: () => {
    return ipcRenderer.invoke('ota-get-info');
  },
  otaCheckUpdate: (customUrl) => {
    return ipcRenderer.invoke('ota-check-update', customUrl);
  },
  otaDownloadUpdate: (downloadUrl) => {
    return ipcRenderer.invoke('ota-download-update', downloadUrl);
  },
  otaInstallUpdate: () => {
    return ipcRenderer.invoke('ota-install-update');
  },
  otaApplyHotpatch: () => {
    return ipcRenderer.invoke('ota-apply-hotpatch');
  },
  otaRevertHotpatch: () => {
    return ipcRenderer.invoke('ota-revert-hotpatch');
  },
  onOtaProgress: (callback) => {
    if (typeof callback === 'function') {
      const listener = (_event, progress) => callback(progress);
      ipcRenderer.on('ota-download-progress', listener);
      return () => ipcRenderer.removeListener('ota-download-progress', listener);
    }
  },
  onOtaComplete: (callback) => {
    if (typeof callback === 'function') {
      const listener = (_event, data) => callback(data);
      ipcRenderer.on('ota-download-complete', listener);
      return () => ipcRenderer.removeListener('ota-download-complete', listener);
    }
  }
});
