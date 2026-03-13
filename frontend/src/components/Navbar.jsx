import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPaintBrush, FaUser, FaSignOutAlt, FaBars, FaTimes, FaTachometerAlt } from 'react-icons/fa';
import ThemeToggle from './ThemeToggle';

const Navbar = () => {
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

                {/* Logo */}
                <Link to="/" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
                        <FaPaintBrush className="text-white text-lg" />
                    </div>
                    <div className="hidden sm:block">
                        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-royal-gold">Premium</div>
                        <div className="text-sm font-black uppercase tracking-widest text-[var(--text-main)] leading-tight">Find Your Painter</div>
                    </div>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-6">
                    {user ? (
                        <>
                            <Link
                                to={getDashboardPath()}
                                className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] hover:text-royal-gold transition-colors duration-300"
                            >
                                <FaTachometerAlt className="text-royal-gold" />
                                Dashboard
                            </Link>

                            <Link
                                to="/profile-settings"
                                className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] hover:text-royal-gold transition-colors duration-300"
                            >
                                <FaUser className="text-royal-gold" />
                                {user.name?.split(' ')[0] || 'Profile'}
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
                                    Home
                                </Link>
                            )}
                            <Link
                                to="/roles"
                                className="flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-[var(--bg-base)] text-[11px] font-black uppercase tracking-[0.2em] px-6 py-3 rounded-xl transition-all duration-300 shadow-md hover:shadow-yellow-200 hover:scale-105"
                            >
                                Get Started
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
                                    <FaTachometerAlt className="text-royal-gold" /> Dashboard
                                </Link>
                                <Link
                                    to="/profile-settings"
                                    onClick={() => setMenuOpen(false)}
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--bg-highlight)]/50 text-[11px] font-black uppercase tracking-[0.2em] text-[var(--text-main)] transition-colors"
                                >
                                    <FaUser className="text-royal-gold" /> {user.name?.split(' ')[0] || 'Profile'}
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/"
                                    onClick={() => setMenuOpen(false)}
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--bg-highlight)]/50 text-[11px] font-black uppercase tracking-[0.2em] text-[var(--text-main)] transition-colors"
                                >
                                    Home
                                </Link>
                                <Link
                                    to="/roles"
                                    onClick={() => setMenuOpen(false)}
                                    className="flex items-center justify-center gap-3 p-3 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600 text-[var(--bg-base)] text-[11px] font-black uppercase tracking-[0.2em]"
                                >
                                    Get Started
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
