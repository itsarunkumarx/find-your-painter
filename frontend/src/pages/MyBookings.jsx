import { useState, useEffect } from 'react';
import api from '../utils/api';
import fastApi from '../utils/fastApi';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaCalendarAlt, FaClock, FaCheckCircle, FaTimesCircle, FaComments,
    FaPhone, FaCreditCard, FaExclamationTriangle, FaRedo, FaArrowRight, FaInbox
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Chat from '../components/Chat';
import { useSocket } from '../hooks/useSocket';
import { FaRupeeSign } from 'react-icons/fa';

const statusConfig = {
    pending: { color: 'bg-yellow-50 text-yellow-700 border-yellow-100', dot: 'bg-yellow-500', icon: FaClock },
    accepted: { color: 'bg-green-50 text-green-700 border-green-100', dot: 'bg-green-500', icon: FaCheckCircle },
    completed: { color: 'bg-blue-50 text-blue-700 border-blue-100', dot: 'bg-blue-500', icon: FaCheckCircle },
    cancelled: { color: 'bg-red-50 text-red-500 border-red-100', dot: 'bg-red-500', icon: FaTimesCircle },
    rejected: { color: 'bg-red-50 text-red-500 border-red-100', dot: 'bg-red-500', icon: FaTimesCircle },
};

const subStatusMap = {
    not_started: { label: 'Scheduled', progress: 0, color: 'bg-slate-200' },
    started: { label: 'Team Handover', progress: 33, color: 'bg-yellow-400' },
    in_progress: { label: 'Surface Preparation', progress: 66, color: 'bg-yellow-500' },
    completed: { label: 'Final Finish', progress: 100, color: 'bg-green-500' },
};

const MyBookings = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [selectedChat, setSelectedChat] = useState(null);
    const { startCall } = useSocket();

    useEffect(() => {
    const fetchBookings = async (showLoading = true) => {
        if (showLoading && !bookings.length) setLoading(true);
        try {
            await fastApi.getWithCache('/bookings/my-bookings', (data, isCached) => {
                setBookings(data || []);
                if (isCached && loading) setLoading(false);
            }, { forceRefresh: !showLoading });
        } catch (error) {
            if (import.meta.env.DEV) console.error("Fetch bookings error", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);
    }, []);

    const cancelBooking = async (id) => {
        if (!window.confirm(t('cancel_confirm') || 'Are you sure you want to cancel this booking?')) return;
        try {
            await api.put(`/bookings/${id}/status`, { status: 'cancelled' });
            toast.success('Mission aborted successfully');
            setBookings(prev => prev.map(b => b._id === id ? { ...b, status: 'cancelled' } : b));
        } catch (error) {
            toast.error(error.response?.data?.message || t('cancel_failed'));
        }
    };

    const filteredBookings = bookings.filter(b => {
        if (filter === 'active') return ['pending', 'accepted'].includes(b.status);
        if (filter === 'completed') return b.status === 'completed';
        if (filter === 'cancelled') return b.status === 'cancelled';
        return true; // For 'all' filter
    });

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                        {t('my_service_history').split(' ')[0]} <span className="text-yellow-500">{t('service_history_span')}</span>
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">{t('track_appointments_desc')}</p>
                </div>

                <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
                    {['all', 'active', 'completed', 'cancelled'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setFilter(tab)}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === tab ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            {t(`tab_${tab}`)}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white rounded-3xl animate-pulse border border-slate-100 shadow-sm" />)}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    <AnimatePresence mode="popLayout">
                        {filteredBookings.map((booking, i) => {
                            const cfg = statusConfig[booking.status] || statusConfig.pending;
                            const subCfg = subStatusMap[booking.subStatus] || subStatusMap.not_started;

                            return (
                                <motion.div
                                    key={booking._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden p-6 md:p-8"
                                >
                                    <div className="flex flex-col lg:flex-row gap-8">
                                        {/* Pro Info */}
                                        <div className="flex items-center gap-6 lg:w-1/3">
                                            <div className="relative">
                                                <img
                                                    src={booking.worker?.user?.profileImage || "/assets/premium-avatar.png"}
                                                    className="w-20 h-20 rounded-[2rem] object-cover border-4 border-slate-50"
                                                    alt="Pro"
                                                />
                                                <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-white ${cfg.dot} flex items-center justify-center`}>
                                                    <cfg.icon className="text-[8px] text-white" />
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{t('contractor_label')}</p>
                                                <h3 className="text-xl font-black text-slate-800">{booking.worker?.user?.name}</h3>
                                                <div className="flex items-center gap-3 mt-2">
                                                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                                                        <FaComments className="text-yellow-500" />
                                                        {booking.location || 'Mumbai'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Progress Section */}
                                        <div className="flex-1 space-y-4 pt-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('project_progress')}</span>
                                                <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{t(`substatus_${booking.subStatus}`) || subCfg.label} — {subCfg.progress}%</span>
                                            </div>
                                            <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${subCfg.progress}%` }}
                                                    className={`h-full ${subCfg.color} shadow-[0_0_10px_rgba(234,179,8,0.3)]`}
                                                />
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <div className="flex items-center gap-2">
                                                    <FaCalendarAlt className="text-yellow-500 text-xs" />
                                                    <span className="text-xs font-bold text-slate-500">{new Date(booking.date).toLocaleDateString()}</span>
                                                </div>
                                                <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border ${cfg.color} text-[8px] font-black uppercase tracking-widest`}>
                                                    <FaComments /> {booking.serviceType || 'Interior Painting'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-3 lg:w-auto shrink-0 justify-end flex-wrap">
                                            {booking.status === 'accepted' && (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setSelectedChat(booking)}
                                                        className="p-3 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition-all shadow-md active:scale-95"
                                                        title={t('open_chat_title')}
                                                    >
                                                        <FaComments size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => startCall(booking.worker.user, 'voice')}
                                                        className="p-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:text-royal-gold hover:border-royal-gold/20 transition-all shadow-sm active:scale-95"
                                                        title={t('voice_call_title')}
                                                    >
                                                        <FaPhone size={14} />
                                                    </button>
                                                    {booking.paymentStatus !== 'paid' && (
                                                        <button
                                                            onClick={() => navigate(`/payment/${booking._id}`)}
                                                            className="py-3 px-5 bg-navy-deep text-royal-gold rounded-xl font-black uppercase text-[9px] tracking-[0.1em] shadow-lg hover:shadow-royal-gold/10 transition-all flex items-center justify-center gap-2"
                                                        >
                                                            <FaRupeeSign /> {t('pay_now') || 'Pay'}
                                                        </button>
                                                    )}
                                                </div>
                                            )}

                                            {['pending', 'accepted'].includes(booking.status) && (
                                                <button
                                                    onClick={() => cancelBooking(booking._id)}
                                                    className="px-5 py-3 bg-red-50 text-red-500 font-black text-[9px] uppercase tracking-widest rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-100 active:scale-95"
                                                >
                                                    {t('cancel_btn')}
                                                </button>
                                            )}

                                            {booking.status === 'completed' && (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => navigate('/reviews')}
                                                        className="px-5 py-3 bg-yellow-500 text-slate-900 font-black text-[9px] uppercase tracking-widest rounded-xl hover:bg-yellow-400 transition-all active:scale-95"
                                                    >
                                                        {t('review_btn')}
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/painter/${booking.worker?._id}`)}
                                                        className="px-5 py-3 bg-royal-gold text-navy-deep rounded-xl text-[9px] font-black uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <FaRedo size={8} /> {t('rebook_btn')}
                                                    </button>
                                                </div>
                                            )}

                                            {/* New 'View Mission Intelligence' button */}
                                            <button
                                                onClick={() => navigate(`/project/${booking._id}`)}
                                                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-royal-gold hover:text-navy-deep transition-all group"
                                            >
                                                {t('view_mission_btn')} <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                                            </button>

                                            {['accepted', 'completed'].includes(booking.status) && (
                                                <button
                                                    onClick={() => navigate('/support')}
                                                    className="p-3 border border-red-500/10 text-red-500 rounded-xl hover:bg-red-50 transition-all"
                                                    title={t('dispute_booking_title')}
                                                >
                                                    <FaExclamationTriangle size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}

                        {filteredBookings.length === 0 && (
                            <div className="py-32 text-center bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                                <FaInbox className="text-4xl text-slate-200 mx-auto mb-4" />
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">{t('no_records_category')}</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {selectedChat && (
                <Chat booking={selectedChat} onClose={() => setSelectedChat(null)} />
            )}

        </div>
    );
};

export default MyBookings;
