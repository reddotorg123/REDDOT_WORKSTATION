import React, { useState } from 'react';
import { Search, Bell, Minus, Square, X, Sun, Moon } from 'lucide-react';
import { electronBridge } from '../services/electronBridge';

export const Topbar = React.memo(function Topbar({
  activeTheme,
  onToggleTheme,
  onOpenOmnibox,
  onOpenSettings,
  userProfile,
  onLogout,
  notifications = [],
  _isPinned = false,
  _onTogglePin
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="topbar">
      {/* Left: Brand */}
      <div style={{ display: 'flex', alignItems: 'center' }} className="topbar-no-drag">

        {/* Brand */}
        <div className="topbar-brand" onClick={() => window.location.reload()}>
          <div className="brand-icon-box" style={{ background: 'transparent', padding: 0, overflow: 'hidden' }}>
            <img src="./assets/icon.png" alt="R" style={{ width: 22, height: 22, borderRadius: 5, objectFit: 'cover' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span className="brand-title">REDDOT WORKSTATION</span>
            <span className="brand-version">v3.0</span>
          </div>
        </div>
      </div>

      {/* Omnibox Global Search */}
      <div 
        className="search-omnibox topbar-no-drag"
        onClick={onOpenOmnibox}
        style={{ cursor: 'pointer' }}
      >
        <Search size={14} color="var(--text-muted)" />
        <input 
          type="text" 
          placeholder="Search tasks, files, members, or commands..." 
          readOnly 
        />
        <span className="search-kbd">Ctrl + K</span>
      </div>

      {/* Right Controls */}
      <div className="topbar-actions topbar-no-drag">
        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button 
            className="icon-btn" 
            title="Notifications"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: 5,
                right: 5,
                width: 7,
                height: 7,
                backgroundColor: 'var(--text-primary)',
                borderRadius: '50%'
              }} />
            )}
          </button>

          {showNotifications && (
            <div style={{
              position: 'absolute',
              top: 38,
              right: 0,
              width: 320,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-modal)',
              zIndex: 100,
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '10px 14px',
                borderBottom: '1px solid var(--border-dim)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'var(--bg-subtle)'
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>NOTIFICATIONS</span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{unreadCount} unread</span>
              </div>
              <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 11 }}>
                    No recent notifications
                  </div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} style={{
                      padding: '10px 14px',
                      borderBottom: '1px solid var(--border-dim)',
                      display: 'flex',
                      gap: 10,
                      alignItems: 'flex-start',
                      background: n.read ? 'transparent' : 'var(--bg-hover)'
                    }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: n.read ? 'transparent' : 'var(--accent-blue)', marginTop: 5 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11.5, fontWeight: 600 }}>{n.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{n.body}</div>
                        <div style={{ fontSize: 9.5, color: 'var(--text-faint)', marginTop: 4 }}>{n.time}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle (Sun / Moon) matching Reference */}
        {onToggleTheme && (
          <button 
            className="icon-btn" 
            title={activeTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            onClick={onToggleTheme}
          >
            {activeTheme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        )}

        {/* User Profile Badge & Dropdown */}
        <div style={{ position: 'relative' }}>
          <div 
            className="user-profile-badge" 
            onClick={() => setShowProfileMenu(!showProfileMenu)} 
            title="User Profile & Account"
            style={{ cursor: 'pointer' }}
          >
            <div className="user-avatar-circle">
              {userProfile?.avatar ? (
                <img src={userProfile.avatar} alt={userProfile.name} />
              ) : (
                <span>{(userProfile?.name || 'JK').split(' ').map(p => p[0]).join('').slice(0, 2)}</span>
              )}
            </div>
            <div className="user-info-text">
              <span className="user-name-title">{userProfile?.name || 'Jagadish K'}</span>
              <span className="user-role-title">{userProfile?.role || 'Founder'}</span>
            </div>
          </div>

          {showProfileMenu && (
            <div 
              style={{
                position: 'absolute',
                top: 42,
                right: 0,
                width: 240,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md, 8px)',
                boxShadow: 'var(--shadow-modal, 0 10px 30px rgba(0,0,0,0.25))',
                zIndex: 120,
                padding: '10px 0',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div style={{ padding: '6px 14px 10px', borderBottom: '1px solid var(--border-dim)' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {userProfile?.name || 'Jagadish K'}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {userProfile?.email || 'jagadish2k2006@gmail.com'}
                </div>
                <div style={{ marginTop: 4, display: 'inline-block', fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-primary)', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', padding: '2px 7px', borderRadius: 4 }}>
                  ● Active Session
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu(false);
                  if (onOpenSettings) onOpenSettings();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '9px 14px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                Settings & Preferences
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu(false);
                  if (onLogout) onLogout();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '9px 14px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  borderTop: '1px solid var(--border-dim)'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                Switch Account / Sign Out
              </button>
            </div>
          )}
        </div>

        {/* Native Window Controls */}
        <div className="window-controls">
          <button 
            className="win-btn" 
            title="Minimize" 
            onClick={() => electronBridge.minimize()}
          >
            <Minus size={13} />
          </button>
          <button 
            className="win-btn" 
            title="Maximize / Restore" 
            onClick={() => electronBridge.maximize()}
          >
            <Square size={11} />
          </button>
          <button 
            className="win-btn win-close" 
            title="Close" 
            onClick={() => electronBridge.close()}
          >
            <X size={13} />
          </button>
        </div>
      </div>
    </header>
  );
});

export default Topbar;
