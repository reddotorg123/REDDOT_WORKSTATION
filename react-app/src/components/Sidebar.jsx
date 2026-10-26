import React from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Users, 
  CalendarCheck, 
  MessageSquare, 
  FolderGit2, 
  Terminal as TerminalIcon,
  Settings 
} from 'lucide-react';

export function Sidebar({ 
  currentTab, 
  onSelectTab, 
  onOpenWorkspaceOs, 
  tasksCount = 0,
  unreadMessagesCount = 0,
  metrics
}) {
  const mainNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, badge: tasksCount },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { id: 'messages', label: 'Messages', icon: MessageSquare, badge: unreadMessagesCount },
    { id: 'files', label: 'Files & Cloud', icon: FolderGit2 },
    { id: 'terminal', label: 'Terminal', icon: TerminalIcon },
    { id: 'settings', label: 'Settings', icon: Settings }
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
    </aside>
  );
}

export default Sidebar;
