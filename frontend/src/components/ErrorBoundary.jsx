import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log to console only — never render stack trace in the UI
        console.warn('[ErrorBoundary] Caught error:', error?.message || error);
        console.warn('[ErrorBoundary] Component stack:', errorInfo?.componentStack);
    }

    handleReload = () => {
        this.setState({ hasError: false });
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #0f0f14 0%, #1a1a24 100%)',
                    fontFamily: "'Inter', 'Segoe UI', sans-serif",
                    padding: '24px',
                    textAlign: 'center',
                }}>
                    <div style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(212,175,55,0.2)',
                        borderRadius: '16px',
                        padding: '48px 40px',
                        maxWidth: '480px',
                        width: '100%',
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
                        <h1 style={{
                            fontSize: '22px',
                            fontWeight: '800',
                            color: '#f5f5f5',
                            marginBottom: '12px',
                            letterSpacing: '0.02em',
                        }}>
                            Something went wrong
                        </h1>
                        <p style={{
                            color: 'rgba(255,255,255,0.55)',
                            fontSize: '14px',
                            lineHeight: '1.6',
                            marginBottom: '32px',
                        }}>
                            Something went wrong. Please refresh the page.
                        </p>
                        <button
                            onClick={this.handleReload}
                            style={{
                                background: 'linear-gradient(135deg, #d4af37, #f0d060)',
                                color: '#0f0f14',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '12px 28px',
                                fontSize: '14px',
                                fontWeight: '800',
                                cursor: 'pointer',
                                letterSpacing: '0.05em',
                                textTransform: 'uppercase',
                            }}
                        >
                            Return to Home
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
