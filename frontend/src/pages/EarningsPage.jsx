import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { FaRupeeSign, FaArrowUp, FaCalendarAlt, FaUser, FaMapMarkerAlt, FaUniversity, FaCreditCard, FaSave } from 'react-icons/fa';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';

const EarningsPage = () => {
    const { user } = useAuth();
    const [earnings, setEarnings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('chart');
    const [payDetails, setPayDetails] = useState({ upi: '', bankName: '', accountNo: '', ifscCode: '' });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    useEffect(() => {
        const fetch = async () => {
            try {
                const [earningsRes, profileRes] = await Promise.all([
                    axios.get(`${import.meta.env.VITE_API_URL}/api/workers/earnings`, config),
                    axios.get(`${import.meta.env.VITE_API_URL}/api/workers/profile`, config),
                ]);
                setEarnings(earningsRes.data);
                if (profileRes.data.paymentDetails) {
                    setPayDetails(profileRes.data.paymentDetails);
                }
            } catch (e) { console.error(e); } finally { setLoading(false); }
        };
        fetch();
    }, []);

    const savePayDetails = async () => {
        setSaving(true);
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/api/workers/payment-details`, payDetails, config);
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } catch (e) { console.error(e); } finally { setSaving(false); }
    };

    const StatCard = ({ icon: Icon, label, value, sub, color = 'text-royal-gold' }) => (
        <div className="bg-white rounded-[2rem] border border-royal-gold/10 p-6 shadow-sm hover:shadow-md transition-all">
            <div className={`w-10 h-10 rounded-xl bg-navy-deep/5 flex items-center justify-center mb-4 ${color}`}>
                <Icon size={16} />
            </div>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-navy-deep/40 mb-1">{label}</p>
            <p className="text-2xl font-black text-navy-deep">{value}</p>
            {sub && <p className="text-[10px] font-bold text-slate-400 mt-1">{sub}</p>}
        </div>
    );

    const tabs = ['chart', 'history', 'payment'];

    if (loading) return (
        <div className="space-y-6">
            <div className="h-10 bg-white rounded-2xl animate-pulse w-64" />
            <div className="grid grid-cols-3 gap-5">{[1, 2, 3].map(i => <div key={i} className="h-36 bg-white rounded-[2rem] animate-pulse" />)}</div>
            <div className="h-64 bg-white rounded-[2.5rem] animate-pulse" />
        </div>
    );

    return (
        <div className="space-y-8 pb-12">
            <div>
                <h1 className="text-3xl font-black text-navy-deep tracking-tight">
                    Earnings <span className="text-royal-gold">Centre</span>
                </h1>
                <p className="text-slate-400 text-xs uppercase tracking-widest mt-1 font-bold">Your financial performance & payment details</p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <StatCard icon={FaRupeeSign} label="Total Earned" value={`₹${(earnings?.totalEarned || 0).toLocaleString('en-IN')}`} sub="All completed jobs" />
                <StatCard icon={FaArrowUp} label="This Month" value={`₹${(earnings?.thisMonthEarnings || 0).toLocaleString('en-IN')}`} sub="Current month" color="text-green-500" />
                <StatCard icon={FaCalendarAlt} label="Jobs Completed" value={earnings?.bookings?.length || 0} sub={`at ₹${earnings?.bookings?.[0]?.amount || 0}/job`} color="text-blue-500" />
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-[2.5rem] border border-royal-gold/10 shadow-xl overflow-hidden">
                <div className="flex border-b border-slate-50">
                    {tabs.map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.25em] transition-all ${activeTab === tab ? 'text-royal-gold border-b-2 border-royal-gold bg-royal-gold/3' : 'text-slate-400 hover:text-navy-deep'}`}>
                            {tab === 'chart' ? 'Revenue Chart' : tab === 'history' ? 'Job History' : 'Payment Details'}
                        </button>
                    ))}
                </div>

                <div className="p-8">
                    {activeTab === 'chart' && (
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-navy-deep/30 mb-6">Monthly Earnings (₹)</p>
                            {earnings?.monthlyChart?.length > 0 ? (
                                <ResponsiveContainer width="100%" height={280}>
                                    <AreaChart data={earnings.monthlyChart}>
                                        <defs>
                                            <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="10%" stopColor="#D4AF37" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis dataKey="month" tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} />
                                        <Tooltip contentStyle={{ borderRadius: 16, border: 'none', background: '#0D1B2A', color: '#D4AF37', fontSize: 12, fontWeight: 'bold' }} formatter={v => [`₹${v}`, 'Earned']} />
                                        <Area type="monotone" dataKey="amount" stroke="#D4AF37" strokeWidth={2.5} fill="url(#earningsGrad)" dot={{ fill: '#D4AF37', strokeWidth: 2, r: 4 }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-48 flex items-center justify-center text-slate-300">
                                    <p className="text-xs font-black uppercase tracking-widest">No earnings data yet</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="space-y-3">
                            {(!earnings?.bookings || earnings.bookings.length === 0) ? (
                                <div className="py-16 text-center text-slate-300">
                                    <p className="text-xs font-black uppercase tracking-widest">No completed jobs yet</p>
                                </div>
                            ) : earnings.bookings.map((b, i) => (
                                <motion.div key={b._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                                    className="flex items-center gap-5 p-5 bg-slate-50/60 rounded-2xl border border-slate-100 hover:border-royal-gold/15 transition-all group">
                                    <div className="w-10 h-10 rounded-xl bg-white border border-royal-gold/15 flex items-center justify-center shrink-0">
                                        <img src={b.client?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${b.client?.name}`}
                                            className="w-full h-full rounded-xl object-cover" alt="" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-black text-navy-deep truncate">{b.client?.name}</p>
                                        <div className="flex items-center gap-3 mt-0.5">
                                            <span className="flex items-center gap-1 text-[9px] text-slate-400 font-bold">
                                                <FaCalendarAlt size={8} /> {new Date(b.date).toLocaleDateString('en-IN')}
                                            </span>
                                            <span className="flex items-center gap-1 text-[9px] text-slate-400 font-bold">
                                                <FaMapMarkerAlt size={8} /> {b.location}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-base font-black text-green-600">+₹{b.amount?.toLocaleString('en-IN')}</p>
                                        <p className="text-[9px] font-bold text-slate-300 uppercase">{b.serviceType}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'payment' && (
                        <div className="max-w-lg space-y-6">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-navy-deep/30">Payment Account Details</p>
                            {[
                                { key: 'upi', label: 'UPI ID', placeholder: 'yourname@upi', icon: FaCreditCard },
                                { key: 'bankName', label: 'Bank Name', placeholder: 'e.g. State Bank of India', icon: FaUniversity },
                                { key: 'accountNo', label: 'Account Number', placeholder: 'XXXXXXXXXXXXXX', icon: FaUniversity },
                                { key: 'ifscCode', label: 'IFSC Code', placeholder: 'SBIN0001234', icon: FaUniversity },
                            ].map(({ key, label, placeholder, icon: Icon }) => (
                                <div key={key}>
                                    <label className="block text-[9px] font-black uppercase tracking-widest text-navy-deep/40 mb-2">{label}</label>
                                    <div className="relative">
                                        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-deep/20 text-xs" />
                                        <input
                                            value={payDetails[key] || ''}
                                            onChange={e => setPayDetails(p => ({ ...p, [key]: e.target.value }))}
                                            placeholder={placeholder}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-medium focus:outline-none focus:border-royal-gold/40 focus:bg-white transition-all"
                                        />
                                    </div>
                                </div>
                            ))}
                            <button onClick={savePayDetails} disabled={saving}
                                className={`flex items-center gap-2 px-8 py-3.5 font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all shadow-lg ${saved ? 'bg-green-500 text-white' : 'bg-navy-deep text-royal-gold hover:bg-royal-gold hover:text-navy-deep'}`}>
                                <FaSave size={10} /> {saved ? 'Saved!' : saving ? 'Saving…' : 'Save Payment Details'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EarningsPage;
