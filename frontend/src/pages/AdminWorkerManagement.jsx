import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaUserSlash, FaUserCheck, FaPlus, FaCheck, FaTimes, FaMapMarkerAlt, FaToolbox, FaRupeeSign, FaShieldAlt, FaIdCard, FaImages } from 'react-icons/fa';

const AdminWorkerManagement = () => {
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all'); // all, verified, pending, rejected
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newWorker, setNewWorker] = useState({
        name: '', email: '', password: '', skills: '', experience: '', location: '', price: '', bio: ''
    });

    const fetchWorkers = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/workers`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setWorkers(data);
        } catch (error) {
            console.error('Fetch workers failed', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWorkers();
    }, []);

    const toggleBlock = async (workerId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${import.meta.env.VITE_API_URL}/api/admin/workers/${workerId}/block`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchWorkers();
        } catch (error) {
            console.error('Toggle block failed', error);
        }
    };

    const verifyWorker = async (workerId, status) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${import.meta.env.VITE_API_URL}/api/admin/workers/${workerId}/verify`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchWorkers();
        } catch (error) {
            console.error('Verify worker failed', error);
        }
    };

    const handleAddWorker = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/workers`, {
                ...newWorker,
                skills: newWorker.skills.split(',').map(s => s.trim()),
                experience: Number(newWorker.experience),
                price: Number(newWorker.price)
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIsAddModalOpen(false);
            setNewWorker({ name: '', email: '', password: '', skills: '', experience: '', location: '', price: '', bio: '' });
            fetchWorkers();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to add worker');
        }
    };

    const filteredWorkers = workers.filter(w => {
        const name = w.user?.name || '';
        const email = w.user?.email || '';
        const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filter === 'all' || w.verificationStatus === filter;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-navy-deep tracking-tight uppercase">Worker <span className="text-royal-gold">Management</span></h1>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Onboard and manage painting specialists</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-deep/20 text-xs" />
                        <input
                            type="text"
                            placeholder="Search workers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-white border border-royal-gold/10 rounded-2xl py-3 pl-11 pr-4 text-xs font-bold text-navy-deep focus:outline-none focus:border-royal-gold w-64 shadow-sm"
                        />
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-navy-deep text-royal-gold px-6 py-3 rounded-2xl flex items-center gap-3 text-xs font-black uppercase tracking-widest shadow-xl shadow-navy-deep/20 hover:scale-105 transition-all"
                    >
                        <FaPlus /> Add Expert
                    </button>
                </div>
            </div>

            <div className="flex gap-2">
                {['all', 'approved', 'pending', 'rejected'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-navy-deep text-royal-gold shadow-lg' : 'bg-white text-slate-400 border border-royal-gold/10 hover:border-royal-gold/30'
                            }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-[2.5rem] border border-royal-gold/10 shadow-2xl shadow-royal-gold/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-ivory-subtle/30 border-b border-royal-gold/5">
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-navy-deep/40">Worker</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-navy-deep/40">Location & Skills</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-navy-deep/40">Rate</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-navy-deep/40">Verification</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-navy-deep/40 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-royal-gold/5">
                            <AnimatePresence mode="popLayout">
                                {filteredWorkers.map((worker, i) => (
                                    <motion.tr
                                        key={worker._id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                        className="hover:bg-ivory-subtle/20 transition-colors group"
                                    >
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <img
                                                    src={worker.user?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${worker.user?.name}`}
                                                    className="w-10 h-10 rounded-xl border border-royal-gold/10 grayscale group-hover:grayscale-0 transition-all"
                                                    alt=""
                                                />
                                                <div>
                                                    <p className="text-xs font-black text-navy-deep">{worker.user?.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 lowercase">{worker.user?.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-[9px] font-black text-navy-deep/60 uppercase tracking-wider">
                                                    <FaMapMarkerAlt className="text-royal-gold" /> {worker.location}
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {worker.skills.slice(0, 3).map(s => (
                                                        <span key={s} className="px-1.5 py-0.5 bg-navy-deep/5 text-navy-deep text-[8px] font-black uppercase rounded">{s}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-xs font-black text-navy-deep flex items-center gap-1">
                                                <FaRupeeSign className="text-royal-gold text-[10px]" /> {worker.price}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${worker.verificationStatus === 'approved' ? 'bg-green-50 text-green-500' :
                                                worker.verificationStatus === 'pending' ? 'bg-royal-gold/10 text-royal-gold' :
                                                    'bg-red-50 text-red-500'
                                                }`}>
                                                {worker.verificationStatus}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {worker.idProof && (
                                                    <a
                                                        href={worker.idProof}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all"
                                                        title="View ID Proof"
                                                    >
                                                        <FaIdCard size={12} />
                                                    </a>
                                                )}
                                                {worker.workImages && worker.workImages.length > 0 && (
                                                    <button
                                                        className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all"
                                                        title="View Portfolio"
                                                    >
                                                        <FaImages size={12} />
                                                    </button>
                                                )}
                                                {worker.verificationStatus === 'pending' && (
                                                    <>
                                                        <button onClick={() => verifyWorker(worker._id, 'approved')} className="p-2.5 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-all" title="Approve"><FaCheck size={12} /></button>
                                                        <button onClick={() => verifyWorker(worker._id, 'rejected')} className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all" title="Reject"><FaTimes size={12} /></button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => toggleBlock(worker._id)}
                                                    className={`p-2.5 rounded-xl transition-all ${worker.user?.isBlocked ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-red-50 text-red-600 hover:bg-red-100'
                                                        }`}
                                                    title={worker.user?.isBlocked ? 'Unblock' : 'Block'}
                                                >
                                                    {worker.user?.isBlocked ? <FaUserCheck size={12} /> : <FaUserSlash size={12} />}
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Worker Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-navy-deep/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-[3rem] border border-royal-gold/10 shadow-2xl w-full max-w-2xl overflow-hidden"
                        >
                            <div className="p-8 border-b border-royal-gold/5 flex items-center justify-between bg-ivory-subtle/30">
                                <div>
                                    <h2 className="text-xl font-black text-navy-deep uppercase tracking-tighter">Manual <span className="text-royal-gold">Onboarding</span></h2>
                                    <p className="text-[10px] font-black text-royal-gold uppercase tracking-widest mt-1">Register a new verified specialist</p>
                                </div>
                                <button onClick={() => setIsAddModalOpen(false)} className="p-3 hover:bg-royal-gold/10 rounded-2xl text-navy-deep/30 hover:text-royal-gold transition-all"><FaTimes /></button>
                            </div>

                            <form onSubmit={handleAddWorker} className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-navy-deep/40 ml-1">Full Name</label>
                                        <input required type="text" value={newWorker.name} onChange={e => setNewWorker({ ...newWorker, name: e.target.value })} className="w-full bg-ivory-subtle border border-royal-gold/10 rounded-2xl py-3 px-4 text-xs font-bold text-navy-deep focus:outline-none focus:border-royal-gold" placeholder="John Doe" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-navy-deep/40 ml-1">Email Address</label>
                                        <input required type="email" value={newWorker.email} onChange={e => setNewWorker({ ...newWorker, email: e.target.value })} className="w-full bg-ivory-subtle border border-royal-gold/10 rounded-2xl py-3 px-4 text-xs font-bold text-navy-deep focus:outline-none focus:border-royal-gold" placeholder="john@example.com" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-navy-deep/40 ml-1">Password</label>
                                        <input required type="password" value={newWorker.password} onChange={e => setNewWorker({ ...newWorker, password: e.target.value })} className="w-full bg-ivory-subtle border border-royal-gold/10 rounded-2xl py-3 px-4 text-xs font-bold text-navy-deep focus:outline-none focus:border-royal-gold" placeholder="••••••••" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-navy-deep/40 ml-1">Location</label>
                                        <input required type="text" value={newWorker.location} onChange={e => setNewWorker({ ...newWorker, location: e.target.value })} className="w-full bg-ivory-subtle border border-royal-gold/10 rounded-2xl py-3 px-4 text-xs font-bold text-navy-deep focus:outline-none focus:border-royal-gold" placeholder="Mumbai, India" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-navy-deep/40 ml-1">Experience (Years)</label>
                                        <input required type="number" value={newWorker.experience} onChange={e => setNewWorker({ ...newWorker, experience: e.target.value })} className="w-full bg-ivory-subtle border border-royal-gold/10 rounded-2xl py-3 px-4 text-xs font-bold text-navy-deep focus:outline-none focus:border-royal-gold" placeholder="5" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-navy-deep/40 ml-1">Daily Rate (₹)</label>
                                        <input required type="number" value={newWorker.price} onChange={e => setNewWorker({ ...newWorker, price: e.target.value })} className="w-full bg-ivory-subtle border border-royal-gold/10 rounded-2xl py-3 px-4 text-xs font-bold text-navy-deep focus:outline-none focus:border-royal-gold" placeholder="1500" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-navy-deep/40 ml-1">Skills (Comma separated)</label>
                                    <input required type="text" value={newWorker.skills} onChange={e => setNewWorker({ ...newWorker, skills: e.target.value })} className="w-full bg-ivory-subtle border border-royal-gold/10 rounded-2xl py-3 px-4 text-xs font-bold text-navy-deep focus:outline-none focus:border-royal-gold" placeholder="Interior, Exterior, Texture" />
                                </div>

                                <div className="flex justify-end gap-3 mt-4">
                                    <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-navy-deep transition-all">Cancel</button>
                                    <button type="submit" className="px-10 py-4 bg-navy-deep text-royal-gold rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-navy-deep/20 hover:scale-105 transition-all">Onboard Expert</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminWorkerManagement;
