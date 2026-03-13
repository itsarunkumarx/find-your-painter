import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaShieldAlt, FaClock, FaCheckCircle, FaExclamationTriangle, FaCommentAlt } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

const WorkerVerification = () => {
    const { t } = useTranslation();
    const [worker, setWorker] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/workers/profile`, config);
                setWorker(data);
            } catch (error) {
                console.error("Fetch profile error", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const statusConfig = {
        pending: {
            icon: <FaClock className="text-royal-gold" />,
            title: t('verification_in_progress'),
            desc: t('verification_desc_pending'),
            color: 'text-royal-gold',
            bg: 'bg-royal-gold/10'
        },
        approved: {
            icon: <FaCheckCircle className="text-green-500" />,
            title: t('verified_professional'),
            desc: t('verified_desc_approved'),
            color: 'text-green-500',
            bg: 'bg-green-500/10'
        },
        rejected: {
            icon: <FaExclamationTriangle className="text-red-500" />,
            title: t('sync_interrupted'),
            desc: t('rejected_desc'),
            color: 'text-red-500',
            bg: 'bg-red-500/10'
        },
    };

    const currentStatus = worker?.verificationStatus || 'pending';
    const config = statusConfig[currentStatus];

    return (
        <div className="min-h-screen p-6 md:p-12 bg-ivory-light">
            <div className="max-w-4xl mx-auto">
                <div className="mb-12 text-center lg:text-left">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-royal-gold font-bold uppercase tracking-[0.4em] text-[10px] mb-2"
                    >
                        {t('security_trust')}
                    </motion.div>
                    <h1 className="text-4xl font-bold text-navy-deep tracking-tight uppercase">{t('verification_center').split(' ')[0]} <span className="text-royal-gold">{t('verification_center').split(' ')[1]}</span></h1>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-10 h-10 border-2 border-royal-gold/20 border-t-royal-gold rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="space-y-8">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className={`glass-card p-10 border-navy-deep/5 overflow-hidden relative`}
                        >
                            <div className="absolute top-0 right-0 p-10 opacity-5 -rotate-12">
                                <FaShieldAlt className="text-9xl text-royal-navy" />
                            </div>

                            <div className="relative flex flex-col items-center text-center max-w-2xl mx-auto py-8">
                                <div className={`w-24 h-24 rounded-3xl ${config.bg} flex items-center justify-center text-4xl mb-8 shadow-inner border border-navy-deep/5`}>
                                    {config.icon}
                                </div>
                                <h2 className={`text-3xl font-bold uppercase tracking-tight mb-4 ${config.color}`}>{config.title}</h2>
                                <p className="text-sm text-navy-deep/60 leading-relaxed font-light">{config.desc}</p>
                            </div>

                            {worker?.verificationComments && (
                                <div className="mt-10 p-8 bg-red-500/5 rounded-3xl border border-red-500/10">
                                    <div className="flex items-center gap-3 text-red-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4">
                                        <FaCommentAlt /> {t('admin_directives')}
                                    </div>
                                    <p className="text-sm text-navy-deep/70 italic leading-relaxed">"{worker.verificationComments}"</p>
                                </div>
                            )}
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="glass-card p-8 bg-white/40 border-navy-deep/5">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-navy-deep/30 mb-6">{t('submitted_identity')}</h4>
                                <div className="p-4 bg-navy-deep/[0.03] rounded-2xl border border-navy-deep/5 flex items-center justify-between">
                                    <span className="text-xs font-bold text-navy-deep/60">{t('gov_id_proof')}</span>
                                    <a href={worker?.idProof} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-royal-gold underline tracking-widest uppercase">{t('view_node')}</a>
                                </div>
                            </div>
                            <div className="glass-card p-8 bg-white/40 border-navy-deep/5">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-navy-deep/30 mb-6">{t('documentation_label')}</h4>
                                <div className="p-4 bg-navy-deep/[0.03] rounded-2xl border border-navy-deep/5 flex items-center justify-between">
                                    <span className="text-xs font-bold text-navy-deep/60">{t('portfolio_gallery')}</span>
                                    <span className="text-[10px] font-bold text-royal-gold tracking-widest uppercase">{worker?.workImages?.length || 0} {t('assets_synced')}</span>
                                </div>
                            </div>
                        </div>

                        {currentStatus === 'rejected' && (
                            <button className="w-full btn-primary !py-6 text-xs uppercase tracking-widest font-black shadow-royal-glow">
                                {t('ops_reset')}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WorkerVerification;
