import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPaintBrush, FaUser, FaSignOutAlt, FaBars, FaTimes, FaTachometerAlt } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import ThemeToggle from './ThemeToggle';
import fastApi from '../utils/fastApi';

const Navbar = () => {
    const { t } = useTranslation();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const handleLogout = () => {
        logout();
        navigate('/');
        setMenuOpen(false);
    };

    const getDashboardPath = () => {
        if (!user) return '/roles';
        if (user.role === 'admin') return '/admin-dashboard';
        if (user.role === 'worker') return '/worker-dashboard';
        return '/user-dashboard';
    };

    const isHome = location.pathname === '/';

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--glass-bg)] backdrop-blur-xl border-b border-[var(--glass-border)] shadow-sm transition-colors duration-500">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">

                <Link to="/" className="flex items-center gap-2 sm:gap-3 group">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
                        <FaPaintBrush className="text-white text-base sm:text-lg" />
                    </div>
                    <div className="hidden xs:block">
                        <div className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-royal-gold">{t('premium_label')}</div>
                        <div className="text-xs sm:text-sm font-black uppercase tracking-widest text-[var(--text-main)] leading-tight">{t('app_title')}</div>
                    </div>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-6">
                    {user ? (
                        <>
                            <Link
                                to={getDashboardPath()}
                                onMouseEnter={() => fastApi.prefetch(getDashboardPath() === '/user-dashboard' ? '/bookings/user' : '/bookings/worker')}
                                className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] hover:text-royal-gold transition-colors duration-300"
                            >
                                <FaTachometerAlt className="text-royal-gold" />
                                {t('dashboard_btn')}
                            </Link>

                            <Link
                                to="/profile-settings"
                                onMouseEnter={() => fastApi.prefetch('/auth/me')}
                                className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] hover:text-royal-gold transition-colors duration-300"
                            >
                                <FaUser className="text-royal-gold" />
                                {user.name?.split(' ')[0] || t('profile_fallback')}
                            </Link>

                            <div className="pl-2 border-l border-[var(--glass-border)]">
                                <ThemeToggle />
                            </div>
                        </>
                    ) : (
                        <>
                            {!isHome && (
                                <Link
                                    to="/"
                                    className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] hover:text-royal-gold transition-colors duration-300"
                                >
                                    {t('home_btn')}
                                </Link>
                            )}
                            <Link
                                to="/roles"
                                className="flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-[var(--bg-base)] text-[11px] font-black uppercase tracking-[0.2em] px-6 py-3 rounded-xl transition-all duration-300 shadow-md hover:shadow-yellow-200 hover:scale-105"
                            >
                                {t('get_started_btn')}
                            </Link>

                            <div className="pl-2">
                                <ThemeToggle />
                            </div>
                        </>
                    )}
                </div>

                {/* Mobile Toggle */}
                <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl border border-[var(--glass-border)] text-[var(--text-main)] hover:border-yellow-400 hover:text-yellow-600 transition-all duration-300"
                >
                    {menuOpen ? <FaTimes /> : <FaBars />}
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {menuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-[var(--bg-base)] border-t border-[var(--glass-border)] px-6 pb-6 space-y-3 overflow-hidden transition-colors duration-500"
                    >
                        <div className="flex justify-center py-4 border-b border-[var(--glass-border)] gap-4 items-center">
                            <ThemeToggle />
                        </div>
                        {user ? (
                            <>
                                <Link
                                    to={getDashboardPath()}
                                    onClick={() => setMenuOpen(false)}
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--bg-highlight)]/50 text-[11px] font-black uppercase tracking-[0.2em] text-[var(--text-main)] transition-colors"
                                >
                                    <FaTachometerAlt className="text-royal-gold" /> {t('dashboard_btn')}
                                </Link>
                                <Link
                                    to="/profile-settings"
                                    onClick={() => setMenuOpen(false)}
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--bg-highlight)]/50 text-[11px] font-black uppercase tracking-[0.2em] text-[var(--text-main)] transition-colors"
                                >
                                    <FaUser className="text-royal-gold" /> {user.name?.split(' ')[0] || t('profile_fallback')}
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/"
                                    onClick={() => setMenuOpen(false)}
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--bg-highlight)]/50 text-[11px] font-black uppercase tracking-[0.2em] text-[var(--text-main)] transition-colors"
                                >
                                    {t('home_btn')}
                                </Link>
                                <Link
                                    to="/roles"
                                    onClick={() => setMenuOpen(false)}
                                    className="flex items-center justify-center gap-3 p-3 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600 text-[var(--bg-base)] text-[11px] font-black uppercase tracking-[0.2em]"
                                >
                                    {t('get_started_btn')}
                                </Link>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </nav >
    );
};

export default Navbar;
