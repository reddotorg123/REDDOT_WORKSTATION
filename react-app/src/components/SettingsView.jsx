import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Layers, 
  Bell, 
  Palette, 
  Shield, 
  Cpu, 
  User, 
  Info, 
  Save, 
  Download, 
  RotateCcw, 
  Check 
} from 'lucide-react';
import { electronBridge } from '../services/electronBridge';

export function SettingsView({ 
  theme, 
  onToggleTheme, 
  userProfile, 
  onUpdateUserProfile,
  onSelectPhoto,
  metrics
}) {
  const [activeTab, setActiveTab] = useState('general');
  const [workspaceName, setWorkspaceName] = useState('REDDOT WORKSTATION');
  const [workspaceDesc, setWorkspaceDesc] = useState('All-in-one workspace for REDDOT project.');
  const [timeZone, setTimeZone] = useState('(UTC+05:30) Asia/Kolkata');
  const [language, setLanguage] = useState('English');
  const [autoSave, setAutoSave] = useState(true);
  const [startOnLogin, setStartOnLogin] = useState(false);

  // Sync auto-start with native Electron login item settings
  useEffect(() => {
    electronBridge.getAutoStart().then(enabled => {
      setStartOnLogin(!!enabled);
    }).catch(() => {});
  }, []);

  const handleToggleAutoStart = async (e) => {
    const val = e.target.checked;
    setStartOnLogin(val);
    await electronBridge.setAutoStart(val);
  };

  // Notifications State
  const [notifTaskUpdates, setNotifTaskUpdates] = useState(true);
  const [notifTeamMessages, setNotifTeamMessages] = useState(true);
  const [notifAttendanceAlerts, setNotifAttendanceAlerts] = useState(true);
  const [notifSystemAlerts, setNotifSystemAlerts] = useState(true);
  const [notifEmailAlerts, setNotifEmailAlerts] = useState(false);

  // Appearance State
  const [fontFamily, setFontFamily] = useState('Roboto Mono');
  const [fontSize, setFontSize] = useState('Medium');
  const [compactMode, setCompactMode] = useState(false);

  // Privacy State
  const [profileVisibility, setProfileVisibility] = useState('Team Only');
  const [activityStatus, setActivityStatus] = useState('Visible');
  const [shareOnlineStatus, setShareOnlineStatus] = useState(true);
  const [dataCollection, setDataCollection] = useState(false);

  // Integrations State
  const [cloudSync, setCloudSync] = useState(true);
  const [gitIntegration, setGitIntegration] = useState(true);
  const [fileVersioning, setFileVersioning] = useState(true);
  const [autoBackup, setAutoBackup] = useState(true);

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveSettings = (e) => {
    e?.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const navTabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'workspace', label: 'Workspace', icon: Layers },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'integrations', label: 'Integrations', icon: Cpu },
    { id: 'account', label: 'Account', icon: User },
    { id: 'about', label: 'About', icon: Info }
  ];

  return (
    <div className="settings-view">
      {/* Header */}
      <div className="view-header">
        <div className="view-title-block">
          <h1>Settings</h1>
          <p>Configure your workspace preferences.</p>
        </div>

        {savedSuccess && (
          <span className="badge badge-completed" style={{ padding: '6px 14px', fontSize: 11.5 }}>
            ✓ Changes Saved Successfully
          </span>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '180px 1fr 280px',
        gap: 16,
        alignItems: 'start'
      }}>
        {/* Left Sub-Sidebar */}
        <div className="card-panel" style={{ padding: '8px 6px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <div
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: isActive ? 700 : 500,
                  background: isActive ? 'var(--bg-active-nav)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  transition: 'background 0.12s'
                }}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </div>
            );
          })}
        </div>

        {/* Center Panel: Tab Content */}
        <div className="card-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          {/* GENERAL TAB */}
          {activeTab === 'general' && (
            <div>
              <div className="panel-header">
                <span className="panel-title">General Settings</span>
              </div>
              <form onSubmit={handleSaveSettings} style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label>Workspace Name</label>
                  <input 
                    type="text" 
                    className="input-control" 
                    value={workspaceName} 
                    onChange={e => setWorkspaceName(e.target.value)} 
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <input 
                    type="text" 
                    className="input-control" 
                    value={workspaceDesc} 
                    onChange={e => setWorkspaceDesc(e.target.value)} 
                  />
                </div>

                <div className="form-group">
                  <label>Time Zone</label>
                  <select 
                    className="select-control" 
                    value={timeZone} 
                    onChange={e => setTimeZone(e.target.value)}
                  >
                    <option value="(UTC+05:30) Asia/Kolkata">(UTC+05:30) Asia/Kolkata</option>
                    <option value="(UTC+00:00) UTC / London">(UTC+00:00) UTC / London</option>
                    <option value="(UTC-05:00) America/New_York">(UTC-05:00) America/New_York</option>
                    <option value="(UTC-08:00) America/Los_Angeles">(UTC-08:00) America/Los_Angeles</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Language</label>
                  <select 
                    className="select-control" 
                    value={language} 
                    onChange={e => setLanguage(e.target.value)}
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="German">German</option>
                    <option value="Japanese">Japanese</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>Auto Save</div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>Automatically persist changes in background</div>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={autoSave} 
                    onChange={e => setAutoSave(e.target.checked)} 
                    style={{ width: 16, height: 16 }} 
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>Start on Login</div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>Launch workstation automatically on system startup</div>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={startOnLogin} 
                    onChange={handleToggleAutoStart} 
                    style={{ width: 16, height: 16, cursor: 'pointer' }} 
                  />
                </div>

                <div style={{ marginTop: 10 }}>
                  <button type="submit" className="btn btn-primary">
                    <Save size={13} />
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <div>
              <div className="panel-header">
                <span className="panel-title">Notifications</span>
              </div>
              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>Task Updates</span>
                  <input type="checkbox" checked={notifTaskUpdates} onChange={e => setNotifTaskUpdates(e.target.checked)} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>Team Messages</span>
                  <input type="checkbox" checked={notifTeamMessages} onChange={e => setNotifTeamMessages(e.target.checked)} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>Attendance Alerts</span>
                  <input type="checkbox" checked={notifAttendanceAlerts} onChange={e => setNotifAttendanceAlerts(e.target.checked)} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>System Notifications</span>
                  <input type="checkbox" checked={notifSystemAlerts} onChange={e => setNotifSystemAlerts(e.target.checked)} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>Email Notifications</span>
                  <input type="checkbox" checked={notifEmailAlerts} onChange={e => setNotifEmailAlerts(e.target.checked)} />
                </div>
              </div>
            </div>
          )}

          {/* APPEARANCE TAB */}
          {activeTab === 'appearance' && (
            <div>
              <div className="panel-header">
                <span className="panel-title">Appearance</span>
              </div>
              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label>Theme</label>
                  <select 
                    className="select-control" 
                    value={theme === 'dark' ? 'Dark' : 'Light (Gray)'} 
                    onChange={e => {
                      if ((e.target.value === 'Dark' && theme === 'light') || (e.target.value !== 'Dark' && theme === 'dark')) {
                        onToggleTheme();
                      }
                    }}
                  >
                    <option value="Light (Gray)">Light (Gray)</option>
                    <option value="Dark">Dark Industrial</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Font Family</label>
                  <select className="select-control" value={fontFamily} onChange={e => setFontFamily(e.target.value)}>
                    <option value="Roboto Mono">Roboto Mono</option>
                    <option value="JetBrains Mono">JetBrains Mono</option>
                    <option value="Space Mono">Space Mono</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Font Size</label>
                  <select className="select-control" value={fontSize} onChange={e => setFontSize(e.target.value)}>
                    <option value="Small">Small (11px)</option>
                    <option value="Medium">Medium (13px)</option>
                    <option value="Large">Large (15px)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>Compact Mode</span>
                  <input type="checkbox" checked={compactMode} onChange={e => setCompactMode(e.target.checked)} />
                </div>
              </div>
            </div>
          )}

          {/* PRIVACY TAB */}
          {activeTab === 'privacy' && (
            <div>
              <div className="panel-header">
                <span className="panel-title">Privacy</span>
              </div>
              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label>Profile Visibility</label>
                  <select className="select-control" value={profileVisibility} onChange={e => setProfileVisibility(e.target.value)}>
                    <option value="Team Only">Team Only</option>
                    <option value="Public">Public</option>
                    <option value="Private">Private</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Activity Status</label>
                  <select className="select-control" value={activityStatus} onChange={e => setActivityStatus(e.target.value)}>
                    <option value="Visible">Visible</option>
                    <option value="Hidden">Hidden</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>Share Online Status</span>
                  <input type="checkbox" checked={shareOnlineStatus} onChange={e => setShareOnlineStatus(e.target.checked)} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>Data Collection</span>
                  <input type="checkbox" checked={dataCollection} onChange={e => setDataCollection(e.target.checked)} />
                </div>
              </div>
            </div>
          )}

          {/* INTEGRATIONS TAB */}
          {activeTab === 'integrations' && (
            <div>
              <div className="panel-header">
                <span className="panel-title">Integrations</span>
              </div>
              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>Cloud Sync</span>
                  <input type="checkbox" checked={cloudSync} onChange={e => setCloudSync(e.target.checked)} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>GIT Integration</span>
                  <input type="checkbox" checked={gitIntegration} onChange={e => setGitIntegration(e.target.checked)} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>File Versioning</span>
                  <input type="checkbox" checked={fileVersioning} onChange={e => setFileVersioning(e.target.checked)} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>Auto Backup</span>
                  <input type="checkbox" checked={autoBackup} onChange={e => setAutoBackup(e.target.checked)} />
                </div>
              </div>
            </div>
          )}

          {/* ACCOUNT TAB */}
          {activeTab === 'account' && (
            <div>
              <div className="panel-header">
                <span className="panel-title">Account & ID Card</span>
              </div>
              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--border-color)', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {userProfile?.avatar ? (
                      <img src={userProfile.avatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontWeight: 700, fontSize: 18 }}>JK</span>
                    )}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{userProfile?.name || 'Jagadish K'}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{userProfile?.role || 'FOUNDER'} &bull; {userProfile?.email}</div>
                    <button 
                      type="button" 
                      className="btn" 
                      style={{ marginTop: 8, fontSize: 11 }}
                      onClick={onSelectPhoto}
                    >
                      📷 Select Photo from Windows...
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ABOUT TAB */}
          {activeTab === 'about' && (
            <div>
              <div className="panel-header">
                <span className="panel-title">About REDDOT Workstation</span>
              </div>
              <div style={{ padding: '16px 20px', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>REDDOT Architecture & Executive Workstation OS</p>
                <p style={{ marginTop: 6 }}>Version: <strong>v3.12.0</strong> (Production Release Build)</p>
                <p>Runtime: Electron 34 / React 19 / V8 Core</p>
                <p>Native IPC Bridge: <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>● Connected & Authorized</span></p>
                <p style={{ marginTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>Persistent Local Vault: %APPDATA%\reddot-workstation-os\reddot_storage</p>
                <div style={{ marginTop: 14 }}>
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    style={{ fontSize: 11 }}
                    onClick={async () => {
                      const info = await electronBridge.otaCheckUpdate();
                      alert(info?.updateAvailable ? `Update available: v${info.version}` : 'You are currently on the latest v3.12.0 production build.');
                    }}
                  >
                    Check for Updates
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* WORKSPACE TAB */}
          {activeTab === 'workspace' && (
            <div>
              <div className="panel-header">
                <span className="panel-title">Workspace Configuration</span>
              </div>
              <div style={{ padding: '16px 20px', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <p>REDDOT Architecture & Executive Workstation OS</p>
                <p style={{ marginTop: 8 }}>Workspace: REDDOT WORKSTATION (Active Sprint 14)</p>
                <p>Native Loopback Vault: 127.0.0.1 (Strict Single-Instance)</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Workspace Information */}
        <div className="card-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="panel-header">
            <span className="panel-title">Workspace Information</span>
          </div>
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5 }}>
              <span style={{ color: 'var(--text-muted)' }}>Version</span>
              <span style={{ fontWeight: 600 }}>v3.0.0</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5 }}>
              <span style={{ color: 'var(--text-muted)' }}>Status</span>
              <span style={{ fontWeight: 600, color: 'var(--accent-green)' }}>● Online</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5 }}>
              <span style={{ color: 'var(--text-muted)' }}>Last Sync</span>
              <span style={{ fontWeight: 600 }}>1 min ago</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5 }}>
              <span style={{ color: 'var(--text-muted)' }}>Storage Usage</span>
              <span style={{ fontWeight: 600 }}>15.2 GB / 15.2 GB</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5 }}>
              <span style={{ color: 'var(--text-muted)' }}>Team Members</span>
              <span style={{ fontWeight: 600 }}>4</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5 }}>
              <span style={{ color: 'var(--text-muted)' }}>Active Sprint</span>
              <span style={{ fontWeight: 600 }}>Sprint 14</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5 }}>
              <span style={{ color: 'var(--text-muted)' }}>Created On</span>
              <span style={{ fontWeight: 600 }}>Sep 1, 2026</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5 }}>
              <span style={{ color: 'var(--text-muted)' }}>Owner</span>
              <span style={{ fontWeight: 600 }}>Jagadish K</span>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button className="btn" style={{ flex: 1, fontSize: 11 }} onClick={() => alert('Exporting workspace data as JSON archive...')}>
                <Download size={12} />
                <span>Export Data</span>
              </button>
              <button className="btn" style={{ flex: 1, fontSize: 11 }} onClick={() => alert('Workspace reset initialized.')}>
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsView;
