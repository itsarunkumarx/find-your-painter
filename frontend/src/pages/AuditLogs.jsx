import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaHistory, FaCheckCircle, FaTimesCircle, FaUserShield, FaExclamationTriangle, FaSearch, FaUserSlash, FaUserClock, FaTrash, FaCog, FaBroadcastTower } from 'react-icons/fa';
import api from '../utils/api';
import { useTranslation } from 'react-i18next';

const AuditLogs = () => {
    const { t } = useTranslation();
    if (!t) return null;
    const [searchQuery, setSearchQuery] = useState('');
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        try {
            const { data } = await api.get('/admin/audit-logs');
            setLogs(data);
        } catch (error) {
            if (import.meta.env.DEV) console.error('Fetch audit logs failed', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const getIcon = (type) => {
        switch (type) {
            case 'worker_verify': return <FaCheckCircle className="text-green-500" />;
            case 'user_block': 
            case 'worker_block': return <FaTimesCircle className="text-red-500" />;
            case 'user_suspend': return <FaUserClock className="text-orange-500" />;
            case 'user_delete': return <FaTrash className="text-red-600" />;
            case 'settings_update': return <FaCog className="text-royal-gold" />;
            case 'broadcast_sent': return <FaBroadcastTower className="text-blue-500" />;
            default: return <FaHistory className="text-royal-gold" />;
        }
    };

    const filteredLogs = logs.filter(log => 
        log.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.admin?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-10 pb-12">
            <div>
                <h1 className="text-3xl font-black text-navy-deep tracking-tight uppercase">
                    Central <span className="text-royal-gold">Audit</span> Logs
                </h1>
                <p className="text-slate-400 text-sm mt-1 uppercase font-black tracking-widest text-[10px]">{t('chronological_intel') || 'Real-time chronological intelligence of all platform events.'}</p>
            </div>

            <div className="bg-white rounded-[3rem] border border-royal-gold/10 shadow-2xl shadow-royal-gold/5 overflow-hidden">
                <div className="p-8 border-b border-royal-gold/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="relative flex-1 max-w-md">
                        <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-royal-gold/40" />
                        <input
                            type="text"
                            placeholder={t('search_logs_placeholder') || "SEARCH SYSTEM LOGS..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-ivory-subtle border-none rounded-2xl py-4 pl-14 pr-6 text-navy-deep text-[10px] font-black tracking-widest outline-none ring-1 ring-royal-gold/5 focus:ring-royal-gold/30 transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-ivory-subtle border-b border-royal-gold/5">
                                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400">{t('event_signature') || 'Event Signature'}</th>
                                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400">{t('subject') || 'Subject'}</th>
                                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400">{t('action_protocol') || 'Action Protocol'}</th>
                                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400">{t('authority') || 'Authority'}</th>
                                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400">{t('timestamp') || 'Timestamp'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-royal-gold/5">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-8 py-20 text-center">
                                        <div className="w-8 h-8 border-4 border-royal-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-navy-deep/20">{t('syncing_data')}</p>
                                    </td>
                                </tr>
                            ) : filteredLogs.map((log) => (
                                <motion.tr
                                    key={log._id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="hover:bg-ivory-subtle/50 transition-colors group"
                                >
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-royal-gold/5 group-hover:scale-110 transition-transform">
                                                {getIcon(log.type)}
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-wider text-navy-deep">
                                                {log.type.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <FaUserShield className="text-royal-gold/40 text-[10px]" />
                                            <span className="text-xs font-bold text-slate-600">{log.subject}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-[11px] font-medium text-slate-500">{log.action}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[8px] font-black uppercase tracking-widest">
                                            {log.admin?.name || 'System'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 whitespace-nowrap">
                                        <p className="text-[10px] font-black text-slate-400 tabular-nums">
                                            {new Date(log.timestamp).toLocaleString()}
                                        </p>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {!loading && filteredLogs.length === 0 && (
                    <div className="py-20 text-center">
                        <FaHistory className="text-4xl text-royal-gold/10 mx-auto mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-navy-deep/20">{t('no_logs_found') || 'No operational events recorded'}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuditLogs;
