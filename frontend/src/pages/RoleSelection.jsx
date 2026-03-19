import { motion } from 'framer-motion';
import { useNavigate, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaUser, FaPaintRoller, FaUserShield } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';

const RoleSelection = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { user } = useAuth();

    // Auto-redirect if already authenticated
    if (user) {
        if (user.role === 'admin') return <Navigate to="/admin-dashboard" replace />;
        if (user.role === 'worker') return <Navigate to="/worker-dashboard" replace />;
        return <Navigate to="/user-dashboard" replace />;
    }

    const roles = [
        {
            id: 'user',
            title: t('role_user_title'),
            subtitle: t('role_user_subtitle'),
            icon: <FaUser />,
            path: '/login/user',
            hoverColor: 'border-blue-500/30 shadow-blue-500/20'
        },
        {
            id: 'worker',
            title: t('role_worker_title'),
            subtitle: t('role_worker_subtitle'),
            icon: <FaPaintRoller />,
            path: '/login/worker',
            hoverColor: 'border-yellow-500/30 shadow-yellow-500/20'
        },
        {
            id: 'admin',
            title: t('role_admin_title'),
            subtitle: t('role_admin_subtitle'),
            icon: <FaUserShield />,
            path: '/login/admin',
            hoverColor: 'border-purple-500/30 shadow-purple-500/20'
        },
    ];

    return (
        <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center py-20 px-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="max-w-7xl w-full"
            >
                <div className="text-center mb-20">
                    <div className="subtitle-royal justify-center">
                        {t('gateway_access')}
                    </div>
                    <h2 className="title-royal">
                        {t('choose_portal')}
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {roles.map((role, idx) => (
                        <motion.div
                            key={role.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.15, duration: 0.8 }}
                            whileHover={{ y: -10 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate(role.path)}
                            className={`glass-card group p-12 flex flex-col items-center justify-center cursor-pointer text-center relative overflow-hidden`}
                        >
                            {/* Accent Glow */}
                            <div className="absolute inset-x-0 bottom-0 h-1.5 bg-yellow-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-center z-10"></div>

                            <div className="w-20 h-20 rounded-full bg-[var(--bg-highlight)] border border-royal-gold/10 flex items-center justify-center text-3xl text-royal-gold mb-8 transition-all duration-700 group-hover:scale-110 group-hover:border-royal-gold/40 group-hover:shadow-[0_0_30px_rgba(212,175,55,0.2)]">
                                {role.icon}
                            </div>

                            <h3 className="text-2xl font-black text-[var(--text-main)] mb-3 uppercase tracking-widest group-hover:text-royal-gold transition-colors duration-500">
                                {role.title}
                            </h3>

                            <p className="text-[var(--text-muted)] font-medium leading-relaxed max-w-[200px]">
                                {role.subtitle}
                            </p>

                            <div className="mt-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500 text-[10px] font-black uppercase tracking-[0.3em] text-royal-gold">
                                {t('enter_portal')}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

export default RoleSelection;
