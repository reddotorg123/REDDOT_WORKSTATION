import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CheckSquare, 
  Cloud, 
  Calendar, 
  Play, 
  Pause, 
  Coffee, 
  LogOut 
} from 'lucide-react';

export function DashboardView({ 
  tasks = [], 
  onToggleTask, 
  teamMembers = [], 
  timerState, 
  onToggleTimer, 
  onTakeBreak, 
  onClockOut,
  metrics,
  onCleanMemory
}) {
  const [currentDateTime, setCurrentDateTime] = useState({
    dateStr: '',
    timeStr: ''
  });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const optionsDate = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      const dateStr = now.toLocaleDateString('en-US', optionsDate);
      
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const hoursStr = String(hours).padStart(2, '0');
      const timeStr = `${hoursStr}:${minutes} ${ampm}`;

      setCurrentDateTime({ dateStr, timeStr });
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Compute stat metrics
  const onlineCount = teamMembers.filter(m => m.status === 'Online').length;
  const totalMembers = teamMembers.length || 4;
  const completedTasksCount = tasks.filter(t => t.completed || t.status === 'Completed').length || 1;
  const totalTasksCount = tasks.length || 7;
  const tasksPercent = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 14;

  const todayTasks = tasks.slice(0, 5);

  return (
    <div className="dashboard-view">
      {/* Header with Title and Clock */}
      <div className="view-header">
        <div className="view-title-block">
          <h1>Dashboard</h1>
          <p>Overview of your workspace activities.</p>
        </div>

        <div className="header-clock-widget">
          <div className="header-clock-date">{currentDateTime.dateStr || 'Monday, October 5, 2026'}</div>
          <div className="header-clock-time">{currentDateTime.timeStr || '03:42 PM'}</div>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="stat-cards-grid">
        <div className="stat-card">
          <div className="stat-card-icon">
            <Users size={18} />
          </div>
          <div className="stat-card-body">
            <span className="stat-card-label">TEAM ONLINE</span>
            <span className="stat-card-value">{onlineCount} / {totalMembers}</span>
            <span className="stat-card-subtext">{onlineCount} active, {totalMembers - onlineCount} offline</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon">
            <CheckSquare size={18} />
          </div>
          <div className="stat-card-body">
            <span className="stat-card-label">TASKS DONE</span>
            <span className="stat-card-value">{completedTasksCount} / {totalTasksCount}</span>
            <span className="stat-card-subtext">{tasksPercent}% completed</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon">
            <Cloud size={18} />
          </div>
          <div className="stat-card-body">
            <span className="stat-card-label">CLOUD STORAGE</span>
            <span className="stat-card-value">100%</span>
            <span className="stat-card-subtext">Synchronized</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon">
            <Calendar size={18} />
          </div>
          <div className="stat-card-body">
            <span className="stat-card-label">ACTIVE SPRINT</span>
            <span className="stat-card-value">Sprint 14</span>
            <span className="stat-card-subtext">4 days left</span>
          </div>
        </div>
      </div>

      {/* Two Column Split: Today's Tasks & Work Timer */}
      <div className="dashboard-split-grid">
        {/* Left Column: Today's Tasks */}
        <div className="card-panel">
          <div className="panel-header">
            <span className="panel-title">Today's Tasks</span>
          </div>

          <table className="tech-table">
            <thead>
              <tr>
                <th style={{ width: '45px' }}>#</th>
                <th>TITLE</th>
                <th style={{ width: '100px' }}>DUE</th>
                <th style={{ width: '90px' }}>PRIORITY</th>
                <th style={{ width: '130px' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {todayTasks.map((task, idx) => {
                const isCompleted = task.completed || task.status === 'Completed';
                const isInProgress = task.status === 'In Progress';
                return (
                  <tr 
                    key={task.id}
                    onClick={() => onToggleTask(task.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
                      {String(idx + 1).padStart(2, '0')}
                    </td>
                    <td style={{ fontWeight: 600, color: isCompleted ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: isCompleted ? 'line-through' : 'none' }}>
                      {task.title}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {task.dueDate?.replace('Today, ', '') || task.due || '5:00 PM'}
                    </td>
                    <td>
                      <span className="badge badge-priority-high">
                        {task.priority}
                      </span>
                    </td>
                    <td>
                      {isCompleted ? (
                        <span className="badge badge-completed">● Completed</span>
                      ) : isInProgress ? (
                        <span className="badge badge-in-progress">● In Progress</span>
                      ) : (
                        <span className="badge badge-pending">Pending</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Right Column: Work Timer */}
        <div className="card-panel">
          <div className="panel-header">
            <span className="panel-title">Work Timer</span>
            <span className={`badge ${timerState?.isRunning ? 'badge-in-progress' : 'badge-pending'}`}>
              ● {timerState?.isRunning ? 'On Duty' : 'Day Off'}
            </span>
          </div>

          <div className="timer-container">
            <div className="timer-digits-block">
              <div className="timer-digits">{timerState?.formattedTime || '00:00:00'}</div>
              <div className="timer-sublabel">LOGGED</div>
            </div>

            <button 
              className={`timer-play-btn ${timerState?.isRunning ? 'running' : ''}`}
              onClick={onToggleTimer}
              title={timerState?.isRunning ? 'Pause Work Timer' : 'Start Work Timer'}
            >
              {timerState?.isRunning ? (
                <Pause size={24} />
              ) : (
                <Play size={24} style={{ marginLeft: 3 }} />
              )}
            </button>

            <div className="timer-meta-info">
              <div className="timer-meta-row">
                <span>Start Time</span>
                <span style={{ fontWeight: 600 }}>{timerState?.startTime || '--:-- (Off Duty)'}</span>
              </div>
              <div className="timer-meta-row">
                <span>Expected Clock-Out</span>
                <span style={{ fontWeight: 600 }}>{timerState?.expectedClockOut || '--:-- (Standby)'}</span>
              </div>
            </div>

            <div className="timer-btn-row">
              <button className="btn" style={{ flex: 1 }} onClick={onTakeBreak}>
                <Coffee size={13} />
                <span>Take Break</span>
              </button>
              <button className="btn" style={{ flex: 1 }} onClick={onClockOut}>
                <LogOut size={13} />
                <span>Clock Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Live System Telemetry Strip (connected with Electron main process) */}
      {metrics && (
        <div className="card-panel" style={{ marginTop: 16, padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="status-dot"></span>
              <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.05em' }}>NATIVE WORKSTATION TELEMETRY</span>
            </div>
            <span style={{ color: 'var(--border-strong)' }}>|</span>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              CPU: <strong>{metrics.cpuLoad || 0}%</strong> ({metrics.cpuCores || 8} Cores)
            </span>
            <span style={{ color: 'var(--border-strong)' }}>|</span>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              RAM: <strong>{metrics.usedMemGB || '6.4'} GB</strong> / {metrics.totalMemGB || '16.0'} GB ({metrics.memUsagePercent || 40}%)
            </span>
            <span style={{ color: 'var(--border-strong)' }}>|</span>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              App Heap: <strong>{metrics.appMemMB || 85} MB</strong>
            </span>
            {metrics.runningApps?.length > 0 && (
              <>
                <span style={{ color: 'var(--border-strong)' }}>|</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Active Apps: {metrics.runningApps.slice(0, 3).map(a => a.name).join(', ')}
                </span>
              </>
            )}
          </div>
          <button 
            className="btn" 
            style={{ fontSize: 11, padding: '3px 10px', height: 26 }}
            onClick={onCleanMemory}
            title="Clean memory and run garbage collection in native Electron process"
          >
            🧹 Clean Memory
          </button>
        </div>
      )}
    </div>
  );
}
