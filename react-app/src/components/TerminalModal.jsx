import React, { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, X } from 'lucide-react';
import { electronBridge } from '../services/electronBridge';

export function TerminalModal({ 
  isOpen, 
  onClose, 
  tasks = [], 
  teamMembers = [], 
  onToggleTheme 
}) {
  const [history, setHistory] = useState([
    { type: 'system', text: 'REDDOT Workstation Kernel v3.0 [Architecture x86_64-win32]' },
    { type: 'system', text: 'Type "help" for a list of available workstation commands.' },
    { type: 'system', text: '' }
  ]);
  const [cmdInput, setCmdInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView();
    }
  }, [history, isOpen]);

  if (!isOpen) return null;

  const handleCommand = async (e) => {
    e.preventDefault();
    const command = cmdInput.trim();
    if (!command) return;

    const newHistory = [...history, { type: 'input', text: `jagadish@reddot:~$ ${command}` }];
    setCmdInput('');
    const parts = command.toLowerCase().split(' ');
    const mainCmd = parts[0];

    switch (mainCmd) {
      case 'help':
        newHistory.push({ type: 'output', text: 'Available commands:' });
        newHistory.push({ type: 'output', text: '  status     - Show cluster and sprint status' });
        newHistory.push({ type: 'output', text: '  tasks      - List active workstation tasks' });
        newHistory.push({ type: 'output', text: '  team       - List registered team members' });
        newHistory.push({ type: 'output', text: '  ping       - Test latency to primary cluster' });
        newHistory.push({ type: 'output', text: '  theme      - Toggle between light and dark modes' });
        newHistory.push({ type: 'output', text: '  version    - Display kernel build information' });
        newHistory.push({ type: 'output', text: '  clear      - Clear terminal screen' });
        newHistory.push({ type: 'output', text: '  exit       - Close terminal window' });
        break;

      case 'status':
        newHistory.push({ type: 'output', text: 'Cluster: primary-us-east (100% online)' });
        newHistory.push({ type: 'output', text: `Sprint: Sprint 14 (4 days remaining)` });
        newHistory.push({ type: 'output', text: `Tasks Done: ${tasks.filter(t => t.completed || t.status === 'Completed').length} / ${tasks.length}` });
        newHistory.push({ type: 'output', text: `Members: ${teamMembers.filter(m => m.status === 'Online').length} online / ${teamMembers.length} total` });
        break;

      case 'tasks':
        tasks.forEach(t => {
          newHistory.push({ type: 'output', text: `[${t.id}] ${t.title} - ${t.status} (${t.assignedTo})` });
        });
        break;

      case 'team':
        teamMembers.forEach(m => {
          newHistory.push({ type: 'output', text: `* ${m.name} [${m.role}] - ${m.status}` });
        });
        break;

      case 'ping':
        newHistory.push({ type: 'output', text: 'PING primary-us-east.reddot.internal: 64 bytes, time=12.4ms, ttl=64' });
        newHistory.push({ type: 'output', text: 'Handshake: TLS 1.3 AES-256-GCM verified' });
        break;

      case 'theme':
        onToggleTheme();
        newHistory.push({ type: 'output', text: 'Switched interface theme mode.' });
        break;

      case 'version':
        newHistory.push({ type: 'output', text: 'REDDOT Workstation OS v3.0.0-release (Electron/React/V8)' });
        break;

      case 'clear':
        setHistory([]);
        setCmdInput('');
        return;

      case 'exit':
        onClose();
        return;

      default:
        try {
          const res = await electronBridge.executeCommand(command);
          if (res.stdout) {
            res.stdout.split(/\r?\n/).forEach(l => {
              if (l.trim()) newHistory.push({ type: 'output', text: l });
            });
          }
          if (res.stderr) {
            res.stderr.split(/\r?\n/).forEach(l => {
              if (l.trim()) newHistory.push({ type: 'error', text: l });
            });
          }
          if (!res.stdout && !res.stderr) {
            newHistory.push({ type: 'output', text: `Command completed with exit code ${res.exitCode}` });
          }
        } catch (err) {
          newHistory.push({ type: 'error', text: `Execution failed: ${err.message}` });
        }
        break;
    }

    newHistory.push({ type: 'system', text: '' });
    setHistory(newHistory);
    setCmdInput('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-dialog" 
        onClick={e => e.stopPropagation()}
        style={{ width: 680, height: 480, display: 'flex', flexDirection: 'column', background: '#090d16', color: '#00ff66' }}
      >
        <div style={{
          padding: '10px 14px',
          background: '#121824',
          borderBottom: '1px solid #1f2735',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#f0f6fc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700 }}>
            <TerminalIcon size={15} />
            <span>REDDOT Workstation Terminal</span>
          </div>
          <button className="win-btn win-close" onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        <div style={{
          flex: 1,
          padding: 14,
          overflowY: 'auto',
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          lineHeight: 1.5,
          color: '#e2e8f0',
          background: '#0a0e17'
        }}>
          {history.map((h, i) => (
            <div key={i} style={{
              color: h.type === 'error' ? '#ef4444' : h.type === 'input' ? '#38bdf8' : h.type === 'output' ? '#e2e8f0' : '#94a3b8'
            }}>
              {h.text}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleCommand} style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 12px',
          background: '#121824',
          borderTop: '1px solid #1f2735'
        }}>
          <span style={{ color: '#38bdf8', fontSize: 12, fontWeight: 700, marginRight: 8 }}>
            jagadish@reddot:~$
          </span>
          <input 
            type="text" 
            value={cmdInput}
            onChange={e => setCmdInput(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#ffffff',
              fontFamily: 'var(--font-mono)',
              fontSize: 12
            }}
            autoFocus
          />
        </form>
      </div>
    </div>
  );
}
