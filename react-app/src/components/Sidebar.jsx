import React from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Users, 
  Clock, 
  MessageSquare, 
  FolderGit2, 
  Terminal as TerminalIcon,
  Settings 
} from 'lucide-react';

export const Sidebar = React.memo(function Sidebar({ 
  currentTab, 
  onSelectTab, 
  tasksCount = 0,
  unreadMessagesCount = 0
}) {
  const mainNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks', label: 'Tasks & Projects', icon: CheckSquare, badge: tasksCount },
    { id: 'team', label: 'Team & Directory', icon: Users },
    { id: 'attendance', label: 'Time & Shifts', icon: Clock },
    { id: 'messages', label: 'Team Chat', icon: MessageSquare, badge: unreadMessagesCount },
    { id: 'files', label: 'Files & Cloud', icon: FolderGit2 },
    { id: 'terminal', label: 'Terminal', icon: TerminalIcon },
    { id: 'settings', label: 'System & Settings', icon: Settings }
  ];

  return (
    <aside className="sidebar">
      <div>
        <div className="sidebar-section-title" style={{ padding: '0 10px 8px 10px', fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
          WORKSPACE
        </div>

        <div className="sidebar-nav-group">
          {mainNav.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <div
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => onSelectTab(item.id)}
              >
                <span className="nav-item-icon">
                  <Icon size={15} />
                </span>
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="nav-badge">{item.badge}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Motivational Quote / Habit Card matching target UI */}
      <div style={{
        marginTop: 'auto',
        margin: '12px 2px 2px 2px',
        padding: '12px 10px 10px 12px',
        minHeight: 76,
        background: 'var(--bg-surface, #FFFFFF)',
        borderRadius: 14,
        border: '1px solid var(--border-color, #E5E7EB)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <p style={{
          fontSize: 10,
          fontWeight: 700,
          color: 'var(--text-primary, #111827)',
          lineHeight: 1.35,
          margin: '0 0 10px 0',
          maxWidth: '52%',
          letterSpacing: '-0.1px'
        }}>
          Discipline today builds a better tomorrow.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', width: 52, height: 3.5, background: '#E5E7EB', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: 24, height: '100%', background: '#181B20', borderRadius: 2 }} />
        </div>
        <img 
          src="./assets/sidebar-character.png" 
          alt="Motivation" 
          style={{
            position: 'absolute',
            right: -2,
            bottom: -2,
            width: 82,
            height: 82,
            objectFit: 'contain',
            pointerEvents: 'none'
          }} 
        />
      </div>
    </aside>
  );
});

export default Sidebar;

