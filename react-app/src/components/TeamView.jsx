import React, { useState } from 'react';
import { 
  Plus, 
  Users, 
  ShieldCheck, 
  Search,
  MoreHorizontal, 
  Mail, 
  MessageSquare, 
  X,
  CheckSquare,
  Square
} from 'lucide-react';

export function TeamView({ 
  teamMembers = [], 
  onAddMember, 
  onToggleMemberStatus, 
  onOpenDirectChat 
}) {
  const [searchMemberQuery, setSearchMemberQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedMemberId, setSelectedMemberId] = useState('02'); // Jai Keerthi
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeMenuMemberId, setActiveMenuMemberId] = useState(null);

  // Permission states for selected member
  const [permissions, setPermissions] = useState({
    tasks: true,
    files: true,
    messages: true,
    settings: true,
    management: false
  });

  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('Developer');
  const [newEmail, setNewEmail] = useState('');
  const [newStatus, setNewStatus] = useState('Online');

  const onlineCount = teamMembers.filter(m => m.status === 'Online').length;
  const offlineCount = teamMembers.length - onlineCount;

  const founderCount = teamMembers.filter(m => m.role.toLowerCase().includes('founder')).length;
  const devCount = teamMembers.filter(m => m.role.toLowerCase().includes('developer')).length;
  const designCount = teamMembers.filter(m => m.role.toLowerCase().includes('designer')).length;

  const filteredMembers = teamMembers.filter(m => {
    if (searchMemberQuery.trim()) {
      const q = searchMemberQuery.toLowerCase();
      const matchName = m.name.toLowerCase().includes(q);
      const matchEmail = m.email.toLowerCase().includes(q);
      if (!matchName && !matchEmail) return false;
    }

    if (roleFilter !== 'all' && m.role !== roleFilter) return false;
    if (statusFilter !== 'all' && m.status !== statusFilter) return false;

    return true;
  });

  const selectedMember = teamMembers.find(m => m.id === selectedMemberId) || teamMembers[1] || teamMembers[0];

  const handleCreateMember = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    onAddMember({
      id: String(teamMembers.length + 1).padStart(2, '0'),
      name: newName.trim(),
      role: newRole,
      status: newStatus,
      email: newEmail.trim() || `${newName.toLowerCase().replace(/\s+/g, '')}@reddot.com`,
      lastActive: newStatus === 'Online' ? 'Now' : '10 min ago',
      avatar: null
    });

    setNewName('');
    setNewEmail('');
    setShowAddModal(false);
  };

  const togglePermission = (key) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="team-view">
      {/* Header */}
      <div className="view-header">
        <div className="view-title-block">
          <h1>Team</h1>
          <p>Manage your team members and their roles.</p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={14} />
          <span>Add Member</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="filter-toolbar" style={{ marginBottom: 14 }}>
        <div className="filter-group-left">
          <div className="search-omnibox" style={{ width: 220 }}>
            <Search size={13} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Search team members..." 
              value={searchMemberQuery}
              onChange={e => setSearchMemberQuery(e.target.value)}
            />
          </div>

          <select 
            className="select-control"
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="Founder">Founder</option>
            <option value="Developer">Developer</option>
            <option value="Designer">Designer</option>
          </select>

          <select 
            className="select-control"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">Status: All</option>
            <option value="Online">Online</option>
            <option value="Offline">Offline</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Main Team Table */}
        <div className="card-panel">
          <table className="tech-table">
            <thead>
              <tr>
                <th style={{ width: '45px' }}>#</th>
                <th>NAME</th>
                <th style={{ width: '130px' }}>ROLE</th>
                <th style={{ width: '110px' }}>STATUS</th>
                <th>EMAIL</th>
                <th style={{ width: '120px' }}>LAST ACTIVE</th>
                <th style={{ width: '60px', textAlign: 'center' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member, idx) => {
                const isOnline = member.status === 'Online';
                const isSelected = selectedMember && selectedMember.id === member.id;
                return (
                  <tr 
                    key={member.id}
                    onClick={() => setSelectedMemberId(member.id)}
                    style={{ 
                      cursor: 'pointer',
                      background: isSelected ? 'var(--bg-active-nav)' : 'transparent'
                    }}
                  >
                    <td style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
                      {member.id || String(idx + 1).padStart(2, '0')}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="user-avatar-circle" style={{ width: 24, height: 24, fontSize: 10 }}>
                          {member.avatar ? (
                            <img src={member.avatar} alt={member.name} />
                          ) : (
                            <span>{member.name.split(' ').map(n => n[0]).join('')}</span>
                          )}
                        </div>
                        <span style={{ fontWeight: 600 }}>{member.name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{member.role}</td>
                    <td>
                      {isOnline ? (
                        <span className="badge badge-completed">● Online</span>
                      ) : (
                        <span className="badge badge-pending">Offline</span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{member.email}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{member.lastActive}</td>
                    <td style={{ textAlign: 'center', position: 'relative' }} onClick={e => e.stopPropagation()}>
                      <button 
                        className="icon-btn" 
                        style={{ margin: '0 auto', width: 24, height: 24 }}
                        onClick={() => setActiveMenuMemberId(activeMenuMemberId === member.id ? null : member.id)}
                      >
                        <MoreHorizontal size={14} />
                      </button>

                      {activeMenuMemberId === member.id && (
                        <div style={{
                          position: 'absolute',
                          right: 10,
                          top: 28,
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-sm)',
                          boxShadow: 'var(--shadow-modal)',
                          zIndex: 80,
                          width: 150,
                          textAlign: 'left'
                        }}>
                          <div 
                            style={{ padding: '7px 10px', cursor: 'pointer', fontSize: 11, borderBottom: '1px solid var(--border-dim)' }}
                            onClick={() => {
                              onToggleMemberStatus(member.id);
                              setActiveMenuMemberId(null);
                            }}
                          >
                            Toggle Status ({isOnline ? 'Offline' : 'Online'})
                          </div>
                          <div 
                            style={{ padding: '7px 10px', cursor: 'pointer', fontSize: 11 }}
                            onClick={() => {
                              onOpenDirectChat(member.id, member.name);
                              setActiveMenuMemberId(null);
                            }}
                          >
                            Send Message
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Lower Section: Member Details & Team Statistics (Screen 3) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
          {/* Member Details */}
          {selectedMember && (
            <div className="card-panel" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="panel-header" style={{ padding: 0, border: 'none' }}>
                <span className="panel-title">Member Details</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 12, borderBottom: '1px solid var(--border-dim)' }}>
                <div className="user-avatar-circle" style={{ width: 44, height: 44, fontSize: 14, fontWeight: 700 }}>
                  {selectedMember.avatar ? (
                    <img src={selectedMember.avatar} alt={selectedMember.name} />
                  ) : (
                    selectedMember.name.split(' ').map(n => n[0]).join('')
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{selectedMember.name}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>{selectedMember.role}</div>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  <button 
                    type="button"
                    className="btn btn-primary"
                    style={{ height: 30, fontSize: 11, display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px' }}
                    onClick={() => onOpenDirectChat(selectedMember.id, selectedMember.name)}
                  >
                    <MessageSquare size={13} />
                    <span>Direct Chat</span>
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 11.5 }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Status: </span>
                  <span style={{ fontWeight: 600, color: selectedMember.status === 'Online' ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                    ● {selectedMember.status}
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Email: </span>
                  <span style={{ fontWeight: 600 }}>{selectedMember.email}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Joined: </span>
                  <span style={{ fontWeight: 600 }}>Sep 12, 2026</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Last Active: </span>
                  <span style={{ fontWeight: 600 }}>{selectedMember.lastActive}</span>
                </div>
              </div>

              {/* Roles & Permissions */}
              <div style={{ borderTop: '1px solid var(--border-dim)', paddingTop: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
                  Roles &amp; Permissions
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 11.5 }} onClick={() => togglePermission('tasks')}>
                    {permissions.tasks ? <CheckSquare size={14} color="var(--text-primary)" /> : <Square size={14} color="var(--text-muted)" />}
                    <span>Tasks (Read/Write)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 11.5 }} onClick={() => togglePermission('files')}>
                    {permissions.files ? <CheckSquare size={14} color="var(--text-primary)" /> : <Square size={14} color="var(--text-muted)" />}
                    <span>Files (Read/Write)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 11.5 }} onClick={() => togglePermission('messages')}>
                    {permissions.messages ? <CheckSquare size={14} color="var(--text-primary)" /> : <Square size={14} color="var(--text-muted)" />}
                    <span>Messages (Read/Write)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 11.5 }} onClick={() => togglePermission('settings')}>
                    {permissions.settings ? <CheckSquare size={14} color="var(--text-primary)" /> : <Square size={14} color="var(--text-muted)" />}
                    <span>Settings (Read)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 11.5 }} onClick={() => togglePermission('management')}>
                    {permissions.management ? <CheckSquare size={14} color="var(--text-primary)" /> : <Square size={14} color="var(--text-muted)" />}
                    <span>Team Management (No)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Team Statistics */}
          <div className="card-panel" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="panel-header" style={{ padding: 0, border: 'none' }}>
              <span className="panel-title">Team Statistics</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="stat-card-icon">
                <Users size={18} />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{teamMembers.length}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total Members</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ padding: '10px 12px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-xs)' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent-green)' }}>{onlineCount}</div>
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>Online</div>
              </div>
              <div style={{ padding: '10px 12px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-xs)' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-muted)' }}>{offlineCount}</div>
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>Offline</div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-dim)', paddingTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
                Roles Distribution
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11.5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Founder</span>
                  <span style={{ fontWeight: 600 }}>{founderCount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Developer</span>
                  <span style={{ fontWeight: 600 }}>{devCount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Designer</span>
                  <span style={{ fontWeight: 600 }}>{designCount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-dim)', paddingTop: 6, marginTop: 2 }}>
                  <span style={{ fontWeight: 700 }}>Total</span>
                  <span style={{ fontWeight: 700 }}>{teamMembers.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Team Member</h3>
              <button className="icon-btn" onClick={() => setShowAddModal(false)}>
                <X size={15} />
              </button>
            </div>
            <form onSubmit={handleCreateMember}>
              <div className="modal-body">
                <div className="form-group">
                  <label>FULL NAME</label>
                  <input 
                    type="text" 
                    className="input-control" 
                    placeholder="e.g. Jai Keerthi"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label>ORGANIZATION ROLE</label>
                  <select 
                    className="select-control"
                    value={newRole}
                    onChange={e => setNewRole(e.target.value)}
                  >
                    <option value="Developer">Developer</option>
                    <option value="Designer">Designer</option>
                    <option value="Manager">Manager</option>
                    <option value="Marketing">Marketing</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>OFFICIAL EMAIL</label>
                  <input 
                    type="email" 
                    className="input-control" 
                    placeholder="e.g. jaikeerthi@reddot.com"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamView;
