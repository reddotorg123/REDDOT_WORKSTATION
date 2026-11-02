import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
import { Topbar } from './components/Topbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { ErrorBoundary } from './components/ErrorBoundary';

// Dynamic Code Splitting for non-initial views and modals (slashes initial bundle by >60%)
const TasksView = lazy(() => import('./components/TasksView'));
const TeamView = lazy(() => import('./components/TeamView'));
const AttendanceView = lazy(() => import('./components/AttendanceView'));
const MessagesView = lazy(() => import('./components/MessagesView'));
const FilesCloudView = lazy(() => import('./components/FilesCloudView'));
const SettingsView = lazy(() => import('./components/SettingsView'));
const TerminalView = lazy(() => import('./components/TerminalView'));
const WorkspaceOsModal = lazy(() => import('./components/WorkspaceOsModal'));
const TerminalModal = lazy(() => import('./components/TerminalModal'));
const OmniboxModal = lazy(() => import('./components/OmniboxModal'));

import { AuthScreen } from './components/AuthScreen';
import { ApplyLeaveModal } from './components/ApplyLeaveModal';
import { StartupVideoScreen } from './components/StartupVideoScreen';

// Premium Skeletal Loading Screen Fallback
function ViewLoadingFallback() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
      padding: '24px',
      width: '100%',
      maxWidth: 1200,
      margin: '0 auto'
    }}>
      {/* Header Skeleton */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="skeleton-box skeleton-shimmer" style={{ width: 260, height: 28, borderRadius: 8 }} />
          <div className="skeleton-box skeleton-shimmer" style={{ width: 180, height: 16, borderRadius: 6 }} />
        </div>
        <div className="skeleton-box skeleton-shimmer" style={{ width: 140, height: 38, borderRadius: 8 }} />
      </div>

      {/* Hero / Cards Grid Skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <div className="skeleton-box skeleton-shimmer" style={{ height: 110, borderRadius: 12 }} />
        <div className="skeleton-box skeleton-shimmer" style={{ height: 110, borderRadius: 12 }} />
        <div className="skeleton-box skeleton-shimmer" style={{ height: 110, borderRadius: 12 }} />
        <div className="skeleton-box skeleton-shimmer" style={{ height: 110, borderRadius: 12 }} />
      </div>

      {/* Main Content Area Skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginTop: 8 }}>
        <div className="skeleton-box skeleton-shimmer" style={{ height: 340, borderRadius: 16 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="skeleton-box skeleton-shimmer" style={{ height: 100, borderRadius: 12 }} />
          <div className="skeleton-box skeleton-shimmer" style={{ height: 100, borderRadius: 12 }} />
          <div className="skeleton-box skeleton-shimmer" style={{ height: 110, borderRadius: 12 }} />
        </div>
      </div>
    </div>
  );
}

import { 
  INITIAL_TASKS, 
  INITIAL_TEAM, 
  INITIAL_ATTENDANCE, 
  INITIAL_CONVERSATIONS, 
  INITIAL_MESSAGES, 
  INITIAL_FILES,
  INITIAL_EVENTS
} from './data/mockData';
import { electronBridge } from './services/electronBridge';
import { firebaseBridge } from './services/firebaseBridge';
import { backendBridge } from './services/backendBridge';
import { databaseBridge } from './services/databaseBridge';

function mergeRealtimePresence(member, presence, snapshotReady) {
  if (!presence) {
    if (!snapshotReady) return member;
    return {
      ...member,
      presenceSource: 'rtdb',
      presenceState: 'offline',
      isOnline: false,
      status: String(member.status || '').toLowerCase() === 'resigned' ? member.status : 'Offline',
      lastSeenAt: 0,
      lastActive: 'Offline'
    };
  }
  const isOnline = String(presence.state || '').toLowerCase() === 'online' && presence.isOnline !== false;
  const lastSeenAt = Number(presence.lastSeenAt || 0);
  return {
    ...member,
    presenceSource: 'rtdb',
    presenceState: isOnline ? 'online' : 'offline',
    isOnline,
    status: String(member.status || '').toLowerCase() === 'resigned'
      ? member.status
      : isOnline ? 'Online' : 'Offline',
    lastSeenAt,
    lastActive: isOnline ? 'Active now' : (lastSeenAt ? databaseBridge.formatRelativeTime(lastSeenAt) : 'Offline')
  };
}

/**
 * Deduplicates tasks strictly by task ID to preserve all user tasks.
 */
function deduplicateTasksList(taskList) {
  if (!Array.isArray(taskList)) return [];
  const map = new Map();
  taskList.forEach(task => {
    if (!task) return;
    const key = String(task.id || task._id || '').trim();
    if (key) {
      if (!map.has(key)) {
        map.set(key, task);
      } else {
        const existing = map.get(key);
        map.set(key, { ...existing, ...task });
      }
    } else {
      map.set(`gen_${Math.random()}`, task);
    }
  });
  return Array.from(map.values());
}

export function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [theme, setTheme] = useState(() => localStorage.getItem('reddot_theme') || 'light');
  const [showStartupVideo, setShowStartupVideo] = useState(() => {
    try {
      return !sessionStorage.getItem('reddot_startup_video_played');
    } catch {
      return false;
    }
  });

  // Real User Authentication State
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authResolved, setAuthResolved] = useState(false);



  // Workspace Data States
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [teamMembers, setTeamMembers] = useState(INITIAL_TEAM);
  const [attendance, setAttendance] = useState(INITIAL_ATTENDANCE);
  const [punchLogs, setPunchLogs] = useState([]);
  const [attendanceHistoryLoaded, setAttendanceHistoryLoaded] = useState(false);
  const [leaves, setLeaves] = useState([]);
  const [conversations, setConversations] = useState(INITIAL_CONVERSATIONS);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [files, setFiles] = useState(INITIAL_FILES);
  const [userProfile, setUserProfile] = useState(() => {
    return {
      name: 'Team Member',
      role: 'MEMBER',
      email: '',
      avatar: ''
    };
  });

  // Apply Leave Modal State
  const [isApplyLeaveOpen, setIsApplyLeaveOpen] = useState(false);

  // Sync active user to firebase bridge so dynamic messages and presence are accurate
  useEffect(() => {
    if (firebaseBridge && firebaseBridge.setActiveUser) {
      firebaseBridge.setActiveUser(isAuthenticated ? currentUser : null);
    }
  }, [currentUser, isAuthenticated]);

  // Notifications
  const [notifications] = useState([
    { id: 1, title: 'Sprint 14 Active', body: '4 days remaining for Sprint 14 cycle.', time: '10m ago', read: false },
    { id: 2, title: 'Real-time Gateway Active', body: 'Connected to Firestore Mesh and Port 5050 Attachment Service.', time: 'Just now', read: true }
  ]);

  // Modals & Overlays
  const [isOmniboxOpen, setIsOmniboxOpen] = useState(false);
  const [isWorkspaceOsOpen, setIsWorkspaceOsOpen] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);

  // Native Electron & Telemetry States
  const [metrics, setMetrics] = useState({
    cpuLoad: 8,
    cpuModel: 'System Processor',
    cpuCores: 8,
    usedMemGB: '6.4',
    totalMemGB: '16.0',
    memUsagePercent: 40,
    appMemMB: 85,
    healthScore: 98,
    runningApps: [],
    platform: 'Windows'
  });
  const [isDesktopPinned, setIsDesktopPinned] = useState(false);

  // Work Timer & Productive Tracking State
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [productiveSeconds, setProductiveSeconds] = useState(0);
  const [isAutoBreak, setIsAutoBreak] = useState(false);
  const [idleSeconds, setIdleSeconds] = useState(0);
  const [timerStartTime, setTimerStartTime] = useState('--:-- (Off Duty)');
  const [timerExpectedEnd, setTimerExpectedEnd] = useState('--:-- (Standby)');
  const autoClockInTriggeredRef = useRef(null);
  const livePresenceRef = useRef({});
  const livePresenceReadyRef = useRef(false);

  // Load real workspace database from local disk vault immediately on startup
  useEffect(() => {
    async function initDatabase() {
      try {
        const db = await databaseBridge.loadWorkspaceDatabase();
        if (db) {
          if (Array.isArray(db.teamMembers) && db.teamMembers.length > 0) {
            const now = Date.now();
            const normalized = db.teamMembers.map(m => {
              const lastSeen = Number(m.lastSeenAt || 0);
              const isTrulyOnline = (
                (m.presenceState === 'online' || m.status === 'Online' || m.isOnline) &&
                m.status !== 'OFFLINE' &&
                m.status !== 'Offline' &&
                lastSeen > 0 &&
                (now - lastSeen) < 150000
              );
              return {
                ...m,
                status: isTrulyOnline ? 'Online' : 'Offline',
                isOnline: isTrulyOnline,
                lastActive: isTrulyOnline ? 'Active now' : (m.lastSeenAt ? databaseBridge.formatRelativeTime(m.lastSeenAt) : 'Offline')
              };
            });
            setTeamMembers(normalized);
          }
          if (Array.isArray(db.tasks) && db.tasks.length > 0) {
            setTasks(db.tasks);
          }
          if (Array.isArray(db.events) && db.events.length > 0) {
            setEvents(db.events);
          }
          if (Array.isArray(db.attendance) && db.attendance.length > 0) {
            setAttendance(db.attendance);
          }
          if (Array.isArray(db.punchLogs) && db.punchLogs.length > 0) {
            setPunchLogs(db.punchLogs);
          }
          if (Array.isArray(db.leaves) && db.leaves.length > 0) {
            setLeaves(db.leaves);
          } else if (Array.isArray(db.leaveRequests) && db.leaveRequests.length > 0) {
            setLeaves(db.leaveRequests);
          }
          if (Array.isArray(db.conversations) && db.conversations.length > 0) {
            setConversations(db.conversations);
          }
          if (db.messages && Object.keys(db.messages).length > 0) {
            setMessages(db.messages);
          }
        }
      } catch (err) {
        console.warn('[APP] Error loading initial workspace database:', err);
      }
    }
    initDatabase();
  }, [currentUser]);

  // Native Electron IPC Subscriptions (Metrics, Tray Tabs, Desktop Pin)
  useEffect(() => {
    const unsubMetrics = electronBridge.onMetricsUpdate((data) => {
      if (data && typeof data === 'object') {
        setMetrics(prev => ({ ...prev, ...data }));
      }
    });

    const unsubTrayTab = electronBridge.onOpenTab((tab) => {
      if (!tab) return;
      const tabMap = {
        'workers': 'team',
        'timesheets': 'attendance',
        'chat': 'messages',
        'database': 'files',
        'telemetry': 'dashboard',
        'wallpapers': 'settings'
      };
      setCurrentTab(tabMap[tab] || tab);
    });

    const unsubPinned = electronBridge.onDesktopPinnedChanged((pinned) => {
      setIsDesktopPinned(!!pinned);
    });

    electronBridge.isPinnedDesktop().then(pinned => {
      setIsDesktopPinned(!!pinned);
    }).catch(() => {});

    return () => {
      if (typeof unsubMetrics === 'function') unsubMetrics();
      if (typeof unsubTrayTab === 'function') unsubTrayTab();
      if (typeof unsubPinned === 'function') unsubPinned();
    };
  }, []);

  // Firebase Auth is the only source of authenticated session state.
  useEffect(() => {
    const unsubscribe = firebaseBridge.onAuthStateChanged((profile) => {
      setAuthResolved(true);
      if (profile && profile.name) {
        setUserProfile(profile);
        setCurrentUser(profile);
        setIsAuthenticated(true);
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
        setUserProfile({ name: 'Team Member', role: 'MEMBER', email: '', avatar: '' });
      }
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Start protected workspace listeners only after Firebase confirms a session.
  useEffect(() => {
    if (!isAuthenticated) return;
    const unsubMembers = firebaseBridge.subscribeMembers((cloudMembers) => {
      if (cloudMembers && cloudMembers.length > 0) {
        // Deduplicate and merge with local members, strictly omitting fake mock accounts
        setTeamMembers(prev => {
          const map = new Map();
          // First add previous (filtering out fake mock IDs)
          prev.forEach(m => {
            const email = (m.email || '').toLowerCase().trim();
            const id = (m.id || m.uid || '').trim();
            if (email.endsWith('@reddot.com') || id === 'RD-GUEST' || id === '01' || id === '02' || id === '03' || id === '04') return;
            const key = (m.email || m.name || '').toLowerCase();
            map.set(key, m);
          });
          // Update with cloud members
          cloudMembers.forEach(m => {
            const email = (m.email || '').toLowerCase().trim();
            const id = (m.id || m.uid || '').trim();
            if (email.endsWith('@reddot.com') || id === 'RD-GUEST' || id === '01' || id === '02' || id === '03' || id === '04') return;
            const key = (m.email || m.name || '').toLowerCase();
            const existing = map.get(key);

            const lastSeen = Number(m.lastSeenAt || 0);
            const isTrulyOnline = (
              (m.status === 'Online' || m.status === 'DUTY_ON' || m.isOnline) &&
              m.status !== 'OFFLINE' &&
              m.status !== 'Offline' &&
              m.status !== 'DUTY_OFF' &&
              m.presenceState !== 'offline' &&
              lastSeen > 0 &&
              (Date.now() - lastSeen) < 150000
            );

            const mergedMember = {
              ...existing,
              ...m,
              status: isTrulyOnline ? 'Online' : 'Offline',
              isOnline: isTrulyOnline,
              lastActive: isTrulyOnline ? 'Active now' : (m.lastSeenAt ? databaseBridge.formatRelativeTime(m.lastSeenAt) : 'Offline')
            };
            const livePresence = livePresenceRef.current[m.uid || m.id];
            map.set(key, mergeRealtimePresence(mergedMember, livePresence, livePresenceReadyRef.current));
          });
          const mergedMembers = Array.from(map.values());
          databaseBridge.updateMembers(mergedMembers);
          return mergedMembers;
        });
      }
    });

    const unsubTasks = firebaseBridge.subscribeTasks((cloudTasks) => {
      if (cloudTasks && cloudTasks.length > 0) {
        setTasks(prev => {
          const taskMap = new Map();
          // Seed with existing local tasks (so disk tasks are never lost)
          (prev || []).forEach(t => {
            if (t && t.id) taskMap.set(t.id, t);
          });
          cloudTasks.forEach(t => {
            if (t && t.id) {
              const existing = taskMap.get(t.id);
              taskMap.set(t.id, existing ? { ...existing, ...t } : t);
            }
          });
          const merged = Array.from(taskMap.values());
          databaseBridge.updateTasks(merged);
          return merged;
        });
      }
    });

    const unsubPunches = firebaseBridge.subscribePunchLogs((cloudPunches) => {
      if (!Array.isArray(cloudPunches)) return;
      setAttendanceHistoryLoaded(true);
      const mergePunches = prev => {
        const byId = new Map((prev || []).filter(punch => punch?.id).map(punch => [punch.id, punch]));
        cloudPunches.forEach(punch => {
          if (punch?.id) byId.set(punch.id, { ...byId.get(punch.id), ...punch, cloudSynced: true });
        });
        return Array.from(byId.values()).sort((a, b) => (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0));
      };
      setPunchLogs(mergePunches);
      setAttendance(mergePunches);
    });

    const unsubChannels = firebaseBridge.subscribeChannels((cloudChannels) => {
      if (cloudChannels && cloudChannels.length > 0) {
        setConversations(prev => {
          // Keep existing Direct Messages while syncing channels from cloud
          const directMsgs = prev.filter(c => !c.isGroup);
          const channelMap = new Map();
          cloudChannels.forEach(c => channelMap.set(c.id, c));
          directMsgs.forEach(d => {
            if (!channelMap.has(d.id)) channelMap.set(d.id, d);
          });
          return Array.from(channelMap.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        });
      }
    });

    const unsubPresence = firebaseBridge.subscribePresence(presenceMap => {
      livePresenceRef.current = presenceMap && typeof presenceMap === 'object' ? presenceMap : {};
      livePresenceReadyRef.current = true;
      setTeamMembers(previous => previous.map(member =>
        mergeRealtimePresence(member, livePresenceRef.current[member.uid || member.id], true)
      ));
    });

    return () => {
      if (typeof unsubMembers === 'function') unsubMembers();
      if (typeof unsubTasks === 'function') unsubTasks();
      if (typeof unsubPunches === 'function') unsubPunches();
      if (typeof unsubChannels === 'function') unsubChannels();
      if (typeof unsubPresence === 'function') unsubPresence();
      livePresenceRef.current = {};
      livePresenceReadyRef.current = false;
    };
  }, [isAuthenticated, currentUser?.email]);

  // Live Attachment Backend Gateway & Chat Messages File Sync
  useEffect(() => {
    let isMounted = true;
    async function syncBackendData() {
      try {
        await backendBridge.checkHealth().catch(() => {});
        const serverAttachments = await backendBridge.getAttachments().catch(() => []);
        const workspaceFiles = await databaseBridge.getWorkspaceFiles().catch(() => []);

        if (isMounted) {
          const fileMap = new Map();

          // 1. Existing local files
          if (Array.isArray(workspaceFiles)) {
            workspaceFiles.forEach(f => {
              if (f && (f.name || f.id)) fileMap.set(f.name || f.id, f);
            });
          }

          // 2. Google Drive & Backend Gateway Attachments
          if (Array.isArray(serverAttachments)) {
            serverAttachments.forEach(a => {
              if (!a || (!a.name && !a.id)) return;
              const key = a.name || a.id;
              fileMap.set(key, {
                id: a.id,
                name: a.name,
                type: a.isImage ? 'Image' : (a.name?.endsWith('.pdf') ? 'PDF' : 'Document'),
                size: typeof a.size === 'number' ? (a.size > 1048576 ? `${(a.size / 1048576).toFixed(1)} MB` : `${Math.round(a.size / 1024)} KB`) : (a.size || '1.0 MB'),
                modified: a.createdAt ? new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today',
                downloadUrl: backendBridge.getDownloadUrl(a.id),
                previewUrl: backendBridge.getPreviewUrl(a.id),
                dataUrl: a.dataUrl || null,
                isImage: a.isImage
              });
            });
          }

          // 3. Attachments from all Chat Messages (ensures shared images appear in Files & Cloud)
          if (messages && typeof messages === 'object') {
            Object.keys(messages).forEach(chanId => {
              const chanMsgs = messages[chanId] || [];
              if (Array.isArray(chanMsgs)) {
                chanMsgs.forEach(msg => {
                  const attachList = (msg.attachments && Array.isArray(msg.attachments) && msg.attachments.length > 0)
                    ? msg.attachments
                    : (msg.attachment ? [msg.attachment] : []);

                  attachList.forEach(a => {
                    if (!a || (!a.name && !a.id && !a.url && !a.dataUrl)) return;
                    const key = a.name || a.id || a.url;
                    if (!fileMap.has(key)) {
                      const ext = (a.name ? a.name.split('.').pop() : '').toLowerCase();
                      const isImg = a.isImage === true || 
                        Boolean(a.dataUrl) ||
                        (a.mimeType && a.mimeType.startsWith('image/')) ||
                        (a.type && String(a.type).toLowerCase().includes('image')) ||
                        ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif', 'bmp'].includes(ext);
                      const isPdf = ext === 'pdf' || (a.type && String(a.type).toLowerCase().includes('pdf'));

                      let fType = 'Document';
                      if (isImg) fType = 'Image';
                      else if (isPdf) fType = 'PDF';
                      else if (['zip', 'rar', 'tar', '7z'].includes(ext)) fType = 'Archive';

                      let fSize = '1.0 MB';
                      if (typeof a.size === 'number') {
                        fSize = a.size > 1048576 ? `${(a.size / 1048576).toFixed(1)} MB` : `${Math.round(a.size / 1024)} KB`;
                      } else if (a.size) {
                        fSize = String(a.size);
                      }

                      const createdAt = a.createdAt || msg.createdAt || msg.timestamp || Date.now();
                      fileMap.set(key, {
                        id: a.id || key,
                        name: a.name || key,
                        type: fType,
                        size: fSize,
                        modified: new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                        downloadUrl: a.downloadUrl || a.url || a.dataUrl || (a.id ? backendBridge.getDownloadUrl(a.id) : null),
                        previewUrl: a.previewUrl || a.url || a.dataUrl || (a.id ? backendBridge.getPreviewUrl(a.id) : null),
                        dataUrl: a.dataUrl || null,
                        isImage: isImg
                      });
                    }
                  });
                });
              }
            });
          }

          if (fileMap.size > 0) {
            const newFiles = Array.from(fileMap.values());
            setFiles(prev => {
              if (prev.length === newFiles.length && prev.every((f, i) => f.id === newFiles[i]?.id && f.size === newFiles[i]?.size)) {
                return prev;
              }
              return newFiles;
            });
          }
        }
      } catch (err) {
        console.warn('[BACKEND_SYNC] Note:', err.message);
      }
    }
    syncBackendData();
    const interval = setInterval(syncBackendData, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [messages]);

  // Load persistent database from local vault on startup via databaseBridge
  useEffect(() => {
    async function init() {
      try {
        const dbData = await databaseBridge.loadWorkspaceDatabase();
        if (dbData) {
          if (Array.isArray(dbData.tasks) && dbData.tasks.length > 0) setTasks(prev => prev.length >= dbData.tasks.length ? prev : dbData.tasks);
          if (Array.isArray(dbData.events) && dbData.events.length > 0) setEvents(prev => prev.length >= dbData.events.length ? prev : dbData.events);
          if (Array.isArray(dbData.teamMembers) && dbData.teamMembers.length > 0) setTeamMembers(prev => prev.length > 0 ? prev : dbData.teamMembers);
          if (Array.isArray(dbData.conversations) && dbData.conversations.length > 0) setConversations(prev => prev.length > 0 ? prev : dbData.conversations);
          if (Array.isArray(dbData.attendance) && dbData.attendance.length > 0) setAttendance(prev => prev.length > 0 ? prev : dbData.attendance);
          if (Array.isArray(dbData.punchLogs) && dbData.punchLogs.length > 0) setPunchLogs(prev => prev.length > 0 ? prev : dbData.punchLogs);
          if (dbData.messages && typeof dbData.messages === 'object' && Object.keys(dbData.messages).length > 0) setMessages(prev => Object.keys(prev).length > 0 ? prev : dbData.messages);
        }
        const initialFiles = await databaseBridge.getWorkspaceFiles();
        if (Array.isArray(initialFiles) && initialFiles.length > 0) {
          setFiles(initialFiles);
        }
      } catch (err) {
        console.warn('[DB_INIT] Error loading from persistent vault:', err);
      }
      const savedTheme = localStorage.getItem('reddot_theme') || 'light';
      setTheme(savedTheme);
    }
    init();
  }, []);

  // Sync theme with HTML root attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Global hotkeys (Ctrl+K for Omnibox)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOmniboxOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Format timer as HH:MM:SS
  const formatTimerDigits = (totalSec) => {
    const s = Math.max(0, Number(totalSec) || 0);
    const hours = Math.floor(s / 3600);
    const minutes = Math.floor((s % 3600) / 60);
    const seconds = s % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const recordAttendancePunch = useCallback(async (action, details = {}) => {
    if (!isAuthenticated || !currentUser?.uid) {
      console.error('[ATTENDANCE] Refusing to record a punch without an authenticated Firebase user.');
      return null;
    }

    const now = new Date();
    const timestamp = Date.now();
    const punch = {
      id: details.id || `punch_${window.crypto?.randomUUID?.() || `${timestamp}_${Math.random().toString(36).slice(2)}`}`,
      uid: currentUser.uid,
      workerId: details.workerId || currentUser.id || currentUser.uid,
      name: details.employeeName || details.name || (typeof details.member === 'string' ? details.member : currentUser.name) || currentUser.email,
      email: currentUser.email,
      action,
      time: details.time || details.checkIn || details.checkOut || now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      timestamp: details.timestamp || timestamp,
      date: details.date || now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      cloudSynced: false,
      duration: details.duration || details.workHours || '',
      productiveDuration: details.productiveDuration || '',
      efficiency: details.efficiency || '',
      note: details.note || ''
    };

    try {
      await databaseBridge.appendPunchLog(punch);
    } catch (error) {
      console.error('[ATTENDANCE] Could not save the punch locally:', error);
      return null;
    }
    setAttendance(prev => [punch, ...(prev || []).filter(existing => existing.id !== punch.id)]);
    setPunchLogs(prev => [punch, ...(prev || []).filter(existing => existing.id !== punch.id)]);

    let acknowledgedPunch;
    try {
      acknowledgedPunch = await firebaseBridge.recordPunch(action, {
        ...punch,
        employeeName: punch.name
      });
    } catch (error) {
      console.error('[ATTENDANCE] Punch is saved locally but cloud sync was not confirmed:', error);
      return punch;
    }

    const syncedPunch = { ...punch, ...acknowledgedPunch, cloudSynced: true };
    setAttendance(prev => prev.map(existing => existing.id === punch.id ? syncedPunch : existing));
    setPunchLogs(prev => prev.map(existing => existing.id === punch.id ? syncedPunch : existing));
    try {
      await databaseBridge.appendPunchLog(syncedPunch);
    } catch (error) {
      console.error('[ATTENDANCE] Cloud confirmed the punch, but its local sync status could not be saved:', error);
    }
    return syncedPunch;
  }, [currentUser, isAuthenticated]);

  const handleLoadAttendanceMonth = async (year, monthIndex) => {
    const monthPunches = await firebaseBridge.fetchPunchLogsForMonth(year, monthIndex);
    const mergeMonth = previous => {
      const byId = new Map((previous || []).filter(punch => punch?.id).map(punch => [punch.id, punch]));
      monthPunches.forEach(punch => {
        if (punch?.id) byId.set(punch.id, { ...byId.get(punch.id), ...punch, cloudSynced: true });
      });
      return Array.from(byId.values()).sort((a, b) => (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0));
    };
    setPunchLogs(mergeMonth);
    setAttendance(mergeMonth);
  };

  // Restore an open shift only after the signed-in user's punch history is loaded.
  useEffect(() => {
    if (!isAuthenticated || !currentUser?.uid) {
      autoClockInTriggeredRef.current = null;
      setTimerRunning(false);
      setIsAutoBreak(false);
      return;
    }
    if (!attendanceHistoryLoaded || autoClockInTriggeredRef.current === currentUser.uid) return;
    autoClockInTriggeredRef.current = currentUser.uid;

    const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const allPunchesById = new Map();
    (punchLogs || []).forEach(punch => {
      if (punch?.id) allPunchesById.set(punch.id, punch);
    });
    const allPunches = Array.from(allPunchesById.values());
    const userTarget = (currentUser.name || '').toLowerCase();
    const userEmail = (currentUser.email || '').toLowerCase();

    const todayPunches = allPunches.filter(p => {
      const matchesUser = p.uid
        ? p.uid === currentUser.uid
        : p.email
          ? p.email.toLowerCase() === userEmail
          : (!!currentUser.id && p.workerId === currentUser.id) ||
            (!!userTarget && (p.name || p.member || p.employeeName || '').toLowerCase() === userTarget);
      if (!matchesUser) return false;
      const punchDate = p.date || (p.timestamp ? new Date(p.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '');
      return punchDate === todayStr;
    }).sort((a, b) => (Number(a.timestamp) || 0) - (Number(b.timestamp) || 0));

    const lastPunch = todayPunches.length > 0 ? todayPunches[todayPunches.length - 1] : null;
    const lastAction = (lastPunch?.action || '').toUpperCase();

    if (lastAction === 'CLOCK_IN' || lastAction === 'BREAK_END') {
      // User is already clocked in today, resume active timers
      let totalSecs = 0;
      let lastIn = null;
      todayPunches.forEach(p => {
        const act = (p.action || '').toUpperCase();
        const t = p.timestamp ? Number(p.timestamp) : null;
        if (act === 'CLOCK_IN' || act === 'PUNCH_IN' || act === 'BREAK_END') {
          lastIn = t || Date.now();
        } else if ((act === 'CLOCK_OUT' || act === 'PUNCH_OUT' || act === 'BREAK_START' || act === 'BREAK') && lastIn && t && t > lastIn) {
          totalSecs += Math.floor((t - lastIn) / 1000);
          lastIn = null;
        }
      });
      if (lastIn) {
        totalSecs += Math.floor((Date.now() - lastIn) / 1000);
      }
      const inPunch = todayPunches.find(p => (p.action || '').toUpperCase() === 'CLOCK_IN');
      const startStr = inPunch?.time || new Date(inPunch?.timestamp || Date.now()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      setTimerStartTime(startStr);
      setTimerSeconds(totalSecs);
      setProductiveSeconds(Math.round(totalSecs * 0.85));
      setTimerRunning(true);
      setIsAutoBreak(false);
    } else if (lastAction === 'BREAK_START' || lastAction === 'BREAK') {
      setTimerRunning(true);
      setIsAutoBreak(true);
    } else {
      setTimerRunning(false);
      setIsAutoBreak(false);
      setTimerSeconds(0);
      setProductiveSeconds(0);
    }
  }, [isAuthenticated, currentUser, attendanceHistoryLoaded, punchLogs]);

  // Work Timer & Productive Tracking with 2-Minute Inactivity Auto-Break Engine
  useEffect(() => {
    let interval = null;
    if (timerRunning) {
      interval = setInterval(async () => {
        // Increment Total Working Seconds
        setTimerSeconds(s => s + 1);

        // Fetch OS idle time in seconds
        let currentIdle = 0;
        try {
          currentIdle = await electronBridge.getSystemIdleTime();
        } catch (_) {}
        setIdleSeconds(currentIdle);

        // Inactivity threshold: 120 seconds (2 minutes)
        if (currentIdle >= 120) {
          if (!isAutoBreak) {
            setIsAutoBreak(true);
            await recordAttendancePunch('BREAK_START', { note: 'Auto-break (2m inactivity detected)' });
          }
        } else {
          // User resumed keyboard/mouse activity (< 5 seconds idle)
          if (isAutoBreak && currentIdle < 5) {
            setIsAutoBreak(false);
            await recordAttendancePunch('BREAK_END', { note: 'Resumed work activity' });
          }

          // Accumulate productive working seconds only if actively working and not on break
          if (!isAutoBreak) {
            setProductiveSeconds(p => p + 1);
          }
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning, isAutoBreak, recordAttendancePunch]);

  const handleToggleTimer = async () => {
    if (!timerRunning) {
      const punch = await recordAttendancePunch('CLOCK_IN');
      if (!punch) return;
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const expTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
      const expStr = expTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

      setTimerStartTime(timeStr);
      setTimerExpectedEnd(expStr);
      setTimerRunning(true);
      setIsAutoBreak(false);
      setTimerSeconds(0);
      setProductiveSeconds(0);
    } else {
      await handleClockOut();
    }
  };

  const handleTakeBreak = async () => {
    if (!isAutoBreak) {
      const punch = await recordAttendancePunch('BREAK_START', { note: 'Manual break start' });
      if (!punch) return;
      setIsAutoBreak(true);
    } else {
      const punch = await recordAttendancePunch('BREAK_END', { note: 'Manual break end' });
      if (!punch) return;
      setIsAutoBreak(false);
    }
  };

  const handleClockOut = async () => {
    const finalLogged = formatTimerDigits(timerSeconds);
    const finalProd = formatTimerDigits(productiveSeconds);
    const efficiencyRate = timerSeconds > 0 ? Math.min(100, Math.round((productiveSeconds / timerSeconds) * 100)) : 100;
    const punch = await recordAttendancePunch('CLOCK_OUT', {
      duration: finalLogged,
      productiveDuration: finalProd,
      efficiency: `${efficiencyRate}%`,
      note: 'Manual Clock-out'
    });
    if (!punch) return;

    setTimerRunning(false);
    setIsAutoBreak(false);
  };

  const handleToggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('reddot_theme', nextTheme);
  };

  // Tasks actions (Connected to Cloud Firestore & Local Disk Vault)
  const handleToggleTask = (taskId) => {
    setTasks(prev => {
      const updated = prev.map(t => {
        if (t.id === taskId) {
          const isDone = !t.completed && t.status !== 'Completed';
          const newStatus = isDone ? 'Completed' : 'In Progress';
          firebaseBridge.updateTaskStatus(taskId, newStatus, isDone);
          return {
            ...t,
            completed: isDone,
            status: newStatus
          };
        }
        return t;
      });
      databaseBridge.updateTasks(updated);
      return updated;
    });
  };

  const handleAddTask = (newTask) => {
    setTasks(prev => {
      const updated = [newTask, ...prev.filter(t => t.id !== newTask.id)];
      databaseBridge.saveTask(newTask);
      return updated;
    });
    firebaseBridge.createTask(newTask);
  };

  const handleUpdateTask = (updatedTask) => {
    setTasks(prev => {
      const updated = prev.map(t => t.id === updatedTask.id ? { ...t, ...updatedTask } : t);
      databaseBridge.saveTask(updatedTask);
      return updated;
    });
    firebaseBridge.updateTask(updatedTask);
  };

  const handleDeleteTask = (taskId) => {
    setTasks(prev => {
      const updated = prev.filter(t => t.id !== taskId);
      databaseBridge.updateTasks(updated);
      return updated;
    });
    firebaseBridge.deleteTask(taskId);
  };

  const handleUpdateTaskStatus = (taskId, newStatus) => {
    setTasks(prev => {
      const updated = prev.map(t => {
        if (t.id === taskId) {
          const isCompleted = newStatus === 'Completed';
          firebaseBridge.updateTaskStatus(taskId, newStatus, isCompleted);
          return {
            ...t,
            status: newStatus,
            completed: isCompleted
          };
        }
        return t;
      });
      databaseBridge.updateTasks(updated);
      return updated;
    });
  };

  const handleToggleSubtask = async (taskId, subtaskId, isCompleted) => {
    setTasks(prev => {
      const updated = prev.map(t => {
        if (t.id === taskId) {
          const subtasks = Array.isArray(t.subtasks)
            ? t.subtasks.map(s => s.id === subtaskId ? { ...s, completed: isCompleted, done: isCompleted } : s)
            : [];
          const modTask = { ...t, subtasks };
          databaseBridge.saveTask(modTask);
          return modTask;
        }
        return t;
      });
      return updated;
    });
    await firebaseBridge.updateTaskSubtask(taskId, subtaskId, isCompleted);
  };

  // Event actions (Connected to Local Disk Vault)
  const handleScheduleEvent = (newEvent) => {
    setEvents(prev => {
      const updated = [newEvent, ...prev.filter(e => e.id !== newEvent.id)];
      databaseBridge.saveEvent(newEvent);
      return updated;
    });
  };

  const handleUpdateEvent = (updatedEvent) => {
    setEvents(prev => {
      const updated = prev.map(e => e.id === updatedEvent.id ? { ...e, ...updatedEvent } : e);
      databaseBridge.saveEvent(updatedEvent);
      return updated;
    });
  };

  const handleDeleteEvent = (eventId) => {
    setEvents(prev => {
      const updated = prev.filter(e => e.id !== eventId);
      databaseBridge.deleteEvent(eventId);
      return updated;
    });
  };

  const handleToggleEvent = (eventId) => {
    setEvents(prev => {
      const updated = prev.map(e => {
        if (e.id === eventId) {
          const isDone = !e.completed && e.status !== 'Completed';
          const mod = { ...e, completed: isDone, status: isDone ? 'Completed' : 'Upcoming' };
          databaseBridge.saveEvent(mod);
          return mod;
        }
        return e;
      });
      return updated;
    });
  };

  // Team actions (Connected to Cloud Firestore & Local Vault)
  const handleAddMember = async (newMember) => {
    setTeamMembers(prev => {
      const updated = [...prev, newMember];
      databaseBridge.saveMember(newMember);
      return updated;
    });
    await firebaseBridge.createMember(newMember);
  };

  const handleUpdateMember = async (updatedMember) => {
    if (!updatedMember) return;
    setTeamMembers(prev => {
      const idx = prev.findIndex(m => 
        (updatedMember.id && m.id === updatedMember.id) || 
        (updatedMember.uid && m.uid === updatedMember.uid) || 
        (updatedMember.email && m.email && m.email.toLowerCase() === updatedMember.email.toLowerCase())
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...updatedMember };
        return next;
      }
      return [...prev, updatedMember];
    });
    await databaseBridge.saveMember(updatedMember);
  };

  const [activeChatChannel, setActiveChatChannel] = useState(null);

  const handleOpenDirectChat = (memberId, memberName) => {
    // Find or generate personal DM channel for this member
    const targetMember = teamMembers.find(m =>
      m.id === memberId || m.uid === memberId || m.name === memberName
    );
    const directKey = firebaseBridge.getDeterministicDMChannelId(
      userProfile.email || userProfile.uid,
      targetMember?.email || targetMember?.uid || memberId
    );

    setConversations(prev => {
      const exists = prev.some(c => c.id === directKey);
      if (!exists && targetMember) {
        const newDm = {
          id: directKey,
          name: targetMember.name,
          title: targetMember.name,
          isGroup: false,
          membersCount: 2,
          lastMessage: 'Direct conversation with ' + targetMember.name,
          time: 'Now',
          timestamp: Date.now()
        };
        return [newDm, ...prev];
      }
      return prev;
    });

    setActiveChatChannel(directKey);
    setCurrentTab('messages');
  };

  // Attendance actions
  const handleRecordAttendance = (record) => {
    return recordAttendancePunch(record.action || 'CLOCK_IN', {
      ...record,
      employeeName: record.employee || record.name || record.member || currentUser?.name || ''
    });
  };

  // Messages actions (Connected to Cloud Firestore & Port 5050 Backend)
  const handleSendMessage = (channelId, message) => {
    const outgoingMessage = {
      ...message,
      id: message.id || `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      sender: userProfile.name,
      senderDisplayName: userProfile.name,
      senderUid: userProfile.uid,
      senderEmpId: userProfile.id,
      senderEmail: userProfile.email,
      senderRoleTag: userProfile.role,
      isSelf: true,
      status: 'PENDING'
    };
    setMessages(prev => {
      const existing = prev[channelId] || [];
      return {
        ...prev,
        [channelId]: [...existing, outgoingMessage]
      };
    });
    databaseBridge.appendChatMessage(channelId, outgoingMessage);

    setConversations(prev => {
      return prev.map(c => {
        if (c.id === channelId) {
          return {
            ...c,
            lastMessage: outgoingMessage.text || (outgoingMessage.attachments?.length ? 'Sent an attachment' : 'Recent message'),
            time: outgoingMessage.time || 'Just now',
            timestamp: outgoingMessage.createdAt || Date.now()
          };
        }
        return c;
      }).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    });

    firebaseBridge.sendMessage(channelId, outgoingMessage.text || outgoingMessage.content, {
      id: outgoingMessage.id,
      createdAt: outgoingMessage.createdAt || outgoingMessage.timestamp,
      senderName: userProfile.name,
      senderPhoto: userProfile.avatar,
      senderEmail: userProfile.email,
      senderUid: userProfile.uid,
      senderEmpId: userProfile.id,
      replyTo: outgoingMessage.replyTo,
      attachments: outgoingMessage.attachments || (outgoingMessage.attachment ? [outgoingMessage.attachment] : [])
    }).then(() => {
      setMessages(prev => ({
        ...prev,
        [channelId]: (prev[channelId] || []).map(item =>
          item.id === outgoingMessage.id ? { ...item, status: 'SENT' } : item
        )
      }));
    }).catch(error => {
      console.error('[MESSAGES] Cloud send was not confirmed:', error);
      setMessages(prev => ({
        ...prev,
        [channelId]: (prev[channelId] || []).map(item =>
          item.id === outgoingMessage.id ? { ...item, status: 'FAILED' } : item
        )
      }));
    });
  };

  const handleDeleteMessage = (channelId, messageId) => {
    setMessages(prev => {
      const existing = prev[channelId] || [];
      const updated = {
        ...prev,
        [channelId]: existing.filter(m => (m.id || m.docId) !== messageId)
      };
      databaseBridge.deleteChatMessage(channelId, messageId);
      return updated;
    });
    firebaseBridge.deleteMessage(channelId, messageId);
  };

  const handleToggleReaction = (channelId, messageId, emoji) => {
    setMessages(prev => {
      const existing = prev[channelId] || [];
      const updatedList = existing.map(m => {
        if ((m.id || m.docId) !== messageId) return m;
        const currentReactions = { ...(m.reactions || {}) };
        const users = Array.isArray(currentReactions[emoji]) ? [...currentReactions[emoji]] : [];
        const userIdx = users.indexOf(userProfile.name);
        if (userIdx >= 0) {
          users.splice(userIdx, 1);
          if (users.length === 0) {
            delete currentReactions[emoji];
          } else {
            currentReactions[emoji] = users;
          }
        } else {
          users.push(userProfile.name);
          currentReactions[emoji] = users;
        }
        const updatedMsg = { ...m, reactions: currentReactions };
        databaseBridge.updateChatMessage(channelId, updatedMsg);
        return updatedMsg;
      });
      return { ...prev, [channelId]: updatedList };
    });
    firebaseBridge.toggleReaction(channelId, messageId, emoji, userProfile.name);
  };

  const handleSyncCloudMessages = (channelId, cloudMsgs) => {
    if (!channelId) return;
    setMessages(prev => ({
      ...prev,
      [channelId]: cloudMsgs
    }));

    if (Array.isArray(cloudMsgs) && cloudMsgs.length > 0) {
      const latest = cloudMsgs[cloudMsgs.length - 1];
      const rawCreated = latest.timestamp || latest.createdAt;
      const latestTs = typeof rawCreated === 'number' ? rawCreated : (rawCreated ? new Date(rawCreated).getTime() : Date.now());
      setConversations(prev => {
        return prev.map(c => {
          if (c.id === channelId) {
            return {
              ...c,
              lastMessage: latest.text || (latest.attachments?.length ? 'Sent an attachment' : c.lastMessage),
              time: latest.time || c.time,
              timestamp: latestTs
            };
          }
          return c;
        }).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      });
    }
  };

  // Files actions (Connected to Backend Gateway & Local Storage)
  const handleUploadFile = async (newFile) => {
    const updated = [newFile, ...(files || []).filter(file => file.id !== newFile.id)];
    setFiles(updated);
    try {
      await databaseBridge.saveWorkspaceSection('files', updated);
    } catch (error) {
      console.error('[FILES] Could not save local file index:', error);
    }
  };

  const handleDeleteFile = async (fileId) => {
    const updated = (files || []).filter(file => file.id !== fileId);
    setFiles(updated);
    try {
      await databaseBridge.saveWorkspaceSection('files', updated);
    } catch (error) {
      console.error('[FILES] Could not save local file index:', error);
    }
  };

  const handleTogglePin = async () => {
    const pinned = await electronBridge.togglePinDesktop();
    setIsDesktopPinned(pinned);
  };

  const handleSelectProfilePhoto = async () => {
    const res = await electronBridge.selectPhoto();
    if (!res.canceled && res.dataUrl) {
      const updatedProfile = { ...userProfile, avatar: res.dataUrl };
      setUserProfile(updatedProfile);
      await databaseBridge.saveWorkspaceSection('userProfile', updatedProfile);
      await firebaseBridge.updateMemberPhoto(res.dataUrl);
    }
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setUserProfile(user);
    setIsAuthenticated(true);
    setAuthResolved(true);

    if (firebaseBridge && firebaseBridge.setActiveUser) {
      firebaseBridge.setActiveUser(user);
    }

    // STRICT PRESENCE: Only authenticated active session is Online, others Offline
    setTeamMembers(prev => {
      const activeEmail = (user.email || '').toLowerCase();
      const updated = prev.map(m => {
        const isMatch = (m.id && user.id && m.id === user.id) ||
                        (m.email && m.email.toLowerCase() === activeEmail) ||
                        (m.name && m.name.toLowerCase() === (user.name || '').toLowerCase());
        return {
          ...m,
          status: isMatch ? 'Online' : 'Offline',
          isOnline: isMatch
        };
      });
      databaseBridge.saveMembers(updated).catch(() => {});
      return updated;
    });
  };

  const handleLogout = async () => {
    try {
      await firebaseBridge.signOut();
    } catch (error) {
      console.error('[AUTH] Could not sign out from Firebase:', error);
    }

    setIsAuthenticated(false);
    setCurrentUser(null);
    setUserProfile({ name: 'Team Member', role: 'MEMBER', email: '', avatar: '' });
    setTeamMembers(prev => {
      const updated = prev.map(m => ({ ...m, status: 'Offline', isOnline: false }));
      databaseBridge.saveMembers(updated).catch(() => {});
      return updated;
    });
  };

  const handleApplyLeaveSuccess = (attendanceEntry, leaveRecord) => {
    if (leaveRecord) {
      setLeaves(prev => [leaveRecord, ...prev]);
    }
    if (attendanceEntry) {
      setAttendance(prev => [attendanceEntry, ...prev]);
      setPunchLogs(prev => [attendanceEntry, ...prev]);
    }
  };

  const productivityScore = timerSeconds > 0 ? Math.min(100, Math.round((productiveSeconds / timerSeconds) * 100)) : 100;
  const timerObject = {
    isRunning: timerRunning,
    formattedTime: formatTimerDigits(timerSeconds),
    seconds: timerSeconds,
    totalWorkingSeconds: timerSeconds,
    productiveSeconds: productiveSeconds,
    formattedProductiveTime: formatTimerDigits(productiveSeconds),
    productivityScore: productivityScore,
    isAutoBreak: isAutoBreak,
    idleSeconds: idleSeconds,
    startTime: timerStartTime,
    expectedClockOut: timerExpectedEnd
  };

  if (showStartupVideo) {
    return <StartupVideoScreen theme={theme} onComplete={() => setShowStartupVideo(false)} />;
  }

  if (!authResolved) {
    return (
      <div className="app-container" style={{ overflow: 'auto' }}>
        <ViewLoadingFallback />
      </div>
    );
  }

  // If user is not authenticated, show professional Workstation Auth Screen
  if (!isAuthenticated) {
    return (
      <div className="app-container" style={{ overflow: 'hidden' }}>
        <AuthScreen onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Top Navigation Bar */}
      <Topbar 
        activeTheme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenOmnibox={() => setIsOmniboxOpen(true)}
        onOpenSettings={() => setCurrentTab('settings')}
        userProfile={userProfile}
        onLogout={handleLogout}
        notifications={notifications}
        isPinned={isDesktopPinned}
        onTogglePin={handleTogglePin}
      />

      {/* Main Body: Sidebar + Main Content Area */}
      <div className="app-body">
        <Sidebar 
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          tasksCount={tasks.length}
          unreadMessagesCount={1}
        />

        <main className={`main-content ${currentTab === 'attendance' ? 'attendance-mode' : ''}`}>
          <ErrorBoundary key={currentTab}>
            <Suspense fallback={<ViewLoadingFallback />}>
              {currentTab === 'dashboard' && (
                <DashboardView 
                  tasks={tasks}
                  onToggleTask={handleToggleTask}
                  teamMembers={teamMembers}
                  timerState={timerObject}
                  onToggleTimer={handleToggleTimer}
                  onTakeBreak={handleTakeBreak}
                  onClockOut={handleClockOut}
                  metrics={metrics}
                  attendance={attendance}
                  punchLogs={punchLogs}
                  leaves={leaves}
                  onCleanMemory={() => {
                    electronBridge.cleanMemory();
                  }}
                  onSelectTab={setCurrentTab}
                  onOpenApplyLeave={() => setIsApplyLeaveOpen(true)}
                  userProfile={userProfile}
                  events={events}
                  onScheduleEvent={handleScheduleEvent}
                  onUpdateEvent={handleUpdateEvent}
                  onDeleteEvent={handleDeleteEvent}
                  onToggleEvent={handleToggleEvent}
                />
              )}

              {currentTab === 'tasks' && (
                <TasksView 
                  tasks={tasks}
                  onAddTask={handleAddTask}
                  onUpdateTask={handleUpdateTask}
                  onToggleTask={handleToggleTask}
                  onDeleteTask={handleDeleteTask}
                  onUpdateStatus={handleUpdateTaskStatus}
                  onToggleSubtask={handleToggleSubtask}
                  teamMembers={teamMembers}
                />
              )}

              {currentTab === 'team' && (
                <TeamView 
                  teamMembers={teamMembers}
                  runningApps={metrics.runningApps || []}
                  onAddMember={handleAddMember}
                  onUpdateMember={handleUpdateMember}
                  onOpenDirectChat={handleOpenDirectChat}
                  onSelectTab={setCurrentTab}
                  onAddTask={handleAddTask}
                  userProfile={userProfile}
                  events={events}
                  onScheduleEvent={handleScheduleEvent}
                  onUpdateEvent={handleUpdateEvent}
                  onDeleteEvent={handleDeleteEvent}
                  onToggleEvent={handleToggleEvent}
                />
              )}

              {currentTab === 'attendance' && (
                <AttendanceView 
                  attendance={attendance}
                  punchLogs={punchLogs}
                  leaves={leaves}
                  onRecordAttendance={handleRecordAttendance}
                  onOpenApplyLeave={() => setIsApplyLeaveOpen(true)}
                  currentMember={userProfile.name}
                  teamMembers={teamMembers}
                  userProfile={userProfile}
                  timerState={timerObject}
                  onToggleTimer={handleToggleTimer}
                  onTakeBreak={handleTakeBreak}
                  onClockOut={handleClockOut}
                  onLoadAttendanceMonth={handleLoadAttendanceMonth}
                />
              )}

              {currentTab === 'messages' && (
                <MessagesView 
                  conversations={conversations}
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  onDeleteMessage={handleDeleteMessage}
                  onToggleReaction={handleToggleReaction}
                  currentUser={userProfile.name}
                  currentUserEmail={userProfile.email}
                  currentUserUid={userProfile.uid}
                  currentUserEmpId={userProfile.id}
                  currentUserRole={userProfile.role}
                  onSyncCloudMessages={handleSyncCloudMessages}
                  teamMembers={teamMembers}
                  initialActiveChannelId={activeChatChannel}
                  onSelectChannel={setActiveChatChannel}
                />
              )}

              {currentTab === 'files' && (
                <FilesCloudView 
                  files={files}
                  onUploadFile={handleUploadFile}
                  onDeleteFile={handleDeleteFile}
                  userProfile={userProfile}
                />
              )}

              {currentTab === 'terminal' && (
                <TerminalView 
                  tasks={tasks}
                  teamMembers={teamMembers}
                  onToggleTheme={handleToggleTheme}
                  onOpenNewWindow={() => setIsTerminalOpen(true)}
                />
              )}

              {currentTab === 'settings' && (
                <SettingsView 
                  theme={theme}
                  onToggleTheme={handleToggleTheme}
                  userProfile={userProfile}
                  onUpdateUserProfile={setUserProfile}
                  onSelectPhoto={handleSelectProfilePhoto}
                  metrics={metrics}
                  filesCount={files?.length || 0}
                  teamMembersCount={teamMembers?.length || 4}
                />
              )}
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>

      {/* SYSTEM OVERLAYS & MODALS - Lazy Loaded on First Activation */}
      <Suspense fallback={null}>
        {isWorkspaceOsOpen && (
          <WorkspaceOsModal 
            isOpen={isWorkspaceOsOpen}
            onClose={() => setIsWorkspaceOsOpen(false)}
          />
        )}

        {isTerminalOpen && (
          <TerminalModal 
            isOpen={isTerminalOpen}
            onClose={() => setIsTerminalOpen(false)}
            tasks={tasks}
            teamMembers={teamMembers}
            onToggleTheme={handleToggleTheme}
          />
        )}

        {isOmniboxOpen && (
          <OmniboxModal 
            isOpen={isOmniboxOpen}
            onClose={() => setIsOmniboxOpen(false)}
            onNavigateTab={setCurrentTab}
            tasks={tasks}
            files={files}
            teamMembers={teamMembers}
          />
        )}

        {/* Dedicated Apply Leave Modal */}
        {isApplyLeaveOpen && (
          <ApplyLeaveModal 
            isOpen={isApplyLeaveOpen}
            onClose={() => setIsApplyLeaveOpen(false)}
            currentUser={currentUser?.name || userProfile?.name || 'Jagadish K'}
            teamMembers={teamMembers}
            userProfile={userProfile}
            onApplyLeaveSuccess={handleApplyLeaveSuccess}
            onLeaveApplied={handleApplyLeaveSuccess}
          />
        )}
      </Suspense>
    </div>
  );
}

export default App;
