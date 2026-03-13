import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { useSocket } from '../context/SocketContext';
import {
    FaInbox, FaCheckCircle, FaClock, FaChartLine, FaStar,
    FaUserEdit, FaCheck, FaTimes, FaMapMarkerAlt, FaCalendarAlt,
    FaArrowRight, FaPlay, FaPause, FaFlagCheckered, FaGem, FaArrowUp, FaComments,
    FaSignOutAlt, FaPhone, FaVideo, FaEnvelope
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
        className="glass-card p-7 shadow-[0_10px_40px_-15px_rgba(212,175,55,0.08)] transition-all group hover:shadow-[0_20px_50px_-10px_rgba(212,175,55,0.15)]"
    >
        <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform shadow-inner`}>
            <Icon />
        </div>
        <p className="text-[var(--text-muted)] text-[9px] font-black uppercase tracking-[0.2em]">{label}</p>
        <h3 className="text-3xl font-black text-[var(--text-main)] mt-1 leading-none">{value}</h3>
    </motion.div>
);

const WorkerDashboard = () => {
    const { user, logout } = useAuth();
    const { t } = useTranslation();
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
        isToggling
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
        { label: 'Platform Volume', value: bookings.length, icon: FaCheckCircle, color: 'bg-royal-gold/10 text-royal-gold', delay: 0.1 },
        { label: 'Unread Intel', value: bookings.filter(b => b.status === 'pending').length, icon: FaInbox, color: 'bg-yellow-500/10 text-yellow-600', delay: 0.2 },
        { label: 'Active Missions', value: bookings.filter(b => b.status === 'accepted' && b.subStatus !== 'completed').length, icon: FaClock, color: 'bg-royal-gold/20 text-royal-gold', delay: 0.3 },
        { label: 'Net Operations', value: `₹${earnings?.totalEarned || 0}`, icon: FaChartLine, color: 'bg-green-500/10 text-green-500', delay: 0.4 },
    ];

    const filteredBookings = bookings.filter(b => {
        if (activeTab === 'requests') return b.status === 'pending';
        if (activeTab === 'active') return b.status === 'accepted' && b.subStatus !== 'completed';
        if (activeTab === 'completed') return b.status === 'completed' || b.subStatus === 'completed';
        return true;
    });

    return (
        <div className="space-y-10 pb-12">
            {/* Professional Command Hub */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 glass-card p-8 shadow-2xl shadow-royal-gold/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-royal-gold/5 rounded-full blur-[100px] -z-10 translate-x-1/4 -translate-y-1/2" />

                <div>
                    <div className="flex items-center gap-3 text-royal-gold font-black uppercase tracking-[0.4em] text-[10px] mb-3">
                        <FaGem className="text-[8px]" /> Specialist Command Center
                    </div>
                    <h1 className="text-4xl font-black text-[var(--text-main)] tracking-tight leading-none">
                        Specialist <span className="bg-gradient-to-r from-royal-gold-deep to-royal-gold bg-clip-text text-transparent">{user?.name}</span>
                    </h1>
                    <p className="text-[var(--text-muted)] text-sm mt-3 font-medium">Platform operations are synchronized. Visibility is optimal.</p>
                </div>

                <div className="flex items-center gap-6 bg-[var(--bg-highlight)]/50 p-5 px-8 rounded-[2.5rem] border border-royal-gold/5 shadow-inner">
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] font-black uppercase tracking-widest text-royal-gold opacity-60">Fleet Status</span>
                        <div className="flex items-center gap-3 mt-1.5">
                            <span className={`w-2.5 h-2.5 rounded-full ${worker?.isAvailable ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]'}`} />
                            <span className="font-black text-[11px] uppercase tracking-widest text-[var(--text-main)]">{worker?.isAvailable ? 'Active Deployment' : 'Fleet Standby'}</span>
                        </div>
                    </div>
                    <button
                        onClick={toggleAvailability}
                        disabled={isToggling}
                        className={`w-12 h-6 rounded-full relative transition-all duration-300 ${worker?.isAvailable ? 'bg-royal-gold' : 'bg-[var(--glass-border)]'} ${isToggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                        <motion.div
                            animate={{ x: worker?.isAvailable ? 24 : 4 }}
                            className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md"
                        />
                    </button>
                </div>
            </div>

            {/* Strategic Intelligence Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => <StatCard key={i} {...stat} />)}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                {/* Mission Control Panel */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="glass-card shadow-2xl shadow-royal-gold/5 overflow-hidden">
                        <div className="p-8 border-b border-royal-gold/5 flex items-center justify-between">
                            <div className="flex gap-2 p-1.5 bg-[var(--bg-highlight)]/50 rounded-[1.5rem] border border-royal-gold/5 shadow-inner">
                                {['requests', 'active', 'completed'].map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab
                                            ? 'bg-royal-gold text-white shadow-xl shadow-royal-gold/20'
                                            : 'text-[var(--text-muted)] hover:text-royal-gold hover:bg-white/50'
                                            }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                            <span className="text-[10px] font-black text-royal-gold uppercase tracking-[0.3em]">{filteredBookings.length} Missions Identified</span>
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
                                                className="group p-6 bg-[var(--bg-highlight)]/20 rounded-[2.5rem] border border-transparent hover:border-royal-gold/20 hover:bg-[var(--bg-base)] transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm hover:shadow-xl"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-[var(--bg-base)] overflow-hidden border border-royal-gold/10 shadow-sm flex-shrink-0">
                                                        {booking.user?.profileImage ? (
                                                            <img src={booking.user.profileImage} alt={booking.user.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center font-black text-[var(--text-main)] text-lg uppercase group-hover:scale-110 transition-transform">
                                                                {booking.user?.name?.charAt(0) || 'U'}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-[var(--text-main)] text-base group-hover:text-royal-gold transition-colors">{booking.user?.name}</h4>
                                                        <div className="flex gap-3 mt-1 flex-wrap">
                                                            {booking.user?.email && (
                                                                <span className="flex items-center gap-1 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                                                                    <FaEnvelope className="text-royal-gold text-[8px]" /> {booking.user.email}
                                                                </span>
                                                            )}
                                                            <span className="flex items-center gap-1 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                                                                <FaCalendarAlt className="text-royal-gold text-[8px]" /> {new Date(booking.date).toLocaleDateString()}
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
                                                    {/* Call Buttons always visible */}
                                                    <button
                                                        onClick={() => startCall(booking.user, 'voice')}
                                                        title="Voice Call"
                                                        className="flex items-center gap-1.5 px-4 py-3 bg-[var(--bg-base)] border border-royal-gold/20 text-royal-gold rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-royal-gold/10 transition-all shadow-sm"
                                                    >
                                                        <FaPhone size={10} /> Call
                                                    </button>
                                                    <button
                                                        onClick={() => startCall(booking.user, 'video')}
                                                        title="Video Call"
                                                        className="flex items-center gap-1.5 px-4 py-3 bg-[var(--bg-base)] border border-royal-gold/20 text-royal-gold rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-royal-gold/10 transition-all shadow-sm"
                                                    >
                                                        <FaVideo size={10} /> Video
                                                    </button>

                                                    {activeTab === 'requests' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleUpdateStatus(booking._id, 'accepted', 'not_started')}
                                                                className="btn-primary flex items-center gap-2"
                                                            >
                                                                <FaCheck size={11} /> Accept
                                                            </button>
                                                            <button
                                                                onClick={() => handleUpdateStatus(booking._id, 'rejected')}
                                                                className="px-6 py-3 bg-[var(--bg-base)] text-red-400 border border-red-400/30 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-sm flex items-center gap-2"
                                                            >
                                                                <FaTimes size={11} /> Reject
                                                            </button>
                                                        </>
                                                    )}

                                                    {activeTab === 'active' && (
                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                onClick={() => setSelectedChat(booking)}
                                                                className="flex items-center gap-2 px-5 py-3 bg-[var(--bg-base)] border border-royal-gold/20 text-royal-gold rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-royal-gold/5 transition-all shadow-sm"
                                                            >
                                                                <FaComments size={12} /> Chat
                                                            </button>
                                                            {booking.subStatus === 'not_started' && (
                                                                <button
                                                                    onClick={() => handleUpdateStatus(booking._id, 'accepted', 'started')}
                                                                    className="btn-primary"
                                                                >
                                                                    <FaPlay /> Initialize Site
                                                                </button>
                                                            )}
                                                            {booking.subStatus === 'started' && (
                                                                <button
                                                                    onClick={() => handleUpdateStatus(booking._id, 'accepted', 'in_progress')}
                                                                    className="flex items-center gap-3 px-8 py-3.5 bg-yellow-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 shadow-lg shadow-yellow-500/20"
                                                                >
                                                                    <FaPause /> Prep Phase End
                                                                </button>
                                                            )}
                                                            {booking.subStatus === 'in_progress' && (
                                                                <button
                                                                    onClick={() => handleUpdateStatus(booking._id, 'completed', 'completed')}
                                                                    className="btn-primary"
                                                                >
                                                                    <FaFlagCheckered /> Mission End
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}

                                                    {activeTab === 'completed' && (
                                                        <div className="flex items-center gap-3">
                                                            <span className="flex items-center gap-2.5 px-6 py-2.5 bg-green-500/10 text-green-500 rounded-xl text-[9px] font-black uppercase tracking-widest border border-green-500/20 shadow-sm">
                                                                <FaCheck /> Archived
                                                            </span>
                                                            {booking.paymentStatus === 'post_paid_pending' && (
                                                                <button
                                                                    onClick={() => handleConfirmPayment(booking._id)}
                                                                    className="px-6 py-3 bg-green-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-600 transition-all shadow-lg flex items-center gap-2"
                                                                >
                                                                    <FaCheckCircle /> Confirm Cash Receipt
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
                                                <p className="text-[var(--text-muted)] font-black uppercase tracking-[0.3em] text-[10px]">Operational silence for this category</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Performance Insights */}
                    <div className="glass-card p-10 shadow-2xl shadow-royal-gold/5">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-1.5 h-8 bg-royal-gold rounded-full" />
                            <div>
                                <h3 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tighter">Performance Insights</h3>
                                <p className="text-[10px] font-black text-royal-gold uppercase tracking-[0.3em]">Reputation Analytics</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-6">
                                <div className="flex items-end gap-4">
                                    <span className="text-6xl font-black text-[var(--text-main)] leading-none">{worker?.rating || 0}</span>
                                    <div className="pb-2">
                                        <div className="flex text-royal-gold gap-1 mb-1">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <FaStar key={star} className={star <= Math.round(worker?.rating || 0) ? 'fill-current' : 'text-[var(--glass-border)]'} />
                                            ))}
                                        </div>
                                        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Global Index Rating</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {[5, 4, 3, 2, 1].map(r => {
                                        const count = reviews.filter(rev => Math.round(rev.rating) === r).length;
                                        const percent = reviews.length ? (count / reviews.length) * 100 : 0;
                                        return (
                                            <div key={r} className="flex items-center gap-4">
                                                <span className="text-[10px] font-black text-[var(--text-main)] w-4">{r}</span>
                                                <div className="flex-1 h-1.5 bg-[var(--bg-highlight)] rounded-full overflow-hidden">
                                                    <motion.div initial={{ width: 0 }} animate={{ width: `${percent}%` }} className="h-full bg-royal-gold" />
                                                </div>
                                                <span className="text-[10px] font-black text-[var(--text-muted)] w-8 text-right">{count}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black text-[var(--text-main)] uppercase tracking-widest">Critical Feedback</h4>
                                <div className="space-y-4">
                                    {reviews.slice(0, 2).map((rev, i) => (
                                        <div key={rev._id} className="p-5 bg-[var(--bg-highlight)]/20 rounded-2xl border border-royal-gold/5 italic text-[var(--text-muted)] text-xs text-left">
                                            "{rev.comment}"
                                            <span className="block mt-2 font-black not-italic text-[8px] uppercase tracking-widest text-royal-gold">— {rev.user?.name}</span>
                                        </div>
                                    ))}
                                    {reviews.length === 0 && (
                                        <div className="p-8 text-center bg-[var(--bg-highlight)]/10 rounded-2xl border border-dashed border-royal-gold/10">
                                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">No site data available</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tactical Analytics Sidebar */}
                <div className="space-y-10">
                    <div className="glass-card p-10 shadow-2xl shadow-royal-gold/5 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-24 h-24 bg-royal-gold/5 rounded-full blur-2xl" />
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h3 className="text-lg font-black text-[var(--text-main)] tracking-tight uppercase">Revenue Wave</h3>
                                <p className="text-[8px] font-black text-royal-gold uppercase tracking-[0.4em] mt-1">Growth Intelligence</p>
                            </div>
                            <div className="w-11 h-11 bg-[var(--bg-highlight)]/50 rounded-2xl flex items-center justify-center text-royal-gold shadow-inner border border-royal-gold/5">
                                <FaChartLine />
                            </div>
                        </div>

                        <div className="h-52 w-full">
                            <ResponsiveContainer width="100%" height="100%">
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
                                        tick={{ fontSize: 9, fontWeight: '900', fill: 'var(--text-muted)' }}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'var(--glass-bg)', borderRadius: '24px', border: '1px solid var(--glass-border)', boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.1)', padding: '15px' }}
                                        itemStyle={{ fontSize: '10px', fontWeight: '900', color: 'var(--text-main)' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey={earnings?.monthlyChart?.length > 0 ? "amount" : "revenue"}
                                        stroke="var(--royal-gold)"
                                        strokeWidth={4}
                                        fillOpacity={1}
                                        fill="url(#colorRevenue)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="mt-10 p-8 bg-[var(--text-main)] rounded-[2.5rem] text-[var(--bg-base)] shadow-2xl shadow-royal-gold/30 relative group">
                            <div className="absolute -top-3 -right-3 w-10 h-10 bg-royal-gold rounded-full flex items-center justify-center animate-bounce shadow-xl">
                                <FaArrowUp className="text-[var(--text-main)] text-xs" />
                            </div>
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40 mb-3">Treasury Reserve</p>
                            <div className="flex items-end justify-between">
                                <h3 className="text-4xl font-black text-royal-gold tracking-tighter">₹{(earnings?.totalEarned || 0).toLocaleString('en-IN')}</h3>
                                <button className="p-3.5 bg-[var(--bg-base)]/10 text-[var(--bg-base)] rounded-2xl hover:bg-royal-gold hover:text-[var(--text-main)] transition-all shadow-xl">
                                    <FaArrowRight />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-10 shadow-2xl shadow-royal-gold/5 flex flex-col items-center text-center">
                        <div className="relative mb-8">
                            <div className="absolute -inset-2 bg-royal-gold/10 rounded-[2.5rem] blur-lg animate-pulse" />
                            <img
                                src={user?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
                                className="w-24 h-24 rounded-[2rem] object-cover border-4 border-[var(--bg-base)] shadow-xl relative"
                                alt="Pro"
                            />
                            <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-[var(--text-main)] text-royal-gold rounded-xl flex items-center justify-center text-xs shadow-xl border-2 border-[var(--bg-base)]">
                                <FaStar />
                            </div>
                        </div>
                        <h4 className="font-black text-xl text-[var(--text-main)] tracking-tight mb-1">{user?.name}</h4>
                        <p className="text-[10px] text-royal-gold font-black uppercase tracking-[0.4em] mb-4">Master Craftsman</p>

                        <div className="w-full space-y-3 mb-6">
                            <div className="flex gap-2 flex-wrap justify-center">
                                {worker?.skills?.map(skill => (
                                    <span key={skill} className="px-5 py-2 bg-[var(--bg-highlight)]/50 text-[var(--text-muted)] text-[8px] font-black uppercase tracking-widest rounded-xl border border-royal-gold/5">{skill}</span>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={() => { logout(); navigate('/roles'); }}
                            className="w-full flex items-center justify-center gap-3 py-4 bg-red-500/10 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all group border border-red-500/20"
                        >
                            <FaSignOutAlt className="group-hover:scale-110 transition-transform" />
                            Terminate Session
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
