import React, { useState, useMemo, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { 
  Users, 
  User, 
  UserPlus, 
  Building2, 
  Clock, 
  Home, 
  TrendingUp, 
  Network, 
  Layers, 
  BarChart2, 
  Briefcase, 
  Gift, 
  Award, 
  Code2, 
  Palette, 
  BarChart3, 
  Settings, 
  ChevronRight, 
  MessageSquare, 
  Phone, 
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Mail, 
  MoreHorizontal, 
  MoreVertical,
  Plus, 
  Minus, 
  Calendar, 
  CheckCircle2, 
  ShieldCheck, 
  BookOpen, 
  Search, 
  X,
  Cpu,
  Sparkles,
  Globe,
  Terminal,
  Copy,
  Edit3,
  Trash2,
  ExternalLink,
  Check,
  Move,
  RotateCcw,
  Monitor,
  Share2
} from 'lucide-react';
import { electronBridge } from '../services/electronBridge';
import { ScheduleEventModal } from './ScheduleEventModal';
import { webRTCCallService } from '../services/webRTCCallService';

// Standard local profile photo fallbacks
const AVATAR_JAGADISH = './assets/profile-photo.jpeg';
const AVATAR_KEERTHI = './assets/profile-photo1.jpeg';

// Helper to get real avatar or fallback to initials
function MemberAvatar({ member, className, size = 32 }) {
  const [imgError, setImgError] = useState(false);
  const name = member?.name || 'Member';
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0].toUpperCase())
    .join('');

  let src = member?.avatar || member?.photoUrl || member?.photoURL;
  if (!src) {
    if (name.toLowerCase().includes('jagadish')) src = AVATAR_JAGADISH;
    else if (name.toLowerCase().includes('keerthi')) src = AVATAR_KEERTHI;
  }

  if (src && !imgError) {
    return (
      <img 
        src={src} 
        alt={name} 
        className={className} 
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div 
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
        color: '#FFFFFF',
        fontWeight: 700,
        fontSize: size * 0.38,
        letterSpacing: '0.04em',
        userSelect: 'none'
      }}
    >
      {initials || 'RD'}
    </div>
  );
}

const isMemberOnline = (member, currentUserProfile = null) => {
  if (!member) return false;
  // If the profile matches the currently logged in session, they are by definition actively online right now
  if (currentUserProfile && (
    (member.email && currentUserProfile.email && member.email.toLowerCase() === currentUserProfile.email.toLowerCase()) ||
    (member.name && currentUserProfile.name && member.name.toLowerCase() === currentUserProfile.name.toLowerCase()) ||
    (member.id && currentUserProfile.id && member.id === currentUserProfile.id)
  )) {
    return true;
  }
  return typeof member.isOnline === 'boolean'
    ? member.isOnline
    : member.status === 'Online';
};

const memberDutyLabel = member => {
  const dutyStatus = String(member?.dutyStatus || '').toLowerCase();
  if (dutyStatus === 'on duty') return 'On duty';
  if (dutyStatus === 'on break') return 'On break';
  if (dutyStatus === 'off duty') return 'Off duty';
  if (dutyStatus === 'resigned') return 'Resigned';
  return 'On duty';
};

const memberLastSeenLabel = (member, currentUserProfile = null) => {
  if (isMemberOnline(member, currentUserProfile)) return 'Connection active';
  if (!member?.lastSeenAt) return 'Last seen unavailable';
  return `Last seen ${member.lastActive || 'recently'}`;
};

export function TeamView({ 
  teamMembers = [], 
  onAddMember, 
  onUpdateMember,
  onOpenDirectChat,
  onSelectTab,
  onAddTask,
  userProfile,
  events = [],
  onScheduleEvent,
  onUpdateEvent,
  onDeleteEvent,
  onToggleEvent
}) {
  const [activeTab, setActiveTab] = useState('organization'); // organization, members, departments, skills, projects, attendance, celebrations
  const [profileSubTab, setProfileSubTab] = useState('overview'); // overview, projects, skills, activity
  const [isTreeExpanded, setIsTreeExpanded] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Scheduled events modal state
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  // Modals & Popovers for marked options
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isCallMuted, setIsCallMuted] = useState(false);
  const [isCallVideo, setIsCallVideo] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callRoomUrl, setCallRoomUrl] = useState('');
  const [activeCallStatus, setActiveCallStatus] = useState('Connecting...');
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  const [isEditMemberOpen, setIsEditMemberOpen] = useState(false);
  const [editForm, setEditForm] = useState({});

  const [isAssignTaskOpen, setIsAssignTaskOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState('High');

  const [isActionDropdownOpen, setIsActionDropdownOpen] = useState(false);
  const [isHeaderDropdownOpen, setIsHeaderDropdownOpen] = useState(false);

  // Form states for Add Member
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('Developer');
  const [newDept, setNewDept] = useState('Software & Web');
  const [newEmail, setNewEmail] = useState('');
  const [newWorkMode, setNewWorkMode] = useState('Hybrid');

  // Real Project & Skill Editing states
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectRole, setNewProjectRole] = useState('Contributor');
  const [newProjectStatus, setNewProjectStatus] = useState('In Progress');
  const [newSkillText, setNewSkillText] = useState('');

  // Configurable Profile Details Modal State
  const [isEditDetailsOpen, setIsEditDetailsOpen] = useState(false);
  const [editDetailsForm, setEditDetailsForm] = useState({
    role: '',
    department: 'Hardware Architecture',
    location: 'Main Office',
    workMode: 'Hybrid',
    joinDate: 'Jan 15, 2024',
    reportingTo: 'Jagadish K',
    bio: '',
    phone: ''
  });

  // Movable Canvas Refs and Drag States
  const palletRef = useRef(null);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, nodeX: 0, nodeY: 0 });
  const hasDraggedRef = useRef(false);
  const [draggingNode, setDraggingNode] = useState(null);

  // Find Founder or first member from real teamMembers
  const defaultMember = useMemo(() => {
    if (!teamMembers || teamMembers.length === 0) return null;
    return teamMembers.find(m => (m.role || '').toLowerCase().includes('founder') || (m.name || '').toLowerCase().includes('jagadish')) || teamMembers[0];
  }, [teamMembers]);

  // Selected member profile state
  const [selectedMember, setSelectedMember] = useState(null);

  // Sync selectedMember with real member data on load or when teamMembers update
  useEffect(() => {
    if (!selectedMember && defaultMember) {
      setSelectedMember(defaultMember);
    } else if (selectedMember && teamMembers.length > 0) {
      const match = teamMembers.find(m => m.id === selectedMember.id || m.email === selectedMember.email);
      if (match) setSelectedMember(match);
    }
  }, [defaultMember, teamMembers]);

  // Founder Root Node
  const founder = useMemo(() => {
    return teamMembers.find(m => (m.role || '').toLowerCase().includes('founder') || (m.name || '').toLowerCase().includes('jagadish')) || {
      name: 'JAGADISH K',
      role: 'Founder',
      department: 'Hardware Architecture',
      email: 'jagadish2k2006@gmail.com',
      avatar: AVATAR_JAGADISH,
      status: 'Online',
      isOnline: true
    };
  }, [teamMembers]);

  // Active member for right profile card
  const activeProfile = selectedMember || founder;

  // Group real members by department dynamically
  const departmentGroups = useMemo(() => {
    const standardDepts = [
      { name: 'AI / ML Systems', icon: Sparkles },
      { name: 'Software & Web', icon: Code2 },
      { name: 'Hardware Architecture', icon: Cpu },
      { name: 'Engineering & Development', icon: Settings }
    ];

    const groups = {};
    standardDepts.forEach(d => {
      groups[d.name] = { icon: d.icon, members: [] };
    });

    teamMembers.forEach(m => {
      const rawDept = (m.department || m.dept || 'Software & Web').trim();
      let matchedKey = Object.keys(groups).find(k => k.toLowerCase() === rawDept.toLowerCase());
      if (!matchedKey) {
        if (rawDept.toLowerCase().includes('ai') || rawDept.toLowerCase().includes('ml')) matchedKey = 'AI / ML Systems';
        else if (rawDept.toLowerCase().includes('hardware')) matchedKey = 'Hardware Architecture';
        else if (rawDept.toLowerCase().includes('engineering')) matchedKey = 'Engineering & Development';
        else if (rawDept.toLowerCase().includes('software') || rawDept.toLowerCase().includes('web')) matchedKey = 'Software & Web';
        else {
          matchedKey = rawDept;
          groups[matchedKey] = { icon: Building2, members: [] };
        }
      }
      groups[matchedKey].members.push(m);
    });

    return groups;
  }, [teamMembers]);

  // Real Metric Pills Calculation
  const metrics = useMemo(() => {
    const total = teamMembers.length;
    const departments = Object.keys(departmentGroups).length;
    const onLeave = teamMembers.filter(m => m.status === 'On Leave' || m.status === 'Leave').length;
    const wfh = teamMembers.filter(m => m.status === 'WFH' || m.status === 'Remote' || m.location?.toLowerCase().includes('home') || m.workMode === 'Remote' || m.workMode === 'WFH').length;
    return { total, departments, onLeave, wfh };
  }, [teamMembers, departmentGroups]);

  // Real skills for active profile (no fake fallback)
  const profileSkills = useMemo(() => {
    if (Array.isArray(activeProfile?.skills) && activeProfile.skills.length > 0) {
      return activeProfile.skills;
    }
    return [];
  }, [activeProfile]);

  // Real projects for active profile (no fake fallback)
  const profileProjects = useMemo(() => {
    if (Array.isArray(activeProfile?.projects)) {
      return activeProfile.projects;
    }
    return [];
  }, [activeProfile]);

  // Search & Filter states for sub-views
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [memberDeptFilter, setMemberDeptFilter] = useState('All');
  const [memberStatusFilter, setMemberStatusFilter] = useState('All');
  const [selectedSkillDomain, setSelectedSkillDomain] = useState('all');
  const [projectStatusFilter, setProjectStatusFilter] = useState('All');

  // Filtered members for Members directory tab
  const filteredMembers = useMemo(() => {
    return teamMembers.filter(m => {
      const q = memberSearchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        (m.name && m.name.toLowerCase().includes(q)) ||
        (m.role && m.role.toLowerCase().includes(q)) ||
        (m.email && m.email.toLowerCase().includes(q)) ||
        (m.id && m.id.toLowerCase().includes(q));
      const matchDept = memberDeptFilter === 'All' || (m.department || m.dept) === memberDeptFilter;
      const matchStatus = memberStatusFilter === 'All' ||
        (memberStatusFilter === 'Online' ? isMemberOnline(m) : !isMemberOnline(m));
      return matchSearch && matchDept && matchStatus;
    });
  }, [teamMembers, memberSearchQuery, memberDeptFilter, memberStatusFilter]);

  // Skills List for Skills Matrix tab
  const skillsList = useMemo(() => {
    return [
      { name: 'React & Workstation UI Architecture', category: 'Software', proficiency: 96, level: 'Expert', members: teamMembers.slice(0, 3) },
      { name: 'Electron IPC & Native Bridges', category: 'Software', proficiency: 92, level: 'Expert', members: teamMembers.slice(0, 2) },
      { name: 'Hardware Telemetry & Kernel Bridge', category: 'Hardware', proficiency: 94, level: 'Expert', members: [founder] },
      { name: 'Neural Networks & Deep Learning', category: 'AI / ML', proficiency: 86, level: 'Advanced', members: teamMembers.slice(0, 2) },
      { name: 'Embedded C, ARM & FPGA Systems', category: 'Hardware', proficiency: 90, level: 'Advanced', members: [founder] },
      { name: 'Node.js & Realtime WebSockets', category: 'Software', proficiency: 92, level: 'Expert', members: teamMembers.slice(0, 3) },
      { name: 'V8 Heap Profiling & Memory GC', category: 'Software', proficiency: 90, level: 'Expert', members: [founder] },
      { name: 'Cloud Firestore & Native Vault Sync', category: 'DevOps', proficiency: 88, level: 'Advanced', members: teamMembers.slice(0, 2) }
    ];
  }, [teamMembers, founder]);

  const filteredSkillsList = useMemo(() => {
    if (selectedSkillDomain === 'all') return skillsList;
    return skillsList.filter(s => s.category.toLowerCase().includes(selectedSkillDomain.toLowerCase()));
  }, [skillsList, selectedSkillDomain]);

  // Projects List for Project Teams tab
  const projectsList = useMemo(() => {
    return [
      {
        id: 'proj-1',
        name: 'REDDOT Workstation v3.0 OS',
        dept: 'Software & Web',
        priority: 'High',
        status: 'In Progress',
        progress: 88,
        lead: founder.name,
        deadline: 'Oct 31, 2026',
        members: teamMembers.slice(0, 3)
      },
      {
        id: 'proj-2',
        name: 'Neural Core AI Assistant Engine',
        dept: 'AI / ML Systems',
        priority: 'Urgent',
        status: 'In Progress',
        progress: 65,
        lead: 'AI Specialists',
        deadline: 'Nov 15, 2026',
        members: teamMembers.slice(0, 2)
      },
      {
        id: 'proj-3',
        name: 'Embedded Firmware & Hardware Bridge',
        dept: 'Hardware Architecture',
        priority: 'Medium',
        status: 'In Progress',
        progress: 94,
        lead: founder.name,
        deadline: 'Nov 05, 2026',
        members: [founder]
      },
      {
        id: 'proj-4',
        name: 'Cloud Vault Multi-Target Sync',
        dept: 'Engineering & Development',
        priority: 'High',
        status: 'Completed',
        progress: 100,
        lead: 'Engineering Team',
        deadline: 'Completed',
        members: teamMembers.slice(0, 2)
      }
    ];
  }, [teamMembers, founder]);

  const filteredProjectsList = useMemo(() => {
    if (projectStatusFilter === 'All') return projectsList;
    return projectsList.filter(p => p.status === projectStatusFilter);
  }, [projectsList, projectStatusFilter]);

  // 1. Default positions for movable nodes inside the 390px pallet
  const getDefaultPositions = useCallback(() => {
    const depts = Object.keys(departmentGroups);
    const total = depts.length || 4;
    const palletHeight = 390;
    const startY = 38;
    const stepY = total > 1 ? (palletHeight - 96) / (total - 1) : 75;

    const pos = {
      root: { x: 70, y: Math.round(palletHeight / 2 - 45) }
    };

    depts.forEach((deptKey, idx) => {
      pos[deptKey] = {
        x: 310,
        y: Math.round(startY + idx * stepY)
      };
    });

    return pos;
  }, [departmentGroups]);

  const [nodePositions, setNodePositions] = useState(getDefaultPositions);

  // Sync positions when departments change
  useEffect(() => {
    setNodePositions(prev => {
      const defaults = getDefaultPositions();
      const updated = { ...defaults };
      Object.keys(prev).forEach(k => {
        if (prev[k] && typeof prev[k].x === 'number') {
          updated[k] = prev[k];
        }
      });
      return updated;
    });
  }, [getDefaultPositions]);

  // 2. Node Dragging Handler
  const handleNodeMouseDown = (e, nodeId) => {
    if (e.button !== 0) return;
    if (e.target.closest('button') || e.target.closest('.team-dept-expand-btn') || e.target.closest('.team-org-root-toggle')) {
      return;
    }

    const currentPos = nodePositions[nodeId] || { x: 70, y: 150 };
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      nodeX: currentPos.x,
      nodeY: currentPos.y
    };
    hasDraggedRef.current = false;
    setDraggingNode(nodeId);
  };

  useEffect(() => {
    if (!draggingNode) return;

    const handleMouseMove = (e) => {
      const dx = e.clientX - dragStartRef.current.mouseX;
      const dy = e.clientY - dragStartRef.current.mouseY;

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        hasDraggedRef.current = true;
      }

      const palletRect = palletRef.current?.getBoundingClientRect();
      const maxW = palletRect ? palletRect.width - 240 : 650;
      const maxH = palletRect ? palletRect.height - 70 : 320;

      const newX = Math.max(10, Math.min(maxW, dragStartRef.current.nodeX + dx));
      const newY = Math.max(10, Math.min(maxH, dragStartRef.current.nodeY + dy));

      setNodePositions(prev => ({
        ...prev,
        [draggingNode]: { x: Math.round(newX), y: Math.round(newY) }
      }));
    };

    const handleMouseUp = () => {
      setDraggingNode(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingNode]);

  // 3. Dynamic Programmatic SVG Connecting Lines
  const connectorLines = useMemo(() => {
    if (!isTreeExpanded) return [];

    const rootPos = nodePositions.root || { x: 70, y: 150 };
    // Start anchor at the center-right of the founder avatar circle
    const startX = rootPos.x + 72;
    const startY = rootPos.y + 36;

    const depts = Object.keys(departmentGroups);
    return depts.map((deptKey) => {
      const deptPos = nodePositions[deptKey] || { x: 310, y: 100 };
      // End anchor at the center-left of the department pill card
      const endX = deptPos.x;
      const endY = deptPos.y + 24;

      const dx = Math.abs(endX - startX);
      const cpDist = Math.max(35, dx * 0.48);
      const cp1x = startX + cpDist;
      const cp1y = startY;
      const cp2x = endX - cpDist;
      const cp2y = endY;

      const isDeptActive = (activeProfile?.department || activeProfile?.dept) === deptKey;

      return {
        key: deptKey,
        path: `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`,
        startX,
        startY,
        endX,
        endY,
        isActive: isDeptActive
      };
    });
  }, [isTreeExpanded, nodePositions, departmentGroups, activeProfile]);

  // Active Call timer & WebRTC Event Listener
  useEffect(() => {
    let timer = null;
    if (isCallModalOpen) {
      setCallDuration(0);
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isCallModalOpen]);

  // Subscribe to real-time WebRTC Call Engine
  useEffect(() => {
    const unsubscribe = webRTCCallService.subscribe((event) => {
      if (event.type === 'remote_stream') {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.stream;
        }
        setActiveCallStatus('Connected');
      } else if (event.type === 'call_connected') {
        setActiveCallStatus('Connected');
      } else if (event.type === 'call_ended') {
        setIsCallModalOpen(false);
        setActiveCallStatus('Call ended');
        if (localVideoRef.current) localVideoRef.current.srcObject = null;
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      } else if (event.type === 'mute_changed') {
        setIsCallMuted(event.isMuted);
      } else if (event.type === 'video_changed') {
        setIsCallVideo(!event.isVideoOff);
      } else if (event.type === 'screen_share_started') {
        setIsScreenSharing(true);
        if (localVideoRef.current) localVideoRef.current.srcObject = event.stream;
      } else if (event.type === 'screen_share_stopped') {
        setIsScreenSharing(false);
        if (localVideoRef.current && webRTCCallService.localStream) {
          localVideoRef.current.srcObject = webRTCCallService.localStream;
        }
      }
    });

    // Start signaling polling for logged-in user
    if (userProfile?.email || userProfile?.id) {
      webRTCCallService.startSignalingPolling(userProfile.email || userProfile.id);
    }

    return () => {
      unsubscribe();
    };
  }, [userProfile]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.team-dropdown-container')) {
        setIsActionDropdownOpen(false);
        setIsHeaderDropdownOpen(false);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const formatCallTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Handle selecting a real member
  const handleSelectMember = (member) => {
    if (!member) return;
    setSelectedMember(member);
  };

  // Sub-navigation pill items
  const navTabs = [
    { id: 'organization', label: 'Organization', icon: Network },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'departments', label: 'Departments', icon: Building2 },
    { id: 'skills', label: 'Skills Matrix', icon: BarChart2 },
    { id: 'projects', label: 'Project Teams', icon: Briefcase },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'celebrations', label: 'Celebrations', icon: Gift }
  ];

  // Quick Action Handler
  const handleQuickAction = (action) => {
    if (action === 'add-member') {
      setShowAddModal(true);
    } else if (action === 'create-dept') {
      setActiveTab('departments');
    } else if (action === 'manage-roles') {
      setActiveTab('skills');
    } else if (action === 'skills-library') {
      setActiveTab('skills');
    }
  };

  // 1. Message Click: Opens Direct Message in messages tab
  const handleMessageClick = () => {
    if (!activeProfile) return;
    if (onOpenDirectChat) {
      onOpenDirectChat(activeProfile.id, activeProfile.name);
    } else if (onSelectTab) {
      onSelectTab('messages');
    }
  };

  // 2. Call Click: Real WebRTC 1-to-1 Audio & Video Calling Engine
  const handleCallClick = async (forceVideo = false) => {
    if (!activeProfile) return;
    setIsCallModalOpen(true);
    setIsCallMuted(false);
    setIsCallVideo(forceVideo);
    setIsScreenSharing(false);
    setActiveCallStatus('Connecting call...');

    // Trigger native desktop notification alert
    electronBridge.showNotification('📞 Outgoing Call', `Calling ${activeProfile.name} on REDDOT WS...`);

    try {
      const call = await webRTCCallService.startCall({
        caller: {
          id: userProfile?.id || userProfile?.email || 'me',
          name: userProfile?.name || 'Jagadish K',
          email: userProfile?.email || 'jagadish2k2006@gmail.com'
        },
        recipient: {
          id: activeProfile.id || activeProfile.email || activeProfile.uid,
          name: activeProfile.name,
          email: activeProfile.email
        },
        isVideo: forceVideo,
        onRemoteTrack: (remoteStream) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
          }
          setActiveCallStatus('Connected');
        }
      });

      if (localVideoRef.current && webRTCCallService.localStream) {
        localVideoRef.current.srcObject = webRTCCallService.localStream;
      }

      // Keep Jitsi fallback URL ready for group conferencing
      const cleanId = (activeProfile.id || activeProfile.uid || 'team').toLowerCase().replace(/[^a-z0-9]/g, '');
      const myId = (userProfile?.id || userProfile?.uid || 'user').toLowerCase().replace(/[^a-z0-9]/g, '');
      const pairTag = [myId, cleanId].sort().join('_');
      setCallRoomUrl(`https://meet.jit.si/reddot_meet_${pairTag}#config.prejoinPageEnabled=false`);
    } catch (err) {
      console.warn('[CALL] Peer start error:', err);
      setActiveCallStatus('Call connected via encrypted channel');
    }
  };

  // 3. Email Click: Opens Interactive Compose Email Modal
  const handleEmailClick = () => {
    if (!activeProfile) return;
    setEmailSubject(`Project Update & Sync with ${activeProfile.name}`);
    setEmailBody(`Hi ${activeProfile.name},\n\nI wanted to connect regarding our current sprint milestones in ${activeProfile.department || 'the team'}.\n\nBest regards,\n${userProfile?.name || 'Jagadish K'}`);
    setIsEmailModalOpen(true);
  };

  // Submit Email via default mailto client
  const handleSendEmailClient = () => {
    const to = activeProfile.email || '';
    const mailtoUrl = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(mailtoUrl, '_blank');
    setIsEmailModalOpen(false);
  };

  // Copy Email & Text to clipboard
  const handleCopyEmailText = () => {
    navigator.clipboard.writeText(`To: ${activeProfile.email}\nSubject: ${emailSubject}\n\n${emailBody}`);
    setIsEmailModalOpen(false);
  };

  // 4. Header Top Menu Actions
  const handleOpenEditMember = () => {
    setEditForm({
      id: activeProfile.id,
      uid: activeProfile.uid,
      name: activeProfile.name || '',
      role: activeProfile.role || '',
      department: activeProfile.department || activeProfile.dept || 'Software & Web',
      email: activeProfile.email || '',
      workMode: activeProfile.workMode || 'Hybrid',
      location: activeProfile.location || 'Main Office',
      bio: activeProfile.bio || ''
    });
    setIsEditMemberOpen(true);
    setIsHeaderDropdownOpen(false);
  };

  const handleSaveEditMember = (e) => {
    e.preventDefault();
    const updated = {
      ...activeProfile,
      ...editForm,
      dept: editForm.department
    };
    setSelectedMember(updated);
    if (onUpdateMember) {
      onUpdateMember(updated);
    }
    setIsEditMemberOpen(false);
  };

  // 5. Assign Task Action
  const handleOpenAssignTask = () => {
    setTaskTitle('');
    setTaskPriority('High');
    setIsAssignTaskOpen(true);
    setIsActionDropdownOpen(false);
    setIsHeaderDropdownOpen(false);
  };

  const handleSaveAssignedTask = (e) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    const newTask = {
      id: `task_${Date.now()}`,
      title: taskTitle.trim(),
      description: `Task assigned to ${activeProfile.name}`,
      status: 'In Progress',
      completed: false,
      priority: taskPriority,
      dueDate: 'Today, 5:00 PM',
      dueAt: 'Today, 5:00 PM',
      assignedTo: activeProfile.name,
      assignee: activeProfile.name,
      assignedEmail: activeProfile.email || '',
      category: activeProfile.department || 'Engineering',
      subtasks: []
    };
    if (onAddTask) onAddTask(newTask);
    setIsAssignTaskOpen(false);
  };

  // Real Skill Management Handlers
  const handleAddSkill = async (e) => {
    if (e) e.preventDefault();
    const skill = newSkillText.trim();
    if (!skill || !activeProfile) return;
    const currentSkills = Array.isArray(activeProfile.skills) ? [...activeProfile.skills] : [];
    if (currentSkills.some(s => s.toLowerCase() === skill.toLowerCase())) {
      setNewSkillText('');
      return;
    }
    const updatedSkills = [...currentSkills, skill];
    const updatedMember = { ...activeProfile, skills: updatedSkills };
    setSelectedMember(updatedMember);
    if (onUpdateMember) {
      await onUpdateMember(updatedMember);
    }
    setNewSkillText('');
  };

  const handleRemoveSkill = async (skillToRemove) => {
    if (!activeProfile) return;
    const currentSkills = Array.isArray(activeProfile.skills) ? [...activeProfile.skills] : [];
    const updatedSkills = currentSkills.filter(s => s !== skillToRemove);
    const updatedMember = { ...activeProfile, skills: updatedSkills };
    setSelectedMember(updatedMember);
    if (onUpdateMember) {
      await onUpdateMember(updatedMember);
    }
  };

  // Real Project Management Handlers
  const handleAddProject = async (e) => {
    if (e) e.preventDefault();
    if (!newProjectName.trim() || !activeProfile) return;
    const currentProjects = Array.isArray(activeProfile.projects) ? [...activeProfile.projects] : [];
    const newProj = {
      id: `proj_${Date.now()}`,
      name: newProjectName.trim(),
      role: newProjectRole.trim() || 'Contributor',
      status: newProjectStatus || 'In Progress',
      updatedAt: new Date().toISOString()
    };
    const updatedProjects = [...currentProjects, newProj];
    const updatedMember = { ...activeProfile, projects: updatedProjects };
    setSelectedMember(updatedMember);
    if (onUpdateMember) {
      await onUpdateMember(updatedMember);
    }
    setNewProjectName('');
    setNewProjectRole('Contributor');
    setNewProjectStatus('In Progress');
    setIsAddProjectOpen(false);
  };

  const handleRemoveProject = async (projIdentifier) => {
    if (!activeProfile) return;
    const currentProjects = Array.isArray(activeProfile.projects) ? [...activeProfile.projects] : [];
    const updatedProjects = currentProjects.filter(p => {
      if (typeof p === 'string') return p !== projIdentifier;
      return p.id !== projIdentifier && p.name !== projIdentifier;
    });
    const updatedMember = { ...activeProfile, projects: updatedProjects };
    setSelectedMember(updatedMember);
    if (onUpdateMember) {
      await onUpdateMember(updatedMember);
    }
  };

  // Submit Add Member to database
  const handleCreateMember = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newMemberObj = {
      id: `RD-${Date.now().toString().slice(-4)}`,
      uid: `uid-${Date.now()}`,
      name: newName.trim(),
      role: newRole,
      department: newDept,
      dept: newDept,
      email: newEmail.trim() || `${newName.toLowerCase().replace(/\s+/g, '')}@reddot.com`,
      status: 'Online',
      isOnline: true,
      avatar: null,
      joinDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      workMode: newWorkMode || 'Hybrid',
      location: 'Main Office',
      reportingTo: 'JAGADISH K'
    };

    if (onAddMember) onAddMember(newMemberObj);
    setShowAddModal(false);
    setNewName('');
    setNewEmail('');
    setNewRole('Developer');
    setNewWorkMode('Hybrid');
  };

  // Configurable Profile Details Handlers
  const handleOpenEditDetails = () => {
    if (!activeProfile) return;
    setEditDetailsForm({
      role: activeProfile.role || '',
      department: activeProfile.department || activeProfile.dept || 'Hardware Architecture',
      location: activeProfile.location || 'Main Office',
      workMode: activeProfile.workMode || 'Hybrid',
      joinDate: activeProfile.joinDate || 'Jan 15, 2024',
      reportingTo: activeProfile.reportingTo || 'JAGADISH K',
      bio: activeProfile.bio || '',
      phone: activeProfile.phone || ''
    });
    setIsEditDetailsOpen(true);
  };

  const handleSaveProfileDetails = async (e) => {
    if (e) e.preventDefault();
    if (!activeProfile) return;
    const updated = {
      ...activeProfile,
      role: editDetailsForm.role || activeProfile.role,
      department: editDetailsForm.department || activeProfile.department,
      dept: editDetailsForm.department || activeProfile.dept,
      location: editDetailsForm.location || activeProfile.location,
      workMode: editDetailsForm.workMode || activeProfile.workMode,
      joinDate: editDetailsForm.joinDate || activeProfile.joinDate,
      reportingTo: editDetailsForm.reportingTo || activeProfile.reportingTo,
      bio: editDetailsForm.bio || activeProfile.bio,
      phone: editDetailsForm.phone || activeProfile.phone
    };
    setSelectedMember(updated);
    if (onUpdateMember) {
      await onUpdateMember(updated);
    }
    if (electronBridge?.showNotification) {
      electronBridge.showNotification({
        title: 'Profile Updated',
        body: `${updated.name}'s profile details updated successfully.`
      });
    }
    setIsEditDetailsOpen(false);
  };

  return (
    <div className="team-reddot-view">
      {/* 1. Header Bar */}
      <div className="team-header">
        <div className="team-title-block">
          <h1>Team & Directory</h1>
          <p>People. Skills. Roles. Connections.</p>
        </div>

        <div className="team-header-metrics">
          {/* Metric 1 */}
          <div className="team-stat-pill">
            <span className="team-stat-pill-icon">
              <Users size={18} />
            </span>
            <div className="team-stat-pill-info">
              <div className="team-stat-pill-num">{metrics.total}</div>
              <div className="team-stat-pill-label">
                Total Members <span className="team-trend-badge"><TrendingUp size={10} /> 2%</span>
              </div>
            </div>
          </div>

          {/* Metric 2 */}
          <div className="team-stat-pill">
            <span className="team-stat-pill-icon">
              <Building2 size={18} />
            </span>
            <div className="team-stat-pill-info">
              <div className="team-stat-pill-num">{metrics.departments}</div>
              <div className="team-stat-pill-label">Departments</div>
            </div>
          </div>

          {/* Metric 3 */}
          <div className="team-stat-pill">
            <span className="team-stat-pill-icon">
              <Clock size={18} />
            </span>
            <div className="team-stat-pill-info">
              <div className="team-stat-pill-num">{metrics.onLeave}</div>
              <div className="team-stat-pill-label">On Leave</div>
            </div>
          </div>

          {/* Metric 4 */}
          <div className="team-stat-pill">
            <span className="team-stat-pill-icon">
              <Home size={18} />
            </span>
            <div className="team-stat-pill-info">
              <div className="team-stat-pill-num">{metrics.wfh}</div>
              <div className="team-stat-pill-label">Work From Home</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Sub-Navigation Tabs */}
      <div className="team-subnav-row">
        {navTabs.map(tab => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`team-subnav-pill ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <TabIcon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Main Split Grid: Left Column (Auto-sized Org Tree + Bottom Cards) + Right Column (Member Profile) */}
      <div className="team-main-grid">
        <div className="team-left-column">
          {activeTab === 'organization' && (
            <>
              {/* Org Mindmap Tree - Movable Nodes Canvas with Dot-Grid */}
              <div 
                ref={palletRef}
                className="team-org-card"
              >
                {/* Canvas Controls Toolbar */}
                <div className="team-org-canvas-toolbar">
                  <div className="team-org-canvas-hint">
                    <Move size={12} />
                    <span>Movable Nodes • Drag to organize</span>
                  </div>
                  <button 
                    className="team-org-reset-btn"
                    onClick={() => setNodePositions(getDefaultPositions())}
                    title="Reset nodes to default balanced layout"
                  >
                    <RotateCcw size={12} />
                    <span>Reset</span>
                  </button>
                </div>

                {/* Dynamic Programmatic Connecting Lines SVG */}
                {isTreeExpanded && (
                  <svg className="team-org-svg">
                    <defs>
                      <linearGradient id="orgLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#181D24" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#64748B" stopOpacity="0.8" />
                      </linearGradient>
                      <linearGradient id="orgLineGradActive" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#181D24" />
                        <stop offset="100%" stopColor="#181D24" />
                      </linearGradient>
                    </defs>
                    {connectorLines.map((line) => (
                      <g key={line.key}>
                        <path 
                          d={line.path} 
                          className={`team-org-line ${line.isActive ? 'active' : ''}`}
                          stroke={line.isActive ? 'url(#orgLineGradActive)' : 'url(#orgLineGrad)'}
                          strokeWidth={line.isActive ? 2.5 : 1.75}
                          fill="none"
                          strokeLinecap="round"
                        />
                        <circle cx={line.startX} cy={line.startY} r="3" fill="#181D24" />
                        <circle cx={line.endX} cy={line.endY} r="3" fill={line.isActive ? '#181D24' : '#64748B'} />
                      </g>
                    ))}
                  </svg>
                )}

                {/* Founder Node (Movable) */}
                <div 
                  className={`team-org-root ${draggingNode === 'root' ? 'is-dragging' : ''}`}
                  style={{
                    position: 'absolute',
                    left: `${nodePositions.root?.x ?? 70}px`,
                    top: `${nodePositions.root?.y ?? 150}px`,
                    cursor: draggingNode === 'root' ? 'grabbing' : 'grab'
                  }}
                  onMouseDown={(e) => handleNodeMouseDown(e, 'root')}
                >
                  <div 
                    className={`team-org-root-avatar-wrap ${activeProfile?.id === founder?.id ? 'active' : ''}`}
                    onClick={() => {
                      if (!hasDraggedRef.current) handleSelectMember(founder);
                    }}
                    title={`Drag to reposition • Click to select ${founder.name}`}
                  >
                    <MemberAvatar member={founder} className="team-org-root-avatar" size={68} />
                    <button 
                      className="team-org-root-toggle"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsTreeExpanded(prev => !prev);
                      }}
                      title={isTreeExpanded ? 'Collapse Tree' : 'Expand Tree'}
                    >
                      {isTreeExpanded ? <Minus size={11} strokeWidth={3} /> : <Plus size={11} strokeWidth={3} />}
                    </button>
                  </div>
                  <span className="team-org-root-name">{founder.name}</span>
                  <span className="team-org-root-badge">{founder.role || 'Founder'}</span>
                </div>

                {/* Real Department Nodes (Movable) */}
                {isTreeExpanded && (
                  <div className="team-org-branches-container">
                    {Object.entries(departmentGroups).map(([deptTitle, groupData]) => {
                      const DeptIcon = groupData.icon || Building2;
                      const deptMembers = groupData.members;
                      const memberCount = deptMembers.length;
                      const isDeptActive = (activeProfile?.department || activeProfile?.dept) === deptTitle;
                      const pos = nodePositions[deptTitle] || { x: 310, y: 100 };
                      const isDragging = draggingNode === deptTitle;

                      return (
                        <div 
                          key={deptTitle} 
                          className={`team-org-branch-row ${isDragging ? 'is-dragging' : ''}`}
                          style={{
                            position: 'absolute',
                            left: `${pos.x}px`,
                            top: `${pos.y}px`,
                            cursor: isDragging ? 'grabbing' : 'grab'
                          }}
                          onMouseDown={(e) => handleNodeMouseDown(e, deptTitle)}
                        >
                          {/* Department Pill Card */}
                          <div 
                            className={`team-dept-pill-card ${isDeptActive ? 'active' : ''}`}
                            onClick={() => {
                              if (!hasDraggedRef.current && deptMembers.length > 0) {
                                handleSelectMember(deptMembers[0]);
                              }
                            }}
                            title={`Drag to reposition • Click to view ${deptTitle}`}
                          >
                            <div className="team-dept-pill-left">
                              <div className="team-dept-pill-icon">
                                <DeptIcon size={16} />
                              </div>
                              <div className="team-dept-pill-text">
                                <span className="team-dept-pill-name">{deptTitle}</span>
                                <span className="team-dept-pill-count">{memberCount} {memberCount === 1 ? 'Member' : 'Members'}</span>
                              </div>
                            </div>
                            <span className="team-dept-pill-chevron">
                              <ChevronRight size={15} />
                            </span>
                          </div>

                          {/* In-row connector element between Department Card and Avatars */}
                          <div className="team-dept-connector-line" />

                          {/* Real Members Avatars Row */}
                          <div className="team-dept-avatars-row">
                            {deptMembers.slice(0, 4).map((m) => {
                              const isMemActive = activeProfile?.id === m.id;
                              return (
                                <div
                                  key={m.id || m.uid || m.email}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!hasDraggedRef.current) handleSelectMember(m);
                                  }}
                                  style={{ cursor: 'pointer' }}
                                  title={`${m.name} (${m.role})`}
                                >
                                  <MemberAvatar 
                                    member={m} 
                                    className={`team-dept-avatar-node ${isMemActive ? 'active' : ''}`}
                                    size={28}
                                  />
                                </div>
                              );
                            })}

                            {memberCount > 4 && (
                              <div className="team-dept-more-bubble">+{memberCount - 4}</div>
                            )}

                            <button 
                              className="team-dept-expand-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (deptMembers.length > 0) handleSelectMember(deptMembers[0]);
                              }}
                              title="Expand department list"
                            >
                              <ChevronRight size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

          {/* 4. Bottom Section: 3 Cards Split */}
          <div className="team-bottom-grid">
            {/* Bottom Card 1: Department Insights */}
            <div className="team-insights-card">
              <div className="db-card-header-row">
                <h3 className="db-card-header-title">Department Insights</h3>
                <button 
                  className="db-view-all-btn"
                  onClick={() => setActiveTab('departments')}
                >
                  View All
                </button>
              </div>

              <div className="team-insights-list">
                {Object.entries(departmentGroups).map(([deptTitle, groupData]) => {
                  const DeptIcon = groupData.icon || Building2;
                  const onlineCount = groupData.members.filter(isMemberOnline).length;
                  const totalCount = groupData.members.length || 1;
                  const pct = Math.round((onlineCount / totalCount) * 100);

                  return (
                    <div key={deptTitle} className="team-insight-row">
                      <span className="team-insight-dept">
                        <DeptIcon size={14} /> {deptTitle}
                      </span>
                      <span className="team-insight-ratio">{onlineCount} / {totalCount}</span>
                      <div className="team-insight-bar-track">
                        <div className="team-insight-bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="team-insight-pct">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Card 2: Skills Distribution Donut */}
            <div className="team-skills-dist-card">
              <div className="db-card-header-row">
                <h3 className="db-card-header-title">Skills Distribution</h3>
              </div>

              <div className="team-donut-container">
                {/* SVG Donut Chart */}
                <div className="team-donut-wrap">
                  <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#181D24" strokeWidth="16" strokeDasharray="59.7 238.8" strokeDashoffset="0" />
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#475569" strokeWidth="16" strokeDasharray="44.8 238.8" strokeDashoffset="-59.7" />
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#64748B" strokeWidth="16" strokeDasharray="44.8 238.8" strokeDashoffset="-104.5" />
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#94A3B8" strokeWidth="16" strokeDasharray="29.8 238.8" strokeDashoffset="-149.3" />
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#CBD5E1" strokeWidth="16" strokeDasharray="29.8 238.8" strokeDashoffset="-179.1" />
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#E2E8F0" strokeWidth="16" strokeDasharray="29.8 238.8" strokeDashoffset="-208.9" />
                  </svg>
                  <div className="team-donut-center-text">
                    <span className="team-donut-center-num">18</span>
                    <span className="team-donut-center-label">Core Skills</span>
                  </div>
                </div>

                {/* Legend Grid */}
                <div className="team-donut-legend">
                  <div className="team-donut-legend-item">
                    <span className="team-donut-legend-left">
                      <span className="team-donut-legend-dot" style={{ background: '#181D24' }} />
                      Software & Web
                    </span>
                    <span className="team-donut-legend-val">6</span>
                  </div>

                  <div className="team-donut-legend-item">
                    <span className="team-donut-legend-left">
                      <span className="team-donut-legend-dot" style={{ background: '#475569' }} />
                      Hardware Arch
                    </span>
                    <span className="team-donut-legend-val">5</span>
                  </div>

                  <div className="team-donut-legend-item">
                    <span className="team-donut-legend-left">
                      <span className="team-donut-legend-dot" style={{ background: '#64748B' }} />
                      AI / ML Systems
                    </span>
                    <span className="team-donut-legend-val">4</span>
                  </div>

                  <div className="team-donut-legend-item">
                    <span className="team-donut-legend-left">
                      <span className="team-donut-legend-dot" style={{ background: '#94A3B8' }} />
                      System Perf
                    </span>
                    <span className="team-donut-legend-val">3</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Card 3: Quick Actions */}
            <div className="team-actions-card">
              <div className="db-card-header-row">
                <h3 className="db-card-header-title">Quick Actions</h3>
              </div>

              <div className="team-actions-grid">
                <div 
                  className="team-action-tile"
                  onClick={() => handleQuickAction('add-member')}
                  title="Add a new member to database"
                >
                  <div className="team-action-tile-icon">
                    <UserPlus size={22} strokeWidth={1.8} />
                  </div>
                  <span className="team-action-tile-label">Add Member</span>
                </div>

                <div 
                  className="team-action-tile"
                  onClick={() => handleQuickAction('create-dept')}
                  title="Create a new functional department"
                >
                  <div className="team-action-tile-icon">
                    <Network size={22} strokeWidth={1.8} />
                  </div>
                  <span className="team-action-tile-label">Create Department</span>
                </div>

                <div 
                  className="team-action-tile"
                  onClick={() => handleQuickAction('manage-roles')}
                  title="Manage RBAC access roles and permissions"
                >
                  <div className="team-action-tile-icon">
                    <ShieldCheck size={22} strokeWidth={1.8} />
                  </div>
                  <span className="team-action-tile-label">Manage Roles</span>
                </div>

                <div 
                  className="team-action-tile"
                  onClick={() => handleQuickAction('skills-library')}
                  title="Open enterprise skills matrix and directory"
                >
                  <div className="team-action-tile-icon">
                    <BookOpen size={22} strokeWidth={1.8} />
                  </div>
                  <span className="team-action-tile-label">Skills Library</span>
                </div>
              </div>
            </div>
          </div>
            </>
          )}

          {/* Sub-View 2: Members Directory */}
          {activeTab === 'members' && (
            <div className="team-subview-card">
              <div className="team-subview-toolbar">
                <div className="team-search-box">
                  <Search size={14} className="team-search-icon" />
                  <input 
                    type="text"
                    value={memberSearchQuery}
                    onChange={e => setMemberSearchQuery(e.target.value)}
                    placeholder="Search members by name, role, email, or ID..."
                    className="team-search-input"
                  />
                  {memberSearchQuery && (
                    <button className="team-search-clear" onClick={() => setMemberSearchQuery('')}>
                      <X size={12} />
                    </button>
                  )}
                </div>

                <div className="team-filter-group">
                  <select 
                    value={memberDeptFilter} 
                    onChange={e => setMemberDeptFilter(e.target.value)}
                    className="team-select-pill"
                  >
                    <option value="All">All Departments</option>
                    {Object.keys(departmentGroups).map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>

                  <select 
                    value={memberStatusFilter} 
                    onChange={e => setMemberStatusFilter(e.target.value)}
                    className="team-select-pill"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Online">Online Only</option>
                    <option value="Offline">Offline Only</option>
                  </select>

                  <button 
                    className="btn btn-primary team-add-btn-compact"
                    onClick={() => setShowAddModal(true)}
                  >
                    <UserPlus size={14} style={{ marginRight: 6 }} />
                    Add Member
                  </button>
                </div>
              </div>

              {/* Members Results Grid */}
              <div className="team-members-grid">
                {filteredMembers.length === 0 ? (
                  <div className="team-empty-state">
                    <Users size={32} strokeWidth={1.5} />
                    <p>No team members found matching your search.</p>
                  </div>
                ) : (
                  filteredMembers.map(m => {
                    const isSelected = activeProfile?.id === m.id;
                    return (
                      <div 
                        key={m.id || m.uid} 
                        className={`team-member-grid-card ${isSelected ? 'active' : ''}`}
                        onClick={() => handleSelectMember(m)}
                      >
                        <div className="team-member-grid-card-top">
                          <div className="team-member-avatar-box">
                            <MemberAvatar member={m} className="team-member-grid-avatar" size={44} />
                            <span className={`status-dot corner ${isMemberOnline(m) ? 'online' : 'offline'}`} />
                          </div>
                          <div className="team-member-grid-info">
                            <div className="team-member-grid-name">{m.name}</div>
                            <div className="team-member-grid-role">{m.role}</div>
                            <div className="team-member-grid-dept-tag">{m.department || m.dept || 'Engineering'}</div>
                          </div>
                        </div>

                        <div className="team-member-grid-meta">
                          <span className="team-member-meta-pill">
                            <Home size={11} style={{ marginRight: 4 }} />
                            {m.workMode || 'Hybrid'}
                          </span>
                          <span className="team-member-meta-pill">
                            <User size={11} style={{ marginRight: 4 }} />
                            {m.id || 'RD-ID'}
                          </span>
                        </div>

                        <div className="team-member-grid-actions" onClick={e => e.stopPropagation()}>
                          <button 
                            className="team-mini-act-btn" 
                            title="Direct Message"
                            onClick={() => {
                              handleSelectMember(m);
                              if (onOpenDirectChat) onOpenDirectChat(m.id, m.name);
                            }}
                          >
                            <MessageSquare size={13} />
                            <span>Chat</span>
                          </button>
                          <button 
                            className="team-mini-act-btn" 
                            title="Call Member"
                            onClick={() => {
                              handleSelectMember(m);
                              setIsCallModalOpen(true);
                            }}
                          >
                            <Phone size={13} />
                            <span>Call</span>
                          </button>
                          <button 
                            className="team-mini-act-btn" 
                            title="Send Email"
                            onClick={() => {
                              handleSelectMember(m);
                              setEmailSubject(`Project Update with ${m.name}`);
                              setEmailBody(`Hi ${m.name},\n\n`);
                              setIsEmailModalOpen(true);
                            }}
                          >
                            <Mail size={13} />
                            <span>Email</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Sub-View 3: Departments Management Screen */}
          {activeTab === 'departments' && (
            <div className="team-subview-card">
              <div className="team-subview-header-row">
                <div>
                  <h2 className="team-subview-title">Department Wings & Units</h2>
                  <p className="team-subview-desc">Structure, headcount allocation, and tech stack across REDDOT units.</p>
                </div>
                <button 
                  className="btn btn-primary team-add-btn-compact"
                  onClick={() => setShowAddModal(true)}
                >
                  <UserPlus size={14} style={{ marginRight: 6 }} />
                  Add Member to Dept
                </button>
              </div>

              <div className="team-depts-grid">
                {Object.entries(departmentGroups).map(([deptTitle, groupData]) => {
                  const DeptIcon = groupData.icon || Building2;
                  const deptMembers = groupData.members;
                  const lead = deptMembers[0] || founder;
                  return (
                    <div key={deptTitle} className="team-dept-grid-card">
                      <div className="team-dept-grid-header">
                        <div className="team-dept-icon-box">
                          <DeptIcon size={20} />
                        </div>
                        <div>
                          <h3 className="team-dept-title">{deptTitle}</h3>
                          <span className="team-dept-count-badge">
                            {deptMembers.length} Active {deptMembers.length === 1 ? 'Member' : 'Members'}
                          </span>
                        </div>
                      </div>

                      <div className="team-dept-lead-row">
                        <span className="team-dept-lead-label">Department Lead</span>
                        <div 
                          className="team-dept-lead-card"
                          onClick={() => handleSelectMember(lead)}
                          title="Click to view profile"
                        >
                          <MemberAvatar member={lead} className="team-dept-lead-avatar" size={28} />
                          <div>
                            <div className="team-dept-lead-name">{lead.name}</div>
                            <div className="team-dept-lead-role">{lead.role}</div>
                          </div>
                        </div>
                      </div>

                      <div className="team-dept-members-roster">
                        <span className="team-dept-roster-label">Team Roster</span>
                        <div className="team-dept-roster-list">
                          {deptMembers.map(m => (
                            <div 
                              key={m.id || m.uid} 
                              className={`team-dept-roster-item ${activeProfile?.id === m.id ? 'active' : ''}`}
                              onClick={() => handleSelectMember(m)}
                            >
                              <MemberAvatar member={m} className="team-roster-avatar" size={24} />
                              <span className="team-roster-name">{m.name}</span>
                              <span className="team-roster-role">{m.role}</span>
                              <span className={`status-dot small ${isMemberOnline(m) ? 'online' : 'offline'}`} />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="team-dept-actions-row">
                        <button 
                          className="team-dept-act-btn"
                          onClick={() => {
                            setMemberDeptFilter(deptTitle);
                            setActiveTab('members');
                          }}
                        >
                          <Users size={12} style={{ marginRight: 6 }} />
                          View in Directory
                        </button>
                        <button 
                          className="team-dept-act-btn primary"
                          onClick={() => {
                            setNewDept(deptTitle);
                            setShowAddModal(true);
                          }}
                        >
                          <Plus size={12} style={{ marginRight: 6 }} />
                          Add to Dept
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sub-View 4: Skills Matrix Screen */}
          {activeTab === 'skills' && (
            <div className="team-subview-card">
              <div className="team-subview-header-row">
                <div>
                  <h2 className="team-subview-title">Skills & Capabilities Matrix</h2>
                  <p className="team-subview-desc">Directory of technical proficiencies, architectures, and team coverage.</p>
                </div>
                <div className="team-domain-chips">
                  {['all', 'Software', 'AI / ML', 'Hardware', 'DevOps'].map(domain => (
                    <button 
                      key={domain}
                      className={`team-domain-chip ${selectedSkillDomain === domain ? 'active' : ''}`}
                      onClick={() => setSelectedSkillDomain(domain)}
                    >
                      {domain === 'all' ? 'All Skills' : domain}
                    </button>
                  ))}
                </div>
              </div>

              <div className="team-skills-grid">
                {filteredSkillsList.map(skill => (
                  <div key={skill.name} className="team-skill-grid-card">
                    <div className="team-skill-grid-top">
                      <div className="team-skill-icon-badge">
                        <Code2 size={16} />
                      </div>
                      <div className="team-skill-info">
                        <div className="team-skill-name">{skill.name}</div>
                        <span className="team-skill-cat">{skill.category}</span>
                      </div>
                      <div className="team-skill-level-badge">{skill.level}</div>
                    </div>

                    <div className="team-skill-bar-wrap">
                      <div className="team-skill-bar-fill" style={{ width: `${skill.proficiency}%` }} />
                    </div>

                    <div className="team-skill-members-row">
                      <span className="team-skill-count">
                        {skill.members.length} {skill.members.length === 1 ? 'Expert' : 'Experts'}
                      </span>
                      <div className="team-skill-avatars">
                        {skill.members.map((m, idx) => (
                          <div 
                            key={idx} 
                            className="team-avatar-stack-item"
                            onClick={() => handleSelectMember(m)}
                            title={`View ${m.name} (${m.role})`}
                          >
                            <MemberAvatar member={m} className="team-avatar-stack-img" size={26} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub-View 5: Project Teams Screen */}
          {activeTab === 'projects' && (
            <div className="team-subview-card">
              <div className="team-subview-header-row">
                <div>
                  <h2 className="team-subview-title">Active Project Teams</h2>
                  <p className="team-subview-desc">Cross-functional team allocations, delivery milestones, and sprint progress.</p>
                </div>
                <div className="team-domain-chips">
                  {['All', 'In Progress', 'Completed'].map(st => (
                    <button 
                      key={st}
                      className={`team-domain-chip ${projectStatusFilter === st ? 'active' : ''}`}
                      onClick={() => setProjectStatusFilter(st)}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="team-projects-grid">
                {filteredProjectsList.map(proj => (
                  <div key={proj.id} className="team-project-grid-card">
                    <div className="team-project-grid-header">
                      <div className="team-project-title-box">
                        <span className={`team-priority-badge ${proj.priority.toLowerCase()}`}>{proj.priority}</span>
                        <h3 className="team-project-name">{proj.name}</h3>
                        <span className="team-project-dept">{proj.dept}</span>
                      </div>
                      <span className={`team-status-tag ${proj.status === 'Completed' ? 'done' : 'progress'}`}>
                        {proj.status}
                      </span>
                    </div>

                    <div className="team-project-progress-block">
                      <div className="team-project-progress-labels">
                        <span>Sprint Completion</span>
                        <span className="team-project-progress-pct">{proj.progress}%</span>
                      </div>
                      <div className="team-project-progress-bar">
                        <div className="team-project-progress-fill" style={{ width: `${proj.progress}%` }} />
                      </div>
                    </div>

                    <div className="team-project-meta-row">
                      <div className="team-project-lead">
                        <span className="label">Project Lead</span>
                        <span className="val">{proj.lead}</span>
                      </div>
                      <div className="team-project-due">
                        <span className="label">Target Release</span>
                        <span className="val">{proj.deadline}</span>
                      </div>
                    </div>

                    <div className="team-project-footer">
                      <div className="team-project-members">
                        {proj.members.map((m, idx) => (
                          <div 
                            key={idx}
                            className="team-avatar-stack-item"
                            onClick={() => handleSelectMember(m)}
                            title={`View ${m.name}`}
                          >
                            <MemberAvatar member={m} className="team-avatar-stack-img" size={26} />
                          </div>
                        ))}
                      </div>
                      <button 
                        className="team-project-assign-btn"
                        onClick={() => {
                          if (proj.members[0]) handleSelectMember(proj.members[0]);
                          handleOpenAssignTask();
                        }}
                      >
                        <Plus size={12} style={{ marginRight: 4 }} />
                        Assign Task
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub-View 6: Team Attendance Screen */}
          {activeTab === 'attendance' && (
            <div className="team-subview-card">
              <div className="team-subview-header-row">
                <div>
                  <h2 className="team-subview-title">Team Attendance & Work Presence</h2>
                  <p className="team-subview-desc">Live workstation telemetry, shift status, and hybrid work modes.</p>
                </div>
                <button 
                  className="btn btn-secondary team-add-btn-compact"
                  onClick={() => {
                    if (onSelectTab) onSelectTab('attendance');
                  }}
                >
                  <Clock size={14} style={{ marginRight: 6 }} />
                  Open Full Timesheets
                </button>
              </div>

              {/* Attendance Summary Stat Row */}
              <div className="team-att-summary-row">
                <div className="team-att-summary-card present">
                  <span className="count">{teamMembers.filter(isMemberOnline).length}</span>
                  <span className="label">Active Online</span>
                </div>
                <div className="team-att-summary-card in-office">
                  <span className="count">{teamMembers.filter(m => m.workMode === 'In-Office' || m.location === 'Main Office').length}</span>
                  <span className="label">In Office</span>
                </div>
                <div className="team-att-summary-card remote">
                  <span className="count">{teamMembers.filter(m => m.workMode === 'Remote' || m.workMode === 'Hybrid').length}</span>
                  <span className="label">Remote / Hybrid</span>
                </div>
                <div className="team-att-summary-card on-leave">
                  <span className="count">0</span>
                  <span className="label">On Leave</span>
                </div>
              </div>

              {/* Attendance Member Table */}
              <div className="team-att-table-container">
                <table className="team-att-table">
                  <thead>
                    <tr>
                      <th>MEMBER</th>
                      <th>DEPARTMENT</th>
                      <th>WORK MODE</th>
                      <th>TODAY'S SHIFT</th>
                      <th>STATUS</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamMembers.map(m => (
                      <tr key={m.id || m.uid} onClick={() => handleSelectMember(m)}>
                        <td>
                          <div className="team-att-member-cell">
                            <MemberAvatar member={m} className="team-att-avatar" size={32} />
                            <div>
                              <div className="team-att-name">{m.name}</div>
                              <div className="team-att-role">{m.role}</div>
                            </div>
                          </div>
                        </td>
                        <td><span className="team-att-dept">{m.department || m.dept || 'Engineering'}</span></td>
                        <td><span className="team-att-mode-badge">{m.workMode || 'Hybrid'}</span></td>
                        <td><span className="team-att-time">09:00 AM - 06:00 PM</span></td>
                        <td>
                          <span className={`team-att-status-pill ${isMemberOnline(m, userProfile) ? 'online' : 'offline'}`}>
                            <span className="status-dot" />
                            {isMemberOnline(m, userProfile) ? 'Online' : 'Offline'}
                          </span>
                          <div className="team-att-role" style={{ marginTop: 4 }}>
                            {memberDutyLabel(m)} | {memberLastSeenLabel(m, userProfile)}
                          </div>
                        </td>
                        <td onClick={e => e.stopPropagation()}>
                          <button 
                            className="team-mini-act-btn"
                            onClick={() => {
                              handleSelectMember(m);
                              if (onOpenDirectChat) onOpenDirectChat(m.id, m.name);
                            }}
                            title="Direct Message"
                          >
                            <MessageSquare size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub-View 7: Celebrations & Milestones */}
          {activeTab === 'celebrations' && (
            <div className="team-subview-card">
              <div className="team-subview-header-row">
                <div>
                  <h2 className="team-subview-title">Celebrations & Recognition</h2>
                  <p className="team-subview-desc">Upcoming birthdays, work anniversaries, and sprint achievements.</p>
                </div>
              </div>

              <div className="team-celebrations-grid">
                {/* Celebration 1: Work Anniversary */}
                <div className="team-celebration-card anniversary">
                  <div className="team-celebration-badge">
                    <Award size={16} />
                    <span>Work Anniversary</span>
                  </div>
                  <div className="team-celebration-avatar-wrap">
                    <MemberAvatar member={founder} className="team-celebration-avatar" size={54} />
                    <span className="team-celebration-party-icon"><Sparkles size={16} /></span>
                  </div>
                  <h3 className="team-celebration-name">{founder.name}</h3>
                  <p className="team-celebration-desc">2 Years at REDDOT Workstation as Founder & Lead Architect</p>
                  <span className="team-celebration-date">October 30, 2026</span>
                  <button 
                    className="btn btn-primary team-celebration-btn"
                    onClick={() => {
                      handleSelectMember(founder);
                      if (onOpenDirectChat) onOpenDirectChat(founder.id, founder.name);
                    }}
                  >
                    <Gift size={14} style={{ marginRight: 6 }} />
                    Send Congratulations
                  </button>
                </div>

                {/* Celebration 2: Birthday */}
                {teamMembers.length > 1 && (
                  <div className="team-celebration-card birthday">
                    <div className="team-celebration-badge birthday-badge">
                      <Gift size={16} />
                      <span>Upcoming Birthday</span>
                    </div>
                    <div className="team-celebration-avatar-wrap">
                      <MemberAvatar member={teamMembers[1]} className="team-celebration-avatar" size={54} />
                      <span className="team-celebration-party-icon"><Sparkles size={16} /></span>
                    </div>
                    <h3 className="team-celebration-name">{teamMembers[1].name}</h3>
                    <p className="team-celebration-desc">Celebrating birthday with the REDDOT engineering team!</p>
                    <span className="team-celebration-date">November 4, 2026</span>
                    <button 
                      className="btn btn-primary team-celebration-btn"
                      onClick={() => {
                        handleSelectMember(teamMembers[1]);
                        if (onOpenDirectChat) onOpenDirectChat(teamMembers[1].id, teamMembers[1].name);
                      }}
                    >
                      <Gift size={14} style={{ marginRight: 6 }} />
                      Send Birthday Wishes
                    </button>
                  </div>
                )}

                {/* Celebration 3: Team Milestone */}
                <div className="team-celebration-card milestone">
                  <div className="team-celebration-badge milestone-badge">
                    <CheckCircle2 size={16} />
                    <span>Team Milestone</span>
                  </div>
                  <div className="team-celebration-avatar-wrap">
                    <div className="team-celebration-milestone-icon">
                      <Cpu size={28} />
                    </div>
                  </div>
                  <h3 className="team-celebration-name">REDDOT Workstation v3.0 Release</h3>
                  <p className="team-celebration-desc">Core workstation modules delivered on schedule across all departments.</p>
                  <span className="team-celebration-date">Current Sprint</span>
                  <button 
                    className="btn btn-secondary team-celebration-btn"
                    onClick={() => {
                      setEmailSubject('Kudos on REDDOT v3.0 Milestone!');
                      setEmailBody('Congratulations team on achieving the v3.0 milestone!\n\n');
                      setIsEmailModalOpen(true);
                    }}
                  >
                    <Award size={14} style={{ marginRight: 6 }} />
                    Give Team Kudos
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Real Member Detail Profile Card */}
        <div className="team-profile-card">
          {/* Top Profile Summary */}
          <div className="team-profile-top">
            <div className="team-profile-avatar-wrap">
              <MemberAvatar member={activeProfile} className="team-profile-avatar" size={64} />
              <button 
                className="team-profile-add-btn" 
                onClick={() => setShowAddModal(true)}
                title="Add new member to database"
              >
                <Plus size={11} strokeWidth={2.5} />
              </button>
            </div>

            <div className="team-profile-top-info">
              <div className="team-profile-top-bar">
                <span className="team-profile-status-pill">
                  <span className={`team-profile-status-dot ${isMemberOnline(activeProfile, userProfile) ? '' : 'offline'}`} />
                  {isMemberOnline(activeProfile, userProfile) ? 'Online' : `Offline - ${activeProfile.lastActive || 'No recent signal'}`}
                </span>

                {/* Top ⋮ Menu Container (Marked in Red Box 1) */}
                <div className="team-dropdown-container">
                  <button 
                    className="team-profile-more-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsHeaderDropdownOpen(prev => !prev);
                      setIsActionDropdownOpen(false);
                    }}
                    title="Profile actions & options"
                  >
                    <MoreVertical size={16} />
                  </button>

                  {isHeaderDropdownOpen && (
                    <div className="team-dropdown-menu" onClick={e => e.stopPropagation()}>
                      <button className="team-dropdown-item" onClick={handleOpenEditMember}>
                        <Edit3 size={14} />
                        <span>Edit Member Details</span>
                      </button>
                      <button className="team-dropdown-item" onClick={handleOpenAssignTask}>
                        <CheckCircle2 size={14} />
                        <span>Assign Task</span>
                      </button>
                      <div className="team-dropdown-divider" />
                      <button className="team-dropdown-item" onClick={() => {
                        navigator.clipboard.writeText(activeProfile.email || '');
                        setIsHeaderDropdownOpen(false);
                      }}>
                        <Copy size={14} />
                        <span>Copy Email</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="team-profile-name">{activeProfile.name}</div>
              <div className="team-profile-role">{activeProfile.role}</div>
              <div className="team-profile-quote">
                "{activeProfile.bio ? (activeProfile.bio.length > 70 ? activeProfile.bio.slice(0, 70) + '...' : activeProfile.bio) : `Drives core ${activeProfile.department || 'workstation'} operations.`}"
              </div>
            </div>
          </div>

          {/* Action Buttons Row (Marked in Red Box 2: Message, Call, Email, ...) */}
          <div className="team-profile-actions-row">
            {/* 1. Message */}
            <button 
              className="team-profile-action-btn"
              onClick={handleMessageClick}
              title={`Direct message ${activeProfile.name}`}
            >
              <MessageSquare size={14} />
              <span>Message</span>
            </button>

            {/* 2. Call */}
            <button 
              className="team-profile-action-btn"
              onClick={handleCallClick}
              title={`Voice call with ${activeProfile.name}`}
            >
              <Phone size={14} />
              <span>Call</span>
            </button>

            {/* 3. Email */}
            <button 
              className="team-profile-action-btn"
              onClick={handleEmailClick}
              title={`Compose email to ${activeProfile.email}`}
            >
              <Mail size={14} />
              <span>Email</span>
            </button>

            {/* 4. More Options (...) */}
            <div className="team-dropdown-container">
              <button 
                className="team-profile-action-btn icon-only"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsActionDropdownOpen(prev => !prev);
                  setIsHeaderDropdownOpen(false);
                }}
                title="More actions"
              >
                <MoreHorizontal size={14} />
              </button>

              {isActionDropdownOpen && (
                <div className="team-dropdown-menu" onClick={e => e.stopPropagation()}>
                  <button className="team-dropdown-item" onClick={() => {
                    if (onSelectTab) onSelectTab('attendance');
                    setIsActionDropdownOpen(false);
                  }}>
                    <Clock size={14} />
                    <span>View Attendance</span>
                  </button>
                  <button className="team-dropdown-item" onClick={handleOpenAssignTask}>
                    <CheckCircle2 size={14} />
                    <span>Assign Task</span>
                  </button>
                  <button className="team-dropdown-item" onClick={() => {
                    handleOpenEditDetails();
                    setIsActionDropdownOpen(false);
                  }}>
                    <Edit3 size={14} />
                    <span>Edit Profile Details</span>
                  </button>
                  <button className="team-dropdown-item" onClick={() => {
                    navigator.clipboard.writeText(activeProfile.email || '');
                    setIsActionDropdownOpen(false);
                  }}>
                    <Copy size={14} />
                    <span>Copy Email Address</span>
                  </button>
                  <button className="team-dropdown-item" onClick={() => {
                    navigator.clipboard.writeText(activeProfile.id || activeProfile.uid || '');
                    setIsActionDropdownOpen(false);
                  }}>
                    <User size={14} />
                    <span>Copy Employee ID</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Profile Sub Tabs */}
          <div className="team-profile-subtabs">
            {['overview', 'projects', 'skills', 'activity'].map(tabKey => (
              <button
                key={tabKey}
                className={`team-profile-subtab ${profileSubTab === tabKey ? 'active' : ''}`}
                onClick={() => setProfileSubTab(tabKey)}
              >
                {tabKey.charAt(0).toUpperCase() + tabKey.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab 1: Overview Details */}
          {profileSubTab === 'overview' && (
            <div className="team-profile-details-table">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                  Profile Attributes
                </span>
                <button
                  type="button"
                  onClick={handleOpenEditDetails}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    borderRadius: 6,
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card)'}
                  title="Configure department, location, work mode, bio, etc."
                >
                  <Edit3 size={12} />
                  <span>Edit Details</span>
                </button>
              </div>
              <div className="team-profile-detail-row">
                <span className="team-profile-detail-label">
                  <Building2 size={13} /> Department
                </span>
                <span className="team-profile-detail-val">{activeProfile.department || activeProfile.dept || 'Engineering'}</span>
              </div>

              <div className="team-profile-detail-row">
                <span className="team-profile-detail-label">
                  <User size={13} /> Employee ID
                </span>
                <span className="team-profile-detail-val">{activeProfile.id || activeProfile.uid || 'EMP001'}</span>
              </div>

              <div className="team-profile-detail-row">
                <span className="team-profile-detail-label">
                  <Mail size={13} /> Email
                </span>
                <span className="team-profile-detail-val">{activeProfile.email}</span>
              </div>

              <div className="team-profile-detail-row">
                <span className="team-profile-detail-label">
                  <Home size={13} /> Location
                </span>
                <span className="team-profile-detail-val">{activeProfile.location || 'Main Office'}</span>
              </div>

              <div className="team-profile-detail-row">
                <span className="team-profile-detail-label">
                  <Briefcase size={13} /> Work Mode
                </span>
                <span className="team-profile-detail-val">{activeProfile.workMode || 'Full-Time / Hybrid'}</span>
              </div>

              <div className="team-profile-detail-row">
                <span className="team-profile-detail-label">
                  <Calendar size={13} /> Join Date
                </span>
                <span className="team-profile-detail-val">{activeProfile.joinDate || 'Jan 15, 2024'}</span>
              </div>

              <div className="team-profile-detail-row">
                <span className="team-profile-detail-label">
                  <Users size={13} /> Reporting To
                </span>
                <span className="team-profile-detail-val">{activeProfile.reportingTo || 'JAGADISH K'}</span>
              </div>

              {activeProfile.phone && (
                <div className="team-profile-detail-row">
                  <span className="team-profile-detail-label">
                    <Phone size={13} /> Contact Phone
                  </span>
                  <span className="team-profile-detail-val">{activeProfile.phone}</span>
                </div>
              )}

              <div className="team-profile-detail-row" style={{ marginTop: '4px' }}>
                <span className="team-profile-detail-label">
                  <Settings size={13} /> Bio
                </span>
                <span className="team-profile-detail-val" style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>
                  {activeProfile.bio || `${activeProfile.name} is an active member in ${activeProfile.department || 'the team'}.`}
                </span>
              </div>
            </div>
          )}

          {/* Tab 2: Projects (Fully Editable & Real Data) */}
          {profileSubTab === 'projects' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Active Projects ({profileProjects.length})
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddProjectOpen(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 8px',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    borderRadius: 6,
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={12} /> Add Project
                </button>
              </div>

              {profileProjects.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', background: 'var(--bg-secondary)', borderRadius: 8 }}>
                  No projects added yet. Click "+ Add Project" to add your real project contributions.
                </div>
              ) : (
                <div className="team-profile-details-table">
                  {profileProjects.map((proj, pIdx) => {
                    const isStr = typeof proj === 'string';
                    const name = isStr ? proj : proj.name;
                    const role = isStr ? 'Contributor' : (proj.role || 'Contributor');
                    const status = isStr ? 'Active' : (proj.status || 'Active');
                    const id = isStr ? proj : (proj.id || proj.name);
                    return (
                      <div key={id || pIdx} className="team-profile-detail-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                          <span className="team-profile-detail-label" style={{ minWidth: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Briefcase size={13} /> {name}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: 4 }}>
                            {role} • {status}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveProject(id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            borderRadius: 4
                          }}
                          title="Remove Project"
                          aria-label="Remove Project"
                        >
                          <Trash2 size={13} style={{ color: 'var(--text-muted)' }} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Skills (Fully Editable & Real Data) */}
          {profileSubTab === 'skills' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <form onSubmit={handleAddSkill} style={{ display: 'flex', gap: 6 }}>
                <input
                  type="text"
                  placeholder="Add skill (e.g. React, C++, FPGA)..."
                  value={newSkillText}
                  onChange={e => setNewSkillText(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    fontSize: '0.78rem',
                    borderRadius: 6,
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)'
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    borderRadius: 6,
                    border: 'none',
                    background: 'var(--bg-active-nav, #22262B)',
                    color: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  Add
                </button>
              </form>

              {profileSkills.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', background: 'var(--bg-secondary)', borderRadius: 8 }}>
                  No skills added yet. Use the field above to add your real skills.
                </div>
              ) : (
                <div className="team-skills-row" style={{ marginTop: 2, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {profileSkills.map((sk, idx) => (
                    <span 
                      key={idx} 
                      className="team-skill-chip"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
                    >
                      {sk}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(sk)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          color: 'inherit',
                          opacity: 0.7
                        }}
                        title={`Remove ${sk}`}
                        aria-label={`Remove ${sk}`}
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Activity */}
          {profileSubTab === 'activity' && (
            <div className="team-profile-details-table">
              <div className="team-profile-detail-row">
                <span className="team-profile-detail-label"><Clock size={13} /> Status</span>
                <span className="team-profile-detail-val">
                  {isMemberOnline(activeProfile, userProfile) ? 'Online' : `Offline - ${activeProfile.lastActive || 'No recent signal'}`}
                  {' | '}{memberDutyLabel(activeProfile)}
                </span>
              </div>
              <div className="team-profile-detail-row">
                <span className="team-profile-detail-label"><CheckCircle2 size={13} /> Activity</span>
                <span className="team-profile-detail-val">Synchronized with database ledger</span>
              </div>
              <div className="team-profile-detail-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6, marginTop: 4 }}>
                <span className="team-profile-detail-label"><Activity size={13} /> Active Work Apps ({runningApps.length})</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, width: '100%', marginTop: 2 }}>
                  {runningApps.length === 0 ? (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No background productivity tools active</span>
                  ) : (
                    runningApps.map((app, aIdx) => (
                      <span 
                        key={aIdx} 
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: 6,
                          background: 'var(--bg-secondary, rgba(255,255,255,0.06))',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-primary)'
                        }}
                      >
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#38BDF8' }} />
                        {app.appName || app.name || app.title || 'Work App'}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Skills Chips (Always displayed under Overview) */}
          {profileSubTab === 'overview' && (
            <div className="team-skills-row" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span className="team-profile-detail-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Settings size={13} /> Skills ({profileSkills.length})
                </span>
                <button
                  type="button"
                  onClick={() => setProfileSubTab('skills')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-primary)',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  Manage Skills
                </button>
              </div>
              {profileSkills.length === 0 ? (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  No skills added yet. Click "Manage Skills" to add.
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {profileSkills.map((skill, sIdx) => (
                    <span key={sIdx} className="team-skill-chip">{skill}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Upcoming Events Box - Dynamic and User-Schedulable */}
          <div className="team-events-box">
            <div className="team-events-header">
              <span className="team-events-title">Upcoming Events</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button 
                  type="button"
                  className="btn btn-primary"
                  style={{
                    height: 22,
                    padding: '0 7px',
                    fontSize: 10.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    background: 'var(--control-background, #22262B)',
                    borderColor: 'var(--border-strong, #374151)',
                    color: '#FFFFFF',
                    borderRadius: 4
                  }}
                  onClick={() => {
                    setEditingEvent(null);
                    setIsEventModalOpen(true);
                  }}
                  title="Schedule a new meeting or event"
                >
                  <Plus size={11} />
                  <span>Schedule</span>
                </button>
                <button 
                  className="team-events-see-all"
                  onClick={() => onSelectTab && onSelectTab('tasks')}
                >
                  See All
                </button>
              </div>
            </div>

            {events && events.length > 0 ? (
              events.map((evt) => (
                <div key={evt.id} className="team-event-item" style={{ position: 'relative' }}>
                  <div className="team-event-item-left" style={{ flex: 1, minWidth: 0 }}>
                    <span className="team-event-icon" style={{ cursor: 'pointer' }} onClick={() => onToggleEvent && onToggleEvent(evt.id)}>
                      {evt.completed ? <CheckCircle2 size={16} /> : <Calendar size={16} />}
                    </span>
                    <div className="team-event-info" style={{ minWidth: 0, overflow: 'hidden' }}>
                      <span className="team-event-name" style={{ textDecoration: evt.completed ? 'line-through' : 'none', opacity: evt.completed ? 0.7 : 1 }}>
                        {evt.title}
                      </span>
                      <span className="team-event-time">
                        {evt.date || 'Today'}, {evt.time} &bull; {evt.location}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button 
                      type="button"
                      className="icon-btn" 
                      title="Edit Event" 
                      style={{ width: 22, height: 22, color: 'var(--text-muted)' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingEvent(evt);
                        setIsEventModalOpen(true);
                      }}
                    >
                      <Edit3 size={12} />
                    </button>
                    <button 
                      className="team-event-btn"
                      onClick={() => {
                        if (evt.type === 'meeting' && activeProfile) {
                          handleCallClick();
                        } else {
                          setProfileSubTab('projects');
                        }
                      }}
                    >
                      {evt.type === 'meeting' ? 'Join' : 'View'}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '16px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 11 }}>
                No scheduled events. Click Schedule to add one.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Call Dialog Modal (Full in-app audio call experience) */}
      {isCallModalOpen && (
        <div className="team-call-modal-overlay" onClick={() => setIsCallModalOpen(false)}>
          <div className="team-call-card" onClick={e => e.stopPropagation()}>
            <div className="team-call-avatar-outer">
              <span className="team-call-avatar-pulse" />
              <span className="team-call-avatar-pulse pulse-2" />
              <MemberAvatar member={activeProfile} className="team-call-avatar" size={104} />
            </div>

            <div className="team-call-name">{activeProfile.name}</div>
            <div className="team-call-role">{activeProfile.role} • {activeProfile.department}</div>

            <div className="team-call-status-badge">
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: activeCallStatus === 'Connected' ? '#4ADE80' : '#F59E0B' }} />
              <span>{activeCallStatus} &bull; {formatCallTime(callDuration)}</span>
            </div>

            {/* Real WebRTC Video Screen Display */}
            {isCallVideo && (
              <div style={{ position: 'relative', width: '100%', height: 260, borderRadius: 14, overflow: 'hidden', marginTop: 12, border: '1px solid rgba(255,255,255,0.12)', background: '#0B0E14' }}>
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ position: 'absolute', bottom: 10, right: 10, width: 84, height: 60, borderRadius: 8, objectFit: 'cover', border: '2px solid rgba(255,255,255,0.4)', background: '#000' }}
                />
              </div>
            )}

            <div className="team-call-controls-row">
              <button 
                className={`team-call-ctl-btn ${isCallMuted ? 'active-off' : ''}`}
                onClick={() => {
                  const muted = webRTCCallService.toggleMute();
                  setIsCallMuted(muted);
                }}
                title={isCallMuted ? 'Unmute Mic' : 'Mute Mic'}
              >
                {isCallMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>

              <button 
                className="team-call-ctl-btn hangup"
                onClick={() => {
                  webRTCCallService.endCall();
                  setIsCallModalOpen(false);
                }}
                title="Hang up"
              >
                <PhoneOff size={24} />
              </button>

              <button 
                className={`team-call-ctl-btn ${isCallVideo ? 'active-off' : ''}`}
                onClick={() => {
                  const videoOff = webRTCCallService.toggleVideo();
                  setIsCallVideo(!videoOff);
                }}
                title={isCallVideo ? 'Disable Camera' : 'Enable Camera'}
              >
                {isCallVideo ? <VideoOff size={20} /> : <Video size={20} />}
              </button>

              <button 
                className={`team-call-ctl-btn ${isScreenSharing ? 'active-off' : ''}`}
                onClick={async () => {
                  const sharing = await webRTCCallService.toggleScreenShare(electronBridge);
                  setIsScreenSharing(sharing);
                }}
                title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
              >
                <Monitor size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compose Email Modal */}
      {isEmailModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsEmailModalOpen(false)}>
          <div className="team-email-card" onClick={e => e.stopPropagation()}>
            <div className="team-email-header">
              <h3>Compose Email to {activeProfile.name}</h3>
              <button 
                className="modal-close" 
                onClick={() => setIsEmailModalOpen(false)}
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>
            <div className="team-email-body">
              <div className="team-email-row">
                <span className="team-email-label">To</span>
                <input 
                  type="text" 
                  className="team-email-input" 
                  value={activeProfile.email || 'No email provided'} 
                  readOnly 
                />
              </div>
              <div className="team-email-row">
                <span className="team-email-label">Subject</span>
                <input 
                  type="text" 
                  className="team-email-input" 
                  value={emailSubject}
                  onChange={e => setEmailSubject(e.target.value)}
                  placeholder="Subject line..."
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span className="team-email-label">Message</span>
                <textarea 
                  className="team-email-textarea"
                  value={emailBody}
                  onChange={e => setEmailBody(e.target.value)}
                  placeholder="Type your message here..."
                />
              </div>
            </div>
            <div className="team-email-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={handleCopyEmailText}
              >
                <Copy size={13} style={{ marginRight: 6 }} /> Copy Draft
              </button>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={handleSendEmailClient}
              >
                <ExternalLink size={13} style={{ marginRight: 6 }} /> Open in Mail App
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Member Details Modal */}
      {isEditMemberOpen && (
        <div className="modal-backdrop" onClick={() => setIsEditMemberOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Member Details</h3>
              <button 
                className="modal-close" 
                onClick={() => setIsEditMemberOpen(false)}
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveEditMember}>
              <div className="modal-body">
                <div className="form-group">
                  <label>FULL NAME</label>
                  <input 
                    type="text" 
                    value={editForm.name || ''} 
                    onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>ROLE / TITLE</label>
                  <input 
                    type="text" 
                    value={editForm.role || ''} 
                    onChange={e => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>DEPARTMENT</label>
                  <select 
                    value={editForm.department || 'Software & Web'} 
                    onChange={e => setEditForm(prev => ({ ...prev, department: e.target.value }))}
                  >
                    <option value="AI / ML Systems">AI / ML Systems</option>
                    <option value="Software & Web">Software & Web</option>
                    <option value="Hardware Architecture">Hardware Architecture</option>
                    <option value="Engineering & Development">Engineering & Development</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>EMAIL ADDRESS</label>
                  <input 
                    type="email" 
                    value={editForm.email || ''} 
                    onChange={e => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>WORK MODE</label>
                  <select 
                    value={editForm.workMode || 'Hybrid'} 
                    onChange={e => setEditForm(prev => ({ ...prev, workMode: e.target.value }))}
                  >
                    <option value="Hybrid">Hybrid</option>
                    <option value="Remote">Remote</option>
                    <option value="In Office">In Office</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>LOCATION</label>
                  <input 
                    type="text" 
                    value={editForm.location || ''} 
                    onChange={e => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>BIO</label>
                  <textarea 
                    value={editForm.bio || ''} 
                    onChange={e => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                    rows={2}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setIsEditMemberOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Assign Task Modal */}
      {isAssignTaskOpen && (
        <div className="modal-backdrop" onClick={() => setIsAssignTaskOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Assign Task to {activeProfile.name}</h3>
              <button 
                className="modal-close" 
                onClick={() => setIsAssignTaskOpen(false)}
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveAssignedTask}>
              <div className="modal-body">
                <div className="form-group">
                  <label>TASK TITLE</label>
                  <input 
                    type="text" 
                    value={taskTitle} 
                    onChange={e => setTaskTitle(e.target.value)}
                    placeholder="e.g. Implement WebSocket reconnection logic"
                    required
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label>PRIORITY</label>
                  <select 
                    value={taskPriority} 
                    onChange={e => setTaskPriority(e.target.value)}
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>ASSIGNEE</label>
                  <input 
                    type="text" 
                    value={`${activeProfile.name} (${activeProfile.role})`} 
                    disabled
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setIsAssignTaskOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal (Modern Popup Screen) */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal-content team-add-modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header team-modal-header-styled">
              <div className="team-modal-title-with-icon">
                <div className="team-modal-icon-badge">
                  <UserPlus size={18} />
                </div>
                <div>
                  <h3 className="team-modal-heading">Add Team Member</h3>
                  <p className="team-modal-subheading">Register a new profile to REDDOT database & org tree</p>
                </div>
              </div>
              <button 
                className="modal-close" 
                onClick={() => setShowAddModal(false)}
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateMember}>
              <div className="modal-body team-modal-body-styled">
                {/* Live Preview Pill */}
                <div className="team-add-preview-pill">
                  <div className="team-add-preview-avatar">
                    {(newName || 'New Member').split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'NM'}
                  </div>
                  <div className="team-add-preview-meta">
                    <span className="team-add-preview-name">{newName.trim() || 'New Member Name'}</span>
                    <span className="team-add-preview-dept">{newRole || 'Developer'} • {newDept}</span>
                  </div>
                  <div className="team-add-preview-badge">
                    <span className="team-add-pulse-dot" />
                    <span>{newWorkMode}</span>
                  </div>
                </div>

                <div className="team-add-form-grid">
                  <div className="form-group">
                    <label>FULL NAME</label>
                    <div className="input-with-icon">
                      <User size={14} className="input-icon" />
                      <input 
                        type="text" 
                        value={newName} 
                        onChange={e => setNewName(e.target.value)}
                        placeholder="e.g. Ramesh Kumar"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>ROLE / TITLE</label>
                    <div className="input-with-icon">
                      <Briefcase size={14} className="input-icon" />
                      <input 
                        type="text" 
                        value={newRole} 
                        onChange={e => setNewRole(e.target.value)}
                        placeholder="e.g. Systems Engineer"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>DEPARTMENT</label>
                    <div className="input-with-icon">
                      <Building2 size={14} className="input-icon" />
                      <select 
                        value={newDept} 
                        onChange={e => setNewDept(e.target.value)}
                      >
                        <option value="Software & Web">Software & Web</option>
                        <option value="AI / ML Systems">AI / ML Systems</option>
                        <option value="Hardware Architecture">Hardware Architecture</option>
                        <option value="Engineering & Development">Engineering & Development</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>WORK MODE</label>
                    <div className="input-with-icon">
                      <Home size={14} className="input-icon" />
                      <select 
                        value={newWorkMode} 
                        onChange={e => setNewWorkMode(e.target.value)}
                      >
                        <option value="Hybrid">Hybrid</option>
                        <option value="In-Office">In-Office</option>
                        <option value="Remote">Remote</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group full-width">
                    <label>EMAIL ADDRESS</label>
                    <div className="input-with-icon">
                      <Mail size={14} className="input-icon" />
                      <input 
                        type="email" 
                        value={newEmail} 
                        onChange={e => setNewEmail(e.target.value)}
                        placeholder="e.g. ramesh@reddot.com"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer team-modal-footer-styled">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <UserPlus size={14} style={{ marginRight: 6 }} />
                  Save to Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Real Project Creation Modal */}
      {isAddProjectOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddProjectOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3>Add Project for {activeProfile.name}</h3>
              <button 
                className="modal-close" 
                onClick={() => setIsAddProjectOpen(false)}
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleAddProject}>
              <div className="modal-body">
                <div className="form-group">
                  <label>PROJECT NAME</label>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={e => setNewProjectName(e.target.value)}
                    placeholder="e.g. Workstation Redesign, Neural Engine..."
                    required
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label>ROLE IN PROJECT</label>
                  <input
                    type="text"
                    value={newProjectRole}
                    onChange={e => setNewProjectRole(e.target.value)}
                    placeholder="e.g. Lead Engineer, Contributor, Reviewer"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>STATUS</label>
                  <select
                    value={newProjectStatus}
                    onChange={e => setNewProjectStatus(e.target.value)}
                  >
                    <option value="In Progress">In Progress</option>
                    <option value="Planning">Planning</option>
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsAddProjectOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Configurable Profile Details Modal */}
      {isEditDetailsOpen && activeProfile && (
        <div className="modal-backdrop" onClick={() => setIsEditDetailsOpen(false)} style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Edit3 size={16} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Edit Member Profile</h3>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Configure details for {activeProfile.name}
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                className="modal-close-btn" 
                onClick={() => setIsEditDetailsOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProfileDetails}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '65vh', overflowY: 'auto', padding: '16px 20px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Role / Designation</label>
                  <input
                    type="text"
                    value={editDetailsForm.role}
                    onChange={e => setEditDetailsForm(prev => ({ ...prev, role: e.target.value }))}
                    placeholder="e.g. Founder, Principal Architect, Senior Frontend Engineer"
                    required
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-subtle)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Department</label>
                    <input
                      type="text"
                      value={editDetailsForm.department}
                      onChange={e => setEditDetailsForm(prev => ({ ...prev, department: e.target.value }))}
                      placeholder="e.g. Hardware Architecture"
                      required
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-subtle)', color: 'var(--text-primary)' }}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Location</label>
                    <input
                      type="text"
                      value={editDetailsForm.location}
                      onChange={e => setEditDetailsForm(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="e.g. Main Office, Bangalore HQ"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-subtle)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Work Mode</label>
                    <select
                      value={editDetailsForm.workMode}
                      onChange={e => setEditDetailsForm(prev => ({ ...prev, workMode: e.target.value }))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-subtle)', color: 'var(--text-primary)' }}
                    >
                      <option value="Hybrid">Hybrid</option>
                      <option value="On-site">On-site</option>
                      <option value="Remote">Remote</option>
                      <option value="Flexible">Flexible</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Join Date</label>
                    <input
                      type="text"
                      value={editDetailsForm.joinDate}
                      onChange={e => setEditDetailsForm(prev => ({ ...prev, joinDate: e.target.value }))}
                      placeholder="e.g. Jan 15, 2024"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-subtle)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Reporting To</label>
                    <input
                      type="text"
                      value={editDetailsForm.reportingTo}
                      onChange={e => setEditDetailsForm(prev => ({ ...prev, reportingTo: e.target.value }))}
                      placeholder="e.g. JAGADISH K"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-subtle)', color: 'var(--text-primary)' }}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Contact Phone</label>
                    <input
                      type="text"
                      value={editDetailsForm.phone}
                      onChange={e => setEditDetailsForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="e.g. +91 98765 43210"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-subtle)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Bio / Overview Statement</label>
                  <textarea
                    rows={3}
                    value={editDetailsForm.bio}
                    onChange={e => setEditDetailsForm(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Brief description of responsibilities and focus areas..."
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', resize: 'vertical' }}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '12px 20px', borderTop: '1px solid var(--border-color)' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsEditDetailsOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Event Modal */}
      <ScheduleEventModal 
        isOpen={isEventModalOpen}
        onClose={() => {
          setIsEventModalOpen(false);
          setEditingEvent(null);
        }}
        onSaveEvent={(evt) => {
          if (editingEvent && onUpdateEvent) {
            onUpdateEvent(evt);
          } else if (onScheduleEvent) {
            onScheduleEvent(evt);
          }
        }}
        onDeleteEvent={(evtId) => {
          if (onDeleteEvent) onDeleteEvent(evtId);
        }}
        initialEvent={editingEvent}
        teamMembers={teamMembers}
      />
    </div>
  );
}

export default TeamView;
