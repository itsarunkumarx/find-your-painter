import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FaMapMarkerAlt, FaStar, FaBriefcase, FaClock, FaComments } from 'react-icons/fa';
import BookingModal from './BookingModal';

const WorkerCard = ({ worker }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

    return (
        <>
            <motion.div
                whileHover={{ scale: 1.02, y: -8 }}
                onClick={() => navigate(`/profile/${worker._id}`)}
                className="glass-card group p-0 relative overflow-hidden backdrop-blur-md hover:bg-[var(--bg-highlight)]/50 cursor-pointer transition-all duration-700 border border-royal-gold/10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] hover:shadow-royal-gold/20"
            >
                {/* Elegant Royal Border Sweep */}
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-royal-gold to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-1000 origin-center z-20"></div>

                {/* Subtle Royal Accent Glow */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-royal-gold/5 rounded-full blur-3xl group-hover:bg-royal-gold/10 transition-colors duration-1000"></div>

                {/* Worker Identity */}
                <div className="flex items-center gap-6 p-8 relative">
                    <div className="relative group/img">
                        <div className="absolute -inset-1 bg-gradient-to-b from-yellow-500/20 to-slate-200/20 rounded-full blur-[2px] opacity-40 group-hover/img:opacity-100 transition duration-1000"></div>
                        <img
                            className="relative w-20 h-20 rounded-full border-2 border-royal-gold/30 object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-700"
                            src={worker.user?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${worker.user?.name}`}
                            alt={worker.user?.name}
                            loading="lazy"
                        />
                        {worker.isVerified && (
                            <div className="absolute -bottom-1 -right-1 bg-navy-deep text-royal-gold rounded-full p-1.5 border-2 border-[var(--bg-base)] z-20 shadow-lg" title={t('painter_verified')}>
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"></path></svg>
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-2xl font-black text-[var(--text-main)] tracking-tight truncate group-hover:text-royal-gold transition-colors duration-500">
                            {worker.user?.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center gap-1 text-royal-gold">
                                <FaStar className="w-3.5 h-3.5 fill-current" />
                                <span className="text-sm font-bold">{worker.rating}</span>
                            </div>
                            {worker.isAvailable ? (
                                <div className="flex items-center gap-2 px-4 py-1.5 bg-green-500/10 text-green-500 rounded-full border border-green-500/20 text-[8px] font-black uppercase tracking-widest shadow-inner">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                    {t('available_now')}
                                </div>
                            ) : (
                                <div className="px-4 py-1.5 bg-[var(--bg-highlight)]/50 text-[var(--text-muted)] rounded-full border border-[var(--glass-border)] text-[8px] font-black uppercase tracking-widest">
                                    {t('not_available')}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="px-8 pb-4">
                    <div className="flex items-center gap-3 text-xs font-bold text-[var(--text-muted)] tracking-wide mb-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--bg-highlight)] border border-[var(--glass-border)] text-royal-gold">
                            <FaMapMarkerAlt className="w-3.5 h-3.5" />
                        </div>
                        {worker.location}
                    </div>

                    <div className="flex flex-wrap gap-2 mb-6">
                        {worker.skills?.slice(0, 3).map((skill, index) => (
                            <span key={index} className="text-[9px] font-bold uppercase tracking-wider bg-royal-gold/10 px-3 py-1 rounded-full border border-royal-gold/20 text-royal-gold">
                                {t(skill)}
                            </span>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-[var(--bg-highlight)]/50 p-4 rounded-2xl border border-[var(--glass-border)] shadow-sm">
                            <span className="block text-[8px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]/60 mb-1">{t('years_exp')}</span>
                            <span className="text-lg font-bold text-[var(--text-main)]">{worker.experience}</span>
                        </div>
                        <div className="bg-[var(--bg-highlight)]/50 p-4 rounded-2xl border border-[var(--glass-border)] shadow-sm">
                            <span className="block text-[8px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]/60 mb-1">{t('standard_rate')}</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-lg font-bold text-[var(--text-main)]">₹{worker.price}</span>
                                <span className="text-[8px] text-royal-gold/60 font-black">{t('project_day')}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setIsBookingModalOpen(true);
                            }}
                            className="btn-primary flex-1 py-4 text-[10px]"
                        >
                            {t('book_now')}
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                navigate('/messages');
                            }}
                            className="p-4 bg-[var(--bg-highlight)] text-[var(--text-main)] rounded-2xl border border-[var(--glass-border)] hover:border-royal-gold/30 transition-all shadow-lg group/msg"
                        >
                            <FaComments className="w-5 h-5 group-hover/msg:text-royal-gold transition-colors" />
                        </motion.button>
                    </div>
                </div>
            </motion.div>

            <BookingModal
                isOpen={isBookingModalOpen}
                onClose={() => setIsBookingModalOpen(false)}
                worker={worker}
            />
        </>
    );
};

export default WorkerCard;
