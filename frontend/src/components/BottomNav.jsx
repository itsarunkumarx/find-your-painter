import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import fastApi from '../utils/fastApi';
import { 
    FaHome, FaSearch, FaComments, FaBell, FaUser, 
    FaInbox, FaTachometerAlt, FaShieldAlt, FaUsers, FaChartPie, FaBars, FaSignOutAlt
} from 'react-icons/fa';

const BottomNav = ({ setIsOpen }) => {
    const { user } = useAuth();
    const location = useLocation();
    const { t } = useTranslation();

    const getNavLinks = () => {
        switch (user?.role) {
            case 'worker':
                return [
                    { path: '/worker-dashboard', icon: <FaTachometerAlt />, label: t('dashboard') },
                    { path: '/worker-jobs', icon: <FaInbox />, label: t('nav_my_jobs') },
                    { path: '/messages', icon: <FaComments />, label: t('nav_messages') },
                    { path: '/notifications', icon: <FaBell />, label: t('nav_notifications') },
                    { type: 'button', onClick: () => setIsOpen(true), icon: <FaBars />, label: t('nav_menu') },
                ];
            case 'admin':
                return [
                    { path: '/admin-dashboard', icon: <FaChartPie />, label: t('nav_overview') },
                    { path: '/admin-users', icon: <FaUsers />, label: t('nav_manage_users') },
                    { path: '/messages', icon: <FaComments />, label: t('nav_messages') },
                    { path: '/notifications', icon: <FaBell />, label: t('nav_notifications') },
                    { type: 'button', onClick: () => setIsOpen(true), icon: <FaBars />, label: t('nav_menu') },
                ];
            default:
                return [
                    { path: '/user-dashboard', icon: <FaHome />, label: t('dashboard') },
                    { path: '/explore', icon: <FaSearch />, label: t('nav_explore') },
                    { path: '/messages', icon: <FaComments />, label: t('nav_messages') },
                    { path: '/notifications', icon: <FaBell />, label: t('nav_notifications') },
                    { type: 'button', onClick: () => setIsOpen(true), icon: <FaBars />, label: t('nav_menu') },
                ];
        }
    };

    const links = getNavLinks();

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-[var(--bg-base)]/80 backdrop-blur-2xl border-t border-[var(--glass-border)] z-50 lg:hidden px-2 pb-safe-area-inset-bottom">
            <div className="flex items-center justify-around h-16 max-w-md mx-auto">
                {links.map((link, idx) => {
                    const isActive = location.pathname === link.path;
                    if (link.type === 'button') {
                        return (
                            <button
                                key={idx}
                                onClick={link.onClick}
                                className="flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all relative text-[var(--text-muted)] hover:text-royal-gold"
                            >
                                <div className="text-xl">
                                    {link.icon}
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-tighter truncate w-full text-center px-1">
                                    {link.label}
                                </span>
                            </button>
                        );
                    }
                    return (
                        <Link
                            key={link.path}
                            to={link.path}
                            onMouseEnter={() => {
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
                            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all relative ${
                                isActive ? 'text-royal-gold font-bold' : 'text-[var(--text-muted)]'
                            }`}
                        >
                            <motion.div
                                animate={isActive ? { scale: 1.2, y: -2 } : { scale: 1, y: 0 }}
                                className="text-xl"
                            >
                                {link.icon}
                            </motion.div>
                            <span className="text-[9px] font-black uppercase tracking-tighter truncate w-full text-center px-1">
                                {link.label}
                            </span>
                            {isActive && (
                                <motion.div
                                    layoutId="bottom-nav-active"
                                    className="absolute -top-[1px] w-8 h-[2px] bg-royal-gold rounded-full"
                                />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNav;
