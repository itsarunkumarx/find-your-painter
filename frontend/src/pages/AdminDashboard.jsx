import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import {
    FaUsers, FaTools, FaCalendarAlt, FaCreditCard, FaChartBar,
    FaShieldAlt, FaBan, FaCheck, FaExclamationTriangle, FaSearch,
    FaGlobe, FaBolt, FaCrown, FaDatabase, FaArrowUp, FaAngleRight, FaHeadset,
    FaSignOutAlt, FaIdCard, FaImages, FaExternalLinkAlt
} from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';

const StatCard = ({ icon: Icon, label, value, trend, color, delay }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay }}
        className="glass-card p-8 shadow-[0_15px_45px_-10px_rgba(212,175,55,0.08)] relative overflow-hidden group"
    >
        <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center text-2xl mb-6 shadow-sm group-hover:scale-110 transition-transform`}>
            <Icon />
        </div>
        <p className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-[0.3em] mb-2">{label}</p>
        <div className="flex items-end justify-between">
            <h3 className="text-4xl font-black text-[var(--text-main)] tracking-tighter leading-none">{value}</h3>
            <span className="text-[10px] font-black text-green-500 bg-green-500/10 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
                <FaArrowUp className="text-[8px]" /> {trend}
            </span>
        </div>
    </motion.div>
);

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'users';

    const [stats, setStats] = useState({
        usersCount: 0,
        workersCount: 0,
        bookingsCount: 0,
        revenue: 0
    });
    const [users, setUsers] = useState([]);
    const [workers, setWorkers] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [revenueData, setRevenueData] = useState([]);
    const [loading, setLoading] = useState(true);

    const setActiveTab = (tab) => {
        setSearchParams({ tab });
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const [usersRes, workersRes, bookingsRes, statsRes, revenueRes] = await Promise.all([
                    axios.get(`${import.meta.env.VITE_API_URL}/api/admin/users`, config).catch(() => ({ data: [] })),
                    axios.get(`${import.meta.env.VITE_API_URL}/api/admin/workers`, config).catch(() => ({ data: [] })),
                    axios.get(`${import.meta.env.VITE_API_URL}/api/admin/bookings`, config).catch(() => ({ data: [] })),
                    axios.get(`${import.meta.env.VITE_API_URL}/api/admin/stats`, config).catch(() => ({
                        data: {
                            usersCount: 0,
                            workersCount: 0,
                            bookingsCount: 0,
                            revenue: 0
                        }
                    })),
                    axios.get(`${import.meta.env.VITE_API_URL}/api/admin/revenue`, config).catch(() => ({ data: [] }))
                ]);
                setUsers(usersRes.data);
                setWorkers(workersRes.data);
                setBookings(bookingsRes.data);
                setStats({
                    usersCount: statsRes.data.users || 0,
                    workersCount: statsRes.data.workers || 0,
                    bookingsCount: statsRes.data.activeJobs || 0,
                    revenue: statsRes.data.totalValue || 0
                });
                setRevenueData(revenueRes.data);
            } catch (error) {
                console.error("Admin fetch error", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const toggleUserBlock = async (userId) => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await axios.put(`${import.meta.env.VITE_API_URL}/api/admin/users/${userId}/toggle-block`, {}, config);
            setUsers(prev => prev.map(u => u._id === userId ? { ...u, isBlocked: !u.isBlocked } : u));
        } catch (error) {
            alert("Administrative directive failed");
        }
    };

    const handleVerifyWorker = async (workerId, status) => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.put(`${import.meta.env.VITE_API_URL}/api/admin/workers/${workerId}/verify`, { status }, config);
            setWorkers(prev => prev.map(w => w._id === workerId ? { ...w, verificationStatus: status, isVerified: status === 'approved' } : w));
            alert(`Worker ${status} successfully`);
        } catch (error) {
            alert("Verification update failed");
        }
    };

    const barData = [
        { name: 'Mon', revenue: 4200 },
        { name: 'Tue', revenue: 5800 },
        { name: 'Wed', revenue: 3900 },
        { name: 'Thu', revenue: 7100 },
        { name: 'Fri', revenue: 8400 },
        { name: 'Sat', revenue: 9200 },
        { name: 'Sun', revenue: 6500 },
    ];

    const pieData = [
        { name: 'User Cluster', value: stats.usersCount },
        { name: 'Expert Fleet', value: stats.workersCount },
    ];
    const COLORS = ['#D4AF37', '#0F172A'];

    const pendingVerifications = workers.filter(w => w.verificationStatus === 'pending').length;

    return (
        <div className="space-y-10 pb-12">
            {/* National Command Center */}
            <div className="glass-card p-10 shadow-2xl shadow-royal-gold/5 relative overflow-hidden group transition-colors duration-500">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-royal-gold/5 rounded-full blur-[150px] -z-10 translate-x-1/3 -translate-y-1/2" />

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                    <div className="space-y-5">
                        <div className="flex items-center gap-4 text-royal-gold font-black uppercase tracking-[0.5em] text-[10px]">
                            <FaGlobe className="animate-spin-slow" /> Global Platform Intelligence
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-[var(--text-main)] tracking-tight leading-none">
                            System <span className="bg-gradient-to-r from-royal-gold-deep via-royal-gold to-royal-gold-light bg-clip-text text-transparent italic">Administrator</span>
                        </h1>
                        <div className="flex items-center gap-6 mt-6">
                            <div className="flex items-center gap-3 px-6 py-3 bg-green-500/10 text-green-600 rounded-2xl border border-green-500/10 shadow-sm">
                                <FaBolt className="text-[10px]" /> <span className="text-[10px] font-black uppercase tracking-widest">Core Online</span>
                            </div>
                            <div className="flex items-center gap-3 px-6 py-3 bg-[var(--text-main)] text-royal-gold rounded-2xl shadow-xl shadow-royal-gold/20">
                                <FaShieldAlt className="text-[10px]" /> <span className="text-[10px] font-black uppercase tracking-widest">Secure Entry</span>
                            </div>
                            <button
                                onClick={() => { logout(); navigate('/roles'); }}
                                className="flex items-center gap-3 px-6 py-3 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/10 hover:bg-red-500 hover:text-white transition-all shadow-sm group"
                            >
                                <FaSignOutAlt className="text-[10px] group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Sign Out Hub</span>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-8 bg-[var(--bg-highlight)]/50 rounded-[2.5rem] border border-royal-gold/10 text-center px-10 shadow-inner group-hover:bg-[var(--bg-base)] transition-colors duration-500">
                            <span className="block text-[10px] font-black uppercase tracking-[0.3em] text-royal-gold mb-3">Health Audit</span>
                            <span className="text-3xl font-black text-[var(--text-main)]">99.9<span className="text-sm text-[var(--text-muted)] ml-1">%</span></span>
                        </div>
                        <div className="p-8 bg-[var(--bg-highlight)]/50 rounded-[2.5rem] border border-royal-gold/10 text-center px-10 shadow-inner group-hover:bg-[var(--bg-base)] transition-colors duration-500">
                            <span className="block text-[10px] font-black uppercase tracking-[0.3em] text-royal-gold mb-3">Sync Speed</span>
                            <span className="text-3xl font-black text-[var(--text-main)]">12<span className="text-sm text-[var(--text-muted)] ml-1">ms</span></span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Platform Sovereignty Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <StatCard label="User Base" value={stats.usersCount} trend="+12.5%" icon={FaUsers} color="bg-royal-gold/10 text-royal-gold" delay={0.1} />
                <StatCard label="Fleet Capacity" value={stats.workersCount} trend="+4.2%" icon={FaTools} color="bg-yellow-50 text-yellow-500" delay={0.2} />
                <StatCard label="Total Missions" value={stats.bookingsCount} trend="+18.9%" icon={FaCalendarAlt} color="bg-navy-deep text-white" delay={0.3} />
                <StatCard label="Daily Revenue" value={`₹${stats.revenue}`} trend="+22.1%" icon={FaCreditCard} color="bg-green-50 text-green-500" delay={0.4} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                {/* Tactical Analytics */}
                <div className="xl:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="glass-card p-10 shadow-2xl shadow-royal-gold/5">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h3 className="text-lg font-black text-[var(--text-main)] tracking-tight uppercase">Revenue Analytics</h3>
                                <p className="text-[8px] font-black text-royal-gold uppercase tracking-[0.4em] mt-1">Monetary Velocity</p>
                            </div>
                            <FaChartBar className="text-royal-gold/20 text-2xl" />
                        </div>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={revenueData.length > 0 ? revenueData : barData}>
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: '900', fill: 'var(--text-muted)' }} />
                                    <Tooltip cursor={{ fill: 'var(--bg-highlight)', opacity: 0.1 }} contentStyle={{ backgroundColor: 'var(--glass-bg)', borderRadius: '24px', border: '1px solid var(--glass-border)', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', color: 'var(--text-main)', fontSize: '10px', fontWeight: 'bold' }} />
                                    <Bar dataKey="revenue" fill="var(--royal-gold)" radius={[12, 12, 12, 12]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="glass-card p-10 shadow-2xl shadow-royal-gold/5">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h3 className="text-lg font-black text-[var(--text-main)] tracking-tight uppercase">Fleet Distribution</h3>
                                <p className="text-[8px] font-black text-royal-gold uppercase tracking-[0.4em] mt-1">Resource allocation</p>
                            </div>
                            <FaDatabase className="text-royal-gold/20 text-2xl" />
                        </div>
                        <div className="h-64 w-full flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={pieData} innerRadius={60} outerRadius={90} paddingAngle={12} dataKey="value">
                                        {pieData.map((entry, index) => <Cell key={index} fill={index === 0 ? 'var(--royal-gold)' : 'var(--text-main)'} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: 'var(--glass-bg)', borderRadius: '24px', border: '1px solid var(--glass-border)', color: 'var(--text-main)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex justify-center gap-10 mt-6">
                            {pieData.map((entry, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: i === 0 ? 'var(--royal-gold)' : 'var(--text-main)' }} />
                                    <span className="text-[10px] font-black uppercase text-[var(--text-muted)]">{entry.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Management Directives */}
                <div className="space-y-10">
                    <div className="bg-[var(--text-main)] rounded-[3.5rem] p-10 text-[var(--bg-base)] relative shadow-2xl shadow-royal-gold/30 overflow-hidden group">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-royal-gold/10 rounded-full blur-3xl transition-all duration-1000 group-hover:scale-150" />
                        <div className="relative z-10">
                            <h3 className="text-2xl font-black tracking-tight mb-2">Platform Power</h3>
                            <p className="text-[10px] font-black text-royal-gold uppercase tracking-[0.4em] mb-6 underline decoration-royal-gold/30">Administrative Layer V2.0</p>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5 group-hover:border-royal-gold/20 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-royal-gold/20 text-royal-gold rounded-xl flex items-center justify-center text-sm"><FaShieldAlt /></div>
                                        <div className="text-[10px] font-bold uppercase">Security Protocol</div>
                                    </div>
                                    <div className="w-10 h-5 bg-green-500/20 rounded-full relative"><div className="absolute right-1 top-1 w-3 h-3 bg-green-500 rounded-full" /></div>
                                </div>
                                <div className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5 group-hover:border-royal-gold/20 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-yellow-500/20 text-yellow-500 rounded-xl flex items-center justify-center text-sm"><FaArrowUp /></div>
                                        <div className="text-[10px] font-bold uppercase">Market Expansion</div>
                                    </div>
                                    <div className="text-royal-gold text-[10px] font-black">+42%</div>
                                </div>
                                <button className="w-full btn-primary !bg-[var(--bg-base)] !text-[var(--text-main)] mt-4 shadow-2xl shadow-black/10 group-hover:scale-105 transition-transform">Access Core Config</button>
                            </div>
                        </div>
                    </div>

                    {/* Pending Verifications Badge */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        onClick={() => setActiveTab('workers')}
                        className="bg-white rounded-[3rem] p-8 border border-royal-gold/10 shadow-xl cursor-pointer relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-royal-gold/5 rounded-full blur-2xl" />
                        <div className="flex items-center justify-between relative z-10">
                            <div>
                                <p className="text-[10px] font-black text-royal-gold uppercase tracking-[0.3em] mb-1">Queue Status</p>
                                <h4 className="text-xl font-black text-navy-deep uppercase tracking-tighter">Pending Verifications</h4>
                            </div>
                            <div className="w-12 h-12 bg-royal-gold/10 text-royal-gold rounded-2xl flex items-center justify-center text-xl font-black">
                                {pendingVerifications}
                            </div>
                        </div>
                        {pendingVerifications > 0 && (
                            <div className="mt-4 flex items-center gap-2 text-red-500 text-[10px] font-black uppercase tracking-widest animate-pulse">
                                <FaExclamationTriangle /> Action Required
                            </div>
                        )}
                    </motion.div>

                    {/* Support Hub Link */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        onClick={() => navigate('/admin-support')}
                        className="bg-gradient-to-br from-navy-deep to-slate-800 rounded-[3rem] p-8 text-white shadow-2xl cursor-pointer relative overflow-hidden group"
                    >
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:bg-royal-gold/10 transition-colors" />
                        <div className="flex items-center gap-6 relative z-10">
                            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-2xl text-royal-gold shadow-inner border border-white/5">
                                <FaHeadset />
                            </div>
                            <div>
                                <h4 className="text-xl font-black uppercase tracking-tighter">Support Hub</h4>
                                <p className="text-[10px] font-medium text-white/40 uppercase tracking-widest group-hover:text-royal-gold transition-colors">Manage platform disputes</p>
                            </div>
                            <FaAngleRight className="ml-auto text-white/20 group-hover:text-white transition-colors" />
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Directive Hub: Identity & Operation Directory */}
            <div className="bg-white rounded-[3.5rem] border border-royal-gold/10 shadow-2xl shadow-royal-gold/5 overflow-hidden">
                <div className="p-10 border-b border-royal-gold/5 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div>
                        <h3 className="text-2xl font-black text-navy-deep tracking-tight uppercase">
                            {activeTab === 'users' ? 'User Sovereignty Directory' :
                                activeTab === 'workers' ? 'Expert Fleet Registry' :
                                    'Mission Archive'}
                        </h3>
                        <p className="text-[10px] font-black text-royal-gold uppercase tracking-[0.5em] mt-1">
                            {activeTab === 'users' ? 'Platform Population Control' :
                                activeTab === 'workers' ? 'Verified Service Specialists' :
                                    'Tactical Deployment History'}
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <div className="relative">
                            <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-royal-gold/30 text-sm" />
                            <input type="text" placeholder="Filter identities..." className="pl-14 pr-8 py-4 bg-[var(--bg-highlight)] border-none rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest text-[var(--text-main)] focus:ring-2 ring-royal-gold/20 outline-none" />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[var(--bg-highlight)]/50 border-b border-royal-gold/5">
                                <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-royal-gold">
                                    {activeTab === 'bookings' ? 'Mission' : 'Identity'}
                                </th>
                                <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-royal-gold">
                                    {activeTab === 'bookings' ? 'Status' : 'Sector Access'}
                                </th>
                                <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-royal-gold">
                                    {activeTab === 'bookings' ? 'Mission Date' : 'Join Date'}
                                </th>
                                <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-royal-gold">Integrity Status</th>
                                <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-royal-gold">Directives</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-royal-gold/[0.03]">
                            {activeTab === 'users' && users.map((u) => (
                                <tr key={u._id} className="hover:bg-[var(--bg-highlight)]/30 transition-colors group">
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-5">
                                            <img src={u.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`} className="w-14 h-14 rounded-2xl border-2 border-[var(--bg-base)] shadow-lg group-hover:scale-110 transition-transform" />
                                            <div>
                                                <div className="text-sm font-black text-[var(--text-main)] group-hover:text-royal-gold transition-colors">{u.name}</div>
                                                <div className="text-[9px] text-[var(--text-muted)] font-bold tracking-wider">{u.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${u.role === 'admin' ? 'bg-navy-deep text-white border-navy-deep shadow-lg shadow-navy-deep/20' :
                                            u.role === 'worker' ? 'bg-royal-gold/10 text-royal-gold border-royal-gold/20' :
                                                'bg-slate-50 text-slate-500 border-slate-100'
                                            }`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-10 py-8 text-[11px] font-black text-[var(--text-muted)]/60">{new Date(u.createdAt).toLocaleDateString()}</td>
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${u.isBlocked ? 'bg-red-500 animate-pulse' : 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]'}`} />
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${u.isBlocked ? 'text-red-500' : 'text-slate-500'}`}>
                                                {u.isBlocked ? 'Terminal Locked' : 'Optimal'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <button
                                            onClick={() => toggleUserBlock(u._id)}
                                            className={`p-3.5 rounded-xl transition-all shadow-sm ${u.isBlocked ? 'bg-green-50 text-green-500 hover:bg-green-100' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}
                                        >
                                            {u.isBlocked ? <FaCheck /> : <FaBan />}
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {activeTab === 'workers' && workers.map((w) => (
                                <tr key={w._id} className="hover:bg-[var(--bg-highlight)]/30 transition-colors group">
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-5">
                                            <img src={w.user?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${w.user?.name}`} className="w-14 h-14 rounded-2xl border-2 border-[var(--bg-base)] shadow-lg group-hover:scale-110 transition-transform" />
                                            <div>
                                                <div className="text-sm font-black text-[var(--text-main)] group-hover:text-royal-gold transition-colors">{w.user?.name}</div>
                                                <div className="text-[9px] text-[var(--text-muted)] font-bold tracking-wider">{w.user?.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <span className="bg-royal-gold/10 text-royal-gold border border-royal-gold/20 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest">
                                            {w.skills?.[0] || 'Worker'}
                                        </span>
                                    </td>
                                    <td className="px-10 py-8 text-[11px] font-black text-[var(--text-muted)]/60">{new Date(w.createdAt).toLocaleDateString()}</td>
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${w.isVerified ? 'bg-green-500' : 'bg-yellow-500'}`} />
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${w.isVerified ? 'text-green-500' : 'text-yellow-500'}`}>
                                                {w.isVerified ? 'Verified' : 'Pending'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="flex gap-2">
                                            {w.idProof && (
                                                <a
                                                    href={w.idProof}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="p-3.5 bg-blue-50 text-blue-500 rounded-xl hover:bg-blue-100 transition-all shadow-sm"
                                                    title="View ID Proof"
                                                >
                                                    <FaIdCard />
                                                </a>
                                            )}
                                            {w.workImages && w.workImages.length > 0 && (
                                                <button
                                                    onClick={() => {/* Open gallery modal or navigate */ }}
                                                    className="p-3.5 bg-indigo-50 text-indigo-500 rounded-xl hover:bg-indigo-100 transition-all shadow-sm"
                                                    title="View Portfolio"
                                                >
                                                    <FaImages />
                                                </button>
                                            )}
                                            {w.verificationStatus === 'pending' ? (
                                                <>
                                                    <button
                                                        onClick={() => handleVerifyWorker(w._id, 'approved')}
                                                        className="p-3.5 bg-green-50 text-green-500 rounded-xl hover:bg-green-100 transition-all shadow-sm"
                                                        title="Approve"
                                                    >
                                                        <FaCheck />
                                                    </button>
                                                    <button
                                                        onClick={() => handleVerifyWorker(w._id, 'rejected')}
                                                        className="p-3.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all shadow-sm"
                                                        title="Reject"
                                                    >
                                                        <FaBan />
                                                    </button>
                                                </>
                                            ) : (
                                                <button className="p-3.5 bg-[var(--bg-highlight)] text-[var(--text-muted)] rounded-xl hover:text-royal-gold transition-all">
                                                    <FaAngleRight />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {activeTab === 'bookings' && bookings.map((b) => (
                                <tr key={b._id} className="hover:bg-[var(--bg-highlight)]/30 transition-colors group">
                                    <td className="px-10 py-8">
                                        <div className="flex flex-col">
                                            <div className="text-sm font-black text-[var(--text-main)] group-hover:text-royal-gold transition-colors">{b.user?.name}</div>
                                            <div className="text-[9px] text-[var(--text-muted)] font-bold tracking-wider">to {b.worker?.user?.name}</div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="flex flex-col gap-1">
                                            <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${b.status === 'completed' ? 'bg-green-50 text-green-500 border-green-100' :
                                                b.status === 'accepted' ? 'bg-royal-gold/10 text-royal-gold border-royal-gold/20' :
                                                    'bg-slate-50 text-slate-500 border-slate-100'
                                                }`}>
                                                {b.status}
                                            </span>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${b.paymentMethod === 'cash' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {b.paymentMethod || 'online'}
                                                </span>
                                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${b.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {b.paymentStatus}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-[11px] font-black text-[var(--text-muted)]/60">{new Date(b.date).toLocaleDateString()}</td>
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${b.subStatus === 'completed' ? 'bg-green-500' : 'bg-[var(--glass-border)]'}`} />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                                                {b.subStatus || 'Scheduled'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <button className="p-3.5 bg-[var(--bg-highlight)] text-[var(--text-muted)] rounded-xl hover:text-royal-gold transition-all">
                                            <FaAngleRight />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
