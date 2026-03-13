import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBell, FaCheckCircle, FaClock, FaExclamationTriangle, FaTrash, FaCheckDouble } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    const fetchNotifications = async () => {
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/notifications`, config);
            setNotifications(data);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const markAllRead = async () => {
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/api/notifications/read-all`, {}, config);
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (e) { console.error(e); }
    };

    const markRead = async (id) => {
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/api/notifications/${id}/read`, {}, config);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
        } catch (e) { console.error(e); }
    };

    const deleteNotif = async (id) => {
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/notifications/${id}`, config);
            setNotifications(prev => prev.filter(n => n._id !== id));
        } catch (e) { console.error(e); }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'booking_accepted':
            case 'verification_approved':
                return <FaCheckCircle className="text-green-500" />;
            case 'booking_new':
                return <FaBell className="text-royal-gold" />;
            case 'verification_rejected':
            case 'booking_rejected':
                return <FaExclamationTriangle className="text-red-500" />;
            default:
                return <FaClock className="text-slate-400" />;
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-navy-deep tracking-tight">
                        Intelligence <span className="text-royal-gold">Feed</span>
                    </h1>
                    <p className="text-slate-400 text-xs uppercase tracking-widest mt-1 font-bold">Stay updated with real-time operations</p>
                </div>
                {notifications.some(n => !n.read) && (
                    <button onClick={markAllRead} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-royal-gold hover:text-navy-deep transition-all">
                        <FaCheckDouble /> Mark all as read
                    </button>
                )}
            </div>

            <div className="bg-white rounded-[2.5rem] border border-royal-gold/10 shadow-xl overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="p-8 space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-50 rounded-2xl animate-pulse" />)}
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="py-32 text-center text-slate-300">
                        <FaBell size={48} className="mx-auto mb-4 opacity-10" />
                        <p className="text-xs font-black uppercase tracking-widest">No notifications yet</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-50">
                        <AnimatePresence>
                            {notifications.map((n, i) => (
                                <motion.div key={n._id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                                    className={`p-6 flex items-start gap-6 hover:bg-ivory-subtle/30 transition-all group ${!n.read ? 'bg-royal-gold/3' : ''}`}>
                                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-xl shrink-0">
                                        {n.icon || getIcon(n.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3">
                                            <h4 className={`text-sm font-black ${!n.read ? 'text-navy-deep' : 'text-slate-500'}`}>{n.title}</h4>
                                            {!n.read && <span className="w-2 h-2 bg-royal-gold rounded-full" />}
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{n.message}</p>
                                        <p className="text-[9px] font-bold text-slate-300 uppercase mt-2 tracking-widest">
                                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                        </p>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {!n.read && (
                                            <button onClick={() => markRead(n._id)} className="p-2 text-royal-gold hover:bg-royal-gold/10 rounded-lg" title="Mark Read">
                                                <FaCheckCircle size={14} />
                                            </button>
                                        )}
                                        <button onClick={() => deleteNotif(n._id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg" title="Delete">
                                            <FaTrash size={14} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;
