import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaQuestionCircle, FaLifeRing, FaChevronDown, FaSearch, FaTicketAlt, FaShieldAlt, FaComments, FaPhone } from 'react-icons/fa';
import api from '../utils/api';
import { useSocket } from '../context/SocketContext';
import { toast } from 'react-hot-toast';

const HelpPage = () => {
    const { startCall } = useSocket();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFaq, setActiveFaq] = useState(null);
    const [ticketData, setTicketData] = useState({ subject: '', type: 'general', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCalling, setIsCalling] = useState(false);

    const callSupport = async () => {
        setIsCalling(true);
        try {
            const { data } = await api.get('/auth/support-admin');
            await startCall(data, 'voice');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Support specialists currently busy');
        } finally {
            setIsCalling(false);
        }
    };

    const faqs = [
        { q: "How do I authorize a painter?", a: "Navigate to your Explore tab, find a specialist, and initialize a mission request via the 'Book Now' interface." },
        { q: "What is the payment protocol?", a: "Payments are encrypted and held in platform escrow until the mission deployment is confirmed as 'Completed' by both parties." },
        { q: "How to update my service sector?", a: "Access Command Settings > Identity to modify your deployment coordinates and primary location." },
        { q: "Reporting technical anomalies?", a: "Use the 'Support Intel' terminal below to broadcast a priority ticket to the administration team." }
    ];

    const filteredFaqs = faqs.filter(f => f.q.toLowerCase().includes(searchQuery.toLowerCase()));

    const submitTicket = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/support', ticketData);
            alert('Support Ticket Synchronized. Intelligence team will analyze shortly.');
            setTicketData({ subject: '', type: 'general', message: '' });
        } catch (_) {
            alert('Relay failure. Check your connection protocol.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-12 pb-12">
            <div>
                <h1 className="text-3xl font-black text-navy-deep tracking-tight">
                    Support <span className="text-royal-gold">Intelligence</span> Hub
                </h1>
                <p className="text-slate-400 text-sm mt-1 uppercase font-black tracking-widest text-[10px]">Operational assistance and mission guidance protocols.</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
                <div className="xl:col-span-2 space-y-10">
                    {/* Search Knowledge Base */}
                    <div className="relative">
                        <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-royal-gold/40" />
                        <input
                            type="text"
                            placeholder="QUERY THE KNOWLEDGE BASE..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white border border-royal-gold/10 rounded-[2.5rem] py-6 pl-16 pr-8 text-navy-deep text-xs font-black tracking-widest outline-none focus:ring-4 focus:ring-royal-gold/5 transition-all shadow-xl shadow-royal-gold/5"
                        />
                    </div>

                    {/* FAQ Grid */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-6">
                            <FaQuestionCircle className="text-royal-gold" />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-navy-deep">Primary Directives</h3>
                        </div>
                        {filteredFaqs.map((faq, i) => (
                            <div key={i} className="bg-white rounded-[2rem] border border-royal-gold/5 shadow-sm overflow-hidden group">
                                <button
                                    onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                                    className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-ivory-subtle transition-all"
                                >
                                    <span className="text-xs font-black text-navy-deep uppercase tracking-wider">{faq.q}</span>
                                    <FaChevronDown className={`text-royal-gold text-[10px] transition-transform ${activeFaq === i ? 'rotate-180' : ''}`} />
                                </button>
                                <AnimatePresence>
                                    {activeFaq === i && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="px-8 pb-6 text-[11px] font-medium text-slate-500 leading-relaxed"
                                        >
                                            <div className="pt-2 border-t border-royal-gold/5">
                                                {faq.a}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>

                    {/* Quick Support Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div 
                            onClick={callSupport}
                            className={`p-8 bg-navy-deep rounded-[2.5rem] text-white shadow-2xl shadow-navy-deep/20 flex items-center gap-6 group hover:translate-y-[-5px] transition-all cursor-pointer ${isCalling ? 'opacity-80 pointer-events-none' : ''}`}
                        >
                            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-royal-gold text-2xl group-hover:scale-110 transition-transform">
                                {isCalling ? (
                                    <div className="w-6 h-6 border-2 border-royal-gold/30 border-t-royal-gold rounded-full animate-spin" />
                                ) : (
                                    <FaComments />
                                )}
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-royal-gold">{t('live_intercept') || 'Live Intercept'}</h4>
                                <p className="text-[9px] opacity-60 mt-1">{t('direct_relay_desc') || 'Direct relay to platform specialists'}</p>
                            </div>
                        </div>
                        <div className="p-8 bg-white rounded-[2.5rem] border border-royal-gold/10 shadow-xl flex items-center gap-6 group hover:translate-y-[-5px] transition-all">
                            <div className="w-14 h-14 bg-royal-gold/5 rounded-2xl flex items-center justify-center text-royal-gold text-2xl group-hover:scale-110 transition-transform">
                                <FaShieldAlt />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-navy-deep">Security Protocol</h4>
                                <p className="text-[9px] text-slate-400 mt-1">Audit your account safe-status</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Support Ticket Terminal */}
                <div className="bg-white rounded-[3rem] border border-royal-gold/10 p-10 shadow-2xl shadow-royal-gold/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-royal-gold/5 rounded-full blur-2xl -mr-16 -mt-16" />
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-10 h-10 bg-ivory-subtle rounded-xl flex items-center justify-center text-royal-gold shadow-inner border border-royal-gold/5">
                            <FaTicketAlt />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-navy-deep tracking-tight uppercase">Support Terminal</h3>
                            <p className="text-[8px] font-black text-royal-gold uppercase tracking-[0.4em] mt-1">Priority Broadcast</p>
                        </div>
                    </div>

                    <form onSubmit={submitTicket} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">Broadcast Subject</label>
                            <input
                                type="text"
                                required
                                value={ticketData.subject}
                                onChange={(e) => setTicketData({ ...ticketData, subject: e.target.value })}
                                className="w-full bg-ivory-subtle border-none rounded-2xl py-4 px-6 text-navy-deep text-xs font-bold outline-none ring-1 ring-royal-gold/5 focus:ring-royal-gold/30 transition-all"
                                placeholder="Issue summary..."
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">Variable Type</label>
                            <select
                                value={ticketData.type}
                                onChange={(e) => setTicketData({ ...ticketData, type: e.target.value })}
                                className="w-full bg-ivory-subtle border-none rounded-2xl py-4 px-6 text-navy-deep text-xs font-bold outline-none ring-1 ring-royal-gold/5 focus:ring-royal-gold/30 transition-all cursor-pointer"
                            >
                                <option value="general">General Intel</option>
                                <option value="technical">Technical Anomaly</option>
                                <option value="payment">Financial Friction</option>
                                <option value="other">Other Unclassified</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">Intelligence Brief</label>
                            <textarea
                                required
                                rows={5}
                                value={ticketData.message}
                                onChange={(e) => setTicketData({ ...ticketData, message: e.target.value })}
                                className="w-full bg-ivory-subtle border-none rounded-2xl py-4 px-6 text-navy-deep text-xs font-bold outline-none ring-1 ring-royal-gold/5 focus:ring-royal-gold/30 transition-all resize-none"
                                placeholder="Describe the operational anomaly in detail..."
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-5 bg-navy-deep text-royal-gold rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-navy-deep/20 hover:brightness-125 transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? 'BROADCASTING...' : 'INITIALIZE BROADCAST'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default HelpPage;
