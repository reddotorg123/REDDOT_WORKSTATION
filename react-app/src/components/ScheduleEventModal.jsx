import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users, X, Trash2, CheckCircle2 } from 'lucide-react';

export function ScheduleEventModal({ 
  isOpen, 
  onClose, 
  onSaveEvent, 
  onDeleteEvent,
  initialEvent = null,
  teamMembers = [] 
}) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('Today');
  const [time, setTime] = useState('09:00 AM');
  const [location, setLocation] = useState('Online Meeting');
  const [type, setType] = useState('meeting');
  const [attendees, setAttendees] = useState('All Members');

  useEffect(() => {
    if (initialEvent) {
      setTitle(initialEvent.title || '');
      setDate(initialEvent.date || 'Today');
      setTime(initialEvent.time || '09:00 AM');
      setLocation(initialEvent.location || 'Online Meeting');
      setType(initialEvent.type || 'meeting');
      setAttendees(initialEvent.attendees || 'All Members');
    } else {
      setTitle('');
      setDate('Today');
      setTime('10:00 AM');
      setLocation('Online Meeting');
      setType('meeting');
      setAttendees('All Members');
    }
  }, [initialEvent, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const eventPayload = {
      id: initialEvent?.id || `evt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      title: title.trim(),
      date: date.trim() || 'Today',
      time: time.trim() || '09:00 AM',
      location: location.trim() || 'Online Meeting',
      type: type || 'meeting',
      attendees: attendees.trim() || 'All Members',
      completed: initialEvent ? !!initialEvent.completed : false,
      updatedAt: Date.now()
    };

    onSaveEvent(eventPayload);
    onClose();
  };

  const handleDelete = () => {
    if (initialEvent && onDeleteEvent) {
      onDeleteEvent(initialEvent.id);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-dialog" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: 480, borderRadius: 14, overflow: 'hidden' }}
      >
        {/* Header */}
        <div className="modal-header" style={{ padding: '16px 20px', background: 'var(--bg-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'var(--control-background, #22262B)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Calendar size={16} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                {initialEvent ? 'Edit Scheduled Event' : 'Schedule New Event'}
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: 11, color: 'var(--text-muted)' }}>
                Workstation Schedule & Team Calendar
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
            {/* Title */}
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                EVENT TITLE
              </label>
              <input 
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Architecture Sync, Client Review, Sprint Retrospective..."
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

            {/* Date & Time Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  SCHEDULE DATE
                </label>
                <input 
                  type="text"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  placeholder="e.g. Today, Tomorrow, Oct 29"
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
                  TIME (e.g. 09:00 AM)
                </label>
                <input 
                  type="text"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  placeholder="e.g. 09:00 AM, 02:30 PM"
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

            {/* Location & Type Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  LOCATION / VENUE
                </label>
                <select
                  value={location}
                  onChange={e => setLocation(e.target.value)}
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
                  <option value="Online Meeting">Online Meeting (Google Meet / Zoom)</option>
                  <option value="Main Office">Main Office</option>
                  <option value="Conference Room">Conference Room</option>
                  <option value="Workstation">Workstation</option>
                  <option value="Executive Lab">Executive Lab</option>
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  EVENT TYPE
                </label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value)}
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
                  <option value="meeting">Team Meeting</option>
                  <option value="review">Project Review</option>
                  <option value="discussion">Client Discussion</option>
                  <option value="wrapup">Wrap Up / Retrospective</option>
                  <option value="presentation">Architecture Presentation</option>
                </select>
              </div>
            </div>

            {/* Attendees */}
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                PARTICIPANTS / ATTENDEES
              </label>
              <select
                value={attendees}
                onChange={e => setAttendees(e.target.value)}
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
                <option value="All Members">All Members (Entire Team)</option>
                <option value="Engineering">Engineering Department</option>
                <option value="Design">Design & Architecture</option>
                <option value="Management">Management (Founder & CEO)</option>
                {teamMembers.map(m => (
                  <option key={m.id || m.uid} value={m.name}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="modal-footer" style={{ 
            padding: '14px 20px', 
            background: 'var(--bg-subtle)', 
            display: 'flex', 
            justifyContent: initialEvent ? 'space-between' : 'flex-end',
            alignItems: 'center'
          }}>
            {initialEvent && (
              <button 
                type="button" 
                className="btn" 
                onClick={handleDelete}
                style={{
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                <Trash2 size={13} />
                <span>Delete</span>
              </button>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={onClose}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                style={{
                  background: 'var(--control-background, #22262B)',
                  borderColor: 'var(--border-strong, #374151)',
                  color: '#FFFFFF'
                }}
              >
                {initialEvent ? 'Save Changes' : 'Schedule Event'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ScheduleEventModal;
