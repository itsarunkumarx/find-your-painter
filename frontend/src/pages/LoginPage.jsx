import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'framer-motion';
import { FaGoogle } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useGoogleLogin } from '@react-oauth/google';

const LoginPage = () => {
    const { role } = useParams();
    const { login, googleLogin } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const res = await login(email, password);
        setLoading(false);
        if (res.success) {
            const userRole = res.user?.role || role;
            if (userRole === 'admin') navigate('/admin-dashboard');
            else if (userRole === 'worker') navigate('/worker-dashboard');
            else navigate('/user-dashboard');
        } else {
            setError(res.message);
        }
    };

    const signInWithGoogle = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setGoogleLoading(true);
            setError('');
            const res = await googleLogin(tokenResponse.access_token);
            setGoogleLoading(false);
            if (res.success) {
                const userRole = res.user?.role;
                if (userRole === 'admin') navigate('/admin-dashboard');
                else if (userRole === 'worker') navigate('/worker-dashboard');
                else navigate('/user-dashboard');
            } else {
                setError(res.message || t('action_failed'));
            }
        },
        onError: () => {
            setError(t('action_failed'));
        },
    });

    return (
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center py-20 px-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="glass-card p-8 sm:p-10 md:p-14 w-full max-w-lg relative overflow-hidden"
            >
                {/* Authority Badge */}
                <div className="absolute top-0 right-0 p-8 opacity-20 text-[10px] font-black tracking-[0.4em] uppercase text-yellow-500">
                    {t('job_id')}: {role?.toUpperCase() || "GATEWAY"}
                </div>

                <div className="text-center mb-10 relative z-10 px-2">
                    <div className="subtitle-royal justify-center text-royal-gold">
                        {t('login_title')}
                    </div>
                    <h2 className="title-royal text-4xl sm:text-5xl md:text-6xl mb-4 sm:mb-6 bg-gradient-to-b from-[var(--text-main)] to-[var(--text-muted)] bg-clip-text text-transparent">
                        {role === 'worker' ? t('welcome_back_worker') : role === 'admin' ? t('welcome_back_admin') : t('welcome_back_user')}
                    </h2>
                    <p className="text-[var(--text-muted)] font-bold uppercase tracking-widest text-[8px] sm:text-[10px] opacity-60">{t('elite_portal')}</p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-8 text-center text-xs font-bold uppercase tracking-wider"
                    >
                        {t('error_prefix')}: {error}
                    </motion.div>
                )}

                {role === 'worker' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-royal-gold/10 border border-royal-gold/20 text-royal-gold p-4 rounded-xl mb-8 text-center space-y-2"
                    >
                        <p className="text-[10px] font-black uppercase tracking-widest">{t('default_protocol')}</p>
                        <p className="text-xs font-bold">{t('password_term')}: <span className="bg-royal-gold/20 px-2 py-0.5 rounded ml-1">worker@123</span></p>
                        <p className="text-[9px] opacity-60 uppercase tracking-widest">{t('entry_granted_tip')}</p>
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] ml-4">{t('email_label')}</label>
                        <input
                            type="email"
                            placeholder={t('email_placeholder')}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input-field"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] ml-4">{t('password_label')}</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input-field"
                            required
                        />
                    </div>

                    <button type="submit" disabled={loading} className="w-full btn-primary !rounded-2xl shadow-xl flex items-center justify-center gap-3">
                        {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        {loading ? t('authorizing') : t('sign_in_now')}
                    </button>
                </form>

                {/* Divider */}
                <div className="relative my-12">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200"></div>
                    </div>
                    <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.4em]">
                        <span className="bg-[#FDFBF7] px-6 text-slate-400">{t('secure_entry')}</span>
                    </div>
                </div>

                {/* Google Sign-In Button */}
                <button
                    onClick={() => signInWithGoogle()}
                    disabled={googleLoading}
                    className="w-full flex items-center justify-center gap-4 bg-[var(--bg-base)] border border-[var(--glass-border)] hover:border-yellow-500/50 hover:bg-[var(--bg-highlight)]/50 text-[var(--text-main)] font-black uppercase tracking-[0.2em] text-[11px] py-6 rounded-2xl transition-all duration-500 shadow-lg group disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    <div className="w-8 h-8 bg-[var(--bg-base)] border border-[var(--glass-border)] rounded-lg flex items-center justify-center shadow-sm group-hover:scale-110 transition-all duration-500">
                        {googleLoading ? (
                            <div className="w-4 h-4 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" />
                        ) : (
                            <FaGoogle className="text-yellow-600 text-lg" />
                        )}
                    </div>
                    <span>{googleLoading ? t('signing_in') : t('continue_google')}</span>
                </button>

                {role !== 'admin' && role !== 'worker' && (
                    <p className="mt-12 text-center text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">
                        {t('new_to_network')} <span className="text-yellow-600 cursor-pointer hover:text-yellow-700 transition-colors" onClick={() => navigate(`/register/${role}`)}>{t('create_identity')}</span>
                    </p>
                )}

                {role === 'worker' && (
                    <p className="mt-12 text-center text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] opacity-40">
                        {t('worker_registration_disabled') || 'Worker registration managed by Administrative Layer'}
                    </p>
                )}
            </motion.div>
        </div>
    );
};

export default LoginPage;
