import { useState, useEffect, memo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import fastApi from '../utils/fastApi';
import { useSocket } from '../hooks/useSocket';
import {
    FaHome, FaCalendarAlt, FaUser, FaSignOutAlt,
    FaBars, FaTimes, FaTachometerAlt, FaChartPie,
    FaUsers, FaShieldAlt, FaSearch, FaComments,
    FaBell, FaHeart, FaImages, FaRupeeSign,
    FaChartBar, FaHeadset, FaInbox, FaStar, FaUserTie, FaMusic, FaHistory, FaCog
} from 'react-icons/fa';

const SidebarItem = memo(({ link, isActive, isOpen, isMobile, setIsOpen }) => (
    <Link
        to={link.path}
        title={!isOpen ? link.label : ""}
        onClick={() => {
            if (isMobile) setIsOpen(false);
        }}
        onMouseEnter={() => {
            // Strategic prefetching based on role and path
            if (link.path === '/user-dashboard') fastApi.prefetch('/users/dashboard-data');
            if (link.path === '/worker-dashboard') {
                fastApi.prefetch('/bookings/worker-bookings');
                fastApi.prefetch('/workers/profile');
                fastApi.prefetch('/workers/earnings');
            }
            if (link.path === '/explore') fastApi.prefetch('/workers');
            if (link.path === '/my-bookings') fastApi.prefetch('/bookings/my-bookings');
            if (link.path === '/worker-jobs') fastApi.prefetch('/bookings/worker-bookings');
        }}
        className={`flex items-center gap-4 px-4 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all group relative ${isActive
            ? 'bg-[var(--text-main)] text-[var(--bg-base)] shadow-2xl shadow-royal-gold/20 font-bold'
            : 'text-[var(--text-main)] hover:bg-[var(--bg-highlight)] hover:text-[var(--text-main)]'
            }`}
    >
        <div className={`${isActive ? 'text-royal-gold' : 'text-[var(--text-muted)] group-hover:text-royal-gold'} transition-colors shrink-0 relative`}>
            {link.icon}
            {!isOpen && !isMobile && link.badge && (
                <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-royal-gold rounded-full flex items-center justify-center text-[7px] text-[var(--bg-base)] font-black">
                    {link.badge > 9 ? '9+' : link.badge}
                </span>
            )}
        </div>
        <AnimatePresence mode="wait">
            {(isMobile || isOpen) && (
                <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className={`whitespace-nowrap flex items-center gap-2 ${isActive ? 'text-[var(--bg-base)]' : 'text-[var(--text-main)] group-hover:text-[var(--text-main)]'}`}
                >
                    {link.label}
                    {link.badge && (
                        <span className="w-5 h-5 bg-royal-gold text-[var(--bg-base)] text-[9px] font-black rounded-full flex items-center justify-center">
                            {link.badge > 9 ? '9+' : link.badge}
                        </span>
                    )}
                </motion.span>
            )}
        </AnimatePresence>
        {isActive && (
            <motion.div
                layoutId="sidebar-active"
                className="absolute left-0 w-1.5 h-6 bg-royal-gold rounded-r-full"
            />
        )}
    </Link>
));

const Sidebar = ({ isOpen, setIsOpen, isMobile }) => {
    const { user, logout } = useAuth();
    const { socket } = useSocket();
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();
    const [unreadCount, setUnreadCount] = useState(0);
    const [unreadNotifs, setUnreadNotifs] = useState(0);

    useEffect(() => {
        if (!user) return;
        const fetchCounts = async () => {
            try {
                const [chatRes, notifRes] = await Promise.all([
                    api.get('/chat/unread-count'),
                    api.get('/notifications/unread-count'),
                ]);
                setUnreadCount(chatRes.data.total || 0);
                setUnreadNotifs(notifRes.data.count || 0);
            } catch (_) { }
        };
        fetchCounts();

        if (!socket) return;

        socket.on('new_message', (message) => {
            // Only increment if message is not from current user
            if ((message.sender?._id || message.sender) !== user._id) {
                setUnreadCount(prev => prev + 1);
            }
        });

        socket.on('messages_read', () => {
            // Refetch count to be accurate when messages are read
            fetchCounts();
        });

        socket.on('new_notification', (data) => {
            // If data contains userId, only increment if it matches
            if (data.userId && data.userId !== user._id) return;
            // If data contains targetRole (broadcast), only increment if it matches roles
            if (data.targetRole && data.targetRole !== 'all' && data.targetRole !== user.role) return;
            
            setUnreadNotifs(prev => prev + 1);
        });

        window.addEventListener('notifications_read', fetchCounts);

        return () => {
            socket.off('new_message');
            socket.off('messages_read');
            socket.off('new_notification');
            window.removeEventListener('notifications_read', fetchCounts);
        };
    }, [user, socket]);

    const makeLink = (path, icon, label, badge = null) => ({ path, icon, label, badge: badge > 0 ? badge : null });

    const roleLinks = {
        user: [
            makeLink('/user-dashboard', <FaHome />, t('dashboard')),
            makeLink('/explore', <FaSearch />, t('nav_explore')),
            makeLink('/my-bookings', <FaCalendarAlt />, t('nav_my_bookings')),
            makeLink('/saved-painters', <FaHeart />, t('nav_saved_painters')),
            makeLink('/messages', <FaComments />, t('nav_messages'), unreadCount),
            makeLink('/notifications', <FaBell />, t('nav_notifications'), unreadNotifs),
            makeLink('/call-history', <FaHistory />, t('nav_call_history')),
            makeLink('/raise-complaint', <FaHeadset />, t('nav_support')),
            makeLink('/audio-protocols', <FaMusic />, t('nav_audio_protocols')),
            makeLink('/profile-settings', <FaUser />, t('nav_profile')),
        ],
        worker: [
            makeLink('/worker-dashboard', <FaTachometerAlt />, t('dashboard')),
            makeLink('/worker-jobs', <FaInbox />, t('nav_my_jobs')),
            makeLink('/messages', <FaComments />, t('nav_messages'), unreadCount),
            makeLink('/my-portfolio', <FaImages />, t('nav_portfolio')),
            makeLink('/earnings', <FaRupeeSign />, t('nav_earnings')),
            makeLink('/worker-verification', <FaShieldAlt />, t('nav_verification')),
            makeLink('/notifications', <FaBell />, t('nav_notifications'), unreadNotifs),
            makeLink('/call-history', <FaHistory />, t('nav_call_history')),
            makeLink('/raise-complaint', <FaHeadset />, t('nav_support')),
            makeLink('/audio-protocols', <FaMusic />, t('nav_audio_protocols')),
            makeLink('/worker-profile', <FaUser />, t('nav_profile')),
        ],
        admin: [
            makeLink('/admin-dashboard', <FaChartPie />, t('nav_overview')),
            makeLink('/admin-users', <FaUsers />, t('nav_manage_users')),
            makeLink('/admin-workers', <FaUserTie />, t('nav_manage_workers')),
            makeLink('/admin-analytics', <FaChartBar />, t('nav_analytics')),
            makeLink('/admin-notifications', <FaBell />, t('nav_broadcast')),
            makeLink('/admin-support', <FaHeadset />, t('nav_support_centre')),
            makeLink('/audit-logs', <FaHistory />, t('nav_audit_logs')),
            makeLink('/admin-settings', <FaCog />, t('nav_platform_settings')),
            makeLink('/messages', <FaComments />, t('nav_messages'), unreadCount),
            makeLink('/notifications', <FaBell />, t('nav_notifications'), unreadNotifs),
            makeLink('/call-history', <FaHistory />, t('nav_call_history')),
            makeLink('/audio-protocols', <FaMusic />, t('nav_audio_protocols')),
            makeLink('/admin-profile', <FaUser />, t('nav_profile')),
        ],
    };

    const links = roleLinks[user?.role || 'user'] || [];

    const handleLogout = () => {
        logout();
        navigate('/roles');
    };

    return (
        <>
            {/* Mobile Backdrop Overlay */}
            <AnimatePresence>
                {isMobile && isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar Container */}
            <motion.aside
                initial={false}
                animate={{
                    // Always 280 on desktop, 280 on mobile (when open)
                    width: 280,
                    x: (isMobile && !isOpen) ? -280 : 0
                }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed left-0 top-0 h-screen bg-[var(--bg-base)] border-r border-[var(--glass-border)] z-[60] shadow-2xl overflow-hidden transition-colors duration-500"
            >
                <div className="flex flex-col h-full">
                    {/* Brand Signal & Integrated Toggle */}
                    <div className="flex items-center justify-between px-6 py-8 mb-6 border-b border-[var(--glass-border)] bg-[var(--bg-highlight)]/30">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-[var(--text-main)] rounded-xl flex items-center justify-center text-royal-gold shadow-xl shrink-0">
                                <FaStar size={20} />
                            </div>
                            <AnimatePresence>
                                {isOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        className="flex flex-col whitespace-nowrap"
                                    >
                                        <span className="text-sm font-black text-[var(--text-main)] tracking-tighter leading-none uppercase">Painter<span className="text-royal-gold">Pro</span></span>
                                        <span className="text-[8px] font-black text-royal-gold uppercase tracking-[0.4em] mt-1">Command Hub</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Unified Toggle Button (Mobile Only) */}
                        {isMobile && (
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className="p-2 hover:bg-[var(--bg-highlight)] rounded-xl text-[var(--text-muted)] hover:text-royal-gold transition-colors"
                            >
                                {isOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
                            </button>
                        )}
                    </div>

                    {/* Navigation Cluster */}
                    <nav className="flex-1 space-y-2 px-4 py-4 overflow-y-auto">
                        {links.map((link) => (
                            <SidebarItem
                                key={link.path + link.label}
                                link={link}
                                isActive={location.pathname === link.path}
                                isOpen={isOpen}
                                isMobile={isMobile}
                                setIsOpen={setIsOpen}
                            />
                        ))}
                    </nav>

                    <div className="p-4 border-t border-[var(--glass-border)] space-y-3">
                        <div className={`flex items-center gap-4 bg-[var(--bg-highlight)]/50 p-3 rounded-2xl border border-[var(--glass-border)] overflow-hidden ${(!isOpen && !isMobile) ? 'justify-center' : ''}`}>
                            <img
                                src={user?.profileImage || "/assets/premium-avatar.png"}
                                className="w-10 h-10 rounded-xl border border-royal-gold/20 shrink-0"
                                alt="U"
                                loading="lazy"
                            />
                            {(isMobile || isOpen) && (
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[10px] font-black text-[var(--text-main)] truncate">{user?.name || 'Guest'}</span>
                                    <span className="text-[8px] font-black text-royal-gold uppercase tracking-widest truncate">{user?.role || 'Guest'} Access</span>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </motion.aside >

            {/* Mobile Bottom Toggle - Removed in favor of BottomNav */}
        </>
    );
};

export default Sidebar;
