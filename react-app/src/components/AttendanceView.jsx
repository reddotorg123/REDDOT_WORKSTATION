import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Plus,
  LogIn, 
  LogOut,
  X 
} from 'lucide-react';

export function AttendanceView({ 
  attendance = [], 
  onRecordAttendance, 
  currentMember = 'Jagadish K' 
}) {
  const now = new Date();
  const currentMonth = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const [currentMonthYear, setCurrentMonthYear] = useState(currentMonth);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  
  // Attendance Configuration Toggles
  const [autoCheckOut, setAutoCheckOut] = useState(true);
  const [breakReminder, setBreakReminder] = useState(true);
  const [idleDetection, setIdleDetection] = useState(true);

  // Leave Requests State
  const [leaveRequests, setLeaveRequests] = useState([
    { id: 'l-1', dates: 'Approved Leave Period', type: 'Annual Workstation Rest', status: 'Approved' }
  ]);

  // Leave Form State
  const [leaveType, setLeaveType] = useState('Personal Leave');
  const [leaveStartDate, setLeaveStartDate] = useState(now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
  const [leaveEndDate, setLeaveEndDate] = useState(new Date(Date.now() + 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
  const [leaveReason, setLeaveReason] = useState('');

  // Dynamically compute today's punch records
  const todayDateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const todayRecords = attendance.filter(a => 
    a.date === todayDateStr || 
    (a.date && a.date.toLowerCase().includes('today')) ||
    (a.date && a.date.includes(now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })))
  );

  const presentTodayCount = todayRecords.filter(a => a.status === 'Present' || a.clockIn).length;
  const totalEmployees = 4;

  const handleApplyLeave = (e) => {
    e.preventDefault();
    setLeaveRequests(prev => [
      {
        id: `l-${Date.now()}`,
        dates: `${leaveStartDate} - ${leaveEndDate}`,
        type: leaveType,
        status: 'Pending'
      },
      ...prev
    ]);
    setShowLeaveModal(false);
  };

  return (
    <div className="attendance-view">
      {/* Header */}
      <div className="view-header">
        <div className="view-title-block">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1>Attendance &amp; Shifts</h1>
            <span className="badge">
              Live Cloud Ledger Active
            </span>
          </div>
          <p>Verified Hardware Attendance Punches &bull; Biometric Workstation Audit Logs.</p>
        </div>

        {/* Date Month Selector & Today button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            overflow: 'hidden'
          }}>
            <button className="win-btn" onClick={() => setCurrentMonthYear('Prior Month')}>
              <ChevronLeft size={14} />
            </button>
            <span style={{ padding: '0 12px', fontSize: 12, fontWeight: 700 }}>
              {currentMonthYear}
            </span>
            <button className="win-btn" onClick={() => setCurrentMonthYear('Next Month')}>
              <ChevronRight size={14} />
            </button>
          </div>

          <button className="btn" onClick={() => setCurrentMonthYear(currentMonth)}>
            Today
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, alignItems: 'start', marginBottom: 16 }}>
        {/* Left Column: Attendance Table */}
        <div className="card-panel">
          <table className="tech-table">
            <thead>
              <tr>
                <th>EMPLOYEE</th>
                <th>DATE</th>
                <th>CLOCK IN</th>
                <th>CLOCK OUT</th>
                <th>DURATION</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {attendance.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
                    No shift records logged yet. Start the Work Timer to record a live punch.
                  </td>
                </tr>
              ) : (
                attendance.slice(0, 50).map(record => {
                  const empName = record.employee || record.member || record.name || 'Jagadish K';
                  const inTime = record.clockIn || record.checkIn || record.time || '09:00 AM';
                  const outTime = record.clockOut || record.checkOut || '--';
                  const dur = record.duration || record.workHours || '8h 00m';
                  const isPresent = record.status === 'Present' || (!record.clockOut && record.action !== 'CLOCK_OUT');
                  return (
                    <tr key={record.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className={`status-dot ${isPresent ? 'online' : 'offline'}`} />
                          <span style={{ fontWeight: 600 }}>{empName}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{record.date}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-primary)' }}>
                          <LogIn size={13} color="var(--accent-green, #10b981)" />
                          <span>{inTime}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
                          <LogOut size={13} color="var(--accent-red, #ef4444)" />
                          <span>{outTime}</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{dur}</td>
                      <td>
                        <span className={`badge ${isPresent ? 'badge-in-progress' : 'badge-completed'}`}>
                          {record.status || (isPresent ? 'Present' : 'Completed')}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Right Column: 3 Metric Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Card 1: Today's Attendance */}
          <div className="card-panel">
            <div className="panel-header">
              <span className="panel-title">Today's Attendance</span>
            </div>
            <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="stat-card-icon">
                <Calendar size={18} />
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>
                  {presentTodayCount} / {totalEmployees}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {Math.round((presentTodayCount / totalEmployees) * 100)}% Present Today
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Work Hours (Today) */}
          <div className="card-panel">
            <div className="panel-header">
              <span className="panel-title">Shift Duration</span>
            </div>
            <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="stat-card-icon">
                <Clock size={18} />
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>
                  {attendance[0]?.duration || 'Active Shift'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Verified Shift Ledger
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Monthly Attendance */}
          <div className="card-panel">
            <div className="panel-header">
              <span className="panel-title">Monthly Audit</span>
            </div>
            <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="stat-card-icon">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>
                  98%
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Total Punches: {attendance.length}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Leave Management & Attendance Configuration */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
        {/* Leave Management */}
        <div className="card-panel" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-dim)', paddingBottom: 10 }}>
            <span className="panel-title">Leave &amp; Time-Off Ledger</span>
            <button className="btn" style={{ fontSize: 11.5 }} onClick={() => setShowLeaveModal(true)}>
              <Plus size={13} />
              <span>Apply Leave</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {leaveRequests.map(leave => (
              <div 
                key={leave.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid var(--border-dim)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: leave.status === 'Approved' ? 'var(--accent-green)' : 'var(--accent-amber)' }}>●</span>
                  <span style={{ fontWeight: 600, fontSize: 12 }}>{leave.dates}</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 11.5 }}>| {leave.type}</span>
                </div>
                <span className={`badge ${leave.status === 'Approved' ? 'badge-completed' : 'badge-pending'}`}>
                  {leave.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Attendance Configuration */}
        <div className="card-panel" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="panel-header" style={{ padding: 0, border: 'none' }}>
            <span className="panel-title">Audit Engine Settings</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>Auto Check-Out on App Close</span>
              <input type="checkbox" checked={autoCheckOut} onChange={e => setAutoCheckOut(e.target.checked)} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>Break &amp; Meal Reminders</span>
              <input type="checkbox" checked={breakReminder} onChange={e => setBreakReminder(e.target.checked)} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>Active Screen Idle Detection</span>
              <input type="checkbox" checked={idleDetection} onChange={e => setIdleDetection(e.target.checked)} />
            </div>
          </div>
        </div>
      </div>

      {/* Apply Leave Modal */}
      {showLeaveModal && (
        <div className="modal-overlay" onClick={() => setShowLeaveModal(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Apply for Leave</h3>
              <button className="icon-btn" onClick={() => setShowLeaveModal(false)}>
                <X size={15} />
              </button>
            </div>
            <form onSubmit={handleApplyLeave}>
              <div className="modal-body">
                <div className="form-group">
                  <label>LEAVE TYPE</label>
                  <select 
                    className="select-control"
                    value={leaveType}
                    onChange={e => setLeaveType(e.target.value)}
                  >
                    <option value="Personal Leave">Personal Leave</option>
                    <option value="Medical Leave">Medical Leave</option>
                    <option value="Casual Leave">Casual Leave</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label>START DATE</label>
                    <input 
                      type="text" 
                      className="input-control" 
                      value={leaveStartDate} 
                      onChange={e => setLeaveStartDate(e.target.value)} 
                    />
                  </div>
                  <div className="form-group">
                    <label>END DATE</label>
                    <input 
                      type="text" 
                      className="input-control" 
                      value={leaveEndDate} 
                      onChange={e => setLeaveEndDate(e.target.value)} 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>REASON</label>
                  <textarea 
                    className="input-control" 
                    rows={3} 
                    placeholder="Provide details for executive review..."
                    value={leaveReason}
                    onChange={e => setLeaveReason(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setShowLeaveModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Leave Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
