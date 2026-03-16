import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import { FaCheckCircle, FaComments, FaPhone, FaVideo, FaTimes, FaUserAlt, FaMapMarkerAlt, FaPaintRoller, FaCalendarAlt } from 'react-icons/fa';
import Chat from './Chat';
import { useSocket } from '../context/SocketContext';

const BookingModal = ({ isOpen, onClose, worker }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        date: '',
        message: '',
        serviceType: 'Interior',
        location: ''
    });
    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [createdBooking, setCreatedBooking] = useState(null);
    const [showChat, setShowChat] = useState(false);
    const { startCall } = useSocket();

    const handleBook = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await api.post('/bookings', {
                workerId: worker._id,
                date: formData.date,
                message: formData.message,
                serviceType: formData.serviceType,
                location: formData.location
            });

            setCreatedBooking(data);
            setIsSuccess(true);
        } catch (error) {
            console.error("Booking error:", error.response?.data || error.message);
            alert(t('booking_failed'));
        } finally {
            setLoading(false);
        }
    };

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            alert(t('geolocation_unsupported'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    // Using reverse geocoding to get a readable address (simplified here)
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await res.json();
                    const address = data.display_name.split(',').slice(0, 3).join(',');
                    setFormData(prev => ({ ...prev, location: address }));
                } catch (error) {
                    setFormData(prev => ({ ...prev, location: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}` }));
                }
            },
            (error) => {
                alert(t('location_error'));
            }
        );
    };

    const handleClose = () => {
        setIsSuccess(false);
        setCreatedBooking(null);
        setFormData({ date: '', message: '', serviceType: 'Interior', location: '' });
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-md p-4"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 10 }}
                        className="glass-card p-1 shadow-2xl w-full max-w-xl relative border-white/50 overflow-hidden"
                    >
                        {!isSuccess ? (
                            <div className="p-10 max-h-[90vh] overflow-y-auto custom-scrollbar">
                                {/* Interactive Accents */}
                                <div className="absolute top-0 left-0 w-24 h-24 bg-royal-gold/5 rounded-full blur-3xl -z-10 animate-pulse"></div>
                                <div className="absolute top-0 right-0 p-8 opacity-20 text-[10px] font-black tracking-[0.4em] uppercase text-royal-gold">
                                    {t('strategic_deployment')}
                                </div>

                                <button onClick={handleClose} className="absolute top-6 right-6 text-slate-300 hover:text-navy-deep transition-colors">
                                    <FaTimes size={20} />
                                </button>

                                <div className="mb-10">
                                    <div className="flex items-center gap-3 text-royal-gold font-black uppercase tracking-[0.3em] text-[10px] mb-2">
                                        <span className="w-8 h-[1px] bg-royal-gold/50"></span>
                                        {t('strategic_deployment_subtitle')}
                                    </div>
                                    <h2 className="text-3xl font-black text-navy-deep tracking-tighter uppercase italic">
                                        {t('initiate_contract_prefix')} <span className="text-royal-gold drop-shadow-[0_0_10px_rgba(197,160,89,0.2)]">{t('contract_word')}</span>
                                    </h2>
                                    <div className="flex items-center gap-3 mt-4 p-3 bg-ivory-subtle rounded-2xl border border-royal-gold/10">
                                        <div className="w-10 h-10 rounded-xl overflow-hidden border border-royal-gold/20">
                                            <img src={worker?.user?.profileImage || "/assets/premium-avatar.png"} alt="Pro" className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-0.5">{t('target_agent')}</p>
                                            <p className="text-sm font-black text-navy-deep leading-tight">{worker?.user?.name}</p>
                                        </div>
                                    </div>
                                </div>

                                <form onSubmit={handleBook} className="space-y-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 flex items-center gap-2">
                                                <FaCalendarAlt className="text-royal-gold" /> {t('engagement_date')}
                                            </label>
                                            <input
                                                type="date"
                                                value={formData.date}
                                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                                className="w-full bg-ivory-subtle border border-royal-gold/10 rounded-2xl py-4 px-6 text-xs font-bold text-navy-deep tracking-wider focus:outline-none focus:border-royal-gold transition-all"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 flex items-center gap-2">
                                                <FaPaintRoller className="text-royal-gold" /> {t('service_type')}
                                            </label>
                                            <select
                                                value={formData.serviceType}
                                                onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                                                className="w-full bg-ivory-subtle border border-royal-gold/10 rounded-2xl py-4 px-6 text-xs font-bold text-navy-deep tracking-wider focus:outline-none focus:border-royal-gold transition-all appearance-none cursor-pointer"
                                                required
                                            >
                                                <option value="Interior">{t('Interior Painting')}</option>
                                                <option value="Exterior">{t('Exterior Painting')}</option>
                                                <option value="Commercial">{t('Commercial Project')}</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 flex items-center gap-2">
                                            <FaMapMarkerAlt className="text-royal-gold" /> {t('location_label')}
                                        </label>
                                        <div className="relative group/loc">
                                            <input
                                                type="text"
                                                placeholder={t('location_placeholder_example')}
                                                value={formData.location}
                                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                                className="w-full bg-ivory-subtle border border-royal-gold/10 rounded-2xl py-4 px-6 pr-14 text-xs font-bold text-navy-deep tracking-wider focus:outline-none focus:border-royal-gold transition-all placeholder-navy-deep/20"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={handleGetLocation}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-royal-gold hover:text-navy-deep transition-colors p-2"
                                                title={t('use_current_location')}
                                            >
                                                <FaMapMarkerAlt />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">{t('mission_details')}</label>
                                        <textarea
                                            value={formData.message}
                                            placeholder={t('mission_placeholder')}
                                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                            className="w-full bg-ivory-subtle border border-royal-gold/10 rounded-2xl py-4 px-6 text-xs font-bold text-navy-deep tracking-wider focus:outline-none focus:border-royal-gold h-28 resize-none transition-all placeholder-navy-deep/20"
                                        />
                                    </div>

                                    <button disabled={loading} type="submit" className="w-full py-5 bg-navy-deep text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl shadow-xl shadow-navy-deep/20 hover:bg-royal-gold hover:text-navy-deep transition-all duration-300 disabled:opacity-50">
                                        {loading ? t('transmitting') : t('finalize_engagement')}
                                    </button>
                                </form>
                            </div>
                        ) : (
                            <div className="p-10 flex flex-col items-center text-center">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-24 h-24 bg-green-500 rounded-3xl flex items-center justify-center text-white shadow-2xl mb-8 relative"
                                >
                                    <FaCheckCircle size={48} />
                                    <motion.div
                                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="absolute inset-0 bg-green-500 rounded-3xl -z-10"
                                    />
                                </motion.div>

                                <div className="mb-8">
                                    <div className="text-[10px] font-black text-green-600 uppercase tracking-[0.4em] mb-2">{t('booking_sucess')}</div>
                                    <h2 className="text-4xl font-black text-navy-deep tracking-tighter leading-none mb-4 italic uppercase">
                                        {t('link_established_prefix')} <span className="text-royal-gold">{t('link_established_suffix')}</span>
                                    </h2>
                                    <p className="text-xs font-bold text-slate-400 tracking-widest uppercase max-w-xs mx-auto leading-relaxed">
                                        {t('expert_notified_desc', { name: worker?.user?.name })}
                                    </p>
                                </div>

                                {/* Instant Connect Cluster */}
                                <div className="w-full bg-ivory-subtle border border-royal-gold/10 rounded-[2.5rem] p-8 space-y-6 mb-10">
                                    <div className="text-[10px] font-black text-navy-deep/40 uppercase tracking-[0.3em]">{t('direct_comm_portal')}</div>

                                    <div className="flex items-center justify-center gap-4">
                                        <button
                                            onClick={() => setShowChat(true)}
                                            className="group flex flex-col items-center gap-3 p-6 bg-white rounded-3xl border border-royal-gold/10 hover:border-royal-gold transition-all shadow-sm hover:shadow-xl hover:-translate-y-1"
                                        >
                                            <div className="w-14 h-14 bg-navy-deep text-royal-gold rounded-2xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                                                <FaComments />
                                            </div>
                                            <span className="text-[8px] font-black uppercase tracking-widest text-navy-deep">{t('nav_messages')}</span>
                                        </button>

                                        <button
                                            onClick={() => startCall(worker.user, 'voice')}
                                            className="group flex flex-col items-center gap-3 p-6 bg-white rounded-3xl border border-royal-gold/10 hover:border-royal-gold transition-all shadow-sm hover:shadow-xl hover:-translate-y-1"
                                        >
                                            <div className="w-14 h-14 bg-navy-deep text-royal-gold rounded-2xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                                                <FaPhone />
                                            </div>
                                            <span className="text-[8px] font-black uppercase tracking-widest text-navy-deep">{t('voice_call')}</span>
                                        </button>

                                        <button
                                            onClick={() => startCall(worker.user, 'video')}
                                            className="group flex flex-col items-center gap-3 p-6 bg-white rounded-3xl border border-royal-gold/10 hover:border-royal-gold transition-all shadow-sm hover:shadow-xl hover:-translate-y-1"
                                        >
                                            <div className="w-14 h-14 bg-navy-deep text-royal-gold rounded-2xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                                                <FaVideo />
                                            </div>
                                            <span className="text-[8px] font-black uppercase tracking-widest text-navy-deep">{t('video_link')}</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4 w-full">
                                    <button
                                        onClick={() => navigate(`/payment/${createdBooking._id}`)}
                                        className="w-full py-5 bg-royal-gold text-navy-deep text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl shadow-xl shadow-royal-gold/20 hover:scale-[1.02] transition-all"
                                    >
                                        {t('proceed_to_payment')}
                                    </button>
                                    <button
                                        onClick={handleClose}
                                        className="w-full text-[10px] font-black text-navy-deep/40 hover:text-navy-deep uppercase tracking-[0.4em] transition-colors"
                                    >
                                        {t('return_to_overview')}
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>

                    {/* Chat and Call Interface overlays for success view */}
                    {isSuccess && createdBooking && (
                        <>
                            <AnimatePresence>
                                {showChat && (
                                    <Chat
                                        booking={createdBooking}
                                        onClose={() => setShowChat(false)}
                                    />
                                )}
                            </AnimatePresence>
                        </>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default BookingModal;
