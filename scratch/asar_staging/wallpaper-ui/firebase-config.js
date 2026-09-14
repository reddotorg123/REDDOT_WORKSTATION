/**
 * ============================================================================
 * REDDOT WORKSTATION OS • PRODUCTION FIREBASE CONFIGURATION
 * Connected Project: reddot-workspace
 * ============================================================================
 */

(function () {
  'use strict';

  // Production Firebase Credentials generated via Firebase Console
  const DEFAULT_CONFIG = {
    apiKey: "AIzaSyBpjenDcXDREseIDv5NfgpDo2fAk_gUhdk",
    authDomain: "reddot-workspace.firebaseapp.com",
    projectId: "reddot-workspace",
    databaseURL: "",
    storageBucket: "reddot-workspace.firebasestorage.app",
    messagingSenderId: "346765054940",
    appId: "1:346765054940:web:f2feb5855e0131ac383519"
  };

  // Allow localStorage override for custom tenant deployments
  function getActiveConfig() {
    try {
      const stored = localStorage.getItem('reddot_firebase_config');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.apiKey && parsed.projectId) {
          return parsed;
        }
      }
    } catch (_) {}
    return DEFAULT_CONFIG;
  }

  window.REDDOT_FIREBASE_CONFIG = getActiveConfig();
})();
