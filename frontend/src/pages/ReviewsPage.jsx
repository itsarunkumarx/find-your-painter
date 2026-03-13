import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaStar, FaQuoteLeft, FaPlus, FaCheck } from 'react-icons/fa';

import { useTranslation } from 'react-i18next';

const ReviewsPage = () => {
    const { t } = useTranslation();
    const [bookings, setBookings] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const config = { headers: { Authorization: `Bearer ${token}` } };

                // Get completed bookings that need review
                const { data: bookingData } = await axios.get(`${import.meta.env.VITE_API_URL}/api/bookings/my-bookings`, config);
                setBookings(bookingData.filter(b => b.status === 'completed'));

                // Get my past reviews
                const { data: reviewData } = await axios.get(`${import.meta.env.VITE_API_URL}/api/reviews/my-reviews`, config);
                setReviews(reviewData);
            } catch (error) {
                console.error("Fetch reviews data error", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const submitReview = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const reviewData = {
                workerId: selectedBooking.worker._id,
                bookingId: selectedBooking._id,
                rating,
                comment
            };
            await axios.post(`${import.meta.env.VITE_API_URL}/api/reviews`, reviewData, config);
            alert(t('review_success'));
            setShowForm(false);
            setRating(5);
            setComment('');
            // Refresh data
            const token_refresh = localStorage.getItem('token');
            const config_refresh = { headers: { Authorization: `Bearer ${token_refresh}` } };
            const { data: bData } = await axios.get(`${import.meta.env.VITE_API_URL}/api/bookings/my-bookings`, config_refresh);
            setBookings(bData.filter(b => b.status === 'completed'));
            const { data: rData } = await axios.get(`${import.meta.env.VITE_API_URL}/api/reviews/my-reviews`, config_refresh);
            setReviews(rData);
        } catch (error) {
            alert(error.response?.data?.message || t('submission_failed'));
        }
    };

    return (
        <div className="min-h-screen p-6 md:p-12 bg-ivory-light">
            <div className="max-w-4xl mx-auto">
                <div className="mb-12">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-royal-gold font-bold uppercase tracking-[0.4em] text-[10px] mb-2"
                    >
                        {t('feedback_loop')}
                    </motion.div>
                    <h1 className="text-4xl font-bold text-navy-deep tracking-tight uppercase">{t('nav_reviews')} & <span className="text-royal-gold">{t('ratings_label')}</span></h1>
                </div>

                {/* Section: Pending Reviews */}
                <section className="mb-16">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-navy-deep/30 mb-6 flex items-center gap-4">
                        {t('pending_feedback')}
                        <span className="h-px flex-1 bg-navy-deep/5"></span>
                    </h3>

                    <div className="grid grid-cols-1 gap-4">
                        {bookings.length > 0 ? (
                            bookings.map(b => (
                                <motion.div key={b._id} className="glass-card p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-royal-gold/10 flex items-center justify-center text-royal-gold border border-royal-gold/20">
                                            <FaStar />
                                        </div>
                                        <div>
                                            <div className="text-[9px] font-bold text-royal-gold uppercase tracking-widest">{t('completed_project')}</div>
                                            <div className="text-sm font-bold text-navy-deep uppercase">{b.worker?.user?.name}</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => { setSelectedBooking(b); setShowForm(true); }}
                                        className="px-6 py-2.5 bg-royal-navy text-royal-gold rounded-xl text-[10px] font-bold uppercase tracking-widest border border-royal-gold/20 hover:bg-royal-gold hover:text-royal-navy transition-all flex items-center gap-2"
                                    >
                                        <FaPlus /> {t('rate_professional')}
                                    </button>
                                </motion.div>
                            ))
                        ) : (
                            <div className="text-center py-10 bg-navy-deep/[0.02] rounded-3xl border border-navy-deep/5">
                                <p className="text-navy-deep/20 font-bold uppercase tracking-widest text-[10px]">{t('no_pending_reviews')}</p>
                            </div>
                        )}
                    </div>
                </section>

                <div className="grid grid-cols-1 gap-6">
                    {reviews.length > 0 ? (
                        reviews.map(r => (
                            <motion.div key={r._id} className="glass-card p-8 bg-white/40 border border-royal-gold/10">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        <img
                                            src={r.worker?.user?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.worker?.user?.name}`}
                                            className="w-12 h-12 rounded-full border border-royal-gold/20"
                                            alt="Worker"
                                        />
                                        <div>
                                            <div className="text-xs font-black text-navy-deep uppercase tracking-widest">{r.worker?.user?.name}</div>
                                            <div className="text-[8px] text-navy-deep/30 font-bold uppercase">{new Date(r.createdAt).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 text-royal-gold text-xs font-bold bg-navy-deep/5 px-3 py-1.5 rounded-xl">
                                        <FaStar /> {r.rating}
                                    </div>
                                </div>
                                <p className="text-navy-deep/60 text-sm leading-relaxed italic">"{r.comment}"</p>
                            </motion.div>
                        ))
                    ) : (
                        <div className="text-center py-20 bg-navy-deep/[0.02] rounded-[3rem] border border-dashed border-navy-deep/10">
                            <FaQuoteLeft className="text-royal-gold/20 text-4xl mx-auto mb-4" />
                            <p className="text-navy-deep/40 italic text-sm font-medium uppercase tracking-widest">{t('no_reviews_yet')}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Review Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-md p-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="glass-card p-10 w-full max-w-lg relative border-navy-deep/5"
                    >
                        <h2 className="text-2xl font-bold text-navy-deep uppercase mb-2">{t('rate_dialog_title')} {selectedBooking?.worker?.user?.name}</h2>
                        <p className="text-navy-deep/40 text-xs mb-8 uppercase tracking-widest font-bold">{t('feedback_community')}</p>

                        <form onSubmit={submitReview} className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black uppercase text-navy-deep/30 tracking-widest mb-3 block">{t('rating_subtitle')}</label>
                                <div className="flex gap-4">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setRating(star)}
                                            className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-xl transition-all ${rating >= star ? 'bg-royal-gold border-royal-gold text-royal-navy' : 'border-navy-deep/10 text-navy-deep/20'}`}
                                        >
                                            <FaStar />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase text-navy-deep/30 tracking-widest mb-3 block">{t('perspective_label')}</label>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    className="w-full bg-navy-deep/[0.03] border border-navy-deep/5 rounded-2xl py-4 px-6 text-navy-deep text-sm font-medium focus:outline-none focus:border-royal-gold/30 min-h-[150px]"
                                    placeholder={t('review_placeholder')}
                                    required
                                />
                            </div>

                            <div className="flex gap-4">
                                <button
                                    type="submit"
                                    className="flex-1 px-8 py-4 bg-royal-gold text-royal-navy font-bold uppercase tracking-widest text-xs rounded-xl shadow-royal flex items-center justify-center gap-3"
                                >
                                    <FaCheck /> {t('submit_review')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="px-8 py-4 bg-navy-deep/5 text-navy-deep font-bold uppercase tracking-widest text-xs rounded-xl"
                                >
                                    {t('dismiss')}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default ReviewsPage;
