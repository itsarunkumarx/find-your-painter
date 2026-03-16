import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useLocation, Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { FaTachometerAlt, FaUser } from 'react-icons/fa';

const DashboardHeader = () => {
    const { user } = useAuth();
    const location = useLocation();

    const getPageTitle = () => {
        const path = location.pathname;
        if (path.includes('dashboard')) return 'Dashboard';
        if (path.includes('explore')) return 'Explore Experts';
        if (path.includes('bookings')) return 'Mission Log';
        if (path.includes('messages')) return 'Secure Comms';
        if (path.includes('notifications')) return 'Intelligence Hub';
        if (path.includes('audio-protocols')) return 'Audio Protocols';
        if (path.includes('profile')) return 'Identity Profile';
        if (path.includes('admin-analytics')) return 'System Analytics';
        if (path.includes('admin-support')) return 'Support Terminal';
        if (path.includes('admin-users')) return 'User Matrix';
        if (path.includes('admin-workers')) return 'Worker Node';
        if (path.includes('admin-settings')) return 'Global Config';
        if (path.includes('admin-notifications')) return 'Broadcast Center';
        if (path.includes('audit-logs')) return 'Audit Vault';
        return 'PainterPro';
    };

    const getSubtitle = () => {
        const path = location.pathname;
        if (path.includes('admin')) return 'SYSTEM ADMINISTRATION OVERRIDE';
        if (path.includes('audio-protocols')) return 'CUSTOMIZE YOUR COMMUNICATION AESTHETICS';
        return 'OPERATIONAL COMMAND CENTER';
    };

    return (
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10 transition-all duration-500">
            <div>
                <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-main)] tracking-tight uppercase">
                    {getPageTitle().split(' ')[0]} <span className="text-royal-gold">{getPageTitle().split(' ').slice(1).join(' ')}</span>
                </h1>
                <p className="text-[var(--text-muted)] text-[8px] sm:text-[10px] mt-1 font-black uppercase tracking-[0.3em]">
                    {getSubtitle()}
                </p>
            </div>

            <div className="flex items-center gap-3 ml-auto sm:ml-0">
                <ThemeToggle />
                <div className="w-10 h-10 sm:w-12 sm:h-12 glass-card flex items-center justify-center border-royal-gold/20 hover:border-royal-gold transition-all duration-500 group cursor-pointer overflow-hidden p-0">
                     <img 
                        src={user?.profileImage || "/assets/premium-avatar.png"} 
                        alt="U" 
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 shadow-inner"
                     />
                </div>
            </div>
        </header>
    );
};

export default DashboardHeader;
