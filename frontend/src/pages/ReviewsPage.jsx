import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaStar, FaQuoteLeft, FaPlus, FaCheck, FaTimes } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';

const ReviewsPage = () => {
    const { t } = useTranslation();
    const [bookings, setBookings] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');

    const fetchData = async () => {
        try {
            setLoading(true);
            // Get completed bookings that need review
            const { data: bookingData } = await api.get('/bookings/my-bookings');
            setBookings(bookingData.filter(b => b.status === 'completed'));

            // Get my past reviews
            const { data: reviewData } = await api.get('/reviews/my-reviews');
            setReviews(reviewData);
        } catch (error) {
            console.error("Fetch reviews data error", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const submitReview = async (e) => {
        e.preventDefault();
        try {
            const reviewData = {
                workerId: selectedBooking.worker._id,
                bookingId: selectedBooking._id,
                rating,
                comment
            };
            await api.post('/reviews', reviewData);
            alert(t('review_success'));
            setShowForm(false);
            setRating(5);
            setComment('');
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || t('submission_failed'));
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-10 h-10 border-4 border-royal-gold border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-12">
            <div>
                <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">
                    Feedback <span className="text-royal-gold">Loop</span>
                </h1>
                <p className="text-[var(--text-muted)] text-sm mt-1 uppercase font-black tracking-widest text-[10px]">
                    {t('dashboard_subtitle')}
                </p>
            </div>

            {/* Section: Pending Reviews */}
            <section className="space-y-6">
                <div className="flex items-center gap-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-royal-gold">
                        {t('pending_feedback')}
                    </h3>
                    <div className="h-px flex-1 bg-royal-gold/10" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {bookings.length > 0 ? (
                        bookings.map(b => (
                            <motion.div 
                                key={b._id} 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-card p-6 flex items-center justify-between gap-6"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-royal-gold/10 flex items-center justify-center text-royal-gold border border-royal-gold/20 shrink-0">
                                        <FaStar />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-[8px] font-black text-royal-gold uppercase tracking-widest truncate">{t('completed_project')}</div>
                                        <div className="text-sm font-black text-[var(--text-main)] uppercase truncate">{b.worker?.user?.name}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { setSelectedBooking(b); setShowForm(true); }}
                                    className="px-6 py-3 bg-[var(--text-main)] text-royal-gold rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shrink-0"
                                >
                                    <FaPlus className="inline mr-2" /> {t('rate_professional')}
                                </button>
                            </motion.div>
                        ))
                    ) : (
                        <div className="md:col-span-2 text-center py-12 glass-card border-dashed">
                            <p className="text-[var(--text-muted)] font-black uppercase tracking-widest text-[10px]">{t('no_pending_reviews')}</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Section: Past Reviews */}
            <section className="space-y-6">
                <div className="flex items-center gap-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">
                        {t('your_history')}
                    </h3>
                    <div className="h-px flex-1 bg-royal-gold/5" />
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {reviews.length > 0 ? (
                        reviews.map(r => (
                            <motion.div 
                                key={r._id} 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="glass-card p-8 group border border-royal-gold/5 hover:border-royal-gold/20 transition-all"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        <img
                                            src={r.worker?.user?.profileImage || "/assets/premium-avatar.png"}
                                            className="w-12 h-12 rounded-2xl object-cover border border-royal-gold/20"
                                            alt="Worker"
                                        />
                                        <div>
                                            <div className="text-xs font-black text-[var(--text-main)] uppercase tracking-widest">{r.worker?.user?.name}</div>
                                            <div className="text-[8px] text-[var(--text-muted)] font-black uppercase mt-1">{new Date(r.createdAt).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 text-royal-gold text-[10px] font-black bg-[var(--text-main)] px-3 py-1.5 rounded-xl shadow-lg">
                                        <FaStar /> {r.rating}
                                    </div>
                                </div>
                                <div className="relative">
                                    <FaQuoteLeft className="absolute -left-4 -top-2 text-royal-gold/10 text-2xl" />
                                    <p className="text-[var(--text-main)] text-sm font-medium leading-relaxed italic pl-4">
                                        {r.comment}
                                    </p>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="text-center py-20 glass-card bg-royal-gold/5 border-dashed">
                            <FaQuoteLeft className="text-royal-gold/20 text-4xl mx-auto mb-4" />
                            <p className="text-[var(--text-muted)] italic text-[10px] font-black uppercase tracking-widest">{t('no_reviews_yet')}</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Review Form Modal */}
            <AnimatePresence>
                {showForm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-navy-deep/60 backdrop-blur-md"
                            onClick={() => setShowForm(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="glass-card p-10 w-full max-w-lg relative border-royal-gold/10 shadow-2xl z-10"
                        >
                            <button 
                                onClick={() => setShowForm(false)}
                                className="absolute top-6 right-6 text-[var(--text-muted)] hover:text-red-500 transition-colors"
                            >
                                <FaTimes />
                            </button>

                            <h2 className="text-2xl font-black text-[var(--text-main)] uppercase mb-2">
                                {t('rate_dialog_title')} <span className="text-royal-gold">{selectedBooking?.worker?.user?.name}</span>
                            </h2>
                            <p className="text-[var(--text-muted)] text-[9px] mb-8 uppercase tracking-widest font-black">
                                {t('feedback_community')}
                            </p>

                            <form onSubmit={submitReview} className="space-y-8">
                                <div>
                                    <label className="text-[9px] font-black uppercase text-royal-gold tracking-widest mb-4 block">
                                        {t('rating_subtitle')}
                                    </label>
                                    <div className="flex justify-between gap-2">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setRating(star)}
                                                className={`flex-1 h-14 rounded-2xl border-2 flex items-center justify-center text-xl transition-all ${rating >= star ? 'bg-royal-gold border-royal-gold text-navy-deep' : 'border-royal-gold/10 text-royal-gold/30 hover:border-royal-gold/30'}`}
                                            >
                                                <FaStar />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[9px] font-black uppercase text-royal-gold tracking-widest mb-4 block">
                                        {t('perspective_label')}
                                    </label>
                                    <textarea
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        className="w-full bg-[var(--bg-highlight)] border border-royal-gold/10 rounded-2xl py-5 px-6 text-[var(--text-main)] text-sm font-bold focus:outline-none focus:border-royal-gold/30 min-h-[150px] transition-all"
                                        placeholder={t('review_placeholder')}
                                        required
                                    />
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        type="submit"
                                        className="flex-1 py-5 bg-[var(--text-main)] text-royal-gold font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-3"
                                    >
                                        <FaCheck /> {t('submit_review')}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ReviewsPage;
