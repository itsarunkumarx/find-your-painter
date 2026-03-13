import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import {
    FaSearch, FaFilter, FaStar, FaMapMarkerAlt,
    FaCalendarCheck, FaClock, FaCheckCircle, FaHeart,
    FaCrown, FaShieldAlt, FaChartBar, FaUserTie, FaChevronRight,
    FaRupeeSign, FaPaintBrush, FaBolt
} from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import WorkerCard from '../components/WorkerCard';

const StatCard = ({ icon: Icon, label, value, color, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        whileHover={{ y: -5 }}
        className="glass-card p-7 shadow-[0_10px_40px_-15px_rgba(212,175,55,0.08)] hover:shadow-[0_20px_50px_-10px_rgba(212,175,55,0.15)] transition-all group"
    >
        <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform shadow-inner`}>
            <Icon />
        </div>
        <p className="text-[var(--text-muted)] text-[9px] font-black uppercase tracking-[0.2em]">{label}</p>
        <h3 className="text-3xl font-black text-[var(--text-main)] mt-1 leading-none">{value}</h3>
    </motion.div>
);

const UserDashboard = () => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const [workers, setWorkers] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [recentWorkers, setRecentWorkers] = useState([]);
    const [statsData, setStatsData] = useState(null);
    const [userStats, setUserStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [savedIds, setSavedIds] = useState([]);
    const [elitePainters, setElitePainters] = useState([]);
    const [workerProfile, setWorkerProfile] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setLoading(false);
                    return;
                }
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const [workersRes, bookingsRes, workerStatsRes, userStatsRes, savedRes, recentRes, profileRes] = await Promise.all([
                    axios.get(`${import.meta.env.VITE_API_URL}/api/workers`, config).catch(() => ({ data: [] })),
                    axios.get(`${import.meta.env.VITE_API_URL}/api/bookings/my-bookings`, config).catch(() => ({ data: [] })),
                    axios.get(`${import.meta.env.VITE_API_URL}/api/workers/stats`, config).catch(() => ({ data: null })),
                    axios.get(`${import.meta.env.VITE_API_URL}/api/users/stats`, config).catch(() => ({ data: null })),
                    axios.get(`${import.meta.env.VITE_API_URL}/api/users/saved-painters`, config).catch(() => ({ data: [] })),
                    axios.get(`${import.meta.env.VITE_API_URL}/api/users/recently-viewed`, config).catch(() => ({ data: [] })),
                    axios.get(`${import.meta.env.VITE_API_URL}/api/workers/profile`, config).catch(() => ({ data: null })),
                ]);
                setWorkers(workersRes.data);
                setBookings(bookingsRes.data);
                setStatsData(workerStatsRes.data);
                setUserStats(userStatsRes.data);
                setSavedIds((savedRes.data || []).map(w => w._id));
                setRecentWorkers(recentRes.data || []);
                setElitePainters((workersRes.data || []).slice(0, 4));
                setWorkerProfile(profileRes.data);
            } catch (error) {
                console.error('Fetch error', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const stats = [
        { label: 'Total Experts', value: statsData?.totalVerified || 0, icon: FaUserTie, color: 'bg-royal-gold/10 text-royal-gold', delay: 0.1 },
        { label: 'Ready Now', value: statsData?.available || 0, icon: FaCheckCircle, color: 'bg-green-500/10 text-green-500', delay: 0.2 },
        { label: 'My Projects', value: userStats?.totalProjects || bookings.length, icon: FaCalendarCheck, color: 'bg-royal-gold/10 text-royal-gold', delay: 0.3 },
        { label: 'Active Jobs', value: userStats?.activeProjects || bookings.filter(b => ['pending', 'accepted'].includes(b.status)).length, icon: FaClock, color: 'bg-yellow-500/10 text-yellow-600', delay: 0.4 },
    ];

    const totalSpent = userStats?.totalSpent || 0;

    if (loading) return (
        <div className="h-[60vh] flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-royal-gold border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="space-y-10 pb-12">
            {/* Cinematic Welcome Section */}
            <div className="relative overflow-hidden glass-card p-10 shadow-2xl shadow-royal-gold/5">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-royal-gold/5 rounded-full blur-[100px] -z-10 translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-royal-gold/5 rounded-full blur-[80px] -z-10 -translate-x-1/2 translate-y-1/2" />

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-royal-gold font-black uppercase tracking-[0.4em] text-[10px]">
                            <FaCrown className="animate-bounce" /> {t('security_trust')} Portal
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-[var(--text-main)] tracking-tight leading-tight">
                            {user?.role === 'worker' ? t('welcome_back_worker') : t('welcome_back_user')}, <br />
                            <span className="bg-gradient-to-r from-royal-gold-deep via-royal-gold to-royal-gold-light bg-clip-text text-transparent">
                                {user?.name}
                            </span>
                        </h1>
                        <p className="text-[var(--text-muted)] text-sm font-medium max-w-md">Architecture your perfect home with our curated fleet of verified painting specialists.</p>
                    </div>

                    <div className="flex gap-4 items-center">
                        <div className="p-6 bg-[var(--bg-highlight)]/50 rounded-[2rem] border border-royal-gold/5 text-center px-8 shadow-inner">
                            <span className="block text-[8px] font-black uppercase tracking-[0.3em] text-royal-gold mb-1">Total Spent</span>
                            <span className="text-xl font-black text-[var(--text-main)]">₹{totalSpent.toLocaleString('en-IN')}</span>
                        </div>
                        <button onClick={() => navigate('/explore')} className="btn-primary flex items-center gap-4 group">
                            Book a Painter <FaBolt className="group-hover:animate-pulse" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Intelligence Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => <StatCard key={i} {...stat} />)}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                <div className="xl:col-span-2 space-y-10">
                    <div className="space-y-8">
                        {/* Worker Status CTA / Badge */}
                        {user.role === 'user' && (
                            <div className="glass-card p-10 border-royal-gold/10 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-royal-gold/5 rounded-full blur-2xl" />
                                <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                                    <div className="flex items-center gap-6">
                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${workerProfile?.verificationStatus === 'pending' ? 'bg-royal-gold/10 text-royal-gold' :
                                            workerProfile?.verificationStatus === 'rejected' ? 'bg-red-500/10 text-red-500' :
                                                'bg-navy-deep/5 text-navy-deep'
                                            }`}>
                                            {workerProfile?.verificationStatus === 'pending' ? <FaClock className="animate-pulse" /> :
                                                workerProfile?.verificationStatus === 'rejected' ? <FaShieldAlt /> :
                                                    <FaPaintBrush />}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tighter">
                                                {workerProfile?.verificationStatus === 'pending' ? 'Application Under Review' :
                                                    workerProfile?.verificationStatus === 'rejected' ? 'Verification Rejected' :
                                                        'Become a Professional'}
                                            </h3>
                                            <p className="text-[10px] font-black text-royal-gold uppercase tracking-[0.4em] mt-1">
                                                {workerProfile?.verificationStatus === 'pending' ? 'Syncing credentials with HQ' :
                                                    workerProfile?.verificationStatus === 'rejected' ? 'Administrative Directive Required' :
                                                        'Monetize your artistic talent'}
                                            </p>
                                        </div>
                                    </div>

                                    {workerProfile ? (
                                        <button
                                            onClick={() => navigate('/worker-verification')}
                                            className="px-8 py-4 bg-[var(--bg-highlight)] text-[var(--text-main)] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-royal-gold/10 transition-colors border border-royal-gold/5"
                                        >
                                            View Status
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => navigate('/become-painter')}
                                            className="btn-primary group"
                                        >
                                            Apply Now <FaChevronRight className="group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Discovery CTA Section */}
                        <div className="glass-card p-12 shadow-2xl shadow-royal-gold/5 flex flex-col md:flex-row items-center justify-between gap-10">
                            <div className="space-y-4">
                                <h2 className="text-3xl font-black text-[var(--text-main)] uppercase tracking-tighter leading-none">Discover New <br /><span className="text-royal-gold">Artistry</span></h2>
                                <p className="text-[var(--text-muted)] text-sm font-medium max-w-sm">Access our full directory of verified painters, filtered by skill and location to match your vision.</p>
                            </div>
                            <Link to="/explore" className="btn-primary px-12 py-6 rounded-3xl flex items-center gap-4">
                                Explore All Experts <FaChevronRight />
                            </Link>
                        </div>

                        {/* Elite Spotlight */}
                        <section>
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tighter">Elite Spotlight</h2>
                                    <p className="text-[10px] font-black text-royal-gold uppercase tracking-[0.3em]">Handpicked Master Craftsmen</p>
                                </div>
                                <button onClick={() => navigate('/explore')} className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-royal-gold transition-colors">View All Professionals</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {elitePainters.map((worker, i) => (
                                    <motion.div key={worker._id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4 + i * 0.1 }}
                                        onClick={() => navigate(`/painter/${worker._id}`)}
                                        className="group cursor-pointer glass-card p-6 hover:shadow-xl hover:shadow-royal-gold/5 transition-all">
                                        <img src={worker.user?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${worker.user?.name}`} className="w-full h-40 object-cover rounded-2xl mb-4 grayscale group-hover:grayscale-0 transition-all duration-500" alt={worker.user?.name} />
                                        <h3 className="text-sm font-black text-[var(--text-main)]">{worker.user?.name}</h3>
                                        <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase mt-1">{worker.location}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </section>

                        {/* Recently Viewed */}
                        {recentWorkers.length > 0 && (
                            <section>
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h2 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tighter">Recently Viewed</h2>
                                        <p className="text-[10px] font-black text-royal-gold uppercase tracking-[0.3em]">Continue your search</p>
                                    </div>
                                </div>
                                <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
                                    {recentWorkers.map((worker, i) => (
                                        <motion.div key={worker._id}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: i * 0.1 }}
                                            onClick={() => navigate(`/painter/${worker._id}`)}
                                            className="shrink-0 w-48 group cursor-pointer glass-card p-5 hover:shadow-lg transition-all">
                                            <div className="relative">
                                                <img src={worker.user?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${worker.user?.name}`} className="w-full h-32 object-cover rounded-xl mb-3" alt={worker.user?.name} />
                                                <div className="absolute inset-0 bg-black/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <FaBolt className="text-white" />
                                                </div>
                                            </div>
                                            <h3 className="text-xs font-black text-[var(--text-main)] truncate">{worker.user?.name}</h3>
                                            <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase mt-1">{worker.location}</p>
                                        </motion.div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Analytics Section */}
                        {statsData && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-card p-10 shadow-2xl shadow-royal-gold/5"
                            >
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-1.5 h-8 bg-royal-gold rounded-full" />
                                    <div>
                                        <h3 className="text-lg font-black text-[var(--text-main)] uppercase tracking-tighter">Market Intelligence</h3>
                                        <p className="text-[10px] font-black text-royal-gold uppercase tracking-[0.3em]">Expertise Distribution</p>
                                    </div>
                                </div>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={statsData.expertiseData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--glass-border)" opacity={0.1} />
                                            <XAxis
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 900 }}
                                            />
                                            <YAxis hide />
                                            <Tooltip
                                                cursor={{ fill: 'var(--bg-highlight)', opacity: 0.1 }}
                                                contentStyle={{
                                                    backgroundColor: 'var(--glass-bg)',
                                                    borderRadius: '1rem',
                                                    border: '1px solid var(--glass-border)',
                                                    boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                                                    fontFamily: 'inherit',
                                                    fontSize: '10px',
                                                    fontWeight: 900,
                                                    textTransform: 'uppercase',
                                                    color: 'var(--text-main)'
                                                }}
                                            />
                                            <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                                                {statsData.expertiseData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'var(--royal-gold)' : 'var(--text-main)'} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Right Column: Timeline & Premium */}
                <div className="space-y-10">
                    <div className="glass-card p-10 shadow-2xl shadow-royal-gold/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-royal-gold/5 rounded-full blur-2xl" />
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h3 className="text-lg font-black text-[var(--text-main)] tracking-tight uppercase">Activity Stream</h3>
                                <p className="text-[8px] font-black text-royal-gold uppercase tracking-[0.4em] mt-1">Live Deployment</p>
                            </div>
                            <div className="text-[8px] font-black text-royal-gold uppercase tracking-[0.4em] bg-royal-gold/5 px-3 py-1 rounded-full">Automated Stream</div>
                        </div>

                        <div className="space-y-8 relative before:absolute before:left-7 before:top-2 before:bottom-2 before:w-[2px] before:bg-[var(--glass-border)]">
                            {bookings.filter(b => ['pending', 'accepted'].includes(b.status)).slice(0, 4).map((b) => (
                                <div key={b._id} className="relative flex items-start gap-8 group">
                                    <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 z-10 transition-all border-2 ${b.status === 'accepted'
                                        ? 'bg-royal-gold border-royal-gold text-white shadow-lg shadow-royal-gold/20'
                                        : 'bg-[var(--bg-base)] border-[var(--glass-border)] text-[var(--text-muted)] group-hover:border-royal-gold/30'
                                        }`}>
                                        <span className="text-lg font-black leading-none">{new Date(b.date).getDate()}</span>
                                        <span className="text-[8px] font-black uppercase mt-1">{new Date(b.date).toLocaleString('en', { month: 'short' })}</span>
                                    </div>
                                    <div className="min-w-0 pt-2">
                                        <h4 className="font-black text-[var(--text-main)] text-sm truncate group-hover:text-royal-gold transition-colors">{b.worker?.user?.name || 'Assigned Expert'}</h4>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <div className={`w-2 h-2 rounded-full ${b.status === 'accepted' ? 'bg-green-500' : 'bg-royal-gold animate-pulse'}`} />
                                            <p className="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-[0.2em]">{b.status}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {bookings.filter(b => ['pending', 'accepted'].includes(b.status)).length === 0 && (
                                <div className="text-center py-10">
                                    <div className="w-16 h-16 bg-[var(--bg-highlight)]/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-royal-gold/5">
                                        <FaCalendarCheck className="text-royal-gold/20" />
                                    </div>
                                    <p className="text-[var(--text-muted)] font-bold uppercase tracking-[0.2em] text-[10px]">No active deployments</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-[var(--text-main)] rounded-[3rem] p-10 text-[var(--bg-base)] relative shadow-2xl shadow-royal-gold/20">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <FaCrown className="text-6xl" />
                        </div>
                        <h3 className="text-xl font-black tracking-tight mb-4">PainterPro<br /><span className="text-royal-gold">Elite Class</span></h3>
                        <p className="opacity-60 text-xs font-medium leading-relaxed mb-8">Priority scheduling, expert site audits, and premium material discounts.</p>
                        <button className="w-full py-4 bg-royal-gold text-[var(--text-main)] rounded-[1.25rem] font-black uppercase text-[10px] tracking-widest hover:brightness-110 transition-all">
                            Unlock Elite
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;
