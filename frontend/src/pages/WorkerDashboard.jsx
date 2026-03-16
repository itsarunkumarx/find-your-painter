import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { useSocket } from '../context/SocketContext';
import {
    FaInbox, FaCheckCircle, FaClock, FaChartLine, FaStar,
    FaUserEdit, FaCheck, FaTimes, FaMapMarkerAlt, FaCalendarAlt,
    FaArrowRight, FaPlay, FaPause, FaFlagCheckered, FaGem, FaArrowUp, FaComments,
    FaSignOutAlt, FaPhone, FaVideo, FaEnvelope, FaMusic, FaCloudUploadAlt
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import Chat from '../components/Chat';
import { useWorker } from '../hooks/useWorker';

const StatCard = ({ icon: Icon, label, value, color, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="glass-card p-5 sm:p-7 shadow-[0_10px_40px_-15px_rgba(212,175,55,0.08)] transition-all group hover:shadow-[0_20px_50px_-10px_rgba(212,175,55,0.15)]"
    >
        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${color} flex items-center justify-center text-xl sm:text-2xl mb-4 sm:mb-5 group-hover:scale-110 transition-transform shadow-inner`}>
            <Icon />
        </div>
        <p className="text-[var(--text-muted)] text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em]">{label}</p>
        <h3 className="text-2xl sm:text-3xl font-black text-[var(--text-main)] mt-1 leading-none">{value}</h3>
    </motion.div>
);

const WorkerDashboard = () => {
    const { user, logout } = useAuth();
    const { t } = useTranslation();
    if (!t) return null;
    const { startCall } = useSocket();
    const navigate = useNavigate();
    const {
        bookings,
        worker,
        earnings,
        reviews,
        loading,
        toggleAvailability,
        updateBookingStatus,
        confirmPayment,
        refreshData,
        isToggling,
        isRefreshing
    } = useWorker();

    const [activeTab, setActiveTab] = useState('requests');
    const [selectedChat, setSelectedChat] = useState(null);

    const handleToggleAvailability = async () => {
        const result = await toggleAvailability();
        if (!result.success) {
            alert(result.message);
        }
    };

    const handleConfirmPayment = async (id) => {
        if (!window.confirm("Confirm you received the full payment in cash?")) return;
        const result = await confirmPayment(id);
        if (!result.success) {
            alert(result.message);
        }
    };

    const handleUpdateStatus = async (id, status, subStatus = null) => {
        const result = await updateBookingStatus(id, status, subStatus);
        if (!result.success) {
            alert(result.message);
        }
    };

    const chartData = [
        { name: 'Mon', revenue: 4000 },
        { name: 'Tue', revenue: 3000 },
        { name: 'Wed', revenue: 2000 },
        { name: 'Thu', revenue: 2780 },
        { name: 'Fri', revenue: 1890 },
        { name: 'Sat', revenue: 2390 },
        { name: 'Sun', revenue: 3490 },
    ];

    const stats = [
        { label: t('platform_volume_stat'), value: bookings.length, icon: FaCheckCircle, color: 'bg-royal-gold/10 text-royal-gold', delay: 0.1 },
        { label: t('unread_intel_stat'), value: bookings.filter(b => b.status === 'pending').length, icon: FaInbox, color: 'bg-yellow-500/10 text-yellow-600', delay: 0.2 },
        { label: t('active_missions_stat'), value: bookings.filter(b => b.status === 'accepted' && b.subStatus !== 'completed').length, icon: FaClock, color: 'bg-royal-gold/20 text-royal-gold', delay: 0.3 },
        { label: t('net_operations_stat'), value: `₹${earnings?.totalEarned || 0}`, icon: FaChartLine, color: 'bg-green-500/10 text-green-500', delay: 0.4 },
    ];

    const filteredBookings = bookings.filter(b => {
        if (activeTab === 'requests') return b.status === 'pending';
        if (activeTab === 'active') return b.status === 'accepted' && b.subStatus !== 'completed';
        if (activeTab === 'completed') return b.status === 'completed' || b.subStatus === 'completed';
        return true;
    });

    return (
        <div className="space-y-10 pb-12">
            {/* Strategic Intelligence Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {stats.map((stat, i) => <StatCard key={i} {...stat} />)}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                {/* Mission Control Panel */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="glass-card shadow-2xl shadow-royal-gold/5 overflow-hidden">
                        <div className="p-6 sm:p-8 border-b border-royal-gold/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex gap-1.5 p-1 bg-[var(--bg-highlight)]/50 rounded-2xl border border-royal-gold/5 shadow-inner self-start flex-wrap">
                                {['requests', 'active', 'completed', 'settings'].map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`px-4 sm:px-8 py-2.5 sm:py-3 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab
                                            ? 'bg-royal-gold text-white shadow-xl shadow-royal-gold/20'
                                            : 'text-[var(--text-muted)] hover:text-royal-gold hover:bg-white/50'
                                            }`}
                                    >
                                        {t(tab)}
                                    </button>
                                ))}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className="text-[9px] sm:text-[10px] font-black text-royal-gold uppercase tracking-[0.3em]">{filteredBookings.length} {t('missions_identified')}</span>
                                <AnimatePresence>
                                    {isRefreshing && (
                                        <motion.div 
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 10 }}
                                            className="flex items-center gap-2 text-[7px] font-black uppercase tracking-widest text-royal-gold/60"
                                        >
                                            <div className="w-1 h-1 rounded-full bg-royal-gold animate-ping" />
                                            Synchronizing...
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        <div className="p-8">
                            <AnimatePresence mode="popLayout">
                                {loading ? (
                                    <div className="space-y-4">
                                        {[1, 2, 3].map(i => <div key={i} className="h-28 bg-[var(--bg-highlight)]/50 animate-pulse rounded-[2rem] border border-royal-gold/5" />)}
                                    </div>
                                ) : (
                                    <div className="space-y-5">
                                        {filteredBookings.map((booking, i) => (
                                            <motion.div
                                                key={booking._id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 20 }}
                                                transition={{ delay: i * 0.05 }}
                                                className="group p-5 sm:p-6 bg-[var(--bg-highlight)]/20 rounded-[2rem] sm:rounded-[2.5rem] border border-transparent hover:border-royal-gold/20 hover:bg-[var(--bg-base)] transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6 shadow-sm hover:shadow-xl"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[var(--bg-base)] overflow-hidden border border-royal-gold/10 shadow-sm flex-shrink-0">
                                                        <img src={booking.user?.profileImage || "/assets/premium-avatar.png"} alt={booking.user?.name} className="w-full h-full object-cover" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h4 className="font-black text-[var(--text-main)] text-sm sm:text-base group-hover:text-royal-gold transition-colors truncate">{booking.user?.name}</h4>
                                                        <div className="flex gap-2 sm:gap-3 mt-1 flex-wrap">
                                                            {booking.user?.email && (
                                                                <span className="flex items-center gap-1 text-[8px] sm:text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest truncate">
                                                                    <FaEnvelope className="text-royal-gold text-[7px]" /> {booking.user.email}
                                                                </span>
                                                            )}
                                                            <span className="flex items-center gap-1 text-[8px] sm:text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                                                                <FaCalendarAlt className="text-royal-gold text-[7px]" /> {new Date(booking.date).toLocaleDateString()}
                                                            </span>
                                                            {booking.address && (
                                                                <span className="flex items-center gap-1 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                                                                    <FaMapMarkerAlt className="text-royal-gold text-[8px]" /> {booking.address}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {booking.description && (
                                                            <p className="text-[10px] text-[var(--text-muted)] mt-1 italic max-w-xs truncate">"{booking.description}"</p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 flex-wrap items-center">
                                                    {/* Call Buttons */}
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => startCall(booking.user, 'voice')}
                                                            title="Voice Call"
                                                            className="flex items-center gap-1.5 px-3 py-2.5 bg-[var(--bg-base)] border border-royal-gold/20 text-royal-gold rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-royal-gold/10 transition-all shadow-sm"
                                                        >
                                                            <FaPhone size={8} /> {t('call_btn')}
                                                        </button>
                                                        <button
                                                            onClick={() => startCall(booking.user, 'video')}
                                                            title="Video Call"
                                                            className="flex items-center gap-1.5 px-3 py-2.5 bg-[var(--bg-base)] border border-royal-gold/20 text-royal-gold rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-royal-gold/10 transition-all shadow-sm"
                                                        >
                                                            <FaVideo size={8} /> {t('video_btn')}
                                                        </button>
                                                    </div>

                                                    {activeTab === 'requests' && (
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => setSelectedChat(booking)}
                                                                className="flex items-center justify-center w-10 h-10 bg-[var(--bg-base)] border border-royal-gold/20 text-royal-gold rounded-xl hover:bg-royal-gold/5 transition-all shadow-sm"
                                                            >
                                                                <FaComments size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleUpdateStatus(booking._id, 'accepted', 'not_started')}
                                                                className="px-4 py-2.5 bg-[var(--text-main)] text-royal-gold rounded-xl text-[9px] font-black uppercase tracking-widest hover:brightness-110 transition-all flex items-center gap-2"
                                                            >
                                                                <FaCheck size={10} /> {t('accept_mission_btn')}
                                                            </button>
                                                            <button
                                                                onClick={() => handleUpdateStatus(booking._id, 'rejected')}
                                                                className="px-4 py-2.5 bg-[var(--bg-base)] text-red-400 border border-red-400/30 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-sm flex items-center gap-2"
                                                            >
                                                                <FaTimes size={10} />
                                                            </button>
                                                        </div>
                                                    )}

                                                    {activeTab === 'active' && (
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => setSelectedChat(booking)}
                                                                className="flex items-center justify-center w-10 h-10 bg-[var(--bg-base)] border border-royal-gold/20 text-royal-gold rounded-xl hover:bg-royal-gold/5 transition-all shadow-sm"
                                                            >
                                                                <FaComments size={14} />
                                                            </button>
                                                            {booking.subStatus === 'not_started' && (
                                                                <button
                                                                    onClick={() => handleUpdateStatus(booking._id, 'accepted', 'started')}
                                                                    className="px-5 py-2.5 bg-[var(--text-main)] text-royal-gold rounded-xl text-[9px] font-black uppercase tracking-widest hover:brightness-110 flex items-center gap-2"
                                                                >
                                                                    <FaPlay size={9} /> {t('initialize_mission_btn')}
                                                                </button>
                                                            )}
                                                            {booking.subStatus === 'started' && (
                                                                <button
                                                                    onClick={() => handleUpdateStatus(booking._id, 'accepted', 'in_progress')}
                                                                    className="px-5 py-2.5 bg-yellow-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:brightness-110 shadow-lg shadow-yellow-500/20 flex items-center gap-2"
                                                                >
                                                                    <FaPause size={9} /> {t('end_prep_btn')}
                                                                </button>
                                                            )}
                                                            {booking.subStatus === 'in_progress' && (
                                                                <button
                                                                    onClick={() => handleUpdateStatus(booking._id, 'completed', 'completed')}
                                                                    className="px-5 py-2.5 bg-green-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-green-600 flex items-center gap-2"
                                                                >
                                                                    <FaFlagCheckered size={9} /> {t('finish_mission_btn')}
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}

                                                    {activeTab === 'completed' && (
                                                        <div className="flex items-center gap-3">
                                                            <span className="flex items-center gap-2.5 px-6 py-2.5 bg-green-500/10 text-green-500 rounded-xl text-[9px] font-black uppercase tracking-widest border border-green-500/20 shadow-sm">
                                                                <FaCheck /> {t('archived_status')}
                                                            </span>
                                                            {booking.paymentStatus === 'post_paid_pending' && (
                                                                <button
                                                                    onClick={() => handleConfirmPayment(booking._id)}
                                                                    className="px-6 py-3 bg-green-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-600 transition-all shadow-lg flex items-center gap-2"
                                                                >
                                                                    <FaCheckCircle /> {t('confirm_cash_btn')}
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))}
                                        {filteredBookings.length === 0 && (
                                            <div className="py-20 text-center flex flex-col items-center">
                                                <div className="w-16 h-16 bg-[var(--bg-highlight)]/50 rounded-full flex items-center justify-center mb-6 border border-royal-gold/10">
                                                    <FaInbox className="text-royal-gold/20" />
                                                </div>
                                                <p className="text-[var(--text-muted)] font-black uppercase tracking-[0.3em] text-[10px]">{t('operational_silence')}</p>
                                            </div>
                                        )}
                                        {activeTab === 'settings' && (
                                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                                                <div className="flex items-center gap-4 mb-2">
                                                    <div className="w-1.5 h-8 bg-royal-gold rounded-full" />
                                                    <h3 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tighter">{t('comm_settings_title')}</h3>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {/* Ringtone Section */}
                                                    <div className="p-8 bg-white/50 rounded-[2.5rem] border border-royal-gold/5 shadow-sm group hover:shadow-xl transition-all">
                                                        <div className="flex items-center justify-between mb-6">
                                                            <div className="w-12 h-12 rounded-2xl bg-royal-gold/10 flex items-center justify-center text-royal-gold">
                                                                <FaMusic size={20} />
                                                            </div>
                                                            <div className="text-[10px] font-black text-royal-gold uppercase tracking-[0.3em]">{t('alert_protocols_label')}</div>
                                                        </div>
                                                        <h4 className="text-base font-black text-navy-deep mb-2">{t('custom_ringtone_title')}</h4>
                                                        <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest leading-relaxed mb-6">{t('upload_audio_desc')}</p>
                                                        
                                                        <div className="space-y-4">
                                                            <div className="relative">
                                                                <input 
                                                                    type="file" 
                                                                    accept="audio/*" 
                                                                    className="hidden" 
                                                                    id="ringtone-upload"
                                                                    onChange={async (e) => {
                                                                        const file = e.target.files[0];
                                                                        if (!file) return;
                                                                        const reader = new FileReader();
                                                                        reader.onload = async () => {
                                                                            try {
                                                                                await api.put('/users/profile', 
                                                                                    { customRingtone: reader.result }
                                                                                );
                                                                                alert('Custom ringtone updated successfully!');
                                                                                window.location.reload();
                                                                            } catch (err) { alert('Upload failed'); }
                                                                        };
                                                                        reader.readAsDataURL(file);
                                                                    }}
                                                                />
                                                                <label htmlFor="ringtone-upload" className="w-full flex items-center justify-center gap-3 py-4 bg-navy-deep text-royal-gold rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-royal-gold hover:text-navy-deep transition-all cursor-pointer shadow-lg shadow-navy-deep/20">
                                                                    <FaCloudUploadAlt size={16} /> {t('upload_audio_btn')}
                                                                </label>
                                                            </div>

                                                            <button 
                                                                onClick={() => {
                                                                    const audio = new Audio(user.customRingtone || 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
                                                                    audio.play();
                                                                    setTimeout(() => audio.pause(), 5000);
                                                                }}
                                                                className="w-full py-4 bg-white border border-royal-gold/20 text-royal-gold rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-royal-gold/5 transition-all flex items-center justify-center gap-2"
                                                            >
                                                                <FaPlay size={10} /> {t('preview_tone_btn')}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Call UI Preferences */}
                                                    <div className="p-8 bg-white/50 rounded-[2.5rem] border border-royal-gold/5 shadow-sm">
                                                        <div className="flex items-center justify-between mb-6">
                                                            <div className="w-12 h-12 rounded-2xl bg-royal-gold/10 flex items-center justify-center text-royal-gold">
                                                                <FaVideo size={20} />
                                                            </div>
                                                            <div className="text-[10px] font-black text-royal-gold uppercase tracking-[0.3em]">{t('visual_matrix_label')}</div>
                                                        </div>
                                                        <h4 className="text-base font-black text-navy-deep mb-2">{t('display_mode_title')}</h4>
                                                        <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest leading-relaxed mb-6">{t('choose_display_desc')}</p>
                                                        
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <button className="p-4 bg-navy-deep text-white rounded-2xl border-2 border-royal-gold shadow-lg">
                                                                <div className="text-[8px] font-black uppercase tracking-widest opacity-50 mb-1">{t('overlay_label')}</div>
                                                                <div className="font-black text-[10px]">{t('PREMIUM')}</div>
                                                            </button>
                                                            <button className="p-4 bg-white border border-navy-deep/10 text-navy-deep/30 rounded-2xl cursor-not-allowed">
                                                                <div className="text-[8px] font-black uppercase tracking-widest opacity-50 mb-1">{t('standard_label')}</div>
                                                                <div className="font-black text-[10px]">{t('locked_label')}</div>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Performance Insights */}
                    <div className="glass-card p-6 sm:p-10 shadow-2xl shadow-royal-gold/5">
                        <div className="flex items-center gap-4 mb-8 sm:mb-10">
                            <div className="w-1.5 h-8 bg-royal-gold rounded-full" />
                            <div>
                                <h3 className="text-lg sm:text-xl font-black text-[var(--text-main)] uppercase tracking-tighter">{t('perf_insights_title')}</h3>
                                <p className="text-[10px] font-black text-royal-gold uppercase tracking-[0.3em]">{t('rep_analytics_desc')}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10">
                            <div className="space-y-6">
                                <div className="flex items-end gap-4">
                                    <span className="text-5xl sm:text-6xl font-black text-[var(--text-main)] leading-none">{worker?.rating || 0}</span>
                                    <div className="pb-2">
                                        <div className="flex text-royal-gold gap-1 mb-1">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <FaStar key={star} className={star <= Math.round(worker?.rating || 0) ? 'fill-current' : 'text-[var(--glass-border)]'} />
                                            ))}
                                        </div>
                                        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">{t('global_index_rating')}</p>
                                    </div>
                                </div>
                                {/* ... existing star bars ... */}
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-[var(--text-main)] uppercase tracking-widest">{t('critical_feedback_label')}</h4>
                                <div className="space-y-4">
                                    {reviews.slice(0, 2).map((rev, i) => (
                                        <div key={rev._id} className="p-4 sm:p-5 bg-[var(--bg-highlight)]/20 rounded-2xl border border-royal-gold/5 italic text-[var(--text-muted)] text-[10px] sm:text-xs text-left">
                                            "{rev.comment}"
                                            <span className="block mt-2 font-black not-italic text-[8px] uppercase tracking-widest text-royal-gold">— {rev.user?.name}</span>
                                        </div>
                                    ))}
                                    {reviews.length === 0 && (
                                        <div className="p-8 text-center bg-[var(--bg-highlight)]/10 rounded-2xl border border-dashed border-royal-gold/10">
                                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">{t('no_site_data')}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tactical Analytics Sidebar */}
                <div className="space-y-8 sm:space-y-10">
                    <div className="glass-card p-8 sm:p-10 shadow-2xl shadow-royal-gold/5 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-24 h-24 bg-royal-gold/5 rounded-full blur-2xl" />
                        <div className="flex items-center justify-between mb-8 sm:mb-10">
                            <div>
                                <h3 className="text-base sm:text-lg font-black text-[var(--text-main)] tracking-tight uppercase">{t('revenue_wave_title')}</h3>
                                <p className="text-[7px] sm:text-[8px] font-black text-royal-gold uppercase tracking-[0.4em] mt-1">{t('growth_intel_desc')}</p>
                            </div>
                            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-[var(--bg-highlight)]/50 rounded-2xl flex items-center justify-center text-royal-gold shadow-inner border border-royal-gold/5">
                                <FaChartLine />
                            </div>
                        </div>

                        <div className="h-40 sm:h-52 w-full">
                            <ResponsiveContainer width="100%" height="100%" minHeight={160}>
                                <AreaChart data={earnings?.monthlyChart?.length > 0 ? earnings.monthlyChart : chartData}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--royal-gold)" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="var(--royal-gold)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey={earnings?.monthlyChart?.length > 0 ? "month" : "name"}
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 8, fontWeight: '900', fill: 'var(--text-muted)' }}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'var(--glass-bg)', borderRadius: '20px', border: '1px solid var(--glass-border)', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)', padding: '10px' }}
                                        itemStyle={{ fontSize: '9px', fontWeight: '900', color: 'var(--text-main)' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey={earnings?.monthlyChart?.length > 0 ? "amount" : "revenue"}
                                        stroke="var(--royal-gold)"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorRevenue)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="mt-8 sm:mt-10 p-6 sm:p-8 bg-[var(--text-main)] rounded-[2rem] sm:rounded-[2.5rem] text-[var(--bg-base)] shadow-2xl shadow-royal-gold/30 relative group">
                            <div className="absolute -top-3 -right-3 w-8 h-8 sm:w-10 sm:h-10 bg-royal-gold rounded-full flex items-center justify-center animate-bounce shadow-xl">
                                <FaArrowUp className="text-[var(--text-main)] text-[10px] sm:text-xs" />
                            </div>
                            <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.3em] opacity-40 mb-3">{t('treasury_reserve_label')}</p>
                            <div className="flex items-end justify-between">
                                <h3 className="text-3xl sm:text-4xl font-black text-royal-gold tracking-tighter">₹{(earnings?.totalEarned || 0).toLocaleString('en-IN')}</h3>
                                <button className="p-3 bg-[var(--bg-base)]/10 text-[var(--bg-base)] rounded-xl hover:bg-royal-gold hover:text-[var(--text-main)] transition-all shadow-xl">
                                    <FaArrowRight size={12} />
                                </button>
                            </div>
                        </div>
                        </div>

                    {/* Profile Card */}
                    <div className="glass-card p-8 sm:p-10 shadow-2xl shadow-royal-gold/5 flex flex-col items-center text-center">
                        <div className="relative mb-6 sm:mb-8">
                            <div className="absolute -inset-2 bg-royal-gold/10 rounded-[2.5rem] blur-lg animate-pulse" />
                            <img
                                src={user?.profileImage || "/assets/premium-avatar.png"}
                                className="w-20 h-20 sm:w-24 sm:h-24 rounded-[1.5rem] sm:rounded-[2rem] object-cover border-4 border-[var(--bg-base)] shadow-xl relative"
                                alt="Pro"
                            />
                            <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 w-6 h-6 sm:w-7 sm:h-7 bg-[var(--text-main)] text-royal-gold rounded-lg sm:rounded-xl flex items-center justify-center text-[10px] sm:text-xs shadow-xl border-2 border-[var(--bg-base)]">
                                <FaStar />
                            </div>
                        </div>
                        <h4 className="font-black text-lg sm:text-xl text-[var(--text-main)] tracking-tight mb-1">{user?.name}</h4>
                        <p className="text-[9px] sm:text-[10px] text-royal-gold font-black uppercase tracking-[0.4em] mb-4">{t('master_craftsman_label')}</p>

                        <div className="w-full space-y-3 mb-6">
                            <div className="flex gap-2 flex-wrap justify-center">
                                {worker?.skills?.map(skill => (
                                    <span key={skill} className="px-3 sm:px-5 py-1.5 sm:py-2 bg-[var(--bg-highlight)]/50 text-[var(--text-muted)] text-[7px] sm:text-[8px] font-black uppercase tracking-widest rounded-lg sm:rounded-xl border border-royal-gold/5">{skill}</span>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={() => { logout(); navigate('/roles'); }}
                            className="w-full flex items-center justify-center gap-3 py-3.5 sm:py-4 bg-red-500/10 text-red-500 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all group border border-red-500/20"
                        >
                            <FaSignOutAlt className="group-hover:scale-110 transition-transform" />
                            {t('terminate_session_btn')}
                        </button>
                    </div>
                </div>
            </div>
            {selectedChat && (
                <Chat booking={selectedChat} onClose={() => setSelectedChat(null)} />
            )}
        </div>
    );
};

export default WorkerDashboard;
