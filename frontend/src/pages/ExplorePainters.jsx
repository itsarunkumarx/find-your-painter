import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
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
    const navigate = useNavigate();

    useEffect(() => {
        const fetchWorkers = async () => {
            try {
                const token = localStorage.getItem('token');
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/workers`, config);
                setWorkers(res.data);
            } catch (error) {
                console.error("Fetch experts error", error);
            } finally {
                setLoading(false);
            }
        };
        fetchWorkers();
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
            <div className="relative overflow-hidden bg-[var(--bg-base)] rounded-[3rem] border border-royal-gold/10 p-12 shadow-2xl shadow-royal-gold/5 transition-colors duration-500">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-royal-gold/5 rounded-full blur-[100px] -z-10 translate-x-1/2 -translate-y-1/2" />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-royal-gold font-black uppercase tracking-[0.4em] text-[10px]">
                            <FaCrown /> Professional Fleet
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-[var(--text-main)] tracking-tight leading-tight uppercase">
                            Explore <span className="bg-gradient-to-r from-royal-gold-deep via-royal-gold to-royal-gold-light bg-clip-text text-transparent">Expert Painters</span>
                        </h1>
                        <p className="text-[var(--text-muted)] text-sm font-medium max-w-xl">Browse our curated selection of verified painting professionals. Every specialist is vetted for quality, trust, and exceptional craftsmanship.</p>
                    </div>
                </div>
            </div>

            {/* Advanced Search & Shielded Filter */}
            <div className="flex flex-wrap gap-6 mt-4 lg:mt-0">
                <div className="flex flex-col gap-2">
                    <label className="text-[8px] font-black uppercase text-[var(--text-muted)]">Max Budget: ₹{priceRange}</label>
                    <input type="range" min="500" max="10000" step="100" value={priceRange} onChange={e => setPriceRange(Number(e.target.value))} className="accent-royal-gold" />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-[8px] font-black uppercase text-[var(--text-muted)]">Min Rating: {minRating}★</label>
                    <select value={minRating} onChange={e => setMinRating(Number(e.target.value))} className="text-[10px] font-bold bg-[var(--bg-highlight)] text-[var(--text-main)] border-none rounded-xl">
                        <option value="0">Any Rating</option>
                        <option value="3">3+ Stars</option>
                        <option value="4">4+ Stars</option>
                        <option value="4.5">4.5+ Stars</option>
                    </select>
                </div>
                <div className="flex gap-4 items-center">
                    <select
                        value={filterSkill}
                        onChange={(e) => setFilterSkill(e.target.value)}
                        disabled={loading}
                        className="px-8 py-5 bg-[var(--bg-highlight)] border-none rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest text-royal-gold outline-none cursor-pointer hover:bg-[var(--bg-highlight)]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <option value="">{loading ? 'Retrieving Experts...' : 'Specific Expertise'}</option>
                        {skills.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
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
                                    <img src={w.user?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${w.user?.name}`} className="w-10 h-10 rounded-xl border border-royal-gold/30" loading="lazy" />
                                    <button onClick={() => toggleCompare(w)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 text-[8px] opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                                </div>
                            ))}
                            {compareList.length < 2 && <div className="w-10 h-10 rounded-xl border-2 border-dashed border-[var(--bg-base)]/20 flex items-center justify-center text-[8px] text-[var(--bg-base)]/20">Add One</div>}
                        </div>
                        <div className="w-px h-8 bg-[var(--bg-base)]/10" />
                        <button disabled={compareList.length < 2} onClick={() => setIsCompareOpen(true)}
                            className="bg-royal-gold text-[var(--text-main)] px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30 transition-all">
                            Compare Pros
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
                                <h3 className="text-2xl font-black text-[var(--text-main)] uppercase tracking-tighter">Painter <span className="text-royal-gold">Head-to-Head</span></h3>
                                <button onClick={() => setIsCompareOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">✕ Close</button>
                            </div>
                            <div className="grid grid-cols-3 gap-8">
                                <div className="space-y-8 pt-24 font-black text-[10px] uppercase text-[var(--text-muted)] tracking-widest">
                                    <div className="h-10">Professional</div>
                                    <div className="h-px bg-[var(--glass-border)]" />
                                    <div className="h-10">Skill Rating</div>
                                    <div className="h-px bg-[var(--glass-border)]" />
                                    <div className="h-10">Daily Rate</div>
                                    <div className="h-px bg-[var(--glass-border)]" />
                                    <div className="h-10">Experience</div>
                                    <div className="h-px bg-[var(--glass-border)]" />
                                    <div className="h-10">Top Expertise</div>
                                </div>
                                {compareList.map(w => (
                                    <div key={w._id} className="text-center space-y-8">
                                        <div className="h-24 flex flex-col items-center">
                                            <img src={w.user?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${w.user?.name}`} className="w-16 h-16 rounded-2xl border-4 border-[var(--bg-highlight)] mb-3 shadow-lg" loading="lazy" />
                                            <p className="font-black text-[var(--text-main)] text-sm truncate w-full">{w.user?.name}</p>
                                        </div>
                                        <div className="h-px bg-[var(--glass-border)] invisible" />
                                        <div className="h-10 flex items-center justify-center font-black text-royal-gold text-lg">★ {w.rating}</div>
                                        <div className="h-px bg-[var(--glass-border)]" />
                                        <div className="h-10 flex items-center justify-center font-black text-[var(--text-main)] text-lg">₹{w.price}</div>
                                        <div className="h-px bg-[var(--glass-border)]" />
                                        <div className="h-10 flex items-center justify-center font-black text-[var(--text-main)] text-lg">{w.experience} Years</div>
                                        <div className="h-px bg-[var(--glass-border)]" />
                                        <div className="h-10 flex items-center justify-center gap-1.5 flex-wrap">
                                            {w.skills.slice(0, 2).map(s => <span key={s} className="px-2 py-1 bg-[var(--bg-highlight)] text-[var(--text-main)] rounded-lg text-[9px] font-bold">{s}</span>)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-12 flex gap-4">
                                {compareList.map(w => (
                                    <button key={w._id} onClick={() => navigate(`/painter/${w._id}`)}
                                        className="flex-1 py-4 border-2 border-royal-gold/20 rounded-2xl text-[10px] font-black uppercase text-royal-gold hover:bg-royal-gold hover:text-[var(--bg-base)] transition-all">
                                        View {w.user?.name?.split(' ')[0]}
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
                        <h2 className="text-lg font-black text-[var(--text-main)] uppercase tracking-tighter">Verified Specialists</h2>
                        <p className="text-[10px] font-black text-royal-gold uppercase tracking-[0.3em]">{filteredWorkers.length} Professionals Matching Criteria</p>
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
                        <h3 className="text-xl font-black text-[var(--text-main)] uppercase">No Match Found</h3>
                        <p className="text-[var(--text-muted)] text-xs mt-2 font-medium tracking-wide">Adjust your filters or search terms to discover more experts.</p>
                    </div>
                )}
            </div>
        </div >
    );
};

export default ExplorePainters;
