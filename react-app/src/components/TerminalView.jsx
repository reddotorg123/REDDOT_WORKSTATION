import React, { useState, useRef, useEffect } from 'react';
import { 
  Terminal as TerminalIcon, 
  Play, 
  RotateCcw, 
  ExternalLink, 
  FileCode, 
  Layers, 
  Activity, 
  GitBranch, 
  FolderOpen, 
  Trash2 
} from 'lucide-react';
import { electronBridge } from '../services/electronBridge';

export function TerminalView({ 
  tasks = [], 
  teamMembers = [], 
  onToggleTheme,
  onOpenNewWindow
}) {
  const [history, setHistory] = useState([
    { type: 'command', text: '$ ls -la' },
    { type: 'output', text: 'total 40' },
    { type: 'output', text: 'drwxr-xr-x  6 jagadish staff  192 Oct  5 15:42 .' },
    { type: 'output', text: 'drwxr-xr-x  4 jagadish staff  128 Oct  5 10:31 ..' },
    { type: 'output', text: 'drwxr-xr-x  4 jagadish staff  256 Oct  5 14:10 src' },
    { type: 'output', text: 'drwxr-xr-x  4 jagadish staff  128 Oct  5 13:21 docs' },
    { type: 'output', text: '-rw-r--r--  1 jagadish staff 2.4M Oct  5 12:10 project_reddot.pdf' },
    { type: 'output', text: '-rw-r--r--  1 jagadish staff 1.1M Oct  5 10:20 logo_reddot.png' },
    { type: 'command', text: '$ git status' },
    { type: 'output', text: 'On branch main' },
    { type: 'output', text: 'Nothing to commit, working tree clean' },
    { type: 'command', text: '$ ./deploy.sh' },
    { type: 'output', text: '[>] Deployment started...' }
  ]);

  const [cmdInput, setCmdInput] = useState('');
  const [recentCommands, setRecentCommands] = useState(['ls -la', 'git status', './deploy.sh', 'npm install']);
  const terminalEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const executeCommand = async (cmdStr) => {
    const trimmed = cmdStr.trim();
    if (!trimmed) return;

    setRecentCommands(prev => [trimmed, ...prev.filter(c => c !== trimmed)].slice(0, 6));

    const parts = trimmed.split(' ');
    const cmd = parts[0].toLowerCase();

    if (cmd === 'clear') {
      setHistory([]);
      setCmdInput('');
      return;
    }

    if (cmd === 'theme') {
      if (typeof onToggleTheme === 'function') onToggleTheme();
      setHistory(prev => [...prev, { type: 'command', text: `$ ${trimmed}` }, { type: 'output', text: 'Theme toggled successfully.' }]);
      setCmdInput('');
      return;
    }

    if (cmd === 'tasks') {
      const taskLines = tasks.length > 0
        ? tasks.map(t => `[#${t.id}] ${t.title} - ${t.status} (${t.assignedTo || 'Unassigned'})`)
        : ['No active tasks in database.'];
      setHistory(prev => [...prev, { type: 'command', text: `$ ${trimmed}` }, ...taskLines.map(text => ({ type: 'output', text }))]);
      setCmdInput('');
      return;
    }

    if (cmd === 'team') {
      const memberLines = teamMembers.length > 0
        ? teamMembers.map(m => `* ${m.name} [${m.role}] - ${m.status} (${m.email})`)
        : ['No registered team members found.'];
      setHistory(prev => [...prev, { type: 'command', text: `$ ${trimmed}` }, ...memberLines.map(text => ({ type: 'output', text }))]);
      setCmdInput('');
      return;
    }

    if (cmd === 'help') {
      const helpLines = [
        'REDDOT Workstation Terminal Commands:',
        '  dir, ls        - List directory files & workspace structure',
        '  git status     - Inspect live repository status',
        '  node -v, npm   - View local Node.js / NPM toolchain environment',
        '  tasks          - Query local database tasks',
        '  team           - List registered team members',
        '  theme          - Toggle light/dark UI themes',
        '  clear          - Clear terminal display buffer',
        '  <any command>  - Executes live shell command directly on Windows OS'
      ];
      setHistory(prev => [...prev, { type: 'command', text: `$ ${trimmed}` }, ...helpLines.map(text => ({ type: 'output', text }))]);
      setCmdInput('');
      return;
    }

    // Live native shell execution via Electron bridge
    setHistory(prev => [...prev, { type: 'command', text: `$ ${trimmed}` }]);
    setCmdInput('');

    try {
      const res = await electronBridge.executeCommand(trimmed);
      const outputLines = [];
      if (res.stdout) {
        res.stdout.split(/\r?\n/).forEach(l => {
          if (l.trim()) outputLines.push({ type: 'output', text: l });
        });
      }
      if (res.stderr) {
        res.stderr.split(/\r?\n/).forEach(l => {
          if (l.trim()) outputLines.push({ type: 'error', text: l });
        });
      }
      if (outputLines.length === 0) {
        outputLines.push({ type: 'output', text: `Command completed with exit code ${res.exitCode}` });
      }
      setHistory(prev => [...prev, ...outputLines]);
    } catch (err) {
      setHistory(prev => [...prev, { type: 'error', text: `Execution failed: ${err.message}` }]);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    executeCommand(cmdInput);
  };

  return (
    <div className="terminal-view">
      {/* Header */}
      <div className="view-header">
        <div className="view-title-block">
          <h1>Terminal</h1>
          <p>Execute commands and manage your workspace.</p>
        </div>

        <button className="btn" onClick={onOpenNewWindow || (() => alert('Terminal window detached.'))}>
          <ExternalLink size={13} />
          <span>Open in New Window</span>
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 260px',
        gap: 16,
        height: 'calc(100vh - 150px)',
        minHeight: 520
      }}>
        {/* Main Terminal Screen */}
        <div className="card-panel" style={{
          display: 'flex',
          flexDirection: 'column',
          background: '#0d1117',
          borderColor: '#1f242c',
          overflow: 'hidden',
          borderRadius: 'var(--radius-sm)'
        }}>
          {/* Terminal Banner */}
          <div style={{
            padding: '8px 14px',
            background: '#161b22',
            borderBottom: '1px solid #21262d',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: '#8b949e',
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            <div>
              <span style={{ color: '#e6edf3', fontWeight: 700 }}>REDDOT TERMINAL v3.0</span>
            </div>
            <div>
              <span>Workspace: </span>
              <span style={{ color: '#58a6ff' }}>REDDOT</span>
              <span> | User: </span>
              <span style={{ color: '#7ee787' }}>jagadish</span>
              <span> | Path: </span>
              <span style={{ color: '#e6edf3' }}>~/workspace/reddot</span>
            </div>
          </div>

          {/* Terminal Output Stream */}
          <div style={{
            flex: 1,
            padding: '14px 16px',
            overflowY: 'auto',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            lineHeight: 1.5,
            color: '#c9d1d9',
            background: '#0d1117'
          }}>
            {history.map((h, i) => (
              <div 
                key={i} 
                style={{
                  color: h.type === 'command' ? '#58a6ff' : h.type === 'error' ? '#ff7b72' : '#c9d1d9',
                  fontWeight: h.type === 'command' ? 600 : 400,
                  whiteSpace: 'pre-wrap'
                }}
              >
                {h.text}
              </div>
            ))}
            <div ref={terminalEndRef} />
          </div>

          {/* Terminal Input Bar */}
          <form 
            onSubmit={handleFormSubmit}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 14px',
              background: '#161b22',
              borderTop: '1px solid #21262d',
              gap: 8
            }}
          >
            <span style={{ color: '#58a6ff', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>$</span>
            <input 
              ref={inputRef}
              type="text"
              placeholder="Type a command..."
              value={cmdInput}
              onChange={e => setCmdInput(e.target.value)}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#f0f6fc',
                fontFamily: 'var(--font-mono)',
                fontSize: 12
              }}
              autoFocus
            />
          </form>
        </div>

        {/* Right Side Panel: Quick Commands & Recent Commands */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Quick Commands */}
          <div className="card-panel">
            <div className="panel-header">
              <span className="panel-title">Quick Commands</span>
            </div>
            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button className="btn" style={{ justifyContent: 'flex-start', fontSize: 11.5 }} onClick={() => executeCommand('npm run build')}>
                <Layers size={13} />
                <span>Build Project</span>
              </button>
              <button className="btn" style={{ justifyContent: 'flex-start', fontSize: 11.5 }} onClick={() => executeCommand('npm start')}>
                <Play size={13} />
                <span>Run Application</span>
              </button>
              <button className="btn" style={{ justifyContent: 'flex-start', fontSize: 11.5 }} onClick={() => executeCommand('tail -f logs.txt')}>
                <Activity size={13} />
                <span>View Logs</span>
              </button>
              <button className="btn" style={{ justifyContent: 'flex-start', fontSize: 11.5 }} onClick={() => executeCommand('git status')}>
                <GitBranch size={13} />
                <span>Git Status</span>
              </button>
              <button className="btn" style={{ justifyContent: 'flex-start', fontSize: 11.5 }} onClick={() => executeCommand('code .')}>
                <FolderOpen size={13} />
                <span>Open Workspace</span>
              </button>
              <button className="btn" style={{ justifyContent: 'flex-start', fontSize: 11.5 }} onClick={() => executeCommand('clear')}>
                <Trash2 size={13} />
                <span>Clear Terminal</span>
              </button>
            </div>
          </div>

          {/* Recent Commands */}
          <div className="card-panel" style={{ flex: 1 }}>
            <div className="panel-header">
              <span className="panel-title">Recent Commands</span>
            </div>
            <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {recentCommands.map((cmd, i) => (
                <div 
                  key={i}
                  onClick={() => executeCommand(cmd)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-xs)',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-dim)',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>&gt;</span>
                  <span>{cmd}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TerminalView;
