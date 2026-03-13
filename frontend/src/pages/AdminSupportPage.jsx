import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTicketAlt, FaEnvelope, FaCircle, FaCheckCircle, FaClock, FaSearch, FaReply, FaTimes } from 'react-icons/fa';

const statusConfig = {
    open: { label: 'Open', color: 'bg-red-50 text-red-500 border-red-100', dot: 'bg-red-500', icon: FaCircle },
    'in-review': { label: 'In Review', color: 'bg-yellow-50 text-yellow-600 border-yellow-100', dot: 'bg-yellow-500', icon: FaClock },
    resolved: { label: 'Resolved', color: 'bg-green-50 text-green-600 border-green-100', dot: 'bg-green-500', icon: FaCheckCircle },
};

const typeColor = { dispute: 'text-red-500 bg-red-50 border-red-100', payment: 'text-purple-500 bg-purple-50 border-purple-100', account: 'text-blue-500 bg-blue-50 border-blue-100' };

const AdminSupportPage = () => {
    const [tickets, setTickets] = useState([]);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [selected, setSelected] = useState(null);
    const [reply, setReply] = useState('');
    const [loading, setLoading] = useState(true);

    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/support`, config);
            setTickets(data);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    useEffect(() => { fetchTickets(); }, []);

    const filtered = tickets.filter(t => {
        const matchSearch = t.subject.toLowerCase().includes(search.toLowerCase()) || (t.user?.name || '').toLowerCase().includes(search.toLowerCase());
        const matchStatus = filter === 'all' || t.status === filter;
        return matchSearch && matchStatus;
    });

    const updateStatus = async (id, status) => {
        try {
            const { data } = await axios.put(`${import.meta.env.VITE_API_URL}/api/support/${id}/status`, { status }, config);
            setTickets(prev => prev.map(t => t._id === id ? { ...t, status: data.status } : t));
            if (selected?._id === id) setSelected(prev => ({ ...prev, status: data.status }));
        } catch (e) { console.error(e); }
    };

    const sendReply = async () => {
        if (!reply.trim()) return;
        try {
            const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/support/${selected._id}/reply`, { message: reply }, config);
            setReply('');
            setTickets(prev => prev.map(t => t._id === selected._id ? data : t));
            setSelected(data);
        } catch (e) { console.error(e); }
    };

    const counts = { open: tickets.filter(t => t.status === 'open').length, 'in-review': tickets.filter(t => t.status === 'in-review').length, resolved: tickets.filter(t => t.status === 'resolved').length };

    return (
        <div className="space-y-6 pb-12">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-black text-navy-deep tracking-tight">
                        Support <span className="text-royal-gold">Centre</span>
                    </h1>
                    <p className="text-slate-400 text-xs uppercase tracking-widest mt-1 font-bold">User disputes & platform issues</p>
                </div>
                <div className="flex items-center gap-4">
                    {Object.entries(counts).map(([s, c]) => (
                        <div key={s} className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest ${statusConfig[s].color}`}>
                            <div className={`w-2 h-2 rounded-full ${statusConfig[s].dot}`} />
                            {c} {s.replace('-', ' ')}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex gap-4 items-center bg-white rounded-2xl border border-royal-gold/10 p-2 shadow-sm px-4">
                <FaSearch className="text-navy-deep/20 shrink-0" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search by subject or user name…"
                    className="flex-1 py-2 text-sm font-medium text-navy-deep bg-transparent focus:outline-none placeholder-slate-300" />
                <div className="flex gap-1 shrink-0">
                    {['all', 'open', 'in-review', 'resolved'].map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-navy-deep text-royal-gold' : 'text-slate-400 hover:text-navy-deep'}`}>
                            {f.replace('-', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Ticket List */}
                <div className="lg:col-span-2 space-y-3">
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white rounded-[2rem] animate-pulse border border-slate-50" />)}
                        </div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {filtered.map((ticket, i) => {
                                const cfg = statusConfig[ticket.status] || statusConfig.open;
                                const isSelected = selected?._id === ticket._id;
                                return (
                                    <motion.div key={ticket._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                                        onClick={() => setSelected(ticket)}
                                        className={`p-5 bg-white rounded-[2rem] border cursor-pointer transition-all hover:shadow-md ${isSelected ? 'border-royal-gold/30 shadow-md ring-1 ring-royal-gold/10' : 'border-royal-gold/5 hover:border-royal-gold/15'}`}>
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-black text-navy-deep truncate">{ticket.subject}</p>
                                                <p className="text-[9px] font-bold text-slate-400 mt-0.5">{ticket.user?.name || 'Anonymous'}</p>
                                            </div>
                                            <span className={`shrink-0 px-2.5 py-1 rounded-lg border text-[8px] font-black uppercase tracking-wider ${cfg.color}`}>
                                                {cfg.label}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-slate-400 line-clamp-2 mb-3">{ticket.message}</p>
                                        <div className="flex items-center gap-3">
                                            <span className={`px-2.5 py-0.5 rounded-lg border text-[8px] font-black uppercase ${typeColor[ticket.type] || ''}`}>{ticket.type}</span>
                                            <span className="text-[8px] text-slate-300 font-bold ml-auto">
                                                {new Date(ticket.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                            </span>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    )}
                    {!loading && filtered.length === 0 && (
                        <div className="py-20 text-center bg-white rounded-[2.5rem] border border-dashed border-royal-gold/10">
                            <FaTicketAlt className="text-3xl text-royal-gold/10 mx-auto mb-3" />
                            <p className="text-xs font-black text-navy-deep/20 uppercase tracking-widest">No tickets found</p>
                        </div>
                    )}
                </div>

                {/* Detail Panel */}
                <div className="lg:col-span-3">
                    {!selected ? (
                        <div className="bg-white rounded-[2.5rem] border border-royal-gold/10 h-full flex items-center justify-center py-32">
                            <div className="text-center">
                                <FaEnvelope className="text-4xl text-royal-gold/10 mx-auto mb-4" />
                                <p className="text-xs font-black text-navy-deep/20 uppercase tracking-widest">Select a ticket to view</p>
                            </div>
                        </div>
                    ) : (
                        <AnimatePresence mode="wait">
                            <motion.div key={selected._id} initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                                className="bg-white rounded-[2.5rem] border border-royal-gold/10 shadow-xl overflow-hidden">
                                {/* Ticket Header */}
                                <div className="p-7 border-b border-slate-50">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h3 className="text-base font-black text-navy-deep">{selected.subject}</h3>
                                            <p className="text-[10px] font-bold text-slate-400 mt-1">From: <span className="text-navy-deep">{selected.user?.name}</span> · {new Date(selected.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                        </div>
                                        <button onClick={() => setSelected(null)} className="p-2 text-slate-300 hover:text-navy-deep transition-colors shrink-0"><FaTimes /></button>
                                    </div>
                                </div>

                                {/* Message History */}
                                <div className="p-7 border-b border-slate-50 max-h-[400px] overflow-y-auto space-y-6">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[9px] font-black uppercase text-royal-gold">Initial Request</span>
                                        </div>
                                        <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl">{selected.message}</p>
                                    </div>

                                    {selected.replies?.map((rep, idx) => (
                                        <div key={idx} className="flex flex-col gap-2">
                                            <div className="flex justify-between items-center">
                                                <span className={`text-[9px] font-black uppercase ${rep.sender === selected.user?._id ? 'text-slate-400' : 'text-blue-500'}`}>
                                                    {rep.sender === selected.user?._id ? 'User Reply' : 'Admin Response'}
                                                </span>
                                                <span className="text-[8px] text-slate-300 font-bold">{new Date(rep.createdAt).toLocaleString('en-IN', { timeStyle: 'short' })}</span>
                                            </div>
                                            <p className={`text-sm leading-relaxed p-4 rounded-2xl ${rep.sender === selected.user?._id ? 'bg-slate-50 text-slate-600' : 'bg-blue-50 text-blue-800'}`}>
                                                {rep.message}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                {/* Status Actions */}
                                <div className="p-7 border-b border-slate-50">
                                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-navy-deep/30 mb-4">Update Status</p>
                                    <div className="flex gap-2 flex-wrap">
                                        {['open', 'in-review', 'resolved'].map(s => (
                                            <button key={s} onClick={() => updateStatus(selected._id, s)}
                                                className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${selected.status === s ? statusConfig[s].color + ' shadow-sm' : 'text-slate-400 border-slate-100 hover:border-slate-200'}`}>
                                                {s.replace('-', ' ')}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Reply */}
                                <div className="p-7">
                                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-navy-deep/30 mb-4">Reply to User</p>
                                    <textarea
                                        value={reply}
                                        onChange={e => setReply(e.target.value)}
                                        rows={3}
                                        placeholder="Type your reply message to the user…"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm text-navy-deep font-medium resize-none focus:outline-none focus:border-royal-gold/40 focus:bg-white transition-all placeholder-slate-300"
                                    />
                                    <button onClick={sendReply} disabled={!reply.trim()}
                                        className="mt-4 flex items-center gap-2 px-7 py-3.5 bg-navy-deep text-royal-gold font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-royal-gold hover:text-navy-deep transition-all disabled:opacity-30 shadow-lg">
                                        <FaReply size={10} /> Send Reply
                                    </button>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminSupportPage;
