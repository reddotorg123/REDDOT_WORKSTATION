import React, { useState, useEffect } from 'react';
import { Topbar } from './components/Topbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { TasksView } from './components/TasksView';
import { TeamView } from './components/TeamView';
import { AttendanceView } from './components/AttendanceView';
import { MessagesView } from './components/MessagesView';
import { FilesCloudView } from './components/FilesCloudView';
import { SettingsView } from './components/SettingsView';
import { TerminalView } from './components/TerminalView';
import { WorkspaceOsModal } from './components/WorkspaceOsModal';
import { TerminalModal } from './components/TerminalModal';
import { OmniboxModal } from './components/OmniboxModal';
import { ErrorBoundary } from './components/ErrorBoundary';

import { 
  INITIAL_TASKS, 
  INITIAL_TEAM, 
  INITIAL_ATTENDANCE, 
  INITIAL_CONVERSATIONS, 
  INITIAL_MESSAGES, 
  INITIAL_FILES 
} from './data/mockData';
import { electronBridge } from './services/electronBridge';
import { firebaseBridge } from './services/firebaseBridge';
import { backendBridge } from './services/backendBridge';
import { databaseBridge } from './services/databaseBridge';

/**
 * Deduplicates tasks by title and assignee.
 * Keeps the most complete task (highest subtasks count / latest timestamp)
 * and permanently prunes redundant duplicate docs from Cloud Firestore.
 */
export function deduplicateTasksList(taskList) {
  if (!Array.isArray(taskList)) return [];
  const seen = new Map();
  const duplicatesToDelete = [];

  taskList.forEach(task => {
    if (!task) return;
    const normTitle = String(task.title || '').trim().toLowerCase().replace(/\s+/g, ' ');
    const normAssignee = String(task.assignedTo || task.assignee || '').trim().toLowerCase();
    const key = normTitle ? `${normTitle}__${normAssignee}` : String(task.id);

    if (!seen.has(key)) {
      seen.set(key, task);
    } else {
      const existing = seen.get(key);
      const existingSubs = Array.isArray(existing.subtasks) ? existing.subtasks.length : 0;
      const currentSubs = Array.isArray(task.subtasks) ? task.subtasks.length : 0;
      
      let keepTask, dropTask;
      if (currentSubs > existingSubs) {
        keepTask = task;
        dropTask = existing;
      } else {
        keepTask = existing;
        dropTask = task;
      }
      seen.set(key, keepTask);
      if (dropTask && dropTask.id && dropTask.id !== keepTask.id) {
        duplicatesToDelete.push(dropTask.id);
      }
    }
  });

  if (duplicatesToDelete.length > 0) {
    console.log(`[DEDUPLICATE_TASKS] Found and pruning ${duplicatesToDelete.length} redundant duplicate task doc(s):`, duplicatesToDelete);
    duplicatesToDelete.forEach(dupId => {
      try {
        firebaseBridge.deleteTask(dupId);
      } catch (_) {}
    });
  }

  return Array.from(seen.values());
}

export function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [theme, setTheme] = useState('light');

  // Workspace Data States
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [teamMembers, setTeamMembers] = useState(INITIAL_TEAM);
  const [attendance, setAttendance] = useState(INITIAL_ATTENDANCE);
  const [conversations, setConversations] = useState(INITIAL_CONVERSATIONS);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [files, setFiles] = useState(INITIAL_FILES);
  const [userProfile, setUserProfile] = useState({
    name: 'Jagadish K',
    role: 'FOUNDER',
    email: 'jagadish2k2006@gmail.com',
    avatar: './assets/profile-photo.jpeg'
  });

  // Notifications
  const [notifications, setNotifications] = useState([
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

  // Work Timer State
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerStartTime, setTimerStartTime] = useState('--:-- (Off Duty)');
  const [timerExpectedEnd, setTimerExpectedEnd] = useState('--:-- (Standby)');

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

  // Live Cloud Firestore Subscriptions (Members, Tasks, Punches, Channels, Auth)
  useEffect(() => {
    const unsubAuth = firebaseBridge.onAuthStateChanged((profile) => {
      if (profile && profile.name) setUserProfile(profile);
    });

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
            map.set(key, { ...existing, ...m });
          });
          const mergedMembers = Array.from(map.values());
          databaseBridge.updateMembers(mergedMembers);
          return mergedMembers;
        });
      }
    });

    const unsubTasks = firebaseBridge.subscribeTasks((cloudTasks) => {
      if (cloudTasks && cloudTasks.length > 0) {
        const cleanTasks = deduplicateTasksList(cloudTasks);
        setTasks(cleanTasks);
        databaseBridge.updateTasks(cleanTasks);
      }
    });

    const unsubPunches = firebaseBridge.subscribePunchLogs((cloudPunches) => {
      if (cloudPunches && cloudPunches.length > 0) setAttendance(cloudPunches);
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

    return () => {
      if (typeof unsubAuth === 'function') unsubAuth();
      if (typeof unsubMembers === 'function') unsubMembers();
      if (typeof unsubTasks === 'function') unsubTasks();
      if (typeof unsubPunches === 'function') unsubPunches();
      if (typeof unsubChannels === 'function') unsubChannels();
    };
  }, []);

  // Live Attachment Backend Gateway Sync (Port 5050)
  // File Gateway Sync & Local Vault Multi-File Extraction
  useEffect(() => {
    let isMounted = true;
    async function syncBackendData() {
      try {
        await backendBridge.checkHealth().catch(() => {});
        const serverAttachments = await backendBridge.getAttachments().catch(() => []);
        const workspaceFiles = await databaseBridge.getWorkspaceFiles().catch(() => []);

        if (isMounted) {
          const fileMap = new Map();
          if (Array.isArray(workspaceFiles)) {
            workspaceFiles.forEach(f => {
              if (f && (f.name || f.id)) fileMap.set(f.name || f.id, f);
            });
          }
          if (Array.isArray(serverAttachments)) {
            serverAttachments.forEach(a => {
              const key = a.name || a.id;
              fileMap.set(key, {
                id: a.id,
                name: a.name,
                type: a.isImage ? 'Image' : (a.name?.endsWith('.pdf') ? 'PDF' : 'Document'),
                size: a.size ? `${(a.size / (1024 * 1024)).toFixed(1)} MB` : '1.0 MB',
                modified: a.createdAt ? new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today',
                downloadUrl: backendBridge.getDownloadUrl(a.id),
                previewUrl: backendBridge.getPreviewUrl(a.id),
                dataUrl: a.dataUrl || null,
                isImage: a.isImage
              });
            });
          }
          if (fileMap.size > 0) {
            const newFiles = Array.from(fileMap.values());
            setFiles(prev => {
              if (prev.length === newFiles.length && prev.every((f, i) => f.id === newFiles[i]?.id && f.size === newFiles[i]?.size)) {
                return prev; // no change, avoid re-render
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
    const interval = setInterval(syncBackendData, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Load persistent database from local vault on startup via databaseBridge
  useEffect(() => {
    async function init() {
      try {
        const dbData = await databaseBridge.loadWorkspaceDatabase();
        if (dbData) {
          if (Array.isArray(dbData.tasks) && dbData.tasks.length > 0) setTasks(dbData.tasks);
          if (Array.isArray(dbData.teamMembers) && dbData.teamMembers.length > 0) setTeamMembers(dbData.teamMembers);
          if (Array.isArray(dbData.conversations) && dbData.conversations.length > 0) setConversations(dbData.conversations);
          if (Array.isArray(dbData.attendance) && dbData.attendance.length > 0) setAttendance(dbData.attendance);
          if (dbData.messages && typeof dbData.messages === 'object' && Object.keys(dbData.messages).length > 0) setMessages(dbData.messages);
          if (dbData.userProfile && dbData.userProfile.name) setUserProfile(dbData.userProfile);
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

  // Work timer tick
  useEffect(() => {
    let interval = null;
    if (timerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning]);

  // Format timer as HH:MM:SS
  const formatTimerDigits = (totalSec) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const handleToggleTimer = () => {
    if (!timerRunning) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const expTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
      const expStr = expTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

      setTimerStartTime(timeStr);
      setTimerExpectedEnd(expStr);
      setTimerRunning(true);
      const punch = {
        id: `punch_${Date.now()}`,
        workerId: 'RD-FOUNDER-001',
        name: userProfile.name,
        action: 'CLOCK_IN',
        time: timeStr,
        timestamp: Date.now(),
        date: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        cloudSynced: true
      };
      databaseBridge.appendPunchLog(punch);
      setAttendance(prev => [punch, ...prev]);
      firebaseBridge.recordPunch('CLOCK_IN', { employeeName: userProfile.name });
      electronBridge.showNotification('Work Timer Started', `Shift started at ${timeStr}`);
    } else {
      setTimerRunning(false);
      const punch = {
        id: `punch_${Date.now()}`,
        workerId: 'RD-FOUNDER-001',
        name: userProfile.name,
        action: 'BREAK_START',
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now(),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        cloudSynced: true
      };
      databaseBridge.appendPunchLog(punch);
      setAttendance(prev => [punch, ...prev]);
      firebaseBridge.recordPunch('BREAK_START', { employeeName: userProfile.name });
    }
  };

  const handleTakeBreak = () => {
    setTimerRunning(false);
    const punch = {
      id: `punch_${Date.now()}`,
      workerId: 'RD-FOUNDER-001',
      name: userProfile.name,
      action: 'BREAK_START',
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      cloudSynced: true
    };
    databaseBridge.appendPunchLog(punch);
    setAttendance(prev => [punch, ...prev]);
    firebaseBridge.recordPunch('BREAK_START', { employeeName: userProfile.name });
    electronBridge.showNotification('Work Timer Paused', 'Break mode active');
  };

  const handleClockOut = () => {
    setTimerRunning(false);
    const finalLogged = formatTimerDigits(timerSeconds);
    const punch = {
      id: `punch_${Date.now()}`,
      workerId: 'RD-FOUNDER-001',
      name: userProfile.name,
      action: 'CLOCK_OUT',
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      cloudSynced: true
    };
    databaseBridge.appendPunchLog(punch);
    setAttendance(prev => [punch, ...prev]);
    firebaseBridge.recordPunch('CLOCK_OUT', { employeeName: userProfile.name, duration: finalLogged });
    electronBridge.showNotification('Shift Completed', `Total time logged: ${finalLogged}`);
    setTimerSeconds(0);
    setTimerStartTime('--:-- (Off Duty)');
    setTimerExpectedEnd('--:-- (Standby)');
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
      const updated = deduplicateTasksList([newTask, ...prev]);
      databaseBridge.saveTask(newTask);
      return updated;
    });
    firebaseBridge.createTask(newTask);
    electronBridge.showNotification('New Task Created', newTask.title);
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

  // Team actions (Connected to Cloud Firestore & Local Vault)
  const handleAddMember = async (newMember) => {
    setTeamMembers(prev => {
      const updated = [...prev, newMember];
      databaseBridge.saveMember(newMember);
      return updated;
    });
    await firebaseBridge.createMember(newMember);
    electronBridge.showNotification('Member Added', `${newMember.name} added to Team Directory.`);
  };

  const handleToggleMemberStatus = (memberId) => {
    setTeamMembers(prev => {
      const updated = prev.map(m => {
        if (m.id === memberId) {
          const nextStatus = m.status === 'Online' ? 'Offline' : 'Online';
          const mod = { ...m, status: nextStatus, lastActive: nextStatus === 'Online' ? 'Now' : '10 min ago' };
          databaseBridge.saveMember(mod);
          return mod;
        }
        return m;
      });
      return updated;
    });
  };

  const [activeChatChannel, setActiveChatChannel] = useState(null);

  const handleOpenDirectChat = (memberId, memberName) => {
    // Find or generate personal DM channel for this member
    const targetMember = teamMembers.find(m => m.id === memberId || m.name === memberName);
    const cleanEmail = (targetMember?.email || '').replace(/[@.]/g, '_');
    const directKey = `dm_jagadish2k2006_gmail_com___${cleanEmail || memberId}`;

    setActiveChatChannel(directKey);
    setCurrentTab('messages');
  };

  // Attendance actions
  const handleRecordAttendance = (record) => {
    setAttendance(prev => {
      let updated;
      const exists = prev.find(a => a.id === record.id);
      if (exists) {
        updated = prev.map(a => a.id === record.id ? { ...a, ...record } : a);
      } else {
        updated = [record, ...prev];
      }
      databaseBridge.appendPunchLog(record);
      return updated;
    });
  };

  // Messages actions (Connected to Cloud Firestore & Port 5050 Backend)
  const handleSendMessage = (channelId, message) => {
    setMessages(prev => {
      const existing = prev[channelId] || [];
      return {
        ...prev,
        [channelId]: [...existing, message]
      };
    });
    databaseBridge.appendChatMessage(channelId, message);

    setConversations(prev => {
      return prev.map(c => {
        if (c.id === channelId) {
          return {
            ...c,
            lastMessage: message.text || (message.attachments?.length ? 'Sent an attachment' : 'Recent message'),
            time: message.time || 'Just now',
            timestamp: Date.now()
          };
        }
        return c;
      }).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    });

    firebaseBridge.sendMessage(channelId, message.text || message.content, {
      senderName: userProfile.name,
      senderPhoto: userProfile.avatar,
      senderEmail: userProfile.email || 'jagadish2k2006@gmail.com',
      senderUid: userProfile.uid || 'RD-FOUNDER-001',
      senderEmpId: userProfile.id || 'RD-FOUNDER-001',
      attachments: message.attachments || (message.attachment ? [message.attachment] : [])
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
  const handleUploadFile = (newFile) => {
    setFiles(prev => {
      const updated = [newFile, ...prev.filter(f => f.id !== newFile.id)];
      electronBridge.saveState({ files: updated });
      return updated;
    });
    electronBridge.showNotification('File Synchronized', `${newFile.name} uploaded to REDDOT Gateway.`);
  };

  const handleDeleteFile = async (fileId) => {
    setFiles(prev => {
      const updated = prev.filter(f => f.id !== fileId);
      electronBridge.saveState({ files: updated });
      return updated;
    });
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
      electronBridge.saveState({ userProfile: updatedProfile });
      await firebaseBridge.updateMemberPhoto(res.dataUrl);
      electronBridge.showNotification('Profile Photo Updated', 'New ID Card badge image saved successfully.');
    }
  };

  const timerObject = {
    isRunning: timerRunning,
    formattedTime: formatTimerDigits(timerSeconds),
    startTime: timerStartTime,
    expectedClockOut: timerExpectedEnd
  };

  return (
    <div className="app-container">
      {/* Top Navigation Bar */}
      <Topbar 
        activeTheme={theme}
        onOpenOmnibox={() => setIsOmniboxOpen(true)}
        onOpenSettings={() => setCurrentTab('settings')}
        userProfile={userProfile}
        notifications={notifications}
        isPinned={isDesktopPinned}
        onTogglePin={handleTogglePin}
      />

      {/* Main Body: Sidebar + Main Content Area */}
      <div className="app-body">
        <Sidebar 
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          onOpenWorkspaceOs={() => setIsWorkspaceOsOpen(true)}
          onOpenTerminal={() => setIsTerminalOpen(true)}
          tasksCount={tasks.length}
          unreadMessagesCount={1}
          metrics={metrics}
        />

        <main className="main-content">
          <ErrorBoundary key={currentTab}>
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
                onCleanMemory={() => {
                  electronBridge.cleanMemory();
                  electronBridge.showNotification('Memory Cleaned', 'Trimmed process heap and requested garbage collection.');
                }}
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
                onAddMember={handleAddMember}
                onToggleMemberStatus={handleToggleMemberStatus}
                onOpenDirectChat={handleOpenDirectChat}
              />
            )}

            {currentTab === 'attendance' && (
              <AttendanceView 
                attendance={attendance}
                onRecordAttendance={handleRecordAttendance}
                currentMember={userProfile.name}
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
              />
            )}
          </ErrorBoundary>
        </main>
      </div>

      {/* SYSTEM OVERLAYS & MODALS */}
      <WorkspaceOsModal 
        isOpen={isWorkspaceOsOpen}
        onClose={() => setIsWorkspaceOsOpen(false)}
      />

      <TerminalModal 
        isOpen={isTerminalOpen}
        onClose={() => setIsTerminalOpen(false)}
        tasks={tasks}
        teamMembers={teamMembers}
        onToggleTheme={handleToggleTheme}
      />

      <OmniboxModal 
        isOpen={isOmniboxOpen}
        onClose={() => setIsOmniboxOpen(false)}
        onNavigateTab={setCurrentTab}
        tasks={tasks}
        files={files}
        teamMembers={teamMembers}
      />
    </div>
  );
}

export default App;
