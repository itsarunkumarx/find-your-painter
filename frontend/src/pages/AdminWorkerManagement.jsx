import { useState, useEffect } from 'react';
import api from '../utils/api';
import fastApi from '../utils/fastApi';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaUserSlash, FaUserCheck, FaPlus, FaCheck, FaTimes, FaMapMarkerAlt, FaToolbox, FaRupeeSign, FaShieldAlt, FaIdCard, FaImages, FaUserTimes, FaTrash } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '../components/ConfirmationModal';

const AdminWorkerManagement = () => {
    const { t } = useTranslation();
    if (!t) return null;
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all'); // all, verified, pending, rejected
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedWorker, setSelectedWorker] = useState(null);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [newWorker, setNewWorker] = useState({
        name: '', email: '', password: '', skills: '', experience: '', location: '', price: '', bio: ''
    });

    const [modalConfig, setModalConfig] = useState({ isOpen: false, type: 'danger', title: '', message: '', onConfirm: () => { } });
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchWorkers = async (showLoading = true) => {
        if (showLoading && workers.length === 0) setLoading(true);
        else setIsRefreshing(true);
        try {
            // SWR Integration: Instant delivery from cache
            await fastApi.getWithCache('/admin/workers', (data) => {
                setWorkers(data || []);
                setLoading(false);
            }, { forceRefresh: !showLoading });
        } catch (error) {
            if (import.meta.env.DEV) console.error('Fetch workers failed', error);
            setLoading(false);
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchWorkers();
        
        // Auto-refresh every 60 seconds
        const interval = setInterval(() => {
            fetchWorkers(false);
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    const toggleBlock = (worker) => {
        const user = worker.user;
        setModalConfig({
            isOpen: true,
            type: user?.isBlocked ? 'active' : 'danger',
            title: user?.isBlocked ? t('unblock_user_tooltip') : t('block_user_tooltip'),
            message: user?.isBlocked ? `Are you sure you want to restore access for ${user.name}?` : `Are you sure you want to restrict access for ${user.name}?`,
            confirmText: user?.isBlocked ? 'RESTORE ACCESS' : 'RESTRICT ACCESS',
            onConfirm: async () => {
                try {
                    await api.put(`/admin/workers/${worker._id}/block`, {});
                    toast.success(user?.isBlocked ? 'Worker access restored' : 'Worker access restricted');
                    fetchWorkers();
                } catch (error) {
                    toast.error('Operation failed');
                }
            }
        });
    };

    const toggleSuspend = (worker) => {
        const user = worker.user;
        setModalConfig({
            isOpen: true,
            type: 'danger',
            title: user?.isSuspended ? t('unsuspend_user_tooltip') : t('suspend_user_tooltip'),
            message: user?.isSuspended ? `Are you sure you want to reactivate ${user?.name}'s account?` : `Are you sure you want to suspend ${user?.name}'s account?`,
            confirmText: user?.isSuspended ? 'REACTIVATE' : 'SUSPEND',
            onConfirm: async () => {
                try {
                    await api.put(`/admin/workers/${worker._id}/suspend`, {});
                    toast.success(user?.isSuspended ? 'Worker reactivated' : 'Worker suspended');
                    fetchWorkers();
                } catch (error) {
                    toast.error('Operation failed');
                }
            }
        });
    };

    const handleDeleteWorker = (worker) => {
        setModalConfig({
            isOpen: true,
            type: 'danger',
            title: t('delete_user_tooltip'),
            message: `CRITICAL: Are you sure you want to permanently delete specialist ${worker.user?.name}? All their portfolio and history will be lost.`,
            confirmText: 'DELETE PERMANENTLY',
            onConfirm: async () => {
                try {
                    await api.delete(`/admin/workers/${worker._id}`);
                    toast.success('Worker deleted successfully');
                    fetchWorkers();
                } catch (error) {
                    toast.error('Delete failed');
                }
            }
        });
    };

    const verifyWorker = async (workerId, status) => {
        try {
            await api.put(`/admin/workers/${workerId}/verify`, { status });
            fetchWorkers();
        } catch (error) {
            if (import.meta.env.DEV) console.error('Verify worker failed', error);
        }
    };

    const handleAddWorker = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/workers', {
                ...newWorker,
                skills: newWorker.skills.split(',').map(s => s.trim()),
                experience: Number(newWorker.experience),
                price: Number(newWorker.price)
            });
            setIsAddModalOpen(false);
            setNewWorker({ name: '', email: '', password: '', skills: '', experience: '', location: '', price: '', bio: '' });
            fetchWorkers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add worker');
        }
    };

    const filteredWorkers = workers.filter(w => {
        const name = w.user?.name || '';
        const email = w.user?.email || '';
        const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filter === 'all' || w.verificationStatus === filter;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-navy-deep tracking-tight uppercase">{t('worker') || 'Worker'} <span className="text-royal-gold">{t('management') || 'Management'}</span></h1>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">{t('onboard_manage_painters')}</p>
                    <AnimatePresence>
                        {isRefreshing && (
                            <motion.div 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-royal-gold/60 mt-2"
                            >
                                <div className="w-1 h-1 rounded-full bg-royal-gold animate-ping" />
                                {t('sync_data')}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-deep/20 text-xs" />
                        <input
                            type="text"
                            placeholder={t('search_workers_placeholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-white border border-royal-gold/10 rounded-2xl py-3 pl-11 pr-4 text-xs font-bold text-navy-deep focus:outline-none focus:border-royal-gold w-64 shadow-sm"
                        />
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-navy-deep text-royal-gold px-6 py-3 rounded-2xl flex items-center gap-3 text-xs font-black uppercase tracking-widest shadow-xl shadow-navy-deep/20 hover:scale-105 transition-all"
                    >
                        <FaPlus /> {t('add_expert_btn')}
                    </button>
                </div>
            </div>

            <div className="flex gap-2">
                {['all', 'approved', 'pending', 'rejected'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-navy-deep text-royal-gold shadow-lg' : 'bg-white text-slate-400 border border-royal-gold/10 hover:border-royal-gold/30'
                            }`}
                    >
                        {f === 'all' ? t('tab_all') : f === 'approved' ? t('verif_approved') : f === 'pending' ? t('verif_pending') : t('verif_rejected')}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-[2.5rem] border border-royal-gold/10 shadow-2xl shadow-royal-gold/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-ivory-subtle/30 border-b border-royal-gold/5">
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-navy-deep/40">{t('worker') || 'Worker'}</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-navy-deep/40">{t('location_skills_label')}</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-navy-deep/40">{t('rate_label')}</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-navy-deep/40">{t('verification_label')}</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-navy-deep/40 text-right">{t('actions_label')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-royal-gold/5">
                            <AnimatePresence mode="popLayout">
                                {filteredWorkers.map((worker, i) => (
                                    <motion.tr
                                        key={worker._id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                        className="hover:bg-ivory-subtle/20 transition-colors group"
                                    >
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <img
                                                    src={worker.user?.profileImage || "/assets/premium-avatar.png"}
                                                    className="w-10 h-10 rounded-xl border border-royal-gold/10 grayscale group-hover:grayscale-0 transition-all"
                                                    alt=""
                                                />
                                                <div>
                                                    <p className="text-xs font-black text-navy-deep">{worker.user?.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 lowercase">{worker.user?.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-[9px] font-black text-navy-deep/60 uppercase tracking-wider">
                                                    <FaMapMarkerAlt className="text-royal-gold" /> {worker.location}
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {worker.skills.slice(0, 3).map(s => (
                                                        <span key={s} className="px-1.5 py-0.5 bg-navy-deep/5 text-navy-deep text-[8px] font-black uppercase rounded">{s}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-xs font-black text-navy-deep flex items-center gap-1">
                                                <FaRupeeSign className="text-royal-gold text-[10px]" /> {worker.price}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1">
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-center ${worker.verificationStatus === 'approved' ? 'bg-green-50 text-green-500' :
                                                    worker.verificationStatus === 'pending' ? 'bg-royal-gold/10 text-royal-gold' :
                                                        'bg-red-50 text-red-500'
                                                    }`}>
                                                    {worker.verificationStatus === 'approved' ? t('verif_approved') :
                                                        worker.verificationStatus === 'pending' ? t('verif_pending') :
                                                            t('verif_rejected')}
                                                </span>
                                                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest text-center ${worker.user?.isBlocked ? 'bg-red-50 text-red-500' : worker.user?.isSuspended ? 'bg-orange-50 text-orange-500' : 'bg-green-50 text-green-500'
                                                    }`}>
                                                    {worker.user?.isBlocked ? t('status_blocked') : worker.user?.isSuspended ? t('status_suspended') : t('status_active')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <button
                                                    onClick={() => {
                                                        setSelectedWorker(worker);
                                                        setIsReviewModalOpen(true);
                                                    }}
                                                    className="p-3 bg-royal-gold/10 text-royal-gold rounded-xl hover:bg-royal-gold/20 hover:scale-110 shadow-sm transition-all"
                                                    title={t('review_app_tooltip')}
                                                >
                                                    <FaIdCard size={14} />
                                                </button>

                                                {worker.verificationStatus === 'pending' && (
                                                    <div className="flex gap-2">
                                                        <button onClick={() => verifyWorker(worker._id, 'approved')} className="p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 hover:scale-110 shadow-sm transition-all" title={t('approve_title') || 'Approve'}><FaCheck size={14} /></button>
                                                        <button onClick={() => verifyWorker(worker._id, 'rejected')} className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 hover:scale-110 shadow-sm transition-all" title={t('reject_title') || 'Reject'}><FaTimes size={14} /></button>
                                                    </div>
                                                )}
                                                
                                                <button
                                                    onClick={() => toggleSuspend(worker)}
                                                    className={`p-3 rounded-xl transition-all shadow-sm ${worker.user?.isSuspended ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                                                        }`}
                                                    title={worker.user?.isSuspended ? t('unsuspend_user_tooltip') : t('suspend_user_tooltip')}
                                                >
                                                    <FaUserTimes size={14} />
                                                </button>
                                                <button
                                                    onClick={() => toggleBlock(worker)}
                                                    className={`p-3 rounded-xl transition-all shadow-sm ${worker.user?.isBlocked ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-red-50 text-red-600 hover:bg-red-100'
                                                        }`}
                                                    title={worker.user?.isBlocked ? t('unblock_user_tooltip') : t('block_user_tooltip')}
                                                >
                                                    {worker.user?.isBlocked ? <FaUserCheck size={14} /> : <FaUserSlash size={14} />}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteWorker(worker)}
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
                </div>
            </div>

            {/* Application Review Modal */}
            <AnimatePresence>
                {isReviewModalOpen && selectedWorker && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-navy-deep/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-[3rem] border border-royal-gold/10 shadow-2xl w-full max-w-2xl overflow-hidden"
                        >
                            <div className="p-8 border-b border-royal-gold/5 flex items-center justify-between bg-ivory-subtle/30">
                                <div>
                                    <h2 className="text-xl font-black text-navy-deep uppercase tracking-tighter">{t('app_review_title').split(' ')[0]} <span className="text-royal-gold">{t('app_review_title').split(' ')[1]}</span></h2>
                                    <p className="text-[10px] font-black text-royal-gold uppercase tracking-widest mt-1">{t('verify_credentials_desc')}</p>
                                </div>
                                <button onClick={() => setIsReviewModalOpen(false)} className="p-3 hover:bg-royal-gold/10 rounded-2xl text-navy-deep/30 hover:text-royal-gold transition-all"><FaTimes /></button>
                            </div>

                            <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-navy-deep/40">{t('full_legal_name')}</p>
                                        <p className="text-sm font-bold text-navy-deep">{selectedWorker.fullName || selectedWorker.user?.name}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-navy-deep/40">{t('contact_email')}</p>
                                        <p className="text-sm font-bold text-navy-deep">{selectedWorker.applicationEmail || selectedWorker.user?.email}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-navy-deep/40">{t('phone_number')}</p>
                                        <p className="text-sm font-bold text-navy-deep">{selectedWorker.applicationPhone || 'Not provided'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-navy-deep/40">{t('location_label') || 'Location'}</p>
                                        <p className="text-sm font-bold text-navy-deep">{selectedWorker.location}</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-navy-deep/40">{t('bio_summary')}</p>
                                    <p className="text-xs text-navy-deep/70 leading-relaxed bg-ivory-subtle p-4 rounded-2xl border border-royal-gold/5 italic">
                                        "{selectedWorker.bio}"
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-navy-deep/40">{t('verify_docs')}</p>
                                    <div className="flex flex-wrap gap-3">
                                        {selectedWorker.idProof && (
                                            <a
                                                href={selectedWorker.idProof}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center gap-3 px-6 py-4 bg-navy-deep text-royal-gold rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-navy-deep/10"
                                            >
                                                <FaIdCard /> {t('view_id_proof')}
                                            </a>
                                        )}
                                        {selectedWorker.workImages && selectedWorker.workImages.length > 0 && (
                                            <div className="w-full space-y-2">
                                                <p className="text-[8px] font-black uppercase tracking-widest text-royal-gold">{t('portfolio_links')}</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedWorker.workImages.map((img, idx) => (
                                                        <a key={idx} href={img} target="_blank" rel="noreferrer" className="px-3 py-2 bg-ivory-subtle border border-royal-gold/10 rounded-xl text-[9px] font-bold text-navy-deep hover:border-royal-gold transition-all">
                                                            {t('work_sample')} {idx + 1}
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {selectedWorker.verificationStatus === 'pending' && (
                                <div className="p-8 bg-ivory-subtle/30 border-t border-royal-gold/5 flex gap-4">
                                    <button
                                        onClick={() => {
                                            verifyWorker(selectedWorker._id, 'approved');
                                            setIsReviewModalOpen(false);
                                        }}
                                        className="flex-1 py-4 bg-green-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-green-500/20 hover:scale-[1.02] transition-all"
                                    >
                                        {t('approve_title') || 'Approve'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            verifyWorker(selectedWorker._id, 'rejected');
                                            setIsReviewModalOpen(false);
                                        }}
                                        className="flex-1 py-4 bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-500/20 hover:scale-[1.02] transition-all"
                                    >
                                        {t('reject_title') || 'Reject'}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Add Worker Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-navy-deep/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-[3rem] border border-royal-gold/10 shadow-2xl w-full max-w-2xl overflow-hidden"
                        >
                            <div className="p-8 border-b border-royal-gold/5 flex items-center justify-between bg-ivory-subtle/30">
                                <div>
                                    <h2 className="text-xl font-black text-navy-deep uppercase tracking-tighter">{t('manual_onboarding').split(' ')[0]} <span className="text-royal-gold">{t('manual_onboarding').split(' ')[1]}</span></h2>
                                    <p className="text-[10px] font-black text-royal-gold uppercase tracking-widest mt-1">{t('register_specialist_desc')}</p>
                                </div>
                                <button onClick={() => setIsAddModalOpen(false)} className="p-3 hover:bg-royal-gold/10 rounded-2xl text-navy-deep/30 hover:text-royal-gold transition-all"><FaTimes /></button>
                            </div>

                            <form onSubmit={handleAddWorker} className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-navy-deep/40 ml-1">{t('full_name') || 'Full Name'}</label>
                                        <input required type="text" value={newWorker.name} onChange={e => setNewWorker({ ...newWorker, name: e.target.value })} className="w-full bg-ivory-subtle border border-royal-gold/10 rounded-2xl py-3 px-4 text-xs font-bold text-navy-deep focus:outline-none focus:border-royal-gold" placeholder="John Doe" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-navy-deep/40 ml-1">{t('email_label') || 'Email Address'}</label>
                                        <input required type="email" value={newWorker.email} onChange={e => setNewWorker({ ...newWorker, email: e.target.value })} className="w-full bg-ivory-subtle border border-royal-gold/10 rounded-2xl py-3 px-4 text-xs font-bold text-navy-deep focus:outline-none focus:border-royal-gold" placeholder="john@example.com" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-navy-deep/40 ml-1">{t('password_label') || 'Password'}</label>
                                        <input required type="password" value={newWorker.password} onChange={e => setNewWorker({ ...newWorker, password: e.target.value })} className="w-full bg-ivory-subtle border border-royal-gold/10 rounded-2xl py-3 px-4 text-xs font-bold text-navy-deep focus:outline-none focus:border-royal-gold" placeholder="••••••••" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-navy-deep/40 ml-1">{t('location_label') || 'Location'}</label>
                                        <input required type="text" value={newWorker.location} onChange={e => setNewWorker({ ...newWorker, location: e.target.value })} className="w-full bg-ivory-subtle border border-royal-gold/10 rounded-2xl py-3 px-4 text-xs font-bold text-navy-deep focus:outline-none focus:border-royal-gold" placeholder="Mumbai, India" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-navy-deep/40 ml-1">{t('exp_years_label')}</label>
                                        <input required type="number" value={newWorker.experience} onChange={e => setNewWorker({ ...newWorker, experience: e.target.value })} className="w-full bg-ivory-subtle border border-royal-gold/10 rounded-2xl py-3 px-4 text-xs font-bold text-navy-deep focus:outline-none focus:border-royal-gold" placeholder="5" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-navy-deep/40 ml-1">{t('daily_rate_label')}</label>
                                        <input required type="number" value={newWorker.price} onChange={e => setNewWorker({ ...newWorker, price: e.target.value })} className="w-full bg-ivory-subtle border border-royal-gold/10 rounded-2xl py-3 px-4 text-xs font-bold text-navy-deep focus:outline-none focus:border-royal-gold" placeholder="1500" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-navy-deep/40 ml-1">{t('skills_comma_sep')}</label>
                                    <input required type="text" value={newWorker.skills} onChange={e => setNewWorker({ ...newWorker, skills: e.target.value })} className="w-full bg-ivory-subtle border border-royal-gold/10 rounded-2xl py-3 px-4 text-xs font-bold text-navy-deep focus:outline-none focus:border-royal-gold" placeholder="Interior, Exterior, Texture" />
                                </div>

                                <div className="flex justify-end gap-3 mt-4">
                                    <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-navy-deep transition-all">{t('cancel_btn') || 'Cancel'}</button>
                                    <button type="submit" className="px-10 py-4 bg-navy-deep text-royal-gold rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-navy-deep/20 hover:scale-105 transition-all">{t('onboard_expert_btn')}</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

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

export default AdminWorkerManagement;
