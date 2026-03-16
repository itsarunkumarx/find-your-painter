import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import { useTranslation } from 'react-i18next';
import {
    FaUsers, FaTools, FaCalendarAlt, FaCreditCard, FaChartBar,
    FaShieldAlt, FaBan, FaCheck, FaExclamationTriangle, FaSearch,
    FaGlobe, FaBolt, FaCrown, FaDatabase, FaArrowUp, FaAngleRight, FaHeadset,
    FaSignOutAlt, FaIdCard, FaImages, FaExternalLinkAlt, FaUserSlash, FaUserCheck, FaUserTimes, FaTrash
} from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
    PieChart, Pie, Legend
} from 'recharts';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '../components/ConfirmationModal';

const AdminDashboard = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'users';
    const { t } = useTranslation();
    if (!t) return null;
    const navigate = useNavigate();

    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [recentUsers, setRecentUsers] = useState([]);
    const [recentWorkers, setRecentWorkers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalConfig, setModalConfig] = useState({ isOpen: false, type: 'danger', title: '', message: '', onConfirm: () => {} });

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [statsRes, usersRes, workersRes] = await Promise.all([
                    api.get('/admin/stats'),
                    api.get('/admin/users'),
                    api.get('/admin/workers')
                ]);
                setStats(statsRes.data);
                setRecentUsers(usersRes.data.slice(0, 5));
                setRecentWorkers(workersRes.data.slice(0, 5));
            } catch (error) {
                console.error('Fetch dashboard failed', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    const kpis = [
        { label: t('total_users_kpi') || 'Total Users', value: stats?.users || 0, icon: FaUsers, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { label: t('verified_painters_kpi') || 'Verified Painters', value: stats?.workers || 0, icon: FaTools, color: 'text-royal-gold', bg: 'bg-royal-gold/10' },
        { label: t('active_jobs_kpi') || 'Active Jobs', value: stats?.activeJobs || 0, icon: FaCalendarAlt, color: 'text-green-500', bg: 'bg-green-500/10' },
        { label: t('platform_revenue_kpi') || 'Platform Revenue', value: `₹${(stats?.totalValue || 0).toLocaleString()}`, icon: FaCreditCard, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    ];

    const pieData = [
        { name: 'Active', value: stats?.workers || 0 },
        { name: 'Pending', value: stats?.pendingWorkers || 0 },
        { name: 'Suspended', value: stats?.suspendedWorkers || 0 },
    ];

    const chartData = [
        { name: 'Jan', val: 400 }, { name: 'Feb', val: 300 }, { name: 'Mar', val: 600 },
        { name: 'Apr', val: 800 }, { name: 'May', val: 700 }, { name: 'Jun', val: 900 }
    ];

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-12 h-12 border-4 border-royal-gold border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="space-y-10 pb-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-navy-deep tracking-tight uppercase leading-none">
                        Command <span className="text-royal-gold">Center</span>
                    </h1>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] mt-3">Platform Intelligence & Operational Control</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-6 py-3 bg-navy-deep text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-navy-deep/20 hover:scale-105 active:scale-95 transition-all">Export Intel</button>
                    <button onClick={() => navigate('/admin-settings')} className="p-3 bg-white border border-royal-gold/10 text-royal-gold rounded-xl hover:bg-royal-gold/5 transition-all"><FaTools /></button>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {kpis.map((kpi, i) => (
                    <motion.div
                        key={kpi.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white p-6 rounded-[2.5rem] border border-royal-gold/10 shadow-xl shadow-royal-gold/5 group hover:border-royal-gold/30 transition-all cursor-default"
                    >
                        <div className={`w-12 h-12 ${kpi.bg} rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                            <kpi.icon className={`text-xl ${kpi.color}`} />
                        </div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{kpi.label}</p>
                        <h3 className="text-2xl font-black text-navy-deep">{kpi.value}</h3>
                    </motion.div>
                ))}
            </div>

            {/* Analytics Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Trend Chart */}
                <div className="lg:col-span-2 bg-navy-deep p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-royal-gold/5 rounded-full blur-3xl -mr-32 -mt-32" />
                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <div>
                            <h3 className="text-white font-black uppercase tracking-tighter text-lg">Resource Utilization</h3>
                            <p className="text-royal-gold/40 text-[9px] font-black uppercase tracking-widest">Growth Velocity Hub</p>
                        </div>
                        <div className="flex gap-2">
                             <div className="px-3 py-1 bg-white/5 rounded-lg text-[8px] font-black text-white/40 uppercase tracking-widest">Real-time Feed</div>
                        </div>
                    </div>
                    <div className="h-[300px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 900 }} />
                                <YAxis hide />
                                <Tooltip 
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ backgroundColor: '#0D1B2A', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '1rem', color: '#fff', fontSize: '10px', fontWeight: 900 }}
                                />
                                <Bar dataKey="val" fill="#D4AF37" radius={[10, 10, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Composition Pie */}
                <div className="bg-white p-8 rounded-[3rem] border border-royal-gold/10 shadow-xl flex flex-col items-center justify-center">
                    <div className="text-center mb-8 w-full">
                        <div className="w-12 h-12 bg-royal-gold/5 flex items-center justify-center rounded-2xl mx-auto mb-4">
                            <FaChartBar className="text-royal-gold" />
                        </div>
                        <h3 className="text-navy-deep font-black uppercase tracking-tighter text-lg">Workforce Meta</h3>
                        <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Compositional Analytics</p>
                    </div>
                    <div className="h-[240px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={pieData} innerRadius={80} outerRadius={120} paddingAngle={10} dataKey="value">
                                    <Cell fill="var(--royal-gold)" />
                                    <Cell fill="var(--text-main)" />
                                    <Cell fill="var(--text-muted)" />
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: 'var(--glass-bg)', borderRadius: '1rem', border: '1px solid var(--glass-border)', fontWeight: 900, fontSize: '10px' }} />
                                <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">{value}</span>} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Tables Section */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Recent Users */}
                <div className="bg-white rounded-[3rem] border border-royal-gold/10 shadow-xl overflow-hidden">
                    <div className="p-8 border-b border-royal-gold/5 flex items-center justify-between">
                        <h3 className="font-black text-navy-deep uppercase tracking-tighter">Recent Operatives</h3>
                        <button onClick={() => navigate('/admin-users')} className="text-[9px] font-black text-royal-gold uppercase tracking-widest hover:translate-x-1 transition-transform inline-flex items-center gap-2">
                            Access Registry <FaAngleRight />
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <tbody className="divide-y divide-royal-gold/5">
                                {recentUsers.map(u => (
                                    <tr key={u._id} className="group hover:bg-ivory-subtle transition-colors">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden border border-royal-gold/10 group-hover:scale-110 transition-transform">
                                                    <img src={u.profileImage || "/assets/premium-avatar.png"} alt="" className="w-full h-full object-cover" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-navy-deep">{u.name}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 lowercase">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${u.isBlocked ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                                                {u.isBlocked ? 'Inhibited' : 'Active'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Workers */}
                <div className="bg-white rounded-[3rem] border border-royal-gold/10 shadow-xl overflow-hidden">
                    <div className="p-8 border-b border-royal-gold/5 flex items-center justify-between">
                        <h3 className="font-black text-navy-deep uppercase tracking-tighter">Verified Assets</h3>
                        <button onClick={() => navigate('/admin-workers')} className="text-[9px] font-black text-royal-gold uppercase tracking-widest hover:translate-x-1 transition-transform inline-flex items-center gap-2">
                            Asset Hub <FaAngleRight />
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <tbody className="divide-y divide-royal-gold/5">
                                {recentWorkers.map(w => (
                                    <tr key={w._id} className="group hover:bg-ivory-subtle transition-colors">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden border border-royal-gold/10 group-hover:scale-110 transition-transform">
                                                    <img src={w.user?.profileImage || "/assets/premium-avatar.png"} alt="" className="w-full h-full object-cover" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-navy-deep">{w.user?.name || 'Asset'}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{w.location}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <span className="text-[10px] font-black text-navy-deep">₹{w.price || 0}<span className="text-[8px] text-slate-400 ml-1">/hr</span></span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                onConfirm={modalConfig.onConfirm}
                title={modalConfig.title}
                message={modalConfig.message}
                confirmText={modalConfig.confirmText}
                type={modalConfig.type}
            />
        </div>
    );
};

export default AdminDashboard;
