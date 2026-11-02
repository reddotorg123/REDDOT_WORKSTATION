import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  Search, 
  LogIn, 
  LogOut, 
  Coffee, 
  X,
  ChevronDown,
  User,
  XCircle,
  ArrowRight
} from 'lucide-react';

/**
 * Flip Card Component matching the 2-digit rounded flip tiles in target reference
 */
function FlipCard({ value, label }) {
  const str = String(value).padStart(2, '0');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{
        position: 'relative',
        background: '#16191E',
        color: '#FFFFFF',
        borderRadius: 14,
        padding: '10px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 56,
        fontWeight: 800,
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        boxShadow: '0 4px 16px rgba(0,0,0,0.22)',
        letterSpacing: '0.04em',
        minWidth: 114,
        height: 84,
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}>
        {/* Top half shine gradient */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '50%',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
          pointerEvents: 'none'
        }} />

        {/* Center horizontal split seam */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          height: 1.5,
          background: '#090B0D',
          boxShadow: '0 1px 0 rgba(255,255,255,0.08)',
          zIndex: 4
        }} />

        {/* Left hinge notch */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: -2,
          width: 4,
          height: 6,
          borderRadius: 2,
          background: '#FFFFFF',
          transform: 'translateY(-50%)',
          zIndex: 5
        }} />

        {/* Right hinge notch */}
        <div style={{
          position: 'absolute',
          top: '50%',
          right: -2,
          width: 4,
          height: 6,
          borderRadius: 2,
          background: '#FFFFFF',
          transform: 'translateY(-50%)',
          zIndex: 5
        }} />

        <span style={{ zIndex: 2 }}>{str}</span>
      </div>
      <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.02em' }}>{label}</span>
    </div>
  );
}

/**
 * Calendar Flip Tile Component for Date, Month, Year (Matching Flip Clock split-flap style)
 */
function CalendarFlipTile({ value, label, minWidth = 70 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{
        position: 'relative',
        background: '#16191E',
        color: '#FFFFFF',
        borderRadius: 10,
        padding: '5px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: typeof value === 'string' && value.length > 2 ? 19 : 23,
        fontWeight: 800,
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        boxShadow: '0 3px 10px rgba(0,0,0,0.22)',
        letterSpacing: '0.04em',
        minWidth,
        height: 44,
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}>
        {/* Top half shine gradient */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '50%',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 100%)',
          pointerEvents: 'none'
        }} />

        {/* Center horizontal split seam */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          height: 1.5,
          background: '#090B0D',
          boxShadow: '0 1px 0 rgba(255,255,255,0.08)',
          zIndex: 4
        }} />

        {/* Left hinge notch */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: -2,
          width: 3.5,
          height: 5,
          borderRadius: 1.5,
          background: '#FFFFFF',
          transform: 'translateY(-50%)',
          zIndex: 5
        }} />

        {/* Right hinge notch */}
        <div style={{
          position: 'absolute',
          top: '50%',
          right: -2,
          width: 3.5,
          height: 5,
          borderRadius: 1.5,
          background: '#FFFFFF',
          transform: 'translateY(-50%)',
          zIndex: 5
        }} />

        <span style={{ zIndex: 2 }}>{value}</span>
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {label}
      </span>
    </div>
  );
}



const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SHORT_MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_SHORT_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_LONG_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function parseAttendanceDate(str) {
  if (!str) return null;
  const d = new Date(str);
  if (!isNaN(d.getTime())) return d;
  const m = String(str).match(/(\d+)\/(\d+)\/(\d+)/);
  if (m) return new Date(parseInt(m[3], 10), parseInt(m[1], 10) - 1, parseInt(m[2], 10));
  return null;
}

export function AttendanceView({ 
  attendance = [], 
  punchLogs = [],
  leaves = [],
  onRecordAttendance, 
  currentMember = 'Jagadish K',
  teamMembers = [],
  userProfile = {},
  onOpenApplyLeave,
  timerState,
  onToggleTimer,
  onTakeBreak,
  onClockOut,
  onLoadAttendanceMonth
}) {
  const timerStartTime = timerState?.startTime && !timerState.startTime.includes('Off Duty') ? timerState.startTime : null;
  // Navigation Screen State: 'dashboard' (Reference A) | 'history' (Reference B) | 'daily_logs' (Reference C)
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const today = useMemo(() => new Date(), []);
  const todayStrShort = useMemo(() => today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), [today]);

  const [selectedDateKey, setSelectedDateKey] = useState(todayStrShort);
  const [selectedDayNumber, setSelectedDayNumber] = useState(() => today.getDate());
  const [isDateFiltered, setIsDateFiltered] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('All');
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState('All');
  const [currentMonthIndex, setCurrentMonthIndex] = useState(() => today.getMonth());
  const [currentYear, setCurrentYear] = useState(() => today.getFullYear());
  const [weekOffset, setWeekOffset] = useState(0); // 0 = This Week, -1 = Last Week, -2 = 2 Weeks Ago, etc.
  const [isWeekDropdownOpen, setIsWeekDropdownOpen] = useState(false);
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const [attendanceLoadState, setAttendanceLoadState] = useState('');
  const loadedAttendanceMonths = useRef(new Set());
  const loadingAttendanceMonths = useRef(new Set());

  const loadAttendanceMonth = useCallback(async (year, monthIndex) => {
    if (typeof onLoadAttendanceMonth !== 'function') return;
    const key = `${year}-${monthIndex}`;
    if (loadedAttendanceMonths.current.has(key) || loadingAttendanceMonths.current.has(key)) return;

    loadingAttendanceMonths.current.add(key);
    setAttendanceLoadState('Loading attendance history…');
    try {
      await onLoadAttendanceMonth(year, monthIndex);
      loadedAttendanceMonths.current.add(key);
      setAttendanceLoadState('');
    } catch (error) {
      console.error('[ATTENDANCE] Could not load selected month:', error);
      setAttendanceLoadState('Could not load this month. Check your connection and try again.');
    } finally {
      loadingAttendanceMonths.current.delete(key);
    }
  }, [onLoadAttendanceMonth]);

  useEffect(() => {
    if (currentScreen === 'history' || currentScreen === 'daily_logs') {
      void loadAttendanceMonth(currentYear, currentMonthIndex);
    }
  }, [currentScreen, currentYear, currentMonthIndex, loadAttendanceMonth]);

  // Live Clock Tick State
  const [currentTime, setCurrentTime] = useState(() => new Date());

  const liveHours = currentTime.getHours();
  const liveMinutes = currentTime.getMinutes();
  const liveSeconds = currentTime.getSeconds();

  const hourAngle = ((liveHours % 12) + liveMinutes / 60 + liveSeconds / 3600) * 30;
  const minuteAngle = (liveMinutes + liveSeconds / 60) * 6;
  const secondAngle = liveSeconds * 6;

  const timeString = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  // Real Shift Timer Engine State (matching active shift today)
  const [shiftStatus, setShiftStatus] = useState('WORKING'); // 'WORKING' | 'ON_BREAK' | 'CLOCKED_OUT'
  const [shiftSeconds, setShiftSeconds] = useState(0); // Dynamic: starts at 0, not hardcoded!
  const [shiftProductiveSeconds, setShiftProductiveSeconds] = useState(0);

  // Sync with central timerState from App.jsx
  useEffect(() => {
    if (timerState && typeof timerState.seconds === 'number') {
      setShiftSeconds(timerState.seconds);
      if (typeof timerState.productiveSeconds === 'number') {
        setShiftProductiveSeconds(timerState.productiveSeconds);
      }
      if (timerState.isAutoBreak) {
        setShiftStatus('ON_BREAK');
      } else if (timerState.isRunning) {
        setShiftStatus('WORKING');
      } else {
        setShiftStatus('CLOCKED_OUT');
      }
    }
  }, [timerState]);

  // Calculate dynamic today's work hours for logged-in user from real database punchLogs
  useEffect(() => {
    const allPunches = [...(punchLogs || []), ...(attendance || [])];
    if (allPunches.length === 0) return;
    const userTarget = (currentMember || userProfile?.name || 'Jagadish K').toLowerCase();

    // Check ONLY today's punches for the active user
    const todayPunches = allPunches.filter(p => {
      const pName = (p.name || p.member || '').toLowerCase();
      if (!pName.includes(userTarget) && !userTarget.includes(pName)) return false;
      const punchDate = p.date || (p.timestamp ? new Date(p.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '');
      return punchDate === todayStrShort;
    }).sort((a, b) => (Number(a.timestamp) || 0) - (Number(b.timestamp) || 0));

    if (todayPunches.length > 0) {
      let totalWorkMs = 0;
      let lastInTime = null;
      let activeStatus = 'CLOCKED_OUT';

      todayPunches.forEach(p => {
        const act = (p.action || '').toUpperCase();
        let t = p.timestamp ? Number(p.timestamp) : null;
        if (!t && p.time && p.date) {
          const parsed = new Date(`${p.date} ${p.time}`);
          if (!isNaN(parsed.getTime())) t = parsed.getTime();
        }

        if (act === 'CLOCK_IN' || act === 'PUNCH_IN') {
          lastInTime = t || Date.now();
          activeStatus = 'WORKING';
        } else if (act === 'CLOCK_OUT' || act === 'PUNCH_OUT' || act === 'BREAK' || act === 'BREAK_START') {
          if (lastInTime && t && t > lastInTime) {
            const seg = t - lastInTime;
            if (seg > 0 && seg <= 12 * 3600 * 1000) {
              totalWorkMs += seg;
            }
            lastInTime = null;
          }
          activeStatus = act.includes('BREAK') ? 'ON_BREAK' : 'CLOCKED_OUT';
        }
      });

      if (lastInTime && activeStatus === 'WORKING') {
        const elapsed = Date.now() - lastInTime;
        if (elapsed > 0 && elapsed <= 12 * 3600 * 1000) {
          totalWorkMs += elapsed;
        }
      }

      // If workHours pre-computed on punches
      if (totalWorkMs === 0) {
        for (const p of todayPunches) {
          const wh = p.workHours || p.duration;
          if (wh && typeof wh === 'string') {
            const matchH = wh.match(/(\d+)h/i);
            const matchM = wh.match(/(\d+)m/i);
            if (matchH || matchM) {
              const h = matchH ? parseInt(matchH[1], 10) : 0;
              const m = matchM ? parseInt(matchM[1], 10) : 0;
              totalWorkMs = (h * 3600 + m * 60) * 1000;
              break;
            }
          }
        }
      }

      const calculatedSecs = Math.floor(totalWorkMs / 1000);
      if (calculatedSecs > 0 && calculatedSecs <= 12 * 3600) {
        queueMicrotask(() => {
          setShiftSeconds(calculatedSecs);
          setShiftStatus(activeStatus);
        });
      }
    }
  }, [punchLogs, attendance, currentMember, userProfile, todayStrShort]);

  // Timer interval: active work timer ticks every second when WORKING
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());

      if (shiftStatus === 'WORKING') {
        setShiftSeconds(prev => prev + 1);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [shiftStatus]);

  // Dynamic aggregation of all punch records for the selected Month & Year DIRECTLY from real database
  const records = useMemo(() => {
    const allPunches = [...(punchLogs || []), ...(attendance || [])];
    const grouped = new Map();

    allPunches.forEach(punch => {
      const dt = parseAttendanceDate(punch.date || punch.timestamp);
      if (!dt) return;
      if (dt.getFullYear() !== currentYear || dt.getMonth() !== currentMonthIndex) return;

      let memberName = punch.employeeName || punch.name || punch.member || punch.userName;
      if ((!memberName || memberName === 'Employee') && punch.workerId && Array.isArray(teamMembers)) {
        const found = teamMembers.find(m => m.id === punch.workerId || m.uid === punch.workerId);
        if (found) memberName = found.name;
      }
      if (!memberName || memberName === 'Employee') {
        memberName = userProfile?.name || 'Jagadish K';
      }

      const dayNum = dt.getDate();
      const dateKey = `${SHORT_MONTH_NAMES[currentMonthIndex]} ${dayNum}, ${currentYear}`;
      const groupKey = `${memberName}:::${dateKey}`;

      if (!grouped.has(groupKey)) {
        grouped.set(groupKey, {
          memberName,
          dt,
          dayNum,
          dateKey,
          punches: []
        });
      }
      grouped.get(groupKey).punches.push(punch);
    });

    // Add records for employees with approved leave on dates in the current month
    if (Array.isArray(leaves) && leaves.length > 0) {
      leaves.forEach(lv => {
        const lvStatus = (lv.status || '').toLowerCase();
        if (lvStatus !== 'approved' && lvStatus !== 'leave' && lvStatus !== 'pending') return;
        const applicantName = lv.applicantName || lv.userName || lv.memberName || lv.name;
        if (!applicantName) return;

        // Check if leave covers this month
        const startDt = parseAttendanceDate(lv.startDate || lv.date);
        const endDt = parseAttendanceDate(lv.endDate || lv.startDate || lv.date) || startDt;
        if (!startDt) return;

        for (let d = new Date(startDt); d <= endDt; d.setDate(d.getDate() + 1)) {
          if (d.getFullYear() === currentYear && d.getMonth() === currentMonthIndex) {
            const dayNum = d.getDate();
            const dateKey = `${SHORT_MONTH_NAMES[currentMonthIndex]} ${dayNum}, ${currentYear}`;
            const gKey = `${applicantName}:::${dateKey}`;
            if (!grouped.has(gKey)) {
              grouped.set(gKey, {
                memberName: applicantName,
                dt: new Date(d),
                dayNum,
                dateKey,
                punches: [],
                isLeave: true,
                leaveType: lv.leaveType || lv.type || 'On Leave'
              });
            }
          }
        }
      });
    }

    const resultList = [];

    // Convert grouped real database punches into structured daily records
    grouped.forEach((item) => {
      const sortedPunches = [...item.punches].sort((a, b) => (Number(a.timestamp) || 0) - (Number(b.timestamp) || 0));

      if (sortedPunches.length === 0) {
        if (item.isLeave) {
          resultList.push({
            id: `rec-${item.memberName}-${item.dateKey}`.replace(/\s+/g, '-'),
            memberName: item.memberName,
            dateKey: item.dateKey,
            dateDisplay: item.dateKey,
            fullDate: `${MONTH_NAMES[currentMonthIndex]} ${item.dayNum}, ${currentYear}`,
            day: DAY_SHORT_NAMES[item.dt.getDay()],
            dayLong: DAY_LONG_NAMES[item.dt.getDay()],
            dayNumber: item.dayNum,
            checkIn: '--:--',
            checkOut: '--:--',
            checkInOutDisplay: '--:-- - --:--',
            workHours: '0h 00m',
            workHoursNum: 0,
            productiveHours: '0h 00m',
            productiveHoursNum: 0,
            breakTime: '0m',
            breakTimeNum: 0,
            productiveRate: '0%',
            targetHoursNum: 9.0,
            firstCheckIn: '--:--',
            lastCheckOut: '--:--',
            netHours: '0h 00m',
            totalLogs: 0,
            status: 'On Leave',
            location: 'Remote Workstation',
            ipAddress: '192.168.1.24',
            logs: []
          });
          return;
        }

        const isToday = item.dayNum === today.getDate() && currentMonthIndex === today.getMonth() && currentYear === today.getFullYear();
        const isCurrentActive = isToday && ((item.memberName || '').toLowerCase() === (currentMember || userProfile?.name || '').toLowerCase()) && shiftStatus === 'WORKING';

        if (!isCurrentActive) {
          // If no punches and not currently active session, do not pollute records list
          return;
        }

        const workH = Math.floor(shiftSeconds / 3600);
        const workM = Math.floor((shiftSeconds % 3600) / 60);
        const whStr = `${workH}h ${String(workM).padStart(2, '0')}m`;
        const prodSecs = timerState?.productiveSeconds !== undefined ? timerState.productiveSeconds : shiftProductiveSeconds;
        const prodH = Math.floor(prodSecs / 3600);
        const prodM = Math.floor((prodSecs % 3600) / 60);
        const prodHStr = `${prodH}h ${String(prodM).padStart(2, '0')}m`;

        resultList.push({
          id: `rec-${item.memberName}-${item.dateKey}`.replace(/\s+/g, '-'),
          memberName: item.memberName,
          dateKey: item.dateKey,
          dateDisplay: item.dateKey,
          fullDate: `${MONTH_NAMES[currentMonthIndex]} ${item.dayNum}, ${currentYear}`,
          day: DAY_SHORT_NAMES[item.dt.getDay()],
          dayLong: DAY_LONG_NAMES[item.dt.getDay()],
          dayNumber: item.dayNum,
          checkIn: timerStartTime || '09:00 AM',
          checkOut: '--:--',
          checkInOutDisplay: `${timerStartTime || '09:00 AM'} - Active`,
          workHours: whStr,
          workHoursNum: +(shiftSeconds / 3600).toFixed(2),
          productiveHours: prodHStr,
          productiveHoursNum: +(prodSecs / 3600).toFixed(2),
          breakTime: '0m',
          breakTimeNum: 0,
          productiveRate: shiftSeconds > 0 ? `${Math.min(100, Math.round((prodSecs / shiftSeconds) * 100))}%` : '100%',
          targetHoursNum: 9.0,
          firstCheckIn: timerStartTime || '09:00 AM',
          lastCheckOut: '--:--',
          netHours: prodHStr,
          totalLogs: 1,
          status: 'Present',
          location: 'Main Building (Office)',
          ipAddress: '192.168.1.24',
          logs: [{
            id: `log-active-${Date.now()}`,
            time: timerStartTime || '09:00 AM',
            type: 'check_in',
            label: 'Check In (Active Session)',
            loc: 'Main Building (Office) - IP: 192.168.1.24',
            verified: true,
            duration: whStr
          }]
        });
        return;
      }

      const firstPunch = sortedPunches[0];
      const lastPunch = sortedPunches[sortedPunches.length - 1];

      const inPunch = sortedPunches.find(p => (p.action || '').toUpperCase() === 'CLOCK_IN' || (p.action || '').toUpperCase() === 'PUNCH_IN') || firstPunch;
      const outPunch = [...sortedPunches].reverse().find(p => (p.action || '').toUpperCase() === 'CLOCK_OUT' || (p.action || '').toUpperCase() === 'PUNCH_OUT') || lastPunch;

      // Calculate working hours and break durations strictly for that particular day
      let workedMs = 0;
      let breakMs = 0;
      let lastInTs = null;
      let lastBreakStartTs = null;

      sortedPunches.forEach(p => {
        const act = (p.action || '').toUpperCase();
        let ts = p.timestamp ? Number(p.timestamp) : null;
        if (!ts && p.time && p.date) {
          const parsed = new Date(`${p.date} ${p.time}`);
          if (!isNaN(parsed.getTime())) ts = parsed.getTime();
        }
        if (!ts) ts = Date.now();

        if (act === 'CLOCK_IN' || act === 'PUNCH_IN' || act === 'BREAK_END') {
          if (act === 'BREAK_END' && lastBreakStartTs && ts > lastBreakStartTs) {
            breakMs += (ts - lastBreakStartTs);
            lastBreakStartTs = null;
          }
          lastInTs = ts;
        } else if (act === 'BREAK_START' || act === 'BREAK') {
          if (lastInTs && ts > lastInTs) {
            const seg = ts - lastInTs;
            if (seg > 0 && seg <= 14 * 3600 * 1000) {
              workedMs += seg;
            }
          }
          lastInTs = null;
          lastBreakStartTs = ts;
        } else if (act === 'CLOCK_OUT' || act === 'PUNCH_OUT') {
          if (lastInTs && ts > lastInTs) {
            const seg = ts - lastInTs;
            if (seg > 0 && seg <= 14 * 3600 * 1000) {
              workedMs += seg;
            }
          }
          lastInTs = null;
        }
      });

      // Check if any punch has an explicit workHours recorded (e.g. '6h 38m', '8h 33m')
      if (workedMs === 0) {
        for (const p of sortedPunches) {
          const wh = p.workHours || p.duration;
          if (wh && typeof wh === 'string') {
            const matchH = wh.match(/(\d+)h/i);
            const matchM = wh.match(/(\d+)m/i);
            if (matchH || matchM) {
              const h = matchH ? parseInt(matchH[1], 10) : 0;
              const m = matchM ? parseInt(matchM[1], 10) : 0;
              workedMs = (h * 3600 + m * 60) * 1000;
              break;
            }
          }
        }
      }

      // Fallback span if clock in and clock out were recorded
      if (workedMs === 0 && inPunch && outPunch && outPunch.timestamp > inPunch.timestamp) {
        const span = outPunch.timestamp - inPunch.timestamp;
        if (span > 0 && span <= 14 * 3600 * 1000) {
          workedMs = span;
        }
      }

      const totalH = Math.floor(workedMs / (1000 * 3600));
      const totalM = Math.floor((workedMs % (1000 * 3600)) / (1000 * 60));
      const workHoursStr = workedMs > 0 ? `${totalH}h ${String(totalM).padStart(2, '0')}m` : '--';

      const totalBreakM = Math.round(breakMs / (1000 * 60));
      const breakTimeStr = totalBreakM > 0 ? (totalBreakM >= 60 ? `${Math.floor(totalBreakM / 60)}h ${totalBreakM % 60}m` : `${totalBreakM}m`) : '0m';

      // Productive hours = worked hours minus breaks, or explicit productive duration
      let productiveMs = Math.max(0, workedMs - breakMs);
      for (const p of sortedPunches) {
        const pd = p.productiveDuration;
        if (pd && typeof pd === 'string') {
          const matchH = pd.match(/(\d+)h/i);
          const matchM = pd.match(/(\d+)m/i);
          if (matchH || matchM) {
            const h = matchH ? parseInt(matchH[1], 10) : 0;
            const m = matchM ? parseInt(matchM[1], 10) : 0;
            productiveMs = (h * 3600 + m * 60) * 1000;
            break;
          }
        }
      }

      const prodH = Math.floor(productiveMs / (1000 * 3600));
      const prodM = Math.floor((productiveMs % (1000 * 3600)) / (1000 * 60));
      const productiveHoursStr = workedMs > 0 ? `${prodH}h ${String(prodM).padStart(2, '0')}m` : '--';
      const productiveRateStr = workedMs > 0 ? `${Math.min(100, Math.round((productiveMs / workedMs) * 100))}%` : '100%';

      const checkInTime = inPunch?.time || inPunch?.checkIn || (inPunch?.timestamp ? new Date(inPunch.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--:--');
      const checkOutTime = outPunch && outPunch !== inPunch ? (outPunch.time || outPunch.checkOut || (outPunch.timestamp ? new Date(outPunch.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--:--')) : '--:--';

      const logsList = sortedPunches.map((p, idx) => {
        const act = (p.action || '').toUpperCase();
        let logType = 'check_in';
        let logLabel = 'Check In';
        if (act.includes('BREAK')) {
          logType = 'break_start';
          logLabel = 'Break Time';
        } else if (act.includes('OUT')) {
          logType = 'check_out';
          logLabel = 'Check Out';
        }

        return {
          id: p.id || `log-${idx}-${Date.now()}`,
          time: p.time || (p.timestamp ? new Date(p.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '09:00 AM'),
          type: logType,
          label: logLabel,
          loc: 'Main Building (Office) - IP: 192.168.1.24',
          verified: true,
          duration: act.includes('OUT') ? workHoursStr : (act.includes('BREAK') ? '30m' : null)
        };
      });

      resultList.push({
        id: `rec-${item.memberName}-${item.dateKey}`.replace(/\s+/g, '-'),
        memberName: item.memberName,
        dateKey: item.dateKey,
        dateDisplay: item.dateKey,
        fullDate: `${MONTH_NAMES[currentMonthIndex]} ${item.dayNum}, ${currentYear}`,
        day: DAY_SHORT_NAMES[item.dt.getDay()],
        dayLong: DAY_LONG_NAMES[item.dt.getDay()],
        dayNumber: item.dayNum,
        checkIn: checkInTime,
        checkOut: checkOutTime,
        checkInOutDisplay: `${checkInTime} - ${checkOutTime}`,
        workHours: workHoursStr,
        workHoursNum: +(workedMs / 3600000).toFixed(2),
        productiveHours: productiveHoursStr,
        productiveHoursNum: +(productiveMs / 3600000).toFixed(2),
        breakTime: breakTimeStr,
        breakTimeNum: +(breakMs / 3600000).toFixed(2),
        productiveRate: productiveRateStr,
        targetHoursNum: 9.0,
        firstCheckIn: checkInTime,
        lastCheckOut: checkOutTime,
        netHours: productiveHoursStr,
        totalLogs: logsList.length,
        status: totalH >= 8 ? 'Present' : (totalH >= 4 ? 'Half Day' : (workedMs > 0 ? 'Present' : 'Absent')),
        location: 'Main Building (Office)',
        ipAddress: '192.168.1.24',
        logs: logsList
      });
    });

    // Sort descending by day number
    return resultList.sort((a, b) => b.dayNumber - a.dayNumber);
  }, [punchLogs, attendance, leaves, currentMonthIndex, currentYear, today, currentMember, userProfile, shiftStatus, shiftSeconds, shiftProductiveSeconds, timerState, timerStartTime]);

  // Derived values for Flip Clock: calculated for THAT PARTICULAR DAY!
  const isTodaySelected = selectedDateKey === todayStrShort || selectedDateKey === 'Today';
  const userTargetName = (currentMember || userProfile?.name || 'Jagadish K').toLowerCase();
  const selectedDayRecord = useMemo(() => {
    return records.find(r => {
      const matchMember = (r.memberName || '').toLowerCase().includes(userTargetName) || userTargetName.includes((r.memberName || '').toLowerCase());
      return matchMember && (r.dateKey === selectedDateKey || r.dateDisplay === selectedDateKey);
    });
  }, [records, selectedDateKey, userTargetName]);

  // Total Working Hours (displayed on Flip Clock)
  const activeWorkedSecs = isTodaySelected
    ? (timerState?.seconds !== undefined ? timerState.seconds : shiftSeconds)
    : (selectedDayRecord ? Math.round(selectedDayRecord.workHoursNum * 3600) : 0);

  const hoursNum = Math.floor(activeWorkedSecs / 3600);
  const minutesNum = Math.floor((activeWorkedSecs % 3600) / 60);

  const hoursStr = String(hoursNum).padStart(2, '0');
  const minutesStr = String(minutesNum).padStart(2, '0');

  // Productive Working Hours (displayed on Wall Clock)
  const activeProductiveSecs = isTodaySelected
    ? (timerState?.productiveSeconds !== undefined ? timerState.productiveSeconds : shiftProductiveSeconds)
    : (selectedDayRecord ? Math.round((selectedDayRecord.productiveHoursNum || selectedDayRecord.workHoursNum * 0.85) * 3600) : 0);

  const prodHoursNum = Math.floor(activeProductiveSecs / 3600);
  const prodMinutesNum = Math.floor((activeProductiveSecs % 3600) / 60);
  const prodSecondsNum = activeProductiveSecs % 60;

  const prodHoursStr = String(prodHoursNum).padStart(2, '0');
  const prodMinutesStr = String(prodMinutesNum).padStart(2, '0');

  const productivityScore = activeWorkedSecs > 0
    ? Math.min(100, Math.round((activeProductiveSecs / activeWorkedSecs) * 100))
    : 100;

  // Analog Wall Clock angles representing Productive Hours
  const prodHourAngle = ((prodHoursNum % 12) + prodMinutesNum / 60 + prodSecondsNum / 3600) * 30;
  const prodMinuteAngle = (prodMinutesNum + prodSecondsNum / 60) * 6;
  const prodSecondAngle = (shiftStatus === 'WORKING' && !timerState?.isAutoBreak) ? (prodSecondsNum * 6) : 0;

  // Calendar Flip Tiles (Date, Month, Year) values
  const displayDateNum = String(selectedDayNumber || today.getDate()).padStart(2, '0');
  const displayMonthStr = (SHORT_MONTH_NAMES[currentMonthIndex] || 'Oct').toUpperCase();
  const displayYearStr = String(currentYear || today.getFullYear());

  // Real-time progress percentage against 9h (32,400s) target for the selected day
  const progressPercent = Math.min(100, Math.max(0, Math.round((activeWorkedSecs / 32400) * 100)));

  // Current user's records from real database
  const userRecords = useMemo(() => {
    const target = (currentMember || userProfile?.name || 'Jagadish K').toLowerCase();
    const list = records.filter(r => {
      const m = (r.memberName || '').toLowerCase();
      return m.includes(target) || target.includes(m);
    });
    return list.length > 0 ? list : records;
  }, [records, currentMember, userProfile]);

  // Dynamic Shift Boundary arc math for Analog Clock
  const clockArcData = useMemo(() => {
    const parseTimeToMinutes = (timeStr) => {
      if (!timeStr || timeStr === '--:--' || typeof timeStr !== 'string') return null;
      const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (!match) return null;
      let h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const ampm = match[3] ? match[3].toUpperCase() : null;
      if (ampm === 'PM' && h < 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;
      return h * 60 + m;
    };

    let inMin = null;
    let outMin = null;
    let inLabel = 'IN 09:00';
    let outLabel = 'OUT 18:00';

    if (isTodaySelected) {
      if (timerStartTime) {
        inMin = parseTimeToMinutes(timerStartTime);
        inLabel = `IN ${timerStartTime}`;
      }
      if (shiftStatus === 'WORKING') {
        const curD = new Date();
        outMin = curD.getHours() * 60 + curD.getMinutes();
        outLabel = `NOW ${curD.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
      } else if (selectedDayRecord?.lastCheckOut && selectedDayRecord.lastCheckOut !== '--:--') {
        outMin = parseTimeToMinutes(selectedDayRecord.lastCheckOut);
        outLabel = `OUT ${selectedDayRecord.lastCheckOut}`;
      }
    } else if (selectedDayRecord) {
      if (selectedDayRecord.firstCheckIn && selectedDayRecord.firstCheckIn !== '--:--') {
        inMin = parseTimeToMinutes(selectedDayRecord.firstCheckIn);
        inLabel = `IN ${selectedDayRecord.firstCheckIn}`;
      }
      if (selectedDayRecord.lastCheckOut && selectedDayRecord.lastCheckOut !== '--:--') {
        outMin = parseTimeToMinutes(selectedDayRecord.lastCheckOut);
        outLabel = `OUT ${selectedDayRecord.lastCheckOut}`;
      }
    }

    if (inMin === null) inMin = 9 * 60; // default 09:00
    if (outMin === null) outMin = inMin + (activeWorkedSecs > 0 ? Math.round(activeWorkedSecs / 60) : 9 * 60);

    // Convert minutes to angle on 12-hour clock (0 deg is at 12 o'clock / -90 deg from standard cartesian 0)
    const inAngleDeg = ((inMin % 720) / 720) * 360;
    const outAngleDeg = ((outMin % 720) / 720) * 360;

    let span = outAngleDeg - inAngleDeg;
    if (span <= 0) span += 360;
    const largeArcFlag = span > 180 ? 1 : 0;

    const r = 117;
    const cx = 1018;
    const cy = 219;

    const radIn = (inAngleDeg - 90) * (Math.PI / 180);
    const radOut = (outAngleDeg - 90) * (Math.PI / 180);

    const x1 = +(cx + r * Math.cos(radIn)).toFixed(1);
    const y1 = +(cy + r * Math.sin(radIn)).toFixed(1);
    const x2 = +(cx + r * Math.cos(radOut)).toFixed(1);
    const y2 = +(cy + r * Math.sin(radOut)).toFixed(1);

    const pathD = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
    const arcOnlyD = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2}`;

    // Tag positions with collision avoidance:
    // Placed at clean radius outside clock numbers to avoid any overlap
    const angleDiff = Math.abs(inAngleDeg - outAngleDeg);
    const isClose = angleDiff < 36 || angleDiff > 324;
    const inTagR = 142;
    const outTagR = isClose ? 162 : 142;

    const inTagX = +(cx + inTagR * Math.cos(radIn)).toFixed(1);
    const inTagY = +(cy + inTagR * Math.sin(radIn)).toFixed(1);
    const outTagX = +(cx + outTagR * Math.cos(radOut)).toFixed(1);
    const outTagY = +(cy + outTagR * Math.sin(radOut)).toFixed(1);

    return {
      pathD,
      arcOnlyD,
      x1, y1, x2, y2,
      inLabel, outLabel,
      inTagX, inTagY, outTagX, outTagY
    };
  }, [isTodaySelected, timerStartTime, shiftStatus, selectedDayRecord, activeWorkedSecs]);

  // Dynamic Weekly Attendance Data derived from real database
  const weeklyAttendanceData = useMemo(() => {
    const baseDate = new Date(today);
    baseDate.setDate(today.getDate() + (weekOffset * 7));
    const dayOfWeek = baseDate.getDay();
    const diffToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(baseDate);
    monday.setDate(baseDate.getDate() - diffToMonday);

    const days = [];
    let presentCount = 0;
    let halfDayCount = 0;
    let absentCount = 0;
    let onLeaveCount = 0;

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dayShort = DAY_SHORT_NAMES[d.getDay()];
      const dayNum = String(d.getDate());
      const dateKeyStr = `${SHORT_MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;

      const isToday = d.toDateString() === today.toDateString();
      const rec = userRecords.find(r => r.dateKey === dateKeyStr || r.dateDisplay === dateKeyStr);
      let h = 0;
      let isWorked = false;
      let status = 'Absent';

      if (isToday && activeWorkedSecs > 0) {
        h = +(activeWorkedSecs / 3600).toFixed(1);
        isWorked = true;
        status = 'Present';
      } else if (rec) {
        h = rec.workHoursNum || 0;
        isWorked = h > 0;
        status = rec.status || 'Present';
      }

      if (status === 'Present') presentCount++;
      else if (status.includes('Half')) halfDayCount++;
      else if (status.includes('Leave')) onLeaveCount++;
      else if (d <= today) absentCount++;

      days.push({
        day: dayShort,
        num: dayNum,
        h,
        isWorked,
        status,
        dateKeyStr
      });
    }

    return {
      days,
      presentCount,
      halfDayCount,
      absentCount,
      onLeaveCount
    };
  }, [weekOffset, today, userRecords, activeWorkedSecs]);

  // Dynamic Month stats derived from real database
  const monthStats = useMemo(() => {
    let present = 0;
    let halfDay = 0;
    let absent = 0;
    let onLeave = 0;

    userRecords.forEach(r => {
      const s = (r.status || '').toLowerCase();
      if (s === 'present') present++;
      else if (s.includes('half')) halfDay++;
      else if (s === 'absent') absent++;
      else if (s.includes('leave')) onLeave++;
      else present++;
    });

    const totalWorkingDays = (present + halfDay + absent + onLeave) || 1;
    const presentPercent = Math.min(100, Math.round(((present + halfDay * 0.5) / totalWorkingDays) * 100));

    return {
      present: present || userRecords.length || 1,
      halfDay,
      absent,
      onLeave,
      presentPercent: presentPercent || 80
    };
  }, [userRecords]);

  // Available unique employees in the records
  const availableEmployees = useMemo(() => {
    const names = new Set();
    records.forEach(r => {
      if (r.memberName && r.memberName !== 'Employee') names.add(r.memberName);
    });
    if (Array.isArray(teamMembers)) {
      teamMembers.forEach(m => {
        if (m && m.name) names.add(m.name);
      });
    }
    // Add current user and common teammates
    if (currentMember) names.add(currentMember);
    names.add('Pavithra R');
    names.add('Jai Keerthi');
    names.add('Tejaswini Siva');
    return ['All', ...Array.from(names)];
  }, [records, currentMember, teamMembers]);

  // Filtered records for Screen B History View
  const filteredHistory = useMemo(() => {
    return records.filter(rec => {
      // Particular day filter: when isDateFiltered is true, show ONLY records for that selected calendar date!
      if (isDateFiltered && selectedDayNumber && rec.dayNumber !== selectedDayNumber) {
        return false;
      }
      // Status filter
      if (historyStatusFilter !== 'All' && rec.status.toLowerCase() !== historyStatusFilter.toLowerCase()) {
        return false;
      }
      // Employee filter
      if (selectedEmployeeFilter !== 'All') {
        const empName = (rec.memberName || '').toLowerCase();
        const target = selectedEmployeeFilter.toLowerCase();
        if (!empName.includes(target) && !target.includes(empName)) return false;
      }
      // Search query
      if (!historySearchQuery.trim()) return true;
      const q = historySearchQuery.toLowerCase();
      return rec.dateDisplay.toLowerCase().includes(q) || 
             rec.day.toLowerCase().includes(q) || 
             rec.status.toLowerCase().includes(q) ||
             (rec.memberName && rec.memberName.toLowerCase().includes(q));
    });
  }, [records, isDateFiltered, selectedDayNumber, historyStatusFilter, selectedEmployeeFilter, historySearchQuery]);

  // Find currently active record for Screen C
  const activeRecord = useMemo(() => {
    if (selectedRecordId) {
      const byId = records.find(r => r.id === selectedRecordId);
      if (byId) return byId;
    }
    return records.find(r => r.dateKey === selectedDateKey) || records[0] || {
      id: 'empty-rec',
      memberName: currentMember,
      dateKey: selectedDateKey,
      dateDisplay: selectedDateKey,
      fullDate: selectedDateKey,
      day: 'Mon',
      dayLong: 'Monday',
      dayNumber: selectedDayNumber,
      checkIn: '--:--',
      checkOut: '--:--',
      workHours: '--',
      productiveHours: '--',
      firstCheckIn: '--:--',
      lastCheckOut: '--:--',
      breakTime: '--',
      netHours: '--',
      totalLogs: 0,
      status: 'Absent',
      location: 'Remote Workstation',
      ipAddress: '192.168.1.24',
      logs: []
    };
  }, [records, selectedRecordId, selectedDateKey, selectedDayNumber, currentMember]);

  // =========================================================================
  // EXPLICIT BUTTON ACTION HANDLERS (Full Functionality for Each Button)
  // =========================================================================

  /**
   * 1. CLOCK IN BUTTON HANDLER
   */
  const handleClockIn = () => {
    setShiftStatus('WORKING');
    if (typeof onToggleTimer === 'function' && (!timerState?.isRunning || shiftStatus !== 'WORKING')) {
      onToggleTimer();
    } else {
      const timeStr = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const dateStr = currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      if (typeof onRecordAttendance === 'function') {
        onRecordAttendance({
          id: `att-${Date.now()}`,
          date: dateStr,
          member: currentMember,
          checkIn: timeStr,
          checkOut: '--:--',
          workHours: `${hoursNum}h ${minutesStr}m`,
          action: 'CLOCK_IN',
          status: 'Present',
          timestamp: Date.now()
        });
      }
    }
  };

  /**
   * 2. BREAK BUTTON HANDLER
   */
  const handleToggleBreak = () => {
    if (typeof onTakeBreak === 'function') {
      onTakeBreak();
    } else {
      const timeStr = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const dateStr = currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      if (shiftStatus === 'WORKING') {
        setShiftStatus('ON_BREAK');
        if (typeof onRecordAttendance === 'function') {
          onRecordAttendance({
            id: `att-break-${Date.now()}`,
            date: dateStr,
            time: timeStr,
            member: currentMember,
            action: 'BREAK_START',
            status: 'On Break',
            timestamp: Date.now()
          });
        }
      } else {
        setShiftStatus('WORKING');
        if (typeof onRecordAttendance === 'function') {
          onRecordAttendance({
            id: `att-break-end-${Date.now()}`,
            date: dateStr,
            time: timeStr,
            member: currentMember,
            action: 'BREAK_END',
            status: 'Present',
            timestamp: Date.now()
          });
        }
      }
    }
  };

  /**
   * 3. CLOCK OUT BUTTON HANDLER
   */
  const handleClockOut = () => {
    setShiftStatus('CLOCKED_OUT');
    if (typeof onClockOut === 'function') {
      onClockOut();
    } else {
      const timeStr = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const dateStr = currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const finalHoursStr = `${hoursNum}h ${minutesStr}m`;

      if (typeof onRecordAttendance === 'function') {
        onRecordAttendance({
          id: `att-out-${Date.now()}`,
          date: dateStr,
          member: currentMember,
          checkIn: selectedDayRecord?.checkIn || '09:00 AM',
          checkOut: timeStr,
          workHours: finalHoursStr,
          action: 'CLOCK_OUT',
          status: 'Completed',
          timestamp: Date.now()
        });
      }
    }
  };

  const actionsRef = useRef({});
  useEffect(() => {
    actionsRef.current = { handleClockIn, handleToggleBreak, handleClockOut };
  });

  // Global Keyboard Shortcuts: Ctrl+I for IN, Ctrl+B for BREAK, Ctrl+O for OUT
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      const key = (e.key || '').toLowerCase();
      if (key === 'i') {
        e.preventDefault();
        actionsRef.current.handleClockIn?.();
      } else if (key === 'b') {
        e.preventDefault();
        actionsRef.current.handleToggleBreak?.();
      } else if (key === 'o') {
        e.preventDefault();
        actionsRef.current.handleClockOut?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  /**
   * 4. MONTH NAVIGATION HANDLERS (< and >)
   */
  const handlePrevMonth = () => {
    const previous = new Date(currentYear, currentMonthIndex - 1, 1);
    setCurrentYear(previous.getFullYear());
    setCurrentMonthIndex(previous.getMonth());
  };

  const handleNextMonth = () => {
    const next = new Date(currentYear, currentMonthIndex + 1, 1);
    setCurrentYear(next.getFullYear());
    setCurrentMonthIndex(next.getMonth());
  };

  /**
   * 5. "TODAY" BUTTON HANDLER
   */
  const handleGoToToday = () => {
    setCurrentMonthIndex(today.getMonth());
    setCurrentYear(today.getFullYear());
    void loadAttendanceMonth(today.getFullYear(), today.getMonth());
    setSelectedDateKey(todayStrShort);
    setSelectedDayNumber(today.getDate());
  };

  const getStatusDotColor = (status) => {
    switch (status) {
      case 'Present': return '#181B20';
      case 'Half Day': return '#64748B';
      case 'Absent': return '#94A3B8';
      case 'On Leave':
      case 'Leave': return '#CBD5E1';
      default: return '#94A3B8';
    }
  };

  // =========================================================================
  // SCREEN C: DAILY ATTENDANCE LOGS (Reference C)
  // =========================================================================
  if (currentScreen === 'daily_logs') {
    return (
      <div className="attendance-view" style={{ 
        minHeight: '100%', 
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        color: 'var(--text-primary)',
        fontFamily: 'inherit'
      }}>
        {/* Navigation / Header Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16
        }}>
          {/* Back button */}
          <button 
            type="button"
            onClick={() => setCurrentScreen('history')}
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: 8, 
              fontWeight: 800, 
              fontSize: 16,
              background: 'transparent',
              border: 'none',
              color: '#17191C',
              cursor: 'pointer',
              padding: 0
            }}
          >
            <ChevronLeft size={18} color="#17191C" />
            <span>Daily Attendance Logs</span>
          </button>

          {/* Date Selector Navigation & Close */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: '#FFFFFF',
              border: '1px solid #DCE1E7',
              borderRadius: 6,
              padding: '2px 4px'
            }}>
              <button 
                type="button"
                className="win-btn" 
                onClick={() => {
                  const idx = records.findIndex(r => r.dateKey === selectedDateKey);
                  if (idx < records.length - 1) setSelectedDateKey(records[idx + 1].dateKey);
                }}
                style={{ width: 24, height: 24, cursor: 'pointer' }}
                title="Previous Day"
              >
                <ChevronLeft size={13} />
              </button>
              <span style={{ fontSize: 12, fontWeight: 700, minWidth: 84, textAlign: 'center' }}>
                {activeRecord.dateDisplay}
              </span>
              <button 
                type="button"
                className="win-btn" 
                onClick={() => {
                  const idx = records.findIndex(r => r.dateKey === selectedDateKey);
                  if (idx > 0) setSelectedDateKey(records[idx - 1].dateKey);
                }}
                style={{ width: 24, height: 24, cursor: 'pointer' }}
                title="Next Day"
              >
                <ChevronRight size={13} />
              </button>
            </div>

            <button 
              type="button"
              className="win-btn" 
              onClick={() => setCurrentScreen('history')}
              style={{ width: 28, height: 28, cursor: 'pointer' }}
              title="Return to History"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Date & Employee Title Banner */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#FFFFFF',
          border: '1px solid #DCE1E7',
          borderRadius: 8,
          padding: '12px 18px',
          marginBottom: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: '#17191C',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 12,
                border: '1.5px solid #DCE1E7'
              }}>
                {(activeRecord.memberName || 'Employee').charAt(0)}
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: '#17191C' }}>
                  {activeRecord.memberName || 'Employee'}
                </div>
                <div style={{ fontSize: 11, color: '#667085' }}>
                  Verified Attendance Ledger
                </div>
              </div>
            </div>

            <div style={{ width: 1, height: 26, background: '#DCE1E7', margin: '0 4px' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CalendarIcon size={15} color="var(--text-primary, #17191C)" />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#17191C' }}>
                {activeRecord.fullDate} &nbsp;&bull;&nbsp; {activeRecord.dayLong}
              </span>
            </div>
          </div>

          <span style={{
            padding: '3px 12px',
            borderRadius: 12,
            fontSize: 11,
            fontWeight: 700,
            background: activeRecord.status === 'Present' ? 'var(--bg-active-nav)' : 'var(--bg-subtle)',
            color: activeRecord.status === 'Present' ? '#ffffff' : 'var(--text-secondary)',
            border: `1px solid var(--border-color)`
          }}>
            {activeRecord.status}
          </span>
        </div>

        {/* Main Grid: Left Scrollable Timeline, Right Summary Panels */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'minmax(0, 1.35fr) 340px', 
          gap: 16, 
          alignItems: 'start' 
        }}>
          {/* LEFT: Scrollable Punch Event Timeline */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #DCE1E7',
            borderRadius: 8,
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 'calc(100vh - 200px)',
            overflow: 'hidden'
          }}>
            {/* Independent Scrollable Timeline Container */}
            <div style={{ 
              flex: 1, 
              overflowY: 'auto', 
              paddingRight: 6,
              position: 'relative'
            }}>
              {activeRecord.logs.length === 0 ? (
                <div style={{ padding: '48px 16px', textAlign: 'center', color: '#89919B', fontSize: 12 }}>
                  No punch events recorded for this date.
                </div>
              ) : (
                <div style={{ position: 'relative', paddingLeft: 4 }}>
                  {/* Subtle Theme Neutral Connecting Line */}
                  <div style={{
                    position: 'absolute',
                    top: 14,
                    bottom: 24,
                    left: 92,
                    width: 2,
                    background: '#CBD5E1',
                    opacity: 0.8
                  }} />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {activeRecord.logs.map((log) => {
                      const isCheckIn = log.type === 'check_in';
                      const isBreak = log.type.startsWith('break');

                      return (
                        <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: 20, position: 'relative' }}>
                          {/* Timestamp column */}
                          <div style={{ 
                            width: 72, 
                            fontSize: 12, 
                            fontWeight: 700, 
                            color: '#17191C', 
                            textAlign: 'right',
                            fontFamily: 'var(--font-mono, monospace)',
                            flexShrink: 0
                          }}>
                            {log.time}
                          </div>

                          {/* Node circle */}
                          <div style={{
                            width: 13,
                            height: 13,
                            borderRadius: '50%',
                            background: '#17191C',
                            border: '2.5px solid #FFFFFF',
                            boxShadow: '0 0 0 1px #17191C',
                            zIndex: 2,
                            flexShrink: 0
                          }} />

                          {/* Event details card */}
                          <div style={{
                            flex: 1,
                            background: '#F7F8FA',
                            border: '1px solid #DCE1E7',
                            borderRadius: 6,
                            padding: '9px 14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 12
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ 
                                width: 24, 
                                height: 24, 
                                borderRadius: 4, 
                                background: '#FFFFFF', 
                                border: '1px solid #DCE1E7',
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyItems: 'center',
                                justifyContent: 'center' 
                              }}>
                                {isCheckIn ? (
                                  <LogIn size={13} color="#17191C" />
                                ) : isBreak ? (
                                  <Coffee size={13} color="#667085" />
                                ) : (
                                  <LogOut size={13} color="#667085" />
                                )}
                              </div>
                              <div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#17191C' }}>
                                  {log.label}
                                </div>
                                {log.loc && (
                                  <div style={{ fontSize: 10.5, color: '#667085', marginTop: 1 }}>
                                    {log.loc}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Verified Badge or Duration Tag */}
                            {log.verified ? (
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: 4,
                                fontSize: 10.5,
                                fontWeight: 700,
                                background: 'var(--bg-subtle, #F1F5F9)',
                                color: 'var(--text-primary, #17191C)',
                                border: '1px solid var(--border-color, #DCE1E7)'
                              }}>
                                Verified
                              </span>
                            ) : log.duration ? (
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: 4,
                                fontSize: 10.5,
                                fontWeight: 700,
                                background: '#FFFFFF',
                                color: '#17191C',
                                border: '1px solid #DCE1E7',
                                fontFamily: 'var(--font-mono, monospace)'
                              }}>
                                {log.duration}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Summary Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Work Summary Card */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #DCE1E7',
              borderRadius: 8,
              padding: '18px 20px'
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#17191C', marginBottom: 14 }}>
                Work Summary
              </div>

              {/* Dual Hero Stats: Total Work Hours & Productive Hours */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
                <div style={{
                  padding: '12px 14px',
                  background: '#F7F8FA',
                  border: '1px solid #DCE1E7',
                  borderRadius: 8
                }}>
                  <div style={{ fontSize: 11, color: '#667085', marginBottom: 4 }}>Total Work Hours</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#17191C' }}>
                    {activeRecord.workHours}
                  </div>
                </div>

                <div style={{
                  padding: '12px 14px',
                  background: 'var(--bg-active-nav, #22262B)',
                  borderRadius: 8,
                  color: '#FFFFFF'
                }}>
                  <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 4 }}>Productive Hours</div>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>
                    {activeRecord.productiveHours || activeRecord.netHours}
                  </div>
                </div>
              </div>

              {/* Data Table Rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 11.5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 6, borderBottom: '1px solid #E1E5E9' }}>
                  <span style={{ color: '#667085' }}>First Check-In</span>
                  <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono, monospace)' }}>{activeRecord.firstCheckIn}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 6, borderBottom: '1px solid #E1E5E9' }}>
                  <span style={{ color: '#667085' }}>Last Check-Out</span>
                  <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono, monospace)' }}>{activeRecord.lastCheckOut}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 6, borderBottom: '1px solid #E1E5E9' }}>
                  <span style={{ color: '#667085' }}>Total Break Time</span>
                  <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono, monospace)' }}>{activeRecord.breakTime}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 6, borderBottom: '1px solid #E1E5E9' }}>
                  <span style={{ color: '#667085' }}>Net Working Hours</span>
                  <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono, monospace)' }}>{activeRecord.netHours}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 6, borderBottom: '1px solid #E1E5E9' }}>
                  <span style={{ color: '#667085' }}>Productive Hours</span>
                  <span style={{ fontWeight: 800, color: 'var(--text-primary, #17191C)', fontFamily: 'var(--font-mono, monospace)' }}>
                    {activeRecord.productiveHours || activeRecord.netHours}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 6, borderBottom: '1px solid #E1E5E9' }}>
                  <span style={{ color: '#667085' }}>Productivity Rate</span>
                  <span style={{ fontWeight: 800, color: 'var(--text-primary, #17191C)', fontFamily: 'var(--font-mono, monospace)' }}>
                    {activeRecord.productiveRate || '100%'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 6, borderBottom: '1px solid #E1E5E9' }}>
                  <span style={{ color: '#667085' }}>Total Log Count</span>
                  <span style={{ fontWeight: 700 }}>{activeRecord.totalLogs}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#667085' }}>Status</span>
                  <span style={{ 
                    fontWeight: 700, 
                    color: getStatusDotColor(activeRecord.status), 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: 5 
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: getStatusDotColor(activeRecord.status) }} />
                    {activeRecord.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Location Details Card */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #DCE1E7',
              borderRadius: 8,
              padding: '16px 18px'
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#17191C', marginBottom: 12 }}>
                Location Details
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 54,
                  height: 48,
                  borderRadius: 6,
                  background: '#F7F8FA',
                  border: '1px solid #DCE1E7',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <img 
                    src="./assets/facility-banner.jpg" 
                    alt="Main Building Office" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#17191C' }}>
                    {activeRecord.location}
                  </div>
                  <div style={{ fontSize: 11, color: '#667085', marginTop: 2, fontFamily: 'var(--font-mono, monospace)' }}>
                    IP: {activeRecord.ipAddress}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // SCREEN B: ATTENDANCE HISTORY (Reference B)
  // =========================================================================
  if (currentScreen === 'history') {
    return (
      <div className="attendance-view" style={{ 
        minHeight: '100%', 
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        color: 'var(--text-primary)',
        fontFamily: 'inherit'
      }}>
        {/* Header Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16
        }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: '#17191C' }}>Attendance History</h1>
            <p style={{ fontSize: 12, color: '#667085', margin: '2px 0 0 0' }}>View and manage your complete attendance records.</p>
            {attendanceLoadState && (
              <p role="status" style={{ fontSize: 11, color: '#667085', margin: '4px 0 0 0' }}>
                {attendanceLoadState}
              </p>
            )}
          </div>

          <button 
            type="button"
            className="win-btn" 
            onClick={() => setCurrentScreen('dashboard')}
            style={{ width: 28, height: 28, cursor: 'pointer' }}
            title="Return to Main Dashboard"
          >
            <X size={16} />
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
          background: '#FFFFFF',
          padding: '10px 16px',
          borderRadius: 8,
          border: '1px solid #DCE1E7',
          marginBottom: 16
        }}>
          {/* Month Navigator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button 
              type="button" 
              className="win-btn" 
              onClick={handlePrevMonth}
              style={{ width: 26, height: 26, cursor: 'pointer' }} 
              title="Previous Month"
            >
              <ChevronLeft size={13} />
            </button>
            <span style={{ fontSize: 12.5, fontWeight: 700, padding: '0 8px' }}>
              {MONTH_NAMES[currentMonthIndex]} {currentYear}
            </span>
            <button 
              type="button" 
              className="win-btn" 
              onClick={handleNextMonth}
              style={{ width: 26, height: 26, cursor: 'pointer' }} 
              title="Next Month"
            >
              <ChevronRight size={13} />
            </button>
          </div>

          {/* Search Bar */}
          <div className="search-omnibox" style={{ 
            flex: 1, 
            maxWidth: 320, 
            height: 32, 
            background: '#F7F8FA',
            border: '1px solid #DCE1E7',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            padding: '0 8px',
            gap: 6
          }}>
            <Search size={13} color="#667085" />
            <input 
              type="text" 
              placeholder="Search by date, employee or status..." 
              value={historySearchQuery}
              onChange={e => setHistorySearchQuery(e.target.value)}
              style={{ 
                fontSize: 12, 
                border: 'none', 
                background: 'transparent', 
                outline: 'none', 
                flex: 1, 
                color: '#17191C' 
              }}
            />
            {historySearchQuery && (
              <button 
                type="button" 
                className="win-btn" 
                onClick={() => setHistorySearchQuery('')} 
                style={{ width: 18, height: 18, cursor: 'pointer' }}
              >
                <X size={11} />
              </button>
            )}
          </div>

          {/* Active Date Filter Toggle */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {isDateFiltered ? (
              <button
                type="button"
                onClick={() => setIsDateFiltered(false)}
                title="Currently showing only selected day. Click to view all days of the month."
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  height: 32,
                  padding: '0 10px',
                  background: 'var(--bg-active-nav, #22262B)',
                  color: '#FFFFFF',
                  borderRadius: 6,
                  fontSize: 11.5,
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
              >
                <CalendarIcon size={12} />
                <span>{SHORT_MONTH_NAMES[currentMonthIndex]} {selectedDayNumber}</span>
                <span style={{ opacity: 0.7, fontSize: 10, marginLeft: 2 }}>✕ All Days</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsDateFiltered(true)}
                title="Click to filter by the selected calendar date."
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  height: 32,
                  padding: '0 10px',
                  background: '#FFFFFF',
                  color: '#667085',
                  borderRadius: 6,
                  fontSize: 11.5,
                  fontWeight: 600,
                  border: '1px solid #DCE1E7',
                  cursor: 'pointer'
                }}
              >
                <CalendarIcon size={12} />
                <span>All Month Days</span>
              </button>
            )}
          </div>

          {/* Employee Filter Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#667085' }}>Employee:</span>
            <select
              className="select-control"
              value={selectedEmployeeFilter}
              onChange={e => setSelectedEmployeeFilter(e.target.value)}
              style={{ 
                height: 32, 
                fontSize: 12, 
                padding: '0 8px', 
                minWidth: 140, 
                background: '#FFFFFF', 
                border: '1px solid #DCE1E7', 
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              {availableEmployees.map(emp => (
                <option key={emp} value={emp}>
                  {emp === 'All' ? 'All Employees' : emp}
                </option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <select
              className="select-control"
              value={historyStatusFilter}
              onChange={e => setHistoryStatusFilter(e.target.value)}
              style={{ 
                height: 32, 
                fontSize: 12, 
                padding: '0 10px', 
                minWidth: 110, 
                background: '#FFFFFF', 
                border: '1px solid #DCE1E7', 
                borderRadius: 6,
                cursor: 'pointer'
              }}
            >
              <option value="All">All Status</option>
              <option value="Present">Present</option>
              <option value="Half Day">Half Day</option>
              <option value="Absent">Absent</option>
              <option value="Leave">Leave</option>
            </select>
          </div>

          {/* Apply Leave Action Button */}
          {onOpenApplyLeave && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={onOpenApplyLeave}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                height: 32,
                fontSize: 12,
                fontWeight: 700,
                background: 'var(--bg-active-nav, #22262B)',
                borderColor: 'var(--border-color)',
                color: '#FFFFFF',
                borderRadius: 6,
                padding: '0 12px',
                cursor: 'pointer',
                marginLeft: 'auto'
              }}
            >
              <CalendarIcon size={13} />
              <span>Apply Leave</span>
            </button>
          )}
        </div>

        {/* Main Grid: Left Calendar Panel (300px), Right Records Table */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '300px minmax(0, 1fr)', 
          gap: 16, 
          alignItems: 'start' 
        }}>
          {/* LEFT: Calendar Panel */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #DCE1E7',
            borderRadius: 8,
            padding: '16px 18px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>
                {MONTH_NAMES[currentMonthIndex]} {currentYear}
              </span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button type="button" className="win-btn" onClick={handlePrevMonth} style={{ width: 22, height: 22, cursor: 'pointer' }}>
                  <ChevronLeft size={12} />
                </button>
                <button type="button" className="win-btn" onClick={handleNextMonth} style={{ width: 22, height: 22, cursor: 'pointer' }}>
                  <ChevronRight size={12} />
                </button>
              </div>
            </div>

            {/* Weekdays */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(7, 1fr)', 
              textAlign: 'center', 
              fontSize: 10.5, 
              fontWeight: 600, 
              color: '#89919B', 
              marginBottom: 8 
            }}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, idx) => <div key={idx}>{d}</div>)}
            </div>

            {/* Dynamic Days Grid for selected month */}
            {(() => {
              const firstDayOfWeek = new Date(currentYear, currentMonthIndex, 1).getDay();
              const daysInMonthCount = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
              const daysInPrevMonthCount = new Date(currentYear, currentMonthIndex, 0).getDate();

              const leadingTrailingDays = [];
              for (let i = firstDayOfWeek - 1; i >= 0; i--) {
                leadingTrailingDays.push(daysInPrevMonthCount - i);
              }

              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, textAlign: 'center' }}>
                  {/* Leading Days */}
                  {leadingTrailingDays.map(d => (
                    <div key={`p-${d}`} style={{ padding: '6px 0', fontSize: 11, color: '#89919B', opacity: 0.35 }}>
                      {d}
                    </div>
                  ))}

                  {/* Active Month Days */}
                  {Array.from({ length: daysInMonthCount }, (_, i) => i + 1).map(day => {
                    const isSelected = day === selectedDayNumber;
                    const dateMatch = records.find(r => r.dayNumber === day);
                    let dayDot = null;
                    if (dateMatch) {
                      dayDot = getStatusDotColor(dateMatch.status);
                    }

                    return (
                      <div
                        key={day}
                        onClick={() => {
                          setSelectedDayNumber(day);
                          setIsDateFiltered(true);
                          if (dateMatch) {
                            setSelectedDateKey(dateMatch.dateKey);
                          } else {
                            const newKey = `${SHORT_MONTH_NAMES[currentMonthIndex]} ${day}, ${currentYear}`;
                            setSelectedDateKey(newKey);
                          }
                        }}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '3px 0',
                          cursor: 'pointer'
                        }}
                      >
                        <span style={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          background: isSelected ? '#17191C' : 'transparent',
                          color: isSelected ? '#FFFFFF' : '#17191C',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 11.5,
                          fontWeight: isSelected ? 800 : 500,
                          transition: 'all 0.12s'
                        }}>
                          {day}
                        </span>
                        {dayDot && !isSelected && (
                          <span style={{
                            width: 4,
                            height: 4,
                            borderRadius: '50%',
                            background: dayDot,
                            marginTop: 1
                          }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Legend */}
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 12, 
              marginTop: 16, 
              paddingTop: 12, 
              borderTop: '1px solid #E1E5E9', 
              fontSize: 10.5 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#181B20' }} />
                <span>Present</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#64748B' }} />
                <span>Half Day</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#94A3B8' }} />
                <span>Absent</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#CBD5E1' }} />
                <span>Leave</span>
              </div>
            </div>
          </div>

          {/* RIGHT: Attendance Records Table */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #DCE1E7',
            borderRadius: 8,
            overflow: 'hidden'
          }}>
            <table className="tech-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F7F8FA', borderBottom: '1px solid #DCE1E7' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#667085' }}>EMPLOYEE</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#667085' }}>DATE</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#667085' }}>DAY</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#667085' }}>CHECK-IN / OUT</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#667085' }}>WORK HOURS</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#667085' }}>STATUS</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#667085' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '36px 14px', textAlign: 'center', color: '#89919B', fontSize: 12 }}>
                      No attendance records found for this period.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map(rec => {
                    const isRowSelected = rec.dayNumber === selectedDayNumber;
                    return (
                      <tr 
                        key={rec.id} 
                        style={{ 
                          borderBottom: '1px solid #E1E5E9',
                          background: isRowSelected ? '#F4F5F6' : 'transparent',
                          transition: 'background 0.12s'
                        }}
                      >
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                              width: 26,
                              height: 26,
                              borderRadius: '50%',
                              background: '#17191C',
                              color: '#FFFFFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 11,
                              fontWeight: 700,
                              flexShrink: 0
                            }}>
                              {(rec.memberName || 'E').charAt(0)}
                            </div>
                            <span style={{ fontWeight: 700, fontSize: 12, color: '#17191C' }}>
                              {rec.memberName || 'Employee'}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px', fontWeight: 600, fontSize: 12 }}>{rec.dateDisplay}</td>
                        <td style={{ padding: '10px 14px', color: '#667085', fontSize: 12 }}>{rec.day}</td>
                        <td style={{ padding: '10px 14px', color: '#667085', fontSize: 12, fontFamily: 'var(--font-mono, monospace)' }}>
                          {rec.checkInOutDisplay}
                        </td>
                        <td style={{ padding: '10px 14px', fontWeight: 700, fontSize: 12 }}>{rec.workHours}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: 6, 
                            fontWeight: 600, 
                            fontSize: 11.5, 
                            color: getStatusDotColor(rec.status) 
                          }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: getStatusDotColor(rec.status) }} />
                            {rec.status}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <button 
                            type="button"
                            className="btn"
                            onClick={() => {
                              setSelectedRecordId(rec.id);
                              setSelectedDateKey(rec.dateKey);
                              setSelectedDayNumber(rec.dayNumber);
                              setCurrentScreen('daily_logs');
                            }}
                            style={{ 
                              fontSize: 11, 
                              padding: '4px 14px', 
                              background: 'var(--bg-card, #FFFFFF)', 
                              color: 'var(--text-primary, #17191C)', 
                              border: '1px solid var(--border-color, #DCE1E7)',
                              borderRadius: 5,
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.12s ease'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover, #F4F5F6)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card, #FFFFFF)'; }}
                          >
                            View Logs
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // SCREEN A: TIME & ATTENDANCE MAIN DASHBOARD (Matching Target UI Reference)
  // =========================================================================
  return (
    <div className="attendance-view" style={{ 
      height: '100%', 
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      color: 'var(--text-primary)',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      boxSizing: 'border-box'
    }}>
      {/* Streamlined Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>Time &amp; Attendance</h1>
        </div>

        {/* Date Month Selector & Today button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-surface, #FFFFFF)',
            border: '1px solid var(--border-color, #E5E7EB)',
            borderRadius: 8,
            padding: '3px 6px',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)'
          }}>
            <CalendarIcon size={14} color="var(--text-primary)" style={{ marginLeft: 6 }} />
            <span style={{ padding: '0 10px', fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>
              {MONTH_NAMES[currentMonthIndex]} {currentYear}
            </span>
            <button 
              type="button" 
              className="win-btn" 
              onClick={handlePrevMonth}
              style={{ width: 24, height: 24, cursor: 'pointer', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
              title="Previous month"
            >
              <ChevronLeft size={13} />
            </button>
            <button 
              type="button" 
              className="win-btn" 
              onClick={handleNextMonth}
              style={{ width: 24, height: 24, cursor: 'pointer', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
              title="Next month"
            >
              <ChevronRight size={13} />
            </button>
          </div>

          <button 
            type="button" 
            className="btn" 
            onClick={handleGoToToday}
            style={{ 
              padding: '0 16px', 
              height: 32, 
              fontSize: 12, 
              fontWeight: 700, 
              background: '#17191C', 
              color: '#FFFFFF',
              borderRadius: 8,
              cursor: 'pointer',
              border: 'none',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.15s ease'
            }}
          >
            Today
          </button>
        </div>
      </div>

      {/* TOP ROW: RESTORED PREVIOUS WIDTH WITH INCREASED HEIGHT TO ABSORB EXTRA SPACE */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(380px, 420px) 1fr',
        gap: 12,
        flex: 1,
        minHeight: 300
      }}>
        {/* Top Card 1: Centered Flip Clock Session Pallet (Restored previous width) */}
        <div style={{
          background: 'var(--bg-surface, #FFFFFF)',
          border: '1px solid var(--border-color, #E5E7EB)',
          borderRadius: 16,
          padding: '18px 22px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 1px 3px rgba(16,24,40,0.04)',
          height: '100%'
        }}>
          {/* Active Date Context Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '-0.1px' }}>
              {isTodaySelected ? "Today's Work Hours" : `${selectedDateKey}`}
            </span>
            {!isTodaySelected && (
              <button 
                type="button"
                onClick={handleGoToToday}
                style={{
                  background: 'var(--bg-subtle, #F1F5F9)',
                  border: '1px solid var(--border-color, #E2E8F0)',
                  borderRadius: 6,
                  padding: '2px 8px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#2563EB',
                  cursor: 'pointer'
                }}
              >
                Back to Today
              </button>
            )}
          </div>

          {/* DEDICATED CENTER ZONE: Calendar Flip Tiles (Date, Month, Year) & Work Hours Flip Clock */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            minHeight: 0
          }}>
            {/* ROW 1: Calendar Flip Tiles (Date, Month, Year matching Flip Clock split-flap style) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <CalendarFlipTile value={displayDateNum} label="Date" minWidth={68} />
              <CalendarFlipTile value={displayMonthStr} label="Month" minWidth={78} />
              <CalendarFlipTile value={displayYearStr} label="Year" minWidth={88} />
            </div>

            {/* ROW 2: Live Work Hours Flip Clock with Blinking 2 Dots Seconds Indicator */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
              <FlipCard value={hoursStr} label="Hours" />
              
              {/* Blinking 2 Dots Seconds Indicator (1 Hz live ticking indicator) */}
              <div 
                style={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  marginTop: -20,
                  opacity: liveSeconds % 2 === 0 ? 1 : 0.12,
                  transition: 'opacity 0.1s ease',
                  userSelect: 'none',
                  width: 16
                }}
                title={`Seconds: ${liveSeconds}s`}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#181B20', display: 'block', boxShadow: '0 1px 2px rgba(0,0,0,0.15)' }} />
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#181B20', display: 'block', boxShadow: '0 1px 2px rgba(0,0,0,0.15)' }} />
              </div>

              <FlipCard value={minutesStr} label="Minutes" />
            </div>
          </div>

          {/* Bottom Controls Area: Progress Indicator & Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flexShrink: 0 }}>
            {/* Minimalist Progress Indicator */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 5 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)' }}>{progressPercent}%</span>
              </div>
              <div style={{ width: '100%', height: 6, background: 'var(--bg-subtle, #E5E7EB)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${progressPercent}%`, height: '100%', background: '#181B20', borderRadius: 3, transition: 'width 0.4s ease' }} />
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
              {[
                { id: 'WORKING', icon: LogIn, action: handleClockIn, label: 'Clock In' },
                { id: 'ON_BREAK', icon: Coffee, action: handleToggleBreak, label: 'Break' },
                { id: 'CLOCKED_OUT', icon: LogOut, action: handleClockOut, label: 'Clock Out' }
              ].map(btn => {
                const isActive = shiftStatus === btn.id;
                const IconComp = btn.icon;
                return (
                  <button
                    key={btn.id}
                    type="button"
                    onClick={btn.action}
                    title={btn.label}
                    aria-label={btn.label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 50,
                      height: 38,
                      background: isActive ? '#181B20' : 'var(--bg-surface, #FFFFFF)',
                      color: isActive ? '#FFFFFF' : '#334155',
                      border: isActive ? '1px solid #181B20' : '1px solid var(--border-color, #E2E8F0)',
                      borderRadius: 8,
                      cursor: 'pointer',
                      boxShadow: isActive ? '0 2px 6px rgba(0,0,0,0.18)' : '0 1px 2px rgba(0,0,0,0.03)',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => {
                      if (!isActive) e.currentTarget.style.background = 'var(--bg-hover, #F8FAFC)';
                    }}
                    onMouseLeave={e => {
                      if (!isActive) e.currentTarget.style.background = 'var(--bg-surface, #FFFFFF)';
                    }}
                  >
                    <IconComp size={17} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top Card 2: Connected Unified Workspace & Live Swiss Clock Pallet (Matching Reference Image) */}
        <div style={{
          background: 'var(--bg-surface, #FFFFFF)',
          border: '1px solid var(--border-color, #E5E7EB)',
          borderRadius: 16,
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(16,24,40,0.04)',
          padding: 0
        }}>
          <div style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img 
              src="./assets/workspace-scene-clean.png" 
              alt="Workspace Scene" 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover',
                objectPosition: 'center',
                display: 'block',
                pointerEvents: 'none',
                userSelect: 'none'
              }} 
            />
            <svg 
              viewBox="0 0 1536 720" 
              preserveAspectRatio="xMidYMid slice"
              style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                width: '100%', 
                height: '100%', 
                pointerEvents: 'none' 
              }}
            >
              {/* Clock In to Clock Out Gray-Filled Shift Boundary (Dynamic Arc) */}
              <path 
                d={clockArcData.pathD} 
                fill="#DDE2E7" 
                opacity="0.82"
              />

              {/* Shift Boundary Guidelines & Tags with pill backgrounds */}
              <line x1="1018" y1="219" x2={clockArcData.x1} y2={clockArcData.y1} stroke="#64748B" strokeWidth="1.4" strokeDasharray="3 2" />
              <line x1="1018" y1="219" x2={clockArcData.x2} y2={clockArcData.y2} stroke="#64748B" strokeWidth="1.4" strokeDasharray="3 2" />
              <g transform={`translate(${clockArcData.inTagX}, ${clockArcData.inTagY})`}>
                <rect x="-32" y="-9" width="64" height="18" rx="9" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.08))" />
                <text 
                  x="0" 
                  y="0" 
                  textAnchor="middle" 
                  dominantBaseline="central" 
                  fontSize="8" 
                  fontWeight="800" 
                  fill="#0F172A" 
                  letterSpacing="0.02em"
                >
                  {clockArcData.inLabel}
                </text>
              </g>
              <g transform={`translate(${clockArcData.outTagX}, ${clockArcData.outTagY})`}>
                <rect x="-34" y="-9" width="68" height="18" rx="9" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.08))" />
                <text 
                  x="0" 
                  y="0" 
                  textAnchor="middle" 
                  dominantBaseline="central" 
                  fontSize="8" 
                  fontWeight="800" 
                  fill="#0F172A" 
                  letterSpacing="0.02em"
                >
                  {clockArcData.outLabel}
                </text>
              </g>

              {/* 60 Minute Tick Marks */}
              {Array.from({ length: 60 }).map((_, i) => {
                const isMajor = i % 5 === 0;
                const angle = i * 6;
                const r1 = isMajor ? 104 : 108;
                const r2 = 114;
                const rad = (angle - 90) * (Math.PI / 180);
                const x1 = 1018 + r1 * Math.cos(rad);
                const y1 = 219 + r1 * Math.sin(rad);
                const x2 = 1018 + r2 * Math.cos(rad);
                const y2 = 219 + r2 * Math.sin(rad);
                return (
                  <line 
                    key={i} 
                    x1={x1} 
                    y1={y1} 
                    x2={x2} 
                    y2={y2} 
                    stroke={isMajor ? '#111827' : '#94A3B8'} 
                    strokeWidth={isMajor ? 2.0 : 1.0} 
                  />
                );
              })}

              {/* Upright Numerals 1 to 12 */}
              {[
                { n: '1', x: 1064.0, y: 139.3 },
                { n: '2', x: 1097.7, y: 173.0 },
                { n: '3', x: 1110.0, y: 219.0 },
                { n: '4', x: 1097.7, y: 265.0 },
                { n: '5', x: 1064.0, y: 298.7 },
                { n: '6', x: 1018.0, y: 311.0 },
                { n: '7', x: 972.0, y: 298.7 },
                { n: '8', x: 938.3, y: 265.0 },
                { n: '9', x: 926.0, y: 219.0 },
                { n: '10', x: 938.3, y: 173.0 },
                { n: '11', x: 972.0, y: 139.3 },
                { n: '12', x: 1018.0, y: 127.0 }
              ].map(item => (
                <text
                  key={item.n}
                  x={item.x}
                  y={item.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="13"
                  fontWeight="700"
                  fill="#111827"
                  fontFamily="Inter, system-ui, -apple-system, sans-serif"
                >
                  {item.n}
                </text>
              ))}

              {/* Productive Hours Sub-title on Clock Dial */}
              <text 
                x="1018" 
                y="180" 
                textAnchor="middle" 
                dominantBaseline="central" 
                fontSize="8" 
                fontWeight="800" 
                fill="#64748B" 
                letterSpacing="0.08em"
              >
                PRODUCTIVE
              </text>
              <text 
                x="1018" 
                y="260" 
                textAnchor="middle" 
                dominantBaseline="central" 
                fontSize="10" 
                fontWeight="800" 
                fill="#0F172A" 
                letterSpacing="0.04em"
              >
                {prodHoursStr}h {prodMinutesStr}m
              </text>

              {/* Productive Hour Hand (displays Productive Working Hours) */}
              <line
                x1="1018"
                y1="219"
                x2="1018"
                y2="159"
                stroke="#111827"
                strokeWidth="4.5"
                strokeLinecap="round"
                transform={`rotate(${prodHourAngle}, 1018, 219)`}
              />

              {/* Productive Minute Hand */}
              <line
                x1="1018"
                y1="219"
                x2="1018"
                y2="127"
                stroke="#111827"
                strokeWidth="3.2"
                strokeLinecap="round"
                transform={`rotate(${prodMinuteAngle}, 1018, 219)`}
              />

              {/* Productive Second Hand (sweeps when actively working) */}
              <line
                x1="1018"
                y1="237"
                x2="1018"
                y2="114"
                stroke={shiftStatus === 'ON_BREAK' ? '#94A3B8' : '#1E293B'}
                strokeWidth="1.6"
                strokeLinecap="round"
                transform={`rotate(${prodSecondAngle}, 1018, 219)`}
              />

              {/* Center Pivot Cap */}
              <circle cx="1018" cy="219" r="6" fill="#111827" />
              <circle cx="1018" cy="219" r="2.2" fill="#FFFFFF" />

              {/* Real-time Digital Productive Work Hours Badge below Wall Clock */}
              <rect 
                x="908" 
                y="384" 
                width="220" 
                height="28" 
                rx="14" 
                fill="#FFFFFF" 
                stroke={shiftStatus === 'ON_BREAK' ? '#F59E0B' : '#E2E8F0'} 
                strokeWidth="1.3" 
              />
              <circle 
                cx="924" 
                cy="398" 
                r="4.5" 
                fill={shiftStatus === 'ON_BREAK' ? '#F59E0B' : (shiftStatus === 'WORKING' ? '#10B981' : '#94A3B8')} 
              />
              <text 
                x="1022" 
                y="398" 
                textAnchor="middle" 
                dominantBaseline="central" 
                fontSize="11" 
                fontWeight="700" 
                fill="#1E293B" 
                letterSpacing="0.02em"
              >
                {shiftStatus === 'ON_BREAK' 
                  ? `⏸️ Break (Idle): ${prodHoursStr}h ${prodMinutesStr}m (${productivityScore}%)`
                  : `⚡ Productive: ${prodHoursStr}h ${prodMinutesStr}m (${productivityScore}% Active)`
                }
              </text>
            </svg>
            </div>
          </div>
        </div>

      {/* BOTTOM ROW: 3 ANALYTICS METRIC CARDS (Reduced compact height, NO empty void, internal scroll on Recent Attendance) */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1.1fr 1fr 1.6fr', 
        gap: 12,
        height: 235,
        flexShrink: 0
      }}>
        {/* Card 4: Weekly Attendance */}
        <div style={{
          background: 'var(--bg-surface, #FFFFFF)',
          border: '1px solid var(--border-color, #E5E7EB)',
          borderRadius: 14,
          padding: '12px 16px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 1px 3px rgba(16,24,40,0.04)',
          height: '100%'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div>
                <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>Weekly Attendance</span>
              </div>
              <div style={{ position: 'relative' }}>
                <div 
                  onClick={() => setIsWeekDropdownOpen(prev => !prev)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    background: 'var(--bg-subtle, #F9FAFB)',
                    border: '1px solid var(--border-color, #E5E7EB)',
                    borderRadius: 6,
                    padding: '2px 8px',
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <span>{weekOffset === 0 ? 'This Week' : (weekOffset === -1 ? 'Last Week' : `${Math.abs(weekOffset)} Weeks Ago`)}</span>
                  <ChevronDown size={12} color="var(--text-secondary)" style={{ transform: isWeekDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
                </div>

                {isWeekDropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: 4,
                    background: 'var(--bg-surface, #FFFFFF)',
                    border: '1px solid var(--border-color, #E2E8F0)',
                    borderRadius: 8,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    zIndex: 50,
                    minWidth: 120,
                    padding: '4px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2
                  }}>
                    {[
                      { label: 'This Week', offset: 0 },
                      { label: 'Last Week', offset: -1 },
                      { label: '2 Weeks Ago', offset: -2 },
                      { label: '3 Weeks Ago', offset: -3 }
                    ].map(opt => (
                      <button
                        key={opt.offset}
                        type="button"
                        onClick={() => {
                          setWeekOffset(opt.offset);
                          setIsWeekDropdownOpen(false);
                        }}
                        style={{
                          textAlign: 'left',
                          padding: '6px 10px',
                          fontSize: 11,
                          fontWeight: weekOffset === opt.offset ? 700 : 500,
                          borderRadius: 5,
                          border: 'none',
                          background: weekOffset === opt.offset ? 'var(--bg-subtle, #F1F5F9)' : 'transparent',
                          color: 'var(--text-primary)',
                          cursor: 'pointer'
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bar Chart Container with Dotted Horizontal Grid Lines & Clean Baseline */}
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: 2, marginBottom: 4 }}>
              {/* Chart Plot Row: Y-Axis + Bars Area */}
              <div style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
                {/* Y Axis labels */}
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between', 
                  height: 85, 
                  fontSize: 10, 
                  fontWeight: 500,
                  color: 'var(--text-secondary)', 
                  width: 22,
                  textAlign: 'right',
                  userSelect: 'none',
                  transform: 'translateY(-1px)'
                }}>
                  <span style={{ lineHeight: 1 }}>12h</span>
                  <span style={{ lineHeight: 1 }}>9h</span>
                  <span style={{ lineHeight: 1 }}>6h</span>
                  <span style={{ lineHeight: 1 }}>3h</span>
                  <span style={{ lineHeight: 1 }}>0h</span>
                </div>

                {/* Plot Area with Dotted Grid Lines & 7 Bar Pillars */}
                <div style={{ 
                  flex: 1, 
                  position: 'relative', 
                  height: 85, 
                  display: 'flex', 
                  alignItems: 'flex-end',
                  borderBottom: '1px solid var(--border-color, #E5E7EB)'
                }}>
                  {/* Horizontal Dashed Guides matching 12h, 9h, 6h, 3h */}
                  <div style={{ position: 'absolute', left: 0, right: 0, top: 0, borderTop: '1px dashed var(--border-dim, #E5E7EB)', pointerEvents: 'none' }} />
                  <div style={{ position: 'absolute', left: 0, right: 0, top: '25%', borderTop: '1px dashed var(--border-dim, #E5E7EB)', pointerEvents: 'none' }} />
                  <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', borderTop: '1px dashed var(--border-dim, #E5E7EB)', pointerEvents: 'none' }} />
                  <div style={{ position: 'absolute', left: 0, right: 0, top: '75%', borderTop: '1px dashed var(--border-dim, #E5E7EB)', pointerEvents: 'none' }} />

                  {/* 7 Day Bar Columns */}
                  {weeklyAttendanceData.days.map((bar, bIdx) => {
                    const barPixelHeight = bar.isWorked ? Math.min(80, Math.max(10, Math.round((bar.h / 12) * 80))) : 0;
                    const isSelected = bar.dateKeyStr === selectedDateKey;

                    return (
                      <div 
                        key={bIdx} 
                        onClick={() => {
                          setSelectedDateKey(bar.dateKeyStr);
                          setSelectedDayNumber(parseInt(bar.num, 10));
                        }}
                        style={{ 
                          flex: 1, 
                          height: '100%', 
                          display: 'flex', 
                          justifyContent: 'center', 
                          alignItems: 'flex-end',
                          cursor: 'pointer',
                          zIndex: 1,
                          paddingBottom: 2
                        }}
                        title={`${bar.day} ${bar.num}: ${bar.h > 0 ? bar.h + 'h' : 'Off / Absent'}`}
                      >
                        {/* Pill Column Track */}
                        <div style={{
                          width: 20,
                          height: 80,
                          background: 'var(--bg-subtle, #F1F4F8)',
                          borderRadius: 6,
                          display: 'flex',
                          alignItems: 'flex-end',
                          overflow: 'hidden',
                          boxShadow: isSelected ? '0 0 0 2px #181B20' : 'none',
                          transition: 'all 0.15s ease'
                        }}>
                          {bar.isWorked && (
                            <div style={{
                              width: '100%',
                              height: barPixelHeight,
                              borderRadius: 6,
                              background: 'linear-gradient(180deg, #181B20 0%, #374151 100%)',
                              transition: 'height 0.3s ease',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.12)'
                            }} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* X-Axis Day & Date Labels (Cleanly positioned BELOW the baseline line) */}
              <div style={{ display: 'flex', gap: 10, marginTop: 5 }}>
                {/* Spacer matching Y-axis width */}
                <div style={{ width: 22 }} />

                {/* Day & Date Columns */}
                <div style={{ flex: 1, display: 'flex' }}>
                  {weeklyAttendanceData.days.map((bar, bIdx) => {
                    const isSelected = bar.dateKeyStr === selectedDateKey;
                    return (
                      <div 
                        key={bIdx}
                        onClick={() => {
                          setSelectedDateKey(bar.dateKeyStr);
                          setSelectedDayNumber(parseInt(bar.num, 10));
                        }}
                        style={{ 
                          flex: 1, 
                          textAlign: 'center', 
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 1
                        }}
                      >
                        <span style={{ fontSize: 9.5, fontWeight: 500, color: 'var(--text-secondary)' }}>
                          {bar.day}
                        </span>
                        <span style={{ 
                          fontSize: 10.5, 
                          fontWeight: isSelected ? 800 : 600, 
                          color: isSelected ? '#181B20' : 'var(--text-primary)',
                          borderRadius: 4,
                          padding: '0px 3px',
                          background: isSelected ? '#E2E8F0' : 'transparent'
                        }}>
                          {bar.num}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Theme-Consistent Metrics Strip */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            fontSize: 10.5, 
            paddingTop: 8, 
            borderTop: '1px solid var(--border-color, #E5E7EB)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Present:</span>
              <span style={{ fontWeight: 700, color: '#181B20' }}>{weeklyAttendanceData.presentCount} {weeklyAttendanceData.presentCount === 1 ? 'day' : 'days'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Half Day:</span>
              <span style={{ fontWeight: 700, color: '#475569' }}>{weeklyAttendanceData.halfDayCount} {weeklyAttendanceData.halfDayCount === 1 ? 'day' : 'days'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Absent:</span>
              <span style={{ fontWeight: 700, color: '#64748B' }}>{weeklyAttendanceData.absentCount} {weeklyAttendanceData.absentCount === 1 ? 'day' : 'days'}</span>
            </div>
          </div>
        </div>

        {/* Card 5: This Month (Donut Ring Chart & Category Breakdown) */}
        <div style={{
          background: 'var(--bg-surface, #FFFFFF)',
          border: '1px solid var(--border-color, #E5E7EB)',
          borderRadius: 14,
          padding: '12px 16px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 1px 3px rgba(16,24,40,0.04)',
          height: '100%'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div>
                <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>This Month</span>
              </div>
              <div style={{ position: 'relative' }}>
                <div 
                  onClick={() => setIsMonthDropdownOpen(prev => !prev)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    background: 'var(--bg-subtle, #F9FAFB)',
                    border: '1px solid var(--border-color, #E5E7EB)',
                    borderRadius: 6,
                    padding: '2px 8px',
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <span>{MONTH_NAMES[currentMonthIndex]} {currentYear}</span>
                  <ChevronDown size={12} color="var(--text-secondary)" style={{ transform: isMonthDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
                </div>

                {isMonthDropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: 4,
                    background: 'var(--bg-surface, #FFFFFF)',
                    border: '1px solid var(--border-color, #E2E8F0)',
                    borderRadius: 8,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    zIndex: 50,
                    minWidth: 140,
                    maxHeight: 200,
                    overflowY: 'auto',
                    padding: '4px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2
                  }}>
                    {MONTH_NAMES.map((mName, mIdx) => (
                      <button
                        key={mName}
                        type="button"
                        onClick={() => {
                          setCurrentMonthIndex(mIdx);
                          setIsMonthDropdownOpen(false);
                          loadAttendanceMonth(currentYear, mIdx);
                        }}
                        style={{
                          textAlign: 'left',
                          padding: '6px 10px',
                          fontSize: 11,
                          fontWeight: currentMonthIndex === mIdx ? 700 : 500,
                          borderRadius: 5,
                          border: 'none',
                          background: currentMonthIndex === mIdx ? 'var(--bg-subtle, #F1F5F9)' : 'transparent',
                          color: 'var(--text-primary)',
                          cursor: 'pointer'
                        }}
                      >
                        {mName} {currentYear}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '4px 0' }}>
              {/* Donut Ring Chart */}
              <div style={{ width: 96, height: 96, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg viewBox="0 0 100 100" width="100%" height="100%">
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#E5E7EB" strokeWidth="9" />
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="38" 
                    fill="none" 
                    stroke="#181B20" 
                    strokeWidth="9"
                    strokeDasharray="238.7"
                    strokeDashoffset={238.7 * (1 - monthStats.presentPercent / 100)}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                    style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                  />
                </svg>
                <div style={{ position: 'absolute', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{monthStats.presentPercent}%</div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2, fontWeight: 600 }}>Present</div>
                </div>
              </div>

              {/* Category Breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, paddingLeft: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--text-primary)', fontWeight: 600 }}>
                    <User size={13} color="#181B20" />
                    <span>Present</span>
                  </span>
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--text-primary)' }}>{monthStats.present}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--text-secondary)', fontWeight: 500 }}>
                    <Clock size={13} color="#475569" />
                    <span>Half Day</span>
                  </span>
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--text-primary)' }}>{monthStats.halfDay}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--text-secondary)', fontWeight: 500 }}>
                    <XCircle size={13} color="#64748B" />
                    <span>Absent</span>
                  </span>
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--text-primary)' }}>{monthStats.absent}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--text-secondary)', fontWeight: 500 }}>
                    <CalendarIcon size={13} color="#94A3B8" />
                    <span>On Leave</span>
                  </span>
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--text-primary)' }}>{monthStats.onLeave}</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ paddingTop: 8, borderTop: '1px solid var(--border-color, #E5E7EB)', fontSize: 10.5, color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
            <span>Working Days: <strong style={{ color: 'var(--text-primary)' }}>{monthStats.present + monthStats.halfDay}</strong></span>
            <span>Total Expected: <strong style={{ color: 'var(--text-primary)' }}>22 days</strong></span>
          </div>
        </div>

        {/* Card 6: Recent Attendance (Real Database Records with Internal Scrollbar) */}
        <div style={{
          background: 'var(--bg-surface, #FFFFFF)',
          border: '1px solid var(--border-color, #E5E7EB)',
          borderRadius: 14,
          padding: '12px 16px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 1px 3px rgba(16,24,40,0.04)',
          height: '100%',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexShrink: 0 }}>
            <div>
              <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>Recent Attendance</span>
            </div>
            <button 
              type="button"
              className="btn"
              onClick={() => setCurrentScreen('history')}
              style={{ 
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 11, 
                padding: '2px 8px', 
                fontWeight: 600, 
                background: 'var(--bg-subtle, #F9FAFB)', 
                color: 'var(--text-primary)', 
                border: '1px solid var(--border-color, #E5E7EB)',
                borderRadius: 6,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <span>View All</span>
              <ArrowRight size={12} color="var(--text-secondary)" />
            </button>
          </div>

          {/* Internal Scrollable Table Container */}
          <div style={{ 
            flex: 1, 
            minHeight: 0, 
            overflowY: 'auto',
            borderRadius: 6
          }}>
            <table className="tech-table" style={{ fontSize: 11, width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 2, background: 'var(--bg-surface, #FFFFFF)' }}>
                <tr style={{ borderBottom: '1px solid var(--border-color, #EAECF0)' }}>
                  <th style={{ padding: '6px 6px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: 10, fontWeight: 700, letterSpacing: '0.04em' }}>DATE</th>
                  <th style={{ padding: '6px 6px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: 10, fontWeight: 700, letterSpacing: '0.04em' }}>CHECK-IN</th>
                  <th style={{ padding: '6px 6px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: 10, fontWeight: 700, letterSpacing: '0.04em' }}>CHECK-OUT</th>
                  <th style={{ padding: '6px 6px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: 10, fontWeight: 700, letterSpacing: '0.04em' }}>WORK HOURS</th>
                  <th style={{ padding: '6px 6px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: 10, fontWeight: 700, letterSpacing: '0.04em' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {userRecords.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-secondary)' }}>
                      No punch records recorded for this period yet.
                    </td>
                  </tr>
                ) : (
                  userRecords.map(row => {
                    const isSelected = row.dateKey === selectedDateKey || row.dateDisplay === selectedDateKey;

                    return (
                      <tr 
                        key={row.id} 
                        onClick={() => {
                          setSelectedDateKey(row.dateDisplay || row.dateKey);
                          setSelectedDayNumber(row.dayNumber);
                        }}
                        style={{ 
                          cursor: 'pointer', 
                          borderBottom: '1px solid var(--border-dim, #F3F4F6)', 
                          transition: 'background 0.12s ease',
                          background: isSelected ? 'var(--bg-subtle, #F1F5F9)' : 'transparent'
                        }}
                        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-hover, #F8FAFC)'; }}
                        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                        title={`Click to view work hours for ${row.dateDisplay}`}
                      >
                        <td style={{ fontWeight: 700, padding: '6px 6px', color: isSelected ? '#181B20' : 'var(--text-primary)' }}>{row.dateDisplay}</td>
                        <td style={{ color: 'var(--text-secondary)', padding: '6px 6px' }}>{row.checkIn}</td>
                        <td style={{ color: 'var(--text-secondary)', padding: '6px 6px' }}>{row.checkOut}</td>
                        <td style={{ fontWeight: 600, padding: '6px 6px', color: 'var(--text-primary)' }}>{row.workHours}</td>
                        <td style={{ padding: '6px 6px' }}>
                          <span style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: 5, 
                            fontSize: 11, 
                            fontWeight: 600, 
                            padding: '1px 6px',
                            borderRadius: 5,
                            background: row.status === 'Present' ? '#F1F5F9' : '#F8FAFC',
                            border: '1px solid #E2E8F0',
                            color: row.status === 'Present' ? '#181B20' : '#475569'
                          }}>
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: getStatusDotColor(row.status) }} />
                            <span>{row.status}</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AttendanceView;
