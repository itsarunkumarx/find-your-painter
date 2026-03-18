import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Detailed logging for developers
        if (import.meta.env.DEV) {
            console.group('%c[ErrorBoundary] Critical Failure Detected', 'color: #ff4d4d; font-weight: bold; font-size: 14px;');
            console.error('Error Object:', error);
            console.error('Component Stack Trace:', errorInfo.componentStack);
            console.groupEnd();
        } else {
            // Production silent logging
            console.warn('[ErrorBoundary] Caught runtime error. Suppressing stack trace in production.');
        }
        this.setState({ errorInfo });
    }

    handleReload = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
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
                    background: 'linear-gradient(135deg, #0a0a0e 0%, #12121a 100%)',
                    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                    padding: '24px',
                    textAlign: 'center',
                }}>
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(212,175,55,0.15)',
                        borderRadius: '24px',
                        padding: '60px 48px',
                        maxWidth: '520px',
                        width: '100%',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        backdropFilter: 'blur(10px)',
                    }}>
                        <div style={{ 
                            fontSize: '64px', 
                            marginBottom: '24px',
                            filter: 'drop-shadow(0 0 10px rgba(212,175,55,0.3))'
                        }}>⚠️</div>
                        
                        <h1 style={{
                            fontSize: '28px',
                            fontWeight: '900',
                            color: '#ffffff',
                            marginBottom: '16px',
                            letterSpacing: '-0.02em',
                        }}>
                            Operational Disruption
                        </h1>
                        
                        <p style={{
                            color: 'rgba(255,255,255,0.5)',
                            fontSize: '15px',
                            lineHeight: '1.7',
                            marginBottom: '40px',
                            maxWidth: '380px',
                            marginInline: 'auto'
                        }}>
                            The platform encountered an unexpected runtime anomaly. Operational protocols recommend a full system refresh.
                        </p>

                        <button
                            onClick={handleReload}
                            style={{
                                background: 'linear-gradient(135deg, #d4af37, #f0d060)',
                                color: '#000000',
                                border: 'none',
                                borderRadius: '12px',
                                padding: '16px 36px',
                                fontSize: '14px',
                                fontWeight: '900',
                                cursor: 'pointer',
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 10px 15px -3px rgba(212,175,55,0.3)',
                            }}
                            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                        >
                            Execute System Restart
                        </button>

                        {import.meta.env.DEV && this.state.error && (
                            <div style={{ 
                                marginTop: '40px', 
                                textAlign: 'left', 
                                background: 'rgba(0,0,0,0.3)', 
                                padding: '16px', 
                                borderRadius: '8px',
                                fontSize: '10px',
                                color: '#ff4d4d',
                                fontFamily: 'monospace',
                                overflow: 'auto',
                                maxHeight: '150px',
                                borderLeft: '3px solid #ff4d4d'
                            }}>
                                <strong>[DEV TOOLS] Root Cause:</strong><br/>
                                {this.state.error.toString()}
                            </div>
                        )}
                    </div>
                    
                    <p style={{ 
                        marginTop: '24px', 
                        fontSize: '10px', 
                        color: 'rgba(255,255,255,0.2)', 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.4em' 
                    }}>
                        Find Your Painter &bull; Authority Layer
                    </p>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
