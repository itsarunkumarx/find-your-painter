import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaShieldAlt, FaEdit, FaUserCircle, FaServer, FaCodeBranch, FaKey } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';

const AdminProfile = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="max-w-4xl space-y-10 pb-12">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">
                        {t('root_intelligence').split(' ')[0]} <span className="text-royal-gold">{t('root_intelligence').split(' ')[1] || ''}</span>
                    </h1>
                    <p className="text-[var(--text-muted)] text-sm mt-1 uppercase font-black tracking-widest text-[10px]">{t('admin_intelligence')}</p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/profile-settings')}
                    className="flex items-center gap-2 px-6 py-3 bg-[var(--text-main)] text-royal-gold rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-royal-gold/20"
                >
                    <FaEdit /> {t('modify_protocols')}
                </motion.button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Admin Identity */}
                <div className="md:col-span-1 space-y-6">
                    <div className="glass-card p-10 flex flex-col items-center text-center relative overflow-hidden">
                        <div className="absolute -top-10 -left-10 w-32 h-32 bg-royal-gold/5 rounded-full blur-2xl"></div>
                        <div className="relative mb-6">
                            <img
                                src={user?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
                                className="w-32 h-32 rounded-[2.5rem] object-cover border-4 border-royal-gold/20 shadow-2xl"
                                alt="Admin Avatar"
                            />
                            <div className="absolute -bottom-2 -right-2 bg-navy-deep text-white p-2.5 rounded-xl border-4 border-[var(--bg-base)] shadow-xl">
                                <FaShieldAlt className="text-xs" />
                            </div>
                        </div>
                        <h3 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tight">{user?.name}</h3>
                        <p className="text-[10px] font-black text-royal-gold uppercase tracking-[0.3em] mt-1">{user?.role === 'admin' ? 'Super Admin' : 'Admin'}</p>
                    </div>

                    <div className="bg-navy-deep rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-royal-gold/10 transition-colors"></div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest mb-6 opacity-40">{t('system_access')}</h4>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-bold opacity-60">ADMIN_LEVEL</span>
                                <span className="text-[9px] font-black text-royal-gold uppercase">0 (GLOBAL)</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-bold opacity-60">{t('status').toUpperCase()}</span>
                                <span className="text-[8px] font-black uppercase bg-green-500/20 text-green-400 px-3 py-1 rounded-full border border-green-500/20">Active</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* System Specs */}
                <div className="md:col-span-2 space-y-6">
                    <div className="glass-card p-10 space-y-8">
                        <div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-6 ml-2">{t('account_metadata')}</h4>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="p-6 bg-[var(--bg-highlight)]/50 rounded-3xl border border-[var(--glass-border)] flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-[var(--text-main)] text-royal-gold rounded-xl flex items-center justify-center text-sm shadow-lg">
                                            <FaUserCircle />
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest">{t('email_identity')}</p>
                                            <p className="text-xs font-black text-[var(--text-main)]">{user?.email}</p>
                                        </div>
                                    </div>
                                    <FaKey className="text-royal-gold/20" />
                                </div>

                                <div className="p-6 bg-[var(--bg-highlight)]/50 rounded-3xl border border-[var(--glass-border)] flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-[var(--text-main)] text-royal-gold rounded-xl flex items-center justify-center text-sm shadow-lg">
                                            <FaServer />
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest">{t('platform_role')}</p>
                                            <p className="text-xs font-black text-[var(--text-main)] uppercase">{user?.role} Administrator</p>
                                        </div>
                                    </div>
                                    <FaCodeBranch className="text-royal-gold/20" />
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-[var(--glass-border)]">
                            <p className="text-[10px] text-[var(--text-muted)] font-medium leading-relaxed italic">
                                "Platform integrity is maintained through consistent monitoring and immediate protocol enforcement. As an administrator, your identity is linked to the core security layer."
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminProfile;
