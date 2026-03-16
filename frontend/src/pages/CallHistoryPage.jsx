import { useState, useEffect } from 'react';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPhoneAlt, FaVideo, FaPhoneSlash, FaClock, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../hooks/useAuth';

const CallHistoryPage = () => {
    const { t } = useTranslation();
    if (!t) return null;
    const { user } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const { data } = await api.get('/calls/history');
                setHistory(data);
            } catch (error) {
                console.error('Failed to fetch call history:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed': return <FaCheckCircle className="text-green-500" />;
            case 'missed': return <FaExclamationCircle className="text-red-500" />;
            case 'rejected': return <FaPhoneSlash className="text-slate-400" />;
            case 'cancelled': return <FaPhoneSlash className="text-slate-400" />;
            default: return <FaClock className="text-slate-300" />;
        }
    };

    const formatDuration = (seconds) => {
        if (!seconds) return '0s';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-navy-deep tracking-tight">
                        Call <span className="text-royal-gold">Logs</span>
                    </h1>
                    <p className="text-slate-400 text-xs uppercase tracking-widest mt-1 font-bold">Trace your communications</p>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-royal-gold/10 shadow-xl overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="p-8 space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-50 rounded-2xl animate-pulse" />)}
                    </div>
                ) : history.length === 0 ? (
                    <div className="py-32 text-center text-slate-300">
                        <FaPhoneAlt size={48} className="mx-auto mb-4 opacity-10" />
                        <p className="text-xs font-black uppercase tracking-widest">No call history found</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-50">
                        <AnimatePresence>
                            {history.map((call, i) => {
                                const isOutgoing = call.caller._id === user?._id;
                                const otherUser = isOutgoing ? call.receiver : call.caller;
                                return (
                                    <motion.div 
                                        key={call._id} 
                                        initial={{ opacity: 0, x: -20 }} 
                                        animate={{ opacity: 1, x: 0 }} 
                                        transition={{ delay: i * 0.05 }}
                                        className="p-6 flex items-center gap-6 hover:bg-ivory-subtle/30 transition-all group"
                                    >
                                        <div className="relative">
                                            <img
                                                src={otherUser?.profileImage || "/assets/premium-avatar.png"}
                                                className="w-14 h-14 rounded-2xl border border-slate-100 shadow-sm object-cover"
                                                alt="User"
                                            />
                                            <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-lg ${call.type === 'video' ? 'bg-purple-500' : 'bg-royal-gold'} flex items-center justify-center text-white shadow-lg`}>
                                                {call.type === 'video' ? <FaVideo size={10} /> : <FaPhoneAlt size={10} />}
                                            </div>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-sm font-black text-navy-deep uppercase tracking-tight">{otherUser?.name}</h4>
                                                <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${isOutgoing ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                                                    {isOutgoing ? 'Outgoing' : 'Incoming'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 mt-1.5">
                                                <div className="flex items-center gap-1.5">
                                                    {getStatusIcon(call.status)}
                                                    <span className="text-[10px] font-bold text-slate-400 capitalize">{call.status}</span>
                                                </div>
                                                <div className="w-1 h-1 bg-slate-200 rounded-full" />
                                                <div className="flex items-center gap-1.5 text-slate-400">
                                                    <FaClock size={10} />
                                                    <span className="text-[10px] font-bold">{formatDuration(call.duration)}</span>
                                                </div>
                                            </div>
                                            <p className="text-[9px] font-bold text-slate-300 uppercase mt-2 tracking-widest">
                                                {formatDistanceToNow(new Date(call.startTime), { addSuffix: true })}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => window.location.href = `/profile/${otherUser?._id}`}
                                                className="p-3 text-navy-deep hover:bg-navy-deep hover:text-royal-gold transition-all rounded-xl border border-slate-100"
                                            >
                                                <FaPhoneAlt size={14} />
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CallHistoryPage;
