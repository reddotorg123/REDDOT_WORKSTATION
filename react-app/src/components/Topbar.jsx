import React, { useState } from 'react';
import { Search, Bell, Minus, Square, X, Check, XCircle, Pin } from 'lucide-react';
import { electronBridge } from '../services/electronBridge';

export function Topbar({
  activeTheme,
  onOpenOmnibox,
  onOpenSettings,
  userProfile,
  notifications = [],
  isPinned = false,
  onTogglePin
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="topbar">
      {/* Brand */}
      <div className="topbar-brand topbar-no-drag" onClick={() => window.location.reload()}>
        <div className="brand-icon-box">
          <div className="brand-circle"></div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline' }}>
          <span className="brand-title">REDDOT WORKSTATION</span>
          <span className="brand-version">v3.0</span>
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
          placeholder="Search tasks, files, members..." 
          readOnly 
        />
        <span className="search-kbd">Ctrl+K</span>
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
                backgroundColor: 'var(--accent-red)',
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

        {/* User Profile Badge */}
        <div className="user-profile-badge" onClick={onOpenSettings} title="User Profile & Settings">
          <div className="user-avatar-circle">
            {userProfile?.avatar ? (
              <img src={userProfile.avatar} alt={userProfile.name} />
            ) : (
              <span>JK</span>
            )}
          </div>
          <div className="user-info-text">
            <span className="user-name-title">{userProfile?.name || 'JAGADISH K'}</span>
            <span className="user-role-title">{userProfile?.role || 'FOUNDER'}</span>
          </div>
        </div>

        {/* Native Windows Controls */}
        <div className="window-controls">
          <button 
            className="win-btn" 
            title={isPinned ? "Switch to Interactive Window Mode" : "Pin as Live Windows Desktop Background"} 
            onClick={onTogglePin}
            style={{ color: isPinned ? 'var(--accent-red)' : 'var(--text-secondary)' }}
          >
            <Pin size={11} style={{ transform: isPinned ? 'rotate(45deg)' : 'none' }} />
          </button>
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
}
