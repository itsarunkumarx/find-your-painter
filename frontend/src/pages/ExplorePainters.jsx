import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import fastApi from '../utils/fastApi';
import { useTranslation } from 'react-i18next';
import { FaSearch, FaFilter, FaStar, FaMapMarkerAlt, FaTools, FaCrown } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import WorkerCard from '../components/WorkerCard';

const ExplorePainters = () => {
    const { t } = useTranslation();
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterSkill, setFilterSkill] = useState('');
    const [priceRange, setPriceRange] = useState(5000);
    const [minRating, setMinRating] = useState(0);
    const [compareList, setCompareList] = useState([]);
    const [isCompareOpen, setIsCompareOpen] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const navigate = useNavigate();

    const fetchWorkers = async (showLoading = true) => {
        // Only show full loading if we have NO workers yet
        if (showLoading && !workers.length) setLoading(true);
        else if (!showLoading) setIsRefreshing(true);
        
        try {
            await fastApi.getWithCache('/workers', (data, isCached) => {
                setWorkers(data || []);
                if (isCached && loading) setLoading(false);
            }, { forceRefresh: !showLoading });
        } catch (error) {
            if (import.meta.env.DEV) console.error("Fetch experts error", error);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchWorkers();
        
        // Auto-refresh every 5 minutes
        const interval = setInterval(() => {
            fetchWorkers(false);
        }, 300000);

        return () => clearInterval(interval);
    }, []);

    const filteredWorkers = (workers || []).filter(w =>
        ((w.user?.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
            (w.location?.toLowerCase() || '').includes(search.toLowerCase())) &&
        (filterSkill === '' || (w.skills || []).includes(filterSkill)) &&
        (w.price <= priceRange) &&
        (w.rating >= minRating)
    );

    const toggleCompare = (worker) => {
        if (compareList.find(c => c._id === worker._id)) {
            setCompareList(prev => prev.filter(c => c._id !== worker._id));
        } else if (compareList.length < 2) {
            setCompareList(prev => [...prev, worker]);
        }
    };

    const skills = [...new Set((workers || []).flatMap(w => w.skills || []))];

    return (
        <div className="space-y-10 pb-12">
            {/* Elegant Header */}
            <div className="relative overflow-hidden bg-[var(--bg-base)] rounded-2xl sm:rounded-[3rem] border border-royal-gold/10 p-8 sm:p-12 shadow-2xl shadow-royal-gold/5 transition-colors duration-500">
                <div className="absolute top-0 right-0 w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] bg-royal-gold/5 rounded-full blur-[80px] sm:blur-[100px] -z-10 translate-x-1/2 -translate-y-1/2" />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-royal-gold font-black uppercase tracking-[0.4em] text-[10px]">
                            <FaCrown /> {t('professional_fleet')}
                        </div>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[var(--text-main)] tracking-tight leading-tight uppercase">
                            {t('nav_explore')} <span className="bg-gradient-to-r from-royal-gold-deep via-royal-gold to-royal-gold-light bg-clip-text text-transparent">{t('explore_experts')}</span>
                        </h1>
                        <p className="text-[var(--text-muted)] text-xs sm:text-sm font-medium max-w-xl">{t('explore_desc')}</p>
                        <AnimatePresence>
                            {isRefreshing && (
                                <motion.div 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-royal-gold/60 mt-2"
                                >
                                    <div className="w-1 h-1 rounded-full bg-royal-gold animate-ping" />
                                    {t('syncing_experts')}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Advanced Search & Shielded Filter */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-6 mt-4 lg:mt-0">
                <div className="flex-1 min-w-[280px] relative group">
                    <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-royal-gold transition-transform group-focus-within:scale-110" />
                    <input
                        type="text"
                        placeholder={t('search_all_placeholder')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-14 pr-8 py-5 bg-[var(--bg-highlight)] border-none rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest text-[var(--text-main)] placeholder:text-[var(--text-muted)] outline-none focus:ring-2 ring-royal-gold/10 transition-all shadow-inner"
                    />
                </div>
                
                <div className="flex flex-wrap items-center gap-6">
                    <div className="flex flex-col gap-2 min-w-[120px]">
                        <label className="text-[8px] font-black uppercase text-[var(--text-muted)]">{t('max_budget')}{priceRange}</label>
                        <input type="range" min="500" max="10000" step="100" value={priceRange} onChange={e => setPriceRange(Number(e.target.value))} className="accent-royal-gold w-full" />
                    </div>
                    
                    <div className="flex-1 min-w-[140px]">
                        <select
                            value={filterSkill}
                            onChange={(e) => setFilterSkill(e.target.value)}
                            disabled={loading}
                            className="w-full px-6 py-5 bg-[var(--bg-highlight)] border-none rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest text-royal-gold outline-none cursor-pointer hover:bg-[var(--bg-highlight)]/80 transition-colors disabled:opacity-50"
                        >
                            <option value="">{t('specific_expertise')}</option>
                            {skills.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Comparison Floating Bar */}
            <AnimatePresence>
                {compareList.length > 0 && (
                    <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-[var(--text-main)] text-[var(--bg-base)] px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-8 border border-royal-gold/20 backdrop-blur-xl">
                        <div className="flex items-center gap-4">
                            {compareList.map(w => (
                                <div key={w._id} className="relative group">
                                    <img src={w.user?.profileImage || "/assets/premium-avatar.png"} className="w-10 h-10 rounded-xl border border-royal-gold/30" loading="lazy" />
                                    <button onClick={() => toggleCompare(w)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 text-[8px] opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                                </div>
                            ))}
                            {compareList.length < 2 && <div className="w-10 h-10 rounded-xl border-2 border-dashed border-[var(--bg-base)]/20 flex items-center justify-center text-[8px] text-[var(--bg-base)]/20">{t('add_one')}</div>}
                        </div>
                        <div className="w-px h-8 bg-[var(--bg-base)]/10" />
                        <button disabled={compareList.length < 2} onClick={() => setIsCompareOpen(true)}
                            className="bg-royal-gold text-[var(--text-main)] px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30 transition-all">
                            {t('compare_pros')}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Comparison Modal */}
            <AnimatePresence>
                {isCompareOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCompareOpen(false)}
                        className="fixed inset-0 z-[60] bg-[var(--bg-base)]/90 backdrop-blur-md flex items-center justify-center p-6">
                        <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }} onClick={e => e.stopPropagation()}
                            className="bg-[var(--bg-base)] border border-[var(--glass-border)] rounded-[3rem] w-full max-w-4xl max-h-[90vh] overflow-y-auto p-12 shadow-2xl">
                            <div className="flex justify-between items-center mb-12">
                                <h3 className="text-2xl font-black text-[var(--text-main)] uppercase tracking-tighter">{t('painter_head_to_head')}</h3>
                                <button onClick={() => setIsCompareOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">{t('close_btn')}</button>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-8">
                                <div className="hidden sm:block space-y-8 pt-24 font-black text-[10px] uppercase text-[var(--text-muted)] tracking-widest">
                                    <div className="h-10">{t('professional')}</div>
                                    <div className="h-px bg-[var(--glass-border)]" />
                                    <div className="h-10">{t('skill_rating')}</div>
                                    <div className="h-px bg-[var(--glass-border)]" />
                                    <div className="h-10">{t('daily_rate')}</div>
                                    <div className="h-px bg-[var(--glass-border)]" />
                                    <div className="h-10">{t('experience')}</div>
                                    <div className="h-px bg-[var(--glass-border)]" />
                                    <div className="h-10">{t('top_expertise')}</div>
                                </div>
                                {compareList.map(w => (
                                    <div key={w._id} className="text-center space-y-6 sm:space-y-8 bg-[var(--bg-highlight)]/30 p-4 sm:p-0 rounded-2xl sm:rounded-none">
                                        <div className="h-20 sm:h-24 flex flex-col items-center">
                                            <img 
                                                src={w.user?.profileImage || "/assets/premium-avatar.png"} 
                                                className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl border-2 sm:border-4 border-[var(--bg-highlight)] mb-2 sm:mb-3 shadow-lg" 
                                                loading="lazy" 
                                                width="64"
                                                height="64"
                                            />
                                            <p className="font-black text-[var(--text-main)] text-[10px] sm:text-sm truncate w-full">{w.user?.name}</p>
                                        </div>
                                        <div className="sm:h-px bg-[var(--glass-border)] sm:visible invisible" />
                                        <div className="h-8 sm:h-10 flex flex-col sm:flex-row items-center justify-center font-black text-royal-gold text-sm sm:text-lg">
                                            <span className="sm:hidden text-[7px] text-[var(--text-muted)] uppercase mb-1">{t('rating_label')}</span>
                                            ★ {w.rating}
                                        </div>
                                        <div className="sm:h-px bg-[var(--glass-border)]" />
                                        <div className="h-8 sm:h-10 flex flex-col sm:flex-row items-center justify-center font-black text-[var(--text-main)] text-sm sm:text-lg">
                                            <span className="sm:hidden text-[7px] text-[var(--text-muted)] uppercase mb-1">{t('rate_short')}</span>
                                            ₹{w.price}
                                        </div>
                                        <div className="sm:h-px bg-[var(--glass-border)]" />
                                        <div className="h-8 sm:h-10 flex flex-col sm:flex-row items-center justify-center font-black text-[var(--text-main)] text-[10px] sm:text-lg">
                                            <span className="sm:hidden text-[7px] text-[var(--text-muted)] uppercase mb-1">{t('exp_short')}</span>
                                            {w.experience} {t('yrs_unit_long')}
                                        </div>
                                        <div className="sm:h-px bg-[var(--glass-border)]" />
                                        <div className="h-12 sm:h-10 flex items-center justify-center gap-1 sm:gap-1.5 flex-wrap">
                                            {w.skills.slice(0, 2).map(s => <span key={s} className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-[var(--bg-highlight)] text-[var(--text-main)] rounded-lg text-[7px] sm:text-[9px] font-bold">{s}</span>)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-12 flex gap-4">
                                {compareList.map(w => (
                                    <button key={w._id} onClick={() => navigate(`/painter/${w._id}`)}
                                        className="flex-1 py-4 border-2 border-royal-gold/20 rounded-2xl text-[10px] font-black uppercase text-royal-gold hover:bg-royal-gold hover:text-[var(--bg-base)] transition-all">
                                        {t('view_agent_btn')} {w.user?.name?.split(' ')[0]}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Professional Grid */}
            <div className="space-y-8">
                <div className="flex items-center gap-4 px-4">
                    <div className="w-1.5 h-8 bg-royal-gold rounded-full" />
                    <div>
                        <h2 className="text-lg font-black text-[var(--text-main)] uppercase tracking-tighter">{t('verified_specialists')}</h2>
                        <p className="text-[10px] font-black text-royal-gold uppercase tracking-[0.3em]">{filteredWorkers.length} {t('pros_found')}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {loading ? (
                        [1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="bg-[var(--bg-highlight)] h-[450px] rounded-[3rem] animate-pulse border border-royal-gold/5 shadow-lg" />
                        ))
                    ) : (
                        <AnimatePresence>
                            {filteredWorkers.map((worker, i) => (
                                <motion.div
                                    key={worker._id}
                                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="relative"
                                >
                                    <div className="absolute top-6 right-6 z-20">
                                        <input type="checkbox" checked={compareList.some(c => c._id === worker._id)} onChange={() => toggleCompare(worker)} className="w-5 h-5 accent-royal-gold rounded-lg cursor-pointer" />
                                    </div>
                                    <WorkerCard worker={worker} />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>

                {!loading && filteredWorkers.length === 0 && (
                    <div className="text-center py-24 bg-[var(--bg-base)] rounded-[3rem] border border-dashed border-royal-gold/20">
                        <div className="w-20 h-20 bg-[var(--bg-highlight)] rounded-3xl flex items-center justify-center mx-auto mb-6 text-royal-gold/20">
                            <FaFilter size={32} />
                        </div>
                        <h3 className="text-xl font-black text-[var(--text-main)] uppercase">{t('no_match_found')}</h3>
                        <p className="text-[var(--text-muted)] text-xs mt-2 font-medium tracking-wide">{t('adjust_filters_desc')}</p>
                    </div>
                )}
            </div>
        </div >
    );
};

export default ExplorePainters;
