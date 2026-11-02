import React, { useState } from 'react';
import { Shield, Lock, Mail, ArrowRight, KeyRound, AlertCircle, Loader2 } from 'lucide-react';
import { firebaseBridge } from '../services/firebaseBridge';

export function AuthScreen({ onLoginSuccess }) {
  const [activeTab, setActiveTab] = useState('google'); // 'google' | 'credentials'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 1. True Google Sign-in flow via Firebase Auth Popup
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const authProfile = await firebaseBridge.signInWithGoogle(rememberMe);
      if (typeof onLoginSuccess === 'function') {
        onLoginSuccess(authProfile);
      }
    } catch (err) {
      console.error('[AUTH] Google Sign-in error:', err);
      const popupErrors = {
        'auth/popup-closed-by-user': 'Google sign-in was canceled before it finished. Click the button again and complete the Google sign-in window.',
        'auth/popup-blocked': 'Your browser blocked the Google sign-in window. Allow popups for this app, then try again.'
      };
      setErrorMsg(popupErrors[err?.code] || err.message || 'Google Authentication failed. Please verify popup permissions and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Real Credential Verification via Firebase Auth / Database
  const handleCredentialLogin = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Please enter your workspace email address');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');

    try {
      const authProfile = await firebaseBridge.signInWithCredentials(email.trim(), password, rememberMe);
      if (typeof onLoginSuccess === 'function') {
        onLoginSuccess(authProfile);
      }
    } catch (err) {
      console.warn('[AUTH] Credential login error:', err);
      setErrorMsg(err.message || 'Invalid credentials. Please enter a valid workstation email and password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #111418 0%, #0A0C0E 100%)',
      fontFamily: 'var(--font-sans)',
      padding: 16
    }}>
      {/* Background Dot Grid Matrix */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.08) 1.2px, transparent 1.2px)',
        backgroundSize: '24px 24px',
        pointerEvents: 'none'
      }} />

      {/* Main Glassmorphic Card */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: 460,
        background: 'rgba(23, 25, 28, 0.94)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 16,
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)',
        overflow: 'hidden'
      }}>
        {/* Card Header with Technical Brand Icon */}
        <div style={{
          padding: '28px 28px 20px 28px',
          textAlign: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div style={{
            width: 56,
            height: 56,
            margin: '0 auto 14px auto',
            borderRadius: 14,
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.15)'
          }}>
            <img 
              src="./assets/icon.png" 
              alt="REDDOT Workstation" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          </div>

          <h2 style={{
            margin: '0 0 6px 0',
            fontSize: 19,
            fontWeight: 800,
            letterSpacing: '0.04em',
            color: '#FFFFFF'
          }}>
            REDDOT WS
          </h2>
          <div style={{
            fontSize: 11.5,
            color: '#94A3B8',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6
          }}>
            <Shield size={12} color="#94A3B8" />
            <span>Enterprise REDDOT WS • Verified Authentication Gate</span>
          </div>
        </div>

        {/* Auth Mode Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(15, 23, 42, 0.3)'
        }}>
          <button
            type="button"
            onClick={() => { setActiveTab('google'); setErrorMsg(''); }}
            style={{
              flex: 1,
              padding: '12px 14px',
              background: activeTab === 'google' ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'google' ? '2px solid #FFFFFF' : '2px solid transparent',
              color: activeTab === 'google' ? '#FFFFFF' : '#94A3B8',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.15s ease'
            }}
          >
            {/* Google SVG Icon */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h2v-6h-2v6zm1-8.25c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25z"/>
            </svg>
            <span>Google Workspace ID</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('credentials'); setErrorMsg(''); }}
            style={{
              flex: 1,
              padding: '12px 14px',
              background: activeTab === 'credentials' ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'credentials' ? '2px solid #FFFFFF' : '2px solid transparent',
              color: activeTab === 'credentials' ? '#FFFFFF' : '#94A3B8',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.15s ease'
            }}
          >
            <KeyRound size={14} />
            <span>Passphrase Sign In</span>
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px 28px' }}>
          {errorMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 14px',
              borderRadius: 8,
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              color: '#F1F5F9',
              fontSize: 12,
              marginBottom: 16
            }}>
              <AlertCircle size={15} color="#E2E8F0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {activeTab === 'google' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'center' }}>
              <div style={{ padding: '8px 0' }}>
                <p style={{ margin: '0 0 6px 0', fontSize: 13, color: '#E2E8F0', fontWeight: 600 }}>
                  Single Sign-On with Google / Gmail ID
                </p>
                <p style={{ margin: 0, fontSize: 11.5, color: '#94A3B8', lineHeight: 1.5 }}>
                  Sign in with your verified company Google account. Once verified, real-time database synchronizations and full workstation privileges will activate automatically.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '13px 18px',
                  background: '#FFFFFF',
                  color: '#0F172A',
                  border: '1px solid #FFFFFF',
                  borderRadius: 10,
                  fontSize: 13.5,
                  fontWeight: 700,
                  cursor: isLoading ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                  transition: 'transform 0.15s ease, opacity 0.15s ease',
                  opacity: isLoading ? 0.75 : 1
                }}
                onMouseEnter={e => { if (!isLoading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Verifying with Google...</span>
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                    </svg>
                    <span>Sign in with Google / Gmail ID</span>
                  </>
                )}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 4 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: '#94A3B8', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    style={{ accentColor: '#CBD5E1', cursor: 'pointer' }}
                  />
                  <span>Keep me signed in on this workstation</span>
                </label>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCredentialLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94A3B8', marginBottom: 6, letterSpacing: '0.04em' }}>
                  WORKSPACE EMAIL
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: 12, top: 12, color: '#94A3B8' }} />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="e.g. jagadish2k2006@gmail.com"
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 36px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: 8,
                      color: '#FFFFFF',
                      fontSize: 13,
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94A3B8', marginBottom: 6, letterSpacing: '0.04em' }}>
                  PASSWORD / PASSPHRASE
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: 12, top: 12, color: '#94A3B8' }} />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter security passphrase"
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 36px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: 8,
                      color: '#FFFFFF',
                      fontSize: 13,
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: '#CBD5E1', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    style={{ accentColor: '#CBD5E1', cursor: 'pointer' }}
                  />
                  <span>Remember session on this device</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  marginTop: 8,
                  padding: '12px 16px',
                  background: '#FFFFFF',
                  color: '#0F172A',
                  border: '1px solid #FFFFFF',
                  borderRadius: 9,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: isLoading ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
                  transition: 'opacity 0.15s ease',
                  opacity: isLoading ? 0.75 : 1
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Workstation</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer note */}
          <div style={{
            marginTop: 20,
            paddingTop: 14,
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            textAlign: 'center',
            fontSize: 11,
            color: '#64748B'
          }}>
            <span>Secured via Cloud Firestore Realtime Mesh & Local Vault</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthScreen;
