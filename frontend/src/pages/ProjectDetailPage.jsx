import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
    FaArrowLeft, FaMapMarkerAlt, FaCalendarAlt, FaClock,
    FaCheckCircle, FaComments, FaInfoCircle, FaPaintRoller,
    FaRegClock, FaHourglassHalf, FaHammer, FaCheckDouble
} from 'react-icons/fa';
import Chat from '../components/Chat';

const ProjectDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showChat, setShowChat] = useState(false);

    useEffect(() => {
        const fetchBooking = async () => {
            try {
                const token = localStorage.getItem('token');
                const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/bookings/my-bookings`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const found = data.find(b => b._id === id);
                setBooking(found);
            } catch (error) {
                console.error("Fetch error", error);
            } finally {
                setLoading(false);
            }
        };
        fetchBooking();
    }, [id]);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="w-12 h-12 border-4 border-royal-gold/20 border-t-royal-gold rounded-full animate-spin" />
        </div>
    );

    if (!booking) return (
        <div className="text-center py-20">
            <h2 className="text-2xl font-black text-navy-deep">Mission Record Not Found</h2>
            <button onClick={() => navigate(-1)} className="mt-4 text-royal-gold font-bold uppercase tracking-widest text-[10px]">Return to Base</button>
        </div>
    );

    const stages = [
        { status: 'pending', sub: null, label: 'Mission Request', icon: FaRegClock, color: 'text-yellow-500' },
        { status: 'accepted', sub: 'not_started', label: 'Fleet Authorized', icon: FaCheckCircle, color: 'text-blue-500' },
        { status: 'accepted', sub: 'started', label: 'On-Site Initialization', icon: FaHourglassHalf, color: 'text-royal-gold' },
        { status: 'accepted', sub: 'in_progress', label: 'Active Deployment', icon: FaHammer, color: 'text-orange-500' },
        { status: 'completed', sub: 'completed', label: 'Mission Archived', icon: FaCheckDouble, color: 'text-green-500' }
    ];

    const currentStageIndex = stages.findIndex(s => s.status === booking.status && (s.sub === null || s.sub === booking.subStatus));

    return (
        <div className="space-y-10 pb-12">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-royal-gold transition-colors"
            >
                <FaArrowLeft /> Back to Operations
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-10">
                    {/* Header Card */}
                    <div className="bg-white rounded-[3rem] p-10 border border-royal-gold/10 shadow-2xl shadow-royal-gold/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-royal-gold/5 rounded-full blur-3xl -mr-32 -mt-32" />

                        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                            <div>
                                <span className="px-4 py-1.5 bg-ivory-subtle text-royal-gold text-[8px] font-black uppercase tracking-widest rounded-full border border-royal-gold/10">
                                    Project ID: {booking._id.slice(-8).toUpperCase()}
                                </span>
                                <h1 className="text-4xl font-black text-navy-deep mt-4 tracking-tight">{booking.serviceType}</h1>
                                <div className="flex flex-wrap gap-6 mt-6">
                                    <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                                        <FaMapMarkerAlt className="text-royal-gold" /> {booking.location}
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                                        <FaCalendarAlt className="text-royal-gold" /> {new Date(booking.date).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowChat(true)}
                                className="flex items-center gap-3 px-8 py-4 bg-navy-deep text-royal-gold rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-navy-deep/30 hover:scale-105 transition-all active:scale-95"
                            >
                                <FaComments size={14} /> Open Secure Channel
                            </button>
                        </div>
                    </div>

                    {/* Mission Timeline */}
                    <div className="bg-white rounded-[3rem] p-10 border border-royal-gold/10 shadow-xl">
                        <h3 className="text-lg font-black text-navy-deep uppercase tracking-widest mb-10 flex items-center gap-3">
                            <FaPaintRoller className="text-royal-gold" /> Deployment Timeline
                        </h3>

                        <div className="relative space-y-12">
                            <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-slate-100" />

                            {stages.map((stage, idx) => {
                                const isCompleted = idx <= currentStageIndex;
                                const isCurrent = idx === currentStageIndex;

                                return (
                                    <div key={idx} className="relative flex items-center gap-8 group">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all z-10 ${isCompleted ? 'bg-white border-royal-gold text-royal-gold shadow-lg shadow-royal-gold/20' : 'bg-white border-slate-100 text-slate-200'
                                            }`}>
                                            <stage.icon size={16} className={isCurrent ? 'animate-pulse' : ''} />
                                        </div>
                                        <div>
                                            <h4 className={`text-xs font-black uppercase tracking-widest ${isCompleted ? 'text-navy-deep' : 'text-slate-300'}`}>
                                                {stage.label}
                                            </h4>
                                            {isCurrent && (
                                                <span className="text-[9px] font-black text-royal-gold uppercase tracking-[0.2em] mt-1 block">Active Phase</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="space-y-10">
                    {/* Specialist Info */}
                    <div className="bg-white rounded-[3rem] border border-royal-gold/10 p-10 shadow-2xl shadow-royal-gold/5 text-center">
                        <div className="flex items-center justify-center gap-3 text-royal-gold font-black uppercase tracking-[0.3em] text-[10px] mb-8">
                            <FaInfoCircle /> Specialist Intel
                        </div>
                        <div className="relative mb-6 inline-block">
                            <div className="absolute -inset-2 bg-royal-gold/10 rounded-[2rem] blur-lg animate-pulse" />
                            <img
                                src={booking.worker?.user?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${booking.worker?.user?.name}`}
                                className="w-24 h-24 rounded-[2rem] border-4 border-white shadow-xl relative object-cover"
                                alt="Specialist"
                            />
                        </div>
                        <h4 className="font-black text-xl text-navy-deep tracking-tight">{booking.worker?.user?.name}</h4>
                        <p className="text-[10px] text-royal-gold font-black uppercase tracking-[0.4em] mt-1">Authorized Craftsman</p>

                        <div className="mt-8 grid grid-cols-2 gap-4">
                            <div className="p-4 bg-ivory-subtle rounded-2xl border border-royal-gold/5">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Response</p>
                                <p className="text-xs font-black text-navy-deep tracking-tight">Rapid</p>
                            </div>
                            <div className="p-4 bg-ivory-subtle rounded-2xl border border-royal-gold/5">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Success</p>
                                <p className="text-xs font-black text-navy-deep tracking-tight">98%</p>
                            </div>
                        </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="bg-navy-deep rounded-[3rem] p-10 text-white shadow-2xl shadow-navy-deep/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-royal-gold/10 rounded-full blur-2xl -mr-12 -mt-12" />
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-royal-gold mb-6">Financial Statement</h4>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-xs opacity-60">
                                <span>Base Deployment</span>
                                <span>₹{booking.amount}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs opacity-60">
                                <span>Escrow Fee</span>
                                <span>₹0</span>
                            </div>
                            <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                                <span className="font-black uppercase tracking-widest text-[10px]">Total Protocol</span>
                                <span className="text-2xl font-black text-royal-gold tracking-tighter">₹{booking.amount}</span>
                            </div>
                        </div>
                        <div className={`mt-8 px-6 py-2.5 rounded-xl text-center text-[9px] font-black uppercase tracking-widest border ${booking.paymentStatus === 'paid' ? 'bg-green-500/10 border-green-500/40 text-green-400' : 'bg-yellow-500/10 border-yellow-500/40 text-yellow-400'
                            }`}>
                            Payment {booking.paymentStatus.toUpperCase()}
                        </div>
                    </div>
                </div>
            </div>

            {showChat && (
                <Chat booking={booking} onClose={() => setShowChat(false)} />
            )}
        </div>
    );
};

export default ProjectDetailPage;
