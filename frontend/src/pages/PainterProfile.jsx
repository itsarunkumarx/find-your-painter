import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaMapMarkerAlt, FaStar, FaShieldAlt, FaArrowLeft, FaComments, FaCalendarCheck } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import BookingModal from '../components/BookingModal';

const PainterProfile = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const [worker, setWorker] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isBookingOpen, setIsBookingOpen] = useState(false);

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const token = localStorage.getItem('token');
                const config = { headers: { Authorization: `Bearer ${token}` } };

                const { data: workerData } = await axios.get(`${import.meta.env.VITE_API_URL}/api/workers/${id}`, config);
                setWorker(workerData);

                const { data: reviewData } = await axios.get(`${import.meta.env.VITE_API_URL}/api/reviews/worker/${id}`, config);
                setReviews(reviewData);

                // Add to recently viewed
                await axios.put(`${import.meta.env.VITE_API_URL}/api/users/recently-viewed/${id}`, {}, config);
            } catch (error) {
                console.error("Profile fetch error", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
                <div className="w-12 h-12 border-2 border-royal-gold/20 border-t-royal-gold rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!worker) return null;

    return (
        <div className="min-h-screen bg-[var(--bg-base)] relative overflow-hidden transition-colors duration-500">
            {/* Background Accents */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-royal-gold/5 rounded-full blur-[150px] -z-10 translate-x-1/2 -translate-y-1/2"></div>

            <div className="max-w-7xl mx-auto px-6 py-12 lg:py-20 relative z-10">
                <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-[var(--text-muted)] hover:text-royal-gold transition-colors font-bold uppercase tracking-widest text-[10px] mb-12"
                >
                    <FaArrowLeft /> {t('back_to_explore')}
                </motion.button>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                    {/* Left Column: Identity & Contact */}
                    <div className="lg:col-span-5 space-y-10">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative"
                        >
                            <div className="absolute -inset-4 bg-gradient-to-b from-royal-gold/20 to-[var(--text-main)]/10 rounded-3xl blur-xl opacity-50"></div>
                            <div className="glass-card p-10 relative overflow-hidden">
                                <div className="flex flex-col items-center text-center">
                                    <div className="relative mb-8">
                                        <div className="absolute -inset-1 bg-royal-gold rounded-full blur-[2px] opacity-40"></div>
                                        <img
                                            src={worker.user?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${worker.user?.name}`}
                                            alt={worker.user?.name}
                                            className="relative w-40 h-40 rounded-full border-4 border-royal-gold/30 object-cover shadow-2xl"
                                            loading="lazy"
                                        />
                                        {worker.isVerified && (
                                            <div className="absolute bottom-2 right-2 bg-[var(--text-main)] text-royal-gold rounded-full p-3 border-4 border-[var(--bg-base)] shadow-xl">
                                                <FaShieldAlt className="w-4 h-4" />
                                            </div>
                                        )}
                                    </div>

                                    <h1 className="text-4xl font-bold text-[var(--text-main)] tracking-tight mb-2 uppercase">{worker.user?.name}</h1>
                                    <div className="flex items-center gap-3 text-royal-gold font-bold mb-6">
                                        <div className="flex items-center gap-1">
                                            <FaStar />
                                            <span>{worker.rating}</span>
                                        </div>
                                        <span className="w-1 h-1 rounded-full bg-[var(--text-muted)]/20"></span>
                                        <span className="text-xs uppercase tracking-widest">{t('review_count', { count: worker.reviewCount })}</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 w-full">
                                        <div className="bg-[var(--bg-highlight)]/50 p-4 rounded-2xl border border-[var(--glass-border)]">
                                            <div className="text-[8px] font-black uppercase text-[var(--text-muted)] mb-1">{t('standard_rate_label')}</div>
                                            <div className="text-xl font-bold text-[var(--text-main)]">₹{worker.price}<span className="text-[10px] text-[var(--text-muted)] font-bold">{t('day_unit')}</span></div>
                                        </div>
                                        <div className="bg-[var(--bg-highlight)]/50 p-4 rounded-2xl border border-[var(--glass-border)]">
                                            <div className="text-[8px] font-black uppercase text-[var(--text-muted)] mb-1">{t('experience_label')}</div>
                                            <div className="text-xl font-bold text-[var(--text-main)]">{worker.experience} {t('years_unit')}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        <div className="space-y-4">
                            <motion.button
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setIsBookingOpen(true)}
                                className="w-full btn-primary !py-6 text-sm"
                            >
                                <FaCalendarCheck className="mr-3" /> {t('initiate_contract')}
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.02, bg: 'var(--bg-highlight)' }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => navigate('/messages')}
                                className="w-full px-10 py-6 border-2 border-[var(--glass-border)] text-[var(--text-main)] font-bold rounded-2xl hover:bg-[var(--bg-highlight)] transition-all text-sm flex items-center justify-center gap-3"
                            >
                                <FaComments className="text-royal-gold" /> {t('message_agent')}
                            </motion.button>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] ml-2">{t('location_strategy')}</h4>
                            <div className="glass-card p-6 flex items-center gap-4 hover:bg-[var(--bg-highlight)]/30 transition-colors">
                                <div className="w-12 h-12 rounded-xl bg-royal-gold/10 flex items-center justify-center text-royal-gold">
                                    <FaMapMarkerAlt />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-[var(--text-main)]">{worker.location}</div>
                                    <div className="text-[10px] text-[var(--text-muted)] font-medium">{t('location_tagline')}</div>
                                </div>
                            </div>

                            {/* Location Intelligence: Google Maps Embed */}
                            <div className="rounded-3xl overflow-hidden border border-[var(--glass-border)] shadow-inner bg-[var(--bg-highlight)]/30 h-64 relative">
                                {import.meta.env.VITE_GOOGLE_MAPS_KEY ? (
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        style={{ border: 0, filter: 'grayscale(1) contrast(1.2) opacity(0.8)' }}
                                        loading="lazy"
                                        allowFullScreen
                                        referrerPolicy="no-referrer-when-downgrade"
                                        src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_KEY}&q=${encodeURIComponent(worker.location + ', Mumbai')}`}
                                    ></iframe>
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-base)]/90 backdrop-blur-sm p-8 text-center">
                                        <div className="space-y-3 w-full h-full">
                                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">Satellite Link Offline</p>
                                            <div className="h-px w-12 bg-royal-gold/20 mx-auto mb-4"></div>
                                            <iframe
                                                width="100%"
                                                height="100%"
                                                style={{ border: 0, borderRadius: '12px' }}
                                                src={`https://maps.google.com/maps?q=${encodeURIComponent(worker.location + ', Mumbai')}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                                            ></iframe>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Expert Intelligence */}
                    <div className="lg:col-span-7 space-y-12">
                        <section>
                            <h3 className="text-2xl font-bold text-[var(--text-main)] mb-6 flex items-center gap-4">
                                <span className="w-12 h-px bg-royal-gold/30"></span>
                                {t('professional_dossier')}
                            </h3>
                            <div className="glass-card p-10 bg-[var(--bg-highlight)]/30 leading-relaxed text-[var(--text-muted)]">
                                {worker.bio || t('no_bio_provided')}
                            </div>
                        </section>

                        <section>
                            <h3 className="text-2xl font-bold text-[var(--text-main)] mb-6 flex items-center gap-4">
                                <span className="w-12 h-px bg-royal-gold/30"></span>
                                {t('core_competencies')}
                            </h3>
                            <div className="flex flex-wrap gap-3">
                                {worker.skills?.map((skill, index) => (
                                    <span key={index} className="px-6 py-3 bg-[var(--text-main)] text-[var(--bg-base)] rounded-xl text-xs font-bold uppercase tracking-widest border border-royal-gold/20 shadow-lg">
                                        {t(skill)}
                                    </span>
                                ))}
                            </div>
                        </section>

                        <section>
                            <h3 className="text-2xl font-bold text-[var(--text-main)] mb-6 flex items-center gap-4">
                                <span className="w-12 h-px bg-royal-gold/30"></span>
                                {t('operation_gallery')}
                            </h3>
                            {worker.workImages?.length > 0 ? (
                                <div className="grid grid-cols-2 gap-6">
                                    {worker.workImages.map((img, idx) => (
                                        <div key={idx} className="aspect-video overflow-hidden rounded-2xl border border-[var(--glass-border)] group relative shadow-md">
                                            <div className="absolute inset-0 bg-[var(--text-main)]/0 group-hover:bg-[var(--text-main)]/40 transition-all duration-500 z-10 flex items-center justify-center">
                                                <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity font-bold uppercase tracking-widest text-[10px]">{t('view_image')}</div>
                                            </div>
                                            <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-1000" loading="lazy" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-12 border-2 border-dashed border-[var(--glass-border)] rounded-3xl text-center">
                                    <p className="text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest">{t('gallery_offline')}</p>
                                </div>
                            )}
                        </section>

                        <section className="relative">
                            <div className="absolute -left-10 top-0 w-24 h-24 bg-royal-gold/5 rounded-full blur-2xl" />
                            <h3 className="text-2xl font-bold text-[var(--text-main)] mb-8 flex items-center gap-4">
                                <span className="w-12 h-px bg-royal-gold/30"></span>
                                {t('field_testimonials')}
                                <span className="text-[10px] font-black text-royal-gold bg-[var(--bg-highlight)] px-3 py-1 rounded-full uppercase tracking-tighter">{reviews.length}</span>
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {reviews.length > 0 ? (
                                    reviews.map((review, i) => (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: i * 0.1 }}
                                            key={review._id}
                                            className="glass-card p-8 bg-[var(--bg-highlight)]/30 group hover:bg-[var(--bg-highlight)]/50 transition-all border border-royal-gold/5 hover:border-royal-gold/20 shadow-sm"
                                        >
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative">
                                                        <div className="absolute -inset-1 bg-royal-gold/20 rounded-full blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                        <img src={review.user?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.user?.name}`} className="relative w-12 h-12 rounded-full border-2 border-[var(--bg-base)] shadow-sm" alt={review.user?.name} loading="lazy" />
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-black text-[var(--text-main)] uppercase tracking-wide group-hover:text-royal-gold transition-colors">{review.user?.name}</div>
                                                        <div className="text-[8px] text-[var(--text-muted)] font-black uppercase tracking-widest mt-0.5">{new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 text-royal-gold text-[10px] font-black bg-[var(--text-main)] text-[var(--bg-base)] px-3 py-1.5 rounded-xl shadow-lg">
                                                    <FaStar size={10} /> {review.rating.toFixed(1)}
                                                </div>
                                            </div>
                                            <p className="text-[var(--text-muted)] text-sm leading-relaxed italic font-medium">"{review.comment}"</p>
                                            <div className="mt-6 flex gap-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <FaStar key={i} size={8} className={i < Math.floor(review.rating) ? 'text-royal-gold' : 'text-[var(--text-muted)]/20'} />
                                                ))}
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="col-span-2 text-[var(--text-muted)] text-xs font-black uppercase tracking-[0.3em] text-center py-24 bg-[var(--bg-highlight)]/20 rounded-[3rem] border border-dashed border-royal-gold/10">
                                        <FaStar className="text-4xl mx-auto mb-4 opacity-10" />
                                        {t('no_field_data')}
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </div>

            <BookingModal
                isOpen={isBookingOpen}
                onClose={() => setIsBookingOpen(false)}
                worker={worker}
            />
        </div>
    );
};

export default PainterProfile;
