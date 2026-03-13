import { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaBell, FaPaperPlane, FaUsers, FaUserTie, FaInfoCircle, FaCheckCircle } from 'react-icons/fa';

const AdminNotifications = () => {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [targetRole, setTargetRole] = useState('all');
    const [icon, setIcon] = useState('📢');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus(null);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/notify`, {
                title, message, targetRole, icon
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStatus({ type: 'success', text: `Broadcast sent successfully to ${targetRole} users!` });
            setTitle('');
            setMessage('');
        } catch (error) {
            setStatus({ type: 'error', text: error.response?.data?.message || 'Failed to send broadcast' });
        } finally {
            setLoading(false);
        }
    };

    const icons = ['📢', '🔔', '⚠️', '🎁', '🎖️', '🛠️', '📅'];

    return (
        <div className="max-w-4xl mx-auto space-y-10 pb-12">
            <div>
                <h1 className="text-3xl font-black text-navy-deep tracking-tight uppercase">Broadcast <span className="text-royal-gold">Centre</span></h1>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Send global alerts and updates to the platform</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2">
                    <form onSubmit={handleSubmit} className="bg-white rounded-[3rem] border border-royal-gold/10 p-10 shadow-2xl shadow-royal-gold/5 space-y-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-royal-gold/5 rounded-full blur-3xl -z-10" />

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-navy-deep/40 ml-1">Notification Title</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="e.g., Platform Maintenance Update"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full bg-ivory-subtle border border-royal-gold/10 rounded-2xl py-4 px-6 text-sm font-bold text-navy-deep focus:outline-none focus:border-royal-gold transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-navy-deep/40 ml-1">Message Content</label>
                                <textarea
                                    required
                                    rows="5"
                                    placeholder="Enter the detailed message for users..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="w-full bg-ivory-subtle border border-royal-gold/10 rounded-2xl py-4 px-6 text-sm font-bold text-navy-deep focus:outline-none focus:border-royal-gold transition-all resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-navy-deep/40 ml-1">Target Audience</label>
                                    <div className="flex p-1.5 bg-ivory-subtle border border-royal-gold/10 rounded-2xl">
                                        {[
                                            { id: 'all', icon: FaBell, label: 'All' },
                                            { id: 'user', icon: FaUsers, label: 'Users' },
                                            { id: 'worker', icon: FaUserTie, label: 'Workers' }
                                        ].map((role) => (
                                            <button
                                                key={role.id}
                                                type="button"
                                                onClick={() => setTargetRole(role.id)}
                                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${targetRole === role.id ? 'bg-navy-deep text-royal-gold shadow-lg' : 'text-slate-400 hover:text-navy-deep'
                                                    }`}
                                            >
                                                <role.icon size={10} /> {role.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-navy-deep/40 ml-1">Select Icon</label>
                                    <div className="flex flex-wrap gap-2 p-1.5 bg-ivory-subtle border border-royal-gold/10 rounded-2xl">
                                        {icons.map((i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => setIcon(i)}
                                                className={`w-10 h-10 flex items-center justify-center rounded-xl text-lg transition-all ${icon === i ? 'bg-royal-gold scale-110 shadow-lg' : 'hover:bg-white/50'
                                                    }`}
                                            >
                                                {i}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                disabled={loading}
                                className="w-full bg-navy-deep text-royal-gold py-5 rounded-2xl font-black uppercase text-xs tracking-[0.3em] flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-2xl shadow-navy-deep/20"
                            >
                                {loading ? 'Processing...' : (
                                    <>
                                        Dispatch Broadcast <FaPaperPlane />
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
                                {status.type === 'success' ? <FaCheckCircle /> : <FaInfoCircle />}
                                <p className="text-[10px] font-black uppercase tracking-widest">{status.text}</p>
                            </motion.div>
                        )}
                    </form>
                </div>

                <div className="space-y-8">
                    <div className="bg-navy-deep rounded-[2.5rem] p-8 text-white relative shadow-2xl border border-royal-gold/10 overflow-hidden">
                        <FaInfoCircle className="absolute -top-4 -right-4 text-8xl text-royal-gold/5" />
                        <h3 className="text-lg font-black tracking-tight mb-4 uppercase">Broadcast <br /> Guidelines</h3>
                        <ul className="space-y-4">
                            {[
                                'Use clear and concise titles',
                                'Target relevant groups only',
                                'Avoid excessive punctuation',
                                'Always mention the impact'
                            ].map((rule, i) => (
                                <li key={i} className="flex gap-3 text-[10px] font-bold text-slate-300">
                                    <span className="text-royal-gold">•</span> {rule}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="bg-white rounded-[2.5rem] p-8 border border-royal-gold/10 shadow-xl shadow-royal-gold/5">
                        <h3 className="text-xs font-black text-navy-deep tracking-tight uppercase mb-6 flex items-center gap-3">
                            <div className="w-1.5 h-4 bg-royal-gold rounded-full" /> Live Preview
                        </h3>
                        <div className="p-5 bg-ivory-subtle border border-royal-gold/10 rounded-2xl flex gap-4">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xl shadow-sm border border-royal-gold/5 shrink-0">
                                {icon}
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-[10px] font-black text-navy-deep uppercase truncate">{title || 'Your Title Here'}</h4>
                                <p className="text-[9px] font-bold text-slate-400 leading-relaxed mt-1 line-clamp-2">
                                    {message || 'The content of your broadcast message will appear here...'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminNotifications;
