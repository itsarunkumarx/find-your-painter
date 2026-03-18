import { useState, useEffect } from 'react';
import api from '../utils/api';
import fastApi from '../utils/fastApi';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaUserSlash, FaUserCheck, FaEnvelope, FaCalendarAlt, FaShieldAlt, FaUserTimes, FaTrash } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import ConfirmationModal from '../components/ConfirmationModal';
import { toast } from 'react-hot-toast';

const AdminUserManagement = () => {
    const { t } = useTranslation();
    if (!t) return null;
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all'); // all, blocked, active, suspended
    const [modalConfig, setModalConfig] = useState({ isOpen: false, type: 'danger', title: '', message: '', onConfirm: () => { } });

    const fetchUsers = async () => {
        if (users.length === 0) setLoading(true);
        try {
            // SWR Integration: Instant delivery from cache
            await fastApi.getWithCache('/admin/users', (data) => {
                setUsers(data || []);
                setLoading(false);
            });
        } catch (error) {
            if (import.meta.env.DEV) console.error('Fetch users failed', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const toggleBlock = (user) => {
        setModalConfig({
            isOpen: true,
            type: user.isBlocked ? 'active' : 'danger',
            title: user.isBlocked ? t('unblock_user_tooltip') : t('block_user_tooltip'),
            message: user.isBlocked ? `Are you sure you want to restore access for ${user.name}?` : `Are you sure you want to restrict access for ${user.name}?`,
            confirmText: user.isBlocked ? 'RESTORE ACCESS' : 'RESTRICT ACCESS',
            onConfirm: async () => {
                try {
                    await api.put(`/admin/users/${user._id}/block`, {});
                    toast.success(user.isBlocked ? 'User access restored' : 'User access restricted');
                    fetchUsers();
                } catch (error) {
                    toast.error('Operation failed');
                }
            }
        });
    };

    const toggleSuspend = (user) => {
        setModalConfig({
            isOpen: true,
            type: 'danger',
            title: user.isSuspended ? t('unsuspend_user_tooltip') : t('suspend_user_tooltip'),
            message: user.isSuspended ? `Are you sure you want to reactivate ${user.name}'s account?` : `Are you sure you want to suspend ${user.name}'s account? This will hide them from searches.`,
            confirmText: user.isSuspended ? 'REACTIVATE' : 'SUSPEND',
            onConfirm: async () => {
                try {
                    await api.put(`/admin/users/${user._id}/suspend`, {});
                    toast.success(user.isSuspended ? 'User reactivated' : 'User suspended');
                    fetchUsers();
                } catch (error) {
                    toast.error('Operation failed');
                }
            }
        });
    };

    const handleDeleteUser = (user) => {
        setModalConfig({
            isOpen: true,
            type: 'danger',
            title: t('delete_user_tooltip'),
            message: `CRITICAL: Are you sure you want to permanently delete ${user.name}'s account? This action is irreversible.`,
            confirmText: 'DELETE PERMANENTLY',
            onConfirm: async () => {
                try {
                    await api.delete(`/admin/users/${user._id}`);
                    toast.success('User deleted successfully');
                    fetchUsers();
                } catch (error) {
                    toast.error('Delete failed');
                }
            }
        });
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filter === 'all' ||
            (filter === 'blocked' && user.isBlocked) ||
            (filter === 'active' && !user.isBlocked && !user.isSuspended) ||
            (filter === 'suspended' && user.isSuspended);
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-navy-deep tracking-tight uppercase">{t('user') || 'User'} <span className="text-royal-gold">{t('management') || 'Management'}</span></h1>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">{t('control_monitor_access')}</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-deep/20 text-xs" />
                        <input
                            type="text"
                            placeholder={t('search_users_placeholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-white border border-royal-gold/10 rounded-2xl py-3 pl-11 pr-4 text-xs font-bold text-navy-deep focus:outline-none focus:border-royal-gold w-64 shadow-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="flex gap-2">
                {['all', 'active', 'suspended', 'blocked',].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-navy-deep text-royal-gold shadow-lg' : 'bg-white text-slate-400 border border-royal-gold/10 hover:border-royal-gold/30'
                            }`}
                    >
                        {f === 'all' ? t('tab_all') : f === 'active' ? t('status_active') : f === 'suspended' ? t('status_suspended') : t('status_blocked')}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-[2.5rem] border border-royal-gold/10 shadow-2xl shadow-royal-gold/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-ivory-subtle/30 border-b border-royal-gold/5">
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-navy-deep/40">{t('user') || 'User'}</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-navy-deep/40">{t('status_label') || 'Status'}</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-navy-deep/40">{t('joined_label')}</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-navy-deep/40 text-right">{t('actions_label')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-royal-gold/5">
                            <AnimatePresence mode="popLayout">
                                {filteredUsers.map((user, i) => (
                                    <motion.tr
                                        key={user._id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                        className="hover:bg-ivory-subtle/20 transition-colors group"
                                    >
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <img
                                                    src={user.profileImage || "/assets/premium-avatar.png"}
                                                    className="w-10 h-10 rounded-xl border border-royal-gold/10 grayscale group-hover:grayscale-0 transition-all"
                                                    alt=""
                                                />
                                                <div>
                                                    <p className="text-xs font-black text-navy-deep">{user.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 lowercase">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${user.isBlocked ? 'bg-red-50 text-red-500' : user.isSuspended ? 'bg-orange-50 text-orange-500' : 'bg-green-50 text-green-500'
                                                }`}>
                                                {user.isBlocked ? t('status_blocked') : user.isSuspended ? t('status_suspended') : t('status_active')}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                            {new Date(user.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end items-center gap-3">
                                                <button
                                                    onClick={() => toggleSuspend(user)}
                                                    className={`p-3 rounded-xl transition-all shadow-sm ${user.isSuspended ? 'bg-green-50 text-green-600 hover:bg-green-100 hover:scale-110' : 'bg-orange-50 text-orange-600 hover:bg-orange-100 hover:scale-110'
                                                        }`}
                                                    title={user.isSuspended ? t('unsuspend_user_tooltip') : t('suspend_user_tooltip')}
                                                >
                                                    <FaUserTimes size={14} />
                                                </button>
                                                <button
                                                    onClick={() => toggleBlock(user)}
                                                    className={`p-3 rounded-xl transition-all shadow-sm ${user.isBlocked ? 'bg-green-50 text-green-600 hover:bg-green-100 hover:scale-110' : 'bg-red-50 text-red-600 hover:bg-red-100 hover:scale-110'
                                                        }`}
                                                    title={user.isBlocked ? t('unblock_user_tooltip') : t('block_user_tooltip')}
                                                >
                                                    {user.isBlocked ? <FaUserCheck size={14} /> : <FaUserSlash size={14} />}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user)}
                                                    className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 hover:scale-110 shadow-sm transition-all"
                                                    title={t('delete_user_tooltip')}
                                                >
                                                    <FaTrash size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>

                    {filteredUsers.length === 0 && !loading && (
                        <div className="py-20 text-center">
                            <FaShieldAlt className="text-4xl text-royal-gold/10 mx-auto mb-4" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-navy-deep/20">{t('no_users_match')}</p>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmationModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                onConfirm={modalConfig.onConfirm}
                title={modalConfig.title}
                message={modalConfig.message}
                confirmText={modalConfig.confirmText}
                type={modalConfig.type}
            />
        </div>
    );
};

export default AdminUserManagement;
