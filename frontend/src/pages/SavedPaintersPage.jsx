import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaHeart, FaMapMarkerAlt, FaStar, FaTrash } from 'react-icons/fa';
import BookingModal from '../components/BookingModal';
import api from '../utils/api';

const SavedPaintersPage = () => {
    const navigate = useNavigate();
    const [saved, setSaved] = useState([]);
    const [loading, setLoading] = useState(true);
    const [bookingWorker, setBookingWorker] = useState(null);

    useEffect(() => {
        const fetchSaved = async () => {
            try {
                const { data } = await api.get('/users/saved-painters');
                setSaved(data);
            } catch (e) { 
                console.error(e); 
            } finally { 
                setLoading(false); 
            }
        };
        fetchSaved();
    }, []);

    const unsave = async (workerId) => {
        try {
            await api.put(`/users/save-painter/${workerId}`, {});
            setSaved(prev => prev.filter(w => w._id !== workerId));
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="space-y-8 pb-12">
            <div>
                <h1 className="text-3xl font-black text-navy-deep tracking-tight">
                    Saved <span className="text-royal-gold">Painters</span>
                </h1>
                <p className="text-slate-400 text-xs uppercase tracking-widest mt-1 font-bold">
                    Your handpicked collection — {saved.length} painter{saved.length !== 1 ? 's' : ''}
                </p>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <div key={i} className="h-60 bg-white rounded-[2.5rem] animate-pulse border border-slate-50" />)}
                </div>
            ) : saved.length === 0 ? (
                <div className="py-32 text-center bg-white rounded-[2.5rem] border border-dashed border-royal-gold/20">
                    <div className="w-20 h-20 bg-royal-gold/5 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                        <FaHeart className="text-royal-gold/30 text-3xl" />
                    </div>
                    <h3 className="text-lg font-black text-navy-deep/30 uppercase tracking-widest mb-4">No Saved Painters</h3>
                    <button onClick={() => navigate('/explore')}
                        className="px-8 py-3 bg-navy-deep text-royal-gold font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-royal-gold hover:text-navy-deep transition-all">
                        Explore Painters
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                        {saved.map((worker, i) => (
                            <motion.div
                                key={worker._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: i * 0.05 }}
                                className="bg-white rounded-[2.5rem] border border-royal-gold/10 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden"
                            >
                                <div className="h-2 bg-gradient-to-r from-navy-deep via-royal-gold to-navy-deep" />
                                <div className="p-7">
                                    <div className="flex items-center gap-5 mb-6">
                                        <img
                                            src={worker.user?.profileImage || "/assets/premium-avatar.png"}
                                            className="w-16 h-16 rounded-2xl object-cover border-2 border-royal-gold/20"
                                            alt={worker.user?.name}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-base font-black text-navy-deep truncate">{worker.user?.name}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="flex items-center gap-1 text-royal-gold text-xs font-bold">
                                                    <FaStar size={10} /> {worker.rating?.toFixed(1) || '5.0'}
                                                </div>
                                                <span className="text-slate-300">•</span>
                                                <span className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                                                    <FaMapMarkerAlt size={9} /> {worker.location}
                                                </span>
                                            </div>
                                        </div>
                                        <button onClick={() => unsave(worker._id)}
                                            className="p-2.5 bg-red-50 border border-red-100 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all" title="Remove from saved">
                                            <FaTrash size={12} />
                                        </button>
                                    </div>

                                    <div className="flex flex-wrap gap-1.5 mb-6">
                                        {worker.skills?.slice(0, 3).map(s => (
                                            <span key={s} className="px-3 py-1 bg-royal-gold/5 border border-royal-gold/15 text-[9px] font-black uppercase tracking-widest text-royal-gold rounded-lg">{s}</span>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mb-6">
                                        <div className="bg-slate-50 p-3 rounded-xl text-center">
                                            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Rate</p>
                                            <p className="text-sm font-black text-navy-deep">₹{worker.price}<span className="text-[9px] font-bold text-slate-400">/day</span></p>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-xl text-center">
                                            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Exp</p>
                                            <p className="text-sm font-black text-navy-deep">{worker.experience}<span className="text-[9px] font-bold text-slate-400"> yrs</span></p>
                                        </div>
                                    </div>

                                    <button onClick={() => setBookingWorker(worker)}
                                        className="w-full py-3.5 bg-navy-deep text-royal-gold font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-royal-gold hover:text-navy-deep transition-all shadow-lg shadow-navy-deep/10">
                                        Book Now
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {bookingWorker && (
                <BookingModal isOpen={true} onClose={() => setBookingWorker(null)} worker={bookingWorker} />
            )}
        </div>
    );
};

export default SavedPaintersPage;
