import React, { useState } from 'react';
import { Calendar, X, Clock, AlertCircle, CheckCircle2, User, Phone, FileText } from 'lucide-react';
import { electronBridge } from '../services/electronBridge';
import { databaseBridge } from '../services/databaseBridge';
import { firebaseBridge } from '../services/firebaseBridge';

export function ApplyLeaveModal({
  isOpen,
  onClose,
  currentUser = 'Jagadish K',
  teamMembers = [],
  onLeaveApplied,
  onApplyLeaveSuccess,
  userProfile
}) {
  const todayStr = new Date().toISOString().split('T')[0];
  const [leaveType, setLeaveType] = useState('Casual Leave');
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [duration, setDuration] = useState('Full Day'); // 'Full Day' | 'Half Day (First Half)' | 'Half Day (Second Half)'
  const [reason, setReason] = useState('');
  const [handoverTo, setHandoverTo] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  // Calculate day count
  const calculateDays = () => {
    if (duration !== 'Full Day') return 0.5;
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays > 0 ? diffDays : 1;
    } catch {
      return 1;
    }
  };

  const totalDays = calculateDays();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!reason.trim()) {
      setErrorMsg('Please state a valid reason for applying leave.');
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setErrorMsg('End Date cannot be earlier than Start Date.');
      return;
    }

    setIsSubmitting(true);

    try {
      const now = Date.now();
      const isWFH = leaveType === 'Work From Home';
      const newLeaveRecord = {
        id: `leave_${now}_${Math.random().toString(36).substring(2, 6)}`,
        applicant: currentUser,
        employee: currentUser,
        name: currentUser,
        member: currentUser,
        leaveType,
        isWFH,
        startDate,
        endDate,
        dates: `${startDate} to ${endDate}`,
        duration,
        days: totalDays,
        reason: reason.trim(),
        handoverTo: handoverTo || 'Engineering Team',
        emergencyPhone: emergencyPhone || '+91 98401 23456',
        status: 'APPROVED',
        appliedAt: new Date().toLocaleString(),
        timestamp: now
      };

      // Also record punch log so it shows up in real Attendance histories
      const attendanceEntry = {
        id: `att_${now}`,
        date: new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        member: currentUser,
        employee: currentUser,
        clockIn: '--:--',
        clockOut: '--:--',
        hours: `${totalDays * 8}h 00m`,
        status: isWFH ? 'Work From Home' : 'On Leave',
        leaveType,
        isWFH,
        reason: reason.trim(),
        action: isWFH ? 'WFH_REQUEST' : 'LEAVE',
        timestamp: now
      };

      // Persist to local vault database
      await databaseBridge.saveLeaveRequest(newLeaveRecord);
      await databaseBridge.appendPunchLog(attendanceEntry);
      
      // Persist to Cloud Firestore
      try {
        await firebaseBridge.recordPunch(isWFH ? 'WFH_REQUEST' : 'LEAVE', {
          ...attendanceEntry,
          leaveRecord: newLeaveRecord
        });
      } catch (_) {}

      // Trigger native notification
      electronBridge.showNotification(
        isWFH ? 'Work From Home Approved' : 'Leave Application Approved',
        `Your ${totalDays} day(s) ${leaveType} (${startDate} to ${endDate}) is logged into the workstation database.`
      );

      if (typeof onLeaveApplied === 'function') {
        onLeaveApplied(attendanceEntry, newLeaveRecord);
      }
      if (typeof onApplyLeaveSuccess === 'function') {
        onApplyLeaveSuccess(attendanceEntry, newLeaveRecord);
      }

      setSuccessMsg(`Leave applied successfully! Status: Approved (${totalDays} day(s))`);
      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 900);
    } catch (err) {
      console.error('Error applying leave:', err);
      setErrorMsg('Failed to persist leave request: ' + err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-dialog" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: 520, borderRadius: 14, overflow: 'hidden' }}
      >
        {/* Header */}
        <div className="modal-header" style={{ padding: '16px 20px', background: 'var(--bg-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: 'var(--control-background, #22262B)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Calendar size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                Apply For Leave
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: 11, color: 'var(--text-muted)' }}>
                Applicant: <strong>{currentUser}</strong> &bull; Workstation Leave Management
              </p>
            </div>
          </div>
          <button 
            type="button" 
            className="win-btn win-close" 
            onClick={onClose} 
            title="Close"
            style={{ width: 28, height: 28 }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {errorMsg && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 12px',
                borderRadius: 8,
                background: 'var(--bg-active-nav)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                fontSize: 12
              }}>
                <AlertCircle size={15} />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 12px',
                borderRadius: 8,
                background: 'rgba(34, 197, 94, 0.12)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                color: '#16A34A',
                fontSize: 12,
                fontWeight: 600
              }}>
                <CheckCircle2 size={15} />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Leave Type and Session */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  LEAVE TYPE
                </label>
                <select 
                  value={leaveType} 
                  onChange={e => setLeaveType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontSize: 12,
                    fontWeight: 600
                  }}
                >
                  <option value="Casual Leave">Casual Leave (CL)</option>
                  <option value="Sick Leave">Sick Leave (SL)</option>
                  <option value="Paid Leave">Paid Leave (PL / PTO)</option>
                  <option value="Compensatory Off">Compensatory Off (Comp Off)</option>
                  <option value="Work From Home">Work From Home (WFH)</option>
                  <option value="Emergency Leave">Emergency Leave</option>
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  DURATION TYPE
                </label>
                <select 
                  value={duration} 
                  onChange={e => setDuration(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontSize: 12,
                    fontWeight: 600
                  }}
                >
                  <option value="Full Day">Full Day</option>
                  <option value="Half Day (First Half)">Half Day (First Half - Morning)</option>
                  <option value="Half Day (Second Half)">Half Day (Second Half - Afternoon)</option>
                </select>
              </div>
            </div>

            {/* Dates: Start & End */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  START DATE
                </label>
                <input 
                  type="date"
                  value={startDate}
                  onChange={e => {
                    setStartDate(e.target.value);
                    if (new Date(e.target.value) > new Date(endDate)) {
                      setEndDate(e.target.value);
                    }
                  }}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontSize: 12
                  }}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  END DATE
                </label>
                <input 
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={e => setEndDate(e.target.value)}
                  disabled={duration !== 'Full Day'}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: '1px solid var(--border-color)',
                    background: duration !== 'Full Day' ? 'var(--bg-subtle)' : 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontSize: 12
                  }}
                />
              </div>
            </div>

            {/* Days Summary Pill */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              borderRadius: 8,
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-dim)'
            }}>
              <span style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                Calculated Leave Days:
              </span>
              <span style={{
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--text-primary)',
                background: 'var(--bg-active-nav)',
                border: '1px solid var(--border-color)',
                padding: '2px 8px',
                borderRadius: 4
              }}>
                {totalDays} {totalDays === 1 ? 'Day' : 'Days'}
              </span>
            </div>

            {/* Reason */}
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                REASON FOR LEAVE <span style={{ color: 'var(--text-muted)' }}>*</span>
              </label>
              <textarea 
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="State the purpose (e.g. Personal emergency, Medical consultation, Family event)..."
                rows={3}
                required
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontSize: 12,
                  resize: 'none',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Handover & Contact */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  HANDOVER COLLEAGUE
                </label>
                <select
                  value={handoverTo}
                  onChange={e => setHandoverTo(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontSize: 12
                  }}
                >
                  <option value="">Select teammate (optional)</option>
                  {teamMembers.filter(m => m.name !== currentUser).map(m => (
                    <option key={m.id || m.uid} value={m.name}>
                      {m.name} ({m.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  EMERGENCY PHONE
                </label>
                <input 
                  type="tel"
                  value={emergencyPhone}
                  onChange={e => setEmergencyPhone(e.target.value)}
                  placeholder="e.g. +91 98401 23456"
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontSize: 12
                  }}
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="modal-footer" style={{ padding: '14px 20px', background: 'var(--bg-subtle)' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{
                background: 'var(--control-background, #22262B)',
                borderColor: 'var(--border-strong, #374151)',
                color: '#FFFFFF'
              }}
            >
              {isSubmitting ? 'Recording Leave...' : 'Submit Leave Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ApplyLeaveModal;
