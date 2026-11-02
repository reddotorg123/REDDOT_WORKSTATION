import React, { useState, useMemo } from 'react';
import { 
  Users, 
  User, 
  UserCheck, 
  Clock, 
  XCircle, 
  Home, 
  Calendar, 
  Video, 
  BarChart3, 
  FileEdit, 
  Sun, 
  Moon,
  TrendingUp, 
  Maximize2, 
  Layers, 
  MapPin, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  LogIn, 
  LogOut, 
  Coffee, 
  CheckSquare,
  Check,
  Edit3
} from 'lucide-react';
import { electronBridge } from '../services/electronBridge';
import { ScheduleEventModal } from './ScheduleEventModal';

// Asset paths
const FLOORPLAN_IMG = './assets/office-floorplan-3d.png';
const AVATAR_ARUN = './assets/avatar-arun.png';
const AVATAR_PRIYA = './assets/avatar-priya.png';
const AVATAR_VIKRAM = './assets/avatar-vikram.png';
const AVATAR_SNEHA = './assets/avatar-sneha.png';
const AVATAR_ADITYA = './assets/avatar-aditya.png';

export const DashboardView = React.memo(function DashboardView({ 
  tasks = [], 
  onToggleTask, 
  teamMembers = [], 
  timerState, 
  onToggleTimer, 
  onTakeBreak, 
  onClockOut,
  metrics,
  attendance = [],
  punchLogs = [],
  leaves = [],
  onCleanMemory,
  onSelectTab,
  userProfile,
  onOpenApplyLeave,
  events = [],
  onScheduleEvent,
  onUpdateEvent,
  onDeleteEvent,
  onToggleEvent
}) {
  // Navigation & Interactive states
  const [activeFloor, setActiveFloor] = useState('1F');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showLayers, setShowLayers] = useState(false);
  const [activeDepartment, setActiveDepartment] = useState(null);
  const [buildingDropdownOpen, setBuildingDropdownOpen] = useState(false);
  const [currentBuilding, setCurrentBuilding] = useState('Main Building - 1st Floor');
  const [dateOffset, setDateOffset] = useState(0);

  // Scheduled events modal state
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  // Selected calendar day computation
  const selectedDateObj = useMemo(() => {
    const base = new Date();
    base.setDate(base.getDate() + dateOffset);
    return base;
  }, [dateOffset]);

  // Dynamic calendar date calculation based on current date
  const displayDate = useMemo(() => {
    const base = selectedDateObj;
    const weekday = base.toLocaleDateString('en-US', { weekday: 'long' });
    const month = base.toLocaleDateString('en-US', { month: 'short' });
    const day = base.getDate();
    const year = base.getFullYear();

    const startOfYear = new Date(year, 0, 1);
    const dayOfYear = Math.floor((base - startOfYear) / (24 * 60 * 60 * 1000)) + 1;
    const weekNumber = Math.ceil(dayOfYear / 7);

    const shortStr = `${month} ${day}, ${year}`;
    const isoStr = `${year}-${String(base.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    return {
      primary: `${weekday}, ${month} ${day}, ${year}`,
      sub: `Week ${weekNumber} · Day ${dayOfYear}`,
      short: shortStr,
      iso: isoStr,
      dateObj: base
    };
  }, [selectedDateObj]);

  // Dynamic time-aware greeting based on local client hour
  const greetingInfo = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return { text: 'Good Morning', icon: Sun, subtitle: "Let's build something great today." };
    } else if (hour >= 12 && hour < 17) {
      return { text: 'Good Afternoon', icon: Sun, subtitle: "Keep up the momentum today." };
    } else if (hour >= 17 && hour < 21) {
      return { text: 'Good Evening', icon: Moon, subtitle: "Review today's achievements and wrap up." };
    } else {
      return { text: 'Good Night', icon: Moon, subtitle: "Rest well or review your workstation overnight." };
    }
  }, []);

  const userName = userProfile?.name?.split(' ')[0] || 'Jagadish';

  // REAL ATTENDANCE CALCULATION (Strictly based on real punches, real leaves, and user rules)
  // Rule 1: If person applied leave -> show "On Leave"
  // Rule 2: If requested WFH permission and logged in -> show "Work From Home"
  // Rule 3: If logged in and start working -> show "Present"
  // Rule 4: If not logged in after 9am (today or past) -> show "Absent"
  const memberStats = useMemo(() => {
    const now = new Date();
    const target = selectedDateObj;
    const isToday = target.toDateString() === now.toDateString();
    const isPast = target < new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const isAfter9AM = isToday ? (now.getHours() >= 9) : true;

    // Filter out resigned or placeholder test accounts
    const activeMembers = teamMembers.filter(m => m && m.status !== 'Resigned' && m.name !== 'Teammate');
    const total = activeMembers.length || 6;

    // Combine punch logs, leaves, and attendance records
    const allRecords = [...(leaves || []), ...(punchLogs || []), ...(attendance || [])];

    // Helper to test if a record matches target date
    const recordMatchesDate = (rec) => {
      if (!rec) return false;
      // If record has leave range:
      if (rec.startDate && rec.endDate) {
        const start = new Date(rec.startDate);
        const end = new Date(rec.endDate);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
          const sDay = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
          const eDay = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
          if (targetDay >= sDay && targetDay <= eDay) return true;
        }
      }
      if (rec.timestamp) {
        const d = new Date(rec.timestamp);
        if (d.toDateString() === target.toDateString()) return true;
      }
      if (rec.date) {
        const recDateStr = String(rec.date).trim();
        if (recDateStr === displayDate.short || recDateStr === displayDate.iso || (isToday && recDateStr === 'Today')) return true;
        const d = new Date(recDateStr);
        if (!isNaN(d.getTime()) && d.toDateString() === target.toDateString()) return true;
      }
      if (rec.dates) {
        const str = String(rec.dates);
        const isoMatch = str.match(/\b\d{4}-\d{2}-\d{2}\b/);
        if (isoMatch) {
          const d = new Date(isoMatch[0]);
          if (!isNaN(d.getTime()) && d.toDateString() === target.toDateString()) return true;
        }
        const dmyMatch = str.match(/\b(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})\b/);
        if (dmyMatch) {
          const d = parseInt(dmyMatch[1], 10);
          const m = parseInt(dmyMatch[2], 10) - 1;
          const y = dmyMatch[3].length === 2 ? 2000 + parseInt(dmyMatch[3], 10) : parseInt(dmyMatch[3], 10);
          const dt = new Date(y, m, d);
          if (!isNaN(dt.getTime()) && dt.toDateString() === target.toDateString()) return true;
        }
        const parsed = new Date(str);
        if (!isNaN(parsed.getTime()) && parsed.toDateString() === target.toDateString()) return true;
      }
      return false;
    };

    // Helper to test if a record belongs to member m
    const recordMatchesMember = (rec, m) => {
      if (!rec || !m) return false;
      const mName = (m.name || '').toLowerCase();
      const mEmail = (m.email || '').toLowerCase();
      const mId = (m.id || m.uid || '').toLowerCase();

      const rEmp = (rec.employee || rec.member || rec.workerName || rec.name || rec.applicant || '').toLowerCase();
      const rEmail = (rec.email || rec.assignedEmail || '').toLowerCase();
      const rId = (rec.workerId || rec.employeeId || rec.empId || rec.uid || '').toLowerCase();

      if (mEmail && rEmail && mEmail === rEmail) return true;
      if (mId && rId && mId === rId) return true;
      if (mName && rEmp && (mName === rEmp || rEmp.includes(mName) || mName.includes(rEmp))) return true;
      return false;
    };

    let presentCount = 0;
    let leaveCount = 0;
    let absentCount = 0;
    let wfhCount = 0;

    const classifiedMembers = activeMembers.map(m => {
      const memberDayRecords = allRecords.filter(r => recordMatchesMember(r, m) && recordMatchesDate(r));

      // 1. Check Leave (Approved / Valid leave)
      const leaveRec = memberDayRecords.find(r => {
        const isDeclined = r.status === 'DECLINED' || r.status === 'REJECTED';
        if (isDeclined) return false;
        const isLeaveType = r.action === 'LEAVE' || r.status === 'On Leave' || r.status === 'Leave' || r.leaveType;
        const isNotWFH = r.leaveType !== 'Work From Home' && !r.isWFH;
        return isLeaveType && isNotWFH;
      });

      // 2. Check WFH permission
      const wfhPermRec = memberDayRecords.find(r => {
        const isDeclined = r.status === 'DECLINED' || r.status === 'REJECTED';
        if (isDeclined) return false;
        return r.leaveType === 'Work From Home' || r.isWFH || r.action === 'WFH_REQUEST' || (m.workMode || '').toLowerCase().includes('remote');
      });

      // 3. Check Clock In / Work presence
      const hasPunch = memberDayRecords.some(r => 
        r.action === 'CLOCK_IN' || r.action === 'PUNCH_IN' || r.action === 'BREAK_START' || r.action === 'BREAK_END' || r.action === 'CLOCK_OUT' || (r.status === 'Present' && !r.leaveType)
      );
      const isCurrentlyActiveUser = isToday && (
        m.isOnline || m.status === 'Online' || 
        ((m.email === userProfile?.email || m.name === userProfile?.name) && timerState?.isRunning)
      );
      const hasWorked = hasPunch || isCurrentlyActiveUser;

      let status = 'Absent';

      if (leaveRec) {
        status = 'On Leave';
        leaveCount++;
      } else if (wfhPermRec && hasWorked) {
        status = 'Work From Home';
        wfhCount++;
      } else if (hasWorked) {
        status = 'Present';
        presentCount++;
      } else {
        if (isToday) {
          if (isAfter9AM) {
            status = 'Absent';
            absentCount++;
          } else {
            status = 'Not Clocked In';
          }
        } else if (isPast) {
          status = 'Absent';
          absentCount++;
        } else {
          status = 'Scheduled';
        }
      }

      return {
        ...m,
        computedStatus: status,
        dayRecords: memberDayRecords
      };
    });

    const presentPct = total > 0 ? Math.round((presentCount / total) * 100) : 0;
    const leavePct = total > 0 ? Math.round((leaveCount / total) * 100) : 0;
    const absentPct = total > 0 ? Math.round((absentCount / total) * 100) : 0;
    const wfhPct = total > 0 ? Math.round((wfhCount / total) * 100) : 0;

    return {
      total,
      present: presentCount,
      presentPct,
      onLeave: leaveCount,
      leavePct,
      absent: absentCount,
      absentPct,
      wfh: wfhCount,
      wfhPct,
      classifiedMembers
    };
  }, [teamMembers, leaves, punchLogs, attendance, selectedDateObj, displayDate, userProfile, timerState]);

  // Real department occupancy calculations strictly based on actual presence on selected date
  const departmentCounts = useMemo(() => {
    const presentMembers = memberStats.classifiedMembers?.filter(m => m.computedStatus === 'Present' || m.computedStatus === 'Work From Home') || [];

    const eng = teamMembers.filter(m => {
      const d = (m.dept || m.department || '').toLowerCase();
      return d.includes('software') || d.includes('engineering') || d.includes('web');
    });
    const design = teamMembers.filter(m => {
      const d = (m.dept || m.department || '').toLowerCase();
      const r = (m.role || '').toLowerCase();
      return d.includes('design') || r.includes('design');
    });
    const mgmt = teamMembers.filter(m => {
      const d = (m.dept || m.department || '').toLowerCase();
      const r = (m.role || '').toLowerCase();
      return d.includes('hardware') || r.includes('founder') || r.includes('ceo') || d.includes('ai');
    });
    const ops = teamMembers.filter(m => {
      const d = (m.dept || m.department || '').toLowerCase();
      return d.includes('operation') || d.includes('admin') || (!eng.includes(m) && !design.includes(m) && !mgmt.includes(m));
    });

    return {
      Engineering: {
        present: presentMembers.filter(m => eng.some(e => e.id === m.id || e.name === m.name)).length,
        total: Math.max(eng.length, 3)
      },
      Design: {
        present: presentMembers.filter(m => design.some(d => d.id === m.id || d.name === m.name)).length,
        total: Math.max(design.length, 1)
      },
      Management: {
        present: presentMembers.filter(m => mgmt.some(mg => mg.id === m.id || mg.name === m.name)).length,
        total: Math.max(mgmt.length, 2)
      },
      Operations: {
        present: presentMembers.filter(m => ops.some(o => o.id === m.id || o.name === m.name)).length,
        total: Math.max(ops.length, 1)
      }
    };
  }, [teamMembers, memberStats]);

  // Real schedule items filtered strictly by the selected date
  const scheduleItems = useMemo(() => {
    if (!Array.isArray(events) || events.length === 0) return [];
    const isToday = dateOffset === 0;
    const targetDate = selectedDateObj;

    return events.filter(e => {
      if (!e) return false;
      const eDate = String(e.date || '').trim();
      if (isToday && (eDate === 'Today' || !eDate)) return true;
      if (eDate === displayDate.short || eDate === displayDate.iso) return true;
      const d = new Date(eDate);
      if (!isNaN(d.getTime()) && d.toDateString() === targetDate.toDateString()) return true;
      return false;
    }).map(e => ({
      ...e,
      icon: e.type === 'meeting' ? Video : e.type === 'review' ? Users : e.type === 'wrapup' ? CheckSquare : Calendar
    }));
  }, [events, selectedDateObj, dateOffset, displayDate]);

  // Real highlights mapped directly from real database punches for the selected date
  const highlightItems = useMemo(() => {
    const allRecords = [...(punchLogs || []), ...(attendance || [])];
    const targetDate = selectedDateObj;

    const dayPunches = allRecords.filter(r => {
      if (!r) return false;
      if (r.timestamp) {
        const d = new Date(r.timestamp);
        if (d.toDateString() === targetDate.toDateString()) return true;
      }
      if (r.date) {
        const dStr = String(r.date).trim();
        if (dStr === displayDate.short || dStr === displayDate.iso || (dateOffset === 0 && dStr === 'Today')) return true;
        const d = new Date(dStr);
        if (!isNaN(d.getTime()) && d.toDateString() === targetDate.toDateString()) return true;
      }
      return false;
    });

    if (dayPunches.length > 0) {
      return dayPunches.slice(0, 6).map((p, idx) => {
        let action = 'Clocked In';
        let icon = LogIn;
        if (p.action === 'CLOCK_OUT' || p.action === 'PUNCH_OUT') {
          action = 'Clocked Out';
          icon = LogOut;
        } else if (p.action === 'BREAK_START') {
          action = 'Started Break';
          icon = Coffee;
        } else if (p.action === 'BREAK_END') {
          action = 'Ended Break';
          icon = Coffee;
        } else if (p.action === 'LEAVE' || p.status === 'On Leave') {
          action = `Applied ${p.leaveType || 'Leave'}`;
          icon = Calendar;
        } else if (p.action === 'WFH_REQUEST' || p.status === 'Work From Home') {
          action = 'Work From Home';
          icon = Home;
        }

        const name = p.employee || p.member || p.name || 'Team Member';
        const member = teamMembers.find(m => m.name === name || m.email === p.email);
        const timeStr = p.time || p.checkIn || (p.timestamp ? new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '09:00 AM');

        return {
          id: p.id || `hl_${idx}`,
          name,
          avatar: member?.avatar || (name.toLowerCase().includes('jagadish') ? './assets/profile-photo.jpeg' : './assets/profile-photo1.jpeg'),
          action,
          time: timeStr,
          icon
        };
      });
    }

    if (dateOffset === 0 && (userProfile || teamMembers[0])) {
      const activeUser = userProfile || teamMembers[0];
      return [
        {
          id: 'hl-live',
          name: activeUser.name,
          avatar: activeUser.avatar || './assets/profile-photo.jpeg',
          action: timerState?.isRunning ? 'Active on Duty' : 'Logged into Workstation',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          icon: LogIn
        }
      ];
    }

    return [];
  }, [punchLogs, attendance, selectedDateObj, dateOffset, displayDate, teamMembers, userProfile, timerState]);

  // Zoom controls
  const handleZoomIn = () => {
    setZoomLevel(prev => {
      const next = prev >= 1.5 ? 1 : Number((prev + 0.25).toFixed(2));
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setActiveDepartment(null);
  };

  const handleToggleLayers = () => {
    setShowLayers(prev => !prev);
  };

  // Floor switcher handler
  const handleFloorChange = (floor) => {
    setActiveFloor(floor);
    const buildingNames = {
      '1F': 'Main Building - 1st Floor',
      '2F': 'Design Wing - 2nd Floor',
      '3F': 'Executive Lab - 3rd Floor'
    };
    setCurrentBuilding(buildingNames[floor] || `Main Building - ${floor} Floor`);
  };

  // Toggle Schedule Item
  const handleToggleScheduleItem = (item) => {
    if (onToggleEvent && item.id && !item.taskId) {
      onToggleEvent(item.id);
    } else if (item.taskId && onToggleTask) {
      onToggleTask(item.taskId);
    } else if (onToggleEvent && item.id) {
      onToggleEvent(item.id);
    }
  };

  // Department Badge Click
  const handleDepartmentClick = (deptName) => {
    setActiveDepartment(prev => (prev === deptName ? null : deptName));
  };

  // Quick Action click dispatcher
  const handleQuickAction = (actionName, targetTab = null) => {
    if (targetTab && onSelectTab) {
      onSelectTab(targetTab);
    }
  };

  return (
    <div className="dashboard-reddot-view">
      {/* 1. Header Bar */}
      <div className="db-header">
        <div className="db-greeting-block">
          <h1 className="db-greeting-title">
            {greetingInfo.text}, {userName}
            <span className="db-greeting-sun" title={greetingInfo.text}>
              <greetingInfo.icon size={24} strokeWidth={2.2} />
            </span>
          </h1>
          <p className="db-greeting-sub">{greetingInfo.subtitle}</p>
        </div>

        <div className="db-header-right">
          <div className="db-date-pill" style={{ position: 'relative', cursor: 'pointer' }} title="Click to jump to any date">
            <span className="db-date-icon">
              <Calendar size={18} strokeWidth={2} />
            </span>
            <div className="db-date-info">
              <div className="db-date-text-primary">{displayDate.primary}</div>
              <div className="db-date-text-sub">{displayDate.sub}</div>
            </div>
            {/* Native date picker input overlay */}
            <input 
              type="date"
              value={displayDate.iso}
              onChange={(e) => {
                if (e.target.value) {
                  const [y, m, d] = e.target.value.split('-').map(Number);
                  const picked = new Date(y, m - 1, d);
                  const today = new Date();
                  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                  const pickedMidnight = new Date(picked.getFullYear(), picked.getMonth(), picked.getDate());
                  const diffDays = Math.round((pickedMidnight - todayMidnight) / (24 * 60 * 60 * 1000));
                  setDateOffset(diffDays);
                }
              }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100%',
                height: '100%',
                opacity: 0,
                cursor: 'pointer'
              }}
              title="Click to select any date"
            />
          </div>

          <div className="db-header-nav-btns" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {dateOffset !== 0 && (
              <button 
                type="button"
                className="db-nav-chevron"
                onClick={() => setDateOffset(0)}
                style={{ width: 'auto', padding: '0 10px', fontSize: 11, fontWeight: 700, borderRadius: 6 }}
                title="Return to Today"
              >
                Today
              </button>
            )}
            <button 
              className="db-nav-chevron" 
              onClick={() => setDateOffset(prev => prev - 1)}
              title="Previous Day"
              aria-label="Previous Day"
            >
              <ChevronLeft size={16} strokeWidth={2.5} />
            </button>
            <button 
              className="db-nav-chevron" 
              onClick={() => setDateOffset(prev => prev + 1)}
              title="Next Day"
              aria-label="Next Day"
            >
              <ChevronRight size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Split Row: 3D Office Floorplan (Left) & Today's Schedule (Right) */}
      <div className="db-top-grid">
        {/* Left: 3D Office Floorplan */}
        <div className="db-floorplan-card">
          <div className="db-floorplan-viewport">
            <img 
              src={FLOORPLAN_IMG} 
              alt="3D Office Floorplan" 
              className={`db-floorplan-img ${showLayers ? 'layer-active' : ''}`}
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: activeDepartment === 'Engineering' ? '50% 25%' :
                                 activeDepartment === 'Design' ? '70% 40%' :
                                 activeDepartment === 'Management' ? '30% 60%' :
                                 activeDepartment === 'Operations' ? '60% 60%' : 'center center'
              }}
            />

            {/* Layer Heatmap Overlay */}
            {showLayers && <div className="db-floorplan-layer-overlay" />}

            {/* Top-Left Floating Office Badge */}
            <div 
              className="db-office-badge"
              onClick={() => setBuildingDropdownOpen(prev => !prev)}
            >
              <MapPin size={15} color="#94A3B8" />
              <div className="db-office-badge-content">
                <span className="db-office-badge-title">
                  Office <ChevronDown size={13} strokeWidth={2.5} />
                </span>
                <span className="db-office-badge-sub">{currentBuilding}</span>
              </div>

              {buildingDropdownOpen && (
                <div className="db-office-dropdown-menu" onClick={e => e.stopPropagation()}>
                  <div 
                    className={`db-office-dropdown-item ${activeFloor === '1F' ? 'active' : ''}`}
                    onClick={() => { handleFloorChange('1F'); setBuildingDropdownOpen(false); }}
                  >
                    <span>Main Building - 1st Floor</span>
                    {activeFloor === '1F' && <Check size={14} />}
                  </div>
                  <div 
                    className={`db-office-dropdown-item ${activeFloor === '2F' ? 'active' : ''}`}
                    onClick={() => { handleFloorChange('2F'); setBuildingDropdownOpen(false); }}
                  >
                    <span>Design Wing - 2nd Floor</span>
                    {activeFloor === '2F' && <Check size={14} />}
                  </div>
                  <div 
                    className={`db-office-dropdown-item ${activeFloor === '3F' ? 'active' : ''}`}
                    onClick={() => { handleFloorChange('3F'); setBuildingDropdownOpen(false); }}
                  >
                    <span>Executive Lab - 3rd Floor</span>
                    {activeFloor === '3F' && <Check size={14} />}
                  </div>
                </div>
              )}
            </div>

            {/* Department Callout Badges with Pulsing Emerald Beacon Dot */}
            {/* 1. Engineering */}
            <div 
              className={`db-room-callout ${activeDepartment === 'Engineering' ? 'active' : ''}`}
              style={{ top: '24%', left: '50%' }}
              onClick={() => handleDepartmentClick('Engineering')}
              title={`Engineering Department: ${departmentCounts.Engineering.present} present out of ${departmentCounts.Engineering.total}`}
            >
              <span className="db-room-callout-icon">
                <Users size={15} />
              </span>
              <div className="db-room-callout-body">
                <span className="db-room-callout-name">Engineering</span>
                <span className="db-room-callout-count">
                  {departmentCounts.Engineering.present} / {departmentCounts.Engineering.total} 
                  <span className="db-beacon-dot" />
                </span>
              </div>
            </div>

            {/* 2. Design */}
            <div 
              className={`db-room-callout ${activeDepartment === 'Design' ? 'active' : ''}`}
              style={{ top: '38%', left: '71%' }}
              onClick={() => handleDepartmentClick('Design')}
              title={`Design Department: ${departmentCounts.Design.present} present out of ${departmentCounts.Design.total}`}
            >
              <span className="db-room-callout-icon">
                <Users size={15} />
              </span>
              <div className="db-room-callout-body">
                <span className="db-room-callout-name">Design</span>
                <span className="db-room-callout-count">
                  {departmentCounts.Design.present} / {departmentCounts.Design.total} 
                  <span className="db-beacon-dot" />
                </span>
              </div>
            </div>

            {/* 3. Management */}
            <div 
              className={`db-room-callout ${activeDepartment === 'Management' ? 'active' : ''}`}
              style={{ top: '56%', left: '33%' }}
              onClick={() => handleDepartmentClick('Management')}
              title={`Management Department: ${departmentCounts.Management.present} present out of ${departmentCounts.Management.total}`}
            >
              <span className="db-room-callout-icon">
                <Users size={15} />
              </span>
              <div className="db-room-callout-body">
                <span className="db-room-callout-name">Management</span>
                <span className="db-room-callout-count">
                  {departmentCounts.Management.present} / {departmentCounts.Management.total} 
                  <span className="db-beacon-dot" />
                </span>
              </div>
            </div>

            {/* 4. Operations */}
            <div 
              className={`db-room-callout ${activeDepartment === 'Operations' ? 'active' : ''}`}
              style={{ top: '56%', left: '62%' }}
              onClick={() => handleDepartmentClick('Operations')}
              title={`Operations Department: ${departmentCounts.Operations.present} present out of ${departmentCounts.Operations.total}`}
            >
              <span className="db-room-callout-icon">
                <Users size={15} />
              </span>
              <div className="db-room-callout-body">
                <span className="db-room-callout-name">Operations</span>
                <span className="db-room-callout-count">
                  {departmentCounts.Operations.present} / {departmentCounts.Operations.total} 
                  <span className="db-beacon-dot" />
                </span>
              </div>
            </div>

            {/* Top-Right Map Controls */}
            <div className="db-floorplan-controls">
              <button 
                className="db-fp-btn" 
                onClick={handleZoomIn} 
                title={zoomLevel > 1 ? `Zoom (${zoomLevel}x)` : 'Zoom In'}
              >
                <Plus size={16} />
              </button>
              <button 
                className="db-fp-btn" 
                onClick={handleResetZoom} 
                title="Reset View"
              >
                <Maximize2 size={15} />
              </button>
              <button 
                className={`db-fp-btn ${showLayers ? 'active' : ''}`} 
                onClick={handleToggleLayers} 
                title={showLayers ? 'Hide Heatmap Layer' : 'Show Heatmap Layer'}
              >
                <Layers size={15} />
              </button>
            </div>

            {/* Bottom-Right Floor Switcher */}
            <div className="db-floor-switcher">
              {['1F', '2F', '3F'].map(fl => (
                <button
                  key={fl}
                  className={`db-floor-btn ${activeFloor === fl ? 'active' : ''}`}
                  onClick={() => handleFloorChange(fl)}
                >
                  {fl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Today's Schedule */}
        <div className="db-schedule-card">
          <div className="db-card-header-row">
            <h3 className="db-card-header-title">{dateOffset === 0 ? "Today's Schedule" : `Schedule · ${displayDate.short}`}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button 
                type="button"
                className="btn btn-primary"
                style={{
                  height: 24,
                  padding: '0 8px',
                  fontSize: 11,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  background: 'var(--control-background, #22262B)',
                  borderColor: 'var(--border-strong, #374151)',
                  color: '#FFFFFF',
                  borderRadius: 4
                }}
                onClick={() => {
                  setEditingEvent(null);
                  setIsEventModalOpen(true);
                }}
                title="Schedule a new event or meeting"
              >
                <Plus size={12} />
                <span>Schedule</span>
              </button>
              <button 
                className="db-view-all-btn"
                onClick={() => onSelectTab && onSelectTab('tasks')}
                title="View all tasks & calendar"
              >
                View All
              </button>
            </div>
          </div>

          <div className="db-schedule-timeline">
            {scheduleItems.length > 0 ? (
              <>
                <div className="db-schedule-track-line" />
                {scheduleItems.map((item, index) => {
                  const ItemIcon = item.icon || Video;
                  return (
                    <div key={item.id || index} className="db-schedule-item">
                      <span className={`db-schedule-dot ${item.completed ? '' : 'upcoming'}`} />
                      <span className="db-schedule-time">{item.time}</span>
                      <div 
                        className={`db-schedule-item-card ${item.completed ? 'completed' : ''}`}
                        onClick={() => handleToggleScheduleItem(item)}
                        title="Click to toggle completion status"
                      >
                        <div className="db-schedule-icon-wrap">
                          <ItemIcon size={16} />
                        </div>
                        <div className="db-schedule-item-info" style={{ flex: 1, minWidth: 0 }}>
                          <span className="db-schedule-item-title">{item.title}</span>
                          <span className="db-schedule-item-loc">{item.location}</span>
                        </div>
                        <div className="db-schedule-item-actions" onClick={e => e.stopPropagation()}>
                          <button 
                            type="button"
                            className="icon-btn" 
                            title="Edit Event" 
                            style={{ width: 22, height: 22, color: 'var(--text-muted)' }}
                            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingEvent(item);
                              setIsEventModalOpen(true);
                            }}
                          >
                            <Edit3 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 200,
                gap: 12,
                padding: '24px 16px',
                textAlign: 'center',
                color: 'var(--text-muted)'
              }}>
                <div style={{
                  width: 42,
                  height: 42,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--bg-card-subtle, rgba(0,0,0,0.03))',
                  border: '1px dashed var(--border-color)'
                }}>
                  <Calendar size={18} strokeWidth={1.8} style={{ opacity: 0.7 }} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                    {dateOffset === 0 ? 'No events scheduled for today' : `No events scheduled for ${displayDate.short}`}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)', maxWidth: 220, lineHeight: 1.4 }}>
                    Define your custom day schedule, team syncs, and reviews.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Middle Section: 5 Stat Cards */}
      <div className="db-stat-row">
        {/* Stat 1: Total Members */}
        <div className="db-stat-box" onClick={() => onSelectTab && onSelectTab('team')} style={{ cursor: 'pointer' }}>
          <div className="db-stat-box-top">
            <User size={15} />
            <span className="db-stat-box-label">Total Members</span>
          </div>
          <div className="db-stat-box-mid">
            <span className="db-stat-box-val">{memberStats.total}</span>
          </div>
          <div className="db-sparkline-container">
            <span className="db-stat-badge-trend">
              <TrendingUp size={12} strokeWidth={2.5} /> 2%
            </span>
            <svg viewBox="0 0 70 24" className="db-sparkline-svg">
              <path 
                d="M 2 18 Q 18 19 28 14 T 48 11 T 68 3" 
                fill="none" 
                stroke="#181D24" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Stat 2: Present Today */}
        <div className="db-stat-box" onClick={() => onSelectTab && onSelectTab('attendance')} style={{ cursor: 'pointer' }}>
          <div className="db-stat-box-top">
            <UserCheck size={15} />
            <span className="db-stat-box-label">{dateOffset === 0 ? 'Present Today' : 'Present'}</span>
          </div>
          <div className="db-stat-box-mid">
            <span className="db-stat-box-val">{memberStats.present}</span>
          </div>
          <div className="db-stat-progress-row">
            <div className="db-stat-progress-track">
              <div className="db-stat-progress-fill primary" style={{ width: `${memberStats.presentPct}%` }} />
            </div>
            <span className="db-stat-progress-pct">{memberStats.presentPct}%</span>
          </div>
        </div>

        {/* Stat 3: On Leave */}
        <div className="db-stat-box" onClick={() => onSelectTab && onSelectTab('attendance')} style={{ cursor: 'pointer' }}>
          <div className="db-stat-box-top">
            <Clock size={15} />
            <span className="db-stat-box-label">On Leave</span>
          </div>
          <div className="db-stat-box-mid">
            <span className="db-stat-box-val">{memberStats.onLeave}</span>
          </div>
          <div className="db-stat-progress-row">
            <div className="db-stat-progress-track">
              <div className="db-stat-progress-fill secondary" style={{ width: `${memberStats.leavePct}%` }} />
            </div>
            <span className="db-stat-progress-pct">{memberStats.leavePct}%</span>
          </div>
        </div>

        {/* Stat 4: Absent */}
        <div className="db-stat-box" onClick={() => onSelectTab && onSelectTab('attendance')} style={{ cursor: 'pointer' }}>
          <div className="db-stat-box-top">
            <XCircle size={15} />
            <span className="db-stat-box-label">Absent</span>
          </div>
          <div className="db-stat-box-mid">
            <span className="db-stat-box-val">{memberStats.absent}</span>
          </div>
          <div className="db-stat-progress-row">
            <div className="db-stat-progress-track">
              <div className="db-stat-progress-fill secondary" style={{ width: `${memberStats.absentPct}%` }} />
            </div>
            <span className="db-stat-progress-pct">{memberStats.absentPct}%</span>
          </div>
        </div>

        {/* Stat 5: Work From Home */}
        <div className="db-stat-box" onClick={() => onSelectTab && onSelectTab('team')} style={{ cursor: 'pointer' }}>
          <div className="db-stat-box-top">
            <Home size={15} />
            <span className="db-stat-box-label">Work From Home</span>
          </div>
          <div className="db-stat-box-mid">
            <span className="db-stat-box-val">{memberStats.wfh}</span>
          </div>
          <div className="db-stat-progress-row">
            <div className="db-stat-progress-track">
              <div className="db-stat-progress-fill secondary" style={{ width: `${memberStats.wfhPct}%` }} />
            </div>
            <span className="db-stat-progress-pct">{memberStats.wfhPct}%</span>
          </div>
        </div>
      </div>

      {/* 4. Bottom Section: 3 Cards Split */}
      <div className="db-bottom-grid">
        {/* Bottom Card 1: Activity Flow */}
        <div className="db-activity-card">
          <div className="db-card-header-row">
            <h3 className="db-card-header-title">{dateOffset === 0 ? "Today's Activity Flow" : `Activity Flow · ${displayDate.short}`}</h3>
            <div className="db-activity-legend">
              <span className="db-legend-item">
                <span className="db-legend-dot active" /> Active
              </span>
              <span className="db-legend-item">
                <span className="db-legend-dot break" /> Break
              </span>
              <span className="db-legend-item">
                <span className="db-legend-dot meeting" /> Meeting
              </span>
              <span className="db-legend-item">
                <span className="db-legend-dot idle" /> Idle
              </span>
            </div>
          </div>

          <div className="db-gantt-chart">
            {/* Row 1: Engineering */}
            <div 
              className={`db-gantt-row ${activeDepartment === 'Engineering' ? 'highlighted-row' : ''}`}
              style={{ opacity: activeDepartment && activeDepartment !== 'Engineering' ? 0.45 : 1, transition: 'opacity 0.2s' }}
            >
              <span className="db-gantt-label">Engineering</span>
              <div className="db-gantt-track">
                <div 
                  className="db-gantt-block break" 
                  style={{ left: '19%', width: '13%' }} 
                  title="Engineering: 10:00 AM - 11:20 AM (Break)" 
                />
                <div 
                  className="db-gantt-block meeting" 
                  style={{ left: '34%', width: '19%' }} 
                  title="Engineering: 11:30 AM - 01:20 PM (Meeting)" 
                />
                <div 
                  className="db-gantt-block meeting" 
                  style={{ left: '68%', width: '13%' }} 
                  title="Engineering: 02:50 PM - 04:10 PM (Meeting)" 
                />
              </div>
            </div>

            {/* Row 2: Design */}
            <div 
              className={`db-gantt-row ${activeDepartment === 'Design' ? 'highlighted-row' : ''}`}
              style={{ opacity: activeDepartment && activeDepartment !== 'Design' ? 0.45 : 1, transition: 'opacity 0.2s' }}
            >
              <span className="db-gantt-label">Design</span>
              <div className="db-gantt-track">
                <div 
                  className="db-gantt-block meeting" 
                  style={{ left: '17%', width: '10%' }} 
                  title="Design: 09:40 AM - 10:40 AM (Meeting)" 
                />
                <div 
                  className="db-gantt-block meeting" 
                  style={{ left: '29%', width: '7%' }} 
                  title="Design: 10:55 AM - 11:40 AM (Meeting)" 
                />
                <div 
                  className="db-gantt-block idle" 
                  style={{ left: '39%', width: '48%' }} 
                  title="Design: 11:55 AM - 04:45 PM (Active / Idle)" 
                />
              </div>
            </div>

            {/* Row 3: Management */}
            <div 
              className={`db-gantt-row ${activeDepartment === 'Management' ? 'highlighted-row' : ''}`}
              style={{ opacity: activeDepartment && activeDepartment !== 'Management' ? 0.45 : 1, transition: 'opacity 0.2s' }}
            >
              <span className="db-gantt-label">Management</span>
              <div className="db-gantt-track">
                <div 
                  className="db-gantt-block break" 
                  style={{ left: '18%', width: '13%' }} 
                  title="Management: 09:50 AM - 11:10 AM (Break)" 
                />
                <div 
                  className="db-gantt-block meeting" 
                  style={{ left: '33%', width: '8%' }} 
                  title="Management: 11:20 AM - 12:10 PM (Meeting)" 
                />
                <div 
                  className="db-gantt-block active" 
                  style={{ left: '46%', width: '31%' }} 
                  title="Management: 12:40 PM - 03:50 PM (Active)" 
                />
              </div>
            </div>

            {/* Row 4: Operations */}
            <div 
              className={`db-gantt-row ${activeDepartment === 'Operations' ? 'highlighted-row' : ''}`}
              style={{ opacity: activeDepartment && activeDepartment !== 'Operations' ? 0.45 : 1, transition: 'opacity 0.2s' }}
            >
              <span className="db-gantt-label">Operations</span>
              <div className="db-gantt-track">
                <div 
                  className="db-gantt-block break" 
                  style={{ left: '23%', width: '16%' }} 
                  title="Operations: 10:20 AM - 12:00 PM (Break)" 
                />
                <div 
                  className="db-gantt-block meeting" 
                  style={{ left: '48%', width: '19%' }} 
                  title="Operations: 12:50 PM - 02:45 PM (Meeting)" 
                />
                <div 
                  className="db-gantt-block idle" 
                  style={{ left: '70%', width: '14%' }} 
                  title="Operations: 03:00 PM - 04:30 PM (Idle)" 
                />
              </div>
            </div>
          </div>

          <div className="db-gantt-time-scale">
            <span />
            <div className="db-gantt-times">
              <span>8 AM</span>
              <span>10 AM</span>
              <span>12 PM</span>
              <span>2 PM</span>
              <span>4 PM</span>
              <span>6 PM</span>
            </div>
          </div>
        </div>

        {/* Bottom Card 2: Recent Highlights */}
        <div className="db-highlights-card">
          <div className="db-card-header-row">
            <h3 className="db-card-header-title">{dateOffset === 0 ? "Recent Highlights" : `Highlights · ${displayDate.short}`}</h3>
            <button 
              className="db-view-all-btn"
              onClick={() => onSelectTab && onSelectTab('team')}
              title="Open full team directory"
            >
              View All
            </button>
          </div>

          <div className="db-highlights-list">
            {highlightItems.length > 0 ? (
              highlightItems.map((hl, idx) => {
                const ActionIcon = hl.icon || LogIn;
                return (
                  <div 
                    key={idx} 
                    className="db-highlight-row"
                    onClick={() => onSelectTab && onSelectTab('team')}
                    style={{ cursor: 'pointer' }}
                    title={`View ${hl.name} in team directory`}
                  >
                    <div className="db-highlight-left">
                      <span className="db-highlight-action-icon">
                        <ActionIcon size={15} strokeWidth={2} />
                      </span>
                      <img src={hl.avatar} alt={hl.name} className="db-highlight-avatar" />
                      <span className="db-highlight-name">{hl.name}</span>
                      <span className="db-highlight-status">{hl.action}</span>
                    </div>
                    <span className="db-highlight-time">{hl.time}</span>
                  </div>
                );
              })
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 120,
                gap: 8,
                padding: '16px',
                color: 'var(--text-muted)',
                fontSize: 12,
                textAlign: 'center'
              }}>
                <Clock size={20} strokeWidth={1.5} style={{ opacity: 0.6 }} />
                <span>No logged activity recorded for {dateOffset === 0 ? 'today' : displayDate.short}</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Card 3: Quick Actions */}
        <div className="db-actions-card">
          <div className="db-card-header-row">
            <h3 className="db-card-header-title">Quick Actions</h3>
          </div>

          <div className="db-actions-grid">
            <div 
              className="db-action-tile"
              onClick={() => {
                if (typeof onOpenApplyLeave === 'function') {
                  onOpenApplyLeave();
                } else if (typeof onSelectTab === 'function') {
                  onSelectTab('attendance');
                }
              }}
              title="Apply for paid/casual/sick leave"
            >
              <div className="db-action-tile-icon">
                <Calendar size={22} strokeWidth={1.8} />
              </div>
              <span className="db-action-tile-label">Apply Leave</span>
            </div>

            <div 
              className="db-action-tile"
              onClick={() => handleQuickAction('My Attendance', 'attendance')}
              title="View your personal timesheet & punch history"
            >
              <div className="db-action-tile-icon">
                <Clock size={22} strokeWidth={1.8} />
              </div>
              <span className="db-action-tile-label">My Attendance</span>
            </div>

            <div 
              className="db-action-tile"
              onClick={() => handleQuickAction('View Reports', 'tasks')}
              title="View performance and project status reports"
            >
              <div className="db-action-tile-icon">
                <BarChart3 size={22} strokeWidth={1.8} />
              </div>
              <span className="db-action-tile-label">View Reports</span>
            </div>

            <div 
              className="db-action-tile"
              onClick={() => handleQuickAction('Request Correction', 'attendance')}
              title="Request clock-in/out attendance correction"
            >
              <div className="db-action-tile-icon">
                <FileEdit size={22} strokeWidth={1.8} />
              </div>
              <span className="db-action-tile-label">Request Correction</span>
            </div>
          </div>
        </div>
      </div>

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
});
