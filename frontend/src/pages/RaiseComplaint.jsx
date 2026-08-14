import { useState } from 'react';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHeadset, FaPaperPlane, FaCheckCircle, FaExclamationTriangle, FaHistory, FaChevronRight } from 'react-icons/fa';

import { useTranslation } from 'react-i18next';

const RaiseComplaint = () => {
    const { t } = useTranslation();
    if (!t) return null;
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [type, setType] = useState('other');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [view, setView] = useState('form'); // form or history

    const fetchMyTickets = async () => {
        try {
            const { data } = await api.get('/support/my-tickets');
            setTickets(data);
        } catch (_) { }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus(null);
        try {
            await api.post('/support', {
                subject, message, type
            });
            setStatus({ type: 'success', text: 'Support request submitted successfully!' });
            setSubject('');
            setMessage('');
            fetchMyTickets();
        } catch (error) {
            setStatus({ type: 'error', text: 'Failed to submit request' });
        } finally {
            setLoading(false);
        }
    };

    const categories = [
        { id: 'payment', label: 'Payment Issue' },
        { id: 'service', label: 'Service Quality' },
        { id: 'account', label: 'Account Access' },
        { id: 'other', label: 'General' }
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-10 pb-12">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-navy-deep tracking-tight uppercase">Support <span className="text-royal-gold">Centre</span></h1>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">We're here to help you resolve your concerns</p>
                </div>
                <div className="flex bg-white p-1.5 rounded-2xl border border-royal-gold/10 shadow-sm">
                    <button
                        onClick={() => setView('form')}
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${view === 'form' ? 'bg-navy-deep text-royal-gold shadow-lg' : 'text-slate-400'}`}
                    >
                        <FaHeadset /> New Request
                    </button>
                    <button
                        onClick={() => { setView('history'); fetchMyTickets(); }}
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${view === 'history' ? 'bg-navy-deep text-royal-gold shadow-lg' : 'text-slate-400'}`}
                    >
                        <FaHistory /> History
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {view === 'form' ? (
                    <motion.div
                        key="form"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-10"
                    >
                        <div className="md:col-span-2">
                            <form onSubmit={handleSubmit} className="bg-white rounded-[3rem] border border-royal-gold/10 p-10 shadow-2xl shadow-royal-gold/5 space-y-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-royal-gold/5 rounded-full blur-3xl -z-10" />

                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-navy-deep/40 ml-1">Concern Category</label>
                                            <select
                                                value={type}
                                                onChange={(e) => setType(e.target.value)}
                                                className="w-full bg-ivory-subtle border border-royal-gold/10 rounded-2xl py-4 px-6 text-sm font-bold text-navy-deep focus:outline-none focus:border-royal-gold transition-all"
                                            >
                                                {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-navy-deep/40 ml-1">Subject</label>
                                            <input
                                                required
                                                type="text"
                                                placeholder="Briefly state your issue"
                                                value={subject}
                                                onChange={(e) => setSubject(e.target.value)}
                                                className="w-full bg-ivory-subtle border border-royal-gold/10 rounded-2xl py-4 px-6 text-sm font-bold text-navy-deep focus:outline-none focus:border-royal-gold transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-navy-deep/40 ml-1">Description</label>
                                        <textarea
                                            required
                                            rows="6"
                                            placeholder="Provide as many details as possible..."
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            className="w-full bg-ivory-subtle border border-royal-gold/10 rounded-2xl py-4 px-6 text-sm font-bold text-navy-deep focus:outline-none focus:border-royal-gold transition-all resize-none"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-6">
                                    <div className="flex items-center gap-3 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                        <FaExclamationTriangle className="text-royal-gold" />
                                        Expect response within 24 hours
                                    </div>
                                    <button
                                        disabled={loading}
                                        className="w-full sm:w-auto px-12 bg-navy-deep text-royal-gold py-5 rounded-2xl font-black uppercase text-xs tracking-[0.3em] flex items-center justify-center gap-4 hover:scale-105 transition-all disabled:opacity-50 shadow-2xl shadow-navy-deep/20"
                                    >
                                        {loading ? 'Dispatching...' : (
                                            <>
                                                Submit Ticket <FaPaperPlane />
                                            </>
                                        )}
                                    </button>
                                </div>

                                {status && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex items-center gap-4 p-5 rounded-2xl border ${status.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'
                                            }`}
                                    >
                                        {status.type === 'success' ? <FaCheckCircle /> : <FaExclamationTriangle />}
                                        <p className="text-[10px] font-black uppercase tracking-widest">{status.text}</p>
                                    </motion.div>
                                )}
                            </form>
                        </div>

                        <div className="space-y-8">
                            <div className="bg-navy-deep rounded-[2.5rem] p-8 text-white relative shadow-2xl overflow-hidden group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-royal-gold/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                                <h3 className="text-lg font-black tracking-tight mb-4 uppercase">Direct Assistance</h3>
                                <p className="text-slate-400 text-[10px] font-bold leading-relaxed mb-8">Our support team is available 24/7 for premium members. General users expect responses within one business day.</p>
                                <div className="space-y-4">
                                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
                                        <p className="text-[8px] font-black uppercase tracking-widest text-royal-gold mb-1">Email support</p>
                                        <p className="text-xs font-bold">help@painterpro.com</p>
                                    </div>
                                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
                                        <p className="text-[8px] font-black uppercase tracking-widest text-royal-gold mb-1">Emergency Line</p>
                                        <p className="text-xs font-bold">+91 800 123 4567</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="history"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        {tickets.length === 0 ? (
                            <div className="bg-white rounded-[2.5rem] border border-royal-gold/10 p-20 text-center shadow-2xl shadow-royal-gold/5">
                                <FaHistory className="text-5xl text-royal-gold/10 mx-auto mb-6" />
                                <h3 className="text-sm font-black text-navy-deep uppercase tracking-widest">No Support History</h3>
                                <p className="text-slate-400 text-[10px] font-bold mt-2 uppercase">When you raise concerns, they'll appear here</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {tickets.map((ticket, i) => (
                                    <motion.div
                                        key={ticket._id}
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="bg-white rounded-[2.5rem] border border-royal-gold/10 p-8 shadow-xl hover:shadow-2xl transition-all group"
                                    >
                                        <div className="flex items-center justify-between mb-6">
                                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] ${ticket.status === 'open' ? 'bg-royal-gold/10 text-royal-gold' :
                                                    ticket.status === 'in-review' ? 'bg-navy-deep text-white' :
                                                        'bg-green-50 text-green-500'
                                                }`}>
                                                {ticket.status}
                                            </span>
                                            <span className="text-[9px] font-black text-slate-300 uppercase">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <h3 className="text-xs font-black text-navy-deep uppercase truncate mb-2 group-hover:text-royal-gold transition-colors">{ticket.subject}</h3>
                                        <p className="text-[10px] font-bold text-slate-400 line-clamp-2 leading-relaxed mb-6">{ticket.message}</p>
                                        <div className="pt-6 border-t border-royal-gold/5 flex items-center justify-between">
                                            <span className="text-[8px] font-black text-royal-gold uppercase tracking-widest">{ticket.type} case</span>
                                            {ticket.replies.length > 0 && (
                                                <span className="flex items-center gap-2 text-[8px] font-black text-navy-deep uppercase tracking-widest bg-navy-deep/5 px-3 py-1 rounded-lg">
                                                    {ticket.replies.length} Reply
                                                </span>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default RaiseComplaint;
