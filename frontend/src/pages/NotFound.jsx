import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const NotFound = () => (
    <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-base, #0f0f14)',
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        textAlign: 'center',
        padding: '24px',
    }}>
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(212,175,55,0.2)',
                borderRadius: '16px',
                padding: '56px 48px',
                maxWidth: '480px',
                width: '100%',
            }}
        >
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔍</div>
            <h1 style={{ fontSize: '72px', fontWeight: '900', color: '#d4af37', margin: '0 0 8px' }}>404</h1>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#f5f5f5', marginBottom: '12px' }}>
                Page Not Found
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', lineHeight: '1.6', marginBottom: '32px' }}>
                The page you're looking for doesn't exist or has been moved.
            </p>
            <Link
                to="/"
                style={{
                    display: 'inline-block',
                    background: 'linear-gradient(135deg, #d4af37, #f0d060)',
                    color: '#0f0f14',
                    padding: '12px 28px',
                    borderRadius: '8px',
                    fontWeight: '800',
                    fontSize: '14px',
                    textDecoration: 'none',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                }}
            >
                Go Home
            </Link>
        </motion.div>
    </div>
);

export default NotFound;
