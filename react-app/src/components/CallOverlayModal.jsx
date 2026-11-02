import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Monitor, Volume2, Shield } from 'lucide-react';
import { webRTCCallService } from '../services/webRTCCallService';

export function CallOverlayModal({
  activeCall,
  incomingCall,
  currentUser,
  currentUserEmail,
  onAcceptIncoming,
  onDeclineIncoming,
  onEndCall
}) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [iceState, setIceState] = useState('');
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Subscribe to webRTCCallService events
  useEffect(() => {
    const unsub = webRTCCallService.subscribe(event => {
      if (event.type === 'remote_stream') {
        if (remoteVideoRef.current && event.stream) {
          remoteVideoRef.current.srcObject = event.stream;
        }
      } else if (event.type === 'call_started' || event.type === 'call_connected') {
        if (localVideoRef.current && webRTCCallService.localStream) {
          localVideoRef.current.srcObject = webRTCCallService.localStream;
        }
      } else if (event.type === 'mute_changed') {
        setIsMuted(event.isMuted);
      } else if (event.type === 'video_changed') {
        setIsVideoOff(event.isVideoOff);
      } else if (event.type === 'ice_state') {
        setIceState(event.state);
      } else if (event.type === 'call_ended') {
        if (localVideoRef.current) localVideoRef.current.srcObject = null;
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      }
    });

    // Wire current streams if already active
    if (webRTCCallService.localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = webRTCCallService.localStream;
    }
    if (webRTCCallService.remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = webRTCCallService.remoteStream;
    }

    return () => unsub();
  }, [activeCall]);

  // Duration counter for active connected calls
  useEffect(() => {
    let timer = null;
    if (activeCall && (activeCall.status === 'connected' || activeCall.status === 'ACCEPTED')) {
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activeCall?.status]);

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleToggleMute = () => {
    const nextMuted = webRTCCallService.toggleMute();
    setIsMuted(nextMuted);
  };

  const handleToggleVideo = () => {
    const nextOff = webRTCCallService.toggleVideo();
    setIsVideoOff(nextOff);
  };

  const handleToggleScreen = async () => {
    await webRTCCallService.toggleScreenShare(window.electronAPI);
  };

  // 1. INCOMING CALL POPUP BANNER / MODAL
  if (incomingCall && !activeCall) {
    const isVideo = incomingCall.callType === 'video';
    const callerName = incomingCall.callerName || 'Teammate';
    const callerRole = incomingCall.callerDept || 'REDDOT Member';

    return (
      <div style={{
        position: 'fixed',
        top: 24,
        right: 24,
        zIndex: 999999,
        background: 'var(--card-bg, #121826)',
        border: '1px solid var(--border-color, #2d3748)',
        borderRadius: 16,
        boxShadow: '0 20px 45px rgba(0,0,0,0.65), 0 0 25px rgba(225, 29, 72, 0.25)',
        padding: '20px 24px',
        width: 360,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        animation: 'callPopupSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ position: 'relative' }}>
            <img 
              src={incomingCall.callerPhoto || './assets/id-card.png'} 
              alt={callerName}
              style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid #e11d48' }}
              onError={(e) => { e.target.src = './assets/id-card.png'; }}
            />
            <span style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: '#22c55e',
              border: '2px solid #121826'
            }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#e11d48' }}>
              Incoming {isVideo ? 'Video' : 'Voice'} Call
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary, #f8fafc)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {callerName}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted, #94a3b8)' }}>
              {callerRole}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => onDeclineIncoming(incomingCall)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '10px 14px',
              borderRadius: 10,
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <PhoneOff size={16} /> Decline
          </button>
          <button
            onClick={() => onAcceptIncoming(incomingCall)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '10px 14px',
              borderRadius: 10,
              background: '#22c55e',
              color: '#ffffff',
              border: 'none',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(34, 197, 94, 0.4)',
              transition: 'all 0.15s ease'
            }}
          >
            <Phone size={16} /> Accept
          </button>
        </div>
      </div>
    );
  }

  // 2. ACTIVE CALL FULL / FLOATING OVERLAY
  if (activeCall) {
    const isVideo = activeCall.callType === 'video';
    const partnerName = activeCall.recipientName || activeCall.callerName || 'Teammate';
    const isConnected = activeCall.status === 'connected' || activeCall.status === 'ACCEPTED';

    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999998,
        background: 'rgba(11, 15, 25, 0.94)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        animation: 'fadeIn 0.2s ease'
      }}>
        {/* Top Header Information */}
        <div style={{
          position: 'absolute',
          top: 24,
          left: 32,
          right: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: 'var(--text-primary, #f8fafc)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: isConnected ? '#22c55e' : '#eab308',
              boxShadow: isConnected ? '0 0 10px #22c55e' : '0 0 10px #eab308'
            }} />
            <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.04em' }}>
              REDDOT ENCRYPTED DIRECT CALL &bull; {isVideo ? 'VIDEO' : 'AUDIO'}
            </span>
            <span style={{
              fontSize: 12,
              padding: '2px 8px',
              borderRadius: 6,
              background: 'rgba(255,255,255,0.08)',
              color: 'var(--text-muted, #94a3b8)',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}>
              <Shield size={12} color="#22c55e" /> P2P WebRTC Secure
            </span>
          </div>

          <div style={{
            fontSize: 15,
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
            color: isConnected ? 'var(--text-primary, #f8fafc)' : '#eab308'
          }}>
            {isConnected ? formatDuration(callDuration) : 'Connecting...'}
          </div>
        </div>

        {/* Video or Avatar Display Area */}
        <div style={{
          position: 'relative',
          width: '100%',
          maxWidth: 960,
          height: '65vh',
          background: '#090d16',
          borderRadius: 20,
          border: '1px solid var(--border-color, #1e293b)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 25px 60px rgba(0,0,0,0.7)'
        }}>
          {/* Remote Media Element */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: isVideo && isConnected ? 'block' : 'none'
            }}
          />

          {/* Fallback Audio Call UI or when Remote Video is not streaming */}
          {(!isVideo || !isConnected) && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <div style={{
                position: 'relative',
                width: 110,
                height: 110,
                borderRadius: '50%',
                padding: 4,
                border: '3px solid rgba(225, 29, 72, 0.4)',
                background: 'rgba(225, 29, 72, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <img
                  src={activeCall.recipientPhoto || activeCall.callerPhoto || './assets/id-card.png'}
                  alt={partnerName}
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                  onError={(e) => { e.target.src = './assets/id-card.png'; }}
                />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary, #f8fafc)', marginBottom: 4 }}>
                  {partnerName}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted, #94a3b8)' }}>
                  {isConnected ? 'Call in progress' : 'Ringing teammate workstation...'}
                </div>
              </div>
            </div>
          )}

          {/* Local User Picture-in-Picture Preview for Video Calls */}
          {isVideo && (
            <div style={{
              position: 'absolute',
              bottom: 20,
              right: 20,
              width: 200,
              height: 130,
              borderRadius: 12,
              overflow: 'hidden',
              background: '#121826',
              border: '2px solid rgba(255,255,255,0.15)',
              boxShadow: '0 10px 25px rgba(0,0,0,0.6)'
            }}>
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: isVideoOff ? 'none' : 'block',
                  transform: 'scaleX(-1)'
                }}
              />
              {isVideoOff && (
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  color: 'var(--text-muted, #94a3b8)',
                  background: '#121826'
                }}>
                  Camera Off
                </div>
              )}
            </div>
          )}
        </div>

        {/* Call Action Bar */}
        <div style={{
          marginTop: 28,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          background: 'var(--card-bg, #121826)',
          border: '1px solid var(--border-color, #2d3748)',
          padding: '12px 24px',
          borderRadius: 40,
          boxShadow: '0 15px 35px rgba(0,0,0,0.5)'
        }}>
          {/* Mute Button */}
          <button
            onClick={handleToggleMute}
            title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              background: isMuted ? '#ef4444' : 'var(--bg-subtle, #1e293b)',
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          {/* Camera Toggle Button */}
          {isVideo && (
            <button
              onClick={handleToggleVideo}
              title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                background: isVideoOff ? '#ef4444' : 'var(--bg-subtle, #1e293b)',
                color: '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
            </button>
          )}

          {/* Screen Share Button */}
          <button
            onClick={handleToggleScreen}
            title="Share Screen"
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              background: 'var(--bg-subtle, #1e293b)',
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Monitor size={20} />
          </button>

          {/* End Call Button */}
          <button
            onClick={onEndCall}
            title="End Call"
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              background: '#ef4444',
              color: '#ffffff',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
              transition: 'all 0.15s ease'
            }}
          >
            <PhoneOff size={20} />
          </button>
        </div>
      </div>
    );
  }

  return null;
}

