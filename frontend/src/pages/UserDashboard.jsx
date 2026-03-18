import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import fastApi from '../utils/fastApi';
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
import { toast } from 'react-hot-toast';

const StatCard = ({ icon: Icon, label, value, color, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        whileHover={{ y: -5 }}
        className="glass-card p-5 sm:p-7 shadow-[0_10px_40px_-15px_rgba(212,175,55,0.08)] hover:shadow-[0_20px_50px_-10px_rgba(212,175,55,0.15)] transition-all group"
    >
        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl ${color} flex items-center justify-center text-xl sm:text-2xl mb-4 sm:mb-5 group-hover:scale-110 transition-transform shadow-inner`}>
            <Icon />
        </div>
        <p className="text-[var(--text-muted)] text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em]">{label}</p>
        <h3 className="text-2xl sm:text-3xl font-black text-[var(--text-main)] mt-1 leading-none">{value}</h3>
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
    const [isRefreshing, setIsRefreshing] = useState(false);
    const navigate = useNavigate();

    const handleUnlockElite = () => {
        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 1500)),
            {
                loading: t('initializing_elite_protocol') || 'Initializing Elite Protocol...',
                success: t('elite_access_granted') || 'Elite access request transmitted. Our curators will review your standing.',
                error: t('elite_access_denied') || 'Elite status could not be established.',
            },
            {
                style: {
                    minWidth: '300px',
                    borderRadius: '1rem',
                    background: '#0F172A',
                    color: '#D4AF37',
                    border: '1px solid rgba(212,175,55,0.2)',
                    fontWeight: '900',
                    textTransform: 'uppercase',
                    fontSize: '10px',
                    letterSpacing: '0.1em'
                },
                success: {
                    duration: 5000,
                    icon: '👑',
                },
            }
        );
    };

    const fetchData = async (showLoading = true) => {
        // Only show full-screen loading if we have absolutely no data yet
        if (showLoading && !workers.length) setLoading(true);
        else if (!showLoading) setIsRefreshing(true);

        try {
            await fastApi.getWithCache('/users/dashboard-data', (data, isCached) => {
                setWorkers(data.workers || []);
                setBookings(data.bookings || []);
                setStatsData(data.workerStats);
                setUserStats(data.userStats);
                setSavedIds((data.user?.savedWorkers || []).map(w => w._id));
                setRecentWorkers(data.user?.recentlyViewed || []);
                setElitePainters((data.workers || []).slice(0, 4));
                setWorkerProfile(data.workerProfile);
                
                // If we got cached data, we stop loading immediately
                if (isCached && loading) setLoading(false);
            }, { forceRefresh: !showLoading }); // Use forceRefresh only for interval syncs? 
            // Actually, getWithCache should handle background refresh automatically.
        } catch (error) {
            if (import.meta.env.DEV) console.error('Fetch error', error);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
        
        // Auto-refresh every 60 seconds
        const interval = setInterval(() => {
            fetchData(false);
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    const stats = [
        { label: t('total_experts_stat'), value: statsData?.totalVerified || 0, icon: FaUserTie, color: 'bg-royal-gold/10 text-royal-gold', delay: 0.1 },
        { label: t('ready_now_stat'), value: statsData?.available || 0, icon: FaCheckCircle, color: 'bg-green-500/10 text-green-500', delay: 0.2 },
        { label: t('my_projects_stat'), value: userStats?.totalProjects || bookings.length, icon: FaCalendarCheck, color: 'bg-royal-gold/10 text-royal-gold', delay: 0.3 },
        { label: t('active_jobs_stat'), value: userStats?.activeProjects || bookings.filter(b => ['pending', 'accepted'].includes(b.status)).length, icon: FaClock, color: 'bg-yellow-500/10 text-yellow-600', delay: 0.4 },
    ];

    const totalSpent = userStats?.totalSpent || 0;

    if (loading) return (
        <div className="h-[60vh] flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-royal-gold border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="space-y-10 pb-12">
            {/* Quick Intelligence Grid */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-royal-gold">{t('intel_briefing')}</h2>
                    <AnimatePresence>
                        {isRefreshing && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-royal-gold/60"
                            >
                                <div className="w-1 h-1 rounded-full bg-royal-gold animate-ping" />
                                {t('syncing_data')}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat, i) => <StatCard key={i} {...stat} />)}
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                <div className="xl:col-span-2 space-y-10">
                    <div className="space-y-8">
                        {/* Worker Status CTA / Badge */}
                        {/* Worker Status / Verification Success Notification */}
                        {user.role === 'worker' ? (
                            <motion.div 
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-card p-8 sm:p-12 border-green-500/30 bg-green-500/5 relative overflow-hidden group mb-10"
                            >
                                <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl" />
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-10 relative z-10">
                                    <div className="flex items-center gap-6">
                                        <div className="w-20 h-20 rounded-[2.5rem] bg-green-500/10 flex items-center justify-center text-3xl text-green-500 shadow-lg shadow-green-500/10">
                                            <FaCheckCircle className="animate-bounce" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-[var(--text-main)] uppercase tracking-[0.1em]">
                                                {t('identity_authenticated') || 'Identity Authenticated'}
                                            </h3>
                                            <p className="text-[10px] font-black text-green-500 uppercase tracking-[0.4em] mt-2">
                                                {t('credentials_verified_msg') || 'Your expert credentials have been verified by the Administrative Layer.'}
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => navigate('/worker-dashboard')}
                                        className="w-full sm:w-auto px-10 py-5 bg-navy-deep text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-3"
                                    >
                                        {t('access_worker_hq') || 'Access Expert HQ'} <FaChevronRight />
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="glass-card p-6 sm:p-10 border-royal-gold/10 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-royal-gold/5 rounded-full blur-2xl" />
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-8 relative z-10">
                                    <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto">
                                        <div className={`w-14 h-14 sm:w-16 h-16 rounded-xl sm:rounded-2xl flex items-center justify-center text-xl sm:text-2xl shadow-inner shrink-0 ${workerProfile?.verificationStatus === 'pending' ? 'bg-royal-gold/10 text-royal-gold' :
                                            workerProfile?.verificationStatus === 'rejected' ? 'bg-red-500/10 text-red-500' :
                                                'bg-navy-deep/5 text-navy-deep'
                                            }`}>
                                            {workerProfile?.verificationStatus === 'pending' ? <FaClock className="animate-pulse" /> :
                                                workerProfile?.verificationStatus === 'rejected' ? <FaShieldAlt /> :
                                                    <FaPaintBrush />}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tighter">
                                                {workerProfile?.verificationStatus === 'pending' ? t('app_under_review') :
                                                    workerProfile?.verificationStatus === 'rejected' ? t('verif_rejected_title') :
                                                        t('become_pro_title')}
                                            </h3>
                                            <p className="text-[10px] font-black text-royal-gold uppercase tracking-[0.4em] mt-1">
                                                {workerProfile?.verificationStatus === 'pending' ? t('syncing_hq_desc') :
                                                    workerProfile?.verificationStatus === 'rejected' ? t('admin_directive_desc') :
                                                        t('monetize_talent_desc')}
                                            </p>
                                        </div>
                                    </div>

                                    {workerProfile ? (
                                        <button
                                            onClick={() => navigate('/worker-verification')}
                                            className="w-full sm:w-auto px-8 py-4 bg-[var(--bg-highlight)] text-[var(--text-main)] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-royal-gold/10 transition-colors border border-royal-gold/5"
                                        >
                                            {t('view_status_btn')}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => navigate('/become-painter')}
                                            className="w-full sm:w-auto btn-primary group flex items-center justify-center"
                                        >
                                            {t('apply_now_btn')} <FaChevronRight className="group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Discovery CTA Section */}
                        <div className="glass-card p-8 sm:p-12 shadow-2xl shadow-royal-gold/5 flex flex-col md:flex-row items-center justify-between gap-10">
                            <div className="space-y-4 text-center md:text-left">
                                <h2 className="text-2xl sm:text-3xl font-black text-[var(--text-main)] uppercase tracking-tighter leading-none">{t('discover_artistry_title')}</h2>
                                <p className="text-[var(--text-muted)] text-xs sm:text-sm font-medium max-w-sm">{t('access_directory_desc')}</p>
                            </div>
                            <Link to="/explore" className="w-full md:w-auto btn-primary px-10 py-5 sm:px-12 sm:py-6 rounded-2xl sm:rounded-3xl flex items-center justify-center gap-4 text-sm">
                                {t('explore_experts_btn')} <FaChevronRight />
                            </Link>
                        </div>

                        {/* Elite Spotlight */}
                        <section>
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tighter">{t('elite_spotlight_title')}</h2>
                                    <p className="text-[10px] font-black text-royal-gold uppercase tracking-[0.3em]">{t('handpicked_masters_desc')}</p>
                                </div>
                                <button onClick={() => navigate('/explore')} className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-royal-gold transition-colors">{t('view_all_pros_btn')}</button>
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                                {elitePainters.map((worker, i) => (
                                    <motion.div key={worker._id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4 + i * 0.1 }}
                                        onClick={() => navigate(`/painter/${worker._id}`)}
                                        className="group cursor-pointer glass-card p-4 sm:p-6 hover:shadow-xl hover:shadow-royal-gold/5 transition-all">
                                        <img 
                                            src={worker.user?.profileImage || "/assets/premium-avatar.png"} 
                                            className="w-full h-28 sm:h-40 object-cover rounded-xl sm:rounded-2xl mb-3 sm:mb-4 grayscale group-hover:grayscale-0 transition-all duration-500" 
                                            alt={worker.user?.name} 
                                            loading="lazy"
                                            width="200"
                                            height="160"
                                        />
                                        <h3 className="text-[10px] sm:text-sm font-black text-[var(--text-main)] truncate">{worker.user?.name}</h3>
                                        <p className="text-[7px] sm:text-[9px] font-bold text-[var(--text-muted)] uppercase mt-0.5 sm:mt-1 truncate">{worker.location}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </section>

                        {/* Recently Viewed */}
                        {recentWorkers.length > 0 && (
                            <section>
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h2 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tighter">{t('recently_viewed_title')}</h2>
                                        <p className="text-[10px] font-black text-royal-gold uppercase tracking-[0.3em]">{t('continue_search_desc')}</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 scrollbar-hide">
                                    {recentWorkers.map((worker, i) => (
                                        <motion.div key={worker._id}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: i * 0.1 }}
                                            onClick={() => navigate(`/painter/${worker._id}`)}
                                            className="shrink-0 w-36 sm:w-48 group cursor-pointer glass-card p-4 sm:p-5 hover:shadow-lg transition-all">
                                            <div className="relative">
                                                <img 
                                                    src={worker.user?.profileImage || "/assets/premium-avatar.png"} 
                                                    className="w-full h-24 sm:h-32 object-cover rounded-xl mb-3" 
                                                    alt={worker.user?.name} 
                                                    loading="lazy"
                                                    width="150"
                                                    height="120"
                                                />
                                                <div className="absolute inset-0 bg-black/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <FaBolt className="text-white" />
                                                </div>
                                            </div>
                                            <h3 className="text-[10px] sm:text-xs font-black text-[var(--text-main)] truncate">{worker.user?.name}</h3>
                                            <p className="text-[7px] sm:text-[8px] font-bold text-[var(--text-muted)] uppercase mt-1 truncate">{worker.location}</p>
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
                                className="glass-card p-6 sm:p-10 shadow-2xl shadow-royal-gold/5"
                            >
                                <div className="flex items-center gap-4 mb-6 sm:mb-8">
                                    <div className="w-1.5 h-6 sm:h-8 bg-royal-gold rounded-full" />
                                    <div>
                                        <h3 className="text-base sm:text-lg font-black text-[var(--text-main)] uppercase tracking-tighter">{t('market_intel_title')}</h3>
                                        <p className="text-[8px] sm:text-[10px] font-black text-royal-gold uppercase tracking-[0.3em]">{t('expertise_dist_desc')}</p>
                                    </div>
                                </div>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height={300} minWidth={0}>
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
                    <div className="glass-card p-6 sm:p-10 shadow-2xl shadow-royal-gold/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-royal-gold/5 rounded-full blur-2xl" />
                        <div className="flex items-center justify-between mb-8 sm:mb-10">
                            <div>
                                <h3 className="text-base sm:text-lg font-black text-[var(--text-main)] tracking-tight uppercase">{t('activity_stream_title')}</h3>
                                <p className="text-[7px] sm:text-[8px] font-black text-royal-gold uppercase tracking-[0.4em] mt-1">{t('live_deployment_desc')}</p>
                            </div>
                            <div className="text-[7px] sm:text-[8px] font-black text-royal-gold uppercase tracking-[0.4em] bg-royal-gold/5 px-3 py-1 rounded-full">{t('automated_label') || 'Automated'}</div>
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
                                        <h4 className="font-black text-[var(--text-main)] text-sm truncate group-hover:text-royal-gold transition-colors">{b.worker?.user?.name || t('assigned_expert')}</h4>
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
                                    <p className="text-[var(--text-muted)] font-bold uppercase tracking-[0.2em] text-[10px]">{t('no_active_deployments')}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="bg-navy-deep relative rounded-[2.5rem] sm:rounded-[3.5rem] p-8 sm:p-12 overflow-hidden shadow-2xl shadow-navy-deep/40 group"
                    >
                        {/* Animated Mesh Background */}
                        <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-1000">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,55,0.3)_0%,transparent_70%)]" />
                            <div className="absolute top-0 right-0 w-64 h-64 bg-royal-gold/10 rounded-full blur-[100px] animate-pulse" />
                        </div>

                        <div className="relative z-10">
                            <motion.div 
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="w-16 h-16 sm:w-20 sm:h-20 bg-white/5 border border-white/10 rounded-[2rem] flex items-center justify-center text-royal-gold mb-8 sm:mb-10 backdrop-blur-xl shadow-inner"
                            >
                                <FaCrown className="text-3xl sm:text-4xl filter drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]" />
                            </motion.div>

                            <h3 className="text-3xl sm:text-4xl font-royal italic text-white mb-4 tracking-tight leading-none">
                                {t('elite_class_title')}
                            </h3>
                            <p className="text-slate-400 text-xs sm:text-sm font-medium leading-relaxed mb-10 max-w-xs">
                                {t('elite_benefits_desc')}
                            </p>

                            <motion.button 
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleUnlockElite}
                                className="w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-royal-gold to-yellow-600 text-navy-deep rounded-2xl sm:rounded-[1.5rem] font-black uppercase text-[10px] sm:text-[11px] tracking-[0.25em] shadow-xl shadow-royal-gold/20 hover:shadow-royal-gold/40 transition-all flex items-center justify-center gap-3 overflow-hidden relative group/btn"
                            >
                                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 ease-in-out" />
                                <span className="relative z-10">{t('unlock_elite_btn')}</span>
                                <FaChevronRight className="relative z-10 text-[8px] group-hover:translate-x-1 transition-transform" />
                            </motion.button>
                        </div>

                        {/* Decorative Elements */}
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 border-[20px] border-royal-gold/5 rounded-full" />
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;
