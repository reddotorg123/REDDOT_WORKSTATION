import React, { useState, useRef, useEffect, useCallback } from 'react';

export function StartupVideoScreen({ onComplete, theme = 'light' }) {
  const videoRef = useRef(null);
  const [isFading, setIsFading] = useState(false);
  const completeRef = useRef(false);

  // Based on user preference of theme, select video source (default to light theme video)
  const isDark = theme === 'dark';
  const videoSrc = isDark ? './assets/loading-video-dark.mp4' : './assets/loading-video-light.mp4';

  const finishIntro = useCallback(() => {
    if (completeRef.current) return;
    completeRef.current = true;

    try {
      sessionStorage.setItem('reddot_startup_video_played', 'true');
    } catch {}

    setIsFading(true);
    // Smooth cinematic fade to reveal the Authentication Screen
    setTimeout(() => {
      if (typeof onComplete === 'function') {
        onComplete();
      }
    }, 700);
  }, [onComplete]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Normal 1x playback speed as requested
    try {
      video.playbackRate = 1.0;
    } catch (_) {}

    // Instant autoplay
    const promise = video.play();
    if (promise !== undefined) {
      promise.catch(() => {
        video.muted = true;
        video.play().catch(() => finishIntro());
      });
    }

    // Safety timeout: 11s max (video is 9.96s at 1x normal speed)
    const safetyTimer = setTimeout(() => {
      finishIntro();
    }, 11000);

    // Keyboard listener: Escape, Space, Enter to skip immediately
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        finishIntro();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(safetyTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [finishIntro]);

  return (
    <div
      onClick={finishIntro}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: isDark ? '#000000' : '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        cursor: 'pointer',
        opacity: isFading ? 0 : 1,
        transition: 'opacity 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: isFading ? 'none' : 'auto'
      }}
    >
      {/* Fullscreen Video - First and Only Element */}
      <video
        ref={videoRef}
        src={videoSrc}
        preload="auto"
        playsInline
        autoPlay
        muted
        onEnded={finishIntro}
        onError={() => {
          console.warn('[STARTUP-VIDEO] Skipping video playback');
          finishIntro();
        }}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block'
        }}
      />

      {/* Subtle Skip Pill */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          finishIntro();
        }}
        style={{
          position: 'absolute',
          bottom: 28,
          right: 32,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 16px',
          borderRadius: 24,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          color: 'rgba(255, 255, 255, 0.85)',
          fontSize: '0.78rem',
          fontWeight: 500,
          letterSpacing: '0.04em',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          userSelect: 'none',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)';
          e.currentTarget.style.color = '#FFFFFF';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.65)';
          e.currentTarget.style.color = 'rgba(255, 255, 255, 0.85)';
        }}
      >
        <span>Skip</span>
        <span
          style={{
            fontSize: '0.68rem',
            padding: '2px 5px',
            borderRadius: 4,
            background: 'rgba(255, 255, 255, 0.14)',
            color: 'rgba(255, 255, 255, 0.7)'
          }}
        >
          ESC
        </span>
      </div>
    </div>
  );
}

export default StartupVideoScreen;
