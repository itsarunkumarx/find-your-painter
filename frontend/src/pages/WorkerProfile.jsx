import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { motion } from 'framer-motion';
import { FaMapMarkerAlt, FaStar, FaShieldAlt, FaEdit, FaBriefcase, FaUser } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';

import { useWorker } from '../hooks/useWorker';

const WorkerProfile = () => {
    const { t } = useTranslation();
    if (!t) return null;
    const { user } = useAuth();
    const navigate = useNavigate();
    const { worker, loading } = useWorker();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
                <div className="w-12 h-12 border-2 border-royal-gold/20 border-t-royal-gold rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!worker) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
                <div className="glass-card p-10 text-center">
                    <h2 className="text-xl font-bold text-[var(--text-main)] mb-4">{t('no_profile_found') || 'No Worker Profile Found'}</h2>
                    <button
                        onClick={() => navigate('/worker-verification')}
                        className="btn-primary"
                    >
                        {t('complete_verification') || 'Complete Verification'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-12">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">
                        {t('professional_dossier').split(' ')[0]} <span className="text-royal-gold">{t('professional_dossier').split(' ')[1]}</span>
                    </h1>
                    <p className="text-[var(--text-muted)] text-sm mt-1 uppercase font-black tracking-widest text-[10px]">{t('dashboard_subtitle')}</p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/profile-settings')}
                    className="flex items-center gap-2 px-6 py-3 bg-[var(--text-main)] text-royal-gold rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-royal-gold/20"
                >
                    <FaEdit /> {t('modify_intelligence')}
                </motion.button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Identity Card */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="glass-card p-10 relative overflow-hidden flex flex-col items-center text-center">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-royal-gold/5 rounded-full blur-2xl"></div>
                        <div className="relative mb-8">
                            <img
                                src={user?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
                                alt={user?.name}
                                className="w-32 h-32 rounded-[2.5rem] border-4 border-royal-gold/30 object-cover shadow-2xl relative z-10"
                            />
                            {worker.isVerified && (
                                <div className="absolute -bottom-2 -right-2 bg-[var(--text-main)] text-royal-gold rounded-xl p-2.5 border-4 border-[var(--bg-base)] shadow-xl z-20">
                                    <FaShieldAlt className="text-xs" />
                                </div>
                            )}
                        </div>
                        <h2 className="text-2xl font-black text-[var(--text-main)] uppercase tracking-tight">{user?.name}</h2>
                        <div className="flex items-center gap-3 text-royal-gold font-black mt-2">
                            <FaStar />
                            <span className="text-sm">{worker.rating}</span>
                            <span className="text-[var(--text-muted)] text-[10px] uppercase ml-2">{worker.reviewCount} Reviews</span>
                        </div>

                        <div className="mt-8 grid grid-cols-2 gap-4 w-full">
                            <div className="p-4 bg-[var(--bg-highlight)]/50 rounded-2xl border border-[var(--glass-border)]">
                                <div className="text-[8px] font-black uppercase text-[var(--text-muted)] mb-1">Standard Rate</div>
                                <div className="text-lg font-black text-[var(--text-main)]">₹{worker.price}</div>
                            </div>
                            <div className="p-4 bg-[var(--bg-highlight)]/50 rounded-2xl border border-[var(--glass-border)]">
                                <div className="text-[8px] font-black uppercase text-[var(--text-muted)] mb-1">Experience</div>
                                <div className="text-lg font-black text-[var(--text-main)]">{worker.experience}YRS</div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-6 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-royal-gold/10 flex items-center justify-center text-royal-gold">
                            <FaMapMarkerAlt />
                        </div>
                        <div>
                            <div className="text-xs font-black text-[var(--text-main)] uppercase tracking-widest">{worker.location}</div>
                            <div className="text-[10px] text-[var(--text-muted)] font-bold">{t('operation_sector')}</div>
                        </div>
                    </div>
                </div>

                {/* Professional Content */}
                <div className="lg:col-span-8 space-y-8">
                    <section className="glass-card p-10 bg-[var(--bg-highlight)]/30">
                        <h3 className="text-sm font-black text-[var(--text-main)] uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                            <FaBriefcase className="text-royal-gold" /> {t('bio_background')}
                        </h3>
                        <p className="text-[var(--text-muted)] text-sm leading-relaxed">
                            {worker.bio || "No professional biography has been documented yet. Update your settings to add your career story."}
                        </p>
                    </section>

                    <section>
                        <h3 className="text-sm font-black text-[var(--text-main)] uppercase tracking-[0.3em] mb-6 ml-2">Core Competencies</h3>
                        <div className="flex flex-wrap gap-3">
                            {worker.skills?.map((skill, index) => (
                                <span key={index} className="px-6 py-3 bg-[var(--text-main)] text-[var(--bg-base)] rounded-xl text-[10px] font-black uppercase tracking-widest border border-royal-gold/20 shadow-lg">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </section>

                    <section>
                        <h3 className="text-sm font-black text-[var(--text-main)] uppercase tracking-[0.3em] mb-6 ml-2">Operation Gallery</h3>
                        {worker.workImages?.length > 0 ? (
                            <div className="grid grid-cols-2 gap-6">
                                {worker.workImages.map((img, idx) => (
                                    <div key={idx} className="aspect-video overflow-hidden rounded-[2rem] border border-[var(--glass-border)] group relative">
                                        <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 border-2 border-dashed border-[var(--glass-border)] rounded-[3rem] text-center">
                                <p className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest">No active fieldwork documented</p>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
};

export default WorkerProfile;
