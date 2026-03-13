import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaHistory, FaCheckCircle, FaTimesCircle, FaUserShield, FaExclamationTriangle, FaSearch } from 'react-icons/fa';
import axios from 'axios';

const AuditLogs = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [logs, setLogs] = useState([
        { id: 1, type: 'verification_approved', user: 'Vikram Singh', action: 'Professional Credentials Verified', timestamp: '2026-03-02T10:30:00Z', admin: 'Systems Admin' },
        { id: 2, type: 'user_block', user: 'Rahul M.', action: 'Security Protocol: Account Access Restricted', timestamp: '2026-03-02T09:15:00Z', admin: 'Security Module' },
        { id: 3, type: 'booking_flagged', user: 'Project #9821', action: 'Anomaly Detected: Unusual Location Variable', timestamp: '2026-03-01T22:45:00Z', admin: 'AI Sentinel' },
        { id: 4, type: 'payment_success', user: 'Amit K.', action: 'Financial Clearance: Escrow Distributed', timestamp: '2026-03-01T18:20:00Z', admin: 'Treasury Bot' }
    ]);

    const getIcon = (type) => {
        switch (type) {
            case 'verification_approved': return <FaCheckCircle className="text-green-500" />;
            case 'user_block': return <FaTimesCircle className="text-red-500" />;
            case 'booking_flagged': return <FaExclamationTriangle className="text-yellow-500" />;
            default: return <FaHistory className="text-royal-gold" />;
        }
    };

    return (
        <div className="space-y-10 pb-12">
            <div>
                <h1 className="text-3xl font-black text-navy-deep tracking-tight">
                    Central <span className="text-royal-gold">Audit</span> Logs
                </h1>
                <p className="text-slate-400 text-sm mt-1 uppercase font-black tracking-widest text-[10px]">Real-time chronological intelligence of all platform events.</p>
            </div>

            <div className="bg-white rounded-[3rem] border border-royal-gold/10 shadow-2xl shadow-royal-gold/5 overflow-hidden">
                <div className="p-8 border-b border-royal-gold/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="relative flex-1 max-w-md">
                        <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-royal-gold/40" />
                        <input
                            type="text"
                            placeholder="SEARCH SYSTEM LOGS..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-ivory-subtle border-none rounded-2xl py-4 pl-14 pr-6 text-navy-deep text-[10px] font-black tracking-widest outline-none ring-1 ring-royal-gold/5 focus:ring-royal-gold/30 transition-all"
                        />
                    </div>
                    <div className="flex gap-4">
                        <button className="px-6 py-3 bg-white border border-royal-gold/10 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:text-royal-gold transition-all">Filter</button>
                        <button className="px-6 py-3 bg-navy-deep text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-navy-deep/20">Export CSV</button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-ivory-subtle border-b border-royal-gold/5">
                                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400">Event Signature</th>
                                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400">Subject</th>
                                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400">Action Protocol</th>
                                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400">Authority</th>
                                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-royal-gold/5">
                            {logs.map((log) => (
                                <motion.tr
                                    key={log.id}
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
                                            <span className="text-xs font-bold text-slate-600">{log.user}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-[11px] font-medium text-slate-500">{log.action}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[8px] font-black uppercase tracking-widest">
                                            {log.admin}
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

                <div className="p-8 border-t border-royal-gold/5 bg-ivory-subtle/30 flex justify-between items-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Showing 4 operational events</p>
                    <div className="flex gap-2">
                        <button className="w-8 h-8 rounded-lg bg-white border border-royal-gold/5 flex items-center justify-center text-royal-gold disabled:opacity-30" disabled>&lt;</button>
                        <button className="w-8 h-8 rounded-lg bg-navy-deep text-white flex items-center justify-center text-[10px] font-black">1</button>
                        <button className="w-8 h-8 rounded-lg bg-white border border-royal-gold/5 flex items-center justify-center text-royal-gold disabled:opacity-30" disabled>&gt;</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuditLogs;
