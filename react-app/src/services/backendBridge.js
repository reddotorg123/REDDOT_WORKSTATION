/**
 * REDDOT WORKSTATION • PRIVATE ATTACHMENT & STORAGE BACKEND BRIDGE (Port 5050)
 * Connects React UI directly to the private attachment gateway & Google Drive bridge.
 * Never exposes credentials, Google Drive IDs, or tokens to the frontend.
 */

const BACKEND_BASE_URL = 'http://127.0.0.1:5050';

class BackendBridgeService {
  constructor() {
    this.baseUrl = BACKEND_BASE_URL;
    this.isOnline = false;
    this.cachedStatus = null;
    this.listeners = new Set();
  }

  // Subscribe to backend online/offline connectivity status
  onStatusChange(callback) {
    this.listeners.add(callback);
    callback({ online: this.isOnline, ...this.cachedStatus });
    return () => this.listeners.delete(callback);
  }

  notifyListeners(status) {
    this.cachedStatus = status;
    this.isOnline = !!status.online;
    this.listeners.forEach(cb => {
      try { cb({ online: this.isOnline, ...status }); } catch (_) {}
    });
  }

  /**
   * Health Check
   */
  async checkHealth() {
    // 1. If Electron IPC available, check via main process first
    if (typeof window !== 'undefined' && window.electronAPI?.getBackendStatus) {
      try {
        const ipcHealth = await window.electronAPI.getBackendStatus();
        if (ipcHealth && ipcHealth.online) {
          this.notifyListeners({ online: true, ...ipcHealth });
          return { online: true, ...ipcHealth };
        }
      } catch (_) {}
    }

    // 2. Direct HTTP health check fallback
    try {
      const res = await fetch(`${this.baseUrl}/api/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(2000)
      });
      if (res.ok) {
        const data = await res.json();
        this.notifyListeners({ online: true, ...data });
        return { online: true, ...data };
      }
    } catch (_) {}

    this.notifyListeners({ online: false, storageMode: 'Offline Vault' });
    return { online: false, storageMode: 'Offline Vault' };
  }

  /**
   * Storage Quota & Capacity Status
   */
  async getStorageStatus() {
    try {
      const res = await fetch(`${this.baseUrl}/api/storage/status`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(2500)
      });
      if (res.ok) return await res.json();
    } catch (_) {}
    return {
      status: 'offline',
      storageMode: 'Private Local Vault',
      totalFiles: 0,
      totalBytesUsedFormatted: '0.0 MB'
    };
  }

  /**
   * List all stored attachments / cloud files
   */
  async getAttachments() {
    // Check Electron IPC first
    if (typeof window !== 'undefined' && window.electronAPI?.fetchBackendAttachments) {
      try {
        const res = await window.electronAPI.fetchBackendAttachments();
        if (res && res.success && Array.isArray(res.attachments)) {
          return res.attachments;
        }
      } catch (_) {}
    }

    // Direct HTTP call
    try {
      const res = await fetch(`${this.baseUrl}/api/attachments`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.attachments)) {
          return data.attachments;
        }
      }
    } catch (e) {
      console.warn('[BACKEND_BRIDGE] Failed to fetch attachments:', e.message);
    }
    return [];
  }

  /**
   * Upload File via Native Dialog or HTML File Object
   */
  async uploadFile(fileOrOptions = {}, extra = {}) {
    // Case 1: If caller requests native file dialog in Electron
    if (fileOrOptions.useNativeDialog && typeof window !== 'undefined' && window.electronAPI?.selectAndUploadFile) {
      return await window.electronAPI.selectAndUploadFile(fileOrOptions);
    }

    // Case 2: Standard HTML File or Blob object
    const file = fileOrOptions instanceof File || fileOrOptions instanceof Blob ? fileOrOptions : fileOrOptions.file;
    if (!file) {
      // Fallback: If in Electron, prompt native open file dialog
      if (typeof window !== 'undefined' && window.electronAPI?.selectAndUploadFile) {
        return await window.electronAPI.selectAndUploadFile(extra);
      }
      throw new Error('No valid file provided for upload.');
    }

    const formData = new FormData();
    formData.append('file', file, file.name || 'attachment.dat');
    formData.append('channelId', extra.channelId || 'general');
    formData.append('uploaderId', extra.uploaderId || 'RD-EMP');

    const res = await fetch(`${this.baseUrl}/api/attachments/upload`, {
      method: 'POST',
      headers: {
        'x-reddot-user-id': extra.uploaderId || 'RD-EMP',
        'x-reddot-channel-id': extra.channelId || 'general'
      },
      body: formData
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `Upload failed with HTTP ${res.status}`);
    }

    return await res.json();
  }

  /**
   * Delete an Attachment
   */
  async deleteAttachment(attachmentId) {
    if (!attachmentId) return false;

    if (typeof window !== 'undefined' && window.electronAPI?.deleteBackendAttachment) {
      try {
        const ipcRes = await window.electronAPI.deleteBackendAttachment(attachmentId);
        if (ipcRes && ipcRes.success) return true;
      } catch (_) {}
    }

    try {
      const res = await fetch(`${this.baseUrl}/api/attachments/${encodeURIComponent(attachmentId)}`, {
        method: 'DELETE'
      });
      return res.ok;
    } catch (_) {
      return false;
    }
  }

  getDownloadUrl(attachmentId) {
    return `${this.baseUrl}/api/attachments/${encodeURIComponent(attachmentId)}/download`;
  }

  getPreviewUrl(attachmentId) {
    return `${this.baseUrl}/api/attachments/${encodeURIComponent(attachmentId)}/preview`;
  }
}

export const backendBridge = new BackendBridgeService();
