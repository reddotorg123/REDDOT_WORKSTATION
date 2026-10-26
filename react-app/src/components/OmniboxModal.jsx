import React, { useState, useEffect } from 'react';
import { 
  Search, 
  LayoutDashboard, 
  CheckSquare, 
  Users, 
  CalendarCheck, 
  MessageSquare, 
  FolderGit2, 
  Settings, 
  Monitor, 
  Terminal, 
  X 
} from 'lucide-react';

export function OmniboxModal({ 
  isOpen, 
  onClose, 
  onNavigateTab, 
  tasks = [], 
  files = [], 
  teamMembers = [] 
}) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickNav = [
    { id: 'dashboard', label: 'Go to Dashboard', icon: LayoutDashboard },
    { id: 'tasks', label: 'Go to Tasks', icon: CheckSquare },
    { id: 'team', label: 'Go to Team Directory', icon: Users },
    { id: 'attendance', label: 'Go to Attendance', icon: CalendarCheck },
    { id: 'messages', label: 'Go to Messages', icon: MessageSquare },
    { id: 'files', label: 'Go to Files & Cloud', icon: FolderGit2 },
    { id: 'settings', label: 'Go to Settings', icon: Settings }
  ];

  const filteredNav = quickNav.filter(n => n.label.toLowerCase().includes(query.toLowerCase()));
  const filteredTasks = tasks.filter(t => t.title.toLowerCase().includes(query.toLowerCase())).slice(0, 4);
  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(query.toLowerCase())).slice(0, 4);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-dialog" 
        onClick={e => e.stopPropagation()}
        style={{ width: 560, maxHeight: 460, overflow: 'hidden' }}
      >
        <div style={{
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-surface)'
        }}>
          <Search size={16} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Type a command, search tasks, files, members..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              color: 'var(--text-primary)'
            }}
            autoFocus
          />
          <button className="win-btn" onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        <div style={{ padding: '10px 14px', overflowY: 'auto', maxHeight: 380, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Navigation Section */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.8, color: 'var(--text-muted)', marginBottom: 6 }}>
              QUICK NAVIGATION
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {filteredNav.map(item => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      onNavigateTab(item.id);
                      onClose();
                    }}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      cursor: 'pointer',
                      fontSize: 12,
                      transition: 'background 0.12s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Icon size={14} color="var(--text-secondary)" />
                    <span style={{ fontWeight: 600 }}>{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tasks match */}
          {filteredTasks.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.8, color: 'var(--text-muted)', marginBottom: 6 }}>
                TASKS
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {filteredTasks.map(t => (
                  <div
                    key={t.id}
                    onClick={() => {
                      onNavigateTab('tasks');
                      onClose();
                    }}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      fontSize: 12
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CheckSquare size={13} color="var(--text-secondary)" />
                      <span>{t.title}</span>
                    </div>
                    <span className="badge">{t.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Files match */}
          {filteredFiles.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.8, color: 'var(--text-muted)', marginBottom: 6 }}>
                FILES
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {filteredFiles.map(f => (
                  <div
                    key={f.id}
                    onClick={() => {
                      onNavigateTab('files');
                      onClose();
                    }}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      fontSize: 12
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span>{f.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{f.size}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
