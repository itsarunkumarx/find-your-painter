import { useState, useEffect } from 'react';
import api from '../utils/api';
import { motion } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { FaUsers, FaTrophy, FaChartLine, FaMapMarkerAlt, FaPaintBrush } from 'react-icons/fa';

import { useTranslation } from 'react-i18next';

const COLORS = ['#D4AF37', '#0D1B2A', '#f59e0b', '#10b981', '#6366f1', '#ec4899'];

const AdminAnalyticsPage = () => {
    const { t } = useTranslation();
    if (!t) return null;
    const [stats, setStats] = useState(null);
    const [workers, setWorkers] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);


    const [serviceTypes, setServiceTypes] = useState([]);

    useEffect(() => {
        const fetch = async () => {
            try {
                const [statsRes, workersRes, bookingsRes, serviceRes] = await Promise.all([
                    api.get('/admin/stats'),
                    api.get('/admin/workers'),
                    api.get('/admin/bookings'),
                    api.get('/admin/service-breakdown'),
                ]);
                setStats(statsRes.data);
                setWorkers(workersRes.data);
                setBookings(bookingsRes.data);
                setServiceTypes(serviceRes.data);
            } catch (e) { console.error(e); } finally { setLoading(false); }
        };
        fetch();
    }, []);

    // Build weekly booking trend from real data
    const weeklyTrend = (() => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const map = {};
        days.forEach(d => map[d] = 0);
        bookings.forEach(b => {
            const day = days[new Date(b.createdAt).getDay()];
            map[day] = (map[day] || 0) + 1;
        });
        return days.map(d => ({ day: d, bookings: map[d] }));
    })();

    // Top earning workers (by completed bookings)
    const topWorkers = workers
        .filter(w => w.isVerified)
        .map(w => ({
            name: w.user?.name?.split(' ')[0] || 'Worker',
            earnings: bookings.filter(b => b.worker?._id === w._id && b.status === 'completed').length * (w.price || 0),
            jobs: bookings.filter(b => b.worker?._id === w._id).length,
            rating: w.rating,
        }))
        .sort((a, b) => b.earnings - a.earnings)
        .slice(0, 5);

    const ChartCard = ({ title, children, className = '' }) => (
        <div className={`bg-white rounded-[2.5rem] border border-royal-gold/10 shadow-lg p-7 ${className}`}>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-navy-deep/40 mb-6">{title}</p>
            {children}
        </div>
    );

    if (loading) return (
        <div className="grid grid-cols-2 gap-5">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-white rounded-[2.5rem] animate-pulse border border-slate-50" />)}
        </div>
    );

    return (
        <div className="space-y-8 pb-12">
            <div>
                <h1 className="text-3xl font-black text-navy-deep tracking-tight">
                    {t('platform_analytics').split(' ')[0]} <span className="text-royal-gold">{t('platform_analytics').split(' ')[1]}</span>
                </h1>
                <p className="text-slate-400 text-xs uppercase tracking-widest mt-1 font-bold">
                    {t('live_intel')}
                </p>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: t('total_users_kpi'), value: stats?.users || 0, icon: FaUsers, color: 'text-blue-500' },
                    { label: t('verified_painters_kpi'), value: stats?.workers || 0, icon: FaPaintBrush, color: 'text-royal-gold' },
                    { label: t('active_jobs_kpi'), value: stats?.activeJobs || 0, icon: FaChartLine, color: 'text-green-500' },
                    { label: t('platform_revenue_kpi'), value: `₹${(stats?.totalValue || 0).toLocaleString('en-IN')}`, icon: FaTrophy, color: 'text-purple-500' },
                ].map((kpi, i) => (
                    <motion.div key={kpi.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                        className="bg-white rounded-[2rem] border border-royal-gold/10 p-6 shadow-sm">
                        <kpi.icon className={`text-xl mb-3 ${kpi.color}`} />
                        <p className="text-[8px] font-black uppercase tracking-[0.3em] text-navy-deep/30 mb-1">{kpi.label}</p>
                        <p className="text-xl font-black text-navy-deep">{kpi.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title={t('weekly_trend')}>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={weeklyTrend} barSize={28}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="day" tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                            <Tooltip contentStyle={{ borderRadius: 16, border: 'none', background: '#0D1B2A', color: '#D4AF37', fontSize: 12 }} />
                            <Bar dataKey="bookings" fill="#D4AF37" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title={t('service_breakdown')}>
                    <div className="flex items-center gap-4">
                        <ResponsiveContainer width="50%" height={200}>
                            <PieChart>
                                <Pie data={serviceTypes} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                                    {serviceTypes.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', background: '#0D1B2A', color: '#D4AF37', fontSize: 11 }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-2 flex-1">
                            {serviceTypes.map((s, i) => (
                                <div key={s.name} className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                                    <span className="text-[9px] font-bold text-navy-deep/60 truncate">{s.name}</span>
                                    <span className="ml-auto text-[9px] font-black text-navy-deep">{s.value}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </ChartCard>
            </div>

            {/* Top Workers Leaderboard */}
            <ChartCard title={t('top_earners_leaderboard')}>
                {topWorkers.length === 0 ? (
                    <p className="text-slate-300 text-xs font-black uppercase tracking-widest py-8 text-center">{t('no_jobs_completed')}</p>
                ) : (
                    <div className="space-y-3">
                        {topWorkers.map((w, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-royal-gold/15 transition-all">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm text-white ${i === 0 ? 'bg-royal-gold text-navy-deep' : i === 1 ? 'bg-slate-400' : 'bg-amber-700'}`}>
                                    #{i + 1}
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-black text-navy-deep">{w.name}</p>
                                    <div className="flex gap-4 mt-0.5">
                                        <span className="text-[9px] font-bold text-slate-400">{w.jobs} {t('jobs_count_label')}</span>
                                        <span className="text-[9px] font-bold text-royal-gold">★ {w.rating?.toFixed(1) || 'N/A'}</span>
                                    </div>
                                </div>
                                <p className="text-sm font-black text-green-600">₹{w.earnings.toLocaleString('en-IN')}</p>
                            </div>
                        ))}
                    </div>
                )}
            </ChartCard>

            {/* Booking Funnel */}
            <ChartCard title={t('booking_funnel')}>
                {(() => {
                    const total = bookings.length || 1;
                    const pending = bookings.filter(b => b.status === 'pending').length;
                    const accepted = bookings.filter(b => b.status === 'accepted').length;
                    const completed = bookings.filter(b => b.status === 'completed').length;
                    const funnel = [
                        { stage: t('funnel_requested'), count: total, pct: 100 },
                        { stage: t('funnel_accepted'), count: pending + accepted + completed, pct: Math.round(((pending + accepted + completed) / total) * 100) },
                        { stage: t('funnel_in_progress'), count: accepted + completed, pct: Math.round(((accepted + completed) / total) * 100) },
                        { stage: t('funnel_completed'), count: completed, pct: Math.round((completed / total) * 100) },
                    ];
                    return (
                        <div className="space-y-3">
                            {funnel.map((f, i) => (
                                <div key={f.stage}>
                                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest mb-1.5">
                                        <span className="text-navy-deep/60">{f.stage}</span>
                                        <span className="text-royal-gold">{f.count} ({f.pct}%)</span>
                                    </div>
                                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${f.pct}%` }} transition={{ delay: 0.3 + i * 0.1, duration: 0.8 }}
                                            className="h-full rounded-full" style={{ background: COLORS[i] }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    );
                })()}
            </ChartCard>
        </div>
    );
};

export default AdminAnalyticsPage;
