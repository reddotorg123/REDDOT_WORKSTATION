import React, { useState, useEffect } from 'react';
import { Monitor, X, Cpu, HardDrive, Wifi, Shield, ArrowLeft } from 'lucide-react';

export function WorkspaceOsModal({ isOpen, onClose }) {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  const [cpuUsage, setCpuUsage] = useState(14);
  const [ramUsage, setRamUsage] = useState(38);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    const updateClock = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDate(now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);

    // Random slight fluctuations for telemetry simulation
    const teleInterval = setInterval(() => {
      setCpuUsage(prev => Math.min(65, Math.max(8, prev + Math.floor(Math.random() * 7) - 3)));
    }, 2500);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearInterval(interval);
      clearInterval(teleInterval);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'var(--bg-app)',
      zIndex: 2000,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '30px 40px',
      userSelect: 'none',
      animation: 'fadeIn 0.2s ease'
    }}>
      {/* Top Header Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="brand-icon-box">
            <div className="brand-circle"></div>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.8 }}>REDDOT WORKSPACE OS</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>LIVE WALLPAPER HUD MODE</div>
          </div>
        </div>

        <button 
          className="btn" 
          onClick={onClose}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <ArrowLeft size={14} />
          <span>Return to Workstation [Esc]</span>
        </button>
      </div>

      {/* Center Giant Ambient Clock */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <div style={{
          fontSize: 'clamp(52px, 8vw, 92px)',
          fontWeight: 800,
          letterSpacing: 2,
          lineHeight: 1,
          fontFamily: 'var(--font-mono)'
        }}>
          {time}
        </div>
        <div style={{
          fontSize: 18,
          color: 'var(--text-secondary)',
          fontWeight: 600,
          letterSpacing: 1
        }}>
          {date}
        </div>
        <div style={{
          marginTop: 10,
          display: 'flex',
          gap: 12,
          alignItems: 'center'
        }}>
          <span className="badge badge-completed">● EXECUTIVE CLUSTER SYNCHRONIZED</span>
          <span className="badge">SPRINT 14 • 4 DAYS REMAINING</span>
        </div>
      </div>

      {/* Bottom Live System Telemetry Strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 16,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '16px 20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Cpu size={20} color="var(--text-secondary)" />
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' }}>CPU TELEMETRY</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{cpuUsage}% LOAD</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <HardDrive size={20} color="var(--text-secondary)" />
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' }}>RAM BUFFER</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{ramUsage}% ALLOCATED</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Wifi size={20} color="var(--text-secondary)" />
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' }}>NETWORK BRIDGE</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>12ms TLS 1.3</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Shield size={20} color="var(--text-secondary)" />
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' }}>ENCLAVE SHIELD</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent-green)' }}>SECURED</div>
          </div>
        </div>
      </div>
    </div>
  );
}
