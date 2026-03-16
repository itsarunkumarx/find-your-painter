import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { FaShieldAlt, FaLock, FaCheckCircle, FaRupeeSign, FaCreditCard, FaArrowLeft } from 'react-icons/fa';

const PaymentGateway = () => {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const fetchBooking = async () => {
            try {
                const { data } = await api.get('/bookings/my-bookings');
                const found = data.find(b => b._id === bookingId);
                setBooking(found);
            } catch (e) { 
                console.error(e); 
            } finally { 
                setLoading(false); 
            }
        };
        fetchBooking();
    }, [bookingId]);

    const handlePayment = async () => {
        setProcessing(true);
        // Simulate network delay
        setTimeout(async () => {
            try {
                await api.post('/payments/verify', {
                    bookingId,
                    paymentId: 'PAY-' + Math.random().toString(36).substr(2, 9).toUpperCase()
                });
                setSuccess(true);
                setTimeout(() => navigate('/my-bookings'), 3000);
            } catch (e) {
                console.error(e);
                setProcessing(false);
            }
        }, 2000);
    };

    const handleCashPayment = async () => {
        setProcessing(true);
        try {
            await api.post('/payments/select-post-paid', { bookingId });
            setSuccess(true);
            setTimeout(() => navigate('/my-bookings'), 3000);
        } catch (e) {
            console.error(e);
            setProcessing(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-royal-gold animate-pulse font-black">SECURE CONNECTION...</div>;

    if (success) return (
        <div className="min-h-screen bg-navy-deep flex items-center justify-center p-6 text-center">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-6">
                <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-white text-5xl mx-auto shadow-[0_0_50px_rgba(34,197,94,0.3)]">
                    <FaCheckCircle />
                </div>
                <h1 className="text-3xl font-black text-white">Payment Authorized</h1>
                <p className="text-slate-400 text-sm">Your transaction was successful. Redirecting to your project dashboard...</p>
            </motion.div>
        </div>
    );

    return (
        <div className="min-h-screen bg-ivory-subtle/30 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-royal-gold/10 relative">
                {/* Secure Header */}
                <div className="bg-navy-deep p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <FaShieldAlt size={80} />
                    </div>
                    <button onClick={() => navigate(-1)} className="text-royal-gold/60 hover:text-royal-gold transition-colors flex items-center gap-2 text-[10px] font-black uppercase tracking-widest mb-6">
                        <FaArrowLeft /> Back
                    </button>
                    <h2 className="text-2xl font-black tracking-tight">Checkout <span className="text-royal-gold">Secure</span></h2>
                    <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mt-1 italic">Encrypted Point-to-Point Transaction</p>
                </div>

                <div className="p-8 space-y-8">
                    {/* Booking Summary */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Service</p>
                                <h3 className="text-lg font-black text-navy-deep">{booking?.serviceType} Painting</h3>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Amount Due</p>
                                <h3 className="text-2xl font-black text-navy-deep flex items-center">
                                    <FaRupeeSign className="text-royal-gold text-lg" />
                                    {booking?.worker?.price || '0'}
                                </h3>
                            </div>
                        </div>
                        <div className="h-px bg-slate-100" />
                        <div className="flex items-center gap-3">
                            <img src={booking?.worker?.user?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${booking?.worker?.user?.name}`}
                                className="w-8 h-8 rounded-lg border border-royal-gold/20" alt="" />
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Expert: {booking?.worker?.user?.name}</p>
                        </div>
                    </div>

                    {/* Card Mockup */}
                    <div className="space-y-4">
                        <div className="bg-slate-50 border-2 border-royal-gold/20 rounded-2xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <FaCreditCard className="text-navy-deep text-xl" />
                                <span className="text-sm font-black text-navy-deep">XXXX XXXX XXXX 4242</span>
                            </div>
                            <span className="text-[9px] font-black text-royal-gold bg-royal-gold/10 px-2 py-1 rounded">DEFAULT</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {/* Pay Button */}
                        <button
                            onClick={handlePayment}
                            disabled={processing}
                            className="w-full py-5 bg-navy-deep text-royal-gold rounded-2xl font-black uppercase text-xs tracking-[0.3em] shadow-xl hover:shadow-royal-gold/20 hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-4"
                        >
                            {processing ? (
                                <div className="w-5 h-5 border-2 border-royal-gold border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>Authorize Online <FaLock size={12} /></>
                            )}
                        </button>

                        <button
                            onClick={handleCashPayment}
                            disabled={processing}
                            className="w-full py-5 bg-white border-2 border-navy-deep text-navy-deep rounded-2xl font-black uppercase text-xs tracking-[0.3em] hover:bg-slate-50 transition-all disabled:opacity-50"
                        >
                            Pay After Work (Cash)
                        </button>
                    </div>

                    <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-widest">
                        Your transaction is protected by <span className="text-navy-deep">256-bit SSL encryption</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PaymentGateway;
