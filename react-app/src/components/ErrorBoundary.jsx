import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ERROR_BOUNDARY] Caught error in view:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: 32,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          textAlign: 'center',
          color: 'var(--text-primary)'
        }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>View Recovery Notice</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 500, marginBottom: 20, fontSize: 13 }}>
            An unexpected error occurred while displaying this module. You can return to Dashboard or reset this view.
          </p>
          <div style={{ padding: '8px 16px', background: 'var(--bg-card)', borderRadius: 6, fontFamily: 'monospace', fontSize: 11, marginBottom: 20, color: '#f87171' }}>
            {this.state.error?.message || 'Component failed to render'}
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Reload Module
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
